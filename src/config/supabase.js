const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dmmefaeprkgkzpoxvoje.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtbWVmYWVwcmtna3pwb3h2b2plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0OTAwNzMsImV4cCI6MjA1OTA2NjA3M30.RdAJCHkzTKJeiES-P8AcnLCyfzryCJ6VVDR0z3eVlKc';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'public',
  },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

module.exports = supabase;