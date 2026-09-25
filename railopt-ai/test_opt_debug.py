import sys; sys.path.insert(0, 'ml-service')
from optimizer import optimize_maintenance_blocks
res = optimize_maintenance_blocks(horizon='monthly', start_date='2026-09-21', persist_to_db=False)
print('Total Candidate Requests:', res['total_candidate_requests'])
print('Scheduled Requests Count:', res['scheduled_requests_count'])
