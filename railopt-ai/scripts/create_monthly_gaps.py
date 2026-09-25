import sys; sys.path.insert(0, 'ml-service')
from conflict_detection import get_supabase_client

sb = get_supabase_client()

sql = """
-- Delete afternoon trains on odd days in weeks 2-4
DELETE FROM public.timetable_slots
WHERE scheduled_arrival > '2026-09-27'
  AND EXTRACT(DAY FROM scheduled_arrival)::int % 2 = 1
  AND EXTRACT(HOUR FROM scheduled_arrival) BETWEEN 10 AND 14;

-- Delete night trains on even days in weeks 2-4
DELETE FROM public.timetable_slots
WHERE scheduled_arrival > '2026-09-27'
  AND EXTRACT(DAY FROM scheduled_arrival)::int % 2 = 0
  AND EXTRACT(HOUR FROM scheduled_arrival) BETWEEN 1 AND 5;
"""

print("Executing SQL to clear out large gaps in weeks 2-4...")
res = sb.rpc('exec_seed_sql', {'query_text': sql}).execute()
print("Success! Created gaps for the monthly optimizer.")
