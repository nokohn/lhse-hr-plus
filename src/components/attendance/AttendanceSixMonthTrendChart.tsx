import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import {
  calculateSixMonthAttendanceTrends,
  SixMonthDailyTrendPoint,
  DepartmentTrendSummary,
} from '../../services/attendanceData.ts';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  CloudRain,
  Sun,
  ShieldCheck,
  Building2,
  Users,
  Clock,
  Layers,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
  Compass,
  BarChart3,
} from 'lucide-react';

export const AttendanceSixMonthTrendChart: React.FC = () => {
  const { language, attendanceRecords, employees, departments, holidays } = useApp();

  // Selected Department for focus (or 'ALL' for enterprise total, or 'COMPARE_ALL' for multi-line)
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ALL');
  const [granularity, setGranularity] = useState<'daily' | 'monthly'>('daily');
  const [showTargetLine, setShowTargetLine] = useState<boolean>(true);
  const [showOnTimeCurve, setShowOnTimeCurve] = useState<boolean>(false);
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  // Calculate 6-month attendance analytics
  const analytics = useMemo(() => {
    return calculateSixMonthAttendanceTrends(
      attendanceRecords,
      employees,
      departments,
      holidays
    );
  }, [attendanceRecords, employees, departments, holidays]);

  const { dailyPoints, monthlySummaries, deptSummaries, overallSixMonthAvg, overallOnTimeAvg } = analytics;

  // Active hover point
  const activeHoverPoint: SixMonthDailyTrendPoint | null =
    hoveredPointIndex !== null && dailyPoints[hoveredPointIndex]
      ? dailyPoints[hoveredPointIndex]
      : null;

  // SVG Chart Geometry Constants
  const SVG_WIDTH = 1000;
  const SVG_HEIGHT = 380;
  const PADDING = { top: 40, right: 30, bottom: 50, left: 60 };
  const CHART_WIDTH = SVG_WIDTH - PADDING.left - PADDING.right;
  const CHART_HEIGHT = SVG_HEIGHT - PADDING.top - PADDING.bottom;

  const Y_MIN = 50; // 50%
  const Y_MAX = 100; // 100%

  // Helper to map (index, value) to SVG (x, y) coordinates
  const getX = (index: number, total: number) => {
    if (total <= 1) return PADDING.left;
    return PADDING.left + (index / (total - 1)) * CHART_WIDTH;
  };

  const getY = (val: number) => {
    const clamped = Math.max(Y_MIN, Math.min(Y_MAX, val));
    const ratio = (clamped - Y_MIN) / (Y_MAX - Y_MIN);
    return PADDING.top + CHART_HEIGHT - ratio * CHART_HEIGHT;
  };

  // Build SVG Path for line and area fill
  const generatePath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return '';
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      // Simple smoothing with cubic bezier
      const prev = points[i - 1];
      const curr = points[i];
      const cx1 = prev.x + (curr.x - prev.x) / 2;
      const cy1 = prev.y;
      const cx2 = prev.x + (curr.x - prev.x) / 2;
      const cy2 = curr.y;
      path += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${curr.x} ${curr.y}`;
    }
    return path;
  };

  // Generate coordinates for Daily Points
  const dailyCoords = useMemo(() => {
    const total = dailyPoints.length;
    return dailyPoints.map((p, idx) => {
      let rate = p.overallRate;
      if (selectedDeptFilter !== 'ALL' && selectedDeptFilter !== 'COMPARE_ALL') {
        rate = p.deptRates[selectedDeptFilter] ?? p.overallRate;
      }
      return {
        x: getX(idx, total),
        y: getY(rate),
        onTimeY: getY(p.onTimeRate),
        point: p,
      };
    });
  }, [dailyPoints, selectedDeptFilter]);

  // Generate coordinates for Monthly Points
  const monthlyCoords = useMemo(() => {
    const total = monthlySummaries.length;
    return monthlySummaries.map((m, idx) => {
      let rate = m.avgAttendanceRate;
      if (selectedDeptFilter !== 'ALL' && selectedDeptFilter !== 'COMPARE_ALL') {
        const dept = deptSummaries.find((d) => d.deptId === selectedDeptFilter);
        const mObj = dept?.monthlyRates.find((mr) => mr.monthCode === m.monthCode);
        rate = mObj ? mObj.rate : m.avgAttendanceRate;
      }
      return {
        x: getX(idx, total),
        y: getY(rate),
        onTimeY: getY(m.avgOnTimeRate),
        summary: m,
      };
    });
  }, [monthlySummaries, selectedDeptFilter, deptSummaries]);

  // Coordinate paths
  const mainLinePath = useMemo(() => {
    if (granularity === 'daily') {
      const pts = dailyCoords.map((c) => ({ x: c.x, y: c.y }));
      return generatePath(pts);
    } else {
      const pts = monthlyCoords.map((c) => ({ x: c.x, y: c.y }));
      return generatePath(pts);
    }
  }, [granularity, dailyCoords, monthlyCoords]);

  const onTimeLinePath = useMemo(() => {
    if (!showOnTimeCurve) return '';
    if (granularity === 'daily') {
      const pts = dailyCoords.map((c) => ({ x: c.x, y: c.onTimeY }));
      return generatePath(pts);
    } else {
      const pts = monthlyCoords.map((c) => ({ x: c.x, y: c.onTimeY }));
      return generatePath(pts);
    }
  }, [granularity, showOnTimeCurve, dailyCoords, monthlyCoords]);

  const areaFillPath = useMemo(() => {
    if (!mainLinePath) return '';
    const bottomY = PADDING.top + CHART_HEIGHT;
    const firstX = granularity === 'daily' ? dailyCoords[0]?.x : monthlyCoords[0]?.x;
    const lastX =
      granularity === 'daily'
        ? dailyCoords[dailyCoords.length - 1]?.x
        : monthlyCoords[monthlyCoords.length - 1]?.x;

    return `${mainLinePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [mainLinePath, granularity, dailyCoords, monthlyCoords]);

  // Departmental multi-line paths when in 'COMPARE_ALL' mode
  const deptLinePaths = useMemo(() => {
    if (selectedDeptFilter !== 'COMPARE_ALL') return [];

    return deptSummaries.map((dept) => {
      const pts = dailyPoints.map((p, idx) => {
        const rate = p.deptRates[dept.deptId] ?? p.overallRate;
        return {
          x: getX(idx, dailyPoints.length),
          y: getY(rate),
        };
      });
      return {
        dept,
        path: generatePath(pts),
      };
    });
  }, [selectedDeptFilter, deptSummaries, dailyPoints]);

  // Seasonal section bands (May: Pre-monsoon, Jun-Aug: Monsoon peak, Sep-Oct: Dry season)
  const seasonBands = useMemo(() => {
    // Indices for each month
    const total = dailyPoints.length;
    if (total === 0) return [];

    const getMonthRange = (mNum: number) => {
      const indices: number[] = [];
      dailyPoints.forEach((p, i) => {
        if (p.monthNum === mNum) indices.push(i);
      });
      if (indices.length === 0) return null;
      return {
        start: indices[0],
        end: indices[indices.length - 1],
      };
    };

    const mayRange = getMonthRange(5);
    const monsoonRangeStart = getMonthRange(6);
    const monsoonRangeEnd = getMonthRange(8);
    const dryRangeStart = getMonthRange(9);
    const dryRangeEnd = getMonthRange(10);

    const bands = [];
    if (mayRange) {
      bands.push({
        nameEn: 'Pre-Monsoon Season',
        nameLao: 'ໄລຍະຕົ້ນລະດູຝົນ',
        x1: getX(mayRange.start, total),
        x2: getX(mayRange.end, total),
        fill: 'fill-sky-500/5',
        border: 'border-sky-300',
        badge: 'May (Pre-Storm)',
      });
    }

    if (monsoonRangeStart && monsoonRangeEnd) {
      bands.push({
        nameEn: 'Heavy Monsoon Rain Season (Nam Theun 2 Flood Season)',
        nameLao: 'ລະດູຝົນຕົກໜັກສຸດ (ລະດູພາຍຸ ແລະ ນ້ຳລົ້ນເຂື່ອນ)',
        x1: getX(monsoonRangeStart.start, total),
        x2: getX(monsoonRangeEnd.end, total),
        fill: 'fill-blue-500/10',
        border: 'border-blue-400',
        badge: 'Jun - Aug (Heavy Rainfall)',
      });
    }

    if (dryRangeStart && dryRangeEnd) {
      bands.push({
        nameEn: 'Post-Monsoon & Dry Season Operations',
        nameLao: 'ໄລຍະທ້າຍລະດູຝົນ & ຕົ້ນລະດູແລ້ງ',
        x1: getX(dryRangeStart.start, total),
        x2: getX(dryRangeEnd.end, total),
        fill: 'fill-emerald-500/5',
        border: 'border-emerald-300',
        badge: 'Sep - Oct (High Activity)',
      });
    }

    return bands;
  }, [dailyPoints]);

  return (
    <div className="space-y-6">
      {/* Executive Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  {language === 'lo'
                    ? 'ແນວໂນ້ມການມາເຮັດວຽກສະເລ່ຍປະຈຳວັນ 6 ເດືອນ (6-Month Attendance Bar Chart)'
                    : 'Average Daily Attendance — 6-Month Bar Chart'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  May – Oct 2026
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'lo'
                  ? 'ວິເຄາະຄວາມຜັນຜວນຕາມລະດູການ (Seasonal Weather Shifts) ແລະ ປຽບທຽບລະຫວ່າງແຕ່ລະພະແນກ (Departmental Patterns)'
                  : 'Track seasonal weather dips, monsoon impact on field operations, and compare performance across operating departments'}
              </p>
            </div>
          </div>

          {/* Controls: Granularity & Department Filter */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Department Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <select
                aria-label={language === 'lo' ? 'ເລືອກພະແນກເພື່ອສະແດງ' : 'Select department filter'}
                value={selectedDeptFilter}
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-hidden cursor-pointer"
              >
                <option value="ALL">
                  {language === 'lo' ? '🏢 ທັງໝົດບໍລິສັດ (Enterprise Total)' : '🏢 Enterprise Total (All Depts)'}
                </option>
                <option value="COMPARE_ALL">
                  {language === 'lo' ? '📊 ປຽບທຽບທຸກພະແນກ (Multi-Line Overlay)' : '📊 Compare All Departments (Overlay)'}
                </option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {language === 'lo' && dept.nameLao ? dept.nameLao : dept.nameEn}
                  </option>
                ))}
              </select>
            </div>

            {/* Granularity Switcher */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setGranularity('daily')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  granularity === 'daily'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {language === 'lo' ? 'ລາຍວັນ (Daily 130d)' : 'Daily (130 Days)'}
              </button>
              <button
                onClick={() => setGranularity('monthly')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  granularity === 'monthly'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {language === 'lo' ? 'ລາຍເດືອນ (6 Months)' : 'Monthly Averages'}
              </button>
            </div>

            {/* On-Time Curve Toggle */}
            <button
              onClick={() => setShowOnTimeCurve(!showOnTimeCurve)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold border transition-all ${
                showOnTimeCurve
                  ? 'bg-blue-50 border-blue-400 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              <span>{language === 'lo' ? 'ເສັ້ນມາກົງເວລາ (On-Time)' : 'On-Time Overlay'}</span>
            </button>
          </div>
        </div>

        {/* 6-Month Key Performance Indicators Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          {/* 6-Month Average */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>{language === 'lo' ? 'ອັດຕາສະເລ່ຍ 6 ເດືອນ' : '6-Month Avg Attendance'}</span>
              <Users className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {overallSixMonthAvg}%
              </span>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                +2.4% vs LY
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {analytics.totalWorkdaysTracked} {language === 'lo' ? 'ວັນລັດຖະການທີ່ບັນທຶກ' : 'workdays analyzed'}
            </p>
          </div>

          {/* Monsoon Season Impact (July Dip) */}
          <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/60">
            <div className="flex items-center justify-between text-blue-700 dark:text-blue-400 text-xs font-medium">
              <span>{language === 'lo' ? 'ຈຸດຕໍ່າສຸດລະດູຝົນ (Monsoon Dip)' : 'Monsoon Season Dip'}</span>
              <CloudRain className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black text-blue-700 dark:text-blue-300">
                77%
              </span>
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                July 2026
              </span>
            </div>
            <p className="text-[10px] text-blue-600/80 dark:text-blue-400/80 mt-0.5">
              {language === 'lo' ? 'ພາຍຸຝົນຕົກໜັກ & ນ້ຳຖ້ວມທາງ' : 'Tropical downpours & road washouts'}
            </p>
          </div>

          {/* Dry Season Peak (October) */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60">
            <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 text-xs font-medium">
              <span>{language === 'lo' ? 'ຈຸດສູງສຸດລະດູແລ້ງ (Peak Operations)' : 'Dry Season Peak'}</span>
              <Sun className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
                94%
              </span>
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                October 2026
              </span>
            </div>
            <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">
              {language === 'lo' ? 'ອາກາດແຈ້ງໃສ & ເປີດໂຄງການເຂື່ອນ' : 'Dry season field acceleration'}
            </p>
          </div>

          {/* On-Time Arrival Stability */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>{language === 'lo' ? 'ອັດຕາມາກົງເວລາສະເລ່ຍ' : 'Average On-Time Arrival'}</span>
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                {overallOnTimeAvg}%
              </span>
              <span className="text-[10px] font-semibold text-slate-500">
                Threshold 08:30
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {language === 'lo' ? 'ອັດຕາຊ້າຕ່ຳໃນກຸ່ມຫ້ອງການໃຫຍ່' : 'Resilient HQ attendance'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Interactive SVG Line Chart */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span>
                {selectedDeptFilter === 'ALL'
                  ? language === 'lo'
                    ? 'ກຣາຟເສັ້ນສະແດງການມາເຮັດວຽກຕົວຈິງ ທົ່ວທັງອົງກອນ (Enterprise Daily Average)'
                    : 'Enterprise Overall Daily Attendance Curve'
                  : selectedDeptFilter === 'COMPARE_ALL'
                  ? language === 'lo'
                    ? 'ກຣາຟປຽບທຽບແນວໂນ້ມທຸກພະແນກ (Multi-Department Seasonal Overlay)'
                    : 'All Departments Comparative Trend Overlay'
                  : language === 'lo'
                  ? `ກຣາຟເສັ້ນສະແດງ: ${departments.find((d) => d.id === selectedDeptFilter)?.nameLao || ''}`
                  : `Departmental Curve: ${departments.find((d) => d.id === selectedDeptFilter)?.nameEn || ''}`}
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {language === 'lo'
                ? 'ເລື່ອນເມົາສ໌ໄປຕາມເສັ້ນກຣາຟເພື່ອເບິ່ງລາຍລະອຽດແຕ່ລະວັນ ແລະ ເຂດສະພາບອາກາດ'
                : 'Hover along the line to inspect daily values, weather phases, and departmental stats'}
            </p>
          </div>

          {/* Legend Items */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-1 bg-emerald-500 rounded-full inline-block" />
              <span className="text-slate-600 dark:text-slate-300 font-semibold">
                {language === 'lo' ? 'ການມາເຮັດວຽກ (%)' : 'Attendance Rate (%)'}
              </span>
            </div>

            {showOnTimeCurve && (
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-0.5 border-t-2 border-dashed border-blue-500 inline-block" />
                <span className="text-slate-600 dark:text-slate-300 font-semibold">
                  {language === 'lo' ? 'ມາກົງເວລາ (%)' : 'On-Time Arrival (%)'}
                </span>
              </div>
            )}

            {showTargetLine && (
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-0.5 border-t border-rose-400 inline-block" />
                <span className="text-slate-400 text-[11px]">
                  Target (85%)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* SVG Viewport */}
        <div className="relative w-full overflow-hidden select-none">
          <svg
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
            className="w-full h-auto cursor-crosshair"
            onMouseLeave={() => setHoveredPointIndex(null)}
          >
            <defs>
              {/* Gradient for area fill */}
              <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.28" />
                <stop offset="60%" stopColor="#10b981" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.00" />
              </linearGradient>

              {/* Gradient for rainy season dip */}
              <linearGradient id="monsoonZoneGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Seasonal Background Shading Bands */}
            {seasonBands.map((band, idx) => (
              <g key={`band-${idx}`}>
                <rect
                  x={band.x1}
                  y={PADDING.top}
                  width={Math.max(10, band.x2 - band.x1)}
                  height={CHART_HEIGHT}
                  fill={idx === 1 ? 'url(#monsoonZoneGradient)' : '#f8fafc'}
                  className="transition-colors dark:fill-slate-800/30"
                />
                <text
                  x={band.x1 + 8}
                  y={PADDING.top + 16}
                  fontSize="10"
                  fontWeight="bold"
                  fill="#64748b"
                  className="font-mono tracking-tight"
                >
                  {band.badge}
                </text>
              </g>
            ))}

            {/* Horizontal Gridlines & Y-Axis Labels */}
            {[50, 60, 70, 80, 85, 90, 100].map((val) => {
              const yPos = getY(val);
              const isTarget = val === 85;

              return (
                <g key={`y-${val}`}>
                  <line
                    x1={PADDING.left}
                    y1={yPos}
                    x2={SVG_WIDTH - PADDING.right}
                    y2={yPos}
                    stroke={isTarget ? '#f43f5e' : '#e2e8f0'}
                    strokeDasharray={isTarget ? '4 4' : undefined}
                    strokeWidth={isTarget ? '1.5' : '1'}
                    className="dark:stroke-slate-800"
                  />
                  <text
                    x={PADDING.left - 10}
                    y={yPos + 4}
                    textAnchor="end"
                    fontSize="10"
                    fontWeight={isTarget ? 'bold' : 'normal'}
                    fill={isTarget ? '#f43f5e' : '#94a3b8'}
                  >
                    {val}%
                  </text>
                </g>
              );
            })}

            {/* Target 85% label badge */}
            {showTargetLine && (
              <text
                x={SVG_WIDTH - PADDING.right - 4}
                y={getY(85) - 6}
                textAnchor="end"
                fontSize="9"
                fontWeight="bold"
                fill="#f43f5e"
              >
                Target 85%
              </text>
            )}

            {/* Daily Mode Vertical Bars */}
            {granularity === 'daily' &&
              dailyCoords.map((coord, idx) => {
                const total = dailyCoords.length;
                const slotWidth = CHART_WIDTH / total;
                const barWidth = Math.max(3, slotWidth - 2);
                const barHeight = Math.max(2, PADDING.top + CHART_HEIGHT - coord.y);
                const isHovered = hoveredPointIndex === idx;

                return (
                  <g key={`daily-bar-${idx}`}>
                    <rect
                      x={coord.x - barWidth / 2}
                      y={coord.y}
                      width={barWidth}
                      height={barHeight}
                      rx={1.5}
                      fill={
                        isHovered
                          ? '#059669'
                          : coord.point.monthNum === 7
                          ? '#3b82f6'
                          : '#10b981'
                      }
                      opacity={isHovered ? 1 : 0.85}
                      className="transition-colors"
                    />
                    {showOnTimeCurve && (
                      <rect
                        x={coord.x - barWidth / 2}
                        y={coord.onTimeY}
                        width={barWidth}
                        height={2}
                        fill="#60a5fa"
                        rx={1}
                      />
                    )}
                  </g>
                );
              })}

            {/* Monthly Mode Vertical Bars */}
            {granularity === 'monthly' &&
              monthlyCoords.map((coord, idx) => {
                const barWidth = showOnTimeCurve ? 26 : 48;
                const barHeight = Math.max(4, PADDING.top + CHART_HEIGHT - coord.y);
                const xOffset = showOnTimeCurve ? -28 : -24;

                return (
                  <g key={`monthly-bar-${idx}`}>
                    <rect
                      x={coord.x + xOffset}
                      y={coord.y}
                      width={barWidth}
                      height={barHeight}
                      rx={6}
                      fill="url(#attendanceGradient)"
                      stroke="#059669"
                      strokeWidth="1.5"
                      className="hover:opacity-90 transition-opacity"
                    />
                    {showOnTimeCurve && (
                      <rect
                        x={coord.x + 2}
                        y={getY(coord.summary.avgOnTimeRate)}
                        width={barWidth}
                        height={Math.max(4, PADDING.top + CHART_HEIGHT - getY(coord.summary.avgOnTimeRate))}
                        rx={6}
                        fill="#3b82f6"
                        opacity={0.85}
                        stroke="#1d4ed8"
                        strokeWidth="1.5"
                        className="hover:opacity-100 transition-opacity"
                      />
                    )}
                  </g>
                );
              })}

            {/* Monthly Ticks and Month Labels on X-Axis */}
            {monthlySummaries.map((m, mIdx) => {
              const xPos =
                granularity === 'monthly'
                  ? monthlyCoords[mIdx]?.x || 0
                  : getX(
                      dailyPoints.findIndex((p) => p.monthCode === m.monthCode),
                      dailyPoints.length
                    );

              return (
                <g key={m.monthCode}>
                  <line
                    x1={xPos}
                    y1={PADDING.top + CHART_HEIGHT}
                    x2={xPos}
                    y2={PADDING.top + CHART_HEIGHT + 6}
                    stroke="#94a3b8"
                    strokeWidth="1.5"
                  />
                  <text
                    x={xPos + (granularity === 'daily' ? 35 : 0)}
                    y={PADDING.top + CHART_HEIGHT + 22}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="bold"
                    fill="#334155"
                    className="dark:fill-slate-300"
                  >
                    {language === 'lo' ? m.monthNameLao.split(' ')[0] : m.monthNameEn.split(' ')[0]}
                  </text>
                  <text
                    x={xPos + (granularity === 'daily' ? 35 : 0)}
                    y={PADDING.top + CHART_HEIGHT + 36}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="semibold"
                    fill={m.status === 'MONSOON_DIP' ? '#2563eb' : '#64748b'}
                  >
                    {m.avgAttendanceRate}% avg
                  </text>
                </g>
              );
            })}

            {/* Monthly Bar Value Labels */}
            {granularity === 'monthly' &&
              monthlyCoords.map((coord, idx) => (
                <text
                  key={`monthly-label-${idx}`}
                  x={coord.x + (showOnTimeCurve ? -15 : 0)}
                  y={coord.y - 8}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="black"
                  fill="#0f172a"
                  className="dark:fill-slate-100 font-mono"
                >
                  {coord.summary.avgAttendanceRate}%
                </text>
              ))}

            {/* Interactive Overlay Event Rectangles for Daily Mode */}
            {granularity === 'daily' &&
              dailyCoords.map((coord, idx) => {
                const total = dailyCoords.length;
                const slotWidth = CHART_WIDTH / total;

                return (
                  <rect
                    key={`hit-slot-${idx}`}
                    x={coord.x - slotWidth / 2}
                    y={PADDING.top}
                    width={slotWidth}
                    height={CHART_HEIGHT}
                    fill="transparent"
                    onMouseEnter={() => setHoveredPointIndex(idx)}
                    className="cursor-pointer"
                  />
                );
              })}

            {/* Active Hover Marker (Vertical crosshair line & dot) */}
            {granularity === 'daily' && hoveredPointIndex !== null && dailyCoords[hoveredPointIndex] && (
              <g>
                <line
                  x1={dailyCoords[hoveredPointIndex].x}
                  y1={PADDING.top}
                  x2={dailyCoords[hoveredPointIndex].x}
                  y2={PADDING.top + CHART_HEIGHT}
                  stroke="#3b82f6"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
                <circle
                  cx={dailyCoords[hoveredPointIndex].x}
                  cy={dailyCoords[hoveredPointIndex].y}
                  r="6"
                  fill="#10b981"
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  className="shadow-md"
                />
                {showOnTimeCurve && (
                  <circle
                    cx={dailyCoords[hoveredPointIndex].x}
                    cy={dailyCoords[hoveredPointIndex].onTimeY}
                    r="5"
                    fill="#3b82f6"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                )}
              </g>
            )}
          </svg>

          {/* Floating Hover Tooltip Card (Positioned based on mouse index) */}
          {activeHoverPoint && (
            <div className="mt-3 p-4 bg-slate-900 text-white rounded-2xl shadow-xl border border-slate-700 max-w-lg transition-all animate-in fade-in">
              <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-xs">
                    {new Date(activeHoverPoint.date).toLocaleDateString(
                      language === 'lo' ? 'lo-LA' : 'en-US',
                      { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }
                    )}
                  </span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-900/60 text-blue-300 border border-blue-700">
                  {language === 'lo' ? activeHoverPoint.seasonPhaseLao : activeHoverPoint.seasonPhaseEn}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2 text-center">
                <div className="p-2 bg-slate-800/60 rounded-xl">
                  <div className="text-[10px] text-slate-400">{language === 'lo' ? 'ອັດຕາການມາ' : 'Attendance'}</div>
                  <div className="text-base font-black text-emerald-400">{activeHoverPoint.overallRate}%</div>
                  <div className="text-[9px] text-slate-400">
                    {activeHoverPoint.presentCount}/{activeHoverPoint.totalScheduled} {language === 'lo' ? 'ຄົນ' : 'staff'}
                  </div>
                </div>

                <div className="p-2 bg-slate-800/60 rounded-xl">
                  <div className="text-[10px] text-slate-400">{language === 'lo' ? 'ມາກົງເວລາ' : 'On-Time'}</div>
                  <div className="text-base font-black text-blue-400">{activeHoverPoint.onTimeRate}%</div>
                  <div className="text-[9px] text-slate-400">
                    {activeHoverPoint.lateCount} {language === 'lo' ? 'ມາກາຍ' : 'late'}
                  </div>
                </div>

                <div className="p-2 bg-slate-800/60 rounded-xl">
                  <div className="text-[10px] text-slate-400">{language === 'lo' ? 'ຂາດ / ລາ' : 'Absent/Leave'}</div>
                  <div className="text-base font-black text-amber-400">
                    {activeHoverPoint.absentCount + activeHoverPoint.onLeaveCount}
                  </div>
                  <div className="text-[9px] text-slate-400">
                    {activeHoverPoint.onLeaveCount} {language === 'lo' ? 'ລາພັກ' : 'on leave'}
                  </div>
                </div>
              </div>

              {/* Department breakdown in tooltip */}
              <div className="mt-2.5 pt-2 border-t border-slate-800">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  {language === 'lo' ? 'ອັດຕາຕາມພະແນກ (Department Breakdown):' : 'Department Breakdown:'}
                </div>
                <div className="flex flex-wrap gap-2">
                  {deptSummaries.map((dept) => (
                    <span
                      key={dept.deptId}
                      className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 flex items-center gap-1"
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: dept.color }} />
                      <span className="truncate max-w-28">{dept.nameEn}:</span>
                      <strong className="text-white">{activeHoverPoint.deptRates[dept.deptId] ?? activeHoverPoint.overallRate}%</strong>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Seasonal & Departmental Pattern Insights Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Seasonal Insight Card */}
        <div className="p-5 rounded-3xl bg-linear-to-br from-blue-50 to-indigo-50/50 dark:from-slate-900 dark:to-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-bold text-xs">
            <CloudRain className="w-4 h-4 text-blue-600" />
            <span>{language === 'lo' ? 'ຜົນກະທົບລະດູການ (Seasonal Pattern)' : 'Seasonal Weather Pattern'}</span>
          </div>
          <h4 className="font-black text-sm text-slate-900 dark:text-slate-100">
            {language === 'lo'
              ? 'ລະດູຝົນ (Monsoon) ກະທົບການລົງເວລາໃນເດືອນ ກໍລະກົດ–ສິງຫາ'
              : 'Heavy Monsoon Rain Season Dip (July–August)'}
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {language === 'lo'
              ? 'ໃນໄລຍະເດືອນ 7 ແລະ 8, ອັດຕາການມາເຮັດວຽກຫຼຸດລົງເຫຼືອ 77% ເນື່ອງຈາກຝົນຕົກໜັກຕໍ່ເນື່ອງ ແລະ ດິນເຈື່ອນໃນເຂດພາກກາງ ແລະ ພາກສະໜາມເຂື່ອນນ້ຳເທີນ 2, ເຮັດໃຫ້ການເດີນທາງຊັກຊ້າ.'
              : 'Enterprise attendance dipped to 77% in July and 80% in August due to torrential monsoon rainfall, transport route flooding in Central Laos, and field access road closures near Nam Theun 2.'}
          </p>
          <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>{language === 'lo' ? 'ຫຼຸດລົງ 12% ທຽບກັບໄລຍະລະດູແລ້ງ' : 'Seasonal delta: -12% vs dry season'}</span>
          </div>
        </div>

        {/* Departmental Pattern Card */}
        <div className="p-5 rounded-3xl bg-linear-to-br from-purple-50 to-pink-50/50 dark:from-slate-900 dark:to-purple-950/40 border border-purple-200/80 dark:border-purple-900/60 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-bold text-xs">
            <Building2 className="w-4 h-4 text-purple-600" />
            <span>{language === 'lo' ? 'ຄວາມຕ່າງລະຫວ່າງພະແນກ (Departmental Pattern)' : 'Departmental Resilience'}</span>
          </div>
          <h4 className="font-black text-sm text-slate-900 dark:text-slate-100">
            {language === 'lo'
              ? 'ພະແນກບັນຊີ & ບໍລິຫານ ມີຄວາມໝັ້ນຄົງສູງກວ່າພາກສະໜາມ'
              : 'HQ Finance & Legal Outperform Field Energy Teams'}
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {language === 'lo'
              ? 'ພະແນກການເງິນ (Finance) ແລະ ບໍລິຫານ (Admin) ຮັກສາອັດຕາສູງກວ່າ 93% ຕະຫຼອດ 6 ເດືອນ ຍ້ອນຕັ້ງຢູ່ສຳນັກງານໃຫຍ່ວຽງຈັນ, ຂະນະທີ່ພະແນກໂຄງການພະລັງງານ (Energy Projects) ມີຄວາມຜັນຜວນສູງສຸດ.'
              : 'Finance & Accounting maintained 95% attendance with near-zero weather disruption due to Vientiane HQ proximity, whereas Energy Projects experienced high variance depending on dam site rain.'}
          </p>
          <div className="text-[11px] font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{language === 'lo' ? 'ພະແນກການເງິນຄົງທີ່ສຸດ: 95.2% avg' : 'Finance resilience: 95.2% avg'}</span>
          </div>
        </div>

        {/* Strategic Takeaway Card */}
        <div className="p-5 rounded-3xl bg-linear-to-br from-emerald-50 to-teal-50/50 dark:from-slate-900 dark:to-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/60 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>{language === 'lo' ? 'ຂໍ້ສະເໜີແນະດ້ານບຸກຄະລາກອນ (HR Strategic Insights)' : 'HR Workforce Strategy'}</span>
          </div>
          <h4 className="font-black text-sm text-slate-900 dark:text-slate-100">
            {language === 'lo'
              ? 'ການຟື້ນຕົວເຕັມກຳລັງໃນເດືອນ ຕຸລາ (October Rebound)'
              : 'Post-Monsoon Operations Surge (October)'}
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {language === 'lo'
              ? 'ເມື່ອເຂົ້າສູ່ເດືອນ 10 (ລະດູແລ້ງ), ການມາເຮັດວຽກຟື້ນຂຶ້ນມາເປັນ 94% ພ້ອມກັບການເລັ່ງລັດກວດກາໂຄງການເຂື່ອນໄຟຟ້າ. ແນະນຳໃຫ້ຈັດການລາພັກປະຈຳປີໃນຊ່ວງລະດູຝົນເພື່ອຮັກສາກຳລັງຄົນ.'
              : 'Attendance sharply recovered to 94% in October as dry season hydropower construction resumed. HR recommends encouraging planned annual leave in July–August to optimize workforce readiness.'}
          </p>
          <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <Sun className="w-3.5 h-3.5" />
            <span>{language === 'lo' ? 'ການຟື້ນຕົວ: +17% ຈາກເດືອນ 7' : 'Rebound: +17% from July trough'}</span>
          </div>
        </div>
      </div>

      {/* Departmental Comparison Scorecard Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>
              {language === 'lo'
                ? 'ຕາຕະລາງປຽບທຽບສະຖິຕິການມາເຮັດວຽກ 6 ເດືອນ ແຍກຕາມພະແນກ'
                : 'Departmental 6-Month Attendance Comparison Matrix'}
            </span>
          </h3>
          <span className="text-xs text-slate-400">
            {language === 'lo' ? 'ຄລິກໃສ່ພະແນກເພື່ອເນັ້ນກຣາຟ' : 'Click any row to filter chart curve'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-3">{language === 'lo' ? 'ພະແນກ' : 'Department'}</th>
                <th className="py-2.5 px-3 text-center">{language === 'lo' ? 'ຈຳນວນຄົນ' : 'Headcount'}</th>
                <th className="py-2.5 px-3 text-center">{language === 'lo' ? 'ສະເລ່ຍ 6 ເດືອນ' : '6-Mo Average'}</th>
                <th className="py-2.5 px-3 text-center">{language === 'lo' ? 'ເດືອນຝົນຕົກ (Jul)' : 'Jul (Monsoon)'}</th>
                <th className="py-2.5 px-3 text-center">{language === 'lo' ? 'ເດືອນແລ້ງ (Oct)' : 'Oct (Dry Peak)'}</th>
                <th className="py-2.5 px-3 text-center">{language === 'lo' ? 'ຄວາມທົນທານຕໍ່ສະພາບອາກາດ' : 'Weather Resilience'}</th>
                <th className="py-2.5 px-3 text-right">{language === 'lo' ? 'ການດຳເນີນການ' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {deptSummaries.map((dept) => {
                const julRate = dept.monthlyRates.find((m) => m.monthCode === '2026-07')?.rate || 80;
                const octRate = dept.monthlyRates.find((m) => m.monthCode === '2026-10')?.rate || 94;
                const isSelected = selectedDeptFilter === dept.deptId;

                return (
                  <tr
                    key={dept.deptId}
                    onClick={() => setSelectedDeptFilter(isSelected ? 'ALL' : dept.deptId)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50/80 dark:bg-blue-950/40 font-semibold'
                        : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: dept.color }} />
                        <div>
                          <div className="font-bold text-slate-800 dark:text-slate-100">
                            {language === 'lo' && dept.nameLao ? dept.nameLao : dept.nameEn}
                          </div>
                          <div className="text-[10px] text-slate-400">{dept.nameEn}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center font-semibold text-slate-600 dark:text-slate-300">
                      {dept.headcount} {language === 'lo' ? 'ຄົນ' : 'staff'}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                        {dept.overallAvg}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        julRate < 80
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {julRate}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {octRate}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          dept.overallAvg >= 92
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : dept.overallAvg >= 85
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {dept.overallAvg >= 92
                          ? language === 'lo'
                            ? 'ສູງ (High Resilience)'
                            : 'High'
                          : dept.overallAvg >= 85
                          ? language === 'lo'
                            ? 'ປານກາງ (Moderate)'
                            : 'Moderate'
                          : language === 'lo'
                          ? 'ອ່ອນໄຫວຕໍ່ຝົນ (Weather Vulnerable)'
                          : 'Weather Sensitive'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDeptFilter(isSelected ? 'ALL' : dept.deptId);
                        }}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                      >
                        {isSelected ? (language === 'lo' ? 'ຍົກເລີກ' : 'Reset') : (language === 'lo' ? 'ເບິ່ງເສັ້ນ' : 'View Curve')}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
