import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { DataTable, Column } from '../components/common/DataTable.tsx';
import { Shift, Holiday } from '../types/index.ts';
import { alerts } from '../utils/alerts.ts';
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
  ShieldCheck,
  CalendarRange,
} from 'lucide-react';
import { ShiftPlannerView } from '../components/schedule/ShiftPlannerView.tsx';

export const WorkScheduleModule: React.FC = () => {
  const {
    t,
    language,
    shifts,
    holidays,
    activeSubModule,
    setActiveSubModule,
    setHolidays,
    setShifts,
  } = useApp();

  const isPlannerActive = activeSubModule === 'schedules' || activeSubModule === 'planner' || !activeSubModule;

  const holidayColumns: Column<Holiday>[] = [
    {
      key: 'date',
      header: t('date'),
      render: (h) => <span className="font-mono font-bold text-blue-600">{h.date}</span>,
    },
    {
      key: 'nameLao',
      header: language === 'lo' ? 'ຊື່ວັນບຸນປະເພນີ / ວັນພັກລັດຖະການ' : 'Holiday Name (Lao)',
      render: (h) => <span className="font-bold text-slate-900 dark:text-slate-100">{h.nameLao}</span>,
    },
    {
      key: 'nameEn',
      header: language === 'lo' ? 'ຊື່ພາສາອັງກິດ' : 'Holiday Name (English)',
      render: (h) => <span className="text-slate-600 dark:text-slate-400">{h.nameEn}</span>,
    },
    {
      key: 'isRecurring',
      header: language === 'lo' ? 'ວັນພັກປະຈຳປີ' : 'Annual Recurring',
      render: (h) => (
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            h.isRecurring
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
          }`}
        >
          {h.isRecurring ? 'Yes' : 'No (Compensatory)'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Submodule Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubModule('schedules')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            isPlannerActive
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <CalendarRange className="w-4 h-4" />
          <span>{language === 'lo' ? 'ຕາຕະລາງຈັດກະ (Shift Planner)' : 'Shift Planner'}</span>
        </button>
        <button
          onClick={() => setActiveSubModule('shifts')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeSubModule === 'shifts'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>{t('shiftManagement')}</span>
        </button>
        <button
          onClick={() => setActiveSubModule('holidays')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeSubModule === 'holidays'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>{t('holidayCalendar')} (2026)</span>
        </button>
        <button
          onClick={() => setActiveSubModule('working-days')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubModule === 'working-days'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          {t('workingDaysConfig')}
        </button>
      </div>

      {isPlannerActive && <ShiftPlannerView />}

      {activeSubModule === 'shifts' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex items-center gap-3 text-xs text-blue-900 dark:text-blue-200">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <strong className="font-bold">
                {language === 'lo' ? 'ນະໂຍບາຍຕາຕະລາງປະຕິບັດວຽກ:' : 'LHSE Shift Policy:'}
              </strong>{' '}
              {language === 'lo'
                ? 'ກຳນົດເວລາເຮັດວຽກ 8 ຊົ່ວໂມງ/ມື້, 40 ຊົ່ວໂມງ/ອາທິດ ຕາມກົດໝາຍແຮງງານລາວ. ລະບົບບໍ່ມີການຄິດໄລ່ໂອທີ (Strict No-OT Policy).'
                : 'Configured strictly for 8 hours/day (40 hours/week) in adherence to Lao Labor Law. Zero overtime functionality.'}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {shifts.map((sh) => (
              <div
                key={sh.id}
                className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: sh.color }}
                  />
                  {sh.isDefault && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                      Default
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {language === 'lo' ? sh.nameLao : sh.nameEn}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {language === 'lo' ? sh.nameEn : sh.nameLao}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">{language === 'lo' ? 'ເວລາເຮັດວຽກ' : 'Working Hours'}:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{sh.startTime} - {sh.endTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">{language === 'lo' ? 'ພັກຜ່ອນທ່ຽງ' : 'Lunch Break'}:</span>
                    <span className="font-mono text-slate-600 dark:text-slate-400">{sh.breakStart} - {sh.breakEnd}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-1">
                    <span className="text-slate-400">{language === 'lo' ? 'ຊົ່ວໂມງລວມ' : 'Total Duration'}:</span>
                    <span className="font-bold text-emerald-600">8.0 hrs</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubModule === 'holidays' && (
        <DataTable
          data={holidays}
          columns={holidayColumns}
          filename="LHSE_Official_Holidays_2026"
        />
      )}

      {activeSubModule === 'working-days' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 lg:p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
            {language === 'lo' ? 'ການກຳນົດວັນເຮັດວຽກມາດຕະຖານ' : 'Standard Working Days Configuration'}
          </h3>
          <div className="grid grid-cols-7 gap-2">
            {[
              { day: 'Mon', lao: 'ຈັນ', active: true },
              { day: 'Tue', lao: 'ອັງຄານ', active: true },
              { day: 'Wed', lao: 'ພຸດ', active: true },
              { day: 'Thu', lao: 'ພະຫັດ', active: true },
              { day: 'Fri', lao: 'ສຸກ', active: true },
              { day: 'Sat', lao: 'ເສົາ', active: false },
              { day: 'Sun', lao: 'ອາທິດ', active: false },
            ].map((d, i) => (
              <div
                key={i}
                className={`p-4 rounded-2xl border text-center space-y-1 ${
                  d.active
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-400'
                }`}
              >
                <span className="text-xs font-bold block">{language === 'lo' ? d.lao : d.day}</span>
                <span className="text-[10px] font-semibold block">{d.active ? '8 hrs' : 'Off'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
