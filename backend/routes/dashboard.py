"""
Universal and Role-Specific Dashboard Metrics API for CampuSentry Helpdesk.
All statistics and distributions are calculated dynamically from real SQLite database records.
No fake, static, or placeholder data is ever returned.
"""
from datetime import datetime
from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from sqlalchemy import or_
from extensions import db
from models.complaint import Complaint
from models.department import Department
from models.user import User
from models.status_log import StatusLog
from models.notification import Notification

dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/api/dashboard')

@dashboard_bp.route('/summary', methods=['GET'])
def get_summary():
    """
    Returns global complaint status summary dynamically calculated from SQLite.
    When database is empty, all values return 0.
    """
    now = datetime.utcnow()

    total = Complaint.query.count()
    submitted = Complaint.query.filter_by(status='Submitted').count()
    assigned = Complaint.query.filter_by(status='Assigned').count()
    in_progress = Complaint.query.filter_by(status='In Progress').count()
    resolved = Complaint.query.filter_by(status='Resolved').count()
    closed = Complaint.query.filter_by(status='Closed').count()
    reopened = StatusLog.query.filter(
        or_(StatusLog.new_status == 'Reopened', StatusLog.comments.ilike('%reopened%'))
    ).distinct(StatusLog.complaint_id).count()

    overdue = Complaint.query.filter(
        Complaint.status.in_(['Submitted', 'Assigned', 'In Progress', 'Reopened']),
        or_(Complaint.is_overdue == True, Complaint.sla_deadline < now)
    ).count()

    return jsonify({
        "success": True,
        "total": total,
        "submitted": submitted,
        "assigned": assigned,
        "in_progress": in_progress,
        "resolved": resolved,
        "closed": closed,
        "reopened": reopened,
        "overdue": overdue
    }), 200


@dashboard_bp.route('/department-statistics', methods=['GET'])
def get_department_statistics():
    """
    Returns live department breakdown for all active departments from SQLite.
    Always includes all active departments; count is 0 if no complaints exist.
    """
    departments = Department.query.filter_by(is_active=True).all()
    stats = {}
    for d in departments:
        count = Complaint.query.filter_by(department_id=d.id).count()
        stats[d.name] = count

    response_data = {
        "success": True,
        "department_statistics": stats,
        **stats
    }
    return jsonify(response_data), 200


@dashboard_bp.route('/status-statistics', methods=['GET'])
def get_status_statistics():
    """
    Returns complaint counts by status from SQLite.
    """
    now = datetime.utcnow()

    submitted = Complaint.query.filter_by(status='Submitted').count()
    assigned = Complaint.query.filter_by(status='Assigned').count()
    in_progress = Complaint.query.filter_by(status='In Progress').count()
    resolved = Complaint.query.filter_by(status='Resolved').count()
    closed = Complaint.query.filter_by(status='Closed').count()
    reopened = Complaint.query.filter_by(status='Reopened').count()
    overdue = Complaint.query.filter(
        Complaint.status.in_(['Submitted', 'Assigned', 'In Progress', 'Reopened']),
        or_(Complaint.is_overdue == True, Complaint.sla_deadline < now)
    ).count()

    return jsonify({
        "success": True,
        "status_statistics": {
            "Submitted": submitted,
            "Assigned": assigned,
            "In Progress": in_progress,
            "Resolved": resolved,
            "Closed": closed,
            "Reopened": reopened,
            "Overdue": overdue
        }
    }), 200


@dashboard_bp.route('/recent-activity', methods=['GET'])
def get_recent_activity():
    """
    Returns real status logs from SQLite.
    Returns empty list if no activities have occurred.
    """
    limit = request.args.get('limit', 20, type=int)
    logs = StatusLog.query.order_by(StatusLog.timestamp.desc()).limit(limit).all()
    return jsonify({
        "success": True,
        "count": len(logs),
        "activity": [l.to_dict() for l in logs]
    }), 200


@dashboard_bp.route('/notifications', methods=['GET'])
@login_required
def get_dashboard_notifications():
    """
    Returns real notifications for current logged-in user from SQLite.
    Returns empty list if no notifications exist.
    """
    limit = request.args.get('limit', 20, type=int)
    notifs = Notification.query.filter_by(user_id=current_user.id).order_by(Notification.created_at.desc()).limit(limit).all()
    unread = Notification.query.filter_by(user_id=current_user.id, is_read=False).count()
    return jsonify({
        "success": True,
        "count": len(notifs),
        "unread_count": unread,
        "notifications": [n.to_dict() for n in notifs]
    }), 200


@dashboard_bp.route('/stats', methods=['GET'])
def get_stats():
    """
    Comprehensive overview metrics dynamically computed from SQLite.
    """
    now = datetime.utcnow()

    total_complaints = Complaint.query.count()
    submitted_count = Complaint.query.filter_by(status='Submitted').count()
    assigned_count = Complaint.query.filter_by(status='Assigned').count()
    in_progress_count = Complaint.query.filter_by(status='In Progress').count()
    resolved_count = Complaint.query.filter_by(status='Resolved').count()
    closed_count = Complaint.query.filter_by(status='Closed').count()
    reopened_count = Complaint.query.filter_by(status='Reopened').count()
    high_priority_count = Complaint.query.filter_by(priority='High').count()

    overdue_count = Complaint.query.filter(
        Complaint.status.in_(['Submitted', 'Assigned', 'In Progress', 'Reopened']),
        or_(Complaint.is_overdue == True, Complaint.sla_deadline < now)
    ).count()

    # Active department breakdown
    departments = Department.query.filter_by(is_active=True).all()
    dept_counts = {}
    for d in departments:
        dept_counts[d.name] = Complaint.query.filter_by(department_id=d.id).count()

    # Real User counts from SQLite
    total_users = User.query.count()
    students_count = User.query.filter_by(role='student').count()
    faculty_count = User.query.filter_by(role='faculty').count()
    maintenance_count = User.query.filter_by(role='maintenance').count()
    management_count = User.query.filter_by(role='management').count()

    return jsonify({
        "success": True,
        "metrics": {
            "total_complaints": total_complaints,
            "submitted_count": submitted_count,
            "assigned_count": assigned_count,
            "in_progress_count": in_progress_count,
            "resolved_count": resolved_count,
            "closed_count": closed_count,
            "reopened_count": reopened_count,
            "active_pending_count": submitted_count + assigned_count + in_progress_count + reopened_count,
            "completed_count": resolved_count + closed_count,
            "overdue_count": overdue_count,
            "high_priority_count": high_priority_count,
            "department_breakdown": dept_counts,
            "users": {
                "total": total_users,
                "student": students_count,
                "faculty": faculty_count,
                "maintenance": maintenance_count,
                "management": management_count
            }
        }
    }), 200
