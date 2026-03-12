from app.services.supabase import get_supabase


def upload_file(bucket: str, path: str, file_bytes: bytes, content_type: str = 'application/pdf') -> str:
    supabase = get_supabase()
    supabase.storage.from_(bucket).upload(
        path,
        file_bytes,
        file_options={'content-type': content_type, 'upsert': 'false'}
    )
    return path


def get_signed_url(bucket: str, path: str, expires_in: int = 900) -> str:
    supabase = get_supabase()
    result = supabase.storage.from_(bucket).create_signed_url(path, expires_in)
    return result.get('signedURL') or result.get('signed_url', '')
