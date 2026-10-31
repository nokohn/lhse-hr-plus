import React from 'react';
import { CheckCircle2, Clock, XCircle, AlertCircle, Sparkles, UserCheck, ShieldCheck, FileCheck } from 'lucide-react';

interface LeaveApprovalProgressBarProps {
  currentStep: number;
  totalSteps?: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'RETURNED' | 'CANCELLED';
  compact?: boolean;
  language?: 'lo' | 'en';
  approverName?: string;
  approvedAt?: string;
}

export const LeaveApprovalProgressBar: React.FC<LeaveApprovalProgressBarProps> = ({
  currentStep,
  totalSteps = 2,
  status,
  compact = false,
  language = 'lo',
  approverName,
  approvedAt,
}) => {
  // Calculate percentage
  let percentage = 0;
  let barColor = 'bg-blue-600';
  let statusTextLao = '';
  let statusTextEn = '';

  if (status === 'APPROVED') {
    percentage = 100;
    barColor = 'bg-emerald-500';
    statusTextLao = 'ອະນຸມັດສຳເລັດ (100%)';
    statusTextEn = 'Approved (100%)';
  } else if (status === 'REJECTED') {
    percentage = 100;
    barColor = 'bg-rose-500';
    statusTextLao = 'ຖືກປະຕິເສດ';
    statusTextEn = 'Rejected';
  } else if (status === 'RETURNED') {
    percentage = 30;
    barColor = 'bg-amber-500';
    statusTextLao = 'ສົ່ງກັບເພື່ອແກ້ໄຂ';
    statusTextEn = 'Returned for Edit';
  } else if (status === 'CANCELLED') {
    percentage = 0;
    barColor = 'bg-slate-400';
    statusTextLao = 'ຍົກເລີກແລ້ວ';
    statusTextEn = 'Cancelled';
  } else {
    // PENDING
    const effectiveTotal = Math.max(totalSteps, 2);
    // If step 1, 50%; if step 2, 80%
    percentage = Math.round((currentStep / (effectiveTotal + 0.5)) * 100);
    barColor = 'bg-gradient-to-r from-blue-500 to-indigo-500';
    statusTextLao = `ລໍຖ້າອະນຸມັດ ຂັ້ນຕອນ ${currentStep}/${effectiveTotal}`;
    statusTextEn = `Pending Review Step ${currentStep}/${effectiveTotal}`;
  }

  if (compact) {
    return (
      <div className="w-full max-w-[180px] space-y-1">
        <div className="flex items-center justify-between text-[10px]">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {language === 'lo' ? statusTextLao : statusTextEn}
          </span>
          <span className="font-mono font-bold text-slate-500">{percentage}%</span>
        </div>
        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/50 dark:border-slate-700/50">
          <div
            className={`h-full rounded-full transition-all duration-700 ${barColor} ${
              status === 'PENDING' ? 'animate-pulse' : ''
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  }

  // Expanded detailed multi-step progress bar
  const steps = [
    {
      num: 1,
      titleLao: 'ຍື່ນຄຳຮ້ອງ',
      titleEn: 'Submitted',
      descLao: 'ພະນັກງານຍື່ນ',
      descEn: 'Employee Request',
      icon: FileCheck,
      isDone: true,
      isActive: status === 'PENDING' && currentStep === 1,
    },
    {
      num: 2,
      titleLao: 'ຫົວໜ້າກວດກາ',
      titleEn: 'Manager Review',
      descLao: 'ຫົວໜ້າສາຍງານ',
      descEn: 'Line Manager',
      icon: UserCheck,
      isDone: status === 'APPROVED' || (status === 'PENDING' && currentStep > 1),
      isActive: status === 'PENDING' && currentStep === 1,
    },
    {
      num: 3,
      titleLao: 'HR ອະນຸມັດ',
      titleEn: 'HR Approved',
      descLao: 'ພະແນກບຸກຄະລາກອນ',
      descEn: 'Executive / HR Admin',
      icon: ShieldCheck,
      isDone: status === 'APPROVED',
      isActive: status === 'PENDING' && currentStep >= 2,
    },
  ];

  return (
    <div className="w-full p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
            {language === 'lo' ? 'ຄວາມຄືບໜ້າການອະນຸມັດ (Approval Progress Bar)' : 'Leave Approval Workflow Progress'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] ${
              status === 'APPROVED'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                : status === 'REJECTED'
                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
            }`}
          >
            {percentage}%
          </span>
        </div>
      </div>

      {/* Progress Track */}
      <div className="relative w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Multi-step checkpoints */}
      <div className="grid grid-cols-3 gap-2 pt-1 text-center">
        {steps.map((st) => {
          const Icon = st.icon;
          return (
            <div key={st.num} className="flex flex-col items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-xs ${
                  st.isDone
                    ? 'bg-emerald-500 text-white'
                    : st.isActive
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900/50 animate-pulse'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                }`}
              >
                {st.isDone ? <CheckCircle2 className="w-4 h-4" /> : st.num}
              </div>
              <div className="mt-1 font-bold text-[11px] text-slate-800 dark:text-slate-200">
                {language === 'lo' ? st.titleLao : st.titleEn}
              </div>
              <div className="text-[10px] text-slate-400">
                {language === 'lo' ? st.descLao : st.descEn}
              </div>
            </div>
          );
        })}
      </div>

      {(approverName || approvedAt) && (
        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[10px] text-slate-500">
          {approverName && <span>{language === 'lo' ? 'ຜູ້ກວດກາ:' : 'Approver:'} <strong>{approverName}</strong></span>}
          {approvedAt && <span>{language === 'lo' ? 'ວັນທີອະນຸມັດ:' : 'Approved on:'} {new Date(approvedAt).toLocaleDateString()}</span>}
        </div>
      )}
    </div>
  );
};

interface AnnualLeaveQuotaBarProps {
  allocated: number;
  used: number;
  requesting?: number;
  leaveTypeName?: string;
  language?: 'lo' | 'en';
}

export const AnnualLeaveQuotaBar: React.FC<AnnualLeaveQuotaBarProps> = ({
  allocated,
  used,
  requesting = 0,
  leaveTypeName,
  language = 'lo',
}) => {
  const safeAllocated = Math.max(allocated, 1);
  const usedPct = Math.min(100, (used / safeAllocated) * 100);
  const reqPct = Math.min(100 - usedPct, (requesting / safeAllocated) * 100);
  const remaining = Math.max(0, allocated - used - requesting);
  const remainingPct = Math.max(0, 100 - usedPct - reqPct);

  const isExceeded = used + requesting > allocated;

  return (
    <div className="w-full p-4 rounded-2xl bg-gradient-to-br from-blue-50/60 via-slate-50/40 to-indigo-50/60 dark:from-slate-800/60 dark:via-slate-800/40 dark:to-blue-950/20 border border-blue-200/70 dark:border-blue-900/40 space-y-2.5">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
            {leaveTypeName || (language === 'lo' ? 'ໂຄຕ້າວັນລາພັກປະຈຳປີ (Annual Leave Quota)' : 'Annual Leave Quota Utilization')}
          </span>
          <span className="text-[10px] text-slate-400 block">
            {language === 'lo' ? 'ສິດລາພັກຕາມກົດໝາຍແຮງງານ 15 ວັນ/ປີ' : 'Statutory LHSE Standard Quota (15 days/year)'}
          </span>
        </div>
        <div className="text-right">
          <span className="font-mono font-black text-sm text-blue-600 dark:text-blue-400">
            {used + requesting} / {allocated} {language === 'lo' ? 'ວັນ' : 'days'}
          </span>
          <span className="text-[10px] font-bold text-slate-500 block">
            {Math.round(((used + requesting) / safeAllocated) * 100)}% {language === 'lo' ? 'ນຳໃຊ້ແລ້ວ' : 'used'}
          </span>
        </div>
      </div>

      {/* Segmented Progress Bar */}
      <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden p-0.5 flex">
        {/* Used Segment */}
        {usedPct > 0 && (
          <div
            className="h-full bg-blue-600 rounded-l-full transition-all duration-500 relative group"
            style={{ width: `${usedPct}%` }}
            title={`Used: ${used} days`}
          />
        )}
        {/* Requesting Segment (Animated striped amber) */}
        {reqPct > 0 && (
          <div
            className={`h-full bg-amber-500 transition-all duration-500 animate-pulse ${
              usedPct === 0 ? 'rounded-l-full' : ''
            } ${remainingPct === 0 ? 'rounded-r-full' : ''}`}
            style={{ width: `${reqPct}%` }}
            title={`Requesting: ${requesting} days`}
          />
        )}
        {/* Remaining Segment */}
        {remainingPct > 0 && (
          <div
            className="h-full bg-emerald-400/50 dark:bg-emerald-900/40 rounded-r-full transition-all duration-500"
            style={{ width: `${remainingPct}%` }}
            title={`Remaining: ${remaining} days`}
          />
        )}
      </div>

      {/* Legend & Stats */}
      <div className="flex flex-wrap items-center justify-between text-[11px] pt-1">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
            {language === 'lo' ? 'ໃຊ້ແລ້ວ:' : 'Used:'} <strong>{used}d</strong>
          </span>
          {requesting > 0 && (
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              {language === 'lo' ? 'ຄັ້ງນີ້:' : 'This Req:'} <strong>+{requesting}d</strong>
            </span>
          )}
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            {language === 'lo' ? 'ຍັງເຫຼືອຫຼັງອະນຸມັດ:' : 'Available:'} <strong>{remaining}d</strong>
          </span>
        </div>

        {isExceeded && (
          <span className="text-rose-600 font-bold flex items-center gap-1 text-[11px] animate-bounce">
            <AlertCircle className="w-3.5 h-3.5" />
            {language === 'lo' ? 'ເກີນໂຄຕ້າທີ່ກຳນົດ!' : 'Exceeds quota!'}
          </span>
        )}
      </div>
    </div>
  );
};
