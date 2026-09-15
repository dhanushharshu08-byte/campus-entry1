from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_socketio import SocketIO
from flask_login import LoginManager

db = SQLAlchemy()
cors = CORS()
socketio = SocketIO()
login_manager = LoginManager()
