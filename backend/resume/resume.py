from flask import Blueprint, request, current_app, send_file, session, jsonify
from extensions import mongo, fs
from werkzeug.utils import secure_filename
from bson.objectid import ObjectId
import gridfs
import io

# Create a Blueprint for resume operations
resume_bp = Blueprint('resume', __name__)
users_db = mongo.db.users
fs = gridfs.GridFS(mongo.db)

# Allowed extensions for file uploads
ALLOWED_EXTENSIONS = {'pdf'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_current_user_resume_id():
    user_id = session.get("user_id")
    if not user_id:
        return None
    
    user = users_db.find_one({"_id": ObjectId(user_id)})
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
    
    return users_db.find_one({"_id": ObjectId(user_id)})

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
            fs.delete(ObjectId(user_resume_id))
            
            # Remove resume reference from user
            users_db.update_one(
                {"_id": ObjectId(session.get("user_id"))},
                {"$unset": {"resume_id": "", "resume_custom_name": ""}}
            )
            
            return jsonify({"message": "Resume deleted successfully"}), 200
            
        except gridfs.errors.NoFile:
            # File doesn't exist but remove reference anyway
            users_db.update_one(
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
        file_id = fs.put(
            file,
            filename=filename,
            content_type=file.content_type or "application/pdf",
            encoding='utf-8'
        )
        print(f"File saved with ID: {file_id}")
        
        # Update user record with the resume ID
        user_id = session.get("user_id")
        users_db.update_one(
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
        users_db.update_one(
            {"_id": ObjectId(session.get("user_id"))},
            {"$set": {"resume_custom_name": custom_name}}
        )
        
        return jsonify({"message": "Resume name updated successfully"}), 200
        
    except Exception as e:
        print(f"Error renaming resume: {e}")
        return jsonify({"error": "Failed to rename resume"}), 500

@resume_bp.route("/review", methods=["POST"])
def review_resume(file_id):
    return
    
