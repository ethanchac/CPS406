import pytest
import io
from unittest.mock import patch, MagicMock


@pytest.fixture
def client():
    with patch('app.services.supabase.get_supabase'):
        from app import create_app
        app = create_app()
        app.config['TESTING'] = True
        app.config['SUPABASE_JWT_SECRET'] = 'test-secret'
        with app.test_client() as c:
            yield c


def make_jwt(role='student', user_id='student-uuid'):
    import jwt
    payload = {
        'sub': user_id,
        'email': 'test@torontomu.ca',
        'user_metadata': {'role': role},
        'role': role
    }
    return jwt.encode(payload, 'test-secret', algorithm='HS256')


def mock_supabase_for_report(has_existing_report=False):
    sb = MagicMock()
    # Active work term
    wt_mock = MagicMock()
    wt_mock.data = [{'id': 'term-uuid'}]
    sb.table.return_value.select.return_value.eq.return_value.eq.return_value.limit.return_value.execute.return_value = wt_mock

    # Existing report check
    report_mock = MagicMock()
    report_mock.data = [{'id': 'report-uuid'}] if has_existing_report else []
    sb.table.return_value.select.return_value.eq.return_value.execute.return_value = report_mock

    # Insert
    insert_mock = MagicMock()
    insert_mock.data = [{'id': 'new-report-uuid', 'submitted_at': '2026-04-10T14:22:00Z'}]
    sb.table.return_value.insert.return_value.execute.return_value = insert_mock
    return sb


def test_report_upload_valid_pdf(client):
    pdf_bytes = b'%PDF-1.4 fake content here'
    with patch('app.blueprints.students.get_supabase', return_value=mock_supabase_for_report()), \
         patch('app.blueprints.students.upload_file', return_value='reports/path.pdf'):
        res = client.post(
            '/api/v1/students/me/reports',
            data={'file': (io.BytesIO(pdf_bytes), 'report.pdf', 'application/pdf')},
            content_type='multipart/form-data',
            headers={'Authorization': f'Bearer {make_jwt()}'}
        )
        assert res.status_code == 201


def test_report_upload_non_pdf(client):
    not_pdf = b'This is not a pdf file at all'
    with patch('app.blueprints.students.get_supabase', return_value=mock_supabase_for_report()):
        res = client.post(
            '/api/v1/students/me/reports',
            data={'file': (io.BytesIO(not_pdf), 'report.docx', 'application/pdf')},
            content_type='multipart/form-data',
            headers={'Authorization': f'Bearer {make_jwt()}'}
        )
        assert res.status_code == 422


def test_report_upload_too_large(client):
    pdf_bytes = b'%PDF' + b'x' * (3 * 1024 * 1024)  # 3 MB
    with patch('app.blueprints.students.get_supabase', return_value=mock_supabase_for_report()):
        res = client.post(
            '/api/v1/students/me/reports',
            data={'file': (io.BytesIO(pdf_bytes), 'big.pdf', 'application/pdf')},
            content_type='multipart/form-data',
            headers={'Authorization': f'Bearer {make_jwt()}'}
        )
        assert res.status_code == 422


def test_report_duplicate(client):
    pdf_bytes = b'%PDF-1.4 content'
    with patch('app.blueprints.students.get_supabase', return_value=mock_supabase_for_report(has_existing_report=True)):
        res = client.post(
            '/api/v1/students/me/reports',
            data={'file': (io.BytesIO(pdf_bytes), 'report.pdf', 'application/pdf')},
            content_type='multipart/form-data',
            headers={'Authorization': f'Bearer {make_jwt()}'}
        )
        assert res.status_code == 409
