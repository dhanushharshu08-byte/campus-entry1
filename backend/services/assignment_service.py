"""
Automatic Department Assignment Service for CampuSentry Helpdesk.
Assigns new grievances to the least-loaded active maintenance employee in the target department,
with fallback to general maintenance staff if department-specific staff is unavailable.
"""
import logging
from datetime import datetime, timezone
from sqlalchemy import func
from extensions import db
from models.user import User
from models.complaint import Complaint
from models.notification import Notification
from services.socket_service import (
    emit_user_notification, 
    emit_maintenance_assignment, 
    emit_management_dashboard_update
)

logger = logging.getLogger('AssignmentService')

def assign_complaint_to_department_staff(complaint):
    """
    Finds active maintenance staff for the complaint's department, counts active complaints per staff member,
    and assigns the complaint to the least-loaded maintenance staff member.

    Returns:
        User model instance of assigned staff, or None if unassigned.
    """
    if not complaint or not complaint.department_id:
        return None

    # Retrieve department name
    dept_name = complaint.department.name if complaint.department else "General"

    # 1. Query active maintenance staff specifically assigned to this department
    dept_candidates = User.query.filter(
        User.role == 'maintenance',
        User.is_active == True,
        User.department_id == complaint.department_id
    ).all()

    # 2. Fall back to general maintenance staff (no specific department assigned) if no department specialist exists
    if not dept_candidates:
        candidates = User.query.filter(
            User.role == 'maintenance',
            User.is_active == True,
            User.department_id == None
        ).all()
    else:
        candidates = dept_candidates

    if not candidates:
        # No maintenance staff available
        complaint.status = 'Submitted'
        complaint.assigned_to = None

        # Create notifications for all active management users
        mgmt_users = User.query.filter_by(role='management', is_active=True).all()
        for mgr in mgmt_users:
            notif = Notification(
                user_id=mgr.id,
                complaint_id=complaint.id,
                title="Unassigned Maintenance Complaint",
                message=f"Complaint {complaint.complaint_number} requires assignment. No maintenance staff is currently active for {dept_name}.",
                type="unassigned_complaint"
            )
            db.session.add(notif)
            db.session.flush()
            emit_user_notification(mgr.id, notif)

        from services.socket_service import emit_maintenance_complaint_created
        emit_maintenance_complaint_created(complaint)
        emit_management_dashboard_update(complaint.to_dict())
        logger.info(f"No maintenance staff found for {dept_name}. Complaint {complaint.complaint_number} left unassigned.")
        return None

    # Calculate active assigned complaint load for each candidate staff member
    active_statuses = ['Assigned', 'In Progress']
    candidate_loads = []

    for staff in candidates:
        active_count = Complaint.query.filter(
            Complaint.assigned_to == staff.id,
            Complaint.status.in_(active_statuses)
        ).count()
        candidate_loads.append((active_count, staff.id, staff))

    # Sort by active_count ascending, then staff.id ascending
    candidate_loads.sort(key=lambda x: (x[0], x[1]))
    selected_staff = candidate_loads[0][2]

    # Assign complaint to selected staff member and record timestamp
    complaint.assigned_to = selected_staff.id
    complaint.assigned_at = datetime.now(timezone.utc)
    complaint.status = 'Assigned'

    # Create notification for assigned maintenance user with exact prompt details
    notif = Notification(
        user_id=selected_staff.id,
        complaint_id=complaint.id,
        title="New Maintenance Complaint",
        message=f"New {dept_name} complaint {complaint.complaint_number} has been submitted: {complaint.title}",
        type="complaint_assigned"
    )
    db.session.add(notif)
    db.session.flush()

    # Emit real-time Socket.IO events to assigned maintenance staff, maintenance hub, and management
    emit_user_notification(selected_staff.id, notif)
    emit_maintenance_assignment(selected_staff.id, complaint)
    from services.socket_service import emit_maintenance_complaint_created
    emit_maintenance_complaint_created(complaint)
    emit_management_dashboard_update(complaint.to_dict())

    logger.info(f"Assigned {complaint.complaint_number} to {selected_staff.name} (Dept: {dept_name}, Active Load: {candidate_loads[0][0]})")
    return selected_staff
