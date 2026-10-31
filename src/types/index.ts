export type Role = 'SUPER_ADMIN' | 'HR_ADMIN' | 'EXECUTIVE' | 'DEPT_HEAD' | 'EMPLOYEE';

export type Language = 'lo' | 'en';
export type Theme = 'light' | 'dark';

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  fullNameLao: string;
  role: Role;
  employeeId?: string;
  departmentId?: string;
  branchId?: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  customPermissions?: string[];
  password?: string;
}

export interface Branch {
  id: string;
  code: string;
  nameEn: string;
  nameLao: string;
  location: string;
  managerName?: string;
  phone?: string;
  isActive: boolean;
  headcount: number;
}

export interface Department {
  id: string;
  branchId: string;
  code: string;
  nameEn: string;
  nameLao: string;
  headEmployeeId?: string;
  headName?: string;
  budget?: number;
  isActive: boolean;
  headcount: number;
}

export interface Position {
  id: string;
  departmentId: string;
  titleEn: string;
  titleLao: string;
  level: string; // Executive, Senior, Junior, Officer
  baseSalaryMin: number;
  baseSalaryMax: number;
  isActive: boolean;
}

export interface Employee {
  id: string;
  employeeCode: string; // LHSE-XXXX
  prefixLao?: string; // ຄຳນຳໜ້າ (ທ້າວ, ນາງ, ທ່ານ)
  firstNameEn: string;
  lastNameEn: string;
  prefixEn?: string; // Title (Mr., Ms., Mrs., Dr.)
  firstNameLao: string;
  lastNameLao: string;
  email: string;
  phone: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dateOfBirth: string;
  nationalId: string;
  branchId: string;
  departmentId: string;
  positionId: string;
  reportingToId?: string;
  joiningDate: string;
  contractEndDate?: string; // YYYY-MM-DD for fixed-term contract or probation expiry
  employmentType: 'PERMANENT' | 'PROBATION' | 'CONTRACT' | 'INTERN';
  status: 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED' | 'RESIGNED' | 'TERMINATED';
  baseSalary: number; // in LAK
  bankName?: string;
  bankAccountNumber?: string;
  avatarUrl?: string; // photo path / URL (empty by default)
  address?: string;
  education?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  // 21-Column LHSE Personnel & Education Fields (ປື້ມຄຸ້ມຄອງພະນັກງານ-ລັດຖະກອນ)
  ethnicity?: string; // ຊົນເຜົ່າ (ລາວ, ໄຕ, ລະເມດ, ...)
  religion?: string; // ສາສະໜາ (ພຸດ, ...)
  educationLevel?: string; // ລະດັບການສຶກສາສາມັນ (ມ.6, ມ.3, ປ.5)
  specialization?: string; // ວິຊາສະເພາະ (ປະລິນຍາໂທ, ປະລິນຍາຕີ, ຊັ້ນສູງ, ຊັ້ນກາງ)
  politicalTheory?: string; // ທິດສະດີການເມືອງ (45 ວັນ, ຊັ້ນຕົ້ນ, ຊັ້ນກາງ, ຊັ້ນສູງ)
  passportNumber?: string; // Passport
  socialSecurityNumber?: string; // ບັດປະກັນສັງຄົມ
  partyCardNumber?: string; // ບັດສະມາຊິກພັກ
  unitName?: string; // ໜ່ວຍງານ
  // Organizational & Mass Affiliations (ເຂົ້າສັງກັດການຈັດຕັ້ງ)
  orgAffiliationDate?: string; // ວັນທີເຂົ້າສັງກັດການຈັດຕັ້ງ / ລັດ
  tradeUnionMember?: boolean; // ສະມາຊິກກຳມະບານ
  tradeUnionDate?: string; // ວັນທີເຂົ້າກຳມະບານ
  youthUnionMember?: boolean; // ສະມາຊິກຊາວໜຸ່ມ ປປລ
  youthUnionDate?: string; // ວັນທີເຂົ້າຊາວໜຸ່ມ
  womenUnionMember?: boolean; // ສະມາຊິກແມ່ຍິງ
  womenUnionDate?: string; // ວັນທີເຂົ້າແມ່ຍິງ
  partyMemberStatus?: 'NONE' | 'PROGRESSIVE' | 'CANDIDATE' | 'FULL'; // ສະຖານະ: ມະຫາຊົນ / ກ້າວໜ້າ / ສຳຮອງ / ສົມບູນ
  partyCandidateDate?: string; // ວັນທີເຂົ້າພັກສຳຮອງ
  partyFullDate?: string; // ວັນທີເຂົ້າພັກສົມບູນ
  partyUnitName?: string; // ໜ່ວຍພັກ / ໜ່ວຍງານສັງກັດ
  massOrgPosition?: string; // ຕຳແໜ່ງໃນການຈັດຕັ້ງມະຫາຊົນ
  // Migration & Import Audit Metadata
  importedAt?: string;
  migrationBatchId?: string;
  sourceRowNumber?: number;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  checkIn?: string; // HH:mm
  checkOut?: string; // HH:mm
  status: 'PRESENT' | 'LATE' | 'EARLY_DEPARTURE' | 'ABSENT' | 'ON_LEAVE' | 'HOLIDAY';
  durationMinutes: number;
  source: 'MANUAL' | 'BIOMETRIC_SCANNER' | 'MOBILE_APP' | 'MOBILE_GPS';
  notes?: string;
}

