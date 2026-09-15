"""
Faculty Dashboard and Portal Routes for CampuSentry Helpdesk.
Provides strictly isolated, real-time statistics and recent grievances for the logged-in faculty member.
"""
from datetime import datetime, timezone
from flask import Blueprint, jsonify
from flask_login import login_required, current_user
from sqlalchemy import or_
from extensions import db
from models.complaint import Complaint
from models.notification import Notification
from utils.auth_decorators import role_required

faculty_bp = Blueprint('faculty', __name__, url_prefix='/api/faculty')

@faculty_bp.route('/dashboard', methods=['GET'])
@login_required
@role_required('faculty')
def get_faculty_dashboard():
    """
    Returns real-time dashboard statistics and recent complaints for the logged-in faculty member.
    All data is computed dynamically from SQLite records.
    """
    user_id = current_user.id
    now = datetime.now(timezone.utc)

    # Query faculty complaints
    query = Complaint.query.filter_by(created_by=user_id)
    total_count = query.count()
    submitted_count = query.filter_by(status='Submitted').count()
    assigned_count = query.filter_by(status='Assigned').count()
    in_progress_count = query.filter_by(status='In Progress').count()
    resolved_count = query.filter_by(status='Resolved').count()
    closed_count = query.filter_by(status='Closed').count()
    from models.status_log import StatusLog
    reopened_count = StatusLog.query.join(Complaint).filter(
        Complaint.created_by == user_id,
        or_(Complaint.status == 'Reopened', StatusLog.new_status == 'Reopened', StatusLog.comments.ilike('%reopened%'))
    ).distinct(StatusLog.complaint_id).count()

    overdue_count = query.filter(
        Complaint.status.in_(['Submitted', 'Assigned', 'In Progress', 'Reopened']),
        or_(Complaint.is_overdue == True, Complaint.sla_deadline < now)
    ).count()

    recent_complaints = query.order_by(Complaint.created_at.desc()).limit(10).all()
    unread_notifications = Notification.query.filter_by(user_id=user_id, is_read=False).count()

    return jsonify({
        "success": True,
        "metrics": {
            "my_complaints": total_count,
            "total": total_count,
            "submitted": submitted_count,
            "assigned": assigned_count,
            "in_progress": in_progress_count,
            "resolved": resolved_count,
            "closed": closed_count,
            "reopened": reopened_count,
            "active": submitted_count + assigned_count + in_progress_count + reopened_count,
            "overdue": overdue_count,
            "unread_notifications": unread_notifications
        },
        "recent_complaints": [c.to_dict() for c in recent_complaints]
    }), 200
