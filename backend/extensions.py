# extensions.py
from flask_pymongo import PyMongo
from flask_bcrypt import Bcrypt
from flask_session import Session
import gridfs
from gridfs import GridFS
from typing import Optional

mongo = PyMongo()
bcrypt = Bcrypt()
server_session = Session()
fs: Optional[GridFS] = None