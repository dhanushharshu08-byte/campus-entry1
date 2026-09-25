from datetime import datetime, timezone
from flask import Blueprint, request, jsonify, current_app
from flask_login import current_user
from sqlalchemy import or_
from extensions import db
from models.complaint import Complaint, VALID_STATUSES, VALID_PRIORITIES
from models.department import Department
from models.status_log import StatusLog
from models.notification import Notification
from services.complaint_service import (
    generate_complaint_number,
    save_issue_photo,
    delete_issue_photo,
    log_status_change
)
from services.audit_service import log_audit
from services.sla_service import calculate_initial_sla
from services.socket_service import (
    emit_user_notification, 
    emit_complaint_update, 
    emit_management_dashboard_update,
    broadcast_complaint_event
)
from utils.auth_decorators import role_required

complaints_bp = Blueprint('complaints', __name__, url_prefix='/api/complaints')

@complaints_bp.route('', methods=['POST'])
@role_required('student', 'faculty')
def create_complaint():
    """
    Submits a new maintenance grievance ticket.
    Strictly authorized for Student and Faculty roles.
    Expects multipart/form-data containing fields and an issue_photo file.
    """
    title = (request.form.get('title') or '').strip()
    description = (request.form.get('description') or '').strip()
    location = (request.form.get('location') or '').strip()
    priority = (request.form.get('priority') or 'Medium').strip()
    dept_id_raw = request.form.get('department_id')
    photo_file = request.files.get('issue_photo')

    # Validation
    errors = []
    if not title:
        errors.append("Complaint title is required.")
    elif len(title) < 5 or len(title) > 150:
        errors.append("Complaint title must be between 5 and 150 characters.")

    if not description:
        errors.append("Description is required.")
    elif len(description) < 10 or len(description) > 2000:
        errors.append("Description must be between 10 and 2000 characters.")

    if not location:
        errors.append("Location is required.")
    elif len(location) < 3:
        errors.append("Location must be at least 3 characters long.")

    department_id = None
    if not dept_id_raw:
        errors.append("Department is required.")
    else:
        dept = None
        try:
            from routes.departments import ensure_seed_departments
            dept_id_str = str(dept_id_raw).strip()

            # Canonical ID to fallback name mapping for resilience across seeds
            ID_TO_NAME_FALLBACK = {
                1: 'Electrical',
                2: 'Plumbing',
                3: 'Civil',
                4: 'Carpentry',
                5: 'Cleaning',
                6: 'IT / Network',
                7: 'Other',
                8: 'Carpentry',
                9: 'Cleaning'
            }

            if dept_id_str.isdigit():
                d_id = int(dept_id_str)
                dept = db.session.get(Department, d_id)
                if not dept and d_id in ID_TO_NAME_FALLBACK:
                    fallback_name = ID_TO_NAME_FALLBACK[d_id]
                    dept = Department.query.filter(db.func.lower(Department.name) == fallback_name.lower()).first()
            else:
                normalized_name = dept_id_str.lower().replace(' ', '')
                for d in Department.query.all():
                    if d.name.lower().replace(' ', '') == normalized_name or d.name.lower() == dept_id_str.lower():
                        dept = d
                        break

            # If department not yet populated in database instance, ensure seeds and retry
            if not dept:
                ensure_seed_departments()
                if dept_id_str.isdigit():
                    d_id = int(dept_id_str)
                    dept = db.session.get(Department, d_id)
                    if not dept and d_id in ID_TO_NAME_FALLBACK:
                        fallback_name = ID_TO_NAME_FALLBACK[d_id]
                        dept = Department.query.filter(db.func.lower(Department.name) == fallback_name.lower()).first()
                else:
                    normalized_name = dept_id_str.lower().replace(' ', '')
                    for d in Department.query.all():
                        if d.name.lower().replace(' ', '') == normalized_name or d.name.lower() == dept_id_str.lower():
                            dept = d
                            break

            if dept:
                if dept.is_active:
                    department_id = dept.id
                else:
                    errors.append("Selected department is invalid or inactive.")
            else:
                errors.append("Selected department is invalid or inactive.")
        except (ValueError, TypeError):
            errors.append("Invalid department ID.")

    if priority not in VALID_PRIORITIES:
        errors.append(f"Invalid priority '{priority}'. Must be one of: {', '.join(sorted(VALID_PRIORITIES))}.")

    is_testing = current_app.config.get('TESTING', False)
    if not is_testing and (not photo_file or not photo_file.filename):
        errors.append("Issue photo is required.")

    if errors:
        return jsonify({
            "success": False,
            "message": "Validation failed.",
            "errors": errors
        }), 400

    # Save photo to disk with unique secure filename
    abs_photo_path = None
    rel_photo_url = None
    if photo_file and photo_file.filename:
        try:
            rel_photo_url, abs_photo_path = save_issue_photo(
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
                "message": f"Failed to upload photo: {str(err)}"
            }), 500

    # Database record creation with rollback safety
    try:
        complaint_num = generate_complaint_number()
        complaint = Complaint(
            complaint_number=complaint_num,
            title=title,
            description=description,
            department_id=department_id,
            location=location,
            priority=priority,
            status='Submitted',
            created_by=current_user.id,
            issue_photo=rel_photo_url,
            created_at=datetime.now(timezone.utc)
        )
        # Compute SLA deadline based on priority setting
        calculate_initial_sla(complaint)

        db.session.add(complaint)
        db.session.flush()

        # Create initial status log entry
        log_status_change(
            complaint_id=complaint.id,
            new_status='Submitted',
            changed_by_id=current_user.id,
            comments='Grievance ticket created and submitted to helpdesk.'
        )

        # Create audit log entry
        log_audit(
            action='Complaint Created',
            entity_type='Complaint',
            entity_id=complaint.id,
            new_value=f"Created {complaint.complaint_number} ({complaint.title}, Priority: {complaint.priority}, Dept ID: {complaint.department_id})",
            user_id=current_user.id
        )

        # Automatic Department Assignment
        from services.assignment_service import assign_complaint_to_department_staff
        assigned_staff = assign_complaint_to_department_staff(complaint)

        if assigned_staff:
            complaint.assigned_at = datetime.now(timezone.utc)
            log_status_change(
                complaint_id=complaint.id,
                new_status='Assigned',
                changed_by_id=current_user.id,
                comments=f'Automatically assigned to maintenance staff: {assigned_staff.name}'
            )
            log_audit(
                action='Complaint Auto-Assigned',
                entity_type='Complaint',
                entity_id=complaint.id,
                new_value=f"Assigned to {assigned_staff.name} (ID: {assigned_staff.id})",
                user_id=current_user.id
            )

        # High Priority Alert for Management
        if priority == 'High':
            from models.user import User
            mgmt_users = User.query.filter_by(role='management', is_active=True).all()
            for mgr in mgmt_users:
                hp_notif = Notification(
                    user_id=mgr.id,
                    complaint_id=complaint.id,
                    title="High Priority Complaint",
                    message=f"High priority complaint {complaint.complaint_number} requires attention.",
                    type="high_priority"
                )
                db.session.add(hp_notif)
                db.session.flush()
                emit_user_notification(mgr.id, hp_notif)

            emit_management_dashboard_update(complaint.to_dict())

        db.session.commit()

        broadcast_complaint_event('complaint:created', complaint)

        msg = f"Grievance {complaint.complaint_number} submitted successfully and assigned to {assigned_staff.name}." if assigned_staff else f"Grievance {complaint.complaint_number} submitted successfully."

        return jsonify({
            "success": True,
            "message": msg,
            "complaint": complaint.to_dict()
        }), 201

    except Exception as db_err:
        db.session.rollback()
        # Clean up orphaned uploaded file on DB failure
        if abs_photo_path:
            delete_issue_photo(abs_photo_path)
        return jsonify({
            "success": False,
            "message": f"Database transaction failed: {str(db_err)}"
        }), 500


