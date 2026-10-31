import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { LeaveType, LeaveBalance, LeaveRequest, Employee } from '../../types/index.ts';
import {
  CalendarDays,
  Clock,
  Plus,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Plane,
  HeartPulse,
  Briefcase,
  User,
  ShieldCheck,
  ChevronRight,
  TrendingDown,
  Info,
  Calendar,
} from 'lucide-react';

interface CircularProgressProps {
  size?: number;
  strokeWidth?: number;
  percentage: number;
  color: string;
  bgColor?: string;
  remainingText: number | string;
  totalText?: number | string;
  unitLabel: string;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  size = 110,
  strokeWidth = 9,
  percentage,
  color,
  bgColor = 'stroke-slate-100 dark:stroke-slate-800',
  remainingText,
  totalText,
  unitLabel,
}) => {
  const center = size / 2;
  const radius = center - strokeWidth / 2 - 3;
  const circumference = 2 * Math.PI * radius;
  const safePercentage = Math.min(100, Math.max(0, percentage));
  const strokeDashoffset = circumference - (safePercentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          className={`${bgColor} fill-none transition-all duration-300`}
          strokeWidth={strokeWidth}
        />
        {/* Animated colored progress ring */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="fill-none transition-all duration-700 ease-out"
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
        <span className="text-2xl font-black font-mono tracking-tight text-slate-900 dark:text-slate-100 leading-none">
          {remainingText}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-1">
          {unitLabel}
        </span>
      </div>
    </div>
  );
};

interface LeaveEntitlementCardProps {
  onRequestLeave?: (leaveTypeId?: string) => void;
  className?: string;
}

export const LeaveEntitlementCard: React.FC<LeaveEntitlementCardProps> = ({
  onRequestLeave,
  className = '',
}) => {
  const {
    language,
    currentUser,
    employees,
    leaveTypes,
    leaveBalances,
    leaveRequests,
  } = useApp();

  const isHRorAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'HR_ADMIN';

  // Target Employee: default to currentUser's employeeId or fallback
  const myEmpId = currentUser.employeeId || 'emp-001';
  const [selectedEmpId, setSelectedEmpId] = useState<string>(myEmpId);

  const targetEmployee = employees.find((e) => e.id === selectedEmpId) || employees[0];

  // Specific target leave types mapping
  // lt-1: Annual / Vacation Leave
  // lt-2: Sick Leave
  // lt-3: Personal Business Leave
  const vacationType =
    leaveTypes.find((lt) => lt.id === 'lt-1' || lt.nameEn.toLowerCase().includes('annual') || lt.nameEn.toLowerCase().includes('vacation')) ||
    leaveTypes[0];

  const sickType =
    leaveTypes.find((lt) => lt.id === 'lt-2' || lt.nameEn.toLowerCase().includes('sick')) ||
    leaveTypes[1] ||
    leaveTypes[0];

  const personalType =
    leaveTypes.find((lt) => lt.id === 'lt-3' || lt.nameEn.toLowerCase().includes('personal')) ||
    leaveTypes[2] ||
    leaveTypes[0];

  // Compute entitlement for any leave type dynamically
  const getEntitlement = (type: LeaveType | undefined) => {
    if (!type) {
      return { allocated: 0, used: 0, pending: 0, remaining: 0, remainingPct: 0 };
    }

    const recordedBalance = leaveBalances.find(
      (b) => b.employeeId === selectedEmpId && b.leaveTypeId === type.id
    );

    // Count approved requests for this employee & leave type in 2026
    const empRequests = leaveRequests.filter(
      (r) => r.employeeId === selectedEmpId && r.leaveTypeId === type.id
    );

    const approvedDays = empRequests
      .filter((r) => r.status === 'APPROVED')
      .reduce((sum, r) => sum + r.totalDays, 0);

    const pendingDays = empRequests
      .filter((r) => r.status === 'PENDING')
      .reduce((sum, r) => sum + r.totalDays, 0);

    const allocated = recordedBalance ? recordedBalance.allocated : type.daysAllowed;
    // Prefer recorded used if > approvedDays
    const used = recordedBalance ? Math.max(recordedBalance.used, approvedDays) : approvedDays;
    const remaining = Math.max(0, allocated - used);
    const remainingPct = allocated > 0 ? Math.round((remaining / allocated) * 100) : 0;

    return {
      allocated,
      used,
      pending: pendingDays,
      remaining,
      remainingPct,
    };
  };

  const vacationData = useMemo(() => getEntitlement(vacationType), [selectedEmpId, vacationType, leaveBalances, leaveRequests]);
  const sickData = useMemo(() => getEntitlement(sickType), [selectedEmpId, sickType, leaveBalances, leaveRequests]);
  const personalData = useMemo(() => getEntitlement(personalType), [selectedEmpId, personalType, leaveBalances, leaveRequests]);

  // Combined totals across all 3 key statutory leave entitlements
  const totalAllocated = vacationData.allocated + sickData.allocated + personalData.allocated;
  const totalRemaining = vacationData.remaining + sickData.remaining + personalData.remaining;
  const totalUsed = vacationData.used + sickData.used + personalData.used;
  const totalPending = vacationData.pending + sickData.pending + personalData.pending;
  const overallRemainingPct = totalAllocated > 0 ? Math.round((totalRemaining / totalAllocated) * 100) : 0;

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden transition-all duration-300 ${className}`}>
      {/* 1. Header Ribbon & Employee Selector */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-gradient-to-r from-blue-50/60 via-slate-50/40 to-teal-50/50 dark:from-slate-900 dark:via-slate-900/90 dark:to-blue-950/20 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base text-slate-900 dark:text-slate-100">
                {language === 'lo' ? 'ສິດລາພັກປະຈຳປີ (Leave Entitlement)' : 'Leave Entitlement Card'}
              </h2>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                2026 Quota
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {language === 'lo'
                ? 'ຍອດວັນລາພັກປະຈຳປີ, ລາປ່ວຍ ແລະ ລາກິດສ່ວນຕົວທີ່ຍັງເຫຼືອ'
                : 'Real-time remaining vacation, sick, and personal leave days'}
            </p>
          </div>
        </div>

        {/* User Identity or Admin Switcher */}
        <div className="flex items-center gap-2">
          {isHRorAdmin ? (
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <User className="w-3.5 h-3.5 text-blue-600 ml-1.5" />
              <select
                value={selectedEmpId}
                onChange={(e) => setSelectedEmpId(e.target.value)}
                className="bg-transparent font-bold text-xs text-slate-800 dark:text-slate-200 border-none outline-none pr-2 py-1 cursor-pointer"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.employeeCode} - {language === 'lo' ? `${emp.firstNameLao} ${emp.lastNameLao}` : `${emp.firstNameEn} ${emp.lastNameEn}`}
                    {emp.id === myEmpId ? ' (You)' : ''}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {language === 'lo'
                  ? `${targetEmployee?.firstNameLao} ${targetEmployee?.lastNameLao}`
                  : `${targetEmployee?.firstNameEn} ${targetEmployee?.lastNameEn}`}
              </span>
              <span className="text-[10px] font-mono text-slate-400">({targetEmployee?.employeeCode})</span>
            </div>
          )}

          {onRequestLeave && (
            <button
              onClick={() => onRequestLeave()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{language === 'lo' ? 'ຍື່ນຂໍລາພັກ' : 'Request Leave'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Main Entitlement Grid with Circular Progress Visuals */}
      <div className="p-5 lg:p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Vacation / Annual Leave (Circular Progress) */}
          <div className="relative p-5 rounded-3xl bg-gradient-to-br from-blue-50/70 via-blue-50/20 to-white dark:from-blue-950/20 dark:via-slate-900 dark:to-slate-900 border border-blue-200/80 dark:border-blue-900/40 shadow-xs flex flex-col justify-between group hover:border-blue-300 dark:hover:border-blue-800 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
                  <Plane className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-blue-950 dark:text-blue-100">
                    {language === 'lo' ? 'ລາພັກປະຈຳປີ (Vacation)' : 'Vacation / Annual Leave'}
                  </h3>
                  <span className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold">
                    100% Paid Leave Quota
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                {vacationData.remainingPct}% Left
              </span>
            </div>

            {/* Circular Progress Gauge */}
            <div className="py-2 flex items-center justify-center">
              <CircularProgress
                size={116}
                strokeWidth={10}
                percentage={vacationData.remainingPct}
                color="#2563eb" // Blue 600
                remainingText={vacationData.remaining}
                totalText={vacationData.allocated}
                unitLabel={language === 'lo' ? 'ມື້ຍັງເຫຼືອ' : 'Days Left'}
              />
            </div>

            {/* Quota Footprint */}
            <div className="mt-3 pt-3 border-t border-blue-100 dark:border-blue-900/60 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500 dark:text-slate-400">
                  {language === 'lo' ? 'ໂຄຕ້າທັງໝົດ:' : 'Allocated:'} <strong>{vacationData.allocated}d</strong>
                </span>
                <span className="text-slate-600 dark:text-slate-300">
                  {language === 'lo' ? 'ໃຊ້ແລ້ວ:' : 'Used:'} <strong className="text-blue-600 dark:text-blue-400">{vacationData.used}d</strong>
                </span>
              </div>

              {/* Progress Mini Track */}
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.round((vacationData.used / (vacationData.allocated || 1)) * 100))}%` }}
                />
              </div>

              {/* Action Link */}
              <div className="flex items-center justify-between text-[11px] pt-1">
                {vacationData.pending > 0 ? (
                  <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {vacationData.pending}d {language === 'lo' ? 'ລໍຖ້າອະນຸມັດ' : 'pending'}
                  </span>
                ) : (
                  <span className="text-slate-400 text-[10px]">No pending requests</span>
                )}
                {onRequestLeave && (
                  <button
                    onClick={() => onRequestLeave(vacationType?.id)}
                    className="font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
                  >
                    <span>{language === 'lo' ? 'ຍື່ນລາພັກ' : 'Apply'}</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Sick Leave (Circular Progress) */}
          <div className="relative p-5 rounded-3xl bg-gradient-to-br from-rose-50/70 via-rose-50/20 to-white dark:from-rose-950/20 dark:via-slate-900 dark:to-slate-900 border border-rose-200/80 dark:border-rose-900/40 shadow-xs flex flex-col justify-between group hover:border-rose-300 dark:hover:border-rose-800 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-sm">
                  <HeartPulse className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-rose-950 dark:text-rose-100">
                    {language === 'lo' ? 'ລາປ່ວຍ (Sick Leave)' : 'Medical / Sick Leave'}
                  </h3>
                  <span className="text-[10px] text-rose-700 dark:text-rose-400 font-semibold">
                    Medical Cert &gt; 2 Days
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                {sickData.remainingPct}% Left
              </span>
            </div>

            {/* Circular Progress Gauge */}
            <div className="py-2 flex items-center justify-center">
              <CircularProgress
                size={116}
                strokeWidth={10}
                percentage={sickData.remainingPct}
                color="#e11d48" // Rose 600
                remainingText={sickData.remaining}
                totalText={sickData.allocated}
                unitLabel={language === 'lo' ? 'ມື້ຍັງເຫຼືອ' : 'Days Left'}
              />
            </div>

            {/* Quota Footprint */}
            <div className="mt-3 pt-3 border-t border-rose-100 dark:border-rose-900/60 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500 dark:text-slate-400">
                  {language === 'lo' ? 'ໂຄຕ້າທັງໝົດ:' : 'Allocated:'} <strong>{sickData.allocated}d</strong>
                </span>
                <span className="text-slate-600 dark:text-slate-300">
                  {language === 'lo' ? 'ໃຊ້ແລ້ວ:' : 'Used:'} <strong className="text-rose-600 dark:text-rose-400">{sickData.used}d</strong>
                </span>
              </div>

              {/* Progress Mini Track */}
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.round((sickData.used / (sickData.allocated || 1)) * 100))}%` }}
                />
              </div>

              {/* Action Link */}
              <div className="flex items-center justify-between text-[11px] pt-1">
                {sickData.pending > 0 ? (
                  <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {sickData.pending}d {language === 'lo' ? 'ລໍຖ້າອະນຸມັດ' : 'pending'}
                  </span>
                ) : (
                  <span className="text-slate-400 text-[10px]">Medical cert compliant</span>
                )}
                {onRequestLeave && (
                  <button
                    onClick={() => onRequestLeave(sickType?.id)}
                    className="font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-0.5"
                  >
                    <span>{language === 'lo' ? 'ຍື່ນລາປ່ວຍ' : 'Apply'}</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Card 3: Personal Business Leave (Circular Progress) */}
          <div className="relative p-5 rounded-3xl bg-gradient-to-br from-purple-50/70 via-purple-50/20 to-white dark:from-purple-950/20 dark:via-slate-900 dark:to-slate-900 border border-purple-200/80 dark:border-purple-900/40 shadow-xs flex flex-col justify-between group hover:border-purple-300 dark:hover:border-purple-800 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-sm">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-purple-950 dark:text-purple-100">
                    {language === 'lo' ? 'ລາກິດສ່ວນຕົວ (Personal)' : 'Personal Business Leave'}
                  </h3>
                  <span className="text-[10px] text-purple-700 dark:text-purple-400 font-semibold">
                    Family & Urgent Matters
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                {personalData.remainingPct}% Left
              </span>
            </div>

            {/* Circular Progress Gauge */}
            <div className="py-2 flex items-center justify-center">
              <CircularProgress
                size={116}
                strokeWidth={10}
                percentage={personalData.remainingPct}
                color="#9333ea" // Purple 600
                remainingText={personalData.remaining}
                totalText={personalData.allocated}
                unitLabel={language === 'lo' ? 'ມື້ຍັງເຫຼືອ' : 'Days Left'}
              />
            </div>

            {/* Quota Footprint */}
            <div className="mt-3 pt-3 border-t border-purple-100 dark:border-purple-900/60 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500 dark:text-slate-400">
                  {language === 'lo' ? 'ໂຄຕ້າທັງໝົດ:' : 'Allocated:'} <strong>{personalData.allocated}d</strong>
                </span>
                <span className="text-slate-600 dark:text-slate-300">
                  {language === 'lo' ? 'ໃຊ້ແລ້ວ:' : 'Used:'} <strong className="text-purple-600 dark:text-purple-400">{personalData.used}d</strong>
                </span>
              </div>

              {/* Progress Mini Track */}
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.round((personalData.used / (personalData.allocated || 1)) * 100))}%` }}
                />
              </div>

              {/* Action Link */}
              <div className="flex items-center justify-between text-[11px] pt-1">
                {personalData.pending > 0 ? (
                  <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {personalData.pending}d {language === 'lo' ? 'ລໍຖ້າອະນຸມັດ' : 'pending'}
                  </span>
                ) : (
                  <span className="text-slate-400 text-[10px]">Standard personal quota</span>
                )}
                {onRequestLeave && (
                  <button
                    onClick={() => onRequestLeave(personalType?.id)}
                    className="font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-0.5"
                  >
                    <span>{language === 'lo' ? 'ຍື່ນລາກິດ' : 'Apply'}</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Combined Annual Leave Health Meter Footer */}
        <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center font-bold text-sm shrink-0">
              <Sparkles className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <span>{language === 'lo' ? 'ພາບລວມສິດລາພັກລວມທັງໝົດ:' : 'Consolidated Leave Standing:'}</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-extrabold text-sm">
                  {totalRemaining} / {totalAllocated} {language === 'lo' ? 'ມື້ຍັງເຫຼືອ' : 'Days Available'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {overallRemainingPct}% Intact
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {language === 'lo'
                  ? `ໃຊ້ໄປແລ້ວທັງໝົດ ${totalUsed} ວັນ • ລໍຖ້າອະນຸມັດ ${totalPending} ວັນ (ກົດໝາຍແຮງງານ ແຫ່ງ ສປປ ລາວ)`
                  : `Used across all categories: ${totalUsed} days • Pending approvals: ${totalPending} days (Lao Labor Law compliant)`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[11px] shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
              <span className="text-slate-600 dark:text-slate-400">{language === 'lo' ? 'ປະຈຳປີ' : 'Vacation'}: {vacationData.remaining}d</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block" />
              <span className="text-slate-600 dark:text-slate-400">{language === 'lo' ? 'ລາປ່ວຍ' : 'Sick'}: {sickData.remaining}d</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block" />
              <span className="text-slate-600 dark:text-slate-400">{language === 'lo' ? 'ລາກິດ' : 'Personal'}: {personalData.remaining}d</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
