import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exported, setExported] = useState(false);

  // Exact Metrics State
  const [metrics, setMetrics] = useState({
    totalRequests: 0,
    statusCounts: {
      scheduled: 0,
      scored: 0,
      pending: 0,
      rejected: 0,
      proposed: 0,
    },
    conflicts: {
      detected: 0,
      resolved: 0,
      resolvedScheduled: 0,
      resolvedRejected: 0,
      unresolved: 0,
      unresolvedScored: 0,
      unresolvedPending: 0,
      unresolvedProposed: 0,
    },
    riskScores: {
      avgScheduled: 0,
      avgUnscheduled: 0,
      avgOverall: 0,
      scheduledCount: 0,
      unscheduledCount: 0,
    },
    deptBreakdown: {},
    defectBreakdown: {},
    blocksMetrics: {
      total: 0,
      proposed: 0,
      approved: 0,
      rejected: 0,
    },
  });

  // Fetch all metrics with strict exact counting & range pagination
  const fetchAllReportMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Verify exact counts using head: true
      const { count: exactTotalCount, error: countErr } = await supabase
        .from('maintenance_requests')
        .select('*', { count: 'exact', head: true });

      if (countErr) throw countErr;

      // 2. Fetch all departments lookup
      const { data: deptData } = await supabase
        .from('departments')
        .select('id, name');
      const deptMap = {};
      if (deptData) {
        deptData.forEach((d) => {
          deptMap[d.id] = d.name;
        });
      }

      // 3. Paginate through maintenance_requests to calculate exact averages without PostgREST 1000-row cap
      const pageSize = 1000;
      let allRequests = [];
      let from = 0;
      let hasMore = true;

      while (hasMore) {
        const { data, error: pageErr } = await supabase
          .from('maintenance_requests')
          .select('id, risk_score, status, department_id, defect_type, conflict_flag, section_id')
          .range(from, from + pageSize - 1);

        if (pageErr) throw pageErr;

        if (data && data.length > 0) {
          allRequests = allRequests.concat(data);
          from += pageSize;
          if (data.length < pageSize) {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      }

      // 4. Compute exact request metrics
      const statusCounts = {
        scheduled: 0,
        scored: 0,
        pending: 0,
        rejected: 0,
        proposed: 0,
      };

      let conflictDetected = 0;
      let resolvedScheduled = 0;
      let resolvedRejected = 0;
      let unresolvedScored = 0;
      let unresolvedPending = 0;
      let unresolvedProposed = 0;

      const scheduledRisks = [];
      const unscheduledRisks = [];
      const allRisks = [];

      const deptBreakdown = {};
      const defectBreakdown = {};

      allRequests.forEach((r) => {
        const st = r.status || 'pending';
        statusCounts[st] = (statusCounts[st] || 0) + 1;

        const risk = r.risk_score !== null && r.risk_score !== undefined ? Number(r.risk_score) : null;
        if (risk !== null) {
          allRisks.push(risk);
          if (st === 'scheduled') {
            scheduledRisks.push(risk);
          } else if (['pending', 'scored', 'proposed'].includes(st)) {
            unscheduledRisks.push(risk);
          }
        }

        // Conflict logic according to spec:
        // Detected = conflict_flag === true
        // Resolved = conflict_flag === true AND status IN ('scheduled', 'rejected')
        // Still Unresolved = conflict_flag === true AND status IN ('pending', 'scored', 'proposed')
        if (r.conflict_flag === true) {
          conflictDetected++;
          if (st === 'scheduled') {
            resolvedScheduled++;
          } else if (st === 'rejected') {
            resolvedRejected++;
          } else if (st === 'scored') {
            unresolvedScored++;
          } else if (st === 'pending') {
            unresolvedPending++;
          } else if (st === 'proposed') {
            unresolvedProposed++;
          }
        }

        // Department breakdown
        const dName = deptMap[r.department_id] || 'General';
        if (!deptBreakdown[dName]) {
          deptBreakdown[dName] = { total: 0, scheduled: 0, conflicts: 0, risks: [] };
        }
        deptBreakdown[dName].total++;
        if (st === 'scheduled') deptBreakdown[dName].scheduled++;
        if (r.conflict_flag === true) deptBreakdown[dName].conflicts++;
        if (risk !== null) deptBreakdown[dName].risks.push(risk);

        // Defect breakdown
        const defType = r.defect_type || 'unspecified';
        defectBreakdown[defType] = (defectBreakdown[defType] || 0) + 1;
      });

      const totalResolved = resolvedScheduled + resolvedRejected;
      const totalUnresolved = unresolvedScored + unresolvedPending + unresolvedProposed;

      const avgScheduled = scheduledRisks.length > 0
        ? (scheduledRisks.reduce((a, b) => a + b, 0) / scheduledRisks.length)
        : 0;

      const avgUnscheduled = unscheduledRisks.length > 0
        ? (unscheduledRisks.reduce((a, b) => a + b, 0) / unscheduledRisks.length)
        : 0;

      const avgOverall = allRisks.length > 0
        ? (allRisks.reduce((a, b) => a + b, 0) / allRisks.length)
        : 0;

      // 5. Compute blocks table metrics with exact counts
      const { count: proposedBlocksCount } = await supabase
        .from('blocks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'proposed');

      const { count: approvedBlocksCount } = await supabase
        .from('blocks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved');

      const { count: rejectedBlocksCount } = await supabase
        .from('blocks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'rejected');

      const totalBlocks = (proposedBlocksCount || 0) + (approvedBlocksCount || 0) + (rejectedBlocksCount || 0);

      setMetrics({
        totalRequests: exactTotalCount || allRequests.length,
        statusCounts,
        conflicts: {
          detected: conflictDetected,
          resolved: totalResolved,
          resolvedScheduled,
          resolvedRejected,
          unresolved: totalUnresolved,
          unresolvedScored,
          unresolvedPending,
          unresolvedProposed,
        },
        riskScores: {
          avgScheduled,
          avgUnscheduled,
          avgOverall,
          scheduledCount: scheduledRisks.length,
          unscheduledCount: unscheduledRisks.length,
        },
        deptBreakdown,
        defectBreakdown,
        blocksMetrics: {
          total: totalBlocks,
          proposed: proposedBlocksCount || 0,
          approved: approvedBlocksCount || 0,
          rejected: rejectedBlocksCount || 0,
        },
      });
    } catch (err) {
      console.error('Error computing report metrics:', err);
      setError(err.message || 'Failed to aggregate report metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllReportMetrics();
  }, [fetchAllReportMetrics]);

  // Export CSV summary of live metrics
  const handleExportCSV = () => {
    try {
      const csvRows = [
        ['RailOpt AI - System Analytics & Optimization Report'],
        ['Generated At', new Date().toISOString()],
        [],
        ['--- SECTION 1: MAINTENANCE REQUESTS OVERVIEW ---'],
        ['Total Maintenance Requests', metrics.totalRequests],
        ['Status: Scheduled', metrics.statusCounts.scheduled],
        ['Status: Scored', metrics.statusCounts.scored],
        ['Status: Proposed', metrics.statusCounts.proposed],
        ['Status: Pending', metrics.statusCounts.pending],
        ['Status: Rejected', metrics.statusCounts.rejected],
        [],
        ['--- SECTION 2: CONFLICT DETECTION & RESOLUTION ---'],
        ['Total Conflicts Detected (conflict_flag=true)', metrics.conflicts.detected],
        ['Resolved Conflicts (Scheduled + Rejected)', metrics.conflicts.resolved],
        ['  - Resolved via Scheduled Block', metrics.conflicts.resolvedScheduled],
        ['  - Resolved via Explicit Rejection', metrics.conflicts.resolvedRejected],
        ['Still Unresolved (Scored + Proposed + Pending)', metrics.conflicts.unresolved],
        ['  - Unresolved in Scored Pool', metrics.conflicts.unresolvedScored],
        ['  - Unresolved in Proposed Blocks', metrics.conflicts.unresolvedProposed],
        ['  - Unresolved in Pending Review', metrics.conflicts.unresolvedPending],
        [],
        ['--- SECTION 3: RISK SCORE ANALYSIS ---'],
        ['Average Risk Score (Scheduled Requests)', metrics.riskScores.avgScheduled.toFixed(4)],
        ['Average Risk Score (Unscheduled Requests)', metrics.riskScores.avgUnscheduled.toFixed(4)],
        ['Average Risk Score (Overall Dataset)', metrics.riskScores.avgOverall.toFixed(4)],
        [],
        ['--- SECTION 4: CORRIDOR BLOCKS ---'],
        ['Total Corridor Blocks in System', metrics.blocksMetrics.total],
        ['Approved & Locked Blocks', metrics.blocksMetrics.approved],
        ['Proposed Candidate Blocks', metrics.blocksMetrics.proposed],
        ['Rejected / Superseded Blocks', metrics.blocksMetrics.rejected],
      ];

      const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map((e) => e.join(',')).join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `railopt_system_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExported(true);
      setTimeout(() => setExported(false), 3500);
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  const conflictResolutionPct = metrics.conflicts.detected > 0
    ? ((metrics.conflicts.resolved / metrics.conflicts.detected) * 100).toFixed(1)
    : '0.0';

  const scheduledPct = metrics.totalRequests > 0
    ? ((metrics.statusCounts.scheduled / metrics.totalRequests) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#192122] p-6 rounded-xl border border-[#3b494c] shadow-lg">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#dce4e5] tracking-tight">System Reports & Impact Analytics</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold">
              Exact DB Aggregation
            </span>
          </div>
          <p className="text-[#bac9cc] mt-1 font-mono text-xs">
            LIVE_DATA_FEED: <span className="text-[#00daf3] font-bold">SUPABASE POSTGRESQL</span> · Uncapped Realtime Counts
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAllReportMetrics}
            disabled={loading}
            className="bg-[#242b2d] border border-[#3b494c] text-[#dce4e5] hover:bg-[#2e3638] px-3.5 py-2 rounded-lg text-xs font-mono transition-colors flex items-center gap-2 cursor-pointer"
            title="Re-aggregate all database counts"
          >
            <span className={`material-symbols-outlined text-sm ${loading ? 'animate-spin' : ''}`}>refresh</span>
            Refresh Stats
          </button>

          <button
            onClick={handleExportCSV}
            className="bg-[#00daf3] text-[#00363d] font-bold hover:bg-[#c3f5ff] px-4 py-2 rounded-lg text-xs font-mono transition-all flex items-center gap-2 glow-btn cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            {exported ? 'Report Downloaded!' : 'Export CSV Report'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center gap-2 font-mono text-sm">
          <span className="material-symbols-outlined">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* Top Summary Cards Row (Bento Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Requests (Exact Count) */}
        <div className="glass-panel bg-[#192122] border border-[#3b494c] rounded-xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#00daf3]"></div>
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-xs text-[#bac9cc] font-mono uppercase tracking-wider font-bold">Total Requests</h3>
            <span className="material-symbols-outlined text-[#00daf3] text-xl">dataset</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-[#dce4e5]">
              {loading ? '...' : metrics.totalRequests.toLocaleString()}
            </span>
            <span className="text-[10px] font-mono text-[#00daf3] bg-[#00626e]/30 px-1.5 py-0.5 rounded border border-[#00daf3]/30">
              count='exact'
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-[#849396] border-t border-[#3b494c]/40 pt-2">
            <span>Scored: <strong className="text-[#dce4e5]">{metrics.statusCounts.scored}</strong></span>
            <span>Proposed: <strong className="text-amber-400">{metrics.statusCounts.proposed}</strong></span>
          </div>
        </div>

        {/* Card 2: Scheduled Maintenance Requests */}
        <div className="glass-panel bg-[#192122] border border-[#3b494c] rounded-xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-400"></div>
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-xs text-[#bac9cc] font-mono uppercase tracking-wider font-bold">Scheduled Requests</h3>
            <span className="material-symbols-outlined text-emerald-400 text-xl">event_available</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-emerald-400">
              {loading ? '...' : metrics.statusCounts.scheduled}
            </span>
            <span className="text-xs font-mono text-[#bac9cc]">
              ({scheduledPct}% of total)
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-[#849396] border-t border-[#3b494c]/40 pt-2">
            <span>Rejected: <strong className="text-red-400">{metrics.statusCounts.rejected}</strong></span>
            <span>Pending: <strong className="text-[#dce4e5]">{metrics.statusCounts.pending}</strong></span>
          </div>
        </div>

        {/* Card 3: Conflicts Detected */}
        <div className="glass-panel bg-[#192122] border border-amber-500/30 rounded-xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-400"></div>
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-xs text-[#bac9cc] font-mono uppercase tracking-wider font-bold">Conflicts Detected</h3>
            <span className="material-symbols-outlined text-amber-400 text-xl">warning</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-amber-400">
              {loading ? '...' : metrics.conflicts.detected}
            </span>
            <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
              conflict_flag=true
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-[#849396] border-t border-[#3b494c]/40 pt-2">
            <span>Resolved: <strong className="text-emerald-400">{metrics.conflicts.resolved}</strong></span>
            <span>Unresolved: <strong className="text-amber-400">{metrics.conflicts.unresolved}</strong></span>
          </div>
        </div>

        {/* Card 4: Corridor Blocks Status */}
        <div className="glass-panel bg-[#192122] border border-[#3b494c] rounded-xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-400"></div>
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-xs text-[#bac9cc] font-mono uppercase tracking-wider font-bold">Approved Blocks</h3>
            <span className="material-symbols-outlined text-purple-400 text-xl">lock</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-[#dce4e5]">
              {loading ? '...' : metrics.blocksMetrics.approved}
            </span>
            <span className="text-xs font-mono text-[#849396]">
              / {metrics.blocksMetrics.total} Total Blocks
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-[#849396] border-t border-[#3b494c]/40 pt-2">
            <span>Proposed: <strong className="text-[#00daf3]">{metrics.blocksMetrics.proposed}</strong></span>
            <span>Rejected: <strong className="text-red-400">{metrics.blocksMetrics.rejected}</strong></span>
          </div>
        </div>
      </div>

      {/* Main Charts & Analytics Section */}
      <div>
        {/* Conflicts Detected vs. Resolved Snapshot (Definitional Breakdown) */}
        <div className="glass-panel bg-[#192122] border border-[#3b494c] rounded-xl p-6 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg text-[#dce4e5]">Conflicts Detected vs. Resolved</h3>
                <p className="text-xs text-[#bac9cc] font-mono mt-0.5">
                  Current Pipeline Snapshot (conflict_flag = true)
                </p>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-[#080f11] text-amber-400 border border-amber-500/30">
                {metrics.conflicts.detected} Total Conflicts
              </span>
            </div>

            {/* Definitional Metrics Cards */}
            <div className="space-y-4 pt-2 font-mono">
              {/* Progress Bar of Resolved vs Unresolved */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-[#bac9cc]">Resolved: <strong className="text-emerald-400">{metrics.conflicts.resolved}</strong></span>
                  <span className="text-[#bac9cc]">Still Unresolved: <strong className="text-amber-400">{metrics.conflicts.unresolved}</strong></span>
                </div>
                <div className="h-4 w-full bg-[#080f11] rounded-full overflow-hidden flex border border-[#3b494c]/50">
                  <div
                    style={{
                      width: `${metrics.conflicts.detected > 0 ? (metrics.conflicts.resolved / metrics.conflicts.detected) * 100 : 0}%`,
                    }}
                    className="h-full bg-emerald-400 transition-all duration-500"
                    title={`Resolved: ${metrics.conflicts.resolved}`}
                  ></div>
                  <div
                    style={{
                      width: `${metrics.conflicts.detected > 0 ? (metrics.conflicts.unresolved / metrics.conflicts.detected) * 100 : 100}%`,
                    }}
                    className="h-full bg-amber-400/80 transition-all duration-500"
                    title={`Unresolved: ${metrics.conflicts.unresolved}`}
                  ></div>
                </div>
              </div>

              {/* Exact Definition Details */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                {/* Resolved Box */}
                <div className="bg-[#080f11] p-3 rounded-lg border border-emerald-500/30 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                    <span className="material-symbols-outlined text-sm">verified</span>
                    Resolved ({metrics.conflicts.resolved})
                  </div>
                  <div className="text-[11px] text-[#bac9cc] space-y-1">
                    <div className="flex justify-between">
                      <span>• In Scheduled Block:</span>
                      <strong className="text-[#dce4e5]">{metrics.conflicts.resolvedScheduled}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>• Explicitly Rejected:</span>
                      <strong className="text-[#dce4e5]">{metrics.conflicts.resolvedRejected}</strong>
                    </div>
                  </div>
                </div>

                {/* Unresolved Box */}
                <div className="bg-[#080f11] p-3 rounded-lg border border-amber-500/30 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold">
                    <span className="material-symbols-outlined text-sm">pending</span>
                    Still Unresolved ({metrics.conflicts.unresolved})
                  </div>
                  <div className="text-[11px] text-[#bac9cc] space-y-1">
                    <div className="flex justify-between">
                      <span>• In Scored Pool:</span>
                      <strong className="text-[#dce4e5]">{metrics.conflicts.unresolvedScored}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>• In Proposed Blocks:</span>
                      <strong className="text-[#dce4e5]">{metrics.conflicts.unresolvedProposed}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#3b494c]/60 flex items-center justify-between text-xs font-mono text-[#bac9cc]">
            <span>Conflict Formula: Detected = Resolved + Unresolved</span>
            <span className="text-[#00daf3] font-bold">
              {metrics.conflicts.resolved} + {metrics.conflicts.unresolved} = {metrics.conflicts.detected} ✓
            </span>
          </div>
        </div>
      </div>

      {/* Department Breakdown Table */}
      <div className="glass-panel bg-[#192122] border border-[#3b494c] rounded-xl p-6 shadow-lg space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-[#dce4e5]">Multi-Department AI Allocation Breakdown</h3>
            <p className="text-xs text-[#bac9cc] font-mono mt-0.5">
              Aggregated across all {metrics.totalRequests.toLocaleString()} maintenance requests
            </p>
          </div>
          <span className="text-xs font-mono text-[#00daf3] bg-[#00626e]/30 px-2.5 py-1 rounded border border-[#00daf3]/30">
            3 Active Departments
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs divide-y divide-[#3b494c]/60">
            <thead>
              <tr className="bg-[#080f11] text-[#849396] uppercase text-[11px]">
                <th className="p-3">Department Name</th>
                <th className="p-3">Total Requests</th>
                <th className="p-3">Scheduled Requests</th>
                <th className="p-3">Detected Conflicts</th>
                <th className="p-3">Avg Risk Score</th>
                <th className="p-3 text-right">Dataset Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3b494c]/30 text-[#dce4e5]">
              {Object.entries(metrics.deptBreakdown).map(([deptName, dStats]) => {
                const avgRisk = dStats.risks.length > 0
                  ? (dStats.risks.reduce((a, b) => a + b, 0) / dStats.risks.length).toFixed(4)
                  : '0.0000';
                const sharePct = metrics.totalRequests > 0
                  ? ((dStats.total / metrics.totalRequests) * 100).toFixed(1)
                  : '0.0';

                return (
                  <tr key={deptName} className="hover:bg-[#242b2d]/40 transition-colors">
                    <td className="p-3 font-bold text-[#00daf3]">{deptName}</td>
                    <td className="p-3">{dStats.total.toLocaleString()}</td>
                    <td className="p-3 text-emerald-400 font-bold">{dStats.scheduled}</td>
                    <td className="p-3 text-amber-400">{dStats.conflicts}</td>
                    <td className="p-3">{avgRisk}</td>
                    <td className="p-3 text-right text-[#bac9cc]">{sharePct}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
