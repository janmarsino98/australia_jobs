"""
JWT Utility Functions for AusJobs
Handles JWT token creation, validation, and refresh mechanisms
"""
import os
import jwt
from datetime import datetime, timedelta, timezone
from flask import current_app, session
from extensions import mongo
from flask_pymongo import ObjectId
import secrets

# JWT Configuration
JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', secrets.token_urlsafe(32))
JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=15)  # Short-lived access tokens
JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)    # Long-lived refresh tokens
JWT_ALGORITHM = 'HS256'

# Database collections - accessed lazily to avoid import issues
def get_users_db():
    return mongo.db.users

def get_refresh_tokens_db():
    return mongo.db.refresh_tokens

class JWTError(Exception):
    """Custom JWT error class"""
    pass

def generate_access_token(user_id: str, user_data: dict = None) -> str:
    """
    Generate a short-lived JWT access token
    
    Args:
        user_id: User ID string
        user_data: Optional additional user data to include in token
    
    Returns:
        JWT access token string
    """
    try:
        now = datetime.now(timezone.utc)
        payload = {
            'user_id': user_id,
            'type': 'access',
            'iat': now,
            'exp': now + JWT_ACCESS_TOKEN_EXPIRES,
            'jti': secrets.token_urlsafe(16)  # JWT ID for token tracking
        }
        
        # Add additional user data if provided
        if user_data:
            payload.update({
                'email': user_data.get('email'),
                'role': user_data.get('role'),
                'email_verified': user_data.get('email_verified', False)
            })
        
        return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    except Exception as e:
        print(f"Error generating access token: {e}")
        raise JWTError("Failed to generate access token")

def generate_refresh_token(user_id: str) -> str:
    """
    Generate a long-lived JWT refresh token and store it in database
    
    Args:
        user_id: User ID string
    
    Returns:
        JWT refresh token string
    """
    try:
        now = datetime.now(timezone.utc)
        jti = secrets.token_urlsafe(32)  # Longer JTI for refresh tokens
        
        payload = {
            'user_id': user_id,
            'type': 'refresh',
            'iat': now,
            'exp': now + JWT_REFRESH_TOKEN_EXPIRES,
            'jti': jti
        }
        
        token = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
        
        # Store refresh token in database
        refresh_token_doc = {
            'jti': jti,
            'user_id': ObjectId(user_id),
            'created_at': now,
            'expires_at': now + JWT_REFRESH_TOKEN_EXPIRES,
            'is_revoked': False,
            'last_used': now
        }
        
        get_refresh_tokens_db().insert_one(refresh_token_doc)
        
        return token
    except Exception as e:
        print(f"Error generating refresh token: {e}")
        raise JWTError("Failed to generate refresh token")

def verify_access_token(token: str) -> dict:
    """
    Verify and decode JWT access token
    
    Args:
        token: JWT token string
    
    Returns:
        Decoded token payload
    
    Raises:
        JWTError: If token is invalid, expired, or not an access token
    """
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        
        # Verify token type
        if payload.get('type') != 'access':
            raise JWTError("Invalid token type")
        
        # Verify user still exists
        user = get_users_db().find_one({'_id': ObjectId(payload['user_id'])})
        if not user:
            raise JWTError("User not found")
        
        # Verify user is still active
        if not user.get('is_active', True):
            raise JWTError("User account is deactivated")
        
        return payload
    except jwt.ExpiredSignatureError:
        raise JWTError("Access token has expired")
    except jwt.InvalidTokenError as e:
        raise JWTError(f"Invalid access token: {str(e)}")
    except Exception as e:
        print(f"Error verifying access token: {e}")
        raise JWTError("Token verification failed")

def verify_refresh_token(token: str) -> dict:
    """
    Verify and decode JWT refresh token
    
    Args:
        token: JWT refresh token string
    
    Returns:
        Decoded token payload
    
    Raises:
        JWTError: If token is invalid, expired, revoked, or not a refresh token
    """
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        
        # Verify token type
        if payload.get('type') != 'refresh':
            raise JWTError("Invalid token type")
        
        # Check if token exists and is not revoked in database
        token_doc = get_refresh_tokens_db().find_one({
            'jti': payload['jti'],
            'user_id': ObjectId(payload['user_id']),
            'is_revoked': False
        })
        
        if not token_doc:
            raise JWTError("Refresh token not found or revoked")
        
        # Verify user still exists and is active
        user = get_users_db().find_one({'_id': ObjectId(payload['user_id'])})
        if not user:
            raise JWTError("User not found")
        
        if not user.get('is_active', True):
            raise JWTError("User account is deactivated")
        
        # Update last used timestamp
        get_refresh_tokens_db().update_one(
            {'jti': payload['jti']},
            {'$set': {'last_used': datetime.now(timezone.utc)}}
        )
        
        return payload
    except jwt.ExpiredSignatureError:
        # Mark expired token as revoked
        try:
            expired_payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM], options={"verify_exp": False})
            get_refresh_tokens_db().update_one(
                {'jti': expired_payload.get('jti')},
                {'$set': {'is_revoked': True, 'revoked_at': datetime.now(timezone.utc)}}
            )
        except:
            pass
        raise JWTError("Refresh token has expired")
    except jwt.InvalidTokenError as e:
        raise JWTError(f"Invalid refresh token: {str(e)}")
    except Exception as e:
        print(f"Error verifying refresh token: {e}")
        raise JWTError("Refresh token verification failed")

