from flask import Blueprint, jsonify, request, session, redirect, url_for, Response
from extensions import mongo, bcrypt  # Import from extensions
from flask_pymongo import ObjectId
from datetime import datetime
import re
import sys
import os
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from authlib.integrations.flask_client import OAuth
from authlib.integrations.base_client.errors import OAuthError
import requests
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils import (
    validate_email, validate_password, validate_name, validate_required_fields,
    validate_json_request, standardize_error_response, standardize_success_response
)
from email_service import (
    create_password_reset_token, verify_password_reset_token, mark_token_as_used,
    send_password_reset_email, send_welcome_email, create_email_verification_token,
    verify_email_verification_token, send_email_verification
)
from models import User, UserProfile, OAuthProvider, OAuthAccount
from jwt_utils import create_token_pair, refresh_access_token, revoke_refresh_token, revoke_all_user_tokens, JWTError
from auth_decorators import jwt_required
from oauth_utils import (
    log_oauth_error, handle_oauth_token_revocation, check_oauth_rate_limit,
    handle_google_oauth_error, handle_linkedin_oauth_error, validate_oauth_state,
    retry_oauth_request, OAuthError, OAuthRateLimitError
)
from two_factor_auth import (
    enable_two_factor, verify_and_activate_two_factor, verify_two_factor_code,
    disable_two_factor, get_two_factor_status, regenerate_backup_codes,
    TwoFactorError
)
from account_lockout import (
    check_and_handle_failed_login, handle_successful_login, is_account_locked,
    unlock_account, get_lockout_info, AccountLockoutError
)

auth_bp = Blueprint("auth_bp", __name__)
users_db = mongo.db.users

# OAuth configuration
oauth = OAuth()

def init_oauth(app):
    """Initialize OAuth configuration"""
    print("\n=== OAuth Initialization ===")
    print(f"GOOGLE_CLIENT_ID present: {bool(os.getenv('GOOGLE_OAUTH_CLIENT_ID'))}")
    print(f"GOOGLE_CLIENT_SECRET present: {bool(os.getenv('GOOGLE_OAUTH_CLIENT_SECRET'))}")
    print(f"LINKEDIN_CLIENT_ID present: {bool(os.getenv('LINKEDIN_OAUTH_CLIENT_ID'))}")
    print(f"LINKEDIN_CLIENT_SECRET present: {bool(os.getenv('LINKEDIN_OAUTH_CLIENT_SECRET'))}")
    
    oauth.init_app(app)
    print("OAuth initialized with app")
    
    # Google OAuth configuration
    try:
        print("\nAttempting to register Google OAuth...")
        google = oauth.register(
            name='google',
            client_id=os.getenv('GOOGLE_OAUTH_CLIENT_ID'),
            client_secret=os.getenv('GOOGLE_OAUTH_CLIENT_SECRET'),
            server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
            client_kwargs={
                'scope': 'openid email profile'
            }
        )
        print("Google OAuth registration successful")
        print(f"Registered client_id: {google.client_id[:10]}..." if google.client_id else "No client_id!")
    except Exception as e:
        print(f"Error during Google OAuth registration: {str(e)}")
        print(f"Full error details: {repr(e)}")
    
    # LinkedIn OAuth configuration with OpenID Connect
    try:
        print("\nAttempting to register LinkedIn OAuth...")
        linkedin = oauth.register(
            name='linkedin',
            client_id=os.getenv('LINKEDIN_OAUTH_CLIENT_ID'),
            client_secret=os.getenv('LINKEDIN_OAUTH_CLIENT_SECRET'),
            access_token_url='https://www.linkedin.com/oauth/v2/accessToken',
            authorize_url='https://www.linkedin.com/oauth/v2/authorization',
            api_base_url='https://api.linkedin.com/v2/',
            client_kwargs={
                'scope': 'openid profile email',  # OpenID Connect scopes for user data
                'token_endpoint_auth_method': 'client_secret_post'
            },
            # Disable automatic ID token parsing to avoid LinkedIn's JWT validation issues
            id_token_signed_response_alg=None,
            userinfo_endpoint='https://api.linkedin.com/v2/userinfo'
        )
        print("LinkedIn OAuth registration successful")
        print(f"Registered client_id: {linkedin.client_id[:10]}..." if linkedin.client_id else "No client_id!")
        return google, linkedin
    except Exception as e:
        print(f"Error during LinkedIn OAuth registration: {str(e)}")
        print(f"Full error details: {repr(e)}")
        return google, None


@auth_bp.route("/login", methods=["POST"])
@validate_json_request
def login_user():
    """Authenticate user login"""
    try:
        data = request.get_json()
        
        if not data:
            return standardize_error_response("No data provided", 400)
        
        email = data.get("email", "").strip().lower()
        password = data.get("password", "")
        
        if not email or not password:
            return standardize_error_response("Email and password are required", 400)
        
        # Check if account is locked
        is_locked, locked_until = is_account_locked(email, 'email')
        if is_locked:
            minutes_remaining = int((locked_until - datetime.utcnow()).total_seconds() / 60)
            return standardize_error_response(
                f"Account is temporarily locked due to too many failed login attempts. "
                f"Please try again in {minutes_remaining} minutes.", 
                423  # HTTP 423 Locked
            )
        
        user = users_db.find_one({"email": email})
        
        if not user:
            # Record failed attempt for non-existent user
            check_and_handle_failed_login(email, 'email', 
                                        request.environ.get('REMOTE_ADDR'),
                                        request.headers.get('User-Agent'))
            return standardize_error_response("Invalid email or password", 401)
        
        if not bcrypt.check_password_hash(user["password"], password):
            # Record failed attempt and check for lockout
            is_now_locked, locked_until = check_and_handle_failed_login(
                email, 'email',
                request.environ.get('REMOTE_ADDR'),
                request.headers.get('User-Agent')
            )
            
            if is_now_locked:
                minutes_remaining = int((locked_until - datetime.utcnow()).total_seconds() / 60)
                return standardize_error_response(
                    f"Too many failed login attempts. Account locked for {minutes_remaining} minutes.",
                    423  # HTTP 423 Locked
                )
            
            return standardize_error_response("Invalid email or password", 401)
        
        # Password is correct, clear any failed attempts
        handle_successful_login(email, 'email')
        
        # Check if user has 2FA enabled
        if user.get('two_factor_enabled', False):
            # Store user ID in session for 2FA verification
            session["pending_2fa_user_id"] = str(user["_id"])
            
            return jsonify({
                "two_factor_required": True,
                "message": "Please enter your two-factor authentication code"
            }), 200
        
        # Create session for backward compatibility
        session["user_id"] = str(user["_id"])
        
        # Update last login timestamp
        users_db.update_one(
            {"_id": user["_id"]},
            {"$set": {"last_login": datetime.utcnow()}}
        )
        
        # Get updated user data for consistent response
        updated_user = users_db.find_one({"_id": user["_id"]})
        
        user_response = {
            "id": str(updated_user["_id"]),
            "email": updated_user["email"],
            "name": updated_user.get("name", ""),
            "role": updated_user.get("role", "job_seeker"),
            "email_verified": updated_user.get("email_verified", False),
            "profile": updated_user.get("profile", {}),
            "oauth_accounts": {
                provider: {
                    "connected_at": account.get("connected_at"),
                    "last_used": account.get("last_used")
                }
                for provider, account in updated_user.get("oauth_accounts", {}).items()
            }
        }
        
        # Create JWT token pair
        try:
            token_data = create_token_pair(
                str(user["_id"]),
                {
                    "email": updated_user["email"],
                    "role": updated_user.get("role", "job_seeker"),
                    "email_verified": updated_user.get("email_verified", False)
                }
            )
            
            return jsonify({
                "user": user_response,
                "access_token": token_data["access_token"],
                "refresh_token": token_data["refresh_token"],
                "token_type": token_data["token_type"],
                "expires_in": token_data["access_token_expires_in"]
            }), 200
        except JWTError as e:
            print(f"JWT token creation error: {e}")
            # Fall back to session-only response
            return jsonify({
                "user": user_response,
                "token": "session_token",  # Fallback for compatibility
                "refreshToken": "refresh_token"  # Fallback for compatibility
            }), 200
        
    except Exception as e:
        print(f"Error during login: {e}")
        return standardize_error_response("Login failed. Please try again.", 500)


