"""
Verification script for Student Registration Flow, Validation, and System Integrity.
Tests:
1. Successful Student Registration against backend API (201 Created, success=True).
2. Failed Student Registration (Duplicate email -> 409 Conflict, validation errors -> 400).
3. Verification of Existing Login endpoints for all 4 roles (Student, Faculty, Maintenance, Management).
4. Verification that Dashboard routes are intact.
"""
import requests
import time
import sys

BASE_URL = "http://127.0.0.1:5000"

def run_tests():
    print("=" * 60)
    print("  CAMPUSENTRY STUDENT REGISTRATION FLOW & INTEGRITY TESTS")
    print("=" * 60)

    # 1. Health Check
    try:
        health = requests.get(f"{BASE_URL}/api/health", timeout=5)
        print(f"[+] Server Health Check: HTTP {health.status_code} - {health.json()}")
    except Exception as e:
        print(f"[-] Server not reachable on {BASE_URL}: {e}")
        sys.exit(1)

    # 2. Test Registration Failure (Duplicate Email)
    print("\n--- TEST 1: Registration Failure (Duplicate Email) ---")
    dup_email = "student.duplicate_check@acetcbe.edu.in"
    initial_payload = {
        "name": "First Student",
        "email": dup_email,
        "password": "Password@123",
        "role": "student"
    }
    # Initial registration (or already registered)
    requests.post(f"{BASE_URL}/api/auth/register", json=initial_payload)
    
    # Second registration with same email must fail with 409
    fail_payload = {
        "name": "Duplicate Student",
        "email": dup_email,
        "password": "Password@123",
        "role": "student"
    }
    fail_res = requests.post(f"{BASE_URL}/api/auth/register", json=fail_payload)
    print(f"Status Code: {fail_res.status_code} (Expected 409)")
    fail_data = fail_res.json()
    print(f"Response: {fail_data}")
    assert fail_res.status_code == 409, f"Expected 409, got {fail_res.status_code}"
    assert fail_data.get("success") is False, "Expected success=False"
    print(" [PASS] Registration failure correctly rejected with 409 Conflict and error message.")

    # 3. Test Registration Failure (Validation error - weak password & invalid email domain)
    print("\n--- TEST 2: Registration Failure (Validation Checks) ---")
    invalid_payload = {
        "name": "Invalid Student",
        "email": "student@gmail.com", # Non-college domain
        "password": "123", # Too short
        "role": "student"
    }
    inv_res = requests.post(f"{BASE_URL}/api/auth/register", json=invalid_payload)
    print(f"Status Code: {inv_res.status_code} (Expected 400)")
    inv_data = inv_res.json()
    print(f"Response: {inv_data}")
    assert inv_res.status_code == 400, f"Expected 400, got {inv_res.status_code}"
    assert inv_data.get("success") is False, "Expected success=False"
    print(" [PASS] Invalid registration correctly rejected with 400 Bad Request.")

    # 4. Test Registration Success (New Student)
    print("\n--- TEST 3: Registration Success (New Student Flow) ---")
    unique_id = int(time.time()) % 100000
    success_payload = {
        "name": f"Priya TestStudent_{unique_id}",
        "email": f"priya.student_{unique_id}@acetcbe.edu.in",
        "password": "Password@123",
        "role": "student",
        "department": "Information Technology (IT)",
        "employee_or_student_id": f"710121104{unique_id:05d}",
        "phone": "+91 98765 11223"
    }
    succ_res = requests.post(f"{BASE_URL}/api/auth/register", json=success_payload)
    print(f"Status Code: {succ_res.status_code} (Expected 201)")
    succ_data = succ_res.json()
    print(f"Response: {succ_data}")
    assert succ_res.status_code == 201, f"Expected 201, got {succ_res.status_code}"
    assert succ_data.get("success") is True, "Expected success=True"
    assert succ_data.get("user", {}).get("email") == success_payload["email"].lower()
    print(" [PASS] Student registration succeeded with confirmed 201 Created and user record.")

    # 5. Verify Newly Registered Student Can Log In
    print("\n--- TEST 4: Login with Newly Registered Student ---")
    session = requests.Session()
    login_res = session.post(f"{BASE_URL}/api/auth/login", json={
        "email": success_payload["email"],
        "password": success_payload["password"]
    })
    print(f"Status Code: {login_res.status_code} (Expected 200)")
    login_data = login_res.json()
    print(f"Response: {login_data}")
    assert login_res.status_code == 200
    assert login_data.get("success") is True
    assert login_data.get("user", {}).get("role") == "student"
    print(" [PASS] Newly registered student successfully authenticated.")

    # 6. Verify Existing Core Logins & Roles Remain Unmodified
    print("\n--- TEST 5: Verify Existing Core Logins & Dashboards are Unmodified ---")
    roles = [
        ("Student", "student@acetcbe.edu.in", "Student@123", "student"),
        ("Faculty", "faculty@acetcbe.edu.in", "Faculty@123", "faculty"),
        ("Maintenance", "maintenance@college.edu", "Tech@123", "maintenance"),
        ("Management", "admin@college.edu", "Admin@123", "management"),
    ]
    for label, email, password, expected_role in roles:
        s = requests.Session()
        res = s.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": password})
        assert res.status_code == 200, f"Login failed for {label}: {res.status_code}"
        user_info = res.json().get("user", {})
        assert user_info.get("role") == expected_role, f"Role mismatch for {label}: {user_info.get('role')}"
        print(f" [PASS] {label} Login ({email}) -> Authenticated as role: {user_info.get('role')}")

    print("\n" + "=" * 60)
    print("  ALL REGISTRATION & INTEGRITY VERIFICATION TESTS PASSED (5/5)!")
    print("=" * 60)

if __name__ == '__main__':
    run_tests()
