"""
CampuSentry – Final College Demo Scenario & Presentation Readiness Test Suite
Simulates the exact college demonstration sequence:
1. Student reports classroom projector failure (Electrical, High Priority) with photo
2. Electrical Maintenance receives assignment & notification
3. Maintenance moves to In Progress
4. Maintenance repairs & marks Resolved with resolution remarks & photo
5. Student receives notification & views resolution proof and history
6. Management monitors real-time statistics & full audit trail
7. Department isolation test (Plumbing vs Electrical)
8. Role security & authorization barrier tests
"""

import unittest
import os
import io
import json
from datetime import datetime

os.environ['FLASK_ENV'] = 'testing'
os.environ['DATABASE_URL'] = 'sqlite:///:memory:'

from app import create_app
from extensions import db
from models.user import User
from models.department import Department
from models.complaint import Complaint
from models.status_log import StatusLog
from models.notification import Notification
from models.system_setting import SystemSetting

class FinalCollegeDemoTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.app.config['WTF_CSRF_ENABLED'] = False
        self.ctx = self.app.app_context()
        self.ctx.push()
        db.create_all()
        SystemSetting.init_default_settings()

        self.client = self.app.test_client()

        # Seed 7 departments
        self.depts = {}
        dept_names = ['Electrical', 'Plumbing', 'Civil', 'Housekeeping', 'Furniture', 'IT / Network', 'Other']
        for name in dept_names:
            dept = Department(name=name, description=f'{name} Maintenance Department', is_active=True)
            db.session.add(dept)
            db.session.flush()
            self.depts[name] = dept

        # Seed Demo Users
        self.student = User(name="John Doe (Student)", email="student@college.edu", role="student", employee_or_student_id="STU-001", is_active=True)
        self.student.set_password("Student@123")

        self.faculty = User(name="Prof. Sarah Smith", email="faculty@college.edu", role="faculty", employee_or_student_id="FAC-001", is_active=True)
        self.faculty.set_password("Faculty@123")

        self.electrician = User(name="Alex Vance (Electrician)", email="electrician@college.edu", role="maintenance", department_id=self.depts['Electrical'].id, department="Electrical", employee_or_student_id="TECH-001", is_active=True)
        self.electrician.set_password("Tech@123")

        self.plumber = User(name="Mario Rossi (Plumber)", email="plumber@college.edu", role="maintenance", department_id=self.depts['Plumbing'].id, department="Plumbing", employee_or_student_id="TECH-002", is_active=True)
        self.plumber.set_password("Tech@123")

        self.admin = User(name="Campus Administrator", email="admin@college.edu", role="management", employee_or_student_id="MGMT-001", is_active=True)
        self.admin.set_password("Admin@123")

        db.session.add_all([self.student, self.faculty, self.electrician, self.plumber, self.admin])
        db.session.commit()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    def test_complete_demo_workflow(self):
        print("\n=======================================================")
        print("  STARTING FINAL COLLEGE DEMO END-TO-END SCENARIO")
        print("=======================================================")

        # Step 1: Student Zero-State Check
        self.client.post('/api/auth/login', json={"email": "student@college.edu", "password": "Student@123"})
        res = self.client.get('/api/student/dashboard')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data['metrics']['total'], 0)
        print(" [+] Step 1: Student Dashboard loads with initial count 0")

        # Step 2: Student reports Classroom Projector failure
        photo_bytes = io.BytesIO(b"\xff\xd8\xff\xe0\x00\x10JFIFfake_projector_issue")
        submit_res = self.client.post(
            '/api/complaints',
            data={
                'title': 'Projector Not Working',
                'description': 'The projector in the classroom is not displaying the presentation.',
                'department_id': str(self.depts['Electrical'].id),
                'location': 'Block A – Room 204',
                'priority': 'High',
                'issue_photo': (photo_bytes, 'projector_broken.jpg')
            },
            content_type='multipart/form-data'
        )
        self.assertEqual(submit_res.status_code, 201)
        complaint_data = submit_res.get_json()['complaint']
        complaint_id = complaint_data['id']
        ticket_number = complaint_data['complaint_number']
        self.assertTrue(ticket_number.startswith('CH-'))
        self.assertEqual(complaint_data['status'], 'Assigned')
        print(f" [+] Step 2: Grievance submitted -> Ticket: {ticket_number} (Status: Assigned to Electrical)")

        # Verify Student can see in My Complaints
        my_comp_res = self.client.get('/api/complaints')
        self.assertEqual(my_comp_res.status_code, 200)
        self.assertEqual(len(my_comp_res.get_json()['complaints']), 1)
        print(" [+] Step 3: Student sees complaint in My Complaints list")

        # Logout Student
        self.client.post('/api/auth/logout')

        # Step 4: Electrical Maintenance Login & Real-Time Notification Check
        self.client.post('/api/auth/login', json={"email": "electrician@college.edu", "password": "Tech@123"})
        notif_res = self.client.get('/api/notifications')
        self.assertEqual(notif_res.status_code, 200)
        notifs = notif_res.get_json()['notifications']
        self.assertTrue(any("Electrical" in n['title'] or "Maintenance" in n['title'] or ticket_number in n['message'] for n in notifs))
        print(" [+] Step 4: Electrical Maintenance received real-time assignment notification")

        # Step 5: Electrical Maintenance changes status to 'In Progress'
        accept_res = self.client.post(f'/api/maintenance/complaints/{complaint_id}/accept')
        self.assertEqual(accept_res.status_code, 200)
        self.assertEqual(accept_res.get_json()['complaint']['status'], 'In Progress')
        print(" [+] Step 5: Maintenance accepted ticket -> Status transitioned to 'In Progress'")

        self.client.post('/api/auth/logout')

        # Step 6: Student views status update
        self.client.post('/api/auth/login', json={"email": "student@college.edu", "password": "Student@123"})
        detail_res = self.client.get(f'/api/complaints/{complaint_id}')
        self.assertEqual(detail_res.status_code, 200)
        self.assertEqual(detail_res.get_json()['complaint']['status'], 'In Progress')
        print(" [+] Step 6: Student verifies complaint status is now 'In Progress'")

        self.client.post('/api/auth/logout')

        # Step 7: Electrical Maintenance fixes issue & Marks as Resolved
        self.client.post('/api/auth/login', json={"email": "electrician@college.edu", "password": "Tech@123"})
        res_photo_bytes = io.BytesIO(b"\xff\xd8\xff\xe0\x00\x10JFIFfake_projector_fixed")
        resolve_res = self.client.post(
            f'/api/maintenance/complaints/{complaint_id}/resolve',
            data={
                'resolution_remarks': 'Projector cable connection was repaired and the projector is functioning normally.',
                'resolution_photo': (res_photo_bytes, 'projector_fixed.jpg')
            },
            content_type='multipart/form-data'
        )
        self.assertEqual(resolve_res.status_code, 200)
        resolved_ticket = resolve_res.get_json()['complaint']
        self.assertEqual(resolved_ticket['status'], 'Resolved')
        self.assertIn("Projector cable connection was repaired", resolved_ticket['resolution_remarks'])
        self.assertIsNotNone(resolved_ticket['resolved_at'])
        print(" [+] Step 7: Maintenance resolved ticket with remarks & proof photo -> Status: Resolved")

        self.client.post('/api/auth/logout')

        # Step 8: Student views Resolution and Complete Timeline
        self.client.post('/api/auth/login', json={"email": "student@college.edu", "password": "Student@123"})
        res_check = self.client.get(f'/api/complaints/{complaint_id}')
        self.assertEqual(res_check.status_code, 200)
        ticket_detail = res_check.get_json()['complaint']
        self.assertEqual(ticket_detail['status'], 'Resolved')
        self.assertIsNotNone(ticket_detail['resolution_photo'])
        self.assertIsNotNone(ticket_detail['resolution_remarks'])

        # Check Timeline embedded in complaint details
        timeline = ticket_detail.get('timeline', [])
        statuses = [t['new_status'] for t in timeline if 'new_status' in t]
        self.assertIn('In Progress', statuses)
        self.assertIn('Resolved', statuses)
        print(f" [+] Step 8: Student verified resolution details, proof photo, and full timeline ({len(timeline)} stages)")

        self.client.post('/api/auth/logout')

        # Step 9: Management Monitors System
        self.client.post('/api/auth/login', json={"email": "admin@college.edu", "password": "Admin@123"})
        mgmt_summary = self.client.get('/api/dashboard/summary').get_json()
        self.assertEqual(mgmt_summary['total'], 1)
        self.assertEqual(mgmt_summary['resolved'], 1)
        print(f" [+] Step 9: Management Dashboard verified real SQLite metrics: Total=1, Resolved=1")

        # Step 10: Department Isolation Test
        self.client.post('/api/auth/logout')
        self.client.post('/api/auth/login', json={"email": "student@college.edu", "password": "Student@123"})
        plumb_photo = io.BytesIO(b"\xff\xd8\xff\xe0\x00\x10JFIFfake_pipe_issue")
        plumb_res = self.client.post(
            '/api/complaints',
            data={
                'title': 'Leaking Washroom Tap',
                'description': 'Washroom faucet is leaking continuous stream of water on 2nd floor.',
                'department_id': str(self.depts['Plumbing'].id),
                'location': 'Hostel A Washroom 2B',
                'priority': 'Medium',
                'issue_photo': (plumb_photo, 'leak.jpg')
            },
            content_type='multipart/form-data'
        )
        self.assertEqual(plumb_res.status_code, 201)
        plumb_id = plumb_res.get_json()['complaint']['id']
        print(" [+] Step 10a: Created Plumbing ticket")

        self.client.post('/api/auth/logout')

        # Verify Plumber sees Plumbing ticket
        self.client.post('/api/auth/login', json={"email": "plumber@college.edu", "password": "Tech@123"})
        plumber_notifs = self.client.get('/api/notifications').get_json()['notifications']
        self.assertTrue(any("Plumbing" in n['title'] or "Maintenance" in n['title'] for n in plumber_notifs))
        print(" [+] Step 10b: Plumber received Plumbing ticket assignment")

        # Verify Electrician cannot accept or resolve Plumbing ticket
        self.client.post('/api/auth/logout')
        self.client.post('/api/auth/login', json={"email": "electrician@college.edu", "password": "Tech@123"})
        elec_accept_plumb = self.client.post(f'/api/maintenance/complaints/{plumb_id}/accept')
        self.assertIn(elec_accept_plumb.status_code, [400, 403])
        print(" [+] Step 10c: Department Isolation Verified! Electrician blocked from acting on Plumbing ticket")

        # Step 11: Role Security & Authorization Barriers
        self.client.post('/api/auth/logout')
        self.client.post('/api/auth/login', json={"email": "student@college.edu", "password": "Student@123"})
        self.assertEqual(self.client.get('/api/management/complaints').status_code, 403)
        self.assertEqual(self.client.get('/api/maintenance/complaints').status_code, 403)
        print(" [+] Step 11: Security Barriers Verified! Student blocked from Management and Maintenance APIs (403 Forbidden)")

        # Step 12: Failure & Validation Testing
        # Invalid Login
        bad_login = self.client.post('/api/auth/login', json={"email": "student@college.edu", "password": "WrongPassword"})
        self.assertEqual(bad_login.status_code, 401)
        self.assertIn("Invalid", bad_login.get_json()['message'])
        print(" [+] Step 12: Failure handling verified! Invalid credentials cleanly rejected with HTTP 401")

        print("\n=======================================================")
        print("  ALL 12 FINAL COLLEGE DEMO STAGES PASSED (100% OK)!")
        print("=======================================================")

if __name__ == '__main__':
    unittest.main()
