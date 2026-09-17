import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function RiskQueue() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('risk'); // 'risk' | 'newest'
  const [queueData, setQueueData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState(null);
  const [scoringLoading, setScoringLoading] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  // Helper to generate model feature importance bars
  const buildFeatureList = (item, liveScoreData = null) => {
    const overdue = Number(item.overdue_days || 0);
    const stress = Number(item.asset_stress_index || 0.5);
    const crit = String(item.criticality || 'Medium');
    const density = Number(item.section_traffic_density || 40.0);
    const defect = item.defect_type || 'track_defect';

    if (liveScoreData?.feature_breakdown) {
      const fb = liveScoreData.feature_breakdown;
      return [
        {
          name: fb.urgency?.factor_name || 'Urgency (overdue_days)',
          valueText: `${overdue} overdue days`,
          weight: Math.round((fb.urgency?.global_model_importance || 0.35) * 100),
          color: 'bg-red-500',
          text: 'text-red-400',
        },
        {
          name: fb.asset_stress?.factor_name || 'Asset Stress Index',
          valueText: `Stress: ${stress.toFixed(2)}`,
          weight: Math.round((fb.asset_stress?.global_model_importance || 0.25) * 100),
          color: 'bg-amber-500',
          text: 'text-amber-400',
        },
        {
          name: fb.criticality?.factor_name || 'Asset Base Criticality',
          valueText: `Rating: ${crit}`,
          weight: Math.round((fb.criticality?.global_model_importance || 0.18) * 100),
          color: 'bg-[#00daf3]',
          text: 'text-[#00daf3]',
        },
        {
          name: fb.traffic_density?.factor_name || 'Corridor Traffic Density',
          valueText: `${density} trains/day`,
          weight: Math.round((fb.traffic_density?.global_model_importance || 0.14) * 100),
          color: 'bg-[#98d0da]',
          text: 'text-[#98d0da]',
        },
        {
          name: fb.defect_type?.factor_name || 'Defect Classification',
          valueText: defect.replace(/_/g, ' '),
          weight: Math.round((fb.defect_type?.global_model_importance || 0.08) * 100),
          color: 'bg-[#b3ecf7]',
          text: 'text-[#b3ecf7]',
        },
      ];
    }

    // Default built-in global model feature importances from XGBoost model bundle
    return [
      {
        name: 'Urgency (overdue_days)',
        valueText: `${overdue} overdue days`,
        weight: 35,
        color: 'bg-red-500',
        text: 'text-red-400',
      },
      {
        name: 'Asset Stress Index',
        valueText: `Stress: ${stress.toFixed(2)}`,
        weight: 25,
        color: 'bg-amber-500',
        text: 'text-amber-400',
      },
      {
        name: 'Asset Base Criticality',
        valueText: `Rating: ${crit}`,
        weight: 18,
        color: 'bg-[#00daf3]',
        text: 'text-[#00daf3]',
      },
      {
        name: 'Corridor Traffic Density',
        valueText: `${density} trains/day`,
        weight: 14,
        color: 'bg-[#98d0da]',
        text: 'text-[#98d0da]',
      },
      {
        name: 'Defect Classification',
        valueText: defect.replace(/_/g, ' '),
        weight: 8,
        color: 'bg-[#b3ecf7]',
        text: 'text-[#b3ecf7]',
      },
    ];
  };

  const getInsightText = (item) => {
    if (item.conflicting_approved_block_id) {
      return 'High risk schedule overlap: Overlaps an already-approved corridor block. Rescheduling or alternate window selection recommended.';
    }
    if (item.conflicting_with) {
      return `Schedule conflict detected with concurrent maintenance request(s) (${item.conflicting_with}) on the same section. Co-allocation or time-shifting advised.`;
    }
    if (item.risk_score !== null && item.risk_score >= 0.7) {
      return 'Critical risk score evaluated by XGBoost model. Immediate priority window allocation recommended before cascade impact.';
    }
    if (item.risk_score !== null && item.risk_score >= 0.4) {
      return 'Moderate risk score. Standard preventive corridor maintenance slot suitable for shadow block bundling.';
    }
    return 'Low operational risk. Routine maintenance window clearance identified.';
  };

  const [realtimeActive, setRealtimeActive] = useState(false);

  // 1. Fetch live queue from Supabase maintenance_requests (uncapped pagination)
  const fetchQueue = useCallback(async () => {
    setLoading(true);
    try {
      let allRequests = [];
      let from = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('maintenance_requests')
          .select(`
            id,
            asset_id,
            section_id,
            defect_type,
            requested_window_start,
            requested_window_end,
            risk_score,
            conflict_flag,
            conflicting_with,
            conflicting_approved_block_id,
            status,
            overdue_days,
            asset_stress_index,
            criticality,
            section_traffic_density,
            department_id,
            created_at,
            departments(id, name)
          `)
          .in('status', ['pending', 'scored', 'proposed'])
          .order('risk_score', { ascending: false, nullsFirst: false })
          .range(from, from + pageSize - 1);

        if (error) {
          console.error('Error fetching maintenance requests for RiskQueue:', error);
          break;
        }

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

      if (allRequests.length > 0) {
        // Sort with nulls/pending risk_score last, then by risk_score desc
        const sorted = [...allRequests].sort((a, b) => {
          if (a.risk_score === null && b.risk_score === null) return 0;
          if (a.risk_score === null) return 1;
          if (b.risk_score === null) return -1;
          return Number(b.risk_score) - Number(a.risk_score);
        });

        const formatted = sorted.map((r) => {
          const score = r.risk_score !== null && r.risk_score !== undefined ? Number(r.risk_score) : null;
          return {
            ...r,
            riskScore: score,
            deptName: r.departments?.name || (
              r.defect_type === 'track_defect'
                ? 'Civil / Track'
                : r.defect_type === 'signal_fault'
                  ? 'Signal & Telecom'
                  : 'Traction (TRD)'
            ),
            features: buildFeatureList(r),
            insight: getInsightText(r),
          };
        });

        setQueueData(formatted);
        setSelectedReq((prev) => {
          if (prev) {
            const stillThere = formatted.find((x) => x.id === prev.id);
            return stillThere || null;
          }
          return null;
        });
      } else {
        setQueueData([]);
        setSelectedReq(null);
      }
    } catch (err) {
      console.error('Unexpected error loading RiskQueue:', err);
      setQueueData([]);
      setSelectedReq(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Supabase Realtime Subscription for live updates without manual page refresh
  useEffect(() => {
    fetchQueue();

    const channel = supabase
      .channel('risk-queue-realtime-sub')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'maintenance_requests',
        },
        (payload) => {
          console.log('[Realtime] maintenance_requests update detected:', payload.eventType);
          fetchQueue();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setRealtimeActive(true);
        } else {
          setRealtimeActive(false);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchQueue]);

  // 2. Filter & Sort requests based on tab, search query, and sort toggle
  const filteredQueue = useMemo(() => {
    const list = queueData.filter((item) => {
      if (filter === 'High Risk') {
        if (item.riskScore === null || item.riskScore < 0.7) return false;
      }
      if (filter === 'Conflict Detected') {
        const hasConflict = Boolean(item.conflict_flag || item.conflicting_with || item.conflicting_approved_block_id);
        if (!hasConflict) return false;
      }
      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchId = item.id?.toLowerCase().includes(q);
        const matchAsset = item.asset_id?.toLowerCase().includes(q);
        const matchSec = item.section_id?.toLowerCase().includes(q);
        const matchDept = item.deptName?.toLowerCase().includes(q);
        const matchDefect = item.defect_type?.toLowerCase().includes(q);
        if (!matchId && !matchAsset && !matchSec && !matchDept && !matchDefect) return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'newest') {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      } else {
        if (a.riskScore === null && b.riskScore === null) return 0;
        if (a.riskScore === null) return 1;
        if (b.riskScore === null) return -1;
        return Number(b.riskScore) - Number(a.riskScore);
      }
    });
  }, [queueData, filter, searchQuery, sortBy]);

  // 3. Row selection with dynamic feature breakdown from /score endpoint
  const handleSelect = async (item) => {
    setSelectedReq(item);
    setPanelOpen(true);

    // Call ML service /score endpoint to retrieve live breakdown if needed
    try {
      setScoringLoading(true);
      const res = await fetch('http://localhost:8000/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maintenance_request_id: item.id }),
      });

      if (res.ok) {
        const scoreData = await res.json();
        const updatedFeatures = buildFeatureList(item, scoreData);
        setSelectedReq((prev) => {
          if (prev?.id === item.id) {
            return {
              ...prev,
              riskScore: scoreData.risk_score !== undefined ? scoreData.risk_score : prev.riskScore,
              features: updatedFeatures,
              insight: getInsightText({
                ...prev,
                risk_score: scoreData.risk_score !== undefined ? scoreData.risk_score : prev.riskScore,
              }),
            };
          }
          return prev;
        });
      }
    } catch (scoreErr) {
      console.warn('ML Service /score live call warning (using cached breakdown):', scoreErr);
    } finally {
      setScoringLoading(false);
    }
  };

  const formatWindow = (startStr, endStr) => {
    if (!startStr || !endStr) return 'Window Pending';
    try {
      const s = new Date(startStr);
      const e = new Date(endStr);
      const datePart = s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const startTime = s.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      const endTime = e.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      return `${datePart}, ${startTime}-${endTime}`;
    } catch {
      return `${startStr.slice(5, 16)} - ${endStr.slice(11, 16)}`;
    }
  };

  const formatDefectLabel = (type) => {
    switch (type) {
      case 'track_defect':
        return 'Track Defect';
      case 'signal_fault':
        return 'Signal Fault';
      case 'traction_fault':
        return 'Traction / OHE Fault';
      default:
        return type ? type.replace(/_/g, ' ') : 'General Defect';
    }
  };

  return (
    <div className="flex flex-col gap-6 relative min-h-[calc(100vh-140px)]">
      {/* Main Content Area */}
      <div className="w-full space-y-4">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-[#dce4e5] tracking-tight flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00daf3]">query_stats</span>
                AI Risk Scoring Queue
              </h1>
              {realtimeActive && (
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold tracking-wider uppercase animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Live Sync Active
                </span>
              )}
            </div>
            <p className="text-sm text-[#bac9cc]">
              Real-time XGBoost risk predictions and conflict telemetry for active maintenance requests.
            </p>
          </div>
        </div>

        {/* Controls Toolbar: Tabs, Search Bar, Sort Toggle */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#192122] p-3 rounded-xl border border-[#3b494c]">
          {/* Left: Filter Tabs */}
          <div className="flex bg-[#242b2d] rounded-lg p-1 border border-[#3b494c]/60 shrink-0">
            {['All', 'High Risk', 'Conflict Detected'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${filter === tab
                    ? 'bg-[#2e3638] text-[#00daf3] shadow-sm font-bold'
                    : 'text-[#bac9cc] hover:text-[#dce4e5]'
                  }`}
              >
                {tab === 'High Risk' && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
                {tab === 'Conflict Detected' && <span className="w-2 h-2 rounded-full bg-amber-500"></span>}
                {tab}
              </button>
            ))}
          </div>

          {/* Center: Search Input */}
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[#849396] text-[16px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search by Request ID, Asset, Section..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#242b2d] border border-[#3b494c] rounded-lg py-1.5 pl-8 pr-8 text-xs font-mono text-[#dce4e5] placeholder:text-[#849396] focus:border-[#00daf3] focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#849396] hover:text-[#dce4e5] text-xs font-mono cursor-pointer"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Right: Sort Toggle & Refresh Button */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 bg-[#242b2d] px-2.5 py-1.5 rounded-lg border border-[#3b494c]/60">
              <span className="material-symbols-outlined text-[#849396] text-[16px]">sort</span>
              <span className="text-[11px] font-mono text-[#849396]">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-xs font-mono text-[#00daf3] font-bold outline-none cursor-pointer pr-1"
              >
                <option value="risk" className="bg-[#192122] text-[#dce4e5]">Highest Risk First</option>
                <option value="newest" className="bg-[#192122] text-[#dce4e5]">Newest First</option>
              </select>
            </div>

            <button
              onClick={fetchQueue}
              className="p-2 rounded-lg bg-[#242b2d] border border-[#3b494c] hover:bg-[#2e3638] text-[#bac9cc] transition-colors cursor-pointer"
              title="Refresh Queue from Database"
            >
              <span className={`material-symbols-outlined text-[16px] ${loading ? 'animate-spin text-[#00daf3]' : ''}`}>
                refresh
              </span>
            </button>
          </div>
        </div>

        {/* High-Density Table Card */}
        <div className="glass-panel rounded-xl overflow-hidden bg-[#192122]/90 border border-[#3b494c]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-[#080f11] border-b border-[#3b494c] text-xs uppercase tracking-wider text-[#bac9cc] font-mono">
                  <th className="py-3 px-4 font-semibold">Request ID</th>
                  <th className="py-3 px-4 font-semibold">Corridor Sec.</th>
                  <th className="py-3 px-4 font-semibold">Department</th>
                  <th className="py-3 px-4 font-semibold">Defect Type</th>
                  <th className="py-3 px-4 font-semibold">Requested Window</th>
                  <th className="py-3 px-4 font-semibold text-center">Conflict Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Risk Score</th>
                  <th className="py-3 px-4 font-semibold w-10"></th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-[#3b494c]/40 font-mono">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-xs text-[#bac9cc]">
                      <div className="flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined animate-spin text-base text-[#00daf3]">refresh</span>
                        <span>Loading active maintenance requests from database...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredQueue.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-xs text-[#849396]">
                      No active maintenance requests found matching criteria in ('pending', 'scored', 'proposed').
                    </td>
                  </tr>
                ) : (
                  filteredQueue.map((item) => {
                    const isApprovedBlockConflict = Boolean(item.conflicting_approved_block_id);
                    const isReqConflict = Boolean(item.conflicting_with);
                    const isConflict = Boolean(item.conflict_flag || isApprovedBlockConflict || isReqConflict);
                    const isSelected = selectedReq?.id === item.id;
                    const isProposed = item.status === 'proposed';

                    return (
                      <tr
                        key={item.id}
                        onClick={() => handleSelect(item)}
                        className={`hover:bg-[#2e3638]/50 transition-colors group cursor-pointer ${isSelected ? 'bg-[#242b2d]' : ''
                          }`}
                      >
                        {/* Request ID + Proposed Badge */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-[#00daf3] font-bold text-xs">{item.id}</span>
                            {isProposed && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                in draft plan
                              </span>
                            )}
                          </div>
                          {item.asset_id && (
                            <div className="text-[10px] text-[#849396]">{item.asset_id}</div>
                          )}
                        </td>

                        {/* Corridor Section */}
                        <td className="py-3.5 px-4 text-[#dce4e5] font-medium text-xs">
                          {item.section_id}
                        </td>

                        {/* Department */}
                        <td className="py-3.5 px-4 text-[#bac9cc] text-xs">
                          {item.deptName}
                        </td>

                        {/* Defect Type */}
                        <td className="py-3.5 px-4 text-[#dce4e5] text-xs">
                          {formatDefectLabel(item.defect_type)}
                        </td>

                        {/* Window */}
                        <td className="py-3.5 px-4 text-xs text-[#bac9cc]">
                          {formatWindow(item.requested_window_start, item.requested_window_end)}
                        </td>

                        {/* Conflict Status */}
                        <td className="py-3.5 px-4 text-center">
                          {isConflict ? (
                            <span
                              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-red-500/10 border border-red-500/30 text-red-400"
                              title={
                                isReqConflict
                                  ? `Conflicts with: ${item.conflicting_with}`
                                  : isApprovedBlockConflict
                                    ? `Conflicts with an already-approved block (${item.conflicting_approved_block_id.slice(0, 8)})`
                                    : 'Schedule Conflict Detected'
                              }
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span>
                              <span>
                                {isApprovedBlockConflict
                                  ? 'conflicts with an already-approved block'
                                  : isReqConflict
                                    ? `Conflict (${item.conflicting_with.slice(0, 14)})`
                                    : 'Conflict Detected'}
                              </span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                              <span>Clean Slot</span>
                            </span>
                          )}
                        </td>

                        {/* Risk Score */}
                        <td className="py-3.5 px-4 text-right font-bold text-sm">
                          {item.riskScore !== null ? (
                            <span
                              className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold border ${item.riskScore >= 0.7
                                  ? 'bg-red-500/10 text-red-400 border-red-500/30'
                                  : item.riskScore >= 0.4
                                    ? 'bg-amber-400/10 text-amber-400 border-amber-400/30'
                                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                }`}
                            >
                              {item.riskScore.toFixed(4)}
                            </span>
                          ) : (
                            <span className="text-[#849396] text-xs">Pending</span>
                          )}
                        </td>

                        {/* Chevron */}
                        <td className="py-3.5 px-4 text-right">
                          <span className="material-symbols-outlined text-lg text-[#bac9cc] group-hover:text-[#00daf3] transition-colors">
                            chevron_right
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-[#3b494c] flex items-center justify-between text-xs text-[#bac9cc] bg-[#2e3638]/20 font-mono">
            <span>Showing {filteredQueue.length} active maintenance requests in queue</span>
            <span className="text-[11px] text-[#00daf3]">XGBoost v2.4 Risk Scoring Active</span>
          </div>
        </div>
      </div>

      {/* Slide-over Side Panel (AI Risk Diagnostics) — fixed drawer overlay */}
      {/* Backdrop */}
      {panelOpen && selectedReq && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setPanelOpen(false)}
        />
      )}
      {panelOpen && selectedReq && (
        <aside
          className="fixed top-0 right-0 z-50 h-screen w-full sm:w-[420px] bg-[#192122] border-l border-[#3b494c] shadow-2xl flex flex-col overflow-hidden"
          style={{ maxWidth: '100vw' }}
        >
          {/* Panel Header */}
          <div className="flex items-center justify-between p-5 border-b border-[#3b494c] bg-[#242b2d]/50">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#00daf3]/20 text-[#00daf3] border border-[#00daf3]/30">
                  {selectedReq.id}
                </span>

                {/* Model Prediction Probability for THIS specific request */}
                {selectedReq.riskScore !== null ? (
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${selectedReq.riskScore >= 0.7
                        ? 'bg-red-500/20 text-red-400 border-red-500/30'
                        : selectedReq.riskScore >= 0.4
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      }`}
                    title="XGBoost model prediction probability (risk_score) for this specific request"
                  >
                    Risk Probability: {(selectedReq.riskScore * 100).toFixed(1)}%
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#2e3638] text-[#849396] border border-[#3b494c]">
                    Score: Pending
                  </span>
                )}

                {selectedReq.status === 'proposed' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    in draft plan
                  </span>
                )}
              </div>
              <h3 className="font-bold text-lg text-[#dce4e5]">AI Risk Diagnostics</h3>
            </div>
            <button
              onClick={() => setPanelOpen(false)}
              className="p-1.5 text-[#bac9cc] hover:text-[#dce4e5] hover:bg-[#2e3638] rounded-full transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          {/* Panel Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6" style={{ overscrollBehavior: 'contain' }}>
            {/* Telemetry Summary Card */}
            <div className="p-3.5 rounded-lg bg-[#080f11]/60 border border-[#3b494c]/60 font-mono text-xs space-y-2">
              <div className="flex justify-between items-center text-[#bac9cc]">
                <span>Corridor Section:</span>
                <span className="text-[#dce4e5] font-semibold">{selectedReq.section_id}</span>
              </div>
              <div className="flex justify-between items-center text-[#bac9cc]">
                <span>Department:</span>
                <span className="text-[#dce4e5] font-semibold">{selectedReq.deptName}</span>
              </div>
              <div className="flex justify-between items-center text-[#bac9cc]">
                <span>Defect Type:</span>
                <span className="text-[#00daf3]">{formatDefectLabel(selectedReq.defect_type)}</span>
              </div>
              <div className="flex justify-between items-center text-[#bac9cc]">
                <span>Window:</span>
                <span className="text-[#dce4e5]">{formatWindow(selectedReq.requested_window_start, selectedReq.requested_window_end)}</span>
              </div>
              <div className="flex justify-between items-center text-[#bac9cc]">
                <span>Status:</span>
                <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-[#2e3638] text-[#dce4e5]">
                  {selectedReq.status}
                </span>
              </div>
            </div>

            {/* Model Feature Importance (Global Feature Contribution) */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-xs uppercase font-mono tracking-wider text-[#bac9cc] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-[#00daf3]">bar_chart</span>
                  Model Feature Importance
                </h4>
                {scoringLoading && (
                  <span className="text-[10px] font-mono text-[#00daf3] flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs animate-spin">refresh</span>
                    Live Evaluating...
                  </span>
                )}
              </div>

              <div className="space-y-3.5">
                {selectedReq.features?.map((feat) => (
                  <div key={feat.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[#dce4e5] font-medium">{feat.name}</span>
                      <div className="flex items-center gap-2 font-mono">
                        {feat.valueText && <span className="text-[10px] text-[#849396]">{feat.valueText}</span>}
                        <span className={`font-bold ${feat.text}`}>{feat.weight}%</span>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-[#2e3638] rounded-full overflow-hidden">
                      <div
                        className={`h-full ${feat.color} rounded-full transition-all duration-500`}
                        style={{ width: `${feat.weight}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Critical Insight Card */}
            <div
              className={`p-4 rounded-lg border relative overflow-hidden ${selectedReq.riskScore >= 0.7 || selectedReq.conflict_flag || selectedReq.conflicting_approved_block_id
                  ? 'border-red-500/30 bg-red-500/5'
                  : 'border-[#00daf3]/30 bg-[#00daf3]/5'
                }`}
            >
              <div
                className={`absolute top-0 left-0 w-1 h-full ${selectedReq.riskScore >= 0.7 || selectedReq.conflict_flag || selectedReq.conflicting_approved_block_id
                    ? 'bg-red-500'
                    : 'bg-[#00daf3]'
                  }`}
              ></div>
              <div className="flex gap-3">
                <span
                  className={`material-symbols-outlined mt-0.5 text-[20px] ${selectedReq.riskScore >= 0.7 || selectedReq.conflict_flag || selectedReq.conflicting_approved_block_id
                      ? 'text-red-400'
                      : 'text-[#00daf3]'
                    }`}
                >
                  {selectedReq.conflict_flag || selectedReq.conflicting_approved_block_id ? 'warning' : 'insights'}
                </span>
                <div>
                  <h5
                    className={`text-xs font-mono font-bold uppercase tracking-wider mb-1 ${selectedReq.riskScore >= 0.7 || selectedReq.conflict_flag || selectedReq.conflicting_approved_block_id
                        ? 'text-red-400'
                        : 'text-[#00daf3]'
                      }`}
                  >
                    Optimizer Recommendation
                  </h5>
                  <p className="text-xs text-[#bac9cc] leading-relaxed">{selectedReq.insight}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Panel Actions: Navigation Only */}
          <div className="p-5 border-t border-[#3b494c] bg-[#242b2d]/50 space-y-3">
            <button
              onClick={() => navigate('/block-optimization')}
              className="w-full bg-[#00daf3] hover:bg-[#c3f5ff] text-[#00363d] font-bold py-2.5 px-4 rounded-lg transition-all flex items-center justify-center gap-2 glow-btn cursor-pointer text-sm"
              title="Navigate to Block Optimization workspace"
            >
              <span>Proceed to Optimization</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
            <button
              onClick={() => navigate('/calendar')}
              className="w-full bg-transparent border border-[#3b494c] hover:bg-[#2e3638] text-[#dce4e5] font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">calendar_month</span>
              View Slot in Calendar
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}
