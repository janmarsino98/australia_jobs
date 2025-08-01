"""
Notification Preferences System
Manages user preferences for different types of notifications
"""
from datetime import datetime
from typing import Dict, List
from flask import Blueprint, request, jsonify
from extensions import mongo
from flask_pymongo import ObjectId
from notification_system import NotificationType
from auth_decorators import jwt_required, get_current_user_id
from utils import standardize_error_response, standardize_success_response

# Database collections - accessed lazily to avoid import issues
def get_notification_preferences_db():
    return mongo.db.notification_preferences

# Blueprint
notification_preferences_bp = Blueprint("notification_preferences_bp", __name__)

# Default preferences for new users
DEFAULT_PREFERENCES = {
    NotificationType.JOB_APPLICATION_SUBMITTED.value: {
        'in_app': True,
        'email': True,
        'push': False
    },
    NotificationType.JOB_APPLICATION_STATUS_CHANGED.value: {
        'in_app': True,
        'email': True,
        'push': True
    },
    NotificationType.NEW_JOB_MATCH.value: {
        'in_app': True,
        'email': False,
        'push': False
    },
    NotificationType.RESUME_ANALYSIS_COMPLETE.value: {
        'in_app': True,
        'email': True,
        'push': False
    },
    NotificationType.PASSWORD_CHANGED.value: {
        'in_app': True,
        'email': True,
        'push': True
    },
    NotificationType.LOGIN_FROM_NEW_DEVICE.value: {
        'in_app': True,
        'email': True,
        'push': True
    },
    NotificationType.ACCOUNT_LOCKED.value: {
        'in_app': True,
        'email': True,
        'push': True
    },
    NotificationType.TWO_FACTOR_ENABLED.value: {
        'in_app': True,
        'email': True,
        'push': False
    },
    NotificationType.SUBSCRIPTION_EXPIRES_SOON.value: {
        'in_app': True,
        'email': True,
        'push': False
    },
    NotificationType.NEW_MESSAGE.value: {
        'in_app': True,
        'email': False,
        'push': True
    },
    NotificationType.SYSTEM_MAINTENANCE.value: {
        'in_app': True,
        'email': False,
        'push': False
    },
    NotificationType.WELCOME.value: {
        'in_app': True,
        'email': True,
        'push': False
    }
}

def get_user_preferences(user_id: str) -> Dict:
    """
    Get notification preferences for a user
    
    Args:
        user_id: User ID
    
    Returns:
        Dictionary with user preferences
    """
    try:
        preferences = get_notification_preferences_db().find_one({
            'user_id': ObjectId(user_id)
        })
        
        if preferences:
            return preferences['preferences']
        else:
            # Return default preferences for new users
            return DEFAULT_PREFERENCES
            
    except Exception as e:
        print(f"Error getting user preferences: {e}")
        return DEFAULT_PREFERENCES

