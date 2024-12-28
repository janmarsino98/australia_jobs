from flask import Blueprint, request, current_app, send_file, session, jsonify
from extensions import mongo, fs
from werkzeug.utils import secure_filename
from bson.objectid import ObjectId
import gridfs
import io
import base64
import google.generativeai as genai
from dotenv import load_dotenv
import os
import constants as c
import PIL.Image

load_dotenv()

# Configure the API key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")


genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-1.5-flash")
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
    
    user_resume_id = user["resume_id"]
    if not user_resume_id:
        return None

    return str(user_resume_id)

@resume_bp.route('/current', methods=['GET'])
def get_current_user_resume():
    print("Session before the current user resume: ", session)
    if "user_id" not in session:
        print(session)
        return jsonify({"error": "There is no user logged."}), 400
    user_resume_id = get_current_user_resume_id()
    print(f"User Resume ID: {user_resume_id}")
    if not user_resume_id:
        return jsonify({"message": "The current user has not uploaded a resume."})
    
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
        return jsonify({"error": "An unexpected error occurred.",}), 500
    

@resume_bp.route('/upload', methods=['POST'])
def upload_resume():
    if 'file' not in request.files:
        return "No file part", 400
    
    file = request.files['file']
    
    if file.filename == '':
        return "No selected file", 400
    
    if file and allowed_file(file.filename):
        # Secure the filename
        filename = secure_filename(file.filename)
        
        # Get MongoDB instance and initialize GridFS
        mongo = current_app.config['MONGO']
        fs = gridfs.GridFS(mongo.db)
        
        # Save the file in GridFS
        file_id = fs.put(file, filename=filename)
        
        return f"File successfully uploaded with ID: {file_id}", 200

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
    
@resume_bp.route("/review", methods=["POST"])
def reveiw_resume():
    model = genai.GenerativeModel("gemini-1.5-flash")
    doc_path = r"C:\Users\janma\Downloads\Resume_vidya.pdf" # Replace with the actual path to your local PDF
    conv_path = doc_path.replace(".pdf", ".png")
    img = pdf_to_images(doc_path, conv_path)

    # Read and encode the local file
    with open(doc_path, "rb") as doc_file:
        doc_data = base64.standard_b64encode(doc_file.read()).decode("utf-8")

    prompt = f"You are a useful assistant that given a resume from australia, can provide feedback in json format. This is the structure that you must provide as a response, grading each category as Bad, Regular or Good. {c.RESPONSE_SCHEMA} "

    parts = [
        {
            "text": prompt
        }, {
            "inline_data": {
                "mime_type": "application/pdf",
                "data": doc_data
            }
        }, {
            "inline_data": {
                "mime_type": "image/png",
                "data": PIL.Image.open(doc_path.replace(".pdf", ".png"))
            }
        }
    ]
    
    response = model.generate_content(parts)
    return response.text
    
from pdf2image import convert_from_path
import os

def pdf_to_images(pdf_path, output_folder, dpi=300, fmt='png'):
    """
    Convert a PDF file to images.

    :param pdf_path: Path to the input PDF file.
    :param output_folder: Directory where images will be saved.
    :param dpi: Resolution of the output images.
    :param fmt: Image format (e.g., 'png', 'jpeg').
    """

    try:
        # Convert PDF to a list of PIL Image objects
        images = convert_from_path(pdf_path, dpi=dpi)

        for i, image in enumerate(images):

            # Save the image
            image.save(pdf_path.replace(".pdf", ".png"), fmt.upper())

        print("PDF conversion to images completed successfully.")

    except Exception as e:
        print(f"An error occurred: {e}")


    
