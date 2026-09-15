from datetime import datetime, timezone
from extensions import db

def utc_now():
    return datetime.now(timezone.utc).replace(tzinfo=None)

class Department(db.Model):
    __tablename__ = 'departments'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False, index=True)
    description = db.Column(db.String(255), nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=utc_now)

    # Relationships
    users = db.relationship('User', backref='department_rel', lazy='dynamic')

    def __init__(self, name=None, description=None, is_active=True, **kwargs):
        super().__init__(**kwargs)
        if name is not None:
            self.name = name
        if description is not None:
            self.description = description
        self.is_active = is_active

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def __repr__(self):
        return f"<Department {self.name}>"
