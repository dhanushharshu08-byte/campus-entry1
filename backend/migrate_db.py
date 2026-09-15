"""
Safe SQLite Schema Migration Script for CampuSentry Helpdesk.
Safely adds missing columns and tables to existing database without data loss.
"""
import sqlite3
import os
from datetime import datetime, timedelta, timezone

def utc_now():
    return datetime.now(timezone.utc).replace(tzinfo=None)

def migrate_database():
    base_dir = os.path.abspath(os.path.dirname(__file__))
    db_path = os.path.join(base_dir, 'campus_helpdesk.db')
    
    print(f"Connecting to database: {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Get existing columns in 'complaints' table
    cursor.execute("PRAGMA table_info(complaints)")
    existing_complaint_cols = {row[1] for row in cursor.fetchall()}

    complaint_cols_to_add = [
        ("sla_deadline", "DATETIME"),
        ("assigned_at", "DATETIME"),
        ("first_response_at", "DATETIME"),
        ("resolution_time_minutes", "FLOAT"),
        ("is_overdue", "BOOLEAN DEFAULT 0")
    ]

    for col_name, col_type in complaint_cols_to_add:
        if col_name not in existing_complaint_cols:
            print(f"Adding column '{col_name}' ({col_type}) to 'complaints'...")
            cursor.execute(f"ALTER TABLE complaints ADD COLUMN {col_name} {col_type}")

    # Get existing columns in 'status_logs' table
    cursor.execute("PRAGMA table_info(status_logs)")
    existing_status_cols = {row[1] for row in cursor.fetchall()}

    if "is_internal" not in existing_status_cols:
        print("Adding column 'is_internal' (BOOLEAN DEFAULT 0) to 'status_logs'...")
        cursor.execute("ALTER TABLE status_logs ADD COLUMN is_internal BOOLEAN DEFAULT 0")

    # Get existing columns in 'notifications' table
    cursor.execute("PRAGMA table_info(notifications)")
    existing_notif_cols = {row[1] for row in cursor.fetchall()}

    if "complaint_id" not in existing_notif_cols:
        print("Adding column 'complaint_id' (INTEGER) to 'notifications'...")
        cursor.execute("ALTER TABLE notifications ADD COLUMN complaint_id INTEGER REFERENCES complaints(id)")

    # Create new tables if missing
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS system_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key VARCHAR(50) UNIQUE NOT NULL,
        value VARCHAR(255) NOT NULL,
        description VARCHAR(255),
        updated_at DATETIME
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER REFERENCES users(id),
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id VARCHAR(50),
        old_value TEXT,
        new_value TEXT,
        ip_address VARCHAR(50),
        timestamp DATETIME
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS escalation_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        complaint_id INTEGER NOT NULL REFERENCES complaints(id),
        level INTEGER NOT NULL,
        message TEXT NOT NULL,
        created_at DATETIME,
        notified_at DATETIME,
        resolved_at DATETIME
    )
    """)

    # Populate sla_deadline for existing complaints where sla_deadline is NULL
    cursor.execute("SELECT id, created_at, priority FROM complaints WHERE sla_deadline IS NULL")
    rows = cursor.fetchall()
    for cid, created_str, priority in rows:
        try:
            if created_str:
                if 'T' in created_str:
                    c_time = datetime.fromisoformat(created_str)
                else:
                    c_time = datetime.strptime(created_str.split('.')[0], "%Y-%m-%d %H:%M:%S")
            else:
                c_time = utc_now()
        except Exception:
            c_time = utc_now()

        hours = 4 if priority == 'High' else (24 if priority == 'Medium' else 72)
        deadline = c_time + timedelta(hours=hours)
        deadline_str = deadline.strftime("%Y-%m-%d %H:%M:%S")
        cursor.execute("UPDATE complaints SET sla_deadline = ? WHERE id = ?", (deadline_str, cid))

    conn.commit()
    conn.close()
    print("Database migration completed successfully!")

if __name__ == '__main__':
    migrate_database()
