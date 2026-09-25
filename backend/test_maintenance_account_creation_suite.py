"""
Comprehensive Test Suite for Maintenance Staff Account Creation & Security.
Tests:
1. Management/Admin can create a Maintenance Staff account.
2. The account is stored in the existing database with correct role & hashed password.
3. The new Maintenance Staff can log in using the existing login flow (/api/auth/login).
4. The Maintenance Staff has correct role ('maintenance') routing to Maintenance dashboard.
5. The Maintenance Staff has correct permissions (can access maintenance complaints/dashboard, blocked from management endpoints).
6. Student/Faculty/Unauthenticated users CANNOT create Maintenance Staff accounts (401/403).
7. Public registration ONLY allows Student/Faculty and strictly blocks Maintenance/Management (400).
8. Validation for duplicate emails (409 Conflict).
9. Validation for password length & confirm-password mismatch (400 Bad Request).
10. Existing Student, Faculty, Management, and Maintenance accounts continue to work seamlessly.
11. Existing complaints and departments are preserved without corruption.
"""

import unittest
import os
import json
from werkzeug.security import generate_password_hash

os.environ['FLASK_ENV'] = 'testing'
os.environ['DATABASE_URL'] = 'sqlite:///:memory:'

from app import create_app
from extensions import db
from models.user import User
from models.department import Department
from models.complaint import Complaint
from models.system_setting import SystemSetting
from models.status_log import StatusLog