@auth_bp.route("/register", methods=["POST"])
@validate_json_request
def register_user():
    """Register a new user account"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ["name", "email", "password", "role"]
        is_valid, message = validate_required_fields(data, required_fields)
        if not is_valid:
            return standardize_error_response(message, 400)
        
        name = data["name"].strip()
        email = data["email"].strip().lower()
        password = data["password"]
        role = data["role"]
        
        # Validate email format
        if not validate_email(email):
            return standardize_error_response("Please enter a valid email address", 400)
        
        # Validate password strength
        is_valid, message = validate_password(password)
        if not is_valid:
            return standardize_error_response(message, 400)
        
        # Validate name
        is_valid, message = validate_name(name)
        if not is_valid:
            return standardize_error_response(message, 400)
        
        # Validate role
        if role not in ['job_seeker', 'employer']:
            return standardize_error_response("Invalid role selected", 400)
        
        # Check if user already exists
        existing_user = users_db.find_one({"email": email})
        if existing_user:
            return standardize_error_response("An account with this email already exists", 409)
        
        # Hash password
        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
        
        # Create new user
        now = datetime.utcnow()
        new_user = {
            "name": name,
            "email": email,
            "password": hashed_password,
            "role": role,
            "email_verified": False,  # For future email verification
            "created_at": now,
            "updated_at": now
        }
        
        result = users_db.insert_one(new_user)
        user_id = str(result.inserted_id)
        
        # Send email verification
        verification_token = create_email_verification_token(email)
        if verification_token:
            send_email_verification(email, name, verification_token)
        
        # Create session for the new user
        session["user_id"] = user_id
        
        # Create JWT token pair
        user_response = {
            "id": user_id,
            "email": email,
            "name": name,
            "role": role,
            "email_verified": False,
            "profile": {},  # Empty profile for new users
            "oauth_accounts": {}
        }
        
        try:
            token_data = create_token_pair(
                user_id,
                {
                    "email": email,
                    "role": role,
                    "email_verified": False
                }
            )
            
            return standardize_success_response({
                "user": user_response,
                "access_token": token_data["access_token"],
                "refresh_token": token_data["refresh_token"],
                "token_type": token_data["token_type"],
                "expires_in": token_data["access_token_expires_in"],
                "message": "Account created successfully. Please check your email to verify your account."
            }, "Account created successfully", 201)
        except JWTError as e:
            print(f"JWT token creation error during registration: {e}")
            # Fall back to session-only response
            return standardize_success_response({
                "user": user_response,
                "token": "session_token",  # Fallback for compatibility
                "refreshToken": "refresh_token",  # Fallback for compatibility
                "message": "Account created successfully. Please check your email to verify your account."
            }, "Account created successfully", 201)
        
    except Exception as e:
        print(f"Error creating user: {e}")
        return standardize_error_response("Failed to create account. Please try again.", 500)


@auth_bp.route("/logout", methods=["POST"])
def logout_user():
    """Clear the user session"""
    try:
        print("Session before logout:", session)
        session.clear()
        print("Session after logout:", session)
        return jsonify({"message": "Logged out successfully"}), 200
    except Exception as e:
        print(f"Error during logout: {e}")
        return jsonify({"error": "Logout failed"}), 500


@auth_bp.route("/@me", methods=["GET"])
def get_current_user():
    """Get current authenticated user information"""
    try:
        user_id = session.get("user_id")
        
        if not user_id:
            return jsonify({"error": "Unauthorized"}), 401
        
        user = users_db.find_one({"_id": ObjectId(user_id)})
        
        if not user:
            session.clear()  # Clear invalid session
            return jsonify({"error": "User not found"}), 404
        
        # Return comprehensive user format with profile data
        user_response = {
            "id": str(user["_id"]),
            "email": user["email"],
            "name": user.get("name", ""),
            "role": user.get("role", "job_seeker"),
            "email_verified": user.get("email_verified", False),
            "created_at": user.get("created_at"),
            "updated_at": user.get("updated_at"),
            "last_login": user.get("last_login"),
            "is_active": user.get("is_active", True)
        }
        
        # Add profile information if available
        profile = user.get("profile", {})
        if profile:
            user_response["profile"] = {
                "first_name": profile.get("first_name"),
                "last_name": profile.get("last_name"),
                "display_name": profile.get("display_name"),
                "profile_picture": profile.get("profile_picture"),
                "bio": profile.get("bio"),
                "phone": profile.get("phone"),
                "location": profile.get("location"),
                "website": profile.get("website"),
                "linkedin_profile": profile.get("linkedin_profile")
            }
        else:
            user_response["profile"] = {}
        
        # Add OAuth account information (without sensitive data)
        oauth_accounts = user.get("oauth_accounts", {})
        user_response["oauth_accounts"] = {}
        for provider, account_data in oauth_accounts.items():
            if isinstance(account_data, dict):
                user_response["oauth_accounts"][provider] = {
                    "connected_at": account_data.get("connected_at"),
                    "last_used": account_data.get("last_used"),
                    "provider_id": account_data.get("provider_id")  # Safe to include
                }
        
        return jsonify({"user": user_response}), 200
        
    except Exception as e:
        print(f"Error fetching current user: {e}")
        return jsonify({"error": "Internal server error"}), 500


def find_or_create_oauth_user(email, name, provider, provider_id, oauth_data=None):
    """Find existing user or create new OAuth user with comprehensive profile data"""
    try:
        existing_user = None
        
        print(f"\n=== Finding or Creating OAuth User ===")
        print(f"Provider: {provider}")
        print(f"Provider ID: {provider_id}")
        print(f"Email: {email}")
        print(f"Name: {name}")
        print(f"OAuth data keys: {list(oauth_data.keys()) if oauth_data else 'None'}")
        
        # First, try to find user by email if we have one
        if email:
            existing_user = users_db.find_one({"email": email})
            print(f"Looking for existing user by email: {email} - Found: {bool(existing_user)}")
        
        # If no user found by email, try to find by OAuth provider ID
        if not existing_user:
            existing_user = users_db.find_one({
                f"oauth_accounts.{provider}.provider_id": provider_id
            })
            print(f"Looking for existing user by {provider} ID: {provider_id} - Found: {bool(existing_user)}")
        
        if existing_user:
            print(f"Found existing user with ID: {existing_user['_id']}")
            
            # Convert existing user document to User model for easier manipulation
            try:
                user_model = User.from_dict(existing_user)
                print("Successfully converted existing user to Pydantic model")
            except Exception as e:
                print(f"Error converting existing user to model: {e}")
                # Fall back to creating a new User model with existing data
                user_model = User(
                    email=existing_user.get("email", email or f"{provider}_{provider_id}@oauth.placeholder"),
                    name=existing_user.get("name", name or "OAuth User"),
                    role=existing_user.get("role", "job_seeker"),
                    email_verified=existing_user.get("email_verified", True if email else False),
                    email_placeholder=existing_user.get("email_placeholder", not bool(email)),
                    created_at=existing_user.get("created_at", datetime.utcnow()),
                    updated_at=datetime.utcnow()
                )
            
            # Update OAuth account info
            provider_enum = OAuthProvider(provider)
            user_model.add_oauth_account(provider_enum, provider_id, oauth_data)
            
            # Update profile data from OAuth if we have it
            if oauth_data:
                print("Updating profile from OAuth data...")
                user_model.update_profile_from_oauth(provider_enum, oauth_data)
                print(f"Updated profile - First name: {user_model.profile.first_name}, Last name: {user_model.profile.last_name}")
            
            # Update email if we have one and the user doesn't
            if email and not existing_user.get("email"):
                user_model.email = email
                user_model.email_verified = True
                user_model.email_placeholder = False
                print(f"Updated existing user with email: {email}")
            
            # Update last login timestamp
            user_model.last_login = datetime.utcnow()
            
            # Save updated user back to database
            user_dict = user_model.to_dict()
            users_db.update_one(
                {"_id": existing_user["_id"]},
                {"$set": user_dict}
            )
            print(f"Updated existing user in database")
            
            # Add _id back to the dict for return
            user_dict["_id"] = existing_user["_id"]
            return user_dict
        
        # Create new user with OAuth
        print("Creating new OAuth user...")
        now = datetime.utcnow()
        
        # Determine email and email settings
        if email:
            user_email = email
            email_verified = True  # OAuth providers verify emails
            email_placeholder = False
            print(f"Creating new user with verified email: {email}")
        else:
            # Create a placeholder email based on provider and ID for internal use
            user_email = f"{provider}_{provider_id}@oauth.placeholder"
            email_verified = False
            email_placeholder = True
            print(f"Creating new user with placeholder email (no email permission from {provider})")
        
        # Create User model instance
        new_user = User(
            email=user_email,
            name=name or "OAuth User",
            role="job_seeker",  # Default role for OAuth users
            email_verified=email_verified,
            email_placeholder=email_placeholder,
            created_at=now,
            updated_at=now,
            last_login=now
        )
        
        # Add OAuth account
        provider_enum = OAuthProvider(provider)
        new_user.add_oauth_account(provider_enum, provider_id, oauth_data)
        
        # Update profile data from OAuth if we have it
        if oauth_data:
            print("Setting profile data from OAuth...")
            new_user.update_profile_from_oauth(provider_enum, oauth_data)
            print(f"Set profile - First name: {new_user.profile.first_name}, Last name: {new_user.profile.last_name}")
            
            # Log all the profile data we're storing
            if new_user.profile.first_name:
                print(f"Storing first_name: {new_user.profile.first_name}")
            if new_user.profile.last_name:
                print(f"Storing last_name: {new_user.profile.last_name}")
            if new_user.profile.profile_picture:
                print(f"Storing profile_picture: {new_user.profile.profile_picture}")
            if new_user.profile.display_name:
                print(f"Storing display_name: {new_user.profile.display_name}")
        
        # Convert to dict for MongoDB storage
        user_dict = new_user.to_dict()
        
        # Insert into database
        result = users_db.insert_one(user_dict)
        user_dict["_id"] = result.inserted_id
        
        print(f"Created new user with ID: {result.inserted_id}")
        print(f"User profile data stored: {user_dict.get('profile', {})}")
        
        return user_dict
        
    except Exception as e:
        print(f"Error in find_or_create_oauth_user: {e}")
        print(f"Parameters: email={email}, name={name}, provider={provider}, provider_id={provider_id}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return None


@auth_bp.route("/google/login", methods=["GET"])
def google_login():
    """Initiate Google OAuth login"""
    try:
        print("\n=== Starting Google Login Process ===")
        
        # Check rate limiting
        is_rate_limited, retry_after = check_oauth_rate_limit('google')
        if is_rate_limited:
            log_oauth_error('google', 'rate_limit_hit', {
                'retry_after': retry_after,
                'endpoint': 'google_login'
            })
            return standardize_error_response(
                f"Too many Google sign-in attempts. Please try again in {retry_after} seconds", 
                429
            )
        
        print("Creating redirect URI...")
        redirect_uri = url_for('auth_bp.google_callback', _external=True)
        print(f"Redirect URI created: {redirect_uri}")
        
        print("Checking if google client exists in oauth...")
        if not hasattr(oauth, 'google'):
            print("ERROR: Google client not found in oauth object!")
            log_oauth_error('google', 'client_not_initialized', {
                'error': 'Google OAuth client not found in oauth object'
            })
            return standardize_error_response("OAuth not properly initialized", 500)
        
        # Generate state for CSRF protection
        import secrets
        state = secrets.token_urlsafe(32)
        session['google_oauth_state'] = state
        
        print("Attempting to create authorization redirect...")
        return oauth.google.authorize_redirect(redirect_uri, state=state)
        
    except OAuthRateLimitError as e:
        log_oauth_error('google', 'rate_limit_exceeded', {
            'retry_after': e.retry_after,
            'endpoint': 'google_login'
        })
        return standardize_error_response(e.message, 429)
    except Exception as e:
        print(f"\nError initiating Google login:")
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        print(f"Full error details: {repr(e)}")
        
        log_oauth_error('google', 'login_initiation_failed', {
            'error_type': type(e).__name__,
            'error_message': str(e)
        })
        
        return standardize_error_response("Google sign-in is temporarily unavailable", 500)


@auth_bp.route("/google/callback", methods=["GET"])
def google_callback():
    """Handle Google OAuth callback"""
    try:
        print("\n=== Google OAuth Callback Started ===")
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
        
        # Check for errors in callback parameters
        error = request.args.get('error')
        if error:
            error_description = request.args.get('error_description', '')
            error_details = {
                'error': error,
                'error_description': error_description
            }
            
            log_oauth_error('google', 'callback_error', error_details)
            error_response = handle_google_oauth_error(error_details)
            
            print(f"OAuth error in callback: {error} - {error_description}")
            return redirect(f"{frontend_url}/oauth/callback?error={error_response['redirect_error']}")
        
        # Verify state parameter
        received_state = request.args.get('state')
        expected_state = session.pop('google_oauth_state', None)
        
        if not validate_oauth_state(expected_state, received_state, 'google'):
            print("State validation failed - potential CSRF attack")
            return redirect(f"{frontend_url}/oauth/callback?error=invalid_state")
        
        print("Attempting to get authorization token...")
        
        def get_token():
            return oauth.google.authorize_access_token()
        
        # Retry token request with backoff
        try:
            token = retry_oauth_request(get_token, max_retries=2, backoff_factor=1.0)
        except Exception as token_error:
            log_oauth_error('google', 'token_request_failed', {
                'error_type': type(token_error).__name__,
                'error_message': str(token_error)
            })
            print(f"Token request failed after retries: {token_error}")
            return redirect(f"{frontend_url}/oauth/callback?error=token_request_failed")
        
        if not token:
            log_oauth_error('google', 'no_token_received', {})
            print("No token received from Google!")
            return redirect(f"{frontend_url}/oauth/callback?error=authorization_failed")
        
        print("Token received successfully")
        print(f"Token type: {type(token)}")
        print(f"Token keys: {token.keys()}")
        
        # Get user info from Google
        print("\nFetching user info...")
        user_info = token.get('userinfo')
        
        if not user_info:
            log_oauth_error('google', 'no_user_info', {'token_keys': list(token.keys())})
            print("No user info in token!")
            return redirect(f"{frontend_url}/oauth/callback?error=user_info_failed")
        
        print(f"User info received: {user_info.keys()}")
        
        email = user_info.get('email')
        name = user_info.get('name', '')
        provider_id = user_info.get('sub')  # Google's unique ID
        
        print(f"Extracted info - Email: {email}, Name: {name}, Provider ID: {provider_id[:5]}..." if provider_id else "None")
        
        if not provider_id:
            log_oauth_error('google', 'missing_provider_id', user_info)
            print("Missing provider ID from Google!")
            return redirect(f"{frontend_url}/oauth/callback?error=incomplete_user_info")
        
        if not email:
            log_oauth_error('google', 'missing_email', {
                'has_email_permission': 'email' in token.get('scope', ''),
                'user_info_keys': list(user_info.keys())
            })
            print("No email permission granted by user")
            # Continue without email - some users might not grant email permission
        
        # Find or create user
        print("\nAttempting to find or create user...")
        try:
            user = find_or_create_oauth_user(email, name, 'google', provider_id, user_info)
        except Exception as user_error:
            log_oauth_error('google', 'user_creation_failed', {
                'error_type': type(user_error).__name__,
                'error_message': str(user_error),
                'email': email,
                'provider_id': provider_id[:10] if provider_id else None
            })
            print(f"User creation failed: {user_error}")
            return redirect(f"{frontend_url}/oauth/callback?error=user_creation_failed")
        
        if not user:
            log_oauth_error('google', 'user_creation_returned_none', {
                'email': email,
                'provider_id': provider_id[:10] if provider_id else None
            })
            print("User creation returned None!")
            return redirect(f"{frontend_url}/oauth/callback?error=user_creation_failed")
        
        print(f"User processed successfully - ID: {user['_id']}")
        
        # Create session
        session["user_id"] = str(user["_id"])
        print("Session created")
        
        # Log successful authentication
        log_oauth_error('google', 'authentication_success', {
            'user_id': str(user['_id']),
            'has_email': bool(email)
        })
        
        # Redirect to frontend with success
        print(f"Redirecting to frontend: {frontend_url}/oauth/callback?success=true")
        return redirect(f"{frontend_url}/oauth/callback?success=true")
        
    except requests.exceptions.RequestException as e:
        log_oauth_error('google', 'network_error', {
            'error_type': type(e).__name__,
            'error_message': str(e)
        })
        print(f"Network error in Google callback: {e}")
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
        return redirect(f"{frontend_url}/oauth/callback?error=network_error")
    except OAuthError as e:
        log_oauth_error('google', 'oauth_error', {
            'error_code': e.error_code,
            'message': e.message
        })
        print(f"OAuth error in Google callback: {e.message}")
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
        return redirect(f"{frontend_url}/oauth/callback?error={e.error_code or 'oauth_error'}")
    except Exception as e:
        log_oauth_error('google', 'unexpected_error', {
            'error_type': type(e).__name__,
            'error_message': str(e)
        })
        print("\nUnexpected error in Google callback:")
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        print(f"Full error details: {repr(e)}")
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
        return redirect(f"{frontend_url}/oauth/callback?error=unexpected_error")


@auth_bp.route("/google/verify", methods=["POST"])
@validate_json_request
def google_verify_token():
    """Verify Google ID token for mobile/SPA applications"""
    try:
        data = request.get_json()
        token_id = data.get('token')
        
        if not token_id:
            return standardize_error_response("Google token is required", 400)
        
        # Verify the token
        client_id = os.getenv('GOOGLE_OAUTH_CLIENT_ID')
        idinfo = id_token.verify_oauth2_token(token_id, google_requests.Request(), client_id)
        
        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            return standardize_error_response("Invalid token issuer", 400)
        
        email = idinfo.get('email')
        name = idinfo.get('name', '')
        provider_id = idinfo.get('sub')
        
        if not email or not provider_id:
            return standardize_error_response("Incomplete user information", 400)
        
        # Find or create user
        user = find_or_create_oauth_user(email, name, 'google', provider_id, idinfo)
        
        if not user:
            return standardize_error_response("Failed to create user account", 500)
        
        # Create session
        session["user_id"] = str(user["_id"])
        
        return standardize_success_response({
            "user": {
                "id": str(user["_id"]),
                "email": user["email"],
                "name": user.get("name", ""),
                "role": user.get("role", "job_seeker")
            },
            "token": "session_token",  # Placeholder for token-based auth
            "refreshToken": "refresh_token"  # Placeholder for refresh token
        }, "Google login successful", 200)
        
    except ValueError as e:
        print(f"Token verification error: {e}")
        return standardize_error_response("Invalid Google token", 400)
    except Exception as e:
        print(f"Error verifying Google token: {e}")
        return standardize_error_response("Google authentication failed", 500)


@auth_bp.route("/linkedin/login", methods=["GET"])
def linkedin_login():
    """Initiate LinkedIn OAuth login"""
    try:
        print("\n=== Starting LinkedIn Login Process ===")
        print("Creating redirect URI...")
        redirect_uri = url_for('auth_bp.linkedin_callback', _external=True)
        print(f"Redirect URI created: {redirect_uri}")
        
        print("Checking if linkedin client exists in oauth...")
        if not hasattr(oauth, 'linkedin'):
            print("ERROR: LinkedIn client not found in oauth object!")
            return standardize_error_response("OAuth not properly initialized", 500)
        
        print("Attempting to create authorization redirect...")
        # Generate and store state parameter for CSRF protection
        import secrets
        state = secrets.token_urlsafe(32)
        session['oauth_state'] = state
        print(f"Generated state: {state}")
        
        return oauth.linkedin.authorize_redirect(redirect_uri, state=state)
    except Exception as e:
        print(f"\nError initiating LinkedIn login:")
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        print(f"Full error details: {repr(e)}")
        return standardize_error_response("OAuth initialization failed", 500)


@auth_bp.route("/linkedin/test-userinfo", methods=["POST"])
@validate_json_request
def test_linkedin_userinfo():
    """Debug endpoint to test LinkedIn userinfo API with a provided access token"""
    try:
        data = request.get_json()
        access_token = data.get('access_token')
        
        if not access_token:
            return standardize_error_response("Access token is required", 400)
        
        print(f"\n=== Testing LinkedIn UserInfo API ===")
        print(f"Access token: {access_token[:20]}...")
        
        # Make request to LinkedIn's userinfo endpoint
        userinfo_url = 'https://api.linkedin.com/v2/userinfo'
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        
        print(f"Making request to: {userinfo_url}")
        userinfo_response = requests.get(userinfo_url, headers=headers)
        print(f"Response status: {userinfo_response.status_code}")
        print(f"Response headers: {dict(userinfo_response.headers)}")
        
        if userinfo_response.status_code == 200:
            userinfo_data = userinfo_response.json()
            print(f"Success! User data received")
            
            return standardize_success_response({
                "status": "success",
                "userinfo": userinfo_data,
                "available_fields": list(userinfo_data.keys())
            }, "UserInfo retrieved successfully", 200)
            
        else:
            print(f"Error response: {userinfo_response.text}")
            return standardize_error_response(
                f"LinkedIn API error: {userinfo_response.status_code} - {userinfo_response.text}",
                userinfo_response.status_code
            )
            
    except Exception as e:
        print(f"Error testing userinfo: {e}")
        return standardize_error_response("Failed to test userinfo endpoint", 500)


@auth_bp.route("/linkedin/callback", methods=["GET"])
def linkedin_callback():
    """Handle LinkedIn OAuth callback"""
    try:
        print("\n=== LinkedIn OAuth Callback Started ===")
        
        # Verify state parameter for CSRF protection
        state = request.args.get('state')
        stored_state = session.pop('oauth_state', None)
        
        if not state or not stored_state or state != stored_state:
            print("State verification failed!")
            print(f"Received state: {state}")
            print(f"Stored state: {stored_state}")
            frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
            return redirect(f"{frontend_url}/oauth/callback?error=invalid_state")
        
        # Check for error in callback
        error = request.args.get('error')
        if error:
            print(f"OAuth error in callback: {error}")
            error_description = request.args.get('error_description', '')
            print(f"Error description: {error_description}")
            frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
            return redirect(f"{frontend_url}/oauth/callback?error=oauth_denied")
        
        # Get the authorization code
        code = request.args.get('code')
        if not code:
            print("No authorization code received!")
            frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
            return redirect(f"{frontend_url}/oauth/callback?error=no_code")
            
        print(f"Authorization code received: {code[:10]}...")
        
        # Manual token exchange to avoid JWT validation issues
        print("Manually exchanging authorization code for access token...")
        
        token_url = 'https://www.linkedin.com/oauth/v2/accessToken'
        redirect_uri = url_for('auth_bp.linkedin_callback', _external=True)
        
        token_data = {
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': redirect_uri,
            'client_id': os.getenv('LINKEDIN_OAUTH_CLIENT_ID'),
            'client_secret': os.getenv('LINKEDIN_OAUTH_CLIENT_SECRET')
        }
        
        print(f"Making token request to: {token_url}")
        print(f"Redirect URI: {redirect_uri}")
        
        token_response = requests.post(token_url, data=token_data)
        print(f"Token response status: {token_response.status_code}")
        
        if token_response.status_code != 200:
            print(f"Token exchange failed: {token_response.text}")
            frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
            return redirect(f"{frontend_url}/oauth/callback?error=token_exchange_failed")
        
        token_json = token_response.json()
        access_token = token_json.get('access_token')
        
        if not access_token:
            print("No access token in response!")
            print(f"Token response: {token_json}")
            frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
            return redirect(f"{frontend_url}/oauth/callback?error=no_access_token")
        
        print("Token exchange successful!")
        print(f"Access token: {access_token[:20]}...")
        
        # Get user information using the OpenID Connect userinfo endpoint
        print("\nFetching user information from /v2/userinfo endpoint...")
        
        # Make request to LinkedIn's userinfo endpoint
        userinfo_url = 'https://api.linkedin.com/v2/userinfo'
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        
        print(f"Making request to: {userinfo_url}")
        print(f"Authorization header: Bearer {access_token[:20]}...")
        
        userinfo_response = requests.get(userinfo_url, headers=headers)
        print(f"Userinfo response status: {userinfo_response.status_code}")
        
        if userinfo_response.status_code == 200:
            userinfo_data = userinfo_response.json()
            print(f"Userinfo data received successfully")
            print(f"Available fields: {list(userinfo_data.keys())}")
            
            # Extract user information according to OpenID Connect standard
            provider_id = userinfo_data.get('sub')  # LinkedIn's unique identifier
            email = userinfo_data.get('email')
            name = userinfo_data.get('name', '')
            given_name = userinfo_data.get('given_name', '')
            family_name = userinfo_data.get('family_name', '')
            
            # Construct full name if not provided directly
            if not name and (given_name or family_name):
                name = f"{given_name} {family_name}".strip()
            elif not name:
                name = "LinkedIn User"
            
            print(f"Extracted user data:")
            print(f"  Provider ID: {provider_id}")
            print(f"  Email: {email}")
            print(f"  Name: {name}")
            print(f"  Given name: {given_name}")
            print(f"  Family name: {family_name}")
            
            if not provider_id:
                print("Error: No provider ID (sub) found in userinfo response")
                frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
                return redirect(f"{frontend_url}/oauth/callback?error=no_user_id")
            
        elif userinfo_response.status_code == 401:
            print("Unauthorized - invalid or expired access token")
            frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
            return redirect(f"{frontend_url}/oauth/callback?error=unauthorized")
            
        elif userinfo_response.status_code == 403:
            print("Forbidden - insufficient permissions")
            print("This usually means your LinkedIn app doesn't have the required permissions.")
            print("Make sure your LinkedIn app has 'Sign In with LinkedIn using OpenID Connect' product enabled.")
            print(f"Response: {userinfo_response.text}")
            frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
            return redirect(f"{frontend_url}/oauth/callback?error=insufficient_permissions")
            
        else:
            print(f"Unexpected response status: {userinfo_response.status_code}")
            print(f"Response body: {userinfo_response.text}")
            frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
            return redirect(f"{frontend_url}/oauth/callback?error=api_error")
        
        # Find or create user in database
        print("\nAttempting to find or create user...")
        user = find_or_create_oauth_user(email, name, 'linkedin', provider_id, userinfo_data)
        
        if not user:
            print("Failed to find or create user!")
            frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
            return redirect(f"{frontend_url}/oauth/callback?error=user_creation_failed")
        
        print(f"User processed successfully - ID: {user['_id']}")
        
        # Create session
        session["user_id"] = str(user["_id"])
        print("Session created successfully")
        
        # Redirect to frontend with success
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
        print(f"Redirecting to frontend: {frontend_url}/oauth/callback?success=true")
        return redirect(f"{frontend_url}/oauth/callback?success=true")
        
    except Exception as e:
        print("\nUnexpected error in LinkedIn callback:")
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        print(f"Full error details: {repr(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
        return redirect(f"{frontend_url}/oauth/callback?error=unexpected_error")


@auth_bp.route("/request-reset", methods=["POST"])
@validate_json_request
def request_password_reset():
    """Request a password reset email"""
    try:
        data = request.get_json()
        email = data.get("email", "").strip().lower()
        
        if not email:
            return standardize_error_response("Email is required", 400)
        
        if not validate_email(email):
            return standardize_error_response("Please enter a valid email address", 400)
        
        # Check if user exists
        user = users_db.find_one({"email": email})
        
        # Always return success to prevent email enumeration attacks
        # but only send email if user exists
        if user:
            # Create password reset token
            token = create_password_reset_token(email)
            
            if token:
                # Send password reset email
                success, message = send_password_reset_email(
                    email, 
                    user.get("name", ""), 
                    token
                )
                
                if not success:
                    print(f"Failed to send password reset email: {message}")
        
        return standardize_success_response(
            {"message": "If an account with that email exists, we've sent password reset instructions"}, 
            status_code=200
        )
        
    except Exception as e:
        print(f"Error in password reset request: {e}")
        return standardize_error_response("Failed to process password reset request", 500)


@auth_bp.route("/reset-password", methods=["POST"])
@validate_json_request
def reset_password():
    """Reset password using a valid token"""
    try:
        data = request.get_json()
        token = data.get("token", "").strip()
        new_password = data.get("password", "")
        
        if not token:
            return standardize_error_response("Reset token is required", 400)
        
        if not new_password:
            return standardize_error_response("New password is required", 400)
        
        # Validate password strength
        is_valid, message = validate_password(new_password)
        if not is_valid:
            return standardize_error_response(message, 400)
        
        # Verify token
        token_data = verify_password_reset_token(token)
        
        if not token_data:
            return standardize_error_response("Invalid or expired reset token", 400)
        
        email = token_data["email"]
        
        # Find user
        user = users_db.find_one({"email": email})
        
        if not user:
            return standardize_error_response("User not found", 404)
        
        # Hash new password
        hashed_password = bcrypt.generate_password_hash(new_password).decode('utf-8')
        
        # Update user password
        users_db.update_one(
            {"_id": user["_id"]},
            {
                "$set": {
                    "password": hashed_password,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        # Mark token as used
        mark_token_as_used(token)
        
        # Clear any existing sessions for this user (optional security measure)
        # This would require tracking sessions by user_id
        
        return standardize_success_response(
            {"message": "Password has been reset successfully"}, 
            status_code=200
        )
        
    except Exception as e:
        print(f"Error resetting password: {e}")
        return standardize_error_response("Failed to reset password", 500)


@auth_bp.route("/verify-reset-token", methods=["POST"])
@validate_json_request
def verify_reset_token():
    """Verify if a password reset token is valid"""
    try:
        data = request.get_json()
        token = data.get("token", "").strip()
        
        if not token:
            return standardize_error_response("Token is required", 400)
        
        # Verify token
        token_data = verify_password_reset_token(token)
        
        if not token_data:
            return standardize_error_response("Invalid or expired token", 400)
        
        return standardize_success_response({
            "valid": True,
            "email": token_data["email"],
            "expires_at": token_data["expires_at"].isoformat()
        }, status_code=200)
        
    except Exception as e:
        print(f"Error verifying reset token: {e}")
        return standardize_error_response("Failed to verify token", 500)


@auth_bp.route("/verify-email", methods=["POST"])
@validate_json_request
def verify_email():
    """Verify user email using verification token"""
    try:
        data = request.get_json()
        token = data.get("token", "").strip()
        
        if not token:
            return standardize_error_response("Verification token is required", 400)
        
        # Verify token
        token_data = verify_email_verification_token(token)
        
        if not token_data:
            return standardize_error_response("Invalid or expired verification token", 400)
        
        email = token_data["email"]
        
        # Find user
        user = users_db.find_one({"email": email})
        
        if not user:
            return standardize_error_response("User not found", 404)
        
        # Update user as verified
        users_db.update_one(
            {"_id": user["_id"]},
            {
                "$set": {
                    "email_verified": True,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        # Mark token as used
        mark_token_as_used(token)
        
        return standardize_success_response({
            "message": "Email verified successfully",
            "user": {
                "id": str(user["_id"]),
                "email": user["email"],
                "name": user.get("name", ""),
                "role": user.get("role", "job_seeker"),
                "email_verified": True
            }
        }, status_code=200)
        
    except Exception as e:
        print(f"Error verifying email: {e}")
        return standardize_error_response("Failed to verify email", 500)


@auth_bp.route("/resend-verification", methods=["POST"])
@validate_json_request
def resend_verification():
    """Resend email verification"""
    try:
        data = request.get_json()
        email = data.get("email", "").strip().lower()
        
        if not email:
            return standardize_error_response("Email is required", 400)
        
        if not validate_email(email):
            return standardize_error_response("Please enter a valid email address", 400)
        
        # Find user
        user = users_db.find_one({"email": email})
        
        if not user:
            # Don't reveal if email exists or not for security
            return standardize_success_response({
                "message": "If an unverified account with that email exists, we've sent a verification email"
            }, status_code=200)
        
        # Check if already verified
        if user.get("email_verified", False):
            return standardize_error_response("Email is already verified", 400)
        
        # Create new verification token
        verification_token = create_email_verification_token(email)
        
        if verification_token:
            # Send verification email
            success, message = send_email_verification(
                email, 
                user.get("name", ""), 
                verification_token
            )
            
            if not success:
                print(f"Failed to send verification email: {message}")
                return standardize_error_response("Failed to send verification email", 500)
        
        return standardize_success_response({
            "message": "Verification email sent successfully"
        }, status_code=200)
        
    except Exception as e:
        print(f"Error resending verification: {e}")
        return standardize_error_response("Failed to resend verification email", 500)


@auth_bp.route("/check-verification-status", methods=["GET"])
def check_verification_status():
    """Check email verification status for current user"""
    try:
        user_id = session.get("user_id")
        
        if not user_id:
            return standardize_error_response("Authentication required", 401)
        
        user = users_db.find_one({"_id": ObjectId(user_id)})
        
        if not user:
            session.clear()
            return standardize_error_response("User not found", 404)
        
        return standardize_success_response({
            "email_verified": user.get("email_verified", False),
            "email": user["email"]
        }, status_code=200)
        
    except Exception as e:
        print(f"Error checking verification status: {e}")
        return standardize_error_response("Failed to check verification status", 500)


@auth_bp.route('/image-proxy', methods=['GET'])
def image_proxy():
    """Proxy endpoint to fetch external images and serve them through our backend"""
    image_url = request.args.get('url')
    
    if not image_url:
        return jsonify({"error": "URL parameter is required"}), 400
    
    # Validate that it's a valid image URL
    if not image_url.startswith(('http://', 'https://')):
        return jsonify({"error": "Invalid URL"}), 400
    
    try:
        # Fetch the image from the external URL
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'image/*,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        }
        
        response = requests.get(image_url, headers=headers, stream=True, timeout=10)
        response.raise_for_status()
        
        # Check if it's actually an image
        content_type = response.headers.get('content-type', '')
        if not content_type.startswith('image/'):
            return jsonify({"error": "URL does not point to an image"}), 400
        
        # Stream the image back to the client
        def generate():
            for chunk in response.iter_content(chunk_size=8192):
                yield chunk
        
        return Response(
            generate(),
            content_type=content_type,
            headers={
                'Cache-Control': 'public, max-age=86400',  # Cache for 24 hours
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        )
        
    except requests.exceptions.RequestException as e:
        print(f"Error fetching image: {e}")
        return jsonify({"error": "Failed to fetch image"}), 500
    except Exception as e:
        print(f"Unexpected error in image proxy: {e}")
        return jsonify({"error": "Internal server error"}), 500


@auth_bp.route("/refresh-token", methods=["POST"])
@validate_json_request
def refresh_token():
    """Refresh access token using valid refresh token"""
    try:
        data = request.get_json()
        refresh_token = data.get("refresh_token", "").strip()
        
        if not refresh_token:
            return standardize_error_response("Refresh token is required", 400)
        
        # Refresh the access token
        try:
            token_response = refresh_access_token(refresh_token)
            
            return standardize_success_response({
                "access_token": token_response["access_token"],
                "user": token_response["user"],
                "token_type": "Bearer",
                "expires_in": 900  # 15 minutes in seconds
            }, "Token refreshed successfully", 200)
            
        except JWTError as e:
            return standardize_error_response(f"Token refresh failed: {str(e)}", 401)
        
    except Exception as e:
        print(f"Error refreshing token: {e}")
        return standardize_error_response("Failed to refresh token", 500)


@auth_bp.route("/revoke-token", methods=["POST"])
@validate_json_request
@jwt_required()
def revoke_token():
    """Revoke a specific refresh token"""
    try:
        data = request.get_json()
        refresh_token = data.get("refresh_token", "").strip()
        
        if not refresh_token:
            return standardize_error_response("Refresh token is required", 400)
        
        # Revoke the token
        success = revoke_refresh_token(refresh_token)
        
        if success:
            return standardize_success_response({
                "message": "Token revoked successfully"
            }, status_code=200)
        else:
            return standardize_error_response("Failed to revoke token", 400)
        
    except Exception as e:
        print(f"Error revoking token: {e}")
        return standardize_error_response("Failed to revoke token", 500)


@auth_bp.route("/revoke-all-tokens", methods=["POST"])
@jwt_required()
def revoke_all_tokens():
    """Revoke all refresh tokens for current user"""
    try:
        from flask import g
        user_id = g.current_user_id
        
        # Revoke all tokens for this user
        revoked_count = revoke_all_user_tokens(user_id)
        
        # Also clear session for good measure
        session.clear()
        
        return standardize_success_response({
            "message": f"All tokens revoked successfully ({revoked_count} tokens)",
            "revoked_count": revoked_count
        }, status_code=200)
        
    except Exception as e:
        print(f"Error revoking all tokens: {e}")
        return standardize_error_response("Failed to revoke all tokens", 500)


@auth_bp.route("/token-info", methods=["GET"])
@jwt_required()
def token_info():
    """Get information about current user's active tokens"""
    try:
        from flask import g
        from jwt_utils import get_user_active_tokens
        
        user_id = g.current_user_id
        active_tokens = get_user_active_tokens(user_id)
        
        # Format token info (without exposing actual tokens)
        token_info = []
        for token in active_tokens:
            token_info.append({
                "created_at": token["created_at"].isoformat(),
                "last_used": token["last_used"].isoformat(),
                "expires_at": token["expires_at"].isoformat()
            })
        
        return standardize_success_response({
            "active_tokens": len(active_tokens),
            "tokens": token_info
        }, status_code=200)
        
    except Exception as e:
        print(f"Error getting token info: {e}")
        return standardize_error_response("Failed to get token information", 500)


