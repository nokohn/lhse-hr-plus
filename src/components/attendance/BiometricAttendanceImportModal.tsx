import React, { useState, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { AttendanceRecord } from '../../types/index.ts';
import {
  parseBiometricSpreadsheet,
  downloadBiometricSampleTemplate,
  downloadBiometricCsvTemplate,
  generateMachineScanDemoData,
  BiometricImportRow,
  BiometricImportSummary,
} from '../../services/biometricAttendanceImportService.ts';
import { alerts } from '../../utils/alerts.ts';
import {
  Upload,
  Fingerprint,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  ArrowRight,
  RefreshCw,
  Search,
  Filter,
  Clock,
  Sparkles,
  Database,
  Building2,
  X,
  Calendar,
  Layers,
  HelpCircle,
} from 'lucide-react';

interface BiometricAttendanceImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: (importedCount: number) => void;
}

export const BiometricAttendanceImportModal: React.FC<BiometricAttendanceImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const {
    language,
    employees,
    attendanceRecords,
    setAttendanceRecords,
    addAuditLog,
    currentUser,
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Steps: 1 = File Upload, 2 = Preview & Validation, 3 = Confirmation
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Options
  const [selectedDevice, setSelectedDevice] = useState<string>('LHSE-SCAN-HQ1');
  const [conflictStrategy, setConflictStrategy] = useState<'MERGE' | 'SKIP' | 'OVERWRITE'>('MERGE');

  // Parsed summary state
  const [parsedSummary, setParsedSummary] = useState<BiometricImportSummary | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Preview filtering & search
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'READY' | 'LATE' | 'DUPLICATE' | 'WARNING'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Committed stats
  const [commitReport, setCommitReport] = useState<{
    newAdded: number;
    updated: number;
    skipped: number;
    total: number;
  } | null>(null);

  if (!isOpen) return null;

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const processSelectedFile = (file: File) => {
    setIsProcessing(true);
    const reader = new FileReader();

    const isTextLog = file.name.endsWith('.dat') || file.name.endsWith('.txt');

    if (isTextLog) {
      reader.readAsText(file, 'utf-8');
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const summary = parseBiometricSpreadsheet(
            content,
            file.name,
            employees,
            attendanceRecords,
            selectedDevice
          );
          setParsedSummary(summary);
          setStep(2);
        } catch (err: any) {
          alerts.error(
            language === 'lo' ? 'ບໍ່ສາມາດອ່ານໄຟລ໌ໄດ້' : 'Failed to parse file',
            err?.message || 'File format error'
          );
        } finally {
          setIsProcessing(false);
        }
      };
    } else {
      reader.readAsArrayBuffer(file);
      reader.onload = (e) => {
        try {
          const buffer = e.target?.result as ArrayBuffer;
          const summary = parseBiometricSpreadsheet(
            buffer,
            file.name,
            employees,
            attendanceRecords,
            selectedDevice
          );
          setParsedSummary(summary);
          setStep(2);
        } catch (err: any) {
          alerts.error(
            language === 'lo' ? 'ບໍ່ສາມາດອ່ານໄຟລ໌ Excel/CSV ໄດ້' : 'Failed to parse spreadsheet',
            err?.message || 'Spreadsheet format error'
          );
        } finally {
          setIsProcessing(false);
        }
      };
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  // 1-Click Load Simulator / Demo Scanner Data
  const handleLoadDemoScannerData = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const today = new Date().toISOString().split('T')[0];
      const rows = generateMachineScanDemoData(employees, today);
      setParsedSummary({
        fileName: 'LHSE_ZKTeco_HQ1_Log.dat',
        totalRows: rows.length,
        validCount: rows.length,
        matchedEmployeesCount: rows.filter((r) => r.matchedEmployee).length,
        unmatchedCount: 0,
        duplicateCount: 0,
        latePunchesCount: rows.filter((r) => r.calculatedStatus === 'LATE').length,
        onTimePunchesCount: rows.filter((r) => r.calculatedStatus === 'PRESENT').length,
        rows,
      });
      setIsProcessing(false);
      setStep(2);
      alerts.success(
        language === 'lo' ? 'ໂຫຼດຂໍ້ມູນເຄື່ອງສະແກນນີ້ວມືສຳເລັດ' : 'Loaded Biometric Machine Logs',
        language === 'lo'
          ? `ພົບຂໍ້ມູນການລົງເວລາ ${rows.length} ລາຍການ`
          : `Loaded ${rows.length} test records from LHSE-SCAN-HQ1 & NT2.`
      );
    }, 400);
  };

  // Filtered preview rows
  const filteredRows = useMemo(() => {
    if (!parsedSummary) return [];
    return parsedSummary.rows.filter((row) => {
      // 1. Status Filter
      if (filterStatus === 'READY' && row.validationStatus !== 'READY') return false;
      if (filterStatus === 'LATE' && row.calculatedStatus !== 'LATE') return false;
      if (filterStatus === 'DUPLICATE' && !row.isExistingRecord) return false;
      if (filterStatus === 'WARNING' && row.validationStatus !== 'WARNING') return false;

      // 2. Search
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const match =
          row.rawCode.toLowerCase().includes(term) ||
          row.employeeNameLao.toLowerCase().includes(term) ||
          row.employeeNameEn.toLowerCase().includes(term) ||
          row.date.includes(term) ||
          row.deviceCode.toLowerCase().includes(term);
        if (!match) return false;
      }
      return true;
    });
  }, [parsedSummary, filterStatus, searchTerm]);

  // Commit valid rows to attendanceRecords
  const handleCommitImport = () => {
    if (!parsedSummary || parsedSummary.rows.length === 0) return;

    let newCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    setAttendanceRecords((prev) => {
      let workingList = [...prev];

      parsedSummary.rows.forEach((row) => {
        if (!row.matchedEmployee) return;

        const empId = row.matchedEmployee.id;
        const existingIdx = workingList.findIndex(
          (r) => r.employeeId === empId && r.date === row.date
        );

        if (existingIdx >= 0) {
          if (conflictStrategy === 'SKIP') {
            skippedCount++;
            return;
          }
          // Merge or Overwrite
          updatedCount++;
          const existing = workingList[existingIdx];
          workingList[existingIdx] = {
            ...existing,
            checkIn: row.checkIn || existing.checkIn,
            checkOut: row.checkOut !== '--:--' ? row.checkOut : existing.checkOut,
            durationMinutes: row.durationMinutes > 0 ? row.durationMinutes : existing.durationMinutes,
            status: row.calculatedStatus,
            source: 'BIOMETRIC_SCANNER',
            notes: `Updated from Biometric Scanner (${row.deviceCode})`,
          };
        } else {
          // Add new record
          newCount++;
          const newRec: AttendanceRecord = {
            id: `att-bio-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            employeeId: empId,
            date: row.date,
            checkIn: row.checkIn,
            checkOut: row.checkOut !== '--:--' ? row.checkOut : undefined,
            status: row.calculatedStatus,
            durationMinutes: row.durationMinutes,
            source: 'BIOMETRIC_SCANNER',
            notes: `Imported from Biometric Machine (${row.deviceCode})`,
          };
          workingList.unshift(newRec);
        }
      });

      return workingList;
    });

    const totalCommitted = newCount + updatedCount;

    // Log to System Audit Trail
    addAuditLog(
      'ATTENDANCE_BIOMETRIC_IMPORT',
      'CREATE',
      'Attendance Management',
      `Imported ${totalCommitted} biometric time punches (${newCount} new, ${updatedCount} updated, ${skippedCount} skipped) from file '${parsedSummary.fileName}' (${selectedDevice})`,
      {
        entityType: 'ATTENDANCE_BATCH',
        entityName: parsedSummary.fileName,
        recordId: `batch-att-${Date.now()}`,
        changes: [
          { field: 'sourceFile', newValue: parsedSummary.fileName },
          { field: 'deviceCode', newValue: selectedDevice },
          { field: 'newRecords', newValue: newCount },
          { field: 'updatedRecords', newValue: updatedCount },
          { field: 'conflictStrategy', newValue: conflictStrategy },
        ],
      }
    );

    setCommitReport({
      newAdded: newCount,
      updated: updatedCount,
      skipped: skippedCount,
      total: totalCommitted,
    });

    setStep(3);

    if (onImportComplete) {
      onImportComplete(totalCommitted);
    }

    alerts.success(
      language === 'lo' ? 'ນຳເຂົ້າຂໍ້ມູນການລົງເວລາສຳເລັດ!' : 'Biometric Attendance Imported!',
      language === 'lo'
        ? `ບັນທຶກສຳເລັດ ${totalCommitted} ລາຍການ (${newCount} ໃໝ່, ${updatedCount} ອັບເດດ)`
        : `Successfully committed ${totalCommitted} attendance records.`
    );
  };

  const resetImport = () => {
    setParsedSummary(null);
    setCommitReport(null);
    setStep(1);
    setFilterStatus('ALL');
    setSearchTerm('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header Bar */}
        <div className="p-5 sm:px-7 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800">
              <Fingerprint className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-slate-100">
                  {language === 'lo'
                    ? 'ນຳເຂົ້າຂໍ້ມູນການລົງເວລາ ຈາກເຄື່ອງສະແກນນີ້ວມື'
                    : 'Import Attendance from Biometric Scanner'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                  ZKTeco / Anviz / Excel
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === 'lo'
                  ? 'ຮອງຮັບໄຟລ໌ Excel (.xlsx), CSV, ແລະ ໄຟລ໌ບັນທຶກຈາກເຄື່ອງສະແກນນີ້ວມື (.dat, .txt)'
                  : 'Import employee check-in and check-out logs with automatic employee matching and lateness checks'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-7 overflow-y-auto flex-1 space-y-6 text-xs">
          {/* STEP 1: UPLOAD / SELECTION */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Device and Mode Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>{language === 'lo' ? 'ເລືອກເຄື່ອງສະແກນຕົ້ນທາງ' : 'Select Target Scanner Terminal'}</span>
                  </label>
                  <select
                    value={selectedDevice}
                    onChange={(e) => setSelectedDevice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
                  >
                    <option value="LHSE-SCAN-HQ1">LHSE-SCAN-HQ1 (Vientiane Head Office Main Lobby)</option>
                    <option value="LHSE-SCAN-NT2">LHSE-SCAN-NT2 (Nam Theun 2 Khammouane Field Office)</option>
                    <option value="LHSE-SCAN-HG1">LHSE-SCAN-HG1 (Hongsa Power Site Office)</option>
                    <option value="AUTO_DETECT">{language === 'lo' ? 'ກວດຫາອັດຕະໂນມັດຈາກໄຟລ໌' : 'Auto-detect from file'}</option>
                  </select>
                  <p className="text-[11px] text-slate-400">
                    {language === 'lo' ? 'ລະບຸລະຫັດອຸປະກອນເພື່ອບັນທຶກແຫຼ່ງທີ່ມາ' : 'Terminal identifier tagged to imported records.'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-amber-500" />
                    <span>{language === 'lo' ? 'ການຈັດການຂໍ້ມູນຊ້ຳຊ້ອນ' : 'Duplicate Handling Strategy'}</span>
                  </label>
                  <select
                    value={conflictStrategy}
                    onChange={(e) => setConflictStrategy(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
                  >
                    <option value="MERGE">
                      {language === 'lo' ? 'ອັບເດດ/ລວມຂໍ້ມູນທີ່ມີຢູ່ແລ້ວ (Merge/Update existing)' : 'Merge & Update existing day punches'}
                    </option>
                    <option value="SKIP">
                      {language === 'lo' ? 'ຂ້າມຂໍ້ມູນທີ່ມີຢູ່ແລ້ວ (Skip duplicates)' : 'Skip records already logged'}
                    </option>
                    <option value="OVERWRITE">
                      {language === 'lo' ? 'ຂຽນທັບຂໍ້ມູນເກົ່າທັງໝົດ (Overwrite all)' : 'Overwrite all existing punches'}
                    </option>
                  </select>
                  <p className="text-[11px] text-slate-400">
                    {language === 'lo'
                      ? 'ກໍລະນີມີບັນທຶກວັນດຽວກັນ ລະບົບຈະອັບເດດເວລາເຂົ້າ-ອອກໃຫ້ສົມບູນ'
                      : 'Ensures existing records are safely reconciled without data loss.'}
                  </p>
                </div>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 sm:p-10 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3 ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 scale-[1.01]'
                    : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 bg-slate-50/40 dark:bg-slate-800/20'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".xlsx, .xls, .csv, .dat, .txt"
                  className="hidden"
                />

                <div className="w-16 h-16 rounded-3xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-inner">
                  {isProcessing ? (
                    <RefreshCw className="w-8 h-8 animate-spin" />
                  ) : (
                    <Upload className="w-8 h-8" />
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                    {language === 'lo'
                      ? 'ກົດເລືອກໄຟລ໌ ຫຼື ລາກໄຟລ໌ມາໃສ່ບ່ອນນີ້'
                      : 'Click to select or drag & drop attendance file here'}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    {language === 'lo'
                      ? 'ຮອງຮັບໄຟລ໌ .xlsx, .xls, .csv, .dat (ZKTeco attlog.dat), .txt'
                      : 'Supports Excel (.xlsx, .xls), CSV, and machine text logs (.dat, .txt)'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-mono text-[10px] font-bold">
                    Excel (.xlsx / .xls)
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-mono text-[10px] font-bold">
                    CSV (.csv)
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 font-mono text-[10px] font-bold">
                    ZKTeco (.dat / .txt)
                  </span>
                </div>
              </div>

              {/* Template Downloads & 1-Click Simulator Demo */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-medium">
                    {language === 'lo' ? 'ຟອມຕົວຢ່າງ:' : 'Sample templates:'}
                  </span>
                  <button
                    type="button"
                    onClick={() => downloadBiometricSampleTemplate(employees)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold transition-colors shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Excel Template</span>
                  </button>
                  <button
                    type="button"
                    onClick={downloadBiometricCsvTemplate}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold transition-colors shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-600" />
                    <span>CSV Template</span>
                  </button>
                </div>

                {/* 1-Click Test Button */}
                <button
                  type="button"
                  onClick={handleLoadDemoScannerData}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold transition-all shadow-md active:scale-98"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>
                    {language === 'lo'
                      ? 'ໂຫຼດຂໍ້ມູນຈຳລອງຈາກເຄື່ອງສະແກນ'
                      : 'Load Scanner Device Logs'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: PREVIEW & VALIDATION */}
          {step === 2 && parsedSummary && (
            <div className="space-y-5">
              {/* Summary Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 text-xs">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    {language === 'lo' ? 'ທັງໝົດ' : 'Total Punches'}
                  </span>
                  <span className="text-xl font-black font-mono text-slate-800 dark:text-slate-200">
                    {parsedSummary.totalRows}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
                    {parsedSummary.fileName}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/50 text-xs">
                  <span className="text-[10px] text-emerald-600 font-bold uppercase block">
                    {language === 'lo' ? 'ພົບພະນັກງານ' : 'Matched'}
                  </span>
                  <span className="text-xl font-black font-mono text-emerald-700 dark:text-emerald-400">
                    {parsedSummary.matchedEmployeesCount}
                  </span>
                  <span className="text-[10px] text-emerald-600/80 block mt-0.5">
                    {language === 'lo' ? 'ຂໍ້ມູນຖືກຕ້ອງ' : 'Valid employees'}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-800/50 text-xs">
                  <span className="text-[10px] text-blue-600 font-bold uppercase block">
                    {language === 'lo' ? 'ທັນເວລາ (On-Time)' : 'On-Time'}
                  </span>
                  <span className="text-xl font-black font-mono text-blue-700 dark:text-blue-400">
                    {parsedSummary.onTimePunchesCount}
                  </span>
                  <span className="text-[10px] text-blue-600/80 block mt-0.5">
                    &le; 08:30 (LHSE Grace)
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/50 text-xs">
                  <span className="text-[10px] text-amber-600 font-bold uppercase block">
                    {language === 'lo' ? 'ມາຊ້າ (Late)' : 'Late Punches'}
                  </span>
                  <span className="text-xl font-black font-mono text-amber-700 dark:text-amber-400">
                    {parsedSummary.latePunchesCount}
                  </span>
                  <span className="text-[10px] text-amber-600/80 block mt-0.5">
                    &gt; 08:30 (Tardy)
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200/70 dark:border-purple-800/50 text-xs col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-purple-600 font-bold uppercase block">
                    {language === 'lo' ? 'ບັນທຶກຊ້ຳ' : 'Duplicates'}
                  </span>
                  <span className="text-xl font-black font-mono text-purple-700 dark:text-purple-400">
                    {parsedSummary.duplicateCount}
                  </span>
                  <span className="text-[10px] text-purple-600/80 block mt-0.5">
                    {conflictStrategy} mode
                  </span>
                </div>
              </div>

              {/* Filter and Search Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  <button
                    onClick={() => setFilterStatus('ALL')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs ${
                      filterStatus === 'ALL'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {language === 'lo' ? 'ທັງໝົດ' : 'All'} ({parsedSummary.rows.length})
                  </button>
                  <button
                    onClick={() => setFilterStatus('READY')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs ${
                      filterStatus === 'READY'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {language === 'lo' ? 'ພ້ອມນຳເຂົ້າ' : 'Ready'}
                  </button>
                  <button
                    onClick={() => setFilterStatus('LATE')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs ${
                      filterStatus === 'LATE'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {language === 'lo' ? 'ມາຊ້າ' : 'Late'} ({parsedSummary.latePunchesCount})
                  </button>
                  {parsedSummary.duplicateCount > 0 && (
                    <button
                      onClick={() => setFilterStatus('DUPLICATE')}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs ${
                        filterStatus === 'DUPLICATE'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      {language === 'lo' ? 'ຊ້ຳຊ້ອນ' : 'Existing'} ({parsedSummary.duplicateCount})
                    </button>
                  )}
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={language === 'lo' ? 'ຄົ້ນຫາ ລະຫັດ, ຊື່, ວັນທີ...' : 'Search code, name, date...'}
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Data Table Preview */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto max-h-[380px]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider z-10">
                      <tr>
                        <th className="p-3 pl-4">#</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Employee</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Check In</th>
                        <th className="p-3">Check Out</th>
                        <th className="p-3">Duration</th>
                        <th className="p-3">Work Hours Status</th>
                        <th className="p-3 pr-4">Terminal Device</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredRows.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="p-8 text-center text-slate-400">
                            {language === 'lo' ? 'ບໍ່ພົບລາຍການທີ່ຕົງກັບເງື່ອນໄຂ' : 'No records match filter criteria'}
                          </td>
                        </tr>
                      ) : (
                        filteredRows.map((row) => {
                          const isUnmatched = row.validationStatus === 'UNMATCHED';
                          const isLate = row.calculatedStatus === 'LATE';

                          return (
                            <tr
                              key={row.rowNumber}
                              className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                                isUnmatched ? 'bg-rose-50/30 dark:bg-rose-950/20' : ''
                              }`}
                            >
                              <td className="p-3 pl-4 font-mono text-slate-400 text-[11px]">
                                {row.rowNumber}
                              </td>

                              <td className="p-3 whitespace-nowrap">
                                {row.validationStatus === 'READY' && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                    <CheckCircle2 className="w-2.5 h-2.5" />
                                    <span>Ready</span>
                                  </span>
                                )}
                                {row.validationStatus === 'DUPLICATE' && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                                    <RefreshCw className="w-2.5 h-2.5" />
                                    <span>Update</span>
                                  </span>
                                )}
                                {row.validationStatus === 'WARNING' && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                    <AlertTriangle className="w-2.5 h-2.5" />
                                    <span>Missing Out</span>
                                  </span>
                                )}
                                {row.validationStatus === 'UNMATCHED' && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                                    <XCircle className="w-2.5 h-2.5" />
                                    <span>Unmatched</span>
                                  </span>
                                )}
                              </td>

                              <td className="p-3">
                                {row.matchedEmployee ? (
                                  <div>
                                    <div className="font-bold text-slate-900 dark:text-slate-100">
                                      {language === 'lo' ? row.employeeNameLao : row.employeeNameEn}
                                    </div>
                                    <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                                      {row.matchedEmployee.employeeCode}
                                    </span>
                                  </div>
                                ) : (
                                  <div>
                                    <span className="font-mono font-bold text-rose-600">
                                      {row.rawCode}
                                    </span>
                                    <span className="text-[10px] text-rose-400 block">Unknown ID</span>
                                  </div>
                                )}
                              </td>

                              <td className="p-3 whitespace-nowrap font-mono">
                                {row.date}
                              </td>

                              <td className="p-3 whitespace-nowrap font-mono font-bold">
                                <span className={isLate ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}>
                                  {row.checkIn}
                                </span>
                              </td>

                              <td className="p-3 whitespace-nowrap font-mono text-slate-600 dark:text-slate-300">
                                {row.checkOut}
                              </td>

                              <td className="p-3 whitespace-nowrap font-mono text-[11px] text-slate-500">
                                {row.durationMinutes > 0
                                  ? `${Math.floor(row.durationMinutes / 60)}h ${row.durationMinutes % 60}m`
                                  : '-'}
                              </td>

                              <td className="p-3 whitespace-nowrap">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    isLate
                                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  }`}
                                >
                                  {isLate
                                    ? language === 'lo' ? 'ມາຊ້າ (>08:30)' : 'LATE (>08:30)'
                                    : language === 'lo' ? 'ມາທັນເວລາ' : 'PRESENT'}
                                </span>
                              </td>

                              <td className="p-3 pr-4 whitespace-nowrap font-mono text-slate-500 text-[11px]">
                                {row.deviceCode}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
                >
                  {language === 'lo' ? 'ຍ້ອນກັບ' : 'Back to Upload'}
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-xs text-slate-500 hidden sm:inline">
                    {language === 'lo' ? 'ພ້ອມນຳເຂົ້າ:' : 'Ready to commit:'}{' '}
                    <b className="text-emerald-600 font-mono">{parsedSummary.validCount}</b>{' '}
                    {language === 'lo' ? 'ລາຍການ' : 'records'}
                  </span>
                  <button
                    type="button"
                    onClick={handleCommitImport}
                    disabled={parsedSummary.validCount === 0}
                    className="w-full sm:w-auto flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all active:scale-98"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {language === 'lo'
                        ? `ຢືນຢັນນຳເຂົ້າ ${parsedSummary.validCount} ລາຍການ`
                        : `Commit & Import ${parsedSummary.validCount} Records`}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: CONFIRMATION REPORT */}
          {step === 3 && commitReport && (
            <div className="py-6 text-center space-y-5">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1.5">
                <h4 className="text-lg font-black text-slate-900 dark:text-slate-100">
                  {language === 'lo'
                    ? 'ນຳເຂົ້າຂໍ້ມູນການລົງເວລາສຳເລັດສົມບູນ!'
                    : 'Biometric Attendance Imported Successfully!'}
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {language === 'lo'
                    ? `ຂໍ້ມູນການສະແກນນີ້ວມືໄດ້ຖືກບັນທຶກລົງສູ່ລະບົບ LHSE Attendance Database ແລະ ອັບເດດແຜນທີ່ຄວາມຮ້ອນ (Calendar Heatmap) ຮຽບຮ້ອຍແລ້ວ.`
                    : 'The biometric logs have been verified and synchronized with the LHSE Attendance database and Calendar Heatmap.'}
                </p>
              </div>

              {/* Metrics Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto pt-2">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    {language === 'lo' ? 'ລວມທັງໝົດ' : 'Total Committed'}
                  </span>
                  <span className="text-lg font-black font-mono text-slate-900 dark:text-slate-100">
                    {commitReport.total}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                  <span className="text-[10px] text-emerald-600 uppercase font-bold block">
                    {language === 'lo' ? 'ເພີ່ມໃໝ່' : 'New Punches'}
                  </span>
                  <span className="text-lg font-black font-mono text-emerald-700 dark:text-emerald-400">
                    {commitReport.newAdded}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
                  <span className="text-[10px] text-blue-600 uppercase font-bold block">
                    {language === 'lo' ? 'ອັບເດດແທນທີ່' : 'Merged/Updated'}
                  </span>
                  <span className="text-lg font-black font-mono text-blue-700 dark:text-blue-400">
                    {commitReport.updated}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800">
                  <span className="text-[10px] text-purple-600 uppercase font-bold block">
                    {language === 'lo' ? 'ຂ້າມຊ້ຳຊ້ອນ' : 'Skipped'}
                  </span>
                  <span className="text-lg font-black font-mono text-purple-700 dark:text-purple-400">
                    {commitReport.skipped}
                  </span>
                </div>
              </div>

              {/* Finish Actions */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={resetImport}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
                >
                  {language === 'lo' ? 'ນຳເຂົ້າໄຟລ໌ອື່ນຕື່ມ' : 'Import Another File'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-colors"
                >
                  {language === 'lo' ? 'ປິດໜ້າຕ່າງ & ເບິ່ງລາຍການລົງເວລາ' : 'Close & View Attendance Records'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
