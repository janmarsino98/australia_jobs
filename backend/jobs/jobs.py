from flask import Blueprint, jsonify, request, session
from extensions import mongo, bcrypt  # Import from extensions
from flask_pymongo import ObjectId
from datetime import datetime
import constants as c

jobs_bp = Blueprint("jobs_bp", __name__)
jobs_db = mongo.db.jobs

@jobs_bp.route("/add", methods=["POST"])
def add_job():
    data = request.get_json()
    title = data["title"]
    description = data["description"]
    remuneration_amount = data["remuneration_amount"]
    remuneration_period = data["remuneration_period"]
    firm = data["firm"]
    jobtype = data["jobtype"]
    
    if not title:
        return jsonify({"error": "Job title is mandatory"}), 400
    if not description:
        return jsonify({"error": "Job description is mandatory"}), 400
    if not remuneration_amount:
        return jsonify({"error": "Job remuneration_amount is mandatory"}), 400
    if not remuneration_period:
        return jsonify({"error": "Job remuneration_period is mandatory"}), 400
    if not firm:
        return jsonify({"error": "Job firm is mandatory"}), 400
    if not jobtype:
        return jsonify({"error": "Job jobtype is mandatory"}), 400
    
    result = jobs_db.insert_one({
        "title": title,
        "description": description,
        "remuneration_amount": remuneration_amount,
        "remuneration_period": remuneration_period,
        "firm": firm,
        "jobtype": jobtype
    })
    
    if result.inserted_id:
        return jsonify({"messsage": "Job inserted successfuly"}), 200
    return jsonify({"error": "Could not insert job"}), 400

@jobs_bp.route("/get_one", methods=["GET"])
def get_job():
    data = request.get_json()
    job_id = data["job_id"]
    if not job_id:
        return jsonify({"error": "You must specify a job id"}), 400
    
    job = jobs_db.find_one({"_id": job_id})
    job["_id"] = str(job["_id"])
    return jsonify(job)

@jobs_bp.route("/modify", methods=["PUT"])
def modify_job():
    data = request.get_json()
    job_id = data["job_id"]
    
    if not job_id:
        return jsonify({"error": "You must specify the job id that you want to modify."}), 400
    
    try:
        job_id = ObjectId(job_id)
        
    except:
        return jsonify({"error": "Invalid job ID format."}), 400
    
    job_to_modify = jobs_db.find_one({"_id": job_id})

    if not job_to_modify:
        return jsonify({"error": "Job not found."}), 400
    
    update_fields = {key: value for key, value in data.items() if key in job_to_modify and key != "job_id"}
    
    if not update_fields:
        return jsonify({"error": "No fields to update."}), 400
    
    result = jobs_db.update_one({"_id": job_id}, {"$set": update_fields})
    
    if result.modified_count == 1:       
        return jsonify({"message": "Job modified correctly!"}), 200
    else:
        return jsonify({"message": "No changes were made."}), 200
    

@jobs_bp.route("/delete")
def delete_job():
    data = request.get_json()
    job_id = data["_id"]
    if not job_id:
        return jsonify({"error": "You must specify a job ID to delete"}), 400
    
    try:
        job_id = ObjectId(job_id)
        
    except:
        return jsonify({"error": "Wrong job ID format."}), 400
    
    result = jobs_db.delete_one({"_id": job_id})
    
    if result.deleted_count == 1:
        return jsonify({"message": "Job deleted correctly."}), 200
    
    else:
        return jsonify({"message": "No jobs removed."}), 200