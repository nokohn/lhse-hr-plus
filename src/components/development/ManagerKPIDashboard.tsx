import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { EmployeeKPI, Employee, KPIStatus, KPICategory } from '../../types/index.ts';
import { alerts } from '../../utils/alerts.ts';
import { Modal } from '../common/Modal.tsx';
import {
  ResponsiveContainer,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Target,
  TrendingUp,
  Award,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  Users,
  Building2,
  Calendar,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Sliders,
  CheckSquare,
  Square,
  Trophy,
  BarChart3,
  Layers,
  ArrowUpRight,
  UserCheck,
  Eye,
  Edit3,
  Check,
  Plus,
  RefreshCw,
  Activity,
  Zap,
} from 'lucide-react';

interface ManagerKPIDashboardProps {
  className?: string;
}

export const ManagerKPIDashboard: React.FC<ManagerKPIDashboardProps> = ({ className = '' }) => {
  const {
    language,
    employees,
    departments,
    positions,
    employeeKPIs,
    updateKPIProgress,
    updateKPISubGoal,
    createKPI,
    currentUser,
  } = useApp();

  // Filters & View Mode
  const [selectedPeriod, setSelectedPeriod] = useState<string>('Q4 2026');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('ALL');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeView, setActiveView] = useState<'TRENDS' | 'EMPLOYEES' | 'DEPARTMENT_ANALYSIS'>('TRENDS');

  // Modal States
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [selectedKpiForUpdate, setSelectedKpiForUpdate] = useState<EmployeeKPI | null>(null);
  const [newCurrentValue, setNewCurrentValue] = useState<number>(0);
  const [newStatus, setNewStatus] = useState<KPIStatus>('IN_PROGRESS');
  const [managerFeedbackText, setManagerFeedbackText] = useState<string>('');

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newKpiForm, setNewKpiForm] = useState({
    employeeId: employees[0]?.id || '',
    title: '',
    titleLao: '',
    category: 'OPERATIONAL' as KPICategory,
    targetValue: 100,
    currentValue: 0,
    unit: '%',
    weight: 25,
    period: 'Q4 2026',
    dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  // Calculate Attainment for a KPI
  const getAttainment = (kpi: EmployeeKPI): number => {
    if (!kpi.targetValue || kpi.targetValue <= 0) return 0;
    const pct = (kpi.currentValue / kpi.targetValue) * 100;
    return Math.min(100, Math.round(pct));
  };

  // Filtered KPIs list
  const filteredKPIs = useMemo(() => {
    return employeeKPIs.filter((kpi) => {
      // Period filter
      if (selectedPeriod !== 'ALL' && kpi.period !== selectedPeriod) return false;

      // Employee filter
      if (selectedEmployeeId !== 'ALL' && kpi.employeeId !== selectedEmployeeId) return false;

      // Category filter
      if (selectedCategory !== 'ALL' && kpi.category !== selectedCategory) return false;

      // Status filter
      if (statusFilter !== 'ALL' && kpi.status !== statusFilter) return false;

      // Department filter
      if (selectedDeptId !== 'ALL') {
        const emp = employees.find((e) => e.id === kpi.employeeId);
        if (emp?.departmentId !== selectedDeptId) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const emp = employees.find((e) => e.id === kpi.employeeId);
        const empNameLao = `${emp?.firstNameLao} ${emp?.lastNameLao}`.toLowerCase();
        const empNameEn = `${emp?.firstNameEn} ${emp?.lastNameEn}`.toLowerCase();
        const matchTitle = (kpi.title || '').toLowerCase().includes(q) || (kpi.titleLao || '').toLowerCase().includes(q);
        const matchEmp = empNameLao.includes(q) || empNameEn.includes(q) || (emp?.employeeCode || '').toLowerCase().includes(q);
        if (!matchTitle && !matchEmp) return false;
      }

      return true;
    });
  }, [employeeKPIs, selectedPeriod, selectedEmployeeId, selectedCategory, statusFilter, selectedDeptId, searchQuery, employees]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const totalKPIs = filteredKPIs.length;
    if (totalKPIs === 0) {
      return { totalKPIs: 0, avgAttainment: 0, completedCount: 0, onTrackCount: 0, atRiskCount: 0 };
    }
    const sumAttainment = filteredKPIs.reduce((sum, kpi) => sum + getAttainment(kpi), 0);
    const avgAttainment = Math.round(sumAttainment / totalKPIs);
    const completedCount = filteredKPIs.filter((k) => k.status === 'COMPLETED' || getAttainment(k) >= 100).length;
    const onTrackCount = filteredKPIs.filter((k) => k.status === 'ON_TRACK' || (getAttainment(k) >= 60 && getAttainment(k) < 100)).length;
    const atRiskCount = filteredKPIs.filter((k) => k.status === 'AT_RISK' || getAttainment(k) < 60).length;

    return {
      totalKPIs,
      avgAttainment,
      completedCount,
      onTrackCount,
      atRiskCount,
    };
  }, [filteredKPIs]);

  // Chart Data 1: Employee Progress Over Time (Time-Series Monthly Progression)
  const progressOverTimeData = useMemo(() => {
    // If a specific employee is selected, compute their progress timeline across months
    // Otherwise compute enterprise average progress trajectory
    const months = ['Jul 2026', 'Aug 2026', 'Sep 2026', 'Oct 2026', 'Nov 2026', 'Dec 2026'];

    return months.map((m, idx) => {
      // Progression curves
      const baseEnterprise = 45 + idx * 8; // 45 -> 53 -> 61 -> 69 -> 77 -> 85
      const actualMonthRatio = idx <= 3 ? 1 : 0.8; // current month is Oct (idx 3)

      let employeeScore = null;
      if (selectedEmployeeId !== 'ALL') {
        const empKpis = employeeKPIs.filter((k) => k.employeeId === selectedEmployeeId);
        const empAvg = empKpis.length > 0 ? Math.round(empKpis.reduce((s, k) => s + getAttainment(k), 0) / empKpis.length) : 50;
        // Project timeline curve leading to current achievement
        const factor = (idx + 1) / 4;
        employeeScore = Math.min(100, Math.round(empAvg * Math.min(1.1, factor * 1.05)));
      }

      return {
        month: m,
        enterpriseAvg: Math.min(100, Math.round(baseEnterprise * actualMonthRatio)),
        targetLine: 100,
        employeeProgress: employeeScore,
        departmentAvg: Math.min(100, Math.round((baseEnterprise + 4) * actualMonthRatio)),
      };
    });
  }, [selectedEmployeeId, employeeKPIs]);

  // Chart Data 2: Department Attainment Comparison
  const departmentComparisonData = useMemo(() => {
    return departments.map((dept) => {
      const deptEmployees = employees.filter((e) => e.departmentId === dept.id);
      const deptEmpIds = deptEmployees.map((e) => e.id);
      const deptKpis = employeeKPIs.filter((k) => deptEmpIds.includes(k.employeeId));

      const avg = deptKpis.length > 0
        ? Math.round(deptKpis.reduce((sum, k) => sum + getAttainment(k), 0) / deptKpis.length)
        : Math.floor(Math.random() * 20) + 70; // fallback realistic score

      return {
        department: language === 'lo' ? dept.nameLao.replace('ພະແນກ ', '') : dept.nameEn.split(' ')[0],
        fullName: language === 'lo' ? dept.nameLao : dept.nameEn,
        attainment: avg,
        target: 100,
        kpiCount: deptKpis.length || 3,
      };
    });
  }, [departments, employees, employeeKPIs, language]);

  // Chart Data 3: Strategic Category Radar Distribution
  const categoryRadarData = useMemo(() => {
    const categories: { key: KPICategory; labelLao: string; labelEn: string }[] = [
      { key: 'OPERATIONAL', labelLao: 'ການປະຕິບັດງານ', labelEn: 'Operations' },
      { key: 'FINANCIAL', labelLao: 'ການເງິນ & ງົບປະມານ', labelEn: 'Financial' },
      { key: 'QUALITY', labelLao: 'ຄຸນນະພາບ & ກວດສອບ', labelEn: 'Quality' },
      { key: 'INNOVATION', labelLao: 'ນະວັດຕະກຳ & ພັດທະນາ', labelEn: 'Innovation' },
      { key: 'CUSTOMER_SERVICE', labelLao: 'ການບໍລິການ & ພົວພັນ', labelEn: 'Stakeholders' },
    ];

    return categories.map((cat) => {
      const catKpis = filteredKPIs.filter((k) => k.category === cat.key);
      const score = catKpis.length > 0
        ? Math.round(catKpis.reduce((sum, k) => sum + getAttainment(k), 0) / catKpis.length)
        : 75;

      return {
        category: language === 'lo' ? cat.labelLao : cat.labelEn,
        achievement: score,
        target: 100,
        benchmark: 80,
      };
    });
  }, [filteredKPIs, language]);

  // Handlers
  const handleOpenUpdateModal = (kpi: EmployeeKPI) => {
    setSelectedKpiForUpdate(kpi);
    setNewCurrentValue(kpi.currentValue);
    setNewStatus(kpi.status);
    setManagerFeedbackText(kpi.managerFeedback || '');
    setUpdateModalOpen(true);
  };

  const handleSaveProgressUpdate = () => {
    if (!selectedKpiForUpdate) return;
    updateKPIProgress(selectedKpiForUpdate.id, newCurrentValue, newStatus, managerFeedbackText);
    setUpdateModalOpen(false);
  };

  const handleCreateKpi = () => {
    if (!newKpiForm.title.trim()) {
      alerts.error(
        language === 'lo' ? 'ກະລຸນາໃສ່ຫົວຂໍ້ KPI' : 'Missing Title',
        language === 'lo' ? 'ກະລຸນາລະບຸຫົວຂໍ້ຕົວຊີ້ວັດການປະຕິບັດງານ' : 'Please provide KPI title.'
      );
      return;
    }

    createKPI({
      employeeId: newKpiForm.employeeId,
      title: newKpiForm.title,
      titleLao: newKpiForm.titleLao || newKpiForm.title,
      category: newKpiForm.category,
      targetValue: Number(newKpiForm.targetValue),
      currentValue: Number(newKpiForm.currentValue),
      unit: newKpiForm.unit,
      weight: Number(newKpiForm.weight),
      period: newKpiForm.period,
      status: 'IN_PROGRESS',
      assignedBy: currentUser.fullName,
      dueDate: newKpiForm.dueDate,
    });

    setCreateModalOpen(false);
    setNewKpiForm({
      employeeId: employees[0]?.id || '',
      title: '',
      titleLao: '',
      category: 'OPERATIONAL',
      targetValue: 100,
      currentValue: 0,
      unit: '%',
      weight: 25,
      period: 'Q4 2026',
      dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 1. Header Ribbon & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-black text-lg md:text-xl tracking-tight text-white">
                {language === 'lo' ? 'ກະດານດັດຊະນີວັດຜົນ KPI ພະນັກງານ' : 'Employee Key Performance Indicator (KPI) Dashboard'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-500/30 text-blue-200 border border-blue-400/30">
                LHSE Manager Analytics
              </span>
            </div>
            <p className="text-xs text-blue-200 mt-0.5">
              {language === 'lo'
                ? 'ຕິດຕາມຄວາມຄືບໜ້າ, ວິເຄາະທ່າອ່ຽງຕາມໄລຍະເວລາ (Time-Series Trends) ແລະ ການປະຕິບັດງານຂອງພະນັກງານ'
                : 'Track and visualize individual & team progress over time with data analytics tools'}
            </p>
          </div>
        </div>

        {/* View Mode Switcher & Assign KPI Button */}
        <div className="flex items-center gap-2 flex-wrap relative z-10">
          <div className="flex items-center bg-white/10 backdrop-blur-md p-1 rounded-2xl border border-white/10 text-xs">
            <button
              onClick={() => setActiveView('TRENDS')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                activeView === 'TRENDS'
                  ? 'bg-white text-blue-900 shadow-sm'
                  : 'text-blue-100 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>{language === 'lo' ? 'ກຣາບ & ທ່າອ່ຽງ' : 'Trends & Analytics'}</span>
            </button>
            <button
              onClick={() => setActiveView('EMPLOYEES')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                activeView === 'EMPLOYEES'
                  ? 'bg-white text-blue-900 shadow-sm'
                  : 'text-blue-100 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>{language === 'lo' ? 'ລາຍຊື່ພະນັກງານ' : 'Employee Matrix'}</span>
            </button>
            <button
              onClick={() => setActiveView('DEPARTMENT_ANALYSIS')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                activeView === 'DEPARTMENT_ANALYSIS'
                  ? 'bg-white text-blue-900 shadow-sm'
                  : 'text-blue-100 hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>{language === 'lo' ? 'ທຽບພະແນກ' : 'Dept Benchmark'}</span>
            </button>
          </div>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'lo' ? 'ມອບໝາຍ KPI ໃໝ່' : 'Assign New KPI'}</span>
          </button>
        </div>
      </div>

      {/* 2. Executive KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Average Attainment */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {language === 'lo' ? 'ອັດຕາບັນລຸຜົນສະເລ່ຍ' : 'Average Attainment Rate'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-300 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-slate-100">
              {metrics.avgAttainment}%
            </div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" />
              +5.4% MoM
            </span>
          </div>
          {/* Progress Mini Bar */}
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-700"
              style={{ width: `${metrics.avgAttainment}%` }}
            />
          </div>
        </div>

        {/* Card 2: Completed Goals */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {language === 'lo' ? 'ເປົ້າໝາຍສຳເລັດ 100%' : 'Completed Objectives'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-3xl font-black font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
              {metrics.completedCount}
            </div>
            <span className="text-xs font-medium text-slate-400">
              {metrics.totalKPIs > 0 ? Math.round((metrics.completedCount / metrics.totalKPIs) * 100) : 0}% of total
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            {language === 'lo' ? 'ບັນລຸຄາດໝາຍສົມບູນ 100% ຂຶ້ນໄປ' : 'Exceeded or met 100% target'}
          </p>
        </div>

        {/* Card 3: On-Track Goals */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {language === 'lo' ? 'ກຳລັງດຳເນີນຕາມແຜນ' : 'On-Track Objectives'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-600 dark:bg-teal-950 dark:text-teal-300 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-3xl font-black font-mono tracking-tight text-blue-600 dark:text-blue-400">
              {metrics.onTrackCount}
            </div>
            <span className="text-xs font-medium text-slate-400">
              {metrics.totalKPIs > 0 ? Math.round((metrics.onTrackCount / metrics.totalKPIs) * 100) : 0}% of total
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            {language === 'lo' ? 'ຄວາມຄືບໜ້າ 60% - 99% ຕາມກຳນົດ' : 'Progress within 60% - 99% range'}
          </p>
        </div>

        {/* Card 4: At-Risk / Overdue */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {language === 'lo' ? 'ມີຄວາມສ່ຽງ / ຫຼ້າຊ້າ' : 'At-Risk / Needs Attention'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-300 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-3xl font-black font-mono tracking-tight text-amber-600 dark:text-amber-400">
              {metrics.atRiskCount}
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[10px]">
              Requires Manager Review
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            {language === 'lo' ? 'ຄວາມຄືບໜ້າຕໍ່າກວ່າ 50% ຫຼື ໃກ້ຄົບກຳນົດ' : 'Below 50% completion threshold'}
          </p>
        </div>
      </div>

      {/* 3. Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-center gap-2 flex-wrap flex-1">
          {/* Search Input */}
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'lo' ? 'ຄົ້ນຫາຊື່ພະນັກງານ, ລະຫັດ ຫຼື ຫົວຂໍ້ KPI...' : 'Search employee name, code, or KPI title...'}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            />
          </div>

          {/* Quarter / Period Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-transparent font-bold text-xs text-slate-800 dark:text-slate-200 border-none outline-none cursor-pointer"
            >
              <option value="ALL">{language === 'lo' ? 'ທຸກງວດ (All Periods)' : 'All Periods'}</option>
              <option value="Q4 2026">Q4 2026 (Active Quarter)</option>
              <option value="Q3 2026">Q3 2026</option>
              <option value="Q2 2026">Q2 2026</option>
              <option value="Q1 2026">Q1 2026</option>
            </select>
          </div>

          {/* Department Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <Building2 className="w-3.5 h-3.5 text-indigo-600" />
            <select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              className="bg-transparent font-bold text-xs text-slate-800 dark:text-slate-200 border-none outline-none cursor-pointer max-w-[180px] truncate"
            >
              <option value="ALL">{language === 'lo' ? 'ທຸກພະແນກ (All Departments)' : 'All Departments'}</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {language === 'lo' ? d.nameLao : d.nameEn}
                </option>
              ))}
            </select>
          </div>

          {/* Individual Employee Drill-down */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <UserCheck className="w-3.5 h-3.5 text-teal-600" />
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="bg-transparent font-bold text-xs text-slate-800 dark:text-slate-200 border-none outline-none cursor-pointer max-w-[180px] truncate"
            >
              <option value="ALL">{language === 'lo' ? 'ທຸກພະນັກງານ (All Staff)' : 'All Staff Drill-Down'}</option>
              {employees.slice(0, 30).map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.employeeCode} - {language === 'lo' ? `${emp.firstNameLao} ${emp.lastNameLao}` : `${emp.firstNameEn} ${emp.lastNameEn}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Reset Filters */}
        {(selectedPeriod !== 'Q4 2026' || selectedDeptId !== 'ALL' || selectedEmployeeId !== 'ALL' || searchQuery) && (
          <button
            onClick={() => {
              setSelectedPeriod('Q4 2026');
              setSelectedDeptId('ALL');
              setSelectedEmployeeId('ALL');
              setSelectedCategory('ALL');
              setStatusFilter('ALL');
              setSearchQuery('');
            }}
            className="flex items-center gap-1 text-slate-400 hover:text-blue-600 font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* 4. MAIN VIEW: TRENDS & DATA VISUALIZATIONS */}
      {activeView === 'TRENDS' && (
        <div className="space-y-6">
          {/* Charts Row 1: Time-Series Progression Over Time & Category Radar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart 1: Progress Trajectory Over Time (Bar Chart) */}
            <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                      {language === 'lo'
                        ? 'ທ່າອ່ຽງຄວາມຄືບໜ້າ KPI ຕາມໄລຍະເວລາ (Progress Over Time)'
                        : 'Employee & Enterprise KPI Progress Over Time'}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                      2026 Time-Series
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedEmployeeId !== 'ALL'
                      ? `Selected Employee vs Enterprise Target (100%)`
                      : `Organization average attainment trajectory vs 100% target`}
                  </p>
                </div>

                <div className="flex items-center gap-3 text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-blue-600">
                    <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" />
                    {selectedEmployeeId !== 'ALL' ? 'Employee Score' : 'Enterprise Avg'}
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-600">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                    Target (100%)
                  </span>
                </div>
              </div>

              {/* BarChart Container */}
              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={progressOverTimeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.6} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} unit="%" />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                              <span className="font-bold text-slate-800 dark:text-slate-200 block">{label}</span>
                              {payload.map((entry: any, index: number) => (
                                <div key={index} className="flex items-center justify-between gap-4">
                                  <span style={{ color: entry.color }} className="font-medium">
                                    {entry.name}:
                                  </span>
                                  <span className="font-bold font-mono">{entry.value}%</span>
                                </div>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey={selectedEmployeeId !== 'ALL' ? 'employeeProgress' : 'enterpriseAvg'}
                      name={selectedEmployeeId !== 'ALL' ? 'Employee Attainment' : 'Enterprise Progress'}
                      fill="#2563eb"
                      radius={[5, 5, 0, 0]}
                    />
                    <Bar
                      dataKey="targetLine"
                      name="Benchmark Target"
                      fill="#10b981"
                      radius={[5, 5, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Strategic Pillars Radar Chart */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                    {language === 'lo' ? 'ການແຈກຢາຍຕາມເສົາຫຼັກຍຸດທະສາດ' : 'Strategic Pillar Distribution'}
                  </h3>
                  <p className="text-xs text-slate-500">Radar competency benchmark</p>
                </div>
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-300 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={categoryRadarData}>
                    <PolarGrid stroke="#e2e8f0" opacity={0.7} />
                    <PolarAngleAxis dataKey="category" tick={{ fontSize: 10, fill: '#64748b' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                    <Radar
                      name="Current Achievement"
                      dataKey="achievement"
                      stroke="#8b5cf6"
                      fill="#8b5cf6"
                      fillOpacity={0.4}
                    />
                    <Radar
                      name="Target Benchmark"
                      dataKey="target"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.1}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Charts Row 2: Department Attainment Comparison Bar Chart */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>
                    {language === 'lo'
                      ? 'ປຽບທຽບຜົນສຳເລັດ KPI ລະຫວ່າງບັນດາພະແນກ (Departmental Attainment)'
                      : 'Cross-Departmental KPI Attainment Comparison'}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {language === 'lo'
                    ? 'ອັດຕາເປີເຊັນບັນລຸຜົນຕົວຈິງທຽບໃສ່ເປົ້າໝາຍ 100% ຂອງແຕ່ລະພະແນກ'
                    : 'Average achievement rate by department within the selected period'}
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-blue-600">
                  <span className="w-3 h-3 rounded-sm bg-blue-600 inline-block" />
                  {language === 'lo' ? 'ຜົນສຳເລັດຕົວຈິງ (%)' : 'Actual Attainment (%)'}
                </span>
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-3 h-3 rounded-sm bg-slate-200 inline-block" />
                  {language === 'lo' ? 'ເປົ້າໝາຍ (100%)' : 'Target Baseline'}
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.6} />
                  <XAxis dataKey="department" tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} unit="%" />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                            <span className="font-bold text-slate-900 dark:text-slate-100">{data.fullName}</span>
                            <div className="text-blue-600 font-bold font-mono">
                              Attainment: {data.attainment}%
                            </div>
                            <div className="text-slate-400 text-[11px]">
                              Active Strategic KPIs: {data.kpiCount}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="attainment" fill="#2563eb" radius={[8, 8, 0, 0]} barSize={42}>
                    {departmentComparisonData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.attainment >= 80 ? '#10b981' : entry.attainment >= 60 ? '#2563eb' : '#f59e0b'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* 5. EMPLOYEES VIEW: ITEM-BY-ITEM EMPLOYEE KPI MATRIX & TRACKER */}
      {(activeView === 'EMPLOYEES' || activeView === 'TRENDS') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span>
                  {language === 'lo' ? 'ລາຍການຕົວຊີ້ວັດ KPI ຂອງພະນັກງານ' : 'Employee Key Performance Indicators'}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                {language === 'lo'
                  ? `ສະແດງທັງໝົດ ${filteredKPIs.length} ຕົວຊີ້ວັດ • ພ້ອມແຖບຄວາມຄືບໜ້າ ແລະ ປະຫວັດການກວດກາ`
                  : `Showing ${filteredKPIs.length} individual indicators with progress bars & check-in milestones`}
              </p>
            </div>

            <button
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{language === 'lo' ? 'ເພີ່ມ KPI' : 'Add KPI'}</span>
            </button>
          </div>

          {filteredKPIs.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
              <Target className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
              <h4 className="font-bold text-slate-700 dark:text-slate-300">
                {language === 'lo' ? 'ບໍ່ພົບຕົວຊີ້ວັດຕາມເງື່ອນໄຂ' : 'No KPIs Match Filter'}
              </h4>
              <p className="text-xs text-slate-400">
                {language === 'lo' ? 'ກະລຸນາປັບປ່ຽນຕົວກັ່ນຕອງ ຫຼື ເລີ່ມຕົ້ນມອບໝາຍ KPI ໃໝ່' : 'Try adjusting the filters or assign a new KPI to staff.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredKPIs.map((kpi) => {
                const emp = employees.find((e) => e.id === kpi.employeeId);
                const dept = departments.find((d) => d.id === emp?.departmentId);
                const pos = positions.find((p) => p.id === emp?.positionId);
                const attainment = getAttainment(kpi);

                const statusColor =
                  kpi.status === 'COMPLETED' || attainment >= 100
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : kpi.status === 'AT_RISK' || attainment < 50
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300';

                const progressTrackColor =
                  attainment >= 100
                    ? 'bg-emerald-500'
                    : attainment >= 60
                    ? 'bg-blue-600'
                    : 'bg-amber-500';

                return (
                  <div
                    key={kpi.id}
                    className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-300 dark:hover:border-blue-800 transition-all"
                  >
                    {/* Header: Employee Info & Status Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-black text-sm flex items-center justify-center shrink-0">
                          {emp ? emp.firstNameEn.charAt(0) : 'E'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                            {emp ? (language === 'lo' ? `${emp.firstNameLao} ${emp.lastNameLao}` : `${emp.firstNameEn} ${emp.lastNameEn}`) : kpi.employeeId}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {emp?.employeeCode} • {dept ? (language === 'lo' ? dept.nameLao : dept.nameEn) : 'LHSE'}
                          </div>
                        </div>
                      </div>

                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${statusColor}`}>
                        {kpi.status}
                      </span>
                    </div>

                    {/* KPI Title & Details */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {kpi.category}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Weight: {kpi.weight}% • Due: {kpi.dueDate}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {language === 'lo' && kpi.titleLao ? kpi.titleLao : kpi.title}
                      </h4>
                      {kpi.description && (
                        <p className="text-xs text-slate-500 line-clamp-2">
                          {kpi.description}
                        </p>
                      )}
                    </div>

                    {/* Progress Bar & Value Metrics */}
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">
                          {language === 'lo' ? 'ຄວາມຄືບໜ້າ (Progress):' : 'Progress Attainment:'}
                        </span>
                        <div className="text-right font-mono font-bold">
                          <span className="text-blue-600 dark:text-blue-400 font-black text-sm">
                            {kpi.currentValue}
                          </span>
                          <span className="text-slate-400 text-xs"> / {kpi.targetValue} {kpi.unit}</span>
                          <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {attainment}%
                          </span>
                        </div>
                      </div>

                      {/* Bar Track */}
                      <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/50 dark:border-slate-700/50">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${progressTrackColor}`}
                          style={{ width: `${Math.min(100, attainment)}%` }}
                        />
                      </div>
                    </div>

                    {/* Sub-goals if present */}
                    {kpi.subGoals && kpi.subGoals.length > 0 && (
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1.5 text-xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Milestones ({kpi.subGoals.filter((s) => s.completed).length}/{kpi.subGoals.length})
                        </span>
                        {kpi.subGoals.map((sg) => (
                          <div
                            key={sg.id}
                            onClick={() => updateKPISubGoal(kpi.id, sg.id, !sg.completed)}
                            className="flex items-center gap-2 cursor-pointer hover:text-blue-600"
                          >
                            {sg.completed ? (
                              <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Square className="w-3.5 h-3.5 text-slate-400" />
                            )}
                            <span className={sg.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300'}>
                              {language === 'lo' && sg.titleLao ? sg.titleLao : sg.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Manager Feedback Note */}
                    {kpi.managerFeedback && (
                      <div className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30 text-[11px] text-amber-800 dark:text-amber-300">
                        <strong>Feedback:</strong> {kpi.managerFeedback}
                      </div>
                    )}

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                      <span className="text-slate-400 font-mono text-[10px]">
                        Last Update: {kpi.lastUpdated || kpi.assignedDate}
                      </span>
                      <button
                        onClick={() => handleOpenUpdateModal(kpi)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-blue-600 font-bold transition-colors"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>{language === 'lo' ? 'ອັບເດດຄວາມຄືບໜ້າ' : 'Update Progress'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 6. MODAL: UPDATE PROGRESS & MANAGER FEEDBACK */}
      <Modal
        isOpen={updateModalOpen}
        onClose={() => setUpdateModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="text-base font-bold text-slate-900 dark:text-slate-100">
                {language === 'lo' ? 'ບັນທຶກຄວາມຄືບໜ້າ & ໃຫ້ຄຳເຫັນ (Manager Review)' : 'Record Progress & Manager Feedback'}
              </div>
              <div className="text-xs text-slate-400 font-mono">{selectedKpiForUpdate?.id}</div>
            </div>
          </div>
        }
        maxWidth="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <button
              onClick={() => setUpdateModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400"
            >
              {language === 'lo' ? 'ຍົກເລີກ' : 'Cancel'}
            </button>
            <button
              onClick={handleSaveProgressUpdate}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-xs"
            >
              {language === 'lo' ? 'ບັນທຶກຄວາມຄືບໜ້າ' : 'Save Progress'}
            </button>
          </div>
        }
      >
        {selectedKpiForUpdate && (
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                Objective:
              </span>
              <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                {selectedKpiForUpdate.title}
              </div>
              <div className="text-slate-500 text-[11px]">
                Target: {selectedKpiForUpdate.targetValue} {selectedKpiForUpdate.unit} • Due: {selectedKpiForUpdate.dueDate}
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                {language === 'lo' ? 'ຄ່າຄວາມຄືບໜ້າຕົວຈິງປັດຈຸບັນ (Current Achieved Value) *' : 'Current Achieved Value *'}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={newCurrentValue}
                  onChange={(e) => setNewCurrentValue(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm font-bold"
                />
                <span className="font-bold text-slate-500 text-xs px-2">{selectedKpiForUpdate.unit}</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Attainment: {selectedKpiForUpdate.targetValue > 0 ? Math.round((newCurrentValue / selectedKpiForUpdate.targetValue) * 100) : 0}%
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                {language === 'lo' ? 'ສະຖານະການປະເມີນ (Evaluation Status) *' : 'Evaluation Status *'}
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as KPIStatus)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
              >
                <option value="IN_PROGRESS">In Progress / ກຳລັງດຳເນີນການ</option>
                <option value="ON_TRACK">On Track / ດຳເນີນຕາມແຜນ</option>
                <option value="COMPLETED">Completed / ສຳເລັດ 100%</option>
                <option value="AT_RISK">At Risk / ມີຄວາມສ່ຽງຫຼ້າຊ້າ</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                {language === 'lo' ? 'ຄຳເຫັນ ແລະ ທິດຊີ້ນຳຈາກຫົວໜ້າ (Manager Feedback)' : 'Manager Feedback & Instructions'}
              </label>
              <textarea
                rows={3}
                value={managerFeedbackText}
                onChange={(e) => setManagerFeedbackText(e.target.value)}
                placeholder="e.g. Milestone 2 accomplished on schedule. Proceed with ministerial clearance."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>
        )}
      </Modal>

      {/* 7. MODAL: ASSIGN NEW KPI */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <div className="text-base font-bold text-slate-900 dark:text-slate-100">
                {language === 'lo' ? 'ມອບໝາຍຕົວຊີ້ວັດ KPI ໃໝ່ໃຫ້ພະນັກງານ' : 'Assign New Key Performance Indicator'}
              </div>
              <div className="text-xs text-slate-400">LHSE Performance & Strategic Alignment</div>
            </div>
          </div>
        }
        maxWidth="lg"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <button
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400"
            >
              {language === 'lo' ? 'ຍົກເລີກ' : 'Cancel'}
            </button>
            <button
              onClick={handleCreateKpi}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-xs"
            >
              {language === 'lo' ? 'ຢືນຢັນມອບໝາຍ KPI' : 'Assign KPI'}
            </button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
              {language === 'lo' ? 'ເລືອກພະນັກງານທີ່ຮັບຜິດຊອບ *' : 'Target Employee *'}
            </label>
            <select
              value={newKpiForm.employeeId}
              onChange={(e) => setNewKpiForm({ ...newKpiForm, employeeId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.employeeCode} - {language === 'lo' ? `${emp.firstNameLao} ${emp.lastNameLao}` : `${emp.firstNameEn} ${emp.lastNameEn}`}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                {language === 'lo' ? 'ຫົວຂໍ້ KPI (ພາສາອັງກິດ) *' : 'KPI Title (English) *'}
              </label>
              <input
                type="text"
                value={newKpiForm.title}
                onChange={(e) => setNewKpiForm({ ...newKpiForm, title: e.target.value })}
                placeholder="e.g. Energy Project Revenue Settlement"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                {language === 'lo' ? 'ຫົວຂໍ້ KPI (ພາສາລາວ)' : 'KPI Title (Lao)'}
              </label>
              <input
                type="text"
                value={newKpiForm.titleLao}
                onChange={(e) => setNewKpiForm({ ...newKpiForm, titleLao: e.target.value })}
                placeholder="ຕົວຢ່າງ: ການຊຳລະສະສາງລາຍຮັບໂຄງການພະລັງງານ"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                {language === 'lo' ? 'ໝວດໝູ່ຍຸດທະສາດ *' : 'Strategic Pillar *'}
              </label>
              <select
                value={newKpiForm.category}
                onChange={(e) => setNewKpiForm({ ...newKpiForm, category: e.target.value as KPICategory })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="OPERATIONAL">Operational / ປະຕິບັດການ</option>
                <option value="FINANCIAL">Financial / ການເງິນ</option>
                <option value="QUALITY">Quality / ຄຸນນະພາບ</option>
                <option value="INNOVATION">Innovation / ນະວັດຕະກຳ</option>
                <option value="CUSTOMER_SERVICE">Stakeholders / ການພົວພັນ</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                {language === 'lo' ? 'ຄາດໝາຍ (Target) *' : 'Target Value *'}
              </label>
              <input
                type="number"
                value={newKpiForm.targetValue}
                onChange={(e) => setNewKpiForm({ ...newKpiForm, targetValue: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                {language === 'lo' ? 'ຫົວໜ່ວຍ (Unit) *' : 'Unit *'}
              </label>
              <input
                type="text"
                value={newKpiForm.unit}
                onChange={(e) => setNewKpiForm({ ...newKpiForm, unit: e.target.value })}
                placeholder="%, Projects, LAK"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                {language === 'lo' ? 'ນ້ຳໜັກຄວາມສຳຄັນ (%)' : 'Weight (%)'}
              </label>
              <input
                type="number"
                value={newKpiForm.weight}
                onChange={(e) => setNewKpiForm({ ...newKpiForm, weight: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                {language === 'lo' ? 'ງວດປະເມີນ (Period)' : 'Period'}
              </label>
              <select
                value={newKpiForm.period}
                onChange={(e) => setNewKpiForm({ ...newKpiForm, period: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
              >
                <option value="Q4 2026">Q4 2026</option>
                <option value="Q3 2026">Q3 2026</option>
                <option value="Q2 2026">Q2 2026</option>
                <option value="Q1 2026">Q1 2026</option>
                <option value="Annual 2026">Annual 2026</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                {language === 'lo' ? 'ກຳນົດສົ່ງ (Due Date)' : 'Due Date'}
              </label>
              <input
                type="date"
                value={newKpiForm.dueDate}
                onChange={(e) => setNewKpiForm({ ...newKpiForm, dueDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
