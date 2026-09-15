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

def create_valid_test_image(filename="test_issue.jpg"):
    """Returns a tuple suitable for requests multipart upload with valid JPEG headers."""
    buf = io.BytesIO(VALID_JPEG_BYTES)
    return (filename, buf, "image/jpeg")

def create_oversized_image(filename="large.jpg", size_bytes=6 * 1024 * 1024):
    """Creates a dummy byte stream larger than 5 MB."""
    buf = io.BytesIO()
    buf.write(VALID_JPEG_BYTES + b"\x00" * (size_bytes - len(VALID_JPEG_BYTES)))
    buf.seek(0)
    return (filename, buf, "image/jpeg")

def test_complaints_suite():
    print("==========================================================")
    print("  CampuSentry Grievance Submission Module Test Suite")
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

    # 1. Departments API returns active departments
    res = requests.get(f"{BASE_URL}/api/departments")
    depts = res.json().get("departments", [])
    assert_test("Departments API returns active departments", res.status_code == 200 and len(depts) >= 7)
    dept_id = depts[0]["id"] if depts else 1

    # 2. Student Authentication
    s_student1 = requests.Session()
    res = s_student1.post(f"{BASE_URL}/api/auth/login", json={"email": "student@college.edu", "password": "Student@123"})
    assert_test("Student login succeeds", res.status_code == 200)

    # 3. Student 2 Authentication (for ownership testing)
    s_student2 = requests.Session()
    res = s_student2.post(f"{BASE_URL}/api/auth/register", json={
        "name": "Second Student",
        "email": "student2@college.edu",
        "password": "Student@2026Secure",
        "role": "student",
        "employee_or_student_id": "STU-2026-002"
    })
    res = s_student2.post(f"{BASE_URL}/api/auth/login", json={"email": "student2@college.edu", "password": "Student@2026Secure"})
    assert_test("Student 2 login succeeds", res.status_code == 200)

    # 4. Faculty Authentication
    s_faculty = requests.Session()
    res = s_faculty.post(f"{BASE_URL}/api/auth/login", json={"email": "faculty@college.edu", "password": "Faculty@123"})
    assert_test("Faculty login succeeds", res.status_code == 200)

    # 5. Maintenance Authentication
    s_maint = requests.Session()
    res = s_maint.post(f"{BASE_URL}/api/auth/login", json={"email": "electrician@college.edu", "password": "Tech@123"})
    assert_test("Maintenance login succeeds", res.status_code == 200)

    # 6. Management Authentication
    s_admin = requests.Session()
    res = s_admin.post(f"{BASE_URL}/api/auth/login", json={"email": "admin@college.edu", "password": "Admin@123"})
    assert_test("Management login succeeds", res.status_code == 200)

    # 7. Role Restriction: Maintenance cannot create complaint (HTTP 403)
    res = s_maint.post(
        f"{BASE_URL}/api/complaints",
        data={"title": "Maintenance Test", "description": "Test description long enough", "location": "Lab 1", "department_id": dept_id},
        files={"issue_photo": create_valid_test_image()}
    )
    assert_test("Maintenance role denied complaint creation (403)", res.status_code == 403)

    # 8. Role Restriction: Management cannot create complaint (HTTP 403)
    res = s_admin.post(
        f"{BASE_URL}/api/complaints",
        data={"title": "Admin Test", "description": "Test description long enough", "location": "Lab 1", "department_id": dept_id},
        files={"issue_photo": create_valid_test_image()}
    )
    assert_test("Management role denied complaint creation (403)", res.status_code == 403)

    # 9. Validation: Missing fields fail (HTTP 400)
    res = s_student1.post(
        f"{BASE_URL}/api/complaints",
        data={"title": "Short", "description": "Short", "location": "A", "department_id": dept_id},
        files={"issue_photo": create_valid_test_image()}
    )
    assert_test("Invalid short title/description rejected (400)", res.status_code == 400)

    # 10. Validation: Invalid image extension (HTTP 400)
    bad_file = ("script.py", io.BytesIO(b"print('hack')"), "text/x-python")
    res = s_student1.post(
        f"{BASE_URL}/api/complaints",
        data={"title": "Valid Complaint Title", "description": "Valid complaint description with enough length", "location": "Block C Room 101", "department_id": dept_id},
        files={"issue_photo": bad_file}
    )
    assert_test("Invalid non-image extension rejected (400)", res.status_code == 400)

    # 11. Validation: Oversized image (>5 MB) rejected (HTTP 400)
    res = s_student1.post(
        f"{BASE_URL}/api/complaints",
        data={"title": "Valid Complaint Title", "description": "Valid complaint description with enough length", "location": "Block C Room 101", "department_id": dept_id},
        files={"issue_photo": create_oversized_image()}
    )
    assert_test("Oversized image (>5MB) rejected (400)", res.status_code == 400)

    # 12. Valid Student Complaint Submission (HTTP 201)
    res = s_student1.post(
        f"{BASE_URL}/api/complaints",
        data={
            "title": "Broken electrical outlet in Library",
            "description": "The wall socket on table 4 is sparking when plugging in laptop charger.",
            "location": "Central Library - 2nd Floor Reading Room",
            "priority": "High",
            "department_id": dept_id
        },
        files={"issue_photo": create_valid_test_image("spark.jpg")}
    )
    c1_data = res.json()
    assert_test("Student complaint submission succeeds (201)", res.status_code == 201 and c1_data.get("success") is True)
    
    complaint1 = c1_data.get("complaint", {})
    c1_id = complaint1.get("id")
    c1_number = complaint1.get("complaint_number")
    c1_photo = complaint1.get("issue_photo")

    assert_test("Complaint number formatted as CH-YYYY-XXXXX", c1_number and c1_number.startswith("CH-"))
    assert_test("Initial status set to 'Submitted'", complaint1.get("status") == "Submitted")

    # 13. Image Serving: GET /uploads/issues/<filename> (HTTP 200)
    if c1_photo:
        res = requests.get(f"{BASE_URL}{c1_photo}")
        assert_test("Uploaded issue image is accessible (200)", res.status_code == 200)
    else:
        assert_test("Uploaded issue image is accessible (200)", False, "Photo URL missing")

    # 14. Faculty Complaint Submission (HTTP 201)
    res = s_faculty.post(
        f"{BASE_URL}/api/complaints",
        data={
            "title": "Projector HDMI port damaged in Seminar Hall",
            "description": "The ceiling mounted projector has a bent HDMI connector pin.",
            "location": "Engineering Block A - Seminar Hall 1",
            "priority": "Medium",
            "department_id": dept_id
        },
        files={"issue_photo": create_valid_test_image("projector.png")}
    )
    c2_data = res.json()
    assert_test("Faculty complaint submission succeeds (201)", res.status_code == 201)
    c2_id = c2_data.get("complaint", {}).get("id")

    # 15. Student 1 My Complaints List
    res = s_student1.get(f"{BASE_URL}/api/complaints")
    student1_list = res.json().get("complaints", [])
    assert_test("Student 1 receives their submitted complaint", res.status_code == 200 and any(c["id"] == c1_id for c in student1_list))

    # 16. Ownership Isolation: Student 2 cannot see Student 1's complaint in My Complaints
    res = s_student2.get(f"{BASE_URL}/api/complaints")
    student2_list = res.json().get("complaints", [])
    assert_test("Student 2 list does NOT contain Student 1's complaint", not any(c["id"] == c1_id for c in student2_list))

    # 17. Ownership Isolation: Student 2 cannot access Student 1's complaint detail (HTTP 403)
    res = s_student2.get(f"{BASE_URL}/api/complaints/{c1_id}")
    assert_test("Student 2 denied direct detail access to Student 1's complaint (403)", res.status_code == 403)

    # 18. Student 1 can access their own complaint detail (HTTP 200)
    res = s_student1.get(f"{BASE_URL}/api/complaints/{c1_id}")
    assert_test("Student 1 allowed direct detail access to own complaint (200)", res.status_code == 200 and res.json().get("complaint", {}).get("id") == c1_id)

    print("\n==========================================================")
    print(f"  Test Results: {passed}/{total} Passed")
    print("==========================================================")
    if passed == total:
        print("  ALL GRIEVANCE SUBMISSION MODULE TESTS PASSED!")
    else:
        sys.exit(1)

if __name__ == '__main__':
    test_complaints_suite()
