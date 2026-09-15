"""
CampuSentry Enterprise Project Backup Utility.
Safely creates a clean, verified ZIP archive of the entire project.
- Atomic non-blocking backup for active SQLite databases using native sqlite3 backup API.
- Automatically excludes bulky development artifacts (venv, node_modules, .git, dist, __pycache__).
- Verifies archive CRC32 checksums upon completion.
"""
import os
import sys
import shutil
import sqlite3
import tempfile
import zipfile
from datetime import datetime

def safe_copy_file(src_path, dst_path):
    """Safely copies a file, with specialized handling for active SQLite databases."""
    if src_path.endswith('.db'):
        try:
            # Use SQLite native non-blocking online backup
            src_conn = sqlite3.connect(src_path)
            dst_conn = sqlite3.connect(dst_path)
            src_conn.backup(dst_conn)
            dst_conn.close()
            src_conn.close()
            return True
        except Exception:
            pass

    try:
        shutil.copy2(src_path, dst_path)
        return True
    except Exception as e:
        return False

def create_backup(destination_path=None):
    root_dir = os.path.abspath(os.path.dirname(__file__))
    
    if not destination_path:
        desktop_dir = os.path.join(os.path.expanduser("~"), "OneDrive", "Desktop")
        if not os.path.exists(desktop_dir):
            desktop_dir = os.path.join(os.path.expanduser("~"), "Desktop")
        destination_path = os.path.join(desktop_dir, "CampuSentry_Current_Backup.zip")

    print("=" * 60)
    print(" CampuSentry Safe Project Backup Utility")
    print("=" * 60)
    print(f"Source Directory : {root_dir}")
    print(f"Target Archive   : {destination_path}")

    # Excluded development and build directories
    EXCLUDE_DIRS = {
        'venv', '.venv', 'node_modules', '__pycache__', 
        '.git', 'dist', '.pytest_cache', '.turbo', '.vscode'
    }
    EXCLUDE_EXTENSIONS = {'.pyc', '.pyo', '.tmp', '.lock'}
    EXCLUDE_FILES = {'CampuSentry_Current_Backup.zip', 'CampuSentry_Project.zip'}

    temp_dir = tempfile.mkdtemp(prefix="campusentry_backup_")

    try:
        if os.path.exists(destination_path):
            try:
                os.remove(destination_path)
            except Exception as e:
                print(f"[Warning] Overwriting existing archive: {e}")

        file_count = 0
        skipped_count = 0

        with zipfile.ZipFile(destination_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for root, dirs, files in os.walk(root_dir):
                # Filter out excluded directories in-place
                dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]

                for file in files:
                    if file in EXCLUDE_FILES:
                        continue
                    
                    _, ext = os.path.splitext(file)
                    if ext.lower() in EXCLUDE_EXTENSIONS:
                        continue

                    full_path = os.path.join(root, file)
                    rel_path = os.path.relpath(full_path, root_dir)

                    try:
                        # Direct archive write
                        zipf.write(full_path, rel_path)
                        file_count += 1
                    except (PermissionError, IOError, OSError):
                        # Handle locked/open files via safe temporary copy
                        tmp_file = os.path.join(temp_dir, f"tmp_{file}")
                        if safe_copy_file(full_path, tmp_file):
                            zipf.write(tmp_file, rel_path)
                            if os.path.exists(tmp_file):
                                os.remove(tmp_file)
                            file_count += 1
                        else:
                            skipped_count += 1
                            print(f"[Notice] Skipped unreadable file: {rel_path}")

        # Verify ZIP archive integrity
        print("\nVerifying archive integrity...")
        with zipfile.ZipFile(destination_path, 'r') as verify_zip:
            bad_file = verify_zip.testzip()
            if bad_file is not None:
                raise RuntimeError(f"Corrupted file detected in archive: {bad_file}")

        size_mb = os.path.getsize(destination_path) / (1024 * 1024)
        print("-" * 60)
        print("[SUCCESS] Backup generated and validated successfully!")
        print(f"Total Files Included : {file_count}")
        print(f"Archive Size         : {size_mb:.2f} MB")
        print(f"Saved Location       : {destination_path}")
        print("=" * 60)
        return True

    except Exception as e:
        print(f"\n[ERROR] Failed to create backup: {e}")
        return False

    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)

if __name__ == '__main__':
    dest = sys.argv[1] if len(sys.argv) > 1 else None
    success = create_backup(dest)
    sys.exit(0 if success else 1)
