import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import {
  LayoutDashboard,
  Users,
  Network,
  Clock,
  CalendarDays,
  FileCheck2,
  Banknote,
  ShieldAlert,
  Receipt,
  GraduationCap,
  UserPlus,
  GitPullRequest,
  FolderArchive,
  Megaphone,
  Settings,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { SidebarManagerAlerts } from './SidebarManagerAlerts.tsx';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (val: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (val: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}) => {
  const {
    t,
    language,
    currentUser,
    activeModule,
    setActiveModule,
    activeSubModule,
    setActiveSubModule,
    approvalRequests,
    leaveRequests,
    trainingCourses,
  } = useApp();

  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({
    'module-1': true,
    'module-2': true,
  });

  const toggleExpand = (modId: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [modId]: !prev[modId],
    }));
  };

  const pendingLeavesCount = leaveRequests.filter((lr) => lr.status === 'PENDING').length;
  const upcomingTrainingsCount = trainingCourses.filter((tc) => tc.status === 'UPCOMING' || tc.status === 'IN_PROGRESS').length;
  const pendingApprovalsCount = approvalRequests.filter((a) => a.status === 'PENDING').length;

  // Module definitions with submodules and allowed roles
  const modules = [
    {
      id: 'module-1',
      title: t('module1'),
      icon: LayoutDashboard,
      roles: ['SUPER_ADMIN', 'HR_ADMIN', 'EXECUTIVE', 'DEPT_HEAD', 'EMPLOYEE'],
      submodules: [
        { id: 'overview', title: t('dashboardOverview') },
        { id: 'headcount', title: t('headcountDistribution') },
        { id: 'attendance-stats', title: t('attendanceStats') },
      ],
    },
    {
      id: 'module-2',
      title: t('module2'),
      icon: Users,
      roles: ['SUPER_ADMIN', 'HR_ADMIN', 'EXECUTIVE', 'DEPT_HEAD', 'EMPLOYEE'],
      submodules: [
        { id: 'directory', title: t('employeeDirectory') },
        { id: 'performance', title: language === 'lo' ? 'ຕິດຕາມ KPI & ປະເມີນຜົນງານ' : 'KPI & Performance Reviews' },
        { id: 'performance-kpis', title: language === 'lo' ? 'ແດຊບອດຜົນງານ KPI' : 'KPI Leaderboard & Trends' },
        { id: 'onboarding', title: t('onboarding') },
        { id: 'movements', title: t('movementRecords') },
        { id: 'import', title: t('importEmployeeData') },
      ],
    },
    {
      id: 'module-3',
      title: t('module3'),
      icon: Network,
      roles: ['SUPER_ADMIN', 'HR_ADMIN', 'EXECUTIVE', 'DEPT_HEAD'],
      submodules: [
        { id: 'org-chart', title: t('orgChart') },
        { id: 'branches', title: t('branches') },
        { id: 'departments', title: t('departments') },
        { id: 'positions', title: t('positions') },
        { id: 'workforce-plan', title: t('workforcePlanning') },
      ],
    },
    {
      id: 'module-4',
      title: t('module4'),
      icon: Clock,
      roles: ['SUPER_ADMIN', 'HR_ADMIN', 'EXECUTIVE', 'DEPT_HEAD', 'EMPLOYEE'],
      submodules: [
        { id: 'daily-attendance', title: t('dailyAttendance') },
        { id: 'attendance-dashboard', title: t('attendanceDashboard') },
        { id: 'lateness-report', title: t('latenessReport') },
        { id: 'attendance-devices', title: t('attendanceDevices') },
      ],
    },
    {
      id: 'module-5',
      title: t('module5'),
      icon: CalendarDays,
      roles: ['SUPER_ADMIN', 'HR_ADMIN', 'EXECUTIVE', 'DEPT_HEAD', 'EMPLOYEE'],
      submodules: [
        { id: 'schedules', title: t('workSchedules') },
        { id: 'shifts', title: t('shiftManagement') },
        { id: 'holidays', title: t('holidayCalendar') },
      ],
    },
    {
      id: 'module-6',
      title: t('module6'),
      icon: FileCheck2,
      roles: ['SUPER_ADMIN', 'HR_ADMIN', 'EXECUTIVE', 'DEPT_HEAD', 'EMPLOYEE'],
      badge: pendingLeavesCount > 0 ? pendingLeavesCount : undefined,
      badgeColor: 'bg-rose-500',
      submodules: [
        { id: 'requests', title: t('leaveRequests') },
        { id: 'calendar', title: t('leaveCalendar') },
        { id: 'balances', title: t('leaveBalances') },
        { id: 'types', title: t('leaveTypesConfig') },
      ],
    },
    {
      id: 'module-7',
      title: t('module7'),
      icon: Banknote,
      // Restricted: Employee sees only personal payslips; HR/Finance/Admin see full payroll
      roles: ['SUPER_ADMIN', 'HR_ADMIN', 'EXECUTIVE', 'DEPT_HEAD', 'EMPLOYEE'],
      badge: 'FIDO2',
      badgeColor: 'bg-emerald-600',
      submodules: [
        { id: 'payslips', title: t('payslips') },
        ...(currentUser.role !== 'EMPLOYEE'
          ? [
              { id: 'periods', title: t('payrollPeriods') },
              { id: 'tax-rules', title: t('taxRules') },
              { id: 'reports', title: t('payrollReports') },
            ]
          : []),
      ],
    },
    {
      id: 'module-8',
      title: t('module8'),
      icon: ShieldAlert,
      // Confidential: Super Admin & HR Admin only
      roles: ['SUPER_ADMIN', 'HR_ADMIN', 'EXECUTIVE'],
      submodules: [
        { id: 'cases', title: t('disciplinaryCases') },
        { id: 'create-warning', title: t('warningLetters') },
      ],
    },
    {
      id: 'module-9',
      title: t('module9'),
      icon: Receipt,
      roles: ['SUPER_ADMIN', 'HR_ADMIN', 'EXECUTIVE', 'DEPT_HEAD', 'EMPLOYEE'],
      submodules: [
        { id: 'claims', title: t('expenseClaims') },
        { id: 'submit-claim', title: t('submitExpense') },
      ],
    },
    {
      id: 'module-10',
      title: t('module10'),
      icon: GraduationCap,
      roles: ['SUPER_ADMIN', 'HR_ADMIN', 'EXECUTIVE', 'DEPT_HEAD', 'EMPLOYEE'],
      badge: upcomingTrainingsCount > 0 ? upcomingTrainingsCount : undefined,
      badgeColor: 'bg-blue-600',
      submodules: [
        { id: 'kpis', title: language === 'lo' ? 'ດັດຊະນີວັດຜົນ KPI & ທ່າອ່ຽງ' : 'KPI Dashboard & Trends' },
        { id: 'evaluations', title: t('evaluations') },
        { id: 'trainings', title: t('trainingPlans') },
        { id: 'benefits', title: t('benefits') },
      ],
    },
    {
      id: 'module-11',
      title: t('module11'),
      icon: UserPlus,
      roles: ['SUPER_ADMIN', 'HR_ADMIN', 'EXECUTIVE', 'DEPT_HEAD'],
      submodules: [
        { id: 'requisitions', title: t('requisitions') },
        { id: 'candidates', title: t('candidates') },
      ],
    },
    {
      id: 'module-12',
      title: t('module12'),
      icon: GitPullRequest,
      roles: ['SUPER_ADMIN', 'HR_ADMIN', 'EXECUTIVE', 'DEPT_HEAD', 'EMPLOYEE'],
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
      badgeColor: 'bg-amber-500',
      submodules: [
        { id: 'pending', title: t('pendingApprovals') },
        { id: 'my-requests', title: t('myRequests') },
        { id: 'workflows', title: t('approvalWorkflows') },
      ],
    },
    {
      id: 'module-13',
      title: t('module13'),
      icon: FolderArchive,
      roles: ['SUPER_ADMIN', 'HR_ADMIN', 'EXECUTIVE', 'DEPT_HEAD', 'EMPLOYEE'],
      submodules: [
        { id: 'documents', title: t('documentsRepository') },
        { id: 'assets', title: t('assetRegister') },
        { id: 'templates', title: t('templates') },
      ],
    },
    {
      id: 'module-14',
      title: t('module14'),
      icon: Megaphone,
      roles: ['SUPER_ADMIN', 'HR_ADMIN', 'EXECUTIVE', 'DEPT_HEAD', 'EMPLOYEE'],
      submodules: [
        { id: 'announcements', title: t('announcements') },
        { id: 'messages', title: t('hrMessaging') },
        { id: 'faq', title: t('faq') },
      ],
    },
    {
      id: 'module-15',
      title: t('module15'),
      icon: Settings,
      // Only Super Admin & HR Admin
      roles: ['SUPER_ADMIN', 'HR_ADMIN'],
      submodules: [
        { id: 'lhse-profile', title: t('lhseProfile') },
        { id: 'audit-logs', title: t('auditLogs') },
        { id: 'system-status', title: t('systemStatus') },
      ],
    },
    {
      id: 'module-16',
      title: t('module16'),
      icon: UserPlus,
      roles: ['SUPER_ADMIN', 'HR_ADMIN', 'EXECUTIVE'],
      submodules: [
        { id: 'users-list', title: t('systemUsersList') },
        { id: 'roles-permissions', title: t('userPermissionsRBAC') },
        { id: 'active-sessions', title: t('userActiveSessions') },
        { id: 'user-activity', title: t('userAccessAudit') },
      ],
    },
  ];

  // Filter modules based on current user's role
  const allowedModules = modules.filter((m) => m.roles.includes(currentUser.role));

  const handleSelectModule = (modId: string, defaultSub: string) => {
    setActiveModule(modId);
    setActiveSubModule(defaultSub);
    setExpandedModules((prev) => ({ ...prev, [modId]: true }));
    if (window.innerWidth < 1024) {
      setMobileOpen(false);
    }
  };

  const handleSelectSubModule = (modId: string, subId: string) => {
    setActiveModule(modId);
    setActiveSubModule(subId);
    if (window.innerWidth < 1024) {
      setMobileOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out ${
          collapsed ? 'w-20' : 'w-72'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="h-16 px-3.5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-linear-to-r from-blue-700 to-indigo-800 text-white shrink-0">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-12 h-12 rounded-full bg-white p-0.5 flex items-center justify-center shrink-0 border-2 border-white/40 shadow-md">
              <img
                src="/assets/aistudio/______________________95dd5853.png"
                alt="LHSE Logo"
                className="w-full h-full object-contain rounded-full"
              />
            </div>
            {!collapsed && (
              <div className="truncate min-w-0">
                <div className="font-bold text-xs tracking-tight flex items-center gap-1.5 text-white">
                  <span className="truncate">ລັດວິສາຫະກິດຖືຮຸ້ນລາວ</span>
                  <span className="text-[9px] bg-amber-400 text-blue-950 font-black px-1.5 py-0.5 rounded-sm shrink-0">LHSE</span>
                </div>
                <div className="text-[10px] text-blue-100/90 truncate font-medium">
                  {language === 'lo' ? 'ກະຊວງອຸດສາກະກຳ ແລະ ການຄ້າ' : 'Ministry of Industry and Commerce'}
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 items-center justify-center text-white transition-colors"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Real-time Manager Action Alerts System */}
        <SidebarManagerAlerts
          collapsed={collapsed}
          onNavigate={(modId, subModId) => {
            handleSelectModule(modId, subModId);
            if (mobileOpen) setMobileOpen(false);
          }}
          onExpandSidebar={() => setCollapsed(false)}
        />

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {allowedModules.map((m) => {
            const Icon = m.icon;
            const isCurrentMod = activeModule === m.id;
            const isExpanded = expandedModules[m.id];

            return (
              <div key={m.id} className="space-y-0.5">
                {/* Main Module Button */}
                <button
                  onClick={() => {
                    if (collapsed) {
                      setCollapsed(false);
                      handleSelectModule(m.id, m.submodules[0]?.id || '');
                    } else {
                      toggleExpand(m.id);
                      if (!isCurrentMod) {
                        handleSelectModule(m.id, m.submodules[0]?.id || '');
                      }
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm font-medium transition-all group ${
                    isCurrentMod
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-semibold shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200'
                  }`}
                  title={collapsed ? m.title : undefined}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <Icon
                        className={`w-5 h-5 transition-transform group-hover:scale-105 ${
                          isCurrentMod ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
                        }`}
                      />
                      {collapsed && m.badge && (
                        <span
                          className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse ${
                            (m as any).badgeColor || 'bg-amber-500'
                          }`}
                        />
                      )}
                    </div>
                    {!collapsed && <span className="truncate">{m.title}</span>}
                  </div>

                  {!collapsed && (
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {m.badge && (
                        <span
                          className={`px-2 py-0.5 text-[11px] font-bold rounded-full text-white animate-pulse ${
                            (m as any).badgeColor || 'bg-amber-500'
                          }`}
                        >
                          {m.badge}
                        </span>
                      )}
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  )}
                </button>

                {/* Submodules List */}
                {!collapsed && isExpanded && (
                  <div className="pl-9 pr-1 py-1 space-y-0.5 border-l-2 border-slate-100 dark:border-slate-800 ml-5 my-0.5">
                    {m.submodules.map((sub) => {
                      const isCurrentSub = isCurrentMod && activeSubModule === sub.id;
                      return (
                        <button
                          key={sub.id}
                          onClick={() => handleSelectSubModule(m.id, sub.id)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left ${
                            isCurrentSub
                              ? 'bg-blue-600 text-white font-medium shadow-xs'
                              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <span className="truncate">{sub.title}</span>
                          {isCurrentSub && <CheckCircle2 className="w-3.5 h-3.5 text-white/90 shrink-0 ml-1" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        {!collapsed && (
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700 dark:text-slate-300">LHSE State Enterprise</span>
              <span className="px-1.5 py-0.5 rounded-sm bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-mono text-[10px]">v2.6-PROD</span>
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
              Strict Non-OT Policy Enforced
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
