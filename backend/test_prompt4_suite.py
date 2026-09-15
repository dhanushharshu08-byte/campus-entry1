import io
import sys
import unittest
from app import create_app
from config import Config
from extensions import db
from models.user import User
from models.department import Department
from models.complaint import Complaint
from models.status_log import StatusLog
from models.notification import Notification

class TestPrompt4Suite(unittest.TestCase):
    def setUp(self):
        class TestConfig(Config):
            TESTING = True
            SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
            WTF_CSRF_ENABLED = False

        self.app = create_app(TestConfig)
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()
        db.create_all()
        self._seed_data()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def _seed_data(self):
        # Create Departments
        elec_dept = Department(name="Electrical", description="Electrical grid and fixtures")
        plumb_dept = Department(name="Plumbing", description="Water supply and drainage")
        civil_dept = Department(name="Civil", description="Structural and carpentry work")
        db.session.add_all([elec_dept, plumb_dept, civil_dept])
        db.session.commit()

        # Create Users
        student = User(name="Student Test", email="student@college.edu", role="student", employee_or_student_id="STU001")
        student.set_password("Student@123")

        electrician = User(
            name="Ravi Electrician", 
            email="electrician@college.edu", 
            role="maintenance", 
            department_id=elec_dept.id, 
            department="Electrical",
            employee_or_student_id="EMP101"
        )
        electrician.set_password("Tech@123")

        plumber = User(
            name="Suresh Plumber", 
            email="plumber@college.edu", 
            role="maintenance", 
            department_id=plumb_dept.id, 
            department="Plumbing",
            employee_or_student_id="EMP102"
        )
        plumber.set_password("Tech@123")

        management = User(
            name="Admin Management", 
            email="admin@college.edu", 
            role="management", 
            employee_or_student_id="MGT001"
        )
        management.set_password("Admin@123")

        db.session.add_all([student, electrician, plumber, management])
        db.session.commit()

        self.elec_dept_id = elec_dept.id
        self.plumb_dept_id = plumb_dept.id
        self.civil_dept_id = civil_dept.id
        self.electrician_id = electrician.id
        self.plumber_id = plumber.id

    def login(self, email, password):
        return self.client.post('/api/auth/login', json={'email': email, 'password': password})

    def test_auto_assignment_and_maintenance_workflow(self):
        print("\n--- TEST A: Student submits Electrical complaint ---")
        self.login('student@college.edu', 'Student@123')
        
        data = {
            'title': 'Flickering Light in Lab 202',
            'description': 'The fluorescent tubes are blinking continuously.',
            'department_id': str(self.elec_dept_id),
            'location': 'Block A Room 202',
            'priority': 'High',
            'issue_photo': (io.BytesIO(b'dummy_image_data'), 'light.jpg')
        }
        res = self.client.post('/api/complaints', data=data, content_type='multipart/form-data')
        self.assertEqual(res.status_code, 201)
        res_json = res.get_json()
        self.assertTrue(res_json['success'])
        comp = res_json['complaint']
        comp_id = comp['id']
        
        # Verify automatic assignment to electrician
        self.assertEqual(comp['status'], 'Assigned')
        self.assertEqual(comp['assigned_to'], self.electrician_id)
        self.assertIsNotNone(comp['assignee'])
        self.assertEqual(comp['assignee']['email'], 'electrician@college.edu')
        print(f" [PASS] Complaint {comp['complaint_number']} assigned to {comp['assignee']['name']}")

        # Verify notification created for electrician
        notif = Notification.query.filter_by(user_id=self.electrician_id).first()
        self.assertIsNotNone(notif)
        self.assertEqual(notif.type, 'complaint_assigned')
        self.assertEqual(notif.complaint_id, comp_id)
        print(" [PASS] Electrician received complaint_assigned DB notification")

        print("\n--- TEST B: Electrician views dashboard & accepts complaint ---")
        self.login('electrician@college.edu', 'Tech@123')

        # Check stats API
        stats_res = self.client.get('/api/maintenance/dashboard/stats')
        self.assertEqual(stats_res.status_code, 200)
        stats_data = stats_res.get_json()['stats']
        self.assertEqual(stats_data['total_assigned'], 1)
        self.assertEqual(stats_data['new'], 1)
        print(" [PASS] Maintenance stats API returned correct counts")

        # Check complaints list API
        list_res = self.client.get('/api/maintenance/complaints')
        self.assertEqual(list_res.status_code, 200)
        complaints = list_res.get_json()['complaints']
        self.assertEqual(len(complaints), 1)

        # Check notification list & unread count
        unread_res = self.client.get('/api/notifications/unread-count')
        self.assertEqual(unread_res.get_json()['count'], 1)

        # Accept complaint
        accept_res = self.client.patch(f'/api/maintenance/complaints/{comp_id}/accept')
        self.assertEqual(accept_res.status_code, 200)
        accepted_comp = accept_res.get_json()['complaint']
        self.assertEqual(accepted_comp['status'], 'In Progress')
        print(" [PASS] Electrician successfully accepted complaint -> status changed to In Progress")

        # Check StatusLog created
        logs = StatusLog.query.filter_by(complaint_id=comp_id).all()
        statuses = [l.new_status for l in logs]
        self.assertIn('Submitted', statuses)
        self.assertIn('Assigned', statuses)
        self.assertIn('In Progress', statuses)
        print(" [PASS] Audit StatusLog timeline contains Submitted -> Assigned -> In Progress")

        print("\n--- TEST C: Student notification check ---")
        self.login('student@college.edu', 'Student@123')
        notifs_res = self.client.get('/api/notifications')
        notifs = notifs_res.get_json()['notifications']
        self.assertTrue(any(n['type'] == 'status_update' for n in notifs))
        print(" [PASS] Student received 'Complaint In Progress' status update notification")

        print("\n--- TEST D & E: Isolation & Plumbing test ---")
        # Plumber login
        self.login('plumber@college.edu', 'Tech@123')
        p_list_res = self.client.get('/api/maintenance/complaints')
        self.assertEqual(len(p_list_res.get_json()['complaints']), 0)
        print(" [PASS] Plumber cannot see Electrical complaint in list")

        p_detail_res = self.client.get(f'/api/maintenance/complaints/{comp_id}')
        self.assertEqual(p_detail_res.status_code, 403)
        print(" [PASS] Plumber blocked from viewing Electrical complaint details (403 Forbidden)")

        # Create Plumbing complaint
        self.login('student@college.edu', 'Student@123')
        p_data = {
            'title': 'Leaking Tap in Washroom',
            'description': 'Water leaking heavily from main faucet.',
            'department_id': str(self.plumb_dept_id),
            'location': 'Block B 1st Floor Washroom',
            'priority': 'Medium',
            'issue_photo': (io.BytesIO(b'dummy_image_data'), 'tap.jpg')
        }
        p_res = self.client.post('/api/complaints', data=p_data, content_type='multipart/form-data')
        self.assertEqual(p_res.get_json()['complaint']['assigned_to'], self.plumber_id)
        print(" [PASS] Plumbing complaint automatically assigned to plumber@college.edu")

        print("\n--- TEST F: Unassigned fallback test ---")
        # Submit Civil complaint (No maintenance staff for Civil)
        c_data = {
            'title': 'Broken Door Handle',
            'description': 'Wooden door handle snapped.',
            'department_id': str(self.civil_dept_id),
            'location': 'Hostel Room 104',
            'priority': 'Low',
            'issue_photo': (io.BytesIO(b'dummy_image_data'), 'door.jpg')
        }
        c_res = self.client.post('/api/complaints', data=c_data, content_type='multipart/form-data')
        self.assertEqual(c_res.status_code, 201)
        c_comp = c_res.get_json()['complaint']
        self.assertEqual(c_comp['status'], 'Submitted')
        self.assertIsNone(c_comp['assigned_to'])
        print(" [PASS] Unassigned complaint created without error (status: Submitted, assigned_to: null)")

        # Check management user notification
        self.login('admin@college.edu', 'Admin@123')
        m_notif_res = self.client.get('/api/notifications')
        m_notifs = m_notif_res.get_json()['notifications']
        self.assertTrue(any(n['type'] == 'unassigned_complaint' for n in m_notifs))
        print(" [PASS] Management user received unassigned_complaint notification")

        print("\n--- SECURITY TESTS ---")
        self.login('student@college.edu', 'Student@123')
        sec_res = self.client.get('/api/maintenance/complaints')
        self.assertEqual(sec_res.status_code, 403)
        print(" [PASS] Student blocked from /api/maintenance/complaints (403 Forbidden)")


if __name__ == '__main__':
    unittest.main()
