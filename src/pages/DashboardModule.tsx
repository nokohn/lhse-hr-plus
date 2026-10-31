import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { alerts } from '../utils/alerts.ts';
import {
  Users,
  Clock,
  CalendarCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Building2,
  Search,
  Filter,
  SlidersHorizontal,
  ChevronRight,
  Calendar,
  AlertCircle,
  FileText,
  UserCheck,
  Activity,
  Award,
  Cake,
  FileWarning,
  Wifi,
  Sparkles,
  PieChart,
  BarChart3,
  DollarSign,
  Compass,
  Check,
  X,
  Target,
  BrainCircuit,
  Briefcase,
  UserPlus,
  Plus,
} from 'lucide-react';
import { PerformanceTrackingSection } from '../components/dashboard/PerformanceTrackingSection.tsx';
import { DepartmentKPIChartSection } from '../components/dashboard/DepartmentKPIChartSection.tsx';
import { KPIProgressTrackerRecharts } from '../components/dashboard/KPIProgressTrackerRecharts.tsx';
import { TurnoverRiskInsightCard } from '../components/dashboard/TurnoverRiskInsightCard.tsx';
import { KPISummaryCard } from '../components/dashboard/KPISummaryCard.tsx';
import { ComplianceAuditStreamWidget } from '../components/dashboard/ComplianceAuditStreamWidget.tsx';

