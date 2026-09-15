"""
Prompt 11 Automated Test Suite: Correct Maintenance Role Architecture
Covers the exact 22-step scenario:
1. Register Student.
2. Register Faculty.
3. Login Student.
4. Login Faculty.
5. Login Maintenance using maintenance@college.edu.
6. Verify Maintenance Dashboard opens.
7. Create Electrical complaint as Student.
8. Verify Maintenance receives notification.
9. Verify Electrical complaint appears.
10. Create Plumbing complaint.
11. Verify Plumbing complaint appears in same Maintenance account.
12. Select Electrical filter.
13. Verify only Electrical complaints appear.
14. Select Plumbing filter.
15. Verify only Plumbing complaints appear.
16. Select All Departments.
17. Verify all complaints appear.
18. Maintenance resolves an Electrical complaint.
19. Verify Student receives notification.
20. Management sees the same complaint.
21. Verify there are NOT separate Electrical/Plumbing/Civil maintenance login accounts.
22. Verify only four roles exist: student, faculty, maintenance, management.
"""

import unittest
import os
import io
import json
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
from models.user import VALID_ROLES

class Prompt11MaintenanceArchitectureTestSuite(unittest.TestCase):
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
        SystemSetting.init_default_settings()
        self._seed_data()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    def _seed_data(self):
        # 7 Departments
        self.dept_elec = Department(name='Electrical', description='Power & lighting', is_active=True)
        self.dept_plumb = Department(name='Plumbing', description='Water & drainage', is_active=True)
        self.dept_civil = Department(name='Civil', description='Structural & masonry', is_active=True)
        self.dept_house = Department(name='Housekeeping', description='Cleaning & custodial', is_active=True)
        self.dept_furn = Department(name='Furniture', description='Desks & carpentry', is_active=True)
        self.dept_it = Department(name='IT / Network', description='LAN & computers', is_active=True)
        self.dept_other = Department(name='Other', description='General facilities', is_active=True)
        db.session.add_all([
            self.dept_elec, self.dept_plumb, self.dept_civil,
            self.dept_house, self.dept_furn, self.dept_it, self.dept_other
        ])
        db.session.commit()

        # Seed Central Management & Central Maintenance accounts
        self.admin = User(name='Campus Administrator', email='admin@college.edu', role='management', password_hash=self.SHARED_HASH)
        self.maintenance = User(name='Campus Maintenance Helpdesk', email='maintenance@college.edu', role='maintenance', password_hash=self.SHARED_HASH)
        db.session.add_all([self.admin, self.maintenance])
        db.session.commit()

    def _login(self, email, password=None):
        pwd = password or self.SHARED_PASSWORD
        return self.client.post('/api/auth/login', json={'email': email, 'password': pwd})

    def test_complete_22_step_scenario(self):
        """Executes the full 22-step lifecycle test for centralized maintenance role architecture."""

        # 1. Register Student
        reg_student_res = self.client.post('/api/auth/register', json={
            'name': 'Student Alice',
            'email': 'student.alice@college.edu',
            'password': 'Password@123',
            'role': 'student',
            'employee_or_student_id': 'STU-1001'
        })
        self.assertEqual(reg_student_res.status_code, 201)
        student_id = reg_student_res.get_json()['user']['id']

        # 2. Register Faculty
        reg_faculty_res = self.client.post('/api/auth/register', json={
            'name': 'Prof. Bob',
            'email': 'faculty.bob@college.edu',
            'password': 'Password@123',
            'role': 'faculty',
            'employee_or_student_id': 'FAC-2002'
        })
        self.assertEqual(reg_faculty_res.status_code, 201)
        faculty_id = reg_faculty_res.get_json()['user']['id']

        # 3. Login Student
        login_student = self._login('student.alice@college.edu')
        self.assertEqual(login_student.status_code, 200)
        self.assertEqual(login_student.get_json()['user']['role'], 'student')
        self.client.post('/api/auth/logout')

        # 4. Login Faculty
        login_faculty = self._login('faculty.bob@college.edu')
        self.assertEqual(login_faculty.status_code, 200)
        self.assertEqual(login_faculty.get_json()['user']['role'], 'faculty')
        self.client.post('/api/auth/logout')

        # 5. Login Maintenance using maintenance@college.edu
        login_maint = self._login('maintenance@college.edu')
        self.assertEqual(login_maint.status_code, 200)
        self.assertEqual(login_maint.get_json()['user']['role'], 'maintenance')

        # 6. Verify Maintenance Dashboard opens
        stats_res = self.client.get('/api/maintenance/dashboard/stats')
        self.assertEqual(stats_res.status_code, 200)
        stats = stats_res.get_json()['stats']
        self.assertIn('total_complaints', stats)
        self.assertIn('by_department', stats)
        self.client.post('/api/auth/logout')

        # 7. Create Electrical complaint as Student
        self._login('student.alice@college.edu')
        comp_elec_res = self.client.post('/api/complaints', data={
            'title': 'Classroom Light Flickering',
            'description': 'Tube lights blinking in Room 101',
            'department_id': self.dept_elec.id,
            'location': 'Block A Room 101',
            'priority': 'High'
        })
        self.assertEqual(comp_elec_res.status_code, 201)
        elec_comp_id = comp_elec_res.get_json()['complaint']['id']
        elec_comp_num = comp_elec_res.get_json()['complaint']['complaint_number']
        self.client.post('/api/auth/logout')

        # 8 & 9. Login Maintenance and verify notification & Electrical complaint appears
        self._login('maintenance@college.edu')
        notifs_res = self.client.get('/api/notifications')
        self.assertEqual(notifs_res.status_code, 200)
        notifs = notifs_res.get_json()['notifications']
        self.assertTrue(any(elec_comp_num in n['message'] for n in notifs))

        comps_all_res = self.client.get('/api/maintenance/complaints')
        self.assertEqual(comps_all_res.status_code, 200)
        complaints_list = comps_all_res.get_json()['complaints']
        self.assertEqual(len(complaints_list), 1)
        self.assertEqual(complaints_list[0]['id'], elec_comp_id)
        self.assertEqual(complaints_list[0]['department'], 'Electrical')
        self.client.post('/api/auth/logout')

        # 10 & 11. Create Plumbing complaint as Faculty and verify appears in same Maintenance account
        self._login('faculty.bob@college.edu')
        comp_plumb_res = self.client.post('/api/complaints', data={
            'title': 'Faculty Restroom Tap Leaking',
            'description': 'Constant water dripping from sink tap',
            'department_id': self.dept_plumb.id,
            'location': 'Faculty Lounge Restroom',
            'priority': 'Medium'
        })
        self.assertEqual(comp_plumb_res.status_code, 201)
        plumb_comp_id = comp_plumb_res.get_json()['complaint']['id']
        plumb_comp_num = comp_plumb_res.get_json()['complaint']['complaint_number']
        self.client.post('/api/auth/logout')

        # Login Maintenance: both Electrical & Plumbing must be visible
        self._login('maintenance@college.edu')
        maint_list_res = self.client.get('/api/maintenance/complaints')
        self.assertEqual(maint_list_res.status_code, 200)
        self.assertEqual(len(maint_list_res.get_json()['complaints']), 2)

        # 12 & 13. Select Electrical filter -> only Electrical complaints appear
        elec_filter_res = self.client.get(f'/api/maintenance/complaints?department_id={self.dept_elec.id}')
        self.assertEqual(elec_filter_res.status_code, 200)
        elec_items = elec_filter_res.get_json()['complaints']
        self.assertEqual(len(elec_items), 1)
        self.assertEqual(elec_items[0]['id'], elec_comp_id)
        self.assertEqual(elec_items[0]['department'], 'Electrical')

        # 14 & 15. Select Plumbing filter -> only Plumbing complaints appear
        plumb_filter_res = self.client.get(f'/api/maintenance/complaints?department_id={self.dept_plumb.id}')
        self.assertEqual(plumb_filter_res.status_code, 200)
        plumb_items = plumb_filter_res.get_json()['complaints']
        self.assertEqual(len(plumb_items), 1)
        self.assertEqual(plumb_items[0]['id'], plumb_comp_id)
        self.assertEqual(plumb_items[0]['department'], 'Plumbing')

        # 16 & 17. Select All Departments -> all complaints appear
        all_depts_res = self.client.get('/api/maintenance/complaints')
        self.assertEqual(all_depts_res.status_code, 200)
        self.assertEqual(len(all_depts_res.get_json()['complaints']), 2)

        # 18. Maintenance resolves an Electrical complaint
        resolve_res = self.client.patch(f'/api/maintenance/complaints/{elec_comp_id}/resolve', data={
            'resolution_remarks': 'Replaced ballast and fitted new LED tube.'
        })
        self.assertEqual(resolve_res.status_code, 200)
        self.assertEqual(resolve_res.get_json()['complaint']['status'], 'Resolved')
        self.client.post('/api/auth/logout')

        # 19. Verify Student receives notification
        self._login('student.alice@college.edu')
        student_notifs_res = self.client.get('/api/notifications')
        self.assertEqual(student_notifs_res.status_code, 200)
        student_notifs = student_notifs_res.get_json()['notifications']
        self.assertTrue(any(elec_comp_num in n['message'] and 'resolved' in n['message'].lower() for n in student_notifs))
        self.client.post('/api/auth/logout')

        # 20. Management sees the same complaint
        self._login('admin@college.edu')
        mgmt_comp_res = self.client.get(f'/api/management/complaints/{elec_comp_id}')
        self.assertEqual(mgmt_comp_res.status_code, 200)
        self.assertEqual(mgmt_comp_res.get_json()['complaint']['status'], 'Resolved')
        self.client.post('/api/auth/logout')

        # 21. Verify there are NOT separate Electrical/Plumbing/Civil maintenance login accounts
        self.assertIsNone(User.query.filter_by(email='electrical@college.edu').first())
        self.assertIsNone(User.query.filter_by(email='plumbing@college.edu').first())
        self.assertIsNone(User.query.filter_by(email='civil@college.edu').first())

        # 22. Verify only four primary roles exist in the system
        expected_roles = {'student', 'faculty', 'maintenance', 'management'}
        self.assertEqual(VALID_ROLES, expected_roles)

if __name__ == '__main__':
    unittest.main()
