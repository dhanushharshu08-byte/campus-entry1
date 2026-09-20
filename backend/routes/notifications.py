from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from extensions import db
from models.notification import Notification

notifications_bp = Blueprint('notifications', __name__, url_prefix='/api/notifications')

@notifications_bp.route('', methods=['GET'])
@login_required
def list_notifications():
    """
    Retrieve notifications belonging to the authenticated user.
    Newest first.
    """
    user_id = current_user.id
    unread_only = request.args.get('unread_only', 'false').lower() == 'true'

    query = Notification.query.filter_by(user_id=user_id)
    if unread_only:
        query = query.filter_by(is_read=False)

    notifications = query.order_by(Notification.created_at.desc()).limit(100).all()
    
    return jsonify({
        "success": True,
        "count": len(notifications),
        "notifications": [n.to_dict() for n in notifications]
    }), 200

@notifications_bp.route('/unread-count', methods=['GET'])
@login_required
def get_unread_count():
    """
    Return count of unread notifications for the authenticated user.
    """
    count = Notification.query.filter_by(user_id=current_user.id, is_read=False).count()
    return jsonify({
        "success": True,
        "count": count
    }), 200

@notifications_bp.route('/<int:notification_id>/read', methods=['PATCH', 'PUT', 'POST'])
@login_required
def mark_notification_read(notification_id):
    """
    Mark a notification belonging to the authenticated user as read.
    """
    notification = db.session.get(Notification, notification_id)
    if not notification or notification.user_id != current_user.id:
        return jsonify({
            "success": False,
            "message": "Notification not found or access denied."
        }), 404

    notification.is_read = True
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Notification marked as read",
        "notification": notification.to_dict()
    }), 200

@notifications_bp.route('/read-all', methods=['PATCH', 'PUT', 'POST'])
@login_required
def mark_all_notifications_read():
    """
    Mark all notifications belonging to the current user as read.
    """
    Notification.query.filter_by(user_id=current_user.id, is_read=False).update({"is_read": True})
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "All notifications marked as read"
    }), 200
