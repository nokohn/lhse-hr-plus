import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { EmployeeKPI, KPICategory, KPIStatus, KPISubGoal } from '../../types/index.ts';
import { alerts } from '../../utils/alerts.ts';
import * as XLSX from 'xlsx';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {
  Target,
  Award,
  TrendingUp,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Edit3,
  Trash2,
  Trophy,
  Layers,
  MessageSquare,
  Building2,
  X,
  FileSpreadsheet,
  Download,
  ChevronDown,
  ChevronUp,
  Check,
  ListTodo,
  Filter,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react';

export const PerformanceTrackingSection: React.FC = () => {
  const {
    language,
    employees,
    departments,
    employeeKPIs,
    createKPI,
    updateKPIProgress,
    updateKPISubGoal,
    deleteKPI,
  } = useApp();

  // Filters & State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedEmployee, setSelectedEmployee] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'CARDS' | 'TABLE'>('CARDS');
  const [onlyUnder50Threshold, setOnlyUnder50Threshold] = useState<boolean>(false);
  const [expandedKPIIds, setExpandedKPIIds] = useState<Set<string>>(new Set());
  const [showHistoricalChart, setShowHistoricalChart] = useState<boolean>(true);

  // Modals state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [kpiToUpdate, setKpiToUpdate] = useState<EmployeeKPI | null>(null);

  // Form State for Assign Modal
  const [formEmployeeId, setFormEmployeeId] = useState(employees[0]?.id || 'emp-001');
  const [formTitle, setFormTitle] = useState('');
  const [formTitleLao, setFormTitleLao] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState<KPICategory>('OPERATIONAL');
  const [formTargetValue, setFormTargetValue] = useState<number>(100);
  const [formCurrentValue, setFormCurrentValue] = useState<number>(0);
  const [formUnit, setFormUnit] = useState('%');
  const [formWeight, setFormWeight] = useState<number>(25);
  const [formPeriod, setFormPeriod] = useState('Q4 2026');
  const [formDueDate, setFormDueDate] = useState('2026-12-31');
  const [formStatus] = useState<KPIStatus>('ON_TRACK');

  // Form State for Update Progress Modal
  const [updateCurrentValue, setUpdateCurrentValue] = useState<number>(0);
  const [updateStatus, setUpdateStatus] = useState<KPIStatus>('ON_TRACK');
  const [updateFeedback, setUpdateFeedback] = useState<string>('');

  // Toggle expanded sub-goals for a specific KPI
  const toggleExpandKPI = (kpiId: string) => {
    setExpandedKPIIds((prev) => {
      const next = new Set(prev);
      if (next.has(kpiId)) {
        next.delete(kpiId);
      } else {
        next.add(kpiId);
      }
      return next;
    });
  };

  // Helper to ensure every KPI has realistic, nested sub-goals
  const getKPISubGoals = (kpi: EmployeeKPI): KPISubGoal[] => {
    if (kpi.subGoals && kpi.subGoals.length > 0) return kpi.subGoals;
    const p = kpi.targetValue > 0 ? Math.min(100, Math.round((kpi.currentValue / kpi.targetValue) * 100)) : 0;
    return [
      {
        id: `${kpi.id}-sg-1`,
        title: `${kpi.title} - Phase 1: Planning & Setup`,
        titleLao: `${kpi.titleLao || kpi.title} - ໄລຍະ 1: ການວາງແຜນ & ກະກຽມ`,
        targetValue: 100,
        currentValue: p >= 35 ? 100 : Math.round(p * 2.5),
        unit: '%',
        weight: 30,
        completed: p >= 35,
      },
      {
        id: `${kpi.id}-sg-2`,
        title: `${kpi.title} - Phase 2: Core Execution`,
        titleLao: `${kpi.titleLao || kpi.title} - ໄລຍະ 2: ການຈັດຕັ້ງປະຕິບັດຫຼັກ`,
        targetValue: 100,
        currentValue: p >= 80 ? 100 : Math.max(0, Math.round((p - 20) * 1.5)),
        unit: '%',
        weight: 45,
        completed: p >= 80,
      },
      {
        id: `${kpi.id}-sg-3`,
        title: `${kpi.title} - Phase 3: Final Delivery & Audit`,
        titleLao: `${kpi.titleLao || kpi.title} - ໄລຍະ 3: ກວດສອບ & ສົ່ງມອບຂັ້ນສຸດທ້າຍ`,
        targetValue: 100,
        currentValue: p >= 100 ? 100 : Math.max(0, p - 40),
        unit: '%',
        weight: 25,
        completed: p >= 100,
      },
    ];
  };

  // Toggle individual sub-goal completion
  const handleToggleSubGoal = (kpi: EmployeeKPI, subGoalId: string, currentCompleted: boolean) => {
    updateKPISubGoal(kpi.id, subGoalId, !currentCompleted);
  };

  // Open Update Modal
  const handleOpenUpdateModal = (kpi: EmployeeKPI) => {
    setKpiToUpdate(kpi);
    setUpdateCurrentValue(kpi.currentValue);
    setUpdateStatus(kpi.status);
    setUpdateFeedback(kpi.managerFeedback || '');
    setIsUpdateModalOpen(true);
  };

  // Submit Update
  const handleSaveProgress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kpiToUpdate) return;
    updateKPIProgress(kpiToUpdate.id, Number(updateCurrentValue), updateStatus, updateFeedback.trim());
    setIsUpdateModalOpen(false);
    setKpiToUpdate(null);
  };

  // Submit New KPI
  const handleCreateKPI = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      alerts.error(language === 'lo' ? 'ກະລຸນາປ້ອນຫົວຂໍ້ KPI' : 'Please provide a KPI title');
      return;
    }

    createKPI({
      employeeId: formEmployeeId,
      title: formTitle.trim(),
      titleLao: formTitleLao.trim() || undefined,
      description: formDescription.trim() || undefined,
      category: formCategory,
      targetValue: Number(formTargetValue),
      currentValue: Number(formCurrentValue),
      unit: formUnit.trim() || '%',
      weight: Number(formWeight) || 20,
      period: formPeriod.trim() || 'Q4 2026',
      status: formStatus,
      assignedBy: 'HR Administration / Manager',
      dueDate: formDueDate || '2026-12-31',
    });

    // Reset form
    setFormTitle('');
    setFormTitleLao('');
    setFormDescription('');
    setFormTargetValue(100);
    setFormCurrentValue(0);
    setFormUnit('%');
    setFormWeight(25);
    setIsAssignModalOpen(false);
  };

  // Delete KPI confirmation
  const handleDeleteKPI = (kpi: EmployeeKPI) => {
    const confirmMessage = language === 'lo'
      ? `ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບຕົວຊີ້ວັດ '${kpi.title}'?`
      : `Are you sure you want to delete KPI '${kpi.title}'?`;
    if (window.confirm(confirmMessage)) {
      deleteKPI(kpi.id);
    }
  };

  // Export KPIs to Excel (.xlsx)
  const exportKPIsToExcel = () => {
    try {
      const data = filteredKPIs.map((kpi, idx) => {
        const emp = employees.find((e) => e.id === kpi.employeeId);
        const dept = departments.find((d) => d.id === emp?.departmentId);
        const achievementPct = kpi.targetValue > 0 ? Math.round((kpi.currentValue / kpi.targetValue) * 100) : 0;
        const subGoals = getKPISubGoals(kpi);
        const completedSubCount = subGoals.filter((s) => s.completed).length;
        return {
          'No.': idx + 1,
          'Employee Code': emp?.employeeCode || '',
          'Employee Name (Lao)': emp ? `${emp.firstNameLao} ${emp.lastNameLao}` : '',
          'Employee Name (En)': emp ? `${emp.firstNameEn} ${emp.lastNameEn}` : '',
          'Department': dept?.nameLao || '',
          'KPI Title': kpi.title,
          'KPI Title (Lao)': kpi.titleLao || '',
          'Category': kpi.category,
          'Target Value': kpi.targetValue,
          'Current Value': kpi.currentValue,
          'Unit': kpi.unit,
          'Achievement (%)': `${achievementPct}%`,
          'Below 50% Threshold Alert': achievementPct < 50 ? 'YES' : 'NO',
          'Weight (%)': `${kpi.weight}%`,
          'Period': kpi.period,
          'Status': kpi.status,
          'Assigned Date': kpi.assignedDate,
          'Due Date': kpi.dueDate,
          'Sub-Goals Count': subGoals.length,
          'Sub-Goals Completed': completedSubCount,
          'Last Updated': kpi.lastUpdated || '',
          'Manager Feedback': kpi.managerFeedback || '',
        };
      });

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Employee KPIs');
      XLSX.writeFile(wb, `LHSE_Employee_KPI_Tracking_Report_${new Date().toISOString().split('T')[0]}.xlsx`);

      alerts.success(
        language === 'lo' ? 'ສົ່ງອອກລາຍງານ KPI ສຳເລັດ' : 'KPI Report Exported',
        language === 'lo' ? 'ດາວໂຫຼດຟາຍ Excel ຮຽບຮ້ອຍແລ້ວ' : 'Downloaded Excel spreadsheet.'
      );
    } catch {
      alerts.error(language === 'lo' ? 'ບໍ່ສາມາດສົ່ງອອກຟາຍໄດ້' : 'Export failed');
    }
  };

  // Export KPIs to CSV with UTF-8 BOM encoding for proper Lao text rendering
  const exportKPIsToCSV = () => {
    try {
      const headers = [
        language === 'lo' ? 'ລຳດັບ' : 'No.',
        language === 'lo' ? 'ລະຫັດພະນັກງານ' : 'Employee Code',
        language === 'lo' ? 'ຊື່ ແລະ ນາມສະກຸນ (ລາວ)' : 'Employee Name (Lao)',
        language === 'lo' ? 'ຊື່ ແລະ ນາມສະກຸນ (ອັງກິດ)' : 'Employee Name (En)',
        language === 'lo' ? 'ພະແນກ' : 'Department',
        language === 'lo' ? 'ຫົວຂໍ້ KPI' : 'KPI Title',
        language === 'lo' ? 'ຫົວຂໍ້ KPI (ລາວ)' : 'KPI Title (Lao)',
        language === 'lo' ? 'ໝວດໝູ່' : 'Category',
        language === 'lo' ? 'ຄ່າເປົ້າໝາຍ' : 'Target Value',
        language === 'lo' ? 'ຄ່າປັດຈຸບັນ' : 'Current Value',
        language === 'lo' ? 'ຫົວໜ່ວຍ' : 'Unit',
        language === 'lo' ? 'ອັດຕາບັນລຸຜົນ (%)' : 'Achievement (%)',
        language === 'lo' ? 'ເຕືອນໄພຕ່ຳກວ່າ 50%' : 'Below 50% Threshold',
        language === 'lo' ? 'ນ້ຳໜັກ (%)' : 'Weight (%)',
        language === 'lo' ? 'ງວດປະເມີນ' : 'Period',
        language === 'lo' ? 'ສະຖານະ' : 'Status',
        language === 'lo' ? 'ວັນທີມອບໝາຍ' : 'Assigned Date',
        language === 'lo' ? 'ກຳນົດສົ່ງ' : 'Due Date',
        language === 'lo' ? 'ຈຳນວນເປົ້າໝາຍຍ່ອຍ' : 'Sub-Goals Count',
        language === 'lo' ? 'ເປົ້າໝາຍຍ່ອຍສຳເລັດ' : 'Sub-Goals Done',
        language === 'lo' ? 'ອັບເດດຫຼ້າສຸດ' : 'Last Updated',
        language === 'lo' ? 'ຄຳເຫັນຜູ້ຈັດການ' : 'Manager Feedback',
      ];

      const escapeCSV = (val: any) => {
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      };

      const rows = filteredKPIs.map((kpi, idx) => {
        const emp = employees.find((e) => e.id === kpi.employeeId);
        const dept = departments.find((d) => d.id === emp?.departmentId);
        const achievementPct = kpi.targetValue > 0 ? Math.round((kpi.currentValue / kpi.targetValue) * 100) : 0;
        const subGoals = getKPISubGoals(kpi);
        const completedCount = subGoals.filter((s) => s.completed).length;
        const isUnder50 = achievementPct < 50;

        return [
          idx + 1,
          emp?.employeeCode || '',
          emp ? `${emp.firstNameLao} ${emp.lastNameLao}` : '',
          emp ? `${emp.firstNameEn} ${emp.lastNameEn}` : '',
          dept?.nameLao || '',
          kpi.title,
          kpi.titleLao || '',
          kpi.category,
          kpi.targetValue,
          kpi.currentValue,
          kpi.unit,
          `${achievementPct}%`,
          isUnder50 ? (language === 'lo' ? 'ແມ່ນ (ຕ່ຳກວ່າເກນ 50%)' : 'YES (< 50% ALERT)') : (language === 'lo' ? 'ປົກກະຕິ' : 'Normal'),
          `${kpi.weight}%`,
          kpi.period,
          kpi.status,
          kpi.assignedDate,
          kpi.dueDate,
          subGoals.length,
          completedCount,
          kpi.lastUpdated || '',
          kpi.managerFeedback || '',
        ].map(escapeCSV).join(',');
      });

      // Prepend \uFEFF (UTF-8 BOM) so Lao glyphs render flawlessly in Excel/Numbers/Calc
      const csvContent = [headers.map(escapeCSV).join(','), ...rows].join('\r\n');
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `LHSE_Employee_KPI_Tracking_Report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alerts.success(
        language === 'lo' ? 'ສົ່ງອອກ CSV ສຳເລັດ' : 'KPI CSV Exported',
        language === 'lo' ? 'ດາວໂຫຼດຟາຍ CSV ຮອງຮັບພາສາລາວ (UTF-8 BOM) ຮຽບຮ້ອຍແລ້ວ' : 'Downloaded structured CSV progress report with UTF-8 BOM encoding.'
      );
    } catch {
      alerts.error(language === 'lo' ? 'ບໍ່ສາມາດສົ່ງອອກຟາຍ CSV ໄດ້' : 'CSV Export failed');
    }
  };

  // Filtered KPIs with enhanced real-time search across Employee (Lao/En), Department (Lao/En), and KPI details
  const filteredKPIs = useMemo(() => {
    return employeeKPIs.filter((kpi) => {
      // 1. Employee filter
      if (selectedEmployee !== 'ALL' && kpi.employeeId !== selectedEmployee) {
        return false;
      }
      // 2. Dept filter
      if (selectedDept !== 'ALL') {
        const emp = employees.find((e) => e.id === kpi.employeeId);
        if (emp?.departmentId !== selectedDept) return false;
      }
      // 3. Category filter
      if (selectedCategory !== 'ALL' && kpi.category !== selectedCategory) {
        return false;
      }
      // 4. Status filter
      if (selectedStatus !== 'ALL' && kpi.status !== selectedStatus) {
        return false;
      }
      // 5. Threshold < 50% filter toggle
      if (onlyUnder50Threshold) {
        const achievementPct = kpi.targetValue > 0 ? (kpi.currentValue / kpi.targetValue) * 100 : 0;
        if (achievementPct >= 50) return false;
      }
      // 6. Real-time Search query matching employee name (Lao & En), department (Lao & En), code, title, and category
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const emp = employees.find((e) => e.id === kpi.employeeId);
        const dept = departments.find((d) => d.id === emp?.departmentId);

        const matchTitle =
          kpi.title.toLowerCase().includes(query) ||
          (kpi.titleLao && kpi.titleLao.toLowerCase().includes(query)) ||
          (kpi.description && kpi.description.toLowerCase().includes(query));

        const matchEmp =
          emp &&
          (emp.employeeCode.toLowerCase().includes(query) ||
            emp.firstNameLao.toLowerCase().includes(query) ||
            emp.lastNameLao.toLowerCase().includes(query) ||
            `${emp.firstNameLao} ${emp.lastNameLao}`.toLowerCase().includes(query) ||
            emp.firstNameEn.toLowerCase().includes(query) ||
            emp.lastNameEn.toLowerCase().includes(query) ||
            `${emp.firstNameEn} ${emp.lastNameEn}`.toLowerCase().includes(query));

        const matchDept =
          dept &&
          (dept.nameLao.toLowerCase().includes(query) ||
            dept.nameEn.toLowerCase().includes(query) ||
            dept.code.toLowerCase().includes(query));

        const matchCategory = kpi.category.toLowerCase().includes(query);

        if (!matchTitle && !matchEmp && !matchDept && !matchCategory) return false;
      }
      return true;
    });
  }, [employeeKPIs, selectedEmployee, selectedDept, selectedCategory, selectedStatus, searchQuery, onlyUnder50Threshold, employees, departments]);

  // Threshold alert calculations (< 50% KPI completion)
  const { under50KPIs, under50Employees } = useMemo(() => {
    const list = employeeKPIs.filter((k) => {
      const pct = k.targetValue > 0 ? (k.currentValue / k.targetValue) * 100 : 0;
      return pct < 50;
    });

    const empMap: { [empId: string]: { emp: any; under50Count: number } } = {};
    list.forEach((k) => {
      if (!empMap[k.employeeId]) {
        const emp = employees.find((e) => e.id === k.employeeId);
        empMap[k.employeeId] = { emp, under50Count: 0 };
      }
      empMap[k.employeeId].under50Count++;
    });

    const empList = Object.entries(empMap).map(([id, data]) => ({
      id,
      employeeCode: data.emp?.employeeCode || id,
      firstNameLao: data.emp?.firstNameLao || id,
      lastNameLao: data.emp?.lastNameLao || '',
      firstNameEn: data.emp?.firstNameEn || id,
      lastNameEn: data.emp?.lastNameEn || '',
      under50Count: data.under50Count,
    }));

    return { under50KPIs: list, under50Employees: empList };
  }, [employeeKPIs, employees]);

  // 6-Month Historical KPI Performance Trends Data (Recharts)
  const historicalTrendsData = useMemo(() => {
    const totalKPIs = employeeKPIs.length;
    let liveCompanyAvg = 85;
    let liveBelow50Avg = 38;
    let liveTopQuartile = 96;

    if (totalKPIs > 0) {
      const pcts = employeeKPIs.map((k) => (k.targetValue > 0 ? (k.currentValue / k.targetValue) * 100 : 0));
      liveCompanyAvg = Math.round(pcts.reduce((a, b) => a + b, 0) / totalKPIs);

      const under50Pcts = pcts.filter((p) => p < 50);
      liveBelow50Avg = under50Pcts.length > 0 ? Math.round(under50Pcts.reduce((a, b) => a + b, 0) / under50Pcts.length) : 38;

      const sorted = [...pcts].sort((a, b) => b - a);
      const topCount = Math.max(1, Math.ceil(totalKPIs * 0.25));
      liveTopQuartile = Math.round(sorted.slice(0, topCount).reduce((a, b) => a + b, 0) / topCount);
    }

    return [
      {
        month: 'May 2026',
        monthLao: 'ພຶດສະພາ',
        companyAvg: 68,
        topQuartile: 84,
        trailingThreshold: 42,
        activeKPIs: 8,
      },
      {
        month: 'Jun 2026',
        monthLao: 'ມິຖຸນາ',
        companyAvg: 72,
        topQuartile: 88,
        trailingThreshold: 44,
        activeKPIs: 8,
      },
      {
        month: 'Jul 2026',
        monthLao: 'ກໍລະກົດ',
        companyAvg: 75,
        topQuartile: 91,
        trailingThreshold: 39,
        activeKPIs: 9,
      },
      {
        month: 'Aug 2026',
        monthLao: 'ສິງຫາ',
        companyAvg: 79,
        topQuartile: 93,
        trailingThreshold: 45,
        activeKPIs: 10,
      },
      {
        month: 'Sep 2026',
        monthLao: 'ກັນຍາ',
        companyAvg: 82,
        topQuartile: 95,
        trailingThreshold: 41,
        activeKPIs: 11,
      },
      {
        month: 'Oct 2026',
        monthLao: 'ຕຸລາ (ປັດຈຸບັນ)',
        companyAvg: liveCompanyAvg,
        topQuartile: liveTopQuartile,
        trailingThreshold: liveBelow50Avg,
        activeKPIs: totalKPIs,
      },
    ];
  }, [employeeKPIs]);

  // Custom Tooltip for 6-Month Trends BarChart
  const CustomTrendTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-2xl shadow-xl border border-slate-700 text-xs space-y-2 min-w-56 font-sans">
          <div className="flex items-center justify-between border-b border-slate-700/80 pb-1.5">
            <span className="font-bold text-slate-100">{label}</span>
            <span className="text-[10px] text-blue-400 font-mono">LHSE Enterprise</span>
          </div>
          <div className="space-y-1.5 font-mono">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                  <span className="text-slate-300 font-sans">{entry.name}:</span>
                </div>
                <span className="font-bold text-white">{entry.value}%</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // Overall Productivity Metrics
  const stats = useMemo(() => {
    const total = employeeKPIs.length;
    if (total === 0) return { total: 0, avgAchievement: 0, onTrackCount: 0, completedCount: 0, atRiskCount: 0 };

    let totalAchievementPct = 0;
    let onTrack = 0;
    let completed = 0;
    let atRisk = 0;

    employeeKPIs.forEach((kpi) => {
      const pct = kpi.targetValue > 0 ? Math.min(100, Math.round((kpi.currentValue / kpi.targetValue) * 100)) : 0;
      totalAchievementPct += pct;
      if (kpi.status === 'COMPLETED') completed++;
      if (kpi.status === 'ON_TRACK') onTrack++;
      if (kpi.status === 'AT_RISK') atRisk++;
    });

    return {
      total,
      avgAchievement: Math.round(totalAchievementPct / total),
      onTrackCount: onTrack,
      completedCount: completed,
      atRiskCount: atRisk,
    };
  }, [employeeKPIs]);

  // Leaderboard: Top Performers ranked by weighted average achievement
  const leaderboard = useMemo(() => {
    const empScoreMap: { [empId: string]: { totalWeightedPct: number; totalWeight: number; kpiCount: number } } = {};

    employeeKPIs.forEach((kpi) => {
      if (!empScoreMap[kpi.employeeId]) {
        empScoreMap[kpi.employeeId] = { totalWeightedPct: 0, totalWeight: 0, kpiCount: 0 };
      }
      const achievementPct = kpi.targetValue > 0 ? (kpi.currentValue / kpi.targetValue) * 100 : 0;
      empScoreMap[kpi.employeeId].totalWeightedPct += achievementPct * (kpi.weight || 20);
      empScoreMap[kpi.employeeId].totalWeight += (kpi.weight || 20);
      empScoreMap[kpi.employeeId].kpiCount += 1;
    });

    const ranked = Object.entries(empScoreMap).map(([empId, data]) => {
      const emp = employees.find((e) => e.id === empId);
      const dept = departments.find((d) => d.id === emp?.departmentId);
      const score = data.totalWeight > 0 ? Math.min(100, Math.round(data.totalWeightedPct / data.totalWeight)) : 0;
      return {
        employee: emp,
        department: dept,
        score,
        kpiCount: data.kpiCount,
      };
    });

    return ranked.sort((a, b) => b.score - a.score);
  }, [employeeKPIs, employees, departments]);

  // Category Badge helper
  const getCategoryBadge = (category: KPICategory) => {
    switch (category) {
      case 'FINANCIAL':
        return {
          label: language === 'lo' ? 'ການເງິນ & ລາຍຮັບ' : 'Financial',
          color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        };
      case 'OPERATIONAL':
        return {
          label: language === 'lo' ? 'ການດຳເນີນງານ' : 'Operational',
          color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
        };
      case 'QUALITY':
        return {
          label: language === 'lo' ? 'ຄຸນນະພາບ & ມາດຕະຖານ' : 'Quality & SLA',
          color: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800',
        };
      case 'CUSTOMER_SERVICE':
        return {
          label: language === 'lo' ? 'ການບໍລິການ & ລູກຄ້າ' : 'Customer Service',
          color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        };
      case 'INNOVATION':
        return {
          label: language === 'lo' ? 'ນະວັດຕະກຳ & ພັດທະນາ' : 'Innovation & R&D',
          color: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
        };
      default:
        return {
          label: category,
          color: 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
        };
    }
  };

  // Status Badge helper
  const getStatusBadge = (status: KPIStatus) => {
    switch (status) {
      case 'COMPLETED':
        return {
          label: language === 'lo' ? 'ສຳເລັດ 100%' : 'Completed',
          badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300',
          progressClass: 'bg-emerald-500',
        };
      case 'ON_TRACK':
        return {
          label: language === 'lo' ? 'ຕາມແຜນງານ' : 'On Track',
          badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300',
          progressClass: 'bg-blue-600',
        };
      case 'IN_PROGRESS':
        return {
          label: language === 'lo' ? 'ກຳລັງດຳເນີນການ' : 'In Progress',
          badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300',
          progressClass: 'bg-amber-500',
        };
      case 'AT_RISK':
        return {
          label: language === 'lo' ? 'ມີຄວາມສ່ຽງ / ຊັກຊ້າ' : 'At Risk',
          badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300',
          progressClass: 'bg-rose-500',
        };
      case 'NOT_STARTED':
      default:
        return {
          label: language === 'lo' ? 'ຍັງບໍ່ເລີ່ມ' : 'Not Started',
          badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300',
          progressClass: 'bg-slate-400',
        };
    }
  };

  return (
    <div id="performance-kpi-module" className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
      {/* 1. Header with Title & Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
                {language === 'lo' ? 'ການຕິດຕາມປະສິດທິພາບ & ຕົວຊີ້ວັດ KPI' : 'Employee Performance & KPI Tracking'}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                Q4 2026
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'lo'
                ? 'ກຳນົດ, ມອບໝາຍ ແລະ ຕິດຕາມເປົ້າໝາຍການເຮັດວຽກຂອງພະນັກງານແຕ່ລະຄົນ ເພື່ອເພີ່ມປະສິດທິພາບ ແລະ ຄວາມໂປ່ງໃສ'
                : 'Define, assign, and track Key Performance Indicators (KPIs) for individual employees to boost productivity'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {/* Export to CSV Button */}
          <button
            onClick={exportKPIsToCSV}
            className="px-3.5 py-2 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/70 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/80 text-blue-700 dark:text-blue-300 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title={language === 'lo' ? 'ສົ່ງອອກ CSV (UTF-8 BOM ຮອງຮັບພາສາລາວ)' : 'Export to CSV (UTF-8 BOM Lao support)'}
          >
            <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>{language === 'lo' ? 'ສົ່ງອອກ CSV' : 'Export to CSV'}</span>
          </button>
          <button
            onClick={exportKPIsToExcel}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title={language === 'lo' ? 'ສົ່ງອອກ Excel' : 'Export Excel'}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>{language === 'lo' ? 'ສົ່ງອອກ Excel' : 'Export Excel'}</span>
          </button>
          <button
            onClick={() => setIsAssignModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm hover:shadow transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'lo' ? 'ກຳນົດ KPI ໃໝ່' : 'Define & Assign KPI'}</span>
          </button>
        </div>
      </div>

      {/* 2. Overall Productivity KPI Stats Cards (5 Grid) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Assigned */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase block">
              {language === 'lo' ? 'KPI ທັງໝົດ' : 'Total KPIs'}
            </span>
            <div className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100 mt-1">
              {stats.total}
            </div>
            <span className="text-[10px] text-slate-400">{employees.length} {language === 'lo' ? 'ພະນັກງານ' : 'Employees'}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Average Achievement */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase block">
              {language === 'lo' ? 'ອັດຕາບັນລຸສະເລ່ຍ' : 'Avg Achievement'}
            </span>
            <div className="text-2xl font-black font-mono text-blue-600 dark:text-blue-400 mt-1">
              {stats.avgAchievement}%
            </div>
            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> +4.2% vs Q3
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
        </div>

        {/* On Track & Completed */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase block">
              {language === 'lo' ? 'ຕາມແຜນ & ສຳເລັດ' : 'On Track / Done'}
            </span>
            <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
              {stats.onTrackCount + stats.completedCount}
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {stats.completedCount} {language === 'lo' ? 'ສຳເລັດແລ້ວ' : 'completed'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* At Risk */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase block">
              {language === 'lo' ? 'ມີຄວາມສ່ຽງ' : 'At Risk'}
            </span>
            <div className={`text-2xl font-black font-mono mt-1 ${stats.atRiskCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`}>
              {stats.atRiskCount}
            </div>
            <span className="text-[10px] text-slate-400">
              {stats.atRiskCount > 0 ? (language === 'lo' ? 'ຕ້ອງການຄຳແນະນຳ' : 'Needs attention') : 'Healthy pacing'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* Below 50% Threshold Alert Card */}
        <div
          onClick={() => setOnlyUnder50Threshold(!onlyUnder50Threshold)}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
            onlyUnder50Threshold
              ? 'bg-rose-100/80 dark:bg-rose-950/80 border-rose-400 dark:border-rose-700 shadow-sm'
              : 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60 hover:border-rose-400'
          }`}
          title={language === 'lo' ? 'ຄລິກເພື່ອກັ່ນຕອງສະເພາະ KPI ທີ່ຕ່ຳກວ່າ 50%' : 'Click to filter only KPIs < 50%'}
        >
          <div>
            <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400 uppercase flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              {language === 'lo' ? 'ເຕືອນໄພ < 50%' : '< 50% Alert'}
            </span>
            <div className="text-2xl font-black font-mono text-rose-600 dark:text-rose-400 mt-1">
              {under50KPIs.length}
            </div>
            <span className="text-[10px] font-bold text-rose-600 hover:underline">
              {onlyUnder50Threshold
                ? (language === 'lo' ? 'ກຳລັງກັ່ນຕອງ ✓' : 'Filter Active ✓')
                : `${under50Employees.length} ${language === 'lo' ? 'ຄົນຕ່ຳກວ່າເກນ' : 'staff affected'}`}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-200/80 dark:bg-rose-900 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Threshold-Based Alert Banner (< 50% KPI Completion) */}
      {under50KPIs.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-50 via-amber-50 to-orange-50 dark:from-rose-950/60 dark:via-amber-950/40 dark:to-orange-950/40 border-2 border-rose-300 dark:border-rose-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-500/30 animate-pulse">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-bold text-sm text-rose-900 dark:text-rose-200">
                  {language === 'lo'
                    ? 'ແຈ້ງເຕືອນ: ພົບເຫັນພະນັກງານທີ່ຜົນງານຕ່ຳກວ່າເກນ 50% (Threshold Warning)'
                    : 'Performance Alert: Employees Falling Below 50% KPI Completion Threshold'}
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white shadow-2xs font-mono">
                  {under50KPIs.length} {language === 'lo' ? 'ເປົ້າໝາຍມີຄວາມສ່ຽງ' : 'Critical KPIs'}
                </span>
              </div>
              <p className="text-xs text-rose-700 dark:text-rose-300 mt-1 max-w-2xl leading-relaxed">
                {language === 'lo'
                  ? `ມີ ${under50Employees.length} ພະນັກງານ ທີ່ອັດຕາຄວາມຄືບໜ້າຫຼຸດລົງຕ່ຳກວ່າເກນມາດຕະຖານ 50% ຕ້ອງການການແນະນຳ, ປັບປຸງແຜນງານ ຫຼື ການຊ່ວຍເຫຼືອຈາກຫົວໜ້າພະແນກດ່ວນ.`
                  : `${under50Employees.length} employee(s) have fallen below the critical 50% milestone. Managerial intervention and coaching are recommended.`}
              </p>
              {/* Employee Quick Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                <span className="text-[10px] font-bold text-rose-800 dark:text-rose-300 uppercase">
                  {language === 'lo' ? 'ພະນັກງານທີ່ກ່ຽວຂ້ອງ:' : 'Affected Employees:'}
                </span>
                {under50Employees.map((emp) => (
                  <button
                    key={emp.id}
                    onClick={() => {
                      setSelectedEmployee(emp.id);
                      setOnlyUnder50Threshold(false);
                    }}
                    className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer flex items-center gap-1 border ${
                      selectedEmployee === emp.id
                        ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                        : 'bg-white dark:bg-slate-900 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 hover:bg-rose-100 dark:hover:bg-rose-900'
                    }`}
                  >
                    <span>{emp.employeeCode}</span>
                    <span>{language === 'lo' ? emp.firstNameLao : emp.firstNameEn}</span>
                    <span className="bg-rose-200 dark:bg-rose-800 text-rose-900 dark:text-rose-100 px-1 rounded text-[9px]">
                      {emp.under50Count} KPIs
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
            <button
              onClick={() => setOnlyUnder50Threshold(!onlyUnder50Threshold)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                onlyUnder50Threshold
                  ? 'bg-rose-600 text-white hover:bg-rose-700 ring-2 ring-rose-400'
                  : 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>
                {onlyUnder50Threshold
                  ? language === 'lo' ? 'ສະແດງທັງໝົດ' : 'Show All KPIs'
                  : language === 'lo' ? 'ກັ່ນຕອງສະເພາະ < 50%' : 'Filter < 50% Only'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* 6-Month Historical KPI Trends Line Chart (Recharts) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-bold text-xs uppercase text-slate-900 dark:text-slate-100 tracking-wide">
                  {language === 'lo'
                    ? 'ແນວໂນ້ມປະສິດທິພາບ KPI ຍ້ອນຫຼັງ 6 ເດືອນ (Recharts Historical Bar Chart)'
                    : '6-Month Historical KPI Performance Trends (All Employees)'}
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  May 2026 – Oct 2026
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'lo'
                  ? 'ກຣາຟແທ່ງສະແດງການພັດທະນາຂອງອັດຕາບັນລຸຜົນສະເລ່ຍອົງກອນ, ກຸ່ມພະນັກງານດີເດັ່ນ, ແລະ ເສັ້ນເກນແຈ້ງເຕືອນ 50%'
                  : 'Recharts bar chart tracking company average, top quartile performers, and critical alert threshold (< 50%)'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              Target: 80%
            </span>
            <span className="text-[10px] font-mono text-rose-600 bg-rose-50 dark:bg-rose-950 px-2 py-1 rounded-lg border border-rose-200 dark:border-rose-900 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
              Alert: 50%
            </span>
            <button
              onClick={() => setShowHistoricalChart(!showHistoricalChart)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors cursor-pointer"
              title={showHistoricalChart ? 'Collapse chart' : 'Expand chart'}
            >
              {showHistoricalChart ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Recharts BarChart */}
        {showHistoricalChart && (
          <div className="w-full h-72 sm:h-80 pt-2 animate-in fade-in duration-300">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={historicalTrendsData} margin={{ top: 10, right: 25, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.2} />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} unit="%" />
                <Tooltip content={<CustomTrendTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
                />
                <ReferenceLine y={80} stroke="#10b981" strokeDasharray="4 4" label={{ value: 'Target 80%', fill: '#10b981', fontSize: 10, position: 'insideTopRight' }} />
                <ReferenceLine y={50} stroke="#f43f5e" strokeDasharray="4 4" label={{ value: 'Alert 50%', fill: '#f43f5e', fontSize: 10, position: 'insideBottomRight' }} />
                <Bar
                  dataKey="companyAvg"
                  name={language === 'lo' ? 'ອັດຕາສະເລ່ຍອົງກອນ (Company Avg)' : 'Company Avg (%)'}
                  fill="#2563eb"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="topQuartile"
                  name={language === 'lo' ? 'ພະນັກງານດີເດັ່ນ (Top Quartile)' : 'Top Performers (%)'}
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="trailingThreshold"
                  name={language === 'lo' ? 'ກຸ່ມຕ່ຳກວ່າເກນ (<50% Trailing)' : 'Below 50% Avg (%)'}
                  fill="#f43f5e"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 3. Filter Toolbar & Search */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Employee Dropdown */}
          <div className="relative">
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              aria-label={language === 'lo' ? 'ເລືອກພະນັກງານ' : 'Select Employee'}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="ALL">{language === 'lo' ? 'ທຸກພະນັກງານ (10 ຄົນ)' : 'All Employees (10 Staff)'}</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.employeeCode} - {emp.firstNameLao} {emp.lastNameLao} ({emp.firstNameEn})
                </option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div className="relative">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              aria-label={language === 'lo' ? 'ເລືອກພະແນກ' : 'Select Department'}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="ALL">{language === 'lo' ? 'ທຸກພະແນກ' : 'All Departments'}</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.nameLao}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              aria-label={language === 'lo' ? 'ເລືອກສະຖານະ' : 'Select Status'}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="ALL">{language === 'lo' ? 'ທຸກສະຖານະ' : 'All Statuses'}</option>
              <option value="ON_TRACK">{language === 'lo' ? 'ຕາມແຜນງານ (On Track)' : 'On Track'}</option>
              <option value="COMPLETED">{language === 'lo' ? 'ສຳເລັດແລ້ວ (Completed)' : 'Completed'}</option>
              <option value="IN_PROGRESS">{language === 'lo' ? 'ກຳລັງດຳເນີນການ (In Progress)' : 'In Progress'}</option>
              <option value="AT_RISK">{language === 'lo' ? 'ມີຄວາມສ່ຽງ (At Risk)' : 'At Risk'}</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              aria-label={language === 'lo' ? 'ເລືອກໝວດໝູ່' : 'Select Category'}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="ALL">{language === 'lo' ? 'ທຸກໝວດໝູ່' : 'All Categories'}</option>
              <option value="OPERATIONAL">{language === 'lo' ? 'ການດຳເນີນງານ (Operational)' : 'Operational'}</option>
              <option value="FINANCIAL">{language === 'lo' ? 'ການເງິນ (Financial)' : 'Financial'}</option>
              <option value="QUALITY">{language === 'lo' ? 'ຄຸນນະພາບ & SLA (Quality)' : 'Quality'}</option>
              <option value="CUSTOMER_SERVICE">{language === 'lo' ? 'ລູກຄ້າ & ບໍລິການ (Customer)' : 'Customer Service'}</option>
              <option value="INNOVATION">{language === 'lo' ? 'ນະວັດຕະກຳ (Innovation)' : 'Innovation'}</option>
            </select>
          </div>

          {/* Threshold < 50% quick toggle filter */}
          <button
            onClick={() => setOnlyUnder50Threshold(!onlyUnder50Threshold)}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 border ${
              onlyUnder50Threshold
                ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-rose-400'
            }`}
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${onlyUnder50Threshold ? 'text-white' : 'text-rose-500'}`} />
            <span>{language === 'lo' ? 'ຕ່ຳກວ່າເກນ 50%' : '< 50% Alert'}</span>
            {under50KPIs.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                onlyUnder50Threshold ? 'bg-rose-800 text-white' : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
              }`}>
                {under50KPIs.length}
              </span>
            )}
          </button>
        </div>

        {/* Real-Time Search & View Mode Toggle */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                language === 'lo'
                  ? 'ຄົ້ນຫາຊື່ພະນັກງານ, ພະແນກ, ລະຫັດ ຫຼື KPI...'
                  : 'Search employee name, department, or KPI...'
              }
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-8 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-0.5 shrink-0">
            <button
              onClick={() => setViewMode('CARDS')}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                viewMode === 'CARDS'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {language === 'lo' ? 'ບັດ' : 'Cards'}
            </button>
            <button
              onClick={() => setViewMode('TABLE')}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                viewMode === 'TABLE'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {language === 'lo' ? 'ຕາຕະລາງ' : 'Table'}
            </button>
          </div>
        </div>
      </div>

      {/* 4. Main Section: KPI List + Productivity Insights Sidebar */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left 2 Columns: KPI Cards or Table */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
            <span>
              {language === 'lo' ? 'ລາຍການຕົວຊີ້ວັດຜົນງານ' : 'Key Performance Indicators'} ({filteredKPIs.length})
            </span>
            <span className="text-[11px] text-slate-400">
              {language === 'lo' ? 'ຄລິກ "ອັບເດດ" ເພື່ອບັນທຶກຄວາມຄືບໜ້າ' : 'Click "Update" to track progress'}
            </span>
          </div>

          {filteredKPIs.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-slate-400 space-y-2">
              <Target className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="font-bold text-sm text-slate-600 dark:text-slate-300">
                {language === 'lo' ? 'ບໍ່ພົບຕົວຊີ້ວັດ KPI ທີ່ກົງກັບເງື່ອນໄຂ' : 'No KPIs match your criteria'}
              </p>
              <p className="text-xs">
                {language === 'lo'
                  ? 'ທ່ານສາມາດລອງປັບປ່ຽນຕົວກອງ ຫຼື ກົດປຸ່ມ "ກຳນົດ KPI ໃໝ່"'
                  : 'Adjust filters or click "Define & Assign KPI" above'}
              </p>
            </div>
          ) : viewMode === 'CARDS' ? (
            /* Cards View */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredKPIs.map((kpi) => {
                const emp = employees.find((e) => e.id === kpi.employeeId);
                const dept = departments.find((d) => d.id === emp?.departmentId);
                const achievementPct = kpi.targetValue > 0 ? Math.round((kpi.currentValue / kpi.targetValue) * 100) : 0;
                const catBadge = getCategoryBadge(kpi.category);
                const statusBadge = getStatusBadge(kpi.status);
                const isUnder50 = achievementPct < 50;
                const isExpanded = expandedKPIIds.has(kpi.id);
                const subGoals = getKPISubGoals(kpi);
                const completedSubCount = subGoals.filter((s) => s.completed).length;

                return (
                  <div
                    key={kpi.id}
                    className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border transition-all shadow-xs hover:shadow space-y-3.5 flex flex-col justify-between ${
                      isUnder50
                        ? 'border-rose-300 dark:border-rose-900/80 bg-rose-50/20 dark:bg-rose-950/10'
                        : 'border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600'
                    }`}
                  >
                    {/* Top Row: Employee + Department + Category Badge */}
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl font-mono font-bold text-xs flex items-center justify-center shrink-0 text-white ${
                          isUnder50 ? 'bg-gradient-to-br from-rose-600 to-amber-600' : 'bg-gradient-to-br from-blue-600 to-indigo-700'
                        }`}>
                          {emp ? emp.employeeCode.slice(-3) : 'LH'}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-900 dark:text-slate-100 line-clamp-1">
                            {emp ? `${emp.firstNameLao} ${emp.lastNameLao}` : kpi.employeeId}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {emp?.employeeCode} • {dept?.nameLao || 'ພະແນກ'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isUnder50 && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800 flex items-center gap-1 animate-pulse">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            &lt; 50% Alert
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${catBadge.color}`}>
                          {catBadge.label}
                        </span>
                      </div>
                    </div>

                    {/* Middle: Title & Period & Weight */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                        <span>{kpi.period}</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          {language === 'lo' ? 'ນ້ຳໜັກ' : 'Weight'}: {kpi.weight}%
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 leading-snug">
                        {language === 'lo' && kpi.titleLao ? kpi.titleLao : kpi.title}
                      </h4>
                      {kpi.description && (
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                          {kpi.description}
                        </p>
                      )}
                    </div>

                    {/* Interactive Progress Bar & Value Display with Click to Show Sub-Goals */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-baseline justify-between text-xs font-mono">
                        <span className="text-slate-500 text-[11px] flex items-center gap-1">
                          {language === 'lo' ? 'ຄວາມຄືບໜ້າເປົ້າໝາຍ' : 'Goal Completion'}
                        </span>
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          <span className={`text-sm font-black ${isUnder50 ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400'}`}>
                            {kpi.currentValue.toLocaleString()}
                          </span>
                          <span className="text-slate-400 text-xs"> / {kpi.targetValue.toLocaleString()} {kpi.unit}</span>
                          <span className={`ml-1.5 font-bold text-xs ${isUnder50 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'}`}>
                            ({achievementPct}%)
                          </span>
                        </div>
                      </div>

                      {/* Clickable Progress Bar Container with Tooltip/Affordance */}
                      <div
                        onClick={() => toggleExpandKPI(kpi.id)}
                        className={`group relative w-full bg-slate-100 dark:bg-slate-800 h-3.5 rounded-full overflow-hidden p-0.5 border cursor-pointer transition-all hover:ring-2 hover:ring-blue-400 dark:hover:ring-blue-500 ${
                          isUnder50
                            ? 'border-rose-300 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20'
                            : 'border-slate-200/60 dark:border-slate-700/60'
                        }`}
                        title={
                          isExpanded
                            ? language === 'lo' ? 'ຄລິກເພື່ອເຊື່ອງເປົ້າໝາຍຍ່ອຍ' : 'Click to hide sub-goals'
                            : language === 'lo' ? 'ຄລິກແຖບຄວາມຄືບໜ້າເພື່ອເບິ່ງເປົ້າໝາຍຍ່ອຍ' : 'Click progress bar to show nested sub-goals'
                        }
                      >
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isUnder50
                              ? 'bg-gradient-to-r from-rose-500 to-rose-600'
                              : statusBadge.progressClass
                          }`}
                          style={{ width: `${Math.min(100, Math.max(3, achievementPct))}%` }}
                        />
                      </div>

                      {/* Clickable toggle button row for sub-goals */}
                      <button
                        type="button"
                        onClick={() => toggleExpandKPI(kpi.id)}
                        className="w-full flex items-center justify-between text-[11px] font-bold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors py-0.5 cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5">
                          <ListTodo className="w-3.5 h-3.5 text-blue-500" />
                          <span>
                            {completedSubCount}/{subGoals.length} {language === 'lo' ? 'ເປົ້າໝາຍຍ່ອຍ (ຄລິກແຖບເພື່ອເປີດ)' : 'Sub-goals (click bar to view)'}
                          </span>
                        </span>
                        <span className="flex items-center gap-0.5 text-blue-600 dark:text-blue-400 text-[10px]">
                          {isExpanded ? (language === 'lo' ? 'ເຊື່ອງ' : 'Hide') : (language === 'lo' ? 'ເບິ່ງລາຍລະອຽດ' : 'Expand')}
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </span>
                      </button>
                    </div>

                    {/* Nested Sub-Goals Breakdown View (Shown when progress bar is clicked) */}
                    {isExpanded && (
                      <div className="p-3.5 rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
                        <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-slate-700/70 pb-2">
                          <div className="flex items-center gap-1.5 font-bold text-[11px] text-slate-800 dark:text-slate-200">
                            <ListTodo className="w-3.5 h-3.5 text-blue-600" />
                            <span>{language === 'lo' ? 'ເປົ້າໝາຍຍ່ອຍປະກອບສ່ວນ (Contributing Sub-Goals)' : 'Nested Sub-Goals'}</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-500 font-bold">
                            {completedSubCount} / {subGoals.length} {language === 'lo' ? 'ສຳເລັດ' : 'done'}
                          </span>
                        </div>

                        <div className="space-y-2">
                          {subGoals.map((sg) => {
                            const sgPct = sg.targetValue > 0 ? Math.min(100, Math.round((sg.currentValue / sg.targetValue) * 100)) : 0;
                            return (
                              <div
                                key={sg.id}
                                className={`p-2.5 rounded-xl border transition-all text-xs space-y-1.5 ${
                                  sg.completed
                                    ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60'
                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700/80'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-start gap-2 min-w-0">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleSubGoal(kpi, sg.id, sg.completed)}
                                      className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 mt-0.5 border cursor-pointer transition-colors ${
                                        sg.completed
                                          ? 'bg-emerald-600 border-emerald-600 text-white'
                                          : 'border-slate-300 dark:border-slate-600 hover:border-blue-500 bg-white dark:bg-slate-800'
                                      }`}
                                      title={sg.completed ? 'Mark incomplete' : 'Mark completed'}
                                    >
                                      {sg.completed && <Check className="w-3 h-3 stroke-[3]" />}
                                    </button>
                                    <div className="min-w-0">
                                      <p className={`font-bold text-[11px] leading-tight ${sg.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-slate-100'}`}>
                                        {language === 'lo' && sg.titleLao ? sg.titleLao : sg.title}
                                      </p>
                                      <span className="text-[9px] text-slate-400 font-mono">
                                        Weight: {sg.weight}%
                                      </span>
                                    </div>
                                  </div>

                                  <div className="text-right shrink-0 font-mono text-[11px]">
                                    <span className="font-bold text-slate-800 dark:text-slate-200">
                                      {sg.currentValue.toLocaleString()} / {sg.targetValue.toLocaleString()} {sg.unit || kpi.unit}
                                    </span>
                                    <span className="ml-1 text-[10px] text-blue-600 dark:text-blue-400 font-bold">
                                      ({sgPct}%)
                                    </span>
                                  </div>
                                </div>

                                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-300 ${
                                      sg.completed ? 'bg-emerald-500' : sgPct < 50 ? 'bg-rose-500' : 'bg-blue-600'
                                    }`}
                                    style={{ width: `${Math.min(100, Math.max(3, sgPct))}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Manager Feedback Note (if present) */}
                    {kpi.managerFeedback && (
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                        <MessageSquare className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                        <p className="italic line-clamp-2">{kpi.managerFeedback}</p>
                      </div>
                    )}

                    {/* Footer: Status Badge + Action Buttons */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge.badgeClass}`}>
                          {statusBadge.label}
                        </span>
                        {isUnder50 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                            {language === 'lo' ? 'ຕ່ຳກວ່າເກນ 50%' : '< 50% Threshold'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenUpdateModal(kpi)}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>{language === 'lo' ? 'ອັບເດດ' : 'Update'}</span>
                        </button>
                        <button
                          onClick={() => handleDeleteKPI(kpi)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                          title={language === 'lo' ? 'ລຶບ KPI' : 'Delete KPI'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table View with Clickable Progress Bar & Nested Sub-Goals Row */
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] text-slate-500 uppercase font-bold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-4 py-3">{language === 'lo' ? 'ພະນັກງານ' : 'Employee'}</th>
                      <th className="px-4 py-3">{language === 'lo' ? 'ຕົວຊີ້ວັດ KPI' : 'Metric & Target'}</th>
                      <th className="px-4 py-3">{language === 'lo' ? 'ໝວດໝູ່' : 'Category'}</th>
                      <th className="px-4 py-3 text-right">{language === 'lo' ? 'ຄວາມຄືບໜ້າ (ຄລິກແຖບ)' : 'Progress (Click Bar)'}</th>
                      <th className="px-4 py-3 text-center">{language === 'lo' ? 'ສະຖານະ' : 'Status'}</th>
                      <th className="px-4 py-3 text-right">{language === 'lo' ? 'ຈັດການ' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {filteredKPIs.map((kpi) => {
                      const emp = employees.find((e) => e.id === kpi.employeeId);
                      const dept = departments.find((d) => d.id === emp?.departmentId);
                      const achievementPct = kpi.targetValue > 0 ? Math.round((kpi.currentValue / kpi.targetValue) * 100) : 0;
                      const catBadge = getCategoryBadge(kpi.category);
                      const statusBadge = getStatusBadge(kpi.status);
                      const isUnder50 = achievementPct < 50;
                      const isExpanded = expandedKPIIds.has(kpi.id);
                      const subGoals = getKPISubGoals(kpi);
                      const completedCount = subGoals.filter((s) => s.completed).length;

                      return (
                        <React.Fragment key={kpi.id}>
                          <tr className={`transition-colors ${isExpanded ? 'bg-blue-50/30 dark:bg-blue-950/20' : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'}`}>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className={`w-7 h-7 rounded-lg text-white font-mono font-bold text-[10px] flex items-center justify-center shrink-0 ${
                                  isUnder50 ? 'bg-rose-600' : 'bg-blue-600'
                                }`}>
                                  {emp ? emp.employeeCode.slice(-3) : 'LH'}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-900 dark:text-slate-100">
                                    {emp ? `${emp.firstNameLao} ${emp.lastNameLao}` : kpi.employeeId}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-mono">
                                    {emp?.employeeCode} • {dept?.nameLao}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900 dark:text-slate-100 max-w-xs truncate">
                                  {language === 'lo' && kpi.titleLao ? kpi.titleLao : kpi.title}
                                </span>
                                {isUnder50 && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800 flex items-center gap-0.5 animate-pulse shrink-0">
                                    <AlertTriangle className="w-2.5 h-2.5" />
                                    &lt; 50%
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                {kpi.period} • {language === 'lo' ? 'ນ້ຳໜັກ' : 'Weight'}: {kpi.weight}% • Due: {kpi.dueDate}
                              </div>
                            </td>

                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${catBadge.color}`}>
                                {catBadge.label}
                              </span>
                            </td>

                            {/* Clickable Progress Bar Cell with Detailed Sub-Goals Toggle */}
                            <td className="px-4 py-3.5 text-right whitespace-nowrap font-mono">
                              <div
                                onClick={() => toggleExpandKPI(kpi.id)}
                                className="cursor-pointer group inline-block text-right"
                                title={language === 'lo' ? 'ຄລິກແຖບຄວາມຄືບໜ້າເພື່ອເບິ່ງເປົ້າໝາຍຍ່ອຍ' : 'Click progress bar to show nested sub-goals'}
                              >
                                <div className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors">
                                  {kpi.currentValue.toLocaleString()} / {kpi.targetValue.toLocaleString()} {kpi.unit}
                                </div>
                                <div className="flex items-center justify-end gap-1.5 mt-0.5">
                                  <div className="w-20 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
                                    <div
                                      className={`h-full rounded-full transition-all duration-300 ${
                                        isUnder50 ? 'bg-rose-500' : statusBadge.progressClass
                                      }`}
                                      style={{ width: `${Math.min(100, Math.max(3, achievementPct))}%` }}
                                    />
                                  </div>
                                  <span className={`text-[11px] font-bold ${isUnder50 ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                    {achievementPct}%
                                  </span>
                                </div>
                                <div className="text-[9px] text-blue-500 dark:text-blue-400 font-sans flex items-center justify-end gap-0.5 mt-0.5">
                                  <span>{completedCount}/{subGoals.length} {language === 'lo' ? 'ເປົ້າໝາຍຍ່ອຍ' : 'sub-goals'}</span>
                                  {isExpanded ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-3.5 text-center whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge.badgeClass}`}>
                                {statusBadge.label}
                              </span>
                            </td>

                            <td className="px-4 py-3.5 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleOpenUpdateModal(kpi)}
                                  className="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold text-[10px] transition-colors cursor-pointer"
                                >
                                  {language === 'lo' ? 'ອັບເດດ' : 'Update'}
                                </button>
                                <button
                                  onClick={() => handleDeleteKPI(kpi)}
                                  className="p-1 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Nested Sub-Goals Expanded Row */}
                          {isExpanded && (
                            <tr className="bg-slate-50/80 dark:bg-slate-800/50">
                              <td colSpan={6} className="px-6 py-4">
                                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/60 space-y-3 shadow-xs">
                                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                                    <div className="flex items-center gap-2">
                                      <ListTodo className="w-4 h-4 text-blue-600" />
                                      <h5 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                                        {language === 'lo' ? 'ເປົ້າໝາຍຍ່ອຍທີ່ປະກອບສ່ວນໃຫ້ກັບ KPI ນີ້' : 'Detailed Sub-Goals Contributing to this KPI'}
                                      </h5>
                                      <span className="text-[10px] text-slate-400 font-mono">
                                        ({completedCount} / {subGoals.length} {language === 'lo' ? 'ສຳເລັດ' : 'completed'})
                                      </span>
                                    </div>
                                    <button
                                      onClick={() => toggleExpandKPI(kpi.id)}
                                      className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
                                    >
                                      ✕ {language === 'lo' ? 'ປິດ' : 'Close'}
                                    </button>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {subGoals.map((sg) => {
                                      const sgPct = sg.targetValue > 0 ? Math.min(100, Math.round((sg.currentValue / sg.targetValue) * 100)) : 0;
                                      return (
                                        <div
                                          key={sg.id}
                                          className={`p-3 rounded-xl border space-y-2 transition-all ${
                                            sg.completed
                                              ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900'
                                              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                                          }`}
                                        >
                                          <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-start gap-2 min-w-0">
                                              <button
                                                type="button"
                                                onClick={() => handleToggleSubGoal(kpi, sg.id, sg.completed)}
                                                className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 mt-0.5 border cursor-pointer transition-colors ${
                                                  sg.completed
                                                    ? 'bg-emerald-600 border-emerald-600 text-white'
                                                    : 'border-slate-300 dark:border-slate-600 hover:border-blue-500 bg-white dark:bg-slate-900'
                                                }`}
                                                title={sg.completed ? 'Mark incomplete' : 'Mark complete'}
                                              >
                                                {sg.completed && <Check className="w-3 h-3 stroke-[3]" />}
                                              </button>
                                              <div className="min-w-0">
                                                <p className={`font-bold text-xs leading-snug ${sg.completed ? 'line-through text-slate-400' : 'text-slate-900 dark:text-slate-100'}`}>
                                                  {language === 'lo' && sg.titleLao ? sg.titleLao : sg.title}
                                                </p>
                                                <span className="text-[10px] text-slate-400 font-mono">
                                                  Weight: {sg.weight}%
                                                </span>
                                              </div>
                                            </div>
                                          </div>

                                          <div className="flex items-center justify-between text-[11px] font-mono">
                                            <span className="text-slate-500">
                                              {sg.currentValue.toLocaleString()} / {sg.targetValue.toLocaleString()} {sg.unit || kpi.unit}
                                            </span>
                                            <span className={`font-bold ${sg.completed ? 'text-emerald-600' : 'text-blue-600 dark:text-blue-400'}`}>
                                              {sgPct}%
                                            </span>
                                          </div>

                                          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                            <div
                                              className={`h-full rounded-full transition-all duration-300 ${
                                                sg.completed ? 'bg-emerald-500' : sgPct < 50 ? 'bg-rose-500' : 'bg-blue-600'
                                              }`}
                                              style={{ width: `${Math.min(100, Math.max(3, sgPct))}%` }}
                                            />
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Column: Leaderboard & Productivity Insights */}
        <div className="space-y-4">
          {/* Top Performers Leaderboard */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <h4 className="font-bold text-xs uppercase text-slate-900 dark:text-slate-100">
                  {language === 'lo' ? 'ຈັດອັນດັບພະນັກງານດີເດັ່ນ (Top Performers)' : 'Top Performers Leaderboard'}
                </h4>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Weighted %</span>
            </div>

            <div className="space-y-2.5">
              {leaderboard.slice(0, 5).map((item, index) => {
                const medalColors = [
                  'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-300',
                  'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300',
                  'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300 border-orange-300',
                ];

                return (
                  <div
                    key={item.employee?.id || index}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-6 h-6 rounded-lg font-mono font-bold text-xs flex items-center justify-center shrink-0 border ${
                          medalColors[index] || 'bg-slate-50 text-slate-500 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                          {item.employee ? `${item.employee.firstNameLao} ${item.employee.lastNameLao}` : 'Employee'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono truncate">
                          {item.employee?.employeeCode} • {item.department?.nameLao}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-black font-mono text-xs text-emerald-600 dark:text-emerald-400">
                        {item.score}%
                      </div>
                      <span className="text-[9px] text-slate-400 font-mono">
                        {item.kpiCount} {language === 'lo' ? 'ເປົ້າໝາຍ' : 'targets'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Departmental KPI Health */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <h4 className="font-bold text-xs uppercase text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>{language === 'lo' ? 'ສະຫຼຸບ KPI ຕາມພະແນກ' : 'KPI Health by Department'}</span>
            </h4>

            <div className="space-y-2.5">
              {departments.map((dept) => {
                const deptKPIs = employeeKPIs.filter((k) => {
                  const emp = employees.find((e) => e.id === k.employeeId);
                  return emp?.departmentId === dept.id;
                });
                const deptScore = deptKPIs.length > 0
                  ? Math.round(
                      deptKPIs.reduce((sum, k) => sum + (k.targetValue > 0 ? (k.currentValue / k.targetValue) * 100 : 0), 0) /
                        deptKPIs.length
                    )
                  : 0;

                return (
                  <div key={dept.id} className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
                        {dept.nameLao}
                      </span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {deptScore}% ({deptKPIs.length} KPIs)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          deptScore >= 80 ? 'bg-emerald-500' : deptScore >= 60 ? 'bg-blue-600' : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(3, deptScore))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Define & Assign KPI Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  {language === 'lo' ? 'ກຳນົດ ແລະ ມອບໝາຍ KPI ໃຫ້ພະນັກງານ' : 'Define & Assign Employee KPI'}
                </h3>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateKPI} className="space-y-4 text-xs">
              {/* Employee Selection */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'lo' ? 'ເລືອກພະນັກງານ' : 'Target Employee'} *
                </label>
                <select
                  value={formEmployeeId}
                  onChange={(e) => setFormEmployeeId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.employeeCode} - {emp.firstNameLao} {emp.lastNameLao} ({emp.firstNameEn})
                    </option>
                  ))}
                </select>
              </div>

              {/* KPI Title (English & Lao) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'lo' ? 'ຫົວຂໍ້ KPI (ພາສາອັງກິດ)' : 'KPI Title (English)'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Q4 Revenue Target Acquisition"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'lo' ? 'ຫົວຂໍ້ KPI (ພາສາລາວ)' : 'KPI Title (Lao)'}
                  </label>
                  <input
                    type="text"
                    value={formTitleLao}
                    onChange={(e) => setFormTitleLao(e.target.value)}
                    placeholder="ຕົວຢ່າງ: ການບັນລຸລາຍຮັບໄຕຣມາດ 4"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Category & Period */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'lo' ? 'ໝວດໝູ່' : 'Category'}
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as KPICategory)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="OPERATIONAL">Operational (ການດຳເນີນງານ)</option>
                    <option value="FINANCIAL">Financial (ການເງິນ & ລາຍຮັບ)</option>
                    <option value="QUALITY">Quality & SLA (ຄຸນນະພາບ)</option>
                    <option value="CUSTOMER_SERVICE">Customer Service (ການບໍລິການ)</option>
                    <option value="INNOVATION">Innovation (ນະວັດຕະກຳ)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'lo' ? 'ຮອບໄລຍະເວລາ' : 'Evaluation Period'}
                  </label>
                  <input
                    type="text"
                    value={formPeriod}
                    onChange={(e) => setFormPeriod(e.target.value)}
                    placeholder="Q4 2026"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              {/* Target Value, Current Value, Unit */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'lo' ? 'ເປົ້າໝາຍ (Target)' : 'Target Value'} *
                  </label>
                  <input
                    type="number"
                    required
                    value={formTargetValue}
                    onChange={(e) => setFormTargetValue(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'lo' ? 'ປັດຈຸບັນ (Current)' : 'Initial Progress'}
                  </label>
                  <input
                    type="number"
                    value={formCurrentValue}
                    onChange={(e) => setFormCurrentValue(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'lo' ? 'ຫົວໜ່ວຍ (Unit)' : 'Unit'}
                  </label>
                  <input
                    type="text"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    placeholder="%, LAK, Tasks..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              {/* Weight & Due Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'lo' ? 'ນ້ຳໜັກ (%)' : 'Weight (%)'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formWeight}
                    onChange={(e) => setFormWeight(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'lo' ? 'ກຳນົດສົ່ງ (Due Date)' : 'Due Date'}
                  </label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'lo' ? 'ຄຳອະທິບາຍ & ເງື່ອນໄຂການວັດແທກ' : 'Description & Scope'}
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder={language === 'lo' ? 'ລາຍລະອຽດເປົ້າໝາຍ ແລະ ສິ່ງທີ່ຄາດຫວັງ...' : 'Key deliverables and evaluation criteria...'}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  {language === 'lo' ? 'ຍົກເລີກ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm transition-colors cursor-pointer"
                >
                  {language === 'lo' ? 'ບັນທຶກ & ມອບໝາຍ' : 'Assign KPI'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Update Progress Modal */}
      {isUpdateModalOpen && kpiToUpdate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  {language === 'lo' ? 'ອັບເດດຄວາມຄືບໜ້າ KPI' : 'Update KPI Progress'}
                </h3>
              </div>
              <button
                onClick={() => setIsUpdateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 space-y-1">
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">
                {kpiToUpdate.period} • Target: {kpiToUpdate.targetValue.toLocaleString()} {kpiToUpdate.unit}
              </span>
              <p className="font-bold text-xs text-slate-900 dark:text-slate-100">
                {language === 'lo' && kpiToUpdate.titleLao ? kpiToUpdate.titleLao : kpiToUpdate.title}
              </p>
            </div>

            <form onSubmit={handleSaveProgress} className="space-y-4 text-xs">
              {/* Current Value with live percentage calculation */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    {language === 'lo' ? 'ຄ່າຄວາມຄືບໜ້າໃໝ່' : 'New Current Value'} ({kpiToUpdate.unit}) *
                  </label>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                    {kpiToUpdate.targetValue > 0
                      ? `${Math.round((Number(updateCurrentValue) / kpiToUpdate.targetValue) * 100)}%`
                      : '0%'}
                  </span>
                </div>
                <input
                  type="number"
                  step="any"
                  required
                  value={updateCurrentValue}
                  onChange={(e) => setUpdateCurrentValue(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                />

                {/* Quick Increment Buttons */}
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-400 font-medium">{language === 'lo' ? 'ປັບດ່ວນ:' : 'Quick adjust:'}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const next = Math.min(kpiToUpdate.targetValue, updateCurrentValue + kpiToUpdate.targetValue * 0.1);
                      setUpdateCurrentValue(Math.round(next * 10) / 10);
                    }}
                    className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[10px] font-bold transition-colors cursor-pointer"
                  >
                    +10%
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const next = Math.min(kpiToUpdate.targetValue, updateCurrentValue + kpiToUpdate.targetValue * 0.25);
                      setUpdateCurrentValue(Math.round(next * 10) / 10);
                    }}
                    className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[10px] font-bold transition-colors cursor-pointer"
                  >
                    +25%
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUpdateCurrentValue(kpiToUpdate.targetValue);
                      setUpdateStatus('COMPLETED');
                    }}
                    className="px-2 py-0.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 font-mono text-[10px] font-bold transition-colors cursor-pointer"
                  >
                    100% {language === 'lo' ? 'ສຳເລັດ' : 'Done'}
                  </button>
                </div>
              </div>

              {/* Status Select */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'lo' ? 'ສະຖານະປະເມີນ' : 'Current Pacing Status'}
                </label>
                <select
                  value={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.value as KPIStatus)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <option value="ON_TRACK">{language === 'lo' ? 'ຕາມແຜນງານ (On Track)' : 'On Track'}</option>
                  <option value="COMPLETED">{language === 'lo' ? 'ສຳເລັດ 100% (Completed)' : 'Completed'}</option>
                  <option value="IN_PROGRESS">{language === 'lo' ? 'ກຳລັງດຳເນີນການ (In Progress)' : 'In Progress'}</option>
                  <option value="AT_RISK">{language === 'lo' ? 'ມີຄວາມສ່ຽງ / ຊັກຊ້າ (At Risk)' : 'At Risk'}</option>
                  <option value="NOT_STARTED">{language === 'lo' ? 'ຍັງບໍ່ເລີ່ມ (Not Started)' : 'Not Started'}</option>
                </select>
              </div>

              {/* Manager Feedback */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'lo' ? 'ຄຳແນະນຳ & ຂໍ້ສັງເກດຂອງຜູ້ຈັດການ' : 'Manager Feedback & Guidance'}
                </label>
                <textarea
                  rows={3}
                  value={updateFeedback}
                  onChange={(e) => setUpdateFeedback(e.target.value)}
                  placeholder={language === 'lo' ? 'ຂຽນຄຳແນະນຳເພື່ອຊ່ວຍພະນັກງານບັນລຸເປົ້າໝາຍ...' : 'Provide feedback or coaching notes for this milestone...'}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUpdateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  {language === 'lo' ? 'ຍົກເລີກ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm transition-colors cursor-pointer"
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