@auth_bp.route("/logout-all-devices", methods=["POST"])
@jwt_required()
def logout_all_devices():
    """Logout user from all devices by revoking all tokens"""
    try:
        from flask import g
        user_id = g.current_user_id
        
        # Revoke all refresh tokens
        revoked_count = revoke_all_user_tokens(user_id)
        
        # Clear current session
        session.clear()
        
        return standardize_success_response({
            "message": "Successfully logged out from all devices",
            "revoked_tokens": revoked_count
        }, status_code=200)
        
    except Exception as e:
        print(f"Error logging out all devices: {e}")
        return standardize_error_response("Failed to logout from all devices", 500)


@auth_bp.route("/2fa/setup", methods=["POST"])
@jwt_required()
def setup_two_factor():
    """Setup two-factor authentication for current user"""
    try:
        from flask import g
        user_id = g.current_user_id
        
        # Check if 2FA is already enabled
        user = users_db.find_one({'_id': ObjectId(user_id)})
        if user and user.get('two_factor_enabled'):
            return standardize_error_response("Two-factor authentication is already enabled", 400)
        
        # Generate 2FA setup data
        setup_data = enable_two_factor(user_id)
        
        return standardize_success_response({
            "qr_code": setup_data["qr_code"],
            "manual_entry_key": setup_data["manual_entry_key"],
            "backup_codes": setup_data["backup_codes"],
            "message": "Scan QR code with authenticator app and verify with a code to enable 2FA"
        }, "2FA setup initiated", 200)
        
    except TwoFactorError as e:
        return standardize_error_response(str(e), 400)
    except Exception as e:
        print(f"Error setting up 2FA: {e}")
        return standardize_error_response("Failed to setup two-factor authentication", 500)


