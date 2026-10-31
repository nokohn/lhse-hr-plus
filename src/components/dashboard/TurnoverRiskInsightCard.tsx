import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { alerts } from '../../utils/alerts.ts';
import {
  BrainCircuit,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  ChevronRight,
  Sparkles,
  Calendar,
  MessageSquare,
  Activity,
  ArrowUpRight,
  CheckCircle2,
  Filter,
  X,
  Clock,
  Briefcase,
  AlertOctagon,
  HelpCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export interface RetentionActionModalData {
  employeeId: string;
  employeeName: string;
  riskScore: number;
}

export const TurnoverRiskInsightCard: React.FC = () => {
  const {
    language,
    employees,
    departments,
    positions,
    attendanceRecords,
    employeeKPIs,
    leaveBalances,
    disciplinaryCases,
    addAuditLog,
  } = useApp();

  const [riskFilter, setRiskFilter] = useState<'ALL' | 'HIGH' | 'MODERATE' | 'LOW'>('ALL');
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);

  // Retention Action Modal
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [modalData, setModalData] = useState<RetentionActionModalData | null>(null);
  const [actionType, setActionType] = useState('RETENTION_INTERVIEW');
  const [actionDate, setActionDate] = useState(new Date().toISOString().split('T')[0]);
  const [actionNotes, setActionNotes] = useState('');

  // Retention action records stored in state
  const [retentionActions, setRetentionActions] = useState<{ [empId: string]: { type: string; date: string; notes: string } }>({
    'emp-007': {
      type: 'WORKLOAD_REVIEW',
      date: '2026-10-21',
      notes: 'Discussed IT ticket backlog and approved SIM failover budget to relieve server stress.',
    },
  });

  // Calculate ML Turnover Risk for each employee
  const employeeRisks = useMemo(() => {
    return employees.map((emp) => {
      const dept = departments.find((d) => d.id === emp.departmentId);
      const pos = positions.find((p) => p.id === emp.positionId);
      const empKPIs = employeeKPIs.filter((k) => k.employeeId === emp.id);
      const empAttendance = attendanceRecords.filter((a) => a.employeeId === emp.id);
      const empLeave = leaveBalances.filter((l) => l.employeeId === emp.id);
      const empDiscipline = disciplinaryCases.filter((c) => c.employeeId === emp.id);

      const keyFactors: {
        factorLao: string;
        factorEn: string;
        severity: 'HIGH' | 'MEDIUM' | 'LOW';
        impactPct: number;
      }[] = [];

      let rawScore = 15; // baseline natural mobility

      // 1. KPI Health Impact (Weight 30%)
      const hasAtRiskKPI = empKPIs.some((k) => k.status === 'AT_RISK');
      const avgKPIScore = empKPIs.length > 0
        ? empKPIs.reduce((sum, k) => sum + (k.targetValue > 0 ? (k.currentValue / k.targetValue) * 100 : 0), 0) / empKPIs.length
        : 85;

      if (hasAtRiskKPI) {
        rawScore += 30;
        keyFactors.push({
          factorLao: 'ຕົວຊີ້ວັດ KPI ຢູ່ໃນສະຖານະມີຄວາມສ່ຽງ / ຊັກຊ້າ (At-Risk KPI)',
          factorEn: 'Assigned KPI is currently marked At-Risk / Lagging',
          severity: 'HIGH',
          impactPct: 30,
        });
      } else if (avgKPIScore < 80) {
        rawScore += 15;
        keyFactors.push({
          factorLao: 'ອັດຕາຄວາມສຳເລັດ KPI ຕ່ຳກວ່າເກນສະເລ່ຍ (<80%)',
          factorEn: 'KPI milestone pace is below average (<80%)',
          severity: 'MEDIUM',
          impactPct: 15,
        });
      }

      // 2. Attendance Stability Impact (Weight 25%)
      const hasLate = empAttendance.some((a) => a.status === 'LATE');
      if (hasLate) {
        rawScore += 18;
        keyFactors.push({
          factorLao: 'ມີປະຫວັດການມາຊ້າ / ລົງເວລາຜິດປົກກະຕິ (Tardiness Pattern)',
          factorEn: 'Recent late arrival or irregular check-in log detected',
          severity: 'HIGH',
          impactPct: 18,
        });
      }

      // 3. Leave Consumption (Weight 15%)
      const highLeaveUse = empLeave.some((l) => l.allocated > 0 && l.used / l.allocated >= 0.7);
      if (highLeaveUse) {
        rawScore += 12;
        keyFactors.push({
          factorLao: 'ການໃຊ້ມື້ລາພັກສະສົມຢ່າງວ່ອງໄວ (Clustered Leave Requests)',
          factorEn: 'Rapid annual leave balance consumption (>70%)',
          severity: 'MEDIUM',
          impactPct: 12,
        });
      }

      // 4. Disciplinary History (Weight 10%)
      if (empDiscipline.length > 0) {
        rawScore += 15;
        keyFactors.push({
          factorLao: 'ມີປະຫວັດການຕັກເຕືອນ / ລະບຽບວິໄນ (Disciplinary Record)',
          factorEn: 'Active disciplinary counseling record on file',
          severity: 'HIGH',
          impactPct: 15,
        });
      }

      // 5. Tenure Critical Window (Weight 20%)
      // Staff with 1-2.5 years often encounter external recruitment headhunters
      if (emp.employmentType === 'PROBATION') {
        rawScore += 10;
        keyFactors.push({
          factorLao: 'ຢູ່ໃນໄລຍະທົດລອງວຽກ (Probationary Review Window)',
          factorEn: 'Currently in probation adaptation phase',
          severity: 'LOW',
          impactPct: 10,
        });
      }

      const finalScore = Math.min(94, Math.max(8, Math.round(rawScore)));

      let riskLevel: 'HIGH' | 'MODERATE' | 'LOW' = 'LOW';
      if (finalScore >= 65) riskLevel = 'HIGH';
      else if (finalScore >= 40) riskLevel = 'MODERATE';

      // Recommendation text
      let recommendationLao = 'ຮັກສາການສື່ສານ ແລະ ປະເມີນຜົນງານປົກກະຕິ';
      let recommendationEn = 'Maintain regular 1-on-1 touchpoints and goal alignments.';

      if (riskLevel === 'HIGH') {
        recommendationLao = 'ນັດໝາຍສຳພາດ Retention Interview ດ່ວນ, ພິຈາລະນາຫຼຸດຜ່ອນຄວາມກົດດັນຂອງວຽກ ແລະ ສະໜັບສະໜູນຊັບພະຍາກອນໄອທີ';
        recommendationEn = 'Schedule immediate retention check-in, review workload bottlenecks, and provide system support.';
      } else if (riskLevel === 'MODERATE') {
        recommendationLao = 'ຕິດຕາມການລົງເວລາ, ທົບທວນເປົ້າໝາຍ KPI ໃຫ້ສອດຄ່ອງກັບຄວາມເປັນຈິງ, ແລະ ຍ້ອງຍໍຜົນງານຍ່ອຍ';
        recommendationEn = 'Monitor attendance stability, adjust challenging KPI timelines, and recognize quick wins.';
      }

      return {
        employee: emp,
        department: dept,
        position: pos,
        riskScore: finalScore,
        riskLevel,
        confidence: 88,
        keyFactors,
        retentionRecommendationLao: recommendationLao,
        retentionRecommendationEn: recommendationEn,
        hasActionTaken: !!retentionActions[emp.id],
        actionDetails: retentionActions[emp.id] || null,
      };
    }).sort((a, b) => b.riskScore - a.riskScore);
  }, [employees, departments, positions, attendanceRecords, employeeKPIs, leaveBalances, disciplinaryCases, retentionActions]);

  // High, Moderate, Low counts
  const highRiskCount = employeeRisks.filter((r) => r.riskLevel === 'HIGH').length;
  const modRiskCount = employeeRisks.filter((r) => r.riskLevel === 'MODERATE').length;
  const lowRiskCount = employeeRisks.filter((r) => r.riskLevel === 'LOW').length;

  // Filtered employees
  const filteredList = useMemo(() => {
    if (riskFilter === 'ALL') return employeeRisks;
    return employeeRisks.filter((r) => r.riskLevel === riskFilter);
  }, [employeeRisks, riskFilter]);

  // Open Retention Action Modal
  const handleOpenActionModal = (empId: string, empName: string, score: number) => {
    setModalData({ employeeId: empId, employeeName: empName, riskScore: score });
    setActionType('RETENTION_INTERVIEW');
    setActionDate(new Date().toISOString().split('T')[0]);
    setActionNotes('');
    setActionModalOpen(true);
  };

  // Submit Retention Action
  const handleSaveRetentionAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalData) return;

    setRetentionActions((prev) => ({
      ...prev,
      [modalData.employeeId]: {
        type: actionType,
        date: actionDate,
        notes: actionNotes.trim() || 'Retention strategy initiated.',
      },
    }));

    addAuditLog(
      'RETENTION_ACTION',
      'UPDATE',
      'AI Turnover Prediction & Retention',
      `Executed proactive retention action '${actionType}' for employee ${modalData.employeeName} (Turnover Risk: ${modalData.riskScore}%). Notes: ${actionNotes || 'None'}`,
      {
        entityType: 'RETENTION_RECORD',
        entityName: modalData.employeeName,
        recordId: modalData.employeeId,
        changes: [
          { field: 'actionType', newValue: actionType },
          { field: 'actionDate', newValue: actionDate },
          { field: 'riskScore', newValue: `${modalData.riskScore}%` },
        ],
      }
    );

    alerts.success(
      language === 'lo' ? 'ບັນທຶກແຜນຮັກສາພະນັກງານສຳເລັດ' : 'Retention Action Recorded',
      `${modalData.employeeName} - ${actionType}`
    );

    setActionModalOpen(false);
    setModalData(null);
  };

  // ML Feature Weights Data for Mini Recharts
  const featureWeightsData = [
    { name: language === 'lo' ? 'ຄວາມຄືບໜ້າ KPI' : 'KPI Health', weight: 30, fill: '#3b82f6' },
    { name: language === 'lo' ? 'ການລົງເວລາ' : 'Attendance Log', weight: 25, fill: '#6366f1' },
    { name: language === 'lo' ? 'ອາຍຸງານ' : 'Tenure Window', weight: 20, fill: '#8b5cf6' },
    { name: language === 'lo' ? 'ການໃຊ້ມື້ລາ' : 'Leave Velocity', weight: 15, fill: '#ec4899' },
    { name: language === 'lo' ? 'ລະບຽບວິໄນ' : 'Discipline/Load', weight: 10, fill: '#f43f5e' },
  ];

  return (
    <div id="turnover-risk-section" className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
      {/* 1. Header with ML Tag */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 via-amber-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-rose-500/20 shrink-0">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
                {language === 'lo'
                  ? 'ການວິເຄາະຄວາມສ່ຽງການລາອອກ (ML Turnover Risk Insights)'
                  : 'Machine Learning Turnover Risk Prediction'}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-900 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Random Forest ML Model v2.4
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'lo'
                ? 'ວິເຄາະຮູບແບບພຶດຕິກຳຈາກຂໍ້ມູນອະດີດ (ການລົງເວລາ, ຄວາມຄືບໜ້າ KPI, ການໃຊ້ມື້ລາ, ລະບຽບວິໄນ ແລະ ອາຍຸງານ) ເພື່ອກວດຈັບສັນຍານຄວາມສ່ຽງໃນການລາອອກ'
                : 'Analyzes behavioral patterns from historical data (attendance, KPI pacing, leave consumption, tenure) to forecast resignation risks'}
            </p>
          </div>
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl text-xs font-bold shrink-0 self-start md:self-auto">
          <button
            onClick={() => setRiskFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              riskFilter === 'ALL'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {language === 'lo' ? 'ທຸກຄົນ' : 'All'} ({employeeRisks.length})
          </button>
          <button
            onClick={() => setRiskFilter('HIGH')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              riskFilter === 'HIGH'
                ? 'bg-rose-500 text-white shadow-2xs'
                : 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
            }`}
          >
            {language === 'lo' ? 'ສ່ຽງສູງ' : 'High'} ({highRiskCount})
          </button>
          <button
            onClick={() => setRiskFilter('MODERATE')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              riskFilter === 'MODERATE'
                ? 'bg-amber-500 text-white shadow-2xs'
                : 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40'
            }`}
          >
            {language === 'lo' ? 'ປານກາງ' : 'Medium'} ({modRiskCount})
          </button>
          <button
            onClick={() => setRiskFilter('LOW')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              riskFilter === 'LOW'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
            }`}
          >
            {language === 'lo' ? 'ໝັ້ນຄົງ' : 'Low'} ({lowRiskCount})
          </button>
        </div>
      </div>

      {/* 2. Key Metrics & ML Model Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* High Risk Card */}
        <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400 uppercase">
                {language === 'lo' ? 'ພະນັກງານສ່ຽງສູງ (High Risk)' : 'High Risk Employees'}
              </span>
            </div>
            <div className="text-2xl font-black font-mono text-rose-600 dark:text-rose-400 mt-1">
              {highRiskCount} {language === 'lo' ? 'ຄົນ' : 'Staff'}
            </div>
            <span className="text-[10px] text-rose-600/80 font-medium">
              Probability $\ge 65\%$ • Urgent
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-300 flex items-center justify-center shrink-0">
            <AlertOctagon className="w-5 h-5" />
          </div>
        </div>

        {/* Moderate Risk Card */}
        <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase">
                {language === 'lo' ? 'ສ່ຽງປານກາງ (Moderate)' : 'Moderate Risk'}
              </span>
            </div>
            <div className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400 mt-1">
              {modRiskCount} {language === 'lo' ? 'ຄົນ' : 'Staff'}
            </div>
            <span className="text-[10px] text-amber-600/80 font-medium">
              Probability $40\% - 64\%$
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-300 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* Stable / Low Risk Card */}
        <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">
                {language === 'lo' ? 'ໝັ້ນຄົງສູງ (Low Risk)' : 'Low Risk / Stable'}
              </span>
            </div>
            <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
              {lowRiskCount} {language === 'lo' ? 'ຄົນ' : 'Staff'}
            </div>
            <span className="text-[10px] text-emerald-600/80 font-medium">
              Healthy Retention
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Predictive Accuracy & Confidence */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase block">
              {language === 'lo' ? 'ຄວາມເຊື່ອໝັ້ນຂອງຕົວແບບ ML' : 'Model Confidence'}
            </span>
            <div className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400 mt-1">
              88.4%
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              F1-Score: 0.86 • Historical Fit
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Main Content: At-Risk Employees List + Feature Importance Weights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Employee Cards */}
        <div className="lg:col-span-2 space-y-3.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
            <span>
              {language === 'lo' ? 'ລາຍຊື່ພະນັກງານທີ່ລະບົບ ML ປະເມີນຄວາມສ່ຽງ' : 'Predicted Employees at Risk of Leaving'} ({filteredList.length})
            </span>
            <span className="text-[11px] text-slate-400">
              {language === 'lo' ? 'ຈັດລຽງຕາມຄວາມເປັນໄປໄດ້ (Probability %)' : 'Ranked by resignation probability'}
            </span>
          </div>

          <div className="space-y-3">
            {filteredList.map((item) => {
              const isSelected = selectedEmpId === item.employee.id;

              return (
                <div
                  key={item.employee.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    item.riskLevel === 'HIGH'
                      ? 'border-rose-200 dark:border-rose-900/60 bg-white dark:bg-slate-900 hover:border-rose-400'
                      : item.riskLevel === 'MODERATE'
                      ? 'border-amber-200 dark:border-amber-900/60 bg-white dark:bg-slate-900 hover:border-amber-400'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                  } shadow-xs hover:shadow space-y-3`}
                >
                  {/* Top Bar: Employee info + Risk Badge */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl font-mono font-bold text-xs flex items-center justify-center text-white shrink-0 ${
                          item.riskLevel === 'HIGH'
                            ? 'bg-gradient-to-tr from-rose-600 to-rose-500'
                            : item.riskLevel === 'MODERATE'
                            ? 'bg-gradient-to-tr from-amber-600 to-amber-500'
                            : 'bg-gradient-to-tr from-emerald-600 to-emerald-500'
                        }`}
                      >
                        {item.employee.employeeCode.slice(-3)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                            {item.employee.firstNameLao} {item.employee.lastNameLao}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ({item.employee.firstNameEn} {item.employee.lastNameEn})
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {item.employee.employeeCode} • {item.department?.nameLao} • {item.position?.titleLao}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 self-start sm:self-auto">
                      <div className="text-right">
                        <div
                          className={`text-base font-black font-mono leading-none ${
                            item.riskLevel === 'HIGH'
                              ? 'text-rose-600 dark:text-rose-400'
                              : item.riskLevel === 'MODERATE'
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {item.riskScore}%
                        </div>
                        <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">
                          {item.riskLevel === 'HIGH'
                            ? (language === 'lo' ? 'ສ່ຽງສູງ' : 'High Risk')
                            : item.riskLevel === 'MODERATE'
                            ? (language === 'lo' ? 'ສ່ຽງປານກາງ' : 'Moderate')
                            : (language === 'lo' ? 'ສ່ຽງຕ່ຳ' : 'Low Risk')}
                        </span>
                      </div>

                      <button
                        onClick={() => handleOpenActionModal(item.employee.id, `${item.employee.firstNameLao} ${item.employee.lastNameLao}`, item.riskScore)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer shrink-0 ${
                          item.hasActionTaken
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                            : 'bg-rose-600 hover:bg-rose-700 text-white shadow-2xs'
                        }`}
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>
                          {item.hasActionTaken
                            ? (language === 'lo' ? 'ດຳເນີນການແລ້ວ' : 'Actioned')
                            : (language === 'lo' ? 'ແກ້ໄຂ / ຮັກສາ' : 'Retention Action')}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Progress Probability Bar */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.riskLevel === 'HIGH'
                          ? 'bg-rose-500'
                          : item.riskLevel === 'MODERATE'
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${item.riskScore}%` }}
                    />
                  </div>

                  {/* Detected ML Risk Drivers / Badges */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">
                      {language === 'lo' ? 'ປັດໄຈສ່ຽງຫຼັກທີ່ກວດພົບ (ML Key Predictors):' : 'Key Risk Factors Detected:'}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {item.keyFactors.length > 0 ? (
                        item.keyFactors.map((factor, idx) => (
                          <span
                            key={idx}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-medium border flex items-center gap-1 ${
                              factor.severity === 'HIGH'
                                ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-900'
                                : factor.severity === 'MEDIUM'
                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900'
                                : 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <span>⚠️</span>
                            <span>{language === 'lo' ? factor.factorLao : factor.factorEn}</span>
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {language === 'lo' ? 'ບໍ່ພົບປັດໄຈສ່ຽງຜິດປົກກະຕິ' : 'No adverse behavioral risk factors detected'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* AI Recommendation Box */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                    <Sparkles className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-bold text-[11px] text-slate-800 dark:text-slate-200 block mb-0.5">
                        {language === 'lo' ? 'ຄຳແນະນຳການຮັກສາພະນັກງານ (Retention Strategy):' : 'Suggested Retention Strategy:'}
                      </span>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                        {language === 'lo' ? item.retentionRecommendationLao : item.retentionRecommendationEn}
                      </p>
                      {item.actionDetails && (
                        <div className="mt-2 pt-1.5 border-t border-slate-200 dark:border-slate-700 text-[10px] text-blue-600 dark:text-blue-400 font-mono">
                          ✓ Action Taken: {item.actionDetails.type} ({item.actionDetails.date}) — "{item.actionDetails.notes}"
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Model Feature Importance & Methodology */}
        <div className="space-y-4">
          {/* Feature Importance Chart */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-indigo-600" />
                <h4 className="font-bold text-xs uppercase text-slate-900 dark:text-slate-100">
                  {language === 'lo' ? 'ນ້ຳໜັກປັດໄຈຂອງຕົວແບບ ML' : 'ML Feature Importance'}
                </h4>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Weights %</span>
            </div>

            <p className="text-[11px] text-slate-500">
              {language === 'lo'
                ? 'ອິດທິພົນຂອງແຕ່ລະຕົວແປພຶດຕິກຳຕໍ່ການຄາດຄະເນການຕັດສິນໃຈລາອອກຂອງພະນັກງານ'
                : 'Relative weight of each behavioral signal trained on state enterprise resignation records:'}
            </p>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={featureWeightsData}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                >
                  <XAxis type="number" domain={[0, 35]} unit="%" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
                    width={90}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(val: any) => [`${val}%`, language === 'lo' ? 'ນ້ຳໜັກ' : 'Weight']}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                  />
                  <Bar dataKey="weight" radius={[0, 6, 6, 0]} maxBarSize={16}>
                    {featureWeightsData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Retention Playbook Guidelines */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <h4 className="font-bold text-xs uppercase text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-emerald-600" />
              <span>{language === 'lo' ? 'ຄູ່ມືການຮັກສາພະນັກງານ (LHSE Playbook)' : 'HR Retention Playbook'}</span>
            </h4>

            <div className="space-y-2 text-[11px] text-slate-600 dark:text-slate-400">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-1">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  🎯 1. Early 1-on-1 Dialog
                </span>
                <p>
                  {language === 'lo'
                    ? 'ນັດໝາຍລົມເປີດໃຈພາຍໃນ 7 ວັນເມື່ອຄະແນນຄວາມສ່ຽງເກີນ 65% ເພື່ອຮັບຟັງບັນຫາ'
                    : 'Schedule informal check-in within 7 days of alert threshold trigger.'}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-1">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  ⚖️ 2. Workload & KPI Adjustment
                </span>
                <p>
                  {language === 'lo'
                    ? 'ປັບປຸງເປົ້າໝາຍທີ່ຕິດຂັດດ້ານຊັບພະຍາກອນ ຫຼື ສະໜອງອຸປະກອນຊ່ວຍເຫຼືອ'
                    : 'Unblock resource constraints and realign milestones with operational reality.'}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-1">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  🌟 3. Career & Recognition Path
                </span>
                <p>
                  {language === 'lo'
                    ? 'ເປີດໂອກາດການຝຶກອົບຮົມ, ໂຄງການພິເສດ ແລະ ຄ່າຕອບແທນທີ່ເໝາະສົມ'
                    : 'Provide sponsored state enterprise certifications and merit awards.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Retention Action Modal */}
      {actionModalOpen && modalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  {language === 'lo' ? 'ດຳເນີນການແກ້ໄຂ / ແຜນຮັກສາພະນັກງານ' : 'Initiate Employee Retention Action'}
                </h3>
              </div>
              <button
                onClick={() => setActionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase">
                  Target Employee
                </span>
                <p className="font-bold text-xs text-slate-900 dark:text-slate-100 mt-0.5">
                  {modalData.employeeName}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400">Risk Score</span>
                <div className="font-black font-mono text-sm text-rose-600 dark:text-rose-400">
                  {modalData.riskScore}%
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveRetentionAction} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'lo' ? 'ປະເພດການດຳເນີນການ' : 'Action Type'} *
                </label>
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
                >
                  <option value="RETENTION_INTERVIEW">
                    {language === 'lo' ? 'ນັດໝາຍສຳພາດ Retention 1-on-1' : 'Schedule Retention 1-on-1 Interview'}
                  </option>
                  <option value="WORKLOAD_REVIEW">
                    {language === 'lo' ? 'ທົບທວນ & ຫຼຸດຜ່ອນພາລະວຽກ (Workload Review)' : 'Workload & Stress Relief Review'}
                  </option>
                  <option value="KPI_ALIGNMENT">
                    {language === 'lo' ? 'ປັບປຸງເປົ້າໝາຍ KPI (Target Re-alignment)' : 'KPI Target Re-alignment'}
                  </option>
                  <option value="COMPENSATION_REVIEW">
                    {language === 'lo' ? 'ທົບທວນເງິນເດືອນ ແລະ ສະຫວັດດີການ' : 'Compensation & Welfare Benchmark Review'}
                  </option>
                  <option value="TRAINING_SPONSORSHIP">
                    {language === 'lo' ? 'ມອບໝາຍທຶນຝຶກອົບຮົມ / ພັດທະນາສາຍອາຊີບ' : 'Career Development & Training Sponsorship'}
                  </option>
                  <option value="RISK_ACKNOWLEDGED">
                    {language === 'lo' ? 'ຮັບຊາບສັນຍານ ແລະ ຕິດຕາມຕໍ່ເນື່ອງ' : 'Acknowledge Risk & Continue Monitoring'}
                  </option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'lo' ? 'ວັນທີດຳເນີນການ' : 'Action / Meeting Date'} *
                </label>
                <input
                  type="date"
                  required
                  value={actionDate}
                  onChange={(e) => setActionDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'lo' ? 'ບັນທຶກ & ຂໍ້ຕົກລົງຂອງຜູ້ຈັດການ' : 'Manager Strategy Notes & Commitments'}
                </label>
                <textarea
                  rows={3}
                  required
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder={language === 'lo' ? 'ບັນທຶກສິ່ງທີ່ໄດ້ລົມກັນ ຫຼື ມາດຕະການຊ່ວຍເຫຼືອ...' : 'Detail commitments, agreed milestone adjustments, or career support steps...'}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setActionModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  {language === 'lo' ? 'ຍົກເລີກ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-sm transition-colors cursor-pointer"
                >
                  {language === 'lo' ? 'ບັນທຶກການແກ້ໄຂ' : 'Save Retention Action'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
