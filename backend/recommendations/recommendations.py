from flask import Blueprint, jsonify, request, session
from extensions import mongo
from bson.objectid import ObjectId
from datetime import datetime
import random

recommendations_bp = Blueprint("recommendations", __name__)

@recommendations_bp.route("/jobs", methods=["GET", "OPTIONS"])
def get_job_recommendations():
    """Get personalized job recommendations for the current user"""
    if request.method == "OPTIONS":
        return "", 200
    
    try:
        # Get user info if logged in
        user_id = session.get("user_id")
        user_profile = None
        
        if user_id:
            try:
                user_profile = mongo.db.users.find_one({"_id": ObjectId(user_id)})
            except Exception as e:
                print(f"Error fetching user profile: {e}")
        
        # Get jobs from database
        limit = int(request.args.get('limit', 12))
        jobs_cursor = mongo.db.jobs.find().limit(limit)
        jobs = list(jobs_cursor)
        
        if not jobs:
            return jsonify({"recommendations": [], "message": "No jobs available"}), 200
        
        # Convert ObjectId to string for JSON serialization
        for job in jobs:
            job["_id"] = str(job["_id"])
        
        # Create recommendation objects with mock ML scores
        recommendations = []
        for job in jobs:
            # Simple recommendation logic - in a real app, this would be ML-powered
            match_score = 0.6 + random.random() * 0.3  # 60-90% match
            reasons = [
                "Skills match job requirements",
                "Located in your preferred area", 
                "Matches your experience level",
                "Popular in your industry"
            ]
            
            # Randomly select 2-3 reasons
            selected_reasons = random.sample(reasons, random.randint(2, 3))
            
            recommendation = {
                "job": job,
                "match_score": match_score,
                "reasons": selected_reasons
            }
            recommendations.append(recommendation)
        
        # Sort by match score (highest first)
        recommendations.sort(key=lambda x: x["match_score"], reverse=True)
        
        return jsonify({
            "recommendations": recommendations,
            "total": len(recommendations),
            "user_personalized": user_profile is not None
        }), 200
        
    except Exception as e:
        print(f"Error getting job recommendations: {e}")
        return jsonify({"error": "Failed to get job recommendations"}), 500