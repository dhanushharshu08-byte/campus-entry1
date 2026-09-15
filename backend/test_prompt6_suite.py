import io
import sys
import unittest
from datetime import datetime, timedelta
from app import create_app
from config import Config
from extensions import db
from models.user import User
from models.department import Department
from models.complaint import Complaint
from models.status_log import StatusLog
from models.notification import Notification

class TestPrompt6Suite(unittest.TestCase):
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

        student = User(name="Alice Student", email="alice@college.edu", role="student", employee_or_student_id="STU101")
        student.set_password("Student@123")

        faculty = User(name="Prof Smith", email="smith@college.edu", role="faculty", employee_or_student_id="FAC101")
        faculty.set_password("Faculty@123")

        electrician = User(
            name="Ravi Electrician", 
            email="electrician@college.edu", 
            role="maintenance", 
            department_id=elec_dept.id, 
            department="Electrical",
            employee_or_student_id="EMP101"
        )
        electrician.set_password("Tech@123")

        management = User(
            name="Admin Management", 
            email="admin@college.edu", 
            role="management", 
            employee_or_student_id="MGT001"
        )
        management.set_password("Admin@123")

        db.session.add_all([student, faculty, electrician, management])
        db.session.commit()

        self.elec_dept_id = elec_dept.id
        self.plumb_dept_id = plumb_dept.id
        self.student_id = student.id
        self.faculty_id = faculty.id
        self.electrician_id = electrician.id
        self.management_id = management.id

        # Seed sample complaints
        c1 = Complaint(
            complaint_number="CH-2026-00001",
            title="Electrical Spark in Lab",
            description="Sparking near breaker panel",
            department_id=self.elec_dept_id,
            location="Lab 101",
            priority="High",
            status="In Progress",
            created_by=self.student_id,
            assigned_to=self.electrician_id,
            created_at=datetime.utcnow() - timedelta(hours=60) # Overdue (>48h)
        )
        c2 = Complaint(
            complaint_number="CH-2026-00002",
            title="Unassigned Water Leak",
            description="Leaking pipe in library",
            department_id=self.plumb_dept_id,
            location="Library Floor 1",
            priority="Medium",
            status="Submitted",
            created_by=self.faculty_id,
            assigned_to=None # Unassigned
        )
        c3 = Complaint(
            complaint_number="CH-2026-00003",
            title="Broken Light Switch",
            description="Switch stuck off",
            department_id=self.elec_dept_id,
            location="Room 202",
            priority="Low",
            status="Resolved",
            created_by=self.student_id,
            assigned_to=self.electrician_id,
            resolution_remarks="Switch replaced successfully",
            resolved_at=datetime.utcnow() - timedelta(hours=2)
        )
        db.session.add_all([c1, c2, c3])
        db.session.commit()

        log1 = StatusLog(complaint_id=c1.id, new_status="In Progress", changed_by_id=self.electrician_id, comments="Started inspection")
        db.session.add(log1)
        db.session.commit()

        self.c1_id = c1.id
        self.c2_id = c2.id
        self.c3_id = c3.id

    def login(self, email, password):
        return self.client.post('/api/auth/login', json={'email': email, 'password': password})

    def test_access_control(self):
        print("\n--- TEST 1: Access Control & Authorization (403/401) ---")
        endpoints = [
            '/api/management/dashboard/stats',
            '/api/management/departments/performance',
            '/api/management/analytics/complaint-trends',
            '/api/management/complaints/recent',
            '/api/management/complaints',
            f'/api/management/complaints/{self.c1_id}',
            '/api/management/complaints/unassigned',
            '/api/management/complaints/overdue',
            '/api/management/staff/performance',
            '/api/management/activity'
        ]

        # 1. Unauthenticated -> 401
        for ep in endpoints:
            res = self.client.get(ep)
            self.assertEqual(res.status_code, 401)

        # 2. Student login -> 403
        self.login('alice@college.edu', 'Student@123')
        for ep in endpoints:
            res = self.client.get(ep)
            self.assertEqual(res.status_code, 403)

        # 3. Maintenance login -> 403
        self.login('electrician@college.edu', 'Tech@123')
        for ep in endpoints:
            res = self.client.get(ep)
            self.assertEqual(res.status_code, 403)

        print(" [PASS] Unauthenticated (401) and Non-Management Roles (403) correctly blocked from all management endpoints")

    def test_management_dashboard_and_analytics_apis(self):
        print("\n--- TEST 2: Management Dashboard & Analytics APIs ---")
        self.login('admin@college.edu', 'Admin@123')

        # 1. Stats
        res_stats = self.client.get('/api/management/dashboard/stats')
        self.assertEqual(res_stats.status_code, 200)
        stats = res_stats.get_json()['stats']
        self.assertEqual(stats['total'], 3)
        self.assertEqual(stats['submitted'], 1)
        self.assertEqual(stats['in_progress'], 1)
        self.assertEqual(stats['resolved'], 1)
        self.assertEqual(stats['overdue'], 1) # c1 is >48h old
        self.assertEqual(stats['unassigned'], 1) # c2 is unassigned
        print(" [PASS] GET /api/management/dashboard/stats returned accurate counts")

        # 2. Department Performance
        res_dept = self.client.get('/api/management/departments/performance')
        self.assertEqual(res_dept.status_code, 200)
        depts = res_dept.get_json()['departments']
        self.assertGreaterEqual(len(depts), 2)
        print(" [PASS] GET /api/management/departments/performance returned active department breakdowns")

        # 3. Complaint Trends
        res_trends = self.client.get('/api/management/analytics/complaint-trends?days=30')
        self.assertEqual(res_trends.status_code, 200)
        trends = res_trends.get_json()['trends']
        self.assertEqual(len(trends), 30)
        print(" [PASS] GET /api/management/analytics/complaint-trends returned 30-day date series")

        # 4. Recent Complaints
        res_recent = self.client.get('/api/management/complaints/recent?limit=10')
        self.assertEqual(res_recent.status_code, 200)
        self.assertEqual(len(res_recent.get_json()['complaints']), 3)
        print(" [PASS] GET /api/management/complaints/recent returned latest 3 complaints")

        # 5. Paginated Complaints with Filters
        res_list = self.client.get('/api/management/complaints?page=1&limit=20&priority=High')
        self.assertEqual(res_list.status_code, 200)
        self.assertEqual(len(res_list.get_json()['complaints']), 1)
        print(" [PASS] GET /api/management/complaints filter & pagination working")

        # 6. Unassigned Queue
        res_unassigned = self.client.get('/api/management/complaints/unassigned')
        self.assertEqual(res_unassigned.status_code, 200)
        unassigned = res_unassigned.get_json()['complaints']
        self.assertEqual(len(unassigned), 1)
        self.assertEqual(unassigned[0]['complaint_number'], 'CH-2026-00002')
        print(" [PASS] GET /api/management/complaints/unassigned correctly identified unassigned ticket")

        # 7. Overdue Queue
        res_overdue = self.client.get('/api/management/complaints/overdue')
        self.assertEqual(res_overdue.status_code, 200)
        overdue = res_overdue.get_json()['complaints']
        self.assertEqual(len(overdue), 1)
        self.assertEqual(overdue[0]['complaint_number'], 'CH-2026-00001')
        self.assertGreater(overdue[0]['hours_overdue'], 10.0)
        print(" [PASS] GET /api/management/complaints/overdue correctly identified >48h SLA breach")

        # 8. Staff Performance
        res_staff = self.client.get('/api/management/staff/performance')
        self.assertEqual(res_staff.status_code, 200)
        staff = res_staff.get_json()['staff']
        self.assertEqual(len(staff), 1)
        self.assertEqual(staff[0]['name'], 'Ravi Electrician')
        self.assertEqual(staff[0]['in_progress'], 1)
        self.assertEqual(staff[0]['resolved'], 1)
        print(" [PASS] GET /api/management/staff/performance returned staff metrics")

        # 9. Live Activity
        res_activity = self.client.get('/api/management/activity')
        self.assertEqual(res_activity.status_code, 200)
        activity = res_activity.get_json()['activity']
        self.assertGreaterEqual(len(activity), 1)
        print(" [PASS] GET /api/management/activity returned status audit log feed")

    def test_high_priority_alert_notification(self):
        print("\n--- TEST 3: High Priority Complaint Alert Notification ---")
        self.login('alice@college.edu', 'Student@123')
        data = {
            'title': 'Emergency Elevator Power Failure',
            'description': 'Elevator trapped between floor 2 and 3.',
            'department_id': str(self.elec_dept_id),
            'location': 'Main Academic Block',
            'priority': 'High',
            'issue_photo': (io.BytesIO(b'elevator_photo_bytes'), 'elevator.jpg')
        }
        res = self.client.post('/api/complaints', data=data, content_type='multipart/form-data')
        self.assertEqual(res.status_code, 201)
        comp_id = res.get_json()['complaint']['id']

        # Check management user received notification
        notif = Notification.query.filter_by(user_id=self.management_id, complaint_id=comp_id, type='high_priority').first()
        self.assertIsNotNone(notif)
        self.assertIn("high priority complaint", notif.title.lower())
        print(" [PASS] High priority complaint automatically generated management alert notification")

if __name__ == '__main__':
    unittest.main()
