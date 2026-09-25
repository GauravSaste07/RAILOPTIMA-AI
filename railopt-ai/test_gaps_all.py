import sys; sys.path.insert(0, 'ml-service')
from corridor_availability import compute_available_windows
from optimizer import get_supabase_client
from datetime import datetime, timedelta
sb = get_supabase_client()
large_gaps = []
for i in range(7, 30):
    d = (datetime(2026, 9, 21) + timedelta(days=i)).strftime('%Y-%m-%d')
    windows = compute_available_windows('NDLS-GZB', d, request_department=None, sb=sb)
    large_gaps.extend([w for w in windows if w['duration_minutes'] >= 120])
print('Large gaps outside week 1 on NDLS-GZB:', len(large_gaps))
