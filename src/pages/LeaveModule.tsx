import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { DataTable, Column } from '../components/common/DataTable.tsx';
import { Modal } from '../components/common/Modal.tsx';
import { LeaveRequest, LeaveBalance, LeaveType } from '../types/index.ts';
import { alerts } from '../utils/alerts.ts';
import {
  FileCheck2,
  CalendarDays,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  FolderOpen,
  Eye,
  Sparkles,
  Plane,
  AlertCircle,
  UserCheck,
  ShieldCheck,
  Filter,
} from 'lucide-react';
import { LeaveEntitlementCard } from '../components/leave/LeaveEntitlementCard.tsx';
import { LeaveApprovalProgressBar, AnnualLeaveQuotaBar } from '../components/leave/AnnualLeaveProgressBar.tsx';
import { useFormAutoSave } from '../hooks/useFormAutoSave.ts';
import { FormAutoSaveIndicator } from '../components/common/FormAutoSaveIndicator.tsx';

export const LeaveModule: React.FC = () => {
  const {
    t,
    language,
    employees,
    positions,
    leaveTypes,
    leaveRequests,
    leaveBalances,
    activeSubModule,
    setActiveSubModule,
    submitLeaveRequest,
    processApproval,
    approvalRequests,
    currentUser,
  } = useApp();

  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState(leaveTypes[0]?.id || 'lt-1');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [totalDays, setTotalDays] = useState(1);
  const [reason, setReason] = useState('');
  const [requestTargetEmpId, setRequestTargetEmpId] = useState(currentUser.employeeId || 'emp-001');

  // Baseline initial state for leave request draft detection
  const initialLeaveDraft = useMemo(() => ({
    selectedType: leaveTypes[0]?.id || 'lt-1',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    totalDays: 1,
    reason: '',
    requestTargetEmpId: currentUser.employeeId || 'emp-001',
  }), [leaveTypes, currentUser.employeeId]);

  // Universal Auto-Save for Leave Form
  const leaveAutoSave = useFormAutoSave({
    formId: 'leave_request_submission',
    formData: { selectedType, startDate, endDate, totalDays, reason, requestTargetEmpId },
    setFormData: (val: any) => {
      const data = typeof val === 'function' ? val({ selectedType, startDate, endDate, totalDays, reason, requestTargetEmpId }) : val;
      if (data.selectedType) setSelectedType(data.selectedType);
      if (data.startDate) setStartDate(data.startDate);
      if (data.endDate) setEndDate(data.endDate);
      if (data.totalDays !== undefined) setTotalDays(data.totalDays);
      if (data.reason !== undefined) setReason(data.reason);
      if (data.requestTargetEmpId) setRequestTargetEmpId(data.requestTargetEmpId);
    },
    initialData: initialLeaveDraft,
    isOpen: requestModalOpen,
  });

  // Filter for requests table: all vs annual leave only
  const [filterAnnualOnly, setFilterAnnualOnly] = useState(false);

  // Selected leave request for detail inspection modal
  const [detailRequest, setDetailRequest] = useState<LeaveRequest | null>(null);

  const myEmpId = currentUser.employeeId || 'emp-001';
  const myBalances = leaveBalances.filter((b) => b.employeeId === (requestModalOpen ? requestTargetEmpId : myEmpId));

  const isHRorAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'HR_ADMIN';

  // Find Annual Leave Type (usually lt-1 or name includes annual/vacation)
  const annualLeaveType =
    leaveTypes.find((lt) => lt.id === 'lt-1' || lt.nameEn.toLowerCase().includes('annual') || lt.nameEn.toLowerCase().includes('vacation')) ||
    leaveTypes[0];

  const handleOpenRequest = (typeId?: string | React.MouseEvent) => {
    const validTypeId = typeof typeId === 'string' ? typeId : (annualLeaveType?.id || 'lt-1');
    if (!leaveAutoSave.hasDraft) {
      setSelectedType(validTypeId);
      setStartDate(new Date().toISOString().split('T')[0]);
      setEndDate(new Date().toISOString().split('T')[0]);
      setTotalDays(1);
      setReason('');
      setRequestTargetEmpId(myEmpId);
    }
    setRequestModalOpen(true);
  };

  const handleDatesChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    const d1 = new Date(start);
    const d2 = new Date(end);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    setTotalDays(isNaN(diffDays) ? 1 : diffDays);
  };

  const handleSubmit = () => {
    if (!reason.trim()) {
      alerts.error(
        language === 'lo' ? 'ກະລຸນາໃສ່ເຫດຜົນ' : 'Missing Reason',
        language === 'lo' ? 'ກະລຸນາບອກເຫດຜົນການລາພັກ' : 'Please provide reason for leave.'
      );
      return;
    }

    // Check quota if annual leave
    if (selectedType === annualLeaveType?.id) {
      const recordedBalance = leaveBalances.find(
        (b) => b.employeeId === requestTargetEmpId && b.leaveTypeId === annualLeaveType.id
      );
      const allocated = recordedBalance ? recordedBalance.allocated : annualLeaveType.daysAllowed;
      const used = recordedBalance ? recordedBalance.used : 0;
      if (used + totalDays > allocated) {
        alerts.warning(
          language === 'lo' ? 'ແຈ້ງເຕືອນໂຄຕ້າລາພັກ' : 'Leave Quota Alert',
          language === 'lo'
            ? `ຈຳນວນວັນລາພັກທີ່ຂໍ (${totalDays} ວັນ) ເກີນໂຄຕ້າທີ່ເຫຼືອ (${allocated - used} ວັນ). ຄຳຮ້ອງຈະຖືກສົ່ງໃຫ້ HR ພິຈາລະນາເປັນກໍລະນີພິເສດ.`
            : `Requested days (${totalDays}) exceed available quota (${allocated - used} days). Will require special HR approval.`
        );
      }
    }

    submitLeaveRequest(selectedType, startDate, endDate, totalDays, reason);
    leaveAutoSave.clearDraft();
    setRequestModalOpen(false);
  };

  // Quota for target employee in the modal
  const targetAnnualBalance = useMemo(() => {
    const recorded = leaveBalances.find(
      (b) => b.employeeId === requestTargetEmpId && b.leaveTypeId === selectedType
    );
    const targetType = leaveTypes.find((t) => t.id === selectedType);
    const allocated = recorded ? recorded.allocated : (targetType?.daysAllowed || 15);
    const used = recorded ? recorded.used : 0;
    return { allocated, used, remaining: Math.max(0, allocated - used) };
  }, [requestTargetEmpId, selectedType, leaveBalances, leaveTypes]);

  // Filtered requests list
  const filteredLeaveRequests = useMemo(() => {
    if (!filterAnnualOnly) return leaveRequests;
    return leaveRequests.filter((lr) => lr.leaveTypeId === annualLeaveType?.id);
  }, [leaveRequests, filterAnnualOnly, annualLeaveType]);

  // Aggregate stats for Annual Leave requests
  const annualLeaveStats = useMemo(() => {
    const annualReqs = leaveRequests.filter((r) => r.leaveTypeId === annualLeaveType?.id);
    const totalRequests = annualReqs.length;
    const approved = annualReqs.filter((r) => r.status === 'APPROVED');
    const pending = annualReqs.filter((r) => r.status === 'PENDING');
    const approvedDays = approved.reduce((sum, r) => sum + r.totalDays, 0);
    const pendingDays = pending.reduce((sum, r) => sum + r.totalDays, 0);

    // Total quota across employees (15 days standard per employee)
    const totalEnterpriseQuota = employees.length * (annualLeaveType?.daysAllowed || 15);
    const enterpriseUsedPct = totalEnterpriseQuota > 0 ? Math.round((approvedDays / totalEnterpriseQuota) * 100) : 0;

    return {
      totalRequests,
      approvedCount: approved.length,
      pendingCount: pending.length,
      approvedDays,
      pendingDays,
      totalEnterpriseQuota,
      enterpriseUsedPct,
    };
  }, [leaveRequests, annualLeaveType, employees]);

  const columns: Column<LeaveRequest>[] = [
    {
      key: 'employeeId',
      header: t('employee'),
      render: (lr) => {
        const emp = employees.find((e) => e.id === lr.employeeId);
        return (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 font-bold text-xs flex items-center justify-center shrink-0">
              {emp ? emp.firstNameEn.charAt(0) : 'E'}
            </div>
            <div>
              <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                {emp ? (language === 'lo' ? `${emp.firstNameLao} ${emp.lastNameLao}` : `${emp.firstNameEn} ${emp.lastNameEn}`) : lr.employeeId}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">{emp?.employeeCode}</div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'leaveTypeId',
      header: language === 'lo' ? 'ປະເພດການລາພັກ' : 'Leave Type',
      render: (lr) => {
        const lt = leaveTypes.find((t) => t.id === lr.leaveTypeId);
        const isAnnual = lr.leaveTypeId === annualLeaveType?.id;
        return (
          <div className="flex items-center gap-1.5">
            <span
              className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white shadow-xs inline-flex items-center gap-1"
              style={{ backgroundColor: lt?.color || '#2563eb' }}
            >
              {isAnnual && <Plane className="w-3 h-3" />}
              {lt ? (language === 'lo' ? lt.nameLao : lt.nameEn) : lr.leaveTypeId}
            </span>
          </div>
        );
      },
    },
    {
      key: 'dates',
      header: language === 'lo' ? 'ໄລຍະເວລາ' : 'Duration',
      render: (lr) => (
        <div>
          <div className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
            {lr.startDate} → {lr.endDate}
          </div>
          <div className="text-[11px] text-slate-400 font-semibold">
            {lr.totalDays} {language === 'lo' ? 'ວັນ' : 'days'}
          </div>
        </div>
      ),
    },
    {
      key: 'progress',
      header: language === 'lo' ? 'ຄວາມຄືບໜ້າ (Progress Bar)' : 'Approval Progress Bar',
      render: (lr) => (
        <LeaveApprovalProgressBar
          compact
          currentStep={lr.currentStep || 1}
          totalSteps={lr.totalSteps || 2}
          status={lr.status}
          language={language}
        />
      ),
    },
    {
      key: 'status',
      header: t('status'),
      render: (lr) => (
        <span
          className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
            lr.status === 'APPROVED'
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
              : lr.status === 'PENDING'
              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
          }`}
        >
          {lr.status === 'APPROVED' && <CheckCircle2 className="w-3 h-3" />}
          {lr.status === 'PENDING' && <Clock className="w-3 h-3 animate-spin" />}
          {lr.status === 'REJECTED' && <XCircle className="w-3 h-3" />}
          {t(lr.status as any)}
        </span>
      ),
    },
    {
      key: 'action',
      header: language === 'lo' ? 'ລາຍລະອຽດ' : 'Details',
      render: (lr) => (
        <button
          onClick={() => setDetailRequest(lr)}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-blue-600 transition-colors"
          title={language === 'lo' ? 'ເບິ່ງຄວາມຄືບໜ້າ ແລະ ລາຍລະອຽດ' : 'View Progress & Details'}
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Leave Entitlement Circular Progress Visual Card */}
      <LeaveEntitlementCard onRequestLeave={handleOpenRequest} />

      {/* Submodule Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveSubModule('requests')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubModule === 'requests'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            {t('leaveRequests')}
          </button>
          <button
            onClick={() => setActiveSubModule('balances')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubModule === 'balances'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            {t('leaveBalances')}
          </button>
          <button
            onClick={() => setActiveSubModule('types')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubModule === 'types'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            {t('leaveTypesConfig')}
          </button>
        </div>

        {activeSubModule === 'requests' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterAnnualOnly(!filterAnnualOnly)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                filterAnnualOnly
                  ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              <Plane className="w-3.5 h-3.5 text-blue-600" />
              <span>{language === 'lo' ? 'ສະເພາະລາພັກປະຈຳປີ' : 'Annual Leave Only'}</span>
            </button>
          </div>
        )}
      </div>

      {activeSubModule === 'requests' && (
        <div className="space-y-4">
          {/* Annual Leave Requests Progress Banner */}
          <div className="p-4 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-600 text-white shadow-md space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white shrink-0">
                  <Plane className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-sm sm:text-base tracking-wide">
                      {language === 'lo'
                        ? 'ຄວາມຄືບໜ້າຄຳຮ້ອງລາພັກປະຈຳປີ (Annual Leave Request Progress)'
                        : 'Annual Leave Request Workflow & Utilization'}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white">
                      2026 Quota
                    </span>
                  </div>
                  <p className="text-xs text-blue-100">
                    {language === 'lo'
                      ? 'ຕິດຕາມຄວາມຄືບໜ້າການອະນຸມັດ ພ້ອມອັດຕາການນຳໃຊ້ໂຄຕ້າວັນລາພັກປະຈຳປີ'
                      : 'Track workflow approval stages and organizational quota consumption'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleOpenRequest(annualLeaveType?.id)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white text-blue-700 hover:bg-blue-50 rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{language === 'lo' ? 'ຍື່ນລາພັກປະຈຳປີ' : 'Apply Annual Leave'}</span>
              </button>
            </div>

            {/* Top Overview Progress Bar */}
            <div className="pt-2 border-t border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-blue-100">
                  {language === 'lo' ? 'ວັນລາພັກທີ່ອະນຸມັດແລ້ວ:' : 'Approved Utilization:'} <strong className="text-white font-mono">{annualLeaveStats.approvedDays}d</strong> / {annualLeaveStats.totalEnterpriseQuota}d
                </span>
                <span className="text-blue-100 font-mono">
                  {annualLeaveStats.enterpriseUsedPct}% {language === 'lo' ? 'ຂອງໂຄຕ້າທັງໝົດ' : 'Enterprise Quota Used'}
                </span>
              </div>
              <div className="w-full h-2.5 bg-black/20 rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-emerald-300 to-white rounded-full transition-all duration-700 shadow-sm"
                  style={{ width: `${Math.max(4, annualLeaveStats.enterpriseUsedPct)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-blue-100">
                <span>{language === 'lo' ? 'ຄຳຮ້ອງທັງໝົດ:' : 'Total Annual Requests:'} <strong>{annualLeaveStats.totalRequests}</strong></span>
                <span>{language === 'lo' ? 'ອະນຸມັດແລ້ວ:' : 'Approved:'} <strong>{annualLeaveStats.approvedCount}</strong></span>
                <span>{language === 'lo' ? 'ລໍຖ້າກວດກາ:' : 'Pending:'} <strong>{annualLeaveStats.pendingCount}</strong></span>
              </div>
            </div>
          </div>

          {/* DataTable */}
          <DataTable
            data={filteredLeaveRequests}
            columns={columns}
            filename="LHSE_Leave_Requests_With_Progress"
            actions={
              <button
                onClick={handleOpenRequest}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('requestLeaveBtn')}</span>
              </button>
            }
          />
        </div>
      )}

      {activeSubModule === 'balances' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                {language === 'lo' ? 'ຍອດວັນລາພັກ ແລະ ແຖບຄວາມຄືບໜ້າ (Leave Balances & Progress Bars)' : 'My 2026 Leave Balance Overview & Progress'}
              </h3>
              <p className="text-xs text-slate-500">
                {language === 'lo' ? 'ສະແດງອັດຕາການນຳໃຊ້ວັນລາພັກແຕ່ລະປະເພດດ້ວຍ Progress Bar' : 'Visual quota consumption indicators for all leave categories'}
              </p>
            </div>
            <button
              onClick={handleOpenRequest}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('requestLeaveBtn')}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {leaveTypes.map((lt) => {
              const balance = myBalances.find((b) => b.leaveTypeId === lt.id);
              const allocated = balance ? balance.allocated : lt.daysAllowed;
              const used = balance ? balance.used : 0;
              const remaining = balance ? balance.remaining : lt.daysAllowed;
              const usedPercentage = allocated > 0 ? Math.round((used / allocated) * 100) : 0;

              // Color for progress bar
              const barColor =
                usedPercentage > 80
                  ? 'bg-rose-500'
                  : usedPercentage > 50
                  ? 'bg-amber-500'
                  : 'bg-blue-600';

              return (
                <div
                  key={lt.id}
                  className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3.5 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: lt.color }}
                      />
                      <span className="text-[11px] font-bold text-slate-400">2026</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {language === 'lo' ? lt.nameLao : lt.nameEn}
                      </h4>
                      <p className="text-xs text-slate-500">{lt.isPaid ? '100% Paid Leave' : 'Unpaid'}</p>
                    </div>
                  </div>

                  {/* Visual Progress Bar on Balances Card */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 dark:text-slate-400 font-semibold">
                        {language === 'lo' ? 'ອັດຕານຳໃຊ້:' : 'Utilization:'}
                      </span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                        {usedPercentage}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200/50 dark:border-slate-700/50">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                        style={{ width: `${Math.min(100, usedPercentage)}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">{language === 'lo' ? 'ໃຊ້ແລ້ວ' : 'Used'}</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">{used} d</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block text-[10px]">{language === 'lo' ? 'ຍັງເຫຼືອ' : 'Remaining'}</span>
                      <span className="font-black text-blue-600 text-base">{remaining} d</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeSubModule === 'types' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {leaveTypes.map((lt) => (
            <div
              key={lt.id}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2"
            >
              <div className="flex items-center justify-between">
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: lt.color }}
                >
                  {lt.daysAllowed} {language === 'lo' ? 'ວັນ/ປີ' : 'days/year'}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {lt.requiresDocument ? 'Medical Cert Required' : 'No Document Required'}
                </span>
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                {language === 'lo' ? lt.nameLao : lt.nameEn}
              </h4>
              <p className="text-xs text-slate-500">
                {language === 'lo' ? lt.nameEn : lt.nameLao}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Submit Leave Request Modal - Features Quota & Workflow Progress Bars */}
      <Modal
        isOpen={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300 flex items-center justify-center">
              <CalendarDays className="w-4 h-4" />
            </div>
            <div>
              <div className="text-base font-bold text-slate-900 dark:text-slate-100">
                {language === 'lo' ? 'ຍື່ນຄຳຮ້ອງຂໍລາພັກປະຈຳປີ (Annual Leave Request)' : 'Submit Annual Leave Request'}
              </div>
              <div className="text-xs text-slate-400 font-normal">
                {language === 'lo' ? 'ພ້ອມແຖບຄວາມຄືບໜ້າໂຄຕ້າ & ສາຍການອະນຸມັດ' : 'With Quota Utilization & Workflow Progress Bars'}
              </div>
            </div>
          </div>
        }
        subtitle="Submit leave request into central approval workflow"
        maxWidth="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="text-xs text-slate-500 font-mono">
              Duration: <strong className="text-blue-600">{totalDays}</strong> {language === 'lo' ? 'ວັນ' : 'days'}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRequestModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition-colors"
              >
                {t('submit')}
              </button>
            </div>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          {/* Real-time Draft Auto-Save Feedback */}
          <FormAutoSaveIndicator
            isSaving={leaveAutoSave.isSaving}
            lastSaved={leaveAutoSave.lastSaved}
            isRestored={leaveAutoSave.isRestored}
            onDiscard={() => {
              leaveAutoSave.discardDraft();
              setSelectedType(initialLeaveDraft.selectedType);
              setStartDate(initialLeaveDraft.startDate);
              setEndDate(initialLeaveDraft.endDate);
              setTotalDays(1);
              setReason('');
            }}
            language={language}
          />

          {/* 1. Approval Steps Preview Progress Bar */}
          <LeaveApprovalProgressBar
            currentStep={1}
            totalSteps={2}
            status="PENDING"
            language={language}
          />

          {/* 2. Employee Selector for HR/Admin */}
          {isHRorAdmin && (
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                {language === 'lo' ? 'ເລືອກພະນັກງານທີ່ຍື່ນຄຳຮ້ອງ *' : 'Applicant Employee *'}
              </label>
              <select
                value={requestTargetEmpId}
                onChange={(e) => setRequestTargetEmpId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.employeeCode} - {language === 'lo' ? `${emp.firstNameLao} ${emp.lastNameLao}` : `${emp.firstNameEn} ${emp.lastNameEn}`}
                    {emp.id === myEmpId ? ' (You)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 3. Leave Type Selector */}
          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
              {language === 'lo' ? 'ປະເພດການລາພັກ *' : 'Leave Type *'}
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              {leaveTypes.map((lt) => (
                <option key={lt.id} value={lt.id}>
                  {language === 'lo' ? lt.nameLao : lt.nameEn} ({lt.daysAllowed} d/year)
                </option>
              ))}
            </select>
          </div>

          {/* 4. Annual Leave Quota Live Progress Bar */}
          <AnnualLeaveQuotaBar
            allocated={targetAnnualBalance.allocated}
            used={targetAnnualBalance.used}
            requesting={totalDays}
            leaveTypeName={
              selectedType === annualLeaveType?.id
                ? (language === 'lo' ? 'ໂຄຕ້າວັນລາພັກປະຈຳປີ (Annual Leave Quota)' : 'Annual Leave Quota Utilization')
                : undefined
            }
            language={language}
          />

          {/* 5. Date Range Pickers */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                {language === 'lo' ? 'ວັນທີເລີ່ມ *' : 'Start Date *'}
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleDatesChange(e.target.value, endDate)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                {language === 'lo' ? 'ວັນທີສິ້ນສຸດ *' : 'End Date *'}
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => handleDatesChange(startDate, e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
              {language === 'lo' ? 'ເຫດຜົນການລາພັກ *' : 'Reason for Leave *'}
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={language === 'lo' ? 'ຕົວຢ່າງ: ພັກຜ່ອນປະຈຳປີກັບຄອບຄົວ ຫຼື ວຽກງານສ່ວນຕົວ...' : 'e.g. Annual family vacation or personal travel'}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>
        </div>
      </Modal>

      {/* Leave Request Inspection & Progress Modal */}
      <Modal
        isOpen={!!detailRequest}
        onClose={() => setDetailRequest(null)}
        title={
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300 flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <div className="text-base font-bold text-slate-900 dark:text-slate-100">
                {language === 'lo' ? 'ລາຍລະອຽດຄຳຮ້ອງລາພັກ & ຄວາມຄືບໜ້າ' : 'Leave Request Progress & Details'}
              </div>
              <div className="text-xs text-slate-400 font-mono">
                ID: {detailRequest?.id}
              </div>
            </div>
          </div>
        }
        maxWidth="md"
        footer={
          <div className="flex items-center justify-end w-full gap-2">
            <button
              onClick={() => setDetailRequest(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400"
            >
              {language === 'lo' ? 'ປິດ' : 'Close'}
            </button>
          </div>
        }
      >
        {detailRequest && (() => {
          const emp = employees.find((e) => e.id === detailRequest.employeeId);
          const lt = leaveTypes.find((t) => t.id === detailRequest.leaveTypeId);
          const approver = employees.find((e) => e.id === detailRequest.assignedApproverId);
          const isAnnual = detailRequest.leaveTypeId === annualLeaveType?.id;

          return (
            <div className="space-y-4 text-xs">
              {/* Detailed Multi-Step Progress Bar */}
              <LeaveApprovalProgressBar
                currentStep={detailRequest.currentStep || 1}
                totalSteps={detailRequest.totalSteps || 2}
                status={detailRequest.status}
                language={language}
                approverName={approver ? `${approver.firstNameLao} ${approver.lastNameLao}` : undefined}
                approvedAt={detailRequest.approvedAt}
              />

              {/* Employee Summary Card */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">{language === 'lo' ? 'ພະນັກງານຜູ້ຍື່ນ' : 'Applicant'}</span>
                  <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    {emp ? (language === 'lo' ? `${emp.firstNameLao} ${emp.lastNameLao}` : `${emp.firstNameEn} ${emp.lastNameEn}`) : detailRequest.employeeId}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {emp?.employeeCode}
                    {emp?.positionId && (() => {
                      const pos = positions.find((p) => p.id === emp.positionId);
                      return pos ? ` • ${language === 'lo' ? pos.titleLao : pos.titleEn}` : '';
                    })()}
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className="px-2.5 py-1 rounded-full text-[10px] font-bold text-white shadow-xs inline-flex items-center gap-1"
                    style={{ backgroundColor: lt?.color || '#2563eb' }}
                  >
                    {isAnnual && <Plane className="w-3 h-3" />}
                    {lt ? (language === 'lo' ? lt.nameLao : lt.nameEn) : detailRequest.leaveTypeId}
                  </span>
                </div>
              </div>

              {/* Request Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 text-[10px] block">{language === 'lo' ? 'ວັນທີເລີ່ມ - ສິ້ນສຸດ' : 'Dates'}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                    {detailRequest.startDate} → {detailRequest.endDate}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 text-[10px] block">{language === 'lo' ? 'ຈຳນວນວັນລາພັກ' : 'Total Days'}</span>
                  <span className="font-extrabold text-blue-600 text-sm font-mono">
                    {detailRequest.totalDays} {language === 'lo' ? 'ວັນ' : 'days'}
                  </span>
                </div>
              </div>

              {/* Reason & Comments */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-slate-400 text-[10px] block">{language === 'lo' ? 'ເຫດຜົນການລາພັກ' : 'Reason for Leave'}</span>
                <p className="text-slate-800 dark:text-slate-200">{detailRequest.reason}</p>
              </div>

              {detailRequest.approverComments && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300">
                  <span className="text-[10px] block font-semibold">{language === 'lo' ? 'ຄຳເຫັນຈາກຜູ້ອະນຸມັດ:' : 'Approver Comments:'}</span>
                  <p className="mt-0.5">{detailRequest.approverComments}</p>
                </div>
              )}
            </div>
          );
        })()}
      </Modal>
    </div>
  );
};
