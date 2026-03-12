import jwt
from functools import wraps
from flask import request, jsonify, g, current_app


def require_role(*roles):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            auth_header = request.headers.get('Authorization', '')
            if not auth_header.startswith('Bearer '):
                return jsonify({'error': 'Authorization header missing or malformed.'}), 401

            token = auth_header.replace('Bearer ', '', 1)
            secret = current_app.config.get('SUPABASE_JWT_SECRET')

            try:
                payload = jwt.decode(
                    token,
                    secret,
                    algorithms=['HS256'],
                    options={'verify_aud': False}
                )
            except jwt.ExpiredSignatureError:
                return jsonify({'error': 'Token expired.'}), 401
            except jwt.InvalidTokenError:
                return jsonify({'error': 'Invalid token.'}), 401

            user_role = payload.get('user_metadata', {}).get('role') or payload.get('role')
            if roles and user_role not in roles:
                return jsonify({'error': 'Forbidden.'}), 403

            g.user_id = payload.get('sub')
            g.user_role = user_role
            g.user_email = payload.get('email')
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
