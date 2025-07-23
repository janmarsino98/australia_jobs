"""
Two-Factor Authentication (2FA) System for AusJobs
Supports TOTP (Time-based One-Time Password) using authenticator apps
"""
import pyotp
import qrcode
import io
import base64
import secrets
import os
from datetime import datetime, timedelta
from flask import current_app
from extensions import mongo
from flask_pymongo import ObjectId
from typing import Dict, Tuple, Optional

# Database collections
users_db = mongo.db.users
totp_secrets_db = mongo.db.totp_secrets
backup_codes_db = mongo.db.backup_codes
two_factor_logs_db = mongo.db.two_factor_logs

class TwoFactorError(Exception):
    """Two-factor authentication error"""
    pass

def generate_totp_secret() -> str:
    """
    Generate a new TOTP secret for a user
    
    Returns:
        Base32-encoded secret string
    """
    return pyotp.random_base32()

def generate_backup_codes(count: int = 10) -> list:
    """
    Generate backup codes for 2FA recovery
    
    Args:
        count: Number of backup codes to generate
    
    Returns:
        List of backup code strings
    """
    codes = []
    for _ in range(count):
        # Generate 8-digit backup codes
        code = secrets.randbelow(100000000)
        codes.append(f"{code:08d}")
    return codes

def generate_qr_code(user_email: str, secret: str, issuer: str = "AusJobs") -> str:
    """
    Generate QR code for TOTP setup
    
    Args:
        user_email: User's email address
        secret: TOTP secret
        issuer: Service name
    
    Returns:
        Base64-encoded QR code image
    """
    try:
        # Create TOTP URI
        totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
            name=user_email,
            issuer_name=issuer
        )
        
        # Generate QR code
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(totp_uri)
        qr.make(fit=True)
        
        # Create QR code image
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to base64
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        
        qr_base64 = base64.b64encode(buffer.getvalue()).decode()
        return f"data:image/png;base64,{qr_base64}"
        
    except Exception as e:
        print(f"Error generating QR code: {e}")
        raise TwoFactorError("Failed to generate QR code")

def enable_two_factor(user_id: str) -> Dict:
    """
    Enable 2FA for a user and generate setup data
    
    Args:
        user_id: User ID string
    
    Returns:
        Dictionary with secret, QR code, and backup codes
    """
    try:
        # Get user info
        user = users_db.find_one({'_id': ObjectId(user_id)})
        if not user:
            raise TwoFactorError("User not found")
        
        email = user.get('email')
        if not email:
            raise TwoFactorError("User email not available")
        
        # Generate TOTP secret
        secret = generate_totp_secret()
        
        # Generate backup codes
        backup_codes = generate_backup_codes()
        
        # Generate QR code
        qr_code = generate_qr_code(email, secret)
        
        # Store TOTP secret (not yet active)
        totp_doc = {
            'user_id': ObjectId(user_id),
            'secret': secret,
            'is_active': False,  # Not active until verified
            'created_at': datetime.utcnow(),
            'verified_at': None
        }
        
        # Remove any existing TOTP secret for this user
        totp_secrets_db.delete_many({'user_id': ObjectId(user_id)})
        totp_secrets_db.insert_one(totp_doc)
        
        # Store backup codes
        backup_doc = {
            'user_id': ObjectId(user_id),
            'codes': [{'code': code, 'used': False, 'used_at': None} for code in backup_codes],
            'created_at': datetime.utcnow()
        }
        
        # Remove any existing backup codes
        backup_codes_db.delete_many({'user_id': ObjectId(user_id)})
        backup_codes_db.insert_one(backup_doc)
        
        # Log 2FA setup initiation
        log_two_factor_event(user_id, '2fa_setup_initiated', {
            'method': 'totp',
            'backup_codes_generated': len(backup_codes)
        })
        
        return {
            'secret': secret,
            'qr_code': qr_code,
            'backup_codes': backup_codes,
            'manual_entry_key': secret
        }
        
    except Exception as e:
        print(f"Error enabling 2FA: {e}")
        if isinstance(e, TwoFactorError):
            raise
        raise TwoFactorError("Failed to enable two-factor authentication")

