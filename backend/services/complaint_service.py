import os
import uuid
import logging
from datetime import datetime, timezone
from extensions import db
from models.complaint import Complaint
from models.status_log import StatusLog

logger = logging.getLogger('ComplaintService')

ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'webp'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB in bytes

def allowed_file(filename):
    """Checks if the filename has an authorized image extension."""
    if '.' not in filename:
        return False
    ext = filename.rsplit('.', 1)[1].lower()
    return ext in ALLOWED_EXTENSIONS

def generate_complaint_number():
    """
    Generates a human-readable complaint number formatted as:
    CH-YYYY-XXXXX (e.g., CH-2026-00001)
    """
    year = datetime.now(timezone.utc).strftime('%Y')
    prefix = f"CH-{year}-"
    
    # Query highest complaint number for current year
    highest = Complaint.query.filter(
        Complaint.complaint_number.like(f"{prefix}%")
    ).order_by(Complaint.id.desc()).first()

    next_num = 1
    if highest and highest.complaint_number:
        try:
            parts = highest.complaint_number.split('-')
            if len(parts) == 3:
                next_num = int(parts[2]) + 1
        except (ValueError, IndexError):
            next_num = Complaint.query.count() + 1

    complaint_num = f"{prefix}{next_num:05d}"
    
    # Guarantee uniqueness
    while Complaint.query.filter_by(complaint_number=complaint_num).first() is not None:
        next_num += 1
        complaint_num = f"{prefix}{next_num:05d}"

    return complaint_num

def save_issue_photo(file, upload_folder):
    """
    Validates, renames, and saves an uploaded issue photo.
    Returns (url_path, absolute_filepath).
    Raises ValueError on validation failure.
    """
    if not file or not file.filename:
        raise ValueError("Issue photo is required.")

    if not allowed_file(file.filename):
        raise ValueError(
            f"Invalid image format. Allowed formats are: {', '.join(sorted(ALLOWED_EXTENSIONS)).upper()}."
        )

    # Check file size (Read content length or seek)
    file.seek(0, os.SEEK_END)
    file_length = file.tell()
    file.seek(0)

    if file_length == 0:
        raise ValueError("Uploaded image file is empty.")
    if file_length > MAX_FILE_SIZE:
        max_mb = MAX_FILE_SIZE / (1024 * 1024)
        raise ValueError(f"Image size exceeds maximum limit of {max_mb:.0f} MB.")

    # Generate secure random filename
    ext = file.filename.rsplit('.', 1)[1].lower()
    unique_name = f"issue_{uuid.uuid4().hex[:12]}.{ext}"
    
    issues_dir = os.path.join(upload_folder, 'issues')
    os.makedirs(issues_dir, exist_ok=True)
    
    absolute_path = os.path.join(issues_dir, unique_name)
    file.save(absolute_path)

    relative_url = f"/uploads/issues/{unique_name}"
    return relative_url, absolute_path

def delete_issue_photo(filepath):
    """Safely deletes an issue photo file from disk if it exists."""
    if filepath and os.path.exists(filepath):
        try:
            os.remove(filepath)
        except OSError as e:
            logger.warning(f"Error removing file {filepath}: {e}")

def save_resolution_photo(file, upload_folder):
    """
    Validates, renames, and saves an uploaded after-repair resolution photo.
    Returns (relative_url_path, absolute_filepath).
    Raises ValueError on validation failure.
    """
    if not file or not file.filename:
        raise ValueError("Resolution photo is required.")

    if not allowed_file(file.filename):
        raise ValueError(
            f"Invalid image format for resolution photo. Allowed formats are: {', '.join(sorted(ALLOWED_EXTENSIONS)).upper()}."
        )

    # Check file size
    file.seek(0, os.SEEK_END)
    file_length = file.tell()
    file.seek(0)

    if file_length == 0:
        raise ValueError("Uploaded resolution image file is empty.")
    if file_length > MAX_FILE_SIZE:
        max_mb = MAX_FILE_SIZE / (1024 * 1024)
        raise ValueError(f"Resolution image size exceeds maximum limit of {max_mb:.0f} MB.")

    # Generate secure random filename
    ext = file.filename.rsplit('.', 1)[1].lower()
    unique_name = f"resolution_{uuid.uuid4().hex[:12]}.{ext}"
    
    resolutions_dir = os.path.join(upload_folder, 'resolutions')
    os.makedirs(resolutions_dir, exist_ok=True)
    
    absolute_path = os.path.join(resolutions_dir, unique_name)
    file.save(absolute_path)

    relative_url = f"/uploads/resolutions/{unique_name}"
    return relative_url, absolute_path

def delete_resolution_photo(filepath):
    """Safely deletes a resolution photo file from disk if it exists."""
    if filepath and os.path.exists(filepath):
        try:
            os.remove(filepath)
        except OSError as e:
            logger.warning(f"Error removing file {filepath}: {e}")

def log_status_change(complaint_id, new_status, old_status=None, changed_by_id=None, comments=None):
    """Creates an audit log entry for a grievance status change."""
    log = StatusLog(
        complaint_id=complaint_id,
        changed_by_id=changed_by_id,
        old_status=old_status,
        new_status=new_status,
        comments=comments
    )
    db.session.add(log)
    return log
