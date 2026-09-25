import sys; sys.path.insert(0, 'ml-service')
from datetime import timedelta
from dateutil import parser
from conflict_detection import get_supabase_client
sb = get_supabase_client()
print('Fetching all timetable slots...')
all_slots = []
page = 0
page_size = 1000
while True:
    res = sb.table('timetable_slots').select('*').range(page * page_size, (page + 1) * page_size - 1).execute()
    data = res.data or []
    all_slots.extend(data)
    if len(data) < page_size: break
    page += 1
print(f'Fetched {len(all_slots)} slots.')
shift_days = 14
updates = []
for slot in all_slots:
    arr = parser.parse(slot['scheduled_arrival']) + timedelta(days=shift_days)
    dep = parser.parse(slot['scheduled_departure']) + timedelta(days=shift_days)
    updates.append({
        'id': slot['id'],
        'scheduled_arrival': arr.isoformat(),
        'scheduled_departure': dep.isoformat()
    })
print('Updating in batches...')
for i in range(0, len(updates), 1000):
    batch = updates[i:i+1000]
    sb.table('timetable_slots').upsert(batch).execute()
    print(f'Updated {i+len(batch)} slots')
print('Done!')