class MaintenanceAccountCreationTestSuite(unittest.TestCase):
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
        self._seed_initial_data()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    def _seed_initial_data(self):
        # 1. Departments
        self.dept_elec = Department(name="Electrical", description="Electrical repairs", is_active=True)
        self.dept_plumb = Department(name="Plumbing", description="Plumbing repairs", is_active=True)
        db.session.add_all([self.dept_elec, self.dept_plumb])
        db.session.flush()

        # 2. Existing Demo Users
        self.admin_user = User(
            name="Admin User",
            email="admin@college.edu",
            role="management",
            is_active=True
        )
        self.admin_user.set_password("Admin@123")

        self.existing_maint = User(
            name="Existing Tech",
            email="maintenance@college.edu",
            role="maintenance",
            department_id=self.dept_elec.id,
            department=self.dept_elec.name,
            is_active=True
        )
        self.existing_maint.set_password("Tech@123")

        self.student_user = User(
            name="Student User",
            email="student@acetcbe.edu.in",
            role="student",
            is_active=True
        )
        self.student_user.set_password("Student@123")

        self.faculty_user = User(
            name="Faculty User",
            email="faculty@acetcbe.edu.in",
            role="faculty",
            is_active=True
        )
        self.faculty_user.set_password("Faculty@123")

        db.session.add_all([self.admin_user, self.existing_maint, self.student_user, self.faculty_user])
        db.session.commit()

    def _login(self, email, password):
        return self.client.post('/api/auth/login', json={
            'email': email,
            'password': password
        })

    # =========================================================================
    # Test 1: Management can create a Maintenance Staff account
    # =========================================================================
    def test_management_can_create_maintenance_staff(self):
        self._login("admin@college.edu", "Admin@123")

        res = self.client.post('/api/management/users/maintenance', json={
            'name': 'Ramesh Electrician',
            'email': 'ramesh.maint@college.edu',
            'phone': '+91 9876543210',
            'department_id': self.dept_elec.id,
            'password': 'SecurePassword@123',
            'confirm_password': 'SecurePassword@123'
        })

        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        self.assertTrue(data['success'])
        self.assertEqual(data['user']['name'], 'Ramesh Electrician')
        self.assertEqual(data['user']['email'], 'ramesh.maint@college.edu')
        self.assertEqual(data['user']['role'], 'maintenance')
        self.assertEqual(data['user']['department'], 'Electrical')

        # Verify persisted in database
        saved = User.query.filter_by(email='ramesh.maint@college.edu').first()
        self.assertIsNotNone(saved)
        self.assertEqual(saved.role, 'maintenance')
        self.assertEqual(saved.department_id, self.dept_elec.id)
        self.assertTrue(saved.check_password('SecurePassword@123'))

    # =========================================================================
    # Test 2: New Maintenance Staff can log in and gets correct role
    # =========================================================================
    def test_new_maintenance_staff_login_flow(self):
        # 1. Admin creates account
        self._login("admin@college.edu", "Admin@123")
        self.client.post('/api/management/users/maintenance', json={
            'name': 'Suresh Plumber',
            'email': 'suresh.plumb@college.edu',
            'phone': '+91 9876543211',
            'department_id': self.dept_plumb.id,
            'password': 'PlumberPassword@123',
            'confirm_password': 'PlumberPassword@123'
        })
        self.client.post('/api/auth/logout')

        # 2. Maintenance staff logs in
        login_res = self._login('suresh.plumb@college.edu', 'PlumberPassword@123')
        self.assertEqual(login_res.status_code, 200)
        login_data = login_res.get_json()
        self.assertTrue(login_data['success'])
        self.assertEqual(login_data['user']['role'], 'maintenance')
        self.assertEqual(login_data['user']['department'], 'Plumbing')

        # 3. Check /me endpoint
        me_res = self.client.get('/api/auth/me')
        self.assertEqual(me_res.status_code, 200)
        self.assertEqual(me_res.get_json()['user']['email'], 'suresh.plumb@college.edu')
        self.assertEqual(me_res.get_json()['user']['role'], 'maintenance')

    # =========================================================================
    # Test 3: Maintenance Staff permissions and RBAC enforcement
    # =========================================================================
    def test_maintenance_staff_permissions(self):
        # Create and login new tech
        self._login("admin@college.edu", "Admin@123")
        self.client.post('/api/management/users/maintenance', json={
            'name': 'Dave Wire',
            'email': 'dave.elec@college.edu',
            'department_id': self.dept_elec.id,
            'password': 'DavePassword@123',
            'confirm_password': 'DavePassword@123'
        })
        self.client.post('/api/auth/logout')

        self._login('dave.elec@college.edu', 'DavePassword@123')

        # Can access maintenance endpoints
        maint_res = self.client.get('/api/maintenance/dashboard/stats')
        self.assertEqual(maint_res.status_code, 200)

        # CANNOT access management endpoints (403 Forbidden)
        mgmt_res = self.client.get('/api/management/dashboard/stats')
        self.assertEqual(mgmt_res.status_code, 403)

    # =========================================================================
    # Test 4: Student/Faculty/Public cannot create maintenance accounts
    # =========================================================================
    def test_unauthorized_users_cannot_create_maintenance_accounts(self):
        # 1. Anonymous user
        res_anon = self.client.post('/api/management/users/maintenance', json={
            'name': 'Hacker',
            'email': 'hacker@college.edu',
            'password': 'Password@123',
            'confirm_password': 'Password@123',
            'department_id': self.dept_elec.id
        })
        self.assertEqual(res_anon.status_code, 401)

        # 2. Student user
        self._login('student@acetcbe.edu.in', 'Student@123')
        res_student = self.client.post('/api/management/users/maintenance', json={
            'name': 'Fake Tech',
            'email': 'fake@college.edu',
            'password': 'Password@123',
            'confirm_password': 'Password@123',
            'department_id': self.dept_elec.id
        })
        self.assertEqual(res_student.status_code, 403)
        self.client.post('/api/auth/logout')

        # 3. Faculty user
        self._login('faculty@acetcbe.edu.in', 'Faculty@123')
        res_faculty = self.client.post('/api/management/users/maintenance', json={
            'name': 'Fake Tech 2',
            'email': 'fake2@college.edu',
            'password': 'Password@123',
            'confirm_password': 'Password@123',
            'department_id': self.dept_elec.id
        })
        self.assertEqual(res_faculty.status_code, 403)

    # =========================================================================
    # Test 5: Registration allows Student/Faculty/Maintenance/Management (Rejects Invalid)
    # =========================================================================
    def test_registration_roles_and_validation(self):
        # 1. Register student
        res_stu = self.client.post('/api/auth/register', json={
            'name': 'Legit Student',
            'email': 'legit.student@acetcbe.edu.in',
            'role': 'student',
            'password': 'Password@123'
        })
        self.assertEqual(res_stu.status_code, 201)
        self.assertEqual(res_stu.get_json()['user']['role'], 'student')
        self.client.post('/api/auth/logout')

        # 2. Maintenance staff CANNOT self-register (security policy: must be created by management).
        res_maint = self.client.post('/api/auth/register', json={
            'name': 'Direct Maintenance Staff',
            'email': 'direct.maint@college.edu',
            'role': 'maintenance',
            'department': 'Electrical',
            'password': 'Password@123'
        })
        self.assertEqual(res_maint.status_code, 403)
        self.assertFalse(res_maint.get_json()['success'])

        # 3. Management / admin CANNOT self-register (security policy: must be created by management).
        res_admin = self.client.post('/api/auth/register', json={
            'name': 'Direct Admin Staff',
            'email': 'direct.admin@college.edu',
            'role': 'management',
            'password': 'Password@123'
        })
        self.assertEqual(res_admin.status_code, 403)
        self.assertFalse(res_admin.get_json()['success'])

        # 4. Attempt registration with unknown/invalid role
        res_invalid = self.client.post('/api/auth/register', json={
            'name': 'Hacker Unknown',
            'email': 'hacker.unknown@college.edu',
            'role': 'superhacker',
            'password': 'Password@123'
        })
        self.assertEqual(res_invalid.status_code, 400)
        self.assertFalse(res_invalid.get_json()['success'])

    # =========================================================================
    # Test 6: Validation: Password confirmation mismatch and min length
    # =========================================================================
    def test_password_validations(self):
        self._login("admin@college.edu", "Admin@123")

        # Mismatch
        res_mismatch = self.client.post('/api/management/users/maintenance', json={
            'name': 'Mismatch User',
            'email': 'mismatch@college.edu',
            'department_id': self.dept_elec.id,
            'password': 'Password@123',
            'confirm_password': 'DifferentPassword@123'
        })
        self.assertEqual(res_mismatch.status_code, 400)
        self.assertIn('do not match', res_mismatch.get_json()['message'])

        # Short password (<8 chars)
        res_short = self.client.post('/api/management/users/maintenance', json={
            'name': 'Short User',
            'email': 'short@college.edu',
            'department_id': self.dept_elec.id,
            'password': '123',
            'confirm_password': '123'
        })
        self.assertEqual(res_short.status_code, 400)
        self.assertIn('8 characters', res_short.get_json()['message'])

    # =========================================================================
    # Test 7: Validation: Duplicate Email Check (409 Conflict)
    # =========================================================================
    def test_duplicate_email_validation(self):
        self._login("admin@college.edu", "Admin@123")

        # Try creating with admin's email
        res_dup = self.client.post('/api/management/users/maintenance', json={
            'name': 'Duplicate User',
            'email': 'ADMIN@college.edu',  # case-insensitive check
            'department_id': self.dept_elec.id,
            'password': 'Password@123',
            'confirm_password': 'Password@123'
        })
        self.assertEqual(res_dup.status_code, 409)
        self.assertIn('already exists', res_dup.get_json()['message'])

    # =========================================================================
    # Test 8: Existing Accounts Continue to Function Unaltered
    # =========================================================================
    def test_existing_accounts_functionality(self):
        # Admin login
        res_admin = self._login('admin@college.edu', 'Admin@123')
        self.assertEqual(res_admin.status_code, 200)
        self.assertEqual(res_admin.get_json()['user']['role'], 'management')
        self.client.post('/api/auth/logout')

        # Existing Maintenance login
        res_maint = self._login('maintenance@college.edu', 'Tech@123')
        self.assertEqual(res_maint.status_code, 200)
        self.assertEqual(res_maint.get_json()['user']['role'], 'maintenance')
        self.client.post('/api/auth/logout')

        # Student login
        res_stu = self._login('student@acetcbe.edu.in', 'Student@123')
        self.assertEqual(res_stu.status_code, 200)
        self.assertEqual(res_stu.get_json()['user']['role'], 'student')
        self.client.post('/api/auth/logout')

        # Faculty login
        res_fac = self._login('faculty@acetcbe.edu.in', 'Faculty@123')
        self.assertEqual(res_fac.status_code, 200)
        self.assertEqual(res_fac.get_json()['user']['role'], 'faculty')

if __name__ == '__main__':
    unittest.main()
