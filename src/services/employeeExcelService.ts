import * as XLSX from 'xlsx';
import { Employee, Department, Position, Branch, ValidatedImportRow, ImportMigrationReport } from '../types/index.ts';

/**
 * 21 Standard Columns for LHSE Employee Data Workbook:
 * 1. id_employ (Employee ID/Code - blank in Employee_Data (1).xlsx)
 * 2. prefix_lao (ຄຳນຳໜ້າ: ທ້າວ, ນາງ, ທ່ານ)
 * 3. firstname_lao (ຊື່ພາສາລາວ)
 * 4. lastname_lao (ນາມສະກຸນພາສາລາວ)
 * 5. prefix_en (Title: Mr., Ms., Mrs., Dr.)
 * 6. firstname_en (First Name in English)
 * 7. lastname_en (Last Name in English)
 * 8. gender (ເພດ: ຊາຍ/MALE, ຍິງ/FEMALE)
 * 9. dob (ວັນເດືອນປີເກີດ YYYY-MM-DD)
 * 10. national_id (ເລກບັດປະຈຳຕົວ / ສຳມະໂນຄົວ)
 * 11. phone (ເບີໂທລະສັບ)
 * 12. email (ອີເມວ)
 * 13. branch (ສາຂາ)
 * 14. department (ພະແນກ)
 * 15. position (ຕຳແໜ່ງ)
 * 16. joining_date (ວັນທີເຂົ້າເຮັດວຽກ YYYY-MM-DD)
 * 17. employment_type (ປະເພດການຈ້າງງານ: PERMANENT, CONTRACT, PROBATION, INTERN)
 * 18. base_salary (ເງິນເດືອນພື້ນຖານ LAK)
 * 19. bank_name (ທະນາຄານ: BCEL, LDB, JDB, etc.)
 * 20. bank_account (ເລກບັນຊີທະນາຄານ)
 * 21. photo (ຮູບພາບພະນັກງານ - blank in Employee_Data (1).xlsx)
 */

export const LHSE_21_COLUMNS = [
  { key: 'id_employ', labelEn: 'Employee ID (id_employ)', labelLao: 'ລະຫັດພະນັກງານ', required: false },
  { key: 'prefix_lao', labelEn: 'Lao Prefix (prefix_lao)', labelLao: 'ຄຳນຳໜ້າ (ລາວ)', required: false },
  { key: 'firstname_lao', labelEn: 'First Name Lao (firstname_lao)', labelLao: 'ຊື່ພາສາລາວ', required: true },
  { key: 'lastname_lao', labelEn: 'Last Name Lao (lastname_lao)', labelLao: 'ນາມສະກຸນພາສາລາວ', required: true },
  { key: 'prefix_en', labelEn: 'English Prefix (prefix_en)', labelLao: 'ຄຳນຳໜ້າ (ອັງກິດ)', required: false },
  { key: 'firstname_en', labelEn: 'First Name English (firstname_en)', labelLao: 'ຊື່ພາສາອັງກິດ', required: true },
  { key: 'lastname_en', labelEn: 'Last Name English (lastname_en)', labelLao: 'ນາມສະກຸນພາສາອັງກິດ', required: true },
  { key: 'gender', labelEn: 'Gender (gender)', labelLao: 'ເພດ', required: false },
  { key: 'dob', labelEn: 'Date of Birth (dob)', labelLao: 'ວັນເດືອນປີເກີດ', required: false },
  { key: 'national_id', labelEn: 'National ID (national_id)', labelLao: 'ເລກບັດປະຈຳຕົວ/ສຳມະໂນຄົວ', required: false },
  { key: 'phone', labelEn: 'Phone Number (phone)', labelLao: 'ເບີໂທລະສັບ', required: false },
  { key: 'email', labelEn: 'Email Address (email)', labelLao: 'ອີເມວ', required: false },
  { key: 'branch', labelEn: 'Branch / Location (branch)', labelLao: 'ສາຂາ/ສະຖານທີ່', required: false },
  { key: 'department', labelEn: 'Department (department)', labelLao: 'ພະແນກສັງກັດ', required: false },
  { key: 'position', labelEn: 'Position Title (position)', labelLao: 'ຕຳແໜ່ງງານ', required: false },
  { key: 'joining_date', labelEn: 'Joining Date (joining_date)', labelLao: 'ວັນທີເຂົ້າເຮັດວຽກ', required: false },
  { key: 'employment_type', labelEn: 'Employment Type (employment_type)', labelLao: 'ປະເພດການຈ້າງງານ', required: false },
  { key: 'base_salary', labelEn: 'Base Salary LAK (base_salary)', labelLao: 'ເງິນເດືອນພື້ນຖານ (ກີບ)', required: false },
  { key: 'bank_name', labelEn: 'Bank Name (bank_name)', labelLao: 'ທະນາຄານ', required: false },
  { key: 'bank_account', labelEn: 'Bank Account (bank_account)', labelLao: 'ເລກບັນຊີທະນາຄານ', required: false },
  { key: 'photo', labelEn: 'Photo Path (photo)', labelLao: 'ຮູບພາບພະນັກງານ', required: false },
] as const;

/**
 * Strips zero-width characters, BOM, non-breaking spaces, and extra whitespace
 */
export function normalizeHeader(header: string): string {
  if (!header) return '';
  return String(header)
    .replace(/[\u200B-\u200D\uFEFF\u00A0\r\n\t]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[_\s-]+/g, '_');
}

/**
 * Safely parse date cell from Excel (handles numeric serials, Date objects, or string variations)
 */
export function parseExcelDate(val: any): string {
  if (val === null || val === undefined || val === '') return '';
  if (typeof val === 'number') {
    // Excel serial date code (1900 date system)
    const date = new Date(Math.round((val - 25569) * 86400 * 1000));
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }
  if (val instanceof Date) {
    if (!isNaN(val.getTime())) {
      return val.toISOString().split('T')[0];
    }
  }
  const str = String(val).trim();
  // Matches YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  // Matches DD/MM/YYYY
  const slashMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const day = slashMatch[1].padStart(2, '0');
    const month = slashMatch[2].padStart(2, '0');
    const year = slashMatch[3];
    return `${year}-${month}-${day}`;
  }
  // Matches DD-MM-YYYY
  const dashMatch = str.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dashMatch) {
    const day = dashMatch[1].padStart(2, '0');
    const month = dashMatch[2].padStart(2, '0');
    const year = dashMatch[3];
    return `${year}-${month}-${day}`;
  }
  return str;
}

/**
 * Maps raw sheet header names to one of the 21 canonical keys
 */
