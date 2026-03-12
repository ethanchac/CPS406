import os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_mail import Mail
from dotenv import load_dotenv

load_dotenv()

mail = Mail()


def create_app():
    app = Flask(__name__)

    # Config
    app.config['SECRET_KEY'] = os.getenv('FLASK_SECRET_KEY', 'dev-secret-key')
    app.config['SUPABASE_URL'] = os.getenv('SUPABASE_URL')
    app.config['SUPABASE_SERVICE_ROLE_KEY'] = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    app.config['SUPABASE_JWT_SECRET'] = os.getenv('SUPABASE_JWT_SECRET')

    # Mail config
    app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
    app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
    app.config['MAIL_USE_TLS'] = True
    app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
    app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
    app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER', 'coop@torontomu.ca')

    # CORS
    allowed_origins = os.getenv('ALLOWED_ORIGINS', 'http://localhost:5173').split(',')
    CORS(app, origins=allowed_origins, supports_credentials=True)

    # Mail
    mail.init_app(app)

    # Register blueprints
    from app.blueprints.auth import auth_bp
    from app.blueprints.students import students_bp
    from app.blueprints.coordinator import coordinator_bp
    from app.blueprints.supervisor import supervisor_bp

    app.register_blueprint(auth_bp, url_prefix='/api/v1/auth')
    app.register_blueprint(students_bp, url_prefix='/api/v1/students')
    app.register_blueprint(coordinator_bp, url_prefix='/api/v1/coordinator')
    app.register_blueprint(supervisor_bp, url_prefix='/api/v1/supervisor')

    @app.route('/api/v1/health')
    def health():
        return jsonify({'status': 'ok'})

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'error': 'Not found.'}), 404

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({'error': 'An internal server error occurred.'}), 500

    return app