export interface AttendanceCorrectionRequest {
  id: string;
  employeeId: string;
  date: string;
  requestedCheckIn: string;
  requestedCheckOut: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'RETURNED';
  approverId?: string;
  approverComments?: string;
  createdAt: string;
}

export interface Shift {
  id: string;
  nameEn: string;
  nameLao: string;
  startTime: string; // 08:00
  endTime: string; // 17:00
  breakStart: string; // 12:00
  breakEnd: string; // 13:00
  color: string;
  isDefault: boolean;
}

export interface Holiday {
  id: string;
  date: string;
  nameEn: string;
  nameLao: string;
  isRecurring: boolean;
}

export interface LeaveType {
  id: string;
  nameEn: string;
  nameLao: string;
  daysAllowed: number;
  requiresDocument: boolean;
  isPaid: boolean;
  color: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'RETURNED' | 'CANCELLED';
  currentStep: number;
  totalSteps: number;
  assignedApproverId?: string;
  approverComments?: string;
  attachmentUrl?: string;
  createdAt: string;
  approvedAt?: string;
}

export interface LeaveBalance {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  year: number;
  allocated: number;
  used: number;
  remaining: number;
}

export interface PayrollPeriod {
  id: string;
  code: string; // 2026-10
  startDate: string;
  endDate: string;
  paymentDate: string;
  status: 'DRAFT' | 'REVIEW' | 'APPROVED' | 'PAID' | 'LOCKED';
  totalGrossSalary: number;
  totalSocialSecurity: number;
  totalIncomeTax: number;
  totalNetPay: number;
  employeeCount: number;
}

export interface Payslip {
  id: string;
  payrollPeriodId: string;
  employeeId: string;
  baseSalary: number;
  allowances: number;
  grossSalary: number;
  socialSecurityEmployee: number; // 5.5% LSSO up to ceiling
  socialSecurityEmployer: number; // 6.0% LSSO
  taxableIncome: number;
  personalIncomeTax: number; // Lao tax progressive brackets
  otherDeductions: number;
  netPay: number;
  paymentStatus: 'UNPAID' | 'PAID';
  bankAccountMasked?: string;
  calculatedAt: string;
}

