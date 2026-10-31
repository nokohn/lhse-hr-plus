import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { UserAccessControlManager } from '../components/admin/UserAccessControlManager.tsx';
import { alerts } from '../utils/alerts.ts';
import {
  Users,
  ShieldCheck,
  Laptop,
  History,
  Key,
  Shield,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  LogOut,
  Clock,
  Globe,
  Sparkles,
  Smartphone,
  Eye,
  Lock,
} from 'lucide-react';

export const UserManagementModule: React.FC = () => {
  const {
    language,
    t,
    currentUser,
    availableUsers,
    activeSubModule,
    setActiveSubModule,
    auditLogs,
  } = useApp();

  // Internal tab state syncing with activeSubModule
  const currentTab = activeSubModule || 'users-list';

  // Mock active sessions data for demonstration
  const [sessions, setSessions] = useState([
    {
      id: 'sess-1',
      username: currentUser.username,
      fullName: currentUser.fullName,
      role: currentUser.role,
      device: 'Desktop Chrome 124 (macOS / Linux)',
      ipAddress: '10.128.0.45',
      location: 'Vientiane Capital, Laos (LHSE HQ)',
      loginTime: '2026-10-29 07:15:30',
      isCurrent: true,
    },
    {
      id: 'sess-2',
      username: 'admin',
      fullName: 'System Administrator',
      role: 'SUPER_ADMIN',
      device: 'LHSE Workstation Terminal #02 (Windows 11)',
      ipAddress: '192.168.1.105',
      location: 'LHSE Server Room (HQ)',
      loginTime: '2026-10-29 06:40:12',
      isCurrent: currentUser.username === 'admin',
    },
    {
      id: 'sess-3',
      username: 'hradmin',
      fullName: 'Mrs. Keomany Vongxay',
      role: 'HR_ADMIN',
      device: 'iPad Pro / Safari Mobile',
      ipAddress: '10.128.1.22',
      location: 'Ban Phonxay, Vientiane Capital',
      loginTime: '2026-10-29 07:05:18',
      isCurrent: currentUser.username === 'hradmin',
    },
    {
      id: 'sess-4',
      username: 'executive',
      fullName: 'Mr. Bounleuth Luangrath (CEO)',
      role: 'EXECUTIVE',
      device: 'MacBook Air / Safari',
      ipAddress: '10.128.0.12',
      location: 'Executive Office, 4th Floor',
      loginTime: '2026-10-29 07:10:05',
      isCurrent: currentUser.username === 'executive',
    },
  ]);

  const handleRevokeSession = (sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    alerts.success(
      language === 'lo' ? 'ຕັດການເຊື່ອມຕໍ່ສຳເລັດ' : 'Session Terminated',
      language === 'lo'
        ? 'ເຊດຊັນດັ່ງກ່າວຖືກບັງຄັບໃຫ້ອອກຈາກລະບົບແລ້ວ'
        : 'The selected device session has been signed out.'
    );
  };

  // Filter audit logs specifically for security, user, and role events
  const securityAuditLogs = auditLogs.filter(
    (log) =>
      log.module === 'User Access Control' ||
      log.module === 'Authentication' ||
      log.module === 'User Profile & Settings' ||
      log.action === 'USER_LOGIN' ||
      log.action === 'USER_LOGOUT' ||
      log.action === 'ROLE_SWITCH' ||
      log.action === 'ROLE_PERMISSION_UPDATE'
  );

  return (
    <div className="space-y-6">
      {/* Module Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubModule('users-list')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            currentTab === 'users-list' || currentTab === 'users'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{language === 'lo' ? 'ບັນຊີຜູ້ໃຊ້ & ກຳນົດສິດ (Users & RBAC)' : 'User Accounts & Access'}</span>
        </button>

        <button
          onClick={() => setActiveSubModule('active-sessions')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            currentTab === 'active-sessions'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <Laptop className="w-4 h-4" />
          <span>{language === 'lo' ? 'ເຊດຊັນທີ່ກຳລັງໃຊ້ງານ (Active Sessions)' : 'Active Terminal Sessions'}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-white">
            {sessions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubModule('user-activity')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            currentTab === 'user-activity'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>{language === 'lo' ? 'ປະຫວັດການເຂົ້າລະບົບ (Security Logs)' : 'Security Audit & Logins'}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
            {securityAuditLogs.length}
          </span>
        </button>
      </div>

      {/* 1. USERS LIST & ROLES MATRIX */}
      {(currentTab === 'users-list' || currentTab === 'users' || currentTab === 'roles-permissions' || currentTab === 'roles') && (
        <UserAccessControlManager />
      )}

      {/* 2. ACTIVE SESSIONS SUBMODULE */}
      {currentTab === 'active-sessions' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 lg:p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Laptop className="w-5 h-5 text-blue-600" />
                <span>
                  {language === 'lo'
                    ? 'ອຸປະກອນ ແລະ ເຊດຊັນທີ່ກຳລັງເຊື່ອມຕໍ່ (Active User Sessions)'
                    : 'Active Terminal & Device Sessions'}
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === 'lo'
                  ? 'ກວດສອບອຸປະກອນທີ່ກຳລັງເຂົ້າສູ່ລະບົບ LHSE HRMS ໃນປັດຈຸບັນ ແລະ ສັ່ງຕັດການເຊື່ອມຕໍ່ຫາກພົບຄວາມຜິດປົກກະຕິ'
                  : 'Monitor active employee sessions, IPs, devices, and force revoke suspicious connections'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">
                {language === 'lo' ? 'ເຊດຊັນທີ່ເປີດຢູ່:' : 'Live Sessions:'}
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                {sessions.length} Connected
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sessions.map((sess) => (
              <div
                key={sess.id}
                className={`p-5 rounded-3xl border transition-all ${
                  sess.isCurrent
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-2xs">
                      {sess.device.includes('iPad') || sess.device.includes('Mobile') ? (
                        <Smartphone className="w-5 h-5" />
                      ) : (
                        <Laptop className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                          {sess.fullName}
                        </h4>
                        {sess.isCurrent && (
                          <span className="px-2 py-0.2 rounded-full text-[9px] font-black bg-blue-600 text-white">
                            Current Device
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        @{sess.username} • {sess.role}
                      </p>
                    </div>
                  </div>

                  {!sess.isCurrent && (
                    <button
                      type="button"
                      onClick={() => handleRevokeSession(sess.id)}
                      className="px-2.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      title="Force Sign Out"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{language === 'lo' ? 'ຕັດສິດ' : 'Revoke'}</span>
                    </button>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">{language === 'lo' ? 'ອຸປະກອນ:' : 'Client:'}</span>
                    <strong className="text-slate-700 dark:text-slate-300 truncate block">
                      {sess.device}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">IP & Location:</span>
                    <strong className="text-slate-700 dark:text-slate-300 font-mono truncate block">
                      {sess.ipAddress}
                    </strong>
                  </div>
                  <div className="col-span-2 text-slate-400 flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3" />
                    <span>{language === 'lo' ? 'ເຂົ້າສູ່ລະບົບເມື່ອ:' : 'Logged in:'} {sess.loginTime}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. SECURITY AUDIT LOGS SUBMODULE */}
      {currentTab === 'user-activity' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 lg:p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6 animate-in fade-in">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <History className="w-5 h-5 text-blue-600" />
              <span>
                {language === 'lo'
                  ? 'ບັນທຶກຄວາມປອດໄພ & ການເຂົ້າສູ່ລະບົບ (Security Audit Trail)'
                  : 'User Access & Security Audit Trail'}
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'lo'
                ? 'ປະຫວັດການເຂົ້າ-ອອກລະບົບ, ການປ່ຽນລະຫັດຜ່ານ, ແລະ ການປັບປຸງສິດທິຜູ້ໃຊ້ທັງໝົດ'
                : 'Audited log of logins, logouts, role switches, and permission alterations'}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-500 uppercase font-black text-[10px]">
                  <th className="p-3">{language === 'lo' ? 'ເວລາ' : 'Timestamp'}</th>
                  <th className="p-3">{language === 'lo' ? 'ຜູ້ໃຊ້ (Actor)' : 'User / Actor'}</th>
                  <th className="p-3">{language === 'lo' ? 'ການດຳເນີນງານ' : 'Action'}</th>
                  <th className="p-3">{language === 'lo' ? 'ລາຍລະອຽດ' : 'Details'}</th>
                  <th className="p-3 text-right">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {securityAuditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      {language === 'lo' ? 'ບໍ່ມີບັນທຶກຄວາມປອດໄພໃນຂະນະນີ້' : 'No security logs found'}
                    </td>
                  </tr>
                ) : (
                  securityAuditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {log.userName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {log.userRole}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3 text-slate-700 dark:text-slate-300 font-medium">
                        {log.details}
                      </td>
                      <td className="p-3 font-mono text-slate-400 text-right text-[11px]">
                        {log.ipAddress || '10.128.0.45'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
