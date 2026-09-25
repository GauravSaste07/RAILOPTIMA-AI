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

  // Helper for Legacy Indian Railways Ingestion Systems (TMS / SMMS / TDMS)
  const getLegacySystem = (deptOrDefect) => {
    const d = String(deptOrDefect || '').toLowerCase();
    if (d.includes('track') || d.includes('eng') || d.includes('civil')) {
      return { code: 'TMS', fullName: 'Track Management System', deptLabel: 'Civil / Track', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
    if (d.includes('sign') || d.includes('s&t') || d.includes('telecom')) {
      return { code: 'SMMS', fullName: 'Signalling Maintenance & Mgmt System', deptLabel: 'Signal & Telecom', badge: 'bg-cyan-50 text-cyan-700 border-cyan-200' };
    }
    if (d.includes('tract') || d.includes('trd') || d.includes('ohe')) {
      return { code: 'TDMS', fullName: 'Traction Distribution Mgmt System', deptLabel: 'Traction (TRD)', badge: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
    return { code: 'TMS', fullName: 'Track Management System', deptLabel: 'Civil / Track', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  };

  // Helper to compute or format the 3 PS-Mandated Pillars (Criticality, Urgency, Impact on Asset Availability)
  const getPSTwoOrThreeFactors = (item, liveScoreData = null) => {
    if (liveScoreData?.ps_three_factors) {
      return liveScoreData.ps_three_factors;
    }
    const critStr = String(item.criticality || 'Medium');
    const critBase = critStr.toLowerCase() === 'high' ? 0.9 : (critStr.toLowerCase() === 'medium' ? 0.6 : 0.3);
    const stress = Number(item.asset_stress_index || 0.5);
    const overdue = Number(item.overdue_days || 0);
    const density = Number(item.section_traffic_density || 38.0);

    const critScore = Math.min(1.0, Math.round((0.55 * critBase + 0.45 * stress) * 100) / 100);
    const urgScore = Math.min(1.0, Math.round(Math.min(1.0, overdue / 60.0) * 100) / 100);
    const availScore = Math.min(1.0, Math.max(0.15, Math.round(Math.min(1.0, (density - 10.0) / 45.0) * 100) / 100));

    return {
      criticality: {
        name: 'Criticality',
        score: critScore,
        percentage: Math.round(critScore * 100),
        rating: critStr,
        stress_index: stress,
        summary: `${critStr} asset criticality with ${(stress * 100).toFixed(0)}% stress index.`
      },
      urgency: {
        name: 'Urgency',
        score: urgScore,
        percentage: Math.round(urgScore * 100),
        overdue_days: overdue,
        summary: `${overdue} days overdue beyond maintenance window.`
      },
      asset_availability_impact: {
        name: 'Impact on Asset Availability',
        score: availScore,
        percentage: Math.round(availScore * 100),
        traffic_density: density,
        summary: `Corridor carries ${Math.round(density)} trains/day; failure poses line capacity risk.`
      }
    };
  };

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
          name: fb.overdue_days?.factor_name || 'Urgency (Days Overdue)',
          valueText: `${fb.overdue_days?.feature_value ?? overdue} days overdue`,
          weight: Math.round((fb.overdue_days?.global_model_importance || 0.35) * 100),
          color: 'bg-red-500',
          text: 'text-red-700',
          assessment: fb.overdue_days?.assessment
        },
        {
          name: fb.asset_stress_index?.factor_name || 'Asset Stress Index',
          valueText: `Stress: ${Number(fb.asset_stress_index?.feature_value ?? stress).toFixed(2)}`,
          weight: Math.round((fb.asset_stress_index?.global_model_importance || 0.25) * 100),
          color: 'bg-amber-500',
          text: 'text-amber-700',
          assessment: fb.asset_stress_index?.assessment
        },
        {
          name: fb.criticality_encoded?.factor_name || 'Asset Base Criticality',
          valueText: `Rating: ${fb.criticality_encoded?.raw_rating || crit}`,
          weight: Math.round((fb.criticality_encoded?.global_model_importance || 0.18) * 100),
          color: 'bg-blue-600',
          text: 'text-blue-700',
        },
        {
          name: fb.section_traffic_density?.factor_name || 'Corridor Traffic Density',
          valueText: `${fb.section_traffic_density?.feature_value ?? density} trains/day`,
          weight: Math.round((fb.section_traffic_density?.global_model_importance || 0.14) * 100),
          color: 'bg-[#98d0da]',
          text: 'text-cyan-700',
          assessment: fb.section_traffic_density?.assessment
        },
        {
          name: fb.defect_type_encoded?.factor_name || 'Defect Classification',
          valueText: String(fb.defect_type_encoded?.feature_value || defect).replace(/_/g, ' '),
          weight: Math.round((fb.defect_type_encoded?.global_model_importance || 0.08) * 100),
          color: 'bg-[#b3ecf7]',
          text: 'text-cyan-700',
        },
        {
          name: fb.days_since_last_inspection?.factor_name || 'Days Since RDSO Inspection',
          valueText: `${fb.days_since_last_inspection?.feature_value ?? 30} days`,
          weight: Math.round((fb.days_since_last_inspection?.global_model_importance || 0.06) * 100),
          color: 'bg-indigo-400',
          text: 'text-indigo-700',
          assessment: fb.days_since_last_inspection?.assessment
        },
        {
          name: fb.failure_count_last_year?.factor_name || 'Historical Failure Count',
          valueText: `${fb.failure_count_last_year?.feature_value ?? 0} failures/yr`,
          weight: Math.round((fb.failure_count_last_year?.global_model_importance || 0.05) * 100),
          color: 'bg-rose-400',
          text: 'text-rose-700',
          assessment: fb.failure_count_last_year?.assessment
        }
      ];
    }

    // Default built-in global model feature importances from XGBoost model bundle
    return [
      {
        name: 'Urgency (Days Overdue)',
        valueText: `${overdue} overdue days`,
        weight: 35,
        color: 'bg-red-500',
        text: 'text-red-700',
      },
      {
        name: 'Asset Stress Index',
        valueText: `Stress: ${stress.toFixed(2)}`,
        weight: 25,
        color: 'bg-amber-500',
        text: 'text-amber-700',
      },
      {
        name: 'Asset Base Criticality',
        valueText: `Rating: ${crit}`,
        weight: 18,
        color: 'bg-blue-600',
        text: 'text-blue-700',
      },
      {
        name: 'Corridor Traffic Density',
        valueText: `${density} trains/day`,
        weight: 14,
        color: 'bg-[#98d0da]',
        text: 'text-cyan-700',
      },
      {
        name: 'Defect Classification',
        valueText: defect.replace(/_/g, ' '),
        weight: 8,
        color: 'bg-[#b3ecf7]',
        text: 'text-cyan-700',
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
            possession_start_time,
            track_fit_status,
            departments(id, name)
          `)
          .in('status', ['pending', 'scored', 'proposed', 'scheduled', 'in_progress', 'completed'])
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
          const legacy = getLegacySystem(r.departments?.name || r.department || r.defect_type);
          const psFactors = getPSTwoOrThreeFactors(r);
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
            legacySystem: legacy,
            psThreeFactors: psFactors,
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
      if (filter === 'Active on Track') {
        if (item.status !== 'in_progress') return false;
      }
      if (filter === 'Completed') {
        if (item.status !== 'completed') return false;
      }
      if (filter === 'Conflict Detected') {
        const hasConflict = Boolean(item.conflict_flag || item.conflicting_with || item.conflicting_approved_block_id);
        if (!hasConflict) return false;
      }
      if (filter === 'TMS (Track)') {
        if (item.legacySystem?.code !== 'TMS') return false;
      }
      if (filter === 'SMMS (S&T)') {
        if (item.legacySystem?.code !== 'SMMS') return false;
      }
      if (filter === 'TDMS (TRD)') {
        if (item.legacySystem?.code !== 'TDMS') return false;
      }
      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchId = item.id?.toLowerCase().includes(q);
        const matchAsset = item.asset_id?.toLowerCase().includes(q);
        const matchSec = item.section_id?.toLowerCase().includes(q);
        const matchDept = item.deptName?.toLowerCase().includes(q);
        const matchDefect = item.defect_type?.toLowerCase().includes(q);
        const matchLegacy = item.legacySystem?.code?.toLowerCase().includes(q) || item.legacySystem?.fullName?.toLowerCase().includes(q);
        if (!matchId && !matchAsset && !matchSec && !matchDept && !matchDefect && !matchLegacy) return false;
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
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const res = await fetch(`${API_BASE}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maintenance_request_id: item.id }),
      });

      if (res.ok) {
        const scoreData = await res.json();
        const updatedFeatures = buildFeatureList(item, scoreData);
        const updatedPSTriplet = getPSTwoOrThreeFactors(item, scoreData);
        setSelectedReq((prev) => {
          if (prev?.id === item.id) {
            return {
              ...prev,
              riskScore: scoreData.risk_score !== undefined ? scoreData.risk_score : prev.riskScore,
              features: updatedFeatures,
              psThreeFactors: updatedPSTriplet,
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
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-700">query_stats</span>
                AI Risk Scoring Queue
              </h1>
              {realtimeActive && (
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold tracking-wider uppercase animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Live Sync Active
                </span>
              )}
            </div>
            <p className="text-sm text-slate-600">
              Real-time XGBoost risk predictions and conflict telemetry for active maintenance requests.
            </p>
          </div>
        </div>

        {/* Controls Toolbar: Tabs, Search Bar, Sort Toggle */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
          {/* Left: Filter Tabs */}
          <div className="flex flex-wrap bg-white rounded-lg p-1 border border-slate-200 shrink-0 gap-0.5">
            {['All', 'High Risk', 'Active on Track', 'Completed', 'Conflict Detected', 'TMS (Track)', 'SMMS (S&T)', 'TDMS (TRD)'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${filter === tab
                  ? 'bg-slate-100 text-blue-700 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-800'
                  }`}
              >
                {tab === 'High Risk' && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
                {tab === 'Active on Track' && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>}
                {tab === 'Completed' && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
                {tab === 'Conflict Detected' && <span className="w-2 h-2 rounded-full bg-amber-500"></span>}
                {tab === 'TMS (Track)' && <span className="w-2 h-2 rounded-full bg-emerald-400"></span>}
                {tab === 'SMMS (S&T)' && <span className="w-2 h-2 rounded-full bg-cyan-400"></span>}
                {tab === 'TDMS (TRD)' && <span className="w-2 h-2 rounded-full bg-amber-400"></span>}
                {tab}
              </button>
            ))}
          </div>

          {/* Center: Search Input */}
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-[16px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search by Request ID, Asset, Section, TMS/SMMS/TDMS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg py-1.5 pl-8 pr-8 text-xs font-mono text-slate-800 placeholder:text-slate-500 focus:border-[#00daf3] focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 text-xs font-mono cursor-pointer"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Right: Sort Toggle & Refresh Button */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
              <span className="material-symbols-outlined text-slate-500 text-[16px]">sort</span>
              <span className="text-[11px] font-mono text-slate-500">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-xs font-mono text-blue-700 font-bold outline-none cursor-pointer pr-1"
              >
                <option value="risk" className="bg-white text-slate-800">Highest Risk First</option>
                <option value="newest" className="bg-white text-slate-800">Newest First</option>
              </select>
            </div>

            <button
              onClick={fetchQueue}
              className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
              title="Refresh Queue from Database"
            >
              <span className={`material-symbols-outlined text-[16px] ${loading ? 'animate-spin text-blue-700' : ''}`}>
                refresh
              </span>
            </button>
          </div>
        </div>

        {/* High-Density Table Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden bg-white border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-600 font-mono">
                  <th className="py-3 px-4 font-semibold">Request & Ingestion Source</th>
                  <th className="py-3 px-4 font-semibold">Corridor Sec.</th>
                  <th className="py-3 px-4 font-semibold">Department & Defect</th>
                  <th className="py-3 px-4 font-semibold">PS-26027 Factors</th>
                  <th className="py-3 px-4 font-semibold">Requested Window</th>
                  <th className="py-3 px-4 font-semibold text-center">Conflict Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Risk Score</th>
                  <th className="py-3 px-4 font-semibold w-10"></th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-200 font-mono">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-xs text-slate-600">
                      <div className="flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined animate-spin text-base text-blue-700">refresh</span>
                        <span>Loading active maintenance requests from database...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredQueue.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-xs text-slate-500">
                      No active maintenance requests found matching criteria in ('pending', 'scored', 'proposed').
                    </td>
                  </tr>
                ) : (
                  filteredQueue.map((item) => {
                    const isApprovedBlockConflict = Boolean(item.conflicting_approved_block_id);
                    const isReqConflict = Boolean(item.conflicting_with);
                    const isConflict = Boolean(item.conflict_flag || isApprovedBlockConflict || isReqConflict);
                    const isSelected = selectedReq?.id === item.id;

                    return (
                      <tr
                        key={item.id}
                        onClick={() => handleSelect(item)}
                        className={`hover:bg-slate-100 transition-colors group cursor-pointer ${isSelected ? 'bg-white' : ''
                          }`}
                      >
                        {/* Request ID + Legacy System + Proposed Badge */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-blue-700 font-bold text-xs">{item.id}</span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider uppercase border ${item.legacySystem?.badge || 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}
                              title={`Ingested from: ${item.legacySystem?.fullName}`}
                            >
                              {item.legacySystem?.code}
                            </span>
                            {item.status === 'in_progress' && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1 animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                Active on Track
                              </span>
                            )}
                            {item.status === 'completed' && (
                              <span
                                className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 flex items-center gap-1"
                                title={item.track_fit_status || 'Track Fit Certified'}
                              >
                                <span className="material-symbols-outlined text-[12px]">verified</span>
                                Completed (Fit)
                              </span>
                            )}
                            {item.status === 'scheduled' && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                Scheduled
                              </span>
                            )}
                          </div>
                          {item.asset_id && (
                            <div className="text-[10px] text-slate-500">{item.asset_id}</div>
                          )}
                        </td>

                        {/* Corridor Section */}
                        <td className="py-3.5 px-4 text-slate-800 font-medium text-xs">
                          {item.section_id}
                        </td>

                        {/* Department & Defect */}
                        <td className="py-3.5 px-4">
                          <div className="text-slate-800 text-xs font-semibold">{item.deptName}</div>
                          <div className="text-[11px] text-slate-500">{formatDefectLabel(item.defect_type)}</div>
                        </td>

                        {/* 3 PS Factors Mini Indicator */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 font-mono text-[10px]">
                            <span
                              className={`px-1.5 py-0.5 rounded font-bold ${item.psThreeFactors?.criticality?.rating === 'High' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}
                              title={`Criticality: ${item.psThreeFactors?.criticality?.percentage}% (${item.psThreeFactors?.criticality?.rating})`}
                            >
                              C:{item.psThreeFactors?.criticality?.percentage}%
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded font-bold ${(item.psThreeFactors?.urgency?.overdue_days || 0) > 30 ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}
                              title={`Urgency: ${item.psThreeFactors?.urgency?.overdue_days}d overdue`}
                            >
                              U:{item.psThreeFactors?.urgency?.percentage}%
                            </span>
                            <span
                              className="px-1.5 py-0.5 rounded font-bold bg-blue-50 text-blue-700 border border-blue-200"
                              title={`Availability Impact: ${item.psThreeFactors?.asset_availability_impact?.traffic_density} trains/day`}
                            >
                              A:{item.psThreeFactors?.asset_availability_impact?.percentage}%
                            </span>
                          </div>
                        </td>

                        {/* Window */}
                        <td className="py-3.5 px-4 text-xs text-slate-600">
                          {formatWindow(item.requested_window_start, item.requested_window_end)}
                        </td>

                        {/* Conflict Status */}
                        <td className="py-3.5 px-4 text-center">
                          {isConflict ? (
                            <span
                              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-red-50 border border-red-200 text-red-700"
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
                                  ? 'conflicts with block'
                                  : isReqConflict
                                    ? `Conflict (${item.conflicting_with.slice(0, 14)})`
                                    : 'Conflict Detected'}
                              </span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 border border-emerald-200 text-emerald-700">
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
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : item.riskScore >= 0.4
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                }`}
                            >
                              {item.riskScore.toFixed(4)}
                            </span>
                          ) : (
                            <span className="text-slate-500 text-xs">Pending</span>
                          )}
                        </td>

                        {/* Chevron */}
                        <td className="py-3.5 px-4 text-right">
                          <span className="material-symbols-outlined text-lg text-slate-600 group-hover:text-blue-700 transition-colors">
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

          <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 bg-slate-50 font-mono">
            <span>Showing {filteredQueue.length} active maintenance requests in queue</span>
            <span className="text-[11px] text-blue-700">XGBoost v2.4 Multi-Pillar Risk Scoring Active</span>
          </div>
        </div>
      </div>

      {/* Slide-over Side Panel (AI Risk Diagnostics) — fixed drawer overlay */}
      {/* Backdrop */}
      {panelOpen && selectedReq && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm"
          onClick={() => setPanelOpen(false)}
        />
      )}
      {panelOpen && selectedReq && (
        <aside
          className="fixed top-0 right-0 z-50 h-screen w-full sm:w-[460px] bg-white border-l border-slate-200 shadow-xl flex flex-col overflow-hidden"
          style={{ maxWidth: '100vw' }}
        >
          {/* Panel Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-100 text-blue-700 border border-blue-200">
                  {selectedReq.id}
                </span>

                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase border ${selectedReq.legacySystem?.badge || 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}
                >
                  {selectedReq.legacySystem?.code}
                </span>

                {/* Model Prediction Probability for THIS specific request */}
                {selectedReq.riskScore !== null ? (
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${selectedReq.riskScore >= 0.7
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : selectedReq.riskScore >= 0.4
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    title="XGBoost model prediction probability (risk_score) for this specific request"
                  >
                    Risk Score: {selectedReq.riskScore.toFixed(4)}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-500 border border-slate-200">
                    Score: Pending
                  </span>
                )}

                {selectedReq.status === 'in_progress' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    Active on Track
                  </span>
                )}
                {selectedReq.status === 'completed' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">verified</span>
                    Completed (Fit)
                  </span>
                )}
                {selectedReq.status === 'scheduled' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    Scheduled
                  </span>
                )}
              </div>
              <h3 className="font-bold text-lg text-slate-800">AI Risk & XAI Diagnostics</h3>
            </div>
            <button
              onClick={() => setPanelOpen(false)}
              className="p-1.5 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          {/* Panel Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6" style={{ overscrollBehavior: 'contain' }}>
            {/* Live Operational Possession & Track Fit Banners */}
            {selectedReq.track_fit_status && (
              <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-300 font-mono text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                  <span className="material-symbols-outlined text-[16px] text-emerald-600">verified</span>
                  <span>Statutory Track Fitness Certification:</span>
                </div>
                <div className="text-emerald-950 font-semibold pl-5">
                  {selectedReq.track_fit_status}
                </div>
              </div>
            )}
            {selectedReq.status === 'in_progress' && (
              <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-300 font-mono text-xs space-y-1 animate-pulse">
                <div className="flex items-center gap-1.5 text-amber-800 font-bold">
                  <span className="material-symbols-outlined text-[16px] text-amber-600">timer</span>
                  <span>Live Track Possession in Progress:</span>
                </div>
                <div className="text-amber-950 font-semibold pl-5">
                  Field Gang On Track {selectedReq.possession_start_time ? `(Since ${new Date(selectedReq.possession_start_time).toLocaleTimeString()})` : ''}
                </div>
              </div>
            )}

            {/* Legacy Ingestion Metadata Card */}
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs space-y-2">
              <div className="flex justify-between items-center text-slate-600">
                <span>Source System:</span>
                <span className="text-blue-700 font-bold">
                  {selectedReq.legacySystem?.code} ({selectedReq.legacySystem?.fullName})
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Corridor Section:</span>
                <span className="text-slate-800 font-semibold">{selectedReq.section_id}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Department:</span>
                <span className="text-slate-800 font-semibold">{selectedReq.deptName}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Defect Type:</span>
                <span className="text-blue-700">{formatDefectLabel(selectedReq.defect_type)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Window:</span>
                <span className="text-slate-800">{formatWindow(selectedReq.requested_window_start, selectedReq.requested_window_end)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Status:</span>
                <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-100 text-slate-800">
                  {selectedReq.status}
                </span>
              </div>
            </div>

            {/* PS 26027 3-Factor Prioritization Pillars */}
            {selectedReq.psThreeFactors && (
              <div className="p-4 rounded-xl bg-white border border-blue-200 space-y-3.5 shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-blue-700">verified</span>
                    PS 26027 Prioritization Pillars
                  </h4>
                  <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    Mandated Factors
                  </span>
                </div>

                {/* Pillar 1: Criticality */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-800 font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      1. Criticality ({selectedReq.psThreeFactors.criticality?.rating || 'Medium'})
                    </span>
                    <span className="font-mono font-bold text-rose-700">
                      {selectedReq.psThreeFactors.criticality?.percentage}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-white rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-500 rounded-full transition-all duration-500"
                      style={{ width: `${selectedReq.psThreeFactors.criticality?.percentage || 50}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono leading-tight">
                    {selectedReq.psThreeFactors.criticality?.summary}
                  </p>
                </div>

                {/* Pillar 2: Urgency */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-800 font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      2. Urgency ({selectedReq.psThreeFactors.urgency?.overdue_days || 0}d overdue)
                    </span>
                    <span className="font-mono font-bold text-amber-700">
                      {selectedReq.psThreeFactors.urgency?.percentage}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-white rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-500"
                      style={{ width: `${selectedReq.psThreeFactors.urgency?.percentage || 30}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono leading-tight">
                    {selectedReq.psThreeFactors.urgency?.summary}
                  </p>
                </div>

                {/* Pillar 3: Impact on Asset Availability */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-800 font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                      3. Asset Availability Impact
                    </span>
                    <span className="font-mono font-bold text-blue-700">
                      {selectedReq.psThreeFactors.asset_availability_impact?.percentage}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-white rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${selectedReq.psThreeFactors.asset_availability_impact?.percentage || 40}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono leading-tight">
                    {selectedReq.psThreeFactors.asset_availability_impact?.summary}
                  </p>
                </div>
              </div>
            )}

            {/* Model Feature Importance (Global Feature Contribution) */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-xs uppercase font-mono tracking-wider text-slate-600 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-blue-700">bar_chart</span>
                  XGBoost Feature Attribution (XAI)
                </h4>
                {scoringLoading && (
                  <span className="text-[10px] font-mono text-blue-700 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs animate-spin">refresh</span>
                    Live Evaluating...
                  </span>
                )}
              </div>

              <div className="space-y-3.5">
                {selectedReq.features?.map((feat) => (
                  <div key={feat.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-800 font-medium">{feat.name}</span>
                      <div className="flex items-center gap-2 font-mono">
                        {feat.valueText && <span className="text-[10px] text-slate-500">{feat.valueText}</span>}
                        <span className={`font-bold ${feat.text}`}>{feat.weight}%</span>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
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
                ? 'border-red-200 bg-red-50'
                : 'border-blue-200 bg-blue-50/50'
                }`}
            >
              <div
                className={`absolute top-0 left-0 w-1 h-full ${selectedReq.riskScore >= 0.7 || selectedReq.conflict_flag || selectedReq.conflicting_approved_block_id
                  ? 'bg-red-500'
                  : 'bg-blue-600'
                  }`}
              ></div>
              <div className="flex gap-3">
                <span
                  className={`material-symbols-outlined mt-0.5 text-[20px] ${selectedReq.riskScore >= 0.7 || selectedReq.conflict_flag || selectedReq.conflicting_approved_block_id
                    ? 'text-red-700'
                    : 'text-blue-700'
                    }`}
                >
                  {selectedReq.conflict_flag || selectedReq.conflicting_approved_block_id ? 'warning' : 'insights'}
                </span>
                <div>
                  <h5
                    className={`text-xs font-mono font-bold uppercase tracking-wider mb-1 ${selectedReq.riskScore >= 0.7 || selectedReq.conflict_flag || selectedReq.conflicting_approved_block_id
                      ? 'text-red-700'
                      : 'text-blue-700'
                      }`}
                  >
                    Optimizer Recommendation
                  </h5>
                  <p className="text-xs text-slate-600 leading-relaxed">{selectedReq.insight}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Panel Actions: Navigation Only */}
          <div className="p-5 border-t border-slate-200 bg-slate-50 space-y-3">
            <button
              onClick={() => navigate('/block-optimization')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-lg transition-all flex items-center justify-center gap-2 glow-btn cursor-pointer text-sm"
              title="Navigate to Block Optimization workspace"
            >
              <span>Proceed to Optimization</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
            <button
              onClick={() => navigate('/calendar')}
              className="w-full bg-transparent border border-slate-200 hover:bg-slate-100 text-slate-800 font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-xs cursor-pointer"
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
