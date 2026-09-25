import sys; sys.path.insert(0, 'ml-service')
from conflict_detection import get_supabase_client
sb = get_supabase_client()
sql = "UPDATE public.timetable_slots SET scheduled_arrival = scheduled_arrival + interval '14 days', scheduled_departure = scheduled_departure + interval '14 days';"
res = sb.rpc('exec_seed_sql', {'query_text': sql}).execute()
print('Shifted timetable successfully')