export interface DisciplinaryCase {
  id: string;
  caseNumber: string;
  employeeId: string;
  incidentDate: string;
  category: 'ATTENDANCE' | 'MISCONDUCT' | 'POLICY_VIOLATION' | 'CONFIDENTIALITY' | 'OTHER';
  severity: 'VERBAL_WARNING' | 'FIRST_WRITTEN_WARNING' | 'SECOND_WRITTEN_WARNING' | 'FINAL_WARNING' | 'SUSPENSION' | 'TERMINATION';
  description: string;
  actionTaken: string;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';
  issuedBy: string;
  isConfidential: boolean;
  createdAt: string;
}

export interface ExpenseClaim {
  id: string;
  claimNumber: string;
  employeeId: string;
  title: string;
  category: 'TRAVEL' | 'SUPPLIES' | 'MEALS' | 'REPRESENTATION' | 'OTHER';
  totalAmount: number; // in LAK
  currency: string;
  receiptsCount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'RETURNED';
  approverId?: string;
  approverComments?: string;
  createdAt: string;
}

export interface PerformanceEvaluation {
  id: string;
  employeeId: string;
  evaluatorId: string;
  period: string; // e.g., 'Q3 2026' or 'Annual 2026'
  score: number; // 0 - 100
  grade: 'A' | 'B' | 'C' | 'D';
  strengths: string;
  areasToImprove: string;
  goals: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED';
  createdAt: string;
}

export type KPICategory = 'OPERATIONAL' | 'FINANCIAL' | 'CUSTOMER_SERVICE' | 'QUALITY' | 'INNOVATION';
export type KPIStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'ON_TRACK' | 'AT_RISK' | 'COMPLETED';

export interface KPISubGoal {
  id: string;
  title: string;
  titleLao?: string;
  targetValue: number;
  currentValue: number;
  unit?: string;
  weight?: number;
  completed: boolean;
}

export interface EmployeeKPI {
  id: string;
  employeeId: string;
  title: string;
  titleLao?: string;
  description?: string;
  category: KPICategory;
  targetValue: number;
  currentValue: number;
  unit: string; // '%', 'LAK', 'Projects', 'Tasks', 'Contracts', 'Days', etc.
  weight: number; // weighting percentage, e.g. 20 (%)
  period: string; // e.g. 'Q4 2026'
  status: KPIStatus;
  assignedBy: string;
  assignedDate: string;
  dueDate: string;
  lastUpdated?: string;
  managerFeedback?: string;
  subGoals?: KPISubGoal[];
}

export interface TrainingCourse {
  id: string;
  titleEn: string;
  titleLao: string;
  provider: string;
  startDate: string;
  endDate: string;
  location: string;
  capacity: number;
  enrolledCount: number;
  status: 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED';
}

export interface RecruitmentRequisition {
  id: string;
  reqNumber: string;
  departmentId: string;
  positionTitle: string;
  vacanciesCount: number;
  minExperienceYears: number;
  budgetSalary: number;
  status: 'DRAFT' | 'OPEN' | 'IN_INTERVIEW' | 'FILLED' | 'CLOSED';
  deadline: string;
}

export interface Candidate {
  id: string;
  requisitionId: string;
  fullName: string;
  email: string;
  phone: string;
  stage: 'APPLIED' | 'SCREENING' | 'INTERVIEW' | 'OFFERED' | 'HIRED' | 'REJECTED';
  interviewDate?: string;
  notes?: string;
  rating?: number;
  appliedDate: string;
}

export interface ApprovalRequest {
  id: string;
  type: 'LEAVE' | 'EXPENSE' | 'ATTENDANCE_CORRECTION' | 'INFO_UPDATE' | 'RECRUITMENT' | 'PAYROLL';
  referenceId: string;
  title: string;
  requesterId: string;
  requesterName: string;
  departmentName: string;
  amountOrDays?: string;
  currentStep: number;
  totalSteps: number;
  assignedApproverRole: Role;
  assignedApproverId?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'RETURNED';
  createdAt: string;
  history: {
    actorName: string;
    actorRole: Role;
    action: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'RETURNED';
    comments?: string;
    timestamp: string;
  }[];
}

