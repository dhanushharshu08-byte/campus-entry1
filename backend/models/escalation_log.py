from datetime import datetime, timezone
from extensions import db

def utc_now():
    return datetime.now(timezone.utc).replace(tzinfo=None)

class EscalationLog(db.Model):
    __tablename__ = 'escalation_logs'

    id = db.Column(db.Integer, primary_key=True)
    complaint_id = db.Column(db.Integer, db.ForeignKey('complaints.id'), nullable=False, index=True)
    level = db.Column(db.Integer, nullable=False, index=True)  # 1 = Approaching, 2 = Breached, 3 = Critical
    message = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=utc_now, index=True)
    notified_at = db.Column(db.DateTime, default=utc_now)
    resolved_at = db.Column(db.DateTime, nullable=True)

    def __init__(self, complaint_id=None, level=1, message=None, **kwargs):
        super().__init__(**kwargs)
        if complaint_id is not None:
            self.complaint_id = complaint_id
        if level is not None:
            self.level = level
        if message is not None:
            self.message = message

    def to_dict(self):
        return {
            'id': self.id,
            'complaint_id': self.complaint_id,
            'level': self.level,
            'level_name': {1: 'Approaching SLA', 2: 'SLA Breached', 3: 'Critical Escalation'}.get(self.level, f'Level {self.level}'),
            'message': self.message,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'notified_at': self.notified_at.isoformat() if self.notified_at else None,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None
        }

    def __repr__(self):
        return f"<EscalationLog Complaint {self.complaint_id} Level {self.level}>"
