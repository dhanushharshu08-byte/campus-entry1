# 🛡️ CampuSentry – College Helpdesk & Maintenance Management System

CampuSentry is a full-stack, enterprise-grade **College Maintenance Helpdesk & Grievance Management System** built with **React (Vite)**, **Python Flask**, **SQLAlchemy ORM**, **SQLite**, and **Flask-SocketIO / Socket.IO**.

---

## 🌟 System Overview & Key Features

CampuSentry streamlines campus facilities maintenance, infrastructure complaint reporting, workload distribution, multi-tier escalation management, and compliance auditing across the entire college campus.

### 🔑 Core Capabilities
- **4 Distinct Role Workflows**: Students, Faculty, Central Maintenance Staff, and Campus Administrators (Management) with granular role-based access control (RBAC).
- **Direct Department Selection & Dispatch**: Students and Faculty choose the exact maintenance department (Electrical, Plumbing, Civil, IT / Network, Housekeeping, Furniture, Other) with automatic routing to the appropriate maintenance queue.
- **Configurable SLA & Escalation Engine**:
  - Initial SLA targets calculated on ticket creation (`High: 4h`, `Medium: 24h`, `Low: 72h`).
  - **Level 1 (Approaching)**: Real-time warnings when 25% of SLA deadline remains.
  - **Level 2 (Breached)**: Automatic overdue flagging and priority alert dispatching.
  - **Level 3 (Critical Escalation)**: High-priority management intervention alert when SLA is exceeded by 2x.
  - Background daemon thread runs continuous evaluations with anti-duplicate logging safeguards.
- **Maintenance Operations & Proof of Work**:
  - Central maintenance staff can view complaints across all departments or filter by department.
  - Mandatory resolution remarks and after-repair photo proof required before marking tickets resolved.
- **Management Interventions & Oversight**:
  - Live complaint reassignment with mandatory reason tracking.
  - Priority overrides with dynamic SLA recalculation.
  - Internal administrative remarks hidden from students/faculty.
- **Comprehensive Audit Trail**:
  - Granular logging of all authentication events, status changes, assignments, and system modifications with IP and timestamp metadata.
- **Dynamic Analytics & CSV Reports**:
  - Live SLA compliance rates, department resolution averages, staff workload indices, and time-to-first-response metrics computed directly from SQLite.
  - One-click streaming CSV exports for Complaints, Departments, Staff Roster, and SLA Performance.
- **Global Multi-Entity Search**: Instant cross-table querying across tickets, users, and departments.
- **System Administration & Live Settings**:
  - Real-time SLA threshold reconfiguration without server restart.
  - Department management with safe soft-deactivation.
  - User roster management with self-deactivation protection.
  - Automated database backup snapshots and system health diagnostic APIs (`/api/health`).

---

## 🏛️ Architecture & Directory Structure

```
CampuSentry/
├── backend/
│   ├── app.py                     # Flask application factory, security headers, SocketIO hub
│   ├── config.py                  # Environment config, CORS, uploads, session security
│   ├── extensions.py              # SQLAlchemy, CORS, SocketIO, LoginManager
│   ├── models/                    # ORM database models
│   │   ├── user.py                # User model with role validation & Werkzeug password hashing
│   │   ├── department.py          # Department model (Electrical, Plumbing, Civil, etc.)
│   │   ├── complaint.py           # Grievance model with SLA countdown & breach helpers
│   │   ├── notification.py        # Real-time user & broadcast alerts
│   │   ├── status_log.py          # Ticket timeline & internal management remarks
│   │   ├── audit_log.py           # System-wide immutable audit trail
│   │   ├── escalation_log.py      # SLA Level 1, 2, 3 escalation logs
│   │   └── system_setting.py      # Dynamic key-value configuration store
│   ├── routes/                    # Modular Blueprints
│   │   ├── auth.py                # Authentication & RBAC endpoints (/api/auth)
│   │   ├── departments.py         # Department listings (/api/departments)
│   │   ├── complaints.py          # Grievance lifecycle & student/faculty tracking (/api/complaints)
│   │   ├── maintenance.py         # Maintenance helpdesk & ticket resolution (/api/maintenance)
│   │   ├── management.py          # Management control, interventions, settings, & CSV reports
│   │   ├── notifications.py       # User notification inbox (/api/notifications)
│   │   ├── dashboard.py           # Analytics & summaries (/api/dashboard)
│   │   ├── student.py             # Student portal summary (/api/student)
│   │   └── faculty.py             # Faculty portal summary (/api/faculty)
│   ├── services/                  # Business Logic Layer
│   │   ├── sla_service.py         # SLA evaluation, warning, & multi-tier escalation daemon
│   │   ├── sla_worker.py          # Background SLA daemon worker thread
│   │   ├── audit_service.py       # System-wide audit event logger
│   │   ├── assignment_service.py  # Technician workload dispatcher
│   │   ├── socket_service.py      # Real-time WebSocket emitter
│   │   ├── complaint_service.py   # Unique ID generator (CH-YYYY-XXXXX) & media uploads
│   │   └── notification_service.py# Notification dispatcher
│   ├── utils/
│   │   └── auth_decorators.py     # @role_required RBAC decorators
│   ├── uploads/                   # Uploaded media assets
│   │   ├── issues/                # User grievance issue photos
│   │   └── resolutions/           # Technician resolution photos
│   ├── seed.py                    # Idempotent DB seeder (Departments, Users, Settings)
│   ├── requirements.txt           # Python dependencies
│   └── campus_helpdesk.db         # SQLite database file
│
├── frontend/
│   ├── src/
│   │   ├── components/            # UI components (Navbar, Sidebar, ProtectedRoute, Modals, Badges)
│   │   ├── pages/                 # Route views
│   │   │   ├── complaints/        # Grievance submission & detailed tracking
│   │   │   ├── dashboards/        # Role-specific dashboards (Student, Faculty, Maintenance, Management)
│   │   │   └── management/        # Management control panels
│   │   ├── layouts/               # MainLayout (Clean topnav, Sidebar, Shell)
│   │   ├── services/              # Axios API service & Socket.IO client
│   │   ├── context/               # AuthContext & SocketContext
│   │   ├── index.css              # Custom academic design system with CSS custom properties
│   │   ├── App.jsx                # Router & Role guards
│   │   └── main.jsx               # React entry point
│   ├── package.json
│   ├── vite.config.js             # Vite configuration with backend proxy
│   └── .env.example               # Frontend environment template
│
├── .env.example                   # Root environment configuration template
├── .gitignore                     # Git ignore rules
└── README.md                      # Complete system documentation
```

