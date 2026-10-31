import * as XLSX from 'xlsx';
import { Employee, AttendanceRecord } from '../types/index.ts';

export interface BiometricImportRow {
  rowNumber: number;
  rawCode: string;
  matchedEmployee: Employee | null;
  employeeNameLao: string;
  employeeNameEn: string;
  date: string; // YYYY-MM-DD
  checkIn: string; // HH:mm
  checkOut: string; // HH:mm
  durationMinutes: number;
  calculatedStatus: 'PRESENT' | 'LATE' | 'EARLY_DEPARTURE' | 'ABSENT';
  deviceCode: string;
  validationStatus: 'READY' | 'DUPLICATE' | 'UNMATCHED' | 'INVALID_TIME' | 'WARNING';
  validationMessageLao: string;
  validationMessageEn: string;
  isExistingRecord?: boolean;
}

export interface BiometricImportSummary {
  fileName: string;
  totalRows: number;
  validCount: number;
  matchedEmployeesCount: number;
  unmatchedCount: number;
  duplicateCount: number;
  latePunchesCount: number;
  onTimePunchesCount: number;
  rows: BiometricImportRow[];
}

/**
 * Calculates duration between two HH:mm strings
 */
export function calculateMinutesBetween(start: string, end: string): number {
  if (!start || !end || start === '--:--' || end === '--:--') return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return 0;
  const startMins = sh * 60 + sm;
  const endMins = eh * 60 + em;
  return Math.max(0, endMins - startMins);
}

/**
 * Normalizes time string to HH:mm
 */
