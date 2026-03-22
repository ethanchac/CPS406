#!/usr/bin/env python3
"""
Demo Seed Script — CPS406 Co-op Portal
Run from the backend/ directory with venv active:

  cd backend
  source venv/bin/activate
  python seed_demo.py

Requires a valid .env with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
Also requires a coordinator account already created in Supabase Auth dashboard.

WHAT THIS CREATES:
  - 10 applicants in various statuses (pending, rejected, provisionally/finally accepted)
  - 4 student auth accounts with work terms, job assignments
  - 2 supervisor auth accounts
  - Evaluations, reports, and one flagged assignment for demo scenarios

DEMO CREDENTIALS:
  Coordinator:  coordinator@torontomu.ca / (set up manually in Supabase Auth)
  Students:
    emma.chen@torontomu.ca       / Demo@12345  (completed term, report+eval submitted)
    marcus.williams@torontomu.ca / Demo@12345  (completed term, MISSING report+eval)
    sofia.patel@torontomu.ca    / Demo@12345  (active term, ongoing)
    james.liu@torontomu.ca      / Demo@12345  (flagged — fired from assignment)
  Supervisors:
    sarah.johnson@acmecorp.com   / Demo@12345  (evaluated Emma)
    david.kim@techsolutions.com  / Demo@12345  (assigned to Marcus, no eval yet)
"""

import os
import sys
from datetime import date, timedelta
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print('ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env')
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

DEMO_PASSWORD = 'Demo@12345'

today = date.today()

# ──────────────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────────────

def create_auth_user(email, full_name, role):
    """Create a Supabase Auth user and return their UUID. Skip if already exists."""
    try:
        result = supabase.auth.admin.create_user({
            'email': email,
            'password': DEMO_PASSWORD,
            'email_confirm': True,
            'user_metadata': {'full_name': full_name, 'role': role}
        })
        uid = result.user.id
        print(f'  Created auth user: {email} ({uid})')
        return uid
    except Exception as e:
        msg = str(e).lower()
        if 'already' in msg or 'registered' in msg or 'exists' in msg or 'duplicate' in msg:
            # User already exists — look up by listing and filtering
            try:
                page = 1
                while True:
                    users = supabase.auth.admin.list_users(page=page, per_page=100)
                    if not users:
                        break
                    for u in users:
                        if u.email == email:
                            print(f'  Auth user already exists: {email} ({u.id})')
                            return u.id
                    if len(users) < 100:
                        break
                    page += 1
            except Exception:
                pass
            print(f'  WARNING: {email} already exists but could not retrieve ID. Skipping.')
            return None
        print(f'  ERROR creating {email}: {e}')
        return None


def upsert_user_profile(uid, role):
    supabase.table('user_profiles').upsert({'id': uid, 'role': role}).execute()


def days_ago(n):
    return (today - timedelta(days=n)).isoformat()


def days_from_now(n):
    return (today + timedelta(days=n)).isoformat()


# ──────────────────────────────────────────────────────────────────────────────
# Step 1 — Applicants (no auth required)
# ──────────────────────────────────────────────────────────────────────────────
print('\n[1/7] Seeding applicants...')

applicants_data = [
    # Will become students (finally_accepted)
    {'full_name': 'Emma Chen',         'student_id': '501100001', 'email': 'emma.chen@torontomu.ca',          'status': 'finally_accepted', 'applied_at': days_ago(92)},
    {'full_name': 'Marcus Williams',   'student_id': '501100002', 'email': 'marcus.williams@torontomu.ca',    'status': 'finally_accepted', 'applied_at': days_ago(88)},
    {'full_name': 'Sofia Patel',       'student_id': '501100003', 'email': 'sofia.patel@torontomu.ca',        'status': 'finally_accepted', 'applied_at': days_ago(85)},
    {'full_name': 'James Liu',         'student_id': '501100004', 'email': 'james.liu@torontomu.ca',          'status': 'finally_accepted', 'applied_at': days_ago(80)},
    # Provisionally accepted (awaiting final decision)
    {'full_name': 'Priya Sharma',      'student_id': '501100005', 'email': 'priya.sharma@torontomu.ca',       'status': 'provisionally_accepted', 'applied_at': days_ago(30)},
    {'full_name': 'Daniel Osei',       'student_id': '501100006', 'email': 'daniel.osei@torontomu.ca',        'status': 'provisionally_accepted', 'applied_at': days_ago(25)},
    # Pending (for initial review demo)
    {'full_name': 'Aisha Kowalski',    'student_id': '501100007', 'email': 'aisha.kowalski@torontomu.ca',     'status': 'pending',         'applied_at': days_ago(5)},
    {'full_name': 'Noah Tremblay',     'student_id': '501100008', 'email': 'noah.tremblay@torontomu.ca',      'status': 'pending',         'applied_at': days_ago(3)},
    {'full_name': 'Yuki Tanaka',       'student_id': '501100009', 'email': 'yuki.tanaka@torontomu.ca',        'status': 'pending',         'applied_at': days_ago(1)},
    # Rejected
    {'full_name': 'Luca Ferrari',      'student_id': '501100010', 'email': 'luca.ferrari@torontomu.ca',       'status': 'rejected',        'applied_at': days_ago(60)},
    {'full_name': 'Mia Johansson',     'student_id': '501100011', 'email': 'mia.johansson@torontomu.ca',      'status': 'finally_rejected','applied_at': days_ago(70)},
]

