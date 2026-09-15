/**
 * Supabase Client Configuration for CampuSentry Frontend.
 * Initializes the Supabase browser client with official project credentials.
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jxjfyrodyaellwnhhauy.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4amZ5cm9keWFlbGx3bmhoYXV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwMjExMzgsImV4cCI6MjEwNDU5NzEzOH0.Mkq_i-GaGjDoLq0QbfEpn1dJn6C20mBrOj2sV2-fRO0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const SUPABASE_PROJECT_CONFIG = {
  url: supabaseUrl,
  projectRef: 'jxjfyrodyaellwnhhauy',
  publishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_ryoCMyv6rSQ87ewm7iGyRA_SCtXM0Vu',
};

export default supabase;
