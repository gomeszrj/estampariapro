import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mdpsrbmfzaosuvhamvbs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kcHNyYm1memFvc3V2aGFtdmJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzNTkxNjgsImV4cCI6MjA4NDkzNTE2OH0.FieQkWGUZ-iRx6XHqk8vNaa9NnNuPtkSFn6f7W5vO_U';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});
