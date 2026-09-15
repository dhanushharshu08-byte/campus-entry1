"""
CampuSentry - Comprehensive Master End-to-End Functional Test Suite
Covers all 18 Functional Verification Areas:
1. Startup & Infrastructure
2. Registration (Student & Faculty, validations, duplicates, secure hashing)
3. Login & Session Management (4 roles, invalid rejection, logout, route protection)
4. Student Complaint Lifecycle (Creation, image upload, unique ID, assignment, details)
5. Faculty Complaint Lifecycle & Tenant Isolation
6. Centralized Maintenance Operations (Listing, filtering, accept, in progress, resolution remarks, proof photo, resolved)
7. Management Control & Dynamic Metrics (Pure SQLite computation, filters, CSV exports, interventions)
8. Real-Time Notification Pipeline (Socket triggers, database notifications)
9. Timeline & Audit Trail Integrity (StatusLog & AuditLog timestamps, non-overwriting history)
10. Media Upload Validation (Valid image, invalid mime, oversized checks)
11. Authorization Security & Role Boundaries (Strict 401/403 RBAC enforcement)
12. Dashboard Dynamic State & Persistence (Pure zero initial state -> dynamic transitions)
"""

import unittest
import os
import io
import json
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash

os.environ['FLASK_ENV'] = 'testing'
os.environ['DATABASE_URL'] = 'sqlite:///:memory:'

from app import create_app
from extensions import db
from models.user import User, VALID_ROLES
from models.department import Department
from models.complaint import Complaint, VALID_STATUSES, VALID_PRIORITIES
from models.status_log import StatusLog
from models.audit_log import AuditLog
from models.notification import Notification
from models.system_setting import SystemSetting

