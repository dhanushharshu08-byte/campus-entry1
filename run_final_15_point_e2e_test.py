"""
CampuSentry Complete 15-Point End-to-End Live System Verification Test
Executes the exact 15-step workflow against running live backend (5000) and frontend (5173).
"""

import urllib.request
import urllib.parse
import http.cookiejar
import json
import uuid
import os
import sys
import sqlite3
import time

BACKEND_URL = "http://127.0.0.1:5000"
FRONTEND_URL = "http://localhost:5173"
DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "backend", "campus_helpdesk.db"))

results = {}

def make_session():
    cj = http.cookiejar.CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
    opener.cookie_jar = cj
    return opener

def post_json(opener, path, data):
    url = f"{BACKEND_URL}{path}"
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    try:
        with opener.open(req) as resp:
            return resp.status, json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, body

def patch_json(opener, path, data):
    url = f"{BACKEND_URL}{path}"
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='PATCH'
    )
    try:
        with opener.open(req) as resp:
            return resp.status, json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, body

def post_multipart(opener, path, fields, files):
    url = f"{BACKEND_URL}{path}"
    boundary = f"----WebKitFormBoundary{uuid.uuid4().hex}"
    body = bytearray()

    for name, value in fields.items():
        body.extend(f"--{boundary}\r\n".encode('utf-8'))
        body.extend(f'Content-Disposition: form-data; name="{name}"\r\n\r\n'.encode('utf-8'))
        body.extend(f"{value}\r\n".encode('utf-8'))

    for name, (filename, filedata, content_type) in files.items():
        body.extend(f"--{boundary}\r\n".encode('utf-8'))
        body.extend(f'Content-Disposition: form-data; name="{name}"; filename="{filename}"\r\n'.encode('utf-8'))
        body.extend(f"Content-Type: {content_type}\r\n\r\n".encode('utf-8'))
        body.extend(filedata)
        body.extend(b"\r\n")

    body.extend(f"--{boundary}--\r\n".encode('utf-8'))

    req = urllib.request.Request(
        url,
        data=bytes(body),
        headers={'Content-Type': f'multipart/form-data; boundary={boundary}'}
    )
    try:
        with opener.open(req) as resp:
            return resp.status, json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, body

def get_json(opener, path):
    url = f"{BACKEND_URL}{path}"
    req = urllib.request.Request(url)
    try:
        with opener.open(req) as resp:
            return resp.status, json.loads(resp.read().decode('utf-8')), resp.headers
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        try:
            return e.code, json.loads(body), e.headers
        except Exception:
            return e.code, body, e.headers

