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
    # Comment out SERVER_NAME to allow requests from both localhost and 127.0.0.1
    # app.config['SERVER_NAME'] = os.getenv('SERVER_NAME', 'localhost:5000')
    app.config['PREFERRED_URL_SCHEME'] = os.getenv('PREFERRED_URL_SCHEME', 'http')
    
    # Mail configuration
    app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
    app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', '587'))
    app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', 'True').lower() == 'true'
    app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
    app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
    # Use MAIL_DEFAULT_SENDER if set, otherwise fallback to MAIL_USERNAME
    app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER') or os.getenv('MAIL_USERNAME')

    # Initialize extensions
    mongo.init_app(app)
    bcrypt.init_app(app)
    server_session.init_app(app)
    mail.init_app(app)
    CORS(app, 
         origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://127.0.0.1:5000", "http://localhost:5000"], 
         supports_credentials=True,
         allow_headers=['Content-Type', 'Authorization', 'X-Requested-With', 'X-XSRF-TOKEN', 'X-Content-Type-Options', 'X-Frame-Options', 'X-XSS-Protection'],
         methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
    
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
    from notification_system import notifications_bp
    from notification_preferences import notification_preferences_bp
    from recommendations.recommendations import recommendations_bp
    from analytics.analytics import analytics_bp
    from admin.admin import admin_bp
    
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
    print("Registering resume blueprint...")
    app.register_blueprint(resume_bp, url_prefix='/resume')
    print(f"Resume blueprint registered with routes: {[rule.rule for rule in app.url_map.iter_rules() if 'resume' in rule.rule]}")
    app.register_blueprint(applications_bp, url_prefix='/applications')
    app.register_blueprint(notifications_bp, url_prefix='/notifications')
    app.register_blueprint(notification_preferences_bp, url_prefix='/notification-preferences')
    app.register_blueprint(recommendations_bp, url_prefix='/recommendations')
    print("Registering analytics blueprint...")
    app.register_blueprint(analytics_bp, url_prefix='/analytics')
    print(f"Analytics blueprint registered with routes: {[rule.rule for rule in app.url_map.iter_rules() if 'analytics' in rule.rule]}")
    print("Registering admin blueprint...")
    app.register_blueprint(admin_bp, url_prefix='/admin')
    print(f"Admin blueprint registered with routes: {[rule.rule for rule in app.url_map.iter_rules() if 'admin' in rule.rule]}")

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5000, debug=True)
