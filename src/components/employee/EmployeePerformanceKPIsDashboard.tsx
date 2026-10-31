import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { EmployeeKPI, Employee, KPIStatus, KPICategory } from '../../types/index.ts';
import { alerts } from '../../utils/alerts.ts';
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
} from 'lucide-react';

interface EmployeePerformanceKPIsDashboardProps {
  className?: string;
}

export const EmployeePerformanceKPIsDashboard: React.FC<EmployeePerformanceKPIsDashboardProps> = ({
  className = '',
}) => {
  const {
    language,
    employees,
    departments,
    positions,
    employeeKPIs,
    updateKPIProgress,
    updateKPISubGoal,
    currentUser,
  } = useApp();

  const isManagerOrAdmin =
    currentUser.role === 'SUPER_ADMIN' ||
    currentUser.role === 'HR_ADMIN' ||
    currentUser.role === 'DEPT_HEAD' ||
    currentUser.role === 'EXECUTIVE';

  // Filters
  const [selectedQuarter, setSelectedQuarter] = useState<string>('Q4 2026');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [attainmentFilter, setAttainmentFilter] = useState<'ALL' | 'EXCELLENT' | 'ON_TRACK' | 'AT_RISK'>('ALL');
  const [viewMode, setViewMode] = useState<'CARDS' | 'LEADERBOARD' | 'DEPARTMENT_BENCHMARK'>('CARDS');

  // Expanded employee cards state for itemized goals
  const [expandedEmployees, setExpandedEmployees] = useState<Record<string, boolean>>({});

  // Quick progress update modal state
  const [selectedKpiToUpdate, setSelectedKpiToUpdate] = useState<EmployeeKPI | null>(null);
  const [quickUpdateModalOpen, setQuickUpdateModalOpen] = useState(false);
  const [editCurrentValue, setEditCurrentValue] = useState<number>(0);
  const [editStatus, setEditStatus] = useState<KPIStatus>('IN_PROGRESS');
  const [editFeedback, setEditFeedback] = useState<string>('');

  const toggleEmployeeExpanded = (empId: string) => {
    setExpandedEmployees((prev) => ({
      ...prev,
      [empId]: !prev[empId],
    }));
  };

  const expandAll = () => {
    const allExpanded: Record<string, boolean> = {};
    employees.forEach((e) => {
      allExpanded[e.id] = true;
    });
    setExpandedEmployees(allExpanded);
  };

  const collapseAll = () => {
    setExpandedEmployees({});
  };

  // Helper: Get attainment percentage for a single KPI
  const getKpiAttainment = (kpi: EmployeeKPI): number => {
    if (kpi.targetValue <= 0) return 0;
    const rawPct = (kpi.currentValue / kpi.targetValue) * 100;
    return Math.min(100, Math.round(rawPct));
  };

  // Compute Per-Employee Goal Attainment Metrics for Selected Quarter
  const employeePerformanceList = useMemo(() => {
    return employees.map((emp) => {
      // Find KPIs for this employee matching quarter (or all if 'ALL')
      const empKPIs = employeeKPIs.filter((kpi) => {
        if (kpi.employeeId !== emp.id) return false;
        if (selectedQuarter === 'ALL') return true;
        return kpi.period.includes(selectedQuarter) || selectedQuarter.includes(kpi.period);
      });

      let totalWeight = 0;
      let weightedAttainmentSum = 0;
      let completedCount = 0;
      let onTrackCount = 0;
      let inProgressCount = 0;
      let atRiskCount = 0;

      empKPIs.forEach((kpi) => {
        const attainment = getKpiAttainment(kpi);
        const weight = kpi.weight > 0 ? kpi.weight : 20;
        totalWeight += weight;
        weightedAttainmentSum += attainment * weight;

        if (kpi.status === 'COMPLETED' || attainment >= 100) completedCount++;
        else if (kpi.status === 'ON_TRACK' || attainment >= 80) onTrackCount++;
        else if (kpi.status === 'IN_PROGRESS' || attainment >= 50) inProgressCount++;
        else atRiskCount++;
      });

      const overallAttainment =
        totalWeight > 0 ? Math.round(weightedAttainmentSum / totalWeight) : 0;

      // Status tier
      let tier: 'EXCELLENT' | 'ON_TRACK' | 'IN_PROGRESS' | 'AT_RISK' = 'IN_PROGRESS';
      if (overallAttainment >= 90) tier = 'EXCELLENT';
      else if (overallAttainment >= 75) tier = 'ON_TRACK';
      else if (overallAttainment >= 50) tier = 'IN_PROGRESS';
      else tier = 'AT_RISK';

      const dept = departments.find((d) => d.id === emp.departmentId);
      const pos = positions.find((p) => p.id === emp.positionId);

      return {
        employee: emp,
        department: dept,
        position: pos,
        kpis: empKPIs,
        totalObjectives: empKPIs.length,
        overallAttainment,
        tier,
        completedCount,
        onTrackCount,
        inProgressCount,
        atRiskCount,
      };
    });
  }, [employees, employeeKPIs, selectedQuarter, departments, positions]);

  // Filtered employee list
  const filteredPerformanceList = useMemo(() => {
    return employeePerformanceList.filter((item) => {
      // Department filter
      if (selectedDepartment !== 'ALL' && item.employee.departmentId !== selectedDepartment) {
        return false;
      }
      // Attainment filter
      if (attainmentFilter === 'EXCELLENT' && item.overallAttainment < 90) return false;
      if (attainmentFilter === 'ON_TRACK' && (item.overallAttainment < 75 || item.overallAttainment >= 90)) {
        return false;
      }
      if (attainmentFilter === 'AT_RISK' && item.overallAttainment >= 60) return false;

      // Search filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const codeMatch = item.employee.employeeCode.toLowerCase().includes(term);
        const nameEnMatch = `${item.employee.firstNameEn} ${item.employee.lastNameEn}`
          .toLowerCase()
          .includes(term);
        const nameLaoMatch = `${item.employee.firstNameLao} ${item.employee.lastNameLao}`
          .toLowerCase()
          .includes(term);
        const deptMatch = item.department
          ? item.department.nameEn.toLowerCase().includes(term) ||
            item.department.nameLao.toLowerCase().includes(term)
          : false;

        if (!codeMatch && !nameEnMatch && !nameLaoMatch && !deptMatch) return false;
      }

      return true;
    });
  }, [employeePerformanceList, selectedDepartment, attainmentFilter, searchTerm]);

  // High-level Company Overview Statistics for selected Quarter
  const companyOverview = useMemo(() => {
    const listWithGoals = employeePerformanceList.filter((item) => item.totalObjectives > 0);
    const totalStaffCount = listWithGoals.length;
    const avgAttainment =
      totalStaffCount > 0
        ? Math.round(
            listWithGoals.reduce((sum, item) => sum + item.overallAttainment, 0) / totalStaffCount
          )
        : 0;

    const totalObjectives = employeePerformanceList.reduce(
      (sum, item) => sum + item.totalObjectives,
      0
    );
    const excellentCount = employeePerformanceList.filter((item) => item.overallAttainment >= 90).length;
    const onTrackCount = employeePerformanceList.filter(
      (item) => item.overallAttainment >= 75 && item.overallAttainment < 90
    ).length;
    const atRiskCount = employeePerformanceList.filter(
      (item) => item.totalObjectives > 0 && item.overallAttainment < 60
    ).length;

    return {
      avgAttainment,
      totalObjectives,
      totalStaffCount,
      excellentCount,
      onTrackCount,
      atRiskCount,
    };
  }, [employeePerformanceList]);

  // Department Benchmark comparison data
  const departmentBenchmarks = useMemo(() => {
    return departments.map((dept) => {
      const deptEmployees = employeePerformanceList.filter(
        (item) => item.employee.departmentId === dept.id
      );
      const totalStaff = deptEmployees.length;
      const staffWithGoals = deptEmployees.filter((item) => item.totalObjectives > 0);
      const avgAttainment =
        staffWithGoals.length > 0
          ? Math.round(
              staffWithGoals.reduce((sum, item) => sum + item.overallAttainment, 0) /
                staffWithGoals.length
            )
          : 0;

      const totalDeptObjectives = deptEmployees.reduce(
        (sum, item) => sum + item.totalObjectives,
        0
      );

      return {
        department: dept,
        totalStaff,
        staffWithGoalsCount: staffWithGoals.length,
        avgAttainment,
        totalObjectives: totalDeptObjectives,
      };
    }).sort((a, b) => b.avgAttainment - a.avgAttainment);
  }, [departments, employeePerformanceList]);

  // Ranked leaderboard list (sorted by overallAttainment desc)
  const rankedLeaderboard = useMemo(() => {
    return [...employeePerformanceList]
      .filter((item) => item.totalObjectives > 0)
      .sort((a, b) => b.overallAttainment - a.overallAttainment);
  }, [employeePerformanceList]);

  // Progress Bar Color Helper
  const getProgressColorClasses = (pct: number) => {
    if (pct >= 90) {
      return {
        bar: 'bg-gradient-to-r from-emerald-500 to-teal-400',
        text: 'text-emerald-700 dark:text-emerald-400',
        badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
        border: 'border-emerald-200 dark:border-emerald-900/60',
        glow: 'shadow-emerald-500/20',
      };
    }
    if (pct >= 75) {
      return {
        bar: 'bg-gradient-to-r from-blue-600 to-cyan-400',
        text: 'text-blue-700 dark:text-blue-400',
        badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
        border: 'border-blue-200 dark:border-blue-900/60',
        glow: 'shadow-blue-500/20',
      };
    }
    if (pct >= 50) {
      return {
        bar: 'bg-gradient-to-r from-amber-500 to-yellow-400',
        text: 'text-amber-700 dark:text-amber-400',
        badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
        border: 'border-amber-200 dark:border-amber-900/60',
        glow: 'shadow-amber-500/20',
      };
    }
    return {
      bar: 'bg-gradient-to-r from-rose-500 to-red-400',
      text: 'text-rose-700 dark:text-rose-400',
      badge: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
      border: 'border-rose-200 dark:border-rose-900/60',
      glow: 'shadow-rose-500/20',
    };
  };

  // Quick update handler
  const handleOpenQuickUpdate = (kpi: EmployeeKPI) => {
    setSelectedKpiToUpdate(kpi);
    setEditCurrentValue(kpi.currentValue);
    setEditStatus(kpi.status);
    setEditFeedback(kpi.managerFeedback || '');
    setQuickUpdateModalOpen(true);
  };

  const handleSaveQuickUpdate = () => {
    if (!selectedKpiToUpdate) return;
    const newAttainment =
      selectedKpiToUpdate.targetValue > 0
        ? (editCurrentValue / selectedKpiToUpdate.targetValue) * 100
        : 0;

    let computedStatus = editStatus;
    if (newAttainment >= 100) computedStatus = 'COMPLETED';
    else if (newAttainment >= 80 && editStatus === 'IN_PROGRESS') computedStatus = 'ON_TRACK';
    else if (newAttainment < 50 && editStatus === 'ON_TRACK') computedStatus = 'AT_RISK';

    updateKPIProgress(
      selectedKpiToUpdate.id,
      editCurrentValue,
      computedStatus,
      editFeedback.trim() || undefined
    );

    setQuickUpdateModalOpen(false);
    alerts.success(
      language === 'lo' ? 'ອັບເດດຄວາມຄືບໜ້າ KPI ສຳເລັດ' : 'KPI Progress Updated',
      `${language === 'lo' ? 'ຜົນສຳເລັດໃໝ່' : 'New Attainment'}: ${Math.min(100, Math.round(newAttainment))}%`
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 1. Dashboard Header & Filter Ribbon */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 lg:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
                  {language === 'lo'
                    ? 'ແດຊບອດຜົນງານ KPI ປະຈຳໄຕມາດ (Quarterly Goal Attainment)'
                    : 'Performance KPIs Dashboard'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Progress Bar Indicators
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'lo'
                  ? 'ຕິດຕາມລະດັບຄວາມສຳເລັດຂອງເປົ້າໝາຍລາຍບຸກຄົນ ຜ່ານແຖບສະແດງຄວາມຄືບໜ້າແບບລະອຽດ'
                  : 'Track quarterly milestone attainment per employee using interactive progress bar indicators'}
              </p>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1.5 self-start md:self-auto bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700 text-xs">
            <button
              onClick={() => setViewMode('CARDS')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
                viewMode === 'CARDS'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{language === 'lo' ? 'ກາດລາຍບຸກຄົນ' : 'Employee Cards'}</span>
            </button>
            <button
              onClick={() => setViewMode('LEADERBOARD')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
                viewMode === 'LEADERBOARD'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>{language === 'lo' ? 'ຈັດອັນດັບ' : 'Leaderboard'}</span>
            </button>
            <button
              onClick={() => setViewMode('DEPARTMENT_BENCHMARK')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
                viewMode === 'DEPARTMENT_BENCHMARK'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>{language === 'lo' ? 'ທຽບຕາມພະແນກ' : 'Dept Benchmark'}</span>
            </button>
          </div>
        </div>

        {/* Filters Bar: Quarter, Dept, Search, Attainment Tier */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Quarter Select */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>{language === 'lo' ? 'ເລືອກໄຕມາດ (Quarter)' : 'Target Quarter'}</span>
            </label>
            <select
              value={selectedQuarter}
              onChange={(e) => setSelectedQuarter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Q4 2026">Q4 2026 (Oct - Dec 2026) • Current</option>
              <option value="Q3 2026">Q3 2026 (Jul - Sep 2026)</option>
              <option value="Q2 2026">Q2 2026 (Apr - Jun 2026)</option>
              <option value="Q1 2026">Q1 2026 (Jan - Mar 2026)</option>
              <option value="ALL">{language === 'lo' ? 'ທຸກໄຕມາດ (All Quarters 2026)' : 'All 2026 Quarters'}</option>
            </select>
          </div>

          {/* Department Select */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              <span>{language === 'lo' ? 'ພະແນກ (Department)' : 'Department'}</span>
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">{language === 'lo' ? 'ທຸກພະແນກ (All Departments)' : 'All Departments'}</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {language === 'lo' ? dept.nameLao : dept.nameEn}
                </option>
              ))}
            </select>
          </div>

          {/* Attainment Tier Select */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-blue-600" />
              <span>{language === 'lo' ? 'ລະດັບຄວາມສຳເລັດ' : 'Attainment Level'}</span>
            </label>
            <select
              value={attainmentFilter}
              onChange={(e) => setAttainmentFilter(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">{language === 'lo' ? 'ທຸກລະດັບ (All Tiers)' : 'All Attainment Levels'}</option>
              <option value="EXCELLENT">{language === 'lo' ? 'ດີເດັ່ນ (>= 90%)' : 'Excellent (>= 90%)'}</option>
              <option value="ON_TRACK">{language === 'lo' ? 'ຕາມແຜນ (75% - 89%)' : 'On Track (75% - 89%)'}</option>
              <option value="AT_RISK">{language === 'lo' ? 'ມີຄວາມສ່ຽງ / ຫຼຸດເປົ້າ (< 60%)' : 'At Risk / Below Target (< 60%)'}</option>
            </select>
          </div>

          {/* Search by Employee */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <Search className="w-3.5 h-3.5 text-blue-600" />
              <span>{language === 'lo' ? 'ຄົ້ນຫາພະນັກງານ' : 'Search Employee'}</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder={language === 'lo' ? 'ຊື່, ລະຫັດພະນັກງານ...' : 'Name or Employee Code...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Executive Attainment Summary Bar */}
      <div className="p-5 lg:p-6 rounded-3xl bg-gradient-to-br from-emerald-50/80 via-white to-blue-50/60 dark:from-slate-900 dark:via-slate-900/90 dark:to-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/40 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-800 dark:text-emerald-300">
                {language === 'lo' ? 'ພາບລວມຄວາມສຳເລັດຂອງອົງກອນ' : 'Company-wide Goal Attainment'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200/80 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200">
                {selectedQuarter}
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl lg:text-4xl font-black font-mono text-emerald-900 dark:text-emerald-100">
                {companyOverview.avgAttainment}%
              </span>
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                {language === 'lo' ? 'ຄ່າສະເລ່ຍທົ່ວທັງອົງກອນ' : 'Average Goal Attainment'}
              </span>
            </div>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="px-3 py-2 rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-slate-200/70 dark:border-slate-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">
                  {language === 'lo' ? 'ດີເດັ່ນ (>=90%)' : 'Top Achievers'}
                </span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {companyOverview.excellentCount} {language === 'lo' ? 'ທ່ານ' : 'staff'}
                </span>
              </div>
            </div>

            <div className="px-3 py-2 rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-slate-200/70 dark:border-slate-700 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">
                  {language === 'lo' ? 'ຕາມແຜນ (75-89%)' : 'On Track'}
                </span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {companyOverview.onTrackCount} {language === 'lo' ? 'ທ່ານ' : 'staff'}
                </span>
              </div>
            </div>

            <div className="px-3 py-2 rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-slate-200/70 dark:border-slate-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">
                  {language === 'lo' ? 'ຫຼຸດເປົ້າ (<60%)' : 'At Risk (<60%)'}
                </span>
                <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                  {companyOverview.atRiskCount} {language === 'lo' ? 'ທ່ານ' : 'staff'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Master Progress Bar Indicator with Milestones */}
        <div className="space-y-1.5 pt-1">
          <div className="relative w-full bg-slate-200 dark:bg-slate-800 h-4 rounded-full overflow-hidden shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-700 ${getProgressColorClasses(companyOverview.avgAttainment).bar}`}
              style={{ width: `${Math.min(100, companyOverview.avgAttainment)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span>0% Start</span>
            <span>25% Base</span>
            <span>50% Mid-Quarter</span>
            <span>75% Target Pace</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">100% Target Met</span>
          </div>
        </div>
      </div>

      {/* View Mode 1: Individual Employee Cards (Default & Primary View) */}
      {viewMode === 'CARDS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span>
                {language === 'lo' ? 'ສະແດງພະນັກງານ' : 'Showing'} <strong>{filteredPerformanceList.length}</strong> {language === 'lo' ? 'ທ່ານ' : 'employees'}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={expandAll}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-slate-600 dark:text-slate-300"
              >
                {language === 'lo' ? 'ເປີດລາຍລະອຽດທັງໝົດ' : 'Expand All Goals'}
              </button>
              <button
                onClick={collapseAll}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-slate-600 dark:text-slate-300"
              >
                {language === 'lo' ? 'ຫຍໍ້ທັງໝົດ' : 'Collapse All'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredPerformanceList.map((item) => {
              const { employee, department, position, kpis, overallAttainment, totalObjectives } = item;
              const colorInfo = getProgressColorClasses(overallAttainment);
              const isExpanded = !!expandedEmployees[employee.id];

              return (
                <div
                  key={employee.id}
                  className={`bg-white dark:bg-slate-900 rounded-3xl border ${colorInfo.border} p-5 lg:p-6 shadow-xs transition-all hover:shadow-md space-y-4`}
                >
                  {/* Card Top: Employee Profile & Main Attainment Progress Bar */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Employee Profile Header */}
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white font-bold text-base flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                        {employee.firstNameEn.slice(0, 1)}
                        {employee.lastNameEn.slice(0, 1)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                            {language === 'lo'
                              ? `${employee.firstNameLao} ${employee.lastNameLao}`
                              : `${employee.firstNameEn} ${employee.lastNameEn}`}
                          </h3>
                          <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                            {employee.employeeCode}
                          </span>
                          <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${colorInfo.badge}`}>
                            {overallAttainment >= 90
                              ? language === 'lo' ? 'ດີເດັ່ນ (Exceeded)' : 'Excellent'
                              : overallAttainment >= 75
                              ? language === 'lo' ? 'ຕາມແຜນ (On Track)' : 'On Track'
                              : overallAttainment >= 50
                              ? language === 'lo' ? 'ກຳລັງດຳເນີນ' : 'In Progress'
                              : language === 'lo' ? 'ມີຄວາມສ່ຽງ (At Risk)' : 'At Risk'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                          <span>{department ? (language === 'lo' ? department.nameLao : department.nameEn) : 'LHSE'}</span>
                          <span>•</span>
                          <span>{position ? (language === 'lo' ? position.titleLao : position.titleEn) : 'Staff'}</span>
                        </p>
                      </div>
                    </div>

                    {/* Overall Progress Bar Display Box */}
                    <div className="lg:w-96 flex flex-col justify-center space-y-1.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span>{language === 'lo' ? 'ຄວາມສຳເລັດລວມ' : 'Overall Attainment'}:</span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className={`font-mono text-base font-black ${colorInfo.text}`}>
                            {overallAttainment}%
                          </span>
                          <span className="text-[10px] text-slate-400">
                            ({kpis.length} {language === 'lo' ? 'ເປົ້າໝາຍ' : 'goals'})
                          </span>
                        </div>
                      </div>

                      {/* Prominent Per-Employee Progress Bar Indicator */}
                      <div className="relative w-full bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden shadow-inner">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${colorInfo.bar}`}
                          style={{ width: `${Math.min(100, overallAttainment)}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>{item.completedCount} completed</span>
                        <span>{item.onTrackCount} on track</span>
                        {item.atRiskCount > 0 && (
                          <span className="font-bold text-rose-500">{item.atRiskCount} at risk</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Toggle Sub-Goals Button */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <button
                      onClick={() => toggleEmployeeExpanded(employee.id)}
                      className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <span>
                        {isExpanded
                          ? language === 'lo'
                            ? 'ເຊື່ອງລາຍການເປົ້າໝາຍ'
                            : 'Hide Goal Breakdown'
                          : language === 'lo'
                          ? `ເບິ່ງລາຍການເປົ້າໝາຍທັງໝົດ (${kpis.length} ລາຍການ)`
                          : `View Goal Breakdown (${kpis.length} Objectives)`}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <div className="text-[11px] text-slate-400 flex items-center gap-3">
                      <span>{language === 'lo' ? 'ງວດ' : 'Period'}: <strong>{selectedQuarter}</strong></span>
                    </div>
                  </div>

                  {/* Itemized Goals Progress Bar Breakdown (Collapsible) */}
                  {isExpanded && (
                    <div className="pt-2 space-y-3">
                      {kpis.length === 0 ? (
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-center text-xs text-slate-400">
                          {language === 'lo'
                            ? 'ຍັງບໍ່ມີເປົ້າໝາຍ KPI ໃນໄຕມາດນີ້'
                            : 'No quarterly KPIs assigned to this employee for this period.'}
                        </div>
                      ) : (
                        kpis.map((kpi) => {
                          const kpiAttainment = getKpiAttainment(kpi);
                          const kpiColors = getProgressColorClasses(kpiAttainment);

                          return (
                            <div
                              key={kpi.id}
                              className="p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-3 transition-colors hover:border-slate-300 dark:hover:border-slate-700"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                                      {language === 'lo' && kpi.titleLao ? kpi.titleLao : kpi.title}
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                      {kpi.category}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      Weight: {kpi.weight}%
                                    </span>
                                  </div>
                                  {kpi.description && (
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                      {kpi.description}
                                    </p>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${kpiColors.badge}`}>
                                    {kpi.status}
                                  </span>
                                  {isManagerOrAdmin && (
                                    <button
                                      onClick={() => handleOpenQuickUpdate(kpi)}
                                      className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors"
                                      title={language === 'lo' ? 'ອັບເດດຄວາມຄືບໜ້າ' : 'Update Progress'}
                                    >
                                      <Sliders className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Progress Bar with Current / Target Value */}
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-slate-500 dark:text-slate-400">
                                    {language === 'lo' ? 'ຄວາມຄືບໜ້າຕົວຈິງ' : 'Attainment Target'}:{' '}
                                    <strong className="font-mono text-slate-800 dark:text-slate-200">
                                      {kpi.currentValue.toLocaleString()} / {kpi.targetValue.toLocaleString()} {kpi.unit}
                                    </strong>
                                  </span>
                                  <span className={`font-mono font-bold text-xs ${kpiColors.text}`}>
                                    {kpiAttainment}%
                                  </span>
                                </div>

                                {/* Progress Bar Indicator */}
                                <div className="relative w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${kpiColors.bar}`}
                                    style={{ width: `${Math.min(100, kpiAttainment)}%` }}
                                  />
                                </div>
                              </div>

                              {/* Sub-goals checklist if available */}
                              {kpi.subGoals && kpi.subGoals.length > 0 && (
                                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 space-y-1.5">
                                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    {language === 'lo' ? 'ເປົ້າໝາຍຍ່ອຍ / ບາດກ້າວສຳເລັດ (Milestones):' : 'Key Milestones:'}
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                                    {kpi.subGoals.map((sg) => (
                                      <div
                                        key={sg.id}
                                        onClick={() => {
                                          if (isManagerOrAdmin) {
                                            updateKPISubGoal(kpi.id, sg.id, !sg.completed);
                                          }
                                        }}
                                        className={`flex items-center gap-2 p-1.5 rounded-lg transition-colors ${
                                          isManagerOrAdmin ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700' : ''
                                        }`}
                                      >
                                        {sg.completed ? (
                                          <CheckSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                        ) : (
                                          <Square className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                        )}
                                        <span className={sg.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300'}>
                                          {language === 'lo' && sg.titleLao ? sg.titleLao : sg.title}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Due Date & Manager Feedback */}
                              <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-400 pt-1">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  <span>{language === 'lo' ? 'ກຳນົດສົ່ງ' : 'Due'}: {kpi.dueDate}</span>
                                </span>
                                {kpi.managerFeedback && (
                                  <span className="italic text-slate-500 dark:text-slate-400 max-w-md truncate">
                                    "{kpi.managerFeedback}"
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* View Mode 2: Leaderboard Ranking View */}
      {viewMode === 'LEADERBOARD' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 lg:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>{language === 'lo' ? 'ຕາຕະລາງຈັດອັນດັບຜົນສຳເລັດ KPI (Leaderboard)' : 'Goal Attainment Leaderboard'}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'lo' ? 'ຈັດລຽງຕາມອັດຕາຄວາມສຳເລັດຂອງເປົ້າໝາຍແຕ່ຫຼາຍຫາໜ້ອຍ' : 'Ranked by highest quarterly goal completion rate'}
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {rankedLeaderboard.map((item, index) => {
              const { employee, department, position, overallAttainment, totalObjectives } = item;
              const colorInfo = getProgressColorClasses(overallAttainment);

              let rankBadge = (
                <span className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 font-bold font-mono text-xs flex items-center justify-center text-slate-600 dark:text-slate-300">
                  #{index + 1}
                </span>
              );

              if (index === 0) {
                rankBadge = (
                  <span className="w-7 h-7 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold text-xs flex items-center justify-center shadow-xs">
                    🥇
                  </span>
                );
              } else if (index === 1) {
                rankBadge = (
                  <span className="w-7 h-7 rounded-full bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center shadow-xs">
                    🥈
                  </span>
                );
              } else if (index === 2) {
                rankBadge = (
                  <span className="w-7 h-7 rounded-full bg-amber-700/20 text-amber-900 dark:text-amber-400 font-bold text-xs flex items-center justify-center shadow-xs">
                    🥉
                  </span>
                );
              }

              return (
                <div key={employee.id} className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {rankBadge}
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <span>
                          {language === 'lo'
                            ? `${employee.firstNameLao} ${employee.lastNameLao}`
                            : `${employee.firstNameEn} ${employee.lastNameEn}`}
                        </span>
                        <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400 font-bold">
                          {employee.employeeCode}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {department ? (language === 'lo' ? department.nameLao : department.nameEn) : 'LHSE'} • {totalObjectives} goals
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Progress Bar Component */}
                  <div className="md:w-80 space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[10px] text-slate-400 font-medium">Attainment</span>
                      <span className={`font-mono font-black ${colorInfo.text}`}>{overallAttainment}%</span>
                    </div>
                    <div className="relative w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${colorInfo.bar}`}
                        style={{ width: `${Math.min(100, overallAttainment)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* View Mode 3: Department Benchmark View */}
      {viewMode === 'DEPARTMENT_BENCHMARK' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 lg:p-6 shadow-xs space-y-5">
          <div className="space-y-0.5">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              <span>{language === 'lo' ? 'ການປຽບທຽບຜົນງານຕາມສາຍງານພະແນກ (Department Benchmark)' : 'Department Attainment Benchmark'}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {language === 'lo' ? 'ຄ່າສະເລ່ຍຄວາມສຳເລັດຂອງເປົ້າໝາຍໃນແຕ່ລະພະແນກຂອງ LHSE' : 'Aggregated average quarterly goal completion across LHSE divisions'}
            </p>
          </div>

          <div className="space-y-4">
            {departmentBenchmarks.map((bench) => {
              const colors = getProgressColorClasses(bench.avgAttainment);
              return (
                <div
                  key={bench.department.id}
                  className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-2.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                        {language === 'lo' ? bench.department.nameLao : bench.department.nameEn}
                      </span>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {bench.department.headName && <span>{language === 'lo' ? 'ຫົວໜ້າ:' : 'Lead:'} {bench.department.headName} • </span>}
                        <span>{bench.totalStaff} {language === 'lo' ? 'ພະນັກງານ' : 'staff'} ({bench.totalObjectives} objectives)</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`font-mono text-base font-black ${colors.text}`}>
                        {bench.avgAttainment}%
                      </span>
                      <span className="block text-[10px] text-slate-400">Avg Score</span>
                    </div>
                  </div>

                  {/* Department Progress Bar Indicator */}
                  <div className="relative w-full bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden shadow-inner">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${colors.bar}`}
                      style={{ width: `${Math.min(100, bench.avgAttainment)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Progress Update Modal */}
      {quickUpdateModalOpen && selectedKpiToUpdate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-600" />
                <span>{language === 'lo' ? 'ອັບເດດຄວາມຄືບໜ້າ KPI' : 'Update Goal Attainment'}</span>
              </h4>
              <span className="text-[11px] font-mono text-blue-600 font-bold">
                {selectedKpiToUpdate.period}
              </span>
            </div>

            <div className="space-y-1">
              <p className="font-bold text-xs text-slate-800 dark:text-slate-200">
                {language === 'lo' && selectedKpiToUpdate.titleLao ? selectedKpiToUpdate.titleLao : selectedKpiToUpdate.title}
              </p>
              <p className="text-[11px] text-slate-500">
                Target: {selectedKpiToUpdate.targetValue} {selectedKpiToUpdate.unit}
              </p>
            </div>

            {/* Range Slider for Attainment */}
            <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-600 dark:text-slate-400">
                  {language === 'lo' ? 'ຄ່າປັດຈຸບັນ (Current Value):' : 'Current Progress:'}
                </span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  {editCurrentValue} {selectedKpiToUpdate.unit} ({Math.min(100, Math.round((editCurrentValue / selectedKpiToUpdate.targetValue) * 100))}%)
                </span>
              </div>

              <input
                type="range"
                min="0"
                max={selectedKpiToUpdate.targetValue}
                step={selectedKpiToUpdate.targetValue > 100 ? (selectedKpiToUpdate.targetValue > 1000000 ? 5000000 : 1) : 1}
                value={editCurrentValue}
                onChange={(e) => setEditCurrentValue(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />

              {/* Direct numeric input */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="number"
                  value={editCurrentValue}
                  onChange={(e) => setEditCurrentValue(Math.max(0, Number(e.target.value)))}
                  className="w-full px-2.5 py-1 text-right font-mono font-bold text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
                <span className="text-[11px] text-slate-400 font-mono shrink-0">
                  {selectedKpiToUpdate.unit}
                </span>
              </div>
            </div>

            {/* Status Select */}
            <div>
              <label className="block font-semibold mb-1 text-xs text-slate-700 dark:text-slate-300">
                {language === 'lo' ? 'ສະຖານະ' : 'Status'}
              </label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="IN_PROGRESS">IN_PROGRESS (ກຳລັງດຳເນີນງານ)</option>
                <option value="ON_TRACK">ON_TRACK (ຕາມແຜນ)</option>
                <option value="COMPLETED">COMPLETED (ສຳເລັດ 100%)</option>
                <option value="AT_RISK">AT_RISK (ມີຄວາມສ່ຽງ)</option>
              </select>
            </div>

            {/* Manager Coaching Feedback */}
            <div>
              <label className="block font-semibold mb-1 text-xs text-slate-700 dark:text-slate-300">
                {language === 'lo' ? 'ຄຳເຫັນຜູ້ຄຸ້ມຄອງ / Manager Feedback' : 'Manager Feedback'}
              </label>
              <textarea
                rows={2}
                value={editFeedback}
                onChange={(e) => setEditFeedback(e.target.value)}
                placeholder="e.g. Good progress on milestones, keep up pace..."
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setQuickUpdateModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400"
              >
                {language === 'lo' ? 'ຍົກເລີກ' : 'Cancel'}
              </button>
              <button
                onClick={handleSaveQuickUpdate}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs"
              >
                {language === 'lo' ? 'ບັນທຶກຄວາມຄືບໜ້າ' : 'Save Progress'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
