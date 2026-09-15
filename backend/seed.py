import os
from app import create_app
from extensions import db
from models.department import Department
from models.user import User
from models.system_setting import SystemSetting

app = create_app()

DEPARTMENTS_DATA = [
    {"name": "Electrical", "description": "Campus electrical infrastructure, power systems, lighting, and labs"},
    {"name": "Plumbing", "description": "Water supply, sanitation fixtures, washrooms, and piping"},
    {"name": "Civil", "description": "Masonry, structural repairs, painting, and classroom fixtures"},
    {"name": "Housekeeping", "description": "Campus hygiene, waste management, and custodial services"},
    {"name": "Furniture", "description": "Desks, chairs, podiums, lab benches, and carpentry"},
    {"name": "IT / Network", "description": "Wi-Fi, LAN, server rooms, smart classrooms, and hardware"},
    {"name": "Other", "description": "General campus facilities and miscellaneous maintenance"}
]

DEMO_USERS_DATA = [
    {
        "name": "Campus Administrator",
        "email": "admin@college.edu",
        "password": "Admin@123",
        "role": "management",
        "department_name": None,
        "employee_or_student_id": "MGMT-001",
        "phone": "+1-555-0100"
    },
    {
        "name": "Central Maintenance Staff",
        "email": "maintenance@college.edu",
        "password": "Tech@123",
        "role": "maintenance",
        "department_name": None,
        "employee_or_student_id": "TECH-MAIN-01",
        "phone": "+1-555-0101"
    },
    {
        "name": "John Doe (Student)",
        "email": "student@acetcbe.edu.in",
        "password": "Student@123",
        "role": "student",
        "department_name": None,
        "employee_or_student_id": "STU-2026-042",
        "phone": "+1-555-0105"
    },
    {
        "name": "Prof. Sarah Smith (Faculty)",
        "email": "faculty@acetcbe.edu.in",
        "password": "Faculty@123",
        "role": "faculty",
        "department_name": None,
        "employee_or_student_id": "FAC-ENG-108",
        "phone": "+1-555-0106"
    }
]

def seed_database():
    """
    Seeds only initial infrastructure:
    - 7 Active Departments
    - System Settings (SLA defaults)
    - Demo User Accounts (Admin, Central Maintenance, Student, Faculty)
    Complaint, StatusLog, Notification, and EscalationLog tables start completely clean with 0 records.
    """
    with app.app_context():
        print("Ensuring SQLite tables exist...")
        db.create_all()

        print("\n--- Initializing System Settings ---")
        SystemSetting.init_default_settings()
        print(" [+] System settings initialized with default SLA values")

        print("\n--- Seeding Maintenance Departments ---")
        dept_map = {}
        for d_info in DEPARTMENTS_DATA:
            existing_dept = Department.query.filter_by(name=d_info['name']).first()
            if not existing_dept:
                dept = Department(
                    name=d_info['name'],
                    description=d_info['description'],
                    is_active=True
                )
                db.session.add(dept)
                db.session.flush()
                dept_map[dept.name] = dept.id
                print(f" [+] Created Department: {dept.name}")
            else:
                existing_dept.description = d_info['description']
                existing_dept.is_active = True
                dept_map[existing_dept.name] = existing_dept.id
                print(f" [~] Department exists: {existing_dept.name}")

        db.session.commit()

        print("\n--- Seeding Demo Users ---")
        demo_emails = {u['email'] for u in DEMO_USERS_DATA}
        User.query.filter(~User.email.in_(demo_emails)).delete(synchronize_session=False)
        db.session.commit()

        for u_info in DEMO_USERS_DATA:
            existing_user = User.query.filter_by(email=u_info['email']).first()
            dept_id = dept_map.get(u_info['department_name']) if u_info['department_name'] else None

            if not existing_user:
                user = User(
                    name=u_info['name'],
                    email=u_info['email'],
                    role=u_info['role'],
                    department_id=dept_id,
                    department=u_info['department_name'],
                    employee_or_student_id=u_info['employee_or_student_id'],
                    phone=u_info['phone'],
                    is_active=True
                )
                user.set_password(u_info['password'])
                user.validate_role()
                db.session.add(user)
                db.session.flush()
                print(f" [+] Created User: {user.email} ({user.role} - Dept: {user.department or 'N/A'})")
            else:
                existing_user.name = u_info['name']
                existing_user.role = u_info['role']
                existing_user.department_id = dept_id
                existing_user.department = u_info['department_name']
                existing_user.employee_or_student_id = u_info['employee_or_student_id']
                existing_user.phone = u_info['phone']
                existing_user.is_active = True
                existing_user.set_password(u_info['password'])
                existing_user.validate_role()
                print(f" [~] Updated User: {existing_user.email} ({existing_user.role} - Dept: {existing_user.department or 'N/A'})")

        db.session.commit()

        print("\n=======================================================")
        print("  Database Seeding Completed Successfully!")
        print("  Database: backend/campus_helpdesk.db")
        print("  Zero Fake Complaints | Real-time Pure Database State")
        print("=======================================================")

if __name__ == '__main__':
    seed_database()
