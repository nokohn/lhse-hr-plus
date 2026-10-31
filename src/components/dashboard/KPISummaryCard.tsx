import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { EmployeeKPI } from '../../types/index.ts';
import { alerts } from '../../utils/alerts.ts';
import {
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  Building2,
  User,
  BellRing,
  ArrowRight,
  ShieldAlert,
  Flame,
  Layers,
  Sparkles,
  Calendar,
  Percent,
} from 'lucide-react';

export const KPISummaryCard: React.FC = () => {
  const {
    language,
    employeeKPIs,
    employees,
    departments,
    setActiveModule,
    setActiveSubModule,
  } = useApp();

  const [isOverdueExpanded, setIsOverdueExpanded] = useState<boolean>(false);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ALL');

  // Reference date: 2026-10-23 (Standard simulated current date for Q4 2026)
  const referenceDateStr = '2026-10-23';
  const referenceDate = useMemo(() => new Date(referenceDateStr), []);

  // Filtered KPIs by department if selected
  const activeKPIPool = useMemo(() => {
    if (selectedDeptFilter === 'ALL') return employeeKPIs;
    return employeeKPIs.filter((kpi) => {
      const emp = employees.find((e) => e.id === kpi.employeeId);
      return emp?.departmentId === selectedDeptFilter;
    });
  }, [employeeKPIs, selectedDeptFilter, employees]);

  // High-Level Organizational Calculations
  const metrics = useMemo(() => {
    const totalAssigned = activeKPIPool.length;

    // Active KPIs: in-flight goals that are not completed (or all active Q4 assigned goals)
    // Here we compute both: ongoing active in-progress and total assigned
    const completedKPIs = activeKPIPool.filter((k) => {
      const pct = k.targetValue > 0 ? (k.currentValue / k.targetValue) * 100 : 0;
      return k.status === 'COMPLETED' || pct >= 100;
    });

    const activeKPIs = activeKPIPool.filter((k) => {
      const pct = k.targetValue > 0 ? (k.currentValue / k.targetValue) * 100 : 0;
      return k.status !== 'COMPLETED' && pct < 100;
    });

    // Overdue KPIs: due date < referenceDate AND not completed (completion < 100%)
    const overdueKPIs = activeKPIPool.filter((k) => {
      const pct = k.targetValue > 0 ? (k.currentValue / k.targetValue) * 100 : 0;
      if (pct >= 100 || k.status === 'COMPLETED') return false;
      return k.dueDate && k.dueDate < referenceDateStr;
    });

    // Average Completion Rate calculation across active / assigned KPIs
    let totalPct = 0;
    activeKPIPool.forEach((k) => {
      const pct = k.targetValue > 0 ? Math.min(100, Math.max(0, (k.currentValue / k.targetValue) * 100)) : 0;
      totalPct += pct;
    });

    const avgCompletionRate = totalAssigned > 0 ? Math.round((totalPct / totalAssigned) * 10) / 10 : 0;

    // Below 50% Threshold count
    const below50KPIs = activeKPIPool.filter((k) => {
      const pct = k.targetValue > 0 ? (k.currentValue / k.targetValue) * 100 : 0;
      return pct < 50;
    });

    // Unique employees involved
    const uniqueEmployeesCount = new Set(activeKPIPool.map((k) => k.employeeId)).size;

    // Status breakdown
    const onTrackCount = activeKPIPool.filter((k) => k.status === 'ON_TRACK').length;
    const inProgressCount = activeKPIPool.filter((k) => k.status === 'IN_PROGRESS').length;
    const atRiskCount = activeKPIPool.filter((k) => k.status === 'AT_RISK').length;

    // Departmental Progress Breakdown
    const deptAverages = departments.map((dept) => {
      const deptEmployees = employees.filter((e) => e.departmentId === dept.id);
      const deptEmpIds = new Set(deptEmployees.map((e) => e.id));
      const deptKPIs = employeeKPIs.filter((k) => deptEmpIds.has(k.employeeId));

      let deptTotalPct = 0;
      deptKPIs.forEach((k) => {
        const pct = k.targetValue > 0 ? Math.min(100, (k.currentValue / k.targetValue) * 100) : 0;
        deptTotalPct += pct;
      });

      const avg = deptKPIs.length > 0 ? Math.round(deptTotalPct / deptKPIs.length) : 0;
      const overdueCount = deptKPIs.filter((k) => k.dueDate < referenceDateStr && k.status !== 'COMPLETED').length;

      return {
        id: dept.id,
        nameLao: dept.nameLao,
        nameEn: dept.nameEn,
        avg,
        kpiCount: deptKPIs.length,
        overdueCount,
      };
    });

    return {
      totalAssigned,
      totalActive: activeKPIs.length,
      completedCount: completedKPIs.length,
      overdueKPIs,
      avgCompletionRate,
      below50Count: below50KPIs.length,
      uniqueEmployeesCount,
      onTrackCount,
      inProgressCount,
      atRiskCount,
      deptAverages,
    };
  }, [activeKPIPool, employeeKPIs, departments, employees, referenceDateStr]);

  // Send Reminder Alert Handler
  const handleSendReminder = (kpi: EmployeeKPI) => {
    const emp = employees.find((e) => e.id === kpi.employeeId);
    const empName = emp ? `${emp.firstNameLao} ${emp.lastNameLao}` : kpi.employeeId;
    alerts.success(
      language === 'lo' ? 'ສົ່ງການແຈ້ງເຕືອນສຳເລັດ' : 'Reminder Sent',
      language === 'lo'
        ? `ລະບົບໄດ້ສົ່ງການແຈ້ງເຕືອນ KPI ເຖິງ ${empName} ຮຽບຮ້ອຍແລ້ວ`
        : `Notification reminder sent to ${empName} for KPI "${kpi.title}".`
    );
  };

  // Scroll to full performance section
  const scrollToPerformance = () => {
    const elem = document.getElementById('performance-kpi-module');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    } else {
      setActiveModule('module-1');
    }
  };

  return (
    <div
      id="organizational-kpi-summary-card"
      className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden transition-all space-y-6"
    >
      {/* Decorative subtle background accents */}
      <div className="absolute -right-16 -top-16 w-64 h-64 bg-blue-500/5 dark:bg-blue-400/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-indigo-500/5 dark:bg-indigo-400/5 rounded-full blur-3xl pointer-events-none" />

      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-black text-lg sm:text-xl text-slate-900 dark:text-slate-100 tracking-tight">
                {language === 'lo' ? 'ສະຫຼຸບພາບລວມ KPI ອົງກອນ' : 'Organizational KPI Summary'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                Q4 2026 • LHSE
              </span>
              {metrics.overdueKPIs.length > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-900 flex items-center gap-1 animate-pulse">
                  <Flame className="w-3 h-3 text-rose-600" />
                  {language === 'lo' ? `${metrics.overdueKPIs.length} ກາຍກຳນົດ` : `${metrics.overdueKPIs.length} Overdue`}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {language === 'lo'
                ? 'ສະຖິຕິລະດັບສູງ, ອັດຕາການບັນລຸເປົ້າໝາຍສະເລ່ຍ ແລະ ການຕິດຕາມ KPI ທີ່ກາຍກຳນົດເວລາ ສຳລັບຜູ້ບໍລິຫານ'
                : 'High-level organizational statistics: active goals, average completion rate, and overdue alerts.'}
            </p>
          </div>
        </div>

        {/* Action Controls & Department Filter */}
        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {/* Department Filter Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <Building2 className="w-3.5 h-3.5 text-slate-400 ml-1.5 shrink-0" />
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="bg-transparent text-slate-700 dark:text-slate-200 text-xs font-bold outline-hidden pr-2 py-0.5 cursor-pointer"
            >
              <option value="ALL">{language === 'lo' ? 'ທຸກພະແນກ (ອົງກອນ)' : 'All Departments'}</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {language === 'lo' ? d.nameLao : d.nameEn}
                </option>
              ))}
            </select>
          </div>

          {/* Jump to Full Performance Tracker */}
          <button
            onClick={scrollToPerformance}
            className="px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/70 hover:bg-blue-100 dark:hover:bg-blue-900/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <span>{language === 'lo' ? 'ເບິ່ງລາຍການເຕັມ' : 'View Full Tracker'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Primary High-Level Stat Cards (3 Key Cards: Active KPIs, Avg Completion Rate, KPIs Overdue) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4.5">
        {/* Stat Card 1: Total Active KPIs */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50/70 via-slate-50 to-white dark:from-slate-800/70 dark:via-slate-800/40 dark:to-slate-900 border border-blue-200/80 dark:border-blue-900/50 shadow-xs flex flex-col justify-between relative group hover:border-blue-400 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 block">
                {language === 'lo' ? 'KPI ທີ່ກຳລັງດຳເນີນການ' : 'Total Active KPIs'}
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl lg:text-4xl font-black font-mono text-slate-900 dark:text-slate-100 tracking-tight">
                  {metrics.totalActive}
                </span>
                <span className="text-xs text-slate-500 font-bold">
                  {language === 'lo' ? `/ ${metrics.totalAssigned} ທັງໝົດ` : `/ ${metrics.totalAssigned} Total`}
                </span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-2xs">
              <Layers className="w-5 h-5" />
            </div>
          </div>

          {/* Mini active/completed progress bar */}
          <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                {language === 'lo' ? 'ສຳເລັດ 100%' : 'Completed goals'}
              </span>
              <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {metrics.completedCount} {language === 'lo' ? 'ເປົ້າໝາຍ' : 'goals'}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex">
              <div
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{
                  width: `${metrics.totalAssigned > 0 ? (metrics.completedCount / metrics.totalAssigned) * 100 : 0}%`,
                }}
                title={`Completed: ${metrics.completedCount}`}
              />
              <div
                className="bg-blue-600 h-full transition-all duration-500"
                style={{
                  width: `${metrics.totalAssigned > 0 ? (metrics.totalActive / metrics.totalAssigned) * 100 : 0}%`,
                }}
                title={`Active: ${metrics.totalActive}`}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>{language === 'lo' ? `ກວມເອົາ ${metrics.uniqueEmployeesCount} ພະນັກງານ` : `Across ${metrics.uniqueEmployeesCount} employees`}</span>
              <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">
                {metrics.totalAssigned > 0 ? Math.round((metrics.totalActive / metrics.totalAssigned) * 100) : 0}% {language === 'lo' ? 'ກຳລັງດຳເນີນ' : 'in-flight'}
              </span>
            </div>
          </div>
        </div>

        {/* Stat Card 2: Average Completion Rate */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50/70 via-slate-50 to-white dark:from-slate-800/70 dark:via-slate-800/40 dark:to-slate-900 border border-emerald-200/80 dark:border-emerald-900/50 shadow-xs flex flex-col justify-between relative group hover:border-emerald-400 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                {language === 'lo' ? 'ອັດຕາບັນລຸສະເລ່ຍ' : 'Average Completion Rate'}
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl lg:text-4xl font-black font-mono text-emerald-600 dark:text-emerald-400 tracking-tight">
                  {metrics.avgCompletionRate}%
                </span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" />
                  +4.2% MoM
                </span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-2xs">
              <Percent className="w-5 h-5" />
            </div>
          </div>

          {/* Completion Progress Bar with Target Milestone Indicator */}
          <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                {language === 'lo' ? 'ເປົ້າໝາຍປະຈຳໄຕຣມາດ (75%)' : 'Quarterly Benchmark (75%)'}
              </span>
              <span className="font-bold font-mono text-slate-700 dark:text-slate-200">
                {metrics.avgCompletionRate >= 75 ? (
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {language === 'lo' ? 'ເກີນເປົ້າໝາຍ' : 'Above Target'}
                  </span>
                ) : (
                  <span className="text-amber-600 font-bold">
                    {language === 'lo' ? 'ໃກ້ຮອດເປົ້າໝາຍ' : 'On Track'}
                  </span>
                )}
              </span>
            </div>
            <div className="relative w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-700"
                style={{ width: `${Math.min(100, metrics.avgCompletionRate)}%` }}
              />
              {/* Benchmark marker at 75% */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-slate-900/70 dark:bg-white/80 z-10"
                style={{ left: '75%' }}
                title="Q4 Target: 75%"
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>{language === 'lo' ? 'ຕາມແຜນ:' : 'On Track:'} <strong className="text-blue-600 dark:text-blue-400 font-mono">{metrics.onTrackCount}</strong></span>
              <span>{language === 'lo' ? 'ຕ່ຳກວ່າ 50%:' : '< 50% Threshold:'} <strong className="text-rose-600 dark:text-rose-400 font-mono">{metrics.below50Count}</strong></span>
            </div>
          </div>
        </div>

        {/* Stat Card 3: KPIs Overdue */}
        <div
          onClick={() => metrics.overdueKPIs.length > 0 && setIsOverdueExpanded((prev) => !prev)}
          className={`p-5 rounded-2xl border shadow-xs flex flex-col justify-between relative transition-all ${
            metrics.overdueKPIs.length > 0
              ? 'bg-gradient-to-br from-rose-50/90 via-rose-50/40 to-white dark:from-rose-950/50 dark:via-slate-900 dark:to-slate-900 border-rose-300 dark:border-rose-900/80 hover:border-rose-400 cursor-pointer'
              : 'bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/40 dark:to-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <span
                className={`text-[11px] font-bold uppercase tracking-wider block ${
                  metrics.overdueKPIs.length > 0
                    ? 'text-rose-700 dark:text-rose-400'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {language === 'lo' ? 'KPI ທີ່ກາຍກຳນົດເວລາ' : 'KPIs Overdue'}
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span
                  className={`text-3xl lg:text-4xl font-black font-mono tracking-tight ${
                    metrics.overdueKPIs.length > 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {metrics.overdueKPIs.length}
                </span>
                {metrics.overdueKPIs.length > 0 ? (
                  <span className="text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-900/70 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                    {language === 'lo' ? 'ຮີບດ່ວນ' : 'Action Needed'}
                  </span>
                ) : (
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    {language === 'lo' ? 'ຕາມກຳນົດ' : 'On Schedule'}
                  </span>
                )}
              </div>
            </div>

            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
                metrics.overdueKPIs.length > 0
                  ? 'bg-rose-100 dark:bg-rose-950/90 text-rose-600 dark:text-rose-400'
                  : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {metrics.overdueKPIs.length > 0 ? (
                <Clock className="w-5 h-5" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
            </div>
          </div>

          {/* Overdue Status or Clear Status */}
          <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                {metrics.overdueKPIs.length > 0
                  ? language === 'lo'
                    ? 'ກາຍກຳນົດສົ່ງມອບແລ້ວ'
                    : 'Target date has passed'
                  : language === 'lo'
                  ? 'ບໍ່ມີເປົ້າໝາຍກາຍກຳນົດ'
                  : 'Zero overdue items'}
              </span>
              {metrics.overdueKPIs.length > 0 && (
                <button
                  type="button"
                  className="font-bold text-[11px] text-rose-700 dark:text-rose-400 hover:underline flex items-center gap-0.5"
                >
                  <span>{isOverdueExpanded ? (language === 'lo' ? 'ເຊື່ອງລາຍລະອຽດ' : 'Hide') : (language === 'lo' ? 'ກວດສອບ' : 'Inspect')}</span>
                  {isOverdueExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              )}
            </div>

            <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
              {metrics.overdueKPIs.length > 0 ? (
                <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" />
                  {language === 'lo'
                    ? `${metrics.overdueKPIs.length} ລາຍການຕ້ອງການການຊີ້ນຳ`
                    : `${metrics.overdueKPIs.length} require managerial escalation`}
                </span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {language === 'lo' ? '100% ພາຍໃນໄລຍະເວລາທີ່ກຳນົດ' : '100% within statutory deadlines'}
                </span>
              )}
              <span className="font-mono text-slate-400">
                Ref: {referenceDateStr}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Expandable Overdue KPI Inspection Drawer */}
      {isOverdueExpanded && metrics.overdueKPIs.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 space-y-3.5 transition-all animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <h4 className="text-xs font-bold text-rose-900 dark:text-rose-200 uppercase tracking-wide">
                {language === 'lo'
                  ? `ລາຍການ KPI ທີ່ກາຍກຳນົດເວລາ (${metrics.overdueKPIs.length})`
                  : `Overdue KPI Action List (${metrics.overdueKPIs.length})`}
              </h4>
            </div>
            <span className="text-[11px] text-rose-700 dark:text-rose-300 font-medium">
              {language === 'lo' ? 'ຄິດໄລ່ທຽບໃສ່ມື້ນີ້: 23 ຕຸລາ 2026' : 'Evaluated against 23 Oct 2026'}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {metrics.overdueKPIs.map((kpi) => {
              const emp = employees.find((e) => e.id === kpi.employeeId);
              const dept = departments.find((d) => d.id === emp?.departmentId);
              const pct = kpi.targetValue > 0 ? Math.round((kpi.currentValue / kpi.targetValue) * 100) : 0;
              const dueDateObj = new Date(kpi.dueDate);
              const daysDiff = Math.max(1, Math.round((referenceDate.getTime() - dueDateObj.getTime()) / (1000 * 3600 * 24)));

              return (
                <div
                  key={kpi.id}
                  className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                        {emp?.employeeCode || kpi.employeeId}
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {emp ? (language === 'lo' ? `${emp.firstNameLao} ${emp.lastNameLao}` : `${emp.firstNameEn} ${emp.lastNameEn}`) : kpi.employeeId}
                      </span>
                      <span className="text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        {dept ? (language === 'lo' ? dept.nameLao : dept.nameEn) : ''}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                        {language === 'lo' ? `ກາຍກຳນົດ ${daysDiff} ວັນ` : `${daysDiff} days overdue`}
                      </span>
                    </div>

                    <p className="font-bold text-slate-900 dark:text-slate-100 pt-0.5">
                      {language === 'lo' && kpi.titleLao ? kpi.titleLao : kpi.title}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {language === 'lo' ? 'ກຳນົດສົ່ງ:' : 'Due Date:'} <span className="font-mono font-bold text-rose-600">{kpi.dueDate}</span> • {language === 'lo' ? 'ຄວາມຄືບໜ້າປັດຈຸບັນ:' : 'Current Progress:'} <strong className="font-mono text-slate-800 dark:text-slate-200">{kpi.currentValue} / {kpi.targetValue} {kpi.unit} ({pct}%)</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                    <button
                      onClick={() => handleSendReminder(kpi)}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <BellRing className="w-3.5 h-3.5" />
                      <span>{language === 'lo' ? 'ແຈ້ງເຕືອນດ່ວນ' : 'Nudge Employee'}</span>
                    </button>
                    <button
                      onClick={scrollToPerformance}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
                    >
                      {language === 'lo' ? 'ແກ້ໄຂ / ອັບເດດ' : 'Update'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Secondary Executive Breakdown: Departmental KPI Performance Snapshot */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
              {language === 'lo' ? 'ອັດຕາການບັນລຸ KPI ແຍກຕາມພະແນກ (Departmental Progress)' : 'Departmental KPI Achievement Rates'}
            </h4>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {language === 'lo' ? 'ສະເລ່ຍຖ່ວງນ້ຳໜັກ 5 ພະແນກ' : 'Weighted across 5 departments'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
          {metrics.deptAverages.map((dept) => {
            const isHigh = dept.avg >= 85;
            const isMed = dept.avg >= 60;
            const hasOverdue = dept.overdueCount > 0;

            return (
              <div
                key={dept.id}
                className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate pr-1">
                    {language === 'lo' ? dept.nameLao : dept.nameEn}
                  </span>
                  {hasOverdue && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" title="Has overdue KPI" />
                  )}
                </div>

                <div className="flex items-baseline justify-between">
                  <span
                    className={`text-lg font-black font-mono ${
                      isHigh
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : isMed
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {dept.avg}%
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {dept.kpiCount} {language === 'lo' ? 'ເປົ້າໝາຍ' : 'goals'}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isHigh
                        ? 'bg-emerald-500'
                        : isMed
                        ? 'bg-blue-600'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${dept.avg}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
