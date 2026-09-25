import sys; sys.path.insert(0, 'ml-service')
from corridor_availability import compute_available_windows
from optimizer import get_supabase_client
sb = get_supabase_client()
all_windows = compute_available_windows('NDLS-GZB', '2026-09-21', request_department=None, sb=sb)
print('First day gap sizes:', [w['duration_minutes'] for w in all_windows])
all_windows = compute_available_windows('NDLS-GZB', '2026-10-01', request_department=None, sb=sb)
print('Another day gap sizes:', [w['duration_minutes'] for w in all_windows])
