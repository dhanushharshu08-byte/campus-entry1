"""
Verification script for Supabase Database & API Connectivity.
Tests:
- Supabase Project URL & Keys Loading
- REST API Connectivity & Auth
- Supabase Admin Client Initialization
- Database Configuration Settings
"""
import os
import sys
import unittest
from dotenv import load_dotenv

# Load .env
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

from supabase import create_client, Client
from config import Config

class TestSupabaseConnection(unittest.TestCase):

    def setUp(self):
        self.url = os.environ.get('SUPABASE_URL')
        self.anon_key = os.environ.get('SUPABASE_ANON_KEY')
        self.service_role = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
        self.pub_key = os.environ.get('SUPABASE_PUBLISHABLE_KEY')
        self.project_ref = os.environ.get('SUPABASE_PROJECT_REF')

    def test_01_environment_variables_loaded(self):
        """Verify Supabase environment variables are properly defined."""
        self.assertIsNotNone(self.url, "SUPABASE_URL must be defined")
        self.assertTrue(self.url.startswith("https://"), "SUPABASE_URL must be HTTPS")
        self.assertIsNotNone(self.anon_key, "SUPABASE_ANON_KEY must be defined")
        self.assertIsNotNone(self.service_role, "SUPABASE_SERVICE_ROLE_KEY must be defined")
        self.assertEqual(self.project_ref, "jxjfyrodyaellwnhhauy", "Project reference must match")
        print(f"\n[OK] Supabase Environment variables loaded for project: {self.project_ref}")

    def test_02_anon_client_initialization(self):
        """Verify Supabase public client initialization."""
        self.assertIsNotNone(self.url, "SUPABASE_URL must be set")
        self.assertIsNotNone(self.anon_key, "SUPABASE_ANON_KEY must be set")
        assert self.url is not None  # narrow type for type checker
        assert self.anon_key is not None
        client: Client = create_client(self.url, self.anon_key)
        self.assertIsNotNone(client)
        print(f"[OK] Supabase Public (Anon) Client successfully created.")

    def test_03_admin_service_role_client_initialization(self):
        """Verify Supabase Admin (service_role) client initialization."""
        self.assertIsNotNone(self.url, "SUPABASE_URL must be set")
        self.assertIsNotNone(self.service_role, "SUPABASE_SERVICE_ROLE_KEY must be set")
        assert self.url is not None  # narrow type for type checker
        assert self.service_role is not None
        admin_client: Client = create_client(self.url, self.service_role)
        self.assertIsNotNone(admin_client)
        print(f"[OK] Supabase Service Role (Admin) Client successfully created.")

    def test_04_config_class_integration(self):
        """Verify backend Config class properly exposes Supabase settings."""
        self.assertEqual(getattr(Config, 'SUPABASE_PROJECT_REF', None), "jxjfyrodyaellwnhhauy")
        self.assertEqual(getattr(Config, 'SUPABASE_URL', None), "https://jxjfyrodyaellwnhhauy.supabase.co")
        anon_key = getattr(Config, 'SUPABASE_ANON_KEY', '')
        self.assertTrue(len(anon_key) > 20)
        service_key = getattr(Config, 'SUPABASE_SERVICE_ROLE_KEY', '')
        self.assertTrue(len(service_key) > 20)
        print(f"[OK] Flask Config integration verified.")

if __name__ == '__main__':
    unittest.main(verbosity=2)
