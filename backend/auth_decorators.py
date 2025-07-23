"""
Authentication Decorators and Middleware for JWT-based auth
"""
from functools import wraps
from flask import request, jsonify, session, current_app
from jwt_utils import verify_access_token, JWTError
import os

def jwt_required(optional=False):
    """
    Decorator to require JWT authentication
    
    Args:
        optional: If True, authentication is optional and won't return error if no token
    
    Usage:
        @jwt_required()
        def protected_endpoint():
            # Access current_user from g object
            pass
        
        @jwt_required(optional=True)
        def optional_auth_endpoint():
            # Check if g.current_user exists
            pass
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            from flask import g
            
            # Initialize current_user as None
            g.current_user = None
            g.current_user_id = None
            
            # Check for JWT token in Authorization header
            auth_header = request.headers.get('Authorization')
            token = None
            
            if auth_header:
                try:
                    # Expected format: "Bearer <token>"
                    parts = auth_header.split(' ')
                    if len(parts) == 2 and parts[0].lower() == 'bearer':
                        token = parts[1]
                except Exception as e:
                    print(f"Error parsing authorization header: {e}")
            
            # If no JWT token, fall back to session-based auth for backward compatibility
            if not token:
                user_id = session.get('user_id')
                if user_id:
                    from extensions import mongo
                    from flask_pymongo import ObjectId
                    
                    try:
                        user = mongo.db.users.find_one({'_id': ObjectId(user_id)})
                        if user and user.get('is_active', True):
                            g.current_user = user
                            g.current_user_id = str(user['_id'])
                    except Exception as e:
                        print(f"Error loading user from session: {e}")
                        session.clear()  # Clear invalid session
            
            # If we have a JWT token, verify it
            if token:
                try:
                    payload = verify_access_token(token)
                    
                    # Load full user data
                    from extensions import mongo
                    from flask_pymongo import ObjectId
                    
                    user = mongo.db.users.find_one({'_id': ObjectId(payload['user_id'])})
                    if user:
                        g.current_user = user
                        g.current_user_id = str(user['_id'])
                    
                except JWTError as e:
                    if not optional:
                        return jsonify({
                            'error': 'Authentication required',
                            'message': str(e)
                        }), 401
                except Exception as e:
                    print(f"Error verifying JWT token: {e}")
                    if not optional:
                        return jsonify({
                            'error': 'Authentication failed',
                            'message': 'Invalid token'
                        }), 401
            
            # If authentication is required and no valid user found
            if not optional and not g.current_user:
                return jsonify({
                    'error': 'Authentication required',
                    'message': 'Please provide a valid access token or log in'
                }), 401
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def admin_required():
    """
    Decorator to require admin role
    Must be used with @jwt_required()
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            from flask import g
            
            if not g.current_user:
                return jsonify({
                    'error': 'Authentication required',
                    'message': 'Please log in to access this resource'
                }), 401
            
            if g.current_user.get('role') != 'admin':
                return jsonify({
                    'error': 'Insufficient permissions',
                    'message': 'Admin access required'
                }), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def employer_required():
    """
    Decorator to require employer role
    Must be used with @jwt_required()
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            from flask import g
            
            if not g.current_user:
                return jsonify({
                    'error': 'Authentication required',
                    'message': 'Please log in to access this resource'
                }), 401
            
            user_role = g.current_user.get('role')
            if user_role not in ['employer', 'admin']:
                return jsonify({
                    'error': 'Insufficient permissions',
                    'message': 'Employer access required'
                }), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def role_required(allowed_roles):
    """
    Decorator to require specific roles
    
    Args:
        allowed_roles: List of allowed roles or single role string
    
    Usage:
        @role_required(['admin', 'employer'])
        def multi_role_endpoint():
            pass
        
        @role_required('job_seeker')
        def job_seeker_only():
            pass
    """
    if isinstance(allowed_roles, str):
        allowed_roles = [allowed_roles]
    
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            from flask import g
            
            if not g.current_user:
                return jsonify({
                    'error': 'Authentication required',
                    'message': 'Please log in to access this resource'
                }), 401
            
            user_role = g.current_user.get('role')
            if user_role not in allowed_roles:
                return jsonify({
                    'error': 'Insufficient permissions',
                    'message': f'One of the following roles required: {", ".join(allowed_roles)}'
                }), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def email_verified_required():
    """
    Decorator to require email verification
    Must be used with @jwt_required()
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            from flask import g
            
            if not g.current_user:
                return jsonify({
                    'error': 'Authentication required',
                    'message': 'Please log in to access this resource'
                }), 401
            
            if not g.current_user.get('email_verified', False):
                return jsonify({
                    'error': 'Email verification required',
                    'message': 'Please verify your email address to access this resource'
                }), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def rate_limit_by_user():
    """
    Basic rate limiting decorator (requires Redis for production)
    For now, this is a placeholder that can be implemented with Redis
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            from flask import g
            
            # TODO: Implement actual rate limiting with Redis
            # For now, just pass through
            
            # Example implementation would look like:
            # if g.current_user:
            #     user_id = str(g.current_user['_id'])
            #     if check_rate_limit(user_id):
            #         return jsonify({'error': 'Rate limit exceeded'}), 429
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def get_current_user():
    """
    Helper function to get current authenticated user
    
    Returns:
        User document or None if not authenticated
    """
    from flask import g
    return getattr(g, 'current_user', None)

def get_current_user_id():
    """
    Helper function to get current authenticated user ID
    
    Returns:
        User ID string or None if not authenticated
    """
    from flask import g
    return getattr(g, 'current_user_id', None)

def is_authenticated():
    """
    Helper function to check if user is authenticated
    
    Returns:
        Boolean indicating authentication status
    """
    from flask import g
    return getattr(g, 'current_user', None) is not None

def has_role(role):
    """
    Helper function to check if current user has specific role
    
    Args:
        role: Role string to check
    
    Returns:
        Boolean indicating if user has the role
    """
    from flask import g
    current_user = getattr(g, 'current_user', None)
    if not current_user:
        return False
    return current_user.get('role') == role

def has_any_role(roles):
    """
    Helper function to check if current user has any of the specified roles
    
    Args:
        roles: List of role strings to check
    
    Returns:
        Boolean indicating if user has any of the roles
    """
    from flask import g
    current_user = getattr(g, 'current_user', None)
    if not current_user:
        return False
    
    if isinstance(roles, str):
        roles = [roles]
    
    return current_user.get('role') in roles