export interface Asset {
  id: string;
  assetTag: string; // LHSE-AST-XXXX
  name: string;
  category: 'LAPTOP' | 'MONITOR' | 'VEHICLE' | 'PHONE' | 'OFFICE_EQUIPMENT';
  model: string;
  serialNumber: string;
  assignedEmployeeId?: string;
  assignmentDate?: string;
  status: 'AVAILABLE' | 'ASSIGNED' | 'IN_REPAIR' | 'RETIRED';
}

export interface Announcement {
  id: string;
  titleLao: string;
  titleEn: string;
  contentLao: string;
  contentEn: string;
  category: 'COMPANY_NEWS' | 'HOLIDAY' | 'POLICY' | 'EVENT';
  isImportant: boolean;
  publishedBy: string;
  publishedAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  titleLao: string;
  titleEn: string;
  messageLao: string;
  messageEn: string;
  type: 'APPROVAL' | 'LEAVE' | 'PAYROLL' | 'ANNOUNCEMENT' | 'DISCIPLINE' | 'SYSTEM' | 'CONTRACT';
  isRead: boolean;
  linkUrl?: string;
  createdAt: string;
}

export type HRDomainType =
  | 'ALL'
  | 'PERSONNEL'
  | 'PAYROLL'
  | 'TIME_LEAVE'
  | 'DISCIPLINE'
  | 'SECURITY'
  | 'COMPLIANCE';

export type AuditActionType =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'APPROVE'
  | 'REJECT'
  | 'SYSTEM'
  | 'AUDIT_INSPECTION'
  | 'SECURITY';

export interface AuditChange {
  field: string;
  fieldLabelLao?: string;
  fieldLabelEn?: string;
  oldValue?: any;
  newValue?: any;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: Role;
  action: string;
  actionType: AuditActionType;
  module: string;
  entityType?: string;
  entityName?: string;
  recordId?: string;
  details: string;
  changes?: AuditChange[];
  status?: 'SUCCESS' | 'FAILURE';
  ipAddress: string;
  userAgent?: string;
  timestamp: string;
  hrDomain?: HRDomainType;
  hashSeal?: string;
  complianceRef?: string;
}

export interface OrgProfile {
  companyNameEn: string;
  companyNameLao: string;
  ministryEn?: string;
  ministryLao?: string;
  logoUrl?: string;
  taxId: string;
  enterpriseRegistrationNo: string;
  addressEn: string;
  addressLao: string;
  phone: string;
  email: string;
  website: string;
  directorGeneralEn: string;
  directorGeneralLao: string;
  totalCapitalLAK: number;
  primaryBank: string;
  primaryAccountNumber: string;
}

export type ShiftTemplateCategory = 'MORNING' | 'AFTERNOON' | 'NIGHT' | 'WEEKEND' | 'GENERAL';
export type TaskPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface ShiftTemplate {
  id: string;
  nameEn: string;
  nameLao: string;
  category: ShiftTemplateCategory;
  startTime: string; // "08:00"
  endTime: string;   // "17:00"
  breakMinutes: number; // e.g. 60
  durationHours: number; // e.g. 8.0
  color: string;
  isDefault?: boolean;
  departmentId?: string;
  descriptionEn?: string;
  descriptionLao?: string;
  priority?: TaskPriority;
}

export type ShiftStatus = 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface ShiftAssignment {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  templateId?: string;
  shiftTitleEn: string;
  shiftTitleLao: string;
  startTime: string; // "08:00"
  endTime: string;   // "17:00"
  breakMinutes: number;
  durationHours: number;
  color: string;
  status: ShiftStatus;
  priority?: TaskPriority;
  notes?: string;
  assignedBy?: string;
  assignedAt?: string;
}

export type ShiftConflictType = 'OVERLAPPING_SHIFT' | 'WEEKLY_HOURS_EXCEEDED';

