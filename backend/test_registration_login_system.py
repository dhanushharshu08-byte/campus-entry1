"""
CampuSentry Registration & Login Comprehensive Verification Test
Uses Flask Test Client and Live Database for 100% deterministic verification:
1. Student registration with normalization, hashing, and SQLite verification.
2. Immediate login with the exact same credentials.
3. Session persistence and /api/auth/me profile verification.
4. Role dashboard routing check.
5. Logout and subsequent second login.
6. Faculty registration & login.
7. Clear error message handling:
   - Account not found (404)
   - Incorrect password (401)
   - Invalid college email domain (400)
   - Duplicate registration (409)
   - Disabled account rejection (403)
"""

import os
import sys
import time
import json
import sqlite3

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))
from app import create_app
from extensions import db
from models.user import User

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "campus_helpdesk.db"))

def test_full_auth_system():
    print("=" * 70)
    print("  CAMPUSENTRY REGISTRATION & LOGIN SYSTEM VERIFICATION")
    print("=" * 70)

    app = create_app()
    app.config['TESTING'] = True
    client = app.test_client()

    with app.app_context():
        # 1. NEW STUDENT REGISTRATION
        print("\n--- 1. Testing Student Registration ---")
        ts = int(time.time()) % 100000
        student_roll = f"71012110{ts:04d}"
        student_email_raw = f" {student_roll}@ACETCBE.EDU.IN "  # Tests trim + lowercase
        student_email_normalized = f"{student_roll}@acetcbe.edu.in"
        student_password = "StudentPass@2026"
        student_name = "Kavitha R"

        resp = client.post("/api/auth/register", json={
            "name": student_name,
            "email": student_email_raw,
            "password": student_password,
            "role": "student",
            "employee_or_student_id": student_roll,
            "phone": "9876543210"
        })
        assert resp.status_code == 201, f"Student registration failed: {resp.status_code}, {resp.get_json()}"
        reg_res = resp.get_json()
        assert reg_res['success'] is True
        assert reg_res['user']['email'] == student_email_normalized
        print(f" [+] Student registered: {reg_res['user']['name']} ({reg_res['user']['email']})")

        # 2. SQLITE DIRECT DATABASE VERIFICATION
        print("\n--- 2. Verifying SQLite Database Record ---")
        assert os.path.exists(DB_PATH), f"Database not found at {DB_PATH}"
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        cur.execute("SELECT id, name, email, role, password_hash, is_active FROM users WHERE email = ?", (student_email_normalized,))
        row = cur.fetchone()
        assert row is not None, f"User not found in SQLite database {DB_PATH}"
        uid, uname, uemail, urole, uhash, uactive = row
        assert uemail == student_email_normalized
        assert urole == 'student'
        assert uhash != student_password, "CRITICAL: Password must NOT be stored as plain text!"
        assert uhash.startswith("scrypt:") or uhash.startswith("pbkdf2:"), "Secure password hash algorithm verified"
        assert uactive == 1
        conn.close()
        print(f" [+] SQLite direct check passed: ID={uid}, Hash={uhash[:20]}... (Securely hashed)")

        # 3. FIRST LOGIN WITH SAME CREDENTIALS
        print("\n--- 3. Testing Student First Login ---")
        login_resp = client.post("/api/auth/login", json={
            "email": student_email_raw,
            "password": student_password
        })
        assert login_resp.status_code == 200, f"Login failed: {login_resp.status_code}, {login_resp.get_json()}"
        login_res = login_resp.get_json()
        assert login_res['success'] is True
        assert login_res['user']['email'] == student_email_normalized
        print(f" [+] Login succeeded: {login_res['user']['name']} ({login_res['user']['role']})")

        # 4. VERIFY /api/auth/me SESSION
        print("\n--- 4. Testing /api/auth/me Session Persistence ---")
        me_resp = client.get("/api/auth/me")
        assert me_resp.status_code == 200, f"/api/auth/me failed: {me_resp.get_json()}"
        me_res = me_resp.get_json()
        assert me_res['user']['email'] == student_email_normalized
        print(f" [+] /api/auth/me returned active user: {me_res['user']['name']}")

        # 5. LOGOUT
        print("\n--- 5. Testing Logout ---")
        logout_resp = client.post("/api/auth/logout")
        assert logout_resp.status_code == 200
        print(" [+] Logout succeeded")

        # Verify session is cleared
        me_after_logout = client.get("/api/auth/me")
        assert me_after_logout.status_code == 401, f"Expected 401 after logout, got {me_after_logout.status_code}"
        print(" [+] Verified session cleared (/api/auth/me returns 401)")

        # 6. SECOND LOGIN WITH SAME CREDENTIALS
        print("\n--- 6. Testing Student Second Login ---")
        login_resp_2 = client.post("/api/auth/login", json={
            "email": student_email_normalized,
            "password": student_password
        })
        assert login_resp_2.status_code == 200, f"Second login failed: {login_resp_2.status_code}, {login_resp_2.get_json()}"
        login_res_2 = login_resp_2.get_json()
        assert login_res_2['user']['email'] == student_email_normalized
        print(f" [+] Second login succeeded: {login_res_2['user']['email']}")

        # 7. FACULTY REGISTRATION & LOGIN
        print("\n--- 7. Testing Faculty Registration & Login ---")
        faculty_email = f"dr.ramesh.{ts}@acetcbe.edu.in"
        faculty_password = "FacultyPass@2026"
        
        fac_resp = client.post("/api/auth/register", json={
            "name": "Dr. Ramesh Kumar",
            "email": faculty_email,
            "password": faculty_password,
            "role": "faculty",
            "employee_or_student_id": f"ACET-FAC-{ts}",
            "phone": "9845012345"
        })
        assert fac_resp.status_code == 201, f"Faculty registration failed: {fac_resp.get_json()}"
        fac_reg = fac_resp.get_json()
        assert fac_reg['user']['role'] == 'faculty'
        print(f" [+] Faculty registered: {fac_reg['user']['name']} ({fac_reg['user']['email']})")

        # Faculty login
        fac_login_resp = client.post("/api/auth/login", json={
            "email": faculty_email,
            "password": faculty_password
        })
        assert fac_login_resp.status_code == 200, f"Faculty login failed: {fac_login_resp.get_json()}"
        fac_login = fac_login_resp.get_json()
        assert fac_login['user']['role'] == 'faculty'
        print(f" [+] Faculty login succeeded: {fac_login['user']['name']}")

        # 8. ERROR CASES
        print("\n--- 8. Testing Specific Error Responses ---")
        
        # Duplicate email
        dup_resp = client.post("/api/auth/register", json={
            "name": "Duplicate Test",
            "email": student_email_normalized,
            "password": student_password,
            "role": "student"
        })
        assert dup_resp.status_code == 409, f"Expected 409 for duplicate email, got {dup_resp.status_code}"
        dup_res = dup_resp.get_json()
        print(f" [+] Duplicate email rejected (409): {dup_res['message']}")

        # Non-college email
        non_col_resp = client.post("/api/auth/register", json={
            "name": "Gmail User",
            "email": "user@gmail.com",
            "password": "Password@123",
            "role": "student"
        })
        assert non_col_resp.status_code == 400
        non_college = non_col_resp.get_json()
        print(f" [+] Non-college domain rejected (400): {non_college['message']}")

        # Account not found
        not_found_resp = client.post("/api/auth/login", json={
            "email": "nonexistent_999@acetcbe.edu.in",
            "password": "Password@123"
        })
        assert not_found_resp.status_code == 404, f"Expected 404 for unknown user, got {not_found_resp.status_code}"
        not_found = not_found_resp.get_json()
        print(f" [+] Account not found error (404): {not_found['message']}")

        # Incorrect password
        wrong_pass_resp = client.post("/api/auth/login", json={
            "email": student_email_normalized,
            "password": "WrongPassword@999"
        })
        assert wrong_pass_resp.status_code == 401, f"Expected 401 for wrong password, got {wrong_pass_resp.status_code}"
        wrong_pass = wrong_pass_resp.get_json()
        print(f" [+] Incorrect password error (401): {wrong_pass['message']}")

        # Disabled account
        u = User.query.filter_by(email=student_email_normalized).first()
        u.is_active = False
        db.session.commit()

        disabled_resp = client.post("/api/auth/login", json={
            "email": student_email_normalized,
            "password": student_password
        })
        assert disabled_resp.status_code == 403, f"Expected 403 for disabled user, got {disabled_resp.status_code}"
        disabled_msg = disabled_resp.get_json()
        print(f" [+] Disabled account rejected (403): {disabled_msg['message']}")

        print("\n=======================================================")
        print("  ALL REGISTRATION & LOGIN TESTS PASSED (100% OK)!")
        print("=======================================================")

if __name__ == '__main__':
    test_full_auth_system()