function normalizeTime(val: any): string {
  if (val === null || val === undefined) return '';
  const str = String(val).trim();
  if (!str || str === '--:--' || str === '-') return '';

  // If decimal fraction from Excel time (e.g. 0.33333 for 08:00)
  if (typeof val === 'number' && val >= 0 && val < 1) {
    const totalMinutes = Math.round(val * 24 * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  // If Date object
  if (val instanceof Date) {
    return `${String(val.getHours()).padStart(2, '0')}:${String(val.getMinutes()).padStart(2, '0')}`;
  }

  // Regex HH:mm(:ss)?
  const match = str.match(/(\d{1,2}):(\d{2})(?::\d{2})?/);
  if (match) {
    const h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  return str;
}

/**
 * Normalizes date string to YYYY-MM-DD
 */
function normalizeDate(val: any): string {
  if (!val) return new Date().toISOString().split('T')[0];

  // If Date object
  if (val instanceof Date) {
    return val.toISOString().split('T')[0];
  }

  // If Excel serial number (e.g. 45600)
  if (typeof val === 'number') {
    const date = new Date((val - 25569) * 86400 * 1000);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }

  const str = String(val).trim();

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmy) {
    const d = String(dmy[1]).padStart(2, '0');
    const m = String(dmy[2]).padStart(2, '0');
    const y = dmy[3];
    return `${y}-${m}-${d}`;
  }

  // YYYY/MM/DD
  const ymd = str.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (ymd) {
    const y = ymd[1];
    const m = String(ymd[2]).padStart(2, '0');
    const d = String(ymd[3]).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Try standard parse
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return new Date().toISOString().split('T')[0];
}

/**
 * Matches employee based on input code, numeric ID, or name
 */
export function findMatchingEmployee(codeOrName: string, employees: Employee[]): Employee | null {
  if (!codeOrName) return null;
  const raw = String(codeOrName).trim();
  const lower = raw.toLowerCase();

  // Exact employeeCode match (case-insensitive)
  const byCode = employees.find((e) => e.employeeCode.toLowerCase() === lower);
  if (byCode) return byCode;

  // Numeric code extraction (e.g. "1" or "001" -> matches "LHSE-001")
  const numMatch = raw.match(/\d+/);
  if (numMatch) {
    const num = parseInt(numMatch[0], 10);
    const byNum = employees.find((e) => {
      const eNumMatch = e.employeeCode.match(/\d+/);
      return eNumMatch ? parseInt(eNumMatch[0], 10) === num : false;
    });
    if (byNum) return byNum;
  }

  // Match national ID
  const byNationalId = employees.find((e) => e.nationalId && e.nationalId.toLowerCase() === lower);
  if (byNationalId) return byNationalId;

  // Match name
  const byName = employees.find(
    (e) =>
      `${e.firstNameEn} ${e.lastNameEn}`.toLowerCase().includes(lower) ||
      `${e.firstNameLao} ${e.lastNameLao}`.toLowerCase().includes(lower)
  );
  if (byName) return byName;

  return null;
}

/**
 * Parses Raw DAT or TXT format (Standard ZKTeco / Anviz Punch Log)
 * Format typically: UserID \t DateTime \t VerifyType \t InOutState
 */
function parseZKTecoTextLog(
  text: string,
  employees: Employee[],
  existingRecords: AttendanceRecord[],
  defaultDevice: string
): BiometricImportRow[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  
  // Group by (userId, date)
  const punchMap = new Map<string, { userId: string; date: string; times: string[]; device: string }>();

  lines.forEach((line) => {
    // Delimiters can be Tab, Space, or Comma
    const parts = line.split(/[\t,;]+|\s{2,}/);
    if (parts.length < 2) return;

    const userId = parts[0].trim();
    const dateTimeStr = parts[1].trim();

    // Extract date and time
    let date = '';
    let time = '';

    const dtParts = dateTimeStr.split(/\s+/);
    if (dtParts.length >= 2) {
      date = normalizeDate(dtParts[0]);
      time = normalizeTime(dtParts[1]);
    } else if (dateTimeStr.includes('T')) {
      const [d, t] = dateTimeStr.split('T');
      date = normalizeDate(d);
      time = normalizeTime(t);
    } else {
      date = normalizeDate(dateTimeStr);
      time = parts[2] ? normalizeTime(parts[2]) : '08:00';
    }

    if (!date || !time) return;

    const key = `${userId}_${date}`;
    if (!punchMap.has(key)) {
      punchMap.set(key, { userId, date, times: [], device: parts[parts.length - 1] || defaultDevice });
    }
    punchMap.get(key)!.times.push(time);
  });

  const rows: BiometricImportRow[] = [];
  let rowIdx = 1;

  punchMap.forEach(({ userId, date, times, device }) => {
    times.sort();
    const checkIn = times[0] || '08:00';
    const checkOut = times.length > 1 ? times[times.length - 1] : '';

    const emp = findMatchingEmployee(userId, employees);
    const duration = calculateMinutesBetween(checkIn, checkOut || checkIn);

    // LHSE Official Work Hours: 08:00 - 17:00 (Grace period until 08:30)
    const isLate = checkIn > '08:30';
    const calculatedStatus: 'PRESENT' | 'LATE' = isLate ? 'LATE' : 'PRESENT';

    const isExisting = emp
      ? existingRecords.some((r) => r.employeeId === emp.id && r.date === date)
      : false;

    let validationStatus: BiometricImportRow['validationStatus'] = 'READY';
    let msgLao = 'ພ້ອມນຳເຂົ້າ';
    let msgEn = 'Ready to import';

    if (!emp) {
      validationStatus = 'UNMATCHED';
      msgLao = `ບໍ່ພົບຂໍ້ມູນພະນັກງານລະຫັດ: ${userId}`;
      msgEn = `Unknown employee badge code: ${userId}`;
    } else if (isExisting) {
      validationStatus = 'DUPLICATE';
      msgLao = `ມີບັນທຶກວັນທີ ${date} ແລ້ວ (ອັບເດດແທນທີ່)`;
      msgEn = `Existing record found for ${date} (will update)`;
    } else if (!checkOut) {
      validationStatus = 'WARNING';
      msgLao = 'ບໍ່ພົບເວລາສະແກນອອກ (Check-out missing)';
      msgEn = 'No punch-out record detected';
    }

    rows.push({
      rowNumber: rowIdx++,
      rawCode: userId,
      matchedEmployee: emp,
      employeeNameLao: emp ? `${emp.firstNameLao} ${emp.lastNameLao}` : 'ບໍ່ລະບຸຊື່',
      employeeNameEn: emp ? `${emp.firstNameEn} ${emp.lastNameEn}` : 'Unmatched Employee',
      date,
      checkIn,
      checkOut: checkOut || '--:--',
      durationMinutes: duration,
      calculatedStatus,
      deviceCode: device || defaultDevice,
      validationStatus,
      validationMessageLao: msgLao,
      validationMessageEn: msgEn,
      isExistingRecord: isExisting,
    });
  });

  return rows;
}

/**
 * Parses Excel / CSV spreadsheet files
 */
export function parseBiometricSpreadsheet(
  buffer: ArrayBuffer | string,
  fileName: string,
  employees: Employee[],
  existingRecords: AttendanceRecord[],
  defaultDevice = 'LHSE-SCAN-HQ1'
): BiometricImportSummary {
  // If plain text / .dat / .txt file
  if (fileName.endsWith('.dat') || fileName.endsWith('.txt')) {
    const textContent = typeof buffer === 'string' ? buffer : new TextDecoder('utf-8').decode(buffer);
    const rows = parseZKTecoTextLog(textContent, employees, existingRecords, defaultDevice);
    return buildSummary(fileName, rows);
  }

  // Parse Excel workbook
  const workbook = XLSX.read(buffer, { type: typeof buffer === 'string' ? 'binary' : 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  const rows: BiometricImportRow[] = [];
  let rowIdx = 1;

  for (const item of rawData) {
    // Find keys flexibly
    const codeKey = Object.keys(item).find((k) =>
      /code|id|emp|badge|ເລກລະຫັດ|ລະຫັດ/i.test(k)
    );
    const dateKey = Object.keys(item).find((k) =>
      /date|day|ວັນທີ/i.test(k)
    );
    const inKey = Object.keys(item).find((k) =>
      /in|checkin|start|ເຂົ້າ/i.test(k)
    );
    const outKey = Object.keys(item).find((k) =>
      /out|checkout|end|ອອກ/i.test(k)
    );
    const deviceKey = Object.keys(item).find((k) =>
      /device|machine|scanner|terminal|ເຄື່ອງ/i.test(k)
    );

    const rawCode = String(item[codeKey || 'EmployeeCode'] || item['Code'] || item['ID'] || '').trim();
    if (!rawCode) continue;

    const date = normalizeDate(item[dateKey || 'Date'] || item['ວັນທີ']);
    const checkIn = normalizeTime(item[inKey || 'CheckIn'] || item['In'] || '08:00') || '08:00';
    const checkOut = normalizeTime(item[outKey || 'CheckOut'] || item['Out'] || '');
    const deviceCode = String(item[deviceKey || 'DeviceCode'] || defaultDevice).trim() || defaultDevice;

    const emp = findMatchingEmployee(rawCode, employees);
    const duration = calculateMinutesBetween(checkIn, checkOut || checkIn);
    const isLate = checkIn > '08:30';
    const calculatedStatus: 'PRESENT' | 'LATE' = isLate ? 'LATE' : 'PRESENT';

    const isExisting = emp
      ? existingRecords.some((r) => r.employeeId === emp.id && r.date === date)
      : false;

    let validationStatus: BiometricImportRow['validationStatus'] = 'READY';
    let msgLao = 'ພ້ອມນຳເຂົ້າ';
    let msgEn = 'Ready to import';

    if (!emp) {
      validationStatus = 'UNMATCHED';
      msgLao = `ບໍ່ພົບລະຫັດພະນັກງານ: ${rawCode}`;
      msgEn = `Unknown employee badge code: ${rawCode}`;
    } else if (isExisting) {
      validationStatus = 'DUPLICATE';
      msgLao = `ມີບັນທຶກວັນທີ ${date} ແລ້ວ (ອັບເດດແທນທີ່)`;
      msgEn = `Existing record found for ${date} (will update)`;
    } else if (!checkOut || checkOut === '--:--') {
      validationStatus = 'WARNING';
      msgLao = 'ບໍ່ພົບເວລາສະແກນອອກ (Check-out missing)';
      msgEn = 'No punch-out recorded';
    }

    rows.push({
      rowNumber: rowIdx++,
      rawCode,
      matchedEmployee: emp,
      employeeNameLao: emp ? `${emp.firstNameLao} ${emp.lastNameLao}` : 'ບໍ່ລະບຸຊື່',
      employeeNameEn: emp ? `${emp.firstNameEn} ${emp.lastNameEn}` : 'Unmatched Employee',
      date,
      checkIn,
      checkOut: checkOut || '--:--',
      durationMinutes: duration,
      calculatedStatus,
      deviceCode,
      validationStatus,
      validationMessageLao: msgLao,
      validationMessageEn: msgEn,
      isExistingRecord: isExisting,
    });
  }

  return buildSummary(fileName, rows);
}

function buildSummary(fileName: string, rows: BiometricImportRow[]): BiometricImportSummary {
  const totalRows = rows.length;
  const validCount = rows.filter((r) => r.validationStatus === 'READY' || r.validationStatus === 'DUPLICATE' || r.validationStatus === 'WARNING').length;
  const matchedEmployeesCount = rows.filter((r) => r.matchedEmployee !== null).length;
  const unmatchedCount = rows.filter((r) => r.validationStatus === 'UNMATCHED').length;
  const duplicateCount = rows.filter((r) => r.isExistingRecord).length;
  const latePunchesCount = rows.filter((r) => r.calculatedStatus === 'LATE').length;
  const onTimePunchesCount = rows.filter((r) => r.calculatedStatus === 'PRESENT').length;

  return {
    fileName,
    totalRows,
    validCount,
    matchedEmployeesCount,
    unmatchedCount,
    duplicateCount,
    latePunchesCount,
    onTimePunchesCount,
    rows,
  };
}

/**
 * Downloads official Excel Template for Biometric Scanner Import
 */
export function downloadBiometricSampleTemplate(employees: Employee[]) {
  const sampleData = [
    {
      'EmployeeCode': 'LHSE-001',
      'EmployeeName': 'Bounmy Sisavath',
      'Date': '2026-10-27',
      'CheckIn': '08:02',
      'CheckOut': '17:05',
      'DeviceCode': 'LHSE-SCAN-HQ1',
      'Notes': 'Normal scan at lobby',
    },
    {
      'EmployeeCode': 'LHSE-002',
      'EmployeeName': 'Souksamone Phimmavong',
      'Date': '2026-10-27',
      'CheckIn': '08:42',
      'CheckOut': '17:15',
      'DeviceCode': 'LHSE-SCAN-HQ1',
      'Notes': 'Traffic delay (Late)',
    },
    {
      'EmployeeCode': 'LHSE-003',
      'EmployeeName': 'Khammone Vongphachanh',
      'Date': '2026-10-27',
      'CheckIn': '07:55',
      'CheckOut': '17:00',
      'DeviceCode': 'LHSE-SCAN-NT2',
      'Notes': 'Nam Theun 2 Field Site Office',
    },
    {
      'EmployeeCode': 'LHSE-004',
      'EmployeeName': 'Viengxay Phomvihane',
      'Date': '2026-10-27',
      'CheckIn': '08:10',
      'CheckOut': '17:08',
      'DeviceCode': 'LHSE-SCAN-HG1',
      'Notes': 'Hongsa Power Site Office',
    },
    {
      'EmployeeCode': 'LHSE-005',
      'EmployeeName': 'Aloun Sengchanh',
      'Date': '2026-10-27',
      'CheckIn': '08:15',
      'CheckOut': '17:00',
      'DeviceCode': 'LHSE-SCAN-HQ1',
      'Notes': 'Vientiane HQ Main Lobby',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Biometric_Attendance_Template');
  XLSX.writeFile(workbook, 'LHSE_Biometric_Scanner_Import_Template.xlsx');
}

/**
 * Downloads CSV template
 */
export function downloadBiometricCsvTemplate() {
  const csvContent =
    'EmployeeCode,EmployeeName,Date,CheckIn,CheckOut,DeviceCode,Notes\n' +
    'LHSE-001,Bounmy Sisavath,2026-10-27,08:02,17:05,LHSE-SCAN-HQ1,Main Lobby Scanner\n' +
    'LHSE-002,Souksamone Phimmavong,2026-10-27,08:45,17:15,LHSE-SCAN-HQ1,Tardy\n' +
    'LHSE-003,Khammone Vongphachanh,2026-10-27,07:55,17:00,LHSE-SCAN-NT2,Field Office\n';

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'LHSE_Biometric_Attendance_Template.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generates realistic simulation biometric logs for 1-click test
 */
export function generateMachineScanDemoData(employees: Employee[], targetDate?: string): BiometricImportRow[] {
  const date = targetDate || new Date().toISOString().split('T')[0];

  const sampleScans: { code: string; inTime: string; outTime: string; device: string; note: string }[] = [
    { code: 'LHSE-001', inTime: '08:05', outTime: '17:05', device: 'LHSE-SCAN-HQ1', note: 'Fingerprint verified' },
    { code: 'LHSE-002', inTime: '08:42', outTime: '17:15', device: 'LHSE-SCAN-HQ1', note: 'Late punch (>08:30)' },
    { code: 'LHSE-003', inTime: '07:56', outTime: '17:02', device: 'LHSE-SCAN-NT2', note: 'NT2 field fingerprint' },
    { code: 'LHSE-004', inTime: '08:12', outTime: '17:00', device: 'LHSE-SCAN-HG1', note: 'Hongsa scanner' },
    { code: 'LHSE-005', inTime: '08:18', outTime: '17:08', device: 'LHSE-SCAN-HQ1', note: 'HQ optical scan' },
    { code: 'LHSE-006', inTime: '08:01', outTime: '17:01', device: 'LHSE-SCAN-NT2', note: 'Field technician' },
    { code: 'LHSE-007', inTime: '08:50', outTime: '17:20', device: 'LHSE-SCAN-HQ1', note: 'Tardy check-in' },
    { code: 'LHSE-008', inTime: '08:15', outTime: '17:00', device: 'LHSE-SCAN-HG1', note: 'Power station scan' },
  ];

  return sampleScans.map((s, idx) => {
    const emp = findMatchingEmployee(s.code, employees);
    const duration = calculateMinutesBetween(s.inTime, s.outTime);
    const isLate = s.inTime > '08:30';

    return {
      rowNumber: idx + 1,
      rawCode: s.code,
      matchedEmployee: emp,
      employeeNameLao: emp ? `${emp.firstNameLao} ${emp.lastNameLao}` : 'ພະນັກງານ LHSE',
      employeeNameEn: emp ? `${emp.firstNameEn} ${emp.lastNameEn}` : 'LHSE Staff',
      date,
      checkIn: s.inTime,
      checkOut: s.outTime,
      durationMinutes: duration,
      calculatedStatus: isLate ? 'LATE' : 'PRESENT',
      deviceCode: s.device,
      validationStatus: emp ? 'READY' : 'UNMATCHED',
      validationMessageLao: emp ? (isLate ? 'ມາຊ້າ (>08:30) - ພ້ອມນຳເຂົ້າ' : 'ມາທັນເວລາ - ພ້ອມນຳເຂົ້າ') : 'ບໍ່ພົບລະຫັດພະນັກງານ',
      validationMessageEn: emp ? (isLate ? 'Late punch (>08:30) - Ready' : 'On-time punch - Ready') : 'Unmatched employee code',
      isExistingRecord: false,
    };
  });
}
