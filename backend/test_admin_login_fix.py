"""
Test script to verify Admin/Management Login Fix across all variations and roles.
"""
import unittest
import os
os.environ['FLASK_ENV'] = 'testing'

from app import create_app
from extensions import db
from models.user import User

class AdminLoginVerificationTest(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.client = self.app.test_client()
        self.ctx = self.app.app_context()
        self.ctx.push()

    def tearDown(self):
        self.ctx.pop()

    def test_admin_logins(self):
        test_cases = [
            ('admin@college.edu', 'Admin@123', 'management'),
            ('admin@college.edu', 'admin@123', 'management'),
            ('admin@acetcbe.edu.in', 'Admin@123', 'management'),
            ('admin', 'Admin@123', 'management'),
            ('administrator@college.edu', 'Admin@123', 'management'),
            ('administrator@acetcbe.edu.in', 'Admin@123', 'management'),
            ('administrator', 'Admin@123', 'management'),
            ('management@college.edu', 'Admin@123', 'management'),
            ('management@acetcbe.edu.in', 'Admin@123', 'management'),
            ('management', 'Admin@123', 'management'),
            ('mgmt-001', 'Admin@123', 'management'),
            ('MGMT-001', 'Admin@123', 'management'),
            ('maintenance@college.edu', 'Tech@123', 'maintenance'),
            ('maintenance@acetcbe.edu.in', 'Tech@123', 'maintenance'),
            ('student@acetcbe.edu.in', 'Student@123', 'student'),
            ('faculty@acetcbe.edu.in', 'Faculty@123', 'faculty'),
        ]

        for email_input, password_input, expected_role in test_cases:
            res = self.client.post('/api/auth/login', json={
                'email': email_input,
                'password': password_input
            })
            data = res.get_json() or {}
            self.assertEqual(res.status_code, 200, f"Failed for {email_input} with error: {data.get('message')}")
            self.assertTrue(data.get('success'))
            self.assertEqual(data.get('user', {}).get('role'), expected_role)
            self.client.post('/api/auth/logout')

    def test_invalid_logins(self):
        # Invalid password
        res = self.client.post('/api/auth/login', json={
            'email': 'admin@college.edu',
            'password': 'TotallyWrongPassword'
        })
        self.assertEqual(res.status_code, 401)

        # Non-existent user
        res = self.client.post('/api/auth/login', json={
            'email': 'unknown_user_999@acetcbe.edu.in',
            'password': 'Password@123'
        })
        self.assertEqual(res.status_code, 404)

if __name__ == '__main__':
    unittest.main()
