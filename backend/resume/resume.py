from flask import Blueprint, request, current_app, send_file, session, jsonify
from extensions import mongo
from werkzeug.utils import secure_filename
from bson.objectid import ObjectId
from datetime import datetime
import gridfs
import io

# Create a Blueprint for resume operations
resume_bp = Blueprint('resume', __name__)

# Allowed extensions for file uploads
ALLOWED_EXTENSIONS = {'pdf'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_current_user_resume_id():
    user_id = session.get("user_id")
    if not user_id:
        return None
    
    user = mongo.db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        return None
    
    user_resume_id = user.get("resume_id")
    if not user_resume_id:
        return None

    return str(user_resume_id)

def get_current_user():
    user_id = session.get("user_id")
    if not user_id:
        return None
    
    return mongo.db.users.find_one({"_id": ObjectId(user_id)})

@resume_bp.route('/metadata', methods=['GET'])
def get_current_user_resume_metadata():
    """Get metadata for the current user's resume"""
    if "user_id" not in session:
        return jsonify({"error": "There is no user logged in."}), 401
    
    user = get_current_user()
    if not user:
        return jsonify({"error": "User not found."}), 404
    
    user_resume_id = user.get("resume_id")
    if not user_resume_id:
        return jsonify({"message": "The current user has not uploaded a resume."}), 404
    
    try:
        fs = gridfs.GridFS(mongo.db)
        grid_out = fs.get(ObjectId(user_resume_id))
        
        # Return metadata as JSON
        resume_metadata = {
            "id": str(user_resume_id),
            "filename": grid_out.filename,
            "upload_date": grid_out.upload_date.isoformat() if grid_out.upload_date else None,
            "length": grid_out.length,
            "custom_name": user.get("resume_custom_name", grid_out.filename),
            "content_type": grid_out.content_type or "application/pdf"
        }
        
        return jsonify(resume_metadata)
    except gridfs.errors.NoFile:
        return jsonify({"error": "The resume file could not be found."}), 404
    except Exception as e:
        print(f"Unexpected error: {e}")
        return jsonify({"error": "An unexpected error occurred."}), 500

@resume_bp.route('/current', methods=['GET', 'DELETE'])
def handle_current_user_resume():
    """Handle GET (download) and DELETE operations for current user's resume"""
    if "user_id" not in session:
        return jsonify({"error": "There is no user logged in."}), 401
    
    if request.method == 'GET':
        # Download the current user's resume file
        print("Session before the current user resume: ", session)
        user_resume_id = get_current_user_resume_id()
        print(f"User Resume ID: {user_resume_id}")
        if not user_resume_id:
            return jsonify({"message": "The current user has not uploaded a resume."}), 404
        
        try:
            print(f"Fetching file with ID: {user_resume_id}")
            fs = gridfs.GridFS(mongo.db)
            grid_out = fs.get(ObjectId(user_resume_id))
            return send_file(io.BytesIO(grid_out.read()),
                            mimetype="application/pdf",
                            download_name=grid_out.filename,
                            as_attachment=True)
        except gridfs.errors.NoFile:
            return jsonify({"error": "The resume file could not be found."}), 404
        except Exception as e:
            print(f"Unexpected error: {e}")
            return jsonify({"error": "An unexpected error occurred."}), 500
    
    elif request.method == 'DELETE':
        # Delete the current user's resume
        user = get_current_user()
        if not user:
            return jsonify({"error": "User not found."}), 404
        
        user_resume_id = user.get("resume_id")
        if not user_resume_id:
            return jsonify({"message": "No resume to delete."}), 404
        
        try:
            # Delete file from GridFS
            fs = gridfs.GridFS(mongo.db)
            fs.delete(ObjectId(user_resume_id))
            
            # Remove resume reference from user
            mongo.db.users.update_one(
                {"_id": ObjectId(session.get("user_id"))},
                {"$unset": {"resume_id": "", "resume_custom_name": ""}}
            )
            
            return jsonify({"message": "Resume deleted successfully"}), 200
            
        except gridfs.errors.NoFile:
            # File doesn't exist but remove reference anyway
            mongo.db.users.update_one(
                {"_id": ObjectId(session.get("user_id"))},
                {"$unset": {"resume_id": "", "resume_custom_name": ""}}
            )
            return jsonify({"message": "Resume deleted successfully"}), 200
        except Exception as e:
            print(f"Error deleting resume: {e}")
            return jsonify({"error": "Failed to delete resume"}), 500
    

@resume_bp.route('/upload', methods=['POST'])
def upload_resume():
    print("Upload request received")
    print("Session:", session)
    print("Files in request:", request.files)
    print("Form data:", request.form)
    print("Headers:", request.headers)
    
    if "user_id" not in session:
        return jsonify({"error": "There is no user logged in."}), 401
    
    if 'file' not in request.files:
        print("No file in request.files")
        return jsonify({"error": "No file provided"}), 400
    
    file = request.files['file']
    print(f"File received: {file.filename}, Content-Type: {file.content_type}")
    
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    if not file:
        return jsonify({"error": "Invalid file"}), 400
    
    if not allowed_file(file.filename):
        return jsonify({"error": "Invalid file type. Only PDF files are allowed."}), 400
    
    try:
        # Secure the filename
        filename = secure_filename(file.filename)
        print(f"Secured filename: {filename}")
        
        # Save the file in GridFS
        fs = gridfs.GridFS(mongo.db)
        file_id = fs.put(
            file,
            filename=filename,
            content_type=file.content_type or "application/pdf",
            encoding='utf-8'
        )
        print(f"File saved with ID: {file_id}")
        
        # Update user record with the resume ID
        user_id = session.get("user_id")
        mongo.db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"resume_id": file_id}}
        )
        print(f"User {user_id} updated with resume ID: {file_id}")
        
        # Get the file info to return metadata
        grid_out = fs.get(file_id)
        
        # Return metadata in the format expected by frontend
        resume_metadata = {
            "id": str(file_id),
            "filename": grid_out.filename,
            "upload_date": grid_out.upload_date.isoformat() if grid_out.upload_date else None,
            "length": grid_out.length,
            "custom_name": grid_out.filename,
            "content_type": grid_out.content_type or "application/pdf"
        }
        print(f"Returning metadata: {resume_metadata}")
        
        return jsonify(resume_metadata), 200
        
    except Exception as e:
        print(f"Error uploading resume: {e}")
        return jsonify({"error": str(e)}), 500