def refresh_access_token(refresh_token: str) -> dict:
    """
    Generate new access token using valid refresh token
    
    Args:
        refresh_token: Valid JWT refresh token
    
    Returns:
        Dictionary containing new access token and user data
    
    Raises:
        JWTError: If refresh token is invalid
    """
    try:
        # Verify refresh token
        refresh_payload = verify_refresh_token(refresh_token)
        user_id = refresh_payload['user_id']
        
        # Get current user data
        user = get_users_db().find_one({'_id': ObjectId(user_id)})
        if not user:
            raise JWTError("User not found")
        
        # Generate new access token with current user data
        user_data = {
            'email': user['email'],
            'role': user.get('role', 'job_seeker'),
            'email_verified': user.get('email_verified', False)
        }
        
        new_access_token = generate_access_token(user_id, user_data)
        
        return {
            'access_token': new_access_token,
            'user': {
                'id': str(user['_id']),
                'email': user['email'],
                'name': user.get('name', ''),
                'role': user.get('role', 'job_seeker'),
                'email_verified': user.get('email_verified', False)
            }
        }
    except Exception as e:
        print(f"Error refreshing access token: {e}")
        if isinstance(e, JWTError):
            raise
        raise JWTError("Failed to refresh access token")

def revoke_refresh_token(token: str) -> bool:
    """
    Revoke a specific refresh token
    
    Args:
        token: JWT refresh token to revoke
    
    Returns:
        True if token was revoked successfully
    """
    try:
        # Decode token to get JTI (don't verify expiration for revocation)
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM], options={"verify_exp": False})
        
        if payload.get('type') != 'refresh':
            return False
        
        # Mark token as revoked in database
        result = get_refresh_tokens_db().update_one(
            {'jti': payload['jti']},
            {
                '$set': {
                    'is_revoked': True,
                    'revoked_at': datetime.now(timezone.utc)
                }
            }
        )
        
        return result.modified_count > 0
    except Exception as e:
        print(f"Error revoking refresh token: {e}")
        return False

def revoke_all_user_tokens(user_id: str) -> int:
    """
    Revoke all refresh tokens for a specific user
    
    Args:
        user_id: User ID string
    
    Returns:
        Number of tokens revoked
    """
    try:
        result = get_refresh_tokens_db().update_many(
            {
                'user_id': ObjectId(user_id),
                'is_revoked': False
            },
            {
                '$set': {
                    'is_revoked': True,
                    'revoked_at': datetime.now(timezone.utc)
                }
            }
        )
        
        return result.modified_count
    except Exception as e:
        print(f"Error revoking all user tokens: {e}")
        return 0

def cleanup_expired_tokens():
    """
    Clean up expired refresh tokens from database
    Should be called periodically (e.g., via cron job)
    
    Returns:
        Number of tokens cleaned up
    """
    try:
        now = datetime.now(timezone.utc)
        
        # Delete expired tokens
        result = get_refresh_tokens_db().delete_many({
            'expires_at': {'$lt': now}
        })
        
        print(f"Cleaned up {result.deleted_count} expired refresh tokens")
        return result.deleted_count
    except Exception as e:
        print(f"Error cleaning up expired tokens: {e}")
        return 0

def get_user_active_tokens(user_id: str) -> list:
    """
    Get all active refresh tokens for a user
    
    Args:
        user_id: User ID string
    
    Returns:
        List of active token documents
    """
    try:
        tokens = get_refresh_tokens_db().find({
            'user_id': ObjectId(user_id),
            'is_revoked': False,
            'expires_at': {'$gt': datetime.now(timezone.utc)}
        }).sort('created_at', -1)
        
        return list(tokens)
    except Exception as e:
        print(f"Error getting user active tokens: {e}")
        return []

def create_token_pair(user_id: str, user_data: dict = None) -> dict:
    """
    Create both access and refresh tokens for a user
    
    Args:
        user_id: User ID string
        user_data: Optional user data to include in access token
    
    Returns:
        Dictionary containing both tokens and expiration info
    """
    try:
        access_token = generate_access_token(user_id, user_data)
        refresh_token = generate_refresh_token(user_id)
        
        return {
            'access_token': access_token,
            'refresh_token': refresh_token,
            'access_token_expires_in': int(JWT_ACCESS_TOKEN_EXPIRES.total_seconds()),
            'refresh_token_expires_in': int(JWT_REFRESH_TOKEN_EXPIRES.total_seconds()),
            'token_type': 'Bearer'
        }
    except Exception as e:
        print(f"Error creating token pair: {e}")
        raise JWTError("Failed to create authentication tokens")