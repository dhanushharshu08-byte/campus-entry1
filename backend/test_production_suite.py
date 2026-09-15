"""
Comprehensive 42-Test Suite for CampuSentry Helpdesk & Grievance Management System.
Covers:
- All 4 Roles & Auth
- SLA Targets & Countdown Helpers
- Multi-Tier Escalations (Level 1, 2, 3) & Deduplication
- Management Interventions (Assign, Reassign, Priority SLA Recalc, Internal Remarks)
- Audit Logging & Filtering
- User Management & Self-Deactivation Guard
- Department Management & Soft-Disable
- System Settings & Validation
- Reports & 4 CSV Exports
- Global Search, Database Backup Snapshot & System Health API
"""

import unittest
import os
import io
import json
import uuid
from datetime import datetime, timedelta, timezone
from werkzeug.security import generate_password_hash

# Setup environment
os.environ['FLASK_ENV'] = 'testing'
os.environ['DATABASE_URL'] = 'sqlite:///:memory:'

from app import create_app
from extensions import db
from models import (
    User, Department, Complaint, StatusLog, 
    Notification, AuditLog, EscalationLog, SystemSetting
)
from services.sla_service import (
    calculate_initial_sla, 
    recalculate_sla_on_priority_change, 
    evaluate_all_active_slas
)
from services.audit_service import log_audit

