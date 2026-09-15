"""
Prompt 9 Automated Test Suite: Flexible Admin and Maintenance User Management
Covers the exact 18-step scenario:
1. Login as management.
2. Open User Management.
3. Edit admin name/email.
4. Logout.
5. Login using the new management email.
6. Create a new maintenance employee.
7. Assign department = Electrical.
8. Login as that maintenance employee.
9. Create/assign an Electrical complaint.
10. Management changes the employee's department.
11. Verify historical complaints remain intact.
12. Create a replacement Electrical employee.
13. Disable the old employee.
14. Reassign old employee's active complaints.
15. Verify the new employee receives notifications.
16. Verify the old employee cannot login.
17. Verify management cannot deactivate the last active management account.
18. Verify no hard-coded email is used for authorization.
"""

import unittest
import os
import io
import json
import uuid
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash

os.environ['FLASK_ENV'] = 'testing'
os.environ['DATABASE_URL'] = 'sqlite:///:memory:'

from app import create_app
from extensions import db
from models import (
    User, Department, Complaint, StatusLog, 
    Notification, AuditLog, EscalationLog, SystemSetting
)

class Prompt9UserManagementTestSuite(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
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
        self._seed_data()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    def _seed_data(self):
        # Departments
        self.dept_elec = Department(name='Electrical', description='Power & lighting', is_active=True)
        self.dept_plumb = Department(name='Plumbing', description='Water & drainage', is_active=True)
        db.session.add_all([self.dept_elec, self.dept_plumb])
        db.session.commit()

        # Seed initial admin & student
        self.admin = User(name='Campus Administrator', email='admin@college.edu', role='management', password_hash=self.SHARED_HASH)
        self.student = User(name='Student Alice', email='student@college.edu', role='student', password_hash=self.SHARED_HASH)
        db.session.add_all([self.admin, self.student])
        db.session.commit()

    def _login(self, email, password=None):
        pwd = password or self.SHARED_PASSWORD
        return self.client.post('/api/auth/login', json={'email': email, 'password': pwd})

    def test_complete_18_step_scenario(self):
        """Executes the full 18-step lifecycle test for dynamic user & maintenance management."""
        
        # 1. Login as management
        login_res = self._login('admin@college.edu')
        self.assertEqual(login_res.status_code, 200)
        self.assertTrue(login_res.get_json()['success'])
        self.assertEqual(login_res.get_json()['user']['role'], 'management')

        # 2. Open User Management
        users_res = self.client.get('/api/management/users')
        self.assertEqual(users_res.status_code, 200)
        mgmt_res = self.client.get('/api/management/users/management')
        self.assertEqual(mgmt_res.status_code, 200)
        self.assertGreaterEqual(len(mgmt_res.get_json()['users']), 1)

        # 3. Edit admin name/email
        edit_res = self.client.patch(f'/api/management/users/{self.admin.id}', json={
            'name': 'Chief Campus Administrator',
            'email': 'chief.admin@college.edu',
            'phone': '+91 9876500001'
        })
        self.assertEqual(edit_res.status_code, 200)
        db.session.refresh(self.admin)
        self.assertEqual(self.admin.email, 'chief.admin@college.edu')
        self.assertEqual(self.admin.name, 'Chief Campus Administrator')

        # Check AuditLog for admin edit
        log = AuditLog.query.filter_by(entity_id=str(self.admin.id), action='Management user edited').first()
        self.assertIsNotNone(log)

        # 4. Logout
        logout_res = self.client.post('/api/auth/logout')
        self.assertEqual(logout_res.status_code, 200)

        # 5. Login using the new management email
        login_new_res = self._login('chief.admin@college.edu')
        self.assertEqual(login_new_res.status_code, 200)
        self.assertEqual(login_new_res.get_json()['user']['email'], 'chief.admin@college.edu')
        self.assertIsNotNone(login_new_res.get_json()['user']['last_login'])

        # 6 & 7. Create a new maintenance employee & assign department = Electrical
        create_tech_res = self.client.post('/api/management/users/maintenance', json={
            'name': 'Ravi Kumar',
            'email': 'ravi.tech@college.edu',
            'phone': '+91 9876500002',
            'department_id': self.dept_elec.id,
            'password': 'Password@123',
            'confirm_password': 'Password@123'
        })
        self.assertEqual(create_tech_res.status_code, 201)
        ravi_data = create_tech_res.get_json()['user']
        ravi_id = ravi_data['id']
        self.assertEqual(ravi_data['role'], 'maintenance')
        self.assertEqual(ravi_data['department'], 'Electrical')

        # Logout management
        self.client.post('/api/auth/logout')

        # 8. Login as that maintenance employee
        tech_login = self._login('ravi.tech@college.edu')
        self.assertEqual(tech_login.status_code, 200)
        self.assertEqual(tech_login.get_json()['user']['role'], 'maintenance')
        self.client.post('/api/auth/logout')

        # 9. Create/assign an Electrical complaint
        # Student creates complaint
        self._login('student@college.edu')
        comp_res = self.client.post('/api/complaints', data={
            'title': 'Lab 1 AC Sparks',
            'description': 'Wires sparking on AC board in Lab 1',
            'department_id': self.dept_elec.id,
            'location': 'Lab 1',
            'priority': 'High'
        })
        self.assertEqual(comp_res.status_code, 201)
        comp_id = comp_res.get_json()['complaint']['id']
        comp = Complaint.query.get(comp_id)
        
        # Ensure it is assigned to Ravi Kumar
        comp.assigned_to = ravi_id
        comp.status = 'In Progress'
        db.session.commit()
        self.client.post('/api/auth/logout')

        # 10. Management changes the employee's department (Electrical -> Plumbing)
        self._login('chief.admin@college.edu')
        dept_change_res = self.client.patch(f'/api/management/users/{ravi_id}', json={
            'department_id': self.dept_plumb.id
        })
        self.assertEqual(dept_change_res.status_code, 200)
        ravi_user = User.query.get(ravi_id)
        self.assertEqual(ravi_user.department, 'Plumbing')
        self.assertEqual(ravi_user.department_id, self.dept_plumb.id)

        # Check AuditLog for department change
        audit_dept = AuditLog.query.filter_by(entity_id=str(ravi_id), action='Maintenance department changed').first()
        self.assertIsNotNone(audit_dept)

        # 11. Verify historical complaints remain intact
        db.session.refresh(comp)
        self.assertEqual(comp.assigned_to, ravi_id)
        self.assertEqual(comp.department.name, 'Electrical')

        # 12. Create a replacement Electrical employee
        create_rep_res = self.client.post('/api/management/users/maintenance', json={
            'name': 'Vikram Singh',
            'email': 'vikram.tech@college.edu',
            'phone': '+91 9876500003',
            'department_id': self.dept_elec.id,
            'password': 'Password@123',
            'confirm_password': 'Password@123'
        })
        self.assertEqual(create_rep_res.status_code, 201)
        vikram_id = create_rep_res.get_json()['user']['id']

        # 13 & 14. Disable the old employee and reassign active complaints
        # Get active complaints
        active_comps_res = self.client.get(f'/api/management/users/{ravi_id}/active-complaints')
        self.assertEqual(active_comps_res.status_code, 200)
        self.assertEqual(len(active_comps_res.get_json()['complaints']), 1)

        # Disable and reassign all complaints to Vikram Singh
        disable_reassign_res = self.client.post(f'/api/management/users/{ravi_id}/disable-and-reassign', json={
            'new_assigned_to': vikram_id,
            'reason': 'Transferred to Plumbing; Electrical tickets moved to Vikram Singh'
        })
        self.assertEqual(disable_reassign_res.status_code, 200)

        # 15. Verify new employee receives notifications & StatusLog / AuditLog records
        db.session.refresh(ravi_user)
        self.assertFalse(ravi_user.is_active)
        db.session.refresh(comp)
        self.assertEqual(comp.assigned_to, vikram_id)

        # Verify notification for Vikram
        notif = Notification.query.filter_by(user_id=vikram_id).first()
        self.assertIsNotNone(notif)
        self.assertIn('reassigned', notif.title.lower())

        # Verify StatusLog
        status_log = StatusLog.query.filter(StatusLog.complaint_id == comp.id, StatusLog.comments.like('%Vikram Singh%')).first()
        self.assertIsNotNone(status_log)

        # Verify AuditLog
        reassign_audit = AuditLog.query.filter_by(entity_id=str(comp.id), action='Complaint reassigned').first()
        self.assertIsNotNone(reassign_audit)

        self.client.post('/api/auth/logout')

        # 16. Verify the old employee cannot login
        ravi_login_attempt = self._login('ravi.tech@college.edu')
        self.assertEqual(ravi_login_attempt.status_code, 403)
        self.assertIn('inactive', ravi_login_attempt.get_json()['message'].lower())

        # 17. Verify management cannot deactivate the last active management account
        self._login('chief.admin@college.edu')
        # Attempt to deactivate Chief Administrator (the only active management account)
        self_deact_res = self.client.patch(f'/api/management/users/{self.admin.id}/status', json={'is_active': False})
        self.assertEqual(self_deact_res.status_code, 400)
        self.assertIn('at least one active management account', self_deact_res.get_json()['message'].lower())

        # Now create a second management account
        create_sec_mgmt = self.client.post('/api/management/users/management', json={
            'name': 'Assistant Dean',
            'email': 'asst.dean@college.edu',
            'phone': '+91 9876500004',
            'password': 'Password@123',
            'confirm_password': 'Password@123'
        })
        self.assertEqual(create_sec_mgmt.status_code, 201)
        asst_id = create_sec_mgmt.get_json()['user']['id']

        # Now that 2 management accounts exist, deactivating one is permitted
        deact_first_admin = self.client.patch(f'/api/management/users/{self.admin.id}/status', json={'is_active': False})
        self.assertEqual(deact_first_admin.status_code, 200)
        self.client.post('/api/auth/logout')

        # 18. Verify no hard-coded email is used for authorization
        # Login with newly created management user
        asst_login = self._login('asst.dean@college.edu')
        self.assertEqual(asst_login.status_code, 200)

        # Newly created management user can access all management endpoints
        settings_res = self.client.get('/api/management/settings')
        self.assertEqual(settings_res.status_code, 200)
        reports_res = self.client.get('/api/management/reports')
        self.assertEqual(reports_res.status_code, 200)

        # Reset password test
        pwd_reset_res = self.client.post(f'/api/management/users/{vikram_id}/password', json={
            'new_password': 'NewSecurePass@456',
            'confirm_password': 'NewSecurePass@456'
        })
        self.assertEqual(pwd_reset_res.status_code, 200)
        self.client.post('/api/auth/logout')

        # Login Vikram with new password
        vikram_login = self._login('vikram.tech@college.edu', 'NewSecurePass@456')
        self.assertEqual(vikram_login.status_code, 200)

if __name__ == '__main__':
    unittest.main()
