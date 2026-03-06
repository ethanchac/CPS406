from functools import wraps
from flask import request, jsonify, g
from app.services.supabase import get_supabase


def require_role(*roles):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            auth_header = request.headers.get('Authorization', '')
            if not auth_header.startswith('Bearer '):
                return jsonify({'error': 'Authorization header missing or malformed.'}), 401

            token = auth_header.replace('Bearer ', '', 1)

            try:
                supabase = get_supabase()
                response = supabase.auth.get_user(token)
                user = response.user
                if not user:
                    return jsonify({'error': 'Invalid token.'}), 401
            except Exception:
                return jsonify({'error': 'Invalid token.'}), 401

            user_role = (user.user_metadata or {}).get('role')
            if roles and user_role not in roles:
                return jsonify({'error': 'Forbidden.'}), 403

            g.user_id = user.id
            g.user_role = user_role
            g.user_email = user.email
            return f(*args, **kwargs)
        return decorated
    return decorator


def validate_password(password: str) -> list[str]:
    errors = []
    if len(password) < 8:
        errors.append('Password must be at least 8 characters.')
    if not any(c.isupper() for c in password):
        errors.append('Password must contain at least one uppercase letter.')
    if not any(c.isdigit() for c in password):
        errors.append('Password must contain at least one digit.')
    if not any(c in '!@#$%^&*' for c in password):
        errors.append('Password must contain at least one special character (!@#$%^&*).')
    return errors