def verify_and_activate_two_factor(user_id: str, totp_code: str) -> bool:
    """
    Verify TOTP code and activate 2FA for user
    
    Args:
        user_id: User ID string
        totp_code: 6-digit TOTP code from authenticator app
    
    Returns:
        True if verification successful and 2FA activated
    """
    try:
        # Get TOTP secret
        totp_doc = totp_secrets_db.find_one({
            'user_id': ObjectId(user_id),
            'is_active': False
        })
        
        if not totp_doc:
            raise TwoFactorError("2FA setup not found or already activated")
        
        secret = totp_doc['secret']
        
        # Verify TOTP code
        totp = pyotp.TOTP(secret)
        if not totp.verify(totp_code, valid_window=1):  # Allow 30 seconds tolerance
            log_two_factor_event(user_id, '2fa_verification_failed', {
                'method': 'totp',
                'reason': 'invalid_code'
            })
            return False
        
        # Activate 2FA
        now = datetime.utcnow()
        
        # Update TOTP secret as active
        totp_secrets_db.update_one(
            {'_id': totp_doc['_id']},
            {
                '$set': {
                    'is_active': True,
                    'verified_at': now
                }
            }
        )
        
        # Update user record
        users_db.update_one(
            {'_id': ObjectId(user_id)},
            {
                '$set': {
                    'two_factor_enabled': True,
                    'two_factor_method': 'totp',
                    'two_factor_activated_at': now,
                    'updated_at': now
                }
            }
        )
        
        # Log successful activation
        log_two_factor_event(user_id, '2fa_activated', {
            'method': 'totp'
        })
        
        return True
        
    except Exception as e:
        print(f"Error verifying and activating 2FA: {e}")
        if isinstance(e, TwoFactorError):
            raise
        raise TwoFactorError("Failed to verify and activate 2FA")

def verify_two_factor_code(user_id: str, code: str, is_backup_code: bool = False) -> bool:
    """
    Verify 2FA code during login
    
    Args:
        user_id: User ID string
        code: TOTP code or backup code
        is_backup_code: Whether the code is a backup code
    
    Returns:
        True if code is valid
    """
    try:
        # Check if user has 2FA enabled
        user = users_db.find_one({'_id': ObjectId(user_id)})
        if not user or not user.get('two_factor_enabled'):
            raise TwoFactorError("2FA not enabled for user")
        
        if is_backup_code:
            return verify_backup_code(user_id, code)
        else:
            return verify_totp_code(user_id, code)
            
    except Exception as e:
        print(f"Error verifying 2FA code: {e}")
        if isinstance(e, TwoFactorError):
            raise
        return False

def verify_totp_code(user_id: str, totp_code: str) -> bool:
    """
    Verify TOTP code
    
    Args:
        user_id: User ID string
        totp_code: 6-digit TOTP code
    
    Returns:
        True if code is valid
    """
    try:
        # Get active TOTP secret
        totp_doc = totp_secrets_db.find_one({
            'user_id': ObjectId(user_id),
            'is_active': True
        })
        
        if not totp_doc:
            log_two_factor_event(user_id, '2fa_verification_failed', {
                'method': 'totp',
                'reason': 'no_active_secret'
            })
            return False
        
        secret = totp_doc['secret']
        
        # Verify TOTP code
        totp = pyotp.TOTP(secret)
        is_valid = totp.verify(totp_code, valid_window=1)
        
        # Log verification attempt
        log_two_factor_event(user_id, 
                           '2fa_verification_success' if is_valid else '2fa_verification_failed',
                           {
                               'method': 'totp',
                               'reason': 'valid_code' if is_valid else 'invalid_code'
                           })
        
        return is_valid
        
    except Exception as e:
        print(f"Error verifying TOTP code: {e}")
        log_two_factor_event(user_id, '2fa_verification_error', {
            'method': 'totp',
            'error': str(e)
        })
        return False

def verify_backup_code(user_id: str, backup_code: str) -> bool:
    """
    Verify backup code
    
    Args:
        user_id: User ID string
        backup_code: 8-digit backup code
    
    Returns:
        True if code is valid and unused
    """
    try:
        # Get backup codes
        backup_doc = backup_codes_db.find_one({
            'user_id': ObjectId(user_id)
        })
        
        if not backup_doc:
            log_two_factor_event(user_id, '2fa_verification_failed', {
                'method': 'backup_code',
                'reason': 'no_backup_codes'
            })
            return False
        
        # Find matching unused code
        for i, code_data in enumerate(backup_doc['codes']):
            if code_data['code'] == backup_code and not code_data['used']:
                # Mark code as used
                backup_codes_db.update_one(
                    {'_id': backup_doc['_id']},
                    {
                        '$set': {
                            f'codes.{i}.used': True,
                            f'codes.{i}.used_at': datetime.utcnow()
                        }
                    }
                )
                
                log_two_factor_event(user_id, '2fa_verification_success', {
                    'method': 'backup_code',
                    'remaining_codes': len([c for c in backup_doc['codes'] if not c['used']]) - 1
                })
                
                return True
        
        log_two_factor_event(user_id, '2fa_verification_failed', {
            'method': 'backup_code',
            'reason': 'invalid_or_used_code'
        })
        
        return False
        
    except Exception as e:
        print(f"Error verifying backup code: {e}")
        log_two_factor_event(user_id, '2fa_verification_error', {
            'method': 'backup_code',
            'error': str(e)
        })
        return False