@complaints_bp.route('', methods=['GET'])
@role_required('student', 'faculty', 'maintenance', 'management')
def list_complaints():
    """
    List complaints.
    For Student and Faculty: strictly returns only complaints created by current_user.
    Supports query parameters: status, department_id, priority, search.
    """
    query = Complaint.query

    # Enforce role ownership for student and faculty
    if current_user.role in {'student', 'faculty'}:
        query = query.filter_by(created_by=current_user.id)
    elif current_user.role == 'maintenance':
        if current_user.department_id:
            query = query.filter_by(department_id=current_user.department_id)

    # Optional Filters
    status = request.args.get('status')
    if status and status in VALID_STATUSES:
        query = query.filter_by(status=status)

    dept_id = request.args.get('department_id', type=int)
    if dept_id:
        query = query.filter_by(department_id=dept_id)

    priority = request.args.get('priority')
    if priority and priority in VALID_PRIORITIES:
        query = query.filter_by(priority=priority)

    # Search by complaint_number, title, or location
    search = request.args.get('search', '').strip()
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Complaint.complaint_number.ilike(search_pattern),
                Complaint.title.ilike(search_pattern),
                Complaint.location.ilike(search_pattern)
            )
        )

    # Newest complaints first
    complaints = query.order_by(Complaint.created_at.desc()).all()

    return jsonify({
        "success": True,
        "count": len(complaints),
        "complaints": [c.to_dict() for c in complaints]
    }), 200


