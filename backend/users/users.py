from flask import Blueprint, jsonify, request, session
from extensions import mongo, bcrypt  # Import from extensions
from flask_pymongo import ObjectId
from datetime import datetime
import constants as c

users_bp = Blueprint("users_bp", __name__)
users_db = mongo.db.users


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

    users_db.insert_one({
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
        result = users_db.update_one({"username": username}, {"$set": update_fields})
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
    
    user_to_remove = users_db.delete_one({"username": username})
    if user_to_remove.deleted_count == 1:
        return jsonify({"message": "User deleted!"}), 200
    
    else:
        return jsonify({"error": "User not found"}), 404


@users_bp.route("/get_all", methods=["GET"])
def get_users():
    final_users = []
    users = users_db.find()
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
    
