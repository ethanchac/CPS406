import re
import io
from uuid import uuid4
from datetime import datetime, timezone
from flask import Blueprint, jsonify, request, g
from app.services.supabase import get_supabase
from app.services.storage import upload_file, get_signed_url
from app.utils.auth import require_role
from app.utils.deadline import calculate_deadline

students_bp = Blueprint('students', __name__)

EMAIL_DOMAIN = '@torontomu.ca'
MAX_REPORT_SIZE = 2 * 1024 * 1024  # 2 MB


def _validate_pdf_mime(file_bytes: bytes) -> bool:
    # Check PDF magic bytes
    return file_bytes[:4] == b'%PDF'


@students_bp.route('/apply', methods=['POST'])
def apply():
    data = request.get_json() or {}
    full_name = data.get('fullName', '').strip()
    student_id = data.get('studentId', '').strip()
    email = data.get('email', '').strip().lower()

    errors = []
    if not full_name:
        errors.append({'field': 'fullName', 'message': 'Full name is required.'})
    if not student_id:
        errors.append({'field': 'studentId', 'message': 'Student ID is required.'})
    elif not re.fullmatch(r'\d{9}', student_id):
        errors.append({'field': 'studentId', 'message': 'Student ID must be exactly 9 digits.'})
    if not email:
        errors.append({'field': 'email', 'message': 'Email is required.'})
    elif not re.match(r'^[^@]+@[^@]+\.[^@]+$', email):
        errors.append({'field': 'email', 'message': 'Invalid email format.'})
    elif not email.endswith(EMAIL_DOMAIN):
        errors.append({'field': 'email', 'message': f'Email must end with {EMAIL_DOMAIN}.'})

    if errors:
        return jsonify({'errors': errors}), 422

    supabase = get_supabase()

    dup_id = supabase.table('applicants').select('id').eq('student_id', student_id).execute()
    if dup_id.data:
        return jsonify({'error': 'An application with this student ID already exists.'}), 409

    dup_email = supabase.table('applicants').select('id').eq('email', email).execute()
    if dup_email.data:
        return jsonify({'error': 'An application with this email already exists.'}), 409

    result = supabase.table('applicants').insert({
        'full_name': full_name,
        'student_id': student_id,
        'email': email,
        'status': 'pending'
    }).execute()

    applicant_id = result.data[0]['id']
    return jsonify({'message': 'Application submitted successfully.', 'applicantId': applicant_id}), 201


@students_bp.route('/me', methods=['GET'])
@require_role('student')
def get_me():
    supabase = get_supabase()
    result = supabase.table('students').select('*, applicants(email)').eq('id', g.user_id).single().execute()
    if not result.data:
        return jsonify({'error': 'Student profile not found.'}), 404
    return jsonify(result.data)


@students_bp.route('/me/workterms', methods=['GET'])
@require_role('student')
def get_workterms():
    supabase = get_supabase()
    result = supabase.table('work_terms').select('*, job_assignments(*), term_reports(*)').eq('student_id', g.user_id).execute()
    return jsonify(result.data)


@students_bp.route('/me/guidelines', methods=['GET'])
@require_role('student')
def get_guidelines():
    supabase = get_supabase()
    term = supabase.table('work_terms').select('*').eq('student_id', g.user_id).eq('status', 'active').limit(1).execute()

    if not term.data:
        return jsonify({
            'workTermEndDate': None,
            'reportDeadline': 'Date pending',
            'templateDownloadUrl': None
        })

    end_date = term.data[0].get('end_date')
    deadline = calculate_deadline(end_date)

    try:
        template_url = get_signed_url('templates', 'term-report-template.pdf', 900)
    except Exception:
        template_url = None

    return jsonify({
        'workTermEndDate': end_date,
        'reportDeadline': str(deadline) if deadline else 'Date pending',
        'templateDownloadUrl': template_url
    })


@students_bp.route('/me/reports', methods=['POST'])
@require_role('student')
def submit_report():
    supabase = get_supabase()

    # Get active work term
    term = supabase.table('work_terms').select('id').eq('student_id', g.user_id).eq('status', 'active').limit(1).execute()
    if not term.data:
        return jsonify({'error': 'No active work term found.'}), 404
    term_id = term.data[0]['id']

    # Check for existing report
    existing = supabase.table('term_reports').select('id').eq('work_term_id', term_id).execute()
    if existing.data:
        return jsonify({'error': 'A report has already been submitted for this work term.'}), 409

    file = request.files.get('file')
    if not file:
        return jsonify({'error': 'No file provided.'}), 422

    file_bytes = file.read()

    if len(file_bytes) > MAX_REPORT_SIZE:
        return jsonify({'error': 'Invalid format. Only PDF files are accepted and must be under 2 MB.'}), 422

    if not _validate_pdf_mime(file_bytes):
        return jsonify({'error': 'Invalid format. Only PDF files are accepted and must be under 2 MB.'}), 422

    storage_path = f'reports/{g.user_id}/{term_id}/{uuid4()}.pdf'
    try:
        upload_file('reports', storage_path, file_bytes)
    except Exception as e:
        return jsonify({'error': 'File upload failed. Please try again.'}), 500

    result = supabase.table('term_reports').insert({
        'work_term_id': term_id,
        'student_id': g.user_id,
        'storage_path': storage_path,
        'file_size_bytes': len(file_bytes)
    }).execute()

    report = result.data[0]
    return jsonify({
        'message': 'Report submitted successfully.',
        'reportId': report['id'],
        'submittedAt': report['submitted_at']
    }), 201


@students_bp.route('/me/reports', methods=['GET'])
@require_role('student')
def get_reports():
    supabase = get_supabase()
    result = supabase.table('term_reports').select('*, work_terms(term_label)').eq('student_id', g.user_id).order('submitted_at', desc=True).execute()
    return jsonify(result.data)