@resume_bp.route('/download/<file_id>', methods=['GET'])
def download_resume(file_id):
    try:
        # Get MongoDB instance and initialize GridFS
        mongo = current_app.config['MONGO']
        fs = gridfs.GridFS(mongo.db)
        
        # Get the file from GridFS
        file = fs.get(ObjectId(file_id))
        
        return send_file(io.BytesIO(file.read()), 
                         mimetype='application/pdf',
                         download_name=file.filename,
                         as_attachment=True)
    except:
        return "File not found", 404
    
@resume_bp.route('/rename/<resume_id>', methods=['PUT'])
def rename_resume(resume_id):
    """Rename/update custom name for a resume"""
    if "user_id" not in session:
        return jsonify({"error": "There is no user logged in."}), 401
    
    user = get_current_user()
    if not user:
        return jsonify({"error": "User not found."}), 404
    
    # Check if the resume belongs to the current user
    user_resume_id = user.get("resume_id")
    if not user_resume_id or str(user_resume_id) != resume_id:
        return jsonify({"error": "Resume not found or access denied."}), 404
    
    try:
        data = request.get_json()
        custom_name = data.get("custom_name")
        
        if not custom_name:
            return jsonify({"error": "Custom name is required."}), 400
        
        # Update the user's custom resume name
        mongo.db.users.update_one(
            {"_id": ObjectId(session.get("user_id"))},
            {"$set": {"resume_custom_name": custom_name}}
        )
        
        return jsonify({"message": "Resume name updated successfully"}), 200
        
    except Exception as e:
        print(f"Error renaming resume: {e}")
        return jsonify({"error": "Failed to rename resume"}), 500

