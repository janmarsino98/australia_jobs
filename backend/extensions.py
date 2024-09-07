# extensions.py
from flask_pymongo import PyMongo
from flask_bcrypt import Bcrypt
from flask_session import Session

mongo = PyMongo()
bcrypt = Bcrypt()
server_session = Session()
