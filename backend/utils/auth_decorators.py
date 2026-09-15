from functools import wraps
from typing import Callable, Any
from flask import jsonify
from flask_login import current_user

def role_required(*roles: str) -> Callable:
    """
    Decorator to enforce Role-Based Access Control (RBAC) on Flask endpoints.
    Accepts one or more role strings, e.g.:
        @role_required("management")
        @role_required("student", "faculty")
    """
    allowed_roles = set(roles)

    def decorator(f: Callable[..., Any]) -> Callable[..., Any]:
        @wraps(f)
        def decorated_function(*args: Any, **kwargs: Any) -> Any:
            # Check authentication
            if not current_user.is_authenticated:
                return jsonify({
                    "success": False,
                    "message": "Authentication required. Please log in."
                }), 401

            # Check active status
            if not getattr(current_user, 'is_active', True):
                return jsonify({
                    "success": False,
                    "message": "Account has been deactivated. Please contact campus administration."
                }), 403

            # Check role permission
            user_role = getattr(current_user, 'role', None)
            if user_role not in allowed_roles:
                return jsonify({
                    "success": False,
                    "message": f"Access denied. Requires one of roles: {', '.join(sorted(allowed_roles))}."
                }), 403

            return f(*args, **kwargs)
        return decorated_function
    return decorator