applicant_ids = {}  # email -> applicant UUID

for a in applicants_data:
    applied_at = a.pop('applied_at')
    try:
        res = supabase.table('applicants').insert({**a, 'applied_at': applied_at}).execute()
        applicant_ids[a['email']] = res.data[0]['id']
        print(f"  Inserted applicant: {a['full_name']} ({a['status']})")
    except Exception as e:
        if 'duplicate' in str(e).lower() or 'unique' in str(e).lower():
            # Fetch existing
            existing = supabase.table('applicants').select('id').eq('email', a['email']).execute()
            if existing.data:
                applicant_ids[a['email']] = existing.data[0]['id']
                print(f"  Applicant already exists: {a['full_name']}")
        else:
            print(f"  ERROR inserting applicant {a['full_name']}: {e}")


# ──────────────────────────────────────────────────────────────────────────────
# Step 2 — Supervisors
# ──────────────────────────────────────────────────────────────────────────────
print('\n[2/7] Seeding supervisors...')

supervisors = [
    {'email': 'sarah.johnson@acmecorp.com',      'full_name': 'Sarah Johnson',  'company_name': 'Acme Corporation'},
    {'email': 'david.kim@techsolutions.com',     'full_name': 'David Kim',      'company_name': 'TechSolutions Inc.'},
]

supervisor_ids = {}  # email -> UUID

for sv in supervisors:
    uid = create_auth_user(sv['email'], sv['full_name'], 'supervisor')
    if uid:
        upsert_user_profile(uid, 'supervisor')
        try:
            supabase.table('supervisors').upsert({
                'id': uid,
                'full_name': sv['full_name'],
                'company_name': sv['company_name'],
                'work_email': sv['email']
            }).execute()
            print(f"  Supervisor record: {sv['full_name']}")
        except Exception as e:
            print(f"  ERROR inserting supervisor record: {e}")
        supervisor_ids[sv['email']] = uid


# ──────────────────────────────────────────────────────────────────────────────
# Step 3 — Student Auth Users + Student Records
# ──────────────────────────────────────────────────────────────────────────────
print('\n[3/7] Seeding students (auth + student records)...')

students = [
    {
        'email': 'emma.chen@torontomu.ca',
        'full_name': 'Emma Chen',
        'student_number': '501100001',
        'program': 'Computer Science'
    },
    {
        'email': 'marcus.williams@torontomu.ca',
        'full_name': 'Marcus Williams',
        'student_number': '501100002',
        'program': 'Software Engineering'
    },
    {
        'email': 'sofia.patel@torontomu.ca',
        'full_name': 'Sofia Patel',
        'student_number': '501100003',
        'program': 'Information Technology Management'
    },
    {
        'email': 'james.liu@torontomu.ca',
        'full_name': 'James Liu',
        'student_number': '501100004',
        'program': 'Computer Science'
    },
]

student_ids = {}  # email -> UUID

for st in students:
    uid = create_auth_user(st['email'], st['full_name'], 'student')
    if uid:
        upsert_user_profile(uid, 'student')
        applicant_id = applicant_ids.get(st['email'])
        try:
            supabase.table('students').upsert({
                'id': uid,
                'applicant_id': applicant_id,
                'full_name': st['full_name'],
                'student_number': st['student_number'],
                'program': st['program']
            }).execute()
            print(f"  Student record: {st['full_name']}")
        except Exception as e:
            print(f"  ERROR inserting student record for {st['full_name']}: {e}")
        student_ids[st['email']] = uid


# ──────────────────────────────────────────────────────────────────────────────
# Step 4 — Work Terms
# ──────────────────────────────────────────────────────────────────────────────
print('\n[4/7] Seeding work terms...')

# Emma: completed Fall 2025 term, past deadline
emma_id = student_ids.get('emma.chen@torontomu.ca')
# Marcus: completed Fall 2025 term, past deadline, no report
marcus_id = student_ids.get('marcus.williams@torontomu.ca')
# Sofia: active Winter 2026 term, deadline upcoming
sofia_id = student_ids.get('sofia.patel@torontomu.ca')
# James: completed Fall 2025 term, past deadline, flagged
james_id = student_ids.get('james.liu@torontomu.ca')

