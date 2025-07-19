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
    
    # LinkedIn OAuth configuration (Modern scopes without JWT complications)
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
                'scope': 'profile email',  # Reliable scopes without JWT validation complexity
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
    """Find existing user or create new OAuth user (handles missing email)"""
    try:
        existing_user = None
        
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
                print(f"Added {provider} OAuth info to existing user")
            
            # Update email if we have one and the user doesn't
            if email and not existing_user.get("email"):
                users_db.update_one(
                    {"_id": existing_user["_id"]},
                    {
                        "$set": {
                            "email": email,
                            "email_verified": True,
                            "updated_at": datetime.utcnow()
                        }
                    }
                )
                print(f"Updated existing user with email: {email}")
                existing_user["email"] = email
            
            return existing_user
        
        # Create new user with OAuth
        now = datetime.utcnow()
        new_user = {
            "name": name,
            "role": "job_seeker",  # Default role for OAuth users
            "oauth_accounts": {
                provider: {
                    "provider_id": provider_id,
                    "connected_at": now
                }
            },
            "created_at": now,
            "updated_at": now
        }
        
        # Add email fields only if we have an email
        if email:
            new_user["email"] = email
            new_user["email_verified"] = True  # OAuth providers verify emails
            print(f"Creating new user with email: {email}")
        else:
            # Create a placeholder email based on provider and ID for internal use
            new_user["email"] = f"{provider}_{provider_id}@oauth.placeholder"
            new_user["email_verified"] = False
            new_user["email_placeholder"] = True  # Flag to indicate this is a placeholder
            print(f"Creating new user with placeholder email (no email permission from {provider})")
        
        result = users_db.insert_one(new_user)
        new_user["_id"] = result.inserted_id
        print(f"Created new user with ID: {result.inserted_id}")
        return new_user
        
    except Exception as e:
        print(f"Error in find_or_create_oauth_user: {e}")
        print(f"Parameters: email={email}, name={name}, provider={provider}, provider_id={provider_id}")
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
        
        # Get user info using LinkedIn's API endpoints with comprehensive fallback
        print("\nFetching user profile using LinkedIn API...")
        
        try:
            print("Attempting userinfo endpoint first...")
            userinfo_resp = oauth.linkedin.get('https://api.linkedin.com/v2/userinfo')
            print(f"Userinfo response status: {userinfo_resp.status_code}")
            
            if userinfo_resp.status_code == 200:
                # Success with userinfo endpoint
                userinfo_data = userinfo_resp.json()
                print(f"Userinfo data received: {list(userinfo_data.keys())}")
                
                provider_id = userinfo_data.get('sub')
                name = userinfo_data.get('name', '')
                email = userinfo_data.get('email')
                
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
                
                print(f"Extracted from userinfo - Email: {email}, Name: {name}, Provider ID: {provider_id}")
                
            elif userinfo_resp.status_code == 403:
                print("Userinfo endpoint not accessible (403), trying traditional endpoints...")
                
                # Try traditional LinkedIn v2 API endpoints
                print("Attempting profile from v2/me...")
                profile_resp = oauth.linkedin.get('https://api.linkedin.com/v2/me')
                print(f"Profile response status: {profile_resp.status_code}")
                
                if profile_resp.status_code == 200:
                    profile_data = profile_resp.json()
                    print(f"Profile data received: {list(profile_data.keys())}")
                    
                    # Extract profile information
                    provider_id = profile_data.get('id')
                    name = ''
                    
                    # Build name from LinkedIn profile (v2 API format)
                    if 'firstName' in profile_data and 'localized' in profile_data['firstName']:
                        localized_first = profile_data['firstName']['localized']
                        first_name = next(iter(localized_first.values())) if localized_first else ''
                    else:
                        first_name = ''
                    
                    if 'lastName' in profile_data and 'localized' in profile_data['lastName']:
                        localized_last = profile_data['lastName']['localized']
                        last_name = next(iter(localized_last.values())) if localized_last else ''
                    else:
                        last_name = ''
                    
                    # Combine names
                    if first_name and last_name:
                        name = f"{first_name} {last_name}"
                    elif first_name:
                        name = first_name
                    elif last_name:
                        name = last_name
                    
                    # Get email from separate endpoint
                    print("Attempting email from v2/emailAddress...")
                    email_resp = oauth.linkedin.get('https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))')
                    print(f"Email response status: {email_resp.status_code}")
                    
                    if email_resp.status_code == 200:
                        email_data = email_resp.json()
                        print(f"Email data received: {list(email_data.keys())}")
                        
                        # Extract email from response
                        email = None
                        if 'elements' in email_data and email_data['elements']:
                            email_element = email_data['elements'][0]
                            if 'handle~' in email_element and 'emailAddress' in email_element['handle~']:
                                email = email_element['handle~']['emailAddress']
                    
                    elif email_resp.status_code == 403:
                        print("Email endpoint also giving 403 - LinkedIn app has very limited permissions")
                        email = None  # Will handle this below
                    else:
                        print(f"Email endpoint unexpected status: {email_resp.status_code}")
                        email = None
                    
                    print(f"Extracted from v2 APIs - Email: {email}, Name: {name}, Provider ID: {provider_id}")
                    
                elif profile_resp.status_code == 403:
                    print("Traditional profile endpoint also giving 403!")
                    print("This indicates LinkedIn app has very restricted permissions")
                    print("Attempting to extract basic info from token or create minimal user...")
                    
                    # Last resort: try to extract info from token or create minimal user
                    # LinkedIn still provides some basic info in certain contexts
                    provider_id = None
                    name = "LinkedIn User"  # Generic fallback
                    email = None
                    
                    # Try to get any identifier from token
                    if 'sub' in token:
                        provider_id = token.get('sub')
                        print(f"Found sub in token: {provider_id}")
                    elif 'user_id' in token:
                        provider_id = token.get('user_id')
                        print(f"Found user_id in token: {provider_id}")
                    else:
                        # Generate a temporary ID based on client ID and timestamp
                        import time
                        provider_id = f"linkedin_user_{int(time.time())}"
                        print(f"Generated temporary provider ID: {provider_id}")
                    
                    # Check if token contains any user info
                    for key in ['name', 'email', 'given_name', 'family_name']:
                        if key in token:
                            if key == 'name':
                                name = token[key]
                            elif key == 'email':
                                email = token[key]
                            elif key in ['given_name', 'family_name'] and name == "LinkedIn User":
                                if key == 'given_name':
                                    name = token[key]
                    
                    print(f"Minimal user data - Email: {email}, Name: {name}, Provider ID: {provider_id}")
                    
                    if not provider_id:
                        print("Cannot create user without any identifier!")
                        return standardize_error_response(
                            "LinkedIn authentication failed - insufficient permissions. "
                            "Please contact support or try a different sign-in method.", 
                            400
                        )
                
                else:
                    print(f"Profile endpoint unexpected status: {profile_resp.status_code}")
                    print(f"Response: {profile_resp.text}")
                    return standardize_error_response("Failed to get user profile", 400)
            
            else:
                print(f"Userinfo endpoint unexpected status: {userinfo_resp.status_code}")
                print(f"Response: {userinfo_resp.text}")
                return standardize_error_response("Failed to get user information", 400)
            
            # Validate we have minimum required information
            if not provider_id:
                print("Critical error: No provider ID obtained from any source!")
                return standardize_error_response(
                    "LinkedIn authentication failed - unable to identify user. "
                    "Please contact support.", 
                    400
                )
            
            # Email is optional - some LinkedIn apps don't have email permission
            if not email:
                print("Warning: No email obtained - this may limit some features")
                # You might want to generate a placeholder email or handle this case
                # email = f"{provider_id}@linkedin.placeholder"
            
            # Name is optional but recommended
            if not name:
                name = "LinkedIn User"
                print("Warning: No name obtained - using fallback")
            
            print(f"Final user data - Email: {email}, Name: {name}, Provider ID: {provider_id}")
            
        except Exception as e:
            print(f"Exception during API request: {e}")
            print(f"Exception type: {type(e)}")
            return standardize_error_response(
                "LinkedIn authentication failed due to API error. Please try again.", 
                500
            )
        
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