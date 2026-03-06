from datetime import date, timedelta


def calculate_deadline(end_date_str: str | None) -> date | None:
    if not end_date_str:
        return None
    end_date = date.fromisoformat(end_date_str)
    return end_date + timedelta(days=14)
