import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import {
  Bell,
  Clock,
  CalendarDays,
  FileCheck2,
  GraduationCap,
  GitPullRequest,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  X,
} from 'lucide-react';

interface SidebarManagerAlertsProps {
  collapsed: boolean;
  onNavigate: (moduleId: string, subModuleId: string) => void;
  onExpandSidebar?: () => void;
}

export interface ManagerAlertItem {
  id: string;
  category: 'LEAVE' | 'TRAINING' | 'APPROVAL';
  titleLao: string;
  titleEn: string;
  subtitleLao: string;
  subtitleEn: string;
  urgency: 'HIGH' | 'MEDIUM' | 'NORMAL';
  targetModuleId: string;
  targetSubModuleId: string;
  dateBadge?: string;
  countBadge?: string;
}

export const SidebarManagerAlerts: React.FC<SidebarManagerAlertsProps> = ({
  collapsed,
  onNavigate,
  onExpandSidebar,
}) => {
  const {
    language,
    currentUser,
    employees,
    leaveRequests,
    leaveTypes,
    trainingCourses,
    approvalRequests,
  } = useApp();

  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'ALL' | 'LEAVE' | 'APPROVAL' | 'TRAINING'>('ALL');

  // Check if current user is manager/admin
  const isManagerOrAdmin =
    currentUser.role === 'SUPER_ADMIN' ||
    currentUser.role === 'HR_ADMIN' ||
    currentUser.role === 'DEPT_HEAD' ||
    currentUser.role === 'EXECUTIVE';

  // 1. Pending Leave Requests
  const pendingLeaves = useMemo(() => {
    return leaveRequests.filter((lr) => lr.status === 'PENDING');
  }, [leaveRequests]);

  // 2. Upcoming Training Deadlines (within next 30 days or active enrollment)
  const upcomingTrainings = useMemo(() => {
    return trainingCourses.filter((tc) => tc.status === 'UPCOMING' || tc.status === 'IN_PROGRESS');
  }, [trainingCourses]);

  // 3. Pending Approval Workflows
  const pendingApprovals = useMemo(() => {
    return approvalRequests.filter((ar) => ar.status === 'PENDING');
  }, [approvalRequests]);

  // Total Alert Count
  const totalAlertsCount = pendingLeaves.length + upcomingTrainings.length + pendingApprovals.length;

  // Construct Itemized Manager Alerts
  const alertItems: ManagerAlertItem[] = useMemo(() => {
    const items: ManagerAlertItem[] = [];

    // Map Pending Leaves
    pendingLeaves.forEach((lr) => {
      const emp = employees.find((e) => e.id === lr.employeeId);
      const lt = leaveTypes.find((t) => t.id === lr.leaveTypeId);
      const empName = emp ? `${emp.firstNameLao} ${emp.lastNameLao}` : lr.employeeId;
      const typeName = lt ? (language === 'lo' ? lt.nameLao : lt.nameEn) : 'Leave';

      items.push({
        id: `alert-leave-${lr.id}`,
        category: 'LEAVE',
        titleLao: `ຄຳຮ້ອງຂໍລາພັກ: ${empName}`,
        titleEn: `Leave Request: ${emp?.firstNameEn || empName}`,
        subtitleLao: `${typeName} (${lr.totalDays} ວັນ) • ${lr.startDate} → ${lr.endDate}`,
        subtitleEn: `${typeName} (${lr.totalDays} days) • ${lr.startDate} to ${lr.endDate}`,
        urgency: lr.totalDays >= 3 ? 'HIGH' : 'MEDIUM',
        targetModuleId: 'module-6',
        targetSubModuleId: 'requests',
        dateBadge: `${lr.totalDays}d`,
      });
    });

    // Map Pending Approvals
    pendingApprovals.forEach((ar) => {
      items.push({
        id: `alert-appr-${ar.id}`,
        category: 'APPROVAL',
        titleLao: `ສາຍອະນຸມັດ: ${ar.title}`,
        titleEn: `Approval: ${ar.title}`,
        subtitleLao: `ຜູ້ຍື່ນ: ${ar.requesterName} • ${ar.departmentName}`,
        subtitleEn: `Requester: ${ar.requesterName} • ${ar.departmentName}`,
        urgency: 'HIGH',
        targetModuleId: 'module-12',
        targetSubModuleId: 'pending',
        dateBadge: 'Step 1/2',
      });
    });

    // Map Upcoming Trainings
    upcomingTrainings.forEach((tc) => {
      const daysUntilStart = Math.ceil(
        (new Date(tc.startDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

      items.push({
        id: `alert-train-${tc.id}`,
        category: 'TRAINING',
        titleLao: `ຫຼັກສູດອົບຮົມ: ${tc.titleLao}`,
        titleEn: `Training Course: ${tc.titleEn}`,
        subtitleLao: `ເລີ່ມວັນທີ ${tc.startDate} (${daysUntilStart > 0 ? `ອີກ ${daysUntilStart} ວັນ` : 'ກຳລັງເປີດ'}) • ລົງທະບຽນແລ້ວ ${tc.enrolledCount}/${tc.capacity}`,
        subtitleEn: `Starts ${tc.startDate} (${daysUntilStart > 0 ? `in ${daysUntilStart}d` : 'active'}) • Enrolled ${tc.enrolledCount}/${tc.capacity}`,
        urgency: daysUntilStart <= 14 ? 'HIGH' : 'NORMAL',
        targetModuleId: 'module-10',
        targetSubModuleId: 'trainings',
        countBadge: `${tc.enrolledCount}/${tc.capacity}`,
      });
    });

    return items;
  }, [pendingLeaves, pendingApprovals, upcomingTrainings, employees, leaveTypes, language]);

  // Filtered Alert items by tab
  const filteredAlerts = useMemo(() => {
    if (activeTab === 'ALL') return alertItems;
    return alertItems.filter((item) => item.category === activeTab);
  }, [alertItems, activeTab]);

  // If user is not manager or there are no alerts, hide or show minimal icon
  if (!isManagerOrAdmin) return null;

  // Render for Collapsed Sidebar
  if (collapsed) {
    return (
      <div className="px-2 py-2 flex flex-col items-center">
        <button
          onClick={() => {
            if (onExpandSidebar) onExpandSidebar();
            setExpanded(true);
          }}
          className="relative w-10 h-10 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 flex items-center justify-center transition-all cursor-pointer group"
          title={
            language === 'lo'
              ? `ແຈ້ງເຕືອນວຽກງານດ່ວນ: ${totalAlertsCount} ລາຍການ (ລາພັກ, ອົບຮົມ, ອະນຸມັດ)`
              : `Manager Action Alerts: ${totalAlertsCount} pending actions`
          }
        >
          <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
          {totalAlertsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white font-mono font-bold text-[10px] flex items-center justify-center ring-2 ring-slate-900 animate-pulse shadow-md">
              {totalAlertsCount}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="mx-3 my-2 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 overflow-hidden shadow-xs">
      {/* Alert Banner Header Bar */}
      <div
        onClick={() => setExpanded(!expanded)}
        className="p-3 flex items-center justify-between cursor-pointer hover:bg-amber-500/10 transition-colors select-none"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/30">
            <Bell className="w-4 h-4" />
            {totalAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white animate-ping" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xs text-slate-800 dark:text-slate-100 truncate">
                {language === 'lo' ? 'ແຈ້ງເຕືອນວຽກງານດ່ວນ' : 'Manager Action Alerts'}
              </span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-extrabold bg-rose-500 text-white">
                {totalAlertsCount}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
              {language === 'lo' ? 'ລາພັກ, ອົບຮົມ & ສາຍອະນຸມັດ' : 'Leaves, Trainings & Approvals'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-slate-400">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {/* Category Pills (Always visible for quick glance) */}
      <div className="px-3 pb-2.5 flex items-center gap-1.5 overflow-x-auto text-[10px]">
        {/* Pending Leaves Badge */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate('module-6', 'requests');
          }}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-lg font-bold border transition-all ${
            pendingLeaves.length > 0
              ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/40 hover:bg-rose-100'
              : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-700'
          }`}
          title="Jump to Pending Leaves"
        >
          <FileCheck2 className="w-3 h-3 text-rose-600" />
          <span>{language === 'lo' ? 'ລາພັກ:' : 'Leaves:'}</span>
          <span className="font-mono font-black">{pendingLeaves.length}</span>
        </button>

        {/* Pending Approvals Badge */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate('module-12', 'pending');
          }}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-lg font-bold border transition-all ${
            pendingApprovals.length > 0
              ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/40 hover:bg-amber-100'
              : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-700'
          }`}
          title="Jump to Pending Approvals"
        >
          <GitPullRequest className="w-3 h-3 text-amber-600" />
          <span>{language === 'lo' ? 'ອະນຸມັດ:' : 'Appr:'}</span>
          <span className="font-mono font-black">{pendingApprovals.length}</span>
        </button>

        {/* Upcoming Trainings Badge */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate('module-10', 'trainings');
          }}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-lg font-bold border transition-all ${
            upcomingTrainings.length > 0
              ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/40 hover:bg-blue-100'
              : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-700'
          }`}
          title="Jump to Upcoming Trainings"
        >
          <GraduationCap className="w-3 h-3 text-blue-600" />
          <span>{language === 'lo' ? 'ອົບຮົມ:' : 'Train:'}</span>
          <span className="font-mono font-black">{upcomingTrainings.length}</span>
        </button>
      </div>

      {/* Expandable Live Notification Drawer */}
      {expanded && (
        <div className="border-t border-amber-500/20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-2.5 space-y-2">
          {/* Sub-Tabs Filter */}
          <div className="flex items-center gap-1 border-b border-slate-100 dark:border-slate-800 pb-1.5 text-[10px]">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                activeTab === 'ALL'
                  ? 'bg-amber-500 text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {language === 'lo' ? 'ທັງໝົດ' : 'All'} ({alertItems.length})
            </button>
            <button
              onClick={() => setActiveTab('LEAVE')}
              className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                activeTab === 'LEAVE'
                  ? 'bg-rose-500 text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {language === 'lo' ? 'ລາພັກ' : 'Leaves'} ({pendingLeaves.length})
            </button>
            <button
              onClick={() => setActiveTab('APPROVAL')}
              className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                activeTab === 'APPROVAL'
                  ? 'bg-amber-600 text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {language === 'lo' ? 'ອະນຸມັດ' : 'Approvals'} ({pendingApprovals.length})
            </button>
            <button
              onClick={() => setActiveTab('TRAINING')}
              className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                activeTab === 'TRAINING'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {language === 'lo' ? 'ອົບຮົມ' : 'Trainings'} ({upcomingTrainings.length})
            </button>
          </div>

          {/* Alert Cards Feed */}
          <div className="max-h-60 overflow-y-auto space-y-1.5 pr-0.5">
            {filteredAlerts.length === 0 ? (
              <div className="py-4 text-center text-slate-400 text-xs">
                <CheckCircle2 className="w-5 h-5 mx-auto text-emerald-500 mb-1" />
                <span>{language === 'lo' ? 'ບໍ່ມີລາຍການຄ້າງ' : 'All clear! No pending actions'}</span>
              </div>
            ) : (
              filteredAlerts.map((item) => {
                const isLeave = item.category === 'LEAVE';
                const isApproval = item.category === 'APPROVAL';
                const isTraining = item.category === 'TRAINING';

                const CategoryIcon = isLeave ? FileCheck2 : isApproval ? GitPullRequest : GraduationCap;
                const iconColor = isLeave ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/60' : isApproval ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/60' : 'text-blue-600 bg-blue-50 dark:bg-blue-950/60';

                return (
                  <div
                    key={item.id}
                    onClick={() => onNavigate(item.targetModuleId, item.targetSubModuleId)}
                    className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 hover:border-amber-400 dark:hover:border-amber-600 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="flex items-start gap-2 min-w-0">
                        <div className={`p-1.5 rounded-lg shrink-0 ${iconColor}`}>
                          <CategoryIcon className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <h5 className="font-bold text-[11px] text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                            {language === 'lo' ? item.titleLao : item.titleEn}
                          </h5>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 leading-tight">
                            {language === 'lo' ? item.subtitleLao : item.subtitleEn}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {item.dateBadge && (
                          <span className="font-mono text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {item.dateBadge}
                          </span>
                        )}
                        <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
