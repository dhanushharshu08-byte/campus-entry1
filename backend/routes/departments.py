from flask import Blueprint, jsonify
from models.department import Department

departments_bp = Blueprint('departments', __name__, url_prefix='/api/departments')

@departments_bp.route('', methods=['GET'])
def list_departments():
    """List all active departments."""
    departments = Department.query.filter_by(is_active=True).order_by(Department.id.asc()).all()
    return jsonify({
        "success": True,
        "departments": [d.to_dict() for d in departments]
    }), 200
