#!/usr/bin/env python3
"""
Supplemental seed: adds 8 more student auth accounts with varied work term scenarios.
Run: cd backend && venv/bin/python seed_extra_students.py
"""
import os, sys
from datetime import date, timedelta
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
if not SUPABASE_URL or not SUPABASE_KEY:
    print('ERROR: Missing env vars'); sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
DEMO_PASSWORD = 'Demo@12345'
today = date.today()

def days_ago(n): return (today - timedelta(days=n)).isoformat()
def days_from_now(n): return (today + timedelta(days=n)).isoformat()

def create_auth_user(email, full_name, role):
    try:
        r = supabase.auth.admin.create_user({
            'email': email, 'password': DEMO_PASSWORD,
            'email_confirm': True,
            'user_metadata': {'full_name': full_name, 'role': role}
        })
        print(f'  Created: {email} ({r.user.id[:8]}...)')
        return r.user.id
    except Exception as e:
        msg = str(e).lower()
        if 'already' in msg or 'registered' in msg or 'exists' in msg or 'duplicate' in msg:
            page = 1
            while True:
                users = supabase.auth.admin.list_users(page=page, per_page=100)
                if not users: break
                for u in users:
                    if u.email == email:
                        print(f'  Already exists: {email} ({u.id[:8]}...)')
                        return u.id
                if len(users) < 100: break
                page += 1
        print(f'  ERROR: {email}: {e}')
        return None

# Get existing supervisor IDs
sup_sarah = None
sup_david = None
try:
    users = supabase.auth.admin.list_users(page=1, per_page=200)
    for u in users:
        if u.email == 'sarah.johnson@acmecorp.com': sup_sarah = u.id
        if u.email == 'david.kim@techsolutions.com': sup_david = u.id
    print(f'Supervisors: sarah={sup_sarah[:8] if sup_sarah else "NOT FOUND"}, david={sup_david[:8] if sup_david else "NOT FOUND"}')
except Exception as e:
    print(f'Could not fetch supervisors: {e}')

# Extra students with varied scenarios
extra_students = [
    {
        'email': 'raj.kumar@torontomu.ca',
        'full_name': 'Raj Kumar',
        'student_number': '501200101',
        'applicant_email': 'raj.kumar@torontomu.ca',
        'applicant_status': 'finally_accepted',
        'applied_days_ago': 95,
        'work_terms': [
            {
                'label': 'Fall 2025',
                'start': '2025-09-01', 'end': '2025-12-20',
                'deadline': '2026-01-03', 'status': 'completed',
                'company': 'Acme Corporation', 'supervisor': sup_sarah, 'job_status': 'completed',
                'has_report': True, 'has_eval': False,  # report submitted, eval missing
            }
        ]
    },
    {
        'email': 'chloe.martin@torontomu.ca',
        'full_name': 'Chloe Martin',
        'student_number': '501200102',
        'applicant_email': 'chloe.martin@torontomu.ca',
        'applicant_status': 'finally_accepted',
        'applied_days_ago': 90,
        'work_terms': [
            {
                'label': 'Fall 2025',
                'start': '2025-09-01', 'end': '2025-12-20',
                'deadline': '2026-01-03', 'status': 'completed',
                'company': 'TechSolutions Inc.', 'supervisor': sup_david, 'job_status': 'completed',
                'has_report': True, 'has_eval': True,
            }
        ]
    },
    {
        'email': 'ben.osei@torontomu.ca',
        'full_name': 'Ben Osei',
        'student_number': '501200103',
        'applicant_email': 'ben.osei@torontomu.ca',
        'applicant_status': 'finally_accepted',
        'applied_days_ago': 87,
        'work_terms': [
            {
                'label': 'Winter 2026',
                'start': '2026-01-06', 'end': days_from_now(60),
                'deadline': days_from_now(74), 'status': 'active',
                'company': 'GlobalTech Solutions', 'supervisor': sup_sarah, 'job_status': 'active',
                'has_report': False, 'has_eval': False,
            }
        ]
    },
    {
        'email': 'lin.zhao@torontomu.ca',
        'full_name': 'Lin Zhao',
        'student_number': '501200104',
        'applicant_email': 'lin.zhao@torontomu.ca',
        'applicant_status': 'finally_accepted',
        'applied_days_ago': 83,
        'work_terms': [
            {
                'label': 'Fall 2025',
                'start': '2025-09-01', 'end': '2025-12-20',
                'deadline': '2026-01-03', 'status': 'completed',
                'company': 'DataDrive Analytics', 'supervisor': sup_david, 'job_status': 'completed',
                'has_report': False, 'has_eval': False,  # both missing + overdue
            }
        ]
    },
    {
        'email': 'fatima.al-rashid@torontomu.ca',
        'full_name': 'Fatima Al-Rashid',
        'student_number': '501200105',
        'applicant_email': 'fatima.al-rashid@torontomu.ca',
        'applicant_status': 'finally_accepted',
        'applied_days_ago': 78,
        'work_terms': [
            {
                'label': 'Fall 2025',
                'start': '2025-09-01', 'end': '2025-12-20',
                'deadline': '2026-01-03', 'status': 'completed',
                'company': 'Acme Corporation', 'supervisor': sup_sarah, 'job_status': 'completed',
                'has_report': True, 'has_eval': True,
            },
            {
                'label': 'Winter 2026',
                'start': '2026-01-06', 'end': days_from_now(55),
                'deadline': days_from_now(69), 'status': 'active',
                'company': 'TechSolutions Inc.', 'supervisor': sup_david, 'job_status': 'active',
                'has_report': False, 'has_eval': False,
            }
        ]
    },
    {
        'email': 'alex.petrov@torontomu.ca',
        'full_name': 'Alex Petrov',
        'student_number': '501200106',
        'applicant_email': 'alex.petrov@torontomu.ca',
        'applicant_status': 'finally_accepted',
        'applied_days_ago': 75,
        'work_terms': [
            {
                'label': 'Winter 2026',
                'start': '2026-01-06', 'end': days_from_now(50),
                'deadline': days_from_now(64), 'status': 'active',
                'company': 'GlobalTech Solutions', 'supervisor': sup_sarah, 'job_status': 'active',
                'has_report': False, 'has_eval': False,
            }
        ]
    },
    {
        'email': 'amara.nwosu@torontomu.ca',
        'full_name': 'Amara Nwosu',
        'student_number': '501200107',
        'applicant_email': 'amara.nwosu@torontomu.ca',
        'applicant_status': 'finally_accepted',
        'applied_days_ago': 72,
        'work_terms': [
            {
                'label': 'Fall 2025',
                'start': '2025-09-01', 'end': '2025-12-20',
                'deadline': '2026-01-03', 'status': 'completed',
                'company': 'DataDrive Analytics', 'supervisor': sup_david, 'job_status': 'rejected',
                'has_report': False, 'has_eval': False,
                'flag_reason': 'rejected',
                'flag_notes': 'Student was rejected from placement after failing background check.',
            }
        ]
    },
    {
        'email': 'daniel.schmidt@torontomu.ca',
        'full_name': 'Daniel Schmidt',
        'student_number': '501200108',
        'applicant_email': 'daniel.schmidt@torontomu.ca',
        'applicant_status': 'finally_accepted',
        'applied_days_ago': 68,
        'work_terms': [
            {
                'label': 'Fall 2025',
                'start': '2025-09-01', 'end': '2025-12-20',
                'deadline': '2026-01-03', 'status': 'completed',
                'company': 'Acme Corporation', 'supervisor': sup_sarah, 'job_status': 'completed',
                'has_report': True, 'has_eval': True,
            }
        ]
    },
]

