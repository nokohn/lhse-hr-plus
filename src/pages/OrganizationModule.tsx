import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { DataTable, Column } from '../components/common/DataTable.tsx';
import { Modal } from '../components/common/Modal.tsx';
import { Branch, Department, Position } from '../types/index.ts';
import {
  Network,
  Building2,
  Users,
  Target,
  Plus,
  Briefcase,
  Layers,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { OrgChartVisual } from '../components/organization/OrgChartVisual.tsx';
import { OrganizationQuickStats } from '../components/organization/OrganizationQuickStats.tsx';

export const OrganizationModule: React.FC = () => {
  const {
    t,
    language,
    branches,
    departments,
    positions,
    employees,
    activeSubModule,
    setActiveSubModule,
    setBranches,
    setDepartments,
    setPositions,
    currentUser,
  } = useApp();

  const isHRorAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'HR_ADMIN';

  // Planned Headcount comparison mock data
  const workforcePlans = [
    { department: 'Executive Management Office', planned: 6, actual: 6, open: 0 },
    { department: 'Human Resources & Administration', planned: 15, actual: 14, open: 1 },
    { department: 'Finance & Accounting', planned: 12, actual: 12, open: 0 },
    { department: 'Energy Projects & Investment', planned: 18, actual: 16, open: 2 },
    { department: 'Legal & Enterprise Compliance', planned: 9, actual: 8, open: 1 },
  ];

  const branchColumns: Column<Branch>[] = [
    { key: 'code', header: 'Code' },
    {
      key: 'name',
      header: language === 'lo' ? 'ຊື່ສາຂາ' : 'Branch Name',
      render: (b) => (
        <div>
          <div className="font-bold text-slate-900 dark:text-slate-100">
            {language === 'lo' ? b.nameLao : b.nameEn}
          </div>
          <div className="text-[11px] text-slate-400">
            {language === 'lo' ? b.nameEn : b.nameLao}
          </div>
        </div>
      ),
    },
    { key: 'location', header: language === 'lo' ? 'ທີ່ຕັ້ງແຂວງ' : 'Location' },
    { key: 'managerName', header: language === 'lo' ? 'ຫົວໜ້າສາຂາ' : 'Branch Manager' },
    { key: 'phone', header: language === 'lo' ? 'ເບີຕິດຕໍ່' : 'Contact Phone' },
    {
      key: 'headcount',
      header: language === 'lo' ? 'ຈຳນວນພະນັກງານ' : 'Headcount',
      render: (b) => {
        const count = employees.filter((e) => e.branchId === b.id).length;
        return <span className="font-bold font-mono px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">{count}</span>;
      },
    },
  ];

  const deptColumns: Column<Department>[] = [
    { key: 'code', header: 'Code' },
    {
      key: 'name',
      header: language === 'lo' ? 'ຊື່ພະແນກ' : 'Department Name',
      render: (d) => (
        <div>
          <div className="font-bold text-slate-900 dark:text-slate-100">
            {language === 'lo' ? d.nameLao : d.nameEn}
          </div>
          <div className="text-[11px] text-slate-400">
            {language === 'lo' ? d.nameEn : d.nameLao}
          </div>
        </div>
      ),
    },
    { key: 'headName', header: language === 'lo' ? 'ຫົວໜ້າພະແນກ' : 'Department Head' },
    {
      key: 'budget',
      header: language === 'lo' ? 'ງົບປະມານດຳເນີນງານ (LAK)' : 'Operational Budget',
      render: (d) => (
        <span className="font-mono font-medium">
          {d.budget ? `${(d.budget / 1000000).toLocaleString()}M LAK` : '-'}
        </span>
      ),
    },
    {
      key: 'headcount',
      header: language === 'lo' ? 'ຈຳນວນພະນັກງານ' : 'Headcount',
      render: (d) => {
        const count = employees.filter((e) => e.departmentId === d.id).length;
        return <span className="font-bold font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">{count}</span>;
      },
    },
  ];

  const posColumns: Column<Position>[] = [
    {
      key: 'title',
      header: language === 'lo' ? 'ຊື່ຕຳແໜ່ງ' : 'Position Title',
      render: (p) => (
        <div>
          <div className="font-bold text-slate-900 dark:text-slate-100">
            {language === 'lo' ? p.titleLao : p.titleEn}
          </div>
          <div className="text-[11px] text-slate-400">
            {language === 'lo' ? p.titleEn : p.titleLao}
          </div>
        </div>
      ),
    },
    {
      key: 'departmentId',
      header: t('department'),
      render: (p) => {
        const d = departments.find((dept) => dept.id === p.departmentId);
        return <span>{d ? (language === 'lo' ? d.nameLao : d.nameEn) : '-'}</span>;
      },
    },
    {
      key: 'level',
      header: language === 'lo' ? 'ລະດັບຕຳແໜ່ງ' : 'Level',
      render: (p) => (
        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
          {p.level}
        </span>
      ),
    },
    {
      key: 'salaryBand',
      header: language === 'lo' ? 'ຂອບເຂດເງິນເດືອນ (Min - Max LAK)' : 'Salary Band (Min - Max)',
      render: (p) => (
        <span className="font-mono text-xs">
          {(p.baseSalaryMin / 1000000).toFixed(0)}M - {(p.baseSalaryMax / 1000000).toFixed(0)}M LAK
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Stats Summary Card */}
      <OrganizationQuickStats />

      {/* Submodule Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubModule('org-chart')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeSubModule === 'org-chart'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <Network className="w-4 h-4" />
          <span>{t('orgChart')}</span>
        </button>
        <button
          onClick={() => setActiveSubModule('branches')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubModule === 'branches'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          {t('branches')}
        </button>
        <button
          onClick={() => setActiveSubModule('departments')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubModule === 'departments'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          {t('departments')}
        </button>
        <button
          onClick={() => setActiveSubModule('positions')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubModule === 'positions'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          {t('positions')}
        </button>
        <button
          onClick={() => setActiveSubModule('workforce-plan')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeSubModule === 'workforce-plan'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>{t('workforcePlanning')}</span>
        </button>
      </div>

      {/* Submodule Views */}
      {activeSubModule === 'org-chart' && <OrgChartVisual />}

      {activeSubModule === 'branches' && (
        <DataTable data={branches} columns={branchColumns} filename="LHSE_Branches" />
      )}

      {activeSubModule === 'departments' && (
        <DataTable data={departments} columns={deptColumns} filename="LHSE_Departments" />
      )}

      {activeSubModule === 'positions' && (
        <DataTable data={positions} columns={posColumns} filename="LHSE_Positions" />
      )}

      {activeSubModule === 'workforce-plan' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 lg:p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                {language === 'lo' ? 'ລາຍງານແຜນກຳລັງຄົນ ທຽບໃສ່ ຕົວຈິງ (Planned vs Actual)' : 'Workforce Planning Comparison'}
              </h3>
              <p className="text-xs text-slate-500">
                {language === 'lo' ? 'ແຜນກຳລັງຄົນປະຈຳປີ 2026 ຂອງລັດວິສາຫະກິດ ຖືຮຸ້ນລາວ' : 'Annual workforce quota vs filled positions'}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {workforcePlans.map((wp, idx) => {
              const percentage = Math.round((wp.actual / wp.planned) * 100);
              return (
                <div
                  key={idx}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 dark:text-slate-100">{wp.department}</span>
                    <div className="flex items-center gap-4">
                      <span>{language === 'lo' ? 'ຕົວຈິງ:' : 'Actual:'} <strong className="font-mono">{wp.actual}</strong></span>
                      <span>{language === 'lo' ? 'ຕາມແຜນ:' : 'Planned:'} <strong className="font-mono">{wp.planned}</strong></span>
                      <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">{percentage}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        percentage >= 100 ? 'bg-emerald-500' : 'bg-blue-600'
                      }`}
                      style={{ width: `${Math.min(100, percentage)}%` }}
                    />
                  </div>
                  {wp.open > 0 && (
                    <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                      • {wp.open} {language === 'lo' ? 'ຕຳແໜ່ງວ່າງກຳລັງເປີດຮັບສະໝັກ' : 'open vacancies recruiting'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