@resume_bp.route("/analyze", methods=["OPTIONS"])
def analyze_options():
    """Handle OPTIONS request for CORS preflight"""
    print(f"=== RESUME ANALYZE OPTIONS ===")
    print(f"Method: {request.method}")
    print(f"Headers: {dict(request.headers)}")
    print(f"Request URL: {request.url}")
    print(f"Request path: {request.path}")
    return "", 200

@resume_bp.route("/analyze", methods=["POST"])
def analyze_current_resume():
    """Analyze the current user's resume"""
    print(f"=== RESUME ANALYZE REQUEST ===")
    print(f"Method: {request.method}")
    print(f"Headers: {dict(request.headers)}")
    print(f"Session: {session}")
    print(f"Request URL: {request.url}")
    print(f"Request path: {request.path}")
    
    if "user_id" not in session:
        print(f"No user_id in session. Session keys: {list(session.keys())}")
        return jsonify({"error": "There is no user logged in."}), 401
    
    user = get_current_user()
    if not user:
        return jsonify({"error": "User not found."}), 404
    
    # Check if user has remaining resume tokens
    resume_tokens = user.get("resume_tokens", 0)
    if resume_tokens <= 0:
        return jsonify({"error": "No resume analysis tokens remaining. You have used your free analysis."}), 403
    
    user_resume_id = user.get("resume_id")
    if not user_resume_id:
        return jsonify({"message": "The current user has not uploaded a resume."}), 404
    
    try:
        from resume_parser import parse_resume_by_file_id, save_parsed_resume, analyze_resume_completeness
        
        # Parse the resume
        parsed_data = parse_resume_by_file_id(str(user_resume_id))
        
        # Save parsed data to database
        analysis_id = save_parsed_resume(session.get("user_id"), str(user_resume_id), parsed_data)
        
        # Analyze completeness
        completeness_analysis = analyze_resume_completeness(parsed_data)
        
        # Prepare response data with enhanced Gemini structure
        analysis_response = {
            "analysis_id": analysis_id,
            "file_id": str(user_resume_id),
            "parsing_success": True,
            "parsed_data": {
                "contact_info": parsed_data.get("contact_info", {}),
                "education_count": len(parsed_data.get("education", [])),
                "experience_count": len(parsed_data.get("work_experience", [])),
                "skills_count": len(parsed_data.get("skills", [])),
                "skills": parsed_data.get("skills", [])[:20],  # Limit for response size
                "certifications": parsed_data.get("certifications", []),
                "summary": parsed_data.get("summary"),
                "projects_count": len(parsed_data.get("projects", [])),
                "text_length": parsed_data.get("parsing_metadata", {}).get("text_length", 0),
                "word_count": parsed_data.get("parsing_metadata", {}).get("word_count", 0),
                "parsing_method": parsed_data.get("parsing_metadata", {}).get("parsing_method", "unknown")
            },
            "completeness_analysis": completeness_analysis,
            "analyzed_at": parsed_data.get("parsing_metadata", {}).get("parsed_at")
        }
        
        # Decrement user's resume tokens after successful analysis
        mongo.db.users.update_one(
            {"_id": ObjectId(session.get("user_id"))},
            {"$inc": {"resume_tokens": -1}}
        )
        print(f"Decremented resume tokens for user {session.get('user_id')}. Tokens remaining: {resume_tokens - 1}")
        
        return jsonify(analysis_response), 200
        
    except Exception as e:
        print(f"Error analyzing resume: {e}")
        return jsonify({"error": f"Failed to analyze resume: {str(e)}"}), 500


