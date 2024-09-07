from flask import Flask
from flask_cors import CORS
import os
from dotenv import load_dotenv
import redis
from extensions import mongo, bcrypt, server_session  # Import here

load_dotenv()

def create_app():
    app = Flask(__name__)
    app.config['MONGO_URI'] = os.getenv('MONGO_URI')
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', "helloW0rld!")
    app.config["SESSION_TYPE"] = "redis"
    app.config["SESSION_PERMANENT"] = False
    app.config["SESSION_USE_SIGNER"] = True
    app.config["SESSION_REDIS"] = redis.from_url(os.getenv('REDIS_URL', "redis://127.0.0.1:6379"))

    mongo.init_app(app)
    bcrypt.init_app(app)
    server_session.init_app(app)
    CORS(app, supports_credentials=True)

    from auth.auth import auth_bp
    from users.users import users_bp  
    from jobtypes.jobtypes import jobtypes_bp  
    from jobs.jobs import jobs_bp  
    from states.states import states_bp  
    from cities.cities import cities_bp  
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(users_bp, url_prefix='/users')
    app.register_blueprint(jobtypes_bp, url_prefix='/jobtypes')
    app.register_blueprint(jobs_bp, url_prefix='/jobs')
    app.register_blueprint(states_bp, url_prefix='/states')
    app.register_blueprint(cities_bp, url_prefix='/cities')
    

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)
