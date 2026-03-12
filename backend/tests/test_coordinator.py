import pytest
import json
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


def make_jwt(role='coordinator'):
    import jwt
    payload = {'sub': 'coord-uuid', 'email': 'coord@torontomu.ca', 'user_metadata': {'role': role}, 'role': role}
    return jwt.encode(payload, 'test-secret', algorithm='HS256')


def test_dashboard_with_data(client):
    sb = MagicMock()
    sb.table.return_value.select.return_value.execute.return_value.data = [
        {'status': 'finally_accepted', 'applied_at': '2026-03-01T10:00:00Z'},
        {'status': 'rejected', 'applied_at': '2026-03-02T10:00:00Z'},
        {'status': 'pending', 'applied_at': '2026-03-03T10:00:00Z'},
    ]
    with patch('app.blueprints.coordinator.get_supabase', return_value=sb):
        res = client.get('/api/v1/coordinator/dashboard', headers={'Authorization': f'Bearer {make_jwt()}'})
        assert res.status_code == 200
        data = json.loads(res.data)
        assert data['totalApplicants'] == 3
        assert data['pending'] == 1


def test_dashboard_no_data(client):
    sb = MagicMock()
    sb.table.return_value.select.return_value.execute.return_value.data = []
    with patch('app.blueprints.coordinator.get_supabase', return_value=sb):
        res = client.get('/api/v1/coordinator/dashboard', headers={'Authorization': f'Bearer {make_jwt()}'})
        assert res.status_code == 200
        data = json.loads(res.data)
        assert data['totalApplicants'] == 0


def test_invalid_status_transition(client):
    sb = MagicMock()
    current_mock = MagicMock()
    current_mock.data = {'status': 'pending', 'email': 'a@torontomu.ca', 'full_name': 'A', 'student_id': '123456789'}
    sb.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = current_mock
    with patch('app.blueprints.coordinator.get_supabase', return_value=sb):
        res = client.patch(
            '/api/v1/coordinator/applicants/some-id/status',
            json={'status': 'finally_accepted'},
            headers={'Authorization': f'Bearer {make_jwt()}'}
        )
        assert res.status_code == 400


def test_valid_status_transition_pending_to_provisional(client):
    sb = MagicMock()
    current_mock = MagicMock()
    current_mock.data = {'status': 'pending', 'email': 'a@torontomu.ca', 'full_name': 'A', 'student_id': '123456789'}
    sb.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = current_mock
    sb.table.return_value.update.return_value.eq.return_value.execute.return_value.data = [{}]
    sb.auth.admin.create_user.return_value.user.id = 'new-user-uuid'
    sb.table.return_value.insert.return_value.execute.return_value.data = [{}]
    with patch('app.blueprints.coordinator.get_supabase', return_value=sb), \
         patch('app.blueprints.coordinator.send_welcome_email'):
        res = client.patch(
            '/api/v1/coordinator/applicants/some-id/status',
            json={'status': 'provisionally_accepted'},
            headers={'Authorization': f'Bearer {make_jwt()}'}
        )
        assert res.status_code in (200, 207)


def test_applicants_list_filtered_pending(client):
    sb = MagicMock()
    list_mock = MagicMock()
    list_mock.data = [{'id': '1', 'status': 'pending', 'full_name': 'A', 'student_id': '111111111', 'email': 'a@torontomu.ca', 'applied_at': '2026-03-01T00:00:00Z'}]
    list_mock.count = 1
    q = sb.table.return_value.select.return_value.order.return_value.eq.return_value.range.return_value
    q.execute.return_value = list_mock
    with patch('app.blueprints.coordinator.get_supabase', return_value=sb):
        res = client.get('/api/v1/coordinator/applicants?status=pending&page=1', headers={'Authorization': f'Bearer {make_jwt()}'})
        assert res.status_code == 200
