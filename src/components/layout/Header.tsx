import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import {
  Menu,
  Search,
  Globe,
  Check,
  UserCheck,
  Clock,
  LogOut,
  ChevronDown,
  ShieldCheck,
  Sparkles,
  History,
} from 'lucide-react';
import { NotificationCenter } from './NotificationCenter.tsx';
import { QuickActionsMenu } from './QuickActionsMenu.tsx';
import { GlobalSearch } from './GlobalSearch.tsx';
import { UserProfile } from './UserProfile.tsx';
import { ThemeToggleSwitch } from './ThemeToggleSwitch.tsx';
import { LanguageSwitcher } from '../common/LanguageSwitcher.tsx';
import { QRCodeScannerModal } from '../common/QRCodeScannerModal.tsx';
import { QrCode } from 'lucide-react';

interface HeaderProps {
  collapsed: boolean;
  setMobileOpen: (val: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({ collapsed, setMobileOpen }) => {
  const {
    t,
    language,
    setLanguage,
    currentUser,
    setCurrentUser,
    availableUsers,
    punchInOut,
    attendanceRecords,
    setActiveModule,
    setActiveSubModule,
    addAuditLog,
    auditLogs,
  } = useApp();

  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [qrScannerOpen, setQrScannerOpen] = useState(false);

  const roleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (roleRef.current && !roleRef.current.contains(e.target as Node)) {
        setRoleOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];
  const empId = currentUser.employeeId || 'emp-001';
  const todayPunch = attendanceRecords.find((r) => r.employeeId === empId && r.date === todayStr);

  return (
    <header
      className={`sticky top-0 z-30 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-all duration-300 flex items-center justify-between px-4 lg:px-6 ${
        collapsed ? 'lg:pl-24' : 'lg:pl-76'
      }`}
    >
      {/* Left Section: Mobile Toggle & Organization Badge */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden cursor-pointer"
          aria-label="Open mobile navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-11 h-11 rounded-full bg-white p-0.5 border border-slate-200 dark:border-slate-700 shadow-sm shrink-0 flex items-center justify-center">
            <img
              src="/assets/aistudio/______________________95dd5853.png"
              alt="LHSE Official Logo"
              className="w-full h-full object-contain rounded-full"
            />
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <div className="flex items-center gap-1.5 leading-tight">
              <span className="font-bold text-xs text-slate-900 dark:text-slate-100 tracking-tight">
                ລັດວິສາຫະກິດຖືຮຸ້ນລາວ
              </span>
              <span className="inline-flex items-center px-1.5 py-0.2 rounded-sm text-[9px] font-black bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/60">
                LHSE
              </span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-tight">
              {language === 'lo' ? 'ກະຊວງອຸດສາກະກຳ ແລະ ການຄ້າ' : 'Ministry of Industry and Commerce'}
            </span>
          </div>
        </div>
      </div>

      {/* Center Section: Global Search Input Field (Employees, Documents, Modules) */}
      <GlobalSearch className="mx-2 lg:mx-4" />

      {/* Right Section: Actions & Controls */}
      <div className="flex items-center gap-2 lg:gap-3">
        {/* Quick Punch In/Out Button */}
        <div className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => punchInOut('IN')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              todayPunch?.checkIn
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-emerald-600 shadow-xs'
            }`}
            title="Punch In"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{todayPunch?.checkIn ? `In: ${todayPunch.checkIn}` : t('punchIn')}</span>
          </button>
          <button
            onClick={() => punchInOut('OUT')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              todayPunch?.checkOut
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-blue-600'
            }`}
            title="Punch Out"
          >
            <span>{todayPunch?.checkOut ? `Out: ${todayPunch.checkOut}` : t('punchOut')}</span>
          </button>
        </div>

        {/* Quick Actions Menu (One-Click Access: Request Leave, Log Attendance, Submit Expense) */}
        <QuickActionsMenu
          isOpen={quickActionsOpen}
          onClose={() => setQuickActionsOpen(false)}
          onToggle={() => setQuickActionsOpen(!quickActionsOpen)}
        />

        {/* Role Switcher (Crucial for evaluation of all 5 RBAC roles) */}
        <div className="relative" ref={roleRef}>
          <button
            onClick={() => setRoleOpen(!roleOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-950/80 transition-colors"
            title="Switch User Role to test permissions"
          >
            <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="font-bold hidden sm:inline">{currentUser.role.replace('_', ' ')}</span>
            <ChevronDown className="w-3.5 h-3.5 text-blue-500" />
          </button>

          {roleOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {t('switchRole')}
                </div>
                <div className="text-[11px] text-slate-500">
                  {language === 'lo' ? 'ເລືອກບົດບາດເພື່ອທົດສອບສິດການເຂົ້າເຖິງ' : 'Select role to simulate access permissions'}
                </div>
              </div>
              <div className="py-1 space-y-1">
                {availableUsers.map((u) => {
                  const isSelected = u.id === currentUser.id;
                  return (
                    <button
                      key={u.id}
                      onClick={() => {
                        const prevRole = currentUser.role;
                        setCurrentUser(u);
                        setRoleOpen(false);
                        addAuditLog(
                          'ROLE_SWITCH',
                          'SYSTEM',
                          'System Administration',
                          `User persona switched from ${prevRole} to ${u.role} (${u.fullName})`,
                          {
                            entityType: 'USER_ACCOUNT',
                            entityName: u.fullName,
                            recordId: u.id,
                          }
                        );
                      }}
                      className={`w-full flex items-start gap-2.5 px-3 py-2 rounded-xl text-left text-xs transition-colors ${
                        isSelected
                          ? 'bg-blue-600 text-white font-medium'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <UserCheck className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? 'text-white' : 'text-blue-600'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold flex items-center justify-between">
                          <span>{u.role.replace('_', ' ')}</span>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <div className={`text-[11px] truncate ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                          {language === 'lo' ? u.fullNameLao : u.fullName}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* System Audit Log Quick Shortcut (Super Admin, HR Admin, Executive) */}
        {(currentUser.role === 'SUPER_ADMIN' ||
          currentUser.role === 'HR_ADMIN' ||
          currentUser.role === 'EXECUTIVE') && (
          <button
            type="button"
            onClick={() => {
              setActiveModule('module-15');
              setActiveSubModule('audit-logs');
            }}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative cursor-pointer group"
            title={
              language === 'lo'
                ? `ບັນທຶກລະບົບ (System Audit Logs) - ${auditLogs.length} ລາຍການ`
                : `System Audit Logs & Compliance - ${auditLogs.length} records logged`
            }
            aria-label="System Audit Logs"
          >
            <History className="w-5 h-5 transition-transform group-hover:rotate-[-20deg]" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
            </span>
          </button>
        )}

        {/* Modern Notification Center (Pending Approvals, Leave Expirations, Announcements) */}
        <NotificationCenter
          isOpen={notifOpen}
          onClose={() => setNotifOpen(false)}
          onToggle={() => setNotifOpen(!notifOpen)}
        />

        {/* QR Code Quick Scanner Button */}
        <button
          type="button"
          onClick={() => setQrScannerOpen(true)}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative cursor-pointer"
          title={language === 'lo' ? 'ສະແກນ QR Code ບັດພະນັກງານ / ເອກະສານ' : 'Scan Employee ID / Document QR Code'}
          aria-label="Scan QR Code"
        >
          <QrCode className="w-5 h-5" />
        </button>

        {/* QR Code Scanner Modal */}
        <QRCodeScannerModal
          isOpen={qrScannerOpen}
          onClose={() => setQrScannerOpen(false)}
          onSelectEmployee={(emp) => {
            setActiveModule('module-2');
          }}
          onSelectDocument={(doc) => {
            setActiveModule('module-13');
          }}
        />

        {/* Accessible Language Switcher Provider */}
        <LanguageSwitcher variant="compact" />

        {/* Dark/Light Mode Dynamic Toggle Switch */}
        <ThemeToggleSwitch />

        {/* User Profile Avatar with Account Settings & Logout Dropdown */}
        <div className="pl-1 border-l border-slate-200 dark:border-slate-800">
          <UserProfile />
        </div>
      </div>
    </header>
  );
};
