import pytest
from datetime import date
from app.utils.deadline import calculate_deadline


def test_normal_date():
    result = calculate_deadline('2026-04-15')
    assert result == date(2026, 4, 29)


def test_none_input():
    result = calculate_deadline(None)
    assert result is None


def test_empty_string():
    result = calculate_deadline('')
    assert result is None


def test_leap_year_boundary():
    # 2028 is a leap year; Feb 29 + 14 = Mar 14
    result = calculate_deadline('2028-02-29')
    assert result == date(2028, 3, 14)


def test_non_leap_year_feb():
    # 2026 is not a leap year; Feb 28 + 14 = Mar 14
    result = calculate_deadline('2026-02-28')
    assert result == date(2026, 3, 14)


def test_month_boundary():
    result = calculate_deadline('2026-01-25')
    assert result == date(2026, 2, 8)


def test_year_boundary():
    result = calculate_deadline('2025-12-25')
    assert result == date(2026, 1, 8)
