from flask import Blueprint, jsonify, request, g
from app.services.supabase import get_supabase
from app.utils.auth import require_role, validate_password

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/register/supervisor', methods=['POST'])
def register_supervisor():
    data = request.get_json() or {}
    full_name = data.get('fullName', '').strip()
    company_name = data.get('companyName', '').strip()
    work_email = data.get('workEmail', '').strip()
    password = data.get('password', '')

    errors = []
    if not full_name:
        errors.append({'field': 'fullName', 'message': 'Full name is required.'})
    if not company_name:
        errors.append({'field': 'companyName', 'message': 'Company name is required.'})
    if not work_email:
        errors.append({'field': 'workEmail', 'message': 'Work email is required.'})
    if not password:
        errors.append({'field': 'password', 'message': 'Password is required.'})
    else:
        pw_errors = validate_password(password)
        for msg in pw_errors:
            errors.append({'field': 'password', 'message': msg})

    if errors:
        return jsonify({'errors': errors}), 422

    supabase = get_supabase()

    # Check for existing email
    existing = supabase.table('supervisors').select('id').eq('work_email', work_email).execute()
    if existing.data:
        return jsonify({'errors': [{'field': 'workEmail', 'message': 'An account with this email already exists.'}]}), 409

    try:
        auth_result = supabase.auth.admin.create_user({
            'email': work_email,
            'password': password,
            'email_confirm': True,
            'user_metadata': {'role': 'supervisor', 'full_name': full_name}
        })
        user_id = auth_result.user.id
    except Exception as e:
        return jsonify({'error': 'Failed to create account. ' + str(e)}), 500

    supabase.table('user_profiles').insert({
        'id': user_id,
        'role': 'supervisor'
    }).execute()

    supabase.table('supervisors').insert({
        'id': user_id,
        'full_name': full_name,
        'company_name': company_name,
        'work_email': work_email
    }).execute()

    return jsonify({'message': 'Supervisor account created. Please log in.'}), 201


@auth_bp.route('/me', methods=['GET'])
@require_role()
def get_me():
    return jsonify({
        'userId': g.user_id,
        'role': g.user_role,
        'email': g.user_email
    })
