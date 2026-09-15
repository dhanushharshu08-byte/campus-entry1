from __future__ import annotations
from datetime import datetime, timezone
from typing import Any, Optional, Dict
from extensions import db

def utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)

DEFAULT_SETTINGS: Dict[str, Dict[str, str]] = {
    'high_sla_hours': {'value': '4', 'description': 'SLA resolution deadline in hours for High priority complaints'},
    'medium_sla_hours': {'value': '24', 'description': 'SLA resolution deadline in hours for Medium priority complaints'},
    'low_sla_hours': {'value': '72', 'description': 'SLA resolution deadline in hours for Low priority complaints'},
    'approaching_threshold_pct': {'value': '25', 'description': 'Warning threshold percentage of remaining SLA time before escalation'},
    'critical_multiplier': {'value': '2.0', 'description': 'Multiplier of SLA duration exceeding which critical escalation triggers'},
    'max_upload_size_mb': {'value': '5', 'description': 'Maximum allowed file upload size in megabytes'}
}

class SystemSetting(db.Model):
    __tablename__ = 'system_settings'

    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(50), unique=True, nullable=False, index=True)
    value = db.Column(db.String(255), nullable=False)
    description = db.Column(db.String(255), nullable=True)
    updated_at = db.Column(db.DateTime, default=utc_now, onupdate=utc_now)

    def __init__(self, key: Optional[str] = None, value: Optional[str] = None, description: Optional[str] = None, **kwargs: Any) -> None:
        super().__init__(**kwargs)
        if key is not None:
            self.key = key
        if value is not None:
            self.value = value
        if description is not None:
            self.description = description

    @classmethod
    def get_setting(cls, key: str, default: Optional[Any] = None) -> Optional[str]:
        """Retrieves a system setting value by key with a fallback default."""
        setting = cls.query.filter_by(key=key).first()
        if setting:
            return setting.value
        if default is not None:
            return str(default)
        if key in DEFAULT_SETTINGS:
            return DEFAULT_SETTINGS[key]['value']
        return None

    @classmethod
    def get_setting_int(cls, key: str, default: Optional[int] = None) -> int:
        val = cls.get_setting(key, default)
        if val is None:
            return default if default is not None else 0
        try:
            return int(float(val))
        except (ValueError, TypeError):
            return default if default is not None else 0

    @classmethod
    def get_setting_float(cls, key: str, default: Optional[float] = None) -> float:
        val = cls.get_setting(key, default)
        if val is None:
            return default if default is not None else 0.0
        try:
            return float(val)
        except (ValueError, TypeError):
            return default if default is not None else 0.0

    @classmethod
    def set_setting(cls, key: str, value: Any, description: Optional[str] = None) -> SystemSetting:
        """Sets or updates a system setting value."""
        setting = cls.query.filter_by(key=key).first()
        if not setting:
            desc = description or (DEFAULT_SETTINGS.get(key, {}).get('description'))
            setting = SystemSetting(key=key, value=str(value), description=desc)
            db.session.add(setting)
        else:
            setting.value = str(value)
            if description:
                setting.description = description
            setting.updated_at = utc_now()
        return setting

    @classmethod
    def get_value(cls, key: str, default: Optional[Any] = None) -> Optional[str]:
        return cls.get_setting(key, default)

    @classmethod
    def set_value(cls, key: str, value: Any, description: Optional[str] = None) -> SystemSetting:
        return cls.set_setting(key, value, description)

    @classmethod
    def init_default_settings(cls) -> None:
        """Initializes default settings in database if they do not exist."""
        for k, v in DEFAULT_SETTINGS.items():
            if not cls.query.filter_by(key=k).first():
                db.session.add(SystemSetting(key=k, value=v['value'], description=v['description']))
        db.session.commit()

    @classmethod
    def get_all_settings_dict(cls) -> Dict[str, Dict[str, Optional[str]]]:
        """Returns dictionary of all system settings with metadata."""
        settings = cls.query.all()
        result: Dict[str, Dict[str, Optional[str]]] = {}
        for s in settings:
            result[s.key] = {
                'value': s.value,
                'description': s.description,
                'updated_at': s.updated_at.isoformat() if s.updated_at else None
            }
        # Include missing defaults
        for k, v in DEFAULT_SETTINGS.items():
            if k not in result:
                result[k] = {
                    'value': v['value'],
                    'description': v['description'],
                    'updated_at': None
                }
        return result

    def to_dict(self) -> Dict[str, Any]:
        return {
            'id': self.id,
            'key': self.key,
            'value': self.value,
            'description': self.description,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def __repr__(self) -> str:
        return f"<SystemSetting {self.key}={self.value}>"


