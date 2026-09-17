import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

export default function BlockOptimization() {
  const navigate = useNavigate();
  const [timeframe, setTimeframe] = useState('weekly'); // 'weekly' | 'monthly'
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [selectedCorridor, setSelectedCorridor] = useState('All');
  const [error, setError] = useState(null);

  // Current active plan
  const [currentPlan, setCurrentPlan] = useState(null);

  // Fetch optimization plan from backend API
  const fetchOptimizationPlan = async (horizon) => {
    try {
      setIsOptimizing(true);
      setError(null);

      const params = new URLSearchParams({
        horizon: horizon,
        start_date: '2026-09-07',
        persist_to_db: 'true',
      });

      const response = await fetch(`http://localhost:8000/optimize?${params.toString()}`);
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error (${response.status})`);
      }

      const data = await response.json();
      setCurrentPlan(data);
    } catch (err) {
      console.error('Optimization fetch error:', err);
      setError(err.message || 'Failed to connect to ML Optimization Service');
    } finally {
      setIsOptimizing(false);
    }
  };

  // Initial load on mount: fetch weekly baseline
  useEffect(() => {
    fetchOptimizationPlan('weekly');
  }, []);

  // Handle horizon toggle
  const handleTimeframeChange = (newTimeframe) => {
    if (newTimeframe === timeframe) return;
    setTimeframe(newTimeframe);
    fetchOptimizationPlan(newTimeframe);
  };

  // Handle manual "Generate Optimized Plan"
  const handleRunOptimizer = () => {
    fetchOptimizationPlan(timeframe);
  };

  // Extract unique corridor sections for filter dropdown
  const corridorOptions = useMemo(() => {
    if (!currentPlan?.blocks) return ['All'];
    const sections = new Set(currentPlan.blocks.map((b) => b.section_id).filter(Boolean));
    return ['All', ...Array.from(sections).sort()];
  }, [currentPlan]);

  // Filter blocks according to selected corridor
  const filteredBlocks = useMemo(() => {
    if (!currentPlan?.blocks) return [];
    if (selectedCorridor === 'All') return currentPlan.blocks;
    return currentPlan.blocks.filter((b) => (b.section_id || '').includes(selectedCorridor));
  }, [currentPlan, selectedCorridor]);

  // Helper formatting for window dates/times
  const formatWindowTime = (startTimeStr, endTimeStr) => {
    if (!startTimeStr || !endTimeStr) return 'N/A';
    try {
      const start = new Date(startTimeStr);
      const end = new Date(endTimeStr);
      const datePart = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
      const startH = String(start.getUTCHours()).padStart(2, '0');
      const startM = String(start.getUTCMinutes()).padStart(2, '0');
      const endH = String(end.getUTCHours()).padStart(2, '0');
      const endM = String(end.getUTCMinutes()).padStart(2, '0');
      const durMin = Math.round((end - start) / 60000);
      const durHours = Math.floor(durMin / 60);
      const durRemMin = durMin % 60;
      const durStr = durHours > 0 ? `${durHours}h ${durRemMin > 0 ? `${durRemMin}m` : ''}` : `${durMin}m`;
      return `${datePart}, ${startH}:${startM} - ${endH}:${endM} (${durStr.trim()})`;
    } catch {
      return `${startTimeStr.substring(0, 16)} - ${endTimeStr.substring(11, 16)}`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-between font-mono text-sm">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">error</span>
            <span>Error: {error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-white cursor-pointer">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* What-If Active Banner */}
      {/* Top Control Bar */}
      <section className="glass-panel rounded-xl p-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-[#192122]/90 border border-[#3b494c]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <button
            onClick={handleRunOptimizer}
            disabled={isOptimizing}
            id="btn-run-optimizer"
            className="bg-[#00e5ff] text-[#00363d] font-bold px-6 py-2.5 rounded-lg flex items-center gap-2 glow-btn hover:bg-[#c3f5ff] transition-all cursor-pointer disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-[20px] ${isOptimizing ? 'animate-spin' : ''}`}>
              model_training
            </span>
            {isOptimizing ? 'Running CP-SAT Solver...' : 'Generate Optimized Plan'}
          </button>

          <div className="flex items-center bg-[#2e3638] rounded-lg p-1 border border-[#3b494c]">
            <button
              onClick={() => handleTimeframeChange('weekly')}
              id="btn-toggle-weekly"
              disabled={isOptimizing}
              className={`px-4 py-1.5 rounded-md text-xs font-mono font-medium transition-all cursor-pointer ${
                timeframe === 'weekly' ? 'bg-[#192122] text-[#00e5ff] shadow-sm' : 'text-[#bac9cc] hover:text-[#dce4e5]'
              }`}
            >
              Weekly: 7 Days
            </button>
            <button
              onClick={() => handleTimeframeChange('monthly')}
              id="btn-toggle-monthly"
              disabled={isOptimizing}
              className={`px-4 py-1.5 rounded-md text-xs font-mono font-medium transition-all cursor-pointer ${
                timeframe === 'monthly' ? 'bg-[#192122] text-[#00e5ff] shadow-sm' : 'text-[#bac9cc] hover:text-[#dce4e5]'
              }`}
            >
              Monthly: 30 Days
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end lg:self-auto">
          <div className="flex items-center gap-2 bg-[#192122] px-3.5 py-1.5 rounded-full border border-[#00e5ff]/30">
            <span className="w-2 h-2 rounded-full bg-[#00e5ff] animate-pulse"></span>
            <span className="font-mono text-xs text-[#00e5ff] tracking-tight" id="badge-solver-summary">
              Solver: OR-Tools {currentPlan?.solver_method ? currentPlan.solver_method.toUpperCase() : 'CP-SAT'} (
              {currentPlan?.solver_time_seconds != null ? `${currentPlan.solver_time_seconds}s` : '1.15s'})
            </span>
          </div>
        </div>
      </section>

      {/* KPI Tiles */}
      <section className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-4">
        {/* KPI 1: Scheduled Blocks */}
        <div className="glass-panel p-5 rounded-xl flex flex-col gap-2 bg-[#192122]/80 border border-[#3b494c]">
          <div className="flex justify-between items-center text-[#bac9cc]">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider">Total Scheduled Blocks</span>
            <span className="material-symbols-outlined text-[18px] text-[#00e5ff]">calendar_view_week</span>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-black text-[#dce4e5] font-mono tracking-tighter" id="kpi-scheduled-blocks">
              {currentPlan ? currentPlan.scheduled_blocks_count : '—'}
            </div>
          </div>
          <div className="text-[11px] font-mono text-[#849396]">
            Covering {currentPlan?.scheduled_requests_count || 0} maintenance requests
          </div>
        </div>

        {/* KPI 2: Co-Allocated Rate / Count */}
        <div className="glass-panel p-5 rounded-xl flex flex-col gap-2 bg-[#192122]/80 border border-[#3b494c]">
          <div className="flex justify-between items-center text-[#bac9cc]">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider">Co-Allocated Blocks</span>
            <span className="material-symbols-outlined text-[18px] text-purple-400">merge_type</span>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-black text-purple-400 font-mono tracking-tighter" id="kpi-coallocated-blocks">
              {currentPlan ? currentPlan.co_allocated_blocks_count : '—'}
            </div>
          </div>
          <div className="text-[11px] font-mono text-[#849396]">
            {currentPlan?.scheduled_blocks_count
              ? `${Math.round(
                  ((currentPlan.co_allocated_blocks_count || 0) / currentPlan.scheduled_blocks_count) * 100
                )}% multi-department share rate`
              : 'Multi-dept shared closures'}
          </div>
        </div>

        {/* KPI 3: Solver Status & Horizon */}
        <div className="glass-panel p-5 rounded-xl flex flex-col gap-2 bg-[#192122]/80 border border-[#3b494c]">
          <div className="flex justify-between items-center text-[#bac9cc]">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider">Horizon & Solver</span>
            <span className="material-symbols-outlined text-[18px] text-[#98d0da]">functions</span>
          </div>
          <div className="text-lg font-bold font-mono text-[#00e5ff] truncate mt-1" id="kpi-solver-status">
            {currentPlan?.solver_method ? `CP-SAT ${currentPlan.solver_method.toUpperCase()}` : 'CP-SAT Global Optimal'}
          </div>
          <div className="text-[11px] font-mono text-[#849396]" id="kpi-horizon-range">
            {currentPlan?.date_range
              ? `${currentPlan.date_range.start} → ${currentPlan.date_range.end}`
              : 'Corridor Optimization Engine'}
          </div>
        </div>
      </section>

      {/* Main Split Layout */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Optimized Block Schedule */}
        <div className="lg:col-span-2 glass-panel rounded-xl border border-[#3b494c] flex flex-col overflow-hidden bg-[#192122]/90">
          <div className="border-b border-[#3b494c] p-4 bg-[#080f11]/60 flex flex-wrap justify-between items-center gap-3">
            <div>
              <h3 className="font-bold text-[#dce4e5] text-base flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00e5ff]">view_timeline</span>
                AI Optimized Maintenance Block Roster
              </h3>
              <p className="text-xs text-[#bac9cc]">
                Shadow block alignments and non-conflicting corridors ({filteredBlocks.length} blocks)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[#bac9cc]">Corridor:</span>
              <select
                value={selectedCorridor}
                onChange={(e) => setSelectedCorridor(e.target.value)}
                id="select-corridor-filter"
                className="bg-[#2e3638] border border-[#3b494c] rounded px-2.5 py-1 text-xs text-[#dce4e5] font-mono outline-none cursor-pointer"
              >
                {corridorOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt === 'All' ? 'All Corridors' : opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[640px]" id="block-roster-container">
            {filteredBlocks.length === 0 ? (
              <div className="text-center py-12 text-[#849396] font-mono text-sm">
                <span className="material-symbols-outlined text-4xl block mb-2 text-[#3b494c]">event_busy</span>
                {isOptimizing ? 'Solving mathematical constraints...' : 'No maintenance blocks found for selected filter.'}
              </div>
            ) : (
              filteredBlocks.map((blk, idx) => (
                <div
                  key={blk.id || idx}
                  className="p-4 rounded-lg bg-[#242b2d] border border-[#3b494c] hover:border-[#00e5ff]/50 transition-all space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-[#00e5ff]/20 text-[#00e5ff] border border-[#00e5ff]/30">
                        {blk.id ? `BLK-${blk.id.substring(0, 8)}` : `BLK-${idx + 1}`}
                      </span>
                      <span className="font-bold text-[#dce4e5] text-sm">{blk.section_id}</span>
                      {blk.co_allocated && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">join_inner</span>
                          Co-Allocated ({blk.requests_count || blk.request_ids?.length || 2} Depts)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono text-[#00daf3] bg-[#00daf3]/10 border border-[#00daf3]/20">
                        Conf: {Math.round((blk.confidence || 0.95) * 100)}%
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        {blk.status ? blk.status.toUpperCase() : 'PROPOSED'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-[#192122] p-3 rounded-lg border border-[#3b494c]/40 font-mono">
                    <div>
                      <span className="text-[#849396] block text-[11px]">Departments Involved:</span>
                      <span className="text-[#dce4e5] font-semibold">
                        {(blk.departments || []).join(' • ') || 'Engineering'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#849396] block text-[11px]">Assigned Window:</span>
                      <span className="text-[#00e5ff] font-semibold">
                        {formatWindowTime(blk.start_time, blk.end_time)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#849396] block text-[11px]">Included Request IDs:</span>
                      <span className="text-purple-300 font-semibold break-all">
                        {(blk.request_ids || []).join(', ')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#849396] block text-[11px]">Total Block Risk Score:</span>
                      <span className="text-emerald-400 font-semibold">
                        {blk.total_risk_score != null ? Number(blk.total_risk_score).toFixed(4) : '0.0000'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Corridor Actions & Shadow Allocation Logic */}
        <div className="space-y-6">
          {/* Shadow Block Co-Allocation Logic Card */}
          <div className="glass-panel rounded-xl p-5 border border-[#3b494c] bg-[#192122]/90 space-y-4">
            <h3 className="font-bold text-base text-[#dce4e5] flex items-center gap-2 border-b border-[#3b494c] pb-3">
              <span className="material-symbols-outlined text-[#00e5ff]">auto_fix_high</span>
              Shadow Block Co-Allocation Logic
            </h3>

            <div className="space-y-3 text-xs text-[#bac9cc] leading-relaxed">
              <p>
                <strong className="text-[#00e5ff]">Multi-Department Bundling:</strong> Cross-department maintenance
                requests on the same section within a 30-minute time window are automatically bundled into single corridor
                closures.
              </p>
              <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg text-purple-300 font-mono text-[11px]">
                <span className="font-bold block text-xs mb-1">⚡ Dynamic Bundling:</span>
                Traction Distribution (+20m buffer), Engineering, and S&T requests are co-scheduled to prevent repeated
                corridor closures.
              </div>
            </div>

            <div className="pt-2 border-t border-[#3b494c] space-y-2.5">
              <button
                onClick={() => navigate('/admin-approval')}
                className="w-full bg-[#00e5ff] hover:bg-[#c3f5ff] text-[#00363d] font-bold py-2.5 px-4 rounded-lg transition-all flex items-center justify-center gap-2 glow-btn cursor-pointer text-sm"
              >
                <span>Publish Plan to Admin Approval</span>
                <span className="material-symbols-outlined text-sm">assignment_turned_in</span>
              </button>
              <button
                onClick={() => navigate('/calendar')}
                className="w-full bg-transparent border border-[#3b494c] hover:bg-[#2e3638] text-[#dce4e5] font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">calendar_month</span>
                Inspect Gantt Calendar
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

