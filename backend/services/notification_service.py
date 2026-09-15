import logging
from extensions import db, socketio
from models.notification import Notification

logger = logging.getLogger('NotificationService')

def create_notification(user_id, title, message, notification_type='info'):
    """
    Creates a notification in DB and emits a real-time event via Flask-SocketIO.
    Safe execution: failure to emit real-time event will not roll back the DB notification.
    """
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=notification_type
    )
    db.session.add(notification)
    db.session.commit()
    
    # Emit real-time socket event to the user's private room
    try:
        user_room = f"user_{user_id}"
        socketio.emit(
            'new_notification',
            notification.to_dict(),
            to=user_room
        )
    except Exception as e:
        logger.debug(f"Socket.IO notification emit notice: {e}")
        
    return notification
