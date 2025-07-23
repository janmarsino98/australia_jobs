"""
Account Lockout System for AusJobs
Handles failed login attempts and account lockouts for security
"""
import os
from datetime import datetime, timedelta
from extensions import mongo
from flask_pymongo import ObjectId
from typing import Dict, Tuple, Optional

# Database collections
failed_attempts_db = mongo.db.failed_login_attempts
account_lockouts_db = mongo.db.account_lockouts

# Configuration
MAX_FAILED_ATTEMPTS = int(os.getenv('MAX_FAILED_ATTEMPTS', '5'))
LOCKOUT_DURATION_MINUTES = int(os.getenv('LOCKOUT_DURATION_MINUTES', '30'))
ATTEMPT_WINDOW_MINUTES = int(os.getenv('ATTEMPT_WINDOW_MINUTES', '15'))

class AccountLockoutError(Exception):
    """Account lockout error"""
    def __init__(self, message: str, locked_until: datetime = None):
        self.message = message
        self.locked_until = locked_until
        super().__init__(self.message)

def record_failed_login(identifier: str, identifier_type: str = 'email', ip_address: str = None, user_agent: str = None):
    """
    Record a failed login attempt
    
    Args:
        identifier: Email, user ID, or other identifier
        identifier_type: Type of identifier ('email', 'user_id', 'ip')
        ip_address: Optional IP address
        user_agent: Optional user agent string
    """
    try:
        attempt_doc = {
            'identifier': identifier,
            'identifier_type': identifier_type,
            'ip_address': ip_address,
            'user_agent': user_agent,
            'timestamp': datetime.utcnow(),
            'resolved': False
        }
        
        failed_attempts_db.insert_one(attempt_doc)
        print(f"Recorded failed login attempt for {identifier_type}: {identifier}")
        
    except Exception as e:
        print(f"Error recording failed login attempt: {e}")

def get_failed_attempt_count(identifier: str, identifier_type: str = 'email', window_minutes: int = ATTEMPT_WINDOW_MINUTES) -> int:
    """
    Get count of failed attempts within time window
    
    Args:
        identifier: Identifier to check
        identifier_type: Type of identifier
        window_minutes: Time window in minutes to check
    
    Returns:
        Number of failed attempts in time window
    """
    try:
        cutoff_time = datetime.utcnow() - timedelta(minutes=window_minutes)
        
        count = failed_attempts_db.count_documents({
            'identifier': identifier,
            'identifier_type': identifier_type,
            'timestamp': {'$gte': cutoff_time},
            'resolved': False
        })
        
        return count
        
    except Exception as e:
        print(f"Error getting failed attempt count: {e}")
        return 0

def is_account_locked(identifier: str, identifier_type: str = 'email') -> Tuple[bool, Optional[datetime]]:
    """
    Check if account is currently locked
    
    Args:
        identifier: Identifier to check
        identifier_type: Type of identifier
    
    Returns:
        Tuple of (is_locked, locked_until_datetime)
    """
    try:
        now = datetime.utcnow()
        
        # Check for active lockout
        lockout_doc = account_lockouts_db.find_one({
            'identifier': identifier,
            'identifier_type': identifier_type,
            'locked_until': {'$gt': now},
            'is_active': True
        })
        
        if lockout_doc:
            return True, lockout_doc['locked_until']
        
        return False, None
        
    except Exception as e:
        print(f"Error checking account lock status: {e}")
        return False, None

def lock_account(identifier: str, identifier_type: str = 'email', duration_minutes: int = LOCKOUT_DURATION_MINUTES, reason: str = 'Too many failed login attempts') -> datetime:
    """
    Lock an account for specified duration
    
    Args:
        identifier: Identifier to lock
        identifier_type: Type of identifier
        duration_minutes: Duration of lockout in minutes
        reason: Reason for lockout
    
    Returns:
        Datetime when lockout expires
    """
    try:
        now = datetime.utcnow()
        locked_until = now + timedelta(minutes=duration_minutes)
        
        # Check if there's already an active lockout
        existing_lockout = account_lockouts_db.find_one({
            'identifier': identifier,
            'identifier_type': identifier_type,
            'is_active': True
        })
        
        if existing_lockout and existing_lockout['locked_until'] > now:
            # Extend existing lockout
            account_lockouts_db.update_one(
                {'_id': existing_lockout['_id']},
                {
                    '$set': {
                        'locked_until': locked_until,
                        'updated_at': now,
                        'reason': reason,
                        'lockout_count': existing_lockout.get('lockout_count', 1) + 1
                    }
                }
            )
            print(f"Extended lockout for {identifier_type}: {identifier} until {locked_until}")
        else:
            # Create new lockout
            lockout_doc = {
                'identifier': identifier,
                'identifier_type': identifier_type,
                'locked_at': now,
                'locked_until': locked_until,
                'reason': reason,
                'is_active': True,
                'lockout_count': 1,
                'created_at': now,
                'updated_at': now
            }
            
            # Deactivate any old lockouts for this identifier
            account_lockouts_db.update_many(
                {
                    'identifier': identifier,
                    'identifier_type': identifier_type,
                    'is_active': True
                },
                {'$set': {'is_active': False}}
            )
            
            account_lockouts_db.insert_one(lockout_doc)
            print(f"Locked {identifier_type}: {identifier} until {locked_until}")
        
        return locked_until
        
    except Exception as e:
        print(f"Error locking account: {e}")
        raise AccountLockoutError("Failed to lock account")