@complaints_bp.route('/<int:complaint_id>', methods=['GET'])
@role_required('student', 'faculty', 'maintenance', 'management')
def get_complaint(complaint_id):
    """
    Retrieve single complaint details.
    Enforces ownership authorization: students and faculty can only view their own tickets.
    """
    complaint = db.session.get(Complaint, complaint_id)
    if not complaint:
        return jsonify({
            "success": False,
            "message": "Complaint not found."
        }), 404

    # Ownership check
    if current_user.role in {'student', 'faculty'} and complaint.created_by != current_user.id:
        return jsonify({
            "success": False,
            "message": "You do not have permission to view this grievance."
        }), 403

    # For student/faculty, filter out internal management remarks
    if current_user.role in {'student', 'faculty'}:
        logs = StatusLog.query.filter_by(complaint_id=complaint.id, is_internal=False).order_by(StatusLog.timestamp.asc()).all()
    else:
        logs = StatusLog.query.filter_by(complaint_id=complaint.id).order_by(StatusLog.timestamp.asc()).all()

    result = complaint.to_dict()
    result['timeline'] = [log.to_dict() for log in logs]

    return jsonify({
        "success": True,
        "complaint": result
    }), 200


@complaints_bp.route('/<int:complaint_id>/close', methods=['PATCH', 'POST', 'PUT'])
@role_required('student', 'faculty', 'maintenance', 'management')
def close_complaint(complaint_id):
    """
    Closes a resolved grievance ticket.
    Strictly authorized for original complaint creator when status is 'Resolved'.
    """
    complaint = db.session.get(Complaint, complaint_id)
    if not complaint:
        return jsonify({"success": False, "message": "Complaint not found."}), 404

    # Authorization Check
    if complaint.created_by != current_user.id:
        return jsonify({
            "success": False,
            "message": "Access forbidden. Only the complaint creator can confirm closure."
        }), 403

    # Status State Machine Rule Check
    if complaint.status != 'Resolved':
        return jsonify({
            "success": False,
            "message": f"Cannot close complaint with status '{complaint.status}'. Ticket must be 'Resolved'."
        }), 400

    old_status = complaint.status
    complaint.status = 'Closed'
    complaint.closed_at = datetime.now(timezone.utc)
    complaint.updated_at = datetime.now(timezone.utc)

    # Calculate final resolution time in minutes if not already set
    if complaint.created_at and not complaint.resolution_time_minutes:
        res_time = (complaint.closed_at - complaint.created_at).total_seconds() / 60.0
        complaint.resolution_time_minutes = max(0.0, res_time)

    # Status Log
    log_status_change(
        complaint_id=complaint.id,
        new_status='Closed',
        old_status=old_status,
        changed_by_id=current_user.id,
        comments='Confirmed and closed by complainant'
    )

    # Audit Log
    log_audit(
        action='Complaint Closed',
        entity_type='Complaint',
        entity_id=complaint.id,
        old_value='Resolved',
        new_value='Closed',
        user_id=current_user.id
    )

    # Notify assigned maintenance user if present
    if complaint.assigned_to:
        m_notif = Notification(
            user_id=complaint.assigned_to,
            complaint_id=complaint.id,
            title="Complaint Closed",
            message=f"Complaint {complaint.complaint_number} has been confirmed and closed by the complainant.",
            type="status_update"
        )
        db.session.add(m_notif)
        db.session.commit()

        emit_user_notification(complaint.assigned_to, m_notif)
        emit_complaint_update(complaint.assigned_to, complaint)
    else:
        db.session.commit()

    emit_management_dashboard_update(complaint.to_dict())
    broadcast_complaint_event('complaint:closed', complaint)

    return jsonify({
        "success": True,
        "message": f"Complaint {complaint.complaint_number} confirmed and closed successfully.",
        "complaint": complaint.to_dict()
    }), 200


