"""
SLA & Automatic Escalation Service for CampuSentry Helpdesk.
Manages SLA deadline calculations, background overdue detection,
approaching warnings, SLA breaches, and critical multi-tier escalations.
"""
from datetime import datetime, timedelta
from extensions import db
from models.complaint import Complaint
from models.escalation_log import EscalationLog
from models.notification import Notification
from models.user import User
from models.system_setting import SystemSetting
from services.socket_service import (
    emit_user_notification,
    emit_management_dashboard_update,
    emit_sla_warning,
    emit_sla_breached,
    emit_critical_escalation
)

def get_configured_sla_hours(priority):
    """Fetches configured SLA duration in hours for a given priority."""
    key_map = {
        'High': 'high_sla_hours',
        'Medium': 'medium_sla_hours',
        'Low': 'low_sla_hours'
    }
    key = key_map.get(priority, 'medium_sla_hours')
    defaults = {'High': 4, 'Medium': 24, 'Low': 72}
    return SystemSetting.get_setting_int(key, defaults.get(priority, 24))

def calculate_initial_sla(complaint, created_at=None):
    """Calculates and assigns initial sla_deadline to a complaint."""
    base_time = created_at or complaint.created_at or datetime.utcnow()
    hours = get_configured_sla_hours(complaint.priority)
    complaint.sla_deadline = base_time + timedelta(hours=hours)
    complaint.is_overdue = False
    return complaint.sla_deadline

def recalculate_sla_on_priority_change(complaint):
    """Recalculates SLA deadline when priority changes on an active ticket."""
    if complaint.status in {'Resolved', 'Closed'}:
        return complaint.sla_deadline
    base_time = complaint.created_at or datetime.utcnow()
    hours = get_configured_sla_hours(complaint.priority)
    complaint.sla_deadline = base_time + timedelta(hours=hours)
    complaint.is_overdue = datetime.utcnow() > complaint.sla_deadline
    return complaint.sla_deadline

def evaluate_all_active_slas():
    """
    Evaluates all active (unresolved/unclosed) complaints against SLA thresholds.
    Triggers Escalation Level 1 (Approaching), Level 2 (Breached), and Level 3 (Critical).
    Avoids duplicate escalation logs and notification spam.
    """
    now = datetime.utcnow()
    active_complaints = Complaint.query.filter(
        Complaint.status.not_in(['Resolved', 'Closed'])
    ).all()

    approaching_pct = SystemSetting.get_setting_float('approaching_threshold_pct', 25.0) / 100.0
    crit_multiplier = SystemSetting.get_setting_float('critical_multiplier', 2.0)

    mgmt_users = User.query.filter_by(role='management', is_active=True).all()
    escalations_created = []

    for comp in active_complaints:
        if not comp.sla_deadline:
            calculate_initial_sla(comp)

        total_hours = get_configured_sla_hours(comp.priority)
        total_duration_secs = total_hours * 3600
        elapsed_secs = (now - comp.created_at).total_seconds() if comp.created_at else 0
        remaining_secs = (comp.sla_deadline - now).total_seconds()

        # Check existing escalation logs for this complaint
        existing_levels = {
            e.level for e in EscalationLog.query.filter_by(complaint_id=comp.id).all()
        }

        # Level 1: Approaching SLA (remaining <= 25% of SLA duration and > 0)
        if 1 not in existing_levels and remaining_secs <= (approaching_pct * total_duration_secs) and remaining_secs > 0:
            msg = f"Complaint {comp.complaint_number} is approaching its SLA deadline."
            esc_log = EscalationLog(
                complaint_id=comp.id,
                level=1,
                message=msg,
                created_at=now,
                notified_at=now
            )
            db.session.add(esc_log)
            escalations_created.append((comp, 1, msg))

            # Notify assigned maintenance employee
            if comp.assigned_to:
                notif = Notification(
                    user_id=comp.assigned_to,
                    complaint_id=comp.id,
                    title="SLA Deadline Approaching",
                    message=msg,
                    type="sla_warning"
                )
                db.session.add(notif)
                emit_user_notification(comp.assigned_to, notif)

            # Notify management
            for mgr in mgmt_users:
                mgr_notif = Notification(
                    user_id=mgr.id,
                    complaint_id=comp.id,
                    title="SLA Warning",
                    message=msg,
                    type="sla_warning"
                )
                db.session.add(mgr_notif)
                emit_user_notification(mgr.id, mgr_notif)

            emit_sla_warning(comp)

        # Level 2: SLA Breached (now > deadline)
        if now > comp.sla_deadline:
            comp.is_overdue = True

            if 2 not in existing_levels:
                msg = f"SLA breached for complaint {comp.complaint_number}."
                esc_log = EscalationLog(
                    complaint_id=comp.id,
                    level=2,
                    message=msg,
                    created_at=now,
                    notified_at=now
                )
                db.session.add(esc_log)
                escalations_created.append((comp, 2, msg))

                # Notify assigned maintenance employee
                if comp.assigned_to:
                    notif = Notification(
                        user_id=comp.assigned_to,
                        complaint_id=comp.id,
                        title="SLA Breached",
                        message=msg,
                        type="sla_breach"
                    )
                    db.session.add(notif)
                    emit_user_notification(comp.assigned_to, notif)

                # Notify management
                for mgr in mgmt_users:
                    mgr_notif = Notification(
                        user_id=mgr.id,
                        complaint_id=comp.id,
                        title="SLA Breached",
                        message=msg,
                        type="sla_breach"
                    )
                    db.session.add(mgr_notif)
                    emit_user_notification(mgr.id, mgr_notif)

                emit_sla_breached(comp)

        # Level 3: Critical Escalation (elapsed > critical_multiplier * total_duration)
        if elapsed_secs > (crit_multiplier * total_duration_secs):
            if 3 not in existing_levels:
                msg = f"CRITICAL: Complaint {comp.complaint_number} has exceeded SLA by more than the critical threshold."
                esc_log = EscalationLog(
                    complaint_id=comp.id,
                    level=3,
                    message=msg,
                    created_at=now,
                    notified_at=now
                )
                db.session.add(esc_log)
                escalations_created.append((comp, 3, msg))

                # Notify management
                for mgr in mgmt_users:
                    mgr_notif = Notification(
                        user_id=mgr.id,
                        complaint_id=comp.id,
                        title="CRITICAL Escalation",
                        message=msg,
                        type="critical_escalation"
                    )
                    db.session.add(mgr_notif)
                    emit_user_notification(mgr.id, mgr_notif)

                emit_critical_escalation(comp)

    if escalations_created or active_complaints:
        try:
            db.session.commit()
            if escalations_created:
                emit_management_dashboard_update({"escalations_count": len(escalations_created)})
        except Exception as err:
            db.session.rollback()
            print(f"[SLAService Error] Failed to commit SLA evaluations: {err}")

    return {
        "active_evaluated": len(active_complaints),
        "escalations_triggered": len(escalations_created),
        "timestamp": now.isoformat()
    }