def create_default_preferences(user_id: str):
    """
    Create default notification preferences for a new user
    
    Args:
        user_id: User ID
    """
    try:
        preferences_doc = {
            'user_id': ObjectId(user_id),
            'preferences': DEFAULT_PREFERENCES,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        get_notification_preferences_db().insert_one(preferences_doc)
        print(f"Created default preferences for user {user_id}")
        
    except Exception as e:
        print(f"Error creating default preferences: {e}")

def update_user_preferences(user_id: str, preferences: Dict) -> bool:
    """
    Update notification preferences for a user
    
    Args:
        user_id: User ID
        preferences: New preferences
    
    Returns:
        True if successful
    """
    try:
        # Validate preferences structure
        for notification_type, settings in preferences.items():
            if not isinstance(settings, dict):
                return False
            
            required_keys = ['in_app', 'email', 'push']
            if not all(key in settings for key in required_keys):
                return False
            
            if not all(isinstance(settings[key], bool) for key in required_keys):
                return False
        
        # Update or create preferences
        result = get_notification_preferences_db().update_one(
            {'user_id': ObjectId(user_id)},
            {
                '$set': {
                    'preferences': preferences,
                    'updated_at': datetime.utcnow()
                }
            },
            upsert=True
        )
        
        return True
        
    except Exception as e:
        print(f"Error updating user preferences: {e}")
        return False

def should_send_notification(user_id: str, notification_type: NotificationType, channel: str) -> bool:
    """
    Check if a notification should be sent based on user preferences
    
    Args:
        user_id: User ID
        notification_type: Type of notification
        channel: Notification channel ('in_app', 'email', 'push')
    
    Returns:
        True if notification should be sent
    """
    try:
        preferences = get_user_preferences(user_id)
        
        type_preferences = preferences.get(notification_type.value, {})
        return type_preferences.get(channel, False)
        
    except Exception as e:
        print(f"Error checking notification preference: {e}")
        return False

# API Endpoints

@notification_preferences_bp.route("/", methods=["GET"])
@jwt_required()
def get_preferences():
    """Get notification preferences for current user"""
    try:
        user_id = get_current_user_id()
        preferences = get_user_preferences(user_id)
        
        return standardize_success_response({
            'preferences': preferences
        }, status_code=200)
        
    except Exception as e:
        print(f"Error getting preferences: {e}")
        return standardize_error_response("Failed to get notification preferences", 500)

@notification_preferences_bp.route("/", methods=["PUT"])
@jwt_required()
def update_preferences():
    """Update notification preferences for current user"""
    try:
        user_id = get_current_user_id()
        data = request.get_json()
        
        if not data or 'preferences' not in data:
            return standardize_error_response("Preferences data is required", 400)
        
        preferences = data['preferences']
        
        success = update_user_preferences(user_id, preferences)
        
        if success:
            return standardize_success_response({
                'message': 'Notification preferences updated successfully'
            }, status_code=200)
        else:
            return standardize_error_response("Invalid preferences format", 400)
        
    except Exception as e:
        print(f"Error updating preferences: {e}")
        return standardize_error_response("Failed to update notification preferences", 500)

@notification_preferences_bp.route("/reset", methods=["POST"])
@jwt_required()
def reset_preferences():
    """Reset notification preferences to defaults"""
    try:
        user_id = get_current_user_id()
        
        success = update_user_preferences(user_id, DEFAULT_PREFERENCES)
        
        if success:
            return standardize_success_response({
                'message': 'Notification preferences reset to defaults',
                'preferences': DEFAULT_PREFERENCES
            }, status_code=200)
        else:
            return standardize_error_response("Failed to reset preferences", 500)
        
    except Exception as e:
        print(f"Error resetting preferences: {e}")
        return standardize_error_response("Failed to reset notification preferences", 500)

@notification_preferences_bp.route("/types", methods=["GET"])
@jwt_required()
def get_notification_types():
    """Get available notification types and their descriptions"""
    try:
        notification_types = {
            NotificationType.JOB_APPLICATION_SUBMITTED.value: {
                'name': 'Job Application Submitted',
                'description': 'When you submit a job application'
            },
            NotificationType.JOB_APPLICATION_STATUS_CHANGED.value: {
                'name': 'Application Status Updates',
                'description': 'When your job application status changes'
            },
            NotificationType.NEW_JOB_MATCH.value: {
                'name': 'New Job Matches',
                'description': 'When new jobs match your profile'
            },
            NotificationType.RESUME_ANALYSIS_COMPLETE.value: {
                'name': 'Resume Analysis Complete',
                'description': 'When your resume analysis is finished'
            },
            NotificationType.PASSWORD_CHANGED.value: {
                'name': 'Password Changes',
                'description': 'When your password is changed'
            },
            NotificationType.LOGIN_FROM_NEW_DEVICE.value: {
                'name': 'New Device Login',
                'description': 'When you login from a new device'
            },
            NotificationType.ACCOUNT_LOCKED.value: {
                'name': 'Account Security',
                'description': 'When your account is locked or security events occur'
            },
            NotificationType.TWO_FACTOR_ENABLED.value: {
                'name': 'Two-Factor Authentication',
                'description': 'When 2FA is enabled or disabled'
            },
            NotificationType.SUBSCRIPTION_EXPIRES_SOON.value: {
                'name': 'Subscription Reminders',
                'description': 'When your subscription is about to expire'
            },
            NotificationType.NEW_MESSAGE.value: {
                'name': 'New Messages',
                'description': 'When you receive new messages'
            },
            NotificationType.SYSTEM_MAINTENANCE.value: {
                'name': 'System Updates',
                'description': 'System maintenance and update notifications'
            },
            NotificationType.WELCOME.value: {
                'name': 'Welcome Messages',
                'description': 'Welcome and onboarding notifications'
            }
        }
        
        return standardize_success_response({
            'notification_types': notification_types
        }, status_code=200)
        
    except Exception as e:
        print(f"Error getting notification types: {e}")
        return standardize_error_response("Failed to get notification types", 500)