class ProductionTestSuite(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Generate shared hash once for fast test execution
        cls.SHARED_PASSWORD = 'Password@123'
        cls.SHARED_HASH = generate_password_hash(cls.SHARED_PASSWORD)

    def setUp(self):
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.app.config['WTF_CSRF_ENABLED'] = False
        
        self.client = self.app.test_client()
        self.ctx = self.app.app_context()
        self.ctx.push()
        
        db.create_all()
        self._seed_test_data()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    def _seed_test_data(self):
        # Create System Settings
        SystemSetting.set_value('high_sla_hours', '4', 'High Priority SLA')
        SystemSetting.set_value('medium_sla_hours', '24', 'Medium Priority SLA')
        SystemSetting.set_value('low_sla_hours', '72', 'Low Priority SLA')
        SystemSetting.set_value('approaching_threshold_pct', '25', 'Approaching SLA %')
        SystemSetting.set_value('critical_multiplier', '2.0', 'Critical Escalation Multiplier')

        # Create Departments
        self.dept_elec = Department(name='Electrical', description='Power systems and wiring', is_active=True)
        self.dept_plumb = Department(name='Plumbing', description='Water and drainage', is_active=True)
        self.dept_civil = Department(name='Civil', description='Civil works and paint', is_active=True)
        db.session.add_all([self.dept_elec, self.dept_plumb, self.dept_civil])
        db.session.commit()

        # Create Users for all 4 roles
        # Create Users for all 4 roles
        self.admin = User(name='Admin Officer', email='admin@college.edu', role='management', password_hash=self.SHARED_HASH)
        self.tech = User(name='Electrician Dave', email='dave@college.edu', role='maintenance', department='Electrical', department_id=self.dept_elec.id, password_hash=self.SHARED_HASH)
        self.tech2 = User(name='Plumber Paul', email='paul@college.edu', role='maintenance', department='Plumbing', department_id=self.dept_plumb.id, password_hash=self.SHARED_HASH)
        self.student = User(name='Student Alice', email='alice@acetcbe.edu.in', role='student', employee_or_student_id='STU-101', password_hash=self.SHARED_HASH)
        self.faculty = User(name='Prof Bob', email='bob@acetcbe.edu.in', role='faculty', department='Computer Science', employee_or_student_id='FAC-202', password_hash=self.SHARED_HASH)

        db.session.add_all([self.admin, self.tech, self.tech2, self.student, self.faculty])
        db.session.commit()

    def _login(self, email, password=None):
        pwd = password or self.SHARED_PASSWORD
        return self.client.post('/api/auth/login', json={'email': email, 'password': pwd})

    def _create_complaint(self, title='Test Complaint', **kwargs):
        dept_id = kwargs.pop('department_id', self.dept_elec.id)
        if 'department' in kwargs:
            dept_val = kwargs.pop('department')
            if isinstance(dept_val, str):
                dept_obj = Department.query.filter_by(name=dept_val).first()
                if dept_obj:
                    dept_id = dept_obj.id
            elif hasattr(dept_val, 'id'):
                dept_id = dept_val.id

        params = {
            'complaint_number': kwargs.pop('complaint_number', f"CMP-{uuid.uuid4().hex[:8].upper()}"),
            'title': title,
            'description': kwargs.pop('description', 'Test Description Details'),
            'department_id': dept_id,
            'location': kwargs.pop('location', 'Room 101'),
            'priority': kwargs.pop('priority', 'Medium'),
            'status': kwargs.pop('status', 'Submitted'),
            'created_by': kwargs.pop('created_by', self.student.id),
        }
        params.update(kwargs)
        comp = Complaint(**params)
        if not comp.sla_deadline:
            comp.compute_and_set_sla_deadline()
        db.session.add(comp)
        db.session.commit()
        return comp

    # -------------------------------------------------------------
    # 1. Login all 4 roles
    # -------------------------------------------------------------
    def test_01_login_all_4_roles(self):
        roles_creds = [
            ('admin@college.edu', 'management'),
            ('dave@college.edu', 'maintenance'),
            ('alice@acetcbe.edu.in', 'student'),
            ('bob@acetcbe.edu.in', 'faculty')
        ]
        for email, expected_role in roles_creds:
            res = self._login(email)
            self.assertEqual(res.status_code, 200)
            data = res.get_json()
            self.assertTrue(data['success'])
            self.assertEqual(data['user']['role'], expected_role)
            self.client.post('/api/auth/logout')

    # -------------------------------------------------------------
    # 2-4. Role Access Control
    # -------------------------------------------------------------
    def test_02_student_cannot_access_management_endpoints(self):
        self._login('alice@acetcbe.edu.in')
        res = self.client.get('/api/management/users')
        self.assertEqual(res.status_code, 403)

    def test_03_maintenance_cannot_access_management_endpoints(self):
        self._login('dave@college.edu')
        res = self.client.get('/api/management/settings')
        self.assertEqual(res.status_code, 403)

    def test_04_management_can_access_management_endpoints(self):
        self._login('admin@college.edu')
        res = self.client.get('/api/management/users')
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.get_json()['success'])

    # -------------------------------------------------------------
    # 5-7. SLA Initial Calculation
    # -------------------------------------------------------------
    def test_05_create_complaint_sets_initial_sla_deadline_high(self):
        self._login('alice@acetcbe.edu.in')
        res = self.client.post('/api/complaints', data={
            'title': 'Sparks in Lab',
            'description': 'Wires sparking near switchboard',
            'department_id': self.dept_elec.id,
            'location': 'Lab 3',
            'priority': 'High'
        })
        self.assertEqual(res.status_code, 201)
        comp = Complaint.query.filter_by(title='Sparks in Lab').first()
        self.assertIsNotNone(comp.sla_deadline)
        diff_hours = (comp.sla_deadline - comp.created_at).total_seconds() / 3600.0
        self.assertAlmostEqual(diff_hours, 4.0, places=1)

    def test_06_create_complaint_sets_initial_sla_deadline_medium(self):
        self._login('alice@acetcbe.edu.in')
        res = self.client.post('/api/complaints', data={
            'title': 'Leaking Tap',
            'description': 'Water leaking in washroom',
            'department_id': self.dept_plumb.id,
            'location': 'Ground Floor',
            'priority': 'Medium'
        })
        self.assertEqual(res.status_code, 201)
        comp = Complaint.query.filter_by(title='Leaking Tap').first()
        diff_hours = (comp.sla_deadline - comp.created_at).total_seconds() / 3600.0
        self.assertAlmostEqual(diff_hours, 24.0, places=1)

    def test_07_create_complaint_sets_initial_sla_deadline_low(self):
        self._login('alice@acetcbe.edu.in')
        res = self.client.post('/api/complaints', data={
            'title': 'Minor Paint Chip',
            'description': 'Wall paint peeling',
            'department_id': self.dept_civil.id,
            'location': 'Room 101',
            'priority': 'Low'
        })
        self.assertEqual(res.status_code, 201)
        comp = Complaint.query.filter_by(title='Minor Paint Chip').first()
        diff_hours = (comp.sla_deadline - comp.created_at).total_seconds() / 3600.0
        self.assertAlmostEqual(diff_hours, 72.0, places=1)

    # -------------------------------------------------------------
    # 8-13. SLA Metrics, Countdown & Multi-tier Escalations
    # -------------------------------------------------------------
    def test_08_sla_remaining_time_calculation(self):
        now = datetime.now(timezone.utc)
        comp = self._create_complaint(
            title='Test SLA Helper',
            department_id=self.dept_elec.id,
            created_at=now,
            sla_deadline=now + timedelta(hours=2, minutes=30)
        )
        remaining_secs = comp.get_remaining_seconds()
        self.assertIsNotNone(remaining_secs)
        self.assertTrue(remaining_secs > 0)
        self.assertFalse(comp.check_overdue())

    def test_09_sla_breach_detection(self):
        past = datetime.now(timezone.utc) - timedelta(hours=6)
        comp = self._create_complaint(
            title='Overdue Ticket',
            department_id=self.dept_elec.id,
            created_at=past - timedelta(hours=4),
            sla_deadline=past
        )
        self.assertTrue(comp.check_overdue())

    def test_10_sla_level1_approaching_escalation(self):
        now = datetime.now(timezone.utc)
        # High priority total = 4h. 25% threshold = 1h remaining.
        # Created 3.5h ago -> 0.5h remaining (12.5% remaining <= 25%)
        comp = self._create_complaint(
            title='Approaching Ticket',
            department_id=self.dept_elec.id,
            priority='High',
            created_at=now - timedelta(hours=3.5),
            sla_deadline=now + timedelta(minutes=30),
            assigned_to=self.tech.id,
            status='In Progress'
        )

        res = evaluate_all_active_slas()
        self.assertGreaterEqual(res['escalations_triggered'], 1)
        log = EscalationLog.query.filter_by(complaint_id=comp.id, level=1).first()
        self.assertIsNotNone(log)

    def test_11_sla_level2_breach_escalation(self):
        now = datetime.now(timezone.utc)
        comp = self._create_complaint(
            title='Breached Ticket',
            department_id=self.dept_elec.id,
            priority='High',
            created_at=now - timedelta(hours=5),
            sla_deadline=now - timedelta(hours=1),
            assigned_to=self.tech.id,
            status='In Progress'
        )

        res = evaluate_all_active_slas()
        self.assertGreaterEqual(res['escalations_triggered'], 1)
        log = EscalationLog.query.filter_by(complaint_id=comp.id, level=2).first()
        self.assertIsNotNone(log)
        db.session.refresh(comp)
        self.assertTrue(comp.is_overdue)

    def test_12_sla_level3_critical_escalation(self):
        now = datetime.now(timezone.utc)
        # 4h High priority * 2.0x = 8h elapsed. Created 9h ago.
        comp = self._create_complaint(
            title='Critical Overdue Ticket',
            department_id=self.dept_elec.id,
            priority='High',
            created_at=now - timedelta(hours=9),
            sla_deadline=now - timedelta(hours=5),
            assigned_to=self.tech.id,
            status='In Progress'
        )

        res = evaluate_all_active_slas()
        self.assertGreaterEqual(res['escalations_triggered'], 1)
        log = EscalationLog.query.filter_by(complaint_id=comp.id, level=3).first()
        self.assertIsNotNone(log)

    def test_13_escalation_log_deduplication(self):
        now = datetime.now(timezone.utc)
        comp = self._create_complaint(
            title='Dedup Ticket',
            department_id=self.dept_elec.id,
            priority='High',
            created_at=now - timedelta(hours=9),
            sla_deadline=now - timedelta(hours=5),
            assigned_to=self.tech.id,
            status='In Progress'
        )

        eval1 = evaluate_all_active_slas()
        self.assertGreaterEqual(eval1['escalations_triggered'], 1)
        eval2 = evaluate_all_active_slas()
        # Second evaluation cycle must NOT duplicate escalations
        self.assertEqual(eval2['escalations_triggered'], 0)
        logs = EscalationLog.query.filter_by(complaint_id=comp.id, level=3).all()
        self.assertEqual(len(logs), 1)

    # -------------------------------------------------------------
    # 14-18. Management Interventions
    # -------------------------------------------------------------
    def test_14_management_manual_assignment(self):
        comp = self._create_complaint(title='Unassigned Ticket', department_id=self.dept_elec.id)

        self._login('admin@college.edu')
        res = self.client.patch(f'/api/management/complaints/{comp.id}/assign', json={
            'maintenance_user_id': self.tech.id
        })
        self.assertEqual(res.status_code, 200)
        db.session.refresh(comp)
        self.assertEqual(comp.assigned_to, self.tech.id)
        self.assertEqual(comp.status, 'Assigned')
        self.assertIsNotNone(comp.assigned_at)

    def test_15_management_reassignment_with_reason(self):
        comp = self._create_complaint(
            title='Assigned Ticket', 
            department_id=self.dept_elec.id, 
            assigned_to=self.tech.id, 
            status='Assigned'
        )

        # Create another tech in Electrical for reassignment
        tech_elec2 = User(name='Electrician Sam', email='sam@college.edu', role='maintenance', department='Electrical', department_id=self.dept_elec.id, password_hash=self.SHARED_HASH)
        db.session.add(tech_elec2)
        db.session.commit()

        self._login('admin@college.edu')
        res = self.client.patch(f'/api/management/complaints/{comp.id}/reassign', json={
            'maintenance_user_id': tech_elec2.id,
            'reason': 'Technician Dave is on medical leave'
        })
        self.assertEqual(res.status_code, 200)
        db.session.refresh(comp)
        self.assertEqual(comp.assigned_to, tech_elec2.id)
        
        # Check StatusLog for reassignment reason
        log = StatusLog.query.filter(StatusLog.complaint_id == comp.id, StatusLog.comments.like('%medical leave%')).first()
        self.assertIsNotNone(log)
        self.assertIn('medical leave', log.comments)

    def test_16_management_priority_change_recalculates_sla(self):
        comp = self._create_complaint(
            title='Priority Recalc Ticket', 
            department_id=self.dept_elec.id, 
            priority='Low'
        )
        comp.sla_deadline = comp.created_at + timedelta(hours=72)
        db.session.commit()

        self._login('admin@college.edu')
        res = self.client.patch(f'/api/management/complaints/{comp.id}/priority', json={
            'priority': 'High'
        })
        self.assertEqual(res.status_code, 200)
        db.session.refresh(comp)
        self.assertEqual(comp.priority, 'High')
        diff_hours = (comp.sla_deadline - comp.created_at).total_seconds() / 3600.0
        self.assertAlmostEqual(diff_hours, 4.0, places=1)

    def test_17_management_internal_remark_recorded(self):
        comp = self._create_complaint(title='Remark Test', department_id=self.dept_elec.id)

        self._login('admin@college.edu')
        res = self.client.post(f'/api/management/complaints/{comp.id}/remarks', json={
            'remark': 'Purchasing order PO-9988 approved for spare motor.'
        })
        self.assertIn(res.status_code, [200, 201])
        log = StatusLog.query.filter_by(complaint_id=comp.id, is_internal=True).first()
        self.assertIsNotNone(log)
        self.assertIn('PO-9988', log.comments)

    def test_18_internal_remark_hidden_from_student(self):
        comp = self._create_complaint(title='Internal Hidden Test', department_id=self.dept_elec.id)

        # Add internal remark & public remark
        internal_log = StatusLog(complaint_id=comp.id, old_status='Submitted', new_status='Submitted', comments='Confidential internal note', is_internal=True, changed_by_id=self.admin.id)
        public_log = StatusLog(complaint_id=comp.id, old_status=None, new_status='Submitted', comments='Public grievance created', is_internal=False, changed_by_id=self.student.id)
        db.session.add_all([internal_log, public_log])
        db.session.commit()

        self._login('alice@acetcbe.edu.in')
        res = self.client.get(f'/api/complaints/{comp.id}')
        self.assertEqual(res.status_code, 200)
        timeline = res.get_json()['complaint']['timeline']
        remarks = [(item.get('remarks') or item.get('comments')) for item in timeline]
        self.assertNotIn('Confidential internal note', remarks)
        self.assertIn('Public grievance created', remarks)

    # -------------------------------------------------------------
    # 19-25. Audit Logs
    # -------------------------------------------------------------
    def test_19_audit_log_created_on_login(self):
        self._login('admin@college.edu')
        log = AuditLog.query.filter_by(user_id=self.admin.id).first()
        self.assertIsNotNone(log)
        self.assertIn('Login', log.action)

    def test_20_audit_log_created_on_complaint_create(self):
        self._login('alice@acetcbe.edu.in')
        self.client.post('/api/complaints', data={
            'title': 'Audit Log Item', 
            'description': 'Testing complaint audit log creation', 
            'department_id': self.dept_elec.id, 
            'location': 'Lab 1'
        })
        log = AuditLog.query.filter_by(user_id=self.student.id).first()
        self.assertIsNotNone(log)

    def test_21_audit_log_created_on_assignment(self):
        comp = self._create_complaint(title='Audit Assign Ticket', department_id=self.dept_elec.id)

        self._login('admin@college.edu')
        self.client.patch(f'/api/management/complaints/{comp.id}/assign', json={'maintenance_user_id': self.tech.id})
        log = AuditLog.query.filter_by(entity_id=str(comp.id)).first()
        self.assertIsNotNone(log)

    def test_22_audit_log_created_on_reassignment(self):
        # Create another tech in Electrical
        tech_elec2 = User(name='Electrician Sam', email='sam@college.edu', role='maintenance', department='Electrical', department_id=self.dept_elec.id, password_hash=self.SHARED_HASH)
        db.session.add(tech_elec2)
        db.session.commit()

        comp = self._create_complaint(
            title='Audit Reassign Ticket', 
            department_id=self.dept_elec.id, 
            assigned_to=self.tech.id,
            status='Assigned'
        )

        self._login('admin@college.edu')
        self.client.patch(f'/api/management/complaints/{comp.id}/reassign', json={'maintenance_user_id': tech_elec2.id, 'reason': 'Audit test reason'})
        log = AuditLog.query.filter_by(entity_id=str(comp.id)).first()
        self.assertIsNotNone(log)

    def test_23_audit_log_created_on_priority_change(self):
        comp = self._create_complaint(
            title='Audit Priority Ticket', 
            department_id=self.dept_elec.id, 
            priority='Low'
        )

        self._login('admin@college.edu')
        self.client.patch(f'/api/management/complaints/{comp.id}/priority', json={'priority': 'High'})
        log = AuditLog.query.filter_by(entity_id=str(comp.id)).first()
        self.assertIsNotNone(log)

    def test_24_audit_log_created_on_status_change(self):
        comp = self._create_complaint(
            title='Audit Status Ticket', 
            department_id=self.dept_elec.id, 
            assigned_to=self.tech.id, 
            status='Assigned'
        )

        self._login('dave@college.edu')
        self.client.patch(f'/api/maintenance/complaints/{comp.id}/accept')
        log = AuditLog.query.filter_by(entity_id=str(comp.id)).first()
        self.assertIsNotNone(log)

    def test_25_audit_log_filter_api(self):
        self._login('admin@college.edu')
        res = self.client.get('/api/management/audit-logs?entity_type=Auth')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['success'])
        self.assertIn('logs', data)

    # -------------------------------------------------------------
    # 26-29. User Management & Staff Roster
    # -------------------------------------------------------------
    def test_26_user_management_list(self):
        self._login('admin@college.edu')
        res = self.client.get('/api/management/users')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['success'])
        self.assertGreaterEqual(len(data['users']), 5)

    def test_27_user_management_soft_deactivation(self):
        self._login('admin@college.edu')
        res = self.client.patch(f'/api/management/users/{self.student.id}/status', json={'is_active': False})
        self.assertEqual(res.status_code, 200)
        db.session.refresh(self.student)
        self.assertFalse(self.student.is_active)

    def test_28_user_management_self_deactivation_blocked(self):
        self._login('admin@college.edu')
        res = self.client.patch(f'/api/management/users/{self.admin.id}/status', json={'is_active': False})
        self.assertEqual(res.status_code, 400)
        self.assertTrue(any(phrase in res.get_json()['message'].lower() for phrase in ['cannot deactivate', 'at least one active management account']))

    def test_29_maintenance_staff_roster_workload(self):
        comp = self._create_complaint(
            title='Dave Workload Ticket', 
            department_id=self.dept_elec.id, 
            assigned_to=self.tech.id, 
            status='Assigned'
        )

        self._login('admin@college.edu')
        res = self.client.get('/api/management/staff')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        dave_entry = next((s for s in data['staff'] if s['id'] == self.tech.id), None)
        self.assertIsNotNone(dave_entry)
        self.assertEqual(dave_entry['active_workload'], 1)

    # -------------------------------------------------------------
    # 30-32. Department Management
    # -------------------------------------------------------------
    def test_30_department_create(self):
        self._login('admin@college.edu')
        res = self.client.post('/api/management/departments', json={
            'name': 'Audio-Visual Lab',
            'description': 'Projectors and sound equipment'
        })
        self.assertEqual(res.status_code, 201)
        dept = Department.query.filter_by(name='Audio-Visual Lab').first()
        self.assertIsNotNone(dept)

    def test_31_department_edit(self):
        self._login('admin@college.edu')
        res = self.client.patch(f'/api/management/departments/{self.dept_elec.id}', json={
            'name': 'Electrical & Power Systems',
            'description': 'Substation and wiring maintenance',
            'is_active': True
        })
        self.assertEqual(res.status_code, 200)
        db.session.refresh(self.dept_elec)
        self.assertEqual(self.dept_elec.name, 'Electrical & Power Systems')

    def test_32_department_soft_deactivation(self):
        self._login('admin@college.edu')
        res = self.client.patch(f'/api/management/departments/{self.dept_plumb.id}', json={
            'is_active': False
        })
        self.assertEqual(res.status_code, 200)
        db.session.refresh(self.dept_plumb)
        self.assertFalse(self.dept_plumb.is_active)

    # -------------------------------------------------------------
    # 33-34. System Settings & Validation
    # -------------------------------------------------------------
    def test_33_system_settings_get_and_update(self):
        self._login('admin@college.edu')
        get_res = self.client.get('/api/management/settings')
        self.assertEqual(get_res.status_code, 200)

        update_res = self.client.patch('/api/management/settings', json={
            'settings': {
                'high_sla_hours': 2,
                'medium_sla_hours': 12,
                'low_sla_hours': 48,
                'approaching_threshold_pct': 30,
                'critical_multiplier': 1.5,
                'max_upload_size_mb': 10
            }
        })
        self.assertEqual(update_res.status_code, 200)
        self.assertEqual(SystemSetting.get_value('high_sla_hours'), '2')
        self.assertEqual(SystemSetting.get_value('approaching_threshold_pct'), '30')

    def test_34_system_settings_validation(self):
        self._login('admin@college.edu')
        res = self.client.patch('/api/management/settings', json={
            'settings': {
                'high_sla_hours': -5
            }
        })
        self.assertEqual(res.status_code, 400)

    # -------------------------------------------------------------
    # 35-39. Reports & CSV Exports
    # -------------------------------------------------------------
    def test_35_reports_summary_api(self):
        self._login('admin@college.edu')
        res = self.client.get('/api/management/reports')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['success'])
        self.assertIn('summary', data)
        self.assertIn('sla_compliance_pct', data['summary'])

    def test_36_reports_csv_complaints_export(self):
        self._login('admin@college.edu')
        res = self.client.get('/api/management/reports/complaints.csv')
        self.assertEqual(res.status_code, 200)
        self.assertIn('text/csv', res.content_type)
        self.assertIn(b'Complaint Number,Title,Department', res.data)

    def test_37_reports_csv_departments_export(self):
        self._login('admin@college.edu')
        res = self.client.get('/api/management/reports/departments.csv')
        self.assertEqual(res.status_code, 200)
        self.assertIn('text/csv', res.content_type)
        self.assertIn(b'Department ID,Department Name', res.data)

    def test_38_reports_csv_staff_export(self):
        self._login('admin@college.edu')
        res = self.client.get('/api/management/reports/staff.csv')
        self.assertEqual(res.status_code, 200)
        self.assertIn('text/csv', res.content_type)
        self.assertIn(b'Staff ID,Name,Email', res.data)

    def test_39_reports_csv_sla_export(self):
        self._login('admin@college.edu')
        res = self.client.get('/api/management/reports/sla.csv')
        self.assertEqual(res.status_code, 200)
        self.assertIn('text/csv', res.content_type)
        self.assertIn(b'Complaint Number,Priority,Department,Created At,SLA Deadline', res.data)

    # -------------------------------------------------------------
    # 40-42. Global Search, Backup & Health Endpoint
    # -------------------------------------------------------------
    def test_40_global_search_api(self):
        comp = self._create_complaint(title='Global Searchable Issue', department_id=self.dept_elec.id)

        self._login('admin@college.edu')
        res = self.client.get('/api/management/search?q=Searchable')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['success'])
        self.assertGreaterEqual(len(data['results']['complaints']), 1)

    def test_41_database_backup_api(self):
        self._login('admin@college.edu')
        res = self.client.post('/api/management/backup')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['success'])
        self.assertIn('helpdesk_backup_', data['backup_filename'])

    def test_42_system_health_endpoint(self):
        res = self.client.get('/api/health')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data['status'], 'ok')
        self.assertEqual(data['database'], 'connected')

    # -------------------------------------------------------------
    # 43-44. Official College Email (@acetcbe.edu.in) Restriction
    # -------------------------------------------------------------
    def test_43_college_email_restriction_enforced_on_registration(self):
        # 1. Valid Student college email -> Allowed
        res1 = self.client.post('/api/auth/register', json={
            'name': 'New Student',
            'email': 'student2026@acetcbe.edu.in',
            'password': 'Password123!',
            'role': 'student',
            'employee_or_student_id': 'STU-9901'
        })
        self.assertEqual(res1.status_code, 201)
        self.assertTrue(res1.get_json()['success'])

        # 2. Valid Faculty college email -> Allowed
        res2 = self.client.post('/api/auth/register', json={
            'name': 'New Faculty',
            'email': 'faculty2026@acetcbe.edu.in',
            'password': 'Password123!',
            'role': 'faculty',
            'employee_or_student_id': 'FAC-9901'
        })
        self.assertEqual(res2.status_code, 201)
        self.assertTrue(res2.get_json()['success'])

        # 3. Invalid personal Gmail -> Rejected
        res3 = self.client.post('/api/auth/register', json={
            'name': 'Gmail Student',
            'email': 'john.student@gmail.com',
            'password': 'Password123!',
            'role': 'student'
        })
        self.assertEqual(res3.status_code, 400)
        self.assertFalse(res3.get_json()['success'])
        self.assertIn('official college email', res3.get_json()['message'].lower())

        # 4. Invalid Yahoo -> Rejected
        res4 = self.client.post('/api/auth/register', json={
            'name': 'Yahoo Faculty',
            'email': 'prof.smith@yahoo.com',
            'password': 'Password123!',
            'role': 'faculty'
        })
        self.assertEqual(res4.status_code, 400)
        self.assertFalse(res4.get_json()['success'])
        self.assertIn('official college email', res4.get_json()['message'].lower())

    def test_44_college_email_restriction_enforced_on_login(self):
        # 1. Student with college email can log in
        res1 = self._login('alice@acetcbe.edu.in')
        self.assertEqual(res1.status_code, 200)
        self.assertTrue(res1.get_json()['success'])
        self.client.post('/api/auth/logout')

        # 2. Faculty with college email can log in
        res2 = self._login('bob@acetcbe.edu.in')
        self.assertEqual(res2.status_code, 200)
        self.assertTrue(res2.get_json()['success'])
        self.client.post('/api/auth/logout')

        # 3. Non-college email login attempt is rejected
        res3 = self._login('randomstudent@gmail.com')
        self.assertEqual(res3.status_code, 400)
        self.assertFalse(res3.get_json()['success'])
        self.assertIn('official college email', res3.get_json()['message'].lower())

        # 4. Maintenance / Management accounts are unrestricted
        res4 = self._login('admin@college.edu')
        self.assertEqual(res4.status_code, 200)
        self.assertTrue(res4.get_json()['success'])
        self.client.post('/api/auth/logout')

        res5 = self._login('dave@college.edu')
        self.assertEqual(res5.status_code, 200)
        self.assertTrue(res5.get_json()['success'])
        self.client.post('/api/auth/logout')

if __name__ == '__main__':
    unittest.main()
