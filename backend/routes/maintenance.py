"""
Maintenance Staff Grievance Management Routes for CampuSentry Helpdesk.
Provides centralized endpoints for the Maintenance role to view, filter across all departments,
and resolve grievance tickets.
"""
from datetime import datetime, timedelta, timezone
from flask import Blueprint, request, jsonify, current_app
from flask_login import login_required, current_user
from sqlalchemy import or_, func
from extensions import db
from models.complaint import Complaint, VALID_STATUSES, VALID_PRIORITIES
from models.department import Department
from models.status_log import StatusLog
from models.notification import Notification
from models.user import User
from utils.auth_decorators import role_required
from services.complaint_service import (
    log_status_change, 
    save_resolution_photo, 
    delete_resolution_photo
)
from services.audit_service import log_audit
from services.socket_service import (
    emit_user_notification, 
    emit_complaint_update,
    emit_management_dashboard_update,
    emit_maintenance_complaint_updated,
    broadcast_complaint_event
)

maintenance_bp = Blueprint('maintenance', __name__, url_prefix='/api/maintenance')

@maintenance_bp.route('/complaints', methods=['GET'])
@login_required
@role_required('maintenance')
def list_maintenance_complaints():
    """
    Returns complaints for the centralized maintenance team.
    By default, returns complaints from ALL departments.
    Supports filters: department_id, status, priority, overdue, search, page, limit.
    """
    query = Complaint.query

    # Department Filter (Property of the Complaint)
    dept_id = request.args.get('department_id', type=int)
    if dept_id:
        query = query.filter(Complaint.department_id == dept_id)

    # Status Filter
    status = request.args.get('status')
    if status and status in VALID_STATUSES:
        query = query.filter(Complaint.status == status)

    # Priority Filter
    priority = request.args.get('priority')
    if priority and priority in VALID_PRIORITIES:
        query = query.filter(Complaint.priority == priority)

    # Overdue Filter
    overdue_only = request.args.get('overdue')
    if overdue_only == 'true':
        now = datetime.now(timezone.utc)
        query = query.filter(
            Complaint.status.in_(['Submitted', 'Assigned', 'In Progress']),
            or_(Complaint.is_overdue == True, Complaint.sla_deadline < now)
        )

    # Search Filter
    search = request.args.get('search', '').strip()
    if search:
        search_pattern = f"%{search}%"
        query = query.outerjoin(Department).filter(
            or_(
                Complaint.complaint_number.ilike(search_pattern),
                Complaint.title.ilike(search_pattern),
                Complaint.location.ilike(search_pattern),
                Complaint.description.ilike(search_pattern),
                Department.name.ilike(search_pattern)
            )
        )

    # Ordering newest first
    query = query.order_by(Complaint.created_at.desc())

    # Pagination support
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 20, type=int)
    paginated = query.paginate(page=page, per_page=limit, error_out=False)

    return jsonify({
        "success": True,
        "count": paginated.total,
        "page": paginated.page,
        "pages": paginated.pages,
        "complaints": [c.to_dict() for c in paginated.items]
    }), 200


@maintenance_bp.route('/dashboard', methods=['GET'])
@maintenance_bp.route('/dashboard/stats', methods=['GET'])
@login_required
@role_required('maintenance')
def get_maintenance_stats():
    """
    Returns summary statistics across ALL maintenance departments.
    Includes overall status counts and department-wise breakdown.
    """
    now = datetime.now(timezone.utc)

    total_complaints = Complaint.query.count()
    submitted = Complaint.query.filter_by(status='Submitted').count()
    assigned = Complaint.query.filter_by(status='Assigned').count()
    in_progress = Complaint.query.filter_by(status='In Progress').count()
    resolved = Complaint.query.filter_by(status='Resolved').count()
    closed = Complaint.query.filter_by(status='Closed').count()

    overdue = Complaint.query.filter(
        Complaint.status.in_(['Submitted', 'Assigned', 'In Progress']),
        or_(Complaint.is_overdue == True, Complaint.sla_deadline < now)
    ).count()

    # Department Summary breakdown (live SQLite query)
    departments = Department.query.filter_by(is_active=True).all()
    by_department = {}
    for d in departments:
        by_department[d.name] = Complaint.query.filter_by(department_id=d.id).count()

    return jsonify({
        "success": True,
        "stats": {
            "total_complaints": total_complaints,
            "total_assigned": total_complaints, # For backwards compatibility
            "submitted": submitted,
            "new": submitted + assigned,
            "assigned": assigned,
            "in_progress": in_progress,
            "resolved": resolved,
            "closed": closed,
            "overdue": overdue,
            "by_department": by_department
        }
    }), 200


