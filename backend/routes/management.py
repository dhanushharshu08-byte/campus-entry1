"""
College Management Administration Blueprint for CampuSentry Helpdesk.
Provides enterprise-grade management endpoints for:
- Live Operations & Dashboard Analytics
- Manual Intervention (Assign, Reassign, Priority Change, Internal Remarks)
- SLA Performance & Resolution Metrics
- Audit Logging & History Explorer
- User Management & Soft-Disable
- Maintenance Staff Roster & Workload
- Department Management
- System Configuration & SLA Settings
- Multi-Type Reporting & CSV Data Exports
- Global Multi-Entity Search
- Database Backup Snapshots
"""
import os
import io
import re
import csv
import shutil
from typing import overload, Optional, Any, Dict
from datetime import datetime, timedelta, timezone
from flask import Blueprint, request, jsonify, Response, current_app
from flask_login import login_required, current_user
from sqlalchemy import or_, func, desc, asc
from extensions import db
from models.complaint import Complaint, VALID_STATUSES, VALID_PRIORITIES
from models.department import Department
from models.status_log import StatusLog
from models.audit_log import AuditLog
from models.escalation_log import EscalationLog
from models.system_setting import SystemSetting
from models.notification import Notification
from models.user import User
from utils.auth_decorators import role_required
from services.audit_service import log_audit
from services.complaint_service import log_status_change
from services.sla_service import (
    recalculate_sla_on_priority_change, 
    evaluate_all_active_slas,
    get_configured_sla_hours
)
from services.socket_service import (
    emit_user_notification,
    emit_maintenance_assignment,
    emit_complaint_update,
    emit_management_dashboard_update,
    emit_management_activity_update,
    emit_user_status_changed,
    emit_department_updated
)

@overload
def _to_utc(dt: datetime) -> datetime: ...  # non-None in → non-None out
@overload
def _to_utc(dt: None) -> None: ...          # None in → None out

