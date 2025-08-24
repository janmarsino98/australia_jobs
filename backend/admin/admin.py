from flask import Blueprint, jsonify, request, session
from extensions import mongo
from flask_pymongo import ObjectId
from datetime import datetime
from models import UserRole
import gridfs
import logging

admin_bp = Blueprint("admin_bp", __name__)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def is_admin():
    """Check if the current user is an admin"""
    user_id = session.get('user_id')
    if not user_id:
        return False
    
    try:
        user = mongo.db.users.find_one({"_id": ObjectId(user_id)})
        return user and user.get('role') == UserRole.ADMIN.value
    except Exception as e:
        logger.error(f"Error checking admin status: {e}")
        return False

def admin_required(f):
    """Decorator to require admin access"""
    def decorated_function(*args, **kwargs):
        if not session.get('user_id'):
            return jsonify({"error": "Authentication required"}), 401
        
        if not is_admin():
            return jsonify({"error": "Admin access required"}), 403
        
        return f(*args, **kwargs)
    decorated_function.__name__ = f.__name__
    return decorated_function

def delete_user_files_from_gridfs(user_id):
    """Delete all GridFS files associated with a user"""
    try:
        # Create GridFS instance for this operation
        fs_instance = gridfs.GridFS(mongo.db)
        
        # Find files associated with this user
        files_cursor = fs_instance.find({"metadata.user_id": str(user_id)})
        deleted_count = 0
        
        for file_doc in files_cursor:
            try:
                fs_instance.delete(file_doc._id)
                deleted_count += 1
                logger.info(f"Deleted GridFS file {file_doc._id} for user {user_id}")
            except Exception as e:
                logger.error(f"Error deleting GridFS file {file_doc._id}: {e}")
        
        return deleted_count
    except Exception as e:
        logger.error(f"Error querying GridFS files for user {user_id}: {e}")
        return 0

def delete_user_and_associations(user_id):
    """Delete a user and all associated documents"""
    try:
        user_object_id = ObjectId(user_id)
        deleted_collections = {}
        
        # Delete GridFS files first
        deleted_collections['gridfs_files'] = delete_user_files_from_gridfs(user_id)
        
        # Delete from various collections
        collections_to_clean = [
            'job_applications',
            'saved_jobs', 
            'user_preferences',
            'user_experience',
            'user_education',
            'resume_metadata',
            'user_sessions',
            'email_verification_tokens',
            'password_reset_tokens',
            'user_analytics',
            'notifications'
        ]
        
        for collection_name in collections_to_clean:
            try:
                collection = getattr(mongo.db, collection_name)
                result = collection.delete_many({"user_id": user_object_id})
                deleted_collections[collection_name] = result.deleted_count
                logger.info(f"Deleted {result.deleted_count} documents from {collection_name} for user {user_id}")
            except Exception as e:
                logger.error(f"Error deleting from {collection_name} for user {user_id}: {e}")
                deleted_collections[collection_name] = 0
        
        # Delete the user document itself
        user_result = mongo.db.users.delete_one({"_id": user_object_id})
        deleted_collections['users'] = user_result.deleted_count
        
        logger.info(f"Successfully deleted user {user_id} and associations")
        return deleted_collections
        
    except Exception as e:
        logger.error(f"Error deleting user {user_id} and associations: {e}")
        raise

def delete_all_users_and_associations():
    """Delete all users and their associated documents"""
    try:
        deleted_collections = {}
        
        # Get count of users first
        user_count = mongo.db.users.count_documents({})
        logger.info(f"Starting deletion of {user_count} users and all associations")
        
        # Delete all GridFS files
        try:
            fs_instance = gridfs.GridFS(mongo.db)
            files_cursor = fs_instance.find()
            gridfs_count = 0
            for file_doc in files_cursor:
                try:
                    fs_instance.delete(file_doc._id)
                    gridfs_count += 1
                except Exception as e:
                    logger.error(f"Error deleting GridFS file {file_doc._id}: {e}")
            deleted_collections['gridfs_files'] = gridfs_count
        except Exception as e:
            logger.error(f"Error cleaning GridFS: {e}")
            deleted_collections['gridfs_files'] = 0
        
        # Delete from all user-related collections
        collections_to_clean = [
            'job_applications',
            'saved_jobs',
            'user_preferences', 
            'user_experience',
            'user_education',
            'resume_metadata',
            'user_sessions',
            'email_verification_tokens',
            'password_reset_tokens',
            'user_analytics',
            'notifications',
            'users'  # Delete users last
        ]
        
        for collection_name in collections_to_clean:
            try:
                collection = getattr(mongo.db, collection_name)
                result = collection.delete_many({})
                deleted_collections[collection_name] = result.deleted_count
                logger.info(f"Deleted {result.deleted_count} documents from {collection_name}")
            except Exception as e:
                logger.error(f"Error deleting from {collection_name}: {e}")
                deleted_collections[collection_name] = 0
        
        # Clear Redis sessions (if accessible)
        try:
            # Note: This would require Redis client access
            logger.info("Redis session cleanup would need to be implemented separately")
        except Exception as e:
            logger.error(f"Error clearing Redis sessions: {e}")
        
        logger.info("Successfully deleted all users and associations")
        return deleted_collections
        
    except Exception as e:
        logger.error(f"Error deleting all users and associations: {e}")
        raise