@resume_bp.route("/analyze-structured", methods=["POST"])
def analyze_resume_structured():
    """Analyze resume using Gemini structured output with isResume validation"""
    print(f"=== GEMINI STRUCTURED RESUME ANALYSIS ===")
    
    if "user_id" not in session:
        return jsonify({"error": "There is no user logged in."}), 401
    
    user = get_current_user()
    if not user:
        return jsonify({"error": "User not found."}), 404
    
    # Check if user has remaining resume tokens
    resume_tokens = user.get("resume_tokens", 0)
    if resume_tokens <= 0:
        return jsonify({"error": "No resume analysis tokens remaining. You have used your free analysis."}), 403
    
    user_resume_id = user.get("resume_id")
    if not user_resume_id:
        return jsonify({"message": "The current user has not uploaded a resume."}), 404
    
    try:
        from gemini_resume_analyzer import (
            analyze_resume_with_gemini_structured,
            validate_and_clean_resume_data,
            save_structured_resume_data,
            analyze_resume_completeness_structured
        )
        from resume_parser import extract_text_from_pdf
        
        user_id = session.get("user_id")
        
        # Get the resume file and extract text
        fs = gridfs.GridFS(mongo.db)
        grid_out = fs.get(ObjectId(user_resume_id))
        pdf_content = grid_out.read()
        
        # Extract text from PDF
        resume_text = extract_text_from_pdf(pdf_content)
        
        if not resume_text or len(resume_text.strip()) < 50:
            return jsonify({"error": "Unable to extract sufficient text from resume"}), 400
        
        # Analyze with Gemini structured output
        print(f"Analyzing resume text length: {len(resume_text)}")
        gemini_result = analyze_resume_with_gemini_structured(resume_text)
        
        if not gemini_result.get('success'):
            return jsonify({
                "error": "Gemini analysis failed",
                "details": gemini_result
            }), 500
        
        structured_data = gemini_result['structured_data']
        is_resume = gemini_result['is_resume']
        confidence_score = gemini_result['confidence_score']
        
        print(f"Gemini analysis complete: isResume={is_resume}, confidence={confidence_score}")
        
        # Validate and clean the data
        validation_result = validate_and_clean_resume_data(structured_data)
        
        # Check if document is actually a resume
        if not is_resume or not validation_result.get('is_valid_resume', False):
            return jsonify({
                "success": False,
                "is_resume": is_resume,
                "confidence_score": confidence_score,
                "validation_result": validation_result,
                "error": "Document is not recognized as a valid resume",
                "message": "The uploaded document does not appear to be a resume or lacks sufficient resume content."
            }), 400
        
        # Document is a valid resume - save to database
        structured_doc_id = save_structured_resume_data(
            user_id, 
            str(user_resume_id), 
            validation_result['structured_data'],
            validation_result
        )
        
        if not structured_doc_id:
            return jsonify({
                "error": "Failed to save structured resume data",
                "is_resume": is_resume
            }), 500
        
        # Perform completeness analysis on structured data
        completeness_analysis = analyze_resume_completeness_structured(
            validation_result['structured_data']
        )
        
        # Prepare comprehensive response
        analysis_response = {
            "success": True,
            "structured_doc_id": structured_doc_id,
            "file_id": str(user_resume_id),
            "is_resume": is_resume,
            "confidence_score": confidence_score,
            "parsing_method": "gemini_structured",
            
            # Structured data summary
            "structured_summary": {
                "contact_info": validation_result['structured_data'].get('contact_info', {}),
                "work_experience_count": len(validation_result['structured_data'].get('work_experience', [])),
                "education_count": len(validation_result['structured_data'].get('education', [])),
                "skills_count": len(validation_result['structured_data'].get('skills', [])),
                "certifications_count": len(validation_result['structured_data'].get('certifications', [])),
                "projects_count": len(validation_result['structured_data'].get('projects', [])),
                "has_professional_summary": bool(validation_result['structured_data'].get('professional_summary')),
                "total_experience_years": validation_result['structured_data'].get('total_experience_years'),
                "industry_focus": validation_result['structured_data'].get('industry_focus'),
                "seniority_level": validation_result['structured_data'].get('seniority_level')
            },
            
            # Validation results
            "validation_result": validation_result,
            
            # Completeness analysis
            "completeness_analysis": completeness_analysis,
            
            # Full structured data (optional, can be large)
            "structured_data": validation_result['structured_data'],
            
            # Metadata
            "analyzed_at": datetime.utcnow().isoformat(),
            "gemini_model": gemini_result.get('model', 'gemini-2.5-flash')
        }
        
        print(f"Structured analysis complete: completeness_score={completeness_analysis.get('completeness_score', 0)}")
        
        # Consume one resume token
        try:
            user_id = session.get("user_id")
            mongo.db.users.update_one(
                {"_id": ObjectId(user_id)},
                {"$inc": {"resume_tokens": -1}}  # Decrement by 1
            )
            print(f"Consumed 1 resume token for user {user_id}")
        except Exception as token_error:
            print(f"Warning: Failed to consume resume token: {token_error}")
            # Don't fail the request if token consumption fails, but log it
        
        return jsonify(analysis_response), 200
        
    except Exception as e:
        print(f"Error in structured resume analysis: {e}")
        import traceback
        traceback.print_exc()
        
        return jsonify({
            "error": f"Structured analysis failed: {str(e)}",
            "success": False
        }), 500