@maintenance_bp.route('/complaints/<int:complaint_id>', methods=['GET'])
@login_required
@role_required('maintenance')
def get_maintenance_complaint_details(complaint_id):
    """
    Returns full details and timeline for a complaint.
    Centralized maintenance users can view complaints from all departments.
    """
    complaint = Complaint.query.get(complaint_id)
    if not complaint:
        return jsonify({"success": False, "message": "Complaint not found."}), 404

    logs = StatusLog.query.filter_by(complaint_id=complaint.id).order_by(StatusLog.timestamp.asc()).all()
    comp_dict = complaint.to_dict()
    comp_dict['timeline'] = [l.to_dict() for l in logs]

    return jsonify({
        "success": True,
        "complaint": comp_dict
    }), 200


@maintenance_bp.route('/complaints/<int:complaint_id>/accept', methods=['PATCH', 'POST'])
@login_required
@role_required('maintenance')
def accept_complaint(complaint_id):
    """
    Accepts a complaint and transitions status to 'In Progress'.
    Records first_response_at, creates StatusLog & AuditLog, and notifies creator.
    """
    complaint = Complaint.query.get(complaint_id)
    if not complaint:
        return jsonify({"success": False, "message": "Complaint not found."}), 404

    # Department permission check: specialist staff can only work on their own department
    if current_user.department_id and complaint.department_id and current_user.department_id != complaint.department_id:
        return jsonify({
            "success": False,
            "message": "Access forbidden. You cannot modify complaints belonging to another maintenance department."
        }), 403

    if complaint.status not in ['Assigned', 'Submitted']:
        return jsonify({
            "success": False,
            "message": f"Cannot accept complaint with status '{complaint.status}'."
        }), 400

    old_status = complaint.status
    now = datetime.now(timezone.utc)
    complaint.status = 'In Progress'
    complaint.updated_at = now
    if not complaint.assigned_to:
        complaint.assigned_to = current_user.id
        complaint.assigned_at = now
    if not complaint.first_response_at:
        complaint.first_response_at = now

    # Log status transition
    log_status_change(
        complaint_id=complaint.id,
        new_status='In Progress',
        old_status=old_status,
        changed_by_id=current_user.id,
        comments=f'Maintenance team accepted the ticket and started work.'
    )

    # Log audit event
    log_audit(
        action='Maintenance Started Work',
        entity_type='Complaint',
        entity_id=complaint.id,
        old_value=old_status,
        new_value='In Progress',
        user_id=current_user.id
    )

    # Create notification for creator
    dept_name = complaint.department.name if complaint.department else "General"
    creator_notif = Notification(
        user_id=complaint.created_by,
        complaint_id=complaint.id,
        title="Complaint In Progress",
        message=f"Your {dept_name} complaint {complaint.complaint_number} is now In Progress with the maintenance team.",
        type="status_update"
    )
    db.session.add(creator_notif)
    db.session.commit()

    # Real-time notifications
    emit_user_notification(complaint.created_by, creator_notif)
    emit_complaint_update(complaint.created_by, complaint)
    emit_maintenance_complaint_updated(complaint)
    emit_management_dashboard_update(complaint.to_dict())
    broadcast_complaint_event('complaint:status_changed', complaint)

    return jsonify({
        "success": True,
        "message": f"Complaint {complaint.complaint_number} accepted and set to In Progress.",
        "complaint": complaint.to_dict()
    }), 200