export const DashboardModule: React.FC = () => {
  const {
    t,
    language,
    employees,
    departments,
    branches,
    attendanceRecords,
    approvalRequests,
    leaveRequests,
    payrollPeriods,
    employeeKPIs,
    requisitions = [],
    setActiveModule,
    setActiveSubModule,
    processApproval,
  } = useApp();

  // Team status filters
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [statusTab, setStatusTab] = useState<'ALL' | 'PRESENT' | 'LATE' | 'ABSENT' | 'LEAVE' | 'HALF' | 'WFH' | 'ABNORMAL'>('ALL');

  const totalEmployees = employees.length || 10;
  const checkedInToday = attendanceRecords.filter((r) => r.date === new Date().toISOString().split('T')[0] && r.checkIn).length;
  const onLeaveToday = leaveRequests.filter((l) => l.status === 'APPROVED').length;
  const absentToday = Math.max(0, totalEmployees - checkedInToday - onLeaveToday);
  const pendingApprovals = approvalRequests.filter((a) => a.status === 'PENDING');
  const attendanceRate = totalEmployees > 0 ? Math.round((checkedInToday / totalEmployees) * 100) : 0;
  const lateToday = attendanceRecords.filter((r) => r.date === new Date().toISOString().split('T')[0] && r.status === 'LATE').length;

  // Active vacancies count from recruitment requisitions
  const activeRequisitions = useMemo(() => {
    return (requisitions || []).filter(
      (r) => r.status === 'OPEN' || r.status === 'IN_INTERVIEW'
    );
  }, [requisitions]);

  const activeVacanciesCount = useMemo(() => {
    if (activeRequisitions.length === 0) {
      return 3;
    }
    return activeRequisitions.reduce((sum, r) => sum + (r.vacanciesCount || 1), 0);
  }, [activeRequisitions]);

  // Filtered Team Members
  const filteredTeam = useMemo(() => {
    return employees.filter((emp) => {
      // 1. Search filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const match =
          emp.employeeCode.toLowerCase().includes(term) ||
          emp.firstNameLao.toLowerCase().includes(term) ||
          emp.lastNameLao.toLowerCase().includes(term) ||
          emp.firstNameEn.toLowerCase().includes(term) ||
          emp.lastNameEn.toLowerCase().includes(term);
        if (!match) return false;
      }
      // 2. Dept filter
      if (deptFilter !== 'ALL' && emp.departmentId !== deptFilter) {
        return false;
      }
      // 3. Status Tab filter
      if (statusTab === 'ABSENT') return true; // By default today everyone without record is absent
      if (statusTab === 'PRESENT' && checkedInToday === 0) return false;
      if (statusTab === 'LATE' && lateToday === 0) return false;
      if (statusTab === 'LEAVE' && onLeaveToday === 0) return false;
      return true;
    });
  }, [employees, searchTerm, deptFilter, statusTab, checkedInToday, lateToday, onLeaveToday]);

  const handleCustomizationClick = () => {
    alerts.info(
      language === 'lo' ? 'ປັບແຕ່ງແດຊບອດ' : 'Customize Dashboard',
      language === 'lo'
        ? 'ທ່ານສາມາດຈັດລຽງ widget ແລະ ເລືອກສະແດງ KPI ຕາມຄວາມຕ້ອງການຂອງອົງກອນ'
        : 'You can rearrange widgets and toggle metrics based on your preferences.'
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 rounded-3xl p-6 lg:p-7 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {language === 'lo' ? 'ແດດຊບອດ' : 'Dashboard'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {language === 'lo'
              ? 'ຍິນດີຕ້ອນຮັບກັບຄືນ! ນີ້ແມ່ນສິ່ງທີ່ເກີດຂຶ້ນກັບອົງກອນຂອງທ່ານໃນມື້ນີ້'
              : "Welcome back! Here's what's happening in your organization today."}
          </p>
        </div>
        <button
          onClick={handleCustomizationClick}
          className="self-start sm:self-center inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all shadow-xs"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>{language === 'lo' ? 'ປັບແຕ່ງ' : 'Customize'}</span>
        </button>
      </div>

      {/* 1.1 Executive Summary Stats Row with Quick-Action Icons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5">
        {/* Card 1: Total Employees */}
        <div
          onClick={() => { setActiveModule('module-2'); setActiveSubModule('directory'); }}
          className="group relative bg-white dark:bg-slate-900 rounded-3xl p-5 lg:p-6 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-blue-400 dark:hover:border-blue-600 transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between"
        >
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600" />
          <div>
            <div className="flex items-start justify-between gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              {/* Quick Actions Toolbar */}
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveModule('module-2');
                    setActiveSubModule('add-employee');
                  }}
                  className="p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-950 text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors cursor-pointer"
                  title={language === 'lo' ? 'ເພີ່ມພະນັກງານໃໝ່' : 'Add Employee'}
                >
                  <UserPlus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveModule('module-2');
                    setActiveSubModule('directory');
                  }}
                  className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                  title={language === 'lo' ? 'ເບິ່ງລາຍຊື່ພະນັກງານ' : 'Staff Directory'}
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="mt-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                {language === 'lo' ? 'ພະນັກງານທັງໝົດ' : 'Total Employees'}
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-slate-100 font-mono tracking-tight">
                  {totalEmployees}
                </span>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-900/60">
                  100% LHSE
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                {language === 'lo'
                  ? `ບັນຈຸໃນ ${departments.length} ພະແນກການ ແລະ ${branches.length} ສາຂາ`
                  : `Active across ${departments.length} departments & ${branches.length} branches`}
              </p>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">
              {language === 'lo' ? 'ອັດຕາສ່ວນເພດ (ຊາຍ/ຍິງ):' : 'Gender Ratio:'}
            </span>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
              {employees.filter(e => e.gender === 'MALE').length}M / {employees.filter(e => e.gender === 'FEMALE').length}F
            </span>
          </div>
        </div>

        {/* Card 2: Active Vacancies */}
        <div
          onClick={() => { setActiveModule('module-11'); setActiveSubModule('requisitions'); }}
          className="group relative bg-white dark:bg-slate-900 rounded-3xl p-5 lg:p-6 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-emerald-400 dark:hover:border-emerald-600 transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between"
        >
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500" />
          <div>
            <div className="flex items-start justify-between gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-110 transition-transform">
                <Briefcase className="w-6 h-6" />
              </div>
              {/* Quick Actions Toolbar */}
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveModule('module-11');
                    setActiveSubModule('requisitions');
                  }}
                  className="p-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-950 text-slate-600 dark:text-slate-300 hover:text-emerald-600 transition-colors cursor-pointer"
                  title={language === 'lo' ? 'ສ້າງໃບສະເໜີຮັບສະໝັກໃໝ່' : 'New Requisition'}
                >
                  <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveModule('module-11');
                    setActiveSubModule('candidates');
                  }}
                  className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                  title={language === 'lo' ? 'ທໍ່ສົ່ງຜູ້ສະໝັກງານ' : 'Candidate Pipeline'}
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="mt-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                {language === 'lo' ? 'ຕຳແໜ່ງຫວ່າງທີ່ເປີດຮັບ' : 'Active Vacancies'}
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-slate-100 font-mono tracking-tight">
                  {activeVacanciesCount}
                </span>
                <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-md border border-teal-200/60 dark:border-teal-900/60">
                  {activeRequisitions.length} {language === 'lo' ? 'ໃບປະກາດ' : 'Requisitions'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                {language === 'lo'
                  ? 'ກຳລັງເປີດຮັບສະໝັກ ແລະ ສຳພາດຮອບຄັດເລືອກ'
                  : 'Recruitment & screening pipelines currently open'}
              </p>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">
              {language === 'lo' ? 'ສະຖານະການຮັບສະໝັກ:' : 'Pipeline Status:'}
            </span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {language === 'lo' ? 'ກຳລັງດຳເນີນການ' : 'Hiring Active'}
            </span>
          </div>
        </div>

        {/* Card 3: Pending Approvals */}
        <div
          onClick={() => { setActiveModule('module-12'); setActiveSubModule('pending'); }}
          className="group relative bg-white dark:bg-slate-900 rounded-3xl p-5 lg:p-6 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-amber-400 dark:hover:border-amber-600 transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between"
        >
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 to-orange-500" />
          <div>
            <div className="flex items-start justify-between gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6" />
              </div>
              {/* Quick Actions Toolbar */}
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveModule('module-12');
                    setActiveSubModule('pending');
                  }}
                  className="p-1.5 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-950 text-slate-600 dark:text-slate-300 hover:text-amber-600 transition-colors cursor-pointer"
                  title={language === 'lo' ? 'ກວດສອບ & ອະນຸມັດ' : 'Review & Approve'}
                >
                  <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveModule('module-12');
                    setActiveSubModule('history');
                  }}
                  className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                  title={language === 'lo' ? 'ປະຫວັດການອະນຸມັດ' : 'Approval History'}
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="mt-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                {language === 'lo' ? 'ລາຍການລໍຖ້າການອະນຸມັດ' : 'Pending Approvals'}
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-slate-100 font-mono tracking-tight">
                  {pendingApprovals.length}
                </span>
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-200/60 dark:border-amber-900/60">
                  {pendingApprovals.length > 0 ? (language === 'lo' ? 'ຕ້ອງແກ້ໄຂດ່ວນ' : 'Action Required') : (language === 'lo' ? 'ຮຽບຮ້ອຍ' : 'All Clear')}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                {language === 'lo'
                  ? 'ຄຳຮ້ອງລາພັກ, ແກ້ໄຂໂມງເຂົ້າການ ແລະ ໃບເບີກຈ່າຍ'
                  : 'Leave requests, attendance corrections & expenses'}
              </p>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">
              {language === 'lo' ? 'ການດຳເນີນການ:' : 'Workflow:'}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveModule('module-12');
                setActiveSubModule('pending');
              }}
              className="font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{language === 'lo' ? 'ຈັດການດຽວນີ້' : 'Process Now'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Navigation Anchor Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 font-bold uppercase text-[10px] shrink-0">
          {language === 'lo' ? 'ໄປທີ່:' : 'Jump to:'}
        </span>
        <button
          onClick={() => document.getElementById('organizational-kpi-summary-card')?.scrollIntoView({ behavior: 'smooth' })}
          className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-bold transition-all shadow-2xs whitespace-nowrap cursor-pointer flex items-center gap-1.5 hover:bg-blue-100"
        >
          <Target className="w-3.5 h-3.5 text-blue-600" />
          <span>{language === 'lo' ? '🎯 ສະຫຼຸບ KPI ອົງກອນ' : '🎯 KPI Overview'}</span>
        </button>
        <button
          onClick={() => document.getElementById('performance-kpi-module')?.scrollIntoView({ behavior: 'smooth' })}
          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold transition-all shadow-2xs whitespace-nowrap cursor-pointer flex items-center gap-1.5 hover:bg-slate-200"
        >
          <Award className="w-3.5 h-3.5 text-slate-600" />
          <span>{language === 'lo' ? '📋 ຕາຕະລາງ KPI' : '📋 KPI Details'}</span>
        </button>
        <button
          onClick={() => document.getElementById('recharts-kpi-progress-tracker')?.scrollIntoView({ behavior: 'smooth' })}
          className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-bold transition-all shadow-2xs whitespace-nowrap cursor-pointer flex items-center gap-1.5 hover:bg-purple-100"
        >
          <TrendingUp className="w-3.5 h-3.5 text-purple-600" />
          <span>{language === 'lo' ? '📈 ຕົວຕິດຕາມເປົ້າໝາຍ (Recharts)' : '📈 Goals Tracker'}</span>
        </button>
        <button
          onClick={() => document.getElementById('department-kpi-analytics')?.scrollIntoView({ behavior: 'smooth' })}
          className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold transition-all shadow-2xs whitespace-nowrap cursor-pointer flex items-center gap-1.5 hover:bg-emerald-100"
        >
          <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
          <span>{language === 'lo' ? '📊 ວິເຄາະຕາມພະແນກ (Recharts)' : '📊 Dept Analytics'}</span>
        </button>
        <button
          onClick={() => document.getElementById('turnover-risk-section')?.scrollIntoView({ behavior: 'smooth' })}
          className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 font-bold transition-all shadow-2xs whitespace-nowrap cursor-pointer flex items-center gap-1.5 hover:bg-rose-100"
        >
          <BrainCircuit className="w-3.5 h-3.5 text-rose-600" />
          <span>{language === 'lo' ? '🧠 ຄວາມສ່ຽງລາອອກ (ML Risk)' : '🧠 Turnover Risk'}</span>
        </button>
        <button
          onClick={() => document.getElementById('team-status-section')?.scrollIntoView({ behavior: 'smooth' })}
          className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-blue-600 font-bold transition-all shadow-2xs whitespace-nowrap cursor-pointer flex items-center gap-1.5"
        >
          <Users className="w-3.5 h-3.5 text-blue-600" />
          <span>{language === 'lo' ? '👥 ສະຖານະທີມງານ' : '👥 Team Status'}</span>
        </button>
      </div>

      {/* 2. Top Key Metric Cards (LHSE 7 Metrics Grid) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* Metric 1: Total Employees */}
        <div
          onClick={() => { setActiveModule('module-2'); setActiveSubModule('directory'); }}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-400 cursor-pointer transition-all flex flex-col justify-between"
        >
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            {language === 'lo' ? 'ພະນັກງານທັງໝົດ' : 'Total Employees'}
          </span>
          <div className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-slate-100 font-mono my-1">
            {totalEmployees}
          </div>
          <span className="text-[10px] text-slate-400">
            {language === 'lo' ? '+0 ເດືອນນີ້' : '+0 this month'}
          </span>
        </div>

        {/* Metric 2: Checked In Today */}
        <div
          onClick={() => { setActiveModule('module-4'); setActiveSubModule('daily-attendance'); }}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-400 cursor-pointer transition-all flex flex-col justify-between"
        >
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
            {language === 'lo' ? 'ເຊັກອິນມື້ນີ້' : 'Checked In'}
          </span>
          <div className="text-2xl lg:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono my-1">
            {checkedInToday}
          </div>
          <span className="text-[10px] text-slate-400">
            {language === 'lo' ? '0% ຂອງພະນັກງານທັງໝົດ' : '0% of total staff'}
          </span>
        </div>

        {/* Metric 3: On Leave Today */}
        <div
          onClick={() => { setActiveModule('module-6'); setActiveSubModule('requests'); }}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-400 cursor-pointer transition-all flex flex-col justify-between"
        >
          <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
            {language === 'lo' ? 'ລາມື້ນີ້' : 'On Leave'}
          </span>
          <div className="text-2xl lg:text-3xl font-black text-blue-600 dark:text-blue-400 font-mono my-1">
            {onLeaveToday}
          </div>
          <span className="text-[10px] text-slate-400">
            {language === 'lo' ? 'ພັກປະຈຳປີ / ເຈັບ' : 'Annual / Sick'}
          </span>
        </div>

        {/* Metric 4: Absent Today */}
        <div
          onClick={() => { setActiveModule('module-4'); setActiveSubModule('daily-attendance'); }}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-rose-400 cursor-pointer transition-all flex flex-col justify-between"
        >
          <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">
            {language === 'lo' ? 'ຂາດວຽກມື້ນີ້' : 'Absent Today'}
          </span>
          <div className="text-2xl lg:text-3xl font-black text-rose-600 dark:text-rose-400 font-mono my-1">
            {absentToday}
          </div>
          <span className="text-[10px] text-slate-400">
            {language === 'lo' ? 'ຂາດວຽກໂດຍບໍ່ມີເຫດຜົນ' : 'Unexcused absence'}
          </span>
        </div>

        {/* Metric 5: Pending Approvals (Strict NON-OT compliance!) */}
        <div
          onClick={() => { setActiveModule('module-12'); setActiveSubModule('pending'); }}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-amber-400 cursor-pointer transition-all flex flex-col justify-between"
        >
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">
            {language === 'lo' ? 'ລໍຖ້າການອະນຸມັດ' : 'Approvals'}
          </span>
          <div className="text-2xl lg:text-3xl font-black text-amber-600 dark:text-amber-400 font-mono my-1">
            {pendingApprovals.length}
          </div>
          <span className="text-[10px] text-slate-400">
            {language === 'lo' ? '1 ລາ · 0 ເບີກຈ່າຍ' : '1 Leave · 0 Claim'}
          </span>
        </div>

        {/* Metric 6: Attendance Rate */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
            {language === 'lo' ? 'ອັດຕາການເຂົ້າວຽກ' : 'Attendance Rate'}
          </span>
          <div className="text-2xl lg:text-3xl font-black text-indigo-600 dark:text-indigo-400 font-mono my-1">
            {attendanceRate}%
          </div>
          <span className="text-[10px] text-slate-400">
            {language === 'lo' ? 'ເດືອນຕຸລາ 2026' : 'October 2026'}
          </span>
        </div>

        {/* Metric 7: Late Today */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between col-span-2 md:col-span-1">
          <span className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">
            {language === 'lo' ? 'ມາຊ້າ' : 'Late Today'}
          </span>
          <div className="text-2xl lg:text-3xl font-black text-orange-600 dark:text-orange-400 font-mono my-1">
            {lateToday}
          </div>
          <span className="text-[10px] text-slate-400">
            {language === 'lo' ? 'ມື້ນີ້' : 'Today'}
          </span>
        </div>
      </div>

      {/* 3. Abnormal Attendance — Last 7 Days (LHSE Section) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 flex items-center justify-center font-bold">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>{language === 'lo' ? 'ການລົງເວລາຜິດປົກກະຕິ — 7 ມື້ຫຼ້າສຸດ' : 'Abnormal Attendance — Last 7 Days'}</span>
                <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[11px] font-bold font-mono flex items-center justify-center">
                  2
                </span>
              </h3>
            </div>
          </div>
          <span className="text-[11px] text-slate-400">
            {language === 'lo' ? 'ກວດພົບການລົງເວລານອກພື້ນທີ່ ຫຼື ຊ້າເກີນກຳນົດ' : 'Out of Geofence & Severe Late Log'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Abnormal Item 1 */}
          <div className="p-4 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-xs font-mono shrink-0">
                {employees[1]?.employeeCode ? employees[1].employeeCode.slice(-3) : '002'}
              </div>
              <div>
                <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
                  {employees[1]?.employeeCode || 'LHSE-002'} {employees[1] ? `${employees[1].firstNameEn} ${employees[1].lastNameEn}` : 'Khamphaeng Vongdala'}
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400">
                  {employees[1] ? `${employees[1].firstNameLao} ${employees[1].lastNameLao}` : 'ທ່ານ ຄຳແພງ ວົງດາລາ'}
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">20/10/2026</div>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 dark:bg-rose-900/80 dark:text-rose-200 text-[11px] font-bold">
                {language === 'lo' ? 'ຢູ່ນອກພື້ນທີ່ເຮັດວຽກ · 3445m' : 'Out of Geofence · 3445m'}
              </span>
            </div>
          </div>

          {/* Abnormal Item 2 */}
          <div className="p-4 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-xs font-mono shrink-0">
                {employees[6]?.employeeCode ? employees[6].employeeCode.slice(-3) : '007'}
              </div>
              <div>
                <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
                  {employees[6]?.employeeCode || 'LHSE-007'} {employees[6] ? `${employees[6].firstNameEn} ${employees[6].lastNameEn}` : 'Saysana Xayavong'}
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400">
                  {employees[6] ? `${employees[6].firstNameLao} ${employees[6].lastNameLao}` : 'ທ່ານ ໄຊຊະນະ ໄຊຍະວົງ'}
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">20/10/2026</div>
              </div>
            </div>
            <div className="text-right space-y-1">
              <span className="inline-block px-2.5 py-0.5 rounded-lg bg-rose-100 text-rose-800 dark:bg-rose-900/80 dark:text-rose-200 text-[10px] font-bold">
                {language === 'lo' ? 'ຢູ່ນອກພື້ນທີ່ · 3452m' : 'Out of Geofence · 3452m'}
              </span>
              <span className="block px-2.5 py-0.5 rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-900/80 dark:text-amber-200 text-[10px] font-bold">
                {language === 'lo' ? 'ມາຊ້າ · 480m' : 'Late · 480m'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Team Attendance Status Today (ສະຖານະທີມ) */}
      <div id="team-status-section" className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              {language === 'lo' ? 'ສະຖານະທີມ — 22 October 2026' : 'Team Attendance Status — 22 October 2026'}
            </h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              {language === 'lo' ? 'ອັບເດດ 15:31' : 'Updated 15:31 (Live Synchronization)'}
            </p>
          </div>
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-3 py-1 rounded-xl">
            {language === 'lo' ? `ທັງໝົດ (${employees.length})` : `All Members (${employees.length})`}
          </span>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={language === 'lo' ? 'ຄົ້ນຫາ ລະຫັດ / ຊື່ / ຊື່ຫຼິ້ນ' : 'Search code, name, alias...'}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-500 outline-hidden"
            />
          </div>

          {/* Branch */}
          <select className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium outline-hidden">
            <option value="ALL">{language === 'lo' ? 'ທຸກສາຂາ' : 'All Branches'}</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{language === 'lo' ? b.nameLao : b.nameEn}</option>
            ))}
          </select>

          {/* Department */}
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium outline-hidden"
          >
            <option value="ALL">{language === 'lo' ? 'ທຸກພະແນກ' : 'All Departments'}</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{language === 'lo' ? d.nameLao : d.nameEn}</option>
            ))}
          </select>

          {/* Position */}
          <select className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium outline-hidden">
            <option value="ALL">{language === 'lo' ? 'ທຸກຕຳແໜ່ງ' : 'All Positions'}</option>
            <option value="EXEC">ຄະນະຜູ້ບໍລິຫານ</option>
            <option value="MGR">ຜູ້ຈັດການ / ຫົວໜ້າ</option>
            <option value="OFFICER">ວິຊາການ / ພະນັກງານ</option>
          </select>
        </div>

        {/* Status Count Pills / Quick Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setStatusTab('ALL')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
              statusTab === 'ALL' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            {language === 'lo' ? 'ທຸກຄົນ' : 'All'} ({totalEmployees})
          </button>
          <button
            onClick={() => setStatusTab('PRESENT')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
              statusTab === 'PRESENT' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
            }`}
          >
            {language === 'lo' ? 'ມາແລ້ວ' : 'Present'} {checkedInToday}
          </button>
          <button
            onClick={() => setStatusTab('LATE')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
              statusTab === 'LATE' ? 'bg-amber-600 text-white' : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
            }`}
          >
            {language === 'lo' ? 'ຊ້າ' : 'Late'} {lateToday}
          </button>
          <button
            onClick={() => setStatusTab('ABSENT')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
              statusTab === 'ABSENT' ? 'bg-rose-600 text-white' : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
            }`}
          >
            {language === 'lo' ? 'ຂາດ' : 'Absent'} {absentToday}
          </button>
          <button
            onClick={() => setStatusTab('LEAVE')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
              statusTab === 'LEAVE' ? 'bg-blue-600 text-white' : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
            }`}
          >
            {language === 'lo' ? 'ລາ' : 'Leave'} {onLeaveToday}
          </button>
          <button
            onClick={() => setStatusTab('HALF')}
            className="px-3 py-1.5 rounded-xl font-medium whitespace-nowrap bg-slate-100 dark:bg-slate-800 text-slate-500"
          >
            {language === 'lo' ? 'ເຄິ່ງວັນ' : 'Half Day'} 0
          </button>
          <button
            onClick={() => setStatusTab('WFH')}
            className="px-3 py-1.5 rounded-xl font-medium whitespace-nowrap bg-slate-100 dark:bg-slate-800 text-slate-500"
          >
            WFH 0
          </button>
          <button
            onClick={() => setStatusTab('ABNORMAL')}
            className="px-3 py-1.5 rounded-xl font-bold whitespace-nowrap bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900"
          >
            {language === 'lo' ? 'ສະເພາະຜິດປົກກະຕິ' : 'Abnormal'} 2
          </button>
        </div>

        {/* Member Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {filteredTeam.map((emp) => {
            const dept = departments.find((d) => d.id === emp.departmentId);
            const empKPIs = employeeKPIs.filter((k) => k.employeeId === emp.id);
            const kpiScore = empKPIs.length > 0
              ? Math.round(empKPIs.reduce((sum, k) => sum + (k.targetValue > 0 ? (k.currentValue / k.targetValue) * 100 : 0), 0) / empKPIs.length)
              : 0;

            return (
              <div
                key={emp.id}
                className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 transition-all space-y-2 flex flex-col justify-between"
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono font-bold flex items-center justify-center text-xs shrink-0">
                    DS
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                      {emp.firstNameLao} {emp.lastNameLao}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono truncate">
                      {emp.employeeCode}
                    </div>
                    <div className="text-[10px] text-blue-600 dark:text-blue-400 truncate mt-0.5">
                      {dept?.nameLao}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 space-y-1.5 text-[10px]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Status</span>
                    <span className="px-2 py-0.5 rounded-md font-bold bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                      {language === 'lo' ? 'ຍັງບໍ່ບັນທຶກ' : 'Not Clocked In'}
                    </span>
                  </div>

                  <button
                    onClick={() => document.getElementById('performance-kpi-module')?.scrollIntoView({ behavior: 'smooth' })}
                    className="w-full flex items-center justify-between p-1.5 rounded-lg bg-blue-50/70 hover:bg-blue-100/80 dark:bg-blue-950/40 dark:hover:bg-blue-950/70 text-blue-700 dark:text-blue-300 transition-colors font-medium cursor-pointer"
                    title={language === 'lo' ? 'ເບິ່ງລາຍລະອຽດ KPI ຂອງພະນັກງານ' : 'View Employee KPIs'}
                  >
                    <span className="flex items-center gap-1 font-mono font-bold text-[9px]">
                      <Target className="w-3 h-3 text-blue-600" />
                      <span>{empKPIs.length} KPIs</span>
                    </span>
                    <span className={`px-1.5 py-0.2 rounded font-mono font-bold text-[10px] ${
                      kpiScore >= 90 ? 'text-emerald-700 dark:text-emerald-300' : kpiScore >= 75 ? 'text-blue-700 dark:text-blue-300' : 'text-amber-700 dark:text-amber-300'
                    }`}>
                      {kpiScore}%
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Middle Grid: Pending Approvals & Headcount Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approvals Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-500" />
              <span>{language === 'lo' ? 'ລໍຖ້າການອະນຸມັດ' : 'Pending Approvals'}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                1
              </span>
            </h3>
            <button
              onClick={() => { setActiveModule('module-12'); setActiveSubModule('pending'); }}
              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
            >
              <span>{language === 'lo' ? 'ເບິ່ງທັງໝົດ' : 'View All'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Submitter item from LHSE central workflow */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-mono font-bold flex items-center justify-center text-xs shrink-0">
                {employees[4]?.employeeCode ? employees[4].employeeCode.slice(-3) : '005'}
              </div>
              <div>
                <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
                  {employees[4] ? `${employees[4].firstNameLao} ${employees[4].lastNameLao}` : 'ທ່ານ ອານຸສອນ ອິນທະວົງ'}
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400">
                  {employees[4] ? `${employees[4].employeeCode} • ${employees[4].firstNameEn} ${employees[4].lastNameEn}` : 'LHSE-005 • Mr. Anousone Inthavong'}
                </div>
                <div className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                  {language === 'lo' ? 'ການລາ (Annual Leave · 1 Day)' : 'Leave Request · 1 Day'}
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">Period: 23/10/2026</div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={() => {
                  alerts.success(language === 'lo' ? 'ອະນຸມັດຄຳຮ້ອງສຳເລັດ' : 'Leave Approved');
                }}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-2xs transition-colors flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{language === 'lo' ? 'ອະນຸມັດ' : 'Approve'}</span>
              </button>
              <button
                onClick={() => {
                  alerts.info(language === 'lo' ? 'ປະຕິເສດຄຳຮ້ອງແລ້ວ' : 'Leave Rejected');
                }}
                className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-bold text-xs border border-rose-200 dark:border-rose-900 transition-colors flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>{language === 'lo' ? 'ປະຕິເສດ' : 'Reject'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Headcount by Department (ພະແນກແຍກຕາມພະແນກ) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>{language === 'lo' ? 'ພະນັກງານແຍກຕາມພະແນກ' : 'Headcount by Department'}</span>
            </h3>
            <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
              10 {language === 'lo' ? 'ພະນັກງານທັງໝົດ' : 'Total Staff'}
            </span>
          </div>

          <div className="space-y-2.5">
            {departments.map((dept) => {
              const count = employees.filter((e) => e.departmentId === dept.id).length;
              const pct = Math.round((count / Math.max(1, totalEmployees)) * 100);
              return (
                <div key={dept.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
                      {dept.nameLao}
                    </span>
                    <span className="font-mono text-slate-500 font-bold">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 6. Recent Activity Feed (ກິດຈະກໍາຫຼ້າສຸດ) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <span>{language === 'lo' ? 'ກິດຈະກໍາຫຼ້າສຸດ' : 'Recent Activity Feed'}</span>
          </h3>
          <span className="text-xs font-bold text-blue-600 hover:underline cursor-pointer">
            {language === 'lo' ? 'ເບິ່ງທັງໝົດ' : 'View All'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(employees.length >= 3 ? employees.slice(-3).reverse() : employees).map((emp) => {
            const deptObj = departments.find((d) => d.id === emp.departmentId);
            const deptLabel = deptObj ? (language === 'lo' ? deptObj.nameLao : deptObj.nameEn) : emp.departmentId;
            return (
              <div key={emp.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold text-xs flex items-center justify-center shrink-0">
                  {emp.employeeCode ? emp.employeeCode.slice(-3) : 'EMP'}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase">
                    {language === 'lo' ? 'ພະນັກງານ' : 'LHSE Staff'}
                  </span>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-0.5 truncate">
                    {language === 'lo' ? `${emp.firstNameLao} ${emp.lastNameLao}` : `${emp.firstNameEn} ${emp.lastNameEn}`}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {language === 'lo' ? `ພະແນກ: ${deptLabel}` : `Dept: ${deptLabel}`}
                  </p>
                  <span className="text-[10px] text-slate-400 font-mono block mt-1">
                    {emp.employeeCode} • {emp.joiningDate || 'Active'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6.3. High-Level Organizational KPI Summary Card */}
      <KPISummaryCard />

      {/* 6.4. Active Employee KPI Progress Tracker (Recharts Visual Tracker) */}
      <KPIProgressTrackerRecharts />

      {/* 6.5. Department KPI Performance Analytics (Recharts Visualization) */}
      <DepartmentKPIChartSection />

      {/* 6.6. Employee Performance & KPI Tracking Module */}
      <PerformanceTrackingSection />

      {/* 7. Monthly Payroll & HR Analytics Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              {language === 'lo' ? 'ສະຫຼຸບເງິນເດືອນປະຈໍາເດືອນ & HR Analytics' : 'Monthly Payroll Summary & HR Analytics'}
            </h3>
            <p className="text-xs text-slate-500">October 2026 • LHSE Enterprise Analytics</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-3 py-1 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold">
              {language === 'lo' ? 'ແນວໂນ້ມ 6 ເດືອນ' : '6-Month Trend'}
            </span>
          </div>
        </div>

        {/* 6-Month Trend Indicator (May 26 - Oct 26) */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
            <span>{language === 'lo' ? 'ແນວໂນ້ມການມາຊ້າ ແລະ ການລາພັກ (ຄົນ)' : 'Late Arrival & Leave Trend (Persons)'}</span>
            <span className="text-slate-400 font-mono">May 26 → Oct 26</span>
          </div>
          <div className="grid grid-cols-6 gap-2 text-center text-xs font-mono">
            {['May 26', 'Jun 26', 'Jul 26', 'Aug 26', 'Sep 26', 'Oct 26'].map((m, idx) => (
              <div key={m} className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block">{m}</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{idx === 5 ? '1' : '0'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top 5 Late & Department Summary Table */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top 5 Late */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase text-slate-700 dark:text-slate-300">
              {language === 'lo' ? 'ພະນັກງານມາຊ້າ 5 ອັນດັບ' : 'Top 5 Late Employees'}
            </h4>
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] text-slate-500 uppercase font-bold">
                  <tr>
                    <th className="p-2.5 pl-3">#</th>
                    <th className="p-2.5">{language === 'lo' ? 'ພະນັກງານ' : 'Employee'}</th>
                    <th className="p-2.5">{language === 'lo' ? 'ພະແນກ' : 'Department'}</th>
                    <th className="p-2.5">{language === 'lo' ? 'ມາຊ້າ' : 'Count'}</th>
                    <th className="p-2.5 pr-3">{language === 'lo' ? 'ເວລາລວມ' : 'Duration'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr>
                    <td className="p-2.5 pl-3 font-mono">1</td>
                    <td className="p-2.5 font-bold">
                      {employees[1] ? (language === 'lo' ? `${employees[1].employeeCode} ${employees[1].firstNameLao} ${employees[1].lastNameLao}` : `${employees[1].employeeCode} ${employees[1].firstNameEn} ${employees[1].lastNameEn}`) : 'LHSE-002 ທ່ານ ຄຳແພງ ວົງດາລາ'}
                    </td>
                    <td className="p-2.5 text-slate-500">
                      {departments.find((d) => d.id === employees[1]?.departmentId)
                        ? (language === 'lo' ? departments.find((d) => d.id === employees[1]?.departmentId)?.nameLao : departments.find((d) => d.id === employees[1]?.departmentId)?.nameEn)
                        : (language === 'lo' ? 'ຄະນະຜູ້ບໍລິຫານ' : 'Executive Board')}
                    </td>
                    <td className="p-2.5 font-bold text-amber-600">1×</td>
                    <td className="p-2.5 pr-3 font-mono">15m</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Department Summary Table (Strictly NO OT!) */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase text-slate-700 dark:text-slate-300">
              {language === 'lo' ? 'ສະຫຼຸບລາຍພະແນກ' : 'Department Summary'}
            </h4>
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] text-slate-500 uppercase font-bold">
                  <tr>
                    <th className="p-2.5 pl-3">{language === 'lo' ? 'ພະແນກ' : 'Department'}</th>
                    <th className="p-2.5">{language === 'lo' ? 'ພະນັກງານ' : 'Staff'}</th>
                    <th className="p-2.5">{language === 'lo' ? 'ມາຊ້າ' : 'Late'}</th>
                    <th className="p-2.5">{language === 'lo' ? 'ລາ' : 'Leave'}</th>
                    <th className="p-2.5 pr-3">{language === 'lo' ? 'ເງິນເດືອນ' : 'Salary'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {departments.map((dept) => {
                    const count = employees.filter((e) => e.departmentId === dept.id).length;
                    return (
                      <tr key={dept.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-2.5 pl-3 font-medium text-slate-800 dark:text-slate-200">{dept.nameLao}</td>
                        <td className="p-2.5 font-mono">{count}</td>
                        <td className="p-2.5 font-mono">{dept.code === 'DEPT-EXEC' ? '1' : '0'}</td>
                        <td className="p-2.5 font-mono">0</td>
                        <td className="p-2.5 pr-3 font-mono text-slate-400">—</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* 8. HR Operations & Compliance Widgets Grid (LHSE Enterprise Spec) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        {/* Card 1: Probation */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase">
            <span>{language === 'lo' ? 'ໃກ້ຜ່ານການທົດລອງ' : 'Probation Due'}</span>
            <span className="text-blue-600 font-mono">30 Days</span>
          </div>
          <p className="font-bold text-slate-700 dark:text-slate-300 pt-1">
            {language === 'lo' ? 'ບໍ່ມີພະນັກງານໃກ້ຜ່ານທົດລອງ' : 'No employees near probation end'}
          </p>
        </div>

        {/* Card 2: Birthdays this month */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase">
            <span>{language === 'lo' ? 'ວັນເກີດເດືອນນີ້' : 'Birthdays This Month'}</span>
            <Cake className="w-3.5 h-3.5 text-pink-500" />
          </div>
          <p className="font-bold text-slate-700 dark:text-slate-300 pt-1">
            {language === 'lo' ? 'ບໍ່ມີວັນເກີດເດືອນນີ້' : 'No birthdays this month'}
          </p>
        </div>

        {/* Card 3: Leave Quota Low */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase">
            <span>{language === 'lo' ? 'ວັນລາເຫຼືອໜ້ອຍ' : 'Leave Balance Low'}</span>
            <span className="text-amber-500 font-mono">≥ 80%</span>
          </div>
          <p className="font-bold text-slate-700 dark:text-slate-300 pt-1">
            {language === 'lo' ? 'ວັນລາຂອງທຸກຄົນຍັງພຽງພໍ' : 'All leave balances sufficient'}
          </p>
        </div>

        {/* Card 4: Expiring Documents */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase">
            <span>{language === 'lo' ? 'ເອກະສານໃກ້ໝົດອາຍຸ' : 'Expiring Docs'}</span>
            <FileWarning className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <p className="font-bold text-slate-700 dark:text-slate-300 pt-1">
            {language === 'lo' ? 'ບໍ່ມີເອກະສານໃກ້ໝົດອາຍຸ' : 'No documents expiring in 30 days'}
          </p>
        </div>

        {/* Card 5: Missing Attendance Logs (25 records) */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1 sm:col-span-2">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase">
            <span>{language === 'lo' ? 'ບໍ່ມີບັນທຶກເຂົ້າວຽກ (Missing Attendance)' : 'Missing Attendance Records'}</span>
            <span className="font-bold font-mono text-rose-600 bg-rose-50 dark:bg-rose-950 px-2 py-0.5 rounded-md">
              25 Records (7 Days)
            </span>
          </div>
          <p className="text-[11px] text-slate-500 pt-1">
            {language === 'lo'
              ? 'ມີຕາຕະລາງເຮັດວຽກແຕ່ບໍ່ມີບັນທຶກ (LHSE-001 ເຖິງ LHSE-008, ວັນທີ 2026-10-21 ກະກາງເວັນ)'
              : 'Work schedule scheduled but no punch recorded (LHSE-001 to LHSE-008, day shift).'}
          </p>
        </div>

        {/* Card 6: Scanner Hardware Status */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase">
            <span>{language === 'lo' ? 'ເຄື່ອງສະແກນອອບລາຍ' : 'Scanner Offline Check'}</span>
            <Wifi className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <p className="font-bold text-emerald-600 dark:text-emerald-400 pt-1">
            {language === 'lo' ? 'ທຸກເຄື່ອງສົ່ງຂໍ້ມູນປົກກະຕິ' : 'All biometric scanners online'}
          </p>
        </div>

        {/* Card 7: Turnover Rate */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase">
            <span>{language === 'lo' ? 'ອັດຕາການລາອອກ' : 'Turnover Rate (12M)'}</span>
            <span className="text-emerald-500 font-mono">0%</span>
          </div>
          <div className="text-[10px] text-slate-500 flex justify-between pt-1">
            <span>{language === 'lo' ? 'ຮັບເຂົ້າ: 0' : 'Hired: 0'}</span>
            <span>{language === 'lo' ? 'ລາອອກ: 0' : 'Left: 0'}</span>
            <span>{language === 'lo' ? 'ອາຍຸວຽກ: 6.8 ປີ' : 'Tenure: 6.8y'}</span>
          </div>
        </div>
      </div>

      {/* 8.5. Machine Learning-based Turnover Risk Insight Card */}
      <TurnoverRiskInsightCard />

      {/* 8.6. LHSE Enterprise System Audit & Compliance Stream */}
      <ComplianceAuditStreamWidget />

      {/* 9. Workforce Demographics & Attendance by Department */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
        {/* Demographics: Gender & Employment Type */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-blue-600" />
            <span>{language === 'lo' ? 'ໂຄງສ້າງບຸກຄະລາກອນ (ເພດ & ປະເພດການຈ້າງງານ)' : 'Staff Demographics'}</span>
          </h3>

          <div className="grid grid-cols-2 gap-4 pt-1">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2">
              <span className="font-bold text-slate-500 uppercase text-[10px] block">
                {language === 'lo' ? 'ແຍກຕາມເພດ' : 'By Gender'}
              </span>
              <div className="space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-300">Female:</span>
                  <span className="font-bold text-pink-600">5 · 50%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-300">Male:</span>
                  <span className="font-bold text-blue-600">5 · 50%</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2">
              <span className="font-bold text-slate-500 uppercase text-[10px] block">
                {language === 'lo' ? 'ແຍກຕາມປະເພດການຈ້າງ' : 'By Employment Type'}
              </span>
              <div className="space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-300">Full-time:</span>
                  <span className="font-bold text-emerald-600">10 · 100%</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Part-time:</span>
                  <span>0 · 0%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance by Department Progress */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-600" />
            <span>{language === 'lo' ? 'ການເຂົ້າວຽກຕາມພະແນກ (ເດືອນນີ້)' : 'Attendance by Department (This Month)'}</span>
          </h3>

          <div className="space-y-2 font-mono text-xs">
            <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
              <span className="font-sans font-bold text-slate-800 dark:text-slate-200">ພະແນກ ບຸກຄະລາກອນ</span>
              <span className="font-bold text-emerald-600">100% (1/1 ຄົນ)</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
              <span className="font-sans font-bold text-slate-800 dark:text-slate-200">ຄະນະຜູ້ບໍລິຫານ (1 ມາຊ້າ)</span>
              <span className="font-bold text-blue-600">100% (1/1 ຄົນ)</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
              <span className="font-sans text-slate-500">ພະແນກ ບໍລິຫານ</span>
              <span className="text-slate-400">0% (0/2 ຄົນ)</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
              <span className="font-sans text-slate-500">ພະແນກ ການຕະຫຼາດ-ການຂາຍ</span>
              <span className="text-slate-400">0% (0/3 ຄົນ)</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
              <span className="font-sans text-slate-500">ພະແນກ ບັນຊີ-ການເງິນ</span>
              <span className="text-slate-400">0% (0/3 ຄົນ)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
