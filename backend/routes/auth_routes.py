# Example: auth_routes.py
from flask import Blueprint, request, jsonify, session
from server import bcrypt, users_db
from flask_pymongo import ObjectId

auth_bp = Blueprint('auth_bp', __name__)

@auth_bp.route("/login", methods=["POST"])
def login_user():
    data = request.get_json()
    email = data["email"]
    password = data["password"]
    
    user = users_db.find_one({"email": email})
    
    if not user:
        return jsonify({"error": "Check your email and password"}), 401
    
    if not bcrypt.check_password_hash(user["password"], password):
        return jsonify({"error": "Check your email and password"}), 401
    
    session["user_id"] = str(user["_id"])
    print("Session after login")
    print(session)
    return jsonify({
        "id": str(user["_id"]),
        "email": user["email"]
        }), 200

@auth_bp.route("/@me", methods=["GET"])
def get_current_user():
    print("Session before me: ")
    print(session)
    user_id = session.get("user_id")

    if not user_id:
        return jsonify({"error":"Unauthorized"}), 401
    
    user = users_db.find_one({"_id": ObjectId(user_id)})

    user["_id"] = str(user["_id"])
    user["password"] = ""
    
    return jsonify(
        user
    )
