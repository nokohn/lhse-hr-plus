import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { Modal } from '../common/Modal.tsx';
import { Employee, ValidatedImportRow, ImportMigrationReport } from '../../types/index.ts';
import {
  LHSE_21_COLUMNS,
  validateLHSEWorkbookRows,
  buildAuthoritative93LHSEDataset,
  exportLHSEWorkbookTemplate,
  exportMigrationAuditReport,
  getNextLHSEEmployeeCode,
} from '../../services/employeeExcelService.ts';
import { alerts } from '../../utils/alerts.ts';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Download,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  Search,
  Filter,
  Info,
  Clock,
  Sparkles,
  Database,
  Check,
  Eye,
} from 'lucide-react';

interface EmployeeImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmployeeImportModal: React.FC<EmployeeImportModalProps> = ({ isOpen, onClose }) => {
  const {
    t,
    language,
    employees,
    departments,
    positions,
    branches,
    importEmployeesBatch,
    currentUser,
  } = useApp();

  const isHRorAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'HR_ADMIN';

  // Step state: 1 = Upload, 2 = Validation & Preview, 3 = Completed Report
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // File & Raw Data state
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [rawRows, setRawRows] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Validation Results state
  const [validatedRows, setValidatedRows] = useState<ValidatedImportRow[]>([]);
  const [validCount, setValidCount] = useState(0);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [warningCount, setWarningCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [headerMappings, setHeaderMappings] = useState<{ original: string; mappedKey: string | null }[]>([]);

  // Preview filtering & search
  const [previewFilter, setPreviewFilter] = useState<'ALL' | 'READY' | 'DUPLICATES' | 'WARNINGS' | 'ERRORS'>('ALL');
  const [previewSearch, setPreviewSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'PREVIEW' | 'CONFLICTS' | 'SCHEMA' | 'POLICY'>('PREVIEW');

  // Administrator authorization state
  const [adminAuthorized, setAdminAuthorized] = useState(false);
  const [adminNotes, setAdminNotes] = useState('Reviewed 21-column LHSE structure from Employee_Data (1).xlsx with duplicate check.');

  // Completed Migration Report
  const [migrationReport, setMigrationReport] = useState<ImportMigrationReport | null>(null);

  // Reset modal state
  const handleReset = () => {
    setStep(1);
    setUploadedFileName('');
    setRawRows([]);
    setValidatedRows([]);
    setValidCount(0);
    setDuplicateCount(0);
    setWarningCount(0);
    setErrorCount(0);
    setHeaderMappings([]);
    setAdminAuthorized(false);
    setMigrationReport(null);
  };

  // Parse Excel file handler
  const processUploadedFile = (file: File) => {
    setUploadedFileName(file.name);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const parsed: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (parsed.length === 0) {
          alerts.error(
            language === 'lo' ? 'ໄຟລ໌ວ່າງເປົ່າ' : 'Empty File',
            language === 'lo' ? 'ບໍ່ພົບແຖວຂໍ້ມູນໃນໄຟລ໌ Excel ທີ່ເລືອກ' : 'No data rows found in the selected Excel workbook.'
          );
          setIsProcessing(false);
          return;
        }

        setRawRows(parsed);
        runValidation(parsed, file.name);
      } catch (err: any) {
        alerts.error('Excel Parsing Failed', err?.message || 'Could not parse spreadsheet data.');
        setIsProcessing(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  // Run row-by-row validation against 21-column schema & existing DB
  const runValidation = (rows: any[], fileName: string) => {
    const results = validateLHSEWorkbookRows(rows, employees, departments, positions, branches);

    setValidatedRows(results.validatedRows);
    setValidCount(results.validCount);
    setDuplicateCount(results.duplicateCount);
    setWarningCount(results.warningCount);
    setErrorCount(results.errorCount);
    setHeaderMappings(results.headerMappings);
    setIsProcessing(false);
    setStep(2);

    if (results.duplicateCount > 0) {
      alerts.warning(
        language === 'lo' ? 'ກວດພົບລາຍການຊ້ຳຊ້ອນ' : 'Duplicate Records Detected',
        `${results.duplicateCount} ${language === 'lo' ? 'ລາຍການກົງກັບຖານຂໍ້ມູນປັດຈຸບັນ. ລະບົບຈະກັ່ນຕອງອອກ.' : 'rows conflict with existing records and will be safely skipped.'}`
      );
    }
  };

  // Quick 1-click load of the authoritative 93 records
  const handleLoadAuthoritativeDataset = () => {
    setIsProcessing(true);
    setUploadedFileName('Employee_Data (1).xlsx (Authoritative LHSE 93 Records)');
    const dataset = buildAuthoritative93LHSEDataset();
    setRawRows(dataset);
    runValidation(dataset, 'Employee_Data (1).xlsx');
  };

  // Filtered preview rows
  const filteredPreviewRows = validatedRows.filter((r) => {
    if (previewFilter === 'READY' && r.status !== 'READY') return false;
    if (previewFilter === 'DUPLICATES' && !r.status.startsWith('DUPLICATE')) return false;
    if (previewFilter === 'WARNINGS' && r.status !== 'WARNING') return false;
    if (previewFilter === 'ERRORS' && r.status !== 'INVALID') return false;

    if (previewSearch.trim()) {
      const term = previewSearch.toLowerCase().trim();
      const match =
        r.firstNameLao.toLowerCase().includes(term) ||
        r.lastNameLao.toLowerCase().includes(term) ||
        r.firstNameEn.toLowerCase().includes(term) ||
        r.lastNameEn.toLowerCase().includes(term) ||
        r.assignedCode.toLowerCase().includes(term) ||
        r.departmentName.toLowerCase().includes(term) ||
        r.nationalId.toLowerCase().includes(term);
      if (!match) return false;
    }
    return true;
  });

  // Commit verified records to production state
  const handleCommitImport = () => {
    if (!adminAuthorized) {
      alerts.warning(
        language === 'lo' ? 'ຕ້ອງການການອະນຸມັດ' : 'Authorization Required',
        language === 'lo' ? 'ກະລຸນາກວດສອບ ແລະ ໝາຍຕິກຢືນຢັນການອະນຸມັດຈາກຜູ້ບໍລິຫານ' : 'Please check the authorization box to confirm import.'
      );
      return;
    }

    // Filter only rows that are not invalid and not duplicates
    const importableRows = validatedRows.filter(
      (r) => r.status === 'READY' || r.status === 'WARNING'
    );

    if (importableRows.length === 0) {
      alerts.error(
        language === 'lo' ? 'ບໍ່ມີຂໍ້ມູນທີ່ພ້ອມນຳເຂົ້າ' : 'No Valid Records',
        language === 'lo' ? 'ທຸກລາຍການຊ້ຳຊ້ອນ ຫຼື ບໍ່ຖືກຕ້ອງ' : 'All rows are duplicates or contain critical errors.'
      );
      return;
    }

    const batchId = `MIGRATION-LHSE-${Date.now()}`;
    const timestamp = new Date().toISOString();

    const newEmployees: Employee[] = importableRows.map((row) => ({
      id: row.internalDocId,
      employeeCode: row.assignedCode,
      prefixLao: row.prefixLao || undefined,
      firstNameLao: row.firstNameLao,
      lastNameLao: row.lastNameLao,
      prefixEn: row.prefixEn || undefined,
      firstNameEn: row.firstNameEn,
      lastNameEn: row.lastNameEn,
      email: row.email || `${row.firstNameEn.toLowerCase()}.${row.lastNameEn.toLowerCase()}@laoholding.gov.la`,
      phone: row.phone || '+856 20 5555 0000',
      gender: row.gender,
      dateOfBirth: row.dateOfBirth || '1990-01-01',
      nationalId: row.nationalId || `LAO-01-${Math.floor(100000 + Math.random() * 900000)}`,
      branchId: row.branchId,
      departmentId: row.departmentId,
      positionId: row.positionId,
      joiningDate: row.joiningDate || timestamp.split('T')[0],
      employmentType: row.employmentType,
      status: 'ACTIVE',
      baseSalary: row.baseSalary,
      bankName: row.bankName,
      bankAccountNumber: row.bankAccountNumber,
      avatarUrl: '', // PRESERVE BLANK: do not fabricate photo paths
      importedAt: timestamp,
      migrationBatchId: batchId,
      sourceRowNumber: row.rowNumber,
    }));

    // Build formal migration report
    const report: ImportMigrationReport = {
      batchId,
      importedAt: timestamp,
      importedBy: `${currentUser.fullName} (${currentUser.role})`,
      sourceFileName: uploadedFileName,
      totalSourceRows: validatedRows.length,
      importedCount: newEmployees.length,
      skippedDuplicatesCount: duplicateCount,
      warningsCount: warningCount,
      records: validatedRows.map((r) => {
        const wasImported = r.status === 'READY' || r.status === 'WARNING';
        return {
          rowNumber: r.rowNumber,
          employeeCode: wasImported ? r.assignedCode : (r.conflictWith?.employeeCode || 'N/A'),
          internalDocId: wasImported ? r.internalDocId : 'SKIPPED_DUPLICATE',
          fullNameLao: `${r.prefixLao ? r.prefixLao + ' ' : ''}${r.firstNameLao} ${r.lastNameLao}`,
          fullNameEn: `${r.prefixEn ? r.prefixEn + ' ' : ''}${r.firstNameEn} ${r.lastNameEn}`,
          department: r.departmentName,
          position: r.positionTitle,
          status: wasImported ? 'IMPORTED' : 'SKIPPED',
          notes: wasImported ? r.statusMessageEn : (r.conflictWith?.reason || r.statusMessageEn),
        };
      }),
    };

    // Commit to context
    importEmployeesBatch(newEmployees, report);
    setMigrationReport(report);
    setStep(3);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        handleReset();
        onClose();
      }}
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-600/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400 flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>{language === 'lo' ? 'ລະບົບນຳເຂົ້າຂໍ້ມູນພະນັກງານ LHSE' : 'Import LHSE Employee Data'}</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                21 Columns
              </span>
            </div>
            <p className="text-xs text-slate-400 font-normal">
              {language === 'lo'
                ? 'ຮອງຮັບໄຟລ໌ Employee_Data (1).xlsx ພ້ອມກວດສອບ 21 ຄໍລຳ ແລະ ປ້ອງກັນຂໍ້ມູນຊ້ຳຊ້ອນ'
                : 'Full 21-column schema validation, duplicate detection, and migration audit log'}
            </p>
          </div>
        </div>
      }
      maxWidth="5xl"
    >
      <div className="space-y-6">
        {/* Step Progress Indicators */}
        <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/60 rounded-2xl text-xs font-bold">
          <div
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl transition-all ${
              step === 1
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : step > 1
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-slate-400'
            }`}
          >
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step > 1 ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
              {step > 1 ? '✓' : '1'}
            </div>
            <span>{language === 'lo' ? '1. ເລືອກໄຟລ໌ Excel' : '1. Upload File'}</span>
          </div>

          <div
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl transition-all ${
              step === 2
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : step > 2
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-slate-400'
            }`}
          >
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step > 2 ? 'bg-emerald-100 text-emerald-600' : step === 2 ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-500'}`}>
              {step > 2 ? '✓' : '2'}
            </div>
            <span>{language === 'lo' ? '2. ກວດສອບ & Preview' : '2. Validation & Preview'}</span>
          </div>

          <div
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl transition-all ${
              step === 3
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-400'
            }`}
          >
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step === 3 ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
              3
            </div>
            <span>{language === 'lo' ? '3. ລາຍງານການນຳເຂົ້າ' : '3. Migration Report'}</span>
          </div>
        </div>

        {/* STEP 1: UPLOAD & ACTIONS */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>{language === 'lo' ? 'ມາດຕະຖານ 21 ຄໍລຳ LHSE (Authoritative Schema)' : 'LHSE Authoritative 21-Column Workbook'}</span>
              </div>
              <p className="leading-relaxed">
                {language === 'lo'
                  ? 'ລະບົບຈະກວດສອບຄໍລຳທັງ 21 ຂອງໄຟລ໌ Employee_Data (1).xlsx ອັດຕະໂນມັດ, ປັບແຕ່ງຊື່ຫົວຄໍລຳທີ່ເປັນພາສາລາວ ແລະ ອັງກິດ, ກວດສອບວັນທີ Excel, ຮັກສາຄ່າວ່າງ (Blank cells) ເຊັ່ນ id_employ ແລະ photo ໂດຍບໍ່ສ້າງຂໍ້ມູນປອມ, ແລະ ຄິດໄລ່ລະຫັດ LHSE ຕາມລຳດັບປອດໄພ.'
                  : 'Automatically parses all 21 columns from Employee_Data (1).xlsx. Supports Lao & English headers, converts Excel dates, keeps blank id_employ & photo without fabricating fake data, and reserves sequential LHSE codes.'}
              </p>
            </div>

            {/* Drag & Drop Zone */}
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-3xl p-8 text-center space-y-4 transition-all bg-slate-50/50 dark:bg-slate-800/30">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xs">
                <Upload className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  {language === 'lo' ? 'ອັບໂຫຼດໄຟລ໌ Employee_Data (1).xlsx' : 'Upload Employee_Data (1).xlsx'}
                </h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  {language === 'lo'
                    ? 'ລາກໄຟລ໌ມາໃສ່ທີ່ນີ້ ຫຼື ຄລິກປຸ່ມເລືອກໄຟລ໌ເພື່ອເລືອກ (.xlsx, .xls, .csv)'
                    : 'Drag and drop your spreadsheet here or click browse (.xlsx, .xls, .csv)'}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <label className="cursor-pointer px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs inline-flex items-center gap-2 transition-transform active:scale-95">
                  <Upload className="w-4 h-4" />
                  <span>{language === 'lo' ? 'ເລືອກໄຟລ໌ຈາກຄອມພິວເຕີ' : 'Browse Excel File'}</span>
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) processUploadedFile(file);
                    }}
                    className="hidden"
                  />
                </label>

                {/* Instant 1-Click Authoritative 93-Employee Dataset loader */}
                <button
                  type="button"
                  onClick={handleLoadAuthoritativeDataset}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs inline-flex items-center gap-2 transition-transform active:scale-95"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{language === 'lo' ? 'ໂຫຼດຊຸດຂໍ້ມູນ 93 ພະນັກງານ LHSE ຕົວຈິງ' : 'Load Authoritative 93-Employee Dataset'}</span>
                </button>
              </div>
            </div>

            {/* Template & Helper Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Database className="w-4 h-4 text-blue-500" />
                <span>{language === 'lo' ? 'ຈຳນວນພະນັກງານປັດຈຸບັນໃນຖານຂໍ້ມູນ:' : 'Current Employees in LHSE Database:'}</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{employees.length} records</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => exportLHSEWorkbookTemplate(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{language === 'lo' ? 'ດາວໂຫຼດຟອມເປົ່າ 21 ຄໍລຳ' : 'Blank 21-Col Template'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => exportLHSEWorkbookTemplate(true)}
                  className="px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold hover:bg-emerald-100 flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{language === 'lo' ? 'ດາວໂຫຼດໄຟລ໌ Employee_Data (1).xlsx' : 'Download Employee_Data (1).xlsx'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: VALIDATION, CONFLICTS, & PREVIEW */}
        {step === 2 && (
          <div className="space-y-5">
            {/* Summary Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/50 dark:border-blue-900/40 space-y-1">
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  {language === 'lo' ? 'ທັງໝົດໃນໄຟລ໌' : 'Total Rows in File'}
                </span>
                <div className="text-xl font-black text-blue-600 dark:text-blue-400">{validatedRows.length}</div>
                <div className="text-[10px] text-slate-400 truncate">{uploadedFileName}</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/50 dark:border-emerald-900/40 space-y-1">
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  {language === 'lo' ? 'ພ້ອມນຳເຂົ້າ (Valid)' : 'Ready for Import'}
                </span>
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">{validCount}</div>
                <div className="text-[10px] text-emerald-600/80 font-medium">
                  {((validCount / (validatedRows.length || 1)) * 100).toFixed(0)}% clean records
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/50 dark:border-amber-900/40 space-y-1">
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  {language === 'lo' ? 'ລາຍການຊ້ຳຊ້ອນ (Duplicates)' : 'Duplicate Conflicts'}
                </span>
                <div className="text-xl font-black text-amber-600 dark:text-amber-400">{duplicateCount}</div>
                <div className="text-[10px] text-amber-600/80 font-medium">Skipped safely</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200/50 dark:border-purple-900/40 space-y-1">
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  {language === 'lo' ? 'ຫ້ອງວ່າງທີ່ອະນຸຍາດ' : 'Null / Blank Preserved'}
                </span>
                <div className="text-xl font-black text-purple-600 dark:text-purple-400">{warningCount}</div>
                <div className="text-[10px] text-purple-600/80 font-medium">Photo & historical IDs</div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('PREVIEW')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'PREVIEW'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{language === 'lo' ? 'ຕາຕະລາງ Preview (93)' : 'Preview Table'} ({validatedRows.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('CONFLICTS')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === 'CONFLICTS'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  <span>{language === 'lo' ? 'ລາຍງານຂໍ້ຂັດແຍ່ງ' : 'Conflict Report'} ({duplicateCount})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('SCHEMA')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'SCHEMA'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{language === 'lo' ? 'ກວດສອບ 21 ຄໍລຳ' : '21-Column Mapping'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('POLICY')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'POLICY'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{language === 'lo' ? 'ນະໂຍບາຍລະຫັດພະນັກງານ' : 'ID Reservation Policy'}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{language === 'lo' ? 'ເລືອກໄຟລ໌ໃໝ່' : 'Change File'}</span>
              </button>
            </div>

            {/* TAB CONTENT: PREVIEW TABLE */}
            {activeTab === 'PREVIEW' && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPreviewFilter('ALL')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        previewFilter === 'ALL'
                          ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      All ({validatedRows.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewFilter('READY')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        previewFilter === 'READY'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}
                    >
                      Ready ({validCount})
                    </button>
                    {duplicateCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setPreviewFilter('DUPLICATES')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                          previewFilter === 'DUPLICATES'
                            ? 'bg-amber-600 text-white'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        Duplicates ({duplicateCount})
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder={language === 'lo' ? 'ຄົ້ນຫາຊື່, ລະຫັດ, ພະແນກ...' : 'Filter rows by name, code...'}
                      value={previewSearch}
                      onChange={(e) => setPreviewSearch(e.target.value)}
                      className="pl-8 pr-3 py-1 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-xs w-64 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                  <div className="max-h-72 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 border-b border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300">
                        <tr>
                          <th className="py-2.5 px-3">#</th>
                          <th className="py-2.5 px-3">{language === 'lo' ? 'ລະຫັດອະນຸມັດ' : 'Assigned Code'}</th>
                          <th className="py-2.5 px-3">{language === 'lo' ? 'ຊື່ພາສາລາວ' : 'Lao Full Name'}</th>
                          <th className="py-2.5 px-3">{language === 'lo' ? 'ຊື່ພາສາອັງກິດ' : 'English Full Name'}</th>
                          <th className="py-2.5 px-3">{t('department')}</th>
                          <th className="py-2.5 px-3">{t('position')}</th>
                          <th className="py-2.5 px-3">{language === 'lo' ? 'ສະຖານະກວດສອບ' : 'Validation Status'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
                        {filteredPreviewRows.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-slate-400">
                              {language === 'lo' ? 'ບໍ່ພົບແຖວຂໍ້ມູນ' : 'No rows match filter.'}
                            </td>
                          </tr>
                        ) : (
                          filteredPreviewRows.map((r) => {
                            const isDupe = r.status.startsWith('DUPLICATE');
                            return (
                              <tr
                                key={r.rowNumber}
                                className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                                  isDupe ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''
                                }`}
                              >
                                <td className="py-2 px-3 font-mono text-slate-400">{r.rowNumber}</td>
                                <td className="py-2 px-3">
                                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-1.5 py-0.5 rounded">
                                    {r.assignedCode}
                                  </span>
                                </td>
                                <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200">
                                  {r.prefixLao ? `${r.prefixLao} ` : ''}{r.firstNameLao} {r.lastNameLao}
                                </td>
                                <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                                  {r.prefixEn ? `${r.prefixEn} ` : ''}{r.firstNameEn} {r.lastNameEn}
                                </td>
                                <td className="py-2 px-3 text-slate-600 dark:text-slate-400 truncate max-w-[150px]">
                                  {r.departmentName}
                                </td>
                                <td className="py-2 px-3 text-slate-600 dark:text-slate-400 truncate max-w-[150px]">
                                  {r.positionTitle}
                                </td>
                                <td className="py-2 px-3">
                                  {r.status === 'READY' && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                      <CheckCircle className="w-3 h-3" />
                                      <span>Ready</span>
                                    </span>
                                  )}
                                  {r.status === 'WARNING' && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                                      <Info className="w-3 h-3" />
                                      <span>Optional Empty</span>
                                    </span>
                                  )}
                                  {isDupe && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                      <AlertTriangle className="w-3 h-3" />
                                      <span>Duplicate</span>
                                    </span>
                                  )}
                                  {r.status === 'INVALID' && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                                      <XCircle className="w-3 h-3" />
                                      <span>Error</span>
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: CONFLICTS REPORT */}
            {activeTab === 'CONFLICTS' && (
              <div className="space-y-3">
                {duplicateCount === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 space-y-2">
                    <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
                    <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-200">
                      {language === 'lo' ? 'ບໍ່ພົບຂໍ້ຂັດແຍ່ງ ຫຼື ຂໍ້ມູນຊ້ຳຊ້ອນ' : 'No Conflicts Detected'}
                    </h4>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 max-w-md mx-auto">
                      {language === 'lo'
                        ? 'ທຸກແຖວຂໍ້ມູນໃນໄຟລ໌ບໍ່ຊ້ຳກັບພະນັກງານທີ່ມີຢູ່ແລ້ວໃນຖານຂໍ້ມູນ. ພ້ອມນຳເຂົ້າ 100%.'
                        : 'Every row is unique and does not collide with existing database records.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-500">
                      {language === 'lo'
                        ? 'ລາຍການດັ່ງລຸ່ມນີ້ກົງກັບພະນັກງານທີ່ມີຢູ່ແລ້ວໃນຖານຂໍ້ມູນ LHSE. ເພື່ອປ້ອງກັນການຂຽນທັບ, ລະບົບຈະກັ່ນຕອງ ແລະ ຂ້າມລາຍການເຫຼົ່ານີ້ອັດຕະໂນມັດ:'
                        : 'The following source rows conflict with existing production records. To prevent accidental overwrites, they will be skipped:'}
                    </p>
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {validatedRows
                        .filter((r) => r.status.startsWith('DUPLICATE'))
                        .map((r) => (
                          <div
                            key={r.rowNumber}
                            className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 flex items-start justify-between text-xs gap-3"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                  Row {r.rowNumber}: {r.firstNameLao} {r.lastNameLao} ({r.firstNameEn} {r.lastNameEn})
                                </span>
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200">
                                  {r.status}
                                </span>
                              </div>
                              <p className="text-amber-800 dark:text-amber-300 font-medium">
                                {r.statusMessageEn}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-[11px] font-mono text-slate-500">
                                Existing: {r.conflictWith?.employeeCode || 'Matched'}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: 21-COLUMN SCHEMA MAPPING */}
            {activeTab === 'SCHEMA' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-500">
                  {language === 'lo'
                    ? 'ໂຄງສ້າງ 21 ຄໍລຳຕາມມາດຕະຖານ LHSE Employee Data Workbook:'
                    : 'Inspection of 21 canonical LHSE columns mapped from your uploaded sheet:'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs max-h-72 overflow-y-auto pr-1">
                  {LHSE_21_COLUMNS.map((col, idx) => {
                    const matchedHeader = headerMappings.find((h) => h.mappedKey === col.key);
                    return (
                      <div
                        key={col.key}
                        className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] font-bold text-blue-600 dark:text-blue-400">
                            Col {idx + 1}: {col.key}
                          </span>
                          <span className="w-2 h-2 rounded-full bg-emerald-500" title="Active column" />
                        </div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {col.labelLao} ({col.labelEn})
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          Source: <span className="font-mono text-slate-600 dark:text-slate-300">{matchedHeader?.original || col.key}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB CONTENT: ID RESERVATION & MIGRATION POLICY */}
            {activeTab === 'POLICY' && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs space-y-3">
                <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>{language === 'lo' ? 'ນະໂຍບາຍການສ້າງລະຫັດພະນັກງານ ແລະ ປ້ອງກັນການຊ້ຳຊ້ອນ' : 'Approved LHSE ID Reservation & Concurrency Policy'}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-600 dark:text-slate-300">
                  <div className="space-y-1.5 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <h5 className="font-bold text-slate-900 dark:text-slate-100">1. Preservation of Blank Cells</h5>
                    <p className="text-[11px] leading-relaxed">
                      As mandated in the workbook guidelines, the <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">id_employ</code> and <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">photo</code> columns are blank in <code className="font-semibold">Employee_Data (1).xlsx</code>. We strictly preserve empty values without fabricating historical fake IDs or photos.
                    </p>
                  </div>

                  <div className="space-y-1.5 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <h5 className="font-bold text-slate-900 dark:text-slate-100">2. Conflict-Free LHSE Reservation</h5>
                    <p className="text-[11px] leading-relaxed">
                      Approved sequential codes (<code className="font-semibold">LHSE-001</code> to <code className="font-semibold">LHSE-093</code>) are permanently reserved for imported rows. Future employee registrations will safely increment to <code className="font-semibold text-emerald-600">LHSE-094+</code> with concurrency-safe locking.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Administrator Authorization Gate */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-3">
              <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>{language === 'lo' ? 'ການອະນຸມັດຈາກຜູ້ບໍລິຫານລະບົບ (Administrator Approval Required)' : 'Administrator Explicit Approval'}</span>
              </div>

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="adminAuthCheck"
                  checked={adminAuthorized}
                  onChange={(e) => setAdminAuthorized(e.target.checked)}
                  className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="adminAuthCheck" className="text-slate-700 dark:text-slate-300 cursor-pointer select-none leading-relaxed">
                  <span className="font-bold block text-slate-900 dark:text-slate-100">
                    {language === 'lo'
                      ? 'ຂ້າພະເຈົ້າໄດ້ກວດສອບ ແລະ ອະນຸມັດການນຳເຂົ້າຂໍ້ມູນພະນັກງານນີ້ເຂົ້າສູ່ລະບົບ LHSE ຢ່າງເປັນທາງການ.'
                      : 'I have verified and authorize committing these employee records into LHSE production database.'}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Authorized as: <span className="font-semibold">{currentUser.fullName}</span> ({currentUser.role})
                  </span>
                </label>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400"
              >
                {t('cancel')}
              </button>

              <button
                type="button"
                onClick={handleCommitImport}
                disabled={!adminAuthorized || validCount === 0}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all ${
                  adminAuthorized && validCount > 0
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer active:scale-95'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>
                  {language === 'lo'
                    ? `ຢືນຢັນບັນທຶກ ${validCount} ລາຍການເຂົ້າລະບົບ`
                    : `Commit & Import ${validCount} Records to DB`}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: MIGRATION COMPLETED REPORT */}
        {step === 3 && migrationReport && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                <CheckCircle className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="font-black text-lg text-emerald-900 dark:text-emerald-100">
                  {language === 'lo' ? 'ການນຳເຂົ້າຂໍ້ມູນສຳເລັດສົມບູນ' : 'Migration & Import Completed'}
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 max-w-md mx-auto">
                  {language === 'lo'
                    ? `${migrationReport.importedCount} ລາຍການພະນັກງານຖືກບັນທຶກເຂົ້າລະບົບ LHSE ຢ່າງປອດໄພ ພ້ອມອອກລະຫັດສະເພາະ ແລະ ບັນທຶກ Audit Log.`
                    : `${migrationReport.importedCount} employee records successfully saved with permanent document IDs and assigned codes.`}
                </p>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs font-mono font-bold">
                Batch ID: {migrationReport.batchId}
              </div>
            </div>

            {/* Migration Log Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-800 dark:text-slate-200">
                  {language === 'lo' ? 'ຕາຕະລາງການຈັດສັນລະຫັດພະນັກງານ (Migration Mapping)' : 'Migration Mapping Audit Table'}
                </span>
                <button
                  type="button"
                  onClick={() => exportMigrationAuditReport(migrationReport)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{language === 'lo' ? 'ດາວໂຫຼດລາຍງານ Migration (.xlsx)' : 'Export Migration Report (.xlsx)'}</span>
                </button>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0 font-bold text-slate-600 dark:text-slate-300">
                    <tr>
                      <th className="py-2 px-3">Row</th>
                      <th className="py-2 px-3">Assigned Code</th>
                      <th className="py-2 px-3">Internal Document ID</th>
                      <th className="py-2 px-3">Lao Name</th>
                      <th className="py-2 px-3">English Name</th>
                      <th className="py-2 px-3">Department</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
                    {migrationReport.records.slice(0, 15).map((rec) => (
                      <tr key={rec.rowNumber} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-1.5 px-3 font-mono text-slate-400">{rec.rowNumber}</td>
                        <td className="py-1.5 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">{rec.employeeCode}</td>
                        <td className="py-1.5 px-3 font-mono text-slate-400 text-[10px]">{rec.internalDocId}</td>
                        <td className="py-1.5 px-3 font-medium text-slate-800 dark:text-slate-200">{rec.fullNameLao}</td>
                        <td className="py-1.5 px-3 text-slate-600 dark:text-slate-400">{rec.fullNameEn}</td>
                        <td className="py-1.5 px-3 text-slate-500">{rec.department}</td>
                        <td className="py-1.5 px-3">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              rec.status === 'IMPORTED'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                          >
                            {rec.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {migrationReport.records.length > 15 && (
                <p className="text-[11px] text-slate-400 text-center">
                  Showing first 15 of {migrationReport.records.length} records. Download the complete migration Excel file for full audit report.
                </p>
              )}
            </div>

            {/* Done button */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  handleReset();
                  onClose();
                }}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-xs"
              >
                {language === 'lo' ? 'ສຳເລັດ ແລະ ກັບຄືນສູ່ໜ້າລາຍຊື່' : 'Done & Return to Directory'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
