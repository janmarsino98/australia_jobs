"""
Utility functions and decorators for the Flask application
"""
from flask import jsonify, request, session
from functools import wraps
from extensions import mongo
from flask_pymongo import ObjectId
import re

def validate_email(email):
    """Validate email format"""
    email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(email_regex, email) is not None

def validate_password(password):
    """Validate password strength"""
    if len(password) < 8:
        return False, "Password must be at least 8 characters"
    
    password_regex = r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$'
    if not re.match(password_regex, password):
        return False, "Password must contain at least one uppercase letter, one lowercase letter, one number and one special character"
    
    return True, "Valid password"

def validate_name(name):
    """Validate name format and length"""
    if not name or len(name.strip()) < 2:
        return False, "Name must be at least 2 characters"
    if len(name.strip()) > 100:
        return False, "Name must be less than 100 characters"
    return True, "Valid name"

def validate_required_fields(data, required_fields):
    """Validate that all required fields are present and not empty"""
    missing_fields = []
    for field in required_fields:
        if not data.get(field) or (isinstance(data[field], str) and not data[field].strip()):
            missing_fields.append(field)
    
    if missing_fields:
        return False, f"Missing required fields: {', '.join(missing_fields)}"
    return True, "All required fields present"

def require_auth(f):
    """Decorator to require authentication for routes"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user_id = session.get("user_id")
        if not user_id:
            return jsonify({"error": "Authentication required"}), 401
        
        # Verify user still exists
        try:
            user = mongo.db.users.find_one({"_id": ObjectId(user_id)})
            if not user:
                session.clear()
                return jsonify({"error": "User not found"}), 401
        except:
            session.clear()
            return jsonify({"error": "Invalid session"}), 401
        
        return f(*args, **kwargs)
    return decorated_function

def standardize_error_response(message, status_code=400):
    """Standardize error response format"""
    return jsonify({"error": message}), status_code

def standardize_success_response(data, message=None, status_code=200):
    """Standardize success response format"""
    response = data
    if message:
        response["message"] = message
    return jsonify(response), status_code

def validate_json_request(f):
    """Decorator to validate that request contains valid JSON"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not request.is_json:
            return standardize_error_response("Content-Type must be application/json", 400)
        
        data = request.get_json()
        if data is None:
            return standardize_error_response("Invalid JSON data", 400)
        
        return f(*args, **kwargs)
    return decorated_function 