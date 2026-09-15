from routes.auth import auth_bp
from routes.departments import departments_bp
from routes.complaints import complaints_bp
from routes.notifications import notifications_bp
from routes.dashboard import dashboard_bp
from routes.maintenance import maintenance_bp
from routes.management import management_bp
from routes.student import student_bp
from routes.faculty import faculty_bp

__all__ = ['auth_bp', 'departments_bp', 'complaints_bp', 'notifications_bp', 'dashboard_bp', 'maintenance_bp', 'management_bp', 'student_bp', 'faculty_bp']

