"""
OAuth Utility Functions for Enhanced Error Handling
Handles OAuth errors, rate limiting, and token refresh scenarios
"""
import os
import requests
import time
from datetime import datetime, timedelta
from flask import session, current_app
from extensions import mongo
from typing import Dict, Optional, Tuple
import logging

# Database collections
oauth_errors_db = mongo.db.oauth_errors
oauth_rate_limits_db = mongo.db.oauth_rate_limits

class OAuthError(Exception):
    """Custom OAuth error class"""
    def __init__(self, message: str, error_code: str = None, provider: str = None):
        self.message = message
        self.error_code = error_code
        self.provider = provider
        super().__init__(self.message)

class OAuthRateLimitError(OAuthError):
    """OAuth rate limit exceeded error"""
    def __init__(self, provider: str, retry_after: int = None):
        message = f"Rate limit exceeded for {provider}"
        if retry_after:
            message += f". Retry after {retry_after} seconds"
        super().__init__(message, "rate_limit", provider)
        self.retry_after = retry_after

def log_oauth_error(provider: str, error_type: str, error_details: Dict, user_id: str = None):
    """
    Log OAuth errors for monitoring and debugging
    
    Args:
        provider: OAuth provider name (google, linkedin, etc.)
        error_type: Type of error (auth_failed, token_revoked, rate_limit, etc.)
        error_details: Dictionary with error details
        user_id: Optional user ID associated with the error
    """
    try:
        error_doc = {
            'provider': provider,
            'error_type': error_type,
            'error_details': error_details,
            'user_id': user_id,
            'timestamp': datetime.utcnow(),
            'ip_address': None,  # Could be extracted from request if needed
            'user_agent': None   # Could be extracted from request if needed
        }
        
        oauth_errors_db.insert_one(error_doc)
        
        # Also log to application logger
        logging.error(f"OAuth Error - Provider: {provider}, Type: {error_type}, Details: {error_details}")
        
    except Exception as e:
        print(f"Failed to log OAuth error: {e}")

def handle_oauth_token_revocation(provider: str, user_id: str) -> bool:
    """
    Handle cases where OAuth token has been revoked by user
    
    Args:
        provider: OAuth provider name
        user_id: User ID
    
    Returns:
        True if handled successfully
    """
    try:
        from extensions import mongo
        from flask_pymongo import ObjectId
        
        # Remove OAuth account data from user record
        users_db = mongo.db.users
        
        result = users_db.update_one(
            {'_id': ObjectId(user_id)},
            {
                '$unset': {f'oauth_accounts.{provider}': ''},
                '$set': {'updated_at': datetime.utcnow()}
            }
        )
        
        # Log the revocation
        log_oauth_error(provider, 'token_revoked', {
            'user_id': user_id,
            'action': 'removed_oauth_account'
        }, user_id)
        
        print(f"Removed revoked {provider} OAuth account for user {user_id}")
        return result.modified_count > 0
        
    except Exception as e:
        print(f"Error handling OAuth token revocation: {e}")
        return False

def check_oauth_rate_limit(provider: str, identifier: str = None) -> Tuple[bool, Optional[int]]:
    """
    Check if OAuth provider rate limit has been exceeded
    
    Args:
        provider: OAuth provider name
        identifier: Optional identifier (IP address, user ID, etc.)
    
    Returns:
        Tuple of (is_rate_limited, retry_after_seconds)
    """
    try:
        now = datetime.utcnow()
        rate_limit_key = f"{provider}:{identifier or 'global'}"
        
        # Check existing rate limit record
        rate_limit_doc = oauth_rate_limits_db.find_one({
            'key': rate_limit_key,
            'expires_at': {'$gt': now}
        })
        
        if rate_limit_doc:
            retry_after = int((rate_limit_doc['expires_at'] - now).total_seconds())
            return True, retry_after
        
        return False, None
        
    except Exception as e:
        print(f"Error checking OAuth rate limit: {e}")
        return False, None