@auth_bp.route("/2fa/verify-setup", methods=["POST"])
@validate_json_request
@jwt_required()
def verify_two_factor_setup():
    """Verify and activate two-factor authentication"""
    try:
        from flask import g
        data = request.get_json()
        user_id = g.current_user_id
        
        totp_code = data.get("code", "").strip()
        if not totp_code:
            return standardize_error_response("Verification code is required", 400)
        
        if len(totp_code) != 6 or not totp_code.isdigit():
            return standardize_error_response("Invalid verification code format", 400)
        
        # Verify and activate 2FA
        success = verify_and_activate_two_factor(user_id, totp_code)
        
        if success:
            return standardize_success_response({
                "message": "Two-factor authentication has been enabled successfully"
            }, "2FA activated", 200)
        else:
            return standardize_error_response("Invalid verification code", 400)
        
    except TwoFactorError as e:
        return standardize_error_response(str(e), 400)
    except Exception as e:
        print(f"Error verifying 2FA setup: {e}")
        return standardize_error_response("Failed to verify 2FA setup", 500)


@auth_bp.route("/2fa/verify", methods=["POST"])
@validate_json_request
def verify_two_factor_login():
    """Verify 2FA code during login process"""
    try:
        data = request.get_json()
        
        # Get user_id from session (should be set during initial login)
        user_id = session.get("pending_2fa_user_id")
        if not user_id:
            return standardize_error_response("2FA verification session not found", 400)
        
        code = data.get("code", "").strip()
        is_backup_code = data.get("is_backup_code", False)
        
        if not code:
            return standardize_error_response("Verification code is required", 400)
        
        # Verify the code
        success = verify_two_factor_code(user_id, code, is_backup_code)
        
        if success:
            # Clear pending 2FA session
            session.pop("pending_2fa_user_id", None)
            
            # Create full session
            session["user_id"] = user_id
            
            # Get user data for response
            user = users_db.find_one({'_id': ObjectId(user_id)})
            
            user_response = {
                "id": str(user["_id"]),
                "email": user["email"],
                "name": user.get("name", ""),
                "role": user.get("role", "job_seeker"),
                "email_verified": user.get("email_verified", False),
                "two_factor_enabled": True
            }
            
            # Create JWT token pair
            try:
                token_data = create_token_pair(
                    user_id,
                    {
                        "email": user["email"],
                        "role": user.get("role", "job_seeker"),
                        "email_verified": user.get("email_verified", False)
                    }
                )
                
                return standardize_success_response({
                    "user": user_response,
                    "access_token": token_data["access_token"],
                    "refresh_token": token_data["refresh_token"],
                    "token_type": token_data["token_type"],
                    "expires_in": token_data["access_token_expires_in"]
                }, "2FA verification successful", 200)
            except JWTError:
                # Fall back to session-only response
                return standardize_success_response({
                    "user": user_response
                }, "2FA verification successful", 200)
        else:
            return standardize_error_response("Invalid verification code", 400)
        
    except TwoFactorError as e:
        return standardize_error_response(str(e), 400)
    except Exception as e:
        print(f"Error verifying 2FA login: {e}")
        return standardize_error_response("Failed to verify 2FA code", 500)


