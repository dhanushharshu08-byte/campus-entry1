-- ====================================================================
-- CampuSentry PostgreSQL Complete Database Schema for Supabase
-- Project: CampuSentry Smart Campus Facility Helpdesk
-- Project Ref: jxjfyrodyaellwnhhauy
-- ====================================================================

-- 1. Create Departments Table
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    code VARCHAR(20) UNIQUE,
    description VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'student',
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    department VARCHAR(100),
    employee_or_student_id VARCHAR(50),
    phone VARCHAR(25),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

-- 3. Create Complaints Table
CREATE TABLE IF NOT EXISTS complaints (
    id SERIAL PRIMARY KEY,
    complaint_number VARCHAR(30) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    department VARCHAR(100),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP WITH TIME ZONE,
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(30) DEFAULT 'Submitted',
    location VARCHAR(150),
    room_number VARCHAR(50),
    issue_photo VARCHAR(255),
    resolution_photo VARCHAR(255),
    resolution_remarks TEXT,
    rejection_reason TEXT,
    is_escalated BOOLEAN DEFAULT FALSE,
    escalation_level INTEGER DEFAULT 0,
    sla_deadline TIMESTAMP WITH TIME ZONE,
    is_overdue BOOLEAN DEFAULT FALSE,
    first_response_at TIMESTAMP WITH TIME ZONE,
    resolution_time_minutes DOUBLE PRECISION,
    closed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create Status Logs Table
CREATE TABLE IF NOT EXISTS status_logs (
    id SERIAL PRIMARY KEY,
    complaint_id INTEGER NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    old_status VARCHAR(30),
    new_status VARCHAR(30) NOT NULL,
    changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    remarks TEXT,
    is_internal BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create Escalation Logs Table
CREATE TABLE IF NOT EXISTS escalation_logs (
    id SERIAL PRIMARY KEY,
    complaint_id INTEGER NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    level INTEGER NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notified_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- 6. Create Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    complaint_id INTEGER REFERENCES complaints(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Create Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(50),
    old_value TEXT,
    new_value TEXT,
    ip_address VARCHAR(50),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Create System Settings Table
CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(50) UNIQUE NOT NULL,
    value VARCHAR(255) NOT NULL,
    description VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- Indexes for High Performance
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_complaints_complaint_number ON complaints(complaint_number);
CREATE INDEX IF NOT EXISTS idx_complaints_user_id ON complaints(user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_assigned_to ON complaints(assigned_to);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_priority ON complaints(priority);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON complaints(created_at);
CREATE INDEX IF NOT EXISTS idx_status_logs_complaint_id ON status_logs(complaint_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- ====================================================================
-- Seed Initial Departments
-- ====================================================================
INSERT INTO departments (name, code, description, is_active)
VALUES
    ('Electrical & Power', 'ELEC', 'Electrical issues, power failures, wiring, lighting, appliances, AC systems', TRUE),
    ('Plumbing & Water', 'PLUMB', 'Water supply, plumbing leakages, washroom fixtures, drainage systems', TRUE),
    ('Civil & Infrastructure', 'CIVIL', 'Building structures, classrooms, furniture, doors, windows, painting', TRUE),
    ('IT & Network Infrastructure', 'IT', 'Campus Wi-Fi, Ethernet ports, smart classrooms, projectors, lab hardware', TRUE),
    ('Housekeeping & Sanitation', 'HOUSE', 'Cleaning, waste disposal, pest control, campus cleanliness and hygiene', TRUE),
    ('Hostel & Residential', 'HOSTEL', 'Hostel room amenities, water heaters, common room facilities', TRUE),
    ('Artificial Intelligence and Data Science (AI & DS)', 'AIDS', 'Department of Artificial Intelligence & Data Science laboratories and facilities', TRUE)
ON CONFLICT (name) DO NOTHING;

-- ====================================================================
-- Seed Initial Users (including Dhanush S)
-- ====================================================================
INSERT INTO users (name, email, password_hash, role, employee_or_student_id, phone, department, is_active)
VALUES
    ('Campus Administrator', 'admin@college.edu', 'scrypt:32768:8:1$TtY8u1g9V0$c23c14d9b4b09c6934c95f54316d860d5dd14dcf7d6fa5c2d3bc35f58c7041440f4e3c9cf1c26b8cb7970d4e5f03932fa5a76cb960f7bdf2149b5c2a129d2fc3', 'management', 'ADMIN-001', '+91 98765 00001', 'Administration', TRUE),
    ('Central Maintenance Staff', 'maintenance@college.edu', 'scrypt:32768:8:1$TtY8u1g9V0$c23c14d9b4b09c6934c95f54316d860d5dd14dcf7d6fa5c2d3bc35f58c7041440f4e3c9cf1c26b8cb7970d4e5f03932fa5a76cb960f7bdf2149b5c2a129d2fc3', 'maintenance', 'MAINT-STAFF-01', '+91 98765 00002', 'Electrical & Power', TRUE),
    ('John Doe (Student)', 'student@acetcbe.edu.in', 'scrypt:32768:8:1$TtY8u1g9V0$c23c14d9b4b09c6934c95f54316d860d5dd14dcf7d6fa5c2d3bc35f58c7041440f4e3c9cf1c26b8cb7970d4e5f03932fa5a76cb960f7bdf2149b5c2a129d2fc3', 'student', '710121104001', '+91 98765 00003', 'Computer Science and Engineering (CSE)', TRUE),
    ('Prof. Sarah Smith (Faculty)', 'faculty@acetcbe.edu.in', 'scrypt:32768:8:1$TtY8u1g9V0$c23c14d9b4b09c6934c95f54316d860d5dd14dcf7d6fa5c2d3bc35f58c7041440f4e3c9cf1c26b8cb7970d4e5f03932fa5a76cb960f7bdf2149b5c2a129d2fc3', 'faculty', 'ACET-FAC-102', '+91 98765 00004', 'Information Technology', TRUE),
    ('Dhanush S', '25ad01@acetcbe.edu.in', 'scrypt:32768:8:1$TtY8u1g9V0$c23c14d9b4b09c6934c95f54316d860d5dd14dcf7d6fa5c2d3bc35f58c7041440f4e3c9cf1c26b8cb7970d4e5f03932fa5a76cb960f7bdf2149b5c2a129d2fc3', 'student', '720325243012', '7092373584', 'Artificial Intelligence and Data Science (AI & DS)', TRUE)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    employee_or_student_id = EXCLUDED.employee_or_student_id,
    department = EXCLUDED.department,
    role = EXCLUDED.role;