def set_oauth_rate_limit(provider: str, duration_seconds: int, identifier: str = None):
    """
    Set OAuth rate limit for a provider
    
    Args:
        provider: OAuth provider name
        duration_seconds: Duration of rate limit in seconds
        identifier: Optional identifier (IP address, user ID, etc.)
    """
    try:
        now = datetime.utcnow()
        expires_at = now + timedelta(seconds=duration_seconds)
        rate_limit_key = f"{provider}:{identifier or 'global'}"
        
        oauth_rate_limits_db.update_one(
            {'key': rate_limit_key},
            {
                '$set': {
                    'key': rate_limit_key,
                    'provider': provider,
                    'identifier': identifier,
                    'created_at': now,
                    'expires_at': expires_at,
                    'duration_seconds': duration_seconds
                }
            },
            upsert=True
        )
        
        print(f"Set OAuth rate limit for {provider} for {duration_seconds} seconds")
        
    except Exception as e:
        print(f"Error setting OAuth rate limit: {e}")

def handle_google_oauth_error(error_details: Dict) -> Dict:
    """
    Handle Google-specific OAuth errors
    
    Args:
        error_details: Dictionary containing error information
    
    Returns:
        Dictionary with user-friendly error message and redirect URL
    """
    error = error_details.get('error', '')
    error_description = error_details.get('error_description', '')
    
    if error == 'access_denied':
        return {
            'user_message': 'Google sign-in was cancelled',
            'redirect_error': 'oauth_cancelled',
            'log_level': 'info'
        }
    elif error == 'invalid_request':
        return {
            'user_message': 'Invalid OAuth request to Google',
            'redirect_error': 'oauth_invalid_request',
            'log_level': 'error'
        }
    elif error == 'server_error':
        return {
            'user_message': 'Google servers are temporarily unavailable',
            'redirect_error': 'oauth_server_error',
            'log_level': 'error'
        }
    elif error == 'temporarily_unavailable':
        return {
            'user_message': 'Google OAuth is temporarily unavailable',
            'redirect_error': 'oauth_temporarily_unavailable',
            'log_level': 'warning'
        }
    elif 'rate' in error.lower() or 'quota' in error_description.lower():
        # Set rate limit for 1 hour
        set_oauth_rate_limit('google', 3600)
        return {
            'user_message': 'Too many Google sign-in attempts. Please try again later',
            'redirect_error': 'oauth_rate_limited',
            'log_level': 'warning'
        }
    else:
        return {
            'user_message': 'Google sign-in failed. Please try again',
            'redirect_error': 'oauth_unknown_error',
            'log_level': 'error'
        }

def handle_linkedin_oauth_error(error_details: Dict) -> Dict:
    """
    Handle LinkedIn-specific OAuth errors
    
    Args:
        error_details: Dictionary containing error information
    
    Returns:
        Dictionary with user-friendly error message and redirect URL
    """
    error = error_details.get('error', '')
    error_description = error_details.get('error_description', '')
    status_code = error_details.get('status_code', 0)
    
    if error == 'access_denied' or error == 'user_cancelled_login':
        return {
            'user_message': 'LinkedIn sign-in was cancelled',
            'redirect_error': 'oauth_cancelled',
            'log_level': 'info'
        }
    elif status_code == 401:
        return {
            'user_message': 'LinkedIn authentication failed. Please try again',
            'redirect_error': 'oauth_unauthorized',
            'log_level': 'warning'
        }
    elif status_code == 403:
        return {
            'user_message': 'LinkedIn app permissions insufficient. Please contact support',
            'redirect_error': 'oauth_permissions_error',
            'log_level': 'error'
        }
    elif status_code == 429 or 'throttle' in error_description.lower():
        # Set rate limit for 1 hour
        set_oauth_rate_limit('linkedin', 3600)
        return {
            'user_message': 'Too many LinkedIn sign-in attempts. Please try again in an hour',
            'redirect_error': 'oauth_rate_limited',
            'log_level': 'warning'
        }
    elif status_code >= 500:
        return {
            'user_message': 'LinkedIn servers are experiencing issues. Please try again later',
            'redirect_error': 'oauth_server_error',
            'log_level': 'error'
        }
    else:
        return {
            'user_message': 'LinkedIn sign-in failed. Please try again',
            'redirect_error': 'oauth_unknown_error',
            'log_level': 'error'
        }

