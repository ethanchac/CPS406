import pytest
import json
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


def make_jwt(role='supervisor'):
    import jwt
    payload = {'sub': 'sup-uuid', 'email': 'sup@company.com', 'user_metadata': {'role': role}, 'role': role}
    return jwt.encode(payload, 'test-secret', algorithm='HS256')


def mock_supabase_for_eval(has_existing=False):
    sb = MagicMock()
    job_mock = MagicMock()
    job_mock.data = [{'id': 'assign-uuid'}]
    sb.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = job_mock

    existing_mock = MagicMock()
    existing_mock.data = [{'id': 'eval-uuid'}] if has_existing else []
    sb.table.return_value.select.return_value.eq.return_value.execute.return_value = existing_mock

    insert_mock = MagicMock()
    insert_mock.data = [{'id': 'new-eval-uuid'}]
    sb.table.return_value.insert.return_value.execute.return_value = insert_mock
    return sb


def test_digital_form_success(client):
    with patch('app.blueprints.supervisor.get_supabase', return_value=mock_supabase_for_eval()):
        res = client.post(
            '/api/v1/supervisor/evaluations/assign-uuid/form',
            json={'behaviourScore': 4, 'skillsScore': 5, 'knowledgeScore': 4, 'attitudeScore': 3, 'comments': 'Great work.'},
            headers={'Authorization': f'Bearer {make_jwt()}'}
        )
        assert res.status_code == 201


def test_digital_form_missing_score(client):
    with patch('app.blueprints.supervisor.get_supabase', return_value=mock_supabase_for_eval()):
        res = client.post(
            '/api/v1/supervisor/evaluations/assign-uuid/form',
            json={'behaviourScore': 4, 'skillsScore': 5, 'knowledgeScore': 4},
            headers={'Authorization': f'Bearer {make_jwt()}'}
        )
        assert res.status_code == 422
        data = json.loads(res.data)
        fields = [e['field'] for e in data['errors']]
        assert 'attitudeScore' in fields


def test_digital_form_score_out_of_range(client):
    with patch('app.blueprints.supervisor.get_supabase', return_value=mock_supabase_for_eval()):
        res = client.post(
            '/api/v1/supervisor/evaluations/assign-uuid/form',
            json={'behaviourScore': 6, 'skillsScore': 5, 'knowledgeScore': 4, 'attitudeScore': 3},
            headers={'Authorization': f'Bearer {make_jwt()}'}
        )
        assert res.status_code == 422


def test_pdf_upload_success(client):
    pdf_bytes = b'%PDF-1.4 valid pdf content'
    with patch('app.blueprints.supervisor.get_supabase', return_value=mock_supabase_for_eval()), \
         patch('app.blueprints.supervisor.upload_file', return_value='evaluations/path.pdf'):
        res = client.post(
            '/api/v1/supervisor/evaluations/assign-uuid/upload',
            data={'file': (io.BytesIO(pdf_bytes), 'eval.pdf', 'application/pdf')},
            content_type='multipart/form-data',
            headers={'Authorization': f'Bearer {make_jwt()}'}
        )
        assert res.status_code == 201


def test_pdf_upload_wrong_type(client):
    docx_bytes = b'PK\x03\x04this is a zip/docx'
    with patch('app.blueprints.supervisor.get_supabase', return_value=mock_supabase_for_eval()):
        res = client.post(
            '/api/v1/supervisor/evaluations/assign-uuid/upload',
            data={'file': (io.BytesIO(docx_bytes), 'eval.docx', 'application/vnd.openxmlformats')},
            content_type='multipart/form-data',
            headers={'Authorization': f'Bearer {make_jwt()}'}
        )
        assert res.status_code == 422


def test_supervisor_registration_weak_password(client):
    with patch('app.blueprints.auth.get_supabase') as mock_sb:
        mock_sb.return_value.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
        res = client.post('/api/v1/auth/register/supervisor', json={
            'fullName': 'Jane Doe',
            'companyName': 'Acme',
            'workEmail': 'jane@acme.com',
            'password': 'weak'
        })
        assert res.status_code == 422


def test_supervisor_registration_success(client):
    with patch('app.blueprints.auth.get_supabase') as mock_sb:
        sb = mock_sb.return_value
        sb.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
        auth_user = MagicMock()
        auth_user.user.id = 'new-sup-uuid'
        sb.auth.admin.create_user.return_value = auth_user
        sb.table.return_value.insert.return_value.execute.return_value.data = [{}]
        res = client.post('/api/v1/auth/register/supervisor', json={
            'fullName': 'Jane Doe',
            'companyName': 'Acme Inc',
            'workEmail': 'jane@acme.com',
            'password': 'Secure!1Pass'
        })
        assert res.status_code == 201