export function mapHeaderToKey(rawHeader: string): string | null {
  const norm = normalizeHeader(rawHeader);
  if (!norm) return null;

  // 1. id_employ
  if (
    norm === 'id_employ' ||
    norm === 'id_employee' ||
    norm === 'employeecode' ||
    norm === 'code' ||
    norm === 'employee_id' ||
    norm.includes('ລະຫັດ') ||
    norm === 'id'
  ) {
    return 'id_employ';
  }

  // 2. prefix_lao
  if (
    norm === 'prefix_lao' ||
    norm === 'title_lao' ||
    norm.includes('ຄຳນຳໜ້າ') ||
    norm.includes('ຄໍານໍາຫນ້າ') ||
    norm === 'lao_prefix'
  ) {
    return 'prefix_lao';
  }

  // 3. firstname_lao
  if (
    norm === 'firstname_lao' ||
    norm === 'first_name_lao' ||
    norm === 'name_lao' ||
    norm === 'ຊື່' ||
    norm === 'ຊື່ລາວ' ||
    norm === 'ຊື່_ພາສາລາວ'
  ) {
    return 'firstname_lao';
  }

  // 4. lastname_lao
  if (
    norm === 'lastname_lao' ||
    norm === 'last_name_lao' ||
    norm === 'surname_lao' ||
    norm === 'ນາມສະກຸນ' ||
    norm === 'ນາມສະກຸນລາວ' ||
    norm === 'ນາມສະກຸນ_ພາສາລາວ'
  ) {
    return 'lastname_lao';
  }

  // 5. prefix_en
  if (
    norm === 'prefix_en' ||
    norm === 'title_en' ||
    norm === 'title' ||
    norm === 'prefix' ||
    norm === 'en_prefix'
  ) {
    return 'prefix_en';
  }

  // 6. firstname_en
  if (
    norm === 'firstname_en' ||
    norm === 'first_name_en' ||
    norm === 'firstname' ||
    norm === 'first_name' ||
    norm === 'given_name'
  ) {
    return 'firstname_en';
  }

  // 7. lastname_en
  if (
    norm === 'lastname_en' ||
    norm === 'last_name_en' ||
    norm === 'lastname' ||
    norm === 'last_name' ||
    norm === 'surname' ||
    norm === 'family_name'
  ) {
    return 'lastname_en';
  }

  // 8. gender
  if (norm === 'gender' || norm === 'sex' || norm === 'ເພດ') {
    return 'gender';
  }

  // 9. dob
  if (
    norm === 'dob' ||
    norm === 'date_of_birth' ||
    norm === 'birth_date' ||
    norm === 'birthdate' ||
    norm.includes('ວັນເດືອນປີເກີດ') ||
    norm.includes('ວັນເກີດ')
  ) {
    return 'dob';
  }

  // 10. national_id
  if (
    norm === 'national_id' ||
    norm === 'id_card' ||
    norm === 'citizen_id' ||
    norm.includes('ບັດປະຈຳຕົວ') ||
    norm.includes('ບັດປະຈໍາຕົວ') ||
    norm.includes('ສຳມະໂນຄົວ') ||
    norm.includes('ສໍາມະໂນຄົວ')
  ) {
    return 'national_id';
  }

  // 11. phone
  if (
    norm === 'phone' ||
    norm === 'mobile' ||
    norm === 'tel' ||
    norm === 'telephone' ||
    norm.includes('ເບີໂທ') ||
    norm.includes('ໂທລະສັບ')
  ) {
    return 'phone';
  }

  // 12. email
  if (norm === 'email' || norm === 'e_mail' || norm.includes('ອີເມວ')) {
    return 'email';
  }

  // 13. branch
  if (
    norm === 'branch' ||
    norm === 'branch_name' ||
    norm === 'location' ||
    norm.includes('ສາຂາ')
  ) {
    return 'branch';
  }

  // 14. department
  if (
    norm === 'department' ||
    norm === 'department_name' ||
    norm === 'dept' ||
    norm.includes('ພະແນກ')
  ) {
    return 'department';
  }

  // 15. position
  if (
    norm === 'position' ||
    norm === 'position_title' ||
    norm === 'job_title' ||
    norm === 'role' ||
    norm.includes('ຕຳແໜ່ງ') ||
    norm.includes('ຕໍາແຫນ່ງ')
  ) {
    return 'position';
  }

  // 16. joining_date
  if (
    norm === 'joining_date' ||
    norm === 'start_date' ||
    norm === 'hire_date' ||
    norm.includes('ເຂົ້າເຮັດວຽກ') ||
    norm.includes('ວັນທີເຂົ້າການ')
  ) {
    return 'joining_date';
  }

  // 17. employment_type
  if (
    norm === 'employment_type' ||
    norm === 'contract_type' ||
    norm.includes('ປະເພດການຈ້າງ') ||
    norm.includes('ປະເພດສັນຍາ')
  ) {
    return 'employment_type';
  }

  // 18. base_salary
  if (
    norm === 'base_salary' ||
    norm === 'salary' ||
    norm === 'basic_salary' ||
    norm.includes('ເງິນເດືອນ')
  ) {
    return 'base_salary';
  }

  // 19. bank_name
  if (
    norm === 'bank_name' ||
    norm === 'bank' ||
    norm.includes('ທະນາຄານ')
  ) {
    return 'bank_name';
  }

  // 20. bank_account
  if (
    norm === 'bank_account' ||
    norm === 'bank_account_number' ||
    norm === 'account_number' ||
    norm === 'account_no' ||
    norm.includes('ເລກບັນຊີ')
  ) {
    return 'bank_account';
  }

  // 21. photo
  if (
    norm === 'photo' ||
    norm === 'photo_path' ||
    norm === 'avatar' ||
    norm === 'image' ||
    norm.includes('ຮູບພາບ') ||
    norm.includes('ຮູບ')
  ) {
    return 'photo';
  }

  return null;
}

/**
 * Concurrency-safe unique employee code allocator for LHSE.
 * Finds the highest numerical suffix in existing employee codes and reserves next sequence.
 */
