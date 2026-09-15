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

class TestPrompt5Suite(unittest.TestCase):
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
        elec_dept = Department(name="Electrical", description="Electrical grid and fixtures")
        plumb_dept = Department(name="Plumbing", description="Water supply and drainage")
        db.session.add_all([elec_dept, plumb_dept])
        db.session.commit()

        student1 = User(name="Alice Student", email="alice@college.edu", role="student", employee_or_student_id="STU101")
        student1.set_password("Student@123")

        student2 = User(name="Bob Student", email="bob@college.edu", role="student", employee_or_student_id="STU102")
        student2.set_password("Student@123")

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

        db.session.add_all([student1, student2, electrician, plumber, management])
        db.session.commit()

        self.elec_dept_id = elec_dept.id
        self.plumb_dept_id = plumb_dept.id
        self.student1_id = student1.id
        self.student2_id = student2.id
        self.electrician_id = electrician.id
        self.plumber_id = plumber.id
        self.management_id = management.id

    def login(self, email, password):
        return self.client.post('/api/auth/login', json={'email': email, 'password': password})

    def test_complete_resolution_and_closure_lifecycle(self):
        print("\n--- TEST 1: Electrical Complaint Resolution & Closure ---")
        # Student 1 creates complaint
        self.login('alice@college.edu', 'Student@123')
        data = {
            'title': 'Short Circuit in Lab 101',
            'description': 'Main breaker tripped and smells burnt.',
            'department_id': str(self.elec_dept_id),
            'location': 'Lab 101 Block A',
            'priority': 'High',
            'issue_photo': (io.BytesIO(b'issue_image_bytes'), 'burnt.jpg')
        }
        res = self.client.post('/api/complaints', data=data, content_type='multipart/form-data')
        self.assertEqual(res.status_code, 201)
        comp_id = res.get_json()['complaint']['id']
        print(" [PASS] Complaint created and assigned to electrician")

        # Electrician accepts ticket -> In Progress
        self.login('electrician@college.edu', 'Tech@123')
        accept_res = self.client.patch(f'/api/maintenance/complaints/{comp_id}/accept')
        self.assertEqual(accept_res.status_code, 200)

        # Electrician submits resolution
        resolve_data = {
            'resolution_remarks': 'Replaced burnt circuit breaker and verified main voltage.',
            'resolution_photo': (io.BytesIO(b'resolution_image_bytes'), 'fixed.png')
        }
        resolve_res = self.client.patch(
            f'/api/maintenance/complaints/{comp_id}/resolve',
            data=resolve_data,
            content_type='multipart/form-data'
        )
        self.assertEqual(resolve_res.status_code, 200)
        resolved_comp = resolve_res.get_json()['complaint']
        self.assertEqual(resolved_comp['status'], 'Resolved')
        self.assertIsNotNone(resolved_comp['resolution_photo'])
        self.assertEqual(resolved_comp['resolution_remarks'], 'Replaced burnt circuit breaker and verified main voltage.')
        self.assertIsNotNone(resolved_comp['resolved_at'])
        print(" [PASS] Electrician resolved complaint with after-photo & remarks")

        # Check DB Notifications for Student & Management
        s_notif = Notification.query.filter_by(user_id=self.student1_id, complaint_id=comp_id).first()
        self.assertIsNotNone(s_notif)
        self.assertEqual(s_notif.type, 'status_update')

        m_notif = Notification.query.filter_by(user_id=self.management_id, complaint_id=comp_id).first()
        self.assertIsNotNone(m_notif)
        print(" [PASS] Notifications dispatched to student & management")

        # Student 1 closes complaint
        self.login('alice@college.edu', 'Student@123')
        close_res = self.client.patch(f'/api/complaints/{comp_id}/close')
        self.assertEqual(close_res.status_code, 200)
        closed_comp = close_res.get_json()['complaint']
        self.assertEqual(closed_comp['status'], 'Closed')
        self.assertIsNotNone(closed_comp['closed_at'])
        print(" [PASS] Student confirmed and closed complaint successfully")

        # Check Electrician received closure notification
        e_notif = Notification.query.filter_by(user_id=self.electrician_id, complaint_id=comp_id).order_by(Notification.id.desc()).first()
        self.assertIsNotNone(e_notif)
        self.assertIn("closed", e_notif.message.lower())
        print(" [PASS] Electrician notified of ticket closure")

    def test_reopen_lifecycle(self):
        print("\n--- TEST 2: Reopen Complaint Lifecycle ---")
        # Student 1 creates Plumbing complaint
        self.login('alice@college.edu', 'Student@123')
        data = {
            'title': 'Leaking Sink in Canteen',
            'description': 'Water leaking from pipe below sink.',
            'department_id': str(self.plumb_dept_id),
            'location': 'Canteen Kitchen',
            'priority': 'Medium',
            'issue_photo': (io.BytesIO(b'sink_bytes'), 'sink.jpg')
        }
        res = self.client.post('/api/complaints', data=data, content_type='multipart/form-data')
        comp_id = res.get_json()['complaint']['id']

        # Plumber accepts & resolves ticket
        self.login('plumber@college.edu', 'Tech@123')
        self.client.patch(f'/api/maintenance/complaints/{comp_id}/accept')
        resolve_data = {
            'resolution_remarks': 'Tightened drain pipe connection and replaced washer.',
            'resolution_photo': (io.BytesIO(b'sink_fixed_bytes'), 'sink_fixed.png')
        }
        self.client.patch(f'/api/maintenance/complaints/{comp_id}/resolve', data=resolve_data, content_type='multipart/form-data')

        # Student 1 reopens ticket with reason
        self.login('alice@college.edu', 'Student@123')
        reopen_payload = {
            'reason': 'The sink pipe is still dripping slowly from the joint.'
        }
        reopen_res = self.client.patch(f'/api/complaints/{comp_id}/reopen', json=reopen_payload)
        self.assertEqual(reopen_res.status_code, 200)
        reopened_comp = reopen_res.get_json()['complaint']
        self.assertEqual(reopened_comp['status'], 'In Progress')
        print(" [PASS] Student reopened ticket -> status transitioned back to In Progress")

        # Verify plumber received reopen notification
        p_notif = Notification.query.filter_by(user_id=self.plumber_id, complaint_id=comp_id).order_by(Notification.id.desc()).first()
        self.assertIsNotNone(p_notif)
        self.assertIn("reopened", p_notif.message.lower())
        print(" [PASS] Maintenance plumber notified of ticket reopening")

    def test_security_and_state_machine_rules(self):
        print("\n--- TEST 3: Security & State Machine Authorization Rules ---")
        # Setup an Electrical ticket in 'Assigned' status
        self.login('alice@college.edu', 'Student@123')
        data = {
            'title': 'Broken Socket in Library',
            'description': 'Plug socket loose on wall.',
            'department_id': str(self.elec_dept_id),
            'location': 'Library 2nd Floor',
            'priority': 'Low',
            'issue_photo': (io.BytesIO(b'socket_bytes'), 'socket.jpg')
        }
        res = self.client.post('/api/complaints', data=data, content_type='multipart/form-data')
        comp_id = res.get_json()['complaint']['id']

        # Rule A: Cannot resolve ticket in 'Assigned' status (must be 'In Progress')
        self.login('electrician@college.edu', 'Tech@123')
        bad_resolve = self.client.patch(
            f'/api/maintenance/complaints/{comp_id}/resolve',
            data={'resolution_remarks': 'Tried resolving without accepting work.', 'resolution_photo': (io.BytesIO(b'img'), 'test.png')},
            content_type='multipart/form-data'
        )
        self.assertEqual(bad_resolve.status_code, 400)
        print(" [PASS] Blocked resolving ticket in Assigned status (400 Bad Request)")

        # Rule B: Plumber cannot resolve Electrician's ticket
        self.login('electrician@college.edu', 'Tech@123')
        self.client.patch(f'/api/maintenance/complaints/{comp_id}/accept')  # Ticket now In Progress

        self.login('plumber@college.edu', 'Tech@123')
        unauth_resolve = self.client.patch(
            f'/api/maintenance/complaints/{comp_id}/resolve',
            data={'resolution_remarks': 'Unauthorized attempt by plumber.', 'resolution_photo': (io.BytesIO(b'img'), 'test.png')},
            content_type='multipart/form-data'
        )
        self.assertEqual(unauth_resolve.status_code, 403)
        print(" [PASS] Blocked unauthorized maintenance user from resolving another's ticket (403 Forbidden)")

        # Rule C: Student 2 cannot close Student 1's complaint
        self.login('electrician@college.edu', 'Tech@123')
        self.client.patch(
            f'/api/maintenance/complaints/{comp_id}/resolve',
            data={'resolution_remarks': 'Socket replaced safely and grounded.', 'resolution_photo': (io.BytesIO(b'img'), 'test.png')},
            content_type='multipart/form-data'
        )

        self.login('bob@college.edu', 'Student@123')
        unauth_close = self.client.patch(f'/api/complaints/{comp_id}/close')
        self.assertEqual(unauth_close.status_code, 403)
        print(" [PASS] Blocked Student 2 from closing Student 1's complaint (403 Forbidden)")


if __name__ == '__main__':
    unittest.main()