def disable_two_factor(user_id: str) -> bool:
    """
    Disable 2FA for a user
    
    Args:
        user_id: User ID string
    
    Returns:
        True if successfully disabled
    """
    try:
        # Update user record
        result = users_db.update_one(
            {'_id': ObjectId(user_id)},
            {
                '$set': {
                    'two_factor_enabled': False,
                    'updated_at': datetime.utcnow()
                },
                '$unset': {
                    'two_factor_method': '',
                    'two_factor_activated_at': ''
                }
            }
        )
        
        # Remove TOTP secrets
        totp_secrets_db.delete_many({'user_id': ObjectId(user_id)})
        
        # Remove backup codes
        backup_codes_db.delete_many({'user_id': ObjectId(user_id)})
        
        # Log 2FA disabled
        log_two_factor_event(user_id, '2fa_disabled', {})
        
        return result.modified_count > 0
        
    except Exception as e:
        print(f"Error disabling 2FA: {e}")
        return False

def get_two_factor_status(user_id: str) -> Dict:
    """
    Get 2FA status for a user
    
    Args:
        user_id: User ID string
    
    Returns:
        Dictionary with 2FA status information
    """
    try:
        user = users_db.find_one({'_id': ObjectId(user_id)})
        if not user:
            return {'enabled': False, 'error': 'User not found'}
        
        is_enabled = user.get('two_factor_enabled', False)
        
        if not is_enabled:
            return {
                'enabled': False,
                'method': None,
                'activated_at': None,
                'backup_codes_remaining': 0
            }
        
        # Get backup codes status
        backup_doc = backup_codes_db.find_one({'user_id': ObjectId(user_id)})
        remaining_codes = 0
        if backup_doc:
            remaining_codes = len([c for c in backup_doc['codes'] if not c['used']])
        
        return {
            'enabled': True,
            'method': user.get('two_factor_method', 'totp'),
            'activated_at': user.get('two_factor_activated_at'),
            'backup_codes_remaining': remaining_codes
        }
        
    except Exception as e:
        print(f"Error getting 2FA status: {e}")
        return {'enabled': False, 'error': str(e)}

def regenerate_backup_codes(user_id: str) -> list:
    """
    Regenerate backup codes for a user
    
    Args:
        user_id: User ID string
    
    Returns:
        List of new backup codes
    """
    try:
        # Check if user has 2FA enabled
        user = users_db.find_one({'_id': ObjectId(user_id)})
        if not user or not user.get('two_factor_enabled'):
            raise TwoFactorError("2FA not enabled for user")
        
        # Generate new backup codes
        backup_codes = generate_backup_codes()
        
        # Update backup codes
        backup_doc = {
            'user_id': ObjectId(user_id),
            'codes': [{'code': code, 'used': False, 'used_at': None} for code in backup_codes],
            'created_at': datetime.utcnow()
        }
        
        backup_codes_db.replace_one(
            {'user_id': ObjectId(user_id)},
            backup_doc,
            upsert=True
        )
        
        # Log backup codes regeneration
        log_two_factor_event(user_id, 'backup_codes_regenerated', {
            'codes_count': len(backup_codes)
        })
        
        return backup_codes
        
    except Exception as e:
        print(f"Error regenerating backup codes: {e}")
        if isinstance(e, TwoFactorError):
            raise
        raise TwoFactorError("Failed to regenerate backup codes")

def log_two_factor_event(user_id: str, event_type: str, details: Dict):
    """
    Log 2FA events for security monitoring
    
    Args:
        user_id: User ID string
        event_type: Type of event
        details: Additional event details
    """
    try:
        log_doc = {
            'user_id': ObjectId(user_id),
            'event_type': event_type,
            'details': details,
            'timestamp': datetime.utcnow(),
            'ip_address': None,  # Could be extracted from request
            'user_agent': None   # Could be extracted from request
        }
        
        two_factor_logs_db.insert_one(log_doc)
        
    except Exception as e:
        print(f"Error logging 2FA event: {e}")

def cleanup_two_factor_logs(days_to_keep: int = 90):
    """
    Clean up old 2FA logs
    
    Args:
        days_to_keep: Number of days to keep logs
    
    Returns:
        Number of logs cleaned up
    """
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=days_to_keep)
        
        result = two_factor_logs_db.delete_many({
            'timestamp': {'$lt': cutoff_date}
        })
        
        print(f"Cleaned up {result.deleted_count} 2FA log entries")
        return result.deleted_count
        
    except Exception as e:
        print(f"Error cleaning up 2FA logs: {e}")
        return 0