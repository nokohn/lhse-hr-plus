import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { DataTable, Column } from '../components/common/DataTable.tsx';
import { Modal } from '../components/common/Modal.tsx';
import { RecruitmentRequisition, Candidate } from '../types/index.ts';
import { alerts } from '../utils/alerts.ts';
import {
  UserPlus,
  Briefcase,
  Users,
  Calendar,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Phone,
  Mail,
} from 'lucide-react';

export const RecruitmentModule: React.FC = () => {
  const {
    t,
    language,
    departments,
    requisitions,
    candidates,
    activeSubModule,
    setActiveSubModule,
    hireCandidateAndOnboard,
  } = useApp();

  const handleHireClick = async (cand: Candidate) => {
    const confirmed = await alerts.confirm(
      language === 'lo' ? 'ຢືນຢັນການຮັບເຂົ້າເຮັດວຽກ' : 'Confirm Hire & Onboard',
      `${language === 'lo' ? 'ທ່ານຕ້ອງການຮັບ' : 'Are you sure you want to hire'} ${cand.fullName} ${language === 'lo' ? 'ເຂົ້າເປັນພະນັກງານ LHSE ແລະ ສົ່ງຕໍ່ຂັ້ນຕອນ Onboarding ຫຼື ບໍ່?' : 'and transfer them to LHSE Onboarding?'}`
    );
    if (confirmed) {
      hireCandidateAndOnboard(cand.id);
    }
  };

  const reqColumns: Column<RecruitmentRequisition>[] = [
    {
      key: 'reqNumber',
      header: 'Req #',
      render: (r) => <span className="font-mono font-bold text-blue-600">{r.reqNumber}</span>,
    },
    { key: 'positionTitle', header: 'Position Title' },
    {
      key: 'departmentId',
      header: t('department'),
      render: (r) => {
        const d = departments.find((dept) => dept.id === r.departmentId);
        return <span>{d ? (language === 'lo' ? d.nameLao : d.nameEn) : r.departmentId}</span>;
      },
    },
    {
      key: 'vacanciesCount',
      header: language === 'lo' ? 'ຕຳແໜ່ງວ່າງ' : 'Openings',
      render: (r) => <span className="font-bold font-mono">{r.vacanciesCount} seats</span>,
    },
    {
      key: 'budgetSalary',
      header: language === 'lo' ? 'ງົບປະມານເງິນເດືອນ' : 'Budget Salary',
      render: (r) => <span className="font-mono">{r.budgetSalary.toLocaleString()} LAK</span>,
    },
    { key: 'deadline', header: 'Deadline' },
    {
      key: 'status',
      header: t('status'),
      render: (r) => (
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            r.status === 'OPEN'
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
              : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
          }`}
        >
          {r.status}
        </span>
      ),
    },
  ];

  const candidateColumns: Column<Candidate>[] = [
    {
      key: 'fullName',
      header: language === 'lo' ? 'ຊື່ຜູ້ສະໝັກ' : 'Candidate Name',
      render: (c) => (
        <div>
          <div className="font-bold text-slate-900 dark:text-slate-100">{c.fullName}</div>
          <div className="text-[11px] text-slate-400 flex items-center gap-2">
            <span>{c.email}</span> • <span>{c.phone}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'requisitionId',
      header: 'Applied Position',
      render: (c) => {
        const req = requisitions.find((r) => r.id === c.requisitionId);
        return <span className="font-medium text-xs">{req ? req.positionTitle : c.requisitionId}</span>;
      },
    },
    {
      key: 'stage',
      header: 'Recruitment Stage',
      render: (c) => (
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            c.stage === 'HIRED'
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
              : c.stage === 'OFFERED'
              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
              : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
          }`}
        >
          {c.stage}
        </span>
      ),
    },
    {
      key: 'interviewDate',
      header: 'Interview Schedule',
      render: (c) => (
        <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
          {c.interviewDate || 'Not scheduled'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('actions'),
      sortable: false,
      render: (c) => (
        <div>
          {c.stage !== 'HIRED' ? (
            <button
              onClick={() => handleHireClick(c)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-transform hover:scale-105"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{t('hireCandidate')}</span>
            </button>
          ) : (
            <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Onboarded
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Submodule Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubModule('candidates')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeSubModule === 'candidates'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{t('candidates')} ({candidates.length})</span>
        </button>
        <button
          onClick={() => setActiveSubModule('requisitions')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeSubModule === 'requisitions'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>{t('requisitions')} ({requisitions.length})</span>
        </button>
      </div>

      {activeSubModule === 'candidates' ? (
        <DataTable
          data={candidates}
          columns={candidateColumns}
          filename="LHSE_Candidates_Pipeline"
        />
      ) : (
        <DataTable
          data={requisitions}
          columns={reqColumns}
          filename="LHSE_Recruitment_Requisitions"
        />
      )}
    </div>
  );
};
