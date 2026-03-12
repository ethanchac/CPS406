import secrets
import string
from datetime import datetime, timezone, timedelta
from flask import Blueprint, jsonify, request, g
from app.services.supabase import get_supabase
from app.services.email import send_reminder_email, send_welcome_email
from app.utils.auth import require_role

coordinator_bp = Blueprint('coordinator', __name__)

VALID_TRANSITIONS = {
    'pending': ['provisionally_accepted', 'rejected'],
    'provisionally_accepted': ['finally_accepted', 'finally_rejected']
}

PAGE_SIZE = 20


def _generate_temp_password(length: int = 12) -> str:
    chars = string.ascii_letters + string.digits + '!@#$'
    pw = (
        secrets.choice(string.ascii_uppercase) +
        secrets.choice(string.digits) +
        secrets.choice('!@#$') +
        ''.join(secrets.choice(chars) for _ in range(length - 3))
    )
    return pw


@coordinator_bp.route('/dashboard', methods=['GET'])
@require_role('coordinator')
def dashboard():
    supabase = get_supabase()

    applicants = supabase.table('applicants').select('status, applied_at').execute()
    rows = applicants.data or []

    counts = {'pending': 0, 'provisionally_accepted': 0, 'finally_accepted': 0, 'rejected': 0, 'finally_rejected': 0}
    for row in rows:
        s = row.get('status', '')
        if s in counts:
            counts[s] += 1

    total = len(rows)
    accepted = counts['finally_accepted'] + counts['provisionally_accepted']
    rejected = counts['rejected'] + counts['finally_rejected']

    # Build 30-day activity
    now = datetime.now(timezone.utc)
    activity_map = {}
    for row in rows:
        try:
            d = row['applied_at'][:10]
            activity_map.setdefault(d, {'date': d, 'newApplications': 0, 'statusChanges': 0})
            activity_map[d]['newApplications'] += 1
        except Exception:
            pass

    recent_activity = sorted(activity_map.values(), key=lambda x: x['date'])[-30:]

    return jsonify({
        'totalApplicants': total,
        'accepted': accepted,
        'rejected': rejected,
        'pending': counts['pending'],
        'provisionallyAccepted': counts['provisionally_accepted'],
        'finallyAccepted': counts['finally_accepted'],
        'finallyRejected': counts['finally_rejected'],
        'recentActivity': recent_activity
    })


@coordinator_bp.route('/applicants', methods=['GET'])
@require_role('coordinator')
def list_applicants():
    supabase = get_supabase()
    status_filter = request.args.get('status')
    page = int(request.args.get('page', 1))
    offset = (page - 1) * PAGE_SIZE

    query = supabase.table('applicants').select('*', count='exact').order('applied_at', desc=True)
    if status_filter:
        query = query.eq('status', status_filter)
    query = query.range(offset, offset + PAGE_SIZE - 1)

    result = query.execute()
    return jsonify({
        'applicants': result.data,
        'total': result.count,
        'page': page,
        'pageSize': PAGE_SIZE
    })


@coordinator_bp.route('/applicants/<applicant_id>/status', methods=['PATCH'])
@require_role('coordinator')
def update_applicant_status(applicant_id):
    data = request.get_json() or {}
    new_status = data.get('status')

    supabase = get_supabase()
    current = supabase.table('applicants').select('status, email, full_name, student_id').eq('id', applicant_id).single().execute()
    if not current.data:
        return jsonify({'error': 'Applicant not found.'}), 404

    current_status = current.data['status']
    if new_status not in VALID_TRANSITIONS.get(current_status, []):
        return jsonify({'error': 'Invalid status transition.'}), 400

    supabase.table('applicants').update({
        'status': new_status,
        'reviewed_by': g.user_id,
        'reviewed_at': datetime.now(timezone.utc).isoformat()
    }).eq('id', applicant_id).execute()

    # On provisional acceptance, create student account
    if new_status == 'provisionally_accepted':
        email = current.data['email']
        full_name = current.data['full_name']
        student_id_num = current.data['student_id']
        temp_password = _generate_temp_password()

        try:
            auth_result = supabase.auth.admin.create_user({
                'email': email,
                'password': temp_password,
                'email_confirm': True,
                'user_metadata': {'role': 'student', 'full_name': full_name}
            })
            user_id = auth_result.user.id

            supabase.table('user_profiles').insert({'id': user_id, 'role': 'student'}).execute()
            supabase.table('students').insert({
                'id': user_id,
                'applicant_id': applicant_id,
                'full_name': full_name,
                'student_number': student_id_num
            }).execute()

            try:
                send_welcome_email(email, full_name, temp_password)
            except Exception:
                pass  # Don't fail if email fails

        except Exception as e:
            return jsonify({'message': 'Status updated but failed to create student account: ' + str(e)}), 207

    return jsonify({'message': 'Status updated.'})


