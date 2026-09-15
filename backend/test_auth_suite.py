import requests
import json
import sys

BASE_URL = "http://127.0.0.1:5000"

def test_suite():
    print("==========================================================")
    print("  CampuSentry Authentication & RBAC Test Suite")
    print("==========================================================")
    
    passed = 0
    total = 0

    def assert_test(name, condition, details=""):
        nonlocal passed, total
        total += 1
        if condition:
            passed += 1
            print(f" [PASS] {name}")
        else:
            print(f" [FAIL] {name} - {details}")

    # 1. Health check
    res = requests.get(f"{BASE_URL}/api/health")
    assert_test("Health check endpoint", res.status_code == 200 and res.json().get("status") == "ok")

    # 2. Departments API
    res = requests.get(f"{BASE_URL}/api/departments")
    depts = res.json().get("departments", [])
    assert_test("Departments API returns 7 departments", res.status_code == 200 and len(depts) >= 7, f"Got: {len(depts)}")

    # 3. Invalid credentials fail with 401
    res = requests.post(f"{BASE_URL}/api/auth/login", json={"email": "admin@college.edu", "password": "WrongPassword123"})
    assert_test("Invalid password returns 401", res.status_code == 401 and res.json().get("success") is False)

    # 4. Student login
    s_student = requests.Session()
    res = s_student.post(f"{BASE_URL}/api/auth/login", json={"email": "student@college.edu", "password": "Student@123"})
    data = res.json()
    assert_test(
        "Student login succeeds (200)",
        res.status_code == 200 and data.get("success") is True and data.get("user", {}).get("role") == "student"
    )
    assert_test("Password hash not in response", "password_hash" not in str(data))

    # 5. /api/auth/me for student
    res = s_student.get(f"{BASE_URL}/api/auth/me")
    assert_test("Student /api/auth/me returns authenticated student", res.status_code == 200 and res.json().get("user", {}).get("email") == "student@college.edu")

    # 6. Student cannot access management endpoint (403)
    res = s_student.get(f"{BASE_URL}/api/auth/test/management")
    assert_test("Student denied access to management-only route (403)", res.status_code == 403 and res.json().get("success") is False)

    # 7. Student can access student/faculty route (200)
    res = s_student.get(f"{BASE_URL}/api/auth/test/staff")
    assert_test("Student allowed on student/faculty route (200)", res.status_code == 200 and res.json().get("success") is True)

    # 8. Faculty login
    s_faculty = requests.Session()
    res = s_faculty.post(f"{BASE_URL}/api/auth/login", json={"email": "faculty@college.edu", "password": "Faculty@123"})
    assert_test("Faculty login succeeds (200)", res.status_code == 200 and res.json().get("user", {}).get("role") == "faculty")

    # 9. Maintenance login
    s_maint = requests.Session()
    res = s_maint.post(f"{BASE_URL}/api/auth/login", json={"email": "electrician@college.edu", "password": "Tech@123"})
    maint_data = res.json()
    assert_test(
        "Maintenance login succeeds with department (200)",
        res.status_code == 200 and maint_data.get("user", {}).get("role") == "maintenance" and maint_data.get("user", {}).get("department") == "Electrical"
    )

    # 10. Maintenance cannot access management route (403)
    res = s_maint.get(f"{BASE_URL}/api/auth/test/management")
    assert_test("Maintenance denied access to management route (403)", res.status_code == 403)

    # 11. Maintenance can access maintenance route (200)
    res = s_maint.get(f"{BASE_URL}/api/auth/test/maintenance")
    assert_test("Maintenance allowed on maintenance route (200)", res.status_code == 200)

    # 12. Management login
    s_admin = requests.Session()
    res = s_admin.post(f"{BASE_URL}/api/auth/login", json={"email": "admin@college.edu", "password": "Admin@123"})
    assert_test("Management login succeeds (200)", res.status_code == 200 and res.json().get("user", {}).get("role") == "management")

    # 13. Management can access management route (200)
    res = s_admin.get(f"{BASE_URL}/api/auth/test/management")
    assert_test("Management allowed on management route (200)", res.status_code == 200)

    # 14. Registration validation: Disallow maintenance role in public registration
    res = requests.post(f"{BASE_URL}/api/auth/register", json={
        "name": "Hacker Tech",
        "email": "hacker@college.edu",
        "password": "Password123",
        "role": "maintenance"
    })
    assert_test("Public registration rejects 'maintenance' role (400)", res.status_code == 400 and res.json().get("success") is False)

    # 15. Registration validation: Disallow password < 8 chars
    res = requests.post(f"{BASE_URL}/api/auth/register", json={
        "name": "Short Pass User",
        "email": "short@college.edu",
        "password": "123",
        "role": "student"
    })
    assert_test("Registration rejects short password (400)", res.status_code == 400)

    # 16. Valid registration: Student
    res = requests.post(f"{BASE_URL}/api/auth/register", json={
        "name": "New Enrolled Student",
        "email": "newstudent@college.edu",
        "password": "Student@2026Secure",
        "role": "student",
        "employee_or_student_id": "STU-2026-999"
    })
    assert_test(
        "Valid student registration succeeds (201 or 409 if already exists)",
        res.status_code in (201, 409)
    )

    # 17. Unauthenticated user gets 401 on /api/auth/me
    res = requests.get(f"{BASE_URL}/api/auth/me")
    assert_test("Unauthenticated /api/auth/me returns 401", res.status_code == 401 and res.json().get("success") is False)

    # 18. Logout
    res = s_student.post(f"{BASE_URL}/api/auth/logout")
    assert_test("Logout returns 200", res.status_code == 200 and res.json().get("success") is True)
    res = s_student.get(f"{BASE_URL}/api/auth/me")
    assert_test("After logout /api/auth/me returns 401", res.status_code == 401)

    print("\n==========================================================")
    print(f"  Test Results: {passed}/{total} Passed")
    print("==========================================================")
    if passed == total:
        print("  ALL AUTHENTICATION & RBAC TESTS PASSED!")
    else:
        sys.exit(1)

if __name__ == '__main__':
    test_suite()