def unlock_account(identifier: str, identifier_type: str = 'email', reason: str = 'Manual unlock') -> bool:
    """
    Manually unlock an account
    
    Args:
        identifier: Identifier to unlock
        identifier_type: Type of identifier
        reason: Reason for unlocking
    
    Returns:
        True if account was unlocked
    """
    try:
        now = datetime.utcnow()
        
        # Deactivate active lockouts
        result = account_lockouts_db.update_many(
            {
                'identifier': identifier,
                'identifier_type': identifier_type,
                'is_active': True
            },
            {
                '$set': {
                    'is_active': False,
                    'unlocked_at': now,
                    'unlock_reason': reason,
                    'updated_at': now
                }
            }
        )
        
        # Clear recent failed attempts
        clear_failed_attempts(identifier, identifier_type)
        
        if result.modified_count > 0:
            print(f"Unlocked {identifier_type}: {identifier}")
            return True
        
        return False
        
    except Exception as e:
        print(f"Error unlocking account: {e}")
        return False

def clear_failed_attempts(identifier: str, identifier_type: str = 'email'):
    """
    Clear failed login attempts for an identifier
    
    Args:
        identifier: Identifier to clear attempts for
        identifier_type: Type of identifier
    """
    try:
        # Mark failed attempts as resolved
        failed_attempts_db.update_many(
            {
                'identifier': identifier,
                'identifier_type': identifier_type,
                'resolved': False
            },
            {
                '$set': {
                    'resolved': True,
                    'resolved_at': datetime.utcnow()
                }
            }
        )
        
        print(f"Cleared failed attempts for {identifier_type}: {identifier}")
        
    except Exception as e:
        print(f"Error clearing failed attempts: {e}")

def check_and_handle_failed_login(identifier: str, identifier_type: str = 'email', ip_address: str = None, user_agent: str = None) -> Tuple[bool, Optional[datetime]]:
    """
    Handle a failed login attempt and return lockout status
    
    Args:
        identifier: Identifier that failed login
        identifier_type: Type of identifier
        ip_address: Optional IP address
        user_agent: Optional user agent string
    
    Returns:
        Tuple of (is_now_locked, locked_until_datetime)
    """
    try:
        # Record the failed attempt
        record_failed_login(identifier, identifier_type, ip_address, user_agent)
        
        # Check if account is already locked
        is_locked, locked_until = is_account_locked(identifier, identifier_type)
        if is_locked:
            return True, locked_until
        
        # Count recent failed attempts
        failed_count = get_failed_attempt_count(identifier, identifier_type)
        
        # Lock account if threshold exceeded
        if failed_count >= MAX_FAILED_ATTEMPTS:
            locked_until = lock_account(identifier, identifier_type)
            return True, locked_until
        
        print(f"Failed attempt {failed_count}/{MAX_FAILED_ATTEMPTS} for {identifier_type}: {identifier}")
        return False, None
        
    except Exception as e:
        print(f"Error handling failed login: {e}")
        return False, None

def handle_successful_login(identifier: str, identifier_type: str = 'email'):
    """
    Handle a successful login by clearing failed attempts
    
    Args:
        identifier: Identifier that successfully logged in
        identifier_type: Type of identifier
    """
    try:
        clear_failed_attempts(identifier, identifier_type)
        
    except Exception as e:
        print(f"Error handling successful login: {e}")

