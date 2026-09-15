from datetime import datetime, timezone
from extensions import db


def _utcnow():
    return datetime.now(timezone.utc)


class AuditLog(db.Model):
    __tablename__ = 'audit_logs'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True, index=True)
    action = db.Column(db.String(100), nullable=False, index=True)
    entity_type = db.Column(db.String(50), nullable=False, index=True)
    entity_id = db.Column(db.String(50), nullable=True, index=True)
    old_value = db.Column(db.Text, nullable=True)
    new_value = db.Column(db.Text, nullable=True)
    ip_address = db.Column(db.String(50), nullable=True)
    timestamp = db.Column(db.DateTime, default=_utcnow, index=True)

    # Relationships
    user = db.relationship('User', foreign_keys=[user_id])

    def __init__(self, user_id=None, action=None, entity_type=None, entity_id=None, old_value=None, new_value=None, ip_address=None, **kwargs):
        super().__init__(**kwargs)
        if user_id is not None:
            self.user_id = user_id
        if action is not None:
            self.action = action
        if entity_type is not None:
            self.entity_type = entity_type
        if entity_id is not None:
            self.entity_id = str(entity_id)
        if old_value is not None:
            self.old_value = old_value
        if new_value is not None:
            self.new_value = new_value
        if ip_address is not None:
            self.ip_address = ip_address

    def to_dict(self):
        user_info = None
        if self.user:
            user_info = {
                'id': self.user.id,
                'name': self.user.name,
                'email': self.user.email,
                'role': self.user.role
            }

        return {
            'id': self.id,
            'user_id': self.user_id,
            'user': user_info,
            'user_name': self.user.name if self.user else 'System',
            'action': self.action,
            'entity_type': self.entity_type,
            'entity_id': self.entity_id,
            'old_value': self.old_value,
            'new_value': self.new_value,
            'ip_address': self.ip_address,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }

    def __repr__(self):
        return f"<AuditLog {self.action} on {self.entity_type} {self.entity_id} by User {self.user_id}>"
