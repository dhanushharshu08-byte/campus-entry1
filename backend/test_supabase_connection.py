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
import urllib.request
from dotenv import load_dotenv

# Load .env
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

from supabase import create_client, Client
from config import Config

class TestSupabaseConnection(unittest.TestCase):

    def setUp(self):
        self.url = os.environ.get('SUPABASE_URL') or getattr(Config, 'SUPABASE_URL', None)
        self.anon_key = os.environ.get('SUPABASE_ANON_KEY') or getattr(Config, 'SUPABASE_ANON_KEY', None)
        self.service_role = os.environ.get('SUPABASE_SERVICE_ROLE_KEY') or getattr(Config, 'SUPABASE_SERVICE_ROLE_KEY', None)
        self.pub_key = os.environ.get('SUPABASE_PUBLISHABLE_KEY') or getattr(Config, 'SUPABASE_PUBLISHABLE_KEY', None)
        self.project_ref = os.environ.get('SUPABASE_PROJECT_REF') or getattr(Config, 'SUPABASE_PROJECT_REF', None)

        if not self.url:
            self.skipTest(
                'Supabase environment variables not configured. '
                'Set SUPABASE_URL to run these tests.'
            )

    def test_01_environment_variables_loaded(self):
        """Verify Supabase environment variables are properly defined."""
        self.assertIsNotNone(self.url, "SUPABASE_URL must be defined")
        self.assertTrue(self.url.startswith("https://"), "SUPABASE_URL must be HTTPS")
        self.assertIsNotNone(self.anon_key, "SUPABASE_ANON_KEY must be defined")
        self.assertEqual(self.project_ref, "jxjfyrodyaellwnhhauy", "Project reference must match")
        print(f"\n[OK] Supabase Environment variables loaded for project: {self.project_ref}")

    def test_02_anon_client_initialization(self):
        """Verify Supabase public client initialization."""
        self.assertIsNotNone(self.url, "SUPABASE_URL must be set")
        self.assertIsNotNone(self.anon_key, "SUPABASE_ANON_KEY must be set")
        assert self.url is not None
        assert self.anon_key is not None
        client: Client = create_client(self.url, self.anon_key)
        self.assertIsNotNone(client)
        print(f"[OK] Supabase Public (Anon) Client successfully created.")

    def test_03_live_endpoint_connectivity(self):
        """Verify live network connectivity to Supabase project health endpoint."""
        assert self.url is not None
        assert self.anon_key is not None
        health_url = f"{self.url}/auth/v1/health"
        req = urllib.request.Request(
            health_url,
            headers={
                'apikey': self.anon_key,
                'Authorization': f'Bearer {self.anon_key}'
            }
        )
        try:
            with urllib.request.urlopen(req, timeout=10) as response:
                status_code = response.getcode()
                body = response.read().decode('utf-8')
                self.assertEqual(status_code, 200)
                print(f"[OK] Supabase live endpoint reachable: {health_url} -> Status {status_code} ({body.strip()})")
        except Exception as e:
            self.fail(f"Failed to connect to Supabase endpoint: {e}")

    def test_04_admin_service_role_client_initialization(self):
        """Verify Supabase Admin (service_role) client initialization if configured."""
        if not self.service_role:
            print("[INFO] SUPABASE_SERVICE_ROLE_KEY is optional/not set, skipping admin client test.")
            return
        assert self.url is not None
        assert self.service_role is not None
        admin_client: Client = create_client(self.url, self.service_role)
        self.assertIsNotNone(admin_client)
        print(f"[OK] Supabase Service Role (Admin) Client successfully created.")

    def test_05_config_class_integration(self):
        """Verify backend Config class properly exposes Supabase settings."""
        self.assertEqual(getattr(Config, 'SUPABASE_PROJECT_REF', None), "jxjfyrodyaellwnhhauy")
        self.assertEqual(getattr(Config, 'SUPABASE_URL', None), "https://jxjfyrodyaellwnhhauy.supabase.co")
        anon_key = getattr(Config, 'SUPABASE_ANON_KEY', '')
        self.assertTrue(len(anon_key) > 20)
        pub_key = getattr(Config, 'SUPABASE_PUBLISHABLE_KEY', '')
        self.assertTrue(len(pub_key) > 10)
        print(f"[OK] Flask Config integration verified.")

if __name__ == '__main__':
    unittest.main(verbosity=2)

