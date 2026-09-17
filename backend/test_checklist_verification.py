"""
Comprehensive Verification Suite covering all user requirements:
1. Real registration with a test account.
2. Email confirmation & welcome notification.
3. Login with the created account.
4. Student or Faculty dashboard routing.
5. Verification of frontend environment variables.
6. Verification that Maintenance and Management flows remain unchanged.
"""
import os
import sys
import time
import unittest

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
from app import create_app
from extensions import db
from models.user import User
from models.notification import Notification
from models.complaint import Complaint
from models.department import Department
from config import Config

class TestCompleteChecklist(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.app.config['TESTING'] = True
        cls.client = cls.app.test_client()

    def test_01_real_registration_with_test_account(self):
        """1. Real registration with a test student account."""
        unique_num = int(time.time() * 1000) % 1000000
        self.student_email = f"student.check.{unique_num}@acetcbe.edu.in"
        self.student_password = "StudentPass@2026"
        
        payload = {
            "name": "Kavitha R Check",
            "email": self.student_email,
            "password": self.student_password,
            "role": "student",
            "department": "Computer Science and Engineering (CSE)",
            "employee_or_student_id": f"710121104{unique_num:06d}",
            "phone": "+91 98765 43210"
        }

        res = self.client.post("/api/auth/register", json=payload)
        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        self.assertTrue(data['success'])
        self.assertEqual(data['user']['email'], self.student_email)
        self.assertEqual(data['user']['role'], "student")
        self.assertTrue(data.get('email_confirmed', False))
        print(f"\n[OK] 1. Real test account registered: {self.student_email} (ID: {data['user']['id']})")

    def test_02_email_confirmation_and_welcome_notification(self):
        """2. Email confirmation & welcome notification in database."""
        unique_num = int(time.time() * 1000) % 1000000
        faculty_email = f"faculty.check.{unique_num}@acetcbe.edu.in"
        faculty_pass = "FacultyPass@2026"
        
        payload = {
            "name": "Dr. Ramesh Check",
            "email": faculty_email,
            "password": faculty_pass,
            "role": "faculty",
            "department": "Information Technology",
            "employee_or_student_id": f"ACET-FAC-{unique_num}",
            "phone": "+91 98765 11223"
        }

        res = self.client.post("/api/auth/register", json=payload)
        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        self.assertTrue(data.get('email_confirmed', False))
        
        with self.app.app_context():
            user = User.query.filter_by(email=faculty_email).first()
            self.assertIsNotNone(user)
            # Check confirmation notification
            notifs = Notification.query.filter_by(user_id=user.id).all()
            self.assertTrue(len(notifs) >= 1)
            self.assertIn("Institutional Account Confirmed", [n.title for n in notifs])
            print(f"[OK] 2. Email confirmation verified: Notification received for {faculty_email}")

    def test_03_login_with_created_account(self):
        """3. Login with newly created test account."""
        unique_num = int(time.time() * 1000) % 1000000
        test_email = f"student.login.{unique_num}@acetcbe.edu.in"
        test_pass = "SecurePass@2026"

        # Register
        self.client.post("/api/auth/register", json={
            "name": "Login Tester",
            "email": test_email,
            "password": test_pass,
            "role": "student"
        })

        # Logout session
        self.client.post("/api/auth/logout")
        me_out = self.client.get("/api/auth/me")
        self.assertEqual(me_out.status_code, 401)

        # Login with the created account
        login_res = self.client.post("/api/auth/login", json={
            "email": test_email,
            "password": test_pass
        })
        self.assertEqual(login_res.status_code, 200)
        data = login_res.get_json()
        self.assertTrue(data['success'])
        self.assertEqual(data['user']['email'], test_email)

        # Check authenticated session
        me_in = self.client.get("/api/auth/me")
        self.assertEqual(me_in.status_code, 200)
        self.assertEqual(me_in.get_json()['user']['email'], test_email)
        print(f"[OK] 3. Login with created account succeeded for {test_email}")

    def test_04_student_and_faculty_dashboard_routing(self):
        """4. Student & Faculty role dashboard endpoints & routing."""
        # Test student dashboard endpoint
        std_client = self.app.test_client()
        std_client.post("/api/auth/login", json={"email": "student@acetcbe.edu.in", "password": "Student@123"})
        std_res = std_client.get("/api/student/dashboard")
        self.assertEqual(std_res.status_code, 200)
        print("[OK] 4a. Student dashboard endpoint accessible: /api/student/dashboard -> 200 OK")

        # Test faculty dashboard endpoint
        fac_client = self.app.test_client()
        fac_client.post("/api/auth/login", json={"email": "faculty@acetcbe.edu.in", "password": "Faculty@123"})
        fac_res = fac_client.get("/api/faculty/dashboard")
        self.assertEqual(fac_res.status_code, 200)
        print("[OK] 4b. Faculty dashboard endpoint accessible: /api/faculty/dashboard -> 200 OK")

    def test_05_frontend_environment_variables_configured(self):
        """5. Verification of frontend environment variables in .env and .env.example."""
        frontend_env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", ".env"))
        self.assertTrue(os.path.exists(frontend_env_path), "frontend/.env must exist")

        with open(frontend_env_path, "r", encoding="utf-8") as f:
            content = f.read()

        required_vars = [
            "VITE_API_URL",
            "VITE_SOCKET_URL",
            "VITE_SUPABASE_URL",
            "VITE_SUPABASE_ANON_KEY",
            "VITE_SUPABASE_PUBLISHABLE_KEY"
        ]

        for var in required_vars:
            self.assertIn(var, content, f"Frontend .env must contain {var}")

        print(f"[OK] 5. Frontend environment variables verified (All 5 VITE_* keys present in frontend/.env)")

    def test_06_maintenance_and_management_flows_unchanged(self):
        """6. Verification that Maintenance and Management flows remain 100% operational."""
        # 6a. Maintenance Flow
        m_client = self.app.test_client()
        m_login = m_client.post("/api/auth/login", json={"email": "maintenance@college.edu", "password": "Tech@123"})
        self.assertEqual(m_login.status_code, 200)
        self.assertEqual(m_login.get_json()['user']['role'], "maintenance")

        m_stats = m_client.get("/api/maintenance/dashboard/stats")
        self.assertEqual(m_stats.status_code, 200)

        m_complaints = m_client.get("/api/maintenance/complaints")
        self.assertEqual(m_complaints.status_code, 200)
        print("[OK] 6a. Maintenance flow verified: Login, Dashboard stats, and Complaints queue operational.")

        # 6b. Management Flow
        admin_client = self.app.test_client()
        admin_login = admin_client.post("/api/auth/login", json={"email": "admin@college.edu", "password": "Admin@123"})
        self.assertEqual(admin_login.status_code, 200)
        self.assertEqual(admin_login.get_json()['user']['role'], "management")

        admin_stats = admin_client.get("/api/management/dashboard/stats")
        self.assertEqual(admin_stats.status_code, 200)

        admin_users = admin_client.get("/api/management/users")
        self.assertEqual(admin_users.status_code, 200)

        admin_depts = admin_client.get("/api/management/departments")
        self.assertEqual(admin_depts.status_code, 200)
        print("[OK] 6b. Management flow verified: Login, Dashboard stats, User & Dept management operational.")

if __name__ == '__main__':
    unittest.main(verbosity=2)
