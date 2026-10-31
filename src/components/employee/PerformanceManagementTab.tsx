import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import {
  EmployeeKPI,
  PerformanceEvaluation,
  KPICategory,
  KPIStatus,
  Employee,
} from '../../types/index.ts';
import { Modal } from '../common/Modal.tsx';
import { DataTable, Column } from '../common/DataTable.tsx';
import {
  TrendingUp,
  Target,
  Award,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
  Search,
  Filter,
  CheckSquare,
  Square,
  MessageSquare,
  Edit2,
  Trash2,
  Eye,
  Building2,
  User,
  Calendar,
  Sparkles,
  BarChart3,
  Layers,
  ArrowUpRight,
  ShieldAlert,
  Printer,
  ChevronRight,
  CheckCircle,
} from 'lucide-react';
import { alerts } from '../../utils/alerts.ts';
import { useFormAutoSave } from '../../hooks/useFormAutoSave.ts';
import { FormAutoSaveIndicator } from '../common/FormAutoSaveIndicator.tsx';

interface PerformanceManagementTabProps {
  className?: string;
}

export const PerformanceManagementTab: React.FC<PerformanceManagementTabProps> = ({
  className = '',
}) => {
  const {
    t,
    language,
    employees,
    departments,
    positions,
    employeeKPIs,
    evaluations,
    currentUser,
    createKPI,
    updateKPIProgress,
    updateKPISubGoal,
    deleteKPI,
    createEvaluation,
    updateEvaluation,
    deleteEvaluation,
    setActiveSubModule,
    addAuditLog,
  } = useApp();

  const isManagerOrAdmin =
    currentUser.role === 'SUPER_ADMIN' ||
    currentUser.role === 'HR_ADMIN' ||
    currentUser.role === 'DEPT_HEAD' ||
    currentUser.role === 'EXECUTIVE';

  // Sub-view tab
  const [activeTab, setActiveTab] = useState<'overview' | 'kpis' | 'reviews'>('overview');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [employeeFilter, setEmployeeFilter] = useState('ALL');
  const [periodFilter, setPeriodFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Modals
  const [createKPIModalOpen, setCreateKPIModalOpen] = useState(false);
  const [updateKPIModalOpen, setUpdateKPIModalOpen] = useState(false);
  const [selectedKPI, setSelectedKPI] = useState<EmployeeKPI | null>(null);

  const [createReviewModalOpen, setCreateReviewModalOpen] = useState(false);
  const [viewReviewModalOpen, setViewReviewModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<PerformanceEvaluation | null>(null);

  const initialKPIDraft = useMemo(() => ({
    employeeId: employees[0]?.id || '',
    title: '',
    titleLao: '',
    description: '',
    category: 'OPERATIONAL' as KPICategory,
    targetValue: 100,
    currentValue: 0,
    unit: '%',
    weight: 20,
    period: 'Q4 2026',
    status: 'NOT_STARTED' as KPIStatus,
    dueDate: '2026-12-31',
    subGoals: [
      { title: 'Milestone 1: Planning and Research', targetValue: 100, weight: 30 },
      { title: 'Milestone 2: Execution and Implementation', targetValue: 100, weight: 40 },
      { title: 'Milestone 3: Final Delivery and Review', targetValue: 100, weight: 30 },
    ],
  }), [employees]);

  // KPI Form state
  const [kpiForm, setKpiForm] = useState(initialKPIDraft);

  const kpiAutoSave = useFormAutoSave({
    formId: 'kpi_definition_draft',
    formData: kpiForm,
    setFormData: setKpiForm,
    initialData: initialKPIDraft,
    isOpen: createKPIModalOpen,
  });

  // KPI Update Progress Form
  const [kpiProgressVal, setKpiProgressVal] = useState<number>(0);
  const [kpiStatusVal, setKpiStatusVal] = useState<KPIStatus>('IN_PROGRESS');
  const [kpiFeedbackVal, setKpiFeedbackVal] = useState<string>('');

  // Review Form state
  const [reviewForm, setReviewForm] = useState<{
    employeeId: string;
    period: string;
    score: number;
    grade: 'A' | 'B' | 'C' | 'D';
    strengths: string;
    areasToImprove: string;
    goals: string;
    status: 'DRAFT' | 'SUBMITTED' | 'APPROVED';
  }>({
    employeeId: employees[0]?.id || '',
    period: 'Q3 2026',
    score: 85,
    grade: 'B',
    strengths: '',
    areasToImprove: '',
    goals: '',
    status: 'APPROVED',
  });

  // Unique review periods
  const allPeriods = useMemo(() => {
    const set = new Set<string>();
    employeeKPIs.forEach((k) => k.period && set.add(k.period));
    evaluations.forEach((e) => e.period && set.add(e.period));
    set.add('Q1 2026');
    set.add('Q2 2026');
    set.add('Q3 2026');
    set.add('Q4 2026');
    set.add('Annual 2026');
    return Array.from(set).sort().reverse();
  }, [employeeKPIs, evaluations]);

  // Filtered KPIs
  const filteredKPIs = useMemo(() => {
    return employeeKPIs.filter((kpi) => {
      const emp = employees.find((e) => e.id === kpi.employeeId);
      // Permission filter: if not manager/admin, show only self
      if (!isManagerOrAdmin && currentUser.employeeId && kpi.employeeId !== currentUser.employeeId) {
        return false;
      }
      // Department filter
      if (departmentFilter !== 'ALL' && emp?.departmentId !== departmentFilter) {
        return false;
      }
      // Employee filter
      if (employeeFilter !== 'ALL' && kpi.employeeId !== employeeFilter) {
        return false;
      }
      // Period filter
      if (periodFilter !== 'ALL' && kpi.period !== periodFilter) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'ALL' && kpi.status !== statusFilter) {
        return false;
      }
      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const empName = emp ? `${emp.firstNameEn} ${emp.lastNameEn} ${emp.firstNameLao} ${emp.lastNameLao} ${emp.employeeCode}`.toLowerCase() : '';
        const titleMatch = (kpi.title || '').toLowerCase().includes(query) || (kpi.titleLao || '').toLowerCase().includes(query);
        const descMatch = (kpi.description || '').toLowerCase().includes(query);
        return titleMatch || descMatch || empName.includes(query);
      }
      return true;
    });
  }, [employeeKPIs, employees, departmentFilter, employeeFilter, periodFilter, statusFilter, searchTerm, isManagerOrAdmin, currentUser]);

  // Filtered Reviews
  const filteredReviews = useMemo(() => {
    return evaluations.filter((review) => {
      const emp = employees.find((e) => e.id === review.employeeId);
      // Permission filter
      if (!isManagerOrAdmin && currentUser.employeeId && review.employeeId !== currentUser.employeeId) {
        return false;
      }
      if (departmentFilter !== 'ALL' && emp?.departmentId !== departmentFilter) {
        return false;
      }
      if (employeeFilter !== 'ALL' && review.employeeId !== employeeFilter) {
        return false;
      }
      if (periodFilter !== 'ALL' && review.period !== periodFilter) {
        return false;
      }
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const empName = emp ? `${emp.firstNameEn} ${emp.lastNameEn} ${emp.firstNameLao} ${emp.lastNameLao} ${emp.employeeCode}`.toLowerCase() : '';
        const strengthsMatch = (review.strengths || '').toLowerCase().includes(query);
        const goalsMatch = (review.goals || '').toLowerCase().includes(query);
        return strengthsMatch || goalsMatch || empName.includes(query);
      }
      return true;
    });
  }, [evaluations, employees, departmentFilter, employeeFilter, periodFilter, searchTerm, isManagerOrAdmin, currentUser]);

  // Analytics Metrics
  const metrics = useMemo(() => {
    const totalKPIs = filteredKPIs.length;
    const completedKPIs = filteredKPIs.filter((k) => k.status === 'COMPLETED').length;
    const onTrackKPIs = filteredKPIs.filter((k) => k.status === 'ON_TRACK').length;
    const atRiskKPIs = filteredKPIs.filter((k) => k.status === 'AT_RISK').length;
    const inProgressKPIs = filteredKPIs.filter((k) => k.status === 'IN_PROGRESS' || k.status === 'NOT_STARTED').length;

    let avgProgress = 0;
    if (totalKPIs > 0) {
      const sum = filteredKPIs.reduce((acc, k) => {
        const pct = k.targetValue > 0 ? Math.min(100, Math.round((k.currentValue / k.targetValue) * 100)) : 0;
        return acc + pct;
      }, 0);
      avgProgress = Math.round(sum / totalKPIs);
    }

    const totalReviews = filteredReviews.length;
    let avgReviewScore = 0;
    if (totalReviews > 0) {
      const sumScore = filteredReviews.reduce((acc, r) => acc + (r.score || 0), 0);
      avgReviewScore = Math.round(sumScore / totalReviews);
    }

    const gradeACount = filteredReviews.filter((r) => r.grade === 'A').length;
    const gradeBCount = filteredReviews.filter((r) => r.grade === 'B').length;

    return {
      totalKPIs,
      completedKPIs,
      onTrackKPIs,
      atRiskKPIs,
      inProgressKPIs,
      avgProgress,
      totalReviews,
      avgReviewScore,
      gradeACount,
      gradeBCount,
    };
  }, [filteredKPIs, filteredReviews]);

  // Handlers for KPI actions
  const handleOpenCreateKPI = () => {
    setKpiForm({
      employeeId: employees[0]?.id || '',
      title: '',
      titleLao: '',
      description: '',
      category: 'OPERATIONAL',
      targetValue: 100,
      currentValue: 0,
      unit: '%',
      weight: 20,
      period: 'Q4 2026',
      status: 'NOT_STARTED',
      dueDate: '2026-12-31',
      subGoals: [
        { title: 'Milestone 1: Planning and Research', targetValue: 100, weight: 30 },
        { title: 'Milestone 2: Execution and Implementation', targetValue: 100, weight: 40 },
        { title: 'Milestone 3: Final Delivery and Review', targetValue: 100, weight: 30 },
      ],
    });
    setCreateKPIModalOpen(true);
  };

  const handleSaveNewKPI = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kpiForm.title.trim()) {
      alerts.error(language === 'lo' ? 'ກະລຸນາປ້ອນຫົວຂໍ້ KPI' : 'Please provide KPI Title');
      return;
    }

    createKPI({
      employeeId: kpiForm.employeeId,
      title: kpiForm.title,
      titleLao: kpiForm.titleLao || kpiForm.title,
      description: kpiForm.description,
      category: kpiForm.category,
      targetValue: Number(kpiForm.targetValue) || 100,
      currentValue: Number(kpiForm.currentValue) || 0,
      unit: kpiForm.unit || '%',
      weight: Number(kpiForm.weight) || 20,
      period: kpiForm.period,
      status: kpiForm.status,
      assignedBy: currentUser.fullName,
      dueDate: kpiForm.dueDate,
      subGoals: kpiForm.subGoals.map((sg, idx) => ({
        id: `sg-${Date.now()}-${idx}`,
        title: sg.title,
        targetValue: sg.targetValue,
        currentValue: 0,
        weight: sg.weight,
        completed: false,
      })),
    });

    const targetEmp = employees.find((e) => e.id === kpiForm.employeeId);
    addAuditLog(
      'KPI_ASSIGN',
      'CREATE',
      'Employee Management',
      `Assigned new individual KPI '${kpiForm.title}' (${kpiForm.weight}%) to employee ${targetEmp ? targetEmp.employeeCode : kpiForm.employeeId}.`,
      {
        entityType: 'EMPLOYEE_KPI',
        entityName: kpiForm.title,
        hrDomain: 'PERSONNEL',
        complianceRef: 'Decree 543/PM Art. 28 (Performance Oversight)',
      }
    );

    kpiAutoSave.clearDraft();
    setCreateKPIModalOpen(false);
  };

  const handleOpenUpdateProgress = (kpi: EmployeeKPI) => {
    setSelectedKPI(kpi);
    setKpiProgressVal(kpi.currentValue);
    setKpiStatusVal(kpi.status);
    setKpiFeedbackVal(kpi.managerFeedback || '');
    setUpdateKPIModalOpen(true);
  };

  const handleSaveProgressUpdate = () => {
    if (!selectedKPI) return;
    updateKPIProgress(selectedKPI.id, kpiProgressVal, kpiStatusVal, kpiFeedbackVal);

    addAuditLog(
      'KPI_PROGRESS_UPDATE',
      'UPDATE',
      'Employee Management',
      `Updated KPI progress for '${selectedKPI.title}': ${kpiProgressVal}/${selectedKPI.targetValue} (${kpiStatusVal}).`,
      {
        entityType: 'EMPLOYEE_KPI',
        entityName: selectedKPI.title,
        recordId: selectedKPI.id,
        hrDomain: 'PERSONNEL',
        changes: [
          { field: 'currentValue', oldValue: selectedKPI.currentValue, newValue: kpiProgressVal },
          { field: 'status', oldValue: selectedKPI.status, newValue: kpiStatusVal },
        ],
      }
    );

    setUpdateKPIModalOpen(false);
  };

  // Handlers for Reviews
  const handleOpenCreateReview = (empId?: string) => {
    setReviewForm({
      employeeId: empId || employees[0]?.id || '',
      period: 'Q4 2026',
      score: 85,
      grade: 'B',
      strengths: '',
      areasToImprove: '',
      goals: '',
      status: 'APPROVED',
    });
    setCreateReviewModalOpen(true);
  };

  const calculateGrade = (score: number): 'A' | 'B' | 'C' | 'D' => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    return 'D';
  };

  const handleScoreChange = (score: number) => {
    const bounded = Math.max(0, Math.min(100, score));
    setReviewForm((prev) => ({
      ...prev,
      score: bounded,
      grade: calculateGrade(bounded),
    }));
  };

  const handleSaveReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm.employeeId) {
      alerts.error(language === 'lo' ? 'ກະລຸນາເລືອກພະນັກງານ' : 'Please select an employee');
      return;
    }

    createEvaluation({
      employeeId: reviewForm.employeeId,
      evaluatorId: currentUser.employeeId || 'emp-001',
      period: reviewForm.period,
      score: reviewForm.score,
      grade: reviewForm.grade,
      strengths: reviewForm.strengths || (language === 'lo' ? 'ປະຕິບັດໜ້າທີ່ໄດ້ດີຕາມເປົ້າໝາຍ' : 'Delivered responsibilities effectively'),
      areasToImprove: reviewForm.areasToImprove || (language === 'lo' ? 'ສືບຕໍ່ພັດທະນາທັກສະດິຈິຕອນ' : 'Continue developing digital skills'),
      goals: reviewForm.goals || (language === 'lo' ? 'ບັນລຸຕົວຊີ້ວັດໄຕຣມາດຖັດໄປ' : 'Achieve next quarter KPIs'),
      status: reviewForm.status,
    });

    const reviewedEmp = employees.find((e) => e.id === reviewForm.employeeId);
    addAuditLog(
      'PERIODIC_PERFORMANCE_REVIEW',
      'CREATE',
      'Employee Management',
      `Conducted official periodic evaluation for ${reviewedEmp ? `${reviewedEmp.employeeCode} (${reviewedEmp.firstNameEn})` : reviewForm.employeeId} (${reviewForm.period}): Score ${reviewForm.score}/100, Grade ${reviewForm.grade}.`,
      {
        entityType: 'PERFORMANCE_EVALUATION',
        entityName: `${reviewForm.period} Appraisal`,
        hrDomain: 'PERSONNEL',
        complianceRef: 'Lao Labor Law 2013 & Decree 543/PM',
      }
    );

    setCreateReviewModalOpen(false);
  };

  // Helper for status badges
  const getStatusBadge = (status: KPIStatus) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
            <CheckCircle2 className="w-3 h-3" />
            {language === 'lo' ? 'ສຳເລັດແລ້ວ' : 'Completed'}
          </span>
        );
      case 'ON_TRACK':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300">
            <TrendingUp className="w-3 h-3" />
            {language === 'lo' ? 'ຕາມແຜນ (On Track)' : 'On Track'}
          </span>
        );
      case 'AT_RISK':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300">
            <AlertTriangle className="w-3 h-3" />
            {language === 'lo' ? 'ມີຄວາມສ່ຽງ (At Risk)' : 'At Risk'}
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
            <Clock className="w-3 h-3" />
            {language === 'lo' ? 'ກຳລັງດຳເນີນງານ' : 'In Progress'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <Clock className="w-3 h-3" />
            {language === 'lo' ? 'ຍັງບໍ່ເລີ່ມ' : 'Not Started'}
          </span>
        );
    }
  };

  const getCategoryBadge = (category: KPICategory) => {
    const config: Record<KPICategory, { labelEn: string; labelLo: string; color: string }> = {
      OPERATIONAL: { labelEn: 'Operational', labelLo: 'ການດຳເນີນງານ', color: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
      FINANCIAL: { labelEn: 'Financial', labelLo: 'ການເງິນ & ງົບປະມານ', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
      CUSTOMER_SERVICE: { labelEn: 'Stakeholder / Service', labelLo: 'ການບໍລິການ & ພາກສ່ວນກ່ຽວຂ້ອງ', color: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' },
      QUALITY: { labelEn: 'Quality & Governance', labelLo: 'ຄຸນນະພາບ & ທຳມາພິບານ', color: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800' },
      INNOVATION: { labelEn: 'Energy Innovation', labelLo: 'ນະວັດຕະກຳພະລັງງານ', color: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
    };
    const c = config[category] || config.OPERATIONAL;
    return (
      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${c.color}`}>
        {language === 'lo' ? c.labelLo : c.labelEn}
      </span>
    );
  };

  // Grade badge
  const getGradeBadge = (grade: string) => {
    switch (grade) {
      case 'A':
        return <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">Grade A (ດີເດັ່ນ)</span>;
      case 'B':
        return <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300">Grade B (ດີ)</span>;
      case 'C':
        return <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300">Grade C (ປານກາງ)</span>;
      default:
        return <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300">Grade D (ຕ້ອງປັບປຸງ)</span>;
    }
  };

  // Columns for KPI Table View
  const kpiColumns: Column<EmployeeKPI>[] = [
    {
      key: 'employeeId',
      header: language === 'lo' ? 'ພະນັກງານ' : 'Employee',
      render: (kpi) => {
        const emp = employees.find((e) => e.id === kpi.employeeId);
        return (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-xs shrink-0">
              {emp?.firstNameEn?.charAt(0) || 'E'}
            </div>
            <div>
              <div className="font-bold text-slate-900 dark:text-slate-100">
                {emp ? (language === 'lo' ? `${emp.firstNameLao} ${emp.lastNameLao}` : `${emp.firstNameEn} ${emp.lastNameEn}`) : kpi.employeeId}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">{emp?.employeeCode}</div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'title',
      header: language === 'lo' ? 'ຕົວຊີ້ວັດ (KPI)' : 'Key Performance Indicator',
      render: (kpi) => (
        <div className="max-w-xs space-y-1">
          <div className="font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
            {language === 'lo' && kpi.titleLao ? kpi.titleLao : kpi.title}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {getCategoryBadge(kpi.category)}
            <span className="text-[10px] text-slate-500 font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
              {kpi.period}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'weight',
      header: language === 'lo' ? 'ນ້ຳໜັກ (%)' : 'Weight',
      render: (kpi) => <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{kpi.weight}%</span>,
    },
    {
      key: 'currentValue',
      header: language === 'lo' ? 'ຄວາມຄືບໜ້າ' : 'Progress & Target',
      render: (kpi) => {
        const pct = kpi.targetValue > 0 ? Math.min(100, Math.round((kpi.currentValue / kpi.targetValue) * 100)) : 0;
        return (
          <div className="w-36 space-y-1">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="font-bold text-slate-700 dark:text-slate-200">
                {kpi.currentValue} / {kpi.targetValue} {kpi.unit}
              </span>
              <span className="font-black text-blue-600 dark:text-blue-400">{pct}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  pct >= 100 ? 'bg-emerald-500' : pct < 50 ? 'bg-rose-500' : 'bg-blue-600'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: t('status'),
      render: (kpi) => getStatusBadge(kpi.status),
    },
    {
      key: 'dueDate',
      header: language === 'lo' ? 'ກຳນົດສົ່ງ' : 'Due Date',
      render: (kpi) => <span className="text-xs font-mono text-slate-500">{kpi.dueDate}</span>,
    },
    {
      key: 'actions',
      header: t('actions'),
      sortable: false,
      render: (kpi) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleOpenUpdateProgress(kpi)}
            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
            title="Update Progress & Feedback"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          {isManagerOrAdmin && (
            <button
              onClick={() => deleteKPI(kpi.id)}
              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
              title="Delete KPI"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Top Banner & Action Controls */}
      <div className="bg-linear-to-r from-blue-700 via-indigo-700 to-slate-900 rounded-3xl p-6 lg:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <Award className="w-72 h-72 text-white" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-blue-200 text-xs font-bold border border-white/15">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>LHSE Personnel Development & Performance System</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight">
              {language === 'lo' ? 'ການຄຸ້ມຄອງຜົນງານ & ຕິດຕາມຕົວຊີ້ວັດ (KPI)' : 'Performance Management & KPI Tracking'}
            </h1>
            <p className="text-xs lg:text-sm text-blue-100/90 leading-relaxed">
              {language === 'lo'
                ? 'ລະບົບກຳນົດຕົວຊີ້ວັດ, ຕິດຕາມຄວາມຄືບໜ້າເປົ້າໝາຍຍຸດທະສາດລັດວິສາຫະກິດ, ແລະ ດຳເນີນການປະເມີນຜົນງານປະຈຳໄຕຣມາດ ສຳລັບພະນັກງານ ທລສ.'
                : 'Track individual Key Performance Indicators, milestone deliverables, and conduct formal quarterly appraisal reviews for Lao Holding State Enterprise personnel.'}
            </p>
          </div>

          {/* Quick Action Buttons for Managers */}
          {isManagerOrAdmin && (
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => setActiveSubModule('performance-kpis')}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
              >
                <Target className="w-4 h-4 text-emerald-100" />
                <span>{language === 'lo' ? 'ແດຊບອດຜົນງານ KPI' : 'Performance KPIs'}</span>
              </button>
              <button
                onClick={handleOpenCreateKPI}
                className="flex items-center gap-2 px-4 py-2.5 bg-white text-blue-700 hover:bg-blue-50 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>{language === 'lo' ? 'ສ້າງຕົວຊີ້ວັດ KPI' : 'Define New KPI'}</span>
              </button>
              <button
                onClick={() => handleOpenCreateReview()}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
              >
                <Award className="w-4 h-4" />
                <span>{language === 'lo' ? 'ປະເມີນໄຕຣມາດ' : 'Conduct Review'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Sub-view navigation tabs inside performance tab */}
        <div className="mt-8 pt-4 border-t border-white/15 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'bg-white text-blue-900 shadow-sm'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>{language === 'lo' ? 'ພາບລວມ & ສະຖິຕິ' : 'Performance Overview'}</span>
          </button>

          <button
            onClick={() => setActiveTab('kpis')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'kpis'
                ? 'bg-white text-blue-900 shadow-sm'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>{language === 'lo' ? 'ຕົວຊີ້ວັດ KPI' : 'KPI Tracking'}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-800 font-mono font-bold">
              {filteredKPIs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'reviews'
                ? 'bg-white text-blue-900 shadow-sm'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>{language === 'lo' ? 'ການປະເມີນປະຈຳໄຕຣມາດ' : 'Quarterly Reviews'}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-mono font-bold">
              {filteredReviews.length}
            </span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={language === 'lo' ? 'ຄົ້ນຫາ KPI, ພະນັກງານ, ເປົ້າໝາຍ...' : 'Search KPIs, employees, reviews...'}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Department Filter */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">{language === 'lo' ? 'ທຸກພະແນກ (All Departments)' : 'All Departments'}</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {language === 'lo' ? d.nameLao : d.nameEn}
              </option>
            ))}
          </select>

          {/* Individual Employee Filter */}
          <select
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 max-w-[200px]"
          >
            <option value="ALL">{language === 'lo' ? 'ທຸກພະນັກງານ (All Staff)' : 'All Employees'}</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.employeeCode} - {language === 'lo' ? `${emp.firstNameLao} ${emp.lastNameLao}` : `${emp.firstNameEn} ${emp.lastNameEn}`}
              </option>
            ))}
          </select>

          {/* Period Filter */}
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">{language === 'lo' ? 'ທຸກງວດ/ໄຕຣມາດ (All Periods)' : 'All Periods'}</option>
            {allPeriods.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          {/* Status Filter for KPIs */}
          {activeTab === 'kpis' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">{language === 'lo' ? 'ທຸກສະຖານະ' : 'All Statuses'}</option>
              <option value="ON_TRACK">{language === 'lo' ? 'ຕາມແຜນ (On Track)' : 'On Track'}</option>
              <option value="COMPLETED">{language === 'lo' ? 'ສຳເລັດ (Completed)' : 'Completed'}</option>
              <option value="AT_RISK">{language === 'lo' ? 'ມີຄວາມສ່ຽງ (At Risk)' : 'At Risk'}</option>
              <option value="IN_PROGRESS">{language === 'lo' ? 'ກຳລັງດຳເນີນ (In Progress)' : 'In Progress'}</option>
              <option value="NOT_STARTED">{language === 'lo' ? 'ຍັງບໍ່ເລີ່ມ' : 'Not Started'}</option>
            </select>
          )}
        </div>

        {/* View toggle (grid / table) when on KPIs tab */}
        {activeTab === 'kpis' && (
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {language === 'lo' ? 'ມຸມມອງກາດ' : 'Cards'}
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {language === 'lo' ? 'ຕາຕະລາງ' : 'Table'}
            </button>
          </div>
        )}
      </div>

      {/* Individual Employee 360° Spotlight Card (When an individual employee is selected) */}
      {employeeFilter !== 'ALL' && (() => {
        const emp = employees.find((e) => e.id === employeeFilter);
        if (!emp) return null;
        const dept = departments.find((d) => d.id === emp.departmentId);
        const pos = positions.find((p) => p.id === emp.positionId);
        const empKPIs = employeeKPIs.filter((k) => k.employeeId === emp.id);
        const empReviews = evaluations.filter((r) => r.employeeId === emp.id);
        const latestReview = empReviews[0];

        let weightedAttainment = 0;
        let totalWeight = 0;
        empKPIs.forEach((k) => {
          const pct = k.targetValue > 0 ? Math.min(100, (k.currentValue / k.targetValue) * 100) : 0;
          weightedAttainment += pct * (k.weight / 100);
          totalWeight += k.weight;
        });
        const attainmentScore = totalWeight > 0 ? Math.round(weightedAttainment) : 0;

        return (
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 text-white border border-indigo-700/50 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/10 border-2 border-white/20 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-inner font-black text-xl text-blue-200">
                  {emp.avatarUrl ? (
                    <img src={emp.avatarUrl} alt={emp.firstNameEn} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <span>{emp.firstNameEn.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-blue-500/30 text-blue-200 border border-blue-400/40">
                      {emp.employeeCode}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      {emp.employmentType}
                    </span>
                  </div>
                  <h3 className="font-black text-lg text-white mt-0.5">
                    {language === 'lo' ? `${emp.firstNameLao} ${emp.lastNameLao}` : `${emp.firstNameEn} ${emp.lastNameEn}`}
                  </h3>
                  <p className="text-xs text-blue-200">
                    {pos ? (language === 'lo' ? pos.titleLao : pos.titleEn) : ''} • {dept ? (language === 'lo' ? dept.nameLao : dept.nameEn) : ''}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    setKpiForm({
                      ...initialKPIDraft,
                      employeeId: emp.id,
                    });
                    setCreateKPIModalOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{language === 'lo' ? 'ມອບໝາຍ KPI ໃຫ້ພະນັກງານ' : 'Assign KPI'}</span>
                </button>
                <button
                  onClick={() => handleOpenCreateReview(emp.id)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>{language === 'lo' ? 'ປະເມີນຜົນງານໄຕຣມາດ' : 'Conduct Review'}</span>
                </button>
                <button
                  onClick={() => setEmployeeFilter('ALL')}
                  className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 text-xs font-medium cursor-pointer"
                >
                  {language === 'lo' ? 'ສະແດງທຸກຄົນ' : 'View All Staff'}
                </button>
              </div>
            </div>

            {/* Individual Metrics Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-[10px] text-blue-200 block uppercase font-bold">{language === 'lo' ? 'ຄວາມຄືບໜ້າ KPI ລວມ' : 'Weighted Attainment'}</span>
                <div className="text-xl font-black font-mono text-emerald-400 mt-0.5">{attainmentScore}%</div>
                <div className="w-full bg-white/10 h-1.5 rounded-full mt-1 overflow-hidden">
                  <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${Math.min(100, attainmentScore)}%` }} />
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-[10px] text-blue-200 block uppercase font-bold">{language === 'lo' ? 'ຈຳນວນຕົວຊີ້ວັດ' : 'Assigned Metrics'}</span>
                <div className="text-xl font-black font-mono text-white mt-0.5">{empKPIs.length} KPIs</div>
                <span className="text-[10px] text-blue-300">{empKPIs.filter(k => k.status === 'COMPLETED').length} completed</span>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-[10px] text-blue-200 block uppercase font-bold">{language === 'lo' ? 'ການປະເມີນຫຼ້າສຸດ' : 'Latest Review'}</span>
                {latestReview ? (
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xl font-black font-mono text-white">{latestReview.score}/100</span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-purple-500 text-white">Grade {latestReview.grade}</span>
                  </div>
                ) : (
                  <div className="text-xs text-blue-300/80 italic mt-1">Pending Evaluation</div>
                )}
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-[10px] text-blue-200 block uppercase font-bold">{language === 'lo' ? 'ສະຖານະສັນຍາ' : 'Contract Status'}</span>
                <div className="text-xs font-bold text-white mt-1">{emp.status}</div>
                <span className="text-[10px] text-blue-300 font-mono">Since {emp.joiningDate}</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* KPI & Review Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Avg Progress */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {language === 'lo' ? 'ອັດຕາບັນລຸຜົນງານສະເລ່ຍ' : 'Average Achievement'}
            </span>
            <div className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
              {metrics.avgProgress}%
            </div>
            <div className="text-[11px] text-slate-400">
              {language === 'lo' ? `ອີງຕາມ ${metrics.totalKPIs} ຕົວຊີ້ວັດ` : `Across ${metrics.totalKPIs} active KPIs`}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2: Completed / On Track */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {language === 'lo' ? 'ຕາມແຜນ & ສຳເລັດ' : 'On Track & Done'}
            </span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {metrics.completedKPIs + metrics.onTrackKPIs}
            </div>
            <div className="text-[11px] text-emerald-600/90 font-medium">
              {metrics.completedKPIs} {language === 'lo' ? 'ສຳເລັດ 100%' : '100% completed'}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3: At Risk */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {language === 'lo' ? 'ມີຄວາມສ່ຽງ / ຕ້ອງເອົາໃຈໃສ່' : 'At Risk / Attention'}
            </span>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
              {metrics.atRiskKPIs}
            </div>
            <div className="text-[11px] text-slate-400">
              {language === 'lo' ? 'ຕ້ອງການແຜນຊຸກຍູ້' : 'Needs manager coaching'}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 4: Reviews Conducted */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {language === 'lo' ? 'ການປະເມີນໄຕຣມາດ' : 'Quarterly Reviews'}
            </span>
            <div className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono">
              {metrics.totalReviews}
            </div>
            <div className="text-[11px] text-purple-600/90 font-medium">
              {language === 'lo' ? `ຄະແນນສະເລ່ຍ ${metrics.avgReviewScore}/100` : `Avg Score: ${metrics.avgReviewScore}/100`}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* VIEW 1: OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Priority KPIs currently in focus */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-600" />
                  <span>{language === 'lo' ? 'ຕົວຊີ້ວັດຫຼັກທີ່ກຳລັງຕິດຕາມ (Priority KPIs)' : 'Priority KPI Goals'}</span>
                </h3>
                <button
                  onClick={() => setActiveTab('kpis')}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <span>{language === 'lo' ? 'ເບິ່ງທັງໝົດ' : 'View All'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {filteredKPIs.slice(0, 3).map((kpi) => {
                  const emp = employees.find((e) => e.id === kpi.employeeId);
                  const pct = kpi.targetValue > 0 ? Math.min(100, Math.round((kpi.currentValue / kpi.targetValue) * 100)) : 0;
                  return (
                    <div
                      key={kpi.id}
                      className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-300 dark:hover:border-blue-700 transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {getCategoryBadge(kpi.category)}
                            <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded">
                              {kpi.period} • {kpi.weight}% {language === 'lo' ? 'ນ້ຳໜັກ' : 'weight'}
                            </span>
                          </div>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                            {language === 'lo' && kpi.titleLao ? kpi.titleLao : kpi.title}
                          </h4>
                          {kpi.description && (
                            <p className="text-xs text-slate-500 line-clamp-2">{kpi.description}</p>
                          )}
                        </div>
                        {getStatusBadge(kpi.status)}
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-slate-500">
                            {language === 'lo' ? 'ຜົນງານຕົວຈິງ' : 'Actual'}:{' '}
                            <strong className="text-slate-800 dark:text-slate-200">
                              {kpi.currentValue} / {kpi.targetValue} {kpi.unit}
                            </strong>
                          </span>
                          <span className="font-black text-blue-600 dark:text-blue-400">{pct}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              pct >= 100 ? 'bg-emerald-500' : pct < 50 ? 'bg-rose-500' : 'bg-blue-600'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      {/* Footer: Employee + Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-[10px]">
                            {emp?.firstNameEn?.charAt(0) || 'E'}
                          </div>
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {emp ? (language === 'lo' ? `${emp.firstNameLao} ${emp.lastNameLao}` : `${emp.firstNameEn} ${emp.lastNameEn}`) : kpi.employeeId}
                          </span>
                        </div>
                        <button
                          onClick={() => handleOpenUpdateProgress(kpi)}
                          className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>{language === 'lo' ? 'ອັບເດດ' : 'Update'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right 1 Col: Latest Quarterly Appraisals */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Award className="w-4 h-4 text-purple-600" />
                  <span>{language === 'lo' ? 'ຜົນການປະເມີນລ່າສຸດ' : 'Recent Reviews'}</span>
                </h3>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <span>{language === 'lo' ? 'ເບິ່ງທັງໝົດ' : 'View All'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3">
                {filteredReviews.slice(0, 4).map((rev) => {
                  const emp = employees.find((e) => e.id === rev.employeeId);
                  return (
                    <div
                      key={rev.id}
                      onClick={() => {
                        setSelectedReview(rev);
                        setViewReviewModalOpen(true);
                      }}
                      className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-purple-300 dark:hover:border-purple-700 transition-all cursor-pointer space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded">
                            {rev.period}
                          </span>
                          <span className="text-[10px] text-slate-400">{rev.status}</span>
                        </div>
                        {getGradeBadge(rev.grade)}
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
                            {emp ? (language === 'lo' ? `${emp.firstNameLao} ${emp.lastNameLao}` : `${emp.firstNameEn} ${emp.lastNameEn}`) : rev.employeeId}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">{emp?.employeeCode}</div>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-black font-mono text-slate-800 dark:text-slate-100">
                            {rev.score}
                          </span>
                          <span className="text-[10px] text-slate-400">/100</span>
                        </div>
                      </div>

                      {rev.strengths && (
                        <p className="text-[11px] text-slate-500 line-clamp-1 italic">
                          "{rev.strengths}"
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: KPIS TAB */}
      {activeTab === 'kpis' && (
        <div className="space-y-6">
          {viewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredKPIs.map((kpi) => {
                const emp = employees.find((e) => e.id === kpi.employeeId);
                const pct = kpi.targetValue > 0 ? Math.min(100, Math.round((kpi.currentValue / kpi.targetValue) * 100)) : 0;
                return (
                  <div
                    key={kpi.id}
                    className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      {/* Top Badges */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {getCategoryBadge(kpi.category)}
                          <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded">
                            {kpi.period}
                          </span>
                        </div>
                        {getStatusBadge(kpi.status)}
                      </div>

                      {/* Employee details */}
                      <div className="flex items-center gap-2.5 pt-1">
                        <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-xs shrink-0">
                          {emp?.firstNameEn?.charAt(0) || 'E'}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
                            {emp ? (language === 'lo' ? `${emp.firstNameLao} ${emp.lastNameLao}` : `${emp.firstNameEn} ${emp.lastNameEn}`) : kpi.employeeId}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {emp?.employeeCode} • {kpi.weight}% {language === 'lo' ? 'ນ້ຳໜັກ' : 'weight'}
                          </div>
                        </div>
                      </div>

                      {/* Title & Description */}
                      <div className="space-y-1">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {language === 'lo' && kpi.titleLao ? kpi.titleLao : kpi.title}
                        </h4>
                        {kpi.description && (
                          <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                            {kpi.description}
                          </p>
                        )}
                      </div>

                      {/* Progress Bar & Value */}
                      <div className="space-y-1.5 pt-2">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-slate-600 dark:text-slate-300">
                            {kpi.currentValue} / {kpi.targetValue} {kpi.unit}
                          </span>
                          <span className="font-black text-blue-600 dark:text-blue-400">{pct}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              pct >= 100 ? 'bg-emerald-500' : pct < 50 ? 'bg-rose-500' : 'bg-blue-600'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      {/* Sub-goals / Milestones Checklist */}
                      {kpi.subGoals && kpi.subGoals.length > 0 && (
                        <div className="space-y-1.5 pt-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {language === 'lo' ? 'ຈຸດປະສົງຍ່ອຍ / ຂັ້ນຕອນ (Milestones)' : 'Key Milestones'}
                          </span>
                          <div className="space-y-1 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                            {kpi.subGoals.map((sg) => (
                              <button
                                key={sg.id}
                                type="button"
                                onClick={() => updateKPISubGoal(kpi.id, sg.id, !sg.completed)}
                                className="w-full flex items-center justify-between gap-2 text-left hover:bg-white dark:hover:bg-slate-700/50 p-1 rounded-md transition-colors text-xs"
                              >
                                <div className="flex items-center gap-1.5 min-w-0">
                                  {sg.completed ? (
                                    <CheckSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  ) : (
                                    <Square className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  )}
                                  <span
                                    className={`truncate text-[11px] ${
                                      sg.completed
                                        ? 'line-through text-slate-400'
                                        : 'text-slate-700 dark:text-slate-300'
                                    }`}
                                  >
                                    {sg.title}
                                  </span>
                                </div>
                                <span className="font-mono text-[10px] text-slate-400 shrink-0">
                                  {sg.weight || 0}%
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Manager Feedback note if any */}
                      {kpi.managerFeedback && (
                        <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                          <MessageSquare className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <span className="font-bold text-[10px] uppercase tracking-wider text-amber-700 dark:text-amber-300">
                              {language === 'lo' ? 'ຄຳແນະນຳຈາກຫົວໜ້າງານ' : 'Manager Coaching'}
                            </span>
                            <p className="text-[11px] leading-tight">{kpi.managerFeedback}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom toolbar */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <div className="text-[10px] text-slate-400 font-mono">
                        {language === 'lo' ? 'ກຳນົດ' : 'Due'}: {kpi.dueDate}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenUpdateProgress(kpi)}
                          className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 font-bold transition-colors flex items-center gap-1 text-xs"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>{language === 'lo' ? 'ປັບຄ່າຄວາມຄືບໜ້າ' : 'Update'}</span>
                        </button>
                        {isManagerOrAdmin && (
                          <button
                            onClick={() => deleteKPI(kpi.id)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                            title="Delete KPI"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <DataTable
              data={filteredKPIs}
              columns={kpiColumns}
              filename="LHSE_Employee_KPI_Tracking"
            />
          )}
        </div>
      )}

      {/* VIEW 3: QUARTERLY REVIEWS TAB */}
      {activeTab === 'reviews' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredReviews.map((rev) => {
              const emp = employees.find((e) => e.id === rev.employeeId);
              const dept = departments.find((d) => d.id === emp?.departmentId);
              return (
                <div
                  key={rev.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-4">
                    {/* Top Row: Period & Grade */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-0.5">
                        <span className="font-mono text-xs font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 px-2.5 py-0.5 rounded-lg">
                          {rev.period}
                        </span>
                        <div className="text-[10px] text-slate-400 pt-1">
                          {language === 'lo' ? 'ສະຖານະ' : 'Status'}:{' '}
                          <span className="font-bold text-slate-700 dark:text-slate-300">{rev.status}</span>
                        </div>
                      </div>
                      {getGradeBadge(rev.grade)}
                    </div>

                    {/* Employee Profile Header */}
                    <div className="flex items-center gap-3 pt-1">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-black flex items-center justify-center text-sm shrink-0">
                        {emp?.firstNameEn?.charAt(0) || 'E'}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                          {emp ? (language === 'lo' ? `${emp.firstNameLao} ${emp.lastNameLao}` : `${emp.firstNameEn} ${emp.lastNameEn}`) : rev.employeeId}
                        </h4>
                        <div className="text-[11px] text-slate-400">
                          {dept ? (language === 'lo' ? dept.nameLao : dept.nameEn) : ''}
                        </div>
                      </div>
                    </div>

                    {/* Score Gauge */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          {language === 'lo' ? 'ຄະແນນປະເມີນລວມ' : 'Appraisal Score'}
                        </span>
                        <div className="text-xl font-black font-mono text-slate-900 dark:text-slate-100">
                          {rev.score} <span className="text-xs text-slate-400 font-normal">/ 100</span>
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-full border-4 border-emerald-500 flex items-center justify-center font-mono font-bold text-xs text-emerald-600">
                        {rev.grade}
                      </div>
                    </div>

                    {/* Strengths */}
                    {rev.strengths && (
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600">
                          {language === 'lo' ? 'ຈຸດເດັ່ນ & ຜົນງານດີເດັ່ນ' : 'Strengths & Achievements'}
                        </span>
                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                          {rev.strengths}
                        </p>
                      </div>
                    )}

                    {/* Areas for Improvement */}
                    {rev.areasToImprove && (
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-amber-600">
                          {language === 'lo' ? 'ຈຸດທີ່ຄວນພັດທະນາ' : 'Areas for Improvement'}
                        </span>
                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                          {rev.areasToImprove}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setSelectedReview(rev);
                        setViewReviewModalOpen(true);
                      }}
                      className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{language === 'lo' ? 'ເບິ່ງໃບປະເມີນເຕັມ' : 'Full Appraisal'}</span>
                    </button>
                    {isManagerOrAdmin && (
                      <button
                        onClick={() => deleteEvaluation(rev.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                        title="Delete Review"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL 1: CREATE KPI */}
      <Modal
        isOpen={createKPIModalOpen}
        onClose={() => setCreateKPIModalOpen(false)}
        title={language === 'lo' ? 'ກຳນົດ ແລະ ມອບໝາຍຕົວຊີ້ວັດ KPI ໃໝ່' : 'Define & Assign New KPI'}
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveNewKPI} className="space-y-4">
          {/* Draft Auto-Save Feedback */}
          <FormAutoSaveIndicator
            isSaving={kpiAutoSave.isSaving}
            lastSaved={kpiAutoSave.lastSaved}
            isRestored={kpiAutoSave.isRestored}
            onDiscard={() => {
              kpiAutoSave.discardDraft();
              setKpiForm(initialKPIDraft);
            }}
            language={language}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Employee Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'lo' ? 'ເລືອກພະນັກງານທີ່ຮັບຜິດຊອບ *' : 'Assigned Employee *'}
              </label>
              <select
                value={kpiForm.employeeId}
                onChange={(e) => setKpiForm({ ...kpiForm, employeeId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                required
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.employeeCode} - {emp.firstNameLao} {emp.lastNameLao} ({emp.firstNameEn} {emp.lastNameEn})
                  </option>
                ))}
              </select>
            </div>

            {/* KPI Period */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'lo' ? 'ງວດ / ໄຕຣມາດ (Period) *' : 'Target Period *'}
              </label>
              <select
                value={kpiForm.period}
                onChange={(e) => setKpiForm({ ...kpiForm, period: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              >
                {allPeriods.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Title in English & Lao */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'lo' ? 'ຫົວຂໍ້ KPI (ພາສາອັງກິດ) *' : 'KPI Title (English) *'}
              </label>
              <input
                type="text"
                value={kpiForm.title}
                onChange={(e) => setKpiForm({ ...kpiForm, title: e.target.value })}
                placeholder="e.g. Nam Theun 2 Concession Equity Review"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'lo' ? 'ຫົວຂໍ້ KPI (ພາສາລາວ)' : 'KPI Title (Lao)'}
              </label>
              <input
                type="text"
                value={kpiForm.titleLao}
                onChange={(e) => setKpiForm({ ...kpiForm, titleLao: e.target.value })}
                placeholder="ຕົວຢ່າງ: ປະເມີນຮຸ້ນສ່ວນສຳປະທານເຂື່ອນນ້ຳເທີນ 2"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>
          </div>

          {/* Category, Weight, Target, Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'lo' ? 'ໝວດໝູ່ KPI' : 'Category'}
              </label>
              <select
                value={kpiForm.category}
                onChange={(e) => setKpiForm({ ...kpiForm, category: e.target.value as KPICategory })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              >
                <option value="OPERATIONAL">Operational</option>
                <option value="FINANCIAL">Financial</option>
                <option value="CUSTOMER_SERVICE">Stakeholder / Service</option>
                <option value="QUALITY">Quality & Governance</option>
                <option value="INNOVATION">Energy Innovation</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'lo' ? 'ນ້ຳໜັກ (%)' : 'Weight (%)'}
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={kpiForm.weight}
                onChange={(e) => setKpiForm({ ...kpiForm, weight: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'lo' ? 'ຄ່າເປົ້າໝາຍ (Target)' : 'Target Value'}
              </label>
              <input
                type="number"
                min="1"
                value={kpiForm.targetValue}
                onChange={(e) => setKpiForm({ ...kpiForm, targetValue: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'lo' ? 'ຫົວໜ່ວຍ (Unit)' : 'Unit'}
              </label>
              <input
                type="text"
                value={kpiForm.unit}
                onChange={(e) => setKpiForm({ ...kpiForm, unit: e.target.value })}
                placeholder="%, Projects, LAK, etc."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>
          </div>

          {/* Due date & Description */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'lo' ? 'ວັນທີຄາດໝາຍສຳເລັດ' : 'Due Date'}
              </label>
              <input
                type="date"
                value={kpiForm.dueDate}
                onChange={(e) => setKpiForm({ ...kpiForm, dueDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'lo' ? 'ລາຍລະອຽດ & ເກນຄວາມສຳເລັດ' : 'Description & Deliverables'}
              </label>
              <textarea
                value={kpiForm.description}
                onChange={(e) => setKpiForm({ ...kpiForm, description: e.target.value })}
                rows={2}
                placeholder="Key expectations, milestones, and success criteria for this KPI..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setCreateKPIModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
            >
              {language === 'lo' ? 'ບັນທຶກ ແລະ ມອບໝາຍ KPI' : 'Assign KPI'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: UPDATE KPI PROGRESS */}
      <Modal
        isOpen={updateKPIModalOpen}
        onClose={() => setUpdateKPIModalOpen(false)}
        title={language === 'lo' ? 'ອັບເດດຄວາມຄືບໜ້າ & ຄຳແນະນຳ KPI' : 'Update KPI Progress & Coaching'}
        maxWidth="xl"
      >
        {selectedKPI && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                {selectedKPI.period} • {selectedKPI.category}
              </span>
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                {language === 'lo' && selectedKPI.titleLao ? selectedKPI.titleLao : selectedKPI.title}
              </h4>
              <div className="text-xs text-slate-600 dark:text-slate-300 font-mono">
                {language === 'lo' ? 'ເປົ້າໝາຍ' : 'Target'}: {selectedKPI.targetValue} {selectedKPI.unit}
              </div>
            </div>

            {/* Slider & Value Input */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                {language === 'lo' ? 'ຄ່າຜົນງານປັດຈຸບັນ' : 'Current Value'} ({selectedKPI.unit})
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max={selectedKPI.targetValue || 100}
                  value={kpiProgressVal}
                  onChange={(e) => setKpiProgressVal(Number(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="0"
                  max={selectedKPI.targetValue * 2}
                  value={kpiProgressVal}
                  onChange={(e) => setKpiProgressVal(Number(e.target.value))}
                  className="w-24 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-right"
                />
              </div>
              <div className="text-right text-xs font-mono font-bold text-blue-600">
                {selectedKPI.targetValue > 0
                  ? Math.round((kpiProgressVal / selectedKPI.targetValue) * 100)
                  : 0}
                % {language === 'lo' ? 'ສຳເລັດ' : 'achieved'}
              </div>
            </div>

            {/* Status Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t('status')}
              </label>
              <select
                value={kpiStatusVal}
                onChange={(e) => setKpiStatusVal(e.target.value as KPIStatus)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              >
                <option value="NOT_STARTED">Not Started (ຍັງບໍ່ເລີ່ມ)</option>
                <option value="IN_PROGRESS">In Progress (ກຳລັງດຳເນີນງານ)</option>
                <option value="ON_TRACK">On Track (ຕາມແຜນງານ)</option>
                <option value="AT_RISK">At Risk (ມີຄວາມສ່ຽງຫຼຸດເປົ້າ)</option>
                <option value="COMPLETED">Completed (ສຳເລັດແລ້ວ)</option>
              </select>
            </div>

            {/* Manager Feedback */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'lo' ? 'ຄຳເຫັນ & ຄຳແນະນຳຈາກຫົວໜ້າງານ (Manager Coaching)' : 'Manager Coaching & Feedback'}
              </label>
              <textarea
                value={kpiFeedbackVal}
                onChange={(e) => setKpiFeedbackVal(e.target.value)}
                rows={3}
                placeholder={language === 'lo' ? 'ໃຫ້ຄຳແນະນຳ ຫຼື ແຜນຊຸກຍູ້ການປະຕິບັດງານ...' : 'Add constructive guidance, milestones achieved, or remedial actions...'}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setUpdateKPIModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={handleSaveProgressUpdate}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
              >
                {language === 'lo' ? 'ບັນທຶກການອັບເດດ' : 'Save Updates'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 3: CONDUCT QUARTERLY REVIEW */}
      <Modal
        isOpen={createReviewModalOpen}
        onClose={() => setCreateReviewModalOpen(false)}
        title={language === 'lo' ? 'ດຳເນີນການປະເມີນຜົນງານປະຈຳໄຕຣມາດ' : 'Conduct Quarterly Performance Review'}
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveReview} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'lo' ? 'ເລືອກພະນັກງານທີ່ຖືກປະເມີນ *' : 'Employee to Review *'}
              </label>
              <select
                value={reviewForm.employeeId}
                onChange={(e) => setReviewForm({ ...reviewForm, employeeId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                required
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.employeeCode} - {emp.firstNameLao} {emp.lastNameLao} ({emp.firstNameEn} {emp.lastNameEn})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'lo' ? 'ງວດການປະເມີນ (Review Period) *' : 'Appraisal Period *'}
              </label>
              <select
                value={reviewForm.period}
                onChange={(e) => setReviewForm({ ...reviewForm, period: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              >
                <option value="Q3 2026">Q3 2026 (ໄຕຣມາດ 3/2026)</option>
                <option value="Q4 2026">Q4 2026 (ໄຕຣມາດ 4/2026)</option>
                <option value="Q2 2026">Q2 2026 (ໄຕຣມາດ 2/2026)</option>
                <option value="Q1 2026">Q1 2026 (ໄຕຣມາດ 1/2026)</option>
                <option value="Annual 2026">Annual 2026 (ປະຈຳປີ 2026)</option>
              </select>
            </div>
          </div>

          {/* Score Slider & Calculated Grade */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {language === 'lo' ? 'ຄະແນນປະເມີນລວມ (0 - 100)' : 'Overall Evaluation Score (0 - 100)'}
                </label>
                <div className="text-[11px] text-slate-500">
                  90+: Grade A • 80-89: Grade B • 70-79: Grade C • &lt;70: Grade D
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-black font-mono text-blue-600 dark:text-blue-400">
                  {reviewForm.score}/100
                </span>
                {getGradeBadge(reviewForm.grade)}
              </div>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              value={reviewForm.score}
              onChange={(e) => handleScoreChange(Number(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Qualitative Questions */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {language === 'lo' ? '1. ຈຸດເດັ່ນ ແລະ ຜົນງານທີ່ປະຕິບັດໄດ້ດີ' : '1. Key Strengths & Achievements'}
            </label>
            <textarea
              value={reviewForm.strengths}
              onChange={(e) => setReviewForm({ ...reviewForm, strengths: e.target.value })}
              rows={2}
              placeholder={language === 'lo' ? 'ຜົນສຳເລັດຂອງວຽກງານ, ຄວາມຮັບຜິດຊອບ, ແລະ ຜົນງານໂດດເດັ່ນ...' : 'Major accomplishments, successful projects, initiative, teamwork...'}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {language === 'lo' ? '2. ຈຸດທີ່ຄວນປັບປຸງ & ຄວາມຕ້ອງການຝຶກອົບຮົມ' : '2. Areas for Improvement & Development Needs'}
            </label>
            <textarea
              value={reviewForm.areasToImprove}
              onChange={(e) => setReviewForm({ ...reviewForm, areasToImprove: e.target.value })}
              rows={2}
              placeholder={language === 'lo' ? 'ທັກສະທີ່ຕ້ອງຝຶກເພີ່ມ, ການຈັດສັນເວລາ, ເຕັກໂນໂລຊີ...' : 'Competencies to develop, recommended training programs...'}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {language === 'lo' ? '3. ເປົ້າໝາຍຍຸດທະສາດສຳລັບໄຕຣມາດຖັດໄປ' : '3. Agreed Strategic Goals for Next Quarter'}
            </label>
            <textarea
              value={reviewForm.goals}
              onChange={(e) => setReviewForm({ ...reviewForm, goals: e.target.value })}
              rows={2}
              placeholder={language === 'lo' ? 'ເປົ້າໝາຍທີ່ຕົກລົງຮ່ວມກັນລະຫວ່າງຫົວໜ້າ ແລະ ພະນັກງານ...' : 'Key goals and measurable deliverables agreed for next review cycle...'}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setCreateReviewModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
            >
              {language === 'lo' ? 'ບັນທຶກຜົນການປະເມີນ' : 'Submit Review'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 4: FULL APPRAISAL SHEET VIEW */}
      <Modal
        isOpen={viewReviewModalOpen}
        onClose={() => setViewReviewModalOpen(false)}
        title={language === 'lo' ? 'ໃບປະເມີນຜົນງານບຸກຄະລາກອນ ລັດວິສາຫະກິດຖືຮຸ້ນລາວ (LHSE)' : 'LHSE Official Quarterly Appraisal Form'}
        maxWidth="3xl"
      >
        {selectedReview && (
          <div className="space-y-6 print:p-0">
            {/* Official Enterprise Header */}
            <div className="text-center border-b pb-4 border-slate-200 dark:border-slate-700 space-y-1">
              <div className="font-bold text-xs uppercase tracking-widest text-slate-500">
                Lao People's Democratic Republic • Peace Independence Democracy Unity Prosperity
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                {language === 'lo'
                  ? 'ໃບປະເມີນຜົນງານປະຈຳໄຕຣມາດ (Quarterly Performance Appraisal)'
                  : 'QUARTERLY PERSONNEL PERFORMANCE APPRAISAL'}
              </h3>
              <div className="text-xs text-blue-600 dark:text-blue-400 font-bold">
                Lao Holding State Enterprise (LHSE) • {selectedReview.period}
              </div>
            </div>

            {/* Employee Information Card */}
            {(() => {
              const emp = employees.find((e) => e.id === selectedReview.employeeId);
              const dept = departments.find((d) => d.id === emp?.departmentId);
              const pos = positions.find((p) => p.id === emp?.positionId);
              return (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase font-bold">Employee</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {emp ? `${emp.firstNameLao} ${emp.lastNameLao}` : selectedReview.employeeId}
                    </span>
                    <span className="text-[11px] text-slate-400 block font-mono">{emp?.employeeCode}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase font-bold">Department</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {dept ? (language === 'lo' ? dept.nameLao : dept.nameEn) : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase font-bold">Position</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {pos ? (language === 'lo' ? pos.titleLao : pos.titleEn) : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase font-bold">Period & Status</span>
                    <span className="font-bold text-purple-600 dark:text-purple-400 block">
                      {selectedReview.period}
                    </span>
                    <span className="text-[10px] text-slate-500">{selectedReview.status}</span>
                  </div>
                </div>
              );
            })()}

            {/* Overall Score & Rating Banner */}
            <div className="p-4 rounded-2xl bg-linear-to-r from-emerald-50 to-blue-50 dark:from-emerald-950/40 dark:to-blue-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300 tracking-wider">
                  Comprehensive Appraisal Rating
                </span>
                <div className="text-2xl font-black font-mono text-emerald-700 dark:text-emerald-400">
                  {selectedReview.score} / 100
                </div>
              </div>
              <div className="text-right">
                {getGradeBadge(selectedReview.grade)}
                <div className="text-[11px] text-slate-500 pt-1 font-mono">
                  {new Date(selectedReview.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Appraisal Detailed Comments */}
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                  1. Major Strengths & Key Achievements
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                  {selectedReview.strengths || 'No specific strengths recorded.'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
                  2. Areas for Growth & Skill Enhancement
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                  {selectedReview.areasToImprove || 'No specific improvement areas flagged.'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider block">
                  3. Next Quarter Agreed Strategic Goals
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                  {selectedReview.goals || 'Goals will be established at start of next cycle.'}
                </p>
              </div>
            </div>

            {/* Formal Endorsement Signatures */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-700 grid grid-cols-3 gap-6 text-center text-xs text-slate-500">
              <div className="space-y-8">
                <span>Employee Signature</span>
                <div className="border-b border-dashed border-slate-400 mx-4" />
                <span className="text-[11px] font-mono text-slate-400">Date: ____/____/2026</span>
              </div>
              <div className="space-y-8">
                <span>Department Head Review</span>
                <div className="border-b border-dashed border-slate-400 mx-4" />
                <span className="text-[11px] font-mono text-slate-400">Date: ____/____/2026</span>
              </div>
              <div className="space-y-8">
                <span>Director General / HR Director</span>
                <div className="border-b border-dashed border-slate-400 mx-4" />
                <span className="text-[11px] font-mono text-slate-400">Approved & Sealed</span>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setViewReviewModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-white hover:bg-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                {t('close')}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