for st in extra_students:
    print(f'\nProcessing: {st["full_name"]}')

    # Create applicant record
    applicant_id = None
    try:
        res = supabase.table('applicants').insert({
            'full_name': st['full_name'],
            'student_id': st['student_number'],
            'email': st['applicant_email'],
            'status': st['applicant_status'],
            'applied_at': days_ago(st['applied_days_ago'])
        }).execute()
        applicant_id = res.data[0]['id']
    except Exception as e:
        if 'duplicate' in str(e).lower() or 'unique' in str(e).lower():
            ex = supabase.table('applicants').select('id').eq('email', st['applicant_email']).execute()
            if ex.data: applicant_id = ex.data[0]['id']
        else:
            print(f'  applicant error: {e}')

    # Create auth user
    uid = create_auth_user(st['email'], st['full_name'], 'student')
    if not uid: continue

    # User profile
    supabase.table('user_profiles').upsert({'id': uid, 'role': 'student'}).execute()

    # Student record
    try:
        supabase.table('students').upsert({
            'id': uid,
            'applicant_id': applicant_id,
            'full_name': st['full_name'],
            'student_number': st['student_number'],
        }).execute()
    except Exception as e:
        print(f'  student record error: {e}')

    # Work terms
    for wt_data in st['work_terms']:
        try:
            wt_res = supabase.table('work_terms').insert({
                'student_id': uid,
                'term_label': wt_data['label'],
                'start_date': wt_data['start'],
                'end_date': wt_data['end'],
                'report_deadline': wt_data['deadline'],
                'status': wt_data['status'],
            }).execute()
            wt_id = wt_res.data[0]['id']
            print(f'  Work term: {wt_data["label"]}')

            # Job assignment
            job_res = supabase.table('job_assignments').insert({
                'work_term_id': wt_id,
                'company_name': wt_data['company'],
                'supervisor_id': wt_data['supervisor'],
                'status': wt_data['job_status'],
            }).execute()
            job_id = job_res.data[0]['id']

            # Report
            if wt_data.get('has_report'):
                supabase.table('term_reports').insert({
                    'work_term_id': wt_id,
                    'student_id': uid,
                    'storage_path': f'reports/{uid}/{wt_id}/report.pdf',
                    'file_size_bytes': 450000,
                    'submitted_at': f'{wt_data["deadline"]}T10:00:00Z',
                }).execute()
                print(f'    Report submitted ✓')

            # Evaluation
            if wt_data.get('has_eval') and wt_data.get('supervisor'):
                import random
                supabase.table('evaluations').insert({
                    'job_assignment_id': job_id,
                    'supervisor_id': wt_data['supervisor'],
                    'submission_type': 'digital_form',
                    'behaviour_score': random.randint(3, 5),
                    'skills_score': random.randint(3, 5),
                    'knowledge_score': random.randint(3, 5),
                    'attitude_score': random.randint(3, 5),
                    'comments': 'Student performed well during the work term.',
                    'submitted_at': f'{wt_data["deadline"]}T14:00:00Z',
                }).execute()
                print(f'    Evaluation submitted ✓')

            # Exception flag
            if wt_data.get('flag_reason'):
                supabase.table('exception_flags').insert({
                    'job_assignment_id': job_id,
                    'reason': wt_data['flag_reason'],
                    'notes': wt_data.get('flag_notes', ''),
                    'requires_meeting': True,
                }).execute()
                print(f'    Flag: {wt_data["flag_reason"]} ✓')

        except Exception as e:
            print(f'  work term error: {e}')

print('\nDone! Extra students seeded.')
print('\nNew student accounts (password: Demo@12345):')
for st in extra_students:
    print(f'  {st["email"]}')
