import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { DataTable, Column } from '../components/common/DataTable.tsx';
import { Modal } from '../components/common/Modal.tsx';
import { AttendanceRecord, AttendanceCorrectionRequest } from '../types/index.ts';
import { alerts } from '../utils/alerts.ts';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Fingerprint,
  Calendar,
  Wifi,
  Plus,
  MapPin,
  Navigation,
  Radio,
  Camera,
  Smartphone,
  Crosshair,
  Compass,
  ShieldCheck,
  TrendingUp,
  Upload,
} from 'lucide-react';
import { AttendanceCalendarHeatmap } from '../components/attendance/AttendanceCalendarHeatmap.tsx';
import { AttendanceSixMonthTrendChart } from '../components/attendance/AttendanceSixMonthTrendChart.tsx';
import { BiometricAttendanceImportModal } from '../components/attendance/BiometricAttendanceImportModal.tsx';
import { useFormAutoSave } from '../hooks/useFormAutoSave.ts';
import { FormAutoSaveIndicator } from '../components/common/FormAutoSaveIndicator.tsx';

export const AttendanceModule: React.FC = () => {
  const {
    t,
    language,
    employees,
    attendanceRecords,
    activeSubModule,
    setActiveSubModule,
    punchInOut,
    currentUser,
    setAttendanceRecords,
    addAuditLog,
  } = useApp();

  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
  const [biometricImportModalOpen, setBiometricImportModalOpen] = useState(false);
  const [correctionDate, setCorrectionDate] = useState(new Date().toISOString().split('T')[0]);
  const [requestedIn, setRequestedIn] = useState('08:00');
  const [requestedOut, setRequestedOut] = useState('17:00');
  const [correctionReason, setCorrectionReason] = useState('');

  // Baseline initial state for attendance correction draft
  const initialCorrectionDraft = {
    correctionDate: new Date().toISOString().split('T')[0],
    requestedIn: '08:00',
    requestedOut: '17:00',
    correctionReason: '',
  };

  const correctionAutoSave = useFormAutoSave({
    formId: 'attendance_correction_draft',
    formData: { correctionDate, requestedIn, requestedOut, correctionReason },
    setFormData: (val: any) => {
      const data = typeof val === 'function' ? val({ correctionDate, requestedIn, requestedOut, correctionReason }) : val;
      if (data.correctionDate) setCorrectionDate(data.correctionDate);
      if (data.requestedIn) setRequestedIn(data.requestedIn);
      if (data.requestedOut) setRequestedOut(data.requestedOut);
      if (data.correctionReason !== undefined) setCorrectionReason(data.correctionReason);
    },
    initialData: initialCorrectionDraft,
    isOpen: correctionModalOpen,
  });

  // LHSE Enterprise GPS Geofencing State
  const [selectedLocation, setSelectedLocation] = useState<'HQ' | 'FIELD' | 'OFFSITE'>('HQ');
  const [selfieEnabled, setSelfieEnabled] = useState(true);

  const locationPresets = {
    HQ: {
      name: 'LHSE Vientiane Head Office (ສຳນັກງານໃຫຍ່ ວຽງຈັນ)',
      officeLat: 17.9757,
      officeLng: 102.6331,
      userLat: 17.9755,
      userLng: 102.6329,
      distanceMeters: 28,
      inRange: true,
      radius: 200,
    },
    FIELD: {
      name: 'LHSE Nam Theun 2 Khammouane Field Office (ຫ້ອງການພາກສະໜາມ ນ້ຳເທີນ 2)',
      officeLat: 17.7951,
      officeLng: 105.0125,
      userLat: 17.7953,
      userLng: 105.0122,
      distanceMeters: 36,
      inRange: true,
      radius: 300,
    },
    OFFSITE: {
      name: 'Simulated Remote / Outside Geofence (ນອກເຂດກຳນົດ)',
      officeLat: 17.9757,
      officeLng: 102.6331,
      userLat: 18.0210,
      userLng: 102.6840,
      distanceMeters: 6850,
      inRange: false,
      radius: 200,
    },
  };

  const activePreset = locationPresets[selectedLocation];

  const handleGPSPunch = (type: 'IN' | 'OUT') => {
    if (!activePreset.inRange) {
      alerts.error(
        language === 'lo' ? 'ຢູ່ນອກເຂດກຳນົດ GPS' : 'Outside Geofenced Zone',
        language === 'lo'
          ? `ທ່ານຢູ່ຫ່າງຈາກສະຖານທີ່ເຮັດວຽກ ${(activePreset.distanceMeters / 1000).toFixed(1)} ກິໂລແມັດ (ກຳນົດບໍ່ເກີນ ${activePreset.radius} ແມັດ). ລະບົບບໍ່ອະນຸຍາດໃຫ້ລົງເວລາ!`
          : `You are ${(activePreset.distanceMeters / 1000).toFixed(1)}km away from the workplace (maximum allowed radius: ${activePreset.radius}m). Geofenced punch rejected!`
      );
      addAuditLog(
        'ATTENDANCE_GEOFENCE_VIOLATION',
        'SYSTEM',
        'Attendance Management',
        `Attempted GPS ${type} rejected: Outside Geofence by ${activePreset.distanceMeters}m (${currentUser.fullName})`,
        {
          entityType: 'ATTENDANCE_RECORD',
          entityName: `${currentUser.fullName} (GPS Violation)`,
          status: 'FAILURE',
        }
      );
      return;
    }

    const nowTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const empId = currentUser.employeeId || 'emp-001';

    if (type === 'IN') {
      const existing = attendanceRecords.find((r) => r.employeeId === empId && r.date === todayStr);
      if (existing?.checkIn) {
        alerts.info(
          language === 'lo' ? 'ທ່ານໄດ້ລົງເວລາເຂົ້າແລ້ວ' : 'Already Checked In',
          `${language === 'lo' ? 'ເວລາເຂົ້າ' : 'Time'}: ${existing.checkIn}`
        );
        return;
      }
      const newRec: AttendanceRecord = {
        id: `att-gps-${Date.now()}`,
        employeeId: empId,
        date: todayStr,
        checkIn: nowTime,
        status: 'PRESENT',
        durationMinutes: 480,
        source: 'MOBILE_GPS',
        notes: `GPS Clock-In at ${activePreset.name} (Coords: ${activePreset.userLat}, ${activePreset.userLng})`,
      };
      setAttendanceRecords((prev) => [newRec, ...prev.filter((r) => !(r.employeeId === empId && r.date === todayStr))]);
      addAuditLog(
        'ATTENDANCE_CHECKIN_GPS',
        'CREATE',
        'Attendance Management',
        `GPS Verified Check-in at ${nowTime} from ${activePreset.name} (${activePreset.userLat}, ${activePreset.userLng})`,
        {
          entityType: 'ATTENDANCE_RECORD',
          entityName: `${currentUser.fullName} (GPS Punch)`,
          recordId: newRec.id,
        }
      );
      alerts.success(
        language === 'lo' ? 'ລົງເວລາເຂົ້າຜ່ານ GPS ສຳເລັດ' : 'GPS Check-In Verified',
        `${language === 'lo' ? 'ສະຖານທີ່' : 'Location'}: ${activePreset.name} • ${nowTime}`
      );
    } else {
      const existing = attendanceRecords.find((r) => r.employeeId === empId && r.date === todayStr);
      if (!existing) {
        alerts.warning(
          language === 'lo' ? 'ຍັງບໍ່ທັນໄດ້ລົງເວລາເຂົ້າ' : 'No Check-In Recorded',
          language === 'lo' ? 'ກະລຸນາລົງເວລາເຂົ້າກ່ອນລົງເວລາອອກ' : 'Please check in first.'
        );
        return;
      }
      setAttendanceRecords((prev) =>
        prev.map((r) =>
          r.id === existing.id
            ? { ...r, checkOut: nowTime, durationMinutes: 480, notes: `${r.notes || ''} | GPS Clock-Out at ${nowTime}` }
            : r
        )
      );
      addAuditLog(
        'ATTENDANCE_CHECKOUT_GPS',
        'UPDATE',
        'Attendance Management',
        `GPS Verified Check-out at ${nowTime} from ${activePreset.name}`,
        {
          entityType: 'ATTENDANCE_RECORD',
          entityName: `${currentUser.fullName} (GPS Checkout)`,
          recordId: existing.id,
        }
      );
      alerts.success(
        language === 'lo' ? 'ລົງເວລາອອກຜ່ານ GPS ສຳເລັດ' : 'GPS Check-Out Verified',
        `${language === 'lo' ? 'ສະຖານທີ່' : 'Location'}: ${activePreset.name} • ${nowTime}`
      );
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const myEmpId = currentUser.employeeId || 'emp-001';
  const myTodayRecord = attendanceRecords.find((r) => r.employeeId === myEmpId && r.date === todayStr);

  const handleSaveCorrection = () => {
    if (!correctionReason.trim()) {
      alerts.error(
        language === 'lo' ? 'ກະລຸນາໃສ່ເຫດຜົນ' : 'Missing Reason',
        language === 'lo' ? 'ກະລຸນາບອກເຫດຜົນທີ່ຕ້ອງການແກ້ໄຂເວລາ' : 'Please provide reason for correction.'
      );
      return;
    }

    const newRec: AttendanceRecord = {
      id: `att-corr-${Date.now()}`,
      employeeId: myEmpId,
      date: correctionDate,
      checkIn: requestedIn,
      checkOut: requestedOut,
      status: 'PRESENT',
      durationMinutes: 480,
      source: 'MANUAL',
      notes: `Corrected: ${correctionReason}`,
    };
    setAttendanceRecords((prev) => [newRec, ...prev.filter((r) => !(r.employeeId === myEmpId && r.date === correctionDate))]);

    addAuditLog(
      'ATTENDANCE_CORRECTION',
      'UPDATE',
      'Attendance Management',
      `Submitted correction for ${correctionDate}: ${correctionReason}`,
      {
        entityType: 'ATTENDANCE_RECORD',
        recordId: newRec.id,
      }
    );

    alerts.success(
      language === 'lo' ? 'ສົ່ງຄຳຮ້ອງແກ້ໄຂເວລາສຳເລັດ' : 'Correction Request Submitted',
      language === 'lo' ? 'ຂໍ້ມູນໄດ້ຖືກບັນທຶກ ແລະ ລໍຖ້າການຢັ້ງຢືນ' : 'Attendance record adjusted.'
    );
    correctionAutoSave.clearDraft();
    setCorrectionModalOpen(false);
  };

  const columns: Column<AttendanceRecord>[] = [
    { key: 'date', header: t('date') },
    {
      key: 'employeeId',
      header: t('employee'),
      render: (r) => {
        const emp = employees.find((e) => e.id === r.employeeId);
        return (
          <div>
            <div className="font-bold text-slate-900 dark:text-slate-100">
              {emp ? (language === 'lo' ? `${emp.firstNameLao} ${emp.lastNameLao}` : `${emp.firstNameEn} ${emp.lastNameEn}`) : r.employeeId}
            </div>
            <div className="text-[11px] text-slate-400 font-mono">{emp?.employeeCode}</div>
          </div>
        );
      },
    },
    {
      key: 'checkIn',
      header: language === 'lo' ? 'ເວລາເຂົ້າ (In)' : 'Check In',
      render: (r) => (
        <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
          {r.checkIn || '--:--'}
        </span>
      ),
    },
    {
      key: 'checkOut',
      header: language === 'lo' ? 'ເວລາອອກ (Out)' : 'Check Out',
      render: (r) => (
        <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
          {r.checkOut || '--:--'}
        </span>
      ),
    },
    {
      key: 'status',
      header: t('status'),
      render: (r) => (
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            r.status === 'PRESENT'
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
              : r.status === 'LATE'
              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
          }`}
        >
          {t(r.status as any)}
        </span>
      ),
    },
    {
      key: 'source',
      header: language === 'lo' ? 'ອຸປະກອນ' : 'Source',
      render: (r) => (
        <span className="text-[11px] text-slate-500 font-medium">
          {r.source.replace('_', ' ')}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Submodule Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubModule('attendance-dashboard')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeSubModule === 'attendance-dashboard' || activeSubModule === 'attendance-heatmap' || activeSubModule === 'overview'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4 text-emerald-400" />
          <span>{language === 'lo' ? 'ແຜນທີ່ຄວາມຮ້ອນ (Calendar Heatmap)' : 'Calendar Heatmap'}</span>
        </button>
        <button
          onClick={() => setActiveSubModule('daily-attendance')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubModule === 'daily-attendance'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          {t('dailyAttendance')}
        </button>
        <button
          onClick={() => setActiveSubModule('gps-tracking')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeSubModule === 'gps-tracking'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <Navigation className="w-4 h-4 text-emerald-500" />
          <span>{language === 'lo' ? 'ລົງເວລາດ້ວຍ GPS (LHSE GPS)' : 'GPS & Geofencing'}</span>
        </button>
        <button
          onClick={() => setActiveSubModule('lateness-report')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeSubModule === 'lateness-report'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span>{t('latenessReport')}</span>
        </button>
        <button
          onClick={() => setActiveSubModule('attendance-trends')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeSubModule === 'attendance-trends'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span>{language === 'lo' ? 'ກຣາຟແນວໂນ້ມ 6 ເດືອນ' : '6-Month Line Chart'}</span>
        </button>
        <button
          onClick={() => setActiveSubModule('attendance-devices')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeSubModule === 'attendance-devices'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <Fingerprint className="w-4 h-4" />
          <span>{t('attendanceDevices')}</span>
        </button>
      </div>

      {/* Quick Punch Terminal Card */}
      <div className="p-6 rounded-3xl bg-linear-to-r from-slate-900 to-blue-950 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="text-xs text-blue-300 font-medium flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>{language === 'lo' ? 'ລະບົບລົງເວລາເຂົ້າ-ອອກວຽກ ປະຈຳວັນ' : 'Daily Biometric Time Clock'}</span>
          </div>
          <h3 className="text-xl font-black">
            {todayStr} • {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
          </h3>
          <p className="text-xs text-slate-300">
            {language === 'lo' ? 'ພະນັກງານ:' : 'Active Staff:'} <strong>{currentUser.fullName}</strong> ({currentUser.employeeId || 'LHSE-001'})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setBiometricImportModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
            title={language === 'lo' ? 'ນຳເຂົ້າຂໍ້ມູນການລົງເວລາຈາກເຄື່ອງສະແກນນີ້ວມື' : 'Import Biometric Fingerprint Scanner Logs'}
          >
            <Upload className="w-4 h-4 text-emerald-100" />
            <span>{language === 'lo' ? 'ນຳເຂົ້າຈາກເຄື່ອງສະແກນ' : 'Import Biometric Scans'}</span>
          </button>
          <button
            onClick={() => punchInOut('IN')}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-transform hover:scale-105 active:scale-95"
          >
            {t('punchIn')} ({myTodayRecord?.checkIn || '--:--'})
          </button>
          <button
            onClick={() => punchInOut('OUT')}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-transform hover:scale-105 active:scale-95"
          >
            {t('punchOut')} ({myTodayRecord?.checkOut || '--:--'})
          </button>
          <button
            onClick={() => setCorrectionModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs border border-white/20 transition-colors"
            title="Request Correction"
          >
            {t('attendanceCorrection')}
          </button>
        </div>
      </div>

      {(activeSubModule === 'attendance-dashboard' ||
        activeSubModule === 'attendance-heatmap' ||
        activeSubModule === 'overview') && (
        <AttendanceCalendarHeatmap />
      )}

      {activeSubModule === 'attendance-trends' && (
        <AttendanceSixMonthTrendChart />
      )}

      {activeSubModule === 'daily-attendance' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>{language === 'lo' ? 'ບັນທຶກການລົງເວລາປະຈຳວັນ (Daily Attendance Records)' : 'Daily Attendance Records & Logs'}</span>
              </h3>
              <p className="text-xs text-slate-500">
                {language === 'lo'
                  ? 'ກວດສອບເວລາເຂົ້າ-ອອກ, ແຫຼ່ງທີ່ມາອຸປະກອນສະແກນນີ້ວມື, ແລະ ສະຖານະການມາເຮັດວຽກ'
                  : 'Track attendance logs across biometric fingerprint scanners, GPS, and terminals'}
              </p>
            </div>
            <button
              onClick={() => setBiometricImportModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs self-start sm:self-auto cursor-pointer"
            >
              <Upload className="w-4 h-4 text-emerald-100" />
              <span>{language === 'lo' ? 'ນຳເຂົ້າຂໍ້ມູນເຄື່ອງສະແກນ' : 'Import Biometric Scans'}</span>
            </button>
          </div>
          <DataTable
            data={attendanceRecords}
            columns={columns}
            filename="LHSE_Attendance_Records"
          />
        </div>
      )}

      {activeSubModule === 'gps-tracking' && (
        <div className="space-y-6">
          {/* Top Geofence Status Banner */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Live GPS Radar & Coords Card */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-900">
                    <Navigation className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <span>{language === 'lo' ? 'ລະບົບລົງເວລາດ້ວຍ GPS & Geofencing' : 'GPS Mobile & Geofence Clock-In'}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-mono">
                        LHSE Spec
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      {language === 'lo'
                        ? 'ກວດສອບພິກັດຕຳແໜ່ງດາວທຽມ (GPS) ຕົວຈິງ ທຽບກັບລັດສະໝີເຂດເຮັດວຽກຂອງ LHSE'
                        : 'Real-time satellite GPS verification against designated LHSE enterprise geofence perimeter.'}
                    </p>
                  </div>
                </div>

                <span
                  className={`px-3 py-1.5 rounded-full text-xs font-bold font-mono flex items-center gap-1.5 ${
                    activePreset.inRange
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800 animate-bounce'
                  }`}
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>{activePreset.inRange ? 'IN GEOFENCE' : 'OUTSIDE GEOFENCE'}</span>
                </span>
              </div>

              {/* Work Location Preset Selector (Simulation tool) */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  {language === 'lo' ? 'ເລືອກຈຳລອງສະຖານທີ່ພິກັດ (Location Preset Simulation):' : 'Select Geofence Simulation Location:'}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => setSelectedLocation('HQ')}
                    className={`p-2.5 rounded-xl text-left text-xs border transition-all ${
                      selectedLocation === 'HQ'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 font-bold shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="truncate">Vientiane HQ</span>
                    </div>
                    <span className="text-[10px] text-emerald-600 block mt-1 font-mono">28m away (In Range)</span>
                  </button>

                  <button
                    onClick={() => setSelectedLocation('FIELD')}
                    className={`p-2.5 rounded-xl text-left text-xs border transition-all ${
                      selectedLocation === 'FIELD'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 font-bold shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span className="truncate">Nam Theun 2 Site</span>
                    </div>
                    <span className="text-[10px] text-emerald-600 block mt-1 font-mono">36m away (In Range)</span>
                  </button>

                  <button
                    onClick={() => setSelectedLocation('OFFSITE')}
                    className={`p-2.5 rounded-xl text-left text-xs border transition-all ${
                      selectedLocation === 'OFFSITE'
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 font-bold shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span className="truncate">Out of Bounds</span>
                    </div>
                    <span className="text-[10px] text-rose-600 block mt-1 font-mono">6.8 km (Rejected)</span>
                  </button>
                </div>
              </div>

              {/* Coordinates & Accuracy Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-sans block">User Lat/Lng</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {activePreset.userLat.toFixed(4)}, {activePreset.userLng.toFixed(4)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-sans block">Distance to Center</span>
                  <span className={`font-bold ${activePreset.inRange ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {activePreset.distanceMeters > 1000 ? (activePreset.distanceMeters / 1000).toFixed(1) + ' km' : activePreset.distanceMeters + ' m'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-sans block">Allowed Radius</span>
                  <span className="font-bold text-blue-600">
                    {activePreset.radius} meters
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-sans block">GPS Accuracy</span>
                  <span className="font-bold text-emerald-600">
                    ±4.2 m (Locked)
                  </span>
                </div>
              </div>

              {/* Action Buttons for GPS Punching */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={() => handleGPSPunch('IN')}
                  className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-md transition-all active:scale-98"
                >
                  <Navigation className="w-4 h-4" />
                  <span>{language === 'lo' ? 'ລົງເວລາເຂົ້າຜ່ານ GPS (Clock In)' : 'Clock In via GPS'}</span>
                </button>
                <button
                  onClick={() => handleGPSPunch('OUT')}
                  className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm shadow-md transition-all active:scale-98"
                >
                  <Clock className="w-4 h-4" />
                  <span>{language === 'lo' ? 'ລົງເວລາອອກຜ່ານ GPS (Clock Out)' : 'Clock Out via GPS'}</span>
                </button>
              </div>
            </div>

            {/* Selfie & Device Verification Preview Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 flex flex-col">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-blue-600" />
                  <h4 className="font-bold text-xs uppercase text-slate-900 dark:text-slate-100">
                    {language === 'lo' ? 'ການຢັ້ງຢືນໃບໜ້າ (Selfie Verification)' : 'Photo / Selfie Verification'}
                  </h4>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-md">
                  Active
                </span>
              </div>

              {/* Simulated Camera Viewport */}
              <div className="relative aspect-4/3 rounded-2xl bg-slate-900 overflow-hidden flex items-center justify-center border border-slate-800">
                <div className="w-28 h-36 rounded-full border-2 border-dashed border-emerald-400/80 flex items-center justify-center animate-pulse">
                  <Smartphone className="w-8 h-8 text-white/50" />
                </div>
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-xs text-[10px] text-white px-2 py-1 rounded-md font-mono">
                  LIVE FEED • 1080p
                </div>
                <div className="absolute bottom-3 left-3 right-3 bg-black/70 backdrop-blur-xs text-[10px] text-white p-2 rounded-xl font-mono leading-tight">
                  <div className="text-emerald-400 font-bold truncate">{currentUser.fullName}</div>
                  <div className="text-[9px] text-slate-300 truncate">
                    GPS: {activePreset.userLat}, {activePreset.userLng}
                  </div>
                  <div className="text-[9px] text-slate-400">{todayStr} • {new Date().toLocaleTimeString()}</div>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{language === 'lo' ? 'ລະບົບປ້ອງກັນການລົງເວລາແທນກັນ (Anti-Spoofing)' : 'Anti-Spoofing AI check active'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <Compass className="w-3.5 h-3.5 text-blue-600" />
                  <span>{language === 'lo' ? 'ພິກັດບັນທຶກລົງຖານຂໍ້ມູນທັນທີ' : 'Precision coordinates logged to database'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Historical GPS Logs */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>{language === 'lo' ? 'ປະຫວັດການລົງເວລາຜ່ານ GPS ຫຼ້າສຸດ' : 'Recent GPS Verified Punches'}</span>
            </h4>
            <DataTable
              data={attendanceRecords.filter((r) => r.source === 'MOBILE_GPS' || r.notes?.includes('GPS'))}
              columns={columns}
              filename="LHSE_GPS_Attendance_Log"
            />
          </div>
        </div>
      )}

      {activeSubModule === 'attendance-devices' && (
        <div className="space-y-6">
          <div className="p-5 rounded-3xl bg-linear-to-r from-blue-900 to-indigo-950 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shrink-0">
                <Fingerprint className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-black text-base">
                  {language === 'lo' ? 'ລະບົບເຄື່ອງສະແກນລາຍນິ້ວມື & ໃບໜ້າ (Biometric Terminals)' : 'Biometric Terminal Network'}
                </h3>
                <p className="text-xs text-blue-200">
                  {language === 'lo'
                    ? 'ເຊື່ອມຕໍ່ກັບເຄື່ອງສະແກນ ZKTeco & FacePass ປະຈຳສຳນັກງານໃຫຍ່ ແລະ ຫ້ອງການພາກສະໜາມ'
                    : 'Online synchronization and USB log file import for ZKTeco SilkBio and FacePass 7 devices'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              <button
                onClick={() => setBiometricImportModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Upload className="w-4 h-4 text-emerald-100" />
                <span>{language === 'lo' ? 'ນຳເຂົ້າໄຟລ໌ Log ຈາກເຄື່ອງ' : 'Import Scanner Log File'}</span>
              </button>
              <button
                onClick={() => alerts.success(language === 'lo' ? 'ທຸກເຄື່ອງຢູ່ໃນສະຖານະອອນລາຍ' : 'All 3 Biometric Terminals are Online')}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-colors"
              >
                <Wifi className="w-4 h-4 text-emerald-400" />
                <span>{language === 'lo' ? 'ກວດສອບທຸກເຄື່ອງ' : 'Ping All Online'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center font-bold">
                <Fingerprint className="w-5 h-5" />
              </span>
              <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                <Wifi className="w-4 h-4" /> Online
              </span>
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">LHSE-SCAN-HQ1</h4>
              <p className="text-xs text-slate-500">Vientiane Head Office Main Lobby</p>
            </div>
            <div className="text-xs font-mono text-slate-600 dark:text-slate-400 space-y-1">
              <div>IP: 192.168.10.201</div>
              <div>Model: ZKTeco SilkBio-101TC</div>
              <div>Last Sync: 2 mins ago</div>
            </div>
            <button
              onClick={() => alerts.success(language === 'lo' ? 'ເຊື່ອມຕໍ່ສຳເລັດ' : 'Device Synchronized')}
              className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white rounded-xl text-xs font-bold transition-colors"
            >
              {language === 'lo' ? 'ກວດສອບການເຊື່ອມຕໍ່' : 'Ping & Sync Now'}
            </button>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center font-bold">
                <Fingerprint className="w-5 h-5" />
              </span>
              <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                <Wifi className="w-4 h-4" /> Online
              </span>
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">LHSE-SCAN-NT2</h4>
              <p className="text-xs text-slate-500">Nam Theun 2 Khammouane Field Office</p>
            </div>
            <div className="text-xs font-mono text-slate-600 dark:text-slate-400 space-y-1">
              <div>IP: 192.168.20.105</div>
              <div>Model: FacePass 7 Pro</div>
              <div>Last Sync: 5 mins ago</div>
            </div>
            <button
              onClick={() => alerts.success(language === 'lo' ? 'ເຊື່ອມຕໍ່ສຳເລັດ' : 'Device Synchronized')}
              className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white rounded-xl text-xs font-bold transition-colors"
            >
              {language === 'lo' ? 'ກວດສອບການເຊື່ອມຕໍ່' : 'Ping & Sync Now'}
            </button>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center font-bold">
                <Fingerprint className="w-5 h-5" />
              </span>
              <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                <Wifi className="w-4 h-4" /> Online
              </span>
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">LHSE-SCAN-HG1</h4>
              <p className="text-xs text-slate-500">Hongsa Power Site Office</p>
            </div>
            <div className="text-xs font-mono text-slate-600 dark:text-slate-400 space-y-1">
              <div>IP: 192.168.30.112</div>
              <div>Model: ZKTeco SilkBio-101TC</div>
              <div>Last Sync: 12 mins ago</div>
            </div>
            <button
              onClick={() => alerts.success(language === 'lo' ? 'ເຊື່ອມຕໍ່ສຳເລັດ' : 'Device Synchronized')}
              className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white rounded-xl text-xs font-bold transition-colors"
            >
              {language === 'lo' ? 'ກວດສອບການເຊື່ອມຕໍ່' : 'Ping & Sync Now'}
            </button>
          </div>
        </div>
      </div>
      )}

      {activeSubModule === 'lateness-report' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <span>{language === 'lo' ? 'ລາຍງານພະນັກງານມາຊ້າ & ຂາດວຽກ' : 'Lateness & Absence Incident Log'}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {language === 'lo'
                  ? 'ກວດສອບບັນຊີລາຍຊື່ການມາຊ້າເກີນ 08:30 ແລະ ການຂາດການເພື່ອດຳເນີນການແຈ້ງເຕືອນ'
                  : 'Detailed breakdown of tardiness and unexcused absences across all operating units'}
              </p>
            </div>
            <button
              onClick={() => setActiveSubModule('attendance-dashboard')}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors self-start sm:self-auto"
            >
              <Calendar className="w-4 h-4" />
              <span>{language === 'lo' ? 'ເບິ່ງແຜນທີ່ຄວາມຮ້ອນ (View Heatmap)' : 'View in Heatmap'}</span>
            </button>
          </div>

          <DataTable
            data={attendanceRecords.filter((r) => r.status === 'LATE' || r.status === 'ABSENT')}
            columns={columns}
            filename="LHSE_Lateness_Absence_Report"
          />
        </div>
      )}

      <Modal
        isOpen={correctionModalOpen}
        onClose={() => setCorrectionModalOpen(false)}
        title={t('attendanceCorrection')}
        subtitle="Submit clock-in or clock-out adjustment for approval"
        maxWidth="md"
        footer={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCorrectionModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleSaveCorrection}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-xs"
            >
              {t('submit')}
            </button>
          </div>
        }
      >
        <div className="space-y-3 text-xs">
          {/* Draft Auto-Save Feedback */}
          <FormAutoSaveIndicator
            isSaving={correctionAutoSave.isSaving}
            lastSaved={correctionAutoSave.lastSaved}
            isRestored={correctionAutoSave.isRestored}
            onDiscard={() => {
              correctionAutoSave.discardDraft();
              setCorrectionDate(initialCorrectionDraft.correctionDate);
              setRequestedIn(initialCorrectionDraft.requestedIn);
              setRequestedOut(initialCorrectionDraft.requestedOut);
              setCorrectionReason('');
            }}
            language={language}
          />

          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">{t('date')}</label>
            <input
              type="date"
              value={correctionDate}
              onChange={(e) => setCorrectionDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">{language === 'lo' ? 'ເວລາເຂົ້າຕົວຈິງ' : 'Actual Check In'}</label>
              <input
                type="time"
                value={requestedIn}
                onChange={(e) => setRequestedIn(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">{language === 'lo' ? 'ເວລາອອກຕົວຈິງ' : 'Actual Check Out'}</label>
              <input
                type="time"
                value={requestedOut}
                onChange={(e) => setRequestedOut(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
              {language === 'lo' ? 'ເຫດຜົນການແກ້ໄຂ *' : 'Reason for Correction *'}
            </label>
            <textarea
              rows={3}
              value={correctionReason}
              onChange={(e) => setCorrectionReason(e.target.value)}
              placeholder="e.g. Scanner power outage at gate, or field visit"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>
        </div>
      </Modal>

      {/* Biometric Fingerprint Scanner Attendance Import Modal */}
      <BiometricAttendanceImportModal
        isOpen={biometricImportModalOpen}
        onClose={() => setBiometricImportModalOpen(false)}
      />
    </div>
  );
};
