from flask import Blueprint, jsonify, request, session
from extensions import mongo, bcrypt  # Import from extensions
from flask_pymongo import ObjectId
from datetime import datetime
import constants as c
import string
from slugify import slugify
import random


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
    shift = data["shift"]
    city = data["location"]["city"]
    
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
    
    slug = create_slug_with_code(title, city)
    
    result = jobs_db.insert_one({
        "title": title,
        "description": description,
        "remuneration_amount": remuneration_amount,
        "remuneration_period": remuneration_period,
        "firm": firm,
        "shift": shift,
        "jobtype": jobtype,
        "location": city,
        "created_at": datetime.now().isoformat(),
        "slug": slug,
    })
    
    if result.inserted_id:
        return jsonify({"messsage": "Job inserted successfuly"}), 200
    return jsonify({"error": "Could not insert job"}), 400

@jobs_bp.route("/get_one", methods=["GET"])
def get_one_job():
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
    
    
@jobs_bp.route("/get", methods=["GET"])
def get_jobs():

    job_title = request.args.get("title", "")
    location = request.args.get("location", "")
    job_type = request.args.get("type", "")

    search_parameters = {}

    if job_title:
        search_parameters["$or"] = [
            {"title": {"$regex": job_title, "$options": "i"}},
            {"description": {"$regex": job_title, "$options": "i"}}
        ]
        
    if location:
        location_list = location.split(",")
        search_parameters["location"] = {"$in": location_list}


    if job_type:
        job_type_list = job_type.split(",")
        search_parameters["jobtype"] = {"$in": job_type_list}
    print(search_parameters)
    jobs_to_retrieve = jobs_db.find(search_parameters)
    
    final_jobs_to_retrieve = []
    for job in jobs_to_retrieve:
        job["_id"] = str(job["_id"])
        final_jobs_to_retrieve.append(job)
        
    return jsonify(final_jobs_to_retrieve)


@jobs_bp.route("/delete_all", methods=["DELETE"])
def delete_all_jobs():
    r = jobs_db.delete_many({})
    return jsonify({"message": "Deleted all jobs"}), 200


@jobs_bp.route("/add_slug", methods=["PUT"])
def add_slug():
    jobs = jobs_db.find({})
    for job in jobs:
        title = ""
        location =""
        try:
            title = job["title"]
            location = job["location"]
        except:
            print(job)
        if title and location:
            slug = create_slug_with_code(title, location)
            jobs_db.update_one({
                "_id": job["_id"]
            }, {"$set": {"slug": slug}})
            print(f"Updated job {title} with slug {slug}")
    
        else:
            print(f"Unable to slugify job {title}")
            
    return jsonify({"message": "Task slugs added correctly!"})  
    
def generate_random_code(length=6):
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))

def create_slug_with_code(job_title, location):
    base_slug = slugify(f"{job_title} {location}")
    random_code = generate_random_code()
    return f"{base_slug}-{random_code}"


@jobs_bp.route("/<slug>", methods= ["GET"])
def get_job_by_slug(slug):
    job = jobs_db.find_one({"slug": slug})
    if job:
        job["_id"] = str(job["_id"])
        return jsonify(job)
    
    return jsonify({"error": "No job found with the specified slug!"})