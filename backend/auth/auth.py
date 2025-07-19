from flask import Blueprint, jsonify, request, session
from extensions import mongo, bcrypt  # Import from extensions
from flask_pymongo import ObjectId
import re

auth_bp = Blueprint("auth_bp", __name__)
users_db = mongo.db.users


@auth_bp.route("/login", methods=["POST"])
def login_user():
    data = request.get_json()
    email = data["email"]
    password = data["password"]
    user = users_db.find_one({"email": email})
    
    if not user:
        return jsonify({"error": "Check your email and password"}), 401
    
    if not bcrypt.check_password_hash(user["password"], password):
        return jsonify({"error": "Check your email and password"}), 401
    
    session["user_id"] = str(user["_id"])
    print("Session after login")
    print(session)
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


@auth_bp.route("/register", methods=["POST"])
def register_user():
    data = request.get_json()
    
    # Validate required fields
    required_fields = ["name", "email", "password", "role"]
    for field in required_fields:
        if not data.get(field):
            return jsonify({"message": f"{field.capitalize()} is required"}), 400
    
    name = data["name"].strip()
    email = data["email"].strip().lower()
    password = data["password"]
    role = data["role"]
    
    # Validate email format
    email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_regex, email):
        return jsonify({"message": "Please enter a valid email address"}), 400
    
    # Validate password strength
    if len(password) < 8:
        return jsonify({"message": "Password must be at least 8 characters"}), 400
    
    password_regex = r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$'
    if not re.match(password_regex, password):
        return jsonify({"message": "Password must contain at least one uppercase letter, one lowercase letter, one number and one special character"}), 400
    
    # Validate role
    if role not in ['job_seeker', 'employer']:
        return jsonify({"message": "Invalid role selected"}), 400
    
    # Validate name length
    if len(name) < 2 or len(name) > 100:
        return jsonify({"message": "Name must be between 2 and 100 characters"}), 400
    
    # Check if user already exists
    existing_user = users_db.find_one({"email": email})
    if existing_user:
        return jsonify({"message": "An account with this email already exists"}), 409
    
    # Hash password
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    
    # Create new user
    new_user = {
        "name": name,
        "email": email,
        "password": hashed_password,
        "role": role,
        "created_at": None,  # You can add datetime.utcnow() if needed
        "updated_at": None
    }
    
    try:
        result = users_db.insert_one(new_user)
        user_id = str(result.inserted_id)
        
        # Create session for the new user
        session["user_id"] = user_id
        
        # Return user data (similar to login response)
        return jsonify({
            "user": {
                "id": user_id,
                "email": email,
                "name": name,
                "role": role
            },
            "token": "session_token",  # Placeholder for token-based auth
            "refreshToken": "refresh_token"  # Placeholder for refresh token
        }), 201
        
    except Exception as e:
        print(f"Error creating user: {e}")
        return jsonify({"message": "Failed to create account. Please try again."}), 500


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
    print("Session before me: ")
    print(session)
    user_id = session.get("user_id")

    if not user_id:
        return jsonify({"error":"Unauthorized"}), 401
    
    user = users_db.find_one({"_id": ObjectId(user_id)})
    print("Found a user:", user)

    user["_id"] = str(user["_id"])
    user["password"] = ""
    
    return jsonify(
        user
    )