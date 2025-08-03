"""
Notification System for AusJobs
Handles in-app notifications, email notifications, and real-time updates
"""
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from flask import Blueprint, request, jsonify, session
from extensions import mongo
from flask_pymongo import ObjectId
from enum import Enum
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils import (
    validate_required_fields, validate_json_request, 
    standardize_error_response, standardize_success_response, require_auth
)
# Session-based authentication is used instead of JWT

# Database collections - accessed lazily to avoid import issues
def get_notifications_db():
    return mongo.db.notifications

def get_notification_preferences_db():
    return mongo.db.notification_preferences

def get_notification_templates_db():
    return mongo.db.notification_templates

# Blueprint
notifications_bp = Blueprint("notifications_bp", __name__)

class NotificationType(Enum):
    """Notification types"""
    JOB_APPLICATION_SUBMITTED = "job_application_submitted"
    JOB_APPLICATION_STATUS_CHANGED = "job_application_status_changed"
    NEW_JOB_MATCH = "new_job_match"
    RESUME_ANALYSIS_COMPLETE = "resume_analysis_complete"
    PASSWORD_CHANGED = "password_changed"
    LOGIN_FROM_NEW_DEVICE = "login_from_new_device"
    ACCOUNT_LOCKED = "account_locked"
    TWO_FACTOR_ENABLED = "two_factor_enabled"
    SUBSCRIPTION_EXPIRES_SOON = "subscription_expires_soon"
    NEW_MESSAGE = "new_message"
    SYSTEM_MAINTENANCE = "system_maintenance"
    WELCOME = "welcome"