@auth_bp.route("/2fa/status", methods=["GET"])
@jwt_required()
def get_two_factor_auth_status():
    """Get 2FA status for current user"""
    try:
        from flask import g
        user_id = g.current_user_id
        
        status = get_two_factor_status(user_id)
        
        return standardize_success_response(status, status_code=200)
        
    except Exception as e:
        print(f"Error getting 2FA status: {e}")
        return standardize_error_response("Failed to get 2FA status", 500)


@auth_bp.route("/2fa/disable", methods=["POST"])
@validate_json_request
@jwt_required()
def disable_two_factor_auth():
    """Disable two-factor authentication"""
    try:
        from flask import g
        data = request.get_json()
        user_id = g.current_user_id
        
        # Require password confirmation for security
        password = data.get("password", "")
        if not password:
            return standardize_error_response("Password is required to disable 2FA", 400)
        
        # Verify password
        user = users_db.find_one({'_id': ObjectId(user_id)})
        if not user or not bcrypt.check_password_hash(user["password"], password):
            return standardize_error_response("Invalid password", 401)
        
        # Disable 2FA
        success = disable_two_factor(user_id)
        
        if success:
            return standardize_success_response({
                "message": "Two-factor authentication has been disabled"
            }, "2FA disabled", 200)
        else:
            return standardize_error_response("Failed to disable 2FA", 500)
        
    except Exception as e:
        print(f"Error disabling 2FA: {e}")
        return standardize_error_response("Failed to disable two-factor authentication", 500)


