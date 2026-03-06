-- ============================================================
-- Co-op Program Management System — Supabase SQL Migrations
-- Run these in order in the Supabase SQL Editor
-- ============================================================

-- ============================================================
-- STEP 1: Create Tables
-- ============================================================

-- user_profiles
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('student', 'coordinator', 'supervisor')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- applicants
CREATE TABLE IF NOT EXISTS public.applicants (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name    TEXT NOT NULL,
  student_id   CHAR(9) UNIQUE NOT NULL,
  email        TEXT UNIQUE NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'provisionally_accepted', 'finally_accepted', 'rejected', 'finally_rejected')),
  applied_at   TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at  TIMESTAMPTZ,
  reviewed_by  UUID REFERENCES auth.users(id)
);

-- students
CREATE TABLE IF NOT EXISTS public.students (
  id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  applicant_id   UUID REFERENCES public.applicants(id),
  full_name      TEXT NOT NULL,
  student_number CHAR(9) UNIQUE NOT NULL,
  program        TEXT
);

-- work_terms
CREATE TABLE IF NOT EXISTS public.work_terms (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  term_label      TEXT NOT NULL,
  start_date      DATE NOT NULL,
  end_date        DATE,
  report_deadline DATE,
  status          TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'completed', 'flagged'))
);

-- term_reports
CREATE TABLE IF NOT EXISTS public.term_reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_term_id    UUID UNIQUE NOT NULL REFERENCES public.work_terms(id) ON DELETE CASCADE,
  student_id      UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  storage_path    TEXT NOT NULL,
  file_size_bytes INTEGER NOT NULL,
  submitted_at    TIMESTAMPTZ DEFAULT NOW()
);

-- supervisors
CREATE TABLE IF NOT EXISTS public.supervisors (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name    TEXT NOT NULL,
  company_name TEXT NOT NULL,
  work_email   TEXT UNIQUE NOT NULL
);

-- job_assignments
CREATE TABLE IF NOT EXISTS public.job_assignments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_term_id  UUID UNIQUE NOT NULL REFERENCES public.work_terms(id) ON DELETE CASCADE,
  company_name  TEXT NOT NULL,
  supervisor_id UUID REFERENCES auth.users(id),
  status        TEXT NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'completed', 'fired', 'rejected'))
);

-- exception_flags
CREATE TABLE IF NOT EXISTS public.exception_flags (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_assignment_id UUID UNIQUE NOT NULL REFERENCES public.job_assignments(id) ON DELETE CASCADE,
  flagged_by        UUID REFERENCES auth.users(id),
  reason            TEXT NOT NULL CHECK (reason IN ('fired_terminated', 'rejected', 'other')),
  notes             TEXT,
  requires_meeting  BOOLEAN DEFAULT TRUE,
  flagged_at        TIMESTAMPTZ DEFAULT NOW()
);

-- evaluations
CREATE TABLE IF NOT EXISTS public.evaluations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_assignment_id UUID UNIQUE NOT NULL REFERENCES public.job_assignments(id) ON DELETE CASCADE,
  supervisor_id     UUID NOT NULL REFERENCES public.supervisors(id),
  submission_type   TEXT NOT NULL CHECK (submission_type IN ('pdf_upload', 'digital_form')),
  storage_path      TEXT,
  behaviour_score   INTEGER CHECK (behaviour_score BETWEEN 1 AND 5),
  skills_score      INTEGER CHECK (skills_score BETWEEN 1 AND 5),
  knowledge_score   INTEGER CHECK (knowledge_score BETWEEN 1 AND 5),
  attitude_score    INTEGER CHECK (attitude_score BETWEEN 1 AND 5),
  comments          TEXT,
  submitted_at      TIMESTAMPTZ DEFAULT NOW()
);

-- reminder_logs
CREATE TABLE IF NOT EXISTS public.reminder_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  work_term_id UUID NOT NULL REFERENCES public.work_terms(id) ON DELETE CASCADE,
  sent_at      TIMESTAMPTZ DEFAULT NOW(),
  sent_by      UUID REFERENCES auth.users(id)
);

