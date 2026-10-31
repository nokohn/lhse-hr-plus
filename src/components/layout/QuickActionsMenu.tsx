import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { alerts } from '../../utils/alerts.ts';
import {
  Sparkles,
  ChevronDown,
  CalendarPlus,
  Clock,
  Receipt,
  Target,
  FileCheck,
  UserPlus,
  ArrowRight,
  X,
  Check,
  Calendar,
  DollarSign,
  MapPin,
  Building2,
  FileText,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { useFormAutoSave } from '../../hooks/useFormAutoSave.ts';
import { FormAutoSaveIndicator } from '../common/FormAutoSaveIndicator.tsx';

interface QuickActionsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
}

export const QuickActionsMenu: React.FC<QuickActionsMenuProps> = ({
  isOpen,
  onClose,
  onToggle,
}) => {
  const {
    language,
    currentUser,
    employees,
    leaveTypes,
    leaveBalances,
    attendanceRecords,
    submitLeaveRequest,
    submitExpenseClaim,
    punchInOut,
    setActiveModule,
    setActiveSubModule,
  } = useApp();

  const menuRef = useRef<HTMLDivElement>(null);

  // Modals state for one-click actions
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);

  // Leave Form State
  const [leaveTypeId, setLeaveTypeId] = useState(leaveTypes[0]?.id || 'lt-1');
  const [leaveStartDate, setLeaveStartDate] = useState('2026-10-26');
  const [leaveEndDate, setLeaveEndDate] = useState('2026-10-27');
  const [leaveReason, setLeaveReason] = useState('');

  const initialQuickLeaveDraft = {
    leaveTypeId: leaveTypes[0]?.id || 'lt-1',
    leaveStartDate: '2026-10-26',
    leaveEndDate: '2026-10-27',
    leaveReason: '',
  };

  const quickLeaveAutoSave = useFormAutoSave({
    formId: 'quick_leave_draft',
    formData: { leaveTypeId, leaveStartDate, leaveEndDate, leaveReason },
    setFormData: (val: any) => {
      const d = typeof val === 'function' ? val({ leaveTypeId, leaveStartDate, leaveEndDate, leaveReason }) : val;
      if (d.leaveTypeId) setLeaveTypeId(d.leaveTypeId);
      if (d.leaveStartDate) setLeaveStartDate(d.leaveStartDate);
      if (d.leaveEndDate) setLeaveEndDate(d.leaveEndDate);
      if (d.leaveReason !== undefined) setLeaveReason(d.leaveReason);
    },
    initialData: initialQuickLeaveDraft,
    isOpen: isLeaveModalOpen,
  });

  // Expense Form State
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<'TRAVEL' | 'SUPPLIES' | 'MEALS' | 'REPRESENTATION' | 'OTHER'>('TRAVEL');
  const [expenseAmount, setExpenseAmount] = useState<string>('500000');
  const [expenseReceiptsCount, setExpenseReceiptsCount] = useState<number>(1);

  const initialQuickExpenseDraft = {
    expenseTitle: '',
    expenseCategory: 'TRAVEL' as const,
    expenseAmount: '500000',
    expenseReceiptsCount: 1,
  };

  const quickExpenseAutoSave = useFormAutoSave({
    formId: 'quick_expense_draft',
    formData: { expenseTitle, expenseCategory, expenseAmount, expenseReceiptsCount },
    setFormData: (val: any) => {
      const d = typeof val === 'function' ? val({ expenseTitle, expenseCategory, expenseAmount, expenseReceiptsCount }) : val;
      if (d.expenseTitle !== undefined) setExpenseTitle(d.expenseTitle);
      if (d.expenseCategory) setExpenseCategory(d.expenseCategory);
      if (d.expenseAmount !== undefined) setExpenseAmount(d.expenseAmount);
      if (d.expenseReceiptsCount !== undefined) setExpenseReceiptsCount(d.expenseReceiptsCount);
    },
    initialData: initialQuickExpenseDraft,
    isOpen: isExpenseModalOpen,
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Keyboard shortcut listener (Alt+Q to toggle quick actions)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.altKey && e.key.toLowerCase() === 'q') || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'q')) {
        e.preventDefault();
        onToggle();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggle]);

  // Today's attendance info for current user
  const todayStr = '2026-10-23';
  const currentEmpId = currentUser.employeeId || 'emp-001';
  const todayPunch = useMemo(() => {
    return attendanceRecords.find((r) => r.employeeId === currentEmpId && r.date === todayStr);
  }, [attendanceRecords, currentEmpId, todayStr]);

  // Current user's annual leave balance
  const annualLeaveBalance = useMemo(() => {
    return leaveBalances.find((b) => b.employeeId === currentEmpId && b.leaveTypeId === 'lt-1');
  }, [leaveBalances, currentEmpId]);

  // Calculate days for leave request
  const calculatedDays = useMemo(() => {
    try {
      const start = new Date(leaveStartDate);
      const end = new Date(leaveEndDate);
      const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;
      return Math.max(1, diff);
    } catch {
      return 1;
    }
  }, [leaveStartDate, leaveEndDate]);

  // Handle Leave Submission
  const handleLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveReason.trim()) {
      alerts.error(
        language === 'lo' ? 'ກະລຸນາປ້ອນເຫດຜົນການລາພັກ' : 'Please provide a reason for leave'
      );
      return;
    }

    submitLeaveRequest(leaveTypeId, leaveStartDate, leaveEndDate, calculatedDays, leaveReason.trim());
    quickLeaveAutoSave.clearDraft();
    setIsLeaveModalOpen(false);
    setLeaveReason('');
  };

  // Handle Expense Submission
  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle.trim()) {
      alerts.error(
        language === 'lo' ? 'ກະລຸນາປ້ອນຫົວຂໍ້ການເບີກຈ່າຍ' : 'Please enter an expense title'
      );
      return;
    }
    const amt = parseFloat(expenseAmount.replace(/,/g, ''));
    if (isNaN(amt) || amt <= 0) {
      alerts.error(
        language === 'lo' ? 'ກະລຸນາປ້ອນຈຳນວນເງິນທີ່ຖືກຕ້ອງ' : 'Please enter a valid amount'
      );
      return;
    }

    submitExpenseClaim(expenseTitle.trim(), expenseCategory, amt, expenseReceiptsCount);
    quickExpenseAutoSave.clearDraft();
    setIsExpenseModalOpen(false);
    setExpenseTitle('');
    setExpenseAmount('500000');
  };

  // Handle Punch In / Out
  const handlePunch = (type: 'IN' | 'OUT') => {
    punchInOut(type);
    setIsAttendanceModalOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* 1. Header Trigger Button */}
      <button
        onClick={onToggle}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
          isOpen
            ? 'bg-blue-700 text-white ring-2 ring-blue-400/50 shadow-md'
            : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/20'
        }`}
        title={language === 'lo' ? 'ການດຳເນີນງານດ່ວນ (Alt+Q)' : 'Quick Actions (Alt+Q)'}
        aria-expanded={isOpen}
      >
        <Sparkles className="w-3.5 h-3.5 text-blue-200 animate-pulse" />
        <span className="hidden sm:inline font-bold">
          {language === 'lo' ? 'ດຳເນີນການດ່ວນ' : 'Quick Actions'}
        </span>
        <span className="sm:hidden font-bold">
          {language === 'lo' ? 'ດ່ວນ' : 'Quick'}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 opacity-80 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* 2. Quick Actions Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-850/60 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>{language === 'lo' ? 'ເມນູການດຳເນີນງານດ່ວນ' : 'Quick Actions Menu'}</span>
              </h3>
              <p className="text-[10px] text-slate-500">
                {language === 'lo'
                  ? 'ເຂົ້າເຖິງວຽກປະຈຳວັນຫຼັກດ້ວຍການຄລິກພຽງຄັ້ງດຽວ'
                  : 'Instant one-click access to common daily HR tasks'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Action Items List */}
          <div className="p-2 space-y-1">
            {/* Action 1: Request Leave */}
            <div
              onClick={() => {
                onClose();
                setIsLeaveModalOpen(true);
              }}
              className="group flex items-start gap-3 p-3 rounded-2xl hover:bg-blue-50/80 dark:hover:bg-blue-950/40 border border-transparent hover:border-blue-200 dark:hover:border-blue-900/60 transition-all cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                <CalendarPlus className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {language === 'lo' ? 'ຍື່ນຂໍລາພັກ (Request Leave)' : 'Request Leave'}
                  </span>
                  {annualLeaveBalance && (
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.2 rounded-md">
                      {annualLeaveBalance.remaining}d left
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                  {language === 'lo'
                    ? 'ລາພັກປະຈຳປີ, ລາປ່ວຍ, ລາກິດສ່ວນຕົວ'
                    : 'Annual, Sick, or Personal Business Leave'}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all mt-1" />
            </div>

            {/* Action 2: Log Attendance */}
            <div
              onClick={() => {
                onClose();
                setIsAttendanceModalOpen(true);
              }}
              className="group flex items-start gap-3 p-3 rounded-2xl hover:bg-emerald-50/80 dark:hover:bg-emerald-950/40 border border-transparent hover:border-emerald-200 dark:hover:border-emerald-900/60 transition-all cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                <Clock className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {language === 'lo' ? 'ລົງເວລາເຂົ້າ-ອອກວຽກ (Log Attendance)' : 'Log Attendance'}
                  </span>
                  <span
                    className={`text-[10px] font-bold font-mono px-1.5 py-0.2 rounded-md ${
                      todayPunch?.checkIn
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {todayPunch?.checkIn ? `In: ${todayPunch.checkIn}` : 'Not In'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                  {language === 'lo'
                    ? 'ເຊັກອິນ / ເຊັກເອົາ ຜ່ານ GPS & ສະແກນໃບໜ້າ'
                    : 'Punch in/out via GPS Geofence & biometric'}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all mt-1" />
            </div>

            {/* Action 3: Submit Expense */}
            <div
              onClick={() => {
                onClose();
                setIsExpenseModalOpen(true);
              }}
              className="group flex items-start gap-3 p-3 rounded-2xl hover:bg-amber-50/80 dark:hover:bg-amber-950/40 border border-transparent hover:border-amber-200 dark:hover:border-amber-900/60 transition-all cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                <Receipt className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    {language === 'lo' ? 'ຍື່ນຂໍເບີກຈ່າຍ (Submit Expense)' : 'Submit Expense'}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    LAK Claims
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                  {language === 'lo'
                    ? 'ຄ່າເດີນທາງ, ຄ່າອາຫານ, ອຸປະກອນ & ຮັບແຂກ'
                    : 'Travel, Meals, Supplies & Representation'}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all mt-1" />
            </div>

            {/* Secondary Shortcuts divider */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                {language === 'lo' ? 'ທາງລັດເພີ່ມເຕີມ' : 'Additional Shortcuts'}
              </span>

              <div className="grid grid-cols-2 gap-1.5 px-1">
                {/* Shortcut 1: Review Approvals */}
                <button
                  onClick={() => {
                    onClose();
                    setActiveModule('module-12');
                    setActiveSubModule('pending');
                  }}
                  className="flex items-center gap-2 p-2 rounded-xl text-left text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  <FileCheck className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span className="truncate">{language === 'lo' ? 'ຄຳຮ້ອງອະນຸມັດ' : 'Approvals'}</span>
                </button>

                {/* Shortcut 2: Performance & KPI Tracker */}
                <button
                  onClick={() => {
                    onClose();
                    setActiveModule('module-2');
                    setActiveSubModule('performance');
                  }}
                  className="flex items-center gap-2 p-2 rounded-xl text-left text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  <Target className="w-4 h-4 text-purple-500 shrink-0" />
                  <span className="truncate">{language === 'lo' ? 'ຄຸ້ມຄອງຜົນງານ & KPI' : 'Performance & KPIs'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Footer with keyboard hint */}
          <div className="p-3 bg-slate-50 dark:bg-slate-850 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>Shortcut: <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono text-[10px]">Alt + Q</kbd></span>
            <span className="font-mono">LHSE Enterprise</span>
          </div>
        </div>
      )}

      {/* 3. QUICK LEAVE REQUEST MODAL */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <CalendarPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    {language === 'lo' ? 'ຍື່ນຂໍລາພັກດ່ວນ' : 'Quick Leave Request'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {language === 'lo' ? 'ຍື່ນຄຳຮ້ອງຂໍລາພັກຜ່ານສາຍການອະນຸມັດ' : 'Submit leave for direct workflow review'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsLeaveModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLeaveSubmit} className="space-y-3.5 text-xs">
              {/* Draft Auto-Save Feedback */}
              <FormAutoSaveIndicator
                isSaving={quickLeaveAutoSave.isSaving}
                lastSaved={quickLeaveAutoSave.lastSaved}
                isRestored={quickLeaveAutoSave.isRestored}
                onDiscard={() => {
                  quickLeaveAutoSave.discardDraft();
                  setLeaveTypeId(initialQuickLeaveDraft.leaveTypeId);
                  setLeaveStartDate(initialQuickLeaveDraft.leaveStartDate);
                  setLeaveEndDate(initialQuickLeaveDraft.leaveEndDate);
                  setLeaveReason('');
                }}
                language={language}
              />

              {/* Leave Type */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  {language === 'lo' ? 'ປະເພດການລາພັກ *' : 'Leave Type *'}
                </label>
                <select
                  value={leaveTypeId}
                  onChange={(e) => setLeaveTypeId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  {leaveTypes.map((lt) => (
                    <option key={lt.id} value={lt.id}>
                      {language === 'lo' ? lt.nameLao : lt.nameEn} ({lt.daysAllowed} {language === 'lo' ? 'ວັນ' : 'days'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    {language === 'lo' ? 'ວັນທີເລີ່ມ *' : 'Start Date *'}
                  </label>
                  <input
                    type="date"
                    value={leaveStartDate}
                    onChange={(e) => setLeaveStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-hidden focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    {language === 'lo' ? 'ວັນທີສິ້ນສຸດ *' : 'End Date *'}
                  </label>
                  <input
                    type="date"
                    value={leaveEndDate}
                    onChange={(e) => setLeaveEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-hidden focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Total Duration Banner */}
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex items-center justify-between text-xs">
                <span className="text-blue-800 dark:text-blue-300 font-medium">
                  {language === 'lo' ? 'ໄລຍະເວລາລວມ:' : 'Total Duration:'}
                </span>
                <span className="font-bold font-mono text-blue-700 dark:text-blue-300 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-lg border border-blue-200 dark:border-blue-800">
                  {calculatedDays} {language === 'lo' ? 'ວັນ' : 'Days'}
                </span>
              </div>

              {/* Reason */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  {language === 'lo' ? 'ເຫດຜົນການລາພັກ *' : 'Reason for Leave *'}
                </label>
                <textarea
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder={
                    language === 'lo'
                      ? 'ລະບຸເຫດຜົນການລາພັກ (ເຊັ່ນ: ພາຄອບຄົວໄປຢາມບ້ານ, ໄປກວດສຸຂະພາບ...)'
                      : 'State the purpose of your leave request...'
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-hidden focus:ring-2 focus:ring-blue-500 h-20 resize-none"
                  required
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLeaveModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
                >
                  {language === 'lo' ? 'ຍົກເລີກ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{language === 'lo' ? 'ສົ່ງຄຳຮ້ອງ' : 'Submit Request'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. QUICK EXPENSE CLAIM MODAL */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    {language === 'lo' ? 'ຍື່ນໃບສະເໜີເບີກຈ່າຍດ່ວນ' : 'Quick Expense Claim'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {language === 'lo' ? 'ສົ່ງເອກະສານເບີກຈ່າຍລາຍຈ່າຍບໍລິຫານ & ເດີນທາງ' : 'Submit official expense claim in LAK'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsExpenseModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExpenseSubmit} className="space-y-3.5 text-xs">
              {/* Draft Auto-Save Feedback */}
              <FormAutoSaveIndicator
                isSaving={quickExpenseAutoSave.isSaving}
                lastSaved={quickExpenseAutoSave.lastSaved}
                isRestored={quickExpenseAutoSave.isRestored}
                onDiscard={() => {
                  quickExpenseAutoSave.discardDraft();
                  setExpenseTitle(initialQuickExpenseDraft.expenseTitle);
                  setExpenseCategory(initialQuickExpenseDraft.expenseCategory);
                  setExpenseAmount(initialQuickExpenseDraft.expenseAmount);
                  setExpenseReceiptsCount(initialQuickExpenseDraft.expenseReceiptsCount);
                }}
                language={language}
              />

              {/* Claim Title */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  {language === 'lo' ? 'ຫົວຂໍ້ການເບີກຈ່າຍ *' : 'Expense Title *'}
                </label>
                <input
                  type="text"
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  placeholder={
                    language === 'lo'
                      ? 'ເຊັ່ນ: ຄ່າເດີນທາງກວດກາໂຄງການ, ຄ່າອາຫານຮັບຮອງ...'
                      : 'e.g. Travel expenses for Nam Theun 2 site audit'
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-hidden focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  {language === 'lo' ? 'ໝວດໝູ່ລາຍຈ່າຍ *' : 'Expense Category *'}
                </label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium outline-hidden focus:ring-2 focus:ring-amber-500"
                >
                  <option value="TRAVEL">{language === 'lo' ? 'ຄ່າເດີນທາງ & ທີ່ພັກ (Travel)' : 'Travel & Lodging'}</option>
                  <option value="MEALS">{language === 'lo' ? 'ຄ່າອາຫານ & ເບ້ຍລ້ຽງ (Meals)' : 'Meals & Per Diem'}</option>
                  <option value="SUPPLIES">{language === 'lo' ? 'ອຸປະກອນ & ເຄື່ອງໃຊ້ຫ້ອງການ (Supplies)' : 'Office Supplies'}</option>
                  <option value="REPRESENTATION">{language === 'lo' ? 'ຄ່າຮັບຮອງແຂກ (Representation)' : 'Client Representation'}</option>
                  <option value="OTHER">{language === 'lo' ? 'ອື່ນໆ (Other)' : 'Other'}</option>
                </select>
              </div>

              {/* Amount and Receipts Count */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    {language === 'lo' ? 'ຈຳນວນເງິນ (LAK) *' : 'Total Amount (LAK) *'}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={expenseAmount}
                      onChange={(e) => setExpenseAmount(e.target.value)}
                      min="1000"
                      step="500"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold outline-hidden focus:ring-2 focus:ring-amber-500 pr-12"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono">
                      LAK
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    {language === 'lo' ? 'ຈຳນວນໃບຮັບເງິນ' : 'Receipts Count'}
                  </label>
                  <input
                    type="number"
                    value={expenseReceiptsCount}
                    onChange={(e) => setExpenseReceiptsCount(Math.max(1, parseInt(e.target.value) || 1))}
                    min="1"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Approver Preview */}
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between text-[11px]">
                <span className="text-amber-800 dark:text-amber-300">
                  {language === 'lo' ? 'ສາຍການອະນຸມັດ:' : 'Workflow Routing:'}
                </span>
                <span className="font-bold text-amber-900 dark:text-amber-200">
                  Finance & Accounting / GM
                </span>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
                >
                  {language === 'lo' ? 'ຍົກເລີກ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{language === 'lo' ? 'ສົ່ງໃບເບີກຈ່າຍ' : 'Submit Claim'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. QUICK ATTENDANCE LOG DIALOG */}
      {isAttendanceModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in-95 text-center">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {language === 'lo' ? 'ບັນທຶກເວລາເຮັດວຽກ' : 'Attendance Punch'}
              </span>
              <button
                onClick={() => setIsAttendanceModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live Clock Display */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-slate-50 to-white dark:from-emerald-950/40 dark:via-slate-800/40 dark:to-slate-900 border border-emerald-200 dark:border-emerald-900/60 space-y-1">
              <div className="text-3xl font-black font-mono text-slate-900 dark:text-slate-100 tracking-wider">
                08:05:22
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {language === 'lo' ? 'ວັນສຸກ, 23 ຕຸລາ 2026' : 'Friday, 23 October 2026'}
              </p>
              <div className="pt-2 flex items-center justify-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                <MapPin className="w-3.5 h-3.5" />
                <span>LHSE Vientiane HQ (GPS Geofence Verified)</span>
              </div>
            </div>

            {/* Current Status */}
            <div className="text-xs text-slate-600 dark:text-slate-400">
              {todayPunch?.checkIn ? (
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-medium">
                  {language === 'lo' ? 'ທ່ານໄດ້ເຊັກອິນແລ້ວເມື່ອ:' : 'Checked in today at:'}{' '}
                  <strong className="font-mono">{todayPunch.checkIn}</strong>
                  {todayPunch.checkOut && (
                    <span> • {language === 'lo' ? 'ເຊັກເອົາ:' : 'Out:'} <strong className="font-mono">{todayPunch.checkOut}</strong></span>
                  )}
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-medium">
                  {language === 'lo' ? 'ທ່ານຍັງບໍ່ໄດ້ເຊັກອິນເຂົ້າວຽກໃນມື້ນີ້' : 'You have not punched in yet today'}
                </div>
              )}
            </div>

            {/* Punch Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => handlePunch('IN')}
                className={`py-3 rounded-2xl font-bold text-xs shadow-xs transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  todayPunch?.checkIn
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                }`}
                disabled={Boolean(todayPunch?.checkIn)}
              >
                <Clock className="w-5 h-5" />
                <span>{language === 'lo' ? 'ເຊັກອິນເຂົ້າວຽກ' : 'Punch In'}</span>
              </button>

              <button
                type="button"
                onClick={() => handlePunch('OUT')}
                className={`py-3 rounded-2xl font-bold text-xs shadow-xs transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  todayPunch?.checkOut
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                }`}
              >
                <Clock className="w-5 h-5" />
                <span>{language === 'lo' ? 'ເຊັກເອົາອອກວຽກ' : 'Punch Out'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
