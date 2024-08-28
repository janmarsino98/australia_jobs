from flask import Blueprint, jsonify, request, session
from extensions import mongo, bcrypt  # Import from extensions
from flask_pymongo import ObjectId
from datetime import datetime
import constants as c


cities_bp = Blueprint("cities_bp", __name__)
cities_db = mongo.db.cities

@cities_bp.route("/add_all", methods=["POST"])
def add_all_cities():
    data = request.get_json()
    for city in data:
        cities_db.insert_one({"city":city["city"], "state": city["admin_name"]})
        
    return jsonify({"message": "Cities added correctly!"}), 200

@cities_bp.route("/get_all", methods=["GET"])
def get_all_cities():
    cities = cities_db.find({})
    final_cities = []
    for city in cities:
        city["_id"] = str(city["_id"])
        final_cities.append(city)
    return jsonify(final_cities)