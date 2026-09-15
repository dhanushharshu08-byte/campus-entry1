"""
Socket.IO Event Centralization Service for CampuSentry Helpdesk.
Provides helper functions for emitting targeted real-time events to user-specific rooms,
maintenance staff, management consoles, and global dashboards.
"""
import logging
from extensions import socketio

logger = logging.getLogger('SocketService')

def broadcast_complaint_event(event_name, complaint):
    """
    Broadcasts complaint lifecycle events (e.g. complaint:created, complaint:updated,
    complaint:assigned, complaint:status_changed, complaint:resolved, complaint:closed, complaint:reopened)
    to all active dashboards, rooms, and connected clients.
    """
    if not complaint:
        return
    payload = complaint.to_dict() if hasattr(complaint, 'to_dict') else complaint
    try:
        socketio.emit(event_name, payload)
        # Always emit common refresh triggers
        if event_name != 'complaint:updated':
            socketio.emit('complaint:updated', payload)
        if event_name != 'complaint:status_changed':
            socketio.emit('complaint:status_changed', payload)
        
        # Real-time dashboard update notifications
        socketio.emit('management:dashboard_update', payload, room="management_users")
        socketio.emit('management:dashboard_update', payload)
        socketio.emit('maintenance:complaint_updated', payload, room="maintenance_users")
        socketio.emit('maintenance:complaint_updated', payload)

        if complaint.created_by:
            socketio.emit('complaint:updated', payload, room=f"user_{complaint.created_by}")
        if complaint.assigned_to:
            socketio.emit('complaint:updated', payload, room=f"user_{complaint.assigned_to}")

        logger.info(f"Broadcasted {event_name}: {payload.get('complaint_number')}")
    except Exception as err:
        logger.error(f"Failed to broadcast {event_name}: {err}")

def emit_user_notification(user_id, notification):
    """Emits a real-time notification payload to the target user's private socket room."""
    if not user_id or not notification:
        return
    room = f"user_{user_id}"
    payload = notification.to_dict() if hasattr(notification, 'to_dict') else notification
    try:
        socketio.emit('notification:new', payload, room=room)
        logger.info(f"Emitted notification:new to {room}: {payload.get('title')}")
    except Exception as err:
        logger.error(f"Failed to emit notification to {room}: {err}")

def emit_complaint_update(user_id, complaint):
    """Emits real-time complaint status update to a user's private socket room and globally."""
    if not user_id or not complaint:
        return
    room = f"user_{user_id}"
    payload = complaint.to_dict() if hasattr(complaint, 'to_dict') else complaint
    try:
        socketio.emit('complaint:updated', payload, room=room)
        socketio.emit('complaint:status_updated', payload, room=room)
        socketio.emit('complaint:status_changed', payload, room=room)
        socketio.emit('complaint:updated', payload)
        logger.info(f"Emitted complaint:updated to {room}: {payload.get('complaint_number')}")
    except Exception as err:
        logger.error(f"Failed to emit complaint update to {room}: {err}")

def emit_maintenance_assignment(user_id, complaint):
    """Emits real-time assignment event to a maintenance employee's private socket room and hub."""
    if not user_id or not complaint:
        return
    room = f"user_{user_id}"
    payload = complaint.to_dict() if hasattr(complaint, 'to_dict') else complaint
    try:
        socketio.emit('complaint:assigned', payload)
        socketio.emit('maintenance:complaint_assigned', payload, room=room)
        socketio.emit('maintenance:complaint_assigned', payload, room="maintenance_users")
        logger.info(f"Emitted maintenance:complaint_assigned to {room}: {payload.get('complaint_number')}")
    except Exception as err:
        logger.error(f"Failed to emit maintenance assignment to {room}: {err}")

def emit_management_dashboard_update(data=None):
    """Emits real-time management:dashboard_update event to the management_users room and globally."""
    room = "management_users"
    payload = data or {}
    try:
        socketio.emit('management:dashboard_update', payload, room=room)
        socketio.emit('management:dashboard_update', payload)
        logger.info("Emitted management:dashboard_update")
    except Exception as err:
        logger.error(f"Failed to emit management update to {room}: {err}")

