import os
import logging
from flask import Flask, jsonify, request, send_from_directory
from flask_socketio import emit, join_room, leave_room
from sqlalchemy import event
from sqlalchemy.engine import Engine
from config import Config
from extensions import db, cors, socketio, login_manager
from models.system_setting import SystemSetting
from routes import auth_bp, departments_bp, complaints_bp, notifications_bp, dashboard_bp, maintenance_bp, management_bp, student_bp, faculty_bp
from services.sla_worker import start_sla_worker

# Configure structured application logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger('CampuSentry')

# Enforce SQLite foreign keys
@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    try:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()
    except Exception as e:
        logger.debug(f"SQLite PRAGMA foreign_keys notice: {e}")

def create_app(config_class=Config):
    """Application factory for the College Helpdesk Backend."""
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Ensure upload & backup directories exist
    os.makedirs(app.config['ISSUES_UPLOAD_FOLDER'], exist_ok=True)
    os.makedirs(app.config['RESOLUTIONS_UPLOAD_FOLDER'], exist_ok=True)
    backups_dir = os.path.join(app.config.get('BASE_DIR', os.path.abspath(os.path.dirname(__file__))), 'backups')
    os.makedirs(backups_dir, exist_ok=True)

    # Initialize extensions
    db.init_app(app)
    
    # Configure CORS with credentials support for frontend origins
    cors.init_app(
        app,
        resources={
            r"/api/*": {"origins": app.config['CORS_ORIGINS']},
            r"/uploads/*": {"origins": app.config['CORS_ORIGINS']}
        },
        supports_credentials=True
    )
    
    socketio.init_app(app, cors_allowed_origins=app.config['CORS_ORIGINS'], async_mode='threading')
    
    # Login Manager setup
    login_manager.init_app(app)
    login_manager.session_protection = 'strong'

    @login_manager.unauthorized_handler
    def handle_unauthorized():
        return jsonify({
            "success": False,
            "message": "Authentication required. Please log in.",
            "error_code": "UNAUTHORIZED"
        }), 401

    # Security Headers Middleware
    @app.after_request
    def add_security_headers(response):
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'SAMEORIGIN'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        return response

    # Register Blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(departments_bp)
    app.register_blueprint(complaints_bp)
    app.register_blueprint(notifications_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(maintenance_bp)
    app.register_blueprint(management_bp)
    app.register_blueprint(student_bp)
    app.register_blueprint(faculty_bp)

    # Health Check Endpoint
    @app.route('/api/health', methods=['GET'])
    def health_check():
        db_status = "connected"
        try:
            db.session.execute(db.text("SELECT 1"))
        except Exception:
            db_status = "error"

        return jsonify({
            "status": "ok",
            "database": db_status,
            "socketio": "running"
        }), 200

    # Serve uploaded issue photos securely
    @app.route('/uploads/issues/<path:filename>', methods=['GET'])
    def serve_issue_photo(filename):
        return send_from_directory(app.config['ISSUES_UPLOAD_FOLDER'], filename)

    # Serve uploaded resolution photos securely
    @app.route('/uploads/resolutions/<path:filename>', methods=['GET'])
    def serve_resolution_photo(filename):
        return send_from_directory(app.config['RESOLUTIONS_UPLOAD_FOLDER'], filename)

    # Global Error Handlers with standard JSON structure
    @app.errorhandler(400)
    def bad_request(error):
        msg = getattr(error, 'description', 'Bad request')
        return jsonify({"success": False, "message": str(msg), "error_code": "BAD_REQUEST"}), 400

    @app.errorhandler(401)
    def unauthorized(error):
        return jsonify({"success": False, "message": "Authentication required.", "error_code": "UNAUTHORIZED"}), 401

    @app.errorhandler(403)
    def forbidden(error):
        msg = getattr(error, 'description', 'Access forbidden. Insufficient permissions.')
        return jsonify({"success": False, "message": str(msg), "error_code": "FORBIDDEN"}), 403

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"success": False, "message": "Requested resource could not be found.", "error_code": "NOT_FOUND"}), 404

    @app.errorhandler(413)
    def payload_too_large(error):
        return jsonify({"success": False, "message": "File size exceeds the allowed limit (5 MB).", "error_code": "PAYLOAD_TOO_LARGE"}), 413

    @app.errorhandler(422)
    def unprocessable(error):
        return jsonify({"success": False, "message": "Unprocessable request payload.", "error_code": "UNPROCESSABLE_ENTITY"}), 422

    @app.errorhandler(500)
    def internal_error(error):
        logger.error(f"Internal server error: {error}")
        return jsonify({"success": False, "message": "An internal server error occurred.", "error_code": "INTERNAL_SERVER_ERROR"}), 500

    # Auto-create tables & initialize default system settings
    with app.app_context():
        db.create_all()
        # Safe schema column additions for SQLite backwards compatibility
        try:
            with db.engine.connect() as conn:
                res = conn.execute(db.text("PRAGMA table_info(users)")).fetchall()
                col_names = [r[1] for r in res]
                if 'last_login' not in col_names:
                    conn.execute(db.text("ALTER TABLE users ADD COLUMN last_login DATETIME"))
                    conn.commit()
        except Exception as schema_err:
            logger.debug(f"Schema check notice: {schema_err}")

        try:
            SystemSetting.init_default_settings()
        except Exception as err:
            logger.debug(f"System settings init notice: {err}")

    # Start background SLA worker thread if not running automated unit tests
    if not app.config.get('TESTING', False):
        start_sla_worker(app, interval_seconds=45)

    return app

# Socket.IO Event Handlers
@socketio.on('connect')
def handle_connect():
    logger.info(f"Socket.IO client connected: {request.sid}")
    emit('connection_response', {'data': 'Connected to College Helpdesk Realtime Hub', 'sid': request.sid})

@socketio.on('disconnect')
def handle_disconnect():
    logger.info(f"Socket.IO client disconnected: {request.sid}")

@socketio.on('join_user_room')
def handle_join_user_room(data):
    user_id = data.get('user_id')
    role = data.get('role')
    if user_id:
        room = f"user_{user_id}"
        join_room(room)
        logger.info(f"User {user_id} joined room {room}")
        if role == 'management':
            join_room("management_users")
            logger.info(f"Management User {user_id} joined management_users room")
        elif role == 'maintenance':
            join_room("maintenance_users")
            logger.info(f"Maintenance User {user_id} joined maintenance_users room")
        emit('room_joined', {'room': room, 'user_id': user_id})

@socketio.on('join_management_room')
def handle_join_management_room(data):
    user_id = data.get('user_id')
    join_room("management_users")
    logger.info(f"User {user_id} explicitly joined management_users room")
    emit('room_joined', {'room': 'management_users', 'user_id': user_id})

@socketio.on('ping_server')
def handle_ping(data):
    emit('pong_server', {'timestamp': data.get('timestamp')})

app = create_app()

if __name__ == '__main__':
    logger.info("Starting CampuSentry Backend on port 5000")
    debug_mode = os.environ.get("FLASK_DEBUG", "false").lower() == "true"
    socketio.run(app, host='0.0.0.0', port=5000, debug=debug_mode, allow_unsafe_werkzeug=True)