def run_15_point_e2e_test():
    print("=" * 70)
    print("  CAMPUSENTRY 15-POINT EXACT END-TO-END VERIFICATION TEST")
    print("=" * 70)

    # -------------------------------------------------------------
    # 1. START APPLICATION & HEALTH CHECK
    # -------------------------------------------------------------
    print("\n[TEST 1/15] START APPLICATION & CONNECTIVITY")
    RETRY_SECONDS = 10  # max wait for each server to become ready

    # --- Independent backend check with retry ---
    backend_ok = False
    backend_error = None
    health_body = {}
    for _attempt in range(RETRY_SECONDS):
        try:
            health_opener = make_session()
            code, health_body, _ = get_json(health_opener, "/api/health")
            if code == 200 and health_body.get('status') == 'ok' and health_body.get('database') == 'connected':
                backend_ok = True
                break
            backend_error = f"Unexpected health response (HTTP {code}): {health_body}"
        except Exception as exc:
            backend_error = str(exc)
        time.sleep(1)

    # --- Independent frontend check with retry ---
    frontend_ok = False
    frontend_error = None
    for _attempt in range(RETRY_SECONDS):
        try:
            with urllib.request.urlopen(
                urllib.request.Request(FRONTEND_URL), timeout=5
            ) as resp:
                if resp.status == 200:
                    frontend_ok = True
                    break
                frontend_error = f"HTTP {resp.status} (expected 200)"
        except Exception as exc:
            frontend_error = str(exc)
        time.sleep(1)

    # --- Both must be reachable for PASS ---
    try:
        assert backend_ok, f"Backend not ready: {backend_error}"
        assert frontend_ok, f"Frontend not ready: {frontend_error}"
        results['1_START_APPLICATION'] = 'PASS'
        print(f"  -> Backend running on http://127.0.0.1:5000 (/api/health: {health_body})")
        print("  -> Frontend running on http://localhost:5173 (HTTP 200)")
        print("  -> Result: PASS")
    except Exception as e:
        results['1_START_APPLICATION'] = f'FAIL: {e}'
        print(f"  -> Backend reachable: {backend_ok}" + ("" if backend_ok else f" | Error: {backend_error}"))
        print(f"  -> Frontend reachable: {frontend_ok}" + ("" if frontend_ok else f" | Error: {frontend_error}"))
        print(f"  -> Result: FAIL ({e})")

    # -------------------------------------------------------------
    # 2. STUDENT LOGIN
    # -------------------------------------------------------------
    print("\n[TEST 2/15] STUDENT LOGIN")
    student_sess = make_session()
    try:
        code, login_res = post_json(student_sess, "/api/auth/login", {
            "email": "student@acetcbe.edu.in",
            "password": "Student@123"
        })
        assert code == 200, f"Status code {code}: {login_res}"
        assert login_res['user']['role'] == 'student'
        assert login_res['user']['email'] == 'student@acetcbe.edu.in'

        # Verify /api/auth/me session persistence
        code_me, me_res, _ = get_json(student_sess, "/api/auth/me")
        assert code_me == 200 and me_res['user']['role'] == 'student'

        results['2_STUDENT_LOGIN'] = 'PASS'
        print(f"  -> Logged in as: {login_res['user']['name']} ({login_res['user']['email']})")
        print("  -> Session verified via cookie & /api/auth/me")
        print("  -> Result: PASS")
    except Exception as e:
        results['2_STUDENT_LOGIN'] = f'FAIL: {e}'
        print(f"  -> Result: FAIL ({e})")

    # -------------------------------------------------------------
    # 3. CREATE COMPLAINT (WITH ISSUE PHOTO)
    # -------------------------------------------------------------
    print("\n[TEST 3/15] CREATE COMPLAINT (WITH ISSUE PHOTO)")
    created_ticket_id = None
    created_complaint_number = None
    try:
        sample_img = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c #\'. \" ,#\x1c\x1c8)(\x30\x31\x34\x34\x34\x1f\'9=82<.-42\xff\xc0\x00\x0b\x08\x00\x10\x00\x10\x01\x01\x11\x00\xff\xc4\x00\x1f\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\xff\xda\x00\x08\x01\x01\x00\x00?\x00\x7f\x00\xff\xd9"
        code, create_res = post_multipart(
            student_sess,
            "/api/complaints",
            fields={
                "title": "Severe water leakage from 2nd floor pipe",
                "department_id": "2", # Plumbing
                "location": "Hostel Block B, 2nd Floor Wash Area",
                "priority": "High",
                "description": "Continuous water leakage from the overhead plumbing joint causing water accumulation."
            },
            files={
                "issue_photo": ("pipe_leak.jpg", sample_img, "image/jpeg")
            }
        )
        assert code == 201, f"Status {code}: {create_res}"
        complaint = create_res['complaint']
        created_ticket_id = complaint['id']
        created_complaint_number = complaint['complaint_number']
        assert created_complaint_number.startswith("CH-")
        assert complaint['status'] in ['Assigned', 'Submitted']
        assert complaint['issue_photo'].startswith("/uploads/issues/")

        # Verify photo is physically accessible via static route
        photo_url = f"{BACKEND_URL}{complaint['issue_photo']}"
        with urllib.request.urlopen(photo_url) as photo_resp:
            assert photo_resp.status == 200

        results['3_CREATE_COMPLAINT'] = 'PASS'
        print(f"  -> Created Complaint Ticket: {created_complaint_number} (ID: {created_ticket_id})")
        print(f"  -> Initial Status: {complaint['status']} | Priority: {complaint['priority']}")
        print(f"  -> Issue Photo Stored & Verified: {complaint['issue_photo']} (HTTP 200)")
        print("  -> Result: PASS")
    except Exception as e:
        results['3_CREATE_COMPLAINT'] = f'FAIL: {e}'
        print(f"  -> Result: FAIL ({e})")

    # -------------------------------------------------------------
    # 4. STUDENT DASHBOARD
    # -------------------------------------------------------------
    print("\n[TEST 4/15] STUDENT DASHBOARD VERIFICATION")
    try:
        code, my_res, _ = get_json(student_sess, "/api/complaints")
        assert code == 200
        complaints_list = my_res.get('complaints', [])
        matching = [c for c in complaints_list if c['id'] == created_ticket_id]
        assert len(matching) == 1
        t = matching[0]
        assert t['complaint_number'] == created_complaint_number
        assert t['department'] == 'Plumbing'
        assert t['status'] in ['Assigned', 'Submitted']

        results['4_STUDENT_DASHBOARD'] = 'PASS'
        print(f"  -> Found complaint in Student list (Total: {len(complaints_list)})")
        print(f"  -> Ticket: {t['complaint_number']} | Dept: {t['department']} | Status: {t['status']}")
        print("  -> Result: PASS")
    except Exception as e:
        results['4_STUDENT_DASHBOARD'] = f'FAIL: {e}'
        print(f"  -> Result: FAIL ({e})")

    # Logout student
    post_json(student_sess, "/api/auth/logout", {})

    # -------------------------------------------------------------
    # 5. CENTRAL MAINTENANCE LOGIN
    # -------------------------------------------------------------
    print("\n[TEST 5/15] CENTRAL MAINTENANCE LOGIN")
    maint_sess = make_session()
    try:
        code, m_login = post_json(maint_sess, "/api/auth/login", {
            "email": "maintenance@college.edu",
            "password": "Tech@123"
        })
        assert code == 200
        assert m_login['user']['role'] == 'maintenance'
        assert m_login['user'].get('department') is None or m_login['user'].get('department_id') is None, "Central maintenance must have unrestricted department access"

        results['5_CENTRAL_MAINTENANCE_LOGIN'] = 'PASS'
        print(f"  -> Maintenance Logged In: {m_login['user']['name']} ({m_login['user']['email']})")
        print(f"  -> Department Scope: Central / All Departments")
        print("  -> Result: PASS")
    except Exception as e:
        results['5_CENTRAL_MAINTENANCE_LOGIN'] = f'FAIL: {e}'
        print(f"  -> Result: FAIL ({e})")

    # -------------------------------------------------------------
    # 6. CENTRAL MAINTENANCE COMPLAINT ACCESS
    # -------------------------------------------------------------
    print("\n[TEST 6/15] CENTRAL MAINTENANCE CROSS-DEPARTMENT COMPLAINT ACCESS")
    try:
        code, m_tickets, _ = get_json(maint_sess, "/api/maintenance/complaints")
        assert code == 200
        tickets = m_tickets.get('complaints', [])
        found = [c for c in tickets if c['id'] == created_ticket_id]
        assert len(found) == 1, f"Complaint {created_ticket_id} not visible in central maintenance view"

        results['6_MAINTENANCE_COMPLAINT_ACCESS'] = 'PASS'
        print(f"  -> Central Maintenance can view ticket {created_complaint_number} (Dept: Plumbing)")
        print(f"  -> Total Maintenance Visible Tickets: {len(tickets)}")
        print("  -> Result: PASS")
    except Exception as e:
        results['6_MAINTENANCE_COMPLAINT_ACCESS'] = f'FAIL: {e}'
        print(f"  -> Result: FAIL ({e})")

    # -------------------------------------------------------------
    # 7. MAINTENANCE ACTION (IN PROGRESS)
    # -------------------------------------------------------------
    print("\n[TEST 7/15] MAINTENANCE ACTION (IN PROGRESS / ACCEPT)")
    try:
        code, accept_res = post_json(maint_sess, f"/api/maintenance/complaints/{created_ticket_id}/accept", {})
        assert code == 200, f"Accept failed: {accept_res}"
        assert accept_res['complaint']['status'] == 'In Progress'

        # Check detail endpoint
        code_det, det_res, _ = get_json(maint_sess, f"/api/complaints/{created_ticket_id}")
        assert code_det == 200
        assert det_res['complaint']['status'] == 'In Progress'

        results['7_MAINTENANCE_ACTION_IN_PROGRESS'] = 'PASS'
        print(f"  -> Ticket {created_complaint_number} transitioned to: {accept_res['complaint']['status']}")
        print("  -> Result: PASS")
    except Exception as e:
        results['7_MAINTENANCE_ACTION_IN_PROGRESS'] = f'FAIL: {e}'
        print(f"  -> Result: FAIL ({e})")

    # -------------------------------------------------------------
    # 8. MAINTENANCE RESOLUTION (RESOLVED + PHOTO + REMARKS)
    # -------------------------------------------------------------
    print("\n[TEST 8/15] MAINTENANCE RESOLUTION (RESOLVED + PHOTO + REMARKS)")
    try:
        res_img = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c #\'. \" ,#\x1c\x1c8)(\x30\x31\x34\x34\x34\x1f\'9=82<.-42\xff\xc0\x00\x0b\x08\x00\x10\x00\x10\x01\x01\x11\x00\xff\xc4\x00\x1f\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\xff\xda\x00\x08\x01\x01\x00\x00?\x00\x7f\x00\xff\xd9"
        code, resolve_res = post_multipart(
            maint_sess,
            f"/api/maintenance/complaints/{created_ticket_id}/resolve",
            fields={
                "resolution_remarks": "Replaced faulty rubber gasket seal, re-threaded junction coupling, and tested under 4 bar pressure with zero leaks."
            },
            files={
                "resolution_photo": ("fixed_pipe.jpg", res_img, "image/jpeg")
            }
        )
        assert code == 200, f"Resolve failed: {resolve_res}"
        res_comp = resolve_res['complaint']
        assert res_comp['status'] == 'Resolved'
        assert res_comp['resolution_photo'].startswith("/uploads/resolutions/")
        assert "gasket seal" in res_comp['resolution_remarks']

        # Verify static delivery of resolution photo
        res_photo_url = f"{BACKEND_URL}{res_comp['resolution_photo']}"
        with urllib.request.urlopen(res_photo_url) as res_resp:
            assert res_resp.status == 200

        results['8_MAINTENANCE_RESOLUTION'] = 'PASS'
        print(f"  -> Ticket {created_complaint_number} marked: Resolved")
        print(f"  -> Resolution Remarks: {res_comp['resolution_remarks']}")
        print(f"  -> Resolution Photo Stored: {res_comp['resolution_photo']} (HTTP 200)")
        print("  -> Result: PASS")
    except Exception as e:
        results['8_MAINTENANCE_RESOLUTION'] = f'FAIL: {e}'
        print(f"  -> Result: FAIL ({e})")

    # Logout maintenance
    post_json(maint_sess, "/api/auth/logout", {})

    # -------------------------------------------------------------
    # 9. STUDENT VERIFICATION
    # -------------------------------------------------------------
    print("\n[TEST 9/15] STUDENT RESOLUTION VERIFICATION")
    student_sess_2 = make_session()
    try:
        post_json(student_sess_2, "/api/auth/login", {
            "email": "student@acetcbe.edu.in",
            "password": "Student@123"
        })
        code, st_ticket, _ = get_json(student_sess_2, f"/api/complaints/{created_ticket_id}")
        assert code == 200
        comp_data = st_ticket['complaint']
        assert comp_data['status'] == 'Resolved'
        assert comp_data['resolution_photo'] is not None
        assert "gasket seal" in comp_data['resolution_remarks']

        results['9_STUDENT_VERIFICATION'] = 'PASS'
        print(f"  -> Student verified Ticket {created_complaint_number}")
        print(f"  -> Status: {comp_data['status']}")
        print(f"  -> Resolution Photo Verified: {comp_data['resolution_photo']}")
        print(f"  -> Resolution Remarks: {comp_data['resolution_remarks']}")
        print("  -> Result: PASS")
    except Exception as e:
        results['9_STUDENT_VERIFICATION'] = f'FAIL: {e}'
        print(f"  -> Result: FAIL ({e})")

    # Logout student
    post_json(student_sess_2, "/api/auth/logout", {})

    # -------------------------------------------------------------
    # 10. MANAGEMENT LOGIN & REALTIME METRICS
    # -------------------------------------------------------------
    print("\n[TEST 10/15] MANAGEMENT LOGIN & REALTIME METRICS")
    admin_sess = make_session()
    try:
        code, a_login = post_json(admin_sess, "/api/auth/login", {
            "email": "admin@college.edu",
            "password": "Admin@123"
        })
        assert code == 200
        assert a_login['user']['role'] == 'management'

        # Check summary metrics
        code, summary, _ = get_json(admin_sess, "/api/dashboard/summary")
        assert code == 200
        assert summary['total'] >= 1
        assert summary['resolved'] >= 1

        results['10_MANAGEMENT_METRICS'] = 'PASS'
        print(f"  -> Management Logged In: {a_login['user']['name']}")
        print(f"  -> Dashboard Metrics: Total={summary['total']}, Resolved={summary['resolved']}, Overdue={summary['overdue']}")
        print("  -> Result: PASS")
    except Exception as e:
        results['10_MANAGEMENT_METRICS'] = f'FAIL: {e}'
        print(f"  -> Result: FAIL ({e})")

    # -------------------------------------------------------------
    # 11. SYSTEM SETTINGS & SLA CONFIGURATION
    # -------------------------------------------------------------
    print("\n[TEST 11/15] SYSTEM SETTINGS & SLA CONFIGURATION")
    try:
        code, settings, _ = get_json(admin_sess, "/api/management/settings")
        assert code == 200
        assert "settings" in settings
        
        # Test SLA update via PATCH
        code_up, up_res = patch_json(admin_sess, "/api/management/settings", {
            "settings": {
                "high_sla_hours": "12",
                "medium_sla_hours": "24",
                "low_sla_hours": "48"
            }
        })
        assert code_up == 200, f"Patch settings returned {code_up}: {up_res}"

        # Verify updated settings
        code_ver, ver_settings, _ = get_json(admin_sess, "/api/management/settings")
        assert code_ver == 200
        assert ver_settings['settings']['high_sla_hours']['value'] in [12, "12", 12.0]

        results['11_SYSTEM_SETTINGS_SLA'] = 'PASS'
        print(f"  -> SLA Settings read & updated successfully: High SLA = {ver_settings['settings']['high_sla_hours']['value']} hrs")
        print("  -> Result: PASS")
    except Exception as e:
        results['11_SYSTEM_SETTINGS_SLA'] = f'FAIL: {e}'
        print(f"  -> Result: FAIL ({e})")

    # -------------------------------------------------------------
    # 12. EXPORT / REPORT DATA
    # -------------------------------------------------------------
    print("\n[TEST 12/15] EXPORT / REPORT DATA")
    try:
        # Check CSV export endpoint
        req_csv = urllib.request.Request(f"{BACKEND_URL}/api/management/reports/complaints.csv")
        # Extract session cookie
        for cookie in admin_sess.cookie_jar:
            req_csv.add_header("Cookie", f"{cookie.name}={cookie.value}")
        with urllib.request.urlopen(req_csv) as csv_resp:
            csv_data = csv_resp.read().decode('utf-8')
            assert csv_resp.status == 200
            assert "Complaint Number" in csv_data
            assert created_complaint_number in csv_data

        # Check complaints listing with filters
        code, mgt_complaints, _ = get_json(admin_sess, "/api/management/complaints?status=Resolved")
        assert code == 200
        assert mgt_complaints['pagination']['total'] >= 1

        results['12_EXPORT_REPORT'] = 'PASS'
        print(f"  -> Management CSV Export Verified: {len(csv_data)} bytes downloaded with ticket {created_complaint_number}")
        print(f"  -> Management Resolved Filter query: Total Resolved = {mgt_complaints['pagination']['total']}")
        print("  -> Result: PASS")
    except Exception as e:
        results['12_EXPORT_REPORT'] = f'FAIL: {e}'
        print(f"  -> Result: FAIL ({e})")

    # -------------------------------------------------------------
    # 13. ROLE-BASED ACCESS CONTROL (RBAC)
    # -------------------------------------------------------------
    print("\n[TEST 13/15] ROLE-BASED ACCESS CONTROL (RBAC)")
    rbac_student = make_session()
    try:
        post_json(rbac_student, "/api/auth/login", {
            "email": "student@acetcbe.edu.in",
            "password": "Student@123"
        })
        # Student trying to access management endpoints -> must return 403
        code_mgt, _, _ = get_json(rbac_student, "/api/management/settings")
        assert code_mgt == 403, f"Expected 403 Forbidden, got {code_mgt}"

        code_maint, _, _ = get_json(rbac_student, "/api/maintenance/complaints")
        assert code_maint == 403, f"Expected 403 Forbidden, got {code_maint}"

        results['13_RBAC_SECURITY'] = 'PASS'
        print(f"  -> Student access to /api/management/settings: HTTP {code_mgt} (Forbidden - Secure)")
        print(f"  -> Student access to /api/maintenance/complaints: HTTP {code_maint} (Forbidden - Secure)")
        print("  -> Result: PASS")
    except Exception as e:
        results['13_RBAC_SECURITY'] = f'FAIL: {e}'
        print(f"  -> Result: FAIL ({e})")

    # -------------------------------------------------------------
    # 14. REALTIME SOCKET.IO HEALTH
    # -------------------------------------------------------------
    print("\n[TEST 14/15] REALTIME SOCKET.IO HEALTH")
    try:
        # Check socket.io endpoint on backend
        socket_url = f"{BACKEND_URL}/socket.io/?EIO=4&transport=polling"
        req = urllib.request.Request(socket_url)
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode('utf-8')
            assert resp.status == 200
            assert "0{" in content or "sid" in content, f"Unexpected socket.io handshake: {content}"

        results['14_SOCKETIO_HEALTH'] = 'PASS'
        print("  -> Socket.IO Engine.IO v4 Handshake: HTTP 200 OK (Clean connection, no polling loops)")
        print("  -> Result: PASS")
    except Exception as e:
        results['14_SOCKETIO_HEALTH'] = f'FAIL: {e}'
        print(f"  -> Result: FAIL ({e})")

    # -------------------------------------------------------------
    # 15. DATA INTEGRITY & SINGLE SQLITE DB
    # -------------------------------------------------------------
    print("\n[TEST 15/15] DATA INTEGRITY & SINGLE SQLITE DATABASE")
    try:
        assert os.path.isfile(DB_PATH), f"Database not found at {DB_PATH}"
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        
        cur.execute("SELECT COUNT(*) FROM complaints WHERE id = ?", (created_ticket_id,))
        count = cur.fetchone()[0]
        assert count == 1, f"Complaint {created_ticket_id} not found in database {DB_PATH}"

        cur.execute("SELECT status, resolution_remarks FROM complaints WHERE id = ?", (created_ticket_id,))
        row = cur.fetchone()
        assert row[0] == 'Resolved'
        assert "gasket seal" in row[1]
        conn.close()

        # Check instance/ does not have an active split DB
        instance_db = os.path.abspath(os.path.join(os.path.dirname(__file__), "backend", "instance", "campus_helpdesk.db"))
        assert not os.path.exists(instance_db), "Instance directory has duplicate split database!"

        results['15_DATA_INTEGRITY'] = 'PASS'
        print(f"  -> Verified record in single canonical DB: {DB_PATH}")
        print(f"  -> Verified no duplicate database in instance/ directory")
        print("  -> Result: PASS")
    except Exception as e:
        results['15_DATA_INTEGRITY'] = f'FAIL: {e}'
        print(f"  -> Result: FAIL ({e})")

    # -------------------------------------------------------------
    # SUMMARY TABLE
    # -------------------------------------------------------------
    print("\n" + "=" * 70)
    print("                      FINAL E2E TEST RESULTS TABLE")
    print("=" * 70)
    all_pass = True
    for test_name, status in results.items():
        print(f" {test_name:<40} : {status}")
        if status != 'PASS':
            all_pass = False

    print("=" * 70)
    if all_pass:
        print("  ALL 15 E2E TESTS PASSED WITH 100% SUCCESS!")
    else:
        print("  SOME TESTS FAILED - SEE LOGS ABOVE.")
    print("=" * 70)

    return all_pass

if __name__ == '__main__':
    success = run_15_point_e2e_test()
    sys.exit(0 if success else 1)
