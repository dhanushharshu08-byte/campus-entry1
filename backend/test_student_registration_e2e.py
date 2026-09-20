import os
import sys
import time
import sqlite3

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))
from app import create_app
from extensions import db
from models.user import User

def run_tests():
    print("=" * 70)
    print("  CAMPUSENTRY STUDENT REGISTRATION FLOW - E2E COMPREHENSIVE TEST")
    print("=" * 70)

    app = create_app()
    app.config['TESTING'] = True
    client = app.test_client()

    with app.app_context():
        # Scenario 1: Missing required field (Missing Name)
        print("\n[TEST 1] Missing Required Field (Name)")
        res1 = client.post("/api/auth/register", json={
            "name": "",
            "email": "test.student@acetcbe.edu.in",
            "password": "Password@123",
            "role": "student"
        })
        assert res1.status_code == 400, f"Expected 400, got {res1.status_code}"
        assert res1.get_json()['success'] is False
        print("  -> Passed: Correctly rejected missing name with 400.")

        # Scenario 2: Weak Password (<8 chars)
        print("\n[TEST 2] Weak Password (<8 chars)")
        res2 = client.post("/api/auth/register", json={
            "name": "Arun Kumar",
            "email": "arun.kumar@acetcbe.edu.in",
            "password": "pass",
            "role": "student"
        })
        assert res2.status_code == 400
        assert res2.get_json()['success'] is False
        print("  -> Passed: Correctly rejected weak password with 400.")

        # Scenario 3: Successful Student Registration with valid details
        print("\n[TEST 3] Successful Student Registration")
        unique_id = int(time.time() * 1000) % 1000000
        reg_payload = {
            "name": "Divya Prakash",
            "email": f"divya.student.{unique_id}@acetcbe.edu.in",
            "password": "DivyaPassword@2026",
            "role": "student",
            "department": "Computer Science and Engineering (CSE)",
            "employee_or_student_id": f"710121104{unique_id:06d}",
            "phone": "+91 98765 43210"
        }
        res3 = client.post("/api/auth/register", json=reg_payload)
        assert res3.status_code == 201, f"Expected 201, got {res3.status_code}: {res3.get_json()}"
        data3 = res3.get_json()
        assert data3['success'] is True
        assert "Registration successful" in data3['message']
        assert data3['user']['role'] == "student"
        assert data3['user']['email'] == reg_payload['email'].lower()
        print(f"  -> Passed: Student registered successfully: {data3['user']['name']} ({data3['user']['email']})")
        print(f"  -> Returned message: '{data3['message']}'")

        # Scenario 4: Verify Session Established Immediately (No separate login needed)
        print("\n[TEST 4] Verify Session Established Immediately via /api/auth/me")
        res4 = client.get("/api/auth/me")
        assert res4.status_code == 200, f"Expected 200, got {res4.status_code}: {res4.get_json()}"
        data4 = res4.get_json()
        assert data4['success'] is True
        assert data4['user']['email'] == reg_payload['email'].lower()
        print(f"  -> Passed: Authenticated session verified for {data4['user']['name']} ({data4['user']['role']})")

        # Scenario 5: Duplicate Student Account Prevention
        print("\n[TEST 5] Duplicate Student Account Prevention")
        res5 = client.post("/api/auth/register", json={
            "name": "Divya Duplicate",
            "email": reg_payload['email'],
            "password": "AnotherPassword@2026",
            "role": "student"
        })
        assert res5.status_code == 409, f"Expected 409, got {res5.status_code}"
        data5 = res5.get_json()
        assert data5['success'] is False
        assert "already exists" in data5['message']
        print(f"  -> Passed: Duplicate registration rejected with 409: '{data5['message']}'")

        # Scenario 6: Logout & Re-login with Newly Registered Student
        print("\n[TEST 6] Logout and Login with Newly Registered Student")
        client.post("/api/auth/logout")
        res_me_out = client.get("/api/auth/me")
        assert res_me_out.status_code == 401

        login_res = client.post("/api/auth/login", json={
            "email": reg_payload['email'],
            "password": reg_payload['password']
        })
        assert login_res.status_code == 200
        login_data = login_res.get_json()
        assert login_data['success'] is True
        assert login_data['user']['email'] == reg_payload['email'].lower()
        print(f"  -> Passed: Newly registered student successfully logged in.")

        # Scenario 7: Verify Core System Roles & Logins are Unaffected
        print("\n[TEST 7] Verify Core System Roles (Student, Faculty, Maintenance, Management)")
        core_accounts = [
            ("student@acetcbe.edu.in", "Student@123", "student"),
            ("faculty@acetcbe.edu.in", "Faculty@123", "faculty"),
            ("maintenance@college.edu", "Tech@123", "maintenance"),
            ("admin@college.edu", "Admin@123", "management"),
        ]
        for email, pwd, expected_role in core_accounts:
            c = app.test_client()
            r = c.post("/api/auth/login", json={"email": email, "password": pwd})
            assert r.status_code == 200, f"Login failed for {email}: {r.status_code}"
            u = r.get_json()['user']
            assert u['role'] == expected_role
            print(f"  -> Passed: {email} -> Logged in as {u['role']}")

        print("\n" + "=" * 70)
        print("  ALL 7/7 VERIFICATION SCENARIOS COMPLETED SUCCESSFULLY!")
        print("=" * 70)

if __name__ == '__main__':
    run_tests()
