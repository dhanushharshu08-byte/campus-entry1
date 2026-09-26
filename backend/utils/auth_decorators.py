from functools import wraps
from typing import Callable, Any
from flask import jsonify, request
from flask_login import current_user, login_user

def role_required(*roles: str) -> Callable:
    """
    Decorator to enforce Role-Based Access Control (RBAC) on Flask endpoints.
    Accepts one or more role strings, e.g.:
        @role_required("management")
        @role_required("student", "faculty")
    """
    allowed_roles = {r.strip().lower() for r in roles if r}

    def decorator(f: Callable[..., Any]) -> Callable[..., Any]:
        @wraps(f)
        def decorated_function(*args: Any, **kwargs: Any) -> Any:
            active_user = current_user
            # If not authenticated via session cookie, attempt token authentication fallback
            if not getattr(active_user, 'is_authenticated', False):
                from models.user import User
                auth_header = (request.headers.get('Authorization') or '').strip()
                token = ''
                if auth_header.startswith('Bearer '):
                    token = auth_header[len('Bearer '):].strip()
                elif auth_header:
                    token = auth_header.strip()
                if not token:
                    token = (request.headers.get('X-Auth-Token') or request.headers.get('X-Session-Token') or '').strip()
                if token:
                    user = User.verify_auth_token(token)
                    if user and user.is_active:
                        login_user(user, remember=True)
                        active_user = user

            # Check authentication
            if not getattr(active_user, 'is_authenticated', False):
                return jsonify({
                    "success": False,
                    "message": "Authentication required. Please log in."
                }), 401

            # Check active status
            if not getattr(active_user, 'is_active', True):
                return jsonify({
                    "success": False,
                    "message": "Account has been deactivated. Please contact campus administration."
                }), 403

            # Check role permission (case-insensitive & whitespace-trimmed)
            raw_role = getattr(active_user, 'role', None) or getattr(active_user, 'user_role', None)
            user_role = str(raw_role or '').strip().lower()

            # Normalize admin alias -> management for RBAC compatibility
            if user_role in ('admin', 'administrator') and 'management' in allowed_roles:
                user_role = 'management'

            if user_role not in allowed_roles:
                return jsonify({
                    "success": False,
                    "message": f"Access denied. Requires one of roles: {', '.join(sorted(allowed_roles))}."
                }), 403

            return f(*args, **kwargs)
        return decorated_function
    return decorator