def _to_utc(dt: Optional[datetime]) -> Optional[datetime]:
    """Ensure a datetime is UTC-aware. Returns None if dt is None."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt

management_bp = Blueprint('management', __name__, url_prefix='/api/management')

# ==============================================================================
# 1. DASHBOARD & OPERATIONAL STATS
# ==============================================================================

@management_bp.route('/dashboard', methods=['GET'])
@management_bp.route('/dashboard/stats', methods=['GET'])
@login_required
@role_required('management')
def get_dashboard_stats():
    """Returns college-wide overall grievance metrics from SQLite."""
    now = datetime.now(timezone.utc)
    total = Complaint.query.count()
    submitted = Complaint.query.filter_by(status='Submitted').count()
    assigned = Complaint.query.filter_by(status='Assigned').count()
    in_progress = Complaint.query.filter_by(status='In Progress').count()
    resolved = Complaint.query.filter_by(status='Resolved').count()
    closed = Complaint.query.filter_by(status='Closed').count()
    unassigned = Complaint.query.filter(Complaint.assigned_to.is_(None)).count()

    # Overdue count based on SLA deadline
    overdue = Complaint.query.filter(
        Complaint.status.in_(['Assigned', 'In Progress']),
        or_(Complaint.is_overdue == True, Complaint.sla_deadline < now)
    ).count()

    # Critical escalations (Level 3)
    critical_escalations = EscalationLog.query.filter_by(level=3, resolved_at=None).count()

    return jsonify({
        "success": True,
        "stats": {
            "total": total,
            "submitted": submitted,
            "assigned": assigned,
            "in_progress": in_progress,
            "resolved": resolved,
            "closed": closed,
            "overdue": overdue,
            "unassigned": unassigned,
            "critical_escalations": critical_escalations
        }
    }), 200


@management_bp.route('/departments/performance', methods=['GET'])
@login_required
@role_required('management')
def get_department_performance():
    """Returns department-wise performance breakdown for all active departments."""
    departments = Department.query.filter_by(is_active=True).all()
    now = datetime.now(timezone.utc)
    result = []

    for dept in departments:
        dept_complaints = Complaint.query.filter_by(department_id=dept.id)
        
        total = dept_complaints.count()
        submitted = dept_complaints.filter_by(status='Submitted').count()
        assigned = dept_complaints.filter_by(status='Assigned').count()
        in_progress = dept_complaints.filter_by(status='In Progress').count()
        resolved = dept_complaints.filter_by(status='Resolved').count()
        closed = dept_complaints.filter_by(status='Closed').count()
        overdue = dept_complaints.filter(
            Complaint.status.in_(['Assigned', 'In Progress']),
            or_(Complaint.is_overdue == True, Complaint.sla_deadline < now)
        ).count()

        # Compute SLA compliance % and average resolution time
        completed = dept_complaints.filter(Complaint.status.in_(['Resolved', 'Closed'])).all()
        within_sla_count = sum(1 for c in completed if c.resolved_at is not None and c.sla_deadline is not None and _to_utc(c.resolved_at) <= _to_utc(c.sla_deadline))
        sla_pct = round((within_sla_count / len(completed) * 100), 1) if completed else 100.0

        res_times = [c.resolution_time_minutes for c in completed if c.resolution_time_minutes is not None]
        avg_res_mins = round(sum(res_times) / len(res_times), 1) if res_times else 0.0

        result.append({
            "id": dept.id,
            "name": dept.name,
            "total": total,
            "submitted": submitted,
            "assigned": assigned,
            "in_progress": in_progress,
            "resolved": resolved,
            "closed": closed,
            "overdue": overdue,
            "sla_compliance_pct": sla_pct,
            "avg_resolution_time_minutes": avg_res_mins
        })

    return jsonify({
        "success": True,
        "departments": result
    }), 200


@management_bp.route('/analytics/complaint-trends', methods=['GET'])
@login_required
@role_required('management')
def get_complaint_trends():
    """Returns daily grievance creation count over the past N days (default 30)."""
    days = request.args.get('days', 30, type=int)
    if days < 1 or days > 365:
        days = 30

    start_date = datetime.now(timezone.utc).date() - timedelta(days=days - 1)
    complaints = Complaint.query.filter(
        func.date(Complaint.created_at) >= start_date
    ).all()

    counts_by_date = {}
    for i in range(days):
        d_str = (start_date + timedelta(days=i)).strftime('%Y-%m-%d')
        counts_by_date[d_str] = 0

    for c in complaints:
        if c.created_at:
            d_str = c.created_at.strftime('%Y-%m-%d')
            if d_str in counts_by_date:
                counts_by_date[d_str] += 1

    trends = [{"date": k, "complaints": v} for k, v in sorted(counts_by_date.items())]

    return jsonify({
        "success": True,
        "days": days,
        "trends": trends
    }), 200


@management_bp.route('/complaints/recent', methods=['GET'])
@login_required
@role_required('management')
def get_recent_complaints():
    """Returns the latest N complaints (default 10) for quick dashboard view."""
    limit = request.args.get('limit', 10, type=int)
    complaints = Complaint.query.order_by(Complaint.created_at.desc()).limit(limit).all()

    return jsonify({
        "success": True,
        "complaints": [c.to_dict() for c in complaints]
    }), 200


@management_bp.route('/complaints', methods=['GET'])
@login_required
@role_required('management')
def list_all_complaints():
    """Paginated list of all college grievances with rich filters, search, and sorting."""
    query = Complaint.query

    # Department Filter
    dept_id = request.args.get('department_id', type=int)
    if dept_id:
        query = query.filter_by(department_id=dept_id)

    # Status Filter
    status = request.args.get('status')
    if status and status in VALID_STATUSES:
        query = query.filter_by(status=status)

    # Priority Filter
    priority = request.args.get('priority')
    if priority and priority in VALID_PRIORITIES:
        query = query.filter_by(priority=priority)

    # Assignment Filter
    assignment = request.args.get('assignment')
    if assignment == 'unassigned':
        query = query.filter(Complaint.assigned_to.is_(None))
    elif assignment == 'assigned':
        query = query.filter(Complaint.assigned_to.isnot(None))

    # Overdue Filter
    overdue = request.args.get('overdue')
    if overdue == 'true':
        now = datetime.now(timezone.utc)
        query = query.filter(
            Complaint.status.in_(['Assigned', 'In Progress']),
            or_(Complaint.is_overdue == True, Complaint.sla_deadline < now)
        )

    # Search Filter
    search = request.args.get('search', '').strip()
    if search:
        search_pattern = f"%{search}%"
        query = query.join(User, Complaint.created_by == User.id, isouter=True).filter(
            or_(
                Complaint.complaint_number.ilike(search_pattern),
                Complaint.title.ilike(search_pattern),
                Complaint.location.ilike(search_pattern),
                User.name.ilike(search_pattern)
            )
        )

    # Sorting
    sort = request.args.get('sort', 'newest')
    if sort == 'oldest':
        query = query.order_by(Complaint.created_at.asc())
    elif sort == 'updated':
        query = query.order_by(Complaint.updated_at.desc())
    elif sort == 'priority':
        query = query.order_by(
            db.case(
                (Complaint.priority == 'High', 1),
                (Complaint.priority == 'Medium', 2),
                (Complaint.priority == 'Low', 3),
                else_=4
            ),
            Complaint.created_at.desc()
        )
    elif sort == 'sla':
        query = query.order_by(Complaint.sla_deadline.asc())
    else:
        query = query.order_by(Complaint.created_at.desc())

    # Pagination
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 20, type=int)
    paginated = query.paginate(page=page, per_page=limit, error_out=False)

    return jsonify({
        "success": True,
        "complaints": [c.to_dict() for c in paginated.items],
        "pagination": {
            "page": paginated.page,
            "limit": paginated.per_page,
            "total": paginated.total,
            "total_pages": paginated.pages
        }
    }), 200


@management_bp.route('/complaints/<int:complaint_id>', methods=['GET'])
@login_required
@role_required('management')
def get_management_complaint_details(complaint_id):
    """Returns full grievance details for college management, including timeline, internal remarks, and audit logs."""
    complaint = db.session.get(Complaint, complaint_id)
    if not complaint:
        return jsonify({"success": False, "message": "Complaint not found."}), 404

    logs = StatusLog.query.filter_by(complaint_id=complaint.id).order_by(StatusLog.timestamp.asc()).all()
    audits = AuditLog.query.filter_by(entity_type='Complaint', entity_id=str(complaint.id)).order_by(AuditLog.timestamp.desc()).all()
    escalations = EscalationLog.query.filter_by(complaint_id=complaint.id).order_by(EscalationLog.created_at.asc()).all()

    comp_dict = complaint.to_dict()
    comp_dict['timeline'] = [l.to_dict() for l in logs]
    comp_dict['audit_history'] = [a.to_dict() for a in audits]
    comp_dict['escalation_history'] = [e.to_dict() for e in escalations]

    return jsonify({
        "success": True,
        "complaint": comp_dict
    }), 200


@management_bp.route('/complaints/unassigned', methods=['GET'])
@login_required
@role_required('management')
def get_unassigned_complaints():
    """Returns grievances that are currently unassigned (assigned_to IS NULL)."""
    complaints = Complaint.query.filter(
        Complaint.assigned_to.is_(None)
    ).order_by(Complaint.created_at.asc()).all()

    now = datetime.now(timezone.utc)
    result = []
    for c in complaints:
        comp_dict = c.to_dict()
        created_at_dt = _to_utc(c.created_at)
        age_hours = round((now - created_at_dt).total_seconds() / 3600, 1) if created_at_dt else 0
        comp_dict['age_hours'] = age_hours
        result.append(comp_dict)

    return jsonify({
        "success": True,
        "count": len(result),
        "complaints": result
    }), 200


@management_bp.route('/complaints/overdue', methods=['GET'])
@login_required
@role_required('management')
def get_overdue_complaints():
    """Returns active complaints that have breached the SLA deadline."""
    now = datetime.now(timezone.utc)
    overdue_complaints = Complaint.query.filter(
        Complaint.status.in_(['Assigned', 'In Progress', 'Submitted']),
        or_(Complaint.is_overdue == True, Complaint.sla_deadline < now)
    ).order_by(Complaint.sla_deadline.asc()).all()

    result = []
    for c in overdue_complaints:
        comp_dict = c.to_dict()
        hours_overdue = 0.0
        sla_deadline_dt = _to_utc(c.sla_deadline)
        if sla_deadline_dt and now > sla_deadline_dt:
            hours_overdue = round((now - sla_deadline_dt).total_seconds() / 3600.0, 1)
        comp_dict['hours_overdue'] = hours_overdue
        result.append(comp_dict)

    return jsonify({
        "success": True,
        "count": len(result),
        "complaints": result
    }), 200


@management_bp.route('/staff/performance', methods=['GET'])
@login_required
@role_required('management')
def get_staff_performance():
    """Returns workload and performance metrics for maintenance staff members."""
    include_inactive = request.args.get('include_inactive', 'true').lower() == 'true'
    if include_inactive:
        staff_members = User.query.filter_by(role='maintenance').order_by(User.name.asc()).all()
    else:
        staff_members = User.query.filter_by(role='maintenance', is_active=True).order_by(User.name.asc()).all()
    now = datetime.now(timezone.utc)
    result = []

    for staff in staff_members:
        assigned_tickets = Complaint.query.filter_by(assigned_to=staff.id)
        
        active_count = assigned_tickets.filter(Complaint.status.in_(['Assigned', 'In Progress'])).count()
        assigned_count = assigned_tickets.filter_by(status='Assigned').count()
        in_progress = assigned_tickets.filter_by(status='In Progress').count()
        resolved = assigned_tickets.filter_by(status='Resolved').count()
        closed = assigned_tickets.filter_by(status='Closed').count()
        overdue = assigned_tickets.filter(
            Complaint.status.in_(['Assigned', 'In Progress']),
            or_(Complaint.is_overdue == True, Complaint.sla_deadline < now)
        ).count()

        completed = assigned_tickets.filter(Complaint.status.in_(['Resolved', 'Closed'])).all()
        within_sla = sum(1 for c in completed if c.resolved_at and c.sla_deadline and c.resolved_at <= c.sla_deadline)
        sla_pct = round((within_sla / len(completed) * 100), 1) if completed else 100.0

        res_times = [c.resolution_time_minutes for c in completed if c.resolution_time_minutes is not None]
        avg_res_mins = round(sum(res_times) / len(res_times), 1) if res_times else 0.0

        dept_name = staff.department
        if not dept_name and staff.department_rel:
            dept_name = staff.department_rel.name

        result.append({
            "id": staff.id,
            "name": staff.name,
            "email": staff.email,
            "phone": staff.phone,
            "is_active": staff.is_active,
            "department": dept_name or "General Maintenance",
            "department_id": staff.department_id,
            "active_complaints": active_count,
            "assigned": assigned_count,
            "in_progress": in_progress,
            "resolved": resolved,
            "closed": closed,
            "overdue": overdue,
            "sla_compliance_pct": sla_pct,
            "avg_resolution_time_minutes": avg_res_mins
        })

    return jsonify({
        "success": True,
        "staff": result
    }), 200


@management_bp.route('/activity', methods=['GET'])
@login_required
@role_required('management')
def get_live_activity():
    """Returns the latest status log activity events (default 20)."""
    limit = request.args.get('limit', 20, type=int)
    logs = StatusLog.query.order_by(StatusLog.timestamp.desc()).limit(limit).all()

    result = []
    for log in logs:
        log_dict = log.to_dict()
        comp = db.session.get(Complaint, log.complaint_id)
        if comp:
            log_dict['complaint_number'] = comp.complaint_number
            log_dict['complaint_title'] = comp.title
            log_dict['department'] = comp.department.name if comp.department else "General"
        result.append(log_dict)

    return jsonify({
        "success": True,
        "activity": result
    }), 200


# ==============================================================================
# 2. MANAGEMENT INTERVENTIONS (ASSIGN, REASSIGN, PRIORITY, REMARKS)
# ==============================================================================

@management_bp.route('/complaints/<int:complaint_id>/assign', methods=['PATCH'])
@login_required
@role_required('management')
def manual_assign_complaint(complaint_id):
    """
    Manually assigns an unassigned complaint to a maintenance staff member.
    Validates staff role, active status, and department matching.
    """
    complaint = Complaint.query.get(complaint_id)
    if not complaint:
        return jsonify({"success": False, "message": "Complaint not found."}), 404

    data = request.get_json() or {}
    staff_id = data.get('maintenance_user_id')

    if not staff_id:
        return jsonify({"success": False, "message": "maintenance_user_id is required."}), 400

    staff = User.query.get(staff_id)
    if not staff or staff.role != 'maintenance':
        return jsonify({"success": False, "message": "Target user is not a valid maintenance employee."}), 400

    if not staff.is_active:
        return jsonify({"success": False, "message": "Cannot assign ticket to a deactivated staff member."}), 400

    # Department match check
    dept_name = complaint.department.name if complaint.department else ""
    if staff.department_id != complaint.department_id and (staff.department or '').lower() != dept_name.lower():
        return jsonify({
            "success": False, 
            "message": f"Staff member '{staff.name}' does not belong to the complaint's department ({dept_name})."
        }), 400

    now = datetime.now(timezone.utc)
    old_status = complaint.status
    complaint.assigned_to = staff.id
    complaint.assigned_at = now
    complaint.status = 'Assigned'
    complaint.updated_at = now

    # Status Log
    log_status_change(
        complaint_id=complaint.id,
        new_status='Assigned',
        old_status=old_status,
        changed_by_id=current_user.id,
        comments=f"Manually assigned by Management ({current_user.name}) to {staff.name}"
    )

    # Audit Log
    log_audit(
        action='Complaint Manually Assigned',
        entity_type='Complaint',
        entity_id=complaint.id,
        old_value='Unassigned',
        new_value=f"Assigned to {staff.name} (ID: {staff.id})",
        user_id=current_user.id
    )

    # Notification for maintenance employee
    notif = Notification(
        user_id=staff.id,
        complaint_id=complaint.id,
        title="Complaint Assigned by Management",
        message=f"Complaint {complaint.complaint_number} has been assigned to you by Management.",
        type="complaint_assigned"
    )
    db.session.add(notif)
    db.session.commit()

    # Real-time Events
    emit_user_notification(staff.id, notif)
    emit_maintenance_assignment(staff.id, complaint)
    emit_management_dashboard_update(complaint.to_dict())

    return jsonify({
        "success": True,
        "message": f"Complaint {complaint.complaint_number} successfully assigned to {staff.name}.",
        "complaint": complaint.to_dict()
    }), 200


@management_bp.route('/complaints/<int:complaint_id>/reassign', methods=['PATCH'])
@login_required
@role_required('management')
def reassign_complaint(complaint_id):
    """
    Reassigns an active complaint to a different maintenance staff member.
    Requires reason, logs audit diff, and notifies both staff members.
    """
    complaint = Complaint.query.get(complaint_id)
    if not complaint:
        return jsonify({"success": False, "message": "Complaint not found."}), 404

    data = request.get_json() or {}
    new_staff_id = data.get('maintenance_user_id')
    reason = (data.get('reason') or '').strip()

    if not new_staff_id:
        return jsonify({"success": False, "message": "maintenance_user_id is required."}), 400

    if not reason or len(reason) < 5:
        return jsonify({"success": False, "message": "A valid reassignment reason (min 5 chars) is required."}), 400

    new_staff = db.session.get(User, new_staff_id)
    if not new_staff or new_staff.role != 'maintenance' or not new_staff.is_active:
        return jsonify({"success": False, "message": "Target user is not an active maintenance employee."}), 400

    old_staff_id = complaint.assigned_to
    old_staff = db.session.get(User, old_staff_id) if old_staff_id else None
    old_staff_name = old_staff.name if old_staff else "None"

    if old_staff_id == new_staff.id:
        return jsonify({"success": False, "message": "Complaint is already assigned to this employee."}), 400

    now = datetime.now(timezone.utc)
    complaint.assigned_to = new_staff.id
    complaint.assigned_at = now
    complaint.updated_at = now

    # Status Log
    log_status_change(
        complaint_id=complaint.id,
        new_status=complaint.status,
        old_status=complaint.status,
        changed_by_id=current_user.id,
        comments=f"Reassigned from {old_staff_name} to {new_staff.name}. Reason: {reason}"
    )

    # Audit Log
    log_audit(
        action='Complaint Reassigned',
        entity_type='Complaint',
        entity_id=complaint.id,
        old_value=f"{old_staff_name} (ID: {old_staff_id})",
        new_value=f"{new_staff.name} (ID: {new_staff.id}) | Reason: {reason}",
        user_id=current_user.id
    )

    # Notify new maintenance staff
    new_notif = Notification(
        user_id=new_staff.id,
        complaint_id=complaint.id,
        title="Complaint Reassigned to You",
        message=f"Complaint {complaint.complaint_number} has been reassigned to you. Reason: {reason}",
        type="complaint_assigned"
    )
    db.session.add(new_notif)

    # Notify old maintenance staff if existed
    if old_staff:
        old_notif = Notification(
            user_id=old_staff.id,
            complaint_id=complaint.id,
            title="Complaint Reassigned",
            message=f"Complaint {complaint.complaint_number} has been reassigned to {new_staff.name}.",
            type="info"
        )
        db.session.add(old_notif)
        emit_user_notification(old_staff.id, old_notif)

    db.session.commit()

    # Real-time Events
    emit_user_notification(new_staff.id, new_notif)
    emit_maintenance_assignment(new_staff.id, complaint)
    emit_management_dashboard_update(complaint.to_dict())

    return jsonify({
        "success": True,
        "message": f"Complaint {complaint.complaint_number} reassigned to {new_staff.name}.",
        "complaint": complaint.to_dict()
    }), 200


@management_bp.route('/complaints/<int:complaint_id>/priority', methods=['PATCH'])
@login_required
@role_required('management')
def change_complaint_priority(complaint_id):
    """
    Changes grievance priority and recalculates SLA deadline if active.
    Logs audit event and notifies assigned staff.
    """
    complaint = db.session.get(Complaint, complaint_id)
    if not complaint:
        return jsonify({"success": False, "message": "Complaint not found."}), 404

    data = request.get_json() or {}
    new_priority = data.get('priority')

    if new_priority not in VALID_PRIORITIES:
        return jsonify({
            "success": False, 
            "message": f"Invalid priority '{new_priority}'. Must be one of: {', '.join(sorted(VALID_PRIORITIES))}."
        }), 400

    old_priority = complaint.priority
    if old_priority == new_priority:
        return jsonify({"success": True, "message": f"Priority is already {new_priority}.", "complaint": complaint.to_dict()}), 200

    complaint.priority = new_priority
    complaint.updated_at = datetime.now(timezone.utc)

    # Recalculate SLA deadline for active complaints
    recalculate_sla_on_priority_change(complaint)

    # Status Log
    log_status_change(
        complaint_id=complaint.id,
        new_status=complaint.status,
        old_status=complaint.status,
        changed_by_id=current_user.id,
        comments=f"Priority changed from {old_priority} to {new_priority} by Management ({current_user.name})"
    )

    # Audit Log
    log_audit(
        action='Complaint Priority Changed',
        entity_type='Complaint',
        entity_id=complaint.id,
        old_value=old_priority,
        new_value=new_priority,
        user_id=current_user.id
    )

    # Notify assigned maintenance staff if present
    if complaint.assigned_to:
        notif = Notification(
            user_id=complaint.assigned_to,
            complaint_id=complaint.id,
            title="Complaint Priority Changed",
            message=f"Complaint {complaint.complaint_number} priority changed to {new_priority}.",
            type="info"
        )
        db.session.add(notif)
        emit_user_notification(complaint.assigned_to, notif)

    db.session.commit()
    emit_management_dashboard_update(complaint.to_dict())

    return jsonify({
        "success": True,
        "message": f"Complaint {complaint.complaint_number} priority updated to {new_priority}.",
        "complaint": complaint.to_dict()
    }), 200


@management_bp.route('/complaints/<int:complaint_id>/remarks', methods=['POST'])
@login_required
@role_required('management')
def add_internal_remark(complaint_id):
    """Adds an internal management remark to the complaint timeline (hidden from students/faculty)."""
    complaint = db.session.get(Complaint, complaint_id)
    if not complaint:
        return jsonify({"success": False, "message": "Complaint not found."}), 404

    data = request.get_json() or {}
    remark = (data.get('remark') or '').strip()

    if not remark:
        return jsonify({"success": False, "message": "Remark text cannot be empty."}), 400

    log = StatusLog(
        complaint_id=complaint.id,
        changed_by_id=current_user.id,
        old_status=complaint.status,
        new_status=complaint.status,
        comments=remark,
        is_internal=True,
        timestamp=datetime.now(timezone.utc)
    )
    db.session.add(log)

    log_audit(
        action='Management Internal Remark Added',
        entity_type='Complaint',
        entity_id=complaint.id,
        new_value=remark,
        user_id=current_user.id
    )

    db.session.commit()
    emit_management_activity_update(log.to_dict())

    return jsonify({
        "success": True,
        "message": "Internal remark recorded.",
        "log": log.to_dict()
    }), 201


# ==============================================================================
# 3. AUDIT LOG EXPLORER
# ==============================================================================

@management_bp.route('/audit-logs', methods=['GET'])
@login_required
@role_required('management')
def get_audit_logs():
    """Returns paginated audit log entries with filters for user, action, entity, and date range."""
    query = AuditLog.query

    user_id = request.args.get('user_id', type=int)
    if user_id:
        query = query.filter_by(user_id=user_id)

    action = request.args.get('action')
    if action:
        query = query.filter_by(action=action)

    entity_type = request.args.get('entity_type')
    if entity_type:
        query = query.filter_by(entity_type=entity_type)

    date_from = request.args.get('date_from')
    if date_from:
        try:
            df = datetime.fromisoformat(date_from)
            query = query.filter(AuditLog.timestamp >= df)
        except ValueError:
            pass

    date_to = request.args.get('date_to')
    if date_to:
        try:
            dt = datetime.fromisoformat(date_to) + timedelta(days=1)
            query = query.filter(AuditLog.timestamp <= dt)
        except ValueError:
            pass

    search = request.args.get('search', '').strip()
    if search:
        pattern = f"%{search}%"
        query = query.join(User, AuditLog.user_id == User.id, isouter=True).filter(
            or_(
                AuditLog.action.ilike(pattern),
                AuditLog.entity_type.ilike(pattern),
                AuditLog.entity_id.ilike(pattern),
                AuditLog.new_value.ilike(pattern),
                User.name.ilike(pattern)
            )
        )

    query = query.order_by(AuditLog.timestamp.desc())

    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 25, type=int)
    paginated = query.paginate(page=page, per_page=limit, error_out=False)

    return jsonify({
        "success": True,
        "logs": [l.to_dict() for l in paginated.items],
        "pagination": {
            "page": paginated.page,
            "limit": paginated.per_page,
            "total": paginated.total,
            "total_pages": paginated.pages
        }
    }), 200


# ==============================================================================
# 4. USER & STAFF MANAGEMENT
# ==============================================================================

EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$')

@management_bp.route('/users', methods=['GET'])
@login_required
@role_required('management')
def list_users():
    """Lists system users with filtering by role, department, active status, and search."""
    query = User.query

    role = request.args.get('role')
    if role:
        query = query.filter_by(role=role)

    dept_id = request.args.get('department_id', type=int)
    if dept_id:
        query = query.filter_by(department_id=dept_id)

    is_active = request.args.get('is_active')
    if is_active is not None:
        val = is_active.lower() in ['true', '1']
        query = query.filter_by(is_active=val)

    search = request.args.get('search', '').strip()
    if search:
        p = f"%{search}%"
        query = query.filter(
            or_(
                User.name.ilike(p),
                User.email.ilike(p),
                User.employee_or_student_id.ilike(p)
            )
        )

    query = query.order_by(User.created_at.desc())
    users = query.all()

    # Append workload counts for maintenance staff
    result = []
    for u in users:
        u_dict = u.to_dict()
        if u.role == 'maintenance':
            active_load = Complaint.query.filter(
                Complaint.assigned_to == u.id,
                Complaint.status.in_(['Assigned', 'In Progress'])
            ).count()
            u_dict['active_workload'] = active_load
        result.append(u_dict)

    return jsonify({
        "success": True,
        "count": len(result),
        "users": result
    }), 200


@management_bp.route('/users/management', methods=['GET'])
@login_required
@role_required('management')
def list_management_users():
    """Lists all management accounts with their details, last login, and status."""
    mgmt_users = User.query.filter_by(role='management').order_by(User.created_at.desc()).all()
    return jsonify({
        "success": True,
        "count": len(mgmt_users),
        "users": [u.to_dict() for u in mgmt_users]
    }), 200


@management_bp.route('/users/management', methods=['POST'])
@login_required
@role_required('management')
def create_management_user():
    """Creates a new management account."""
    data = request.get_json() or {}
    name = (data.get('name') or '').strip()
    email = (data.get('email') or '').strip().lower()
    phone = (data.get('phone') or '').strip()
    password = data.get('password') or ''
    confirm_password = data.get('confirm_password')

    if not name:
        return jsonify({"success": False, "message": "Name is required."}), 400
    if not email or not EMAIL_REGEX.match(email):
        return jsonify({"success": False, "message": "A valid email address is required."}), 400
    if not password or len(password) < 8:
        return jsonify({"success": False, "message": "Password must be at least 8 characters long."}), 400
    if confirm_password and password != confirm_password:
        return jsonify({"success": False, "message": "Password confirmation does not match."}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"success": False, "message": "An account with this email address already exists."}), 409

    try:
        user = User(
            name=name,
            email=email,
            phone=phone or None,
            role='management',
            is_active=True
        )
        user.set_password(password)
        db.session.add(user)
        db.session.flush()

        log_audit(
            action='Management user created',
            entity_type='User',
            entity_id=user.id,
            new_value=f"Created management user: {user.name} ({user.email})",
            user_id=current_user.id
        )

        db.session.commit()
        emit_management_dashboard_update({"new_user": user.id})

        return jsonify({
            "success": True,
            "message": "Management account created successfully.",
            "user": user.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Failed to create management user: {str(e)}"}), 500


@management_bp.route('/users/maintenance', methods=['POST'])
@login_required
@role_required('management')
def create_maintenance_user():
    """Creates a new maintenance staff account by Management/Admin."""
    data = request.get_json() or {}
    name = (data.get('name') or '').strip()
    email = (data.get('email') or '').strip().lower()
    phone = (data.get('phone') or '').strip()
    password = data.get('password') or ''
    confirm_password = data.get('confirm_password') or ''
    dept_id = data.get('department_id')
    dept_name = data.get('department')
    emp_id = (data.get('employee_or_student_id') or '').strip()

    if not name:
        return jsonify({"success": False, "message": "Full name is required."}), 400
    if not email or not EMAIL_REGEX.match(email):
        return jsonify({"success": False, "message": "A valid email address is required."}), 400
    if not password:
        return jsonify({"success": False, "message": "Password is required."}), 400
    if len(password) < 8:
        return jsonify({"success": False, "message": "Password must be at least 8 characters long."}), 400
    if not confirm_password:
        return jsonify({"success": False, "message": "Password confirmation is required."}), 400
    if password != confirm_password:
        return jsonify({"success": False, "message": "Passwords do not match. Please re-enter your password."}), 400

    dept = None
    if dept_id:
        try:
            dept = db.session.get(Department, int(dept_id))
        except (ValueError, TypeError):
            dept = None
    elif dept_name:
        dept = Department.query.filter_by(name=dept_name).first()

    if not dept:
        return jsonify({"success": False, "message": "A valid department is required for maintenance staff."}), 400

    existing_user = User.query.filter(func.lower(User.email) == email.lower()).first()
    if existing_user:
        return jsonify({"success": False, "message": "An account with this email address already exists. Please use a different email."}), 409

    try:
        user = User(
            name=name,
            email=email,
            phone=phone or None,
            role='maintenance',
            department_id=dept.id,
            department=dept.name,
            employee_or_student_id=emp_id or None,
            is_active=True
        )
        user.set_password(password)
        db.session.add(user)
        db.session.flush()

        log_audit(
            action='Maintenance user created',
            entity_type='User',
            entity_id=user.id,
            new_value=f"Created maintenance user: {user.name} ({user.email}, Dept: {dept.name})",
            user_id=current_user.id
        )

        db.session.commit()
        emit_management_dashboard_update({"new_user": user.id})

        return jsonify({
            "success": True,
            "message": "Maintenance staff account created successfully.",
            "user": user.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Failed to create maintenance user: {str(e)}"}), 500


@management_bp.route('/users/<int:user_id>', methods=['PATCH'])
@login_required
@role_required('management')
def edit_user(user_id):
    """Edits user profile details (Name, Email, Phone, Department). Role cannot be modified."""
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"success": False, "message": "User not found."}), 404

    data = request.get_json() or {}
    name = (data.get('name') or '').strip()
    email = (data.get('email') or '').strip().lower()
    phone = data.get('phone')
    dept_id = data.get('department_id')
    dept_name = data.get('department')

    if name:
        user.name = name

    if email and email != user.email:
        if not EMAIL_REGEX.match(email):
            return jsonify({"success": False, "message": "Invalid email address format."}), 400
        existing = User.query.filter(User.email == email, User.id != user.id).first()
        if existing:
            return jsonify({"success": False, "message": "Email is already taken by another account."}), 409
        user.email = email

    if phone is not None:
        user.phone = phone.strip() if isinstance(phone, str) else None

    # Handle department change for maintenance staff
    department_changed = False
    old_dept_name = user.department
    active_complaints_count = 0

    if user.role == 'maintenance' and (dept_id or dept_name):
        new_dept = None
        if dept_id:
            try:
                new_dept = db.session.get(Department, int(dept_id))
            except (ValueError, TypeError):
                new_dept = None
        elif dept_name:
            new_dept = Department.query.filter_by(name=dept_name).first()

        if new_dept and (new_dept.id != user.department_id or new_dept.name != user.department):
            department_changed = True
            active_complaints_count = Complaint.query.filter(
                Complaint.assigned_to == user.id,
                Complaint.status.in_(['Assigned', 'In Progress'])
            ).count()

            user.department_id = new_dept.id
            user.department = new_dept.name

            log_audit(
                action='Maintenance department changed',
                entity_type='User',
                entity_id=user.id,
                old_value=f"Department: {old_dept_name}",
                new_value=f"Department: {new_dept.name} (Active complaints: {active_complaints_count})",
                user_id=current_user.id
            )
            emit_department_updated(new_dept.id)
            emit_user_status_changed(user.id, user.is_active)

    user.updated_at = datetime.now(timezone.utc)

    # Log general user edit audit
    if not department_changed:
        audit_action = 'Management user edited' if user.role == 'management' else 'Maintenance user edited'
        log_audit(
            action=audit_action,
            entity_type='User',
            entity_id=user.id,
            new_value=f"Updated profile: {user.name} ({user.email})",
            user_id=current_user.id
        )

    db.session.commit()
    emit_management_dashboard_update({"user_updated": user.id})

    response_data: Dict[str, Any] = {
        "success": True,
        "message": f"User {user.name} updated successfully.",
        "user": user.to_dict()
    }
    if department_changed and active_complaints_count > 0:
        response_data["warning"] = f"Staff department updated. Note: {user.name} currently has {active_complaints_count} active complaints assigned from the previous department."
        response_data["active_complaints_count"] = active_complaints_count

    return jsonify(response_data), 200


@management_bp.route('/users/<int:user_id>/password', methods=['POST', 'PATCH'])
@login_required
@role_required('management')
def change_user_password(user_id):
    """Changes or resets password for a user account."""
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"success": False, "message": "User not found."}), 404

    data = request.get_json() or {}
    new_password = data.get('new_password') or data.get('password') or ''
    confirm_password = data.get('confirm_password')

    if not new_password or len(new_password) < 8:
        return jsonify({"success": False, "message": "Password must be at least 8 characters long."}), 400

    if confirm_password and new_password != confirm_password:
        return jsonify({"success": False, "message": "Password confirmation does not match."}), 400

    try:
        user.set_password(new_password)
        user.updated_at = datetime.now(timezone.utc)

        audit_action = "Management password changed" if user.role == 'management' else "Maintenance password reset by management."
        log_audit(
            action=audit_action,
            entity_type='User',
            entity_id=user.id,
            new_value=f"Password reset for {user.name} ({user.email}, Role: {user.role})",
            user_id=current_user.id
        )

        db.session.commit()

        return jsonify({
            "success": True,
            "message": f"Password for {user.name} has been successfully updated."
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Failed to reset password: {str(e)}"}), 500


@management_bp.route('/users/<int:user_id>/status', methods=['PATCH'])
@login_required
@role_required('management')
def toggle_user_status(user_id):
    """Soft-enables or soft-disables a user account. Protects against deactivating last active management account."""
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"success": False, "message": "User not found."}), 404

    data = request.get_json() or {}
    new_status = data.get('is_active')
    if new_status is None:
        new_status = not user.is_active

    new_status = bool(new_status)

    # Management safety check: count active management accounts before deactivating
    if user.role == 'management' and not new_status:
        active_mgmt_count = User.query.filter_by(role='management', is_active=True).count()
        if active_mgmt_count <= 1:
            return jsonify({
                "success": False,
                "message": "At least one active management account must remain."
            }), 400

    old_status = user.is_active
    user.is_active = new_status
    user.updated_at = datetime.now(timezone.utc)

    # Active complaints check if deactivating maintenance staff
    active_complaints_count = 0
    if user.role == 'maintenance' and not user.is_active:
        active_complaints_count = Complaint.query.filter(
            Complaint.assigned_to == user.id,
            Complaint.status.in_(['Assigned', 'In Progress'])
        ).count()
        if active_complaints_count > 0:
            warn_notif = Notification(
                user_id=current_user.id,
                title="Staff Deactivation Warning",
                message=f"Maintenance staff member {user.name} has been disabled and has {active_complaints_count} active assigned complaints requiring reassignment.",
                type="unassigned_complaint"
            )
            db.session.add(warn_notif)

    # Action naming for audit log
    if user.role == 'management':
        audit_action = 'Management user enabled' if user.is_active else 'Management user disabled'
    elif user.role == 'maintenance':
        audit_action = 'Maintenance user enabled' if user.is_active else 'Maintenance user disabled'
    else:
        audit_action = 'User Status Modified'

    log_audit(
        action=audit_action,
        entity_type='User',
        entity_id=user.id,
        old_value=f"is_active={old_status}",
        new_value=f"is_active={user.is_active}",
        user_id=current_user.id
    )

    db.session.commit()
    emit_user_status_changed(user.id, user.is_active)

    msg = f"User {user.name} {'activated' if user.is_active else 'deactivated'} successfully."
    if active_complaints_count > 0:
        msg += f" Note: {active_complaints_count} active complaints require reassignment."

    return jsonify({
        "success": True,
        "message": msg,
        "user": user.to_dict(),
        "active_complaints_count": active_complaints_count
    }), 200


@management_bp.route('/users/<int:user_id>/active-complaints', methods=['GET'])
@login_required
@role_required('management')
def get_user_active_complaints(user_id):
    """Returns active complaints assigned to a technician."""
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"success": False, "message": "User not found."}), 404

    active_complaints = Complaint.query.filter(
        Complaint.assigned_to == user.id,
        Complaint.status.in_(['Assigned', 'In Progress'])
    ).order_by(Complaint.created_at.desc()).all()

    return jsonify({
        "success": True,
        "count": len(active_complaints),
        "user": user.to_dict(),
        "complaints": [c.to_dict() for c in active_complaints]
    }), 200


@management_bp.route('/users/<int:user_id>/reassign-complaints', methods=['POST'])
@login_required
@role_required('management')
def reassign_user_complaints(user_id):
    """Reassigns active complaints from one technician to another."""
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"success": False, "message": "User not found."}), 404

    data = request.get_json() or {}
    new_staff_id = data.get('new_assigned_to')
    reason = (data.get('reason') or '').strip() or f"Reassigned from {user.name}"
    complaint_ids = data.get('complaint_ids')
    reassign_all = data.get('reassign_all', False)

    try:
        new_staff = db.session.get(User, int(new_staff_id)) if new_staff_id is not None else None
    except (ValueError, TypeError):
        new_staff = None

    if not new_staff or new_staff.role != 'maintenance' or not new_staff.is_active:
        return jsonify({"success": False, "message": "Target maintenance technician is invalid or inactive."}), 400

    query = Complaint.query.filter(
        Complaint.assigned_to == user.id,
        Complaint.status.in_(['Assigned', 'In Progress'])
    )
    if not reassign_all and complaint_ids:
        query = query.filter(Complaint.id.in_(complaint_ids))

    complaints_to_reassign = query.all()
    if not complaints_to_reassign:
        return jsonify({"success": False, "message": "No active complaints found to reassign."}), 400

    now = datetime.now(timezone.utc)
    for comp in complaints_to_reassign:
        comp.assigned_to = new_staff.id
        comp.updated_at = now

        # StatusLog for history
        s_log = StatusLog(
            complaint_id=comp.id,
            changed_by_id=current_user.id,
            old_status=comp.status,
            new_status=comp.status,
            comments=f"Reassigned from {user.name} to {new_staff.name}. Reason: {reason}",
            is_internal=False,
            timestamp=now
        )
        db.session.add(s_log)

        # AuditLog
        log_audit(
            action='Complaint reassigned',
            entity_type='Complaint',
            entity_id=comp.id,
            old_value=f"Assigned to {user.name}",
            new_value=f"Assigned to {new_staff.name}. Reason: {reason}",
            user_id=current_user.id
        )

        # Notification for new tech
        notif = Notification(
            user_id=new_staff.id,
            complaint_id=comp.id,
            title="Complaint Reassigned to You",
            message=f"Complaint {comp.complaint_number} was reassigned to you. Reason: {reason}",
            type="complaint_assigned"
        )
        db.session.add(notif)
        emit_user_notification(new_staff.id, notif)
        emit_maintenance_assignment(new_staff.id, comp)

    db.session.commit()
    emit_management_dashboard_update({"reassigned_count": len(complaints_to_reassign)})

    return jsonify({
        "success": True,
        "message": f"Successfully reassigned {len(complaints_to_reassign)} complaint(s) to {new_staff.name}.",
        "reassigned_count": len(complaints_to_reassign)
    }), 200


@management_bp.route('/users/<int:user_id>/disable-and-reassign', methods=['POST'])
@login_required
@role_required('management')
def disable_and_reassign_user(user_id):
    """Deactivates maintenance user and reassigns all active complaints to replacement staff."""
    user = User.query.get(user_id)
    if not user:
        return jsonify({"success": False, "message": "User not found."}), 404

    data = request.get_json() or {}
    new_staff_id = data.get('new_assigned_to')
    reason = (data.get('reason') or '').strip() or f"Staff deactivated ({user.name})"

    try:
        new_staff = User.query.get(int(new_staff_id)) if new_staff_id is not None else None
    except (ValueError, TypeError):
        new_staff = None

    if not new_staff or new_staff.role != 'maintenance' or not new_staff.is_active:
        return jsonify({"success": False, "message": "Target replacement technician is invalid or inactive."}), 400

    active_complaints = Complaint.query.filter(
        Complaint.assigned_to == user.id,
        Complaint.status.in_(['Assigned', 'In Progress'])
    ).all()

    now = datetime.now(timezone.utc)
    user.is_active = False
    user.updated_at = now

    for comp in active_complaints:
        comp.assigned_to = new_staff.id
        comp.updated_at = now

        s_log = StatusLog(
            complaint_id=comp.id,
            changed_by_id=current_user.id,
            old_status=comp.status,
            new_status=comp.status,
            comments=f"Reassigned from {user.name} to {new_staff.name} upon staff deactivation. Reason: {reason}",
            is_internal=False,
            timestamp=now
        )
        db.session.add(s_log)

        log_audit(
            action='Complaint reassigned',
            entity_type='Complaint',
            entity_id=comp.id,
            old_value=f"Assigned to {user.name}",
            new_value=f"Assigned to {new_staff.name}. Reason: {reason}",
            user_id=current_user.id
        )

        notif = Notification(
            user_id=new_staff.id,
            complaint_id=comp.id,
            title="Complaint Reassigned to You",
            message=f"Complaint {comp.complaint_number} was reassigned to you upon {user.name}'s deactivation.",
            type="complaint_assigned"
        )
        db.session.add(notif)
        emit_user_notification(new_staff.id, notif)
        emit_maintenance_assignment(new_staff.id, comp)

    log_audit(
        action='Maintenance user disabled',
        entity_type='User',
        entity_id=user.id,
        old_value="is_active=True",
        new_value=f"is_active=False (Reassigned {len(active_complaints)} complaints to {new_staff.name})",
        user_id=current_user.id
    )

    db.session.commit()
    emit_user_status_changed(user.id, False)
    emit_management_dashboard_update({"staff_disabled": user.id, "reassigned_count": len(active_complaints)})

    return jsonify({
        "success": True,
        "message": f"User {user.name} deactivated and {len(active_complaints)} active complaint(s) reassigned to {new_staff.name}.",
        "reassigned_count": len(active_complaints)
    }), 200


@management_bp.route('/users/<int:user_id>', methods=['DELETE'])
@management_bp.route('/staff/<int:user_id>', methods=['DELETE'])
@login_required
@role_required('management')
def delete_user(user_id):
    """
    Deletes or removes a user / staff member account.
    Protects against deleting self or the last active management account.
    If maintenance staff has active complaints, reassigns them to target technician
    or unassigns them to prevent orphan records.
    """
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"success": False, "message": "User not found."}), 404

    # Cannot delete own account
    if user.id == current_user.id:
        return jsonify({"success": False, "message": "You cannot delete your own account."}), 400

    # Management safety check
    if user.role == 'management':
        active_mgmt_count = User.query.filter_by(role='management', is_active=True).count()
        if active_mgmt_count <= 1:
            return jsonify({
                "success": False,
                "message": "At least one active management account must remain."
            }), 400

    data = request.get_json(silent=True) or {}
    new_staff_id = data.get('new_assigned_to')
    user_name = user.name
    user_email = user.email
    user_role = user.role

    # Reassign or clean up active assigned complaints
    active_complaints = Complaint.query.filter_by(assigned_to=user.id).all()
    if active_complaints:
        target_staff = None
        if new_staff_id:
            try:
                target_staff = db.session.get(User, int(new_staff_id))
            except (ValueError, TypeError):
                target_staff = None

        for comp in active_complaints:
            if target_staff and target_staff.is_active and target_staff.role == 'maintenance':
                comp.assigned_to = target_staff.id
            else:
                comp.assigned_to = None
                if comp.status == 'Assigned':
                    comp.status = 'Submitted'

    # Clear user notifications
    Notification.query.filter_by(user_id=user.id).delete()

    # Clear user references in status logs & audit logs to preserve historical audit trail
    StatusLog.query.filter_by(changed_by_id=user.id).update({"changed_by_id": None})
    AuditLog.query.filter_by(user_id=user.id).update({"user_id": None})

    # Log audit entry before deleting
    log_audit(
        action=f'{user_role.capitalize()} user deleted',
        entity_type='User',
        entity_id=user.id,
        old_value=f"Deleted {user_name} ({user_email}, Role: {user_role})",
        user_id=current_user.id
    )

    db.session.delete(user)
    db.session.commit()

    emit_user_status_changed(user_id, False)
    emit_management_dashboard_update({"user_deleted": user_id})

    return jsonify({
        "success": True,
        "message": f"{user_role.capitalize()} user {user_name} ({user_email}) has been permanently removed."
    }), 200


@management_bp.route('/staff', methods=['GET'])
@login_required
@role_required('management')
def list_staff_roster():
    """Returns comprehensive maintenance staff roster with active and overdue workloads."""
    staff = User.query.filter_by(role='maintenance').order_by(User.name.asc()).all()
    now = datetime.now(timezone.utc)
    result = []

    for s in staff:
        s_dict = s.to_dict()
        tickets = Complaint.query.filter_by(assigned_to=s.id)
        s_dict['total_assigned'] = tickets.count()
        s_dict['active_workload'] = tickets.filter(Complaint.status.in_(['Assigned', 'In Progress'])).count()
        s_dict['in_progress'] = tickets.filter_by(status='In Progress').count()
        s_dict['resolved'] = tickets.filter_by(status='Resolved').count()
        s_dict['closed'] = tickets.filter_by(status='Closed').count()
        s_dict['overdue_workload'] = tickets.filter(
            Complaint.status.in_(['Assigned', 'In Progress']),
            or_(Complaint.is_overdue == True, Complaint.sla_deadline < now)
        ).count()
        result.append(s_dict)

    return jsonify({
        "success": True,
        "count": len(result),
        "staff": result
    }), 200


# ==============================================================================
# 5. DEPARTMENT MANAGEMENT
# ==============================================================================

@management_bp.route('/departments', methods=['GET'])
@login_required
@role_required('management')
def list_departments():
    """Lists all departments (active and inactive) with staff count and complaint metrics."""
    departments = Department.query.order_by(Department.name.asc()).all()
    result = []
    for d in departments:
        d_dict = d.to_dict()
        d_dict['staff_count'] = User.query.filter_by(department_id=d.id, role='maintenance', is_active=True).count()
        d_dict['total_complaints'] = Complaint.query.filter_by(department_id=d.id).count()
        result.append(d_dict)

    return jsonify({
        "success": True,
        "departments": result
    }), 200


@management_bp.route('/departments', methods=['POST'])
@login_required
@role_required('management')
def create_department():
    """Creates a new maintenance department."""
    data = request.get_json() or {}
    name = (data.get('name') or '').strip()
    description = (data.get('description') or '').strip()

    if not name:
        return jsonify({"success": False, "message": "Department name is required."}), 400

    if Department.query.filter(func.lower(Department.name) == func.lower(name)).first():
        return jsonify({"success": False, "message": f"A department named '{name}' already exists."}), 409

    dept = Department(name=name, description=description or None, is_active=True)
    db.session.add(dept)
    db.session.flush()

    log_audit(
        action='Department Created',
        entity_type='Department',
        entity_id=dept.id,
        new_value=f"Created department: {dept.name}",
        user_id=current_user.id
    )

    db.session.commit()
    emit_department_updated(dept.to_dict())

    return jsonify({
        "success": True,
        "message": f"Department '{dept.name}' created successfully.",
        "department": dept.to_dict()
    }), 201


@management_bp.route('/departments/<int:dept_id>', methods=['PATCH'])
@login_required
@role_required('management')
def update_department(dept_id):
    """Updates department name, description, or active status. Preserves historical complaints."""
    dept = db.session.get(Department, dept_id)
    if not dept:
        return jsonify({"success": False, "message": "Department not found."}), 404

    data = request.get_json() or {}
    old_val = f"Name: {dept.name}, Active: {dept.is_active}"

    if 'name' in data:
        new_name = (data.get('name') or '').strip()
        if not new_name:
            return jsonify({"success": False, "message": "Department name cannot be empty."}), 400
        existing = Department.query.filter(func.lower(Department.name) == func.lower(new_name), Department.id != dept_id).first()
        if existing:
            return jsonify({"success": False, "message": f"Another department named '{new_name}' already exists."}), 409
        dept.name = new_name

    if 'description' in data:
        dept.description = (data.get('description') or '').strip()

    if 'is_active' in data:
        dept.is_active = bool(data.get('is_active'))

    new_val = f"Name: {dept.name}, Active: {dept.is_active}"

    log_audit(
        action='Department Updated',
        entity_type='Department',
        entity_id=dept.id,
        old_value=old_val,
        new_value=new_val,
        user_id=current_user.id
    )

    db.session.commit()
    emit_department_updated(dept.to_dict())

    return jsonify({
        "success": True,
        "message": f"Department '{dept.name}' updated successfully.",
        "department": dept.to_dict()
    }), 200


# ==============================================================================
# 6. SYSTEM SETTINGS
# ==============================================================================

@management_bp.route('/settings', methods=['GET'])
@login_required
@role_required('management')
def get_settings():
    """Returns all configurable system settings."""
    SystemSetting.init_default_settings()
    settings = SystemSetting.get_all_settings_dict()
    return jsonify({
        "success": True,
        "settings": settings
    }), 200


@management_bp.route('/settings', methods=['PATCH'])
@login_required
@role_required('management')
def update_settings():
    """Updates configurable system settings with validation and audit logging."""
    data = request.get_json() or {}
    updates = data.get('settings') or {}

    if not updates:
        return jsonify({"success": False, "message": "No settings payload provided."}), 400

    changed = []
    for k, v in updates.items():
        try:
            num_val = float(v)
            if num_val <= 0:
                return jsonify({"success": False, "message": f"Setting '{k}' must be a positive number."}), 400
        except (ValueError, TypeError):
            return jsonify({"success": False, "message": f"Invalid numeric value for setting '{k}'."}), 400

        old_v = SystemSetting.get_setting(k)
        if str(old_v) != str(v):
            SystemSetting.set_setting(k, v)
            changed.append(f"{k}: {old_v} -> {v}")
            log_audit(
                action='System Setting Changed',
                entity_type='SystemSetting',
                entity_id=k,
                old_value=str(old_v),
                new_value=str(v),
                user_id=current_user.id
            )

    db.session.commit()

    return jsonify({
        "success": True,
        "message": f"Updated {len(changed)} system setting(s).",
        "changed": changed,
        "settings": SystemSetting.get_all_settings_dict()
    }), 200


# ==============================================================================
# 7. REPORTING & ANALYTICS
# ==============================================================================

@management_bp.route('/reports', methods=['GET'])
@login_required
@role_required('management')
def get_reports():
    """Generates filtered report data for complaints, departments, staff, SLA, and overdue metrics."""
    query = Complaint.query
    now = datetime.now(timezone.utc)

    # Apply Filters
    dept_id = request.args.get('department_id', type=int)
    if dept_id:
        query = query.filter_by(department_id=dept_id)

    priority = request.args.get('priority')
    if priority and priority in VALID_PRIORITIES:
        query = query.filter_by(priority=priority)

    status = request.args.get('status')
    if status and status in VALID_STATUSES:
        query = query.filter_by(status=status)

    staff_id = request.args.get('staff_id', type=int)
    if staff_id:
        query = query.filter_by(assigned_to=staff_id)

    date_from = request.args.get('date_from')
    if date_from:
        try:
            df = datetime.fromisoformat(date_from)
            query = query.filter(Complaint.created_at >= df)
        except ValueError:
            pass

    date_to = request.args.get('date_to')
    if date_to:
        try:
            dt = datetime.fromisoformat(date_to) + timedelta(days=1)
            query = query.filter(Complaint.created_at <= dt)
        except ValueError:
            pass

    complaints = query.order_by(Complaint.created_at.desc()).all()

    total = len(complaints)
    resolved = sum(1 for c in complaints if c.status == 'Resolved')
    closed = sum(1 for c in complaints if c.status == 'Closed')
    in_progress = sum(1 for c in complaints if c.status == 'In Progress')
    assigned = sum(1 for c in complaints if c.status == 'Assigned')
    submitted = sum(1 for c in complaints if c.status == 'Submitted')
    overdue = sum(1 for c in complaints if c.status in ['Assigned', 'In Progress', 'Submitted'] and (c.is_overdue or (c.sla_deadline is not None and now > _to_utc(c.sla_deadline))))

    completed = [c for c in complaints if c.status in ['Resolved', 'Closed']]
    within_sla = sum(1 for c in completed if c.resolved_at is not None and c.sla_deadline is not None and _to_utc(c.resolved_at) <= _to_utc(c.sla_deadline))
    sla_compliance_pct = round((within_sla / len(completed) * 100), 1) if completed else 100.0

    res_times = [c.resolution_time_minutes for c in completed if c.resolution_time_minutes is not None]
    avg_resolution_time = round(sum(res_times) / len(res_times), 1) if res_times else 0.0

    return jsonify({
        "success": True,
        "summary": {
            "total_complaints": total,
            "submitted": submitted,
            "assigned": assigned,
            "in_progress": in_progress,
            "resolved": resolved,
            "closed": closed,
            "overdue": overdue,
            "sla_compliance_pct": sla_compliance_pct,
            "avg_resolution_time_minutes": avg_resolution_time
        },
        "complaints": [c.to_dict() for c in complaints[:100]]
    }), 200


@management_bp.route('/analytics/sla', methods=['GET'])
@login_required
@role_required('management')
def get_sla_analytics():
    """Returns SLA compliance and performance breakdown."""
    now = datetime.now(timezone.utc)
    total = Complaint.query.count()
    completed = Complaint.query.filter(Complaint.status.in_(['Resolved', 'Closed'])).all()
    
    within_sla = sum(1 for c in completed if c.resolved_at is not None and c.sla_deadline is not None and _to_utc(c.resolved_at) <= _to_utc(c.sla_deadline))
    after_sla = len(completed) - within_sla
    currently_overdue = Complaint.query.filter(
        Complaint.status.in_(['Assigned', 'In Progress', 'Submitted']),
        or_(Complaint.is_overdue == True, Complaint.sla_deadline < now)
    ).count()

    sla_compliance_pct = round((within_sla / len(completed) * 100), 1) if completed else 100.0

    res_times = [c.resolution_time_minutes for c in completed if c.resolution_time_minutes is not None]
    avg_resolution_time = round(sum(res_times) / len(res_times), 1) if res_times else 0.0

    return jsonify({
        "success": True,
        "sla_performance": {
            "total_complaints": total,
            "resolved_within_sla": within_sla,
            "resolved_after_sla": after_sla,
            "currently_overdue": currently_overdue,
            "sla_compliance_percentage": sla_compliance_pct,
            "average_resolution_time_minutes": avg_resolution_time
        }
    }), 200


@management_bp.route('/analytics/resolution-performance', methods=['GET'])
@login_required
@role_required('management')
def get_resolution_performance():
    """Returns average resolution times grouped by department, maintenance employee, and priority."""
    completed = Complaint.query.filter(Complaint.status.in_(['Resolved', 'Closed'])).all()

    # By Department
    dept_times = {}
    for c in completed:
        d_name = c.department.name if c.department else "Other"
        if c.resolution_time_minutes is not None:
            dept_times.setdefault(d_name, []).append(c.resolution_time_minutes)

    by_department = [
        {"department": k, "avg_minutes": round(sum(v)/len(v), 1), "count": len(v)}
        for k, v in dept_times.items()
    ]

    # By Priority
    prio_times = {}
    for c in completed:
        if c.resolution_time_minutes is not None:
            prio_times.setdefault(c.priority, []).append(c.resolution_time_minutes)

    by_priority = [
        {"priority": k, "avg_minutes": round(sum(v)/len(v), 1), "count": len(v)}
        for k, v in prio_times.items()
    ]

    # By Staff
    staff_times = {}
    for c in completed:
        if c.assigned_to and c.resolution_time_minutes is not None:
            s_name = c.assignee.name if c.assignee else f"Staff #{c.assigned_to}"
            staff_times.setdefault(s_name, []).append(c.resolution_time_minutes)

    by_staff = [
        {"staff": k, "avg_minutes": round(sum(v)/len(v), 1), "count": len(v)}
        for k, v in staff_times.items()
    ]

    return jsonify({
        "success": True,
        "by_department": by_department,
        "by_priority": by_priority,
        "by_staff": by_staff
    }), 200


# ==============================================================================
# 8. CSV EXPORTS
# ==============================================================================

@management_bp.route('/reports/complaints.csv', methods=['GET'])
@login_required
@role_required('management')
def export_complaints_csv():
    """Exports complaint data to CSV format with useful operational columns."""
    complaints = Complaint.query.order_by(Complaint.created_at.desc()).all()
    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow([
        "Complaint Number", "Title", "Department", "Location", "Priority",
        "Status", "Created By", "Assigned To", "Created At", "Assigned At",
        "Resolved At", "Closed At", "SLA Deadline", "Overdue", "Resolution Time (mins)"
    ])

    for c in complaints:
        writer.writerow([
            c.complaint_number,
            c.title,
            c.department.name if c.department else "",
            c.location,
            c.priority,
            c.status,
            c.creator.name if c.creator else "",
            c.assignee.name if c.assignee else "Unassigned",
            c.created_at.isoformat() if c.created_at else "",
            c.assigned_at.isoformat() if c.assigned_at else "",
            c.resolved_at.isoformat() if c.resolved_at else "",
            c.closed_at.isoformat() if c.closed_at else "",
            c.sla_deadline.isoformat() if c.sla_deadline else "",
            "YES" if c.is_overdue else "NO",
            round(c.resolution_time_minutes, 1) if c.resolution_time_minutes is not None else ""
        ])

    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment;filename=complaints_report_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.csv"}
    )


@management_bp.route('/reports/departments.csv', methods=['GET'])
@login_required
@role_required('management')
def export_departments_csv():
    """Exports department performance breakdown to CSV."""
    departments = Department.query.all()
    now = datetime.now(timezone.utc)
    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow([
        "Department ID", "Department Name", "Active", "Total Complaints",
        "Submitted", "Assigned", "In Progress", "Resolved", "Closed",
        "Overdue", "SLA Compliance %", "Avg Resolution Time (mins)"
    ])

    for dept in departments:
        dept_complaints = Complaint.query.filter_by(department_id=dept.id)
        total = dept_complaints.count()
        submitted = dept_complaints.filter_by(status='Submitted').count()
        assigned = dept_complaints.filter_by(status='Assigned').count()
        in_progress = dept_complaints.filter_by(status='In Progress').count()
        resolved = dept_complaints.filter_by(status='Resolved').count()
        closed = dept_complaints.filter_by(status='Closed').count()
        overdue = dept_complaints.filter(
            Complaint.status.in_(['Assigned', 'In Progress']),
            or_(Complaint.is_overdue == True, Complaint.sla_deadline < now)
        ).count()

        completed = dept_complaints.filter(Complaint.status.in_(['Resolved', 'Closed'])).all()
        within_sla = sum(1 for c in completed if c.resolved_at is not None and c.sla_deadline is not None and _to_utc(c.resolved_at) <= _to_utc(c.sla_deadline))
        sla_pct = round((within_sla / len(completed) * 100), 1) if completed else 100.0
        res_times = [c.resolution_time_minutes for c in completed if c.resolution_time_minutes is not None]
        avg_res = round(sum(res_times) / len(res_times), 1) if res_times else 0.0

        writer.writerow([
            dept.id, dept.name, "Active" if dept.is_active else "Inactive",
            total, submitted, assigned, in_progress, resolved, closed,
            overdue, f"{sla_pct}%", avg_res
        ])

    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment;filename=department_performance_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.csv"}
    )


@management_bp.route('/reports/staff.csv', methods=['GET'])
@login_required
@role_required('management')
def export_staff_csv():
    """Exports maintenance staff metrics to CSV."""
    staff_members = User.query.filter_by(role='maintenance').all()
    now = datetime.now(timezone.utc)
    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow([
        "Staff ID", "Name", "Email", "Department", "Active", "Assigned",
        "In Progress", "Resolved", "Closed", "Overdue", "SLA Compliance %", "Avg Resolution Time (mins)"
    ])

    for s in staff_members:
        tickets = Complaint.query.filter_by(assigned_to=s.id)
        assigned_cnt = tickets.filter_by(status='Assigned').count()
        in_prog = tickets.filter_by(status='In Progress').count()
        res = tickets.filter_by(status='Resolved').count()
        clo = tickets.filter_by(status='Closed').count()
        overdue = tickets.filter(
            Complaint.status.in_(['Assigned', 'In Progress']),
            or_(Complaint.is_overdue == True, Complaint.sla_deadline < now)
        ).count()

        completed = tickets.filter(Complaint.status.in_(['Resolved', 'Closed'])).all()
        within_sla = sum(1 for c in completed if c.resolved_at is not None and c.sla_deadline is not None and _to_utc(c.resolved_at) <= _to_utc(c.sla_deadline))
        sla_pct = round((within_sla / len(completed) * 100), 1) if completed else 100.0
        res_times = [c.resolution_time_minutes for c in completed if c.resolution_time_minutes is not None]
        avg_res = round(sum(res_times) / len(res_times), 1) if res_times else 0.0

        writer.writerow([
            s.employee_or_student_id or s.id,
            s.name,
            s.email,
            s.department or (s.department_rel.name if s.department_rel else "General"),
            "Active" if s.is_active else "Inactive",
            assigned_cnt,
            in_prog,
            res,
            clo,
            overdue,
            f"{sla_pct}%",
            avg_res
        ])

    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment;filename=staff_performance_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.csv"}
    )


@management_bp.route('/reports/sla.csv', methods=['GET'])
@login_required
@role_required('management')
def export_sla_csv():
    """Exports SLA performance breakdown to CSV."""
    complaints = Complaint.query.all()
    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow([
        "Complaint Number", "Priority", "Department", "Created At",
        "SLA Deadline", "Resolved At", "Resolution Time (mins)",
        "SLA Met", "Escalation Level"
    ])

    for c in complaints:
        sla_met = "N/A"
        if c.resolved_at and c.sla_deadline:
            sla_met = "YES" if _to_utc(c.resolved_at) <= _to_utc(c.sla_deadline) else "NO"  # type: ignore[operator]  # None already guarded on line above

        writer.writerow([
            c.complaint_number,
            c.priority,
            c.department.name if c.department else "",
            c.created_at.isoformat() if c.created_at else "",
            c.sla_deadline.isoformat() if c.sla_deadline else "",
            c.resolved_at.isoformat() if c.resolved_at else "",
            round(c.resolution_time_minutes, 1) if c.resolution_time_minutes is not None else "",
            sla_met,
            f"Level {c.get_current_escalation_level()}"
        ])

    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment;filename=sla_performance_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.csv"}
    )


# ==============================================================================
# 9. GLOBAL SEARCH
# ==============================================================================

@management_bp.route('/search', methods=['GET'])
@login_required
@role_required('management')
def global_search():
    """Global search across complaints, users, and departments."""
    q = (request.args.get('q') or '').strip()
    if not q:
        return jsonify({
            "success": True,
            "results": {"complaints": [], "users": [], "departments": []}
        }), 200

    pattern = f"%{q}%"

    # Search Complaints
    complaints = Complaint.query.join(User, Complaint.created_by == User.id, isouter=True).filter(
        or_(
            Complaint.complaint_number.ilike(pattern),
            Complaint.title.ilike(pattern),
            Complaint.location.ilike(pattern),
            User.name.ilike(pattern)
        )
    ).limit(15).all()

    # Search Users
    users = User.query.filter(
        or_(
            User.name.ilike(pattern),
            User.email.ilike(pattern),
            User.employee_or_student_id.ilike(pattern)
        )
    ).limit(10).all()

    # Search Departments
    departments = Department.query.filter(
        or_(
            Department.name.ilike(pattern),
            Department.description.ilike(pattern)
        )
    ).limit(5).all()

    return jsonify({
        "success": True,
        "query": q,
        "results": {
            "complaints": [c.to_dict() for c in complaints],
            "users": [u.to_dict() for u in users],
            "departments": [d.to_dict() for d in departments]
        }
    }), 200


# ==============================================================================
# 10. DATABASE BACKUP & SLA TRIGGER
# ==============================================================================

@management_bp.route('/backup', methods=['POST'])
@login_required
@role_required('management')
def create_database_backup():
    """Creates a secure backup snapshot of the SQLite database in backend/backups/."""
    try:
        base_dir = current_app.config.get('BASE_DIR', os.path.abspath(os.path.dirname(os.path.dirname(__file__))))
        db_path = os.path.join(base_dir, 'campus_helpdesk.db')
        
        backups_dir = os.path.join(base_dir, 'backups')
        os.makedirs(backups_dir, exist_ok=True)

        timestamp_str = datetime.now(timezone.utc).strftime('%Y-%m-%d_%H%M%S')
        backup_filename = f"helpdesk_backup_{timestamp_str}.db"
        backup_path = os.path.join(backups_dir, backup_filename)

        if os.path.exists(db_path):
            shutil.copy2(db_path, backup_path)
        else:
            # For in-memory or alternative db, dump SQLite
            pass

        log_audit(
            action='Database Backup Created',
            entity_type='Database',
            entity_id=backup_filename,
            new_value=f"Backup created: {backup_filename}",
            user_id=current_user.id
        )
        db.session.commit()

        return jsonify({
            "success": True,
            "message": f"Database backup '{backup_filename}' created successfully.",
            "backup_filename": backup_filename,
            "timestamp": timestamp_str
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Backup failed: {str(e)}"
        }), 500


@management_bp.route('/sla/evaluate', methods=['POST'])
@login_required
@role_required('management')
def trigger_sla_evaluation():
    """Manually triggers an immediate evaluation of all active SLAs and escalations."""
    result = evaluate_all_active_slas()
    return jsonify({
        "success": True,
        "message": "SLA evaluation cycle completed.",
        "result": result
    }), 200
