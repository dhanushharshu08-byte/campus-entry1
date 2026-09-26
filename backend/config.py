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
    if uri:
        # Ignore accidental REST/HTTPS API endpoints passed in DATABASE_URL
        if uri.startswith(('http://', 'https://')):
            uri = None
        elif uri == 'sqlite:///:memory:':
            return 'sqlite:///:memory:'
        # Standardize postgres dialect for SQLAlchemy
        elif uri.startswith('postgres://'):
            uri = uri.replace('postgres://', 'postgresql://', 1)
        # Handle relative sqlite path (e.g. sqlite:///campus_helpdesk.db)
        elif uri.startswith('sqlite:///') and not uri.startswith('sqlite:////') and not (len(uri) > 11 and uri[10] == ':'):
            rel_name = uri.replace('sqlite:///', '')
            if os.environ.get('VERCEL'):
                tmp_db = f'/tmp/{rel_name}'
                src_db = os.path.join(BASE_DIR, rel_name)
                if not os.path.exists(tmp_db) and os.path.exists(src_db):
                    import shutil
                    try:
                        shutil.copy2(src_db, tmp_db)
                    except Exception:
                        pass
                return f"sqlite:///{tmp_db}"
            return f"sqlite:///{os.path.join(BASE_DIR, rel_name).replace('\\', '/')}"
        if uri:
            return uri
    
    # Handle Vercel serverless environment (writable in /tmp)
    if os.environ.get('VERCEL'):
        tmp_db = '/tmp/campus_helpdesk.db'
        src_db = os.path.join(BASE_DIR, 'campus_helpdesk.db')
        if not os.path.exists(tmp_db) and os.path.exists(src_db):
            import shutil
            try:
                shutil.copy2(src_db, tmp_db)
            except Exception:
                pass
        return f"sqlite:///{tmp_db}"

    return f"sqlite:///{os.path.join(BASE_DIR, 'campus_helpdesk.db').replace('\\', '/')}"

class Config:
    """Base application configuration."""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'campus_sentry_secure_production_secret_key_2026_acetcbe'
    
    # Database Configuration (SQLite or PostgreSQL / Supabase)
    SQLALCHEMY_DATABASE_URI = _get_database_uri()
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Session & Cookie Security
    _is_prod = bool(os.environ.get('VERCEL') or os.environ.get('FLASK_ENV') == 'production')
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    SESSION_COOKIE_SECURE = _is_prod or (os.environ.get('SESSION_COOKIE_SECURE', 'false').lower() == 'true')
    REMEMBER_COOKIE_HTTPONLY = True
    REMEMBER_COOKIE_SECURE = _is_prod or (os.environ.get('REMEMBER_COOKIE_SECURE', 'false').lower() == 'true')
    REMEMBER_COOKIE_SAMESITE = 'Lax'
    REMEMBER_COOKIE_DURATION = timedelta(days=7)
    PERMANENT_SESSION_LIFETIME = timedelta(days=7)
    
    # Upload Configurations (Strict 5 MB max & image-only extensions)
    if os.environ.get('VERCEL'):
        UPLOAD_FOLDER = '/tmp/uploads'
    else:
        UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
    ISSUES_UPLOAD_FOLDER = os.path.join(UPLOAD_FOLDER, 'issues')
    RESOLUTIONS_UPLOAD_FOLDER = os.path.join(UPLOAD_FOLDER, 'resolutions')
    MAX_CONTENT_LENGTH = 5 * 1024 * 1024  # 5 MB max upload size
    ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'webp'}
    
    # CORS Configuration
    raw_origins = os.environ.get('CORS_ORIGINS')
    if raw_origins:
        CORS_ORIGINS = [origin.strip() for origin in raw_origins.split(',') if origin.strip()]
    else:
        CORS_ORIGINS = [
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            'https://*.vercel.app'
        ]
    
    # Official College Email Configuration
    OFFICIAL_COLLEGE_EMAIL_DOMAIN = os.environ.get('OFFICIAL_COLLEGE_EMAIL_DOMAIN', 'acetcbe.edu.in')

    # Supabase Configuration
    SUPABASE_URL = os.environ.get('SUPABASE_URL', 'https://jxjfyrodyaellwnhhauy.supabase.co')
    SUPABASE_ANON_KEY = os.environ.get('SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4amZ5cm9keWFlbGx3bmhoYXV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwMjExMzgsImV4cCI6MjEwNDU5NzEzOH0.Mkq_i-GaGjDoLq0QbfEpn1dJn6C20mBrOj2sV2-fRO0')
    SUPABASE_PROJECT_REF = os.environ.get('SUPABASE_PROJECT_REF', 'jxjfyrodyaellwnhhauy')
    SUPABASE_PUBLISHABLE_KEY = os.environ.get('SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_ryoCMyv6rSQ87ewm7iGyRA_SCtXM0Vu')
    SUPABASE_SERVICE_ROLE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')


