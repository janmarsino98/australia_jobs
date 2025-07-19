# extensions.py
from flask_pymongo import PyMongo
from flask_bcrypt import Bcrypt
from flask_session import Session
from flask_mail import Mail
import gridfs
from gridfs import GridFS
from typing import Optional

mongo = PyMongo()
bcrypt = Bcrypt()
server_session = Session()
mail = Mail()
fs: Optional[GridFS] = None