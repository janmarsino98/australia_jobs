from flask import Flask, request, jsonify, session
from flask_pymongo import PyMongo, ObjectId
from flask_cors import CORS
from pymongo import MongoClient
from flask_bcrypt import Bcrypt
import os
from dotenv import load_dotenv
from datetime import datetime
import constants as c
import redis
from flask_session import Session
from datetime import timedelta
import base64
import importlib

blueprints = []
# Get the current directory path of the routes folder
current_dir = os.path.dirname(os.path.abspath(__file__))

# Iterate over all Python files in the routes folder
for filename in os.listdir(current_dir+"/routes"):
    if filename.endswith('.py') and filename != '__init__.py':
        # Get the module name without the .py extension
        module_name = filename[:-3]
        # Dynamically import the module
        module = importlib.import_module(f'routes.{module_name}')
        # Check if the module has a blueprint (commonly named 'bp')
        if hasattr(module, 'bp'):
            # Add the blueprint to the list
            blueprints.append(getattr(module, 'bp'))

load_dotenv()
app = Flask(__name__)
app.config['MONGO_URI'] = os.getenv('MONGO_URI')
bcrypt = Bcrypt(app)
CORS(app, supports_credentials=True)
for bp in blueprints:
    app.register_blueprint(bp)

mongo = PyMongo(app)
users_db = mongo.db.users
jobtypes_db = mongo.db.job_types
jobs_db = mongo.db.jobs
companies_db = mongo.db.companies
app.config['SECRET_KEY'] = "helloW0rld!"
app.config["SESSION_TYPE"] = "redis"
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_USE_SIGNER"] = True
app.config["SESSION_REDIS"] = redis.from_url("redis://127.0.0.1:6379")

server_session = Session(app)

@app.route("/user", methods=["POST"])
def add_user():
    data = request.get_json()
    username = data.get('username')
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    user_type = data.get('type')
    
    if not username:
        return jsonify({"error": "Username is required"}), 400
    
    if not name:
        return jsonify({"error": "Name is required"}), 400
    if not email:
        return jsonify({"error": "Email is required"}), 400
    if not password:
        return jsonify({"error": "Password is required"}), 400
    if not user_type:
        return jsonify({"error": "User type is required"}), 400
    
    registered_user = users_db.find_one({"username": username})
    if registered_user:
        return jsonify({"error": "Username already in use!"}), 409
    registered_email = users_db.find_one({"email": email})
    if registered_email:
        return jsonify({"error": "Email already in use!"}), 409
    

    users_db.insert_one({
        "username": username,
        "name": name,
        "email": email,
        "password": bcrypt.generate_password_hash(data["password"]),
        "user_type": user_type,
        "created_at": datetime.utcnow(),
        "avatar": c.DEFAULT_AVATAR
        })
    return jsonify({"message": "User added successfully!"}), 201

@app.route("/user", methods=["GET"])
def get_users():
    final_users = []
    users = users_db.find()
    for user in users:
        user["_id"] = str(user["_id"])
        user.pop("password", None)
        final_users.append(user)
    return jsonify(final_users)

@app.route("/user", methods=["DELETE"])
def remove_user():
    data = request.get_json()
    username = data["username"]
    
    if not username:
        return ({"error": "You must provide a username to delete"}), 400
    
    user_to_remove = users_db.delete_one({"username": username})
    if user_to_remove.deleted_count == 1:
        return jsonify({"message": "User deleted!"}), 200
    
    else:
        return jsonify({"error": "User not found"}), 404
    
@app.route("/user", methods=["PUT"])
def modify_user():
    data = request.get_json()
    username = data["username"]
    name = data["name"]
    email = data["email"]
    avatar = data["avatar"]
    
    if not username:
        return jsonify({"error": "You must specify a username"}), 400
    
    update_fields = {}
    if name:
        update_fields["name"] = name
    if email:
        update_fields["email"] = email
    if avatar:
        update_fields["avatar"] = avatar

    if update_fields:
        result = users_db.update_one({"username": username}, {"$set": update_fields})
        if result.matched_count == 0:
            return jsonify({"error": "User not found"}), 404
        return jsonify({"message": "User updated successfully"}), 200
    
    return jsonify({"error": "No fields to update"}), 400

@app.route("/jobtype", methods=["GET"])
def get_jobtypes():
    result = []
    jobtypes = jobtypes_db.find({})
    for jobtype in jobtypes:
        jobtype["_id"] = str(jobtype["_id"])
        result.append(jobtype)
        
    return jsonify(result), 200

@app.route("/jobtype", methods=["POST"])
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
    
        
@app.route("/job", methods=["POST"])
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

@app.route("/job", methods=["GET"])
def get_jobs():
    result = []
    jobs = jobs_db.find({})
    for job in jobs:
        job["_id"] = str(job["_id"])
        result.append(job)
        
    return jsonify(result), 200

@app.route("/login", methods=["POST"])
def login_user():
    data = request.get_json()
    email = data["email"]
    password = data["password"]
    
    user = users_db.find_one({"email": email})
    
    if not user:
        return jsonify({"error": "Check your email and password"}), 401
    
    if not bcrypt.check_password_hash(user["password"], password):
        return jsonify({"error": "Check your email and password"}), 401
    
    session["user_id"] = str(user["_id"])
    print("Session after login")
    print(session)
    return jsonify({
        "id": str(user["_id"]),
        "email": user["email"]
        }), 200
    

@app.route("/@me", methods=["GET"])
def get_current_user():
    print("Session before me: ")
    print(session)
    user_id = session.get("user_id")

    if not user_id:
        return jsonify({"error":"Unauthorized"}), 401
    
    user = users_db.find_one({"_id": ObjectId(user_id)})

    user["_id"] = str(user["_id"])
    user["password"] = ""
    
    return jsonify(
        user
    )


@app.route("/company", methods=["POST"])
def add_company():
    data = request.get_json()
    name = data["name"]
    email = data["email"]
    password = data["password"]

    if not name:
        return jsonify({"error": "Name is required"}), 400
    if not email:
        return jsonify({"error": "Email is required"}), 400
    if not password:
        return jsonify({"error": "Password is required"}), 400
    
    registered_email = companies_db.find_one({"email": email})
    if registered_email:
        return jsonify({"error": "Email already in use"}), 409
    
    companies_db.insert_one({
        "name": name,
        "email": email,
        "password": bcrypt.generate_password_hash(data["password"]),
        "created_at": datetime.utcnow(),
        "avatar": c.DEFAULT_COMPANY_AVATAR
        })
    
    return jsonify({"message": "Company created successfully!"}), 200


    

if __name__ == '__main__':
    app.run(debug=True)
    