@coordinator_bp.route('/students', methods=['GET'])
@require_role('coordinator')
def list_students():
    supabase = get_supabase()
    missing_report = request.args.get('missing_report') == 'true'
    submitted_report = request.args.get('submitted_report') == 'true'
    missing_evaluation = request.args.get('missing_evaluation') == 'true'

    students_result = supabase.table('students').select(
        '*, work_terms(*, term_reports(*), job_assignments(*, evaluations(*)))'
    ).execute()

    rows = []
    today = datetime.now(timezone.utc).date()

    for s in (students_result.data or []):
        work_terms = s.get('work_terms') or []
        for wt in work_terms:
            reports = wt.get('term_reports') or []
            jobs = wt.get('job_assignments') or []
            has_report = len(reports) > 0
            has_evaluation = any(len(j.get('evaluations') or []) > 0 for j in jobs)
            deadline = wt.get('report_deadline')
            deadline_passed = deadline and str(today) > deadline

            row = {
                'studentId': s['id'],
                'studentName': s['full_name'],
                'studentNumber': s['student_number'],
                'workTermId': wt['id'],
                'termLabel': wt['term_label'],
                'deadline': deadline,
                'reportStatus': 'submitted' if has_report else 'missing',
                'evaluationStatus': 'submitted' if has_evaluation else 'missing'
            }

            if missing_report and (has_report or not deadline_passed):
                continue
            if submitted_report and not has_report:
                continue
            if missing_evaluation and has_evaluation:
                continue

            rows.append(row)

    return jsonify(rows)


@coordinator_bp.route('/students/<student_id>', methods=['GET'])
@require_role('coordinator')
def get_student(student_id):
    supabase = get_supabase()
    result = supabase.table('students').select(
        '*, applicants(*), work_terms(*, term_reports(*), job_assignments(*, evaluations(*), exception_flags(*)))'
    ).eq('id', student_id).single().execute()

    if not result.data:
        return jsonify({'error': 'Student not found.'}), 404

    return jsonify(result.data)


@coordinator_bp.route('/reminders', methods=['POST'])
@require_role('coordinator')
def send_reminders():
    supabase = get_supabase()
    today = datetime.now(timezone.utc).date()
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()

    # Get students with overdue work terms and no report
    wt_result = supabase.table('work_terms').select(
        'id, student_id, report_deadline, term_label, students(full_name, applicants(email))'
    ).lt('report_deadline', str(today)).eq('status', 'active').execute()

    emails_sent = []
    skipped = []
    skipped_reasons = {}

    for wt in (wt_result.data or []):
        term_id = wt['id']
        student_id = wt['student_id']
        student = wt.get('students', {})
        applicant = student.get('applicants', {}) if student else {}
        student_name = student.get('full_name', 'Student') if student else 'Student'
        student_email = applicant.get('email') if applicant else None

        if not student_email:
            continue

        # Check if report submitted
        report = supabase.table('term_reports').select('id').eq('work_term_id', term_id).execute()
        if report.data:
            skipped.append(student_email)
            skipped_reasons[student_email] = 'Report already submitted.'
            continue

        # Check for recent reminder
        recent = supabase.table('reminder_logs').select('id').eq('student_id', student_id).eq('work_term_id', term_id).gt('sent_at', cutoff).execute()
        if recent.data:
            skipped.append(student_email)
            skipped_reasons[student_email] = 'Reminder sent within last 24 hours.'
            continue

        try:
            send_reminder_email(student_email, student_name, wt['report_deadline'])
            supabase.table('reminder_logs').insert({
                'student_id': student_id,
                'work_term_id': term_id,
                'sent_by': g.user_id
            }).execute()
            emails_sent.append(student_email)
        except Exception:
            skipped.append(student_email)
            skipped_reasons[student_email] = 'Email send failed.'

    if not emails_sent and not skipped:
        return jsonify({'message': 'No students currently require a reminder.', 'emailsSent': 0})

    return jsonify({
        'emailsSent': len(emails_sent),
        'recipients': emails_sent,
        'skipped': skipped,
        'skippedReasons': skipped_reasons
    })


@coordinator_bp.route('/students/<student_id>/flags', methods=['POST'])
@require_role('coordinator')
def flag_student(student_id):
    data = request.get_json() or {}
    job_assignment_id = data.get('jobAssignmentId')
    reason = data.get('reason')
    notes = data.get('notes', '')

    if not job_assignment_id:
        return jsonify({'error': 'jobAssignmentId is required.'}), 422
    if reason not in ('fired_terminated', 'rejected', 'other'):
        return jsonify({'error': 'Invalid reason.'}), 422

    supabase = get_supabase()

    supabase.table('exception_flags').insert({
        'job_assignment_id': job_assignment_id,
        'flagged_by': g.user_id,
        'reason': reason,
        'notes': notes,
        'requires_meeting': True
    }).execute()

    new_status = 'fired' if reason == 'fired_terminated' else 'rejected'
    supabase.table('job_assignments').update({'status': new_status}).eq('id', job_assignment_id).execute()

    return jsonify({'message': 'Flag created successfully.'}), 201


@coordinator_bp.route('/students/<student_id>/flags', methods=['GET'])
@require_role('coordinator')
def get_student_flags(student_id):
    supabase = get_supabase()
    result = supabase.table('exception_flags').select(
        '*, job_assignments(company_name, work_term_id)'
    ).eq('job_assignments.work_terms.student_id', student_id).execute()

    # Simpler query via job_assignments
    jobs = supabase.table('job_assignments').select('id').eq(
        'work_term_id',
        supabase.table('work_terms').select('id').eq('student_id', student_id)
    ).execute()

    if not jobs.data:
        return jsonify([])

    job_ids = [j['id'] for j in jobs.data]
    flags = supabase.table('exception_flags').select('*, job_assignments(company_name)').in_('job_assignment_id', job_ids).execute()
    return jsonify(flags.data)