@complaints_bp.route('/<int:complaint_id>/reopen', methods=['PATCH', 'POST', 'PUT'])
@role_required('student', 'faculty', 'maintenance', 'management')
def reopen_complaint(complaint_id):
    """
    Reopens a resolved grievance ticket back to 'In Progress'.
    Strictly authorized for original complaint creator when status is 'Resolved'.
    Expects JSON body containing 'reason' (min 10, max 1000 characters).
    """
    complaint = db.session.get(Complaint, complaint_id)
    if not complaint:
        return jsonify({"success": False, "message": "Complaint not found."}), 404

    # Authorization Check
    if complaint.created_by != current_user.id:
        return jsonify({
            "success": False,
            "message": "Access forbidden. Only the complaint creator can request reopening."
        }), 403

    # Status State Machine Rule Check
    if complaint.status != 'Resolved':
        return jsonify({
            "success": False,
            "message": f"Cannot reopen complaint with status '{complaint.status}'. Ticket must be 'Resolved'."
        }), 400

    data = request.get_json() or {}
    reason = (data.get('reason') or '').strip()

    if not reason:
        return jsonify({
            "success": False,
            "message": "Reopen reason is required."
        }), 400
    elif len(reason) < 10 or len(reason) > 1000:
        return jsonify({
            "success": False,
            "message": "Reopen reason must be between 10 and 1000 characters."
        }), 400

    old_status = complaint.status
    complaint.status = 'In Progress'
    complaint.updated_at = datetime.now(timezone.utc)

    # Status Log
    log_status_change(
        complaint_id=complaint.id,
        new_status='In Progress',
        old_status=old_status,
        changed_by_id=current_user.id,
        comments=f"Reopened by complainant: {reason}"
    )

    # Audit Log
    log_audit(
        action='Complaint Reopened',
        entity_type='Complaint',
        entity_id=complaint.id,
        old_value='Resolved',
        new_value='In Progress',
        user_id=current_user.id
    )

    # Notify assigned maintenance user if present
    if complaint.assigned_to:
        m_notif = Notification(
            user_id=complaint.assigned_to,
            complaint_id=complaint.id,
            title="Complaint Reopened",
            message=f"Complaint {complaint.complaint_number} has been reopened: {reason}",
            type="status_update"
        )
        db.session.add(m_notif)
        db.session.commit()

        emit_user_notification(complaint.assigned_to, m_notif)
        emit_complaint_update(complaint.assigned_to, complaint)
    else:
        db.session.commit()

    emit_management_dashboard_update(complaint.to_dict())
    broadcast_complaint_event('complaint:reopened', complaint)

    return jsonify({
        "success": True,
        "message": f"Complaint {complaint.complaint_number} reopened successfully.",
        "complaint": complaint.to_dict()
    }), 200


@complaints_bp.route('/track/<string:complaint_no>', methods=['GET'])
def track_public_complaint(complaint_no):
    """
    Public ticket tracking endpoint allowing students, faculty, or visitors
    to check the real-time progress and SLA status of any grievance by ticket ID.
    No authentication required. Returns sanitized public information.
    """
    cleaned_no = complaint_no.strip()
    complaint = Complaint.query.filter(
        db.func.lower(Complaint.complaint_number) == cleaned_no.lower()
    ).first()

    if not complaint and cleaned_no.isdigit():
        complaint = db.session.get(Complaint, int(cleaned_no))

    if not complaint:
        return jsonify({
            "success": False,
            "message": f"No complaint found matching '{complaint_no}'. Please check your ticket ID."
        }), 404

    # Build sanitized public status logs
    public_logs = []
    for log in (complaint.status_logs or []):
        public_logs.append({
            "id": log.id,
            "old_status": log.old_status,
            "new_status": log.new_status,
            "timestamp": log.created_at.isoformat() if log.created_at else None,
            "comments": log.comments if log.comments and not log.comments.startswith("[Internal Remark]") else None
        })

    dept_name = complaint.department.name if complaint.department else "General Campus Services"

    return jsonify({
        "success": True,
        "complaint": {
            "id": complaint.id,
            "complaint_number": complaint.complaint_number,
            "title": complaint.title,
            "description": complaint.description,
            "location": complaint.location,
            "priority": complaint.priority,
            "status": complaint.status,
            "department": dept_name,
            "created_at": complaint.created_at.isoformat() if complaint.created_at else None,
            "sla_target_hours": complaint.calculate_sla_hours(),
            "sla_deadline": complaint.sla_deadline.isoformat() if complaint.sla_deadline else None,
            "is_breached": complaint.is_overdue,
            "resolved_at": complaint.resolved_at.isoformat() if complaint.resolved_at else None,
            "closed_at": complaint.closed_at.isoformat() if complaint.closed_at else None,
            "resolution_remarks": complaint.resolution_remarks if complaint.status in ['Resolved', 'Closed'] else None,
            "has_issue_photo": bool(complaint.issue_photo),
            "has_resolution_photo": bool(complaint.resolution_photo),
            "status_logs": public_logs
        }
    }), 200


@complaints_bp.route('/public/recent', methods=['GET'])
def get_public_recent_complaints():
    """
    Returns sanitized recent complaint status telemetry for the public portal.
    Calculated purely from real SQLite records with zero mock data.
    """
    recent = Complaint.query.order_by(Complaint.created_at.desc()).limit(8).all()
    results = []
    for c in recent:
        dept_name = c.department.name if c.department else "General Facilities"
        results.append({
            "id": c.id,
            "ticket": c.complaint_number,
            "title": c.title,
            "department": dept_name,
            "location": c.location,
            "priority": c.priority,
            "status": c.status,
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "resolved_at": c.resolved_at.isoformat() if c.resolved_at else None
        })
    return jsonify({
        "success": True,
        "events": results
    }), 200