@resume_bp.route("/analysis", methods=["GET"])
def get_resume_analysis():
    """Get resume analysis for current user"""
    if "user_id" not in session:
        return jsonify({"error": "There is no user logged in."}), 401
    
    try:
        from resume_parser import get_parsed_resume
        
        user_id = session.get("user_id")
        analysis = get_parsed_resume(user_id)
        
        if not analysis:
            return jsonify({"message": "No resume analysis found. Please analyze your resume first."}), 404
        
        return jsonify({
            "analysis": analysis,
            "has_analysis": True
        }), 200
        
    except Exception as e:
        print(f"Error getting resume analysis: {e}")
        return jsonify({"error": "Failed to get resume analysis"}), 500


@resume_bp.route("/parse-text", methods=["POST"])
def parse_resume_text():
    """Parse resume text from uploaded file"""
    if "user_id" not in session:
        return jsonify({"error": "There is no user logged in."}), 401
    
    user = get_current_user()
    if not user:
        return jsonify({"error": "User not found."}), 404
    
    user_resume_id = user.get("resume_id")
    if not user_resume_id:
        return jsonify({"message": "The current user has not uploaded a resume."}), 404
    
    try:
        from resume_parser import extract_text_from_pdf
        
        # Get the resume file
        fs = gridfs.GridFS(mongo.db)
        grid_out = fs.get(ObjectId(user_resume_id))
        pdf_content = grid_out.read()
        
        # Extract text
        extracted_text = extract_text_from_pdf(pdf_content)
        
        return jsonify({
            "text": extracted_text,
            "text_length": len(extracted_text),
            "word_count": len(extracted_text.split()),
            "line_count": len(extracted_text.split('\n')),
            "file_id": str(user_resume_id)
        }), 200
        
    except Exception as e:
        print(f"Error parsing resume text: {e}")
        return jsonify({"error": f"Failed to parse resume text: {str(e)}"}), 500