work_term_ids = {}

def create_work_term(student_id, label, start, end, deadline, status='completed'):
    if not student_id:
        return None
    try:
        res = supabase.table('work_terms').insert({
            'student_id': student_id,
            'term_label': label,
            'start_date': start,
            'end_date': end,
            'report_deadline': deadline,
            'status': status
        }).execute()
        wt_id = res.data[0]['id']
        print(f'  Work term: {label} for student {student_id[:8]}... → {wt_id[:8]}...')
        return wt_id
    except Exception as e:
        print(f'  ERROR creating work term {label}: {e}')
        return None

# Emma — Fall 2025 (completed, report submitted, eval submitted)
wt_emma = create_work_term(
    emma_id, 'Fall 2025',
    '2025-09-01', '2025-12-20', '2026-01-03'
)
work_term_ids['emma'] = wt_emma

# Marcus — Fall 2025 (completed, NO report, NO eval)
wt_marcus = create_work_term(
    marcus_id, 'Fall 2025',
    '2025-09-01', '2025-12-20', '2026-01-03'
)
work_term_ids['marcus'] = wt_marcus

# Sofia — Winter 2026 (active, deadline upcoming)
wt_sofia = create_work_term(
    sofia_id, 'Winter 2026',
    '2026-01-06', days_from_now(30), days_from_now(44),
    status='active'
)
work_term_ids['sofia'] = wt_sofia

# James — Fall 2025 (flagged)
wt_james = create_work_term(
    james_id, 'Fall 2025',
    '2025-09-01', '2025-12-20', '2026-01-03',
    status='flagged'
)
work_term_ids['james'] = wt_james


# ──────────────────────────────────────────────────────────────────────────────
# Step 5 — Job Assignments
# ──────────────────────────────────────────────────────────────────────────────
print('\n[5/7] Seeding job assignments...')

sarah_id = supervisor_ids.get('sarah.johnson@acmecorp.com')
david_id = supervisor_ids.get('david.kim@techsolutions.com')

job_ids = {}

def create_job(work_term_id, company, supervisor_id, status='completed'):
    if not work_term_id:
        return None
    try:
        res = supabase.table('job_assignments').insert({
            'work_term_id': work_term_id,
            'company_name': company,
            'supervisor_id': supervisor_id,
            'status': status
        }).execute()
        job_id = res.data[0]['id']
        print(f'  Job assignment: {company} → {job_id[:8]}...')
        return job_id
    except Exception as e:
        print(f'  ERROR creating job assignment at {company}: {e}')
        return None

# Emma at Acme, supervised by Sarah, completed
job_emma = create_job(wt_emma, 'Acme Corporation', sarah_id, 'completed')
job_ids['emma'] = job_emma

# Marcus at TechSolutions, supervised by David, completed (no eval from David)
job_marcus = create_job(wt_marcus, 'TechSolutions Inc.', david_id, 'completed')
job_ids['marcus'] = job_marcus

# Sofia at GlobalTech, supervised by Sarah (ongoing)
job_sofia = create_job(wt_sofia, 'GlobalTech Solutions', sarah_id, 'active')
job_ids['sofia'] = job_sofia

# James at DataDrive — FIRED
job_james = create_job(wt_james, 'DataDrive Analytics', david_id, 'fired')
job_ids['james'] = job_james


# ──────────────────────────────────────────────────────────────────────────────
# Step 6 — Term Reports & Evaluations
# ──────────────────────────────────────────────────────────────────────────────
print('\n[6/7] Seeding term reports and evaluations...')

# Emma's report (submitted)
if wt_emma and emma_id:
    try:
        supabase.table('term_reports').insert({
            'work_term_id': wt_emma,
            'student_id': emma_id,
            'storage_path': f'reports/{emma_id}/{wt_emma}/fall-2025-report.pdf',
            'file_size_bytes': 512000,
            'submitted_at': '2026-01-02T14:30:00Z'
        }).execute()
        print('  Term report: Emma Chen (Fall 2025) ✓')
    except Exception as e:
        print(f'  Term report for Emma may already exist: {e}')

# Emma's evaluation (digital form, submitted by Sarah)
if job_emma and sarah_id:
    try:
        supabase.table('evaluations').insert({
            'job_assignment_id': job_emma,
            'supervisor_id': sarah_id,
            'submission_type': 'digital_form',
            'behaviour_score': 5,
            'skills_score': 4,
            'knowledge_score': 5,
            'attitude_score': 5,
            'comments': 'Emma demonstrated exceptional technical skills and a positive attitude throughout her work term. She quickly adapted to our development environment and made meaningful contributions to our main product. Highly recommend.',
            'submitted_at': '2026-01-08T09:15:00Z'
        }).execute()
        print('  Evaluation: Emma Chen by Sarah Johnson (digital form) ✓')
    except Exception as e:
        print(f'  Evaluation for Emma may already exist: {e}')

