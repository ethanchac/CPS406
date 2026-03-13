from uuid import uuid4
from flask import Blueprint, jsonify, request, g
from app.services.supabase import get_supabase
from app.services.storage import upload_file
from app.utils.auth import require_role

supervisor_bp = Blueprint('supervisor', __name__)

MAX_EVAL_SIZE = 20 * 1024 * 1024  # 20 MB


def _validate_pdf_mime(file_bytes: bytes) -> bool:
    return file_bytes[:4] == b'%PDF'


@supervisor_bp.route('/students', methods=['GET'])
@require_role('supervisor')
def list_students():
    supabase = get_supabase()
    result = supabase.table('job_assignments').select(
        '*, work_terms(term_label, start_date, end_date, students(full_name, student_number))'
    ).eq('supervisor_id', g.user_id).execute()
    return jsonify(result.data)


@supervisor_bp.route('/evaluations/<assignment_id>/upload', methods=['POST'])
@require_role('supervisor')
def upload_evaluation_pdf(assignment_id):
    supabase = get_supabase()

    # Verify supervisor owns this assignment
    job = supabase.table('job_assignments').select('id').eq('id', assignment_id).eq('supervisor_id', g.user_id).execute()
    if not job.data:
        return jsonify({'error': 'Assignment not found or access denied.'}), 404

    # Check for existing evaluation
    existing = supabase.table('evaluations').select('id').eq('job_assignment_id', assignment_id).execute()
    if existing.data:
        return jsonify({'error': 'An evaluation has already been submitted for this assignment.'}), 409

    file = request.files.get('file')
    if not file:
        return jsonify({'error': 'No file provided.'}), 422

    file_bytes = file.read()

    if len(file_bytes) > MAX_EVAL_SIZE:
        return jsonify({'error': 'File exceeds 20 MB limit.'}), 422

    if not _validate_pdf_mime(file_bytes):
        return jsonify({'error': 'Invalid file type. Only PDF files are accepted.'}), 422

    path = f'evaluations/{g.user_id}/{assignment_id}/{uuid4()}.pdf'
    try:
        upload_file('evaluations', path, file_bytes)
    except Exception as e:
        return jsonify({'error': 'Upload failed. Please try again.'}), 500

    supabase.table('evaluations').insert({
        'job_assignment_id': assignment_id,
        'supervisor_id': g.user_id,
        'submission_type': 'pdf_upload',
        'storage_path': path
    }).execute()

    return jsonify({'message': 'Evaluation uploaded successfully.'}), 201


@supervisor_bp.route('/evaluations/<assignment_id>/form', methods=['POST'])
@require_role('supervisor')
def submit_evaluation_form(assignment_id):
    data = request.get_json() or {}
    supabase = get_supabase()

    # Verify supervisor owns this assignment
    job = supabase.table('job_assignments').select('id').eq('id', assignment_id).eq('supervisor_id', g.user_id).execute()
    if not job.data:
        return jsonify({'error': 'Assignment not found or access denied.'}), 404

    # Check for existing evaluation
    existing = supabase.table('evaluations').select('id').eq('job_assignment_id', assignment_id).execute()
    if existing.data:
        return jsonify({'error': 'An evaluation has already been submitted for this assignment.'}), 409

    errors = []
    scores = {}
    for field, label in [('behaviourScore', 'Behaviour'), ('skillsScore', 'Skills'), ('knowledgeScore', 'Knowledge'), ('attitudeScore', 'Attitude')]:
        val = data.get(field)
        if val is None:
            errors.append({'field': field, 'message': f'{label} score is required.'})
        elif not isinstance(val, int) or not (1 <= val <= 5):
            errors.append({'field': field, 'message': f'{label} score must be an integer between 1 and 5.'})
        else:
            scores[field] = val

    if errors:
        return jsonify({'errors': errors}), 422

    supabase.table('evaluations').insert({
        'job_assignment_id': assignment_id,
        'supervisor_id': g.user_id,
        'submission_type': 'digital_form',
        'behaviour_score': scores.get('behaviourScore'),
        'skills_score': scores.get('skillsScore'),
        'knowledge_score': scores.get('knowledgeScore'),
        'attitude_score': scores.get('attitudeScore'),
        'comments': data.get('comments', '')
    }).execute()

    return jsonify({'message': 'Evaluation submitted successfully.'}), 201


@supervisor_bp.route('/evaluations', methods=['GET'])
@require_role('supervisor')
def list_evaluations():
    supabase = get_supabase()
    result = supabase.table('evaluations').select(
        '*, job_assignments(company_name, work_terms(term_label, students(full_name)))'
    ).eq('supervisor_id', g.user_id).execute()
    return jsonify(result.data)
