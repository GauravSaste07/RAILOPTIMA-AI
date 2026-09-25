import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exported, setExported] = useState(false);

  // Metrics State
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

  // Fetch all metrics
  const fetchAllReportMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Total count
      const { count: exactTotalCount, error: countErr } = await supabase
        .from('maintenance_requests')
        .select('*', { count: 'exact', head: true });

      if (countErr) throw countErr;

      // 2. Departments lookup
      const { data: deptData } = await supabase
        .from('departments')
        .select('id, name');
      const deptMap = {};
      if (deptData) {
        deptData.forEach((d) => {
          deptMap[d.id] = d.name;
        });
      }

      // 3. Paginate through maintenance_requests
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

      // 4. Compute metrics
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
          if (['scheduled', 'in_progress', 'completed'].includes(st)) {
            scheduledRisks.push(risk);
          } else if (['pending', 'scored', 'proposed'].includes(st)) {
            unscheduledRisks.push(risk);
          }
        }

        if (r.conflict_flag === true) {
          conflictDetected++;
          if (['scheduled', 'in_progress', 'completed'].includes(st)) {
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

        const dName = deptMap[r.department_id] || 'General';
        if (!deptBreakdown[dName]) {
          deptBreakdown[dName] = { total: 0, scheduled: 0, conflicts: 0, risks: [] };
        }
        deptBreakdown[dName].total++;
        if (['scheduled', 'in_progress', 'completed'].includes(st)) deptBreakdown[dName].scheduled++;
        if (r.conflict_flag === true) deptBreakdown[dName].conflicts++;
        if (risk !== null) deptBreakdown[dName].risks.push(risk);

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

      // 5. Blocks table metrics
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

  // Export CSV summary
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
        ['Total Conflicts Detected', metrics.conflicts.detected],
        ['Resolved Conflicts', metrics.conflicts.resolved],
        ['  - Resolved via Scheduled Block', metrics.conflicts.resolvedScheduled],
        ['  - Resolved via Rejection', metrics.conflicts.resolvedRejected],
        ['Still Unresolved', metrics.conflicts.unresolved],
        ['  - Pending Review', metrics.conflicts.unresolvedPending],
        [],
        ['--- SECTION 3: RISK SCORE ANALYSIS ---'],
        ['Average Risk Score (Scheduled)', metrics.riskScores.avgScheduled.toFixed(4)],
        ['Average Risk Score (Unscheduled)', metrics.riskScores.avgUnscheduled.toFixed(4)],
        ['Average Risk Score (Overall)', metrics.riskScores.avgOverall.toFixed(4)],
        [],
        ['--- SECTION 4: CORRIDOR BLOCKS ---'],
        ['Total Corridor Blocks', metrics.blocksMetrics.total],
        ['Approved Blocks', metrics.blocksMetrics.approved],
        ['Proposed Blocks', metrics.blocksMetrics.proposed],
        ['Rejected Blocks', metrics.blocksMetrics.rejected],
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

  const scheduledPct = metrics.totalRequests > 0
    ? ((metrics.statusCounts.scheduled / metrics.totalRequests) * 100).toFixed(0)
    : '0';

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">System Reports & Impact Analytics</h1>
          <p className="text-xs font-mono text-slate-600 mt-1">
            Performance metrics, maintenance requests, and schedule resolution
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAllReportMetrics}
            disabled={loading}
            className="bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 px-3.5 py-2 rounded-lg text-xs font-mono transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
            title="Refresh statistics"
          >
            <span className={`material-symbols-outlined text-sm ${loading ? 'animate-spin' : ''}`}>refresh</span>
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="bg-blue-600 text-white font-semibold hover:bg-blue-700 px-4 py-2 rounded-lg text-xs font-mono transition-all flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            <span>{exported ? 'Downloaded' : 'Export CSV Report'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-2 text-xs font-mono shadow-xs">
          <span className="material-symbols-outlined text-base">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Requests */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 relative overflow-hidden shadow-xs flex flex-col justify-between">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600"></div>
          <div>
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xs font-mono text-slate-600 uppercase tracking-wider font-semibold">Total Requests</h3>
              <span className="material-symbols-outlined text-blue-700 text-xl">dataset</span>
            </div>
            <div className="text-3xl font-bold font-mono text-slate-800 mb-4">
              {loading ? '...' : metrics.totalRequests.toLocaleString()}
            </div>
          </div>
          <div className="pt-3 border-t border-slate-200 flex justify-between text-xs font-mono text-slate-600">
            <span>Reviewed: <strong className="text-slate-800">{metrics.statusCounts.scored}</strong></span>
            <span>Proposed: <strong className="text-amber-700">{metrics.statusCounts.proposed}</strong></span>
          </div>
        </div>

        {/* Card 2: Scheduled Work */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 relative overflow-hidden shadow-xs flex flex-col justify-between">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
          <div>
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xs font-mono text-slate-600 uppercase tracking-wider font-semibold">Scheduled Work</h3>
              <span className="material-symbols-outlined text-emerald-700 text-xl">event_available</span>
            </div>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-3xl font-bold font-mono text-emerald-700">
                {loading ? '...' : metrics.statusCounts.scheduled}
              </span>
              <span className="text-xs font-mono text-slate-600">
                ({scheduledPct}%)
              </span>
            </div>
          </div>
          <div className="pt-3 border-t border-slate-200 flex justify-between text-xs font-mono text-slate-600">
            <span>Pending: <strong className="text-slate-800">{metrics.statusCounts.pending}</strong></span>
            <span>Declined: <strong className="text-red-700">{metrics.statusCounts.rejected}</strong></span>
          </div>
        </div>

        {/* Card 3: Track Conflicts */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 relative overflow-hidden shadow-xs flex flex-col justify-between">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>
          <div>
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xs font-mono text-slate-600 uppercase tracking-wider font-semibold">Track Conflicts</h3>
              <span className="material-symbols-outlined text-amber-700 text-xl">warning</span>
            </div>
            <div className="text-3xl font-bold font-mono text-amber-700 mb-4">
              {loading ? '...' : metrics.conflicts.detected}
            </div>
          </div>
          <div className="pt-3 border-t border-slate-200 flex justify-between text-xs font-mono text-slate-600">
            <span>Resolved: <strong className="text-emerald-700">{metrics.conflicts.resolved}</strong></span>
            <span>Open: <strong className="text-amber-700">{metrics.conflicts.unresolved}</strong></span>
          </div>
        </div>

        {/* Card 4: Approved Blocks */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 relative overflow-hidden shadow-xs flex flex-col justify-between">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600"></div>
          <div>
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xs font-mono text-slate-600 uppercase tracking-wider font-semibold">Approved Blocks</h3>
              <span className="material-symbols-outlined text-blue-700 text-xl">lock</span>
            </div>
            <div className="text-3xl font-bold font-mono text-slate-800 mb-4">
              {loading ? '...' : metrics.blocksMetrics.approved}
            </div>
          </div>
          <div className="pt-3 border-t border-slate-200 flex justify-between text-xs font-mono text-slate-600">
            <span>Proposed: <strong className="text-blue-700">{metrics.blocksMetrics.proposed}</strong></span>
            <span>Total: <strong className="text-slate-800">{metrics.blocksMetrics.total}</strong></span>
          </div>
        </div>
      </div>

      {/* Resolution Breakdown */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Conflict Resolution Progress</h2>
            <p className="text-xs font-mono text-slate-600 mt-0.5">
              Automated resolution of overlapping track maintenance requests
            </p>
          </div>
          <div className="px-3 py-1 rounded-full bg-slate-50 text-amber-700 border border-amber-200 text-xs font-mono font-semibold">
            {metrics.conflicts.detected} Total Flagged
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-mono text-slate-600">
            <span>Resolved: <strong className="text-emerald-700">{metrics.conflicts.resolved}</strong></span>
            <span>Unresolved: <strong className="text-amber-700">{metrics.conflicts.unresolved}</strong></span>
          </div>
          <div className="h-4 w-full bg-slate-50 rounded-full overflow-hidden flex border border-slate-200">
            <div
              style={{
                width: `${metrics.conflicts.detected > 0 ? (metrics.conflicts.resolved / metrics.conflicts.detected) * 100 : 0}%`,
              }}
              className="h-full bg-emerald-500 transition-all duration-500"
            ></div>
            <div
              style={{
                width: `${metrics.conflicts.detected > 0 ? (metrics.conflicts.unresolved / metrics.conflicts.detected) * 100 : 100}%`,
              }}
              className="h-full bg-amber-500 transition-all duration-500"
            ></div>
          </div>
        </div>

        {/* Resolution Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          <div className="bg-slate-50 p-4 rounded-xl border border-emerald-200 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-700">
              <span className="material-symbols-outlined text-base">check_circle</span>
              <span>Resolved ({metrics.conflicts.resolved})</span>
            </div>
            <div className="text-xs font-mono text-slate-600 space-y-1.5">
              <div className="flex justify-between">
                <span>Coordinated into Scheduled Blocks:</span>
                <strong className="text-slate-800">{metrics.conflicts.resolvedScheduled}</strong>
              </div>
              <div className="flex justify-between">
                <span>Rescheduled or Declined:</span>
                <strong className="text-slate-800">{metrics.conflicts.resolvedRejected}</strong>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-amber-200 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-700">
              <span className="material-symbols-outlined text-base">schedule</span>
              <span>Pending Resolution ({metrics.conflicts.unresolved})</span>
            </div>
            <div className="text-xs font-mono text-slate-600 space-y-1.5">
              <div className="flex justify-between">
                <span>Awaiting Review in Request Pool:</span>
                <strong className="text-slate-800">{metrics.conflicts.unresolvedScored}</strong>
              </div>
              <div className="flex justify-between">
                <span>In Proposed Windows:</span>
                <strong className="text-slate-800">{metrics.conflicts.unresolvedProposed}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Department Breakdown */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Department Overview</h2>
            <p className="text-xs font-mono text-slate-600 mt-0.5">
              Maintenance workload across all departments
            </p>
          </div>
          <span className="text-xs font-mono font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            Active Divisions
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono divide-y divide-slate-200">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold uppercase">
                <th className="p-3.5">Department</th>
                <th className="p-3.5">Total Requests</th>
                <th className="p-3.5">Scheduled</th>
                <th className="p-3.5">Conflicts</th>
                <th className="p-3.5">Average Priority Risk</th>
                <th className="p-3.5 text-right">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {Object.entries(metrics.deptBreakdown).map(([deptName, dStats]) => {
                const avgRisk = dStats.risks.length > 0
                  ? (dStats.risks.reduce((a, b) => a + b, 0) / dStats.risks.length).toFixed(2)
                  : '0.00';
                const sharePct = metrics.totalRequests > 0
                  ? ((dStats.total / metrics.totalRequests) * 100).toFixed(0)
                  : '0';

                return (
                  <tr key={deptName} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 font-semibold text-blue-700">{deptName}</td>
                    <td className="p-3.5 text-slate-800">{dStats.total.toLocaleString()}</td>
                    <td className="p-3.5 text-emerald-700 font-semibold">{dStats.scheduled}</td>
                    <td className="p-3.5 text-amber-700">{dStats.conflicts}</td>
                    <td className="p-3.5 text-slate-700">{avgRisk}</td>
                    <td className="p-3.5 text-right text-slate-600">{sharePct}%</td>
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
