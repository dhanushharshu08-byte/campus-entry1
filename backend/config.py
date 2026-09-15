import os
import sys
from datetime import timedelta

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(BASE_DIR, '.env'))
except ImportError:
    pass

def _get_database_uri() -> str:
    uri = os.environ.get('DATABASE_URL')
    if not uri or uri == 'sqlite:///campus_helpdesk.db':
        return f"sqlite:///{os.path.join(BASE_DIR, 'campus_helpdesk.db').replace('\\', '/')}"
    if uri == 'sqlite:///:memory:':
        return 'sqlite:///:memory:'
    # Standardize postgres dialect for SQLAlchemy
    if uri.startswith('postgres://'):
        uri = uri.replace('postgres://', 'postgresql://', 1)
    return uri

class Config:
    """Base application configuration."""
    SECRET_KEY = os.environ.get('SECRET_KEY')
    if not SECRET_KEY:
        if os.environ.get('TESTING', '').lower() == 'true' or 'pytest' in sys.modules:
            SECRET_KEY = 'test_secret_key_for_testing_suite'
        elif os.environ.get('FLASK_ENV') == 'development':
            SECRET_KEY = 'campus_dev_secret_key_change_in_production'
        else:
            raise RuntimeError("SECRET_KEY environment variable must be set.")
    
    # Database Configuration (SQLite)
    SQLALCHEMY_DATABASE_URI = _get_database_uri()
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Session & Cookie Security
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    SESSION_COOKIE_SECURE = False
    REMEMBER_COOKIE_HTTPONLY = True
    REMEMBER_COOKIE_DURATION = timedelta(days=7)
    PERMANENT_SESSION_LIFETIME = timedelta(days=7)
    
    # Upload Configurations (Strict 5 MB max & image-only extensions)
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
    ISSUES_UPLOAD_FOLDER = os.path.join(UPLOAD_FOLDER, 'issues')
    RESOLUTIONS_UPLOAD_FOLDER = os.path.join(UPLOAD_FOLDER, 'resolutions')
    MAX_CONTENT_LENGTH = 5 * 1024 * 1024  # 5 MB max upload size
    ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'webp'}
    
    # CORS Configuration
    CORS_ORIGINS = [
        origin.strip()
        for origin in os.environ.get(
            'CORS_ORIGINS',
            'http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000'
        ).split(',')
        if origin.strip()
    ]
    
    # Official College Email Configuration
    OFFICIAL_COLLEGE_EMAIL_DOMAIN = os.environ.get('OFFICIAL_COLLEGE_EMAIL_DOMAIN', 'acetcbe.edu.in')

