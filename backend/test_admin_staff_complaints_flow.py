import os
import sys
import io
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ['TESTING'] = 'true'
os.environ['FLASK_ENV'] = 'testing'

from app import create_app
from extensions import db
from models.user import User
from models.department import Department
from models.complaint import Complaint
from models.notification import Notification

class TestAdminStaffComplaintsFlow(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.app.config['WTF_CSRF_ENABLED'] = False
        self.client = self.app.test_client()
        self.ctx = self.app.app_context()
        self.ctx.push()
        db.create_all()

    def tearDown(self):
        db.session.remove()
        self.ctx.pop()

    def test_complete_admin_staff_complaints_flow(self):
        # 1. Login as Admin
        admin_login = self.client.post('/api/auth/login', json={
            'email': 'admin@college.edu',
            'password': 'Admin@123'
        })
        self.assertEqual(admin_login.status_code, 200, f"Admin login failed: {admin_login.get_json()}")

        # 2. Add New Maintenance Staff for Plumbing
        plumb_dept = Department.query.filter_by(name='Plumbing').first()
        self.assertIsNotNone(plumb_dept)

        staff_data = {
            'name': 'Mario Plumber',
            'email': 'mario.plumber@college.edu',
            'password': 'Password@123',
            'confirm_password': 'Password@123',
            'phone': '9876543210',
            'department_id': plumb_dept.id
        }
        res_create = self.client.post('/api/management/users/maintenance', json=staff_data)
        self.assertEqual(res_create.status_code, 201, f"Staff creation failed: {res_create.get_json()}")
        created_user = res_create.get_json().get('user')
        self.assertEqual(created_user['email'], 'mario.plumber@college.edu')
        self.assertEqual(created_user['role'], 'maintenance')
        self.assertEqual(created_user['department_id'], plumb_dept.id)

        # 3. Verify Staff shows in /api/management/staff/performance
        res_staff_perf = self.client.get('/api/management/staff/performance')
        self.assertEqual(res_staff_perf.status_code, 200)
        staff_list = res_staff_perf.get_json().get('staff', [])
        mario = next((s for s in staff_list if s['email'] == 'mario.plumber@college.edu'), None)
        self.assertIsNotNone(mario, "Created staff not found in staff performance list")
        self.assertTrue(mario['is_active'])

        # 4. Login as Student and submit a Plumbing complaint
        student_login = self.client.post('/api/auth/login', json={
            'email': 'student@college.edu',
            'password': 'Student@123'
        })
        self.assertEqual(student_login.status_code, 200)

        complaint_payload = {
            'title': 'Leaking Water Pipe in Block A',
            'description': 'The pipe under the second floor restroom sink is severely leaking water onto the floor.',
            'department_id': str(plumb_dept.id),
            'location': 'Block A - 2nd Floor Restroom',
            'priority': 'High'
        }
        res_comp = self.client.post('/api/complaints', data=complaint_payload, content_type='multipart/form-data')
        self.assertEqual(res_comp.status_code, 201, f"Complaint creation failed: {res_comp.get_json()}")
        comp_data = res_comp.get_json().get('complaint')
        self.assertIsNotNone(comp_data)
        self.assertEqual(comp_data['status'], 'Assigned')
        self.assertEqual(comp_data['assigned_to'], mario['id'])

        # 5. Verify Admin received Notification in database
        self.client.post('/api/auth/login', json={'email': 'admin@college.edu', 'password': 'Admin@123'})
        res_admin_notifs = self.client.get('/api/notifications')
        self.assertEqual(res_admin_notifs.status_code, 200)
        admin_notifs = res_admin_notifs.get_json().get('notifications', [])
        self.assertTrue(len(admin_notifs) > 0, "Admin did not receive notifications")
        comp_notif = next((n for n in admin_notifs if comp_data['complaint_number'] in (n.get('title') or '') or comp_data['complaint_number'] in (n.get('message') or '')), None)
        self.assertIsNotNone(comp_notif, f"Admin notification for {comp_data['complaint_number']} not found")

        # 6. Verify Assigned Staff (Mario) received Notification in database and sees ticket in his complaints
        self.client.post('/api/auth/login', json={'email': 'mario.plumber@college.edu', 'password': 'Password@123'})
        res_mario_notifs = self.client.get('/api/notifications')
        self.assertEqual(res_mario_notifs.status_code, 200)
        mario_notifs = res_mario_notifs.get_json().get('notifications', [])
        self.assertTrue(len(mario_notifs) > 0, "Mario did not receive notifications")

        res_mario_complaints = self.client.get('/api/maintenance/complaints')
        self.assertEqual(res_mario_complaints.status_code, 200)
        mario_complaints = res_mario_complaints.get_json().get('complaints', [])
        found_in_mario = next((c for c in mario_complaints if c['id'] == comp_data['id']), None)
        self.assertIsNotNone(found_in_mario, "Complaint not found in Mario's maintenance dashboard")

        # 7. Login as Admin and test Removing / Deleting Staff
        self.client.post('/api/auth/login', json={'email': 'admin@college.edu', 'password': 'Admin@123'})
        res_delete = self.client.delete(f'/api/management/users/{mario["id"]}')
        self.assertEqual(res_delete.status_code, 200, f"Staff deletion failed: {res_delete.get_json()}")

        # Verify staff was removed and ticket unassigned safely
        refreshed_comp = db.session.get(Complaint, comp_data['id'])
        self.assertIsNotNone(refreshed_comp)
        assert refreshed_comp is not None
        self.assertIsNone(refreshed_comp.assigned_to)
        self.assertEqual(refreshed_comp.status, 'Submitted')

        print("\nAll Admin Staff Management and Complaint Routing tests PASSED successfully!")

if __name__ == '__main__':
    unittest.main()
