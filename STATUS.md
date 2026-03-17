# Co-op Program Management System — Project Progress
**Group 6 | Sprint 1**
Rayan Roshan · Zakariyya Islam · Aarom Tom · Jacob Mobin · Ethan Cha

---

> **How to use this file:** Work through phases sequentially. Check off tasks as they are completed. Do not begin a phase until all tasks in the previous phase are marked done. Reference the linked sections of `DESIGN_DOC.md` for full specification details.

---

## Phase 1: Boilerplate and Project Setup

Sets up the foundational project structure for both the React frontend and Flask backend, connects to Supabase, and establishes shared tooling so every team member can run the project locally from day one.

*Refer to: Section 4.2 (Technology Stack) and Section 4.4 (Deployment Architecture) in `DESIGN_DOC.md`*

### Repository & Tooling
- [ ] Create a GitHub repository with a `main` branch and branch protection rules (PRs required before merge)
- [ ] Add a root-level `.gitignore` covering `node_modules/`, `__pycache__/`, `.env`, and `*.pyc`
- [ ] Add a `README.md` with local setup instructions for both frontend and backend

### React Frontend
- [ ] Scaffold React app (e.g., `create-react-app` or Vite)
- [ ] Install and configure React Router v6
- [ ] Install Axios for HTTP requests to the Flask API
- [ ] Install and configure Tailwind CSS
- [ ] Create a `.env` file with `REACT_APP_API_URL`, `REACT_APP_SUPABASE_URL`, and `REACT_APP_SUPABASE_ANON_KEY`
- [ ] Install `@supabase/supabase-js` and create a `src/supabaseClient.js` singleton
- [ ] Create the top-level route shell (placeholder pages for `/apply`, `/login`, `/student/*`, `/coordinator/*`, `/supervisor/*`)

