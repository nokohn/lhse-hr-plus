import React from 'react';
import { useApp } from '../context/AppContext.tsx';
import { DataTable, Column } from '../components/common/DataTable.tsx';
import { PerformanceEvaluation, TrainingCourse } from '../types/index.ts';
import { ManagerKPIDashboard } from '../components/development/ManagerKPIDashboard.tsx';
import {
  GraduationCap,
  Award,
  BookOpen,
  HeartHandshake,
  CheckCircle,
  Star,
  Users,
  Target,
  TrendingUp,
  BarChart3,
  Sparkles,
} from 'lucide-react';

export const DevelopmentModule: React.FC = () => {
  const {
    t,
    language,
    employees,
    evaluations,
    trainingCourses,
    activeSubModule,
    setActiveSubModule,
  } = useApp();

  // If activeSubModule is not explicitly set to evaluations, trainings, or benefits, default to 'kpis'
  const currentTab =
    activeSubModule === 'evaluations' ||
    activeSubModule === 'trainings' ||
    activeSubModule === 'benefits'
      ? activeSubModule
      : 'kpis';

  const evalColumns: Column<PerformanceEvaluation>[] = [
    { key: 'period', header: 'Period' },
    {
      key: 'employeeId',
      header: t('employee'),
      render: (ev) => {
        const emp = employees.find((e) => e.id === ev.employeeId);
        return (
          <div>
            <div className="font-bold text-slate-900 dark:text-slate-100">
              {emp ? `${emp.firstNameLao} ${emp.lastNameLao}` : ev.employeeId}
            </div>
            <div className="text-[11px] text-slate-400 font-mono">{emp?.employeeCode}</div>
          </div>
        );
      },
    },
    {
      key: 'score',
      header: 'Score / Grade',
      render: (ev) => (
        <div className="flex items-center gap-2">
          <span className="font-mono font-black text-sm">{ev.score}/100</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              ev.grade === 'A'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
            }`}
          >
            Grade {ev.grade}
          </span>
        </div>
      ),
    },
    {
      key: 'strengths',
      header: 'Strengths & Achievements',
      render: (ev) => <span className="line-clamp-2 text-slate-600 dark:text-slate-300 text-xs">{ev.strengths}</span>,
    },
    {
      key: 'status',
      header: t('status'),
      render: (ev) => (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          {ev.status}
        </span>
      ),
    },
  ];

  const courseColumns: Column<TrainingCourse>[] = [
    {
      key: 'title',
      header: 'Course Title',
      render: (tc) => (
        <div>
          <div className="font-bold text-slate-900 dark:text-slate-100">
            {language === 'lo' ? tc.titleLao : tc.titleEn}
          </div>
          <div className="text-[11px] text-slate-400 font-sans">
            {language === 'lo' ? tc.titleEn : tc.titleLao}
          </div>
        </div>
      ),
    },
    { key: 'provider', header: 'Provider' },
    {
      key: 'dates',
      header: 'Dates',
      render: (tc) => <span className="font-mono text-xs">{tc.startDate} → {tc.endDate}</span>,
    },
    {
      key: 'enrollment',
      header: 'Enrolled / Capacity',
      render: (tc) => (
        <span className="font-mono font-bold">
          {tc.enrolledCount} / {tc.capacity}
        </span>
      ),
    },
    {
      key: 'status',
      header: t('status'),
      render: (tc) => (
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            tc.status === 'COMPLETED'
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
              : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
          }`}
        >
          {tc.status}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Submodule Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        {/* Primary Tab: KPI Dashboard & Analytics */}
        <button
          onClick={() => setActiveSubModule('kpis')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            currentTab === 'kpis'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>{language === 'lo' ? 'ດັດຊະນີວັດຜົນ KPI & ທ່າອ່ຽງ (Manager KPI)' : 'Manager KPI Dashboard'}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-400 text-slate-900 font-extrabold uppercase">
            Live
          </span>
        </button>

        {/* Tab 2: Evaluations */}
        <button
          onClick={() => setActiveSubModule('evaluations')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            currentTab === 'evaluations'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>{t('evaluations')}</span>
        </button>

        {/* Tab 3: Trainings */}
        <button
          onClick={() => setActiveSubModule('trainings')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            currentTab === 'trainings'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>{t('trainingPlans')}</span>
        </button>

        {/* Tab 4: Benefits */}
        <button
          onClick={() => setActiveSubModule('benefits')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            currentTab === 'benefits'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <HeartHandshake className="w-4 h-4" />
          <span>{t('benefits')}</span>
        </button>
      </div>

      {/* View 1: Manager KPI Dashboard with Time-Series & Data Visualizations */}
      {currentTab === 'kpis' && (
        <ManagerKPIDashboard />
      )}

      {/* View 2: Performance Evaluations */}
      {currentTab === 'evaluations' && (
        <DataTable
          data={evaluations}
          columns={evalColumns}
          filename="LHSE_KPI_Evaluations"
        />
      )}

      {/* View 3: Training Courses */}
      {currentTab === 'trainings' && (
        <DataTable
          data={trainingCourses}
          columns={courseColumns}
          filename="LHSE_Training_Courses"
        />
      )}

      {/* View 4: Enterprise Benefits */}
      {currentTab === 'benefits' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 flex items-center justify-center font-bold">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              {language === 'lo' ? 'ປະກັນໄພສຸຂະພາບ & ອຸບັດຕິເຫດ' : 'Enterprise Health & Life Insurance'}
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              {language === 'lo'
                ? 'ຄຸ້ມຄອງການປິ່ນປົວສຸຂະພາບຢູ່ໂຮງໝໍສາກົນ ທັງພາຍໃນ ແລະ ປະເທດໄທ ສູງສຸດ 150,000,000 ກີບ/ປີ.'
                : 'Comprehensive medical coverage at contracted private and regional hospitals up to 150M LAK/yr.'}
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              {language === 'lo' ? 'ເງິນອຸດໜູນຄ່ານ້ຳມັນ & ພາຫະນະ' : 'Fuel & Mobility Allowance'}
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              {language === 'lo'
                ? 'ເງິນອຸດໜູນລາຍເດືອນ 1,000,000 - 2,500,000 ກີບ ຕາມຕຳແໜ່ງງານ ແລະ ພາກສະໜາມ.'
                : 'Standard monthly fuel and transportation compensation included directly in gross salary.'}
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 flex items-center justify-center font-bold">
              <Star className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              {language === 'lo' ? 'ເງິນອຸດໜູນບຸດ & ສະຫວັດດີການຄອບຄົວ' : 'Child Support & Family Benefits'}
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              {language === 'lo'
                ? 'ເງິນອຸດໜູນລ້ຽງດູລູກ 500,000 ກີບ/ເດືອນ ຕໍ່ບຸດ 1 ຄົນ ຈົນຮອດອາຍຸ 18 ປີ.'
                : 'Monthly allowance of 500,000 LAK per dependent child up to 18 years of age.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