@resume_bp.route("/ai-analyze", methods=["POST"])
def ai_analyze_resume():
    """AI-powered resume analysis"""
    if "user_id" not in session:
        return jsonify({"error": "There is no user logged in."}), 401
    
    try:
        from resume_parser import get_parsed_resume
        from ai_resume_analyzer import (
            analyze_resume_with_openai, analyze_resume_with_claude,
            calculate_ats_score, generate_resume_improvements, save_ai_analysis
        )
        
        user_id = session.get("user_id")
        data = request.get_json() or {}
        job_description = data.get("job_description", "")
        ai_provider = data.get("ai_provider", "openai")  # 'openai' or 'claude'
        
        # Get parsed resume data
        parsed_resume = get_parsed_resume(user_id)
        if not parsed_resume:
            return jsonify({"error": "No resume found. Please upload and analyze a resume first."}), 404
        
        resume_text = parsed_resume['parsed_data'].get('raw_text', '')
        if not resume_text:
            return jsonify({"error": "Resume text not available"}), 400
        
        # Perform AI analysis
        ai_analysis = None
        try:
            if ai_provider == "claude":
                ai_analysis = analyze_resume_with_claude(resume_text, job_description)
            else:
                ai_analysis = analyze_resume_with_openai(resume_text, job_description)
        except Exception as ai_error:
            print(f"AI analysis failed: {ai_error}")
            # Continue with other analyses even if AI fails
            ai_analysis = {
                "error": f"AI analysis failed: {str(ai_error)}",
                "ai_provider": ai_provider
            }
        
        # Calculate ATS score
        ats_analysis = calculate_ats_score(resume_text, parsed_resume['parsed_data'])
        
        # Generate improvements
        improvements = generate_resume_improvements(parsed_resume['parsed_data'], ats_analysis)
        
        # Compile complete analysis
        complete_analysis = {
            "ai_analysis": ai_analysis,
            "ats_analysis": ats_analysis,
            "improvements": improvements,
            "resume_id": parsed_resume['file_id'],
            "analyzed_at": datetime.utcnow().isoformat(),
            "has_job_description": bool(job_description)
        }
        
        # Save analysis
        analysis_id = save_ai_analysis(user_id, complete_analysis)
        complete_analysis["analysis_id"] = analysis_id
        
        return jsonify({
            "success": True,
            "analysis": complete_analysis,
            "message": "AI analysis completed successfully"
        }), 200
        
    except Exception as e:
        print(f"Error in AI resume analysis: {e}")
        return jsonify({"error": f"AI analysis failed: {str(e)}"}), 500


@resume_bp.route("/ats-score", methods=["GET"])
def get_ats_score():
    """Get ATS compatibility score for current user's resume"""
    if "user_id" not in session:
        return jsonify({"error": "There is no user logged in."}), 401
    
    try:
        from resume_parser import get_parsed_resume
        from ai_resume_analyzer import calculate_ats_score
        
        user_id = session.get("user_id")
        
        # Get parsed resume data
        parsed_resume = get_parsed_resume(user_id)
        if not parsed_resume:
            return jsonify({"error": "No resume found. Please upload and analyze a resume first."}), 404
        
        resume_text = parsed_resume['parsed_data'].get('raw_text', '')
        if not resume_text:
            return jsonify({"error": "Resume text not available"}), 400
        
        # Calculate ATS score
        ats_analysis = calculate_ats_score(resume_text, parsed_resume['parsed_data'])
        
        return jsonify({
            "ats_analysis": ats_analysis,
            "resume_id": parsed_resume['file_id']
        }), 200
        
    except Exception as e:
        print(f"Error calculating ATS score: {e}")
        return jsonify({"error": f"Failed to calculate ATS score: {str(e)}"}), 500


