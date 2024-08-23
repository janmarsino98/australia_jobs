from flask import Blueprint, jsonify, request, session
from extensions import mongo, bcrypt  # Import from extensions
from flask_pymongo import ObjectId

trial_bp = Blueprint("trial_bp", __name__)
users_db = mongo.db.users