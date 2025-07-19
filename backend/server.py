from flask import Flask
from flask_cors import CORS
import os
from dotenv import load_dotenv
import redis
from extensions import mongo, bcrypt, server_session, mail  # Import here
import gridfs

load_dotenv()

def create_app():
    app = Flask(__name__)
    app.config['MONGO_URI'] = os.getenv('MONGO_URI')
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', "helloW0rld!")
    app.config["SESSION_TYPE"] = "redis"
    app.config["SESSION_PERMANENT"] = False
    app.config["SESSION_USE_SIGNER"] = True
    app.config["SESSION_REDIS"] = redis.from_url(os.getenv('REDIS_URL', "redis://127.0.0.1:6379"))
    
    # Force specific host for OAuth redirects
    app.config['SERVER_NAME'] = os.getenv('SERVER_NAME', 'localhost:5000')
    app.config['PREFERRED_URL_SCHEME'] = os.getenv('PREFERRED_URL_SCHEME', 'http')
    
    # Mail configuration
    app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
    app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', '587'))
    app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', 'True').lower() == 'true'
    app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
    app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
    app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER')

    # Initialize extensions
    mongo.init_app(app)
    bcrypt.init_app(app)
    server_session.init_app(app)
    mail.init_app(app)
    CORS(app, supports_credentials=True)
    
    # Test MongoDB connection
    try:
        # The ping command is cheap and does not require auth
        mongo.db.command('ping')
        print("Pinged your deployment. You successfully connected to MongoDB!")
    except Exception as e:
        print(f"Failed to connect to MongoDB: {e}")
    
    global fs
    fs = gridfs.GridFS(mongo.db)

    # Make the mongo instance available to other blueprints
    app.config['MONGO'] = mongo

    # Register blueprints
    from auth.auth import auth_bp, init_oauth
    from users.users import users_bp  
    from jobtypes.jobtypes import jobtypes_bp  
    from jobs.jobs import jobs_bp  
    from states.states import states_bp  
    from cities.cities import cities_bp
    from resume.resume import resume_bp
    from applications.applications import applications_bp
    
    # Initialize OAuth
    try:
        google_client, linkedin_client = init_oauth(app)
        if not google_client:
            print("Warning: Google OAuth client failed to initialize")
        if not linkedin_client:
            print("Warning: LinkedIn OAuth client failed to initialize")
    except Exception as e:
        print(f"Error initializing OAuth: {e}")
        print("Warning: OAuth services may not be available")
    
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(users_bp, url_prefix='/users')
    app.register_blueprint(jobtypes_bp, url_prefix='/jobtypes')
    app.register_blueprint(jobs_bp, url_prefix='/jobs')
    app.register_blueprint(states_bp, url_prefix='/states')
    app.register_blueprint(cities_bp, url_prefix='/cities')
    app.register_blueprint(resume_bp, url_prefix='/resume')
    app.register_blueprint(applications_bp, url_prefix='/applications')

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)
