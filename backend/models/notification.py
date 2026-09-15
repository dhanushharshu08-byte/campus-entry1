from datetime import datetime, timezone
from extensions import db


def _utcnow():
    return datetime.now(timezone.utc)


class Notification(db.Model):
    __tablename__ = 'notifications'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    complaint_id = db.Column(db.Integer, db.ForeignKey('complaints.id'), nullable=True, index=True)
    title = db.Column(db.String(150), nullable=False)
    message = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(50), nullable=False, default='info')  # complaint_assigned, status_update, unassigned_complaint, info
    is_read = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=_utcnow, index=True)

    complaint = db.relationship('Complaint', foreign_keys=[complaint_id], backref=db.backref('notifications', lazy='dynamic'))

    def __init__(self, user_id=None, complaint_id=None, title=None, message=None, type='info', is_read=False, **kwargs):
        super().__init__(**kwargs)
        if user_id is not None:
            self.user_id = user_id
        if complaint_id is not None:
            self.complaint_id = complaint_id
        if title is not None:
            self.title = title
        if message is not None:
            self.message = message
        if type is not None:
            self.type = type
        self.is_read = is_read

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'complaint_id': self.complaint_id,
            'title': self.title,
            'message': self.message,
            'type': self.type,
            'notification_type': self.type,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def __repr__(self):
        return f"<Notification {self.id} for User {self.user_id}: {self.title}>"
