import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import {
  Home,
  ChevronRight,
  ChevronDown,
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
  Check,
  Sparkles,
} from 'lucide-react';

interface BreadcrumbNavProps {
  collapsed: boolean;
}

export interface ModuleNavConfig {
  id: string;
  num: string;
  titleKey: any;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
  defaultSub: string;
  submodules: { id: string; titleKey: any }[];
}

export const MODULE_REGISTRY: ModuleNavConfig[] = [
  {
    id: 'module-1',
    num: '01',
    titleKey: 'module1',
    icon: LayoutDashboard,
    roles: ['SUPER_ADMIN', 'HR_ADMIN', 'EXECUTIVE', 'DEPT_HEAD', 'EMPLOYEE'],
    defaultSub: 'overview',
    submodules: [
      { id: 'overview', titleKey: 'dashboardOverview' },
      { id: 'headcount', titleKey: 'headcountDistribution' },
      { id: 'attendance-stats', titleKey: 'attendanceStats' },
    ],
  },
  {
    id: 'module-2',
    num: '02',
    titleKey: 'module2',
    icon: Users,
    roles: ['SUPER_ADMIN', 'HR_ADMIN', 'EXECUTIVE', 'DEPT_HEAD', 'EMPLOYEE'],
    defaultSub: 'directory',
    submodules: [
      { id: 'directory', titleKey: 'employeeDirectory' },
      { id: 'onboarding', titleKey: 'onboarding' },
      { id: 'movements', titleKey: 'movementRecords' },
      { id: 'import', titleKey: 'importEmployeeData' },
      { id: 'performance', titleKey: 'performanceManagement' },
    ],
  },
  {
    id: 'module-3',
    num: '03',
    titleKey: 'module3',
    icon: Network,
    roles: ['SUPER_ADMIN', 'HR_ADMIN', 'EXECUTIVE', 'DEPT_HEAD'],
    defaultSub: 'org-chart',
    submodules: [
      { id: 'org-chart', titleKey: 'orgChart' },
      { id: 'branches', titleKey: 'branches' },
      { id: 'departments', titleKey: 'departments' },
      { id: 'positions', titleKey: 'positions' },
      { id: 'workforce-plan', titleKey: 'workforcePlanning' },
    ],
  },
  {
    id: 'module-4',
    num: '04',
    titleKey: 'module4',
    icon: Clock,
    roles: ['SUPER_ADMIN', 'HR_ADMIN', 'EXECUTIVE', 'DEPT_HEAD', 'EMPLOYEE'],
    defaultSub: 'daily-attendance',
    submodules: [
      { id: 'daily-attendance', titleKey: 'dailyAttendance' },
      { id: 'attendance-dashboard', titleKey: 'attendanceDashboard' },
      { id: 'lateness-report', titleKey: 'latenessReport' },
      { id: 'attendance-devices', titleKey: 'attendanceDevices' },
    ],
  },
  {
    id: 'module-5',
    num: '05',
    titleKey: 'module5',
    icon: CalendarDays,
    roles: ['SUPER_ADMIN', 'HR_ADMIN', 'EXECUTIVE', 'DEPT_HEAD', 'EMPLOYEE'],
    defaultSub: 'schedules',
    submodules: [
      { id: 'schedules', titleKey: 'workSchedules' },
      { id: 'shifts', titleKey: 'shiftManagement' },
      { id: 'holidays', titleKey: 'holidayCalendar' },
    ],
  },
  {
    id: 'module-6',
    num: '06',
    titleKey: 'module6',
    icon: FileCheck2,
    roles: ['SUPER_ADMIN', 'HR_ADMIN', 'EXECUTIVE', 'DEPT_HEAD', 'EMPLOYEE'],
    defaultSub: 'requests',
    submodules: [
      { id: 'requests', titleKey: 'leaveRequests' },
      { id: 'calendar', titleKey: 'leaveCalendar' },
      { id: 'balances', titleKey: 'leaveBalances' },
      { id: 'types', titleKey: 'leaveTypesConfig' },
    ],
  },
  {
    id: 'module-7',
    num: '07',
    titleKey: 'module7',
    icon: Banknote,
    roles: ['SUPER_ADMIN', 'HR_ADMIN', 'EXECUTIVE', 'DEPT_HEAD', 'EMPLOYEE'],
    defaultSub: 'payslips',
    submodules: [
      { id: 'payslips', titleKey: 'payslips' },
      { id: 'periods', titleKey: 'payrollPeriods' },
      { id: 'tax-rules', titleKey: 'taxRules' },
      { id: 'reports', titleKey: 'payrollReports' },
    ],
  },
  {
    id: 'module-8',
    num: '08',
    titleKey: 'module8',
    icon: ShieldAlert,
    roles: ['SUPER_ADMIN', 'HR_ADMIN', 'EXECUTIVE'],
    defaultSub: 'cases',
    submodules: [
      { id: 'cases', titleKey: 'disciplinaryCases' },
      { id: 'create-warning', titleKey: 'warningLetters' },
    ],
  },
  {
    id: 'module-9',
    num: '09',
    titleKey: 'module9',
    icon: Receipt,
    roles: ['SUPER_ADMIN', 'HR_ADMIN', 'EXECUTIVE', 'DEPT_HEAD', 'EMPLOYEE'],
    defaultSub: 'claims',
    submodules: [
      { id: 'claims', titleKey: 'expenseClaims' },
      { id: 'submit-claim', titleKey: 'submitExpense' },
    ],
  },
  {
    id: 'module-10',
    num: '10',
    titleKey: 'module10',
    icon: GraduationCap,
    roles: ['SUPER_ADMIN', 'HR_ADMIN', 'EXECUTIVE', 'DEPT_HEAD', 'EMPLOYEE'],
    defaultSub: 'evaluations',
    submodules: [
      { id: 'evaluations', titleKey: 'evaluations' },
      { id: 'trainings', titleKey: 'trainingPlans' },
      { id: 'benefits', titleKey: 'benefits' },
    ],
  },
  {
    id: 'module-11',
    num: '11',
    titleKey: 'module11',
    icon: UserPlus,
    roles: ['SUPER_ADMIN', 'HR_ADMIN', 'EXECUTIVE', 'DEPT_HEAD'],
    defaultSub: 'requisitions',
    submodules: [
      { id: 'requisitions', titleKey: 'requisitions' },
      { id: 'candidates', titleKey: 'candidates' },
    ],
  },
  {
    id: 'module-12',
    num: '12',
    titleKey: 'module12',
    icon: GitPullRequest,
    roles: ['SUPER_ADMIN', 'HR_ADMIN', 'EXECUTIVE', 'DEPT_HEAD', 'EMPLOYEE'],
    defaultSub: 'pending',
    submodules: [
      { id: 'pending', titleKey: 'pendingApprovals' },
      { id: 'my-requests', titleKey: 'myRequests' },
      { id: 'workflows', titleKey: 'approvalWorkflows' },
    ],
  },
  {
    id: 'module-13',
    num: '13',
    titleKey: 'module13',
    icon: FolderArchive,
    roles: ['SUPER_ADMIN', 'HR_ADMIN', 'EXECUTIVE', 'DEPT_HEAD', 'EMPLOYEE'],
    defaultSub: 'assets',
    submodules: [
      { id: 'assets', titleKey: 'assetRegister' },
      { id: 'templates', titleKey: 'templates' },
      { id: 'contracts', titleKey: 'contracts' },
    ],
  },
  {
    id: 'module-14',
    num: '14',
    titleKey: 'module14',
    icon: Megaphone,
    roles: ['SUPER_ADMIN', 'HR_ADMIN', 'EXECUTIVE', 'DEPT_HEAD', 'EMPLOYEE'],
    defaultSub: 'announcements',
    submodules: [
      { id: 'announcements', titleKey: 'announcements' },
      { id: 'messages', titleKey: 'hrMessaging' },
      { id: 'faq', titleKey: 'faq' },
    ],
  },
  {
    id: 'module-15',
    num: '15',
    titleKey: 'module15',
    icon: Settings,
    roles: ['SUPER_ADMIN', 'HR_ADMIN'],
    defaultSub: 'lhse-profile',
    submodules: [
      { id: 'lhse-profile', titleKey: 'lhseProfile' },
      { id: 'audit-logs', titleKey: 'auditLogs' },
      { id: 'system-status', titleKey: 'systemStatus' },
    ],
  },
  {
    id: 'module-16',
    num: '16',
    titleKey: 'module16',
    icon: UserPlus,
    roles: ['SUPER_ADMIN', 'HR_ADMIN', 'EXECUTIVE'],
    defaultSub: 'users-list',
    submodules: [
      { id: 'users-list', titleKey: 'systemUsersList' },
      { id: 'roles-permissions', titleKey: 'userPermissionsRBAC' },
      { id: 'active-sessions', titleKey: 'userActiveSessions' },
      { id: 'user-activity', titleKey: 'userAccessAudit' },
    ],
  },
];

