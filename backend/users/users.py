from flask import Blueprint, jsonify, request, session, send_file
from extensions import mongo, bcrypt  # Import from extensions
from flask_pymongo import ObjectId
from datetime import datetime
import constants as c
import gridfs
import io
from PIL import Image
import os

users_bp = Blueprint("users_bp", __name__)

def get_users_db():
    return mongo.db.users


@users_bp.route("/add", methods=["POST"])
def add_user():
    data = request.get_json()
    username = data.get('username')
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    user_type = data.get('type')
    
    if not username:
        return jsonify({"error": "Username is required"}), 400
    
    if not name:
        return jsonify({"error": "Name is required"}), 400
    if not email:
        return jsonify({"error": "Email is required"}), 400
    if not password:
        return jsonify({"error": "Password is required"}), 400
    if not user_type:
        return jsonify({"error": "User type is required"}), 400

    get_users_db().insert_one({
        "username": username,
        "name": name,
        "email": email,
        "password": bcrypt.generate_password_hash(data["password"]),
        "user_type": user_type,
        "created_at": datetime.utcnow(),
        "avatar": c.DEFAULT_AVATAR
        })
    return jsonify({"message": "User added successfully!"}), 201
    

@users_bp.route("/modify", methods=["PUT"])
def modify_user():
    data = request.get_json()
    username = data["username"]
    name = data["name"]
    email = data["email"]
    avatar = data["avatar"]
    
    if not username:
        return jsonify({"error": "You must specify a username"}), 400
    
    update_fields = {}
    if name:
        update_fields["name"] = name
    if email:
        update_fields["email"] = email
    if avatar:
        update_fields["avatar"] = avatar

    if update_fields:
        result = get_users_db().update_one({"username": username}, {"$set": update_fields})
        if result.matched_count == 0:
            return jsonify({"error": "User not found"}), 404
        return jsonify({"message": "User updated successfully"}), 200
    
    return jsonify({"error": "No fields to update"}), 400

@users_bp.route("/remove", methods=["DELETE"])
def remove_user():
    data = request.get_json()
    username = data["username"]
    
    if not username:
        return ({"error": "You must provide a username to delete"}), 400
    
    user_to_remove = get_users_db().delete_one({"username": username})
    if user_to_remove.deleted_count == 1:
        return jsonify({"message": "User deleted!"}), 200
    
    else:
        return jsonify({"error": "User not found"}), 404


@users_bp.route("/get_all", methods=["GET"])
def get_users():
    final_users = []
    users = get_users_db().find()
    for user in users:
        user["_id"] = str(user["_id"])
        user.pop("password", None)
        final_users.append(user)
    return jsonify(final_users)

@users_bp.route("/get_one", methods=["GET"])
def get_user():
    data = request.get_json()
    user = data["user"]
    
    if not user:
        return jsonify({"error": "You must specify a user to get"}), 400
    
    found_user = get_users_db().find_one({"username": user})
    if found_user:
        found_user["_id"] = str(found_user["_id"])
        found_user.pop("password", None)
        return jsonify(found_user)
    else:
        return jsonify({"error": "User not found"}), 404


# Profile endpoints
@users_bp.route("/profile", methods=["GET"])
def get_profile():
    """Get user profile data"""
    if 'user_id' not in session:
        return jsonify({"error": "Not authenticated"}), 401
    
    try:
        user_id = ObjectId(session['user_id'])
        user = get_users_db().find_one({"_id": user_id})
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Remove sensitive data
        user.pop("password", None)
        user["_id"] = str(user["_id"])
        
        return jsonify(user), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@users_bp.route("/profile", methods=["PUT"])
