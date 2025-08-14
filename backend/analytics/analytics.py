from flask import Blueprint, request, jsonify, session
from bson import ObjectId
from datetime import datetime, timedelta
import logging
from extensions import mongo

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/activities', methods=['GET'])
def get_user_activities():
    """Get user activities for dashboard timeline"""
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'User not authenticated'}), 401

        # Query parameters
        limit = int(request.args.get('limit', 10))
        
        activities = []
        
        # Get job applications
        applications = list(mongo.db.applications.find(
            {"user_id": ObjectId(user_id)},
            sort=[("applied_date", -1)],
            limit=5
        ))
        
        for app in applications:
            activities.append({
                'id': str(app['_id']),
                'type': 'application',
                'title': 'Applied to job',
                'description': f"{app.get('job_title', 'Job')} at {app.get('company', 'Company')}",
                'timestamp': app.get('applied_date', datetime.utcnow()).isoformat(),
                'actionUrl': app.get('job_url')
            })
            
            # Add status update if different from applied
            if app.get('status') != 'applied' and app.get('last_updated'):
                activities.append({
                    'id': f"status-{str(app['_id'])}",
                    'type': 'application',
                    'title': 'Application status updated',
                    'description': f"{app.get('job_title', 'Job')} - Status changed to {app.get('status', 'unknown')}",
                    'timestamp': app.get('last_updated', datetime.utcnow()).isoformat(),
                    'actionUrl': app.get('job_url')
                })
        
        # Get saved jobs
        saved_jobs = list(mongo.db.saved_jobs.find(
            {"user_id": ObjectId(user_id)},
            sort=[("saved_at", -1)],
            limit=3
        ))
        
        for saved in saved_jobs:
            activities.append({
                'id': f"saved-{str(saved['_id'])}",
                'type': 'saved_job',
                'title': 'Saved job',
                'description': f"{saved.get('title', 'Job')} at {saved.get('company', 'Company')}",
                'timestamp': saved.get('saved_at', datetime.utcnow()).isoformat(),
                'actionUrl': saved.get('url')
            })
        
        # Get resume uploads/updates
        resume_files = list(mongo.db.resume_metadata.find(
            {"user_id": ObjectId(user_id)},
            sort=[("upload_date", -1)],
            limit=3
        ))
        
        for resume in resume_files:
            activities.append({
                'id': f"resume-{str(resume['_id'])}",
                'type': 'resume',
                'title': 'Resume uploaded',
                'description': f"Updated resume: {resume.get('filename', 'resume.pdf')}",
                'timestamp': resume.get('upload_date', datetime.utcnow()).isoformat()
            })
        
        # Sort activities by timestamp (most recent first)
        activities.sort(key=lambda x: x['timestamp'], reverse=True)
        
        # Limit results
        activities = activities[:limit]
        
        return jsonify(activities)
        
    except Exception as e:
        logging.error(f"Error fetching user activities: {str(e)}")
        return jsonify({'error': 'Failed to fetch activities'}), 500

@analytics_bp.route('/events', methods=['POST'])
def track_event():
    """Track user events for analytics"""
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'User not authenticated'}), 401
            
        data = request.get_json()
        if not data or 'event_type' not in data:
            return jsonify({'error': 'Event type is required'}), 400
            
        event = {
            'user_id': ObjectId(user_id),
            'event_type': data['event_type'],
            'event_data': data.get('event_data', {}),
            'timestamp': datetime.utcnow(),
            'ip_address': request.remote_addr,
            'user_agent': request.headers.get('User-Agent')
        }
        
        result = mongo.db.user_events.insert_one(event)
        
        return jsonify({
            'success': True,
            'event_id': str(result.inserted_id)
        })
        
    except Exception as e:
        logging.error(f"Error tracking event: {str(e)}")
        return jsonify({'error': 'Failed to track event'}), 500