### Flask Backend
- [ ] Create a Python virtual environment and `requirements.txt`
- [ ] Install Flask, Flask-CORS, Flask-Mail, `supabase-py`, `python-dotenv`, `PyJWT`, `python-magic`, and `gunicorn`
- [ ] Scaffold the Flask app factory (`app/__init__.py`) with `create_app()`
- [ ] Register empty Blueprints: `auth`, `students`, `coordinator`, `supervisor`
- [ ] Create a `.env` file with `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `FLASK_SECRET_KEY`, and mail credentials
- [ ] Create `app/services/supabase.py` with a Supabase client singleton
- [ ] Confirm Flask dev server runs on port 5000 with a working `GET /api/v1/health` → `{ "status": "ok" }`

### Supabase Project
- [ ] Create a Supabase project and record the project URL, anon key, and service role key
- [ ] Enable email/password auth in the Supabase Auth dashboard
- [ ] Create Supabase Storage buckets: `reports` (private), `evaluations` (private), `templates` (public)
- [ ] Upload the static `term-report-template.pdf` to the `templates` bucket

### CI/CD
- [ ] Add a GitHub Actions workflow that runs `pytest` on every pull request to `main`
- [ ] Add a GitHub Actions workflow that runs `npm test` on every pull request to `main`

---

## Phase 2: Database Schema and Authentication

Defines and migrates the full database schema in Supabase, enables Row-Level Security, and implements end-to-end authentication for all three user roles.

*Refer to: Section 5 (Data Model), Section 6.1 (Authentication Endpoints), Section 11 (Security Design), and Section 7.2 (Student Authentication) in `DESIGN_DOC.md`*

### Database Schema
- [ ] Create the `user_profiles` table (`id`, `role`, `created_at`) with FK → `auth.users.id`
- [ ] Create the `applicants` table with all columns and `CHECK` constraints on `status`
- [ ] Create the `students` table with FK → `auth.users.id` and FK → `applicants.id`
- [ ] Create the `work_terms` table with all columns and `CHECK` constraint on `status`
- [ ] Create the `term_reports` table with FK → `work_terms.id` and FK → `students.id`
- [ ] Create the `job_assignments` table with `CHECK` constraint on `status`
- [ ] Create the `exception_flags` table with FK → `job_assignments.id`
- [ ] Create the `supervisors` table with FK → `auth.users.id`
- [ ] Create the `evaluations` table with `CHECK` constraints on all score columns
- [ ] Create the `reminder_logs` table with FKs → `students.id` and `work_terms.id`
- [ ] Verify all foreign key relationships are correct in the Supabase dashboard

### Row-Level Security (RLS)
- [ ] Enable RLS on all tables
- [ ] Write and apply RLS policy: students can only `SELECT` their own rows in `work_terms`, `term_reports`
- [ ] Write and apply RLS policy: coordinators can `SELECT`, `INSERT`, `UPDATE` on `applicants` and `students`
- [ ] Write and apply RLS policy: supervisors can only `SELECT` and `INSERT` on their own `evaluations`
- [ ] Write and apply RLS policy: `reminder_logs` is only writable by coordinator role

### Flask Auth Utilities
- [ ] Implement `@require_role(*roles)` decorator in `app/utils/auth.py` using `PyJWT` and `SUPABASE_JWT_SECRET`
- [ ] Confirm decorator returns `401` for missing/expired token and `403` for wrong role
- [ ] Implement `POST /api/v1/auth/register/supervisor` in the `auth` Blueprint (creates Supabase Auth user + `user_profiles` + `supervisors` rows)
- [ ] Implement server-side password validation (min 8 chars, uppercase, digit, special character)
- [ ] Implement `GET /api/v1/auth/me` returning decoded role + user ID from JWT

### React Auth Flow
- [ ] Build `LoginPage` component calling `supabase.auth.signInWithPassword()`
- [ ] Store returned JWT in React context (not `localStorage`)
- [ ] Attach JWT to all Axios requests via an Axios request interceptor
- [ ] Implement route guards: redirect unauthenticated users to `/login`; redirect wrong-role users to their correct dashboard
- [ ] Build `SupervisorRegistrationPage` component calling `POST /api/v1/auth/register/supervisor`
- [ ] Display inline password requirement errors on the registration form

---

## Phase 3: Student-Facing Features

Implements all student user stories end-to-end: public application form, guidelines page with deadline calculation, and term report PDF upload.

*Refer to: Section 7.1 (Student Application), Section 7.3 (Student Guidelines), Section 7.4 (Student Report Submission), Section 6.2 (Student Endpoints), and Section 12 (File Handling & Storage) in `DESIGN_DOC.md`*

### Student Application (Public — No Auth Required)
- [ ] Implement `POST /api/v1/students/apply` in the `students` Blueprint with server-side validation (name, 9-digit student ID, email format)
- [ ] Return `422` with field-level errors on validation failure; return `409` on duplicate student ID or email
- [ ] Build `StudentApplicationPage` React component with fields for Full Name, Student ID, and Email
- [ ] Show inline field errors on validation failure
- [ ] Show a success confirmation message on `201` response

### Student Guidelines & Deadline Calculation
- [ ] Implement `calculate_deadline(end_date_str)` in `app/utils/deadline.py` using Python `datetime` + `timedelta(days=14)`
- [ ] Handle `None` input — return `None` (API responds with `"Date pending"`)
- [ ] Implement `GET /api/v1/students/me/guidelines` returning `workTermEndDate`, `reportDeadline`, and a signed URL for the template PDF from Supabase Storage
- [ ] Build `GuidelinesPage` React component displaying the deadline prominently
- [ ] Show a "Deadline Passed" warning badge if `reportDeadline` is in the past
- [ ] Show "Date Pending" if no end date is set
- [ ] Display a "Download Report Template" button using the signed URL

### Student Report Submission
- [ ] Implement `POST /api/v1/students/me/reports` in the `students` Blueprint
- [ ] Validate MIME type using `python-magic` (must be `application/pdf`)
- [ ] Validate file size (must be ≤ 2 MB)
- [ ] Upload valid file to Supabase Storage bucket `reports` with key `reports/{studentId}/{termId}/{uuid4()}.pdf`
- [ ] Insert record into `term_reports` with `storage_path`, `file_size_bytes`, and `submitted_at`
- [ ] Return `409` if student already has a report for the current term
- [ ] Implement `GET /api/v1/students/me/reports` returning a list of submitted reports
- [ ] Build `ReportSubmissionPage` React component with a PDF-only file picker and a "Submit" button
- [ ] Show upload progress indicator during submission
- [ ] Show success or error state after response
- [ ] Build `StudentDashboard` component showing current term, deadline, and report submission status

### Student Tests
- [ ] Write pytest tests for `calculate_deadline` covering: normal date, `None` input, leap year boundary (STU05, STU06, STU07)
- [ ] Write pytest tests for `POST /api/v1/students/apply` covering: success, missing field, duplicate email (STU01, STU02)
- [ ] Write pytest tests for `POST /api/v1/students/me/reports` covering: valid PDF, non-PDF file, oversized file (STU08, STU09)
- [ ] Write React component tests for `StudentApplicationPage` success and failure states
- [ ] Write React component tests for login success and failure (STU03, STU04)

---

## Phase 4: Coordinator and Supervisor Features

Implements all coordinator-facing dashboard, review, tracking, reminder, and exception-handling features, followed by all supervisor-facing evaluation submission features.

*Refer to: Sections 7.5 – 7.13 (Feature Specifications), Sections 6.3 – 6.4 (Coordinator and Supervisor Endpoints), and Section 13 (Email Notification System) in `DESIGN_DOC.md`*

### Coordinator — Dashboard & Analytics
- [ ] Implement `GET /api/v1/coordinator/dashboard` querying `applicants` grouped by `status`
- [ ] Return `"No data"` gracefully when no applicants exist
- [ ] Build `CoordinatorDashboard` React component with summary widgets (Total, Accepted, Rejected, Pending)
- [ ] Add a time-series activity chart (e.g., using Recharts or Chart.js) showing daily applications and status changes
- [ ] Show "No data" empty state on all widgets when the database is empty

### Coordinator — Initial & Final Review
- [ ] Implement `GET /api/v1/coordinator/applicants` with optional `status` filter and pagination (20 per page)
- [ ] Implement `PATCH /api/v1/coordinator/applicants/<id>/status` with valid transition enforcement (`pending → provisionally_accepted | rejected` and `provisionally_accepted → finally_accepted | finally_rejected`)
- [ ] On provisional acceptance: create `users` (via Supabase Auth) and `students` records; send welcome email
- [ ] Build `InitialReviewPage` React component with paginated table of pending applicants and "Provisionally Accept" / "Reject" action buttons
- [ ] Show empty state message when the pending queue is empty
- [ ] Build `FinalReviewPage` React component with list of provisionally accepted students and "Finally Accept" / "Finally Reject" buttons
- [ ] Show irreversible-action warning modal before confirming final status change
- [ ] Immediately remove student from queue in UI after action is taken

### Coordinator — Reporting & Tracking
- [ ] Implement `GET /api/v1/coordinator/students` with filter params: `missing_report`, `submitted_report`, `missing_evaluation`
- [ ] Build `ReportingTrackingPage` React component with filter dropdown and "Apply" button
- [ ] Update result table live on filter change without full page reload
- [ ] Display: Student Name, Student ID, Work Term, Deadline, Report Status, Evaluation Status per row

### Coordinator — Automated Reminders
- [ ] Configure Flask-Mail with SMTP credentials from environment variables
- [ ] Implement reminder eligibility check: `report_deadline < today` AND no `term_reports` record AND no `reminder_logs` entry within last 24 hours
- [ ] Implement `POST /api/v1/coordinator/reminders` sending emails to all eligible students via `send_reminder_email()` and inserting into `reminder_logs`
- [ ] Return a response listing: `emailsSent`, `recipients`, `skipped`, and `skippedReasons`
- [ ] Add a "Send Reminders" button to `CoordinatorDashboard` that opens a result summary modal

### Coordinator — Exception Handling
- [ ] Implement `POST /api/v1/coordinator/students/<id>/flags` inserting into `exception_flags` and updating `job_assignments.status`
- [ ] Implement `GET /api/v1/coordinator/students/<id>/flags` returning all flags for a student
- [ ] Build `StudentProfilePage` React component showing all job assignments with a "Flag Issue" button per assignment
- [ ] Build a flag modal with reason dropdown ("Fired/Terminated", "Rejected from Assignment", "Other") and a notes text area
- [ ] Show "Requires Meeting" badge on the student profile after a flag is saved

### Supervisor — Onboarding
- [ ] Confirm `POST /api/v1/auth/register/supervisor` (built in Phase 2) is fully wired to `SupervisorRegistrationPage`
- [ ] Build `SupervisorDashboard` React component listing assigned students awaiting evaluation

### Supervisor — PDF Upload & Digital Form
- [ ] Implement `POST /api/v1/supervisor/evaluations/<assignment_id>/upload` with MIME validation and upload to Supabase Storage bucket `evaluations`
- [ ] Implement `POST /api/v1/supervisor/evaluations/<assignment_id>/form` with validation that all four score fields are present and within 1–5
- [ ] Build `EvaluationPage` React component with two tabs: "Upload PDF" and "Digital Form"
- [ ] "Upload PDF" tab: file picker restricted to PDFs, upload progress bar, success/error state
- [ ] "Digital Form" tab: four scored sections (Behaviour, Skills, Knowledge, Attitude), each with a 1–5 rating and comment area, plus a global comments field
- [ ] On incomplete digital form submission, scroll to and highlight the first missing section

### Coordinator & Supervisor Tests
- [ ] Write pytest tests for dashboard metrics (COOR01, COOR02)
- [ ] Write pytest tests for applicant list and status transitions (COOR03, COOR04, COOR05, COOR06, COOR07)
- [ ] Write pytest tests for reporting filter logic (COOR08)
- [ ] Write pytest tests for reminder eligibility and double-send prevention (COOR09, COOR10)
- [ ] Write pytest tests for exception flag creation (COOR11)
- [ ] Write pytest tests for supervisor registration password validation (SUP01, SUP02)
- [ ] Write pytest tests for PDF upload MIME/size validation (SUP03, SUP04)
- [ ] Write pytest tests for digital form completeness validation (SUP05, SUP06)

---

## Phase 5: Integration, Hardening, and Deployment

Runs all test cases end-to-end, resolves edge cases, audits security and accessibility, and deploys the fully working system to production.

*Refer to: Section 10 (Test Plan), Section 11 (Security Design), Section 14 (Error Handling & Edge Cases), Section 15 (Accessibility & UX Considerations), and Section 16 (Open Questions & Future Work) in `DESIGN_DOC.md`*

### End-to-End Test Execution
- [ ] Run all 26 test cases (STU01–STU09, COOR01–COOR11, SUP01–SUP06) and record Actual Result and Status (Pass/Fail) in the test cases table in `DESIGN_DOC.md`
- [ ] Resolve all failing tests before proceeding
- [ ] Confirm the leap year deadline edge case (STU07) expected result is agreed upon by the team (see Open Question #3 in `DESIGN_DOC.md`)

### Error Handling & Edge Cases
- [ ] Confirm all error cases in Section 14 of `DESIGN_DOC.md` return the correct HTTP status and message
- [ ] Confirm the dashboard renders "No data" state without crashing on an empty database (COOR02)
- [ ] Confirm the guidelines page shows "Date pending" without crashing when `end_date` is NULL (STU06)
- [ ] Confirm duplicate report submission returns `409` (not a 500)
- [ ] Confirm all unhandled server exceptions return a generic `503` or `500` — no raw stack traces exposed to the client

### Security Audit
- [ ] Confirm no secrets (`SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `MAIL_PASSWORD`) are present in any committed file
- [ ] Confirm RLS policies prevent a student from accessing another student's data directly via Supabase
- [ ] Confirm the `@require_role` decorator correctly blocks wrong-role requests on every protected Flask route
- [ ] Confirm CORS is restricted to the production React app origin only
- [ ] Confirm all file uploads validate MIME type via `python-magic` (not file extension)
- [ ] Confirm all signed URLs for file downloads expire after 15 minutes

