from datetime import datetime, timedelta
from extensions import db

VALID_STATUSES = {'Submitted', 'Assigned', 'In Progress', 'Resolved', 'Closed', 'Reopened'}
VALID_PRIORITIES = {'Low', 'Medium', 'High'}

class Complaint(db.Model):
    __tablename__ = 'complaints'

    id = db.Column(db.Integer, primary_key=True)
    complaint_number = db.Column(db.String(30), unique=True, nullable=False, index=True)
    title = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=False)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=False, index=True)
    location = db.Column(db.String(150), nullable=False)
    priority = db.Column(db.String(20), nullable=False, default='Medium', index=True)
    status = db.Column(db.String(30), nullable=False, default='Submitted', index=True)
    
    # User Foreign Keys
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    assigned_to = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True, index=True)

    # Photos & Resolution details
    issue_photo = db.Column(db.String(255), nullable=True)
    resolution_photo = db.Column(db.String(255), nullable=True)
    resolution_remarks = db.Column(db.Text, nullable=True)

    # SLA Management & Tracking Fields
    sla_deadline = db.Column(db.DateTime, nullable=True, index=True)
    assigned_at = db.Column(db.DateTime, nullable=True)
    first_response_at = db.Column(db.DateTime, nullable=True)
    resolution_time_minutes = db.Column(db.Float, nullable=True)
    is_overdue = db.Column(db.Boolean, default=False, nullable=False, index=True)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = db.Column(db.DateTime, nullable=True)
    closed_at = db.Column(db.DateTime, nullable=True)

    # Relationships
    creator = db.relationship('User', foreign_keys=[created_by], backref=db.backref('complaints_created', lazy='dynamic'))
    assignee = db.relationship('User', foreign_keys=[assigned_to], backref=db.backref('complaints_assigned', lazy='dynamic'))
    department = db.relationship('Department', foreign_keys=[department_id], backref=db.backref('complaints', lazy='dynamic'))
    status_logs = db.relationship('StatusLog', backref='complaint', lazy='dynamic', cascade='all, delete-orphan')
    escalations = db.relationship('EscalationLog', backref='complaint', lazy='dynamic', cascade='all, delete-orphan')

    def __init__(self, complaint_number=None, title=None, description=None, department_id=None, location=None, priority='Medium', status='Submitted', created_by=None, assigned_to=None, issue_photo=None, resolution_photo=None, resolution_remarks=None, sla_deadline=None, **kwargs):
        super().__init__(**kwargs)
        if complaint_number is not None:
            self.complaint_number = complaint_number
        if title is not None:
            self.title = title
        if description is not None:
            self.description = description
        if department_id is not None:
            self.department_id = department_id
        if location is not None:
            self.location = location
        if priority is not None:
            self.priority = priority
        if status is not None:
            self.status = status
        if created_by is not None:
            self.created_by = created_by
        if assigned_to is not None:
            self.assigned_to = assigned_to
        if issue_photo is not None:
            self.issue_photo = issue_photo
        if resolution_photo is not None:
            self.resolution_photo = resolution_photo
        if resolution_remarks is not None:
            self.resolution_remarks = resolution_remarks
        if sla_deadline is not None:
            self.sla_deadline = sla_deadline

    def calculate_sla_hours(self):
        """Returns SLA duration in hours based on system settings or default fallback."""
        from models.system_setting import SystemSetting
        priority_key_map = {
            'High': 'high_sla_hours',
            'Medium': 'medium_sla_hours',
            'Low': 'low_sla_hours'
        }
        key = priority_key_map.get(self.priority, 'medium_sla_hours')
        default_val = 4 if self.priority == 'High' else (24 if self.priority == 'Medium' else 72)
        return SystemSetting.get_setting_int(key, default_val)

    def compute_and_set_sla_deadline(self, base_time=None):
        """Calculates sla_deadline from base_time or created_at."""
        ref_time = base_time or self.created_at or datetime.utcnow()
        hours = self.calculate_sla_hours()
        self.sla_deadline = ref_time + timedelta(hours=hours)
        return self.sla_deadline

    def get_remaining_seconds(self, now=None):
        """Returns remaining seconds until SLA deadline (can be negative if overdue)."""
        if not self.sla_deadline:
            return None
        now_dt = now or datetime.utcnow()
        return (self.sla_deadline - now_dt).total_seconds()

    def get_current_escalation_level(self, now=None):
        """
        Calculates real-time escalation level:
        Level 0: Normal
        Level 1: Approaching SLA (remaining <= 25% of SLA duration)
        Level 2: SLA Breached (current > deadline and not Resolved/Closed)
        Level 3: Critical Escalation (> 2x SLA duration)
        """
        if self.status in {'Resolved', 'Closed'}:
            return 0

        if not self.sla_deadline or not self.created_at:
            return 0

        now_dt = now or datetime.utcnow()
        total_duration_secs = self.calculate_sla_hours() * 3600
        elapsed_secs = (now_dt - self.created_at).total_seconds()
        remaining_secs = (self.sla_deadline - now_dt).total_seconds()

        from models.system_setting import SystemSetting
        crit_mult = SystemSetting.get_setting_float('critical_multiplier', 2.0)
        app_pct = SystemSetting.get_setting_float('approaching_threshold_pct', 25.0) / 100.0

        if elapsed_secs > (crit_mult * total_duration_secs):
            return 3
        if now_dt > self.sla_deadline:
            return 2
        if remaining_secs <= (app_pct * total_duration_secs) and remaining_secs > 0:
            return 1
        return 0

    def check_overdue(self, now=None):
        """Returns True if complaint is past SLA deadline and not Resolved/Closed."""
        if self.status in {'Resolved', 'Closed'}:
            return False
        if not self.sla_deadline:
            return False
        now_dt = now or datetime.utcnow()
        return now_dt > self.sla_deadline

    def to_dict(self):
        dept_name = self.department.name if self.department else None
        creator_info = None
        if self.creator:
            creator_info = {
                'id': self.creator.id,
                'name': self.creator.name,
                'email': self.creator.email,
                'role': self.creator.role,
                'department': self.creator.department,
                'employee_or_student_id': self.creator.employee_or_student_id,
                'phone': self.creator.phone
            }

        assignee_info = None
        if self.assignee:
            assignee_info = {
                'id': self.assignee.id,
                'name': self.assignee.name,
                'email': self.assignee.email,
                'role': self.assignee.role,
                'department': self.assignee.department,
                'phone': self.assignee.phone
            }

        now_dt = datetime.utcnow()
        remaining_secs = self.get_remaining_seconds(now_dt)
        escalation_lvl = self.get_current_escalation_level(now_dt)
        overdue_bool = self.check_overdue(now_dt) if self.status not in {'Resolved', 'Closed'} else False

        # Calculate SLA compliance for resolved/closed tickets
        resolved_within_sla = None
        if self.resolved_at and self.sla_deadline:
            resolved_within_sla = self.resolved_at <= self.sla_deadline

        return {
            'id': self.id,
            'complaint_number': self.complaint_number,
            'title': self.title,
            'description': self.description,
            'department_id': self.department_id,
            'department': dept_name,
            'location': self.location,
            'priority': self.priority,
            'status': self.status,
            'created_by': self.created_by,
            'creator': creator_info,
            'assigned_to': self.assigned_to,
            'assignee': assignee_info,
            'issue_photo': self.issue_photo,
            'resolution_photo': self.resolution_photo,
            'resolution_remarks': self.resolution_remarks,
            'sla_deadline': self.sla_deadline.isoformat() if self.sla_deadline else None,
            'assigned_at': self.assigned_at.isoformat() if self.assigned_at else None,
            'first_response_at': self.first_response_at.isoformat() if self.first_response_at else None,
            'resolution_time_minutes': round(self.resolution_time_minutes, 1) if self.resolution_time_minutes is not None else None,
            'is_overdue': self.is_overdue or overdue_bool,
            'remaining_seconds': int(remaining_secs) if remaining_secs is not None else None,
            'escalation_level': escalation_lvl,
            'resolved_within_sla': resolved_within_sla,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None,
            'closed_at': self.closed_at.isoformat() if self.closed_at else None
        }

    def __repr__(self):
        return f"<Complaint {self.complaint_number}: {self.title} [{self.status}] (Overdue: {self.is_overdue})>"