-- ============================================================
-- STEP 2: Indexes for performance
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_applicants_status ON public.applicants(status);
CREATE INDEX IF NOT EXISTS idx_applicants_applied_at ON public.applicants(applied_at);
CREATE INDEX IF NOT EXISTS idx_work_terms_student_id ON public.work_terms(student_id);
CREATE INDEX IF NOT EXISTS idx_work_terms_status ON public.work_terms(status);
CREATE INDEX IF NOT EXISTS idx_term_reports_student_id ON public.term_reports(student_id);
CREATE INDEX IF NOT EXISTS idx_job_assignments_supervisor_id ON public.job_assignments(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_student_work_term ON public.reminder_logs(student_id, work_term_id);

-- ============================================================
-- STEP 3: Enable Row-Level Security on all tables
-- ============================================================

ALTER TABLE public.user_profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicants       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_terms       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.term_reports     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supervisors      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_assignments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exception_flags  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder_logs    ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 4: RLS Policies
-- ============================================================

-- Helper: check if the calling user has a given role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.user_profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- user_profiles: users can read their own profile
CREATE POLICY "users_own_profile_select" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

-- user_profiles: coordinators can read all profiles
CREATE POLICY "coordinator_read_all_profiles" ON public.user_profiles
  FOR SELECT USING (public.get_user_role() = 'coordinator');

-- applicants: anyone can INSERT (public application form)
CREATE POLICY "public_insert_applicants" ON public.applicants
  FOR INSERT WITH CHECK (true);

-- applicants: coordinators can SELECT, UPDATE
CREATE POLICY "coordinator_select_applicants" ON public.applicants
  FOR SELECT USING (public.get_user_role() = 'coordinator');

CREATE POLICY "coordinator_update_applicants" ON public.applicants
  FOR UPDATE USING (public.get_user_role() = 'coordinator');

-- students: students can read only their own record
CREATE POLICY "student_own_record_select" ON public.students
  FOR SELECT USING (auth.uid() = id);

-- students: coordinators can read all student records
CREATE POLICY "coordinator_read_all_students" ON public.students
  FOR SELECT USING (public.get_user_role() = 'coordinator');

-- students: coordinators can insert student records (on provisional acceptance)
CREATE POLICY "coordinator_insert_students" ON public.students
  FOR INSERT WITH CHECK (public.get_user_role() = 'coordinator');

-- work_terms: students can only read their own
CREATE POLICY "student_own_workterms_select" ON public.work_terms
  FOR SELECT USING (auth.uid() = student_id);

-- work_terms: coordinators can read all
CREATE POLICY "coordinator_read_all_workterms" ON public.work_terms
  FOR SELECT USING (public.get_user_role() = 'coordinator');

-- work_terms: coordinators can insert/update
CREATE POLICY "coordinator_manage_workterms" ON public.work_terms
  FOR ALL USING (public.get_user_role() = 'coordinator');

-- term_reports: students can only read/insert their own
CREATE POLICY "student_own_reports_select" ON public.term_reports
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "student_insert_reports" ON public.term_reports
  FOR INSERT WITH CHECK (auth.uid() = student_id);

-- term_reports: coordinators can read all
CREATE POLICY "coordinator_read_all_reports" ON public.term_reports
  FOR SELECT USING (public.get_user_role() = 'coordinator');

-- supervisors: supervisors can read their own record
CREATE POLICY "supervisor_own_record_select" ON public.supervisors
  FOR SELECT USING (auth.uid() = id);

-- supervisors: coordinators can read all
CREATE POLICY "coordinator_read_all_supervisors" ON public.supervisors
  FOR SELECT USING (public.get_user_role() = 'coordinator');

-- job_assignments: supervisors can read assignments linked to them
CREATE POLICY "supervisor_own_assignments_select" ON public.job_assignments
  FOR SELECT USING (auth.uid() = supervisor_id);

-- job_assignments: students can read assignments in their work terms
CREATE POLICY "student_own_assignments_select" ON public.job_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.work_terms
      WHERE work_terms.id = job_assignments.work_term_id
        AND work_terms.student_id = auth.uid()
    )
  );

-- job_assignments: coordinators can read/write all
CREATE POLICY "coordinator_manage_assignments" ON public.job_assignments
  FOR ALL USING (public.get_user_role() = 'coordinator');

-- exception_flags: coordinators can read/write all
CREATE POLICY "coordinator_manage_flags" ON public.exception_flags
  FOR ALL USING (public.get_user_role() = 'coordinator');

-- evaluations: supervisors can read/insert their own
CREATE POLICY "supervisor_own_evaluations_select" ON public.evaluations
  FOR SELECT USING (auth.uid() = supervisor_id);

CREATE POLICY "supervisor_insert_evaluations" ON public.evaluations
  FOR INSERT WITH CHECK (auth.uid() = supervisor_id);

-- evaluations: coordinators can read all
CREATE POLICY "coordinator_read_all_evaluations" ON public.evaluations
  FOR SELECT USING (public.get_user_role() = 'coordinator');

-- reminder_logs: coordinators can read/write
CREATE POLICY "coordinator_manage_reminder_logs" ON public.reminder_logs
  FOR ALL USING (public.get_user_role() = 'coordinator');

-- ============================================================
-- STEP 5: Storage Buckets
-- Run these separately in the Supabase Storage section OR via SQL
-- ============================================================

-- NOTE: Create these buckets manually in the Supabase Dashboard > Storage:
--   1. reports      — Private
--   2. evaluations  — Private
--   3. templates    — Public (read-only)
--
-- Then upload `term-report-template.pdf` to the `templates` bucket.
--
-- Storage RLS policies (run in SQL editor after creating buckets):

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('reports', 'reports', false),
  ('evaluations', 'evaluations', false),
  ('templates', 'templates', true)
ON CONFLICT (id) DO NOTHING;

-- Reports bucket: students can upload/read their own files
CREATE POLICY "student_upload_reports" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'reports' AND
    auth.uid()::text = (string_to_array(name, '/'))[2]
  );

CREATE POLICY "student_read_own_reports" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'reports' AND
    auth.uid()::text = (string_to_array(name, '/'))[2]
  );

CREATE POLICY "coordinator_read_all_reports_storage" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'reports' AND
    public.get_user_role() = 'coordinator'
  );

-- Evaluations bucket: supervisors can upload/read their own
CREATE POLICY "supervisor_upload_evaluations" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'evaluations' AND
    auth.uid()::text = (string_to_array(name, '/'))[2]
  );

CREATE POLICY "supervisor_read_own_evaluations" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'evaluations' AND
    auth.uid()::text = (string_to_array(name, '/'))[2]
  );

-- Templates bucket: public read
CREATE POLICY "public_read_templates" ON storage.objects
  FOR SELECT USING (bucket_id = 'templates');

-- ============================================================
-- STEP 6: Seed a Coordinator account
-- Replace with your actual coordinator email and use the
-- Supabase Auth dashboard to create the user, then run:
-- ============================================================

-- After creating the coordinator user in Supabase Auth dashboard,
-- insert their profile:
-- INSERT INTO public.user_profiles (id, role)
-- VALUES ('<coordinator-auth-user-uuid>', 'coordinator');
