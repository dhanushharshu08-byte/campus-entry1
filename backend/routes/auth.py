import re
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from extensions import db
from models.user import User, VALID_ROLES
from utils.auth_decorators import role_required
from services.audit_service import log_audit

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$')
PUBLIC_ROLES = {'student', 'faculty'}
OFFICIAL_COLLEGE_DOMAIN = 'acetcbe.edu.in'
COLLEGE_DOMAINS = {'acetcbe.edu.in', 'college.edu'}
COLLEGE_EMAIL_ERROR_MSG = 'Please use your official college email address.'

def is_valid_college_email(email_str: str) -> bool:
    """Validates that the email belongs to the official college domains (@acetcbe.edu.in or @college.edu)."""
    if not email_str or not isinstance(email_str, str) or '@' not in email_str:
        return False
    domain = email_str.strip().lower().split('@')[-1]
    return domain in COLLEGE_DOMAINS

@auth_bp.route('/register', methods=['POST'])
def register():
    """Public registration endpoint for student and faculty roles."""
    data = request.get_json() or {}

    name = (data.get('name') or '').strip()
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''
    role = (data.get('role') or '').strip().lower()
    employee_or_student_id = (data.get('employee_or_student_id') or '').strip()
    phone = (data.get('phone') or '').strip()
    department = (data.get('department') or '').strip()

    # Validation
    errors = []
    if not name:
        errors.append("Full name is required.")
    if not email:
        errors.append("Email address is required.")
    elif not EMAIL_REGEX.match(email):
        errors.append("Invalid email address format.")
    elif not is_valid_college_email(email):
        errors.append(f"Please use your official college email address (@{OFFICIAL_COLLEGE_DOMAIN}).")

    if not password:
        errors.append("Password is required.")
    elif len(password) < 8:
        errors.append("Password must be at least 8 characters long.")
    if not role:
        errors.append("Role is required.")
    elif role not in PUBLIC_ROLES:
        errors.append(f"Public registration is only permitted for Student and Faculty roles. Role '{role}' is not allowed.")

    if errors:
        return jsonify({
            "success": False,
            "message": errors[0] if len(errors) == 1 else "Validation failed.",
            "errors": errors
        }), 400

    # Check email uniqueness (case-insensitive)
    existing_user = User.query.filter(db.func.lower(User.email) == email.lower()).first()
    if existing_user:
        return jsonify({
            "success": False,
            "message": "An account with this email address already exists. Please log in."
        }), 409

    try:
        user = User(
            name=name,
            email=email,
            role=role,
            department=department or None,
            employee_or_student_id=employee_or_student_id or None,
            phone=phone or None,
            is_active=True
        )
        user.set_password(password)
        db.session.add(user)
        db.session.flush()

        log_audit(
            action='User Registered',
            entity_type='User',
            entity_id=user.id,
            new_value=f"Registered account: {user.name} ({user.email}, Role: {user.role})",
            user_id=user.id
        )

        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Registration successful. You can now log in with your credentials.",
            "user": user.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": f"Registration failed: {str(e)}"
        }), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    """User login endpoint validating credentials and establishing session."""
    data = request.get_json() or {}

    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''

    if not email:
        return jsonify({
            "success": False,
            "message": "Email address is required."
        }), 400

    if not EMAIL_REGEX.match(email):
        return jsonify({
            "success": False,
            "message": "Invalid email address format."
        }), 400

    if not is_valid_college_email(email):
        return jsonify({
            "success": False,
            "message": f"Please use your official college email address (@{OFFICIAL_COLLEGE_DOMAIN})."
        }), 400

    if not password:
        return jsonify({
            "success": False,
            "message": "Password is required."
        }), 400

    user = User.query.filter(db.func.lower(User.email) == email.lower()).first()

    if not user:
        log_audit(
            action='Login Failed - Account Not Found',
            entity_type='Auth',
            old_value=f"Account not found for email: {email}"
        )
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
        return jsonify({
            "success": False,
            "message": "Account not found with this email address. Please check your email or register."
        }), 404

    if not user.check_password(password):
        log_audit(
            action='Login Failed - Incorrect Password',
            entity_type='Auth',
            entity_id=user.id,
            old_value=f"Incorrect password attempt for user: {user.email}"
        )
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
        return jsonify({
            "success": False,
            "message": "Incorrect password. Please verify your password and try again."
        }), 401

    if not user.is_active:
        log_audit(
            action='Login Blocked (Deactivated Account)',
            entity_type='Auth',
            entity_id=user.id,
            user_id=user.id
        )
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
        return jsonify({
            "success": False,
            "message": "Your account is inactive / disabled. Please contact college administration."
        }), 403

    user.last_login = datetime.now(timezone.utc)
    login_user(user, remember=True)

    log_audit(
        action='Login Successful',
        entity_type='Auth',
        entity_id=user.id,
        new_value=f"Logged in user {user.name} ({user.role})",
        user_id=user.id
    )
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()

    return jsonify({
        "success": True,
        "message": "Login successful",
        "user": user.to_dict()
    }), 200



