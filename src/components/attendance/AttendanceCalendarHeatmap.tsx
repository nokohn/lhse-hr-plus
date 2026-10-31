import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { AttendanceRecord, Employee, Department } from '../../types/index.ts';
import {
  calculateMonthHeatmapSummaries,
  DayAttendanceSummary,
  getIntensityColorClass,
} from '../../services/attendanceData.ts';
import { Modal } from '../common/Modal.tsx';
import { AttendanceSixMonthTrendChart } from './AttendanceSixMonthTrendChart.tsx';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  UserCheck,
  UserX,
  Clock,
  Filter,
  Grid,
  Layers,
  Info,
  CheckCircle2,
  CalendarDays,
  Search,
  Sparkles,
  BarChart3,
} from 'lucide-react';

export const AttendanceCalendarHeatmap: React.FC = () => {
  const {
    language,
    attendanceRecords,
    employees,
    departments,
    holidays,
    positions,
  } = useApp();

  // Navigation state (Default to October 2026 where comprehensive data exists)
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(10); // 1 - 12
  const [selectedDeptId, setSelectedDeptId] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'calendar' | 'matrix' | 'barchart'>('calendar');
  const [tierHighlightFilter, setTierHighlightFilter] = useState<string | null>(null);

  // Selected Day Drilldown Modal State
  const [selectedDaySummary, setSelectedDaySummary] = useState<DayAttendanceSummary | null>(null);
  const [drilldownSearch, setDrilldownSearch] = useState<string>('');
  const [drilldownStatusFilter, setDrilldownStatusFilter] = useState<string>('ALL');

  // Month names
  const monthNamesLao = [
    'ມັງກອນ (January)',
    'ກຸມພາ (February)',
    'ມີນາ (March)',
    'ເມສາ (April)',
    'ພຶດສະພາ (May)',
    'ມິຖຸນາ (June)',
    'ກໍລະກົດ (July)',
    'ສິງຫາ (August)',
    'ກັນຍາ (September)',
    'ຕຸລາ (October)',
    'ພະຈິກ (November)',
    'ທັນວາ (December)',
  ];

  const monthNamesEn = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const weekdayHeadersLao = ['ອາທິດ', 'ຈັນ', 'ອັງຄານ', 'ພຸດ', 'ພະຫັດ', 'ສຸກ', 'ເສົາ'];
  const weekdayHeadersEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Calculate day summaries for current month & selected department
  const monthSummaries = useMemo(() => {
    return calculateMonthHeatmapSummaries(
      currentYear,
      currentMonth,
      attendanceRecords,
      employees,
      holidays,
      selectedDeptId
    );
  }, [currentYear, currentMonth, attendanceRecords, employees, holidays, selectedDeptId]);

  // Macro Metrics for the Month
  const monthlyMetrics = useMemo(() => {
    const workdays = monthSummaries.filter(
      (s) => !s.isWeekend && !s.holidayName && s.records.length > 0
    );

    if (workdays.length === 0) {
      return {
        avgAttendanceRate: 0,
        avgOnTimeRate: 0,
        peakDay: null as DayAttendanceSummary | null,
        lowestDay: null as DayAttendanceSummary | null,
        totalLateness: 0,
        totalAbsence: 0,
        workdaysCount: 0,
        tierCounts: { PEAK: 0, HIGH: 0, MODERATE: 0, LOW: 0, OFF: 0 },
      };
    }

    const totalRate = workdays.reduce((acc, curr) => acc + curr.attendanceRate, 0);
    const avgAttendanceRate = Math.round(totalRate / workdays.length);

    const totalOnTime = workdays.reduce((acc, curr) => acc + curr.onTimeRate, 0);
    const avgOnTimeRate = Math.round(totalOnTime / workdays.length);

    const totalLateness = workdays.reduce((acc, curr) => acc + curr.lateCount, 0);
    const totalAbsence = workdays.reduce((acc, curr) => acc + curr.absentCount, 0);

    // Peak day (highest attendance rate, then highest on-time)
    const sortedDays = [...workdays].sort(
      (a, b) => b.attendanceRate - a.attendanceRate || b.onTimeRate - a.onTimeRate
    );
    const peakDay = sortedDays[0];
    const lowestDay = sortedDays[sortedDays.length - 1];

    const tierCounts = { PEAK: 0, HIGH: 0, MODERATE: 0, LOW: 0, OFF: 0 };
    monthSummaries.forEach((s) => {
      tierCounts[s.intensityTier] = (tierCounts[s.intensityTier] || 0) + 1;
    });

    return {
      avgAttendanceRate,
      avgOnTimeRate,
      peakDay,
      lowestDay,
      totalLateness,
      totalAbsence,
      workdaysCount: workdays.length,
      tierCounts,
    };
  }, [monthSummaries]);

  // Calendar Grid Padding (First day of month offset)
  const firstDayOfMonth = useMemo(() => {
    return new Date(currentYear, currentMonth - 1, 1).getDay(); // 0 is Sun
  }, [currentYear, currentMonth]);

  // Rolling Matrix Data: 12-week matrix tiles (84 days) leading up to the end of the current month
  const rollingMatrixWeeks = useMemo(() => {
    // Generate dates covering 12 weeks
    const endDate = new Date(currentYear, currentMonth, 0); // last day of current month
    // Find the Sunday of 11 weeks prior
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - (12 * 7 - 1));

    // Align start date to Sunday
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);

    const weeks: DayAttendanceSummary[][] = [];
    let currentWeek: DayAttendanceSummary[] = [];
    const walk = new Date(startDate);

    // Filter employees by dept
    const targetEmployees =
      selectedDeptId === 'ALL'
        ? employees
        : employees.filter((e) => e.departmentId === selectedDeptId);
    const targetEmpIds = new Set(targetEmployees.map((e) => e.id));
    const effectiveTotal = targetEmployees.length > 0 ? targetEmployees.length : 10;

    const holidayMap = new Map<string, string>();
    holidays.forEach((h) => holidayMap.set(h.date, h.nameLao || h.nameEn));

    while (walk <= endDate) {
      const y = walk.getFullYear();
      const m = String(walk.getMonth() + 1).padStart(2, '0');
      const d = String(walk.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;

      const dw = walk.getDay();
      const isWeekend = dw === 0 || dw === 6;
      const holidayName = holidayMap.get(dateStr);

      const dayRecords = attendanceRecords.filter(
        (r) => r.date === dateStr && targetEmpIds.has(r.employeeId)
      );

      let presentCount = 0;
      let onTimeCount = 0;
      let lateCount = 0;
      let absentCount = 0;
      let onLeaveCount = 0;

      dayRecords.forEach((r) => {
        if (r.status === 'PRESENT') {
          presentCount++;
          onTimeCount++;
        } else if (r.status === 'LATE') {
          presentCount++;
          lateCount++;
        } else if (r.status === 'ON_LEAVE') {
          onLeaveCount++;
        } else if (r.status === 'ABSENT') {
          absentCount++;
        }
      });

      const hasRecords = dayRecords.length > 0;
      const rate =
        effectiveTotal > 0 && hasRecords
          ? Math.round((presentCount / Math.max(effectiveTotal, dayRecords.length)) * 100)
          : 0;
      const onTimeRate = presentCount > 0 ? Math.round((onTimeCount / presentCount) * 100) : 0;

      const intensityTier =
        !hasRecords || (isWeekend && rate === 0) || (Boolean(holidayName) && rate === 0)
          ? 'OFF'
          : rate >= 95
          ? 'PEAK'
          : rate >= 80
          ? 'HIGH'
          : rate >= 65
          ? 'MODERATE'
          : 'LOW';

      currentWeek.push({
        date: dateStr,
        dayOfWeek: dw,
        isWeekend,
        holidayName,
        totalScheduled: effectiveTotal,
        presentCount,
        onTimeCount,
        lateCount,
        absentCount,
        onLeaveCount,
        attendanceRate: rate,
        onTimeRate,
        intensityTier,
        records: dayRecords,
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }

      walk.setDate(walk.getDate() + 1);
    }

    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return weeks;
  }, [currentYear, currentMonth, attendanceRecords, employees, holidays, selectedDeptId]);

  // Handlers for month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  const handleJumpToToday = () => {
    const today = new Date();
    // Default to Oct 2026 LHSE fiscal period
    setCurrentYear(2026);
    setCurrentMonth(10);
  };

  // Filtered records inside Drilldown Modal
  const drilldownFilteredRecords = useMemo(() => {
    if (!selectedDaySummary) return [];

    return selectedDaySummary.records.filter((rec) => {
      const emp = employees.find((e) => e.id === rec.employeeId);
      const fullNameEn = emp ? `${emp.firstNameEn} ${emp.lastNameEn}` : '';
      const fullNameLao = emp ? `${emp.firstNameLao} ${emp.lastNameLao}` : '';
      const matchesSearch =
        !drilldownSearch ||
        rec.employeeId.toLowerCase().includes(drilldownSearch.toLowerCase()) ||
        fullNameEn.toLowerCase().includes(drilldownSearch.toLowerCase()) ||
        fullNameLao.includes(drilldownSearch);

      const matchesStatus =
        drilldownStatusFilter === 'ALL' || rec.status === drilldownStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [selectedDaySummary, drilldownSearch, drilldownStatusFilter, employees]);

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800 shadow-inner">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  {language === 'lo'
                    ? 'ແຜນທີ່ຄວາມຮ້ອນການມາເຮັດວຽກ (Calendar Heatmap)'
                    : 'Attendance Calendar Heatmap'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {language === 'lo' ? 'ວິເຄາະຄວາມໜາແໜ້ນ' : 'Trend Intensity'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'lo'
                  ? 'ກວດສອບຄວາມໜາແໜ້ນ ແລະ ແນວໂນ້ມການມາເຮັດວຽກຂອງພະນັກງານ ດ້ວຍລະດັບສີ (Color Intensity)'
                  : 'Visually identify high and low attendance patterns, tardiness hotspots, and workforce presence trends'}
              </p>
            </div>
          </div>

          {/* Quick Action Controls: Month Navigation, Dept Selector & View Mode */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Department Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                aria-label={language === 'lo' ? 'ເລືອກພະແນກ' : 'Filter by department'}
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-hidden cursor-pointer"
              >
                <option value="ALL">
                  {language === 'lo' ? '🏢 ທຸກພະແນກ (All Departments)' : '🏢 All Departments'}
                </option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {language === 'lo' && dept.nameLao ? dept.nameLao : dept.nameEn}
                  </option>
                ))}
              </select>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setViewMode('calendar')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  viewMode === 'calendar'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title="Full Monthly Calendar Grid"
              >
                <Grid className="w-3.5 h-3.5" />
                <span>{language === 'lo' ? 'ປະຕິທິນລາຍເດືອນ' : 'Monthly Grid'}</span>
              </button>
              <button
                onClick={() => setViewMode('matrix')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  viewMode === 'matrix'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title="Rolling 12-Week Contribution Matrix"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{language === 'lo' ? 'ແຜ່ນມາຕຣິກ (Matrix)' : 'Rolling Matrix'}</span>
              </button>
              <button
                onClick={() => setViewMode('barchart')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  viewMode === 'barchart'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title="Average Daily Attendance — 6-Month Bar Chart & Seasonal Patterns"
              >
                <BarChart3 className="w-3.5 h-3.5 text-emerald-500" />
                <span>{language === 'lo' ? 'ກຣາຟແທ່ງ 6 ເດືອນ' : '6-Mo Bar Chart'}</span>
              </button>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="px-2 font-black text-xs text-slate-800 dark:text-slate-200 min-w-32 text-center">
                {language === 'lo'
                  ? `${monthNamesLao[currentMonth - 1].split(' ')[0]} ${currentYear}`
                  : `${monthNamesEn[currentMonth - 1]} ${currentYear}`}
              </div>

              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleJumpToToday}
              className="px-3 py-2 rounded-2xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            >
              {language === 'lo' ? 'ເດືອນປັດຈຸບັນ (Oct 2026)' : 'Active (Oct 2026)'}
            </button>
          </div>
        </div>

        {/* Monthly Trend KPI Summary Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          {/* Average Attendance Rate */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
              <span>{language === 'lo' ? 'ອັດຕາສະເລ່ຍມາເຮັດວຽກ' : 'Avg. Attendance Rate'}</span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {monthlyMetrics.avgAttendanceRate}%
              </span>
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                {monthlyMetrics.avgAttendanceRate >= 80 ? 'Target Met (ຕາມເປົ້າ)' : 'Below Target'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {monthlyMetrics.workdaysCount} {language === 'lo' ? 'ວັນລັດຖະການໃນເດືອນ' : 'workdays tracked'}
            </p>
          </div>

          {/* Average On-Time Arrival */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
              <span>{language === 'lo' ? 'ອັດຕາມາກົງເວລາ' : 'Avg. On-Time Rate'}</span>
              <Clock className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                {monthlyMetrics.avgOnTimeRate}%
              </span>
              <span className="text-[10px] font-semibold text-slate-500">
                {monthlyMetrics.totalLateness} {language === 'lo' ? 'ຄັ້ງຊ້າ' : 'late hits'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {language === 'lo' ? 'ມາດຕະຖານເຂົ້າກ່ອນ 08:30' : 'Standard 08:30 threshold'}
            </p>
          </div>

          {/* Peak Attendance Day */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60">
            <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 text-xs font-medium">
              <span>{language === 'lo' ? 'ວັນທີ່ມີຄົນມາຫຼາຍສຸດ' : 'Peak Attendance Day'}</span>
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-black text-emerald-700 dark:text-emerald-300">
                {monthlyMetrics.peakDay ? monthlyMetrics.peakDay.date.slice(8) + ' ' + monthNamesEn[currentMonth - 1] : '--'}
              </span>
              {monthlyMetrics.peakDay && (
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                  {monthlyMetrics.peakDay.attendanceRate}%
                </span>
              )}
            </div>
            <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">
              {monthlyMetrics.peakDay ? `${monthlyMetrics.peakDay.presentCount}/${monthlyMetrics.peakDay.totalScheduled} ${language === 'lo' ? 'ຄົນມາເຮັດວຽກ' : 'staff present'}` : '--'}
            </p>
          </div>

          {/* Lowest Day / Alert Day */}
          <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-800/60">
            <div className="flex items-center justify-between text-rose-700 dark:text-rose-400 text-xs font-medium">
              <span>{language === 'lo' ? 'ວັນທີ່ມາໜ້ອຍສຸດ (Alert)' : 'Lowest Attendance Day'}</span>
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-black text-rose-700 dark:text-rose-300">
                {monthlyMetrics.lowestDay ? monthlyMetrics.lowestDay.date.slice(8) + ' ' + monthNamesEn[currentMonth - 1] : '--'}
              </span>
              {monthlyMetrics.lowestDay && (
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200">
                  {monthlyMetrics.lowestDay.attendanceRate}%
                </span>
              )}
            </div>
            <p className="text-[10px] text-rose-600/80 dark:text-rose-400/80 mt-0.5">
              {monthlyMetrics.lowestDay ? `${monthlyMetrics.lowestDay.absentCount} ${language === 'lo' ? 'ຂາດ / ລາ' : 'absent/leave'}` : '--'}
            </p>
          </div>
        </div>

        {/* Color Intensity Scale Legend with Interactive Filter Filter */}
        <div className="pt-2 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>{language === 'lo' ? 'ລະດັບຄວາມເຂັ້ມຂອງສີ (Intensity Scale):' : 'Color Intensity Scale:'}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[
              { tier: 'PEAK', labelEn: 'Peak (95-100%)', labelLao: 'ສູງສຸດ (95-100%)', color: 'bg-emerald-600 dark:bg-emerald-500' },
              { tier: 'HIGH', labelEn: 'High (80-94%)', labelLao: 'ປົກກະຕິດີ (80-94%)', color: 'bg-emerald-400 dark:bg-emerald-600/80' },
              { tier: 'MODERATE', labelEn: 'Moderate (65-79%)', labelLao: 'ປານກາງ (65-79%)', color: 'bg-amber-300 dark:bg-amber-500/80' },
              { tier: 'LOW', labelEn: 'Low (< 65% Alert)', labelLao: 'ຕໍ່າ (< 65% ຕິດຕາມ)', color: 'bg-rose-400 dark:bg-rose-600/80' },
              { tier: 'OFF', labelEn: 'Weekend / Off', labelLao: 'ວັນພັກ / Off', color: 'bg-slate-200 dark:bg-slate-800' },
            ].map((item) => {
              const count = monthlyMetrics.tierCounts[item.tier as keyof typeof monthlyMetrics.tierCounts] || 0;
              const isSelected = tierHighlightFilter === item.tier;

              return (
                <button
                  key={item.tier}
                  onClick={() => setTierHighlightFilter(isSelected ? null : item.tier)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[11px] font-semibold transition-all ${
                    isSelected
                      ? 'border-blue-500 ring-2 ring-blue-400 bg-blue-50 dark:bg-blue-950/50 text-blue-900 dark:text-blue-100'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                  title={language === 'lo' ? `ຄລິກເພື່ອເນັ້ນສະເພາະກຸ່ມນີ້ (${count} ວັນ)` : `Click to filter days in this tier (${count} days)`}
                >
                  <span className={`w-3 h-3 rounded-md ${item.color} shadow-xs inline-block`} />
                  <span>{language === 'lo' ? item.labelLao : item.labelEn}</span>
                  <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[9px] bg-slate-100 dark:bg-slate-700 font-bold text-slate-600 dark:text-slate-300">
                    {count}
                  </span>
                </button>
              );
            })}

            {tierHighlightFilter && (
              <button
                onClick={() => setTierHighlightFilter(null)}
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-bold px-1"
              >
                {language === 'lo' ? 'ລ້າງຕົວກັ່ນຕອງ' : 'Clear Filter'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Heatmap Visualization: Full Calendar Grid View */}
      {viewMode === 'calendar' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-emerald-500" />
              <span>
                {language === 'lo'
                  ? `ຕາຕະລາງຄວາມໜາແໜ້ນ ປະຈຳເດືອນ ${monthNamesLao[currentMonth - 1]}`
                  : `Monthly Calendar Heatmap — ${monthNamesEn[currentMonth - 1]} ${currentYear}`}
              </span>
            </h3>
            <span className="text-xs text-slate-400">
              {language === 'lo' ? 'ຄລິກໃສ່ມື້ໃດກໍໄດ້ເພື່ອເບິ່ງລາຍຊື່ລະອຽດ' : 'Click any day tile for employee drilldown'}
            </span>
          </div>

          {/* Weekday Columns Header */}
          <div className="grid grid-cols-7 gap-2">
            {(language === 'lo' ? weekdayHeadersLao : weekdayHeadersEn).map((day, idx) => (
              <div
                key={day}
                className={`text-center py-2 text-xs font-black uppercase tracking-wider ${
                  idx === 0 || idx === 6
                    ? 'text-rose-500 dark:text-rose-400'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* 7-Column Days Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Empty slots for month start alignment */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="min-h-24 rounded-2xl bg-slate-50/50 dark:bg-slate-950/20 border border-dashed border-slate-200 dark:border-slate-800/40 opacity-40"
              />
            ))}

            {/* Actual Days of the Month */}
            {monthSummaries.map((summary) => {
              const dayNum = parseInt(summary.date.slice(8), 10);
              const styling = getIntensityColorClass(summary.intensityTier);
              const isFilteredOut = tierHighlightFilter && tierHighlightFilter !== summary.intensityTier;

              return (
                <div
                  key={summary.date}
                  onClick={() => {
                    setSelectedDaySummary(summary);
                    setDrilldownSearch('');
                    setDrilldownStatusFilter('ALL');
                  }}
                  className={`min-h-24 rounded-2xl p-2.5 border transition-all duration-200 flex flex-col justify-between cursor-pointer relative group ${
                    summary.isWeekend || summary.holidayName
                      ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/90 dark:border-slate-800'
                      : styling.border
                  } ${
                    isFilteredOut
                      ? 'opacity-25 grayscale scale-95'
                      : 'hover:scale-[1.02] hover:shadow-md'
                  }`}
                >
                  {/* Top Row: Day Number & Attendance Rate Badge */}
                  <div className="flex items-start justify-between">
                    <span
                      className={`text-sm font-black ${
                        summary.isWeekend
                          ? 'text-rose-500 dark:text-rose-400'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {dayNum}
                    </span>

                    {/* Attendance % Pill or Off Label */}
                    {!summary.isWeekend && !summary.holidayName && summary.records.length > 0 ? (
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-lg shadow-xs transition-transform ${styling.bg} ${styling.text}`}
                      >
                        {summary.attendanceRate}%
                      </span>
                    ) : summary.holidayName ? (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 truncate max-w-20">
                        {language === 'lo' ? 'ວັນພັກ' : 'Holiday'}
                      </span>
                    ) : summary.isWeekend ? (
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {language === 'lo' ? 'ວັນພັກ' : 'Off'}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">--</span>
                    )}
                  </div>

                  {/* Holiday Name Banner if applicable */}
                  {summary.holidayName && (
                    <div className="text-[10px] font-bold text-amber-700 dark:text-amber-400 truncate mt-1">
                      ⭐ {summary.holidayName}
                    </div>
                  )}

                  {/* Middle: Color Intensity Bar Indicator */}
                  {!summary.isWeekend && !summary.holidayName && summary.records.length > 0 && (
                    <div className="my-1.5">
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            summary.intensityTier === 'PEAK'
                              ? 'bg-emerald-500'
                              : summary.intensityTier === 'HIGH'
                              ? 'bg-emerald-400'
                              : summary.intensityTier === 'MODERATE'
                              ? 'bg-amber-400'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(10, summary.attendanceRate))}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Bottom Row: Headcount Breakdown Mini Pills */}
                  <div className="pt-1 flex items-center justify-between text-[10px]">
                    {!summary.isWeekend && !summary.holidayName && summary.records.length > 0 ? (
                      <>
                        <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                          <UserCheck className="w-3 h-3" />
                          <span>{summary.presentCount}</span>
                        </span>
                        {summary.lateCount > 0 && (
                          <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-0.5">
                            <Clock className="w-3 h-3" />
                            <span>{summary.lateCount}</span>
                          </span>
                        )}
                        {summary.absentCount > 0 && (
                          <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-0.5">
                            <UserX className="w-3 h-3" />
                            <span>{summary.absentCount}</span>
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-slate-400 text-[10px]">
                        {summary.isWeekend ? (language === 'lo' ? 'ທ້າຍອາທິດ' : 'Weekend') : ''}
                      </span>
                    )}
                  </div>

                  {/* Hover Prompt Tooltip Pill */}
                  <div className="absolute inset-x-2 bottom-1 bg-slate-900/95 text-white text-[9px] text-center py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
                    {language === 'lo' ? 'ກວດສອບລາຍຊື່' : 'Inspect Roster'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Rolling 12-Week Matrix (GitHub-Style Macro View) */}
      {viewMode === 'matrix' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-500" />
                <span>
                  {language === 'lo'
                    ? 'ແຜ່ນມາຕຣິກຄວາມໜາແໜ້ນ 12 ອາທິດຕໍ່ເນື່ອງ (Continuous Rolling Matrix)'
                    : '12-Week Rolling Matrix View'}
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {language === 'lo'
                  ? 'ເບິ່ງພາບລວມໄລຍະຍາວ 84 ວັນ ເພື່ອສັງເກດແນວໂນ້ມ ແລະ ວັນທີ່ຂາດວຽກຜິດປົກກະຕິ'
                  : '84-day macro view highlighting attendance seasonality, regional storms, and weekly rhythm'}
              </p>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {language === 'lo' ? 'ແຕ່ລະຖັນ = 1 ອາທິດ' : 'Each column = 1 week'}
            </span>
          </div>

          <div className="overflow-x-auto pb-2">
            <div className="inline-flex gap-2 min-w-full">
              {/* Day of Week Labels */}
              <div className="flex flex-col gap-2 pt-6 pr-2 text-[10px] font-bold text-slate-400 select-none">
                <span>Sun</span>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
              </div>

              {/* Weeks Columns */}
              {rollingMatrixWeeks.map((week, wIdx) => {
                const firstDayStr = week[0]?.date || '';
                const weekLabel = firstDayStr ? firstDayStr.slice(5) : `W${wIdx + 1}`;

                return (
                  <div key={`matrix-week-${wIdx}`} className="flex flex-col gap-2">
                    <span className="text-[9px] font-bold text-slate-400 text-center h-4">
                      {wIdx % 2 === 0 ? weekLabel : ''}
                    </span>
                    {week.map((day) => {
                      const styling = getIntensityColorClass(day.intensityTier);
                      const isFilteredOut = tierHighlightFilter && tierHighlightFilter !== day.intensityTier;

                      return (
                        <div
                          key={day.date}
                          onClick={() => {
                            setSelectedDaySummary(day);
                            setDrilldownSearch('');
                            setDrilldownStatusFilter('ALL');
                          }}
                          className={`w-7 h-7 rounded-lg cursor-pointer transition-all duration-150 relative group ${
                            styling.bg
                          } ${
                            isFilteredOut ? 'opacity-20 scale-75' : 'hover:scale-125 hover:z-10 hover:shadow-md'
                          }`}
                          title={`${day.date}: ${day.attendanceRate}% present (${day.presentCount}/${day.totalScheduled})`}
                        >
                          {/* Inner small dot for late incidents */}
                          {day.lateCount > 0 && !day.isWeekend && (
                            <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400 ring-1 ring-white dark:ring-slate-900" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 6-Month Bar Chart View */}
      {viewMode === 'barchart' && (
        <AttendanceSixMonthTrendChart />
      )}

      {/* Day Attendance Drilldown Modal */}
      {selectedDaySummary && (
        <Modal
          isOpen={Boolean(selectedDaySummary)}
          onClose={() => setSelectedDaySummary(null)}
          title={
            language === 'lo'
              ? `ລາຍລະອຽດການມາເຮັດວຽກ ປະຈຳວັນ: ${selectedDaySummary.date}`
              : `Day Attendance Inspection: ${selectedDaySummary.date}`
          }
        >
          <div className="space-y-5">
            {/* Day Header Banner */}
            <div className="p-4 rounded-2xl bg-linear-to-r from-slate-900 to-blue-950 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs text-blue-300 font-semibold">
                  <CalendarIcon className="w-3.5 h-3.5" />
                  <span>
                    {new Date(selectedDaySummary.date).toLocaleDateString(language === 'lo' ? 'lo-LA' : 'en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1.5">
                  <h4 className="text-2xl font-black">{selectedDaySummary.date}</h4>
                  <span
                    className={`px-3 py-1 rounded-xl text-xs font-black shadow-xs ${
                      getIntensityColorClass(selectedDaySummary.intensityTier).bg
                    } ${getIntensityColorClass(selectedDaySummary.intensityTier).text}`}
                  >
                    {selectedDaySummary.attendanceRate}% {language === 'lo' ? 'ອັດຕາການມາ' : 'Attendance'}
                  </span>
                </div>
              </div>

              {/* Status Breakdown Pills */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <div className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300">
                  <span className="font-bold text-white mr-1">{selectedDaySummary.presentCount}</span>
                  <span>{language === 'lo' ? 'ມາເຮັດວຽກ' : 'Present'}</span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300">
                  <span className="font-bold text-white mr-1">{selectedDaySummary.lateCount}</span>
                  <span>{language === 'lo' ? 'ມາກາຍໂມງ' : 'Late'}</span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300">
                  <span className="font-bold text-white mr-1">{selectedDaySummary.absentCount}</span>
                  <span>{language === 'lo' ? 'ຂາດວຽກ' : 'Absent'}</span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-300">
                  <span className="font-bold text-white mr-1">{selectedDaySummary.onLeaveCount}</span>
                  <span>{language === 'lo' ? 'ລາພັກ' : 'On Leave'}</span>
                </div>
              </div>
            </div>

            {/* Filter and Search within Day Records */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder={language === 'lo' ? 'ຄົ້ນຫາພະນັກງານດ້ວຍຊື່ ຫຼື ລະຫັດ...' : 'Filter staff by name or ID...'}
                  value={drilldownSearch}
                  onChange={(e) => setDrilldownSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-1.5">
                {['ALL', 'PRESENT', 'LATE', 'ABSENT', 'ON_LEAVE'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setDrilldownStatusFilter(st)}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                      drilldownStatusFilter === st
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {st === 'ALL'
                      ? language === 'lo'
                        ? 'ທັງໝົດ'
                        : 'All'
                      : st === 'PRESENT'
                      ? language === 'lo'
                        ? 'ມາ'
                        : 'Present'
                      : st === 'LATE'
                      ? language === 'lo'
                        ? 'ຊ້າ'
                        : 'Late'
                      : st === 'ABSENT'
                      ? language === 'lo'
                        ? 'ຂາດ'
                        : 'Absent'
                      : language === 'lo'
                      ? 'ລາ'
                      : 'Leave'}
                  </button>
                ))}
              </div>
            </div>

            {/* Employee Records Roster Table */}
            <div className="overflow-x-auto max-h-80 rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">{language === 'lo' ? 'ພະນັກງານ' : 'Employee'}</th>
                    <th className="py-2.5 px-3">{language === 'lo' ? 'ພະແນກ / ຕຳແໜ່ງ' : 'Department / Role'}</th>
                    <th className="py-2.5 px-3">{language === 'lo' ? 'ສະຖານະ' : 'Status'}</th>
                    <th className="py-2.5 px-3">{language === 'lo' ? 'ເວລາເຂົ້າ' : 'Check In'}</th>
                    <th className="py-2.5 px-3">{language === 'lo' ? 'ເວລາອອກ' : 'Check Out'}</th>
                    <th className="py-2.5 px-3">{language === 'lo' ? 'ອຸປະກອນ' : 'Source'}</th>
                    <th className="py-2.5 px-3">{language === 'lo' ? 'ໝາຍເຫດ' : 'Notes'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {drilldownFilteredRecords.length > 0 ? (
                    drilldownFilteredRecords.map((rec) => {
                      const emp = employees.find((e) => e.id === rec.employeeId);
                      const dept = departments.find((d) => d.id === emp?.departmentId);
                      const pos = positions.find((p) => p.id === emp?.positionId);

                      return (
                        <tr
                          key={rec.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-2 px-3">
                            <div className="font-bold text-slate-800 dark:text-slate-100">
                              {emp
                                ? language === 'lo'
                                  ? `${emp.firstNameLao} ${emp.lastNameLao}`
                                  : `${emp.firstNameEn} ${emp.lastNameEn}`
                                : rec.employeeId}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {emp?.employeeCode || rec.employeeId}
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            <div className="text-slate-700 dark:text-slate-300 font-medium">
                              {dept ? (language === 'lo' && dept.nameLao ? dept.nameLao : dept.nameEn) : '--'}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {pos ? (language === 'lo' && pos.titleLao ? pos.titleLao : pos.titleEn) : ''}
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                rec.status === 'PRESENT'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : rec.status === 'LATE'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                  : rec.status === 'ON_LEAVE'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              }`}
                            >
                              {rec.status}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                            {rec.checkIn || '--:--'}
                          </td>
                          <td className="py-2 px-3 font-mono font-semibold text-blue-600 dark:text-blue-400">
                            {rec.checkOut || '--:--'}
                          </td>
                          <td className="py-2 px-3 text-[11px] text-slate-500">
                            {rec.source?.replace('_', ' ') || '--'}
                          </td>
                          <td className="py-2 px-3 text-[11px] text-slate-400 italic">
                            {rec.notes || '--'}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        {language === 'lo'
                          ? 'ບໍ່ພົບຂໍ້ມູນການລົງເວລາໃນເງື່ອນໄຂນີ້'
                          : 'No attendance records found matching this criteria'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedDaySummary(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors"
              >
                {language === 'lo' ? 'ປິດໜ້າຕ່າງ' : 'Close'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
