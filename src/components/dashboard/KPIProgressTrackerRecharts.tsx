import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { EmployeeKPI, KPICategory, KPIStatus } from '../../types/index.ts';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  RadialBarChart,
  RadialBar,
  Legend,
} from 'recharts';
import {
  Target,
  Sparkles,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowUpDown,
  User,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  Award,
  Edit3,
  Layers,
} from 'lucide-react';

export const KPIProgressTrackerRecharts: React.FC = () => {
  const {
    language,
    employees,
    departments,
    employeeKPIs,
    updateKPIProgress,
  } = useApp();

  // Filters & Controls
  const [selectedEmpFilter, setSelectedEmpFilter] = useState('ALL');
  const [selectedCatFilter, setSelectedCatFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'LOWEST_PROGRESS' | 'HIGHEST_PROGRESS' | 'DUE_SOONEST'>('LOWEST_PROGRESS');
  const [chartMode, setChartMode] = useState<'BAR' | 'RADIAL'>('BAR');

  // Quick edit modal state
  const [editingKPI, setEditingKPI] = useState<EmployeeKPI | null>(null);
  const [newProgressValue, setNewProgressValue] = useState<number>(0);
  const [newStatus, setNewStatus] = useState<KPIStatus>('ON_TRACK');
  const [feedbackNote, setFeedbackNote] = useState<string>('');

  // Process and filter active employee goals
  const activeGoalsData = useMemo(() => {
    let list = employeeKPIs.map((kpi) => {
      const emp = employees.find((e) => e.id === kpi.employeeId);
      const dept = departments.find((d) => d.id === emp?.departmentId);
      const completionPct = kpi.targetValue > 0 ? Math.round((kpi.currentValue / kpi.targetValue) * 100) : 0;

      // Color coding based on completion tier
      let color = '#3b82f6'; // blue default
      if (completionPct >= 100) color = '#10b981'; // emerald
      else if (completionPct >= 75) color = '#3b82f6'; // blue
      else if (completionPct >= 50) color = '#f59e0b'; // amber
      else color = '#f43f5e'; // rose

      const goalTitle = language === 'lo' && kpi.titleLao ? kpi.titleLao : kpi.title;
      const empCode = emp?.employeeCode || '';
      const empName = emp ? `${emp.firstNameLao} ${emp.lastNameLao}` : kpi.employeeId;

      // Short label for chart YAxis
      const label = `[${empCode}] ${goalTitle.length > 24 ? goalTitle.substring(0, 24) + '...' : goalTitle}`;

      return {
        ...kpi,
        rawKPI: kpi,
        completionPct,
        color,
        goalTitle,
        empName,
        empCode,
        deptName: dept?.nameLao || '',
        label,
        weight: kpi.weight || 20,
      };
    });

    // Apply Employee filter
    if (selectedEmpFilter !== 'ALL') {
      list = list.filter((g) => g.employeeId === selectedEmpFilter);
    }

    // Apply Category filter
    if (selectedCatFilter !== 'ALL') {
      list = list.filter((g) => g.category === selectedCatFilter);
    }

    // Apply Status filter
    if (selectedStatusFilter !== 'ALL') {
      list = list.filter((g) => g.status === selectedStatusFilter);
    }

    // Apply Sorting
    list.sort((a, b) => {
      if (sortBy === 'LOWEST_PROGRESS') return a.completionPct - b.completionPct;
      if (sortBy === 'HIGHEST_PROGRESS') return b.completionPct - a.completionPct;
      if (sortBy === 'DUE_SOONEST') return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      return 0;
    });

    return list;
  }, [employeeKPIs, employees, departments, selectedEmpFilter, selectedCatFilter, selectedStatusFilter, sortBy, language]);

  // Overall statistics for active goals
  const stats = useMemo(() => {
    const total = activeGoalsData.length;
    if (total === 0) return { total: 0, avgPct: 0, completed: 0, onPace: 0, needsAttention: 0 };

    const totalPct = activeGoalsData.reduce((acc, g) => acc + g.completionPct, 0);
    const completed = activeGoalsData.filter((g) => g.completionPct >= 100).length;
    const onPace = activeGoalsData.filter((g) => g.completionPct >= 75 && g.completionPct < 100).length;
    const needsAttention = activeGoalsData.filter((g) => g.completionPct < 75).length;

    return {
      total,
      avgPct: Math.round(totalPct / total),
      completed,
      onPace,
      needsAttention,
    };
  }, [activeGoalsData]);

  // Handle open quick edit
  const handleOpenEdit = (kpi: EmployeeKPI) => {
    setEditingKPI(kpi);
    setNewProgressValue(kpi.currentValue);
    setNewStatus(kpi.status);
    setFeedbackNote(kpi.managerFeedback || '');
  };

  // Handle save edit
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingKPI) return;
    updateKPIProgress(editingKPI.id, Number(newProgressValue), newStatus, feedbackNote.trim());
    setEditingKPI(null);
  };

  // Custom Recharts Tooltip for Goals
  const CustomGoalTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-xl border border-slate-700 text-xs space-y-2 min-w-64 font-sans">
          <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
            <span className="font-bold text-slate-100">{data.empName}</span>
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono text-white"
              style={{ backgroundColor: data.color }}
            >
              {data.completionPct}%
            </span>
          </div>
          <div className="space-y-1 text-slate-300">
            <div className="font-bold text-slate-100 text-[11px]">{data.goalTitle}</div>
            <div className="text-[10px] text-slate-400 font-mono">
              {data.empCode} • {data.deptName} • {data.period}
            </div>
            <div className="flex justify-between font-mono pt-1 text-[11px]">
              <span className="text-slate-400">{language === 'lo' ? 'ຄ່າປັດຈຸບັນ / ເປົ້າໝາຍ' : 'Current / Target'}:</span>
              <span className="font-bold text-blue-300">
                {data.currentValue.toLocaleString()} / {data.targetValue.toLocaleString()} {data.unit}
              </span>
            </div>
            <div className="flex justify-between font-mono text-[11px]">
              <span className="text-slate-400">{language === 'lo' ? 'ນ້ຳໜັກເປົ້າໝາຍ' : 'Weight'}:</span>
              <span className="font-bold text-slate-200">{data.weight}%</span>
            </div>
            <div className="flex justify-between font-mono text-[11px]">
              <span className="text-slate-400">{language === 'lo' ? 'ກຳນົດສົ່ງ' : 'Due Date'}:</span>
              <span className="text-slate-300">{data.dueDate}</span>
            </div>
            {data.managerFeedback && (
              <div className="pt-1.5 border-t border-slate-700/80 text-[10px] text-amber-300 italic">
                "{data.managerFeedback}"
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Height of horizontal bar chart based on item count
  const dynamicChartHeight = Math.max(320, activeGoalsData.length * 38);

  return (
    <div id="recharts-kpi-progress-tracker" className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
      {/* 1. Header with Visual Tracker Tag & Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
                {language === 'lo'
                  ? 'ຕົວຕິດຕາມຄວາມຄືບໜ້າ KPI ພະນັກງານ (Recharts Visual Goal Tracker)'
                  : 'Active Employee KPI Visual Progress Tracker'}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1 font-mono">
                <Sparkles className="w-3 h-3 text-blue-600" />
                Live Goals Tracking
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'lo'
                ? 'ສະແດງເປີເຊັນຄວາມຄືບໜ້າຂອງແຕ່ລະເປົ້າໝາຍການເຮັດວຽກຂອງພະນັກງານ ພ້ອມເສັ້ນມາດຕະຖານ Target 100% ແລະ Pace 80%'
                : 'Interactive Recharts visualization displaying completion percentages, pacing benchmarks, and individual target progress'}
            </p>
          </div>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center gap-1 text-xs font-bold">
            <button
              onClick={() => setChartMode('BAR')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                chartMode === 'BAR'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {language === 'lo' ? 'ແຖບກຣາບ (Bar Progress)' : 'Progress Bars'}
            </button>
            <button
              onClick={() => setChartMode('RADIAL')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                chartMode === 'RADIAL'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {language === 'lo' ? 'ວົງແຫວນ Radial Rings' : 'Radial Rings'}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Visual Metric Highlights Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Total Active Goals */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-bold text-slate-500 uppercase block">
            {language === 'lo' ? 'ເປົ້າໝາຍທັງໝົດ' : 'Active Goals'}
          </span>
          <div className="text-xl font-black font-mono text-slate-900 dark:text-slate-100 mt-0.5">
            {stats.total}
          </div>
          <span className="text-[10px] text-slate-400">Tracked in Q4</span>
        </div>

        {/* Average Goal Completion */}
        <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/60">
          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase block">
            {language === 'lo' ? 'ຄວາມສຳເລັດສະເລ່ຍ' : 'Avg Completion'}
          </span>
          <div className="text-xl font-black font-mono text-blue-600 dark:text-blue-400 mt-0.5">
            {stats.avgPct}%
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Pace Target: 80%</span>
        </div>

        {/* 100%+ Done */}
        <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/60">
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase block">
            {language === 'lo' ? 'ບັນລຸ 100%' : '100%+ Completed'}
          </span>
          <div className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
            {stats.completed}
          </div>
          <span className="text-[10px] text-emerald-600 font-medium">Goal Achieved</span>
        </div>

        {/* On Pace (75% - 99%) */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-bold text-slate-500 uppercase block">
            {language === 'lo' ? 'ຕາມແຜນ (75-99%)' : 'On Pace (75-99%)'}
          </span>
          <div className="text-xl font-black font-mono text-blue-600 dark:text-blue-400 mt-0.5">
            {stats.onPace}
          </div>
          <span className="text-[10px] text-slate-400">Healthy Progress</span>
        </div>

        {/* Needs Acceleration (<75%) */}
        <div className="p-3.5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/60 col-span-2 lg:col-span-1">
          <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase block">
            {language === 'lo' ? 'ຕ້ອງເລັ່ງລັດ (<75%)' : 'Needs Push (<75%)'}
          </span>
          <div className="text-xl font-black font-mono text-rose-600 dark:text-rose-400 mt-0.5">
            {stats.needsAttention}
          </div>
          <span className="text-[10px] text-rose-600/80 font-medium">Attention Required</span>
        </div>
      </div>

      {/* 3. Filter & Sort Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Employee Filter */}
          <div className="relative">
            <select
              value={selectedEmpFilter}
              onChange={(e) => setSelectedEmpFilter(e.target.value)}
              aria-label={language === 'lo' ? 'ເລືອກພະນັກງານ' : 'Filter by employee'}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="ALL">{language === 'lo' ? 'ທຸກພະນັກງານ (All Staff)' : 'All Employees'}</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.employeeCode} - {emp.firstNameLao} {emp.lastNameLao}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="relative">
            <select
              value={selectedCatFilter}
              onChange={(e) => setSelectedCatFilter(e.target.value)}
              aria-label={language === 'lo' ? 'ເລືອກໝວດໝູ່' : 'Filter by category'}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="ALL">{language === 'lo' ? 'ທຸກໝວດໝູ່' : 'All Categories'}</option>
              <option value="OPERATIONAL">{language === 'lo' ? 'ການດຳເນີນງານ' : 'Operational'}</option>
              <option value="FINANCIAL">{language === 'lo' ? 'ການເງິນ' : 'Financial'}</option>
              <option value="QUALITY">{language === 'lo' ? 'ຄຸນນະພາບ & SLA' : 'Quality & SLA'}</option>
              <option value="CUSTOMER_SERVICE">{language === 'lo' ? 'ການບໍລິການ' : 'Customer Service'}</option>
              <option value="INNOVATION">{language === 'lo' ? 'ນະວັດຕະກຳ' : 'Innovation'}</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              aria-label={language === 'lo' ? 'ເລືອກສະຖານະ' : 'Filter by status'}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="ALL">{language === 'lo' ? 'ທຸກສະຖານະ' : 'All Statuses'}</option>
              <option value="ON_TRACK">{language === 'lo' ? 'ຕາມແຜນ (On Track)' : 'On Track'}</option>
              <option value="COMPLETED">{language === 'lo' ? 'ສຳເລັດ (Completed)' : 'Completed'}</option>
              <option value="IN_PROGRESS">{language === 'lo' ? 'ກຳລັງດຳເນີນການ (In Progress)' : 'In Progress'}</option>
              <option value="AT_RISK">{language === 'lo' ? 'ມີຄວາມສ່ຽງ (At Risk)' : 'At Risk'}</option>
            </select>
          </div>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium text-[11px] shrink-0 flex items-center gap-1">
            <ArrowUpDown className="w-3 h-3" />
            {language === 'lo' ? 'ຈັດລຽງ:' : 'Sort:'}
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            aria-label={language === 'lo' ? 'ຈັດລຽງຕາມ' : 'Sort by'}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <option value="LOWEST_PROGRESS">{language === 'lo' ? 'ຄວາມຄືບໜ້າຕ່ຳສຸດກ່ອນ (Needs Push)' : 'Lowest Progress First'}</option>
            <option value="HIGHEST_PROGRESS">{language === 'lo' ? 'ຄວາມຄືບໜ້າສູງສຸດກ່ອນ (Top Milestones)' : 'Highest Progress First'}</option>
            <option value="DUE_SOONEST">{language === 'lo' ? 'ກຳນົດສົ່ງໃກ້ສຸດ (Due Soonest)' : 'Due Soonest'}</option>
          </select>
        </div>
      </div>

      {/* 4. Main Recharts Visualization Canvas */}
      {activeGoalsData.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-slate-400 space-y-2">
          <Target className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
          <p className="font-bold text-sm text-slate-600 dark:text-slate-300">
            {language === 'lo' ? 'ບໍ່ພົບເປົ້າໝາຍທີ່ກົງກັບເງື່ອນໄຂ' : 'No active goals match selected filters'}
          </p>
          <p className="text-xs">
            {language === 'lo' ? 'ລອງປັບປ່ຽນຕົວກອງພະນັກງານ ຫຼື ໝວດໝູ່' : 'Try resetting employee or category filters'}
          </p>
        </div>
      ) : chartMode === 'BAR' ? (
        /* Horizontal Progress Bar Chart for Active Goals */
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
            <span>
              {language === 'lo' ? 'ຄວາມຄືບໜ້າແຕ່ລະເປົ້າໝາຍ (Goal Completion %)' : 'Individual Goal Progress (%)'} ({activeGoalsData.length} Goals)
            </span>
            <div className="flex items-center gap-3 text-[10px] font-mono">
              <span className="flex items-center gap-1 text-emerald-600">
                <span className="w-2.5 h-0.5 bg-emerald-500 inline-block" /> 100% Target
              </span>
              <span className="flex items-center gap-1 text-blue-600">
                <span className="w-2.5 h-0.5 bg-blue-500 inline-block" /> 80% Expected Pace
              </span>
            </div>
          </div>

          <div
            className="w-full bg-slate-50/70 dark:bg-slate-800/30 rounded-2xl p-3 sm:p-4 border border-slate-200/70 dark:border-slate-800"
            style={{ height: `${dynamicChartHeight}px` }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={activeGoalsData}
                margin={{ top: 10, right: 35, left: 15, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#94a3b8" strokeOpacity={0.2} />
                <XAxis
                  type="number"
                  domain={[0, 115]}
                  unit="%"
                  tick={{ fontSize: 11, fill: '#64748b', fontFamily: 'monospace' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                />
                <YAxis
                  dataKey="label"
                  type="category"
                  width={210}
                  tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomGoalTooltip />} />
                <ReferenceLine
                  x={100}
                  stroke="#10b981"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: '100% Target',
                    fill: '#10b981',
                    fontSize: 10,
                    position: 'top',
                    fontFamily: 'monospace',
                  }}
                />
                <ReferenceLine
                  x={80}
                  stroke="#3b82f6"
                  strokeDasharray="3 3"
                  strokeWidth={1}
                  label={{
                    value: '80% Pace',
                    fill: '#3b82f6',
                    fontSize: 10,
                    position: 'bottom',
                    fontFamily: 'monospace',
                  }}
                />
                <Bar
                  dataKey="completionPct"
                  name={language === 'lo' ? 'ຄວາມຄືບໜ້າ' : 'Completion Rate'}
                  radius={[0, 8, 8, 0]}
                  maxBarSize={22}
                  onClick={(entry: any) => handleOpenEdit(entry.rawKPI)}
                >
                  {activeGoalsData.map((entry, idx) => (
                    <Cell
                      key={`goal-bar-${idx}`}
                      fill={entry.color}
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-slate-400 italic text-right">
            {language === 'lo' ? '* ຄລິກທີ່ແຖບກຣາບເພື່ອອັບເດດຄວາມຄືບໜ້າເປົ້າໝາຍໄດ້ທັນທີ' : '* Click on any progress bar to quickly update goal progress'}
          </p>
        </div>
      ) : (
        /* Radial Gauge Rings View */
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
            <span>{language === 'lo' ? 'ວົງແຫວນຄວາມສຳເລັດ (Radial Goal Rings)' : 'Concentric Radial Progress Tracker'}</span>
            <span className="text-[11px] font-mono text-slate-400">Max 100% Ring Gauge</span>
          </div>

          <div className="w-full h-80 sm:h-96 bg-slate-50/70 dark:bg-slate-800/30 rounded-2xl p-4 border border-slate-200/70 dark:border-slate-800 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="15%"
                outerRadius="90%"
                barSize={12}
                data={activeGoalsData.slice(0, 7)}
              >
                <RadialBar
                  background={{ fill: '#e2e8f0' }}
                  dataKey="completionPct"
                  cornerRadius={6}
                >
                  {activeGoalsData.slice(0, 7).map((entry, idx) => (
                    <Cell key={`radial-cell-${idx}`} fill={entry.color} />
                  ))}
                </RadialBar>
                <Tooltip content={<CustomGoalTooltip />} />
                <Legend
                  iconSize={10}
                  layout="vertical"
                  verticalAlign="middle"
                  align="right"
                  wrapperStyle={{ fontSize: '11px', fontWeight: 600 }}
                  formatter={(val, entry: any) => `${entry.payload.empCode} - ${entry.payload.goalTitle.substring(0, 18)}... (${entry.payload.completionPct}%)`}
                />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 5. Quick Update Progress Modal from Chart Click */}
      {editingKPI && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-600" />
                <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  {language === 'lo' ? 'ອັບເດດຄວາມຄືບໜ້າເປົ້າໝາຍ' : 'Update Goal Progress'}
                </h4>
              </div>
              <button
                onClick={() => setEditingKPI(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 space-y-1 text-xs">
              <span className="text-[10px] font-bold text-blue-600 uppercase">
                Target: {editingKPI.targetValue.toLocaleString()} {editingKPI.unit}
              </span>
              <p className="font-bold text-slate-900 dark:text-slate-100">
                {language === 'lo' && editingKPI.titleLao ? editingKPI.titleLao : editingKPI.title}
              </p>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    {language === 'lo' ? 'ຄ່າຄວາມຄືບໜ້າໃໝ່' : 'New Current Value'} ({editingKPI.unit})
                  </label>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                    {editingKPI.targetValue > 0
                      ? `${Math.round((Number(newProgressValue) / editingKPI.targetValue) * 100)}%`
                      : '0%'}
                  </span>
                </div>
                <input
                  type="number"
                  step="any"
                  required
                  value={newProgressValue}
                  onChange={(e) => setNewProgressValue(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                />

                {/* Quick Increment Buttons */}
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-400 font-medium">
                    {language === 'lo' ? 'ປັບດ່ວນ:' : 'Quick adjust:'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const next = Math.min(editingKPI.targetValue, newProgressValue + editingKPI.targetValue * 0.1);
                      setNewProgressValue(Math.round(next * 10) / 10);
                    }}
                    className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px] font-bold cursor-pointer"
                  >
                    +10%
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const next = Math.min(editingKPI.targetValue, newProgressValue + editingKPI.targetValue * 0.25);
                      setNewProgressValue(Math.round(next * 10) / 10);
                    }}
                    className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px] font-bold cursor-pointer"
                  >
                    +25%
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewProgressValue(editingKPI.targetValue);
                      setNewStatus('COMPLETED');
                    }}
                    className="px-2 py-0.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-mono text-[10px] font-bold cursor-pointer"
                  >
                    100% {language === 'lo' ? 'ສຳເລັດ' : 'Done'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'lo' ? 'ສະຖານະປະເມີນ' : 'Current Pacing Status'}
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as KPIStatus)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <option value="ON_TRACK">{language === 'lo' ? 'ຕາມແຜນງານ (On Track)' : 'On Track'}</option>
                  <option value="COMPLETED">{language === 'lo' ? 'ສຳເລັດ 100% (Completed)' : 'Completed'}</option>
                  <option value="IN_PROGRESS">{language === 'lo' ? 'ກຳລັງດຳເນີນການ (In Progress)' : 'In Progress'}</option>
                  <option value="AT_RISK">{language === 'lo' ? 'ມີຄວາມສ່ຽງ / ຊັກຊ້າ (At Risk)' : 'At Risk'}</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'lo' ? 'ຄຳແນະນຳ & ຂໍ້ສັງເກດ' : 'Manager Coaching Notes'}
                </label>
                <textarea
                  rows={3}
                  value={feedbackNote}
                  onChange={(e) => setFeedbackNote(e.target.value)}
                  placeholder={language === 'lo' ? 'ບັນທຶກຄຳແນະນຳ...' : 'Feedback notes...'}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingKPI(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50"
                >
                  {language === 'lo' ? 'ຍົກເລີກ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm cursor-pointer"
                >
                  {language === 'lo' ? 'ບັນທຶກຄວາມຄືບໜ້າ' : 'Save Progress'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