def get_lockout_info(identifier: str, identifier_type: str = 'email') -> Dict:
    """
    Get detailed lockout information for an identifier
    
    Args:
        identifier: Identifier to check
        identifier_type: Type of identifier
    
    Returns:
        Dictionary with lockout information
    """
    try:
        now = datetime.utcnow()
        
        # Get current lockout status
        is_locked, locked_until = is_account_locked(identifier, identifier_type)
        
        # Get failed attempt count
        failed_count = get_failed_attempt_count(identifier, identifier_type)
        
        # Get lockout history
        lockout_history = list(account_lockouts_db.find({
            'identifier': identifier,
            'identifier_type': identifier_type
        }).sort('created_at', -1).limit(5))
        
        return {
            'is_locked': is_locked,
            'locked_until': locked_until.isoformat() if locked_until else None,
            'minutes_remaining': int((locked_until - now).total_seconds() / 60) if locked_until and is_locked else 0,
            'failed_attempts_count': failed_count,
            'max_attempts': MAX_FAILED_ATTEMPTS,
            'attempts_remaining': max(0, MAX_FAILED_ATTEMPTS - failed_count),
            'lockout_history_count': len(lockout_history),
            'last_lockout': lockout_history[0]['locked_at'].isoformat() if lockout_history else None
        }
        
    except Exception as e:
        print(f"Error getting lockout info: {e}")
        return {
            'is_locked': False,
            'error': str(e)
        }

def cleanup_expired_lockouts():
    """
    Clean up expired lockouts and old failed attempts
    Should be called periodically
    
    Returns:
        Number of records cleaned up
    """
    try:
        now = datetime.utcnow()
        cleanup_count = 0
        
        # Deactivate expired lockouts
        expired_result = account_lockouts_db.update_many(
            {
                'locked_until': {'$lte': now},
                'is_active': True
            },
            {
                '$set': {
                    'is_active': False,
                    'expired_at': now,
                    'updated_at': now
                }
            }
        )
        cleanup_count += expired_result.modified_count
        
        # Delete old failed attempts (older than 24 hours)
        old_attempts_cutoff = now - timedelta(hours=24)
        old_attempts_result = failed_attempts_db.delete_many({
            'timestamp': {'$lt': old_attempts_cutoff}
        })
        cleanup_count += old_attempts_result.deleted_count
        
        # Delete old lockout records (older than 30 days)
        old_lockouts_cutoff = now - timedelta(days=30)
        old_lockouts_result = account_lockouts_db.delete_many({
            'created_at': {'$lt': old_lockouts_cutoff},
            'is_active': False
        })
        cleanup_count += old_lockouts_result.deleted_count
        
        if cleanup_count > 0:
            print(f"Cleaned up {cleanup_count} account lockout records")
        
        return cleanup_count
        
    except Exception as e:
        print(f"Error cleaning up lockout records: {e}")
        return 0

def get_lockout_stats(days: int = 7) -> Dict:
    """
    Get lockout statistics for monitoring
    
    Args:
        days: Number of days to analyze
    
    Returns:
        Dictionary with lockout statistics
    """
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        # Count lockouts by type
        lockout_pipeline = [
            {'$match': {'created_at': {'$gte': cutoff_date}}},
            {'$group': {
                '_id': '$identifier_type',
                'count': {'$sum': 1},
                'unique_identifiers': {'$addToSet': '$identifier'}
            }}
        ]
        
        lockout_stats = list(account_lockouts_db.aggregate(lockout_pipeline))
        
        # Count failed attempts by type
        attempts_pipeline = [
            {'$match': {'timestamp': {'$gte': cutoff_date}}},
            {'$group': {
                '_id': '$identifier_type',
                'count': {'$sum': 1},
                'unique_identifiers': {'$addToSet': '$identifier'}
            }}
        ]
        
        attempt_stats = list(failed_attempts_db.aggregate(attempts_pipeline))
        
        return {
            'time_period_days': days,
            'lockouts': {
                item['_id']: {
                    'total_lockouts': item['count'],
                    'unique_accounts': len(item['unique_identifiers'])
                }
                for item in lockout_stats
            },
            'failed_attempts': {
                item['_id']: {
                    'total_attempts': item['count'],
                    'unique_accounts': len(item['unique_identifiers'])
                }
                for item in attempt_stats
            },
            'current_active_lockouts': account_lockouts_db.count_documents({
                'is_active': True,
                'locked_until': {'$gt': datetime.utcnow()}
            })
        }
        
    except Exception as e:
        print(f"Error getting lockout statistics: {e}")
        return {'error': str(e)}