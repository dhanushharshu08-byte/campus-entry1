-- ====================================================================
-- CampuSentry PostgreSQL Schema for Supabase
-- Project: CampuSentry Smart Campus Facility Helpdesk
-- Project Ref: jxjfyrodyaellwnhhauy
-- ====================================================================

-- 1. Create Departments Table
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    description VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('Student', 'Faculty', 'Maintenance', 'Management')),
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create Complaints Table
CREATE TABLE IF NOT EXISTS complaints (
    id SERIAL PRIMARY KEY,
    complaint_number VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP WITH TIME ZONE,
    priority VARCHAR(20) DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
    status VARCHAR(30) DEFAULT 'Submitted' CHECK (status IN ('Submitted', 'Assigned', 'In Progress', 'Resolved', 'Closed', 'Rejected')),
    location VARCHAR(100),
    room_number VARCHAR(50),
    issue_photo VARCHAR(255),
    resolution_photo VARCHAR(255),
    resolution_notes TEXT,
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
    is_read BOOLEAN DEFAULT FALSE,
    notification_type VARCHAR(50) DEFAULT 'info',
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
-- Indexes for High Performance Querying
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_complaints_complaint_number ON complaints(complaint_number);
CREATE INDEX IF NOT EXISTS idx_complaints_user_id ON complaints(user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_assigned_to ON complaints(assigned_to);
CREATE INDEX IF NOT EXISTS idx_complaints_department_id ON complaints(department_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_priority ON complaints(priority);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON complaints(created_at);
CREATE INDEX IF NOT EXISTS idx_status_logs_complaint_id ON status_logs(complaint_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- ====================================================================
-- Seed Initial System Settings
-- ====================================================================
INSERT INTO system_settings (key, value, description)
VALUES
    ('high_sla_hours', '4', 'SLA resolution deadline in hours for High priority complaints'),
    ('medium_sla_hours', '24', 'SLA resolution deadline in hours for Medium priority complaints'),
    ('low_sla_hours', '72', 'SLA resolution deadline in hours for Low priority complaints'),
    ('approaching_threshold_pct', '25', 'Warning threshold percentage of remaining SLA time before escalation'),
    ('critical_multiplier', '2.0', 'Multiplier of SLA duration exceeding which critical escalation triggers'),
    ('max_upload_size_mb', '5', 'Maximum allowed file upload size in megabytes')
ON CONFLICT (key) DO NOTHING;

-- ====================================================================
-- Seed Default Departments
-- ====================================================================
INSERT INTO departments (name, code, description, is_active)
VALUES
    ('Electrical & Power', 'ELEC', 'Electrical issues, power failures, wiring, lighting, appliances, AC systems', TRUE),
    ('Plumbing & Water', 'PLUMB', 'Water supply, plumbing leakages, washroom fixtures, drainage systems', TRUE),
    ('Civil & Infrastructure', 'CIVIL', 'Building structures, classrooms, furniture, doors, windows, painting', TRUE),
    ('IT & Network Infrastructure', 'IT', 'Campus Wi-Fi, Ethernet ports, smart classrooms, projectors, lab hardware', TRUE),
    ('Housekeeping & Sanitation', 'HOUSE', 'Cleaning, waste disposal, pest control, campus cleanliness and hygiene', TRUE),
    ('Hostel & Residential', 'HOSTEL', 'Hostel room amenities, water heaters, common room facilities', TRUE)
ON CONFLICT (name) DO NOTHING;
