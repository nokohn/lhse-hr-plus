import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { DataTable, Column } from '../components/common/DataTable.tsx';
import { User, AuditLog } from '../types/index.ts';
import { alerts } from '../utils/alerts.ts';
import { AuditLogViewer } from '../components/admin/AuditLogViewer.tsx';
import { UserAccessControlManager } from '../components/admin/UserAccessControlManager.tsx';
import { CloudflareDeploymentHub } from '../components/admin/CloudflareDeploymentHub.tsx';
import {
  Settings,
  Building2,
  Users,
  Shield,
  FileCode2,
  Database,
  Lock,
  CreditCard,
  History,
  CheckCircle2,
  AlertTriangle,
  Server,
  Cloud,
} from 'lucide-react';

export const SystemAdminModule: React.FC = () => {
  const {
    t,
    language,
    orgProfile,
    setOrgProfile,
    availableUsers,
    auditLogs,
    activeSubModule,
    setActiveSubModule,
    currentUser,
  } = useApp();

  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';

  const userColumns: Column<User>[] = [
    { key: 'username', header: 'Username' },
    {
      key: 'fullName',
      header: 'Full Name',
      render: (u) => (
        <div>
          <div className="font-bold text-slate-900 dark:text-slate-100">
            {language === 'lo' ? u.fullNameLao : u.fullName}
          </div>
          <div className="text-[11px] text-slate-400 font-sans">{u.email}</div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (u) => (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-mono">
          {u.role}
        </span>
      ),
    },
    {
      key: 'isActive',
      header: t('status'),
      render: (u) => (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          {u.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];

  const auditColumns: Column<AuditLog>[] = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      render: (a) => <span className="font-mono text-xs">{new Date(a.timestamp).toLocaleString()}</span>,
    },
    {
      key: 'userName',
      header: 'Actor',
      render: (a) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-slate-100">{a.userName}</span>
          <span className="text-[10px] text-slate-400 block font-mono">{a.userRole}</span>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      render: (a) => (
        <span className="font-mono font-bold text-[11px] text-blue-600 dark:text-blue-400">
          {a.action}
        </span>
      ),
    },
    { key: 'module', header: 'Module' },
    { key: 'details', header: 'Details' },
    {
      key: 'ipAddress',
      header: 'IP Address',
      render: (a) => <span className="font-mono text-slate-400 text-[11px]">{a.ipAddress}</span>,
    },
  ];

  const permissionMatrix = [
    {
      module: 'Executive Dashboard',
      superAdmin: 'Full Access',
      hrAdmin: 'Full Access',
      executive: 'Full View & Approvals',
      deptHead: 'Department Scope',
      employee: 'Personal Scope',
    },
    {
      module: 'Employee Management',
      superAdmin: 'CRUD + Sensitive',
      hrAdmin: 'CRUD + Sensitive',
      executive: 'View Only',
      deptHead: 'Team Directory',
      employee: 'Personal Directory',
    },
    {
      module: 'Organization Planning',
      superAdmin: 'Manage All',
      hrAdmin: 'Manage All',
      executive: 'View & Authorize',
      deptHead: 'View Department',
      employee: 'No Access',
    },
    {
      module: 'Attendance & Schedules',
      superAdmin: 'Manage All',
      hrAdmin: 'Manage All',
      executive: 'View Reports',
      deptHead: 'Approve Corrections',
      employee: 'Check In/Out + Own Log',
    },
    {
      module: 'Leave Management',
      superAdmin: 'Manage All',
      hrAdmin: 'Manage All',
      executive: 'Final Approval',
      deptHead: 'Dept Step Approval',
      employee: 'Submit + Balance View',
    },
    {
      module: 'Payroll Management',
      superAdmin: 'Generate & Lock',
      hrAdmin: 'Generate & Review',
      executive: 'Executive Approval',
      deptHead: 'No Access',
      employee: 'Personal Payslips Only',
    },
    {
      module: 'Discipline & Warnings',
      superAdmin: 'Full Restricted',
      hrAdmin: 'Full Restricted',
      executive: 'Full Restricted',
      deptHead: 'No Access',
      employee: 'No Access',
    },
    {
      module: 'Central Approval Engine',
      superAdmin: 'Super Administer',
      hrAdmin: 'HR Step Approve',
      executive: 'Executive Step Approve',
      deptHead: 'Dept Step Approve',
      employee: 'Submitter Only',
    },
    {
      module: 'System Administration',
      superAdmin: 'Full Control',
      hrAdmin: 'Audit & User View',
      executive: 'No Access',
      deptHead: 'No Access',
      employee: 'No Access',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Submodule Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubModule('lhse-profile')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeSubModule === 'lhse-profile'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>{t('lhseProfile')}</span>
        </button>
        <button
          onClick={() => setActiveSubModule('users')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeSubModule === 'users'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{t('userAccounts')}</span>
        </button>
        <button
          onClick={() => setActiveSubModule('roles')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeSubModule === 'roles'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>{t('rolesPermissions')}</span>
        </button>
        <button
          onClick={() => setActiveSubModule('audit-logs')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeSubModule === 'audit-logs' || activeSubModule === 'audit-trail'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>{language === 'lo' ? 'ລະບົບບັນທຶກການເຄື່ອນໄຫວ & ກວດສອບ HR' : 'Activity Logging & HR Audit'}</span>
          <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold ${
            activeSubModule === 'audit-logs' || activeSubModule === 'audit-trail'
              ? 'bg-white/20 text-white'
              : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
          }`}>
            {auditLogs.length}
          </span>
        </button>
        <button
          onClick={() => setActiveSubModule('cloudflare-deploy')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeSubModule === 'cloudflare-deploy'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <Cloud className="w-4 h-4 text-orange-500" />
          <span>{language === 'lo' ? 'Deploy ຂຶ້ນ Cloudflare' : 'Cloudflare Deploy'}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
        </button>
        <button
          onClick={() => setActiveSubModule('system-status')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeSubModule === 'system-status'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>{t('systemStatus')}</span>
        </button>
      </div>

      {activeSubModule === 'lhse-profile' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 lg:p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex items-center gap-4 p-5 rounded-2xl bg-linear-to-r from-blue-700 to-indigo-800 text-white shadow-md">
            <div className="w-20 h-20 rounded-2xl bg-white p-1 flex items-center justify-center shrink-0 border-2 border-white/50 shadow-lg">
              <img
                src={orgProfile.logoUrl || '/assets/aistudio/______________________95dd5853.png'}
                alt="LHSE Official Logo"
                className="w-full h-full object-contain rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <h2 className="font-black text-lg">{orgProfile.companyNameLao}</h2>
              <p className="text-xs text-blue-100">{orgProfile.companyNameEn}</p>
              <p className="text-xs text-amber-300 font-medium">
                {orgProfile.ministryLao || 'ກະຊວງອຸດສາກະກຳ ແລະ ການຄ້າ'} • {orgProfile.ministryEn || 'Ministry of Industry and Commerce'}
              </p>
              <div className="flex flex-wrap gap-2 text-[11px] pt-1">
                <span className="bg-white/10 px-2 py-0.5 rounded-md font-mono">Tax ID: {orgProfile.taxId}</span>
                <span className="bg-white/10 px-2 py-0.5 rounded-md font-mono">Reg: {orgProfile.enterpriseRegistrationNo}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-slate-400">{language === 'lo' ? 'ຜູ້ອຳນວຍການໃຫຍ່' : 'Managing Director / CEO'}</span>
              <p className="font-bold text-slate-800 dark:text-slate-200">{orgProfile.directorGeneralLao} ({orgProfile.directorGeneralEn})</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-slate-400">{language === 'lo' ? 'ທຶນຈົດທະບຽນທັງໝົດ' : 'Authorized Capital'}</span>
              <p className="font-bold text-emerald-600 font-mono text-sm">{(orgProfile.totalCapitalLAK).toLocaleString()} LAK</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-slate-400">{language === 'lo' ? 'ສຳນັກງານໃຫຍ່' : 'Headquarters Address'}</span>
              <p className="font-medium text-slate-800 dark:text-slate-200">{orgProfile.addressLao}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-slate-400">{language === 'lo' ? 'ບັນຊີທະນາຄານຫຼັກ' : 'Primary State Bank Account'}</span>
              <p className="font-bold font-mono text-blue-600">{orgProfile.primaryBank}: {orgProfile.primaryAccountNumber}</p>
            </div>
          </div>
        </div>
      )}

      {(activeSubModule === 'users' || activeSubModule === 'roles' || activeSubModule === 'permissions') && (
        <UserAccessControlManager />
      )}

      {(activeSubModule === 'audit-logs' || activeSubModule === 'audit-trail') && (
        <AuditLogViewer />
      )}

      {activeSubModule === 'cloudflare-deploy' && <CloudflareDeploymentHub />}

      {activeSubModule === 'system-status' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 lg:p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex items-center gap-3">
            <Server className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                System Status & Database Connectivity Report
              </h3>
              <p className="text-xs text-slate-500">
                Runtime environment verification and PostgreSQL database deployment assets
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Environment Status Notice: Cloud SQL Quota Limit Reached</span>
            </div>
            <p className="text-amber-800 dark:text-amber-300 leading-relaxed">
              When verifying Cloud SQL Developer Edition eligibility via <code className="font-mono bg-white/60 dark:bg-black/30 px-1 py-0.5 rounded-sm">CheckFeatureEligibility</code>, the platform returned <code className="font-mono bg-white/60 dark:bg-black/30 px-1 py-0.5 rounded-sm">DEVELOPER_EDITION_QUOTA_PER_PROJECT_EXHAUSTED</code> (maximum Cloud SQL instances per sandbox project reached).
            </p>
            <p className="text-amber-800 dark:text-amber-300 leading-relaxed">
              As mandated by the master specification: <em>"If the environment cannot run the complete backend or database, clearly identify the limitation and provide the required backend code and setup instructions. Never pretend that unavailable services are connected."</em>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Live Preview Storage Engine
              </h4>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Running in Full-Stack Express mode with transactional browser and file storage synchronization. Every creation, update, approval, check-in, payroll run, and Excel import is recorded and persists across page reloads.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-blue-600" />
                Production PostgreSQL & Prisma Schemas
              </h4>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Full production database assets are generated in the repository root: <code className="font-mono text-blue-600">prisma/schema.prisma</code>, <code className="font-mono text-blue-600">prisma/schema.sql</code>, <code className="font-mono text-blue-600">prisma/seed.ts</code>, and <code className="font-mono text-blue-600">docker-compose.yml</code>.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
