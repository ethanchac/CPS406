# Co-op Program Management System — Design Document
**Group 6 | Sprint 1**
Rayan Roshan · Zakariyya Islam · Aarom Tom · Jacob Mobin · Ethan Cha

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Goals & Non-Goals](#2-goals--non-goals)
3. [Stakeholders & User Roles](#3-stakeholders--user-roles)
4. [System Architecture](#4-system-architecture)
   - 4.1 [High-Level Architecture](#41-high-level-architecture)
   - 4.2 [Technology Stack](#42-technology-stack)
   - 4.3 [Component Diagram](#43-component-diagram)
   - 4.4 [Deployment Architecture](#44-deployment-architecture)
5. [Data Model](#5-data-model)
   - 5.1 [Entity-Relationship Overview](#51-entity-relationship-overview)
   - 5.2 [Table Definitions](#52-table-definitions)
6. [API Design](#6-api-design)
   - 6.1 [Authentication Endpoints](#61-authentication-endpoints)
   - 6.2 [Student Endpoints](#62-student-endpoints)
   - 6.3 [Coordinator Endpoints](#63-coordinator-endpoints)
   - 6.4 [Supervisor Endpoints](#64-supervisor-endpoints)
7. [Feature Specifications](#7-feature-specifications)
   - 7.1 [Student Application](#71-student-application)
   - 7.2 [Student Authentication](#72-student-authentication)
   - 7.3 [Student Guidelines & Deadline Calculation](#73-student-guidelines--deadline-calculation)
   - 7.4 [Student Report Submission](#74-student-report-submission)
   - 7.5 [Coordinator Dashboard & Analytics](#75-coordinator-dashboard--analytics)
   - 7.6 [Coordinator Initial Review](#76-coordinator-initial-review)
   - 7.7 [Coordinator Final Review](#77-coordinator-final-review)
   - 7.8 [Coordinator Reporting & Tracking](#78-coordinator-reporting--tracking)
   - 7.9 [Coordinator Automated Nags (Reminders)](#79-coordinator-automated-nags-reminders)
   - 7.10 [Coordinator Exception Handling](#710-coordinator-exception-handling)
   - 7.11 [Supervisor Onboarding](#711-supervisor-onboarding)
   - 7.12 [Supervisor PDF Upload](#712-supervisor-pdf-upload)
   - 7.13 [Supervisor Digital Evaluation Form](#713-supervisor-digital-evaluation-form)
8. [User Stories & Acceptance Criteria](#8-user-stories--acceptance-criteria)
9. [Product Backlog](#9-product-backlog)
10. [Test Plan](#10-test-plan)
    - 10.1 [Student Test Cases](#101-student-test-cases)
    - 10.2 [Coordinator Test Cases](#102-coordinator-test-cases)
    - 10.3 [Supervisor Test Cases](#103-supervisor-test-cases)
    - 10.4 [Test Cases Table](#104-test-cases-table)
11. [Security Design](#11-security-design)
12. [File Handling & Storage](#12-file-handling--storage)
13. [Email Notification System](#13-email-notification-system)
14. [Error Handling & Edge Cases](#14-error-handling--edge-cases)
15. [Accessibility & UX Considerations](#15-accessibility--ux-considerations)
16. [Open Questions & Future Work](#16-open-questions--future-work)

---

## 1. Project Overview

The **Co-op Program Management System** is a web-based platform designed to streamline the administration of a university co-op program. The system digitizes and automates the end-to-end lifecycle of a co-op placement: from student application and acceptance, through work-term tracking and report submission, to supervisor evaluations and coordinator oversight.

The primary pain points this system resolves are:

- Manual, email-based application and status tracking by coordinators.
- Students lacking a central place to view deadlines and submit reports.
- Supervisors having no easy digital path to submit evaluations.
- Coordinators spending significant time sending individual reminder emails.
- No structured process for flagging and tracking at-risk students (e.g., those terminated from placements).

---

## 2. Goals & Non-Goals

### Goals

- Provide a student-facing portal for application, authentication, deadline viewing, and report submission.
- Provide a coordinator-facing dashboard for applicant review, program tracking, and automated communications.
- Provide a supervisor-facing portal for secure account creation, and student evaluation submission (PDF or digital form).
- Automate reminder emails to students who miss report deadlines.
- Support exception tracking for students who are fired or rejected from job assignments.
- Be accessible, secure, and reliable.

### Non-Goals (Sprint 1 Scope)

- Integration with external university SIS (Student Information Systems) — deferred.
- Mobile native apps (iOS/Android) — web-responsive only.
- Payment or financial processing of any kind.
- Real-time chat or messaging between roles.
- Advanced analytics or predictive modelling.

---

## 3. Stakeholders & User Roles

| Role | Description | Primary Concerns |
|---|---|---|
| **Student** | Prospective or enrolled co-op student. | Applying, tracking deadlines, submitting reports. |
| **Coordinator** | University staff managing the co-op program. | Reviewing applicants, tracking progress, sending reminders. |
| **Supervisor** | External employer or work supervisor. | Submitting evaluations for their co-op student. |
| **System Admin** | Internal IT/dev team. | Maintaining the platform, managing user accounts, deployments. |

---

## 4. System Architecture

### 4.1 High-Level Architecture

The system follows a standard **three-tier web architecture**:

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                        │
│         Web Browser (Student / Coordinator /            │
│              Supervisor Portals — React SPA)            │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS (Axios / Fetch)
┌────────────────────────▼────────────────────────────────┐
│                    APPLICATION LAYER                    │
│               REST API Server (Python / Flask)          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │
│  │  Auth    │ │ Student  │ │Coordinator│ │ Supervisor│  │
│  │Blueprint │ │Blueprint │ │ Blueprint │ │ Blueprint │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────┘  │
│  ┌──────────────────┐  ┌────────────────────────────┐   │
│  │  Email Service   │  │  Supabase Storage Client   │   │
│  │  (Flask-Mail)    │  │  (supabase-py SDK)         │   │
│  └──────────────────┘  └────────────────────────────┘   │
└────────────────────────┬────────────────────────────────┘
                         │ supabase-py SDK
┌────────────────────────▼────────────────────────────────┐
│                    BACKEND-AS-A-SERVICE                 │
│                        (Supabase)                       │
│  ┌───────────────────┐  ┌──────────┐  ┌─────────────┐  │
│  │  PostgreSQL DB    │  │  Auth    │  │   Storage   │  │
│  │  (Row-Level Sec.) │  │ (JWT)    │  │  (PDF files)│  │
│  └───────────────────┘  └──────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend** | React.js (with React Router v6) | Component-based SPA, broad team familiarity, rich ecosystem |
| **Styling** | Tailwind CSS | Utility-first, consistent design tokens, rapid prototyping |
| **Frontend HTTP** | Axios | Promise-based HTTP client for calling the Flask REST API |
| **Backend** | Python 3.11 + Flask | Lightweight, easy to learn, excellent Supabase/PostgreSQL library support |
| **Flask Extensions** | Flask-CORS, Flask-Mail, python-dotenv | CORS handling, email dispatch, environment config |
| **Database** | Supabase (PostgreSQL) | Managed PostgreSQL with real-time subscriptions, Row-Level Security, built-in dashboard |
| **Database Client** | supabase-py (Supabase Python SDK) | Official SDK for querying Supabase tables from Flask |
| **Authentication** | Supabase Auth | Built-in JWT-based auth with email/password; eliminates manual bcrypt/JWT wiring |
| **File Storage** | Supabase Storage | S3-compatible bucket storage integrated with the same Supabase project |
| **Email** | Flask-Mail + SMTP (e.g., SendGrid / Gmail SMTP) | Transactional emails triggered from Flask route handlers |
| **Testing (Frontend)** | Jest + React Testing Library | Unit and component tests |
| **Testing (Backend)** | pytest + pytest-flask | Unit and integration tests for Flask routes |
| **Version Control** | Git + GitHub | Collaboration, PR-based workflow |
| **Deployment** | Vercel (React) + Render / Railway (Flask) | Vercel for static SPA; Render/Railway for Flask WSGI server |

### 4.3 Component Diagram

```
Frontend (React SPA)
│
├── /apply                  → StudentApplicationPage
├── /login                  → LoginPage
├── /student
│   ├── /dashboard          → StudentDashboard
│   ├── /guidelines         → GuidelinesPage (deadline + PDF download)
│   └── /submit             → ReportSubmissionPage
│
├── /coordinator
│   ├── /dashboard          → CoordinatorDashboard (analytics)
│   ├── /initial-review     → InitialReviewPage
│   ├── /final-review       → FinalReviewPage
│   ├── /tracking           → ReportingTrackingPage
│   └── /student/:id        → StudentProfilePage (exception handling)
│
└── /supervisor
    ├── /register           → SupervisorRegistrationPage
    ├── /login              → SupervisorLoginPage
    ├── /evaluate/:studentId → EvaluationPage
    │   ├── PDFUploadTab
    │   └── DigitalFormTab
    └── /dashboard          → SupervisorDashboard
```

### 4.4 Deployment Architecture

- **Development**: React dev server (`npm run dev`) on port 3000 + Flask dev server (`flask run`) on port 5000. The live Supabase project is used directly — no local emulator required; the free tier is sufficient for development.
- **Environment Variables (Flask)**: A `.env` file holds `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `MAIL_SERVER`, `MAIL_USERNAME`, `MAIL_PASSWORD`, and `FLASK_SECRET_KEY`. Never committed to version control.
- **Environment Variables (React)**: A `.env` file holds `REACT_APP_API_URL` (Flask base URL), `REACT_APP_SUPABASE_URL`, and `REACT_APP_SUPABASE_ANON_KEY`. These are safe to expose on the client.
- **Staging/Production**: React builds to a static bundle deployed to **Vercel**. Flask is deployed to **Render** or **Railway** as a Gunicorn WSGI process. Supabase remains the shared backend-as-a-service.
- **CI/CD**: GitHub Actions runs `pytest` (Flask backend) and `npm test` (React frontend) on every pull request before merge.

---

## 5. Data Model

All tables are created inside the Supabase project's PostgreSQL database. Supabase's **Row-Level Security (RLS)** policies are enabled on every table to enforce role-based data access at the database layer, acting as a second line of defence behind the Flask API. Migrations are managed as versioned SQL files run via the Supabase dashboard or CLI.

> **Note on ENUMs:** Supabase PostgreSQL supports native `ENUM` types but they are cumbersome to migrate. The preferred approach here is to use `TEXT` columns with a `CHECK` constraint, which is easier to extend without a migration lock.

### 5.1 Entity-Relationship Overview

```
User (base)
 ├── Student       (1:1 with User, 1:N with WorkTerms)
 ├── Coordinator   (1:1 with User)
 └── Supervisor    (1:1 with User, 1:N with Evaluations)

WorkTerm
 ├── belongs to Student
 ├── has one JobAssignment
 ├── has one TermReport
 └── has one Evaluation (submitted by Supervisor)

Applicant
 └── becomes Student upon provisional acceptance

JobAssignment
 ├── belongs to WorkTerm
 └── has one ExceptionFlag (optional)

ReminderLog
 └── belongs to Student (tracks when reminders were sent)
```

### 5.2 Table Definitions

#### `auth.users` (Managed by Supabase Auth)

Supabase Auth automatically manages a `users` table in the `auth` schema. The application does **not** create or manage this table directly. Supabase Auth handles password hashing, JWT issuance, and session management.

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Auto-generated user ID (referenced by all app tables) |
| `email` | TEXT | User's login email (unique) |
| `encrypted_password` | TEXT | bcrypt hash — managed by Supabase |
| `created_at` | TIMESTAMPTZ | Account creation time |

**User metadata** (role, display name) is stored in the `user_profiles` table below and linked via `auth.users.id`.

#### `user_profiles`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK, FK → auth.users.id | Mirrors Supabase Auth user ID |
| `role` | TEXT | CHECK IN ('student','coordinator','supervisor'), NOT NULL | User role — used for RBAC |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Profile creation time |

#### `applicants`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Unique applicant ID |
| `full_name` | TEXT | NOT NULL | Applicant's full name |
| `student_id` | CHAR(9) | UNIQUE, NOT NULL | 9-digit university student ID |
| `email` | TEXT | UNIQUE, NOT NULL | School email address |
| `status` | TEXT | CHECK IN ('pending','provisionally_accepted','finally_accepted','rejected','finally_rejected'), DEFAULT 'pending' | Current application status |
| `applied_at` | TIMESTAMPTZ | DEFAULT NOW() | Time of application submission |
| `reviewed_at` | TIMESTAMPTZ | NULLABLE | Time of last status change |
| `reviewed_by` | UUID | FK → auth.users.id, NULLABLE | Coordinator who made the last decision |

#### `students`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK, FK → auth.users.id | Matches Supabase Auth user ID |
| `applicant_id` | UUID | FK → applicants.id | Linked application record |
| `full_name` | TEXT | NOT NULL | Student's full name |
| `student_number` | CHAR(9) | UNIQUE, NOT NULL | 9-digit university ID |
| `program` | TEXT | NULLABLE | Academic program |

#### `work_terms`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Unique work term ID |
| `student_id` | UUID | FK → students.id, NOT NULL | Owning student |
| `term_label` | TEXT | NOT NULL | e.g. "Fall 2025" |
| `start_date` | DATE | NOT NULL | Work term start date |
| `end_date` | DATE | NULLABLE | Work term end date (NULL = ongoing) |
| `report_deadline` | DATE | NULLABLE | Calculated by Flask as end_date + 14 days; stored on write |
| `status` | TEXT | CHECK IN ('active','completed','flagged'), DEFAULT 'active' | Term status |

#### `term_reports`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Unique report ID |
| `work_term_id` | UUID | FK → work_terms.id, UNIQUE | One report per term |
| `student_id` | UUID | FK → students.id | Submitting student |
| `storage_path` | TEXT | NOT NULL | Supabase Storage object path (bucket + key) |
| `file_size_bytes` | INTEGER | NOT NULL | Size of uploaded file |
| `submitted_at` | TIMESTAMPTZ | DEFAULT NOW() | Upload timestamp |

#### `job_assignments`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Unique assignment ID |
| `work_term_id` | UUID | FK → work_terms.id, UNIQUE | Associated work term |
| `company_name` | TEXT | NOT NULL | Employer company name |
| `supervisor_id` | UUID | FK → auth.users.id, NULLABLE | Assigned supervisor |
| `status` | TEXT | CHECK IN ('active','completed','fired','rejected'), DEFAULT 'active' | Assignment status |

#### `exception_flags`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Unique flag ID |
| `job_assignment_id` | UUID | FK → job_assignments.id, UNIQUE | Related assignment |
| `flagged_by` | UUID | FK → auth.users.id | Coordinator who flagged |
| `reason` | TEXT | CHECK IN ('fired_terminated','rejected','other'), NOT NULL | Flag reason |
| `notes` | TEXT | NULLABLE | Free-text coordinator notes |
| `requires_meeting` | BOOLEAN | DEFAULT TRUE | Whether student needs intervention meeting |
| `flagged_at` | TIMESTAMPTZ | DEFAULT NOW() | Time flag was created |

#### `supervisors`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK, FK → auth.users.id | Matches Supabase Auth user ID |
| `full_name` | TEXT | NOT NULL | Supervisor's name |
| `company_name` | TEXT | NOT NULL | Employer organization |
| `work_email` | TEXT | UNIQUE, NOT NULL | Work email address |

#### `evaluations`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Unique evaluation ID |
| `job_assignment_id` | UUID | FK → job_assignments.id, UNIQUE | One evaluation per assignment |
| `supervisor_id` | UUID | FK → supervisors.id | Submitting supervisor |
| `submission_type` | TEXT | CHECK IN ('pdf_upload','digital_form'), NOT NULL | How evaluation was submitted |
| `storage_path` | TEXT | NULLABLE | Supabase Storage path (if PDF upload) |
| `behaviour_score` | INTEGER | CHECK BETWEEN 1 AND 5, NULLABLE | Digital form score |
| `skills_score` | INTEGER | CHECK BETWEEN 1 AND 5, NULLABLE | Digital form score |
| `knowledge_score` | INTEGER | CHECK BETWEEN 1 AND 5, NULLABLE | Digital form score |
| `attitude_score` | INTEGER | CHECK BETWEEN 1 AND 5, NULLABLE | Digital form score |
| `comments` | TEXT | NULLABLE | Free-text supervisor comments |
| `submitted_at` | TIMESTAMPTZ | DEFAULT NOW() | Submission timestamp |

#### `reminder_logs`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Unique log entry |
| `student_id` | UUID | FK → students.id | Student who was reminded |
| `work_term_id` | UUID | FK → work_terms.id | Work term in question |
| `sent_at` | TIMESTAMPTZ | DEFAULT NOW() | When the reminder was sent |
| `sent_by` | UUID | FK → auth.users.id | Coordinator who triggered the send |

---

## 6. API Design

All endpoints are served by the Flask application using **Blueprints** to group routes by domain. The base URL prefix is `/api/v1`. All requests and responses use `application/json` unless dealing with file uploads (`multipart/form-data`). All protected routes require a valid Supabase JWT in the `Authorization: Bearer <token>` header. Flask validates the token by verifying it against the Supabase JWT secret using the `PyJWT` library.

**Flask Blueprint structure:**
```
app/
├── __init__.py         # create_app() factory, register blueprints
├── blueprints/
│   ├── auth.py         # /api/v1/auth/*
│   ├── students.py     # /api/v1/students/*
│   ├── coordinator.py  # /api/v1/coordinator/*
│   └── supervisor.py   # /api/v1/supervisor/*
├── services/
│   ├── supabase.py     # Supabase client singleton
│   ├── email.py        # Flask-Mail helpers
│   └── storage.py      # Supabase Storage helpers
└── utils/
    ├── auth.py         # JWT decode + role check decorators
    └── deadline.py     # Deadline calculation logic
```

### 6.1 Authentication Endpoints

Authentication is handled in two layers:
- **Supabase Auth** manages credentials, password hashing, and JWT issuance. The React frontend calls Supabase Auth directly for login/registration (using the `@supabase/supabase-js` client).
- **Flask** receives the Supabase JWT on every protected API call and validates it using `PyJWT` + the Supabase JWT secret.

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/register/supervisor` | No | Create supervisor profile in Supabase Auth + `supervisors` table |
| `POST` | `/api/v1/auth/me` | Yes | Return the decoded role + profile for the current JWT |

> Student and coordinator login is handled entirely client-side via `supabase.auth.signInWithPassword()` from the React frontend. No Flask login endpoint is needed — Supabase returns the JWT directly to the browser.

**React login flow (client-side, no Flask call):**
```javascript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'aaron.tom@torontomu.ca',
  password: 'AaronIsPrettyCool!5'
});
// data.session.access_token is the JWT — stored in memory and sent
// as Authorization: Bearer <token> on every Axios call to Flask.
```

**POST `/api/v1/auth/register/supervisor` — Request Body:**
```json
{
  "fullName": "Jane Doe",
  "companyName": "Cha Industries",
  "workEmail": "jane.doe@chaindustries.com",
  "password": "Secur3P@ssword!"
}
```

**Flask internally calls:**
1. `supabase.auth.admin.create_user(email, password)` to create the Supabase Auth user.
2. Inserts a row into `user_profiles` with `role = 'supervisor'`.
3. Inserts a row into `supervisors` with name, company, and email.

**Success Response (201):**
```json
{ "message": "Supervisor account created. Please log in." }
```

**Failure — Weak Password (422):**
```json
{
  "errors": [
    { "field": "password", "message": "Password must be at least 8 characters with one uppercase letter, one digit, and one special character." }
  ]
}
```

### 6.2 Student Endpoints

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `POST` | `/api/v1/students/apply` | No | Submit a new application |
| `GET` | `/api/v1/students/me` | Student JWT | Get authenticated student's profile |
| `GET` | `/api/v1/students/me/workterms` | Student JWT | Get all work terms for the student |
| `GET` | `/api/v1/students/me/guidelines` | Student JWT | Get report deadline and PDF template download URL |
| `POST` | `/api/v1/students/me/reports` | Student JWT | Upload a term report PDF |
| `GET` | `/api/v1/students/me/reports` | Student JWT | List all submitted reports |

**Flask route example (students Blueprint):**
```python
@students_bp.route('/me/guidelines', methods=['GET'])
@require_role('student')
def get_guidelines():
    user_id = g.user_id  # decoded from JWT by decorator
    term = supabase.table('work_terms') \
        .select('*').eq('student_id', user_id) \
        .eq('status', 'active').single().execute()
    end_date = term.data.get('end_date')
    deadline = calculate_deadline(end_date)  # returns date or "Date pending"
    return jsonify({
        'workTermEndDate': end_date,
        'reportDeadline': str(deadline) if deadline else 'Date pending',
        'templateDownloadUrl': get_signed_url('templates/term-report-template.pdf')
    })
```

**POST `/api/v1/students/apply` — Request Body:**
```json
{
  "fullName": "Aaron Tom",
  "studentId": "501297029",
  "email": "aaron.tom@torontomu.ca"
}
```

**Success Response (201):**
```json
{
  "message": "Application submitted successfully.",
  "applicantId": "uuid-here"
}
```

**Validation Failure (422):**
```json
{
  "errors": [
    { "field": "email", "message": "Email is required." }
  ]
}
```

**GET `/api/v1/students/me/guidelines` — Success Response (200):**
```json
{
  "workTermEndDate": "2026-04-15",
  "reportDeadline": "2026-04-29",
  "templateDownloadUrl": "https://<supabase-project>.supabase.co/storage/v1/object/sign/templates/term-report-template.pdf?token=..."
}
```

**POST `/api/v1/students/me/reports` — Request:** `multipart/form-data` with a `file` field (PDF, max 2 MB).

**Success Response (201):**
```json
{
  "message": "Report submitted successfully.",
  "reportId": "uuid-here",
  "submittedAt": "2026-04-10T14:22:00Z"
}
```

**Failure Response (422):**
```json
{
  "error": "Invalid format. Only PDF files are accepted and must be under 2 MB."
}
```

---

### 6.3 Coordinator Endpoints

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `GET` | `/api/v1/coordinator/dashboard` | Coordinator JWT | Get summary metrics for the dashboard |
| `GET` | `/api/v1/coordinator/applicants` | Coordinator JWT | List applicants with optional status filter + pagination |
| `PATCH` | `/api/v1/coordinator/applicants/<id>/status` | Coordinator JWT | Update an applicant's status |
| `GET` | `/api/v1/coordinator/students` | Coordinator JWT | List all students with optional filter params |
| `GET` | `/api/v1/coordinator/students/<id>` | Coordinator JWT | Get a full profile for one student |
| `POST` | `/api/v1/coordinator/reminders` | Coordinator JWT | Trigger reminder emails to overdue students |
| `POST` | `/api/v1/coordinator/students/<id>/flags` | Coordinator JWT | Flag a student's job assignment |
| `GET` | `/api/v1/coordinator/students/<id>/flags` | Coordinator JWT | Get all flags for a student |

**Flask route example (coordinator Blueprint):**
```python
@coordinator_bp.route('/applicants/<applicant_id>/status', methods=['PATCH'])
@require_role('coordinator')
def update_applicant_status(applicant_id):
    new_status = request.json.get('status')
    valid_transitions = {
        'pending': ['provisionally_accepted', 'rejected'],
        'provisionally_accepted': ['finally_accepted', 'finally_rejected']
    }
    current = supabase.table('applicants').select('status') \
        .eq('id', applicant_id).single().execute()
    if new_status not in valid_transitions.get(current.data['status'], []):
        return jsonify({'error': 'Invalid status transition.'}), 400
    supabase.table('applicants').update({
        'status': new_status,
        'reviewed_by': g.user_id,
        'reviewed_at': datetime.utcnow().isoformat()
    }).eq('id', applicant_id).execute()
    return jsonify({'message': 'Status updated.'}), 200
```

**GET `/api/v1/coordinator/dashboard` — Success Response (200):**
```json
{
  "totalApplicants": 30,
  "accepted": 10,
  "rejected": 15,
  "pending": 5,
  "recentActivity": [
    { "date": "2026-03-01", "newApplications": 3, "statusChanges": 2 }
  ]
}
```

**POST `/api/v1/coordinator/reminders` — Success Response (200):**
```json
{
  "emailsSent": 1,
  "recipients": ["student.c@torontomu.ca"],
  "skipped": ["student.a@torontomu.ca", "student.b@torontomu.ca"],
  "skippedReasons": {
    "student.a@torontomu.ca": "Report already submitted.",
    "student.b@torontomu.ca": "Deadline not yet passed."
  }
}
```

**POST `/api/v1/coordinator/students/<id>/flags` — Request Body:**
```json
{
  "jobAssignmentId": "uuid-here",
  "reason": "fired_terminated",
  "notes": "Attendance issues."
}
```

---

### 6.4 Supervisor Endpoints

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `GET` | `/api/v1/supervisor/students` | Supervisor JWT | List students assigned to this supervisor |
| `POST` | `/api/v1/supervisor/evaluations/<assignment_id>/upload` | Supervisor JWT | Upload a PDF evaluation to Supabase Storage |
| `POST` | `/api/v1/supervisor/evaluations/<assignment_id>/form` | Supervisor JWT | Submit a digital evaluation form |
| `GET` | `/api/v1/supervisor/evaluations` | Supervisor JWT | View submitted evaluations |

**Flask file upload example (supervisor Blueprint):**
```python
@supervisor_bp.route('/evaluations/<assignment_id>/upload', methods=['POST'])
@require_role('supervisor')
def upload_evaluation_pdf(assignment_id):
    file = request.files.get('file')
    if not file or file.mimetype != 'application/pdf':
        return jsonify({'error': 'Only PDF files are accepted.'}), 422
    path = f"evaluations/{g.user_id}/{assignment_id}/{uuid4()}.pdf"
    supabase.storage.from_('evaluations').upload(path, file.read(),
        file_options={'content-type': 'application/pdf'})
    supabase.table('evaluations').insert({
        'job_assignment_id': assignment_id,
        'supervisor_id': g.user_id,
        'submission_type': 'pdf_upload',
        'storage_path': path
    }).execute()
    return jsonify({'message': 'Evaluation uploaded successfully.'}), 201
```

**POST `/api/v1/supervisor/evaluations/<assignment_id>/form` — Request Body:**
```json
{
  "behaviourScore": 4,
  "skillsScore": 5,
  "knowledgeScore": 4,
  "attitudeScore": 3,
  "comments": "Strong technical skills and eager to learn."
}
```

All four score fields are required (integer, 1–5). Missing any field returns a 422 with a field-level error indicating which section was incomplete.

---

## 7. Feature Specifications

### 7.1 Student Application

**Purpose:** Allow prospective students to submit their information to be considered for the co-op program before they have login credentials.

**UI:** A single public-facing web form (accessible without authentication) containing three fields: Full Name, 9-digit Student ID, and School Email. A single "Apply" button submits the form.

**Validation Rules:**
- Full Name: required, non-empty string.
- Student ID: required, exactly 9 numeric digits.
- Email: required, valid email format, must end with the institution's domain (e.g., `@torontomu.ca`).

**Business Logic:**
1. On submission, the server validates all fields.
2. If validation passes, a new `applicants` record is created with status `pending`.
3. A success confirmation message is displayed to the user.
4. If validation fails, the form highlights missing/invalid fields inline. No record is created.
5. Duplicate student ID or email submissions return a 409 Conflict with an appropriate message.

**Effort:** 4 hours | **Priority:** High

---

### 7.2 Student Authentication

**Purpose:** Allow accepted students to securely log into the system and access their personalized dashboard.

**UI:** A login page with Email and Password fields and a "Log In" button. Uses the Supabase JS client directly in React — no custom login endpoint on the Flask server is needed.

**Business Logic:**
1. React calls `supabase.auth.signInWithPassword({ email, password })`.
2. Supabase Auth validates credentials and returns a session containing a JWT (`session.access_token`).
3. The React app stores the JWT in memory (React context/state) — not in `localStorage` to avoid XSS exposure.
4. The JWT is attached to every Axios request to Flask: `Authorization: Bearer <token>`.
5. On mismatch, Supabase Auth returns an error. React displays: "Email or password is incorrect." (No field enumeration.)
6. Supabase Auth has built-in rate limiting and account lockout for repeated failed attempts.

**Effort:** 5 hours | **Priority:** High

---

### 7.3 Student Guidelines & Deadline Calculation

**Purpose:** Show a student their report deadline for the current work term and provide a downloadable PDF report template.

**Deadline Calculation Logic (Python — `utils/deadline.py`):**

```python
from datetime import date, timedelta

def calculate_deadline(end_date_str: str | None) -> date | None:
    if not end_date_str:
        return None  # Caller returns "Date pending"
    end_date = date.fromisoformat(end_date_str)
    return end_date + timedelta(days=14)
```

Python's `datetime.date` + `timedelta` correctly handles all month boundaries and leap years natively — no third-party date library required.

**PDF Template:** A static PDF is stored in the file system/S3. A signed or public URL is returned for download. The template is not user-specific.

**Effort:** 3 hours | **Priority:** Medium

---

### 7.4 Student Report Submission

**Purpose:** Allow a student to upload their completed co-op term report as a PDF file.

**UI:** A file picker restricted to `.pdf` files and a "Submit" button. Displays upload progress. Shows success or error state after submission.

**Validation Rules:**
- File must be a PDF (validated by MIME type `application/pdf` server-side, not just file extension).
- File size must not exceed 2 MB.
- Student must not have already submitted a report for the current term (duplicate check).

**Business Logic:**
1. React sends a `multipart/form-data` POST request to Flask `/api/v1/students/me/reports`.
2. Flask validates MIME type (`python-magic`) and file size.
3. If valid, the file bytes are uploaded to Supabase Storage (bucket: `reports`, key: `reports/{studentId}/{termId}/{uuid4()}.pdf`).
4. A `term_reports` record is inserted via `supabase-py` with the `storage_path` and `submitted_at` timestamp.
5. On success, a confirmation is shown and the report status updates in the student's React dashboard.
6. On failure, a specific error message is shown: "Invalid format. Only PDF files are accepted and must be under 2 MB."

**Effort:** 6 hours | **Priority:** High

---

### 7.5 Coordinator Dashboard & Analytics

**Purpose:** Give coordinators a real-time overview of the co-op program's status through summary widgets and activity graphs.

**UI Components:**
- **Summary widgets:** Total Applicants, Accepted, Rejected, Pending — each a card with a large number.
- **Activity graph:** A time-series bar or line chart showing new applications and status changes per day over the last 30 days.
- **Sorting:** Table of recent activity sortable by date, student name, or status.

**Business Logic:**
- Stats are computed by querying `applicants` grouped by `status`.
- If the database contains no data, all widgets display "No data" and charts display an empty state (no crash).
- Queries are optimized with indexed columns (`status`, `applied_at`).

**Effort:** 8 hours | **Priority:** Low

---

### 7.6 Coordinator Initial Review

**Purpose:** Allow coordinators to view all pending applicants and make a provisional acceptance or rejection decision.

**UI:** A paginated table showing applicants with `status = 'pending'`. Each row shows: Full Name, Student ID, Email, Applied Date, and action buttons ("Provisionally Accept" / "Reject").

**Pagination:** 20 records per page. Page controls at the bottom. Handles 50+ records without browser crashes.

**Business Logic:**
1. The coordinator selects an action for an applicant.
2. The `applicants.status` is updated to `provisionally_accepted` or `rejected`.
3. `reviewed_by` and `reviewed_at` are also updated.
4. If a coordinator accepts a student, a `users` record and `students` record are automatically created, and credentials are emailed to the student.
5. If the queue is empty (no `pending` applicants), the page displays a friendly empty state message. No table is rendered.

**Effort:** 5 hours | **Priority:** High

---

### 7.7 Coordinator Final Review

**Purpose:** Allow coordinators to finalize the status of provisionally accepted students, moving them to the official roster or removing them.

**UI:** A paginated table of students with `status = 'provisionally_accepted'`. Each row has "Finally Accept" and "Finally Reject" buttons.

**Business Logic:**
1. Clicking "Finally Accept" updates `applicants.status` to `finally_accepted` and moves the student to the **Official Roster List**.
2. Clicking "Finally Reject" updates status to `finally_rejected`. The student is removed from the final review queue and does not appear on the roster.
3. Both actions are **permanent** — there is no "undo" in Sprint 1.
4. UI immediately removes the student from the "needs final review" queue after action is taken.

**Effort:** 4 hours | **Priority:** High

---

### 7.8 Coordinator Reporting & Tracking

**Purpose:** Let coordinators generate filtered views of student progress to identify who is behind.

**UI:** A filter panel with dropdown options:
- "Missing Student Report" — students whose `report_deadline` has passed and who have no `term_reports` record.
- "Submitted Student Report" — students who have a `term_reports` record for the current term.
- "Missing Employer Evaluation" — students whose term has a `job_assignments` record but no linked `evaluations` record.

**Business Logic:**
- Filters apply to the `students` join query and update the result table live on "Apply."
- Multiple filters can be combined (AND logic).
- Results show: Student Name, Student ID, Work Term, Deadline, Report Status, Evaluation Status.

**Effort:** 6 hours | **Priority:** Medium

---

### 7.9 Coordinator Automated Nags (Reminders)

**Purpose:** Enable coordinators to send bulk reminder emails to all students who have missed their report deadline, with deduplication to prevent double-sending.

**UI:** A single "Send Reminders" button on the coordinator dashboard. After clicking, a modal summarizes who was emailed and who was skipped (with reasons).

**Business Logic — Eligibility Criteria for Reminder:**
A student receives an email **only if ALL of the following are true:**
1. `work_terms.report_deadline` < today (deadline has passed).
2. No `term_reports` record exists for that work term (report not submitted).
3. No `reminder_logs` entry exists for that student + work term with `sent_at` within the last 24 hours (anti-double-send).

**Deduplication:**
- On first click: eligible student receives email; a `reminder_logs` entry is created with the current timestamp.
- On second click (within 24 hours): the `reminder_logs` check prevents a duplicate email from being sent.

**Email Content:**
- Subject: "Action Required: Co-op Term Report Overdue"
- Body: Student name, work term, deadline, and a link to the submission page.

**Effort:** 3 hours | **Priority:** Low

---

### 7.10 Coordinator Exception Handling

**Purpose:** Allow coordinators to flag a student whose job assignment was terminated or rejected, enabling intervention tracking.

**UI:** On a student's profile page, each `job_assignments` entry has a "Flag Issue" button. Clicking opens a modal with:
- Reason dropdown: "Fired/Terminated", "Rejected from Assignment", "Other."
- Notes text area.
- "Submit" button.

**Business Logic:**
1. An `exception_flags` record is created, linked to the `job_assignments` entry.
2. `job_assignments.status` is updated to `fired` or `rejected`.
3. The student's profile page shows a visual "Requires Meeting" badge.
4. The flag and notes are permanently saved in the database for audit purposes.

**Effort:** 3 hours | **Priority:** Low

---

### 7.11 Supervisor Onboarding

**Purpose:** Allow work supervisors to self-register and log into the system to submit student evaluations.

**UI:** Registration page with: Full Name, Company Name, Work Email, Password, Confirm Password fields. Password field includes inline hint showing requirements.

**Password Requirements:**
- Minimum 8 characters.
- At least one uppercase letter.
- At least one digit (0–9).
- At least one special character (`!@#$%^&*`).

**Business Logic:**
1. On submission, all fields are validated server-side.
2. If password does not meet requirements, submission is blocked. UI highlights the password field and lists the unmet requirements.
3. If email already exists, a 409 Conflict is returned.
4. On success, a `users` record (role: `supervisor`) and a `supervisors` record are created.
5. The user is redirected to the login page with a success banner.

**Effort:** 5 hours | **Priority:** High

---

### 7.12 Supervisor PDF Upload

**Purpose:** Allow supervisors to upload a scanned paper evaluation as a PDF file.

**UI:** On the evaluation page for an assigned student, a "Upload PDF Evaluation" tab. Contains a file picker and "Submit" button.

**Validation Rules:**
- File must be a PDF (server-side MIME type check: `application/pdf`).
- No hard file size cap is specified for supervisors (to accommodate "heavily unoptimized" scanned PDFs), but a reasonable server-level max of 20 MB is applied to prevent abuse. The system must not time out on large valid files.

**Business Logic:**
1. File is streamed to S3 (key: `evaluations/supervisor/{supervisorId}/{assignmentId}/{timestamp}.pdf`).
2. An `evaluations` record is created with `submission_type = 'pdf_upload'` and the file path.
3. `job_assignments` status may optionally update to reflect evaluation received.
4. Non-PDF uploads return: "Invalid file type. Only PDF files are accepted."

**Effort:** 4 hours | **Priority:** Medium

---

### 7.13 Supervisor Digital Evaluation Form

**Purpose:** Allow supervisors to complete and submit a structured online evaluation form instead of uploading a PDF.

**UI:** On the evaluation page, a "Digital Form" tab with four scored sections:
- **Behaviour:** Rating scale (1–5) + comment area.
- **Skills:** Rating scale (1–5) + comment area.
- **Knowledge:** Rating scale (1–5) + comment area.
- **Attitude:** Rating scale (1–5) + comment area.
- A global "Comments" text area at the bottom.
- "Submit Evaluation" button.

**Validation Rules:**
- All four sections must be completed before submission.
- Missing any section: submission is blocked, page scrolls to the first incomplete section, and that section is highlighted with a red border and an error message.

**Business Logic:**
1. On submit, server validates all four score fields are present and within range 1–5.
2. An `evaluations` record is created with `submission_type = 'digital_form'` and individual score fields populated.
3. A "Submission complete" confirmation page is shown.

**Effort:** 6 hours | **Priority:** Medium

---

## 8. User Stories & Acceptance Criteria

### Student

**US-STU-01: Application**
> As a prospective co-op student, I want to apply to the program via a simple web form (submitting my Name, Student ID, and Email) so that I can be considered for provisional acceptance.

*Acceptance Criteria:*
- Form has fields for Full Name, 9-digit Student ID, and school email.
- On valid submission, a success message is shown and a record is created in the database.
- On invalid submission (missing field, wrong format), the form highlights the problematic field(s) and shows an error. No record is created.

**US-STU-02: Authentication**
> As an accepted student, I want to log in with secure credentials to manage my work-term requirements.

*Acceptance Criteria:*
- Correct credentials redirect to the student dashboard.
- Incorrect credentials show a generic error: "Email or password is incorrect."
- Passwords are stored as bcrypt hashes. Plaintext passwords are never stored.

**US-STU-03: Guidelines**
> As a student finishing a term, I want to clearly see my report deadline based on my work dates and download a PDF template so that I know exactly what is expected of me.

*Acceptance Criteria:*
- Deadline displayed is `work_term_end_date + 14 calendar days`.
- If end date is NULL, deadline shows "Date pending" — no crash.
- Leap year boundaries are handled correctly.
- A PDF template download link is available on the page.

**US-STU-04: Submission**
> As a student completing a term, I want to upload my completed term report as a PDF to fulfill my program requirements.

*Acceptance Criteria:*
- Only PDF files up to 2 MB are accepted.
- Non-PDF or oversized files show an error message.
- On success, the database records the file path and upload timestamp.

---

### Coordinator

**US-COOR-01: Dashboard & Analytics** — Low priority
> As a coordinator, I want to view a dashboard with recent activity graphs and sorting options to quickly assess the overall health and status of the co-op program.

**US-COOR-02: Initial Review** — High priority
> As a coordinator, I want to view a list of applicants and mark them as "Provisionally Accepted" or "Rejected."

**US-COOR-03: Final Review** — High priority
> As a coordinator, I want to update a provisionally accepted student's status to "Finally Accepted" or "Finally Rejected."

**US-COOR-04: Reporting & Tracking** — Medium priority
> As a coordinator, I want to generate filtered lists of students to identify who is falling behind.

**US-COOR-05: Automated Nags** — Low priority
> As a coordinator, I want a "Send Reminders" button that automatically emails students who have missed their report deadlines.

**US-COOR-06: Exception Handling** — Low priority
> As a coordinator, I want to flag a student's profile when they are fired or rejected from a specific job assignment.

---

### Supervisor

**US-SUP-01: Onboarding** — High priority
> As a work supervisor, I want to easily create an account and log in securely to submit an evaluation for my co-op student.

**US-SUP-02: Upload Option** — Medium priority
> As a supervisor, I want the option to upload a scanned PDF of a paper evaluation.

**US-SUP-03: Digital Form Option** — Medium priority
> As a supervisor, I want a built-in digital form to assess the student's behaviour, skills, knowledge, and attitude.

---

## 9. Product Backlog

| ID | User Story | Description | Priority | Effort (hrs) | Status |
|---|---|---|---|---|---|
| STU-01 | Student Application | Apply via web form with name, student ID, email | High | 4 | In-Progress |
| STU-02 | Student Authentication | Log in with secure credentials | High | 5 | In-Progress |
| STU-03 | Student Guidelines | View report deadline + download PDF template | Medium | 3 | In-Progress |
| STU-04 | Student Submission | Upload term report as PDF | High | 6 | In-Progress |
| COOR-01 | Coordinator Dashboard | View dashboard with graphs and sorting | Low | 8 | To-Do |
| COOR-02 | Coordinator Initial Review | View and act on applicant list (provisional decisions) | High | 5 | To-Do |
| COOR-03 | Coordinator Final Review | Finalize accepted/rejected students | High | 4 | To-Do |
| COOR-04 | Coordinator Reporting & Tracking | Filter student lists by report status | Medium | 6 | To-Do |
| COOR-05 | Coordinator Automated Nags | Send reminder emails automatically | Low | 3 | To-Do |
| COOR-06 | Coordinator Exception Handling | Flag students fired/rejected from assignments | Low | 3 | To-Do |
| SUP-01 | Supervisor Onboarding | Create account and log in securely | High | 5 | To-Do |
| SUP-02 | Supervisor Upload Option | Upload scanned PDF evaluation | Medium | 4 | To-Do |
| SUP-03 | Supervisor Digital Form | Fill in and submit online evaluation form | Medium | 6 | To-Do |

**Total Estimated Effort: 62 hours**

---

## 10. Test Plan

All test cases are currently in **Planned / Not Yet Run** state. They are written as black-box functional tests from the end-user's perspective. The actual result and execution date columns will be populated as tests are run in subsequent sprints.

### 10.1 Student Test Cases

#### STU01 — Application Web Form (Success)
- **Precondition:** Application form is accessible at `/apply`.
- **Steps:** Enter Full Name: `Aaron Tom`, Student ID: `501297029`, Email: `aaron.tom@torontomu.ca`. Click "Apply."
- **Expected:** Success confirmation is displayed. An `applicants` record is created in the database with status `pending`.

#### STU02 — Application Web Form (Failure — Missing Field)
- **Precondition:** Application form is accessible.
- **Steps:** Enter Full Name and Student ID. Leave email blank. Click "Apply."
- **Expected:** Failure message displayed. Email field is highlighted. No database record is created.

#### STU03 — Student Login (Success)
- **Precondition:** Test account exists: email `aaron.tom@torontomu.ca`, password `AaronIsPrettyCool!5`.
- **Steps:** Open login page. Enter credentials. Click "Log In."
- **Expected:** Page redirects to the student dashboard.

#### STU04 — Student Login (Failure — Wrong Password)
- **Precondition:** Same test account.
- **Steps:** Enter email `aaron.tom@torontomu.ca`, password `AaronIsCool!5`. Click "Log In."
- **Expected:** Error message: "Email or password is incorrect." No redirect.

#### STU05 — Deadline Calculation (Success)
- **Precondition:** Student profile exists with work term end date `2026-04-15`.
- **Steps:** Call deadline calculation function.
- **Expected:** Returns `2026-04-29` (14 days after Apr 15).

#### STU06 — Deadline Calculation (Failure — NULL End Date)
- **Precondition:** Student profile exists with `work_term_end_date = NULL`.
- **Steps:** Call deadline calculation function.
- **Expected:** Returns `"Date pending"`. No system crash or unhandled exception.

#### STU07 — Deadline Calculation (Leap Year Edge Case)
- **Precondition:** Student profile exists with work term end date `2026-02-28`.
- **Steps:** Call deadline calculation function.
- **Expected:** Returns `2026-03-14` (14 days later; 2026 is not a leap year so Feb has 28 days; 14 days from Feb 28 = March 14).

> **Note on original document:** The original document states the leap year test expects `March 13`. The correct calculation of `Feb 28 + 14 days` in a non-leap year (2026) is `March 14`. If the intent was to test an actual leap year (Feb 29 exists), the work term end date should be in a leap year (e.g., 2028-02-29), giving a deadline of 2028-03-14. This discrepancy should be clarified with the team before the test is run.

#### STU08 — PDF Upload (Success)
- **Precondition:** Logged in as `aaron.tom@torontomu.ca`.
- **Steps:** Select a valid 2 MB PDF file. Click "Submit."
- **Expected:** Success message displayed. `term_reports` record created with file path and `submitted_at` timestamp.

#### STU09 — PDF Upload (Failure — Wrong Format/Size)
- **Precondition:** Logged in as `aaron.tom@torontomu.ca`.
- **Steps:** Select a non-PDF file or a file larger than 2 MB. Click "Submit."
- **Expected:** Error message: "Invalid format. Only PDF files are accepted and must be under 2 MB."

---

### 10.2 Coordinator Test Cases

#### COOR01 — Dashboard Display (Success)
- **Precondition:** Database seeded with 10 `accepted`, 15 `rejected`, 5 `pending` applicants.
- **Steps:** Log in as coordinator. Navigate to dashboard.
- **Expected:** Summary widgets display 10 / 15 / 5 for their respective categories. "Total Applicants" widget shows 30.

#### COOR02 — Dashboard Display (No Data)
- **Precondition:** Database is empty (no applicants).
- **Steps:** Log in as coordinator. Navigate to dashboard.
- **Expected:** All widgets show "No data." Charts show an empty state. No crash.

#### COOR03 — Initial Review UI (Success)
- **Precondition:** Database has 5 students: 3 with status `pending`, 2 with `provisionally_accepted`.
- **Steps:** Log in as coordinator. Navigate to Initial Intake Dashboard.
- **Expected:** Table displays exactly 3 rows (pending students only). The 2 provisionally accepted students are not shown.

#### COOR04 — Initial Review UI (Empty Queue)
- **Precondition:** Database has 5 students, all with `provisionally_accepted` status.
- **Steps:** Log in as coordinator. Navigate to Initial Intake Dashboard.
- **Expected:** Empty state message displayed. No table rendered.

#### COOR05 — Initial Review UI (Multiple Pages)
- **Precondition:** Database has 50 students with `pending` status.
- **Steps:** Log in as coordinator. Navigate to Initial Intake Dashboard. Click "Page 2."
- **Expected:** Next 20 students are displayed in the list. No browser crash.

#### COOR06 — Final Review — Mark as Accepted
- **Precondition:** Database has student "Aaron Tom" with `provisionally_accepted` status.
- **Steps:** Log in as coordinator. Navigate to final review. Click "Accept" next to Aaron Tom.
- **Expected:** `applicants.status` updated to `finally_accepted`. Aaron Tom removed from "needs final review" queue. Aaron Tom appears on Official Roster List.

#### COOR07 — Final Review — Mark as Rejected
- **Precondition:** Same as COOR06.
- **Steps:** Log in as coordinator. Navigate to final review. Click "Reject" next to Aaron Tom.
- **Expected:** `applicants.status` updated to `finally_rejected`. Aaron Tom removed from queue and does not appear on the Official Roster List.

#### COOR08 — Reporting & Tracking Filter (Success)
- **Precondition:** Database has 10 students: 4 have submitted PDF reports, 6 have not.
- **Steps:** Log in as coordinator. Navigate to tracking dashboard. Select filter "Missing Student Report." Click Apply.
- **Expected:** Table shows 6 rows (students without reports). The 4 who submitted are hidden. Switch filter to "Submitted Student Report." Table shows 4 rows (submitted). The 6 without are hidden.

#### COOR09 — Automated Nags (Success)
- **Precondition:** Database seeded with three students:
  - Student A: Report submitted, deadline yesterday.
  - Student B: No report, deadline next week.
  - Student C: No report, deadline yesterday.
- **Steps:** Click "Send Reminders."
- **Expected:** Exactly 1 email is sent — to Student C only. Students A and B receive no email.

#### COOR10 — Automated Nags (Double Send Prevention)
- **Precondition:** Same students as COOR09. Student C has `last_reminder_set_at = NULL`.
- **Steps:** Click "Send Reminders." Wait a few seconds. Click "Send Reminders" again.
- **Expected:** First click: Student C receives 1 email. `reminder_logs` entry created with current timestamp. Second click: Student C receives no email (cooldown check passes). Total emails sent to Student C: 1.

#### COOR11 — Exception Handling — Flag Student (Success)
- **Precondition:** Database has student "Jacob Mobin" with active job assignment at "Cha Industries."
- **Steps:** Log in as coordinator. Navigate to Jacob Mobin's profile. Click "Flag Issue" next to Cha Industries. Select "Fired/Terminated." Enter notes: "Attendance issues." Submit.
- **Expected:** `exception_flags` record created with reason and notes. `job_assignments.status` updated to `fired`. Jacob Mobin's profile shows "Requires Meeting" badge.

---

### 10.3 Supervisor Test Cases

#### SUP01 — Account Creation (Success)
- **Steps:** Navigate to supervisor registration page. Fill all fields with valid data (name, company, valid work email, password meeting all requirements). Submit. Log in with new credentials.
- **Expected:** Login succeeds and supervisor dashboard is displayed.

#### SUP02 — Account Creation (Failure — Weak Password)
- **Steps:** Navigate to supervisor registration page. Fill all fields. Enter a password that fails requirements (e.g., too short, no special character). Submit.
- **Expected:** Submission is blocked. UI highlights the password field and lists the specific unmet requirements.

#### SUP03 — Supervisor PDF Upload (Success)
- **Precondition:** Logged in as authenticated supervisor with an assigned student.
- **Steps:** Navigate to evaluation portal. Upload a valid but heavily unoptimized large PDF (at or near the maximum file size). Submit.
- **Expected:** System does not time out. File is stored in the database/storage. Evaluation status updated to complete.

#### SUP04 — Supervisor PDF Upload (Failure — Wrong File Type)
- **Precondition:** Logged in as authenticated supervisor.
- **Steps:** Upload a non-PDF file (e.g., `.docx` or `.jpg`). Submit.
- **Expected:** File rejected. Upload error message displayed. No record created.

#### SUP05 — Digital Evaluation Form (Success)
- **Precondition:** Logged in as supervisor. Assigned student evaluation exists.
- **Steps:** Navigate to digital evaluation form. Fill out all four sections (Behaviour, Skills, Knowledge, Attitude) completely. Submit.
- **Expected:** "Submission complete" confirmation message displayed. `evaluations` record created with all four scores.

#### SUP06 — Digital Evaluation Form (Failure — Incomplete Section)
- **Precondition:** Same as SUP05.
- **Steps:** Complete Behaviour, Skills, and Knowledge sections. Leave Attitude entirely blank. Click "Submit Evaluation."
- **Expected:** Submission blocked. Page scrolls to the Attitude section. Attitude section is highlighted with required field indicators.

---

### 10.4 Test Cases Table

| Test Case | Description | Expected Result | Actual Result | Status | Date Executed |
|---|---|---|---|---|---|
| STU01 | Application form — success | Success message + DB record created | N/A | Pending | N/A |
| STU02 | Application form — missing field | Failure message + field highlighted | N/A | Pending | N/A |
| STU03 | Student login — success | Redirect to student dashboard | N/A | Pending | N/A |
| STU04 | Student login — wrong password | Error message displayed | N/A | Pending | N/A |
| STU05 | Deadline calculation — success | Returns `2026-04-29` | N/A | Pending | N/A |
| STU06 | Deadline calculation — NULL date | Returns `"Date pending"` | N/A | Pending | N/A |
| STU07 | Deadline calculation — leap year | Returns `2026-03-14` | N/A | Pending | N/A |
| STU08 | PDF report upload — success | Success message + DB record with timestamp | N/A | Pending | N/A |
| STU09 | PDF report upload — invalid file | Error: invalid format message | N/A | Pending | N/A |
| COOR01 | Dashboard display — success | Widgets show 10, 15, 5, 30 | N/A | Pending | N/A |
| COOR02 | Dashboard display — no data | All widgets show "No data" | N/A | Pending | N/A |
| COOR03 | Initial review list — success | 3 pending rows shown | N/A | Pending | N/A |
| COOR04 | Initial review list — empty | Empty state message, no table | N/A | Pending | N/A |
| COOR05 | Initial review list — pagination | Next 20 students on page 2 | N/A | Pending | N/A |
| COOR06 | Final review — mark accepted | DB updated; student on roster | N/A | Pending | N/A |
| COOR07 | Final review — mark rejected | DB updated; student removed | N/A | Pending | N/A |
| COOR08 | Reporting filter — success | Filter shows 4 or 6 rows correctly | N/A | Pending | N/A |
| COOR09 | Auto reminders — success | Email sent only to Student C | N/A | Pending | N/A |
| COOR10 | Auto reminders — double send | Student C receives exactly 1 email | N/A | Pending | N/A |
| COOR11 | Exception flag — success | DB record created; meeting badge shown | N/A | Pending | N/A |
| SUP01 | Supervisor registration — success | Login succeeds; dashboard shown | N/A | Pending | N/A |
| SUP02 | Supervisor registration — weak password | Submission blocked; field highlighted | N/A | Pending | N/A |
| SUP03 | Supervisor PDF upload — success | File stored; evaluation status complete | N/A | Pending | N/A |
| SUP04 | Supervisor PDF upload — wrong type | Upload error message shown | N/A | Pending | N/A |
| SUP05 | Digital form — success | "Submission complete" message | N/A | Pending | N/A |
| SUP06 | Digital form — incomplete section | Blocked; scrolls to Attitude section | N/A | Pending | N/A |

---

## 11. Security Design

### Authentication & Authorization

- **Supabase Auth:** Manages all user credentials, password hashing (bcrypt internally), and JWT issuance. Passwords are never handled by the Flask application — they go directly from the browser to Supabase Auth.
- **JWT Validation in Flask:** Every protected Flask route uses a `@require_role` decorator that decodes the incoming Supabase JWT using `PyJWT` and the Supabase JWT secret (`SUPABASE_JWT_SECRET` env var). Example:
  ```python
  def require_role(*roles):
      def decorator(f):
          @wraps(f)
          def decorated(*args, **kwargs):
              token = request.headers.get('Authorization', '').replace('Bearer ', '')
              try:
                  payload = jwt.decode(token, current_app.config['SUPABASE_JWT_SECRET'],
                                       algorithms=['HS256'])
              except jwt.ExpiredSignatureError:
                  return jsonify({'error': 'Token expired.'}), 401
              except jwt.InvalidTokenError:
                  return jsonify({'error': 'Invalid token.'}), 401
              if payload.get('role') not in roles:
                  return jsonify({'error': 'Forbidden.'}), 403
              g.user_id = payload['sub']
              return f(*args, **kwargs)
          return decorated
      return decorator
  ```
- **Role-Based Access Control (RBAC):** Enforced at two levels — the Flask `@require_role` decorator (API layer) and Supabase Row-Level Security (RLS) policies (database layer). RLS ensures that even if the Flask API is bypassed, a student cannot read another student's data from Supabase directly.
- **Rate Limiting:** The `/api/v1/students/apply` endpoint and Supabase Auth's login are rate-limited. Supabase Auth has built-in brute-force protection. Flask-Limiter can be added for additional API-level throttling.

### Row-Level Security (RLS) — Supabase

RLS policies are defined in SQL and applied per-table. Example policies:

```sql
-- Students can only read their own work_terms
CREATE POLICY "student_own_terms" ON work_terms
  FOR SELECT USING (auth.uid() = student_id);

-- Coordinators can read all applicants
CREATE POLICY "coordinator_read_applicants" ON applicants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'coordinator'
    )
  );
```

### Input Validation

- All user input is validated **client-side** (React form validation for UX) and **server-side** (Flask — authoritative).
- Flask uses `request.json` with manual field checks. A helper `validate_fields(data, required)` function returns structured 422 errors.
- SQL injection is prevented by using the Supabase Python SDK's parameterized query builder — raw SQL strings with user input are never used.
- File MIME type is validated server-side using Python's `magic` library (not just the file extension).

### File Security

- Files are stored in private Supabase Storage buckets. Direct public URLs are disabled.
- Files are accessed via **signed URLs** generated by Flask: `supabase.storage.from_('reports').create_signed_url(path, expires_in=900)` (15-minute expiry).
- Storage object keys use UUIDs to prevent enumeration: `reports/{student_id}/{term_id}/{uuid4()}.pdf`.

### HTTPS & Transport

- All traffic uses HTTPS in staging and production (enforced by Vercel for React; Render/Railway for Flask).
- Flask runs behind a reverse proxy (Gunicorn + Nginx or platform-managed) that handles TLS termination.
- CORS is configured via `Flask-CORS` to allow only the React app's origin: `CORS(app, origins=['https://your-app.vercel.app'])`.

### Secrets Management

- All secrets (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `MAIL_PASSWORD`, `FLASK_SECRET_KEY`) are stored as environment variables — never hardcoded or committed.
- The `SUPABASE_SERVICE_ROLE_KEY` (which bypasses RLS) is only used server-side in Flask, never exposed to the React client. The React client uses only the `SUPABASE_ANON_KEY`.

---

## 12. File Handling & Storage

### Supabase Storage Buckets

| Bucket Name | Access Policy | Contents |
|---|---|---|
| `reports` | Private (RLS enforced) | Student term report PDFs |
| `evaluations` | Private (RLS enforced) | Supervisor evaluation PDFs |
| `templates` | Public | Static PDF report template (read-only) |

### Upload Flow (Student Report Example)

```
React (FileInput) → multipart/form-data POST to Flask /api/v1/students/me/reports
  → Flask: validate MIME type (python-magic) + file size (< 2 MB)
  → Flask: call supabase.storage.from_('reports').upload(path, file_bytes)
  → Flask: INSERT into term_reports (storage_path, file_size_bytes, submitted_at)
  → Return 201 with reportId
```

### Signed URL Generation (Flask service)

```python
def get_signed_url(bucket: str, path: str, expires_in: int = 900) -> str:
    result = supabase.storage.from_(bucket).create_signed_url(path, expires_in)
    return result['signedURL']
```

Signed URLs expire after 15 minutes. The React frontend calls the Flask API to get a fresh signed URL before presenting a download link — it never stores signed URLs long-term.

### Storage Key Conventions

| File Type | Supabase Storage Path |
|---|---|
| Student Term Reports | `reports/{student_id}/{work_term_id}/{uuid4()}.pdf` |
| Supervisor PDF Evaluations | `evaluations/{supervisor_id}/{assignment_id}/{uuid4()}.pdf` |
| Report Template (static) | `templates/term-report-template.pdf` |

### File Size Limits

| File Type | Max Size | Enforced By |
|---|---|---|
| Student Term Reports | 2 MB | Flask (checked before upload to Supabase) |
| Supervisor PDF Evaluations | 20 MB | Flask (checked before upload to Supabase) |

### MIME Type Validation

Python's `python-magic` library reads the file's magic bytes (not the file extension) to confirm it is a genuine PDF before uploading to Supabase Storage:

```python
import magic
mime = magic.from_buffer(file.read(2048), mime=True)
file.seek(0)
if mime != 'application/pdf':
    return jsonify({'error': 'Only PDF files are accepted.'}), 422
```

---

## 13. Email Notification System

### Technology

- **Library:** Flask-Mail
- **Transport:** SMTP via a transactional email provider (e.g., SendGrid, Gmail SMTP).
- **Configuration (Flask `app.py`):**
  ```python
  app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER')       # e.g. smtp.sendgrid.net
  app.config['MAIL_PORT'] = 587
  app.config['MAIL_USE_TLS'] = True
  app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
  app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
  app.config['MAIL_DEFAULT_SENDER'] = 'coop@torontomu.ca'
  mail = Mail(app)
  ```

### Sending a Reminder (Flask service example)

```python
from flask_mail import Message

def send_reminder_email(student_email: str, student_name: str, deadline: str):
    msg = Message(
        subject='Action Required: Co-op Term Report Overdue',
        recipients=[student_email],
        body=(
            f"Hi {student_name},\n\n"
            f"Your co-op term report was due on {deadline} and has not yet been submitted.\n"
            f"Please log in and submit your report at your earliest convenience.\n\n"
            f"Co-op Program Office"
        )
    )
    mail.send(msg)
```

### Email Types

| Trigger | Recipient | Subject |
|---|---|---|
| Student provisionally accepted | Student | "Welcome to the Co-op Program — Next Steps" |
| Automated reminder (overdue report) | Student | "Action Required: Co-op Term Report Overdue" |

### Idempotency & Double-Send Prevention

- Before sending any reminder, Flask queries `reminder_logs` for the student + work term combination where `sent_at > NOW() - INTERVAL '24 hours'`.
- If a recent reminder exists, that student is skipped. No email is sent.
- If the SMTP call fails (e.g., network error), the exception is caught, logged, and the student is included in the API response's `failed` list. No `reminder_logs` record is created for failed sends, so the coordinator can retry.

### Email Safety

- The reminder system only sends to email addresses pulled from the `students` table — it cannot be pointed at arbitrary addresses.
- Email body text does not include unsanitized user input, preventing header injection.

---

## 14. Error Handling & Edge Cases

| Scenario | Expected System Behaviour |
|---|---|
| Student submits application with duplicate student ID | 409 Conflict: "An application with this student ID already exists." |
| Student submits application with duplicate email | 409 Conflict: "An application with this email already exists." |
| Work term has no end date | Deadline shows "Date pending." No crash. |
| Coordinator clicks "Send Reminders" with no eligible students | Response: "No students currently require a reminder." No emails sent. |
| Coordinator clicks "Send Reminders" twice rapidly | Second click is a no-op for students already reminded within 24 hours. |
| Student tries to upload a second report for the same term | 409 Conflict: "A report has already been submitted for this work term." |
| Supervisor submits digital form with a score out of range (e.g., 0 or 6) | 422 Unprocessable Entity: "Score must be between 1 and 5." |
| Database connection is unavailable | 503 Service Unavailable with a user-friendly error page. No stack traces exposed. |
| User submits a file that is PDF in extension but not content | Server MIME check rejects it: "Invalid format. Only PDF files are accepted." |
| Dashboard loaded with empty database | All charts and widgets display "No data" state. No crash. |
| Coordinator tries to set an invalid status transition | 400 Bad Request: "Invalid status transition." |

---

## 15. Accessibility & UX Considerations

- All form fields have visible, associated `<label>` elements.
- Error messages are associated with their fields via `aria-describedby` so screen readers can announce them.
- All action buttons have descriptive `aria-label` attributes where icon-only buttons are used.
- Colour alone is never the sole indicator of status (e.g., status badges include text labels).
- File upload components display clear size and format requirements before the user attempts to upload.
- The system is fully keyboard-navigable. No interactions require mouse-only actions.
- Loading states (e.g., during file upload) display progress indicators with appropriate `aria-live` regions.
- Confirmation modals (e.g., "Finally Accept" action, which is irreversible) explicitly warn the user that the action cannot be undone.

---

## 16. Open Questions & Future Work

| # | Question / Deferred Item | Owner |
|---|---|---|
| 1 | What is the exact institution email domain for validation (e.g., `@torontomu.ca`)? | Client |
| 2 | Should a student be notified by email when their application status changes (initial and final review)? | Client |
| 3 | The deadline calculation leap year test case (STU07) contains a potential calculation error — `Feb 28 + 14` in 2026 (non-leap year) is `March 14`, not `March 13` as stated. Needs team confirmation. | Team |
| 4 | What happens when a finally rejected student re-applies? Should the system allow it? | Client |
| 5 | Is there a maximum number of work terms per student? | Client |
| 6 | Supervisor self-registration flow: should a supervisor be linked to a student before or after registration? How is the linkage established? | Client / Coordinator |
| 7 | Should coordinators be able to view the content of submitted PDFs within the portal, or only see submission status? | Client |
| 8 | Password reset / "forgot password" flow — deferred to Sprint 2. | Team |
| 9 | Are evaluation scores on a 1–5 scale, a percentage, or a custom rubric? | Client |
| 10 | Pagination size is currently 20 per page — confirm with coordinator stakeholders if this is appropriate. | Client |

---

*Document version: 1.0 — Sprint 1*
*Last updated: March 2026*
*Authors: Group 6 — Rayan Roshan, Zakariyya Islam, Aarom Tom, Jacob Mobin, Ethan Cha*