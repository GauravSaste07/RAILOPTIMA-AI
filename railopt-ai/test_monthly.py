import sys; sys.path.insert(0, 'ml-service')
from optimizer import optimize_maintenance_blocks
res = optimize_maintenance_blocks(horizon='monthly', start_date='2026-09-21', persist_to_db=False)
print('Blocks generated:', len(res.get('blocks', [])))
print('Total scheduled requests:', res.get('scheduled_requests_count'))
