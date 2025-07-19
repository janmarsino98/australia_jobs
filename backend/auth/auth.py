from flask import Blueprint, jsonify, request, session, redirect, url_for
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
    
    # LinkedIn OAuth configuration (OAuth 2.0 + OpenID Connect)
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
                'scope': 'openid profile email',  # Updated scopes for OpenID Connect
                'token_endpoint_auth_method': 'client_secret_post'
            }
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
        
        user = users_db.find_one({"email": email})
        
        if not user:
            return standardize_error_response("Invalid email or password", 401)
        
        if not bcrypt.check_password_hash(user["password"], password):
            return standardize_error_response("Invalid email or password", 401)
        
        # Create session
        session["user_id"] = str(user["_id"])
        
        return jsonify({
            "user": {
                "id": str(user["_id"]),
                "email": user["email"],
                "name": user.get("name", ""),
                "role": user.get("role", "job_seeker")
            },
            "token": "session_token",  # Placeholder for token-based auth
            "refreshToken": "refresh_token"  # Placeholder for refresh token
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
        
        # Return user data (similar to login response)
        return standardize_success_response({
            "user": {
                "id": user_id,
                "email": email,
                "name": name,
                "role": role,
                "email_verified": False
            },
            "token": "session_token",  # Placeholder for token-based auth
            "refreshToken": "refresh_token",  # Placeholder for refresh token
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
        
        # Return consistent user format
        return jsonify({
            "user": {
                "id": str(user["_id"]),
                "email": user["email"],
                "name": user.get("name", ""),
                "role": user.get("role", "job_seeker"),
                "email_verified": user.get("email_verified", False),
                "created_at": user.get("created_at"),
                "updated_at": user.get("updated_at")
            }
        }), 200
        
    except Exception as e:
        print(f"Error fetching current user: {e}")
        return jsonify({"error": "Internal server error"}), 500


def find_or_create_oauth_user(email, name, provider, provider_id):
    """Find existing user or create new OAuth user"""
    try:
        # Check if user exists with this email
        existing_user = users_db.find_one({"email": email})
        
        if existing_user:
            # Update OAuth info if not already present
            oauth_accounts = existing_user.get("oauth_accounts", {})
            if provider not in oauth_accounts:
                users_db.update_one(
                    {"_id": existing_user["_id"]},
                    {
                        "$set": {
                            f"oauth_accounts.{provider}": {
                                "provider_id": provider_id,
                                "connected_at": datetime.utcnow()
                            },
                            "updated_at": datetime.utcnow()
                        }
                    }
                )
            return existing_user
        
        # Create new user with OAuth
        now = datetime.utcnow()
        new_user = {
            "name": name,
            "email": email,
            "role": "job_seeker",  # Default role for OAuth users
            "email_verified": True,  # OAuth providers verify emails
            "oauth_accounts": {
                provider: {
                    "provider_id": provider_id,
                    "connected_at": now
                }
            },
            "created_at": now,
            "updated_at": now
        }
        
        result = users_db.insert_one(new_user)
        new_user["_id"] = result.inserted_id
        return new_user
        
    except Exception as e:
        print(f"Error in find_or_create_oauth_user: {e}")
        return None


@auth_bp.route("/google/login", methods=["GET"])
def google_login():
    """Initiate Google OAuth login"""
    try:
        print("\n=== Starting Google Login Process ===")
        print("Creating redirect URI...")
        redirect_uri = url_for('auth_bp.google_callback', _external=True)
        print(f"Redirect URI created: {redirect_uri}")
        
        print("Checking if google client exists in oauth...")
        if not hasattr(oauth, 'google'):
            print("ERROR: Google client not found in oauth object!")
            return standardize_error_response("OAuth not properly initialized", 500)
        
        print("Attempting to create authorization redirect...")
        return oauth.google.authorize_redirect(redirect_uri)
    except Exception as e:
        print(f"\nError initiating Google login:")
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        print(f"Full error details: {repr(e)}")
        return standardize_error_response("OAuth initialization failed", 500)


@auth_bp.route("/google/callback", methods=["GET"])
def google_callback():
    """Handle Google OAuth callback"""
    try:
        print("\n=== Google OAuth Callback Started ===")
        print("Attempting to get authorization token...")
        token = oauth.google.authorize_access_token()
        
        if not token:
            print("No token received from Google!")
            return standardize_error_response("Authorization failed", 400)
        
        print("Token received successfully")
        print(f"Token type: {type(token)}")
        print(f"Token keys: {token.keys()}")
        
        # Get user info from Google
        print("\nFetching user info...")
        user_info = token.get('userinfo')
        
        if not user_info:
            print("No user info in token!")
            return standardize_error_response("Failed to get user information", 400)
        
        print(f"User info received: {user_info.keys()}")
        
        email = user_info.get('email')
        name = user_info.get('name', '')
        provider_id = user_info.get('sub')  # Google's unique ID
        
        print(f"Extracted info - Email: {email}, Name: {name}, Provider ID: {provider_id[:5]}..." if provider_id else "None")
        
        if not email or not provider_id:
            print("Missing required user information!")
            return standardize_error_response("Incomplete user information from Google", 400)
        
        # Find or create user
        print("\nAttempting to find or create user...")
        user = find_or_create_oauth_user(email, name, 'google', provider_id)
        
        if not user:
            print("Failed to find or create user!")
            return standardize_error_response("Failed to create user account", 500)
        
        print(f"User processed successfully - ID: {user['_id']}")
        
        # Create session
        session["user_id"] = str(user["_id"])
        print("Session created")
        
        # Redirect to frontend with success
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
        print(f"Redirecting to frontend: {frontend_url}/oauth/callback?success=true")
        return redirect(f"{frontend_url}/oauth/callback?success=true")
        
    except Exception as e:
        print("\nError in Google callback:")
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        print(f"Full error details: {repr(e)}")
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
        return redirect(f"{frontend_url}/oauth/callback?error=oauth_failed")


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
        user = find_or_create_oauth_user(email, name, 'google', provider_id)
        
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
        # Generate and store state parameter
        state = os.urandom(16).hex()
        session['oauth_state'] = state
        return oauth.linkedin.authorize_redirect(redirect_uri, state=state)
    except Exception as e:
        print(f"\nError initiating LinkedIn login:")
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        print(f"Full error details: {repr(e)}")
        return standardize_error_response("OAuth initialization failed", 500)


@auth_bp.route("/linkedin/callback", methods=["GET"])
def linkedin_callback():
    """Handle LinkedIn OAuth callback"""
    try:
        print("\n=== LinkedIn OAuth Callback Started ===")
        print("Attempting to get authorization token...")
        
        # Verify state parameter
        state = request.args.get('state')
        stored_state = session.pop('oauth_state', None)
        
        if not state or not stored_state or state != stored_state:
            print("State verification failed!")
            print(f"Received state: {state}")
            print(f"Stored state: {stored_state}")
            return standardize_error_response("Invalid OAuth state", 400)
        
        # Get the authorization code from the request
        code = request.args.get('code')
        if not code:
            print("No authorization code received!")
            return standardize_error_response("Authorization code missing", 400)
            
        # Exchange the authorization code for an access token
        token = oauth.linkedin.authorize_access_token()
        
        if not token:
            print("No token received from LinkedIn!")
            return standardize_error_response("Authorization failed", 400)
        
        print("Token received successfully")
        print(f"Token type: {type(token)}")
        print(f"Token keys: {token.keys()}")
        print(f"Token scope: {token.get('scope', 'No scope in token')}")
        
        # Get user info using LinkedIn's OpenID Connect userinfo endpoint
        print("\nFetching user profile using OpenID Connect userinfo endpoint...")
        
        try:
            print("Making userinfo API request...")
            userinfo_resp = oauth.linkedin.get('https://api.linkedin.com/v2/userinfo')
            print(f"Userinfo response status: {userinfo_resp.status_code}")
            
            if userinfo_resp.status_code != 200:
                print(f"Failed to get user info from LinkedIn!")
                print(f"Response status: {userinfo_resp.status_code}")
                print(f"Response content: {userinfo_resp.text}")
                return standardize_error_response("Failed to get user profile", 400)
            
            userinfo_data = userinfo_resp.json()
            print(f"Userinfo data received: {list(userinfo_data.keys())}")
            
            # Extract user information from userinfo response (OpenID Connect format)
            provider_id = userinfo_data.get('sub')  # Subject identifier in OpenID Connect
            name = userinfo_data.get('name', '')    # Full name
            email = userinfo_data.get('email')      # Email address
            
            # Fallback to individual name fields if full name not available
            if not name:
                given_name = userinfo_data.get('given_name', '')
                family_name = userinfo_data.get('family_name', '')
                if given_name and family_name:
                    name = f"{given_name} {family_name}"
                elif given_name:
                    name = given_name
                elif family_name:
                    name = family_name
            
            print(f"Extracted info - Email: {email}, Name: {name}, Provider ID: {provider_id}")
            
            if not email or not provider_id:
                print("Missing required user information!")
                return standardize_error_response("Incomplete user information from LinkedIn", 400)
            
        except Exception as e:
            print(f"Exception during userinfo API request: {e}")
            print(f"Exception type: {type(e)}")
            return standardize_error_response("Failed to retrieve user information", 500)
        
        # Find or create user
        print("\nAttempting to find or create user...")
        user = find_or_create_oauth_user(email, name, 'linkedin', provider_id)
        
        if not user:
            print("Failed to find or create user!")
            return standardize_error_response("Failed to create user account", 500)
        
        print(f"User processed successfully - ID: {user['_id']}")
        
        # Create session
        session["user_id"] = str(user["_id"])
        print("Session created")
        
        # Redirect to frontend with success
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
        print(f"Redirecting to frontend: {frontend_url}/oauth/callback?success=true")
        return redirect(f"{frontend_url}/oauth/callback?success=true")
        
    except Exception as e:
        print("\nError in LinkedIn callback:")
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        print(f"Full error details: {repr(e)}")
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
        return redirect(f"{frontend_url}/oauth/callback?error=oauth_failed")


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