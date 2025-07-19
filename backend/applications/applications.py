"""
Job Applications Blueprint
Handles job application functionality including submission, tracking, and management
"""
from flask import Blueprint, jsonify, request, session
from extensions import mongo, fs
from flask_pymongo import ObjectId
from datetime import datetime
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils import (
    validate_required_fields, validate_json_request, 
    standardize_error_response, standardize_success_response, require_auth
)

applications_bp = Blueprint("applications_bp", __name__)
applications_db = mongo.db.applications
jobs_db = mongo.db.jobs
users_db = mongo.db.users

# Application status constants
APPLICATION_STATUSES = [
    'pending',      # Initial status when application is submitted
    'reviewing',    # Application is being reviewed by employer
    'interviewed',  # Candidate has been interviewed
    'accepted',     # Application accepted
    'rejected',     # Application rejected
    'withdrawn'     # Application withdrawn by candidate
]

@applications_bp.route("/submit", methods=["POST"])
@validate_json_request
@require_auth
def submit_application():
    """Submit a job application"""
    try:
        data = request.get_json()
        user_id = session.get("user_id")
        
        # Validate required fields
        required_fields = ["job_id"]
        is_valid, message = validate_required_fields(data, required_fields)
        if not is_valid:
            return standardize_error_response(message, 400)
        
        job_id = data["job_id"].strip()
        cover_letter = data.get("cover_letter", "").strip()
        additional_notes = data.get("additional_notes", "").strip()
        
        # Validate job_id format
        try:
            job_object_id = ObjectId(job_id)
        except:
            return standardize_error_response("Invalid job ID format", 400)
        
        # Check if job exists
        job = jobs_db.find_one({"_id": job_object_id})
        if not job:
            return standardize_error_response("Job not found", 404)
        
        # Check if user already applied for this job
        existing_application = applications_db.find_one({
            "applicant_id": ObjectId(user_id),
            "job_id": job_object_id
        })
        
        if existing_application:
            return standardize_error_response("You have already applied for this job", 409)
        
        # Get user information
        user = users_db.find_one({"_id": ObjectId(user_id)})
        if not user:
            return standardize_error_response("User not found", 404)
        
        # Check if user has verified email (optional requirement)
        if not user.get("email_verified", False):
            return standardize_error_response("Please verify your email before applying for jobs", 403)
        
        # Create application
        now = datetime.utcnow()
        application = {
            "applicant_id": ObjectId(user_id),
            "job_id": job_object_id,
            "employer_id": job.get("employer_id"),  # If job has employer_id
            "status": "pending",
            "cover_letter": cover_letter,
            "additional_notes": additional_notes,
            "applied_at": now,
            "updated_at": now,
            "status_history": [{
                "status": "pending",
                "changed_at": now,
                "changed_by": ObjectId(user_id),
                "notes": "Application submitted"
            }]
        }
        
        result = applications_db.insert_one(application)
        application_id = str(result.inserted_id)
        
        # Update job with application count (optional)
        jobs_db.update_one(
            {"_id": job_object_id},
            {"$inc": {"application_count": 1}}
        )
        
        return standardize_success_response({
            "application": {
                "id": application_id,
                "job_id": job_id,
                "status": "pending",
                "applied_at": now.isoformat(),
                "job_title": job.get("title"),
                "company": job.get("firm")
            }
        }, "Application submitted successfully", 201)
        
    except Exception as e:
        print(f"Error submitting application: {e}")
        return standardize_error_response("Failed to submit application", 500)