export interface ShiftConflict {
  id: string;
  type: ShiftConflictType;
  severity: 'error' | 'warning';
  employeeId: string;
  date: string;
  shiftAssignmentId: string;
  conflictingAssignmentId?: string;
  titleEn: string;
  titleLao: string;
  detailsEn: string;
  detailsLao: string;
  calculatedTotalHours?: number;
  maxAllowedHours?: number;
}

export type DocumentCategory = 'CONTRACT' | 'POLICY' | 'PROCEDURE' | 'HR_TEMPLATE' | 'LEGAL' | 'FINANCIAL';
export type DocumentStatus = 'ACTIVE' | 'DRAFT' | 'ARCHIVED' | 'IN_REVIEW';
export type VersionChangeType = 'MAJOR' | 'MINOR' | 'PATCH' | 'RESTORE';

export interface DocumentVersion {
  id: string;
  documentId: string;
  version: string;
  title: string;
  titleLao: string;
  content: string;
  changeSummary: string;
  changeType: VersionChangeType;
  changedBy: string;
  changedByRole: string;
  changedAt: string;
  fileSize: string;
  status: 'ACTIVE' | 'SUPERSEDED' | 'RESTORED';
  restoredFromVersion?: string;
  isScanned?: boolean;
  scannedImageUrl?: string;
  scannedPages?: string[];
}

export interface EnterpriseDocument {
  id: string;
  docNumber: string;
  title: string;
  titleLao: string;
  category: DocumentCategory;
  description: string;
  descriptionLao: string;
  departmentId: string;
  currentVersion: string;
  content: string;
  fileType: 'DOCX' | 'PDF' | 'MARKDOWN';
  fileSize: string;
  status: DocumentStatus;
  lastModifiedAt: string;
  lastModifiedBy: string;
  lastModifiedByRole?: string;
  versions: DocumentVersion[];
  tags: string[];
  isScanned?: boolean;
  scannedImageUrl?: string;
  scannedPages?: string[];
  employeeId?: string;
  extractedMetadata?: {
    employeeName?: string;
    employeeCode?: string;
    effectiveDate?: string;
    expirationDate?: string;
    salaryAmount?: string;
    officialStampDetected?: boolean;
    ocrConfidence?: number;
    docClassification?: string;
  };
}

export type ImportRowStatus = 'READY' | 'DUPLICATE_CODE' | 'DUPLICATE_NAME' | 'DUPLICATE_NATIONAL_ID' | 'INVALID' | 'WARNING';

export interface ValidatedImportRow {
  rowNumber: number;
  status: ImportRowStatus;
  statusMessageEn: string;
  statusMessageLao: string;
  assignedCode: string;
  internalDocId: string;
  // 21 columns
  idEmploy: string; // from raw source
  prefixLao: string;
  firstNameLao: string;
  lastNameLao: string;
  prefixEn: string;
  firstNameEn: string;
  lastNameEn: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dateOfBirth: string;
  nationalId: string;
  phone: string;
  email: string;
  branchName: string;
  branchId: string;
  departmentName: string;
  departmentId: string;
  positionTitle: string;
  positionId: string;
  joiningDate: string;
  employmentType: 'PERMANENT' | 'PROBATION' | 'CONTRACT' | 'INTERN';
  baseSalary: number;
  bankName: string;
  bankAccountNumber: string;
  photo: string;
  education?: string;
  // Conflict details
  conflictWith?: {
    id: string;
    employeeCode: string;
    nameEn: string;
    nameLao: string;
    department: string;
    reason: string;
  };
}

export interface ImportMigrationReport {
  batchId: string;
  importedAt: string;
  importedBy: string;
  sourceFileName: string;
  totalSourceRows: number;
  importedCount: number;
  skippedDuplicatesCount: number;
  warningsCount: number;
  records: {
    rowNumber: number;
    employeeCode: string;
    internalDocId: string;
    fullNameLao: string;
    fullNameEn: string;
    department: string;
    position: string;
    status: 'IMPORTED' | 'SKIPPED';
    notes: string;
  }[];
}