@admin_bp.route("/clear-all-users", methods=["POST"])
@admin_required
def clear_all_users():
    """Clear all users and their associated documents"""
    try:
        # Log the admin action
        admin_user_id = session.get('user_id')
        logger.warning(f"Admin {admin_user_id} initiated CLEAR ALL USERS operation")
        
        # Perform the deletion
        deleted_collections = delete_all_users_and_associations()
        
        # Log the completion
        total_deleted = sum(deleted_collections.values())
        logger.warning(f"CLEAR ALL USERS completed by admin {admin_user_id}. Total items deleted: {total_deleted}")
        
        return jsonify({
            "success": True,
            "message": "All users and associated data cleared successfully",
            "deleted_collections": deleted_collections,
            "total_deleted": total_deleted,
            "timestamp": datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Error in clear_all_users: {e}")
        return jsonify({
            "success": False,
            "error": "Failed to clear users",
            "details": str(e)
        }), 500

@admin_bp.route("/clear-user/<user_id>", methods=["POST"])
@admin_required
def clear_specific_user(user_id):
    """Clear a specific user and their associated documents"""
    try:
        # Validate user_id format
        try:
            ObjectId(user_id)
        except:
            return jsonify({
                "success": False,
                "error": "Invalid user ID format"
            }), 400
        
        # Check if user exists
        user = mongo.db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            return jsonify({
                "success": False,
                "error": "User not found"
            }), 404
        
        # Log the admin action
        admin_user_id = session.get('user_id')
        logger.warning(f"Admin {admin_user_id} initiated CLEAR USER operation for user {user_id}")
        
        # Perform the deletion
        deleted_collections = delete_user_and_associations(user_id)
        
        # Log the completion
        total_deleted = sum(deleted_collections.values())
        logger.warning(f"CLEAR USER {user_id} completed by admin {admin_user_id}. Total items deleted: {total_deleted}")
        
        return jsonify({
            "success": True,
            "message": f"User {user_id} and associated data cleared successfully",
            "deleted_collections": deleted_collections,
            "total_deleted": total_deleted,
            "timestamp": datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Error in clear_specific_user: {e}")
        return jsonify({
            "success": False,
            "error": "Failed to clear user",
            "details": str(e)
        }), 500

@admin_bp.route("/users-summary", methods=["GET"])
@admin_required
def get_users_summary():
    """Get summary information about users in the database"""
    try:
        summary = {}
        
        # Count users by role
        pipeline = [
            {"$group": {"_id": "$role", "count": {"$sum": 1}}}
        ]
        role_counts = list(mongo.db.users.aggregate(pipeline))
        summary['users_by_role'] = {item['_id']: item['count'] for item in role_counts}
        
        # Total user count
        summary['total_users'] = mongo.db.users.count_documents({})
        
        # Count various associated collections
        collections_to_count = [
            'job_applications',
            'saved_jobs',
            'user_preferences',
            'user_experience', 
            'user_education',
            'resume_metadata'
        ]
        
        for collection_name in collections_to_count:
            try:
                collection = getattr(mongo.db, collection_name)
                summary[collection_name] = collection.count_documents({})
            except Exception as e:
                logger.error(f"Error counting {collection_name}: {e}")
                summary[collection_name] = 0
        
        # Count GridFS files
        try:
            fs_instance = gridfs.GridFS(mongo.db)
            summary['gridfs_files'] = len(list(fs_instance.find()))
        except Exception as e:
            logger.error(f"Error counting GridFS files: {e}")
            summary['gridfs_files'] = 0
        
        return jsonify({
            "success": True,
            "summary": summary,
            "timestamp": datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Error in get_users_summary: {e}")
        return jsonify({
            "success": False,
            "error": "Failed to get users summary",
            "details": str(e)
        }), 500

@admin_bp.route("/users-list", methods=["GET"])
@admin_required
def get_users_list():
    """Get list of all users with basic information"""
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 50))
        skip = (page - 1) * limit
        
        users = list(mongo.db.users.find(
            {},
            {
                'name': 1,
                'email': 1, 
                'role': 1,
                'created_at': 1,
                'last_login': 1,
                'is_active': 1,
                'email_verified': 1
            }
        ).skip(skip).limit(limit))
        
        # Convert ObjectId to string for JSON serialization
        for user in users:
            user['_id'] = str(user['_id'])
        
        total_count = mongo.db.users.count_documents({})
        
        return jsonify({
            "success": True,
            "users": users,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total_count,
                "pages": (total_count + limit - 1) // limit
            },
            "timestamp": datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Error in get_users_list: {e}")
        return jsonify({
            "success": False,
            "error": "Failed to get users list",
            "details": str(e)
        }), 500