@auth_bp.route("/2fa/regenerate-backup-codes", methods=["POST"])
@jwt_required()
def regenerate_two_factor_backup_codes():
    """Regenerate backup codes for 2FA"""
    try:
        from flask import g
        user_id = g.current_user_id
        
        # Generate new backup codes
        backup_codes = regenerate_backup_codes(user_id)
        
        return standardize_success_response({
            "backup_codes": backup_codes,
            "message": "New backup codes generated. Please save them securely"
        }, "Backup codes regenerated", 200)
        
    except TwoFactorError as e:
        return standardize_error_response(str(e), 400)
    except Exception as e:
        print(f"Error regenerating backup codes: {e}")
        return standardize_error_response("Failed to regenerate backup codes", 500)


@auth_bp.route("/account-lockout/status", methods=["GET"])
@jwt_required()
def get_account_lockout_status():
    """Get account lockout status for current user"""
    try:
        from flask import g
        user = g.current_user
        email = user.get('email')
        
        if not email:
            return standardize_error_response("User email not available", 400)
        
        lockout_info = get_lockout_info(email, 'email')
        
        return standardize_success_response(lockout_info, status_code=200)
        
    except Exception as e:
        print(f"Error getting lockout status: {e}")
        return standardize_error_response("Failed to get account lockout status", 500)