export const BreadcrumbNav: React.FC<BreadcrumbNavProps> = ({ collapsed }) => {
  const {
    t,
    language,
    activeModule,
    setActiveModule,
    activeSubModule,
    setActiveSubModule,
    currentUser,
  } = useApp();

  const [moduleDropdownOpen, setModuleDropdownOpen] = useState(false);
  const [subModuleDropdownOpen, setSubModuleDropdownOpen] = useState(false);

  const moduleRef = useRef<HTMLLIElement>(null);
  const subModuleRef = useRef<HTMLLIElement>(null);

  // Close dropdowns on click outside or Escape
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (moduleRef.current && !moduleRef.current.contains(e.target as Node)) {
        setModuleDropdownOpen(false);
      }
      if (subModuleRef.current && !subModuleRef.current.contains(e.target as Node)) {
        setSubModuleDropdownOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setModuleDropdownOpen(false);
        setSubModuleDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Filter modules accessible to current user
  const allowedModules = MODULE_REGISTRY.filter((m) => m.roles.includes(currentUser.role));

  const currentModuleConfig =
    MODULE_REGISTRY.find((m) => m.id === activeModule) || MODULE_REGISTRY[0];

  const currentSubmoduleConfig =
    currentModuleConfig.submodules.find((s) => s.id === activeSubModule) ||
    currentModuleConfig.submodules[0];

  const CurrentIcon = currentModuleConfig.icon;

  const navigateToHome = () => {
    setActiveModule('module-1');
    setActiveSubModule('overview');
    setModuleDropdownOpen(false);
    setSubModuleDropdownOpen(false);
  };

  const selectModule = (mod: ModuleNavConfig) => {
    setActiveModule(mod.id);
    setActiveSubModule(mod.defaultSub);
    setModuleDropdownOpen(false);
    setSubModuleDropdownOpen(false);
  };

  const selectSubModule = (subId: string) => {
    setActiveSubModule(subId);
    setSubModuleDropdownOpen(false);
  };

  return (
    <nav
      aria-label="Breadcrumb Navigation"
      className={`sticky top-16 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800/90 transition-all duration-300 py-2.5 px-4 lg:px-6 shadow-xs ${
        collapsed ? 'lg:pl-24' : 'lg:pl-76'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Left Side: Breadcrumb Trail */}
        <ol className="flex items-center flex-wrap gap-1.5 sm:gap-2 text-xs text-slate-600 dark:text-slate-300">
          {/* Level 1: Home / LHSE */}
          <li className="flex items-center">
            <button
              onClick={navigateToHome}
              className="group inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all cursor-pointer font-medium"
              title={language === 'lo' ? 'ກັບຄືນໜ້າຫຼັກ (Home)' : 'Back to Dashboard Home'}
            >
              <Home className="w-3.5 h-3.5 group-hover:scale-110 transition-transform text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
              <span className="hidden sm:inline font-semibold">LHSE</span>
            </button>
          </li>

          <li aria-hidden="true" className="text-slate-300 dark:text-slate-600">
            <ChevronRight className="w-3.5 h-3.5" />
          </li>

          {/* Level 2: Active Module with Interactive Quick Switcher */}
          <li className="relative flex items-center" ref={moduleRef}>
            <button
              type="button"
              onClick={() => {
                setModuleDropdownOpen(!moduleDropdownOpen);
                setSubModuleDropdownOpen(false);
              }}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold text-xs transition-all cursor-pointer border ${
                moduleDropdownOpen
                  ? 'bg-blue-50 dark:bg-blue-950/70 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 shadow-xs ring-2 ring-blue-500/20'
                  : 'bg-slate-100/90 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-slate-700/80'
              }`}
              title={
                language === 'lo'
                  ? 'ຄລິກເພື່ອເລືອກລະຫວ່າງ 15 ໂມດູນ'
                  : 'Click to quickly jump between 15 modules'
              }
              aria-haspopup="true"
              aria-expanded={moduleDropdownOpen}
            >
              <CurrentIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-extrabold rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 tracking-wide">
                M{currentModuleConfig.num}
              </span>
              <span className="font-semibold max-w-[130px] sm:max-w-[200px] md:max-w-none truncate">
                {t(currentModuleConfig.titleKey)}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                  moduleDropdownOpen ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''
                }`}
              />
            </button>

            {/* Module Picker Dropdown Menu */}
            {moduleDropdownOpen && (
              <div
                className="absolute left-0 top-full mt-1.5 w-80 sm:w-96 max-h-[70vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-in fade-in zoom-in-95 backdrop-blur-xl"
                role="menu"
              >
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>{language === 'lo' ? 'ທັງໝົດ 15 ໂມດູນ' : 'All 15 HRMS Modules'}</span>
                  </div>
                  <span className="text-[10px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                    {allowedModules.length} {language === 'lo' ? 'ທີ່ເຂົ້າເຖິງໄດ້' : 'Accessible'}
                  </span>
                </div>

                <div className="py-1 space-y-1">
                  {allowedModules.map((m) => {
                    const isSelected = m.id === activeModule;
                    const ItemIcon = m.icon;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => selectModule(m)}
                        className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white font-semibold shadow-xs'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                        role="menuitem"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`flex items-center justify-center w-6 h-6 rounded-lg text-[10px] font-bold ${
                              isSelected
                                ? 'bg-white/20 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50'
                            }`}
                          >
                            {m.num}
                          </span>
                          <ItemIcon
                            className={`w-4 h-4 shrink-0 ${
                              isSelected ? 'text-white' : 'text-blue-600 dark:text-blue-400'
                            }`}
                          />
                          <span className="truncate">{t(m.titleKey)}</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 shrink-0 text-white" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </li>

          <li aria-hidden="true" className="text-slate-300 dark:text-slate-600">
            <ChevronRight className="w-3.5 h-3.5" />
          </li>

          {/* Level 3: Active Sub-module with Dropdown Switcher */}
          <li className="relative flex items-center" ref={subModuleRef}>
            <button
              type="button"
              onClick={() => {
                setSubModuleDropdownOpen(!subModuleDropdownOpen);
                setModuleDropdownOpen(false);
              }}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold text-xs transition-all cursor-pointer border ${
                subModuleDropdownOpen
                  ? 'bg-blue-50 dark:bg-blue-950/70 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 shadow-xs ring-2 ring-blue-500/20'
                  : 'bg-white dark:bg-slate-900 border-blue-200/80 dark:border-blue-900/60 text-blue-600 dark:text-blue-400 hover:border-blue-400 shadow-xs'
              }`}
              title={
                language === 'lo'
                  ? 'ຄລິກເພື່ອເລືອກຫົວຂໍ້ຍ່ອຍໃນໂມດູນນີ້'
                  : 'Click to select sub-section within this module'
              }
              aria-current="page"
              aria-haspopup="true"
              aria-expanded={subModuleDropdownOpen}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400"></span>
              <span className="font-bold max-w-[140px] sm:max-w-[220px] md:max-w-none truncate">
                {t(currentSubmoduleConfig.titleKey)}
              </span>
              {currentModuleConfig.submodules.length > 1 && (
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                    subModuleDropdownOpen ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''
                  }`}
                />
              )}
            </button>

            {/* Sub-module Picker Dropdown */}
            {subModuleDropdownOpen && currentModuleConfig.submodules.length > 1 && (
              <div
                className="absolute left-0 top-full mt-1.5 w-64 sm:w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-in fade-in zoom-in-95 backdrop-blur-xl"
                role="menu"
              >
                <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-500">
                  {language === 'lo' ? 'ລາຍການຍ່ອຍໃນໂມດູນ' : 'Sections in this Module'}
                </div>
                <div className="py-1 space-y-1">
                  {currentModuleConfig.submodules.map((sub) => {
                    const isSelected = sub.id === activeSubModule;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => selectSubModule(sub.id)}
                        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white font-semibold'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                        role="menuitem"
                      >
                        <span className="truncate">{t(sub.titleKey)}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0 text-white" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </li>
        </ol>

        {/* Right Side: Quick Sub-module Pill Tabs (Instant 1-Click Access) */}
        {currentModuleConfig.submodules.length > 1 && (
          <div className="hidden md:flex items-center gap-1 overflow-x-auto max-w-full pb-0.5">
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mr-1 select-none">
              {language === 'lo' ? 'ໄປທີ່:' : 'Jump to:'}
            </span>
            {currentModuleConfig.submodules.map((sub) => {
              const isSelected = sub.id === activeSubModule;
              return (
                <button
                  key={sub.id}
                  onClick={() => setActiveSubModule(sub.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs font-semibold'
                      : 'bg-slate-100/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-700/70 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title={t(sub.titleKey)}
                >
                  {t(sub.titleKey)}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
};
