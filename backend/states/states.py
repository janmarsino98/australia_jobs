from flask import Blueprint, jsonify, request, session
from extensions import mongo, bcrypt  # Import from extensions
from flask_pymongo import ObjectId
from datetime import datetime
import constants as c


states_bp = Blueprint("states_bp", __name__)
states_db = mongo.db.states

@states_bp.route("/add_all", methods=["POST"])
def add_all_states():
    data = request.get_json()
    all_states = []
    for city in data:
        if city["admin_name"] not in all_states:
            all_states.append(city["admin_name"])
    
    for state in all_states:
        states_db.insert_one({"state":state})
        
    return jsonify({"message":"Created correctly!"})

@states_bp.route("/get_all", methods=["GET"])
def get_all_states():
    states = states_db.find({})
    final_states = []
    for state in states:
        state["_id"] = str(state["_id"])
        final_states.append(state)

    return jsonify(final_states)

@states_bp.route("/add_ab", methods=["PUT"])
def add_states_ab():
    data = request.get_json()
    for state in data:
        state = states_db.update_one({"state": state["state"]}, {"$set": {"ab": state["ab"]}})
        
    return jsonify({"message": "Abreviations added correctly!"})

