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
    
    # New advanced filter parameters
    salary_min = request.args.get("salaryMin", "")
    salary_max = request.args.get("salaryMax", "")
    job_type_filter = request.args.get("jobType", "")
    experience_level = request.args.get("experienceLevel", "")
    date_posted = request.args.get("datePosted", "")
    work_arrangement = request.args.get("workArrangement", "")

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
    
    # Handle jobType filter (from advanced filters)
    if job_type_filter:
        search_parameters["jobtype"] = {"$regex": job_type_filter, "$options": "i"}
    
    # Handle salary range filters
    if salary_min or salary_max:
        salary_filter = {}
        if salary_min:
            try:
                salary_filter["$gte"] = int(salary_min)
            except ValueError:
                pass
        if salary_max:
            try:
                salary_filter["$lte"] = int(salary_max)
            except ValueError:
                pass
        if salary_filter:
            search_parameters["remuneration_amount"] = salary_filter
    
    # Handle experience level filter
    if experience_level:
        # Map experience levels to keywords that might appear in job descriptions
        experience_keywords = {
            "entry": ["entry", "junior", "graduate", "trainee", "beginner"],
            "mid": ["mid", "intermediate", "experienced", "3-5 years"],
            "senior": ["senior", "lead", "principal", "5+ years", "expert"],
            "executive": ["executive", "director", "manager", "head", "chief"]
        }
        if experience_level in experience_keywords:
            keywords = experience_keywords[experience_level]
            search_parameters["$or"] = search_parameters.get("$or", []) + [
                {"description": {"$regex": keyword, "$options": "i"}} for keyword in keywords
            ]
    
    # Handle date posted filter
    if date_posted:
        from datetime import datetime, timedelta
        now = datetime.now()
        date_filters = {
            "today": now - timedelta(days=1),
            "last3days": now - timedelta(days=3),
            "lastWeek": now - timedelta(days=7),
            "lastMonth": now - timedelta(days=30)
        }
        if date_posted in date_filters:
            search_parameters["created_at"] = {
                "$gte": date_filters[date_posted].isoformat()
            }
    
    # Handle work arrangement filter
    if work_arrangement:
        arrangement_keywords = {
            "remote": ["remote", "work from home", "wfh"],
            "on-site": ["on-site", "office", "in-person"],
            "hybrid": ["hybrid", "flexible", "mixed"]
        }
        if work_arrangement in arrangement_keywords:
            keywords = arrangement_keywords[work_arrangement]
            arrangement_or = [
                {"description": {"$regex": keyword, "$options": "i"}} for keyword in keywords
            ]
            if "$or" in search_parameters:
                search_parameters["$and"] = [
                    {"$or": search_parameters["$or"]},
                    {"$or": arrangement_or}
                ]
                del search_parameters["$or"]
            else:
                search_parameters["$or"] = arrangement_or

    print("Search parameters:", search_parameters)
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


@jobs_bp.route("/suggestions/titles", methods=["GET"])
def get_title_suggestions():
    query = request.args.get("q", "").strip()
    if not query or len(query) < 2:
        return jsonify([])
    
    try:
        # Aggregate unique job titles that match the query
        pipeline = [
            {
                "$match": {
                    "title": {"$regex": query, "$options": "i"}
                }
            },
            {
                "$group": {
                    "_id": "$title",
                    "count": {"$sum": 1}
                }
            },
            {
                "$sort": {"count": -1}
            },
            {
                "$limit": 8
            }
        ]
        
        suggestions = list(jobs_db.aggregate(pipeline))
        formatted_suggestions = [
            {
                "value": suggestion["_id"],
                "type": "title",
                "count": suggestion["count"]
            }
            for suggestion in suggestions
        ]
        
        return jsonify(formatted_suggestions)
    except Exception as e:
        print(f"Error getting title suggestions: {e}")
        return jsonify([])


@jobs_bp.route("/suggestions/locations", methods=["GET"])
def get_location_suggestions():
    query = request.args.get("q", "").strip()
    if not query or len(query) < 2:
        return jsonify([])
    
    try:
        # Aggregate unique locations that match the query
        pipeline = [
            {
                "$match": {
                    "location": {"$regex": query, "$options": "i"}
                }
            },
            {
                "$group": {
                    "_id": "$location",
                    "count": {"$sum": 1}
                }
            },
            {
                "$sort": {"count": -1}
            },
            {
                "$limit": 6
            }
        ]
        
        suggestions = list(jobs_db.aggregate(pipeline))
        formatted_suggestions = [
            {
                "value": suggestion["_id"],
                "type": "location",
                "count": suggestion["count"]
            }
            for suggestion in suggestions
        ]
        
        return jsonify(formatted_suggestions)
    except Exception as e:
        print(f"Error getting location suggestions: {e}")
        return jsonify([])


@jobs_bp.route("/<slug>", methods= ["GET"])
def get_job_by_slug(slug):
    job = jobs_db.find_one({"slug": slug})
    if job:
        job["_id"] = str(job["_id"])
        return jsonify(job)
    
    return jsonify({"error": "No job found with the specified slug!"})