# James's exception flag (fired)
if job_james:
    try:
        supabase.table('exception_flags').insert({
            'job_assignment_id': job_james,
            'reason': 'fired_terminated',
            'notes': 'Student was terminated due to repeated attendance issues and failure to meet project deadlines after two written warnings.',
            'requires_meeting': True,
            'flagged_at': '2025-11-15T10:00:00Z'
        }).execute()
        print('  Exception flag: James Liu (fired) ✓')
    except Exception as e:
        print(f'  Exception flag for James may already exist: {e}')

# Sofia has no report yet (active term, upcoming deadline) — intentionally left empty


# ──────────────────────────────────────────────────────────────────────────────
# Step 7 — Extra applicants spread over 30 days for activity chart
# ──────────────────────────────────────────────────────────────────────────────
print('\n[7/7] Seeding extra applicants for activity chart...')

extra_applicants = [
    ('Alex Rivera',     '501200001', 'alex.rivera@torontomu.ca',       'pending',               days_ago(28)),
    ('Sam Nguyen',      '501200002', 'sam.nguyen@torontomu.ca',         'pending',               days_ago(26)),
    ('Jordan Park',     '501200003', 'jordan.park@torontomu.ca',        'rejected',              days_ago(22)),
    ('Taylor Brooks',   '501200004', 'taylor.brooks@torontomu.ca',      'pending',               days_ago(19)),
    ('Casey Morgan',    '501200005', 'casey.morgan@torontomu.ca',       'provisionally_accepted',days_ago(16)),
    ('Riley Evans',     '501200006', 'riley.evans@torontomu.ca',        'provisionally_accepted',days_ago(14)),
    ('Avery Collins',   '501200007', 'avery.collins@torontomu.ca',      'pending',               days_ago(10)),
    ('Quinn Adams',     '501200008', 'quinn.adams@torontomu.ca',        'pending',               days_ago(8)),
    ('Morgan Bailey',   '501200009', 'morgan.bailey@torontomu.ca',      'rejected',              days_ago(6)),
    ('Drew Stewart',    '501200010', 'drew.stewart@torontomu.ca',       'pending',               days_ago(2)),
]

for full_name, student_id, email, status, applied_at in extra_applicants:
    try:
        supabase.table('applicants').insert({
            'full_name': full_name,
            'student_id': student_id,
            'email': email,
            'status': status,
            'applied_at': applied_at
        }).execute()
        print(f'  Extra applicant: {full_name}')
    except Exception as e:
        if 'duplicate' in str(e).lower() or 'unique' in str(e).lower():
            print(f'  Already exists: {full_name}')
        else:
            print(f'  ERROR: {full_name}: {e}')


# ──────────────────────────────────────────────────────────────────────────────
# Summary
# ──────────────────────────────────────────────────────────────────────────────
print("""
════════════════════════════════════════════════════════════
  SEED COMPLETE — Demo Data Ready
════════════════════════════════════════════════════════════

DEMO ACCOUNTS (password for all: Demo@12345)
─────────────────────────────────────────────
Coordinator:
  coordinator@torontomu.ca   (create in Supabase Auth dashboard)

Students:
  emma.chen@torontomu.ca         — Fall 2025, report+eval submitted ✓
  marcus.williams@torontomu.ca   — Fall 2025, MISSING report+eval (overdue)
  sofia.patel@torontomu.ca       — Winter 2026, active term ongoing
  james.liu@torontomu.ca         — Fall 2025, FIRED & flagged ⚠

Supervisors:
  sarah.johnson@acmecorp.com     — submitted eval for Emma; has Sofia active
  david.kim@techsolutions.com    — assigned to Marcus (no eval submitted)

DEMO SCENARIOS YOU CAN SHOW:
─────────────────────────────
1. Coordinator Dashboard      → metrics chart with 30-day activity
2. Initial Review             → 5+ pending applicants to accept/reject
3. Final Review               → 2 provisionally accepted to finalize
4. Tracking → Missing Report  → Marcus Williams, James Liu (overdue)
5. Tracking → Missing Eval    → Marcus, Sofia, James (no evaluation)
6. Student Profile → James    → shows fired flag + "Requires Meeting" badge
7. Supervisor Login → Sarah   → sees Emma (evaluated) + Sofia (pending)
8. Student Login → Emma       → sees submitted report + work term info
9. Student Login → Marcus     → overdue deadline warning on guidelines
10. Send Reminders            → will target Marcus + James (overdue, no report)
════════════════════════════════════════════════════════════
""")