---

## 👥 Role Matrix & Permissions

| Feature / Action | Student | Faculty | Maintenance | Management |
| :--- | :---: | :---: | :---: | :---: |
| Self-Registration | ✅ | ✅ | ❌ | ❌ |
| Submit Grievance (with photo) | ✅ | ✅ | ❌ | ❌ |
| View Own Grievances & Status | ✅ | ✅ | ❌ | ❌ |
| View Assigned Workload / Department Tickets | ❌ | ❌ | ✅ | ✅ |
| Accept / Start / Resolve Grievances | ❌ | ❌ | ✅ | ❌ |
| Upload Resolution Proof Photo & Remarks | ❌ | ❌ | ✅ | ❌ |
| Reassign Grievances & Log Reasons | ❌ | ❌ | ❌ | ✅ |
| Override Priority & Recalculate SLA | ❌ | ❌ | ❌ | ✅ |
| Add Confidential Internal Remarks | ❌ | ❌ | ❌ | ✅ |
| View & Filter Immutable Audit Trail | ❌ | ❌ | ❌ | ✅ |
| Manage Staff & User Accounts | ❌ | ❌ | ❌ | ✅ |
| Manage Departments & Active Status | ❌ | ❌ | ❌ | ✅ |
| Configure Live System Settings | ❌ | ❌ | ❌ | ✅ |
| Export Analytics to CSV (4 Exports) | ❌ | ❌ | ❌ | ✅ |

---

## 🔑 Pre-Seeded Demo Accounts

The database seeder (`backend/seed.py`) configures 4 verified demo accounts:

| Role | Name | Email | Password | Access / Portal |
| :--- | :--- | :--- | :--- | :--- |
| **Management** | Campus Administrator | `admin@college.edu` | `Admin@123` | Full administrative dashboard, SLA & staff controls, CSV exports |
| **Maintenance** | Central Maintenance Staff | `maintenance@college.edu` | `Tech@123` | Centralized maintenance helpdesk & ticket resolution across all departments |
| **Student** | John Doe (Student) | `student@acetcbe.edu.in` | `Student@123` | Grievance submission, real-time ticket tracking & feedback |
| **Faculty** | Prof. Sarah Smith | `faculty@acetcbe.edu.in` | `Faculty@123` | Department issue logging & resolution tracking |

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Backend Setup
```powershell
# Navigate to backend
cd backend

# Create and activate virtual environment (Windows PowerShell)
python -m venv venv
.\venv\Scripts\activate
# (On Linux / macOS: source venv/bin/activate)

# Install dependencies
pip install -r requirements.txt

# Seed database with initial departments, settings, and demo users
python seed.py

# Start Flask development & SocketIO server
python app.py
```
*Backend runs on `http://127.0.0.1:5000` with background SLA daemon active.*

### 2. Frontend Setup
```powershell
# In a new terminal window:
cd frontend

# Install NPM packages
npm install

# Start Vite development server
npm run dev
```
*Frontend runs on `http://localhost:5173` with automatic API proxying to `http://127.0.0.1:5000`.*

### 3. Frontend Production Build
```powershell
cd frontend
npm run build
```

---

## 🔄 Complete Demo Workflow

1. **Submit Grievance**:
   - Login as `student@acetcbe.edu.in` / `Student@123`.
   - Click `+ Report an Issue` on the Student Dashboard.
   - Enter title, department (`Plumbing`), priority, location, and attach an issue photo.
   - Ticket generated with human-readable ID (e.g. `CH-2026-00001`).

2. **Maintenance Resolution**:
   - Login as `maintenance@college.edu` / `Tech@123`.
   - The ticket appears in the Maintenance Helpdesk.
   - Click `Accept / In Progress` to begin work.
   - Click `Resolve Ticket`, enter resolution remarks, attach after-repair resolution photo, and submit.

3. **Management Oversight**:
   - Login as `admin@college.edu` / `Admin@123`.
   - Management Dashboard shows live updated metrics.
   - View complaints table, apply department/status/priority filters, and download CSV reports.

4. **Student Verification**:
   - Return to Student account, view the resolved ticket, verify resolution remarks and after-repair photo.

---

## 🛡️ Security & Hardening Highlights
- **Structured Python Logging**: Standard `logging` module throughout.
- **HTTP Security Headers**: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `X-XSS-Protection: 1; mode=block`, `Referrer-Policy: strict-origin-when-cross-origin`.
- **Password Security**: Werkzeug cryptographic password hashing (`pbkdf2:sha256`).
- **Data Integrity**: Foreign key constraints enforced via SQLite PRAGMA event listener.
- **File Upload Protection**: Extension whitelist (`jpg, jpeg, png, webp`), unique random hex filenames, 5 MB file size limit.
- **Session Protection**: HttpOnly cookies with CSRF safeguards and SameSite controls.
