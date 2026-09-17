from flask import Blueprint, jsonify
from extensions import db
from models.department import Department

departments_bp = Blueprint('departments', __name__, url_prefix='/api/departments')

DEFAULT_DEPARTMENTS = [
    {"name": "Electrical", "description": "Power supply, lighting, switchboards, wiring, fans, and lab power"},
    {"name": "Plumbing", "description": "Restrooms, water coolers, piping, taps, drainage, and pumps"},
    {"name": "Civil", "description": "Masonry, plastering, doors, windows, paint, ceiling, and flooring"},
    {"name": "Carpentry", "description": "Desks, benches, podiums, lab furniture, doors, and cupboards"},
    {"name": "Cleaning", "description": "Classroom housekeeping, sanitation, washrooms, and waste disposal"},
    {"name": "IT / Network", "description": "Computers, projectors, lab systems, WiFi, LAN, and smart boards"},
    {"name": "Other", "description": "General facilities, sports equipment, signage, and miscellaneous"}
]

def ensure_seed_departments():
    """Ensure essential departments exist without duplicating existing records."""
    try:
        existing_names = {d.name.strip().lower() for d in Department.query.all()}
        added = False
        for item in DEFAULT_DEPARTMENTS:
            if item["name"].strip().lower() not in existing_names:
                dept = Department(name=item["name"], description=item["description"], is_active=True)
                db.session.add(dept)
                added = True
        if added:
            db.session.commit()
    except Exception:
        db.session.rollback()

ORDER_PRIORITY = {name["name"].lower(): i for i, name in enumerate(DEFAULT_DEPARTMENTS)}

@departments_bp.route('', methods=['GET'])
@departments_bp.route('/', methods=['GET'])
def list_departments():
    """List all active departments in standard order."""
    departments = Department.query.filter_by(is_active=True).all()
    if not departments:
        ensure_seed_departments()
        departments = Department.query.filter_by(is_active=True).all()
    
    sorted_depts = sorted(
        departments,
        key=lambda d: ORDER_PRIORITY.get(d.name.strip().lower(), 999)
    )

    return jsonify({
        "success": True,
        "departments": [d.to_dict() for d in sorted_depts]
    }), 200