def emit_management_activity_update(activity_data):
    """Emits real-time activity log update to management users."""
    room = "management_users"
    try:
        socketio.emit('management:activity_update', activity_data, room=room)
        socketio.emit('management:activity_update', activity_data)
    except Exception as err:
        logger.error(f"Failed to emit activity update: {err}")

def emit_sla_warning(complaint):
    """Emits complaint:sla_warning event."""
    payload = complaint.to_dict() if hasattr(complaint, 'to_dict') else complaint
    try:
        if complaint.assigned_to:
            socketio.emit('complaint:sla_warning', payload, room=f"user_{complaint.assigned_to}")
        socketio.emit('complaint:sla_warning', payload, room="management_users")
        socketio.emit('complaint:sla_warning', payload)
        logger.info(f"Emitted complaint:sla_warning for {payload.get('complaint_number')}")
    except Exception as err:
        logger.error(f"Failed to emit SLA warning: {err}")

def emit_sla_breached(complaint):
    """Emits complaint:sla_breached event."""
    payload = complaint.to_dict() if hasattr(complaint, 'to_dict') else complaint
    try:
        if complaint.assigned_to:
            socketio.emit('complaint:sla_breached', payload, room=f"user_{complaint.assigned_to}")
        socketio.emit('complaint:sla_breached', payload, room="management_users")
        socketio.emit('complaint:sla_breached', payload)
        logger.info(f"Emitted complaint:sla_breached for {payload.get('complaint_number')}")
    except Exception as err:
        logger.error(f"Failed to emit SLA breached: {err}")

def emit_critical_escalation(complaint):
    """Emits complaint:critical_escalation event to management."""
    payload = complaint.to_dict() if hasattr(complaint, 'to_dict') else complaint
    try:
        socketio.emit('complaint:critical_escalation', payload, room="management_users")
        socketio.emit('complaint:critical_escalation', payload)
        logger.info(f"Emitted complaint:critical_escalation for {payload.get('complaint_number')}")
    except Exception as err:
        logger.error(f"Failed to emit critical escalation: {err}")

def emit_user_status_changed(user_id, is_active):
    """Emits user:status_changed event to management and target user."""
    payload = {'user_id': user_id, 'is_active': is_active}
    try:
        socketio.emit('user:status_changed', payload, room=f"user_{user_id}")
        socketio.emit('user:status_changed', payload, room="management_users")
        socketio.emit('user:status_changed', payload)
        logger.info(f"Emitted user:status_changed: {user_id}")
    except Exception as err:
        logger.error(f"Failed to emit user status change: {err}")

def emit_department_updated(department_data):
    """Emits department:updated event to all clients."""
    try:
        socketio.emit('department:updated', department_data)
    except Exception as err:
        logger.error(f"Failed to emit department update: {err}")

def emit_maintenance_complaint_created(complaint):
    """Emits real-time complaint created event to the maintenance team and global listeners."""
    dept_name = complaint.department.name if getattr(complaint, 'department', None) else "General"
    payload = {
        'complaint_id': complaint.id,
        'complaint_number': complaint.complaint_number,
        'department_id': complaint.department_id,
        'department': dept_name,
        'title': complaint.title,
        'priority': complaint.priority,
        'status': complaint.status,
        'location': complaint.location,
        'created_at': complaint.created_at.isoformat() if complaint.created_at else None,
        'complaint': complaint.to_dict() if hasattr(complaint, 'to_dict') else complaint
    }
    try:
        socketio.emit('complaint:created', payload)
        socketio.emit('maintenance:complaint_created', payload, room="maintenance_users")
        socketio.emit('maintenance:complaint_created', payload)
        logger.info(f"Emitted complaint:created & maintenance:complaint_created: {complaint.complaint_number}")
    except Exception as err:
        logger.error(f"Failed to emit maintenance complaint created: {err}")

def emit_maintenance_complaint_updated(complaint):
    """Emits real-time complaint updated event to the maintenance team."""
    payload = complaint.to_dict() if hasattr(complaint, 'to_dict') else complaint
    try:
        socketio.emit('complaint:updated', payload)
        socketio.emit('maintenance:complaint_updated', payload, room="maintenance_users")
        socketio.emit('maintenance:complaint_updated', payload)
        logger.info(f"Emitted maintenance:complaint_updated: {payload.get('complaint_number')}")
    except Exception as err:
        logger.error(f"Failed to emit maintenance complaint updated: {err}")
