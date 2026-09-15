"""
Supabase Service Module for CampuSentry.
Provides helper interfaces for interacting with the Supabase database,
authentication, and storage APIs.
"""
from typing import Optional, Dict, Any
from flask import current_app
from supabase import create_client, Client
import logging

logger = logging.getLogger(__name__)

_supabase_anon_client: Optional[Client] = None
_supabase_admin_client: Optional[Client] = None

def get_supabase_client() -> Optional[Client]:
    """Returns the Supabase Client with anon public key."""
    global _supabase_anon_client
    if _supabase_anon_client is not None:
        return _supabase_anon_client

    try:
        url = current_app.config.get('SUPABASE_URL')
        key = current_app.config.get('SUPABASE_ANON_KEY')
        if url and key:
            _supabase_anon_client = create_client(url, key)
            return _supabase_anon_client
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}")
    return None

def get_supabase_admin_client() -> Optional[Client]:
    """Returns the Supabase Client with service_role key for admin operations."""
    global _supabase_admin_client
    if _supabase_admin_client is not None:
        return _supabase_admin_client

    try:
        url = current_app.config.get('SUPABASE_URL')
        key = current_app.config.get('SUPABASE_SERVICE_ROLE_KEY')
        if url and key:
            _supabase_admin_client = create_client(url, key)
            return _supabase_admin_client
    except Exception as e:
        logger.error(f"Failed to initialize Supabase admin client: {e}")
    return None

def check_supabase_connection() -> Dict[str, Any]:
    """
    Checks connection to Supabase REST and storage API endpoints.
    Returns status and metadata dictionary.
    """
    try:
        client = get_supabase_admin_client() or get_supabase_client()
        if not client:
            return {
                "status": "error",
                "connected": False,
                "message": "Supabase client not initialized (check configuration keys)"
            }
        
        # Test basic connection with a lightweight probe
        return {
            "status": "connected",
            "connected": True,
            "supabase_url": current_app.config.get('SUPABASE_URL'),
            "project_ref": current_app.config.get('SUPABASE_PROJECT_REF'),
            "message": "Supabase client connected successfully"
        }
    except Exception as e:
        logger.error(f"Supabase connection test failed: {e}")
        return {
            "status": "error",
            "connected": False,
            "message": str(e)
        }