@analytics_bp.route('/events/batch', methods=['POST'])
def track_events_batch():
    """Track multiple user events in batch"""
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'User not authenticated'}), 401
            
        data = request.get_json()
        if not data or 'events' not in data:
            return jsonify({'error': 'Events array is required'}), 400
            
        events = []
        for event_data in data['events']:
            if 'event_type' not in event_data:
                continue
                
            event = {
                'user_id': ObjectId(user_id),
                'event_type': event_data['event_type'],
                'event_data': event_data.get('event_data', {}),
                'timestamp': datetime.utcnow(),
                'ip_address': request.remote_addr,
                'user_agent': request.headers.get('User-Agent')
            }
            events.append(event)
        
        if events:
            result = mongo.db.user_events.insert_many(events)
            return jsonify({
                'success': True,
                'events_tracked': len(result.inserted_ids)
            })
        else:
            return jsonify({'error': 'No valid events to track'}), 400
            
    except Exception as e:
        logging.error(f"Error tracking events batch: {str(e)}")
        return jsonify({'error': 'Failed to track events'}), 500

@analytics_bp.route('/metrics', methods=['GET'])
def get_user_metrics():
    """Get user metrics for dashboard"""
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'User not authenticated'}), 401
            
        user_object_id = ObjectId(user_id)
        
        # Get application metrics
        total_applications = mongo.db.applications.count_documents({"user_id": user_object_id})
        recent_applications = mongo.db.applications.count_documents({
            "user_id": user_object_id,
            "applied_date": {"$gte": datetime.utcnow() - timedelta(days=30)}
        })
        
        # Get status breakdown
        status_pipeline = [
            {"$match": {"user_id": user_object_id}},
            {"$group": {"_id": "$status", "count": {"$sum": 1}}}
        ]
        status_counts = {doc["_id"]: doc["count"] for doc in mongo.db.applications.aggregate(status_pipeline)}
        
        # Get saved jobs count
        saved_jobs = mongo.db.saved_jobs.count_documents({"user_id": user_object_id})
        
        # Get profile completeness (simplified)
        user = mongo.db.users.find_one({"_id": user_object_id})
        profile_score = 0
        if user:
            if user.get('name'): profile_score += 20
            if user.get('email'): profile_score += 20
            if user.get('phone'): profile_score += 15
            if user.get('location'): profile_score += 15
            if user.get('skills'): profile_score += 15
            if user.get('experience'): profile_score += 15
        
        metrics = {
            'applications': {
                'total': total_applications,
                'recent': recent_applications,
                'status_breakdown': status_counts
            },
            'saved_jobs': saved_jobs,
            'profile_completeness': profile_score,
            'generated_at': datetime.utcnow().isoformat()
        }
        
        return jsonify(metrics)
        
    except Exception as e:
        logging.error(f"Error fetching user metrics: {str(e)}")
        return jsonify({'error': 'Failed to fetch metrics'}), 500

@analytics_bp.route('/users/me', methods=['GET'])
def get_user_analytics():
    """Get detailed analytics for current user"""
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'User not authenticated'}), 401
            
        user_object_id = ObjectId(user_id)
        
        # Get application trends (last 6 months)
        six_months_ago = datetime.utcnow() - timedelta(days=180)
        application_trend = list(mongo.db.applications.aggregate([
            {"$match": {
                "user_id": user_object_id,
                "applied_date": {"$gte": six_months_ago}
            }},
            {"$group": {
                "_id": {
                    "year": {"$year": "$applied_date"},
                    "month": {"$month": "$applied_date"}
                },
                "count": {"$sum": 1}
            }},
            {"$sort": {"_id.year": 1, "_id.month": 1}}
        ]))
        
        # Get top companies applied to
        top_companies = list(mongo.db.applications.aggregate([
            {"$match": {"user_id": user_object_id}},
            {"$group": {"_id": "$company", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 5}
        ]))
        
        # Get top job titles applied to
        top_titles = list(mongo.db.applications.aggregate([
            {"$match": {"user_id": user_object_id}},
            {"$group": {"_id": "$job_title", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 5}
        ]))
        
        analytics = {
            'application_trend': application_trend,
            'top_companies': top_companies,
            'top_job_titles': top_titles,
            'generated_at': datetime.utcnow().isoformat()
        }
        
        return jsonify(analytics)
        
    except Exception as e:
        logging.error(f"Error fetching user analytics: {str(e)}")
        return jsonify({'error': 'Failed to fetch analytics'}), 500