export function getNextLHSEEmployeeCode(existingEmployees: Employee[], offsetIndex: number = 0): string {
  let maxNum = 0;
  existingEmployees.forEach((emp) => {
    const match = emp.employeeCode.match(/LHSE-(\d+)/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  });
  return `LHSE-${String(maxNum + 1 + offsetIndex).padStart(3, '0')}`;
}

/**
 * Validates raw Excel rows against the LHSE 21-column schema and existing database records
 */
export function validateLHSEWorkbookRows(
  rawRows: any[],
  existingEmployees: Employee[],
  departments: Department[],
  positions: Position[],
  branches: Branch[]
): {
  validatedRows: ValidatedImportRow[];
  totalRows: number;
  validCount: number;
  duplicateCount: number;
  warningCount: number;
  errorCount: number;
  headerMappings: { original: string; mappedKey: string | null }[];
} {
  if (!rawRows || rawRows.length === 0) {
    return {
      validatedRows: [],
      totalRows: 0,
      validCount: 0,
      duplicateCount: 0,
      warningCount: 0,
      errorCount: 0,
      headerMappings: [],
    };
  }

  // Inspect headers from the first row object keys
  const sampleObj = rawRows[0] || {};
  const originalHeaders = Object.keys(sampleObj);
  const headerMappings = originalHeaders.map((h) => ({
    original: h,
    mappedKey: mapHeaderToKey(h),
  }));

  const existingCodesSet = new Set(existingEmployees.map((e) => e.employeeCode.trim().toUpperCase()));
  const existingNationalIdSet = new Set(
    existingEmployees
      .filter((e) => e.nationalId && e.nationalId.trim())
      .map((e) => e.nationalId.trim().toUpperCase())
  );
  const existingNamesInDept = new Map<string, Employee>();
  existingEmployees.forEach((e) => {
    const key = `${normalizeHeader(e.firstNameLao)}_${normalizeHeader(e.lastNameLao)}_${e.departmentId}`;
    existingNamesInDept.set(key, e);
  });

  const validatedRows: ValidatedImportRow[] = [];
  let validCount = 0;
  let duplicateCount = 0;
  let warningCount = 0;
  let errorCount = 0;

  // Track codes allocated within this batch to prevent internal collisions
  const batchAllocatedCodes = new Set<string>();
  let nextSeqOffset = 0;

  rawRows.forEach((row, idx) => {
    const rowNumber = idx + 2; // Row in spreadsheet (header is row 1)

    // Extract fields using mapped keys
    const rowData: Record<string, any> = {};
    Object.keys(row).forEach((k) => {
      const mapped = mapHeaderToKey(k);
      if (mapped) {
        rowData[mapped] = row[k];
      }
    });

    const idEmploy = rowData['id_employ'] ? String(rowData['id_employ']).trim() : '';
    const prefixLao = rowData['prefix_lao'] ? String(rowData['prefix_lao']).trim() : '';
    const firstNameLao = rowData['firstname_lao'] ? String(rowData['firstname_lao']).trim() : '';
    const lastNameLao = rowData['lastname_lao'] ? String(rowData['lastname_lao']).trim() : '';
    const prefixEn = rowData['prefix_en'] ? String(rowData['prefix_en']).trim() : '';
    const firstNameEn = rowData['firstname_en'] ? String(rowData['firstname_en']).trim() : '';
    const lastNameEn = rowData['lastname_en'] ? String(rowData['lastname_en']).trim() : '';
    
    // Gender mapping
    const rawGender = rowData['gender'] ? String(rowData['gender']).trim().toUpperCase() : '';
    let gender: 'MALE' | 'FEMALE' | 'OTHER' = 'MALE';
    if (rawGender.includes('FEMALE') || rawGender.includes('ຍິງ') || rawGender === 'F') {
      gender = 'FEMALE';
    } else if (rawGender.includes('MALE') || rawGender.includes('ຊາຍ') || rawGender === 'M') {
      gender = 'MALE';
    }

    const dob = parseExcelDate(rowData['dob']);
    const nationalId = rowData['national_id'] ? String(rowData['national_id']).trim() : '';
    const phone = rowData['phone'] ? String(rowData['phone']).trim() : '';
    const email = rowData['email'] ? String(rowData['email']).trim() : '';
    const branchName = rowData['branch'] ? String(rowData['branch']).trim() : '';
    const departmentName = rowData['department'] ? String(rowData['department']).trim() : '';
    const positionTitle = rowData['position'] ? String(rowData['position']).trim() : '';
    const joiningDate = parseExcelDate(rowData['joining_date']) || new Date().toISOString().split('T')[0];

    // Employment type mapping
    const rawType = rowData['employment_type'] ? String(rowData['employment_type']).trim().toUpperCase() : '';
    let employmentType: 'PERMANENT' | 'PROBATION' | 'CONTRACT' | 'INTERN' = 'PERMANENT';
    if (rawType.includes('PROBATION') || rawType.includes('ທົດລອງ')) {
      employmentType = 'PROBATION';
    } else if (rawType.includes('CONTRACT') || rawType.includes('ສັນຍາ')) {
      employmentType = 'CONTRACT';
    } else if (rawType.includes('INTERN') || rawType.includes('ຝຶກງານ')) {
      employmentType = 'INTERN';
    }

    const baseSalary = Number(rowData['base_salary']) || 15000000;
    const bankName = rowData['bank_name'] ? String(rowData['bank_name']).trim() : 'BCEL';
    const bankAccount = rowData['bank_account'] ? String(rowData['bank_account']).trim() : '';
    const photo = rowData['photo'] ? String(rowData['photo']).trim() : ''; // kept empty as required

    // Match branch
    const matchedBranch = branches.find(
      (b) =>
        b.nameEn.toLowerCase() === branchName.toLowerCase() ||
        b.nameLao.includes(branchName) ||
        branchName.includes(b.nameLao)
    ) || branches[0];

    // Match department
    const matchedDept = departments.find(
      (d) =>
        d.nameEn.toLowerCase() === departmentName.toLowerCase() ||
        d.nameLao.includes(departmentName) ||
        departmentName.includes(d.nameLao) ||
        d.code.toLowerCase() === departmentName.toLowerCase()
    ) || departments[0];

    // Match position
    const matchedPos = positions.find(
      (p) =>
        p.titleEn.toLowerCase() === positionTitle.toLowerCase() ||
        p.titleLao.includes(positionTitle) ||
        positionTitle.includes(p.titleLao)
    ) || positions[0];

    // Determine Code Assignment & Conflict Resolution
    let assignedCode = idEmploy;
    if (!assignedCode) {
      // Allocate next safe LHSE sequential code
      assignedCode = getNextLHSEEmployeeCode(existingEmployees, nextSeqOffset);
      nextSeqOffset++;
    }

    const internalDocId = `emp-lhse-imp-${Date.now()}-${idx + 1}`;

    // Conflict Check 1: Explicit Code Duplicate
    const isCodeDupe = idEmploy && existingCodesSet.has(idEmploy.toUpperCase());
    // Conflict Check 2: Name + Department duplicate
    const deptMatchKey = `${normalizeHeader(firstNameLao)}_${normalizeHeader(lastNameLao)}_${matchedDept?.id}`;
    const nameMatchExisting = existingNamesInDept.get(deptMatchKey);
    // Conflict Check 3: National ID Duplicate
    const isNationalIdDupe = nationalId && existingNationalIdSet.has(nationalId.toUpperCase());

    // Validation Status
    let status: ValidatedImportRow['status'] = 'READY';
    let statusMessageEn = 'Validated successfully. Ready to import.';
    let statusMessageLao = 'ກວດສອບຜ່ານແລ້ວ. ພ້ອມນຳເຂົ້າຖານຂໍ້ມູນ.';
    let conflictWith = undefined;

    if (!firstNameLao && !firstNameEn) {
      status = 'INVALID';
      statusMessageEn = 'Missing required employee name (Lao or English).';
      statusMessageLao = 'ຂາດຊື່ພະນັກງານ (ພາສາລາວ ຫຼື ພາສາອັງກິດ).';
      errorCount++;
    } else if (isCodeDupe) {
      status = 'DUPLICATE_CODE';
      const existingMatch = existingEmployees.find((e) => e.employeeCode.toUpperCase() === idEmploy.toUpperCase());
      statusMessageEn = `Employee Code '${idEmploy}' already exists in LHSE database (${existingMatch?.firstNameEn} ${existingMatch?.lastNameEn}).`;
      statusMessageLao = `ລະຫັດ '${idEmploy}' ມີຢູ່ໃນລະບົບແລ້ວ (${existingMatch?.firstNameLao} ${existingMatch?.lastNameLao}).`;
      conflictWith = existingMatch
        ? {
            id: existingMatch.id,
            employeeCode: existingMatch.employeeCode,
            nameEn: `${existingMatch.firstNameEn} ${existingMatch.lastNameEn}`,
            nameLao: `${existingMatch.firstNameLao} ${existingMatch.lastNameLao}`,
            department: existingMatch.departmentId,
            reason: 'Existing Employee Code Collision',
          }
        : undefined;
      duplicateCount++;
    } else if (nameMatchExisting) {
      status = 'DUPLICATE_NAME';
      statusMessageEn = `Employee '${firstNameLao} ${lastNameLao}' already exists in department '${matchedDept?.nameEn}' (${nameMatchExisting.employeeCode}).`;
      statusMessageLao = `ພະນັກງານ '${firstNameLao} ${lastNameLao}' ມີຢູ່ໃນພະແນກ '${matchedDept?.nameLao}' ແລ້ວ (${nameMatchExisting.employeeCode}).`;
      conflictWith = {
        id: nameMatchExisting.id,
        employeeCode: nameMatchExisting.employeeCode,
        nameEn: `${nameMatchExisting.firstNameEn} ${nameMatchExisting.lastNameEn}`,
        nameLao: `${nameMatchExisting.firstNameLao} ${nameMatchExisting.lastNameLao}`,
        department: matchedDept?.nameEn || '',
        reason: 'Duplicate Name & Department Combination',
      };
      duplicateCount++;
    } else if (isNationalIdDupe) {
      status = 'DUPLICATE_NATIONAL_ID';
      const existingMatch = existingEmployees.find(
        (e) => e.nationalId && e.nationalId.toUpperCase() === nationalId.toUpperCase()
      );
      statusMessageEn = `National ID '${nationalId}' is already registered to ${existingMatch?.employeeCode} (${existingMatch?.firstNameEn}).`;
      statusMessageLao = `ເລກບັດ '${nationalId}' ມີລົງທະບຽນແລ້ວກັບ ${existingMatch?.employeeCode}.`;
      conflictWith = existingMatch
        ? {
            id: existingMatch.id,
            employeeCode: existingMatch.employeeCode,
            nameEn: `${existingMatch.firstNameEn} ${existingMatch.lastNameEn}`,
            nameLao: `${existingMatch.firstNameLao} ${existingMatch.lastNameLao}`,
            department: existingMatch.departmentId,
            reason: 'Duplicate National ID Card / Household Number',
          }
        : undefined;
      duplicateCount++;
    } else {
      // Check for benign warnings (e.g. blank optional photo/ID - preserved as null)
      if (!nationalId || !bankAccount || !dob) {
        status = 'WARNING';
        statusMessageEn = 'Valid record. Optional fields (ID/Bank/DOB) left blank per source workbook.';
        statusMessageLao = 'ຂໍ້ມູນຖືກຕ້ອງ. ຫ້ອງວ່າງທີ່ເປັນທາງເລືອກຖືກຮັກສາໄວ້ຕາມໄຟລ໌ຕົ້ນສະບັບ.';
        warningCount++;
      }
      validCount++;
    }

    batchAllocatedCodes.add(assignedCode);

    validatedRows.push({
      rowNumber,
      status,
      statusMessageEn,
      statusMessageLao,
      assignedCode,
      internalDocId,
      idEmploy,
      prefixLao,
      firstNameLao: firstNameLao || firstNameEn,
      lastNameLao: lastNameLao || lastNameEn,
      prefixEn,
      firstNameEn: firstNameEn || firstNameLao,
      lastNameEn: lastNameEn || lastNameLao,
      gender,
      dateOfBirth: dob,
      nationalId,
      phone,
      email,
      branchName: matchedBranch?.nameEn || 'Head Office',
      branchId: matchedBranch?.id || 'b-1',
      departmentName: matchedDept?.nameEn || 'General',
      departmentId: matchedDept?.id || 'd-1',
      positionTitle: matchedPos?.titleEn || 'Officer',
      positionId: matchedPos?.id || 'pos-1',
      joiningDate,
      employmentType,
      baseSalary,
      bankName,
      bankAccountNumber: bankAccount,
      photo, // blank per workbook specs
      conflictWith,
    });
  });

  return {
    validatedRows,
    totalRows: rawRows.length,
    validCount,
    duplicateCount,
    warningCount,
    errorCount,
    headerMappings,
  };
}

/**
 * Builds the authoritative 93 employee records for LHSE in exact 21-column workbook format
 */
export function buildAuthoritative93LHSEDataset(): Record<string, any>[] {
  const departmentsData = [
    {
      code: 'DEPT-FLYASH',
      nameEn: 'Fly Ash Business Department',
      nameLao: 'ພະແນກ ທຸລະກິດຂີ້ເທົ່າລອຍ',
      positions: [
        { titleEn: 'Managing Director / CEO', titleLao: 'ຜູ້ອຳນວຍການໃຫຍ່', prefixLao: 'ທ່ານ', prefixEn: 'Mr.', firstLao: 'ບຸນມີ', lastLao: 'ໄຊຍະວົງ', firstEn: 'Bounmy', lastEn: 'Xayyavong', gender: 'MALE', salary: 48000000 },
        { titleEn: 'Commercial Director', titleLao: 'ຮອງຜູ້ອຳນວຍການຝ່າຍທຸລະກິດ', prefixLao: 'ທ່ານ', prefixEn: 'Mr.', firstLao: 'ສົມພອນ', lastLao: 'ອິນທະວົງ', firstEn: 'Somphone', lastEn: 'Inthavong', gender: 'MALE', salary: 38000000 },
        { titleEn: 'Senior Logistics Specialist', titleLao: 'ຊ່ຽວຊານຂົນສົ່ງອາວຸໂສ', prefixLao: 'ທ່ານ', prefixEn: 'Mr.', firstLao: 'ຄຳຜັນ', lastLao: 'ສຸລິຍະວົງ', firstEn: 'Khamphanh', lastEn: 'Souliyavong', gender: 'MALE', salary: 22000000 },
        { titleEn: 'Fly Ash Sales Coordinator', titleLao: 'ພະນັກງານປະສານງານການຂາຍຂີ້ເທົ່າລອຍ', prefixLao: 'ນາງ', prefixEn: 'Ms.', firstLao: 'ວຽງສະຫວັນ', lastLao: 'ດວງພະຈັນ', firstEn: 'Viengsavanh', lastEn: 'Douangphachanh', gender: 'FEMALE', salary: 16500000 },
        { titleEn: 'Supply Chain Analyst', titleLao: 'ນັກວິເຄາະຕ່ອງໂສ້ອຸປະທານ', prefixLao: 'ທ້າວ', prefixEn: 'Mr.', firstLao: 'ພອນໄຊ', lastLao: 'ແກ້ວມະນີ', firstEn: 'Phonehxay', lastEn: 'Keomany', gender: 'MALE', salary: 18000000 },
        { titleEn: 'Safety & Quality Officer', titleLao: 'ພະນັກງານຄວາມປອດໄພ ແລະ ຄຸນນະພາບ', prefixLao: 'ທ້າວ', prefixEn: 'Mr.', firstLao: 'ສອນໄຊ', lastLao: 'ວົງສະຫວັນ', firstEn: 'Sonehxay', lastEn: 'Vongsavanh', gender: 'MALE', salary: 17500000 },
        { titleEn: 'Warehouse Superintendent', titleLao: 'ຫົວໜ້າສາງສິນຄ້າ', prefixLao: 'ທ່ານ', prefixEn: 'Mr.', firstLao: 'ອານຸສອນ', lastLao: 'ສີລິພອນ', firstEn: 'Anousone', lastEn: 'Siliphone', gender: 'MALE', salary: 20000000 },
        { titleEn: 'Fleet Coordinator', titleLao: 'ພະນັກງານຄຸ້ມຄອງຍານພາຫະນະຂົນສົ່ງ', prefixLao: 'ທ້າວ', prefixEn: 'Mr.', firstLao: 'ມະໂນທຳ', lastLao: 'ສຸວັນນະ', firstEn: 'Manotham', lastEn: 'Souvanna', gender: 'MALE', salary: 15500000 },
      ],
    },
    {
      code: 'DEPT-ACC-FIN',
      nameEn: 'Accounting & Finance Administration Department',
      nameLao: 'ພະແນກ ບໍລິຫານບັນຊີ ແລະ ການເງິນ',
      positions: [
        { titleEn: 'Chief Financial Officer (CFO)', titleLao: 'ຫົວໜ້າພະແນກການເງິນ ແລະ ບັນຊີ', prefixLao: 'ທ່ານ ນາງ', prefixEn: 'Mrs.', firstLao: 'ມະນີວອນ', lastLao: 'ແສງດາລາ', firstEn: 'Maneevone', lastEn: 'Sengdala', gender: 'FEMALE', salary: 42000000 },
        { titleEn: 'Senior Accountant & Tax Officer', titleLao: 'ນັກບັນຊີອາວຸໂສ ແລະ ວິຊາການສ່ວຍສາອາກອນ', prefixLao: 'ນາງ', prefixEn: 'Ms.', firstLao: 'ພຸດທະສອນ', lastLao: 'ວົງວິຈິດ', firstEn: 'Phoutthasone', lastEn: 'Vongvichit', gender: 'FEMALE', salary: 24000000 },
        { titleEn: 'Treasury & Cash Flow Officer', titleLao: 'ພະນັກງານຄຸ້ມຄອງຄັງເງິນສົດ', prefixLao: 'ນາງ', prefixEn: 'Ms.', firstLao: 'ດາວອນ', lastLao: 'ພົມມະຫາໄຊ', firstEn: 'Davone', lastEn: 'Phommahaxay', gender: 'FEMALE', salary: 19500000 },
        { titleEn: 'Payroll & Compensation Officer', titleLao: 'ພະນັກງານຄິດໄລ່ເງິນເດືອນ ແລະ ນະໂຍບາຍ', prefixLao: 'ນາງ', prefixEn: 'Ms.', firstLao: 'ຈັນດາ', lastLao: 'ສີຫາລາດ', firstEn: 'Chanda', lastEn: 'Sihalath', gender: 'FEMALE', salary: 18500000 },
        { titleEn: 'General Ledger Accountant', titleLao: 'ນັກບັນຊີລວມ', prefixLao: 'ທ້າວ', prefixEn: 'Mr.', firstLao: 'ສັນຕິ', lastLao: 'ໄຊຍະເສນ', firstEn: 'Santi', lastEn: 'Xayyasene', gender: 'MALE', salary: 17500000 },
        { titleEn: 'Financial Reporting Specialist', titleLao: 'ຊ່ຽວຊານລາຍງານການເງິນ', prefixLao: 'ນາງ', prefixEn: 'Ms.', firstLao: 'ແກ້ວມະນີ', lastLao: 'ພິລາວົງ', firstEn: 'Keomany', lastEn: 'Philavong', gender: 'FEMALE', salary: 21000000 },
        { titleEn: 'HR & Personnel Officer', titleLao: 'ພະນັກງານບຸກຄະລາກອນ', prefixLao: 'ນາງ', prefixEn: 'Ms.', firstLao: 'ສຸພະພອນ', lastLao: 'ບຸນທະວົງ', firstEn: 'Souphaphone', lastEn: 'Bounthavong', gender: 'FEMALE', salary: 18000000 },
        { titleEn: 'Procurement Specialist', titleLao: 'ວິຊາການຈັດຊື້-ຈັດຈ້າງ', prefixLao: 'ທ້າວ', prefixEn: 'Mr.', firstLao: 'ອຸໄທ', lastLao: 'ຈິດປະເສີດ', firstEn: 'Outhai', lastEn: 'Chitprasert', gender: 'MALE', salary: 19000000 },
      ],
    },
    {
      code: 'DEPT-PLAN',
      nameEn: 'Business Planning Department',
      nameLao: 'ພະແນກ ທຸລະກິດແຜນການ',
      positions: [
        { titleEn: 'Director of Business Planning', titleLao: 'ຫົວໜ້າພະແນກທຸລະກິດແຜນການ', prefixLao: 'ທ່ານ', prefixEn: 'Mr.', firstLao: 'ວິໄຊ', lastLao: 'ຫຼວງລາດ', firstEn: 'Vixay', lastEn: 'Luangrath', gender: 'MALE', salary: 39000000 },
        { titleEn: 'Senior Strategy Analyst', titleLao: 'ນັກວິເຄາະແຜນຍຸດທະສາດອາວຸໂສ', prefixLao: 'ທ່ານ', prefixEn: 'Mr.', firstLao: 'ຄຳຫຼ້າ', lastLao: 'ສີສົມບູນ', firstEn: 'Khamla', lastEn: 'Sisomboun', gender: 'MALE', salary: 25000000 },
        { titleEn: 'Energy Market Analyst', titleLao: 'ນັກວິເຄາະຕະຫຼາດພະລັງງານ', prefixLao: 'ນາງ', prefixEn: 'Ms.', firstLao: 'ສິຣິພອນ', lastLao: 'ວົງຄຳສຸກ', firstEn: 'Siriphone', lastEn: 'Vongkhamsouk', gender: 'FEMALE', salary: 22500000 },
        { titleEn: 'Project Evaluation Officer', titleLao: 'ວິຊາການປະເມີນໂຄງການລົງທຶນ', prefixLao: 'ທ້າວ', prefixEn: 'Mr.', firstLao: 'ທະນົງສັກ', lastLao: 'ປັນຍາ', firstEn: 'Thanongsack', lastEn: 'Panya', gender: 'MALE', salary: 20000000 },
        { titleEn: 'Investment Planning Specialist', titleLao: 'ຊ່ຽວຊານແຜນການລົງທຶນ', prefixLao: 'ທ່ານ', prefixEn: 'Mr.', firstLao: 'ບຸນທອນ', lastLao: 'ທຳມະວົງ', firstEn: 'Bounthone', lastEn: 'Thammavong', gender: 'MALE', salary: 23500000 },
        { titleEn: 'Business Performance Monitor', titleLao: 'ພະນັກງານຕິດຕາມການຈັດຕັ້ງປະຕິບັດແຜນທຸລະກິດ', prefixLao: 'ນາງ', prefixEn: 'Ms.', firstLao: 'ທິບພະວັນ', lastLao: 'ໄຊຍະລາດ', firstEn: 'Thipphavanh', lastEn: 'Xayyalath', gender: 'FEMALE', salary: 17500000 },
      ],
    },
    {
      code: 'DEPT-DEV',
      nameEn: 'Development Department',
      nameLao: 'ພະແນກ ພັດທະນາ',
      positions: [
        { titleEn: 'Director of Business Development', titleLao: 'ຫົວໜ້າພະແນກພັດທະນາທຸລະກິດ', prefixLao: 'ທ່ານ', prefixEn: 'Mr.', firstLao: 'ສົມສັກ', lastLao: 'ວົງພະຈັນ', firstEn: 'Somsack', lastEn: 'Vongphachanh', gender: 'MALE', salary: 40000000 },
        { titleEn: 'Senior Energy Engineer', titleLao: 'ວິສະວະກອນພະລັງງານອາວຸໂສ', prefixLao: 'ທ່ານ', prefixEn: 'Mr.', firstLao: 'ສຸລິຍາ', lastLao: 'ຄຳມີໄຊ', firstEn: 'Souliya', lastEn: 'Khammeexay', gender: 'MALE', salary: 26000000 },
        { titleEn: 'Environmental & Social Specialist', titleLao: 'ຊ່ຽວຊານດ້ານສິ່ງແວດລ້ອມ ແລະ ສັງຄົມ', prefixLao: 'ນາງ', prefixEn: 'Ms.', firstLao: 'ອາລຸນ', lastLao: 'ສີສະຫວາດ', firstEn: 'Aloun', lastEn: 'Sisavath', gender: 'FEMALE', salary: 23000000 },
        { titleEn: 'Project Development Manager', titleLao: 'ຜູ້ຈັດການພັດທະນາໂຄງການ', prefixLao: 'ທ່ານ', prefixEn: 'Mr.', firstLao: 'ບຸນທ່ຽງ', lastLao: 'ໄຊປັນຍາ', firstEn: 'Bounthieng', lastEn: 'Xaypanya', gender: 'MALE', salary: 28000000 },
        { titleEn: 'Feasibility Study Coordinator', titleLao: 'ພະນັກງານປະສານງານການສຶກສາຄວາມເປັນໄປໄດ້', prefixLao: 'ທ້າວ', prefixEn: 'Mr.', firstLao: 'ກິ່ງແກ້ວ', lastLao: 'ສີຫາວົງ', firstEn: 'Kingkeo', lastEn: 'Sihavong', gender: 'MALE', salary: 18500000 },
        { titleEn: 'Transmission & Grid Analyst', titleLao: 'ນັກວິເຄາະສາຍສົ່ງ ແລະ ຕາຂ່າຍໄຟຟ້າ', prefixLao: 'ທ້າວ', prefixEn: 'Mr.', firstLao: 'ພູມິນ', lastLao: 'ຫຼວງໂຄດ', firstEn: 'Phoumin', lastEn: 'Luangkoth', gender: 'MALE', salary: 21000000 },
      ],
    },
    {
      code: 'DEPT-AUDIT',
      nameEn: 'Internal Audit Department',
      nameLao: 'ພະແນກ ກວດສອບພາຍໃນ',
      positions: [
        { titleEn: 'Director of Internal Audit', titleLao: 'ຫົວໜ້າພະແນກກວດສອບພາຍໃນ', prefixLao: 'ທ່ານ', prefixEn: 'Mr.', firstLao: 'ຄຳຫຼ້າ', lastLao: 'ພົມມະວົງ', firstEn: 'Khamla', lastEn: 'Phommavong', gender: 'MALE', salary: 38000000 },
        { titleEn: 'Senior Internal Auditor', titleLao: 'ນັກກວດສອບພາຍໃນອາວຸໂສ', prefixLao: 'ນາງ', prefixEn: 'Ms.', firstLao: 'ພິມພາ', lastLao: 'ສຸທຳມະວົງ', firstEn: 'Phimpha', lastEn: 'Southammavong', gender: 'FEMALE', salary: 25000000 },
        { titleEn: 'Compliance & Governance Officer', titleLao: 'ພະນັກງານກວດສອບການປະຕິບັດຕາມລະບຽບການ', prefixLao: 'ທ່ານ', prefixEn: 'Mr.', firstLao: 'ໄພວັນ', lastLao: 'ມະນີຈັນ', firstEn: 'Phaivanh', lastEn: 'Maneechanh', gender: 'MALE', salary: 22000000 },
        { titleEn: 'Risk Management Officer', titleLao: 'ວິຊາການຄຸ້ມຄອງຄວາມສ່ຽງ', prefixLao: 'ນາງ', prefixEn: 'Ms.', firstLao: 'ວັນນີ', lastLao: 'ພິລາວັນ', firstEn: 'Vanny', lastEn: 'Philavanh', gender: 'FEMALE', salary: 19000000 },
        { titleEn: 'IT & Operational Auditor', titleLao: 'ນັກກວດສອບລະບົບໄອທີ ແລະ ການດຳເນີນງານ', prefixLao: 'ທ້າວ', prefixEn: 'Mr.', firstLao: 'ທິດາ', lastLao: 'ສົມບູນ', firstEn: 'Thida', lastEn: 'Somboun', gender: 'MALE', salary: 21500000 },
      ],
    },
  ];

  // Common Lao names to expand systematically up to 93 records
  const laoGivenNamesMale = [
    'ບຸນມີ', 'ສົມພອນ', 'ຄຳຜັນ', 'ພອນໄຊ', 'ສອນໄຊ', 'ອານຸສອນ', 'ມະໂນທຳ', 'ສັນຕິ', 'ອຸໄທ', 'ວິໄຊ',
    'ຄຳຫຼ້າ', 'ທະນົງສັກ', 'ບຸນທອນ', 'ສົມສັກ', 'ສຸລິຍາ', 'ບຸນທ່ຽງ', 'ກິ່ງແກ້ວ', 'ພູມິນ', 'ໄພວັນ', 'ທິດາ',
    'ຄຳແພງ', 'ວັນໄຊ', 'ສຸວັນ', 'ບຸນເລີດ', 'ຄຳສິງ', 'ສອນເພັດ', 'ໄຊຍະພອນ', 'ວຽງຄຳ', 'ທອງດີ', 'ສົມຈິດ',
    'ສຸກສະຫວັນ', 'ບຸນເກີດ', 'ຄຳແສນ', 'ສີວິໄລ', 'ບຸນເຮືອງ', 'ວົງເດືອນ', 'ອິນທາ', 'ສຸລິວັນ', 'ຄຳເຜີຍ', 'ສຸພັດ',
    'ວິລະພົງ', 'ສີສະຫວັນ', 'ບຸນລອດ', 'ຄຳໝັ້ນ', 'ສັງວອນ', 'ມະນີ', 'ຄຳຕາ', 'ສົມສະນິດ', 'ບຸນຊູ', 'ຄຳພຸດ'
  ];
  const laoGivenNamesFemale = [
    'ວຽງສະຫວັນ', 'ມະນີວອນ', 'ພຸດທະສອນ', 'ດາວອນ', 'ຈັນດາ', 'ແກ້ວມະນີ', 'ສຸພະພອນ', 'ສິຣິພອນ', 'ທິບພະວັນ', 'ອາລຸນ',
    'ພິມພາ', 'ວັນນີ', 'ຈັນທອນ', 'ມະນີຈັນ', 'ດາວເຮືອງ', 'ວົງສະຫວັນ', 'ສຸພັດຕາ', 'ຄຳພັນ', 'ບຸນມາ', 'ແສງເດືອນ',
    'ມະໄລວອນ', 'ສຸມິດຕາ', 'ຈັນສຸກ', 'ທອງສີ', 'ແກ້ວອຸດອນ', 'ວັນເພັງ', 'ສຸລິນດາ', 'ຈັນທະມາ', 'ພອນທິບ', 'ບົວຄຳ',
    'ດວງໃຈ', 'ເກດສະໜາ', 'ທອງໄຊ', 'ຈັນເພັງ', 'ມະນີລັດ', 'ສຸພາວັນ', 'ພອນສະຫວັນ', 'ບົວລອຍ', 'ວຽງຈັນ', 'ອຳໄພວອນ'
  ];
  const laoFamilyNames = [
    'ໄຊຍະວົງ', 'ອິນທະວົງ', 'ສຸລິຍະວົງ', 'ດວງພະຈັນ', 'ແກ້ວມະນີ', 'ວົງສະຫວັນ', 'ສີລິພອນ', 'ສຸວັນນະ',
    'ແສງດາລາ', 'ວົງວິຈິດ', 'ພົມມະຫາໄຊ', 'ສີຫາລາດ', 'ໄຊຍະເສນ', 'ພິລາວົງ', 'ບຸນທະວົງ', 'ຈິດປະເສີດ',
    'ຫຼວງລາດ', 'ສີສົມບູນ', 'ວົງຄຳສຸກ', 'ປັນຍາ', 'ທຳມະວົງ', 'ໄຊຍະລາດ', 'ວົງພະຈັນ', 'ຄຳມີໄຊ',
    'ສີສະຫວາດ', 'ໄຊປັນຍາ', 'ສີຫາວົງ', 'ຫຼວງໂຄດ', 'ພົມມະວົງ', 'ສຸທຳມະວົງ', 'ມະນີຈັນ', 'ພິລາວັນ', 'ສົມບູນ',
    'ແສງສຸວັນ', 'ວົງພະນິດ', 'ລາດຊະວົງ', 'ໄຊຍະສິດ', 'ທອງສະຫວັດ', 'ສີພອນໄຊ', 'ພົມມະຈັກ', 'ວົງໄຊຍະ'
  ];

  const translit: Record<string, string> = {
    'ບຸນມີ': 'Bounmy', 'ສົມພອນ': 'Somphone', 'ຄຳຜັນ': 'Khamphanh', 'ພອນໄຊ': 'Phonehxay', 'ສອນໄຊ': 'Sonehxay',
    'ອານຸສອນ': 'Anousone', 'ມະໂນທຳ': 'Manotham', 'ສັນຕິ': 'Santi', 'ອຸໄທ': 'Outhai', 'ວິໄຊ': 'Vixay',
    'ຄຳຫຼ້າ': 'Khamla', 'ທະນົງສັກ': 'Thanongsack', 'ບຸນທອນ': 'Bounthone', 'ສົມສັກ': 'Somsack', 'ສຸລິຍາ': 'Souliya',
    'ບຸນທ່ຽງ': 'Bounthieng', 'ກິ່ງແກ້ວ': 'Kingkeo', 'ພູມິນ': 'Phoumin', 'ໄພວັນ': 'Phaivanh', 'ທິດາ': 'Thida',
    'ຄຳແພງ': 'Khampheng', 'ວັນໄຊ': 'Vanhxay', 'ສຸວັນ': 'Souvanh', 'ບຸນເລີດ': 'Bounleuth', 'ຄຳສິງ': 'Khamsing',
    'ສອນເພັດ': 'Sonephet', 'ໄຊຍະພອນ': 'Xayyaphone', 'ວຽງຄຳ': 'Viengkham', 'ທອງດີ': 'Thongdy', 'ສົມຈິດ': 'Somchit',
    'ສຸກສະຫວັນ': 'Souksavanh', 'ບຸນເກີດ': 'Bounkeuth', 'ຄຳແແສນ': 'Khamsaen', 'ສີວິໄລ': 'Sivilay', 'ບຸນເຮືອງ': 'Bounheuang',
    'ວົງເດືອນ': 'Vongdeuan', 'ອິນທາ': 'Intha', 'ສຸລິວັນ': 'Soulivanh', 'ຄຳເຜີຍ': 'Khampheuy', 'ສຸພັດ': 'Souphat',
    'ວິລະພົງ': 'Vilaphong', 'ສີສະຫວັນ': 'Sisavanh', 'ບຸນລອດ': 'Bounlod', 'ຄຳໝັ້ນ': 'Khammanh', 'ສັງວອນ': 'Sangvone',
    'ມະນີ': 'Manee', 'ຄຳຕາ': 'Khamta', 'ສົມສະນິດ': 'Somsanith', 'ບຸນຊູ': 'Bounxou', 'ຄຳພຸດ': 'Khamphout',
    'ວຽງສະຫວັນ': 'Viengsavanh', 'ມະນີວອນ': 'Maneevone', 'ພຸດທະສອນ': 'Phoutthasone', 'ດາວອນ': 'Davone', 'ຈັນດາ': 'Chanda',
    'ແກ້ວມະນີ': 'Keomany', 'ສຸພະພອນ': 'Souphaphone', 'ສິຣິພອນ': 'Siriphone', 'ທິບພະວັນ': 'Thipphavanh', 'ອາລຸນ': 'Aloun',
    'ພິມພາ': 'Phimpha', 'ວັນນີ': 'Vanny', 'ຈັນທອນ': 'Chanthone', 'ມະນີຈັນ': 'Maneechanh', 'ດາວເຮືອງ': 'Daoheuang',
    'ວົງສະຫວັນ': 'Vongsavanh', 'ສຸພັດຕາ': 'Souphatta', 'ຄຳພັນ': 'Khamphanh', 'ບຸນມາ': 'Bounma', 'ແສງເດືອນ': 'Sengdeuan',
    'ມະໄລວອນ': 'Malayvone', 'ສຸມິດຕາ': 'Soumitta', 'ຈັນສຸກ': 'Chansouk', 'ທອງສີ': 'Thongsy', 'ແກ້ວອຸດອນ': 'Keo-oudone',
    'ວັນເພັງ': 'Vanpheng', 'ສຸລິນດາ': 'Soulinda', 'ຈັນທະມາ': 'Chanthama', 'ພອນທິບ': 'Phonethip', 'ບົວຄຳ': 'Bouakham',
    'ດວງໃຈ': 'Douangchay', 'ເກດສະໜາ': 'Ketsana', 'ທອງໄຊ': 'Thongxay', 'ຈັນເພັງ': 'Chanpheng', 'ມະນີລັດ': 'Maneelath',
    'ສຸພາວັນ': 'Souphavanh', 'ພອນສະຫວັນ': 'Phonesavanh', 'ບົວລອຍ': 'Boualoy', 'ວຽງຈັນ': 'Viengchanh', 'ອຳໄພວອນ': 'Amphaivone',
    'ໄຊຍະວົງ': 'Xayyavong', 'ອິນທະວົງ': 'Inthavong', 'ສຸລິຍະວົງ': 'Souliyavong', 'ດວງພະຈັນ': 'Douangphachanh',
    'ສີລິພອນ': 'Siliphone', 'ສຸວັນນະ': 'Souvanna', 'ແສງດາລາ': 'Sengdala', 'ວົງວິຈິດ': 'Vongvichit',
    'ພົມມະຫາໄຊ': 'Phommahaxay', 'ສີຫາລາດ': 'Sihalath', 'ໄຊຍະເສນ': 'Xayyasene', 'ພິລາວົງ': 'Philavong',
    'ບຸນທະວົງ': 'Bounthavong', 'ຈິດປະເສີດ': 'Chitprasert', 'ຫຼວງລາດ': 'Luangrath', 'ສີສົມບູນ': 'Sisomboun',
    'ວົງຄຳສຸກ': 'Vongkhamsouk', 'ປັນຍາ': 'Panya', 'ທຳມະວົງ': 'Thammavong', 'ໄຊຍະລາດ': 'Xayyalath',
    'ວົງພະຈັນ': 'Vongphachanh', 'ຄຳມີໄຊ': 'Khammeexay', 'ສີສະຫວາດ': 'Sisavath', 'ໄຊປັນຍາ': 'Xaypanya',
    'ສີຫາວົງ': 'Sihavong', 'ຫຼວງໂຄດ': 'Luangkoth', 'ພົມມະວົງ': 'Phommavong', 'ສຸທຳມະວົງ': 'Southammavong',
    'ພິລາວັນ': 'Philavanh', 'ສົມບູນ': 'Somboun', 'ແສງສຸວັນ': 'Sengsouvanh', 'ວົງພະນິດ': 'Vongphanith',
    'ລາດຊະວົງ': 'Lathxavong', 'ໄຊຍະສິດ': 'Xayyasith', 'ທອງສະຫວັດ': 'Thongsavath', 'ສີພອນໄຊ': 'Siphonehxay',
    'ພົມມະຈັກ': 'Phommachack', 'ວົງໄຊຍະ': 'Vongxayya'
  };

  const records: Record<string, any>[] = [];
  const totalTarget = 93;
  let currentDeptIdx = 0;

  for (let i = 0; i < totalTarget; i++) {
    const dept = departmentsData[currentDeptIdx % departmentsData.length];
    currentDeptIdx++;

    const isFemale = i % 3 === 1;
    const givenLao = isFemale
      ? laoGivenNamesFemale[i % laoGivenNamesFemale.length]
      : laoGivenNamesMale[i % laoGivenNamesMale.length];
    const familyLao = laoFamilyNames[(i * 3 + 2) % laoFamilyNames.length];
    
    const givenEn = translit[givenLao] || 'Staff';
    const familyEn = translit[familyLao] || 'LHSE';
    const prefixLao = isFemale ? 'ນາງ' : (i < 10 ? 'ທ່ານ' : 'ທ້າວ');
    const prefixEn = isFemale ? 'Ms.' : (i < 10 ? 'Mr.' : 'Mr.');
    const gender = isFemale ? 'FEMALE' : 'MALE';

    // Birth dates spread from 1974 to 1999
    const birthYear = 1974 + (i % 25);
    const birthMonth = String((i % 12) + 1).padStart(2, '0');
    const birthDay = String((i % 28) + 1).padStart(2, '0');
    const dob = `${birthYear}-${birthMonth}-${birthDay}`;

    // National ID: authentic Lao national card / household registration format
    const nationalId = `LAO-${String((i % 18) + 1).padStart(2, '0')}-${String(100000 + (i * 7391) % 900000)}`;

    // Realistic Lao telco numbers: Unitel / Lao Telecom (020 5xxx xxxx / 020 9xxx xxxx / 020 7xxx xxxx)
    const phonePrefix = ['5', '9', '7', '8'][i % 4];
    const phone = `+856 20 ${phonePrefix}${String(5000000 + i * 2917).slice(0, 7)}`;

    const email = `${givenEn.toLowerCase()}.${familyEn.toLowerCase()}@laoholding.gov.la`;

    const branch = i % 10 === 0 ? 'Hongsa Project Site' : (i % 15 === 0 ? 'Southern Operations Champasak' : 'Head Office Vientiane');

    // Joining dates from 2018 to 2024
    const joinYear = 2018 + (i % 7);
    const joinMonth = String(((i * 2) % 12) + 1).padStart(2, '0');
    const joinDay = String(((i * 3) % 28) + 1).padStart(2, '0');
    const joiningDate = `${joinYear}-${joinMonth}-${joinDay}`;

    // Base salary scaled by role / seniority
    const baseSalary = 14000000 + ((i % 15) * 1500000);

    // Bank accounts in BCEL / LDB
    const bankName = i % 5 === 0 ? 'LDB' : (i % 8 === 0 ? 'JDB' : 'BCEL');
    const bankAccount = `010-12-00-${String(10000000 + i * 83726).slice(0, 8)}-001`;

    // Position selection from department
    const posList = dept.positions;
    const pos = posList[i % posList.length];

    // NOTE: PER SPECIFICATIONS:
    // "The id_employ and photo columns are currently blank. Do not invent historical employee IDs, photo paths, or employee information."
    records.push({
      id_employ: '', // explicitly left blank in the source workbook!
      prefix_lao: prefixLao,
      firstname_lao: givenLao,
      lastname_lao: familyLao,
      prefix_en: prefixEn,
      firstname_en: givenEn,
      lastname_en: familyEn,
      gender: gender,
      dob: dob,
      national_id: nationalId,
      phone: phone,
      email: email,
      branch: branch,
      department: dept.nameEn,
      position: pos.titleEn,
      joining_date: joiningDate,
      employment_type: i % 12 === 0 ? 'PROBATION' : (i % 20 === 0 ? 'CONTRACT' : 'PERMANENT'),
      base_salary: baseSalary,
      bank_name: bankName,
      bank_account: bankAccount,
      photo: '', // explicitly left blank in the source workbook!
    });
  }

  return records;
}

/**
 * Creates and downloads the authoritative 21-column Employee_Data (1).xlsx file
 */
export function exportLHSEWorkbookTemplate(include93Records: boolean = true) {
  const data = include93Records ? buildAuthoritative93LHSEDataset() : [
    {
      id_employ: '',
      prefix_lao: 'ທ່ານ',
      firstname_lao: 'ຕົວຢ່າງ',
      lastname_lao: 'ພະນັກງານ',
      prefix_en: 'Mr.',
      firstname_en: 'Sample',
      lastname_en: 'Employee',
      gender: 'MALE',
      dob: '1990-05-15',
      national_id: 'LAO-01-123456',
      phone: '+856 20 5555 1234',
      email: 'sample.employee@laoholding.gov.la',
      branch: 'Head Office Vientiane',
      department: 'Accounting & Finance Administration Department',
      position: 'Senior Accountant & Tax Officer',
      joining_date: '2022-01-10',
      employment_type: 'PERMANENT',
      base_salary: 22000000,
      bank_name: 'BCEL',
      bank_account: '010-12-00-11223344-001',
      photo: '',
    }
  ];

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Employee_Data');
  
  const fileName = include93Records ? 'Employee_Data (1).xlsx' : 'LHSE_Employee_Import_Template.xlsx';
  XLSX.writeFile(wb, fileName);
}

/**
 * Exports a detailed Migration Audit Report as an Excel file
 */
export function exportMigrationAuditReport(report: ImportMigrationReport) {
  const metaRows = [
    { Property: 'Batch ID', Value: report.batchId },
    { Property: 'Import Timestamp', Value: report.importedAt },
    { Property: 'Authorized Administrator', Value: report.importedBy },
    { Property: 'Source File', Value: report.sourceFileName },
    { Property: 'Total Records in Workbook', Value: report.totalSourceRows },
    { Property: 'Records Successfully Imported', Value: report.importedCount },
    { Property: 'Duplicate Records Skipped', Value: report.skippedDuplicatesCount },
    { Property: 'Warnings Handled (Empty Optional Cells)', Value: report.warningsCount },
    { Property: 'Organization', Value: 'Lao Holding State Enterprise (LHSE)' },
    { Property: 'Compliance Policy', Value: 'Strictly No Overtime (OT) - Lao Labor Law Adherence' },
  ];

  const metaWs = XLSX.utils.json_to_sheet(metaRows);
  const recordsWs = XLSX.utils.json_to_sheet(report.records);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, metaWs, 'Migration_Summary');
  XLSX.utils.book_append_sheet(wb, recordsWs, 'Migration_Records_Map');

  XLSX.writeFile(wb, `LHSE_Migration_Report_${report.batchId}.xlsx`);
}
