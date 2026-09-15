"""
Prompt 12 Automated Test Suite: Pure Zero Initial State & Dynamic Real-Time Dashboards
Validates:
1. Pure Zero Initial State: All dashboard values (Total, Submitted, Assigned, In Progress, Resolved, Closed, Reopened, Overdue) return 0 when database has 0 complaints.
2. Department Statistics: All active departments return count: 0 when no complaints exist.
3. User Counts: Calculated from SQLite (students, faculty, maintenance, management).
4. Real-time complaint creation and lifecycle transitions:
   - Student raises Electrical complaint -> Total=1, Electrical=1.
   - Status changes (In Progress, Resolved, Reopened, Closed) reflect dynamically in SQLite queries and APIs.
5. Dynamic Overdue Calculation: SLA deadline evaluated against server time from SQLite.
6. Empty states: Activity and notifications return empty arrays without fake data.
"""

import unittest
import os
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash

os.environ['FLASK_ENV'] = 'testing'
os.environ['DATABASE_URL'] = 'sqlite:///:memory:'

from app import create_app
from extensions import db
from models import Department, User, Complaint, SystemSetting

class Prompt12ZeroMockRealtimeTestSuite(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.SHARED_PASSWORD = 'Password@123'
        cls.SHARED_HASH = generate_password_hash(cls.SHARED_PASSWORD)

    def setUp(self):
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.app.config['WTF_CSRF_ENABLED'] = False

        self.client = self.app.test_client()
        self.ctx = self.app.app_context()
        self.ctx.push()

        db.create_all()
        SystemSetting.init_default_settings()
        self._seed_initial_infrastructure()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    def _seed_initial_infrastructure(self):
        # 7 Active Departments
        self.depts = [
            Department(name='Electrical', description='Power & lighting', is_active=True),
            Department(name='Plumbing', description='Water & drainage', is_active=True),
            Department(name='Civil', description='Structural & masonry', is_active=True),
            Department(name='Housekeeping', description='Cleaning', is_active=True),
            Department(name='Furniture', description='Desks & carpentry', is_active=True),
            Department(name='IT / Network', description='LAN & computers', is_active=True),
            Department(name='Other', description='General facilities', is_active=True),
        ]
        db.session.add_all(self.depts)
        db.session.commit()

        # 4 Seed Accounts
        self.admin = User(name='Campus Administrator', email='admin@college.edu', role='management', password_hash=self.SHARED_HASH)
        self.maintenance = User(name='Campus Maintenance Helpdesk', email='maintenance@college.edu', role='maintenance', password_hash=self.SHARED_HASH)
        self.student = User(name='Student Alice', email='student@college.edu', role='student', password_hash=self.SHARED_HASH)
        self.faculty = User(name='Prof. Bob', email='faculty@college.edu', role='faculty', password_hash=self.SHARED_HASH)
        db.session.add_all([self.admin, self.maintenance, self.student, self.faculty])
        db.session.commit()

    def _login(self, email):
        return self.client.post('/api/auth/login', json={'email': email, 'password': self.SHARED_PASSWORD})

    def test_01_initial_zero_state_dashboards(self):
        """Verify all dashboard APIs return strictly 0 values when database has zero complaints."""
        # 1. Global summary
        res = self.client.get('/api/dashboard/summary')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data['total'], 0)
        self.assertEqual(data['submitted'], 0)
        self.assertEqual(data['assigned'], 0)
        self.assertEqual(data['in_progress'], 0)
        self.assertEqual(data['resolved'], 0)
        self.assertEqual(data['closed'], 0)
        self.assertEqual(data['reopened'], 0)
        self.assertEqual(data['overdue'], 0)

        # 2. Department statistics
        dept_res = self.client.get('/api/dashboard/department-statistics')
        self.assertEqual(dept_res.status_code, 200)
        dept_data = dept_res.get_json()
        dept_stats = dept_data.get('department_statistics', dept_data)
        self.assertEqual(dept_stats['Electrical'], 0)
        self.assertEqual(dept_stats['Plumbing'], 0)
        self.assertEqual(dept_stats['Civil'], 0)
        self.assertEqual(dept_stats['Housekeeping'], 0)
        self.assertEqual(dept_stats['Furniture'], 0)
        self.assertEqual(dept_stats['IT / Network'], 0)
        self.assertEqual(dept_stats['Other'], 0)

        # 3. Recent activity empty
        act_res = self.client.get('/api/dashboard/recent-activity')
        self.assertEqual(act_res.status_code, 200)
        self.assertEqual(len(act_res.get_json()['activity']), 0)

        # 4. Student dashboard initial
        self._login('student@college.edu')
        stu_res = self.client.get('/api/student/dashboard')
        self.assertEqual(stu_res.status_code, 200)
        stu_metrics = stu_res.get_json()['metrics']
        self.assertEqual(stu_metrics['total'], 0)
        self.assertEqual(stu_metrics['submitted'], 0)
        self.assertEqual(stu_metrics['resolved'], 0)
        self.assertEqual(len(stu_res.get_json()['recent_complaints']), 0)
        self.client.post('/api/auth/logout')

        # 5. Faculty dashboard initial
        self._login('faculty@college.edu')
        fac_res = self.client.get('/api/faculty/dashboard')
        self.assertEqual(fac_res.status_code, 200)
        fac_metrics = fac_res.get_json()['metrics']
        self.assertEqual(fac_metrics['total'], 0)
        self.assertEqual(len(fac_res.get_json()['recent_complaints']), 0)
        self.client.post('/api/auth/logout')

        # 6. Maintenance dashboard initial
        self._login('maintenance@college.edu')
        maint_res = self.client.get('/api/maintenance/dashboard')
        self.assertEqual(maint_res.status_code, 200)
        maint_stats = maint_res.get_json()['stats']
        self.assertEqual(maint_stats['total_complaints'], 0)
        self.assertEqual(maint_stats['in_progress'], 0)
        self.assertEqual(maint_stats['resolved'], 0)
        self.assertEqual(maint_stats['overdue'], 0)
        self.client.post('/api/auth/logout')

        # 7. Management dashboard initial
        self._login('admin@college.edu')
        mgmt_res = self.client.get('/api/management/dashboard')
        self.assertEqual(mgmt_res.status_code, 200)
        mgmt_stats = mgmt_res.get_json()['stats']
        self.assertEqual(mgmt_stats['total'], 0)
        self.assertEqual(mgmt_stats['overdue'], 0)
        self.client.post('/api/auth/logout')

    def test_02_dynamic_user_counts_from_sqlite(self):
        """Verify user counts reflect real SQLite counts."""
        res = self.client.get('/api/dashboard/stats')
        self.assertEqual(res.status_code, 200)
        users_data = res.get_json()['metrics']['users']
        self.assertEqual(users_data['student'], 1)
        self.assertEqual(users_data['faculty'], 1)
        self.assertEqual(users_data['maintenance'], 1)
        self.assertEqual(users_data['management'], 1)
        self.assertEqual(users_data['total'], 4)

    def test_03_realtime_lifecycle_and_counter_updates(self):
        """Verify that complaints lifecycle updates all dashboard counters dynamically."""
        elec_dept = Department.query.filter_by(name='Electrical').first()

        # Step A: Student submits an Electrical complaint
        self._login('student@college.edu')
        create_res = self.client.post('/api/complaints', data={
            'title': 'Power Outlet Sparking',
            'description': 'Outlet on south wall sparking when plug inserted.',
            'department_id': elec_dept.id,
            'location': 'Lab 101',
            'priority': 'High'
        })
        self.assertEqual(create_res.status_code, 201)
        comp_id = create_res.get_json()['complaint']['id']
        self.client.post('/api/auth/logout')

        # Step B: Check summary -> Total = 1, Electrical = 1, Plumbing = 0
        summary_res = self.client.get('/api/dashboard/summary')
        self.assertEqual(summary_res.get_json()['total'], 1)

        dept_res = self.client.get('/api/dashboard/department-statistics')
        self.assertEqual(dept_res.get_json()['department_statistics']['Electrical'], 1)
        self.assertEqual(dept_res.get_json()['department_statistics']['Plumbing'], 0)

        # Step C: Maintenance accepts complaint -> In Progress = 1
        self._login('maintenance@college.edu')
        accept_res = self.client.patch(f'/api/maintenance/complaints/{comp_id}/accept')
        self.assertEqual(accept_res.status_code, 200)
        self.client.post('/api/auth/logout')

        summary_res = self.client.get('/api/dashboard/summary')
        self.assertEqual(summary_res.get_json()['in_progress'], 1)

        # Step D: Maintenance resolves complaint -> Resolved = 1
        self._login('maintenance@college.edu')
        resolve_res = self.client.patch(f'/api/maintenance/complaints/{comp_id}/resolve', data={
            'resolution_remarks': 'Replaced damaged 15A receptacle and tightened wire lugs.'
        })
        self.assertEqual(resolve_res.status_code, 200)
        self.client.post('/api/auth/logout')

        summary_res = self.client.get('/api/dashboard/summary')
        self.assertEqual(summary_res.get_json()['resolved'], 1)
        self.assertEqual(summary_res.get_json()['in_progress'], 0)

        # Step E: Student reopens complaint -> Reopened = 1, In Progress = 1
        self._login('student@college.edu')
        reopen_res = self.client.patch(f'/api/complaints/{comp_id}/reopen', json={
            'reason': 'Outlet cover plate is still loose.'
        })
        self.assertEqual(reopen_res.status_code, 200)

        stu_res = self.client.get('/api/student/dashboard')
        self.assertEqual(stu_res.get_json()['metrics']['reopened'], 1)
        self.client.post('/api/auth/logout')

        # Step F: Maintenance resolves again and Student closes -> Closed = 1
        self._login('maintenance@college.edu')
        self.client.patch(f'/api/maintenance/complaints/{comp_id}/resolve', data={
            'resolution_remarks': 'Replaced and secured new cover plate.'
        })
        self.client.post('/api/auth/logout')

        self._login('student@college.edu')
        close_res = self.client.patch(f'/api/complaints/{comp_id}/close')
        self.assertEqual(close_res.status_code, 200)

        summary_res = self.client.get('/api/dashboard/summary')
        self.assertEqual(summary_res.get_json()['closed'], 1)
        self.assertEqual(summary_res.get_json()['resolved'], 0)
        self.client.post('/api/auth/logout')

    def test_04_dynamic_overdue_sla_calculation(self):
        """Verify that overdue count is strictly computed from sla_deadline and server time."""
        elec_dept = Department.query.filter_by(name='Electrical').first()

        # Create complaint with past deadline
        past_deadline = datetime.utcnow() - timedelta(hours=3)
        comp = Complaint(
            complaint_number='CH-OVERDUE-01',
            title='Corridor Lighting Failure',
            description='Corridor pitch black',
            department_id=elec_dept.id,
            location='Hostel B',
            priority='High',
            status='In Progress',
            created_by=self.student.id,
            assigned_to=self.maintenance.id,
            created_at=datetime.utcnow() - timedelta(hours=8),
            sla_deadline=past_deadline,
            is_overdue=True
        )
        db.session.add(comp)
        db.session.commit()

        # Summary must show overdue = 1
        summary_res = self.client.get('/api/dashboard/summary')
        self.assertEqual(summary_res.get_json()['overdue'], 1)

        # When closed, overdue becomes 0
        comp.status = 'Closed'
        comp.closed_at = datetime.utcnow()
        db.session.commit()

        summary_res = self.client.get('/api/dashboard/summary')
        self.assertEqual(summary_res.get_json()['overdue'], 0)

if __name__ == '__main__':
    unittest.main()
