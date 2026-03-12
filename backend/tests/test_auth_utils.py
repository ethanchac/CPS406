import pytest
from app.utils.auth import validate_password


def test_valid_password():
    errors = validate_password('Secure!1pass')
    assert errors == []


def test_too_short():
    errors = validate_password('Ab1!')
    assert any('8 characters' in e for e in errors)


def test_no_uppercase():
    errors = validate_password('secure!1pass')
    assert any('uppercase' in e for e in errors)


def test_no_digit():
    errors = validate_password('Secure!pass')
    assert any('digit' in e for e in errors)


def test_no_special():
    errors = validate_password('Secure1pass')
    assert any('special' in e for e in errors)


def test_all_failures():
    errors = validate_password('abc')
    assert len(errors) == 4