@applications_bp.route("/my-applications", methods=["GET"])
@require_auth
def get_my_applications():
    """Get all applications for the current user"""
    try:
        user_id = session.get("user_id")
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        status_filter = request.args.get('status')
        
        # Build query
        query = {"applicant_id": ObjectId(user_id)}
        if status_filter and status_filter in APPLICATION_STATUSES:
            query["status"] = status_filter
        
        # Get total count
        total = applications_db.count_documents(query)
        
        # Get applications with pagination
        skip = (page - 1) * limit
        applications = applications_db.find(query).sort("applied_at", -1).skip(skip).limit(limit)
        
        # Format applications with job details
        formatted_applications = []
        for app in applications:
            # Get job details
            job = jobs_db.find_one({"_id": app["job_id"]})
            
            formatted_app = {
                "id": str(app["_id"]),
                "job_id": str(app["job_id"]),
                "status": app["status"],
                "applied_at": app["applied_at"].isoformat(),
                "updated_at": app["updated_at"].isoformat(),
                "cover_letter": app.get("cover_letter", ""),
                "additional_notes": app.get("additional_notes", "")
            }
            
            # Add job details if found
            if job:
                formatted_app["job"] = {
                    "title": job.get("title"),
                    "company": job.get("firm"),
                    "location": job.get("location"),
                    "jobtype": job.get("jobtype"),
                    "remuneration_amount": job.get("remuneration_amount"),
                    "remuneration_period": job.get("remuneration_period")
                }
            
            formatted_applications.append(formatted_app)
        
        return standardize_success_response({
            "applications": formatted_applications,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "pages": (total + limit - 1) // limit
            }
        }, status_code=200)
        
    except Exception as e:
        print(f"Error fetching applications: {e}")
        return standardize_error_response("Failed to fetch applications", 500)


@applications_bp.route("/<application_id>", methods=["GET"])
@require_auth
def get_application_details(application_id):
    """Get detailed information about a specific application"""
    try:
        user_id = session.get("user_id")
        
        # Validate application_id format
        try:
            app_object_id = ObjectId(application_id)
        except:
            return standardize_error_response("Invalid application ID format", 400)
        
        # Get application
        application = applications_db.find_one({"_id": app_object_id})
        
        if not application:
            return standardize_error_response("Application not found", 404)
        
        # Check if user owns this application or is the employer
        user = users_db.find_one({"_id": ObjectId(user_id)})
        is_owner = str(application["applicant_id"]) == user_id
        is_employer = (user.get("role") == "employer" and 
                      application.get("employer_id") and 
                      str(application["employer_id"]) == user_id)
        
        if not (is_owner or is_employer):
            return standardize_error_response("Access denied", 403)
        
        # Get job details
        job = jobs_db.find_one({"_id": application["job_id"]})
        
        # Get applicant details (for employers)
        applicant = None
        if is_employer:
            applicant = users_db.find_one({"_id": application["applicant_id"]})
        
        # Format response
        response_data = {
            "id": str(application["_id"]),
            "job_id": str(application["job_id"]),
            "status": application["status"],
            "cover_letter": application.get("cover_letter", ""),
            "additional_notes": application.get("additional_notes", ""),
            "applied_at": application["applied_at"].isoformat(),
            "updated_at": application["updated_at"].isoformat(),
            "status_history": [
                {
                    "status": history["status"],
                    "changed_at": history["changed_at"].isoformat(),
                    "notes": history.get("notes", "")
                }
                for history in application.get("status_history", [])
            ]
        }
        
        # Add job details
        if job:
            response_data["job"] = {
                "title": job.get("title"),
                "description": job.get("description"),
                "company": job.get("firm"),
                "location": job.get("location"),
                "jobtype": job.get("jobtype"),
                "remuneration_amount": job.get("remuneration_amount"),
                "remuneration_period": job.get("remuneration_period"),
                "created_at": job.get("created_at")
            }
        
        # Add applicant details for employers
        if is_employer and applicant:
            response_data["applicant"] = {
                "name": applicant.get("name"),
                "email": applicant.get("email"),
                "role": applicant.get("role")
            }
        
        return standardize_success_response({
            "application": response_data
        }, status_code=200)
        
    except Exception as e:
        print(f"Error fetching application details: {e}")
        return standardize_error_response("Failed to fetch application details", 500)


