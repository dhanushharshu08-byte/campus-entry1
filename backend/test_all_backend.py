import os
import requests
import sys
import io

BASE_URL = "http://127.0.0.1:5000"

# Minimal valid 1x1 pixel JPEG binary stream
VALID_JPEG_BYTES = (
    b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00'
    b'\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c'
    b'\x14\x0d\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c'
    b'\x1c $.\' ",#\x1c\x1c(7),01444\x1f\'9=82<.342\xff\xc0\x00\x0b\x08\x00'
    b'\x01\x00\x01\x01\x01\x11\x00\xff\xc4\x00\x1f\x00\x00\x01\x05\x01\x01\x01'
    b'\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07'
    b'\x08\t\n\x0b\xff\xda\x00\x08\x01\x01\x00\x00?\x00\xbf\x00\xff\xd9'
)

def create_valid_test_image(filename="test_audit.jpg"):
    buf = io.BytesIO(VALID_JPEG_BYTES)
    return (filename, buf, "image/jpeg")

def run_comprehensive_backend_audit():
    print("==========================================================")
    print("  CampuSentry Complete Backend Codebase Audit")
    print("==========================================================")

    passed = 0
    total = 0

    def test_assert(name, condition, error_detail=""):
        nonlocal passed, total
        total += 1
        if condition:
            passed += 1
            print(f" [PASS] {name}")
        else:
            print(f" [FAIL] {name} - {error_detail}")

    # 1. Health check
    res = requests.get(f"{BASE_URL}/api/health")
    test_assert("Health Check API (/api/health)", res.status_code == 200 and res.json().get("status") == "ok")

    # 2. Departments API
    res = requests.get(f"{BASE_URL}/api/departments")
    depts = res.json().get("departments", [])
    test_assert("Departments API (/api/departments)", res.status_code == 200 and len(depts) >= 7)
    dept_id = depts[0]["id"] if depts else 1

    # 3. Logins for all 4 roles
    s_student = requests.Session()
    res = s_student.post(f"{BASE_URL}/api/auth/login", json={"email": "student@acetcbe.edu.in", "password": "Student@123"})
    test_assert("Student Login", res.status_code == 200 and res.json().get("user", {}).get("role") == "student")

    s_faculty = requests.Session()
    res = s_faculty.post(f"{BASE_URL}/api/auth/login", json={"email": "faculty@acetcbe.edu.in", "password": "Faculty@123"})
    test_assert("Faculty Login", res.status_code == 200 and res.json().get("user", {}).get("role") == "faculty")

    s_maint = requests.Session()
    res = s_maint.post(f"{BASE_URL}/api/auth/login", json={"email": "maintenance@college.edu", "password": "Tech@123"})
    test_assert("Maintenance Login", res.status_code == 200 and res.json().get("user", {}).get("role") == "maintenance")

    s_admin = requests.Session()
    res = s_admin.post(f"{BASE_URL}/api/auth/login", json={"email": "admin@college.edu", "password": "Admin@123"})
    test_assert("Management Login", res.status_code == 200 and res.json().get("user", {}).get("role") == "management")

    # 4. Current User Profile (/api/auth/me)
    res = s_student.get(f"{BASE_URL}/api/auth/me")
    test_assert("Current User Profile (/api/auth/me)", res.status_code == 200 and res.json().get("user", {}).get("email") == "student@acetcbe.edu.in")

    # 5. Grievance Creation (Student)
    res = s_student.post(
        f"{BASE_URL}/api/complaints",
        data={
            "title": "Audit Test Electrical Issue",
            "description": "Comprehensive audit testing description for campus helpdesk.",
            "location": "Academic Block B Room 102",
            "priority": "Medium",
            "department_id": dept_id
        },
        files={"issue_photo": create_valid_test_image()}
    )
    test_assert("Grievance Submission (POST /api/complaints)", res.status_code == 201 and res.json().get("success") is True)
    c_data = res.json().get("complaint", {})
    c_id = c_data.get("id")
    c_photo = c_data.get("issue_photo")

    # 6. Serve Image Attachment
    if c_photo:
        res = requests.get(f"{BASE_URL}{c_photo}")
        test_assert("Static Issue Photo Serving (/uploads/issues/...)", res.status_code == 200)
    else:
        test_assert("Static Issue Photo Serving (/uploads/issues/...)", False, "Photo URL missing")

    # 7. Single Grievance Detail
    if c_id:
        res = s_student.get(f"{BASE_URL}/api/complaints/{c_id}")
        test_assert("Single Grievance Detail (GET /api/complaints/<id>)", res.status_code == 200 and res.json().get("complaint", {}).get("id") == c_id)

    # 8. Dashboard Statistics (/api/dashboard/stats)
    res = requests.get(f"{BASE_URL}/api/dashboard/stats")
    metrics = res.json().get("metrics", {})
    test_assert("Dashboard Statistics (/api/dashboard/stats)", res.status_code == 200 and metrics.get("total_complaints", 0) >= 1)

    # 9. Notifications List (/api/notifications)
    res = s_student.get(f"{BASE_URL}/api/notifications")
    test_assert("User Notifications (/api/notifications)", res.status_code == 200)

    # 10. Logout (/api/auth/logout)
    s_temp = requests.Session()
    s_temp.post(f"{BASE_URL}/api/auth/login", json={"email": "student@acetcbe.edu.in", "password": "Student@123"})
    res = s_temp.post(f"{BASE_URL}/api/auth/logout")
    test_assert("User Logout (POST /api/auth/logout)", res.status_code == 200)
    res = s_temp.get(f"{BASE_URL}/api/auth/me")
    test_assert("Post-Logout Profile Check (401)", res.status_code == 401)

    print("\n==========================================================")
    print(f"  Audit Results: {passed}/{total} Passed")
    print("==========================================================")
    if passed == total:
        print("  ALL BACKEND ROUTE & MODEL AUDIT TESTS PASSED!")
    else:
        sys.exit(1)

if __name__ == '__main__':
    run_comprehensive_backend_audit()