def update_profile():
    """Update user profile data"""
    if 'user_id' not in session:
        return jsonify({"error": "Not authenticated"}), 401
    
    try:
        user_id = ObjectId(session['user_id'])
        data = request.get_json()
        
        # Get current user
        current_user = get_users_db().find_one({"_id": user_id})
        if not current_user:
            return jsonify({"error": "User not found"}), 404
        
        # Fields that can be updated
        allowed_fields = ['name', 'email', 'phone', 'bio', 'location', 'skills', 'social_links']
        update_data = {}
        email_change_requested = False
        new_email = None
        
        for field in allowed_fields:
            if field in data:
                if field == 'email':
                    new_email = data[field].strip().lower()
                    # Check if email is actually changing
                    if new_email != current_user.get('email'):
                        email_change_requested = True
                        # Validate email format
                        from utils import validate_email
                        if not validate_email(new_email):
                            return jsonify({"error": "Please enter a valid email address"}), 400
                        
                        # Check if email is already taken by another user
                        existing_user = get_users_db().find_one({
                            "email": new_email,
                            "_id": {"$ne": user_id}
                        })
                        if existing_user:
                            return jsonify({"error": "An account with this email already exists"}), 409
                        
                        # Don't update email directly - require verification first
                        # Store pending email change
                        update_data['pending_email'] = new_email
                        update_data['pending_email_at'] = datetime.utcnow()
                else:
                    update_data[field] = data[field]
        
        if not update_data and not email_change_requested:
            return jsonify({"error": "No valid fields to update"}), 400
        
        update_data['updated_at'] = datetime.utcnow()
        
        # If email change is requested, send verification email
        if email_change_requested:
            from email_service import create_email_verification_token, send_email_change_verification
            verification_token = create_email_verification_token(new_email)
            if verification_token:
                # Send email to new address for verification
                success, message = send_email_change_verification(
                    new_email, 
                    current_user.get('name', ''), 
                    verification_token,
                    current_user.get('email', '')  # current email for reference
                )
                if not success:
                    return jsonify({"error": f"Failed to send verification email: {message}"}), 500
        
        result = get_users_db().update_one(
            {"_id": user_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            return jsonify({"error": "User not found"}), 404
        
        # Get updated user
        updated_user = get_users_db().find_one({"_id": user_id})
        updated_user.pop("password", None)
        
        # Convert any ObjectId fields to strings
        for key, value in updated_user.items():
            if isinstance(value, ObjectId):
                updated_user[key] = str(value)
        
        response_data = updated_user
        if email_change_requested:
            response_data["message"] = f"A verification email has been sent to {new_email}. Please verify to complete the email change."
            response_data["email_verification_pending"] = True
        
        return jsonify(response_data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@users_bp.route("/profile/image", methods=["POST"])
def upload_profile_image():
    """Upload and update user profile image"""
    if 'user_id' not in session:
        return jsonify({"error": "Not authenticated"}), 401
    
    if 'profileImage' not in request.files:
        return jsonify({"error": "No image file provided"}), 400
    
    file = request.files['profileImage']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    try:
        user_id = ObjectId(session['user_id'])
        
        # Validate file type
        allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
        file_extension = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
        
        if file_extension not in allowed_extensions:
            return jsonify({"error": "Invalid file type. Allowed: PNG, JPG, JPEG, GIF, WEBP"}), 400
        
        # Read and process image
        image_data = file.read()
        
        # Resize image to reasonable size (max 800x800) to save storage
        try:
            image = Image.open(io.BytesIO(image_data))
            
            # Convert to RGB if necessary (for JPEG compatibility)
            if image.mode in ('RGBA', 'LA', 'P'):
                image = image.convert('RGB')
            
            # Resize if too large
            max_size = (800, 800)
            if image.size[0] > max_size[0] or image.size[1] > max_size[1]:
                image.thumbnail(max_size, Image.Resampling.LANCZOS)
            
            # Save to bytes
            img_io = io.BytesIO()
            image.save(img_io, format='JPEG', quality=85, optimize=True)
            image_data = img_io.getvalue()
            
        except Exception as e:
            return jsonify({"error": "Failed to process image"}), 400
        
        # Initialize GridFS
        fs = gridfs.GridFS(mongo.db)
        
        # Remove old profile image if exists
        user = get_users_db().find_one({"_id": user_id})
        if user and user.get('profileImage'):
            try:
                old_file_id = ObjectId(user['profileImage'])
                if fs.exists(old_file_id):
                    fs.delete(old_file_id)
                    print(f"Deleted old profile image: {old_file_id}")
                else:
                    print(f"Old profile image not found in GridFS: {old_file_id}")
            except Exception as e:
                print(f"Error deleting old profile image: {e}")
                # Continue with upload even if deletion fails
        
        # Store new image in GridFS
        file_id = fs.put(
            image_data,
            filename=f"profile_{user_id}.jpg",
            content_type="image/jpeg",
            metadata={"user_id": str(user_id), "type": "profile_image"}
        )
        
        # Update user document with new image ID
        result = get_users_db().update_one(
            {"_id": user_id},
            {"$set": {
                "profileImage": str(file_id),
                "updated_at": datetime.utcnow()
            }}
        )
        
        if result.matched_count == 0:
            return jsonify({"error": "User not found"}), 404
        
        # Get updated user data
        updated_user = get_users_db().find_one({"_id": user_id})
        if updated_user:
            updated_user.pop("password", None)
            updated_user["_id"] = str(updated_user["_id"])
            
            # Convert any other ObjectId fields to strings
            for key, value in updated_user.items():
                if isinstance(value, ObjectId):
                    updated_user[key] = str(value)
        
        return jsonify(updated_user), 200
        
    except Exception as e:
        return jsonify({"error": f"Failed to upload image: {str(e)}"}), 500


@users_bp.route("/profile/image/<image_id>", methods=["GET"])
def get_profile_image(image_id):
    """Serve profile image from GridFS"""
    try:
        fs = gridfs.GridFS(mongo.db)
        file_id = ObjectId(image_id)
        
        try:
            file = fs.get(file_id)
            return send_file(
                io.BytesIO(file.read()),
                mimetype=file.content_type or "image/jpeg",
                as_attachment=False
            )
        except gridfs.errors.NoFile:
            return jsonify({"error": "Image not found"}), 404
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Skills management
@users_bp.route("/profile/skills", methods=["PUT"])
def update_skills():
    """Update user skills"""
    if 'user_id' not in session:
        return jsonify({"error": "Not authenticated"}), 401
    
    try:
        user_id = ObjectId(session['user_id'])
        data = request.get_json()
        
        if 'skills' not in data or not isinstance(data['skills'], list):
            return jsonify({"error": "Skills must be provided as an array"}), 400
        
        result = get_users_db().update_one(
            {"_id": user_id},
            {"$set": {
                "skills": data['skills'],
                "updated_at": datetime.utcnow()
            }}
        )
        
        if result.matched_count == 0:
            return jsonify({"error": "User not found"}), 404
        
        return jsonify({"message": "Skills updated successfully"}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Experience management
@users_bp.route("/profile/experience", methods=["POST"])
def add_experience():
    """Add work experience"""
    if 'user_id' not in session:
        return jsonify({"error": "Not authenticated"}), 401
    
    try:
        user_id = ObjectId(session['user_id'])
        data = request.get_json()
        
        required_fields = ['jobTitle', 'company', 'startDate']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"{field} is required"}), 400
        
        # Generate unique ID for experience
        experience_id = str(ObjectId())
        experience = {
            "id": experience_id,
            "jobTitle": data['jobTitle'],
            "company": data['company'],
            "location": data.get('location', ''),
            "startDate": data['startDate'],
            "endDate": data.get('endDate', ''),
            "current": data.get('current', False),
            "description": data.get('description', ''),
            "created_at": datetime.utcnow()
        }
        
        result = get_users_db().update_one(
            {"_id": user_id},
            {"$push": {"experience": experience}}
        )
        
        if result.matched_count == 0:
            return jsonify({"error": "User not found"}), 404
        
        return jsonify(experience), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@users_bp.route("/profile/experience/<experience_id>", methods=["DELETE"])
def remove_experience(experience_id):
    """Remove work experience"""
    if 'user_id' not in session:
        return jsonify({"error": "Not authenticated"}), 401
    
    try:
        user_id = ObjectId(session['user_id'])
        
        result = get_users_db().update_one(
            {"_id": user_id},
            {"$pull": {"experience": {"id": experience_id}}}
        )
        
        if result.matched_count == 0:
            return jsonify({"error": "User not found"}), 404
        
        return jsonify({"message": "Experience removed successfully"}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Education management
@users_bp.route("/profile/education", methods=["POST"])
def add_education():
    """Add education"""
    if 'user_id' not in session:
        return jsonify({"error": "Not authenticated"}), 401
    
    try:
        user_id = ObjectId(session['user_id'])
        data = request.get_json()
        
        required_fields = ['degree', 'institution', 'startDate']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"{field} is required"}), 400
        
        # Generate unique ID for education
        education_id = str(ObjectId())
        education = {
            "id": education_id,
            "degree": data['degree'],
            "institution": data['institution'],
            "location": data.get('location', ''),
            "startDate": data['startDate'],
            "endDate": data.get('endDate', ''),
            "current": data.get('current', False),
            "gpa": data.get('gpa', ''),
            "created_at": datetime.utcnow()
        }
        
        result = get_users_db().update_one(
            {"_id": user_id},
            {"$push": {"education": education}}
        )
        
        if result.matched_count == 0:
            return jsonify({"error": "User not found"}), 404
        
        return jsonify(education), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@users_bp.route("/profile/education/<education_id>", methods=["DELETE"])
def remove_education(education_id):
    """Remove education"""
    if 'user_id' not in session:
        return jsonify({"error": "Not authenticated"}), 401
    
    try:
        user_id = ObjectId(session['user_id'])
        
        result = get_users_db().update_one(
            {"_id": user_id},
            {"$pull": {"education": {"id": education_id}}}
        )
        
        if result.matched_count == 0:
            return jsonify({"error": "User not found"}), 404
        
        return jsonify({"message": "Education removed successfully"}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Preferences management
@users_bp.route("/profile/preferences", methods=["PUT"])
def update_preferences():
    """Update job preferences"""
    if 'user_id' not in session:
        return jsonify({"error": "Not authenticated"}), 401
    
    try:
        user_id = ObjectId(session['user_id'])
        data = request.get_json()
        
        result = get_users_db().update_one(
            {"_id": user_id},
            {"$set": {
                "preferences": data,
                "updated_at": datetime.utcnow()
            }}
        )
        
        if result.matched_count == 0:
            return jsonify({"error": "User not found"}), 404
        
        return jsonify(data), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
