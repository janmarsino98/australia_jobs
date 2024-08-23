from flask import Blueprint, jsonify, request, session
from extensions import mongo, bcrypt  # Import from extensions
from flask_pymongo import ObjectId
from datetime import datetime
import constants as c

jobtypes_bp = Blueprint("jobtypes_bp", __name__)
jobtypes_db = mongo.db.job_types

@jobtypes_bp.route("/get_all")
def get_jobtypes():
    jobtypes = jobtypes_db.find({})
    final_jobtypes = []
    for jobtype in jobtypes:
        jobtype["_id"] = str(jobtype["_id"])
        final_jobtypes.append(jobtype)
        
    return jsonify(final_jobtypes)


@jobtypes_bp.route("/add", methods=["POST"])
def add_jobtype():
    data = request.get_json()
    
    if not data["jobtype"]:
        return jsonify({"error": "Jobtype is requierd"}), 400
    jobtype = data["jobtype"]
    
    current_jobtypes = [jt["jobtype"] for jt in jobtypes_db.find({})]
    
    if jobtype in current_jobtypes:
        return jsonify({"error": "Jobtype already exists"}), 400
    
    avatar = data["avatar"]
    result = jobtypes_db.insert_one({
        "jobtype": jobtype,
        "avatar": avatar
        })
    
    if not result.inserted_id:
        return jsonify({"error": "No job types inserted"}), 400
    return jsonify({"message": "Job Type added correctly"}), 200

@jobtypes_bp.route("/remove", methods=["DELETE"])
def remove_jobtype():
    data = request.get_json()
    type_to_remove = data["jobtype"]
    if not type_to_remove:
        return jsonify({"error": "You must specify the jobtype that you want to remove."}), 400
    
    else:
        result = jobtypes_db.delete_one({"jobtype": type_to_remove})
        if result.deleted_count == 1:
            return jsonify({"message": "jobtype removed successfully"}), 200
        

@jobtypes_bp.route("/modify", methods=["PUT"])
def modify_jobtype():
    data = request.get_json()
    jobtype_to_modify = data["jobtype"]
    new_avatar = data["avatar"]
    if not jobtype_to_modify or not new_avatar:
        return jsonify({"error", "You must specify a jobtype that you want to modify and the new avatar that you want to set"}), 400
    
    result = jobtypes_db.update_one({"jobtype": jobtype_to_modify}, {"$set": {"avatar": new_avatar}})
    if result.modified_count == 1:
        return jsonify({"message": "Jobtype picture updated successfully"}), 200
