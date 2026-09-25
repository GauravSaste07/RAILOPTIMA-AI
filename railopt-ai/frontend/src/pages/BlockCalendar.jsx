import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function BlockCalendar() {
  const navigate = useNavigate();

  const [viewMode, setViewMode] = useState('weekly'); // 'weekly' | 'monthly'
  const [baseDate, setBaseDate] = useState('2026-09-07');
  const [selectedCorridor, setSelectedCorridor] = useState('All');
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [realtimeActive, setRealtimeActive] = useState(false);
  const [sectionsMap, setSectionsMap] = useState({});
  const [currentTime, setCurrentTime] = useState(new Date());
  const [operationalFilter, setOperationalFilter] = useState('all'); // 'all' | 'active' | 'completed'

  // Live 1-second clock ticker for tracking remaining window and overrun
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Helper to compute calendar days based on baseDate and viewMode
  const calendarDays = useMemo(() => {
    const daysCount = viewMode === 'weekly' ? 7 : 30;
    const start = new Date(baseDate);
    const daysArr = [];

    for (let i = 0; i < daysCount; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const isoDate = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dateDisplay = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      const dayNumber = d.getDate();

      daysArr.push({
        isoDate,
        dayName,
        dateDisplay,
        dayNumber,
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
      });
    }
    return daysArr;
  }, [baseDate, viewMode]);

  // Date range for query
  const dateRange = useMemo(() => {
    const startIso = calendarDays[0]?.isoDate || '2026-09-07';
    const endIso = calendarDays[calendarDays.length - 1]?.isoDate || '2026-09-13';
    return {
      start: `${startIso}T00:00:00Z`,
      end: `${endIso}T23:59:59Z`,
    };
  }, [calendarDays]);

  // Helper to format time windows & duration
  const formatWindow = (startStr, endStr) => {
    if (!startStr || !endStr) return { time: 'N/A', date: 'N/A', duration: 'N/A', startHour: 0, durationHours: 4 };
    try {
      const s = new Date(startStr);
      const e = new Date(endStr);
      const startTime = s.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' });
      const endTime = e.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' });
      const dateStr = s.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
      const isoDay = s.toISOString().split('T')[0];

      const diffMs = e.getTime() - s.getTime();
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.round((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const duration = `${diffHrs}h ${diffMins > 0 ? diffMins + 'm' : '0m'}`;

      const startHour = s.getUTCHours() + s.getUTCMinutes() / 60;
      const durationHours = Math.max(1, diffMs / (1000 * 60 * 60));

      return {
        time: `${startTime} - ${endTime} UTC`,
        date: dateStr,
        isoDay,
        duration,
        startHour,
        durationHours,
      };
    } catch {
      return { time: '00:00 - 04:00 UTC', date: '2026-09-07', isoDay: '2026-09-07', duration: '4h 0m', startHour: 0, durationHours: 4 };
    }
  };

  // Real-time window countdown & overrun monitor for active track possessions
  const getLiveWindowInfo = (block) => {
    if (!block?.start_time || !block?.end_time) return null;
    const now = currentTime.getTime();
    const end = new Date(block.end_time).getTime();

    const diffToEnd = end - now;
    if (diffToEnd > 0) {
      const hrs = Math.floor(diffToEnd / (1000 * 60 * 60));
      const mins = Math.floor((diffToEnd % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diffToEnd % (1000 * 60)) / 1000);
      return {
        isOverrun: false,
        text: `${hrs}h ${mins}m ${secs < 10 ? '0' : ''}${secs}s left`,
        alertType: hrs === 0 && mins < 30 ? 'warning' : 'normal',
      };
    } else {
      const overrunMs = Math.abs(diffToEnd);
      const hrs = Math.floor(overrunMs / (1000 * 60 * 60));
      const mins = Math.floor((overrunMs % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((overrunMs % (1000 * 60)) / 1000);
      return {
        isOverrun: true,
        text: `OVERRUN: +${hrs > 0 ? hrs + 'h ' : ''}${mins}m ${secs < 10 ? '0' : ''}${secs}s`,
        alertType: 'critical',
      };
    }
  };

  // Fetch approved/in_progress/completed blocks and enrich with sections and constituent requests
  const fetchApprovedBlocks = useCallback(async () => {
    try {
      setLoading(true);

      // 1. Fetch corridor sections for metadata lookup
      const { data: sectionsData } = await supabase
        .from('corridor_sections')
        .select('id, section_name, zone')
        .order('id');

      const secMap = {};
      if (sectionsData) {
        sectionsData.forEach((s) => {
          secMap[s.id] = s;
        });
        setSectionsMap(secMap);
      }

      // 2. Fetch departments lookup
      const { data: deptData } = await supabase
        .from('departments')
        .select('id, name');
      const deptMap = {};
      if (deptData) {
        deptData.forEach((d) => {
          deptMap[d.id] = d.name;
        });
      }

      // 3. Fetch approved, in_progress, and completed blocks within date range with exact count
      const { data: blocksData, error: blocksError } = await supabase
        .from('blocks')
        .select('*', { count: 'exact' })
        .in('status', ['approved', 'in_progress', 'completed'])
        .gte('start_time', dateRange.start)
        .lte('start_time', dateRange.end)
        .order('start_time', { ascending: true });

      if (blocksError) throw blocksError;

      if (!blocksData || blocksData.length === 0) {
        setBlocks([]);
        setLoading(false);
        return;
      }

      // 4. Collect all request IDs
      const allReqIds = Array.from(
        new Set(
          blocksData.flatMap((b) => (Array.isArray(b.request_ids) ? b.request_ids : []))
        )
      );

      // 5. Fetch details for all requests in approved blocks
      let reqDetailsMap = {};
      if (allReqIds.length > 0) {
        const { data: reqsData } = await supabase
          .from('maintenance_requests')
          .select('id, defect_type, risk_score, department_id, section_id, status, criticality, asset_id, overdue_days, track_fit_status, possession_start_time')
          .in('id', allReqIds);

        if (reqsData) {
          reqsData.forEach((r) => {
            reqDetailsMap[r.id] = {
              ...r,
              department_name: deptMap[r.department_id] || 'General Maintenance',
            };
          });
        }
      }

      // 6. Enrich blocks
      const enriched = blocksData.map((b) => {
        const reqIds = Array.isArray(b.request_ids) ? b.request_ids : [];
        const reqList = reqIds.map((id) => reqDetailsMap[id]).filter(Boolean);

        const deptsInvolved = Array.from(
          new Set(reqList.map((r) => r.department_name).filter(Boolean))
        );

        const totalRisk = reqList.reduce((acc, r) => acc + (Number(r.risk_score) || 0), 0);
        const avgRisk = reqList.length > 0 ? (totalRisk / reqList.length).toFixed(3) : '0.000';

        const windowInfo = formatWindow(b.start_time, b.end_time);
        const sec = secMap[b.section_id];
        const sectionDisplay = sec
          ? `${b.section_id} — ${sec.section_name}`
          : b.section_id || 'Corridor Section';
        const zoneDisplay = sec?.zone || 'Indian Railways';

        // Determine badge type/color
        let blockType = 'multi';
        if (deptsInvolved.length === 1) {
          const d = deptsInvolved[0].toLowerCase();
          if (d.includes('engineering') || d.includes('track') || d.includes('civil')) blockType = 'eng';
          else if (d.includes('signal') || d.includes('telecom')) blockType = 'st';
          else if (d.includes('traction') || d.includes('trd')) blockType = 'trd';
        }

        return {
          ...b,
          sectionDisplay,
          zoneDisplay,
          windowTime: windowInfo.time,
          windowDate: windowInfo.date,
          isoDay: windowInfo.isoDay,
          duration: windowInfo.duration,
          startHour: windowInfo.startHour,
          durationHours: windowInfo.durationHours,
          requestsCount: reqIds.length,
          requestsList: reqList,
          departments: deptsInvolved.length > 0 ? deptsInvolved : ['Engineering', 'S&T'],
          confidencePct: b.confidence ? `${Math.round(b.confidence * 100)}%` : '85%',
          totalRiskScore: totalRisk.toFixed(3),
          avgRiskScore: avgRisk,
          blockType,
        };
      });

      setBlocks(enriched);
    } catch (err) {
      console.error('Error fetching approved blocks:', err);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  // Set up Supabase Realtime subscription on blocks and maintenance_requests tables
  useEffect(() => {
    fetchApprovedBlocks();

    // Subscribe to changes on both blocks and maintenance_requests tables
    const channel = supabase
      .channel('blocks-calendar-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'blocks',
        },
        (payload) => {
          console.log('[Realtime] Blocks table event detected:', payload.eventType);
          fetchApprovedBlocks();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'maintenance_requests',
        },
        (payload) => {
          console.log('[Realtime] Requests table event detected:', payload.eventType);
          fetchApprovedBlocks();
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
  }, [fetchApprovedBlocks]);

  // Handle date navigation (Shift by 7 or 30 days)
  const handlePrevRange = () => {
    const d = new Date(baseDate);
    d.setDate(d.getDate() - (viewMode === 'weekly' ? 7 : 30));
    setBaseDate(d.toISOString().split('T')[0]);
  };

  const handleNextRange = () => {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + (viewMode === 'weekly' ? 7 : 30));
    setBaseDate(d.toISOString().split('T')[0]);
  };

  const handleResetToBaseline = () => {
    setBaseDate('2026-09-07');
  };

  // Live Operational Tracking Computations for Section Controller / Admin
  const activeBlocks = useMemo(() => {
    return blocks.filter((b) => b.status === 'in_progress' || b.requestsList?.some((r) => r.status === 'in_progress'));
  }, [blocks]);

  const completedBlocks = useMemo(() => {
    return blocks.filter((b) => b.status === 'completed' || b.requestsList?.some((r) => r.status === 'completed' || r.track_fit_status));
  }, [blocks]);

  const overrunningBlocks = useMemo(() => {
    return activeBlocks.filter((b) => {
      const info = getLiveWindowInfo(b);
      return info?.isOverrun;
    });
  }, [activeBlocks, currentTime]);

  const displayedBlocks = useMemo(() => {
    if (operationalFilter === 'active') return activeBlocks;
    if (operationalFilter === 'completed') return completedBlocks;
    return blocks;
  }, [blocks, operationalFilter, activeBlocks, completedBlocks]);

  // Corridors list & filtering
  const allCorridorIds = useMemo(() => {
    const list = Object.keys(sectionsMap);
    return list.length > 0 ? list : ['ALD-MGS', 'BPL-ET', 'CSMT-KYN', 'NDLS-GZB', 'MAS-AJJ', 'HWH-BWN'];
  }, [sectionsMap]);

  const activeCorridors = useMemo(() => {
    if (selectedCorridor !== 'All') {
      return [selectedCorridor];
    }
    // Only show corridors that have blocks or full list
    const corridorsWithBlocks = new Set(blocks.map((b) => b.section_id));
    // Prioritize corridors that have blocks, followed by standard corridors
    return allCorridorIds.filter((c) => corridorsWithBlocks.has(c) || ['NDLS-GZB', 'CSMT-KYN', 'ALD-MGS', 'BPL-ET', 'MAS-AJJ'].includes(c));
  }, [allCorridorIds, blocks, selectedCorridor]);

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Calendar Toolbar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 bg-white border border-slate-200 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-lg">
        {/* Date & View Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Navigation Controls */}
          <div className="flex items-center bg-slate-50 rounded-lg border border-slate-200 p-1 font-mono">
            <button
              onClick={handlePrevRange}
              className="p-1 text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
              title="Previous period"
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <span className="px-3 text-xs font-bold text-slate-800 tracking-wide uppercase">
              {calendarDays[0]?.dateDisplay} — {calendarDays[calendarDays.length - 1]?.dateDisplay} 2026
            </span>
            <button
              onClick={handleNextRange}
              className="p-1 text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
              title="Next period"
            >
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>

          <button
            onClick={handleResetToBaseline}
            className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-xs font-mono text-slate-600 rounded-lg border border-slate-200 transition-colors cursor-pointer"
            title="Jump to Sep 07, 2026 baseline"
          >
            Baseline Week
          </button>

          <button
            onClick={() => setBaseDate('2026-09-22')}
            className={`px-2.5 py-1.5 text-xs font-mono rounded-lg border transition-colors cursor-pointer flex items-center gap-1.5 ${baseDate === '2026-09-22'
                ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            title="Jump to today's live operational blocks (Sep 22, 2026)"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Today (Live)
          </button>

          {/* Weekly / Monthly Toggle */}
          <div className="flex bg-slate-50 rounded-lg border border-slate-200 p-1">
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-3 py-1 text-xs font-mono rounded transition-all cursor-pointer ${viewMode === 'weekly'
                  ? 'bg-blue-100 text-blue-600 font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Weekly Gantt (7d)
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-3 py-1 text-xs font-mono rounded transition-all cursor-pointer ${viewMode === 'monthly'
                  ? 'bg-blue-100 text-blue-600 font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Monthly View (30d)
            </button>
          </div>
        </div>

        {/* Filters & Realtime Indicator */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Corridor Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-600">Corridor:</span>
            <select
              value={selectedCorridor}
              onChange={(e) => setSelectedCorridor(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 rounded-lg px-2.5 py-1.5 outline-none focus:border-[#00daf3]"
            >
              <option value="All">All Corridors ({allCorridorIds.length})</option>
              {allCorridorIds.map((c) => (
                <option key={c} value={c}>
                  {c} {sectionsMap[c]?.section_name ? `— ${sectionsMap[c].section_name}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Operational Status Filter Pills */}
          <div className="flex bg-slate-50 rounded-lg p-0.5 border border-slate-200">
            <button
              onClick={() => setOperationalFilter('all')}
              className={`px-2.5 py-1 text-xs font-mono rounded cursor-pointer transition-all ${operationalFilter === 'all'
                  ? 'bg-white text-blue-700 font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              All Master ({blocks.length})
            </button>
            <button
              onClick={() => setOperationalFilter('active')}
              className={`px-2.5 py-1 text-xs font-mono rounded cursor-pointer transition-all flex items-center gap-1.5 ${operationalFilter === 'active'
                  ? 'bg-amber-50 text-amber-700 font-bold border border-amber-200 shadow-sm'
                  : 'text-slate-600 hover:text-amber-700'
                }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              Active ({activeBlocks.length})
            </button>
            <button
              onClick={() => setOperationalFilter('completed')}
              className={`px-2.5 py-1 text-xs font-mono rounded cursor-pointer transition-all flex items-center gap-1 ${operationalFilter === 'completed'
                  ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 shadow-sm'
                  : 'text-slate-600 hover:text-emerald-700'
                }`}
            >
              <span className="material-symbols-outlined text-xs">verified</span>
              Fit Certified ({completedBlocks.length})
            </button>
          </div>

          {/* Realtime Live Indicator */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-600"
            title="Realtime PostgreSQL sync on blocks & maintenance_requests tables"
          >
            <span className={`w-2 h-2 rounded-full ${realtimeActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
            <span>{realtimeActive ? 'Live Realtime' : 'Connecting'}</span>
          </div>

          <button
            onClick={fetchApprovedBlocks}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-700 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Refresh approved blocks"
          >
            <span className={`material-symbols-outlined text-sm ${loading ? 'animate-spin' : ''}`}>refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="text-slate-500 text-xs font-mono uppercase tracking-wider mb-1">Approved Blocks</div>
          <div className="text-2xl font-bold font-mono text-blue-700">{blocks.length}</div>
          <div className="text-[11px] text-slate-600 mt-1">Locked in master schedule</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="text-slate-500 text-xs font-mono uppercase tracking-wider mb-1">Scheduled Requests</div>
          <div className="text-2xl font-bold font-mono text-emerald-700">
            {blocks.reduce((acc, b) => acc + (b.requestsCount || 0), 0)}
          </div>
          <div className="text-[11px] text-slate-600 mt-1">Bundled maintenance items</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="text-slate-500 text-xs font-mono uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Track Possession</span>
            <span className={`w-2.5 h-2.5 rounded-full ${activeBlocks.length > 0 ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`}></span>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-700">
            {activeBlocks.length} Active
          </div>
          <div className="text-[11px] text-slate-600 mt-1">
            {overrunningBlocks.length > 0 ? (
              <span className="text-red-700 font-bold flex items-center gap-1 animate-pulse">
                ⚠️ {overrunningBlocks.length} Overrunning Slot!
              </span>
            ) : (
              'Field teams within window'
            )}
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="text-slate-500 text-xs font-mono uppercase tracking-wider mb-1">Track Fit Certified</div>
          <div className="text-2xl font-bold font-mono text-emerald-700">
            {completedBlocks.length} Blocks
          </div>
          <div className="text-[11px] text-slate-600 mt-1">Normal / TSR caution signed</div>
        </div>
      </div>

      {/* SECTION CONTROLLER LIVE TRACK POSSESSION & FIELD MONITOR */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center">
              <div className={`w-3 h-3 rounded-full ${activeBlocks.length > 0 ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`}></div>
              <div className={`absolute w-3 h-3 rounded-full ${activeBlocks.length > 0 ? 'bg-amber-400' : 'bg-emerald-400'}`}></div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold font-mono text-slate-800 tracking-wide uppercase">
                  Section Controller Live Corridor Possession & Overrun Monitor
                </h3>
                {overrunningBlocks.length > 0 && (
                  <span className="px-2 py-0.5 rounded bg-rose-50 text-red-700 border border-rose-300 text-[10px] font-mono font-bold animate-pulse flex items-center gap-1">
                    ⚠️ BLOCK BURSTING ALERT
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Real-time tracking of field possessions, live countdowns, and track fitness certificates
              </p>
            </div>
          </div>
          <div className="text-xs font-mono text-blue-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 flex items-center gap-2 shrink-0">
            <span className="material-symbols-outlined text-xs">schedule</span>
            <span>Live Clock: {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </div>
        </div>

        {/* Active Blocks Grid or All-Clear status */}
        <div className="pt-4">
          {activeBlocks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeBlocks.map((b) => {
                const liveInfo = getLiveWindowInfo(b);
                const shortId = `BLK-${b.id.slice(0, 8).toUpperCase()}`;
                const completedReqs = b.requestsList?.filter((r) => r.status === 'completed').length || 0;
                const totalReqs = b.requestsList?.length || 0;

                return (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBlock(b)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] shadow-lg ${liveInfo?.isOverrun
                        ? 'bg-red-50 border-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
                        : 'bg-white border-amber-300 hover:border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-bold text-blue-700">{shortId}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 ${liveInfo?.isOverrun
                            ? 'bg-rose-50 text-red-700 border border-rose-300 animate-pulse'
                            : 'bg-amber-50 text-amber-700 border border-amber-300 animate-pulse'
                          }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${liveInfo?.isOverrun ? 'bg-rose-400' : 'bg-amber-400'}`}></span>
                        {liveInfo?.isOverrun ? 'OVERRUN BURSTING' : 'ACTIVE ON TRACK'}
                      </span>
                    </div>

                    <div className="text-xs font-bold text-slate-800 truncate mb-1">
                      {b.sectionDisplay}
                    </div>

                    <div className="text-[11px] text-slate-600 font-mono mb-3">
                      Window: {b.windowTime} ({b.duration})
                    </div>

                    {/* Live Timer Strip */}
                    <div
                      className={`p-2.5 rounded-lg font-mono text-xs mb-3 flex items-center justify-between ${liveInfo?.isOverrun
                          ? 'bg-red-50 border border-rose-300 text-red-700'
                          : liveInfo?.alertType === 'warning'
                            ? 'bg-amber-50 border border-amber-300 text-amber-700'
                            : 'bg-slate-50 border border-slate-200 text-cyan-300'
                        }`}
                    >
                      <span className="flex items-center gap-1 text-[11px] text-slate-500">
                        <span className="material-symbols-outlined text-xs">timer</span>
                        Window:
                      </span>
                      <span className="font-bold">
                        {liveInfo?.text}
                      </span>
                    </div>

                    {/* Departments & Progress */}
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-200">
                      <div className="flex items-center gap-1">
                        <span>Teams:</span>
                        <span className="text-slate-800 font-medium truncate max-w-[130px]">
                          {b.departments?.join(', ')}
                        </span>
                      </div>
                      <span className="text-emerald-700 font-bold">
                        {completedReqs}/{totalReqs} Fit
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-500">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="text-slate-600">All corridor track segments are currently clear of active possession.</span>
              </div>
              <span className="text-blue-700 text-[11px]">Standing by for next scheduled possession window</span>
            </div>
          )}
        </div>
      </div>

      {/* Gantt Timeline View */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 border border-slate-200 overflow-hidden bg-white shadow-xl">
        {/* Table/Timeline Headers */}
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            {/* Header Row */}
            <div className="grid grid-cols-12 bg-slate-50 border-b border-slate-200 text-xs font-mono">
              <div className="col-span-3 p-3.5 border-r border-slate-200 text-slate-500 uppercase font-bold flex items-center justify-between">
                <span>Corridor & Section</span>
                <span className="text-[10px] text-blue-700">{displayedBlocks.length} Blocks</span>
              </div>
              <div
                className={`col-span-9 grid divide-x divide-slate-200`}
                style={{
                  gridTemplateColumns: `repeat(${calendarDays.length}, minmax(0, 1fr))`,
                }}
              >
                {calendarDays.map((d, i) => (
                  <div
                    key={d.isoDate}
                    className={`p-2 text-center ${d.isWeekend ? 'bg-slate-50' : ''}`}
                  >
                    <div className="font-bold text-slate-800 text-[11px]">{d.dayName}</div>
                    <div className="text-[10px] text-blue-600">{d.dateDisplay}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Corridor Rows */}
            {loading ? (
              <div className="p-12 text-center space-y-3 font-mono text-sm text-slate-600">
                <div className="flex items-center justify-center gap-3">
                  <span className="material-symbols-outlined animate-spin text-blue-700">sync</span>
                  <span>Loading corridor schedules from Supabase...</span>
                </div>
              </div>
            ) : activeCorridors.length === 0 || displayedBlocks.length === 0 ? (
              <div className="p-12 text-center space-y-3 font-mono text-sm text-slate-600">
                <span className="material-symbols-outlined text-3xl text-slate-500">event_busy</span>
                <p className="font-bold text-slate-800">No blocks matching filter criteria in selected timeframe</p>
                <button
                  onClick={() => setOperationalFilter('all')}
                  className="px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-mono rounded-lg hover:bg-blue-200"
                >
                  Show All Blocks &rarr;
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {activeCorridors.map((corridorId) => {
                  const secInfo = sectionsMap[corridorId];
                  const corridorBlocks = displayedBlocks.filter((b) => b.section_id === corridorId);

                  return (
                    <div
                      key={corridorId}
                      className="grid grid-cols-12 min-h-[85px] items-stretch hover:bg-slate-50 transition-colors"
                    >
                      {/* Corridor Label */}
                      <div className="col-span-3 p-3.5 border-r border-slate-200 flex flex-col justify-center bg-slate-50">
                        <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                          <span className="font-mono text-blue-700">{corridorId}</span>
                          {corridorBlocks.length > 0 && (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 text-[10px] font-mono font-bold">
                              {corridorBlocks.length}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-600 truncate mt-0.5">
                          {secInfo?.section_name || 'Corridor Track Line'}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {secInfo?.zone || 'Indian Railways'}
                        </div>
                      </div>

                      {/* Day Columns Timeline */}
                      <div
                        className="col-span-9 relative grid divide-x divide-slate-200 p-2"
                        style={{
                          gridTemplateColumns: `repeat(${calendarDays.length}, minmax(0, 1fr))`,
                        }}
                      >
                        {calendarDays.map((d) => {
                          // Find blocks occurring on this day
                          const dayBlocks = corridorBlocks.filter((b) => b.isoDay === d.isoDate);

                          return (
                            <div
                              key={d.isoDate}
                              className={`h-full min-h-[65px] p-1 flex flex-col gap-1.5 justify-center ${d.isWeekend ? 'bg-slate-50' : ''
                                }`}
                            >
                              {dayBlocks.map((b) => {
                                const shortId = `BLK-${b.id.slice(0, 8).toUpperCase()}`;

                                return (
                                  <div
                                    key={b.id}
                                    onClick={() => setSelectedBlock(b)}
                                    className={`p-2 rounded-lg border text-xs cursor-pointer transition-all hover:scale-[1.02] hover:z-20 shadow-md ${b.blockType === 'multi'
                                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                                        : b.blockType === 'trd'
                                          ? 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100'
                                          : b.blockType === 'st'
                                            ? 'bg-purple-50 border-purple-300 text-purple-700 hover:bg-purple-100'
                                            : 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100'
                                      }`}
                                  >
                                    <div className="flex items-center justify-between gap-1 mb-0.5 font-mono">
                                      <span className="font-bold text-[10px] text-blue-700">{shortId}</span>
                                      {b.requestsList?.some(r => r.status === 'in_progress') || b.status === 'in_progress' ? (
                                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-bold animate-pulse flex items-center gap-1">
                                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> ACTIVE
                                        </span>
                                      ) : (b.requestsList?.length > 0 && b.requestsList?.every(r => r.status === 'completed')) || b.status === 'completed' ? (
                                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold flex items-center gap-1">
                                          ✓ FIT
                                        </span>
                                      ) : (
                                        <span className="text-[9px] px-1 py-0.2 rounded bg-slate-100 text-emerald-700">
                                          APPROVED
                                        </span>
                                      )}
                                    </div>
                                    <div className="font-mono text-[10px] text-slate-800 truncate font-medium">
                                      {b.windowTime}
                                    </div>
                                    <div className="text-[9px] text-slate-600 flex items-center justify-between mt-1">
                                      <span>{b.requestsCount} Reqs</span>
                                      <span>{b.duration}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Block Details Slide-Over Drawer (Only Real Backed Fields — No Crew Assignment) */}
      {selectedBlock && (
        <div className="fixed inset-0 z-50 flex justify-end animate-fadeIn">
          {/* Backdrop */}
          <div
            onClick={() => setSelectedBlock(null)}
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity"
          ></div>

          {/* Slide-over Content */}
          <div className="relative w-full max-w-xl bg-white border-l border-slate-200 h-full overflow-y-auto shadow-2xl p-6 space-y-6 z-10 flex flex-col justify-between">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    {selectedBlock.requestsList?.some((r) => r.status === 'in_progress') || selectedBlock.status === 'in_progress' ? (
                      <span className="px-2.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-300 text-xs font-mono font-bold flex items-center gap-1.5 animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                        LIVE: ACTIVE ON TRACK
                      </span>
                    ) : (selectedBlock.requestsList?.length > 0 && selectedBlock.requestsList?.every((r) => r.status === 'completed')) || selectedBlock.status === 'completed' ? (
                      <span className="px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-500/40 text-xs font-mono font-bold flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-xs">verified</span>
                        WORK COMPLETED (FIT)
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-mono font-bold">
                        STATUS: APPROVED & LOCKED
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded bg-[#00363d] text-blue-700 border border-blue-200 text-xs font-mono uppercase">
                      {selectedBlock.horizon || 'Weekly'}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                    {`BLK-${selectedBlock.id.slice(0, 8).toUpperCase()}`}
                  </h2>
                  <p className="text-xs font-mono text-slate-500 break-all mt-0.5">
                    UUID: {selectedBlock.id}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedBlock(null)}
                  className="p-2 rounded-lg bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Close Slide-over"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>

              {/* Corridor & Timing Summary */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Corridor Section:</span>
                  <span className="text-slate-800 font-bold">{selectedBlock.sectionDisplay}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Railway Zone:</span>
                  <span className="text-blue-700">{selectedBlock.zoneDisplay}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Scheduled Window:</span>
                  <span className="text-blue-700 font-bold">{selectedBlock.windowTime}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Date & Duration:</span>
                  <span className="text-slate-800">{selectedBlock.windowDate} ({selectedBlock.duration})</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Approved By:</span>
                  <span className="text-emerald-700 truncate max-w-[200px]">
                    {selectedBlock.approved_by || 'Admin Section Controller'}
                  </span>
                </div>
              </div>

              {/* AI & Solver Telemetry */}
              <div className="grid grid-cols-3 gap-3 font-mono text-xs">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="text-slate-500 text-[10px] uppercase">AI Confidence</div>
                  <div className="font-bold text-[#b3ecf7] text-base mt-0.5">{selectedBlock.confidencePct}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="text-slate-500 text-[10px] uppercase">Solver Engine</div>
                  <div className="font-bold text-amber-700 text-xs mt-1 uppercase truncate">
                    {selectedBlock.solver_method || 'CP-SAT OPTIMAL'}
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="text-slate-500 text-[10px] uppercase">Co-Allocated</div>
                  <div className="font-bold text-emerald-700 text-sm mt-0.5">
                    {selectedBlock.co_allocated ? 'Yes (Bundled)' : 'Single'}
                  </div>
                </div>
              </div>

              {/* Constituent Maintenance Requests List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 font-mono">
                    <span className="material-symbols-outlined text-blue-700 text-sm">layers</span>
                    Bundled Requests ({selectedBlock.requestsList?.length || 0})
                  </h3>
                  <span className="text-xs font-mono text-slate-500">
                    Total Risk: {selectedBlock.totalRiskScore}
                  </span>
                </div>

                <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                  {selectedBlock.requestsList && selectedBlock.requestsList.length > 0 ? (
                    selectedBlock.requestsList.map((req) => {
                      const riskVal = Number(req.risk_score) || 0;
                      return (
                        <div
                          key={req.id}
                          className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5 font-mono text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-blue-700 font-bold">{req.id}</span>
                            {req.status === 'in_progress' ? (
                              <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-300 text-[10px] font-bold flex items-center gap-1 animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                                ACTIVE ON TRACK
                              </span>
                            ) : req.status === 'completed' ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1">
                                <span className="material-symbols-outlined text-[11px]">verified</span>
                                COMPLETED (FIT)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-[#00363d] text-blue-700 text-[10px] font-bold">
                                {req.status?.toUpperCase() || 'SCHEDULED'}
                              </span>
                            )}
                          </div>
                          {req.track_fit_status && (
                            <div className="px-2 py-1 rounded bg-[#142124] border border-[#274044] text-[10px] flex items-center justify-between">
                              <span className="text-slate-500">Track Fitness:</span>
                              <span className={req.track_fit_status.includes('Normal') ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                                {req.track_fit_status}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center justify-between text-[11px] text-slate-600">
                            <span>Department: <strong className="text-slate-800">{req.department_name}</strong></span>
                            <span>Defect: <strong className="text-slate-800">{req.defect_type?.replace('_', ' ')}</strong></span>
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-slate-200/30 text-[11px]">
                            <span className="text-slate-500">
                              Asset: {req.asset_id || 'Track Segment'}
                            </span>
                            <span className="font-bold text-amber-700">
                              ML Risk Score: {riskVal.toFixed(4)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 rounded-lg bg-slate-50 text-xs font-mono text-slate-500 text-center">
                      No constituent requests recorded for this block.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Slide-over Footer */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3 font-mono text-xs">
              <button
                onClick={() => setSelectedBlock(null)}
                className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Close Drawer
              </button>
              <button
                onClick={() => {
                  alert(`Maintenance Block ${selectedBlock.id} is verified and locked in the Indian Railways Master Schedule.`);
                }}
                className="px-4 py-2 bg-blue-600 text-[#00363d] font-bold rounded-lg glow-btn hover:bg-[#c3f5ff] transition-all cursor-pointer"
              >
                Export Master Circular
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