### Accessibility Audit
- [ ] Confirm all form fields have associated `<label>` elements
- [ ] Confirm all error messages are linked to their fields via `aria-describedby`
- [ ] Confirm status badges include text labels (colour is not the sole indicator)
- [ ] Confirm the "Finally Accept" and "Finally Reject" modals warn the user the action is irreversible
- [ ] Confirm the application is fully keyboard-navigable (tab through all interactive elements)

### Deployment
- [ ] Deploy the React app to Vercel; confirm the production URL loads correctly
- [ ] Deploy the Flask app to Render or Railway with Gunicorn; confirm `GET /api/v1/health` returns `200`
- [ ] Set all environment variables in both the Vercel and Render/Railway dashboards
- [ ] Confirm the React app successfully calls the deployed Flask API (no CORS errors in production)
- [ ] Confirm Supabase Storage signed URLs work correctly from the production environment
- [ ] Confirm reminder emails send successfully from the production SMTP configuration
- [ ] Add the production URLs to the project `README.md`

### Closeout
- [ ] Update `DESIGN_DOC.md` test cases table with final Actual Result, Status, and Date Executed for all 26 test cases
- [ ] Review and answer (or formally defer) all items in Section 16 (Open Questions) of `DESIGN_DOC.md` with the client
- [ ] Conduct a final team walkthrough of the deployed application covering all three user roles

---

*Progress file version: 1.0 — Sprint 1*
*Authors: Group 6 — Rayan Roshan, Zakariyya Islam, Aarom Tom, Jacob Mobin, Ethan Cha*