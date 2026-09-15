from datetime import datetime, timezone
from extensions import db


def _utcnow():
    return datetime.now(timezone.utc)


class StatusLog(db.Model):
    __tablename__ = 'status_logs'

    id = db.Column(db.Integer, primary_key=True)
    complaint_id = db.Column(db.Integer, db.ForeignKey('complaints.id'), nullable=False, index=True)
    changed_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    old_status = db.Column(db.String(30), nullable=True)
    new_status = db.Column(db.String(30), nullable=False)
    comments = db.Column(db.Text, nullable=True)
    is_internal = db.Column(db.Boolean, default=False, nullable=False)
    timestamp = db.Column(db.DateTime, default=_utcnow, index=True)

    # Relationship to user who made change
    changed_by = db.relationship('User', foreign_keys=[changed_by_id])

    def __init__(self, complaint_id=None, changed_by_id=None, old_status=None, new_status='Submitted', comments=None, is_internal=False, **kwargs):
        super().__init__(**kwargs)
        if complaint_id is not None:
            self.complaint_id = complaint_id
        if changed_by_id is not None:
            self.changed_by_id = changed_by_id
        if old_status is not None:
            self.old_status = old_status
        if new_status is not None:
            self.new_status = new_status
        if comments is not None:
            self.comments = comments
        self.is_internal = is_internal

    def to_dict(self):
        return {
            'id': self.id,
            'complaint_id': self.complaint_id,
            'changed_by': self.changed_by.to_dict() if self.changed_by else None,
            'changed_by_name': self.changed_by.name if self.changed_by else 'System',
            'old_status': self.old_status,
            'new_status': self.new_status,
            'status': self.new_status,
            'remarks': self.comments,
            'comments': self.comments,
            'is_internal': self.is_internal,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }

    def __repr__(self):
        return f"<StatusLog Complaint {self.complaint_id}: {self.old_status} -> {self.new_status}>"
