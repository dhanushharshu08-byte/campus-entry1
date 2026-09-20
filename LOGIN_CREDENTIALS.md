# CampuSentry — Official Login & Member Access Directory

This document contains all pre-seeded demo accounts, official administrative logins, staff access credentials, and student/faculty portal information for **CampuSentry Helpdesk**.

---

## 🔑 Quick Reference Table

| Role | Name | Official Email | Password | Department / Category | ID / Roll Number |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 🛡️ **Management** | Campus Administrator | `admin@college.edu` | `Admin@123` | *All Campus Facilities* | `MGMT-001` |
| 🔧 **Maintenance** | Central Maintenance Staff | `maintenance@college.edu` | `Tech@123` | *General Maintenance* | `TECH-MAIN-01` |
| ⚡ **Maintenance** | Electrician Dave | `electrician@college.edu` | `Tech@123` | `Electrical` | `TECH-ELEC-01` |
| 🎓 **Student** | John Doe | `student@acetcbe.edu.in` | `Student@123` | `Computer Science (CSE)` | `STU-2026-042` |
| 🎓 **Student** | John Doe (Alt) | `student@college.edu` | `Student@123` | *General Student Portal* | `STU-2026-042` |
| 🎓 **Student** | Dhanush S | `25ad01@acetcbe.edu.in` | *(Your set password)* | `AI & Data Science (AI & DS)` | `720325243012` |
| 🏛️ **Faculty** | Prof. Sarah Smith | `faculty@acetcbe.edu.in` | `Faculty@123` | *Engineering Faculty* | `FAC-ENG-108` |
| 🏛️ **Faculty** | Prof. Sarah Smith (Alt)| `faculty@college.edu` | `Faculty@123` | *Faculty Portal* | `FAC-ENG-108` |

---

## 📋 Role Breakdown & Access Capabilities

### 1. Management / Administrative Portal
* **Login URL / Route**: `/login` (redirects automatically to `/management/dashboard`)
* **Email**: `admin@college.edu`
* **Password**: `Admin@123`
* **Features & Permissions**:
  - Live campus grievance metrics, resolution percentage, and SLA breach counters.
  - Full grievance queue with filtering by department, priority, status, and SLA timeline.
  - Manual ticket assignment and emergency reassignment to technicians.
  - Maintenance Staff directory & department creation/management.
  - System SLA configuration (Target resolution timeframes & automated escalation thresholds).
  - Export audit reports and view real-time WebSocket activity feeds.

---

### 2. Maintenance & Technician Portal
* **Login URL / Route**: `/login` (redirects automatically to `/maintenance/dashboard`)
* **Accounts**:
  - **Central Helpdesk Staff**: `maintenance@college.edu` / `Tech@123`
  - **Electrical Specialist**: `electrician@college.edu` / `Tech@123`
* **Features & Permissions**:
  - Assigned grievances queue filtered specifically by technician and department.
  - Transition status: `Assigned` ➔ `In Progress` ➔ `Resolved`.
  - Mandatory resolution proof upload (After-repair photograph and technician remarks).
  - Department workload visualization and real-time reassignment alerts.

---

### 3. Student Grievance Portal
* **Login URL / Route**: `/login` (redirects automatically to `/student/dashboard`)
* **Accounts**:
  - `student@acetcbe.edu.in` / `Student@123`
  - `student@college.edu` / `Student@123`
  - `25ad01@acetcbe.edu.in`
* **Features & Permissions**:
  - Submit new grievances with title, detailed description, department tag, priority, and issue photo attachment.
  - View "My Grievances" list with live progress badges (`Submitted`, `Assigned`, `In Progress`, `Resolved`, `Closed`).
  - Interactive multi-stage timeline showing timestamped events, assigned technician details, and resolution evidence.
  - Ticket closure confirmation or 1-click **Reopen** if resolution is unsatisfactory.
  - Real-time in-app notifications on status changes.

---

### 4. Faculty Grievance Portal
* **Login URL / Route**: `/login` (redirects automatically to `/faculty/dashboard`)
* **Accounts**:
  - `faculty@acetcbe.edu.in` / `Faculty@123`
  - `faculty@college.edu` / `Faculty@123`
* **Features & Permissions**:
  - Submit academic, lab, classroom, or department-level infrastructure issues.
  - Priority handling and direct tracking for department facilities.
  - Resolution timeline inspection and closure confirmation.

---

## 🔒 Registration Rules for New Accounts

* **Self-Registration Allowed**: Students and Faculty can register new accounts using official college domains (`@acetcbe.edu.in` or `@college.edu`) directly on the `/register` page.
* **Privileged Staff / Admin Accounts**: Management and Maintenance accounts cannot be self-registered publicly (protected with `HTTP 403`). They are provisioned directly by Management through the Staff Management dashboard.