@applications_bp.route("/<application_id>/withdraw", methods=["POST"])
@require_auth
def withdraw_application(application_id):
    """Withdraw a job application"""
    try:
        user_id = session.get("user_id")
        
        # Validate application_id format
        try:
            app_object_id = ObjectId(application_id)
        except:
            return standardize_error_response("Invalid application ID format", 400)
        
        # Get application
        application = applications_db.find_one({"_id": app_object_id})
        
        if not application:
            return standardize_error_response("Application not found", 404)
        
        # Check if user owns this application
        if str(application["applicant_id"]) != user_id:
            return standardize_error_response("Access denied", 403)
        
        # Check if application can be withdrawn
        if application["status"] in ["withdrawn", "accepted", "rejected"]:
            return standardize_error_response("Cannot withdraw application in current status", 400)
        
        # Update application status
        now = datetime.utcnow()
        applications_db.update_one(
            {"_id": app_object_id},
            {
                "$set": {
                    "status": "withdrawn",
                    "updated_at": now
                },
                "$push": {
                    "status_history": {
                        "status": "withdrawn",
                        "changed_at": now,
                        "changed_by": ObjectId(user_id),
                        "notes": "Application withdrawn by candidate"
                    }
                }
            }
        )
        
        return standardize_success_response({
            "message": "Application withdrawn successfully"
        }, status_code=200)
        
    except Exception as e:
        print(f"Error withdrawing application: {e}")
        return standardize_error_response("Failed to withdraw application", 500)


@applications_bp.route("/<application_id>/status", methods=["PUT"])
@validate_json_request
@require_auth
def update_application_status(application_id):
    """Update application status (for employers)"""
    try:
        user_id = session.get("user_id")
        data = request.get_json()
        
        # Validate required fields
        required_fields = ["status"]
        is_valid, message = validate_required_fields(data, required_fields)
        if not is_valid:
            return standardize_error_response(message, 400)
        
        new_status = data["status"]
        notes = data.get("notes", "")
        
        # Validate status
        if new_status not in APPLICATION_STATUSES:
            return standardize_error_response("Invalid status", 400)
        
        # Validate application_id format
        try:
            app_object_id = ObjectId(application_id)
        except:
            return standardize_error_response("Invalid application ID format", 400)
        
        # Get application
        application = applications_db.find_one({"_id": app_object_id})
        
        if not application:
            return standardize_error_response("Application not found", 404)
        
        # Check if user is employer for this application
        user = users_db.find_one({"_id": ObjectId(user_id)})
        if user.get("role") != "employer":
            return standardize_error_response("Only employers can update application status", 403)
        
        # Additional authorization check - ensure employer owns the job
        job = jobs_db.find_one({"_id": application["job_id"]})
        if not job:
            return standardize_error_response("Associated job not found", 404)
        
        # Update application status
        now = datetime.utcnow()
        applications_db.update_one(
            {"_id": app_object_id},
            {
                "$set": {
                    "status": new_status,
                    "updated_at": now
                },
                "$push": {
                    "status_history": {
                        "status": new_status,
                        "changed_at": now,
                        "changed_by": ObjectId(user_id),
                        "notes": notes or f"Status changed to {new_status}"
                    }
                }
            }
        )
        
        return standardize_success_response({
            "message": f"Application status updated to {new_status}",
            "status": new_status
        }, status_code=200)
        
    except Exception as e:
        print(f"Error updating application status: {e}")
        return standardize_error_response("Failed to update application status", 500)


@applications_bp.route("/job/<job_id>/applications", methods=["GET"])
@require_auth
def get_job_applications(job_id):
    """Get all applications for a specific job (for employers)"""
    try:
        user_id = session.get("user_id")
        
        # Validate job_id format
        try:
            job_object_id = ObjectId(job_id)
        except:
            return standardize_error_response("Invalid job ID format", 400)
        
        # Check if job exists and user is authorized
        job = jobs_db.find_one({"_id": job_object_id})
        if not job:
            return standardize_error_response("Job not found", 404)
        
        # Check if user is employer
        user = users_db.find_one({"_id": ObjectId(user_id)})
        if user.get("role") != "employer":
            return standardize_error_response("Only employers can view job applications", 403)
        
        # Get query parameters
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        status_filter = request.args.get('status')
        
        # Build query
        query = {"job_id": job_object_id}
        if status_filter and status_filter in APPLICATION_STATUSES:
            query["status"] = status_filter
        
        # Get total count
        total = applications_db.count_documents(query)
        
        # Get applications with pagination
        skip = (page - 1) * limit
        applications = applications_db.find(query).sort("applied_at", -1).skip(skip).limit(limit)
        
        # Format applications with applicant details
        formatted_applications = []
        for app in applications:
            # Get applicant details
            applicant = users_db.find_one({"_id": app["applicant_id"]})
            
            formatted_app = {
                "id": str(app["_id"]),
                "status": app["status"],
                "applied_at": app["applied_at"].isoformat(),
                "updated_at": app["updated_at"].isoformat(),
                "cover_letter": app.get("cover_letter", ""),
                "additional_notes": app.get("additional_notes", "")
            }
            
            # Add applicant details
            if applicant:
                formatted_app["applicant"] = {
                    "name": applicant.get("name"),
                    "email": applicant.get("email"),
                    "role": applicant.get("role")
                }
            
            formatted_applications.append(formatted_app)
        
        return standardize_success_response({
            "applications": formatted_applications,
            "job": {
                "id": str(job["_id"]),
                "title": job.get("title"),
                "company": job.get("firm")
            },
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "pages": (total + limit - 1) // limit
            }
        }, status_code=200)
        
    except Exception as e:
        print(f"Error fetching job applications: {e}")
        return standardize_error_response("Failed to fetch job applications", 500)


