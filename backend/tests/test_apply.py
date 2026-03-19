import pytest
import json
from unittest.mock import patch, MagicMock


@pytest.fixture
def client():
    with patch('app.services.supabase.get_supabase'):
        from app import create_app
        app = create_app()
        app.config['TESTING'] = True
        with app.test_client() as c:
            yield c


def mock_supabase_no_dup():
    sb = MagicMock()
    sb.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
    sb.table.return_value.insert.return_value.execute.return_value.data = [{'id': 'test-uuid'}]
    return sb


def mock_supabase_dup_id():
    sb = MagicMock()
    sb.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [{'id': 'existing'}]
    return sb


def test_apply_success(client):
    with patch('app.blueprints.students.get_supabase', return_value=mock_supabase_no_dup()):
        res = client.post('/api/v1/students/apply', json={
            'fullName': 'Aaron Tom',
            'studentId': '501297029',
            'email': 'aaron.tom@torontomu.ca'
        })
        assert res.status_code == 201
        data = json.loads(res.data)
        assert 'applicantId' in data


def test_apply_missing_email(client):
    with patch('app.blueprints.students.get_supabase', return_value=mock_supabase_no_dup()):
        res = client.post('/api/v1/students/apply', json={
            'fullName': 'Aaron Tom',
            'studentId': '501297029',
            'email': ''
        })
        assert res.status_code == 422
        data = json.loads(res.data)
        fields = [e['field'] for e in data['errors']]
        assert 'email' in fields


def test_apply_invalid_student_id(client):
    with patch('app.blueprints.students.get_supabase', return_value=mock_supabase_no_dup()):
        res = client.post('/api/v1/students/apply', json={
            'fullName': 'Aaron Tom',
            'studentId': '12345',
            'email': 'aaron.tom@torontomu.ca'
        })
        assert res.status_code == 422
        data = json.loads(res.data)
        fields = [e['field'] for e in data['errors']]
        assert 'studentId' in fields


def test_apply_wrong_email_domain(client):
    with patch('app.blueprints.students.get_supabase', return_value=mock_supabase_no_dup()):
        res = client.post('/api/v1/students/apply', json={
            'fullName': 'Aaron Tom',
            'studentId': '501297029',
            'email': 'aaron.tom@gmail.com'
        })
        assert res.status_code == 422


def test_apply_duplicate_student_id(client):
    with patch('app.blueprints.students.get_supabase', return_value=mock_supabase_dup_id()):
        res = client.post('/api/v1/students/apply', json={
            'fullName': 'Aaron Tom',
            'studentId': '501297029',
            'email': 'aaron.tom@torontomu.ca'
        })
        assert res.status_code == 409