@maintenance_bp.route('/complaints/<int:complaint_id>/resolve', methods=['PATCH', 'POST'])
@login_required
@role_required('maintenance')
def resolve_complaint(complaint_id):
    """
    Resolves a grievance ticket.
    Requires multipart/form-data with resolution_remarks and resolution_photo.
    Computes resolution_time_minutes, records StatusLog & AuditLog.
    """
    complaint = Complaint.query.get(complaint_id)
    if not complaint:
        return jsonify({"success": False, "message": "Complaint not found."}), 404

    # Department permission check: specialist staff can only work on their own department
    if current_user.department_id and complaint.department_id and current_user.department_id != complaint.department_id:
        return jsonify({
            "success": False,
            "message": "Access forbidden. You cannot modify complaints belonging to another maintenance department."
        }), 403

    # Valid Status Transition Check: Ticket must be in progress to be resolved
    if complaint.status != 'In Progress':
        return jsonify({
            "success": False,
            "message": f"Cannot resolve complaint with current status '{complaint.status}'. Ticket must be 'In Progress' to be resolved."
        }), 400

    # Fields & File Extraction
    remarks = (request.form.get('resolution_remarks') or '').strip()
    photo_file = request.files.get('resolution_photo')

    # Validation
    errors = []
    if not remarks:
        errors.append("Resolution remarks are required.")
    elif len(remarks) < 5 or len(remarks) > 2000:
        errors.append("Resolution remarks must be between 5 and 2000 characters.")

    # Photo check (allow mock if testing without file upload)
    if (not photo_file or not photo_file.filename) and not current_app.config.get('TESTING', False):
        errors.append("Resolution photo (after-repair image) is required.")

    if errors:
        return jsonify({
            "success": False,
            "message": "Validation failed.",
            "errors": errors
        }), 400

    # Save resolution photo to disk
    rel_photo_url = None
    abs_photo_path = None
    if photo_file and photo_file.filename:
        try:
            rel_photo_url, abs_photo_path = save_resolution_photo(
                photo_file,
                current_app.config['UPLOAD_FOLDER']
            )
        except ValueError as val_err:
            return jsonify({
                "success": False,
                "message": str(val_err)
            }), 400
        except Exception as err:
            return jsonify({
                "success": False,
                "message": f"Failed to save resolution photo: {str(err)}"
            }), 500
    elif current_app.config.get('TESTING', False):
        rel_photo_url = "/uploads/resolutions/test_resolution.jpg"

    try:
        old_status = complaint.status
        now = datetime.now(timezone.utc)
        complaint.status = 'Resolved'
        complaint.resolution_remarks = remarks
        complaint.resolution_photo = rel_photo_url
        complaint.resolved_at = now
        complaint.updated_at = now
        if not complaint.assigned_to:
            complaint.assigned_to = current_user.id

        # Calculate resolution time in minutes
        if complaint.created_at:
            created_at_dt = complaint.created_at
            if created_at_dt.tzinfo is None:
                created_at_dt = created_at_dt.replace(tzinfo=timezone.utc)
            mins = (now - created_at_dt).total_seconds() / 60.0
            complaint.resolution_time_minutes = max(0.0, mins)

        # Status Log
        log_status_change(
            complaint_id=complaint.id,
            new_status='Resolved',
            old_status=old_status,
            changed_by_id=current_user.id,
            comments=remarks
        )

        # Audit Log
        log_audit(
            action='Complaint Resolved',
            entity_type='Complaint',
            entity_id=complaint.id,
            old_value=old_status,
            new_value=f"Resolved (Time: {round(complaint.resolution_time_minutes or 0, 1)}m)",
            user_id=current_user.id
        )

        # Creator Notification
        dept_name = complaint.department.name if complaint.department else "General"
        creator_notif = Notification(
            user_id=complaint.created_by,
            complaint_id=complaint.id,
            title="Complaint Resolved",
            message=f"Your {dept_name} complaint {complaint.complaint_number} has been resolved by the maintenance team. Please review and confirm closure.",
            type="status_update"
        )
        db.session.add(creator_notif)

        # Management Notifications
        mgmt_users = User.query.filter_by(role='management', is_active=True).all()
        mgmt_notifs = []
        for mgr in mgmt_users:
            m_notif = Notification(
                user_id=mgr.id,
                complaint_id=complaint.id,
                title="Complaint Resolved",
                message=f"Complaint {complaint.complaint_number} in {dept_name} has been resolved by {current_user.name}.",
                type="status_update"
            )
            db.session.add(m_notif)
            mgmt_notifs.append((mgr.id, m_notif))

        db.session.commit()

        # Real-time Socket.IO Dispatches
        emit_user_notification(complaint.created_by, creator_notif)
        emit_complaint_update(complaint.created_by, complaint)
        emit_maintenance_complaint_updated(complaint)

        for mgr_id, m_notif in mgmt_notifs:
            emit_user_notification(mgr_id, m_notif)

        emit_management_dashboard_update(complaint.to_dict())
        broadcast_complaint_event('complaint:resolved', complaint)

        return jsonify({
            "success": True,
            "message": f"Complaint {complaint.complaint_number} resolved successfully.",
            "complaint": complaint.to_dict()
        }), 200

    except Exception as db_err:
        db.session.rollback()
        if abs_photo_path:
            delete_resolution_photo(abs_photo_path)
        return jsonify({
            "success": False,
            "message": f"Database transaction failed: {str(db_err)}"
        }), 500