def retry_oauth_request(func, max_retries: int = 3, backoff_factor: float = 1.0):
    """
    Retry OAuth requests with exponential backoff
    
    Args:
        func: Function to retry
        max_retries: Maximum number of retry attempts
        backoff_factor: Backoff multiplier between retries
    
    Returns:
        Result of function call or raises exception
    """
    for attempt in range(max_retries + 1):
        try:
            return func()
        except requests.exceptions.RequestException as e:
            if attempt == max_retries:
                raise
            
            # Calculate backoff time
            backoff_time = backoff_factor * (2 ** attempt)
            print(f"OAuth request failed (attempt {attempt + 1}/{max_retries + 1}), retrying in {backoff_time}s: {e}")
            time.sleep(backoff_time)
        except Exception as e:
            # Don't retry non-request exceptions
            raise

def validate_oauth_state(expected_state: str, received_state: str, provider: str) -> bool:
    """
    Validate OAuth state parameter for CSRF protection
    
    Args:
        expected_state: State stored in session
        received_state: State received in callback
        provider: OAuth provider name
    
    Returns:
        True if states match
    """
    if not expected_state or not received_state:
        log_oauth_error(provider, 'invalid_state', {
            'expected_state': bool(expected_state),
            'received_state': bool(received_state),
            'reason': 'missing_state'
        })
        return False
    
    if expected_state != received_state:
        log_oauth_error(provider, 'invalid_state', {
            'expected_state': expected_state[:10] + '...' if len(expected_state) > 10 else expected_state,
            'received_state': received_state[:10] + '...' if len(received_state) > 10 else received_state,
            'reason': 'state_mismatch'
        })
        return False
    
    return True

def cleanup_oauth_logs(days_to_keep: int = 30):
    """
    Clean up old OAuth error logs
    
    Args:
        days_to_keep: Number of days to keep logs
    
    Returns:
        Number of logs cleaned up
    """
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=days_to_keep)
        
        # Clean up error logs
        error_result = oauth_errors_db.delete_many({
            'timestamp': {'$lt': cutoff_date}
        })
        
        # Clean up rate limit records
        rate_limit_result = oauth_rate_limits_db.delete_many({
            'created_at': {'$lt': cutoff_date}
        })
        
        print(f"Cleaned up {error_result.deleted_count} OAuth error logs and {rate_limit_result.deleted_count} rate limit records")
        return error_result.deleted_count + rate_limit_result.deleted_count
        
    except Exception as e:
        print(f"Error cleaning up OAuth logs: {e}")
        return 0

def get_oauth_error_stats(provider: str = None, days: int = 7) -> Dict:
    """
    Get OAuth error statistics for monitoring
    
    Args:
        provider: Optional provider filter
        days: Number of days to analyze
    
    Returns:
        Dictionary with error statistics
    """
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        # Build match query
        match_query = {'timestamp': {'$gte': cutoff_date}}
        if provider:
            match_query['provider'] = provider
        
        # Aggregate error statistics
        pipeline = [
            {'$match': match_query},
            {
                '$group': {
                    '_id': {
                        'provider': '$provider',
                        'error_type': '$error_type'
                    },
                    'count': {'$sum': 1},
                    'latest_error': {'$max': '$timestamp'}
                }
            },
            {'$sort': {'count': -1}}
        ]
        
        results = list(oauth_errors_db.aggregate(pipeline))
        
        # Format results
        stats = {
            'total_errors': len(results),
            'time_period_days': days,
            'errors_by_provider': {},
            'errors_by_type': {},
            'details': []
        }
        
        for result in results:
            provider_name = result['_id']['provider']
            error_type = result['_id']['error_type']
            count = result['count']
            
            # Count by provider
            if provider_name not in stats['errors_by_provider']:
                stats['errors_by_provider'][provider_name] = 0
            stats['errors_by_provider'][provider_name] += count
            
            # Count by error type
            if error_type not in stats['errors_by_type']:
                stats['errors_by_type'][error_type] = 0
            stats['errors_by_type'][error_type] += count
            
            # Add to details
            stats['details'].append({
                'provider': provider_name,
                'error_type': error_type,
                'count': count,
                'latest_error': result['latest_error'].isoformat()
            })
        
        return stats
        
    except Exception as e:
        print(f"Error getting OAuth error stats: {e}")
        return {
            'error': f'Failed to get statistics: {str(e)}',
            'total_errors': 0,
            'time_period_days': days
        }