@auth_bp.route('/logout', methods=['POST'])
@login_required
def logout():
    """Logs out current user session."""
    uid = current_user.id
    uname = current_user.name
    log_audit(
        action='Logout',
        entity_type='Auth',
        entity_id=uid,
        new_value=f"User {uname} logged out",
        user_id=uid
    )
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()

    logout_user()
    return jsonify({
        "success": True,
        "message": "Logged out successfully"
    }), 200


@auth_bp.route('/me', methods=['GET'])
def get_current_user():
    """Returns profile of current authenticated user."""
    if current_user.is_authenticated:
        return jsonify({
            "success": True,
            "user": current_user.to_dict()
        }), 200

    return jsonify({
        "success": False,
        "message": "Authentication required. Please log in.",
        "user": None
    }), 401


@auth_bp.route('/profile', methods=['PATCH', 'PUT'])
@login_required
def update_profile():
    """Updates the logged-in user's profile details."""
    data = request.get_json() or {}
    name = (data.get('name') or '').strip()
    phone = (data.get('phone') or '').strip()

    if not name:
        return jsonify({"success": False, "message": "Name cannot be empty."}), 400

    current_user.name = name
    current_user.phone = phone or None
    current_user.updated_at = datetime.now(timezone.utc)

    log_audit(
        action='Profile Updated',
        entity_type='User',
        entity_id=current_user.id,
        new_value=f"Updated profile: name='{name}', phone='{phone}'",
        user_id=current_user.id
    )
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Profile updated successfully.",
        "user": current_user.to_dict()
    }), 200


@auth_bp.route('/change-password', methods=['POST'])
@login_required
def change_password():
    """Changes the logged-in user's password."""
    data = request.get_json() or {}
    current_password = data.get('current_password') or ''
    new_password = data.get('new_password') or ''

    if not current_password or not new_password:
        return jsonify({"success": False, "message": "Current and new password are required."}), 400

    if not current_user.check_password(current_password):
        return jsonify({"success": False, "message": "Current password is incorrect."}), 400

    if len(new_password) < 8:
        return jsonify({"success": False, "message": "New password must be at least 8 characters long."}), 400

    current_user.set_password(new_password)
    current_user.updated_at = datetime.now(timezone.utc)

    log_audit(
        action='Password Changed',
        entity_type='User',
        entity_id=current_user.id,
        user_id=current_user.id
    )
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Password changed successfully."
    }), 200


# RBAC Verification Endpoints (used for role-enforcement automated testing)
@auth_bp.route('/test/management', methods=['GET'])
@role_required('management')
def test_management_access():
    return jsonify({
        "success": True,
        "message": f"Welcome Management user {current_user.name}"
    }), 200


@auth_bp.route('/test/maintenance', methods=['GET'])
@role_required('maintenance')
def test_maintenance_access():
    return jsonify({
        "success": True,
        "message": f"Welcome Maintenance technician {current_user.name} ({current_user.department})"
    }), 200


@auth_bp.route('/test/staff', methods=['GET'])
@role_required('student', 'faculty')
def test_student_faculty_access():
    return jsonify({
        "success": True,
        "message": f"Welcome {current_user.role.capitalize()} {current_user.name}"
    }), 200