class NotificationPriority(Enum):
    """Notification priorities"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class NotificationStatus(Enum):
    """Notification status"""
    UNREAD = "unread"
    READ = "read"
    ARCHIVED = "archived"

def create_notification(
    user_id: str,
    notification_type: NotificationType,
    title: str,
    message: str,
    priority: NotificationPriority = NotificationPriority.MEDIUM,
    data: Dict = None,
    action_url: str = None,
    expires_at: datetime = None
) -> str:
    """
    Create a new notification
    
    Args:
        user_id: Target user ID
        notification_type: Type of notification
        title: Notification title
        message: Notification message
        priority: Notification priority
        data: Additional data for the notification
        action_url: URL to navigate when notification is clicked
        expires_at: Expiration datetime for the notification
    
    Returns:
        Notification ID
    """
    try:
        now = datetime.utcnow()
        
        notification_doc = {
            'user_id': ObjectId(user_id),
            'type': notification_type.value,
            'title': title,
            'message': message,
            'priority': priority.value,
            'status': NotificationStatus.UNREAD.value,
            'data': data or {},
            'action_url': action_url,
            'created_at': now,
            'updated_at': now,
            'expires_at': expires_at,
            'read_at': None
        }
        
        result = get_notifications_db().insert_one(notification_doc)
        notification_id = str(result.inserted_id)
        
        print(f"Created notification {notification_id} for user {user_id}: {title}")
        
        # TODO: Send real-time notification via WebSocket
        # TODO: Send email notification if user preferences allow
        
        return notification_id
        
    except Exception as e:
        print(f"Error creating notification: {e}")
        raise Exception("Failed to create notification")

def get_user_notifications(
    user_id: str,
    status: NotificationStatus = None,
    limit: int = 50,
    skip: int = 0,
    include_expired: bool = False
) -> List[Dict]:
    """
    Get notifications for a user
    
    Args:
        user_id: User ID
        status: Filter by status (optional)
        limit: Maximum number of notifications to return
        skip: Number of notifications to skip
        include_expired: Whether to include expired notifications
    
    Returns:
        List of notification documents
    """
    try:
        query = {'user_id': ObjectId(user_id)}
        
        # Filter by status
        if status:
            query['status'] = status.value
        
        # Filter out expired notifications unless requested
        if not include_expired:
            now = datetime.utcnow()
            query['$or'] = [
                {'expires_at': None},
                {'expires_at': {'$gt': now}}
            ]
        
        notifications = get_notifications_db().find(query).sort('created_at', -1).skip(skip).limit(limit)
        
        formatted_notifications = []
        for notification in notifications:
            formatted_notifications.append({
                'id': str(notification['_id']),
                'type': notification['type'],
                'title': notification['title'],
                'message': notification['message'],
                'priority': notification['priority'],
                'status': notification['status'],
                'data': notification.get('data', {}),
                'action_url': notification.get('action_url'),
                'created_at': notification['created_at'].isoformat(),
                'read_at': notification['read_at'].isoformat() if notification.get('read_at') else None,
                'expires_at': notification['expires_at'].isoformat() if notification.get('expires_at') else None
            })
        
        return formatted_notifications
        
    except Exception as e:
        print(f"Error getting user notifications: {e}")
        return []

def mark_notification_as_read(notification_id: str, user_id: str) -> bool:
    """
    Mark a notification as read
    
    Args:
        notification_id: Notification ID
        user_id: User ID (for security)
    
    Returns:
        True if successful
    """
    try:
        result = get_notifications_db().update_one(
            {
                '_id': ObjectId(notification_id),
                'user_id': ObjectId(user_id)
            },
            {
                '$set': {
                    'status': NotificationStatus.READ.value,
                    'read_at': datetime.utcnow(),
                    'updated_at': datetime.utcnow()
                }
            }
        )
        
        return result.modified_count > 0
        
    except Exception as e:
        print(f"Error marking notification as read: {e}")
        return False

def mark_all_notifications_as_read(user_id: str) -> int:
    """
    Mark all unread notifications as read for a user
    
    Args:
        user_id: User ID
    
    Returns:
        Number of notifications marked as read
    """
    try:
        now = datetime.utcnow()
        result = get_notifications_db().update_many(
            {
                'user_id': ObjectId(user_id),
                'status': NotificationStatus.UNREAD.value
            },
            {
                '$set': {
                    'status': NotificationStatus.READ.value,
                    'read_at': now,
                    'updated_at': now
                }
            }
        )
        
        return result.modified_count
        
    except Exception as e:
        print(f"Error marking all notifications as read: {e}")
        return 0

def delete_notification(notification_id: str, user_id: str) -> bool:
    """
    Delete a notification
    
    Args:
        notification_id: Notification ID
        user_id: User ID (for security)
    
    Returns:
        True if successful
    """
    try:
        result = get_notifications_db().delete_one({
            '_id': ObjectId(notification_id),
            'user_id': ObjectId(user_id)
        })
        
        return result.deleted_count > 0
        
    except Exception as e:
        print(f"Error deleting notification: {e}")
        return False

def get_notification_count(user_id: str, unread_only: bool = True) -> int:
    """
    Get notification count for a user
    
    Args:
        user_id: User ID
        unread_only: Count only unread notifications
    
    Returns:
        Number of notifications
    """
    try:
        query = {'user_id': ObjectId(user_id)}
        
        if unread_only:
            query['status'] = NotificationStatus.UNREAD.value
        
        # Don't count expired notifications
        now = datetime.utcnow()
        query['$or'] = [
            {'expires_at': None},
            {'expires_at': {'$gt': now}}
        ]
        
        return get_notifications_db().count_documents(query)
        
    except Exception as e:
        print(f"Error getting notification count: {e}")
        return 0

def cleanup_expired_notifications():
    """
    Clean up expired notifications
    Should be called periodically
    
    Returns:
        Number of notifications cleaned up
    """
    try:
        now = datetime.utcnow()
        
        result = get_notifications_db().delete_many({
            'expires_at': {'$lte': now}
        })
        
        print(f"Cleaned up {result.deleted_count} expired notifications")
        return result.deleted_count
        
    except Exception as e:
        print(f"Error cleaning up expired notifications: {e}")
        return 0

# API Endpoints

@notifications_bp.route("", methods=["GET"])
@require_auth
def get_notifications():
    """Get notifications for current user"""
    try:
        user_id = session.get("user_id")
        
        # Get query parameters
        status = request.args.get('status')
        limit = int(request.args.get('limit', 50))
        page = int(request.args.get('page', 1))
        include_expired = request.args.get('include_expired', 'false').lower() == 'true'
        
        # Validate limit
        limit = min(limit, 100)  # Cap at 100
        skip = (page - 1) * limit
        
        # Parse status
        status_enum = None
        if status:
            try:
                status_enum = NotificationStatus(status)
            except ValueError:
                return standardize_error_response("Invalid status value", 400)
        
        # Get notifications
        notifications = get_user_notifications(
            user_id, status_enum, limit, skip, include_expired
        )
        
        # Get total count
        total_count = get_notifications_db().count_documents({'user_id': ObjectId(user_id)})
        unread_count = get_notification_count(user_id, unread_only=True)
        
        return jsonify({
            'success': True,
            'data': {
                'notifications': notifications,
                'pagination': {
                    'page': page,
                    'limit': limit,
                    'total': total_count,
                    'pages': (total_count + limit - 1) // limit
                },
                'unread_count': unread_count
            }
        }), 200
        
    except Exception as e:
        print(f"Error getting notifications: {e}")
        return standardize_error_response("Failed to get notifications", 500)

@notifications_bp.route("/count", methods=["GET"])
@require_auth
def get_notification_count_endpoint():
    """Get notification count for current user"""
    try:
        user_id = session.get("user_id")
        unread_only = request.args.get('unread_only', 'true').lower() == 'true'
        
        count = get_notification_count(user_id, unread_only)
        
        return jsonify({
            'success': True,
            'data': {
                'count': count,
                'unread_only': unread_only
            }
        }), 200
        
    except Exception as e:
        print(f"Error getting notification count: {e}")
        return standardize_error_response("Failed to get notification count", 500)

@notifications_bp.route("/<notification_id>/read", methods=["PUT"])
@require_auth
def mark_notification_read(notification_id):
    """Mark a notification as read"""
    try:
        user_id = session.get("user_id")
        
        success = mark_notification_as_read(notification_id, user_id)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Notification marked as read'
            }), 200
        else:
            return standardize_error_response("Notification not found or already read", 404)
        
    except Exception as e:
        print(f"Error marking notification as read: {e}")
        return standardize_error_response("Failed to mark notification as read", 500)

@notifications_bp.route("/read-all", methods=["PUT"])
@require_auth
def mark_all_notifications_read():
    """Mark all notifications as read for current user"""
    try:
        user_id = session.get("user_id")
        
        count = mark_all_notifications_as_read(user_id)
        
        return jsonify({
            'success': True,
            'message': f'Marked {count} notifications as read',
            'count': count
        }), 200
        
    except Exception as e:
        print(f"Error marking all notifications as read: {e}")
        return standardize_error_response("Failed to mark notifications as read", 500)

@notifications_bp.route("/<notification_id>", methods=["DELETE"])
@require_auth
def delete_notification_endpoint(notification_id):
    """Delete a notification"""
    try:
        user_id = session.get("user_id")
        
        success = delete_notification(notification_id, user_id)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Notification deleted'
            }), 200
        else:
            return standardize_error_response("Notification not found", 404)
        
    except Exception as e:
        print(f"Error deleting notification: {e}")
        return standardize_error_response("Failed to delete notification", 500)

@notifications_bp.route("/test", methods=["POST"])
@require_auth
def create_test_notification():
    """Create a test notification (for development)"""
    try:
        user_id = session.get("user_id")
        
        data = request.get_json() or {}
        title = data.get('title', 'Test Notification')
        message = data.get('message', 'This is a test notification')
        
        notification_id = create_notification(
            user_id,
            NotificationType.SYSTEM_MAINTENANCE,
            title,
            message,
            NotificationPriority.MEDIUM,
            {'test': True}
        )
        
        return jsonify({
            'success': True,
            'data': {
                'notification_id': notification_id
            },
            'message': 'Test notification created'
        }), 201
        
    except Exception as e:
        print(f"Error creating test notification: {e}")
        return standardize_error_response("Failed to create test notification", 500)

# Notification Triggers (Helper functions to be called from other modules)

def notify_job_application_submitted(user_id: str, job_title: str, company: str):
    """Notify user when job application is submitted"""
    create_notification(
        user_id,
        NotificationType.JOB_APPLICATION_SUBMITTED,
        "Application Submitted Successfully",
        f"Your application for {job_title} at {company} has been submitted.",
        NotificationPriority.MEDIUM,
        {'job_title': job_title, 'company': company}
    )

def notify_job_application_status_changed(user_id: str, job_title: str, company: str, new_status: str):
    """Notify user when job application status changes"""
    status_messages = {
        'reviewing': 'Your application is being reviewed',
        'interviewed': 'You have been selected for an interview',
        'accepted': 'Congratulations! Your application has been accepted',
        'rejected': 'Your application was not successful this time'
    }
    
    message = status_messages.get(new_status, f"Your application status has been updated to: {new_status}")
    priority = NotificationPriority.HIGH if new_status in ['accepted', 'interviewed'] else NotificationPriority.MEDIUM
    
    create_notification(
        user_id,
        NotificationType.JOB_APPLICATION_STATUS_CHANGED,
        f"Application Update - {job_title}",
        f"{message} for {job_title} at {company}.",
        priority,
        {'job_title': job_title, 'company': company, 'status': new_status}
    )

def notify_new_job_match(user_id: str, job_title: str, company: str, match_percentage: float):
    """Notify user about new job matches"""
    create_notification(
        user_id,
        NotificationType.NEW_JOB_MATCH,
        "New Job Match Found",
        f"We found a {match_percentage}% match: {job_title} at {company}",
        NotificationPriority.MEDIUM,
        {'job_title': job_title, 'company': company, 'match_percentage': match_percentage},
        f"/jobs/{job_title.lower().replace(' ', '-')}"
    )

def notify_resume_analysis_complete(user_id: str, score: int):
    """Notify user when resume analysis is complete"""
    create_notification(
        user_id,
        NotificationType.RESUME_ANALYSIS_COMPLETE,
        "Resume Analysis Complete",
        f"Your resume analysis is ready! Overall score: {score}/100",
        NotificationPriority.MEDIUM,
        {'score': score},
        "/resume/analysis"
    )

def notify_account_security(user_id: str, notification_type: NotificationType, message: str):
    """Notify user about security-related events"""
    create_notification(
        user_id,
        notification_type,
        "Account Security Alert",
        message,
        NotificationPriority.HIGH,
        action_url="/settings/security"
    )