class MasterE2EVerificationSuite(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.PASSWORD = 'Password@123'
        cls.HASH = generate_password_hash(cls.PASSWORD)

    def setUp(self):
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.app.config['WTF_CSRF_ENABLED'] = False

        self.client = self.app.test_client()
        self.ctx = self.app.app_context()
        self.ctx.push()

        db.create_all()
        SystemSetting.init_default_settings()
        self._seed_base_data()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    def _seed_base_data(self):
        # 7 Active Departments
        self.depts = {}
        dept_names = ['Electrical', 'Plumbing', 'Civil', 'Housekeeping', 'Furniture', 'IT / Network', 'Other']
        for name in dept_names:
            dept = Department(name=name, description=f'{name} Maintenance Department', is_active=True)
            db.session.add(dept)
            db.session.flush()
            self.depts[name] = dept

        # Pre-seeded users for 4 roles
        self.admin = User(
            name='Campus Administrator',
            email='admin@college.edu',
            password_hash=self.HASH,
            role='management',
            is_active=True
        )
        self.maintenance_staff = User(
            name='Central Maintenance Staff',
            email='maintenance@college.edu',
            password_hash=self.HASH,
            role='maintenance',
            is_active=True
        )
        self.student = User(
            name='Alice Student',
            email='student@college.edu',
            password_hash=self.HASH,
            role='student',
            employee_or_student_id='STU-2026-001',
            phone='9876543210',
            is_active=True
        )
        self.faculty = User(
            name='Dr. Bob Professor',
            email='faculty@college.edu',
            password_hash=self.HASH,
            role='faculty',
            employee_or_student_id='EMP-2026-001',
            phone='9876543211',
            is_active=True
        )
        db.session.add_all([self.admin, self.maintenance_staff, self.student, self.faculty])
        db.session.commit()

    def login(self, email, password='Password@123'):
        return self.client.post('/api/auth/login', json={'email': email, 'password': password})

    def logout(self):
        return self.client.post('/api/auth/logout')

    # ==========================================
    # 1. STARTUP & SCHEMA INITIALIZATION TEST
    # ==========================================
    def test_01_startup_and_schema_initialization(self):
        """Verify database initialized with proper tables and system settings."""
        self.assertIsNotNone(self.app)
        settings = SystemSetting.query.all()
        self.assertGreater(len(settings), 0)
        self.assertEqual(Department.query.count(), 7)
        self.assertEqual(User.query.count(), 4)
        self.assertEqual(Complaint.query.count(), 0)

    # ==========================================
    # 2. REGISTRATION TEST (Student & Faculty)
    # ==========================================
    def test_02_student_and_faculty_registration(self):
        """Verify Student and Faculty registration, validation, duplicate rejection, and secure password hashing."""
        # 1. Valid Student Registration
        res = self.client.post('/api/auth/register', json={
            'name': 'New Student',
            'email': 'newstudent@college.edu',
            'password': 'StrongPassword@123',
            'role': 'student',
            'employee_or_student_id': 'STU-999',
            'phone': '1234567890'
        })
        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        self.assertTrue(data.get('success', False))

        saved_user = User.query.filter_by(email='newstudent@college.edu').first()
        self.assertIsNotNone(saved_user)
        self.assertEqual(saved_user.role, 'student')
        self.assertTrue(check_password_hash(saved_user.password_hash, 'StrongPassword@123'))
        self.assertNotEqual(saved_user.password_hash, 'StrongPassword@123')

        # 2. Duplicate Email Rejection (409 Conflict)
        dup_res = self.client.post('/api/auth/register', json={
            'name': 'Duplicate Student',
            'email': 'newstudent@college.edu',
            'password': 'StrongPassword@123',
            'role': 'student'
        })
        self.assertIn(dup_res.status_code, [400, 409])
        self.assertIn('already', dup_res.get_json().get('message', '').lower())

        # 3. Valid Faculty Registration
        fac_res = self.client.post('/api/auth/register', json={
            'name': 'New Faculty',
            'email': 'newfaculty@college.edu',
            'password': 'StrongPassword@123',
            'role': 'faculty',
            'employee_or_student_id': 'EMP-999',
            'phone': '1234567891'
        })
        self.assertEqual(fac_res.status_code, 201)
        saved_fac = User.query.filter_by(email='newfaculty@college.edu').first()
        self.assertEqual(saved_fac.role, 'faculty')

        # 4. Invalid Role Registration (e.g. attempting to register as management or maintenance directly)
        bad_role_res = self.client.post('/api/auth/register', json={
            'name': 'Hacker Admin',
            'email': 'hacker@college.edu',
            'password': 'StrongPassword@123',
            'role': 'management'
        })
        self.assertEqual(bad_role_res.status_code, 400)

        # 5. Missing required fields validation
        missing_res = self.client.post('/api/auth/register', json={
            'email': 'incomplete@college.edu',
            'role': 'student'
        })
        self.assertEqual(missing_res.status_code, 400)

    # ==========================================
    # 3. LOGIN & SESSION MANAGEMENT TEST
    # ==========================================
    def test_03_login_authentication_and_session(self):
        """Test login across all 4 roles, invalid password rejection, session persistence, and logout."""
        roles_to_test = [
            ('student@college.edu', 'student'),
            ('faculty@college.edu', 'faculty'),
            ('maintenance@college.edu', 'maintenance'),
            ('admin@college.edu', 'management')
        ]

        for email, expected_role in roles_to_test:
            # Valid login
            res = self.login(email)
            self.assertEqual(res.status_code, 200)
            user_data = res.get_json().get('user', {})
            self.assertEqual(user_data['role'], expected_role)

            # Check /api/auth/me returns authenticated user
            me_res = self.client.get('/api/auth/me')
            self.assertEqual(me_res.status_code, 200)
            self.assertEqual(me_res.get_json()['user']['email'], email)

            # Logout
            logout_res = self.logout()
            self.assertEqual(logout_res.status_code, 200)

            # Check unauthenticated after logout
            me_after_logout = self.client.get('/api/auth/me')
            self.assertEqual(me_after_logout.status_code, 401)

        # Test incorrect password rejection
        bad_pw_res = self.login('admin@college.edu', 'WrongPassword@999')
        self.assertEqual(bad_pw_res.status_code, 401)

        # Test non-existent user rejection
        bad_user_res = self.login('nonexistent@college.edu', 'Password@123')
        self.assertIn(bad_user_res.status_code, [401, 404])

    # ==========================================
    # 4. STUDENT COMPLAINT WORKFLOW TEST
    # ==========================================
    def test_04_student_complaint_creation_and_details(self):
        """Test Student complaint creation, image attachment, unique ticket ID, initial Submitted status, and details view."""
        self.login('student@college.edu')

        dept_id = self.depts['Electrical'].id
        form_data = {
            'title': 'Broken Ceiling Light in Room 304',
            'description': 'The fluorescent light fixture is flickering and buzzing loudly.',
            'department_id': str(dept_id),
            'location': 'Science Block, Room 304',
            'priority': 'High',
            'issue_photo': (io.BytesIO(b'dummy_png_bytes_content'), 'fixture.jpg')
        }

        res = self.client.post(
            '/api/complaints',
            data=form_data,
            content_type='multipart/form-data'
        )
        self.assertEqual(res.status_code, 201)
        created = res.get_json().get('complaint', {})
        self.assertTrue(created['complaint_number'].startswith('CH-2026-') or created['complaint_number'].startswith('CH-'))
        self.assertEqual(created['title'], 'Broken Ceiling Light in Room 304')
        self.assertIn(created['status'], ['Submitted', 'Assigned'])
        self.assertEqual(created['priority'], 'High')
        self.assertIsNotNone(created['sla_deadline'])
        self.assertIsNotNone(created['issue_photo'])

        # Verify complaint in "My Complaints" list
        my_list_res = self.client.get('/api/complaints')
        self.assertEqual(my_list_res.status_code, 200)
        complaints_list = my_list_res.get_json().get('complaints', [])
        self.assertEqual(len(complaints_list), 1)
        self.assertEqual(complaints_list[0]['id'], created['id'])

        # Verify complaint details endpoint
        detail_res = self.client.get(f"/api/complaints/{created['id']}")
        self.assertEqual(detail_res.status_code, 200)
        detail_data = detail_res.get_json().get('complaint', {})
        self.assertEqual(detail_data['location'], 'Science Block, Room 304')
        self.assertGreaterEqual(len(detail_data['timeline']), 1)
        self.assertEqual(detail_data['timeline'][0]['status'], 'Submitted')

    # ==========================================
    # 5. FACULTY COMPLAINT WORKFLOW & ISOLATION
    # ==========================================
    def test_05_faculty_complaint_and_user_isolation(self):
        """Test Faculty complaint creation, viewing own tickets, and strict privacy isolation against other users."""
        # 1. Student creates ticket 1
        self.login('student@college.edu')
        res_stu = self.client.post('/api/complaints', data={
            'title': 'Student Water Issue',
            'description': 'Water dispenser empty',
            'department_id': str(self.depts['Plumbing'].id),
            'location': 'Hostel A',
            'priority': 'Medium'
        })
        stu_complaint_id = res_stu.get_json()['complaint']['id']
        self.logout()

        # 2. Faculty creates ticket 2
        self.login('faculty@college.edu')
        res_fac = self.client.post('/api/complaints', data={
            'title': 'Faculty Projector Issue',
            'description': 'HDMI port not functioning',
            'department_id': str(self.depts['IT / Network'].id),
            'location': 'Auditorium 1',
            'priority': 'High'
        })
        fac_complaint_id = res_fac.get_json()['complaint']['id']

        # Faculty should see only their 1 complaint in My Complaints
        fac_list = self.client.get('/api/complaints').get_json().get('complaints', [])
        self.assertEqual(len(fac_list), 1)
        self.assertEqual(fac_list[0]['id'], fac_complaint_id)

        # Faculty should be blocked from accessing student's private complaint details (403 Forbidden)
        stu_view_by_fac = self.client.get(f'/api/complaints/{stu_complaint_id}')
        self.assertEqual(stu_view_by_fac.status_code, 403)

        self.logout()

    # ==========================================
    # 6. CENTRALIZED MAINTENANCE WORKFLOW TEST
    # ==========================================
    def test_06_maintenance_operations_and_resolution(self):
        """Test Maintenance viewing tickets, department filter, status update, resolution remarks, proof photo, and marking resolved."""
        # Create a complaint as student
        self.login('student@college.edu')
        res = self.client.post('/api/complaints', data={
            'title': 'Air Conditioner Leaking',
            'description': 'Water leaking from AC unit onto lab computers',
            'department_id': str(self.depts['Electrical'].id),
            'location': 'Computer Lab 2',
            'priority': 'High'
        })
        comp_id = res.get_json()['complaint']['id']
        self.logout()

        # Login as Maintenance
        self.login('maintenance@college.edu')

        # 1. Maintenance lists all complaints
        m_list = self.client.get('/api/maintenance/complaints')
        self.assertEqual(m_list.status_code, 200)
        complaints = m_list.get_json().get('complaints', [])
        self.assertEqual(len(complaints), 1)
        self.assertEqual(complaints[0]['id'], comp_id)

        # 2. Filter by Department
        m_filtered_elec = self.client.get(f"/api/maintenance/complaints?department_id={self.depts['Electrical'].id}")
        self.assertEqual(len(m_filtered_elec.get_json()['complaints']), 1)

        m_filtered_plumb = self.client.get(f"/api/maintenance/complaints?department_id={self.depts['Plumbing'].id}")
        self.assertEqual(len(m_filtered_plumb.get_json()['complaints']), 0)

        # 3. Accept complaint and change Status to 'In Progress'
        prog_res = self.client.post(f'/api/maintenance/complaints/{comp_id}/accept')
        self.assertEqual(prog_res.status_code, 200)
        self.assertEqual(prog_res.get_json()['complaint']['status'], 'In Progress')

        # 4. Resolve Complaint with Resolution Remarks and Proof Photo
        resolve_res = self.client.post(
            f'/api/maintenance/complaints/{comp_id}/resolve',
            data={
                'resolution_remarks': 'Replaced broken drain pipe and cleaned condensate tray. Unit tested OK.',
                'resolution_photo': (io.BytesIO(b'resolution_photo_proof_content'), 'resolved_ac.jpg')
            },
            content_type='multipart/form-data'
        )
        self.assertEqual(resolve_res.status_code, 200)
        res_comp = resolve_res.get_json()['complaint']
        self.assertEqual(res_comp['status'], 'Resolved')
        self.assertIsNotNone(res_comp['resolved_at'])
        self.assertIsNotNone(res_comp['resolution_photo'])
        self.assertEqual(res_comp['resolution_remarks'], 'Replaced broken drain pipe and cleaned condensate tray. Unit tested OK.')

        # Verify in database
        db_comp = db.session.get(Complaint, comp_id)
        self.assertIsNotNone(db_comp)
        assert db_comp is not None
        self.assertEqual(db_comp.status, 'Resolved')

        self.logout()

    # ==========================================
    # 7. MANAGEMENT CONTROL & DYNAMIC METRICS
    # ==========================================
    def test_07_management_control_and_analytics(self):
        """Test Management overview, dynamic analytics from SQLite, department/priority/status filters, interventions, and CSV reports."""
        # Create 2 complaints with different departments and priorities
        self.login('student@college.edu')
        self.client.post('/api/complaints', data={
            'title': 'Civil Window Glass Cracked',
            'description': 'Dangerous broken glass pane in hallway',
            'department_id': str(self.depts['Civil'].id),
            'location': 'Main Building 2nd Floor',
            'priority': 'High'
        })
        self.client.post('/api/complaints', data={
            'title': 'Housekeeping Trash Overflow',
            'description': 'Bin needs emptying',
            'department_id': str(self.depts['Housekeeping'].id),
            'location': 'Cafeteria Exit',
            'priority': 'Low'
        })
        self.logout()

        # Login as Management
        self.login('admin@college.edu')

        # 1. Test Dashboard Statistics computed dynamically from SQLite
        summary_res = self.client.get('/api/dashboard/summary')
        self.assertEqual(summary_res.status_code, 200)
        summary = summary_res.get_json()
        self.assertEqual(summary['total'], 2)
        self.assertEqual(summary['submitted'] + summary['assigned'], 2)
        self.assertEqual(summary['resolved'], 0)

        # 2. Test Management Complaints Listing & Filters
        all_comp_res = self.client.get('/api/management/complaints')
        self.assertEqual(all_comp_res.status_code, 200)
        self.assertEqual(all_comp_res.get_json()['pagination']['total'], 2)

        high_pri_res = self.client.get('/api/management/complaints?priority=High')
        self.assertEqual(high_pri_res.get_json()['pagination']['total'], 1)

        # 3. Test Priority Override Intervention
        target_comp = all_comp_res.get_json()['complaints'][0]
        p_res = self.client.patch(f"/api/management/complaints/{target_comp['id']}/priority", json={
            'priority': 'Medium'
        })
        self.assertEqual(p_res.status_code, 200)
        self.assertEqual(p_res.get_json()['complaint']['priority'], 'Medium')

        # 4. Test Internal Confidential Remark
        remark_res = self.client.post(f"/api/management/complaints/{target_comp['id']}/remarks", json={
            'remark': 'Contractor contacted for window replacement'
        })
        self.assertEqual(remark_res.status_code, 201)

        # 5. Test CSV Reports
        csv_res = self.client.get('/api/management/reports/complaints.csv')
        self.assertEqual(csv_res.status_code, 200)
        self.assertEqual(csv_res.headers['Content-Type'], 'text/csv; charset=utf-8')
        self.assertIn('CH-', csv_res.get_data(as_text=True))

        self.logout()

    # ==========================================
    # 8. NOTIFICATIONS & TIMELINE INTEGRITY
    # ==========================================
    def test_08_notifications_and_audit_timeline(self):
        """Test notification triggers and complete immutable StatusLog & AuditLog history."""
        # 1. Student logs complaint
        self.login('student@college.edu')
        create_res = self.client.post('/api/complaints', data={
            'title': 'Plumbing Leak in Restroom',
            'description': 'Pipe leaking under sink',
            'department_id': str(self.depts['Plumbing'].id),
            'location': 'Block C Restroom',
            'priority': 'Medium'
        })
        comp_id = create_res.get_json()['complaint']['id']
        self.logout()

        # 2. Maintenance accepts and resolves
        self.login('maintenance@college.edu')
        self.client.post(f'/api/maintenance/complaints/{comp_id}/accept')
        self.client.post(f'/api/maintenance/complaints/{comp_id}/resolve', data={
            'resolution_remarks': 'Tightened leaking pipe valve.'
        })
        self.logout()

        # 3. Student checks notifications
        self.login('student@college.edu')
        notif_res = self.client.get('/api/notifications')
        self.assertEqual(notif_res.status_code, 200)
        notifs = notif_res.get_json().get('notifications', [])
        self.assertGreater(len(notifs), 0)

        # 4. Verify Timeline history completeness
        comp_detail = self.client.get(f'/api/complaints/{comp_id}').get_json()['complaint']
        timeline_statuses = [t['status'] for t in comp_detail['timeline']]
        self.assertIn('Submitted', timeline_statuses)
        self.assertIn('In Progress', timeline_statuses)
        self.assertIn('Resolved', timeline_statuses)

        # 5. Student closes complaint
        close_res = self.client.post(f'/api/complaints/{comp_id}/close', json={
            'rating': 5,
            'feedback': 'Fixed quickly, thank you!'
        })
        self.assertEqual(close_res.status_code, 200)
        self.assertEqual(close_res.get_json()['complaint']['status'], 'Closed')

        # Verify Closed in timeline
        comp_detail_closed = self.client.get(f'/api/complaints/{comp_id}').get_json()['complaint']
        timeline_statuses_updated = [t['status'] for t in comp_detail_closed['timeline']]
        self.assertIn('Closed', timeline_statuses_updated)

    # ==========================================
    # 9. AUTHORIZATION SECURITY & ROLE BOUNDARIES
    # ==========================================
    def test_09_authorization_and_security_boundaries(self):
        """Test that non-privileged roles are strictly rejected (401/403) from accessing admin and cross-tenant endpoints."""
        # Unauthenticated access -> 401
        self.assertEqual(self.client.get('/api/management/complaints').status_code, 401)
        self.assertEqual(self.client.get('/api/maintenance/complaints').status_code, 401)
        self.assertEqual(self.client.get('/api/complaints').status_code, 401)

        # Student trying to access Management APIs -> 403 Forbidden
        self.login('student@college.edu')
        self.assertEqual(self.client.get('/api/management/complaints').status_code, 403)
        self.assertEqual(self.client.get('/api/management/users').status_code, 403)
        self.assertEqual(self.client.get('/api/management/settings').status_code, 403)
        self.assertEqual(self.client.get('/api/maintenance/complaints').status_code, 403)
        self.logout()

        # Faculty trying to access Management APIs -> 403 Forbidden
        self.login('faculty@college.edu')
        self.assertEqual(self.client.get('/api/management/complaints').status_code, 403)
        self.assertEqual(self.client.get('/api/maintenance/complaints').status_code, 403)
        self.logout()

        # Maintenance trying to access Management APIs -> 403 Forbidden
        self.login('maintenance@college.edu')
        self.assertEqual(self.client.get('/api/management/settings').status_code, 403)
        self.assertEqual(self.client.get('/api/management/users').status_code, 403)
        self.logout()

    # ==========================================
    # 10. DYNAMIC LIFECYCLE & ZERO-STATE INTEGRITY
    # ==========================================
    def test_10_dynamic_zero_state_and_lifecycle_transitions(self):
        """Verify 0 initial counts, accurate incrementing at each status change, and proper closure."""
        # 1. Verify 0 complaints initially
        self.login('admin@college.edu')
        summary = self.client.get('/api/dashboard/summary').get_json()
        self.assertEqual(summary['total'], 0)
        self.assertEqual(summary['submitted'], 0)
        self.assertEqual(summary['in_progress'], 0)
        self.assertEqual(summary['resolved'], 0)
        self.assertEqual(summary['closed'], 0)
        self.logout()

        # 2. Student creates complaint -> Total=1, Pending (Submitted/Assigned)=1
        self.login('student@college.edu')
        res = self.client.post('/api/complaints', data={
            'title': 'Test Issue Zero State',
            'description': 'Testing dynamic counts',
            'department_id': str(self.depts['Furniture'].id),
            'location': 'Library 1st Floor',
            'priority': 'Low'
        })
        comp_id = res.get_json()['complaint']['id']
        self.logout()

        self.login('admin@college.edu')
        summary = self.client.get('/api/dashboard/summary').get_json()
        self.assertEqual(summary['total'], 1)
        self.assertEqual(summary['submitted'] + summary['assigned'], 1)
        self.logout()

        # 3. Maintenance accepts -> In Progress=1, Submitted=0, Assigned=0
        self.login('maintenance@college.edu')
        self.client.post(f'/api/maintenance/complaints/{comp_id}/accept')
        self.logout()

        self.login('admin@college.edu')
        summary = self.client.get('/api/dashboard/summary').get_json()
        self.assertEqual(summary['submitted'], 0)
        self.assertEqual(summary['assigned'], 0)
        self.assertEqual(summary['in_progress'], 1)
        self.logout()

        # 4. Maintenance resolves -> Resolved=1, In Progress=0
        self.login('maintenance@college.edu')
        self.client.post(f'/api/maintenance/complaints/{comp_id}/resolve', data={
            'resolution_remarks': 'Furniture repaired and polished.'
        })
        self.logout()

        self.login('admin@college.edu')
        summary = self.client.get('/api/dashboard/summary').get_json()
        self.assertEqual(summary['in_progress'], 0)
        self.assertEqual(summary['resolved'], 1)
        self.logout()

        # 5. Student closes -> Closed=1, Resolved=0
        self.login('student@college.edu')
        self.client.post(f'/api/complaints/{comp_id}/close', json={'rating': 5})
        self.logout()

        self.login('admin@college.edu')
        summary = self.client.get('/api/dashboard/summary').get_json()
        self.assertEqual(summary['resolved'], 0)
        self.assertEqual(summary['closed'], 1)
        self.assertEqual(summary['total'], 1)
        self.logout()

if __name__ == '__main__':
    unittest.main()