@applications_bp.route("/statistics", methods=["GET"])
@require_auth
def get_application_statistics():
    """Get application statistics for the current user"""
    try:
        user_id = session.get("user_id")
        user = users_db.find_one({"_id": ObjectId(user_id)})
        
        if user.get("role") == "job_seeker":
            # Statistics for job seekers
            total_applications = applications_db.count_documents({"applicant_id": ObjectId(user_id)})
            
            # Count by status
            pipeline = [
                {"$match": {"applicant_id": ObjectId(user_id)}},
                {"$group": {"_id": "$status", "count": {"$sum": 1}}}
            ]
            status_counts = list(applications_db.aggregate(pipeline))
            status_breakdown = {item["_id"]: item["count"] for item in status_counts}
            
            # Recent applications
            recent_applications = applications_db.find(
                {"applicant_id": ObjectId(user_id)}
            ).sort("applied_at", -1).limit(5)
            
            recent_apps = []
            for app in recent_applications:
                job = jobs_db.find_one({"_id": app["job_id"]})
                recent_apps.append({
                    "id": str(app["_id"]),
                    "job_title": job.get("title") if job else "Unknown",
                    "company": job.get("firm") if job else "Unknown",
                    "status": app["status"],
                    "applied_at": app["applied_at"].isoformat()
                })
            
            return standardize_success_response({
                "total_applications": total_applications,
                "status_breakdown": status_breakdown,
                "recent_applications": recent_apps
            }, status_code=200)
        
        elif user.get("role") == "employer":
            # Statistics for employers
            # Get all jobs posted by this employer
            employer_jobs = list(jobs_db.find({"employer_id": ObjectId(user_id)}))
            job_ids = [job["_id"] for job in employer_jobs]
            
            if not job_ids:
                return standardize_success_response({
                    "total_received": 0,
                    "status_breakdown": {},
                    "jobs_with_applications": []
                }, status_code=200)
            
            # Total applications received
            total_received = applications_db.count_documents({"job_id": {"$in": job_ids}})
            
            # Count by status
            pipeline = [
                {"$match": {"job_id": {"$in": job_ids}}},
                {"$group": {"_id": "$status", "count": {"$sum": 1}}}
            ]
            status_counts = list(applications_db.aggregate(pipeline))
            status_breakdown = {item["_id"]: item["count"] for item in status_counts}
            
            # Applications per job
            pipeline = [
                {"$match": {"job_id": {"$in": job_ids}}},
                {"$group": {"_id": "$job_id", "count": {"$sum": 1}}}
            ]
            job_counts = list(applications_db.aggregate(pipeline))
            job_application_counts = {str(item["_id"]): item["count"] for item in job_counts}
            
            jobs_with_applications = []
            for job in employer_jobs:
                job_id = str(job["_id"])
                count = job_application_counts.get(job_id, 0)
                jobs_with_applications.append({
                    "job_id": job_id,
                    "title": job.get("title"),
                    "application_count": count
                })
            
            return standardize_success_response({
                "total_received": total_received,
                "status_breakdown": status_breakdown,
                "jobs_with_applications": jobs_with_applications
            }, status_code=200)
        
        else:
            return standardize_error_response("Invalid user role", 400)
        
    except Exception as e:
        print(f"Error fetching statistics: {e}")
        return standardize_error_response("Failed to fetch statistics", 500) 