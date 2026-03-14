# Co-op Program Management System
**CPS406 — Group 6 | Sprint 1**  
Rayan Roshan · Zakariyya Islam · Aaron Tom · Jacob Mobin · Ethan Cha

A web platform for managing the full lifecycle of a university co-op program: student applications, coordinator review, report submission, supervisor evaluations, and automated reminders.

---

## Project Structure

```
CPS406/
├── frontend/               # React + Vite SPA
│   ├── src/
│   │   ├── pages/          # student/, coordinator/, supervisor/
│   │   ├── components/     # Navbar, Layout, ProtectedRoute
│   │   ├── contexts/       # AuthContext (Supabase session)
│   │   └── lib/            # supabaseClient.js, axios.js
│   └── .env.example
├── backend/                # Python Flask REST API
│   ├── app/
│   │   ├── blueprints/     # auth, students, coordinator, supervisor
│   │   ├── services/       # supabase, email, storage
│   │   └── utils/          # auth decorators, deadline calc
│   ├── tests/              # pytest test suite
│   └── .env.example
└── supabase/
    ├── migrations.sql      # All tables, RLS policies, storage buckets
    └── seed.sql            # Dev/test seed data
```

---

## Supabase Setup (required first)

1. Create a [Supabase](https://supabase.com) project
2. Go to **SQL Editor** and run `supabase/migrations.sql` in full
3. Go to **Authentication → Users** and create a coordinator account (email/password)
4. Run the coordinator profile insert from `supabase/seed.sql` with the user's UUID
5. Create Storage buckets: `reports` (private), `evaluations` (private), `templates` (public)
6. Upload `term-report-template.pdf` to the `templates` bucket

---

## Local Development

### Backend (Flask)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env with your Supabase credentials
```

Required `.env` values:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...   # Settings → API → service_role key
SUPABASE_JWT_SECRET=...         # Settings → API → JWT Secret
FLASK_SECRET_KEY=...            # any random string
MAIL_SERVER=smtp.gmail.com
MAIL_USERNAME=your@email.com
MAIL_PASSWORD=your-app-password
```

```bash
python run.py
# Flask runs at http://localhost:5000
# Health check: GET http://localhost:5000/api/v1/health
```

### Frontend (React)

```bash
cd frontend
npm install

cp .env.example .env
# Edit .env with your Supabase public keys
```

Required `.env` values:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=...      # Settings → API → anon/public key
VITE_API_URL=http://localhost:5000/api/v1
```

```bash
npm run dev
# React dev server at http://localhost:5173
# API requests to /api/* are proxied to Flask automatically
```

---

## Running Tests

```bash
cd backend
python -m pytest tests/ -v
```

34 tests covering: deadline calculation, password validation, student application, PDF upload validation, coordinator workflows, and supervisor evaluations.

---

## User Roles & Entry Points

| Role | URL | How to access |
|---|---|---|
| **Student** | `/student/dashboard` | Log in with credentials emailed on provisional acceptance |
| **Coordinator** | `/coordinator/dashboard` | Log in with coordinator account created in Supabase dashboard |
| **Supervisor** | `/supervisor/dashboard` | Register at `/supervisor/register`, then log in |
| **Anyone** | `/apply` | Public — no login required |

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/students/apply` | None | Submit application |
| GET | `/api/v1/students/me` | Student | Get profile |
| GET | `/api/v1/students/me/workterms` | Student | List work terms |
| GET | `/api/v1/students/me/guidelines` | Student | Deadline + template URL |
| POST | `/api/v1/students/me/reports` | Student | Upload report PDF |
| GET | `/api/v1/coordinator/dashboard` | Coordinator | Summary metrics |
| GET | `/api/v1/coordinator/applicants` | Coordinator | List applicants (filterable) |
| PATCH | `/api/v1/coordinator/applicants/:id/status` | Coordinator | Update applicant status |
| POST | `/api/v1/coordinator/reminders` | Coordinator | Send overdue reminders |
| POST | `/api/v1/coordinator/students/:id/flags` | Coordinator | Flag job assignment |
| POST | `/api/v1/auth/register/supervisor` | None | Supervisor registration |
| POST | `/api/v1/supervisor/evaluations/:id/upload` | Supervisor | Upload PDF evaluation |
| POST | `/api/v1/supervisor/evaluations/:id/form` | Supervisor | Submit digital evaluation |

---

## Tech Stack

- **Frontend:** React 19, Vite 8, Tailwind CSS v4, React Router v6, Axios, Recharts
- **Backend:** Python 3.11+, Flask 3, Flask-CORS, Flask-Mail, PyJWT, supabase-py
- **Database:** Supabase (PostgreSQL) with Row-Level Security
- **Auth:** Supabase Auth (JWT)
- **Storage:** Supabase Storage (S3-compatible)
- **Deployment:** Vercel (frontend) + Render/Railway (backend)
