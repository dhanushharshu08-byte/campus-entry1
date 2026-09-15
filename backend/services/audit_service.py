"""
Audit Service for CampuSentry Helpdesk.
Records administrative and transactional audit logs across all modules.
"""
from flask import request
from flask_login import current_user
from extensions import db
from models.audit_log import AuditLog

def log_audit(action, entity_type, entity_id=None, old_value=None, new_value=None, user_id=None, ip_address=None):
    """
    Creates and records an AuditLog entry.
    Safely captures caller IP address and user context.
    Never logs passwords or sensitive credentials.
    """
    uid = user_id
    if uid is None:
        try:
            if current_user and current_user.is_authenticated:
                uid = current_user.id
        except Exception:
            uid = None

    ip = ip_address
    if ip is None:
        try:
            if request:
                ip = request.headers.get('X-Forwarded-For', request.remote_addr)
                if ip and ',' in ip:
                    ip = ip.split(',')[0].strip()
        except Exception:
            ip = None

    audit_entry = AuditLog(
        user_id=uid,
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id) if entity_id is not None else None,
        old_value=str(old_value) if old_value is not None else None,
        new_value=str(new_value) if new_value is not None else None,
        ip_address=ip
    )
    db.session.add(audit_entry)
    return audit_entry