@resume_bp.route("/job-match", methods=["POST"])
def analyze_job_match():
    """Analyze how well resume matches a specific job"""
    if "user_id" not in session:
        return jsonify({"error": "There is no user logged in."}), 401
    
    try:
        from resume_parser import get_parsed_resume
        from ai_resume_analyzer import match_resume_to_job
        
        data = request.get_json()
        if not data or not data.get("job_description"):
            return jsonify({"error": "Job description is required"}), 400
        
        job_description = data["job_description"]
        user_id = session.get("user_id")
        
        # Get parsed resume data
        parsed_resume = get_parsed_resume(user_id)
        if not parsed_resume:
            return jsonify({"error": "No resume found. Please upload and analyze a resume first."}), 404
        
        resume_text = parsed_resume['parsed_data'].get('raw_text', '')
        if not resume_text:
            return jsonify({"error": "Resume text not available"}), 400
        
        # Perform job matching analysis
        match_analysis = match_resume_to_job(
            resume_text, 
            job_description, 
            parsed_resume['parsed_data']
        )
        
        return jsonify({
            "job_match_analysis": match_analysis,
            "resume_id": parsed_resume['file_id'],
            "analyzed_at": datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        print(f"Error in job match analysis: {e}")
        return jsonify({"error": f"Job match analysis failed: {str(e)}"}), 500


@resume_bp.route("/ai-analysis-history", methods=["GET"])
def get_ai_analysis_history():
    """Get AI analysis history for current user"""
    if "user_id" not in session:
        return jsonify({"error": "There is no user logged in."}), 401
    
    try:
        from ai_resume_analyzer import get_ai_analysis
        
        user_id = session.get("user_id")
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        
        # Get analysis history from database
        skip = (page - 1) * limit
        analyses = mongo.db.ai_resume_analysis.find(
            {"user_id": ObjectId(user_id)}
        ).sort("created_at", -1).skip(skip).limit(limit)
        
        total = mongo.db.ai_resume_analysis.count_documents({"user_id": ObjectId(user_id)})
        
        formatted_analyses = []
        for analysis in analyses:
            formatted_analyses.append({
                "analysis_id": str(analysis["_id"]),
                "created_at": analysis["created_at"].isoformat(),
                "analysis_type": analysis.get("analysis_type", "ai_powered"),
                "has_ai_analysis": "ai_analysis" in analysis.get("analysis_data", {}),
                "ats_score": analysis.get("analysis_data", {}).get("ats_analysis", {}).get("ats_score", 0)
            })
        
        return jsonify({
            "analyses": formatted_analyses,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "pages": (total + limit - 1) // limit
            }
        }), 200
        
    except Exception as e:
        print(f"Error getting analysis history: {e}")
        return jsonify({"error": "Failed to get analysis history"}), 500


@resume_bp.route("/structured-data", methods=["GET"])
def get_structured_resume_data():
    """Get structured resume data for current user"""
    if "user_id" not in session:
        return jsonify({"error": "There is no user logged in."}), 401
    
    try:
        from gemini_resume_analyzer import get_structured_resume_data as get_structured_data
        
        user_id = session.get("user_id")
        file_id = request.args.get('file_id')  # Optional specific file
        
        structured_data = get_structured_data(user_id, file_id)
        
        if not structured_data:
            return jsonify({
                "message": "No structured resume data found. Please analyze your resume with the structured analyzer first.",
                "has_structured_data": False
            }), 404
        
        # Return structured data with metadata
        return jsonify({
            "has_structured_data": True,
            "structured_data": structured_data['structured_data'],
            "validation_result": structured_data['validation_result'],
            "file_id": structured_data['file_id'],
            "created_at": structured_data['created_at'].isoformat() if structured_data.get('created_at') else None,
            "updated_at": structured_data['updated_at'].isoformat() if structured_data.get('updated_at') else None,
            "extraction_version": structured_data.get('extraction_version', '1.0')
        }), 200
        
    except Exception as e:
        print(f"Error getting structured resume data: {e}")
        return jsonify({"error": "Failed to get structured resume data"}), 500

# Debug route to catch any unmatched requests (must be last)
@resume_bp.route('/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])  
def debug_catch_all(path):
    print(f"=== RESUME CATCH-ALL DEBUG ===")
    print(f"Requested path: /{path}")
    print(f"Method: {request.method}")
    print(f"Full URL: {request.url}")
    print(f"All registered routes: {[rule.rule for rule in resume_bp.url_map.iter_rules() if rule.endpoint.startswith('resume')]}")
    return jsonify({"error": f"Route not found: /{path}", "method": request.method}), 404

