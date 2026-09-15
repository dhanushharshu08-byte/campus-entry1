from datetime import datetime, timezone
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin
from extensions import db, login_manager

VALID_ROLES = {'student', 'faculty', 'maintenance', 'management'}

class User(UserMixin, db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(30), nullable=False, default='student', index=True)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=True)
    department = db.Column(db.String(100), nullable=True)  # Name cache / display string
    employee_or_student_id = db.Column(db.String(50), nullable=True, index=True)
    phone = db.Column(db.String(25), nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = db.Column(db.DateTime, nullable=True)

    # Notifications relationship
    notifications = db.relationship('Notification', backref='user', lazy='dynamic', cascade='all, delete-orphan')

    def __init__(self, name=None, email=None, role='student', department_id=None, department=None, employee_or_student_id=None, phone=None, is_active=True, **kwargs):
        super().__init__(**kwargs)
        if name is not None:
            self.name = name.strip() if isinstance(name, str) else name
        if email is not None:
            self.email = email.strip().lower() if isinstance(email, str) else email
        if role is not None:
            self.role = role.strip().lower() if isinstance(role, str) else role
        if department_id is not None:
            self.department_id = department_id
        if department is not None:
            self.department = department
        if employee_or_student_id is not None:
            self.employee_or_student_id = employee_or_student_id.strip() if isinstance(employee_or_student_id, str) else employee_or_student_id
        if phone is not None:
            self.phone = phone.strip() if isinstance(phone, str) else phone
        self.is_active = is_active

    def set_password(self, password):
        """Hashes password using Werkzeug."""
        if not password or len(password) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Verifies password using Werkzeug."""
        if not self.password_hash or not password:
            return False
        return check_password_hash(self.password_hash, password)

    def validate_role(self):
        """Ensures role is within authorized role set."""
        if self.role not in VALID_ROLES:
            raise ValueError(f"Invalid role: {self.role}. Must be one of: {', '.join(VALID_ROLES)}")

    # Flask-Login property override for active status
    @property
    def is_authenticated(self):
        return True

    @property
    def is_anonymous(self):
        return False

    def get_id(self):
        return str(self.id)

    def to_dict(self):
        """Returns safe user dictionary without password_hash."""
        dept_name = self.department
        if not dept_name and getattr(self, 'department_rel', None):
            dept_name = self.department_rel.name

        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'role': self.role,
            'department': dept_name,
            'department_id': self.department_id,
            'employee_or_student_id': self.employee_or_student_id,
            'phone': self.phone,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None
        }

    def __repr__(self):
        return f"<User {self.email} ({self.role})>"

@login_manager.user_loader
def load_user(user_id):
    try:
        user = User.query.get(int(user_id))
        if user and user.is_active:
            return user
        return None
    except (ValueError, TypeError):
        return None
