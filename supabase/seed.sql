-- ============================================================
-- Seed Data for Development / Testing
-- Run AFTER migrations.sql
-- ============================================================

-- NOTE: Create a coordinator user in the Supabase Auth Dashboard first,
-- then replace the UUID below with the actual auth user ID.
--
-- Supabase Dashboard → Authentication → Users → Add user
-- Email: coordinator@torontomu.ca | Password: (your choice)
-- Copy the UUID and paste it below:

-- INSERT INTO public.user_profiles (id, role)
-- VALUES ('<YOUR-COORDINATOR-UUID>', 'coordinator');

-- ============================================================
-- Sample applicants (for testing initial review)
-- ============================================================

INSERT INTO public.applicants (full_name, student_id, email, status) VALUES
  ('Aaron Tom',      '501297029', 'aaron.tom@torontomu.ca',      'pending'),
  ('Jacob Mobin',    '501234567', 'jacob.mobin@torontomu.ca',    'pending'),
  ('Rayan Roshan',   '501345678', 'rayan.roshan@torontomu.ca',   'pending'),
  ('Zakariyya Islam','501456789', 'zakariyya.islam@torontomu.ca','pending'),
  ('Ethan Cha',      '501567890', 'ethan.cha@torontomu.ca',      'provisionally_accepted')
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- Coordinator Dashboard Metrics Query (run to verify)
-- ============================================================
-- SELECT status, count(*) FROM public.applicants GROUP BY status;