@auth_bp.route("/admin/unlock-account", methods=["POST"])
@validate_json_request
@jwt_required()
def admin_unlock_account():
    """Unlock a user account (admin only)"""
    try:
        from flask import g
        from auth_decorators import has_role
        
        # Check admin role
        if not has_role('admin'):
            return standardize_error_response("Admin access required", 403)
        
        data = request.get_json()
        email = data.get("email", "").strip().lower()
        reason = data.get("reason", "Manual unlock by admin")
        
        if not email:
            return standardize_error_response("Email is required", 400)
        
        # Unlock the account
        success = unlock_account(email, 'email', reason)
        
        if success:
            return standardize_success_response({
                "message": f"Account {email} has been unlocked",
                "unlocked_email": email
            }, "Account unlocked", 200)
        else:
            return standardize_error_response("Account was not locked or unlock failed", 400)
        
    except Exception as e:
        print(f"Error unlocking account: {e}")
        return standardize_error_response("Failed to unlock account", 500)


@auth_bp.route("/admin/lockout-info/<email>", methods=["GET"])
@jwt_required()
def admin_get_lockout_info(email):
    """Get detailed lockout information for a user (admin only)"""
    try:
        from flask import g
        from auth_decorators import has_role
        
        # Check admin role
        if not has_role('admin'):
            return standardize_error_response("Admin access required", 403)
        
        email = email.strip().lower()
        lockout_info = get_lockout_info(email, 'email')
        
        return standardize_success_response({
            "email": email,
            "lockout_info": lockout_info
        }, status_code=200)
        
    except Exception as e:
        print(f"Error getting admin lockout info: {e}")
        return standardize_error_response("Failed to get lockout information", 500)


@auth_bp.route("/admin/lockout-stats", methods=["GET"])
@jwt_required()
def admin_get_lockout_stats():
    """Get lockout statistics (admin only)"""
    try:
        from flask import g
        from auth_decorators import has_role
        from account_lockout import get_lockout_stats
        
        # Check admin role
        if not has_role('admin'):
            return standardize_error_response("Admin access required", 403)
        
        days = int(request.args.get('days', 7))
        stats = get_lockout_stats(days)
        
        return standardize_success_response(stats, status_code=200)
        
    except Exception as e:
        print(f"Error getting lockout stats: {e}")
        return standardize_error_response("Failed to get lockout statistics", 500)