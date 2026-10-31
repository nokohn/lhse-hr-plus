import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  Role,
  Language,
  Theme,
  Employee,
  Branch,
  Department,
  Position,
  AttendanceRecord,
  Shift,
  Holiday,
  LeaveType,
  LeaveRequest,
  LeaveBalance,
  PayrollPeriod,
  Payslip,
  DisciplinaryCase,
  ExpenseClaim,
  PerformanceEvaluation,
  EmployeeKPI,
  KPICategory,
  KPIStatus,
  TrainingCourse,
  RecruitmentRequisition,
  Candidate,
  ApprovalRequest,
  Asset,
  Announcement,
  NotificationItem,
  AuditLog,
  AuditActionType,
  AuditChange,
  HRDomainType,
  OrgProfile,
  ShiftTemplate,
  ShiftAssignment,
  ShiftConflict,
  EnterpriseDocument,
  DocumentVersion,
  DocumentCategory,
  VersionChangeType,
} from '../types/index.ts';
import {
  initialEnterpriseDocuments,
  calculateNextVersion,
} from '../services/documentData.ts';
import {
  initialOrgProfile,
  initialBranches,
  initialDepartments,
  initialPositions,
  initialEmployees,
  initialUsers,
  initialShifts,
  initialShiftTemplates,
  initialShiftAssignments,
  initialHolidays,
  initialLeaveTypes,
  initialLeaveRequests,
  initialLeaveBalances,
  initialAttendanceRecords,
  initialPayrollPeriods,
  initialPayslips,
  initialDisciplinaryCases,
  initialExpenseClaims,
  initialEvaluations,
  initialEmployeeKPIs,
  initialTrainingCourses,
  initialRequisitions,
  initialCandidates,
  initialApprovalRequests,
  initialAssets,
  initialAnnouncements,
  initialNotifications,
  initialAuditLogs,
  generatePayslipsForEmployees,
  calculateLaoTax,
  calculateLaoSocialSecurity,
} from '../services/mockData.ts';
import { translations } from '../locales/translations.ts';
import { alerts } from '../utils/alerts.ts';
import { auditService } from '../services/auditService.ts';
import {
  calculateShiftDurationHours,
  detectAllShiftConflicts,
  validateProposedAssignment,
  getWeekDates,
} from '../utils/shiftValidation.ts';
import { generateComprehensiveAttendance } from '../services/attendanceData.ts';

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  currentUser: User;
  setCurrentUser: (user: User) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (val: boolean) => void;
  login: (username: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  availableUsers: User[];
  setAvailableUsers: React.Dispatch<React.SetStateAction<User[]>>;
  updateUserRole: (userId: string, newRole: Role, departmentId?: string) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;
  createUserAccount: (userData: Omit<User, 'id' | 'createdAt'>) => void;
  deleteUserAccount: (userId: string) => void;
  activeModule: string;
  setActiveModule: (mod: string) => void;
  activeSubModule: string;
  setActiveSubModule: (sub: string) => void;
  t: (key: keyof typeof translations['lo']) => string;

  // Data
  orgProfile: OrgProfile;
  setOrgProfile: React.Dispatch<React.SetStateAction<OrgProfile>>;
  branches: Branch[];
  setBranches: React.Dispatch<React.SetStateAction<Branch[]>>;
  departments: Department[];
  setDepartments: React.Dispatch<React.SetStateAction<Department[]>>;
  positions: Position[];
  setPositions: React.Dispatch<React.SetStateAction<Position[]>>;
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  attendanceRecords: AttendanceRecord[];
  setAttendanceRecords: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
  shifts: Shift[];
  setShifts: React.Dispatch<React.SetStateAction<Shift[]>>;
  holidays: Holiday[];
  setHolidays: React.Dispatch<React.SetStateAction<Holiday[]>>;
  leaveTypes: LeaveType[];
  leaveRequests: LeaveRequest[];
  leaveBalances: LeaveBalance[];
  payrollPeriods: PayrollPeriod[];
  setPayrollPeriods: React.Dispatch<React.SetStateAction<PayrollPeriod[]>>;
  payslips: Payslip[];
  setPayslips: React.Dispatch<React.SetStateAction<Payslip[]>>;
  disciplinaryCases: DisciplinaryCase[];
  expenseClaims: ExpenseClaim[];
  evaluations: PerformanceEvaluation[];
  setEvaluations: React.Dispatch<React.SetStateAction<PerformanceEvaluation[]>>;
  employeeKPIs: EmployeeKPI[];
  setEmployeeKPIs: React.Dispatch<React.SetStateAction<EmployeeKPI[]>>;
  trainingCourses: TrainingCourse[];
  requisitions: RecruitmentRequisition[];
  candidates: Candidate[];
  approvalRequests: ApprovalRequest[];
  assets: Asset[];
  documents: EnterpriseDocument[];
  setDocuments: React.Dispatch<React.SetStateAction<EnterpriseDocument[]>>;
  announcements: Announcement[];
  notifications: NotificationItem[];
  auditLogs: AuditLog[];
  setAuditLogs: React.Dispatch<React.SetStateAction<AuditLog[]>>;
  shiftTemplates: ShiftTemplate[];
  setShiftTemplates: React.Dispatch<React.SetStateAction<ShiftTemplate[]>>;
  shiftAssignments: ShiftAssignment[];
  setShiftAssignments: React.Dispatch<React.SetStateAction<ShiftAssignment[]>>;

  // Actions
  addAuditLog: (
    action: string,
    actionType: AuditActionType,
    module: string,
    details: string,
    options?: {
      entityType?: string;
      entityName?: string;
      recordId?: string;
      changes?: AuditChange[];
      status?: 'SUCCESS' | 'FAILURE';
      hrDomain?: HRDomainType;
      complianceRef?: string;
    }
  ) => void;
  assignShift: (assignment: Omit<ShiftAssignment, 'id' | 'assignedAt'>) => { success: boolean; conflicts: ShiftConflict[] };
  removeShiftAssignment: (id: string) => void;
  updateShiftAssignment: (id: string, updates: Partial<ShiftAssignment>) => void;
  applyShiftTemplate: (templateId: string, employeeIds: string[], dates: string[]) => { count: number; conflicts: ShiftConflict[] };
  createShiftTemplate: (template: Omit<ShiftTemplate, 'id'>) => void;
  updateShiftTemplate: (id: string, updates: Partial<ShiftTemplate>) => void;
  deleteShiftTemplate: (id: string) => void;
  clearWeekAssignments: (weekDates: string[]) => void;
  createKPI: (data: Omit<EmployeeKPI, 'id' | 'assignedDate'>) => void;
  updateKPIProgress: (id: string, currentValue: number, status: KPIStatus, managerFeedback?: string) => void;
  updateKPISubGoal: (kpiId: string, subGoalId: string, completed: boolean, currentValue?: number) => void;
  deleteKPI: (id: string) => void;
  createEvaluation: (data: Omit<PerformanceEvaluation, 'id' | 'createdAt'>) => void;
  updateEvaluation: (id: string, updates: Partial<PerformanceEvaluation>) => void;
  deleteEvaluation: (id: string) => void;
  punchInOut: (type: 'IN' | 'OUT') => void;
  submitLeaveRequest: (leaveTypeId: string, startDate: string, endDate: string, totalDays: number, reason: string) => void;
  processApproval: (requestId: string, action: 'APPROVE' | 'REJECT' | 'RETURN', comments?: string) => Promise<void>;
  submitExpenseClaim: (title: string, category: any, totalAmount: number, receiptsCount: number) => void;
  runMonthlyPayroll: (periodName: string, startDate: string, endDate: string) => void;
  addEmployee: (emp: Omit<Employee, 'id'>) => void;
  updateEmployee: (emp: Employee) => void;
  deleteEmployee: (id: string) => void;
  importEmployeesBatch: (newEmps: Employee[], report?: any) => void;
  hireCandidateAndOnboard: (candidateId: string) => void;
  assignAssetToEmployee: (assetId: string, employeeId: string) => void;
  returnAssetToInventory: (assetId: string) => void;
  createDocument: (data: {
    docNumber: string;
    title: string;
    titleLao: string;
    category: DocumentCategory;
    description: string;
    descriptionLao: string;
    departmentId: string;
    initialContent: string;
    tags: string[];
    fileType?: 'DOCX' | 'PDF' | 'MARKDOWN';
    isScanned?: boolean;
    scannedImageUrl?: string;
    scannedPages?: string[];
    employeeId?: string;
    extractedMetadata?: EnterpriseDocument['extractedMetadata'];
  }) => void;
  updateDocument: (
    documentId: string,
    updates: {
      title?: string;
      titleLao?: string;
      category?: DocumentCategory;
      description?: string;
      descriptionLao?: string;
      departmentId?: string;
      content: string;
      changeSummary: string;
      changeType: 'MAJOR' | 'MINOR' | 'PATCH';
    }
  ) => void;
  restoreDocumentVersion: (documentId: string, targetVersionId: string, restoreNote?: string) => void;
  deleteDocument: (documentId: string) => void;
  updateDocumentTags: (documentId: string, tags: string[]) => void;
  createDisciplinaryCase: (data: Omit<DisciplinaryCase, 'id' | 'createdAt'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearAuditLogs: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Persistence keys in localStorage
  const loadState = <T,>(key: string, fallback: T): T => {
    try {
      const saved = localStorage.getItem(`lhse_${key}`);
      return saved ? JSON.parse(saved) : fallback;
    } catch {
      return fallback;
    }
  };

  const [language, setLanguage] = useState<Language>(() => loadState('language', 'lo'));
  const [theme, setTheme] = useState<Theme>(() => loadState('theme', 'light'));
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const loaded = loadState<User>('currentUser', initialUsers[0]);
    if (loaded && (loaded.id === 'usr-demo' || loaded.email?.includes('demo@gmail.com') || loaded.fullName?.includes('SavanHR') || loaded.fullNameLao?.includes('SavanHR'))) {
      localStorage.setItem('lhse_currentUser', JSON.stringify(initialUsers[0]));
      return initialUsers[0];
    }
    return loaded || initialUsers[0];
  });
  const [availableUsers, setAvailableUsers] = useState<User[]>(() => {
    const loaded = loadState<User[]>('availableUsers', initialUsers);
    if (Array.isArray(loaded) && loaded.length > 0) {
      return loaded;
    }
    return initialUsers;
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem('lhse_isAuthenticated');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [activeModule, setActiveModule] = useState<string>('module-1');
  const [activeSubModule, setActiveSubModule] = useState<string>('overview');

  const [orgProfile, setOrgProfile] = useState<OrgProfile>(() => {
    const loaded = loadState<OrgProfile>('orgProfile', initialOrgProfile);
    if (
      !loaded.ministryLao ||
      loaded.ministryLao.includes('ການເງິນ') ||
      !loaded.logoUrl ||
      loaded.logoUrl.includes('images_6d5d73cb.png') ||
      loaded.companyNameLao.includes('ຖືຮຸ້ນລາວ (')
    ) {
      const merged: OrgProfile = {
        ...loaded,
        companyNameEn: 'LAO HOLDING STATE ENTERPRISE (LHSE)',
        companyNameLao: 'ລັດວິສາຫະກິດຖືຮຸ້ນລາວ',
        ministryLao: 'ກະຊວງອຸດສາກະກຳ ແລະ ການຄ້າ',
        ministryEn: 'Ministry of Industry and Commerce',
        logoUrl: '/assets/aistudio/______________________95dd5853.png',
      };
      localStorage.setItem('lhse_orgProfile', JSON.stringify(merged));
      return merged;
    }
    return loaded;
  });
  const [branches, setBranches] = useState<Branch[]>(() => loadState('branches', initialBranches));
  const [departments, setDepartments] = useState<Department[]>(() => loadState('departments', initialDepartments));
  const [positions, setPositions] = useState<Position[]>(() => loadState('positions', initialPositions));
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const loaded = loadState<Employee[]>('employees', initialEmployees);
    // Purge old demo data: If loaded data contains demo employees or length is below the 93 official records, reset to official records
    if (Array.isArray(loaded) && loaded.length > 0) {
      const hasDemoMarker = loaded.some(
        (e) => e.email?.includes('laoholding.gov.la') || (e.id === 'emp-001' && e.firstNameLao === 'ບຸນມີ')
      );
      if (hasDemoMarker || loaded.length < 90) {
        localStorage.setItem('lhse_employees', JSON.stringify(initialEmployees));
        return initialEmployees;
      }
      return loaded;
    }
    return initialEmployees;
  });
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    const loaded = loadState<AttendanceRecord[]>('attendance', initialAttendanceRecords);
    if (Array.isArray(loaded) && loaded.length > 500 && loaded.some((r) => r.date.startsWith('2026-05'))) {
      return loaded;
    }
    return generateComprehensiveAttendance(initialEmployees, initialHolidays);
  });
  const [shifts, setShifts] = useState<Shift[]>(() => loadState('shifts', initialShifts));
  const [holidays, setHolidays] = useState<Holiday[]>(() => loadState('holidays', initialHolidays));
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>(() => loadState('leaveTypes', initialLeaveTypes));
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() => loadState('leaveRequests', initialLeaveRequests));
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>(() => loadState('leaveBalances', initialLeaveBalances));
  const [payrollPeriods, setPayrollPeriods] = useState<PayrollPeriod[]>(() => loadState('payrollPeriods', initialPayrollPeriods));
  const [payslips, setPayslips] = useState<Payslip[]>(() => loadState('payslips', initialPayslips));
  const [disciplinaryCases, setDisciplinaryCases] = useState<DisciplinaryCase[]>(() => loadState('disciplinary', initialDisciplinaryCases));
  const [expenseClaims, setExpenseClaims] = useState<ExpenseClaim[]>(() => loadState('expenses', initialExpenseClaims));
  const [evaluations, setEvaluations] = useState<PerformanceEvaluation[]>(() => loadState('evaluations', initialEvaluations));
  const [employeeKPIs, setEmployeeKPIs] = useState<EmployeeKPI[]>(() => {
    const loaded = loadState<EmployeeKPI[]>('employeeKPIs', initialEmployeeKPIs);
    if (Array.isArray(loaded)) {
      const missing = initialEmployeeKPIs.filter((initK) => !loaded.some((lk) => lk.id === initK.id));
      return missing.length > 0 ? [...loaded, ...missing] : loaded;
    }
    return initialEmployeeKPIs;
  });
  const [trainingCourses, setTrainingCourses] = useState<TrainingCourse[]>(() => loadState('trainings', initialTrainingCourses));
  const [requisitions, setRequisitions] = useState<RecruitmentRequisition[]>(() => loadState('requisitions', initialRequisitions));
  const [candidates, setCandidates] = useState<Candidate[]>(() => loadState('candidates', initialCandidates));
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>(() => loadState('approvals', initialApprovalRequests));
  const [assets, setAssets] = useState<Asset[]>(() => loadState('assets', initialAssets));
  const [documents, setDocuments] = useState<EnterpriseDocument[]>(() => {
    const loaded = loadState<EnterpriseDocument[]>('documents', initialEnterpriseDocuments);
    if (Array.isArray(loaded) && loaded.length > 0) {
      const missing = initialEnterpriseDocuments.filter((initD) => !loaded.some((ld) => ld.id === initD.id));
      return missing.length > 0 ? [...loaded, ...missing] : loaded;
    }
    return initialEnterpriseDocuments;
  });
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => loadState('announcements', initialAnnouncements));
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const loaded = loadState<NotificationItem[]>('notifications', initialNotifications);
    if (Array.isArray(loaded)) {
      // Purge any old demo notifications completely
      const cleaned = loaded.filter(
        (n) =>
          !n.titleLao?.includes('DEMO-') &&
          !n.titleLao?.includes('ດີໂມ') &&
          !n.titleEn?.includes('DEMO-') &&
          !n.messageLao?.includes('DEMO-') &&
          !n.messageLao?.includes('ດີໂມ') &&
          !n.messageEn?.includes('DEMO-')
      );
      const missing = initialNotifications.filter((initN) => !cleaned.some((ln) => ln.id === initN.id));
      const result = missing.length > 0 ? [...cleaned, ...missing] : cleaned;
      localStorage.setItem('lhse_notifications', JSON.stringify(result));
      return result;
    }
    return initialNotifications;
  });
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => loadState('auditLogs', initialAuditLogs));
  const [shiftTemplates, setShiftTemplates] = useState<ShiftTemplate[]>(() => {
    const loaded = loadState<ShiftTemplate[]>('shiftTemplates', initialShiftTemplates);
    if (Array.isArray(loaded)) {
      const missing = initialShiftTemplates.filter((initT) => !loaded.some((lt) => lt.id === initT.id));
      return missing.length > 0 ? [...loaded, ...missing] : loaded;
    }
    return initialShiftTemplates;
  });
  const [shiftAssignments, setShiftAssignments] = useState<ShiftAssignment[]>(() => {
    const loaded = loadState<ShiftAssignment[]>('shiftAssignments', initialShiftAssignments);
    if (Array.isArray(loaded)) {
      const missing = initialShiftAssignments.filter((initA) => !loaded.some((la) => la.id === initA.id));
      return missing.length > 0 ? [...loaded, ...missing] : loaded;
    }
    return initialShiftAssignments;
  });

  // Auto-save changes to localStorage
  useEffect(() => {
    localStorage.setItem('lhse_employees', JSON.stringify(employees));
  }, [employees]);
  useEffect(() => {
    localStorage.setItem('lhse_shiftTemplates', JSON.stringify(shiftTemplates));
  }, [shiftTemplates]);
  useEffect(() => {
    localStorage.setItem('lhse_shiftAssignments', JSON.stringify(shiftAssignments));
  }, [shiftAssignments]);
  useEffect(() => {
    localStorage.setItem('lhse_employeeKPIs', JSON.stringify(employeeKPIs));
  }, [employeeKPIs]);
  useEffect(() => {
    localStorage.setItem('lhse_attendance', JSON.stringify(attendanceRecords));
  }, [attendanceRecords]);
  useEffect(() => {
    localStorage.setItem('lhse_leaveRequests', JSON.stringify(leaveRequests));
  }, [leaveRequests]);
  useEffect(() => {
    localStorage.setItem('lhse_approvalRequests', JSON.stringify(approvalRequests));
  }, [approvalRequests]);
  useEffect(() => {
    localStorage.setItem('lhse_payslips', JSON.stringify(payslips));
  }, [payslips]);
  useEffect(() => {
    localStorage.setItem('lhse_payrollPeriods', JSON.stringify(payrollPeriods));
  }, [payrollPeriods]);
  useEffect(() => {
    localStorage.setItem('lhse_auditLogs', JSON.stringify(auditLogs));
  }, [auditLogs]);
  useEffect(() => {
    localStorage.setItem('lhse_expenses', JSON.stringify(expenseClaims));
  }, [expenseClaims]);
  useEffect(() => {
    localStorage.setItem('lhse_assets', JSON.stringify(assets));
  }, [assets]);
  useEffect(() => {
    localStorage.setItem('lhse_documents', JSON.stringify(documents));
  }, [documents]);
  useEffect(() => {
    localStorage.setItem('lhse_disciplinary', JSON.stringify(disciplinaryCases));
  }, [disciplinaryCases]);
  useEffect(() => {
    localStorage.setItem('lhse_evaluations', JSON.stringify(evaluations));
  }, [evaluations]);
  useEffect(() => {
    localStorage.setItem('lhse_candidates', JSON.stringify(candidates));
  }, [candidates]);

  // Sync theme with document class and localStorage
  useEffect(() => {
    localStorage.setItem('lhse_theme', JSON.stringify(theme));
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('lhse_language', JSON.stringify(language));
  }, [language]);

  useEffect(() => {
    localStorage.setItem('lhse_currentUser', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('lhse_availableUsers', JSON.stringify(availableUsers));
  }, [availableUsers]);

  useEffect(() => {
    localStorage.setItem('lhse_isAuthenticated', JSON.stringify(isAuthenticated));
  }, [isAuthenticated]);

  // Translation helper
  const t = (key: keyof typeof translations['lo']): string => {
    const langDict = translations[language] || translations['lo'];
    return (langDict as any)[key] || key;
  };

  const addAuditLog = (
    action: string,
    actionType: AuditActionType,
    module: string,
    details: string,
    options?: {
      entityType?: string;
      entityName?: string;
      recordId?: string;
      changes?: AuditChange[];
      status?: 'SUCCESS' | 'FAILURE';
      hrDomain?: HRDomainType;
      complianceRef?: string;
    }
  ) => {
    const newLog = auditService.createLogEntry({
      action,
      actionType,
      module,
      entityType: options?.entityType,
      entityName: options?.entityName,
      recordId: options?.recordId,
      details,
      changes: options?.changes,
      status: options?.status || 'SUCCESS',
      hrDomain: options?.hrDomain,
      complianceRef: options?.complianceRef,
      user: currentUser,
    });
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const clearAuditLogs = () => {
    const clearLog = auditService.createLogEntry({
      action: 'AUDIT_LOGS_PURGE',
      actionType: 'DELETE',
      module: 'System Administration',
      entityType: 'AUDIT_LOGS',
      entityName: 'All Audit Records',
      details: 'Audit logs cleared by Super Administrator.',
      user: currentUser,
    });
    setAuditLogs([clearLog]);
    alerts.success(language === 'lo' ? 'ລ້າງບັນທຶກລະບົບສຳເລັດ' : 'Audit logs reset to initial state.');
  };

  // Shift Planner Actions
  const assignShift = (
    data: Omit<ShiftAssignment, 'id' | 'assignedAt'>
  ): { success: boolean; conflicts: ShiftConflict[] } => {
    const newId = `asg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const durationHours =
      data.durationHours ||
      calculateShiftDurationHours(data.startTime, data.endTime, data.breakMinutes ?? 60);

    const newAssignment: ShiftAssignment = {
      ...data,
      id: newId,
      durationHours,
      assignedBy: currentUser.fullName || 'HR Manager',
      assignedAt: new Date().toISOString(),
    };

    const updatedList = [...shiftAssignments, newAssignment];
    setShiftAssignments(updatedList);

    // Calculate week dates for conflict detection
    const weekDays = getWeekDates(data.date);
    const weekDates = weekDays.map((d) => d.date);
    const conflicts = detectAllShiftConflicts(updatedList, employees, weekDates);

    const emp = employees.find((e) => e.id === data.employeeId);
    const empName = emp ? `${emp.firstNameEn} ${emp.lastNameEn}` : data.employeeId;

    addAuditLog(
      'SHIFT_ASSIGNMENT_CREATE',
      'CREATE',
      'Work Schedule & Shift Planner',
      `Assigned shift '${data.shiftTitleEn}' (${data.startTime}-${data.endTime}, ${durationHours}h) to ${empName} on ${data.date}.`,
      {
        entityType: 'SHIFT_ASSIGNMENT',
        entityName: `${empName} - ${data.date}`,
        recordId: newId,
        changes: [
          { field: 'shiftTitleEn', newValue: data.shiftTitleEn },
          { field: 'date', newValue: data.date },
          { field: 'time', newValue: `${data.startTime} - ${data.endTime}` },
          { field: 'durationHours', newValue: `${durationHours}h` },
        ],
      }
    );

    return { success: true, conflicts };
  };

  const removeShiftAssignment = (id: string) => {
    const target = shiftAssignments.find((a) => a.id === id);
    if (!target) return;

    setShiftAssignments((prev) => prev.filter((a) => a.id !== id));

    const emp = employees.find((e) => e.id === target.employeeId);
    const empName = emp ? `${emp.firstNameEn} ${emp.lastNameEn}` : target.employeeId;

    addAuditLog(
      'SHIFT_ASSIGNMENT_DELETE',
      'DELETE',
      'Work Schedule & Shift Planner',
      `Removed shift '${target.shiftTitleEn}' for ${empName} on ${target.date}.`,
      {
        entityType: 'SHIFT_ASSIGNMENT',
        entityName: `${empName} - ${target.date}`,
        recordId: id,
      }
    );
  };

  const updateShiftAssignment = (id: string, updates: Partial<ShiftAssignment>) => {
    setShiftAssignments((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, ...updates };
          if (updates.startTime || updates.endTime || updates.breakMinutes !== undefined) {
            updated.durationHours = calculateShiftDurationHours(
              updated.startTime,
              updated.endTime,
              updated.breakMinutes ?? 60
            );
          }
          return updated;
        }
        return item;
      })
    );

    addAuditLog(
      'SHIFT_ASSIGNMENT_UPDATE',
      'UPDATE',
      'Work Schedule & Shift Planner',
      `Updated shift schedule assignment ${id}.`,
      {
        entityType: 'SHIFT_ASSIGNMENT',
        recordId: id,
      }
    );
  };

  const applyShiftTemplate = (
    templateId: string,
    employeeIds: string[],
    dates: string[]
  ): { count: number; conflicts: ShiftConflict[] } => {
    const tpl = shiftTemplates.find((t) => t.id === templateId);
    if (!tpl) return { count: 0, conflicts: [] };

    const newAssignments: ShiftAssignment[] = [];
    const nowIso = new Date().toISOString();

    employeeIds.forEach((empId) => {
      dates.forEach((dateStr) => {
        const asgId = `asg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
        newAssignments.push({
          id: asgId,
          employeeId: empId,
          date: dateStr,
          templateId: tpl.id,
          shiftTitleEn: tpl.nameEn,
          shiftTitleLao: tpl.nameLao,
          startTime: tpl.startTime,
          endTime: tpl.endTime,
          breakMinutes: tpl.breakMinutes,
          durationHours: tpl.durationHours,
          color: tpl.color,
          status: 'CONFIRMED',
          priority: tpl.priority || 'MEDIUM',
          assignedBy: currentUser.fullName || 'HR Manager',
          assignedAt: nowIso,
        });
      });
    });

    const updatedList = [...shiftAssignments, ...newAssignments];
    setShiftAssignments(updatedList);

    const weekDates = dates.length > 0 ? getWeekDates(dates[0]).map((d) => d.date) : [];
    const conflicts = detectAllShiftConflicts(updatedList, employees, weekDates);

    addAuditLog(
      'SHIFT_TEMPLATE_BATCH_APPLY',
      'CREATE',
      'Work Schedule & Shift Planner',
      `Applied template '${tpl.nameEn}' (${tpl.startTime}-${tpl.endTime}) to ${employeeIds.length} employee(s) across ${dates.length} date(s). Generated ${newAssignments.length} assignments.`,
      {
        entityType: 'SHIFT_TEMPLATE',
        entityName: tpl.nameEn,
        recordId: tpl.id,
      }
    );

    return { count: newAssignments.length, conflicts };
  };

  const createShiftTemplate = (template: Omit<ShiftTemplate, 'id'>) => {
    const newId = `tpl-${Date.now()}`;
    const durationHours =
      template.durationHours ||
      calculateShiftDurationHours(template.startTime, template.endTime, template.breakMinutes ?? 60);

    const newTpl: ShiftTemplate = {
      ...template,
      id: newId,
      durationHours,
    };

    setShiftTemplates((prev) => [newTpl, ...prev]);

    addAuditLog(
      'SHIFT_TEMPLATE_CREATE',
      'CREATE',
      'Work Schedule & Shift Planner',
      `Created shift template '${template.nameEn}' (${template.startTime}-${template.endTime}, ${durationHours}h).`,
      {
        entityType: 'SHIFT_TEMPLATE',
        entityName: template.nameEn,
        recordId: newId,
      }
    );
  };

  const updateShiftTemplate = (id: string, updates: Partial<ShiftTemplate>) => {
    setShiftTemplates((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const updated = { ...t, ...updates };
          if (updates.startTime || updates.endTime || updates.breakMinutes !== undefined) {
            updated.durationHours = calculateShiftDurationHours(
              updated.startTime,
              updated.endTime,
              updated.breakMinutes ?? 60
            );
          }
          return updated;
        }
        return t;
      })
    );

    addAuditLog(
      'SHIFT_TEMPLATE_UPDATE',
      'UPDATE',
      'Work Schedule & Shift Planner',
      `Updated shift template ${id}.`,
      {
        entityType: 'SHIFT_TEMPLATE',
        recordId: id,
      }
    );
  };

  const deleteShiftTemplate = (id: string) => {
    const target = shiftTemplates.find((t) => t.id === id);
    setShiftTemplates((prev) => prev.filter((t) => t.id !== id));

    if (target) {
      addAuditLog(
        'SHIFT_TEMPLATE_DELETE',
        'DELETE',
        'Work Schedule & Shift Planner',
        `Deleted shift template '${target.nameEn}'.`,
        {
          entityType: 'SHIFT_TEMPLATE',
          entityName: target.nameEn,
          recordId: id,
        }
      );
    }
  };

  const clearWeekAssignments = (weekDates: string[]) => {
    const weekSet = new Set(weekDates);
    const countBefore = shiftAssignments.length;
    setShiftAssignments((prev) => prev.filter((a) => !weekSet.has(a.date)));
    const deletedCount = countBefore - shiftAssignments.filter((a) => !weekSet.has(a.date)).length;

    addAuditLog(
      'SHIFT_SCHEDULE_CLEAR_WEEK',
      'DELETE',
      'Work Schedule & Shift Planner',
      `Cleared all shift assignments for week (${weekDates[0]} to ${weekDates[weekDates.length - 1]}). Removed ${deletedCount} shifts.`,
      {
        entityType: 'SHIFT_SCHEDULE',
      }
    );
  };

  const createKPI = (data: Omit<EmployeeKPI, 'id' | 'assignedDate'>) => {
    const newId = `kpi-${Date.now()}`;
    const today = new Date().toISOString().split('T')[0];
    const newKPI: EmployeeKPI = {
      ...data,
      id: newId,
      assignedDate: today,
      lastUpdated: today,
    };
    const targetEmp = employees.find((e) => e.id === data.employeeId);
    const empName = targetEmp ? `${targetEmp.employeeCode} - ${targetEmp.firstNameLao} ${targetEmp.lastNameLao} (${targetEmp.firstNameEn})` : data.employeeId;

    setEmployeeKPIs((prev) => [newKPI, ...prev]);

    addAuditLog(
      'KPI_CREATE',
      'CREATE',
      'Performance & KPI Tracking',
      `Assigned KPI '${data.title}' to ${empName}. Target: ${data.targetValue} ${data.unit}, Weight: ${data.weight}%, Period: ${data.period}`,
      {
        entityType: 'EMPLOYEE_KPI',
        entityName: `${data.title} (${empName})`,
        recordId: newId,
        changes: [
          { field: 'employeeId', newValue: empName },
          { field: 'title', newValue: data.title },
          { field: 'category', newValue: data.category },
          { field: 'targetValue', newValue: `${data.targetValue} ${data.unit}` },
          { field: 'currentValue', newValue: `${data.currentValue} ${data.unit}` },
          { field: 'weight', newValue: `${data.weight}%` },
          { field: 'period', newValue: data.period },
          { field: 'dueDate', newValue: data.dueDate },
        ],
      }
    );

    alerts.success(
      language === 'lo' ? 'ກຳນົດ ແລະ ມອບໝາຍ KPI ສຳເລັດ' : 'KPI Defined & Assigned',
      `${data.title} -> ${empName}`
    );
  };

  const updateKPIProgress = (id: string, currentValue: number, status: KPIStatus, managerFeedback?: string) => {
    const existing = employeeKPIs.find((k) => k.id === id);
    if (!existing) return;

    const targetEmp = employees.find((e) => e.id === existing.employeeId);
    const empName = targetEmp ? `${targetEmp.employeeCode} - ${targetEmp.firstNameLao} ${targetEmp.lastNameLao} (${targetEmp.firstNameEn})` : existing.employeeId;
    const today = new Date().toISOString().split('T')[0];

    const changes: AuditChange[] = [];
    if (existing.currentValue !== currentValue) {
      changes.push({
        field: 'currentValue',
        fieldLabelEn: 'Current Value',
        oldValue: `${existing.currentValue} ${existing.unit}`,
        newValue: `${currentValue} ${existing.unit}`,
      });
    }
    if (existing.status !== status) {
      changes.push({
        field: 'status',
        fieldLabelEn: 'Status',
        oldValue: existing.status,
        newValue: status,
      });
    }
    if (managerFeedback !== undefined && existing.managerFeedback !== managerFeedback) {
      changes.push({
        field: 'managerFeedback',
        fieldLabelEn: 'Manager Feedback',
        oldValue: existing.managerFeedback || 'None',
        newValue: managerFeedback,
      });
    }

    setEmployeeKPIs((prev) =>
      prev.map((k) =>
        k.id === id
          ? {
              ...k,
              currentValue,
              status,
              managerFeedback: managerFeedback !== undefined ? managerFeedback : k.managerFeedback,
              lastUpdated: today,
            }
          : k
      )
    );

    const completionRate = existing.targetValue > 0 ? Math.round((currentValue / existing.targetValue) * 100) : 0;

    addAuditLog(
      'KPI_PROGRESS_UPDATE',
      'UPDATE',
      'Performance & KPI Tracking',
      `Updated KPI progress for '${existing.title}' (${empName}): ${existing.currentValue} -> ${currentValue} ${existing.unit} (${completionRate}%), Status: ${status}`,
      {
        entityType: 'EMPLOYEE_KPI',
        entityName: `${existing.title} (${empName})`,
        recordId: id,
        changes,
      }
    );

    alerts.success(
      language === 'lo' ? 'ອັບເດດຄວາມຄືບໜ້າ KPI ສຳເລັດ' : 'KPI Progress Updated',
      `${currentValue} / ${existing.targetValue} ${existing.unit} (${completionRate}%)`
    );
  };

  const updateKPISubGoal = (kpiId: string, subGoalId: string, completed: boolean, currentValue?: number) => {
    setEmployeeKPIs((prev) =>
      prev.map((kpi) => {
        if (kpi.id !== kpiId) return kpi;
        const currentSubGoals = kpi.subGoals || [];
        const updatedSubGoals = currentSubGoals.map((sg) => {
          if (sg.id !== subGoalId) return sg;
          const nextVal = currentValue !== undefined ? currentValue : completed ? sg.targetValue : 0;
          return {
            ...sg,
            completed,
            currentValue: nextVal,
          };
        });

        // Recalculate parent progress from sub-goals
        let calculatedCurrent = kpi.currentValue;
        if (updatedSubGoals.length > 0) {
          const totalSubWeight = updatedSubGoals.reduce((sum, s) => sum + (s.weight || 1), 0);
          const weightedPct = updatedSubGoals.reduce((sum, s) => {
            const pct = s.targetValue > 0 ? (s.currentValue / s.targetValue) * 100 : s.completed ? 100 : 0;
            return sum + pct * (s.weight || 1);
          }, 0);
          const overallPct = totalSubWeight > 0 ? Math.round(weightedPct / totalSubWeight) : 0;
          calculatedCurrent = kpi.unit === '%' ? overallPct : Math.round((overallPct / 100) * kpi.targetValue);
        }

        const newStatus: KPIStatus = calculatedCurrent >= kpi.targetValue ? 'COMPLETED' : calculatedCurrent < (kpi.targetValue * 0.5) ? 'AT_RISK' : 'ON_TRACK';

        return {
          ...kpi,
          subGoals: updatedSubGoals,
          currentValue: calculatedCurrent,
          status: newStatus,
          lastUpdated: new Date().toISOString().split('T')[0],
        };
      })
    );
  };

  const deleteKPI = (id: string) => {
    const existing = employeeKPIs.find((k) => k.id === id);
    if (!existing) return;

    const targetEmp = employees.find((e) => e.id === existing.employeeId);
    const empName = targetEmp ? `${targetEmp.employeeCode} - ${targetEmp.firstNameLao} ${targetEmp.lastNameLao} (${targetEmp.firstNameEn})` : existing.employeeId;

    setEmployeeKPIs((prev) => prev.filter((k) => k.id !== id));

    addAuditLog(
      'KPI_DELETE',
      'DELETE',
      'Performance & KPI Tracking',
      `Deleted KPI '${existing.title}' previously assigned to ${empName}`,
      {
        entityType: 'EMPLOYEE_KPI',
        entityName: `${existing.title} (${empName})`,
        recordId: id,
        changes: [
          { field: 'title', oldValue: existing.title },
          { field: 'employeeId', oldValue: empName },
        ],
      }
    );

    alerts.success(
      language === 'lo' ? 'ລຶບຕົວຊີ້ວັດ KPI ສຳເລັດ' : 'KPI Deleted',
      existing.title
    );
  };

  const createEvaluation = (data: Omit<PerformanceEvaluation, 'id' | 'createdAt'>) => {
    const newId = `eval-${Date.now()}`;
    const newEval: PerformanceEvaluation = {
      ...data,
      id: newId,
      createdAt: new Date().toISOString(),
    };
    const targetEmp = employees.find((e) => e.id === data.employeeId);
    const empName = targetEmp
      ? `${targetEmp.employeeCode} - ${targetEmp.firstNameLao} ${targetEmp.lastNameLao} (${targetEmp.firstNameEn})`
      : data.employeeId;

    setEvaluations((prev) => [newEval, ...prev]);

    addAuditLog(
      'EVALUATION_CREATE',
      'CREATE',
      'Performance Management',
      `Recorded quarterly appraisal for ${empName} (${data.period}): Score ${data.score}/100, Grade ${data.grade}, Status: ${data.status}`,
      {
        entityType: 'PERFORMANCE_EVALUATION',
        entityName: `${empName} - ${data.period}`,
        recordId: newId,
        changes: [
          { field: 'employeeId', newValue: empName },
          { field: 'period', newValue: data.period },
          { field: 'score', newValue: `${data.score}/100` },
          { field: 'grade', newValue: data.grade },
          { field: 'status', newValue: data.status },
        ],
      }
    );

    alerts.success(
      language === 'lo' ? 'ບັນທຶກການປະເມີນຜົນງານສຳເລັດ' : 'Quarterly Review Recorded',
      `${empName} (${data.period}) - Grade ${data.grade}`
    );
  };

  const updateEvaluation = (id: string, updates: Partial<PerformanceEvaluation>) => {
    const existing = evaluations.find((e) => e.id === id);
    if (!existing) return;

    const targetEmp = employees.find((e) => e.id === existing.employeeId);
    const empName = targetEmp
      ? `${targetEmp.employeeCode} - ${targetEmp.firstNameLao} ${targetEmp.lastNameLao}`
      : existing.employeeId;

    setEvaluations((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );

    addAuditLog(
      'EVALUATION_UPDATE',
      'UPDATE',
      'Performance Management',
      `Updated appraisal for ${empName} (${existing.period})`,
      {
        entityType: 'PERFORMANCE_EVALUATION',
        entityName: `${empName} - ${existing.period}`,
        recordId: id,
      }
    );

    alerts.success(
      language === 'lo' ? 'ອັບເດດການປະເມີນຜົນງານສຳເລັດ' : 'Evaluation Updated',
      `${empName} (${existing.period})`
    );
  };

  const deleteEvaluation = (id: string) => {
    const existing = evaluations.find((e) => e.id === id);
    if (!existing) return;

    const targetEmp = employees.find((e) => e.id === existing.employeeId);
    const empName = targetEmp
      ? `${targetEmp.employeeCode} - ${targetEmp.firstNameLao} ${targetEmp.lastNameLao}`
      : existing.employeeId;

    setEvaluations((prev) => prev.filter((e) => e.id !== id));

    addAuditLog(
      'EVALUATION_DELETE',
      'DELETE',
      'Performance Management',
      `Deleted evaluation record for ${empName} (${existing.period})`,
      {
        entityType: 'PERFORMANCE_EVALUATION',
        entityName: `${empName} - ${existing.period}`,
        recordId: id,
      }
    );

    alerts.info(
      language === 'lo' ? 'ລຶບລາຍການປະເມີນສຳເລັດ' : 'Evaluation Deleted',
      `${empName} (${existing.period})`
    );
  };

  const punchInOut = (type: 'IN' | 'OUT') => {
    const empId = currentUser.employeeId || 'emp-001';
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    setAttendanceRecords((prev) => {
      const existing = prev.find((r) => r.employeeId === empId && r.date === today);
      if (existing) {
        if (type === 'IN') {
          alerts.info(
            language === 'lo' ? 'ທ່ານໄດ້ລົງເວລາເຂົ້າແລ້ວ' : 'Already Checked In',
            `${language === 'lo' ? 'ເວລາເຂົ້າ' : 'Check-in time'}: ${existing.checkIn}`
          );
          return prev;
        } else {
          alerts.success(
            language === 'lo' ? 'ລົງເວລາອອກສຳເລັດ' : 'Checked Out Successfully',
            `${language === 'lo' ? 'ເວລາອອກ' : 'Check-out time'}: ${nowTime}`
          );
          addAuditLog('ATTENDANCE_CHECKOUT', 'UPDATE', 'Attendance Management', `Check-out at ${nowTime}`, {
            entityType: 'ATTENDANCE_RECORD',
            entityName: `${currentUser.fullName} (${today})`,
            recordId: existing.id,
            changes: [{ field: 'checkOut', oldValue: existing.checkOut || 'None', newValue: nowTime }],
          });
          return prev.map((r) =>
            r.id === existing.id
              ? {
                  ...r,
                  checkOut: nowTime,
                  durationMinutes: 480,
                }
              : r
          );
        }
      } else {
        if (type === 'IN') {
          alerts.success(
            language === 'lo' ? 'ລົງເວລາເຂົ້າສຳເລັດ' : 'Checked In Successfully',
            `${language === 'lo' ? 'ເວລາເຂົ້າ' : 'Check-in time'}: ${nowTime}`
          );
          const newId = `att-${Date.now()}`;
          addAuditLog('ATTENDANCE_CHECKIN', 'CREATE', 'Attendance Management', `Check-in recorded at ${nowTime}`, {
            entityType: 'ATTENDANCE_RECORD',
            entityName: `${currentUser.fullName} (${today})`,
            recordId: newId,
            changes: [{ field: 'checkIn', oldValue: 'None', newValue: nowTime }],
          });
          const newRec: AttendanceRecord = {
            id: newId,
            employeeId: empId,
            date: today,
            checkIn: nowTime,
            status: 'PRESENT',
            durationMinutes: 0,
            source: 'BIOMETRIC_SCANNER',
          };
          return [newRec, ...prev];
        } else {
          alerts.warning(
            language === 'lo' ? 'ແຈ້ງເຕືອນ' : 'Warning',
            language === 'lo' ? 'ທ່ານຍັງບໍ່ທັນໄດ້ລົງເວລາເຂົ້າໃນມື້ນີ້' : 'You have not checked in today yet.'
          );
          return prev;
        }
      }
    });
  };

  const submitLeaveRequest = (leaveTypeId: string, startDate: string, endDate: string, totalDays: number, reason: string) => {
    const empId = currentUser.employeeId || 'emp-005';
    const requester = employees.find((e) => e.id === empId) || employees[0];
    const leaveId = `lr-${Date.now()}`;

    const newLeave: LeaveRequest = {
      id: leaveId,
      employeeId: empId,
      leaveTypeId,
      startDate,
      endDate,
      totalDays,
      reason,
      status: 'PENDING',
      currentStep: 1,
      totalSteps: 2,
      assignedApproverId: requester.reportingToId || 'emp-002',
      createdAt: new Date().toISOString(),
    };

    const newApproval: ApprovalRequest = {
      id: `appr-${Date.now()}`,
      type: 'LEAVE',
      referenceId: leaveId,
      title: `${language === 'lo' ? 'ຄຳຮ້ອງຂໍລາພັກ' : 'Leave Request'} (${totalDays} ${language === 'lo' ? 'ວັນ' : 'days'}) - ${requester.firstNameLao} ${requester.lastNameLao}`,
      requesterId: empId,
      requesterName: `${requester.firstNameLao} ${requester.lastNameLao} (${requester.employeeCode})`,
      departmentName: departments.find((d) => d.id === requester.departmentId)?.nameLao || 'ພະແນກ',
      amountOrDays: `${totalDays} ${language === 'lo' ? 'ວັນ' : 'Days'} (${startDate} - ${endDate})`,
      currentStep: 1,
      totalSteps: 2,
      assignedApproverRole: 'HR_ADMIN',
      assignedApproverId: requester.reportingToId || 'emp-002',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      history: [
        {
          actorName: `${requester.firstNameLao} ${requester.lastNameLao}`,
          actorRole: currentUser.role,
          action: 'SUBMITTED',
          comments: reason,
          timestamp: new Date().toISOString(),
        },
      ],
    };

    setLeaveRequests((prev) => [newLeave, ...prev]);
    setApprovalRequests((prev) => [newApproval, ...prev]);

    addAuditLog('LEAVE_SUBMIT', 'CREATE', 'Leave Management', `Leave request for ${totalDays} days (${startDate} to ${endDate}) submitted by ${requester.firstNameEn}`, {
      entityType: 'LEAVE_REQUEST',
      entityName: `${requester.employeeCode} - ${totalDays} Days`,
      recordId: leaveId,
      changes: [
        { field: 'startDate', newValue: startDate },
        { field: 'endDate', newValue: endDate },
        { field: 'totalDays', newValue: totalDays },
        { field: 'reason', newValue: reason },
      ],
    });

    alerts.success(
      language === 'lo' ? 'ສົ່ງຄຳຮ້ອງຂໍລາພັກສຳເລັດ' : 'Leave Request Submitted',
      language === 'lo' ? 'ຄຳຮ້ອງໄດ້ຖືກສົ່ງໄປຫາສາຍການອະນຸມັດແລ້ວ' : 'Sent to workflow approver for review.'
    );
  };

  const processApproval = async (requestId: string, action: 'APPROVE' | 'REJECT' | 'RETURN', comments?: string) => {
    const appr = approvalRequests.find((a) => a.id === requestId);
    if (!appr) return;

    const actionText = action === 'APPROVE' ? 'APPROVED' : action === 'REJECT' ? 'REJECTED' : 'RETURNED';

    setApprovalRequests((prev) =>
      prev.map((a) => {
        if (a.id === requestId) {
          const isFinal = a.currentStep >= a.totalSteps || action !== 'APPROVE';
          const nextStatus = isFinal ? actionText : 'PENDING';
          return {
            ...a,
            status: nextStatus,
            currentStep: action === 'APPROVE' ? Math.min(a.totalSteps, a.currentStep + 1) : a.currentStep,
            history: [
              ...a.history,
              {
                actorName: currentUser.fullName,
                actorRole: currentUser.role,
                action: actionText as any,
                comments: comments || (action === 'APPROVE' ? 'Approved through workflow' : 'Processed'),
                timestamp: new Date().toISOString(),
              },
            ],
          };
        }
        return a;
      })
    );

    // Sync underlying domain models
    if (appr.type === 'LEAVE') {
      setLeaveRequests((prev) =>
        prev.map((lr) =>
          lr.id === appr.referenceId
            ? {
                ...lr,
                status: actionText as any,
                approverComments: comments,
                approvedAt: action === 'APPROVE' ? new Date().toISOString() : undefined,
              }
            : lr
        )
      );

      if (action === 'APPROVE') {
        const lr = leaveRequests.find((l) => l.id === appr.referenceId);
        if (lr) {
          setLeaveBalances((prev) =>
            prev.map((lb) =>
              lb.employeeId === lr.employeeId && lb.leaveTypeId === lr.leaveTypeId
                ? {
                    ...lb,
                    used: lb.used + lr.totalDays,
                    remaining: Math.max(0, lb.remaining - lr.totalDays),
                  }
                : lb
            )
          );
        }
      }
    } else if (appr.type === 'EXPENSE') {
      setExpenseClaims((prev) =>
        prev.map((ex) =>
          ex.id === appr.referenceId
            ? {
                ...ex,
                status: actionText as any,
                approverComments: comments,
              }
            : ex
        )
      );
    }

    addAuditLog(
      `APPROVAL_${action}`,
      action === 'APPROVE' ? 'APPROVE' : 'REJECT',
      'Central Approval Workflow',
      `${actionText} ${appr.type} request '${appr.title}'. Comments: ${comments || 'None'}`,
      {
        entityType: 'APPROVAL_REQUEST',
        entityName: appr.title,
        recordId: requestId,
        changes: [
          { field: 'status', oldValue: appr.status, newValue: actionText },
          { field: 'comments', newValue: comments || 'None' },
        ],
      }
    );

    alerts.success(
      language === 'lo' ? 'ດຳເນີນການອະນຸມັດສຳເລັດ' : 'Approval Action Processed',
      `${language === 'lo' ? 'ສະຖານະໃໝ່' : 'New Status'}: ${actionText}`
    );
  };

  const submitExpenseClaim = (title: string, category: any, totalAmount: number, receiptsCount: number) => {
    const empId = currentUser.employeeId || 'emp-004';
    const requester = employees.find((e) => e.id === empId) || employees[0];
    const claimId = `exp-${Date.now()}`;

    const newClaim: ExpenseClaim = {
      id: claimId,
      claimNumber: `EXP-2026-${Math.floor(100 + Math.random() * 900)}`,
      employeeId: empId,
      title,
      category,
      totalAmount,
      currency: 'LAK',
      receiptsCount,
      status: 'PENDING',
      approverId: 'emp-003',
      createdAt: new Date().toISOString(),
    };

    const newApproval: ApprovalRequest = {
      id: `appr-${Date.now()}`,
      type: 'EXPENSE',
      referenceId: claimId,
      title: `${language === 'lo' ? 'ໃບສະເໜີເບີກຈ່າຍ' : 'Expense Claim'} - ${title}`,
      requesterId: empId,
      requesterName: `${requester.firstNameLao} ${requester.lastNameLao}`,
      departmentName: departments.find((d) => d.id === requester.departmentId)?.nameLao || 'ພະແນກ',
      amountOrDays: `${totalAmount.toLocaleString()} LAK`,
      currentStep: 1,
      totalSteps: 2,
      assignedApproverRole: 'DEPT_HEAD',
      assignedApproverId: 'emp-003',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      history: [
        {
          actorName: `${requester.firstNameLao} ${requester.lastNameLao}`,
          actorRole: currentUser.role,
          action: 'SUBMITTED',
          comments: `Claim submitted with ${receiptsCount} supporting tax receipts.`,
          timestamp: new Date().toISOString(),
        },
      ],
    };

    setExpenseClaims((prev) => [newClaim, ...prev]);
    setApprovalRequests((prev) => [newApproval, ...prev]);

    addAuditLog('EXPENSE_SUBMIT', 'CREATE', 'Expense Claims', `Submitted claim of ${totalAmount.toLocaleString()} LAK: ${title}`, {
      entityType: 'EXPENSE_CLAIM',
      entityName: `${newClaim.claimNumber} - ${title}`,
      recordId: claimId,
      changes: [
        { field: 'totalAmount', newValue: `${totalAmount.toLocaleString()} LAK` },
        { field: 'category', newValue: category },
        { field: 'receiptsCount', newValue: receiptsCount },
      ],
    });

    alerts.success(
      language === 'lo' ? 'ຍື່ນໃບສະເໜີເບີກຈ່າຍສຳເລັດ' : 'Expense Claim Submitted',
      language === 'lo' ? 'ສົ່ງໄປຫາພະແນກການເງິນເພື່ອກວດກາແລ້ວ' : 'Forwarded to Finance for verification.'
    );
  };

  const runMonthlyPayroll = (periodName: string, startDate: string, endDate: string) => {
    const periodId = `pp-${Date.now()}`;
    const generatedPayslips = generatePayslipsForEmployees(employees, periodId);

    const totalGross = generatedPayslips.reduce((sum, p) => sum + p.grossSalary, 0);
    const totalSS = generatedPayslips.reduce((sum, p) => sum + p.socialSecurityEmployee, 0);
    const totalTax = generatedPayslips.reduce((sum, p) => sum + p.personalIncomeTax, 0);
    const totalNet = generatedPayslips.reduce((sum, p) => sum + p.netPay, 0);

    const newPeriod: PayrollPeriod = {
      id: periodId,
      code: periodName,
      startDate,
      endDate,
      paymentDate: endDate,
      status: 'APPROVED',
      totalGrossSalary: totalGross,
      totalSocialSecurity: totalSS,
      totalIncomeTax: totalTax,
      totalNetPay: totalNet,
      employeeCount: generatedPayslips.length,
    };

    setPayrollPeriods((prev) => [newPeriod, ...prev]);
    setPayslips((prev) => [...generatedPayslips, ...prev]);

    addAuditLog(
      'PAYROLL_RUN',
      'CREATE',
      'Payroll Management',
      `Executed monthly payroll run for ${periodName} covering ${generatedPayslips.length} employees. Total Net: ${totalNet.toLocaleString()} LAK`,
      {
        entityType: 'PAYROLL_PERIOD',
        entityName: periodName,
        recordId: periodId,
        changes: [
          { field: 'employeeCount', newValue: generatedPayslips.length },
          { field: 'totalGrossSalary', newValue: `${totalGross.toLocaleString()} LAK` },
          { field: 'totalNetPay', newValue: `${totalNet.toLocaleString()} LAK` },
          { field: 'totalIncomeTax', newValue: `${totalTax.toLocaleString()} LAK` },
          { field: 'totalSocialSecurity', newValue: `${totalSS.toLocaleString()} LAK` },
        ],
      }
    );

    alerts.success(
      language === 'lo' ? 'ຄິດໄລ່ເງິນເດືອນສຳເລັດ' : 'Payroll Run Completed',
      `${language === 'lo' ? 'ຍອດຈ່າຍສຸດທິ' : 'Total Net Pay'}: ${totalNet.toLocaleString()} LAK`
    );
  };

  const addEmployee = (emp: Omit<Employee, 'id'>) => {
    // Extract max numeric code to ensure reserved sequential order
    let finalCode = emp.employeeCode;
    if (!finalCode || employees.some((e) => e.employeeCode.toUpperCase() === finalCode.toUpperCase())) {
      let maxNum = 0;
      employees.forEach((e) => {
        const match = e.employeeCode.match(/LHSE-(\d+)/i);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxNum) maxNum = num;
        }
      });
      finalCode = `LHSE-${String(maxNum + 1).padStart(3, '0')}`;
    }

    const newId = `emp-lhse-${Date.now()}`;
    const newEmp: Employee = {
      ...emp,
      employeeCode: finalCode,
      id: newId,
    };
    setEmployees((prev) => [newEmp, ...prev]);

    addAuditLog(
      'EMPLOYEE_CREATE',
      'CREATE',
      'Employee Management',
      `Created new employee record: ${newEmp.employeeCode} - ${newEmp.prefixLao || ''} ${newEmp.firstNameLao} ${newEmp.lastNameLao} (${newEmp.firstNameEn} ${newEmp.lastNameEn})`,
      {
        entityType: 'EMPLOYEE',
        entityName: `${newEmp.employeeCode} - ${newEmp.firstNameEn} ${newEmp.lastNameEn}`,
        recordId: newId,
        changes: [
          { field: 'employeeCode', newValue: newEmp.employeeCode },
          { field: 'fullName', newValue: `${newEmp.firstNameEn} ${newEmp.lastNameEn}` },
          { field: 'department', newValue: departments.find((d) => d.id === newEmp.departmentId)?.nameEn },
          { field: 'position', newValue: positions.find((p) => p.id === newEmp.positionId)?.titleEn },
          { field: 'baseSalary', newValue: `${newEmp.baseSalary.toLocaleString()} LAK` },
          { field: 'email', newValue: newEmp.email },
        ],
      }
    );

    alerts.success(
      language === 'lo' ? 'ເພີ່ມພະນັກງານສຳເລັດ' : 'Employee Created',
      `${newEmp.employeeCode} - ${newEmp.firstNameLao} ${newEmp.lastNameLao}`
    );
  };

  const updateEmployee = (emp: Employee) => {
    const existing = employees.find((e) => e.id === emp.id);
    const changes: AuditChange[] = [];

    if (existing) {
      if (existing.baseSalary !== emp.baseSalary) {
        changes.push({
          field: 'baseSalary',
          fieldLabelEn: 'Base Salary',
          oldValue: `${existing.baseSalary.toLocaleString()} LAK`,
          newValue: `${emp.baseSalary.toLocaleString()} LAK`,
        });
      }
      if (existing.departmentId !== emp.departmentId) {
        changes.push({
          field: 'departmentId',
          fieldLabelEn: 'Department',
          oldValue: departments.find((d) => d.id === existing.departmentId)?.nameEn,
          newValue: departments.find((d) => d.id === emp.departmentId)?.nameEn,
        });
      }
      if (existing.positionId !== emp.positionId) {
        changes.push({
          field: 'positionId',
          fieldLabelEn: 'Position',
          oldValue: positions.find((p) => p.id === existing.positionId)?.titleEn,
          newValue: positions.find((p) => p.id === emp.positionId)?.titleEn,
        });
      }
      if (existing.status !== emp.status) {
        changes.push({
          field: 'status',
          fieldLabelEn: 'Employment Status',
          oldValue: existing.status,
          newValue: emp.status,
        });
      }
      if (existing.phone !== emp.phone) {
        changes.push({ field: 'phone', oldValue: existing.phone, newValue: emp.phone });
      }
    }

    setEmployees((prev) => prev.map((e) => (e.id === emp.id ? emp : e)));

    addAuditLog(
      'EMPLOYEE_UPDATE',
      'UPDATE',
      'Employee Management',
      `Updated profile of ${emp.employeeCode} (${emp.firstNameEn} ${emp.lastNameEn}). ${changes.length} field(s) modified.`,
      {
        entityType: 'EMPLOYEE',
        entityName: `${emp.employeeCode} - ${emp.firstNameEn} ${emp.lastNameEn}`,
        recordId: emp.id,
        changes: changes.length > 0 ? changes : [{ field: 'profile', oldValue: 'Standard info', newValue: 'Updated info' }],
      }
    );

    alerts.success(language === 'lo' ? 'ອັບເດດຂໍ້ມູນສຳເລັດ' : 'Employee Updated');
  };

  const deleteEmployee = (id: string) => {
    const emp = employees.find((e) => e.id === id);
    const empName = emp ? `${emp.employeeCode} - ${emp.firstNameEn} ${emp.lastNameEn}` : id;

    setEmployees((prev) => prev.filter((e) => e.id !== id));

    addAuditLog(
      'EMPLOYEE_DELETE',
      'DELETE',
      'Employee Management',
      `Removed employee record: ${empName}`,
      {
        entityType: 'EMPLOYEE',
        entityName: empName,
        recordId: id,
      }
    );

    alerts.success(language === 'lo' ? 'ລຶບພະນັກງານສຳເລັດ' : 'Employee Removed');
  };

  const importEmployeesBatch = (newEmps: Employee[], report?: any) => {
    const batchId = report?.batchId || `batch-${Date.now()}`;
    const stampedEmps = newEmps.map((emp) => ({
      ...emp,
      migrationBatchId: batchId,
      importedAt: emp.importedAt || new Date().toISOString(),
    }));

    setEmployees((prev) => {
      const existingCodes = new Set(prev.map((e) => e.employeeCode.toUpperCase()));
      const filtered = stampedEmps.filter((e) => !existingCodes.has(e.employeeCode.toUpperCase()));
      return [...prev, ...filtered];
    });

    addAuditLog(
      'EMPLOYEE_IMPORT',
      'CREATE',
      'Employee Management',
      `Authorized batch import: ${newEmps.length} records processed from Employee_Data (1).xlsx. Migration Batch ID: ${batchId}.`,
      {
        entityType: 'EMPLOYEE_BATCH',
        entityName: `Batch Import (${newEmps.length} records)`,
        recordId: batchId,
        changes: [
          { field: 'importedCount', newValue: newEmps.length },
          { field: 'sourceFile', newValue: report?.sourceFileName || 'Employee_Data (1).xlsx' },
          { field: 'operator', newValue: currentUser.fullName || 'Authorized Admin' },
        ],
      }
    );

    alerts.success(
      language === 'lo' ? 'ນຳເຂົ້າຂໍ້ມູນສຳເລັດ' : 'Employees Imported Successfully',
      `${newEmps.length} ${language === 'lo' ? 'ລາຍການຖືກເພີ່ມເຂົ້າສູ່ລະບົບ LHSE ຢ່າງປອດໄພ' : 'verified records committed to LHSE production records.'}`
    );
  };

  const hireCandidateAndOnboard = (candidateId: string) => {
    const cand = candidates.find((c) => c.id === candidateId);
    if (!cand) return;

    setCandidates((prev) => prev.map((c) => (c.id === candidateId ? { ...c, stage: 'HIRED' } : c)));

    const nextCode = `LHSE-${String(employees.length + 1).padStart(3, '0')}`;
    const nameParts = cand.fullName.split(' ');
    const newId = `emp-${Date.now()}`;
    const newEmp: Employee = {
      id: newId,
      employeeCode: nextCode,
      firstNameEn: nameParts[1] || cand.fullName,
      lastNameEn: nameParts[2] || 'LHSE',
      firstNameLao: cand.fullName,
      lastNameLao: 'ໃຫມ່',
      email: cand.email,
      phone: cand.phone,
      gender: 'MALE',
      dateOfBirth: '1996-01-01',
      nationalId: `LAO-01-${Math.floor(100000 + Math.random() * 900000)}`,
      branchId: 'b-1',
      departmentId: 'd-4',
      positionId: 'pos-4',
      joiningDate: new Date().toISOString().split('T')[0],
      employmentType: 'PROBATION',
      status: 'ACTIVE',
      baseSalary: 18000000,
      bankName: 'BCEL',
      education: 'Bachelor of Engineering',
    };

    setEmployees((prev) => [newEmp, ...prev]);

    addAuditLog(
      'CANDIDATE_HIRED',
      'CREATE',
      'Recruitment',
      `Candidate '${cand.fullName}' hired and converted into active Onboarding employee with code ${nextCode}`,
      {
        entityType: 'CANDIDATE_ONBOARD',
        entityName: `${cand.fullName} -> ${nextCode}`,
        recordId: newId,
        changes: [
          { field: 'stage', oldValue: cand.stage, newValue: 'HIRED' },
          { field: 'employeeCode', newValue: nextCode },
        ],
      }
    );

    alerts.success(
      language === 'lo' ? 'ຮັບເຂົ້າເຮັດວຽກ & ສົ່ງຕໍ່ Onboarding ສຳເລັດ' : 'Candidate Hired & Onboarded',
      `${language === 'lo' ? 'ລະຫັດພະນັກງານໃໝ່' : 'New Employee Code'}: ${nextCode}`
    );
  };

  const assignAssetToEmployee = (assetId: string, employeeId: string) => {
    const asset = assets.find((a) => a.id === assetId);
    const emp = employees.find((e) => e.id === employeeId);

    setAssets((prev) =>
      prev.map((a) =>
        a.id === assetId
          ? {
              ...a,
              assignedEmployeeId: employeeId,
              assignmentDate: new Date().toISOString().split('T')[0],
              status: 'ASSIGNED',
            }
          : a
      )
    );

    addAuditLog(
      'ASSET_ASSIGN',
      'UPDATE',
      'Documents & Assets',
      `Assigned equipment '${asset?.name || assetId}' (${asset?.assetTag}) to employee ${emp?.firstNameEn || employeeId}`,
      {
        entityType: 'ASSET',
        entityName: `${asset?.assetTag} - ${asset?.name}`,
        recordId: assetId,
        changes: [
          { field: 'status', oldValue: 'AVAILABLE', newValue: 'ASSIGNED' },
          { field: 'assignedEmployeeId', oldValue: 'Unassigned', newValue: `${emp?.employeeCode} - ${emp?.firstNameEn}` },
        ],
      }
    );

    alerts.success(language === 'lo' ? 'ມອບໝາຍຊັບສິນສຳເລັດ' : 'Asset Assigned Successfully');
  };

  const returnAssetToInventory = (assetId: string) => {
    const asset = assets.find((a) => a.id === assetId);
    const prevEmp = employees.find((e) => e.id === asset?.assignedEmployeeId);

    setAssets((prev) =>
      prev.map((a) =>
        a.id === assetId
          ? {
              ...a,
              assignedEmployeeId: undefined,
              assignmentDate: undefined,
              status: 'AVAILABLE',
            }
          : a
      )
    );

    addAuditLog(
      'ASSET_RETURN',
      'UPDATE',
      'Documents & Assets',
      `Equipment '${asset?.name || assetId}' (${asset?.assetTag}) returned to inventory from ${prevEmp?.firstNameEn || 'employee'}`,
      {
        entityType: 'ASSET',
        entityName: `${asset?.assetTag} - ${asset?.name}`,
        recordId: assetId,
        changes: [
          { field: 'status', oldValue: 'ASSIGNED', newValue: 'AVAILABLE' },
          { field: 'assignedEmployeeId', oldValue: prevEmp?.employeeCode || 'Assigned', newValue: 'None (In Inventory)' },
        ],
      }
    );

    alerts.success(language === 'lo' ? 'ຮັບຄືນຊັບສິນສຳເລັດ' : 'Asset Returned to Inventory');
  };

  const createDocument = (data: {
    docNumber: string;
    title: string;
    titleLao: string;
    category: DocumentCategory;
    description: string;
    descriptionLao: string;
    departmentId: string;
    initialContent: string;
    tags: string[];
    fileType?: 'DOCX' | 'PDF' | 'MARKDOWN';
    isScanned?: boolean;
    scannedImageUrl?: string;
    scannedPages?: string[];
    employeeId?: string;
    extractedMetadata?: EnterpriseDocument['extractedMetadata'];
  }) => {
    const docId = `doc-${Date.now()}`;
    const initialVer: DocumentVersion = {
      id: `ver-${docId}-1`,
      documentId: docId,
      version: 'v1.0',
      title: data.title,
      titleLao: data.titleLao,
      content: data.initialContent,
      changeSummary: data.isScanned
        ? 'Digitized physical document via camera scanner with OCR extraction.'
        : 'Initial document creation and baseline publication.',
      changeType: 'MAJOR',
      changedBy: currentUser.fullName,
      changedByRole: currentUser.role,
      changedAt: new Date().toISOString(),
      fileSize: data.isScanned && data.scannedPages?.length
        ? `${Math.round(data.scannedPages.length * 380)} KB`
        : `${Math.max(10, Math.round(data.initialContent.length / 100) / 10)} KB`,
      status: 'ACTIVE',
      scannedImageUrl: data.scannedImageUrl,
      scannedPages: data.scannedPages,
    };

    const newDoc: EnterpriseDocument = {
      id: docId,
      docNumber: data.docNumber,
      title: data.title,
      titleLao: data.titleLao,
      category: data.category,
      description: data.description,
      descriptionLao: data.descriptionLao,
      departmentId: data.departmentId,
      currentVersion: 'v1.0',
      content: data.initialContent,
      fileType: data.fileType || (data.isScanned ? 'PDF' : 'DOCX'),
      fileSize: initialVer.fileSize,
      status: 'ACTIVE',
      lastModifiedAt: initialVer.changedAt,
      lastModifiedBy: currentUser.fullName,
      lastModifiedByRole: currentUser.role,
      versions: [initialVer],
      tags: data.tags.length > 0 ? data.tags : ['Standard Document'],
      isScanned: data.isScanned,
      scannedImageUrl: data.scannedImageUrl,
      scannedPages: data.scannedPages,
      employeeId: data.employeeId,
      extractedMetadata: data.extractedMetadata,
    };

    setDocuments((prev) => [newDoc, ...prev]);

    addAuditLog(
      data.isScanned ? 'DOCUMENT_SCAN' : 'DOCUMENT_CREATE',
      'CREATE',
      'Documents & Assets',
      data.isScanned
        ? `Digitized physical document '${data.docNumber}' (${data.title}) via optical camera scanner. ${data.scannedPages?.length || 1} page(s) captured.`
        : `Created new enterprise document '${data.docNumber}' (${data.title}) with initial baseline v1.0`,
      {
        entityType: 'ENTERPRISE_DOCUMENT',
        entityName: `${data.docNumber} - ${data.title}`,
        recordId: docId,
        changes: [
          { field: 'version', newValue: 'v1.0' },
          { field: 'category', newValue: data.category },
          ...(data.isScanned ? [{ field: 'digitizationMethod', newValue: 'Camera Optical Scanner' }] : []),
        ],
      }
    );

    alerts.success(
      language === 'lo'
        ? (data.isScanned ? 'ສະແກນ ແລະ ບັນທຶກເອກະສານສຳເລັດ' : 'ສ້າງເອກະສານສຳເລັດ')
        : (data.isScanned ? 'Document Scanned & Digitized' : 'Document Created'),
      `${data.docNumber} (${data.title})`
    );
  };

  const updateDocument = (
    documentId: string,
    updates: {
      title?: string;
      titleLao?: string;
      category?: DocumentCategory;
      description?: string;
      descriptionLao?: string;
      departmentId?: string;
      content: string;
      changeSummary: string;
      changeType: 'MAJOR' | 'MINOR' | 'PATCH';
    }
  ) => {
    const doc = documents.find((d) => d.id === documentId);
    if (!doc) return;

    const nextVerTag = calculateNextVersion(doc.currentVersion, updates.changeType);
    const nowIso = new Date().toISOString();
    const newVerId = `ver-${documentId}-${Date.now()}`;

    const newVersionObj: DocumentVersion = {
      id: newVerId,
      documentId,
      version: nextVerTag,
      title: updates.title || doc.title,
      titleLao: updates.titleLao || doc.titleLao,
      content: updates.content,
      changeSummary: updates.changeSummary.trim() || `Updated document to ${nextVerTag}`,
      changeType: updates.changeType,
      changedBy: currentUser.fullName,
      changedByRole: currentUser.role,
      changedAt: nowIso,
      fileSize: `${Math.max(12, Math.round(updates.content.length / 100) / 10)} KB`,
      status: 'ACTIVE',
    };

    const updatedVersions: DocumentVersion[] = [
      newVersionObj,
      ...doc.versions.map((v) => ({
        ...v,
        status: (v.status === 'ACTIVE' ? 'SUPERSEDED' : v.status) as 'ACTIVE' | 'SUPERSEDED' | 'RESTORED',
      })),
    ];

    setDocuments((prev) =>
      prev.map((d) =>
        d.id === documentId
          ? {
              ...d,
              title: updates.title || d.title,
              titleLao: updates.titleLao || d.titleLao,
              category: updates.category || d.category,
              description: updates.description || d.description,
              descriptionLao: updates.descriptionLao || d.descriptionLao,
              departmentId: updates.departmentId || d.departmentId,
              currentVersion: nextVerTag,
              content: updates.content,
              fileSize: newVersionObj.fileSize,
              lastModifiedAt: nowIso,
              lastModifiedBy: currentUser.fullName,
              lastModifiedByRole: currentUser.role,
              versions: updatedVersions,
            }
          : d
      )
    );

    addAuditLog(
      'DOCUMENT_EDIT',
      'UPDATE',
      'Documents & Assets',
      `Document '${doc.docNumber}' updated from ${doc.currentVersion} -> ${nextVerTag} (${updates.changeType}): ${updates.changeSummary}`,
      {
        entityType: 'ENTERPRISE_DOCUMENT',
        entityName: `${doc.docNumber} - ${doc.title}`,
        recordId: documentId,
        changes: [
          { field: 'version', oldValue: doc.currentVersion, newValue: nextVerTag },
          { field: 'changeSummary', newValue: updates.changeSummary },
          { field: 'changeType', newValue: updates.changeType },
        ],
      }
    );

    alerts.success(
      language === 'lo' ? 'ບັນທຶກການແກ້ໄຂສຳເລັດ' : 'Document Version Saved',
      `${doc.docNumber} ${language === 'lo' ? 'ອັບເດດເປັນເວີຊັນ' : 'updated to version'} ${nextVerTag}`
    );
  };

  const restoreDocumentVersion = (documentId: string, targetVersionId: string, restoreNote?: string) => {
    const doc = documents.find((d) => d.id === documentId);
    if (!doc) return;

    const targetVer = doc.versions.find((v) => v.id === targetVersionId);
    if (!targetVer) return;

    const nextVerTag = calculateNextVersion(doc.currentVersion, 'RESTORE');
    const nowIso = new Date().toISOString();
    const newVerId = `ver-${documentId}-${Date.now()}`;

    const restoredVersionObj: DocumentVersion = {
      id: newVerId,
      documentId,
      version: nextVerTag,
      title: targetVer.title,
      titleLao: targetVer.titleLao,
      content: targetVer.content,
      changeSummary:
        restoreNote?.trim() ||
        `Restored from ${targetVer.version} (originally published ${new Date(targetVer.changedAt).toLocaleDateString()})`,
      changeType: 'RESTORE',
      changedBy: currentUser.fullName,
      changedByRole: currentUser.role,
      changedAt: nowIso,
      fileSize: targetVer.fileSize,
      status: 'ACTIVE',
      restoredFromVersion: targetVer.version,
    };

    const updatedVersions: DocumentVersion[] = [
      restoredVersionObj,
      ...doc.versions.map((v) => ({
        ...v,
        status: (v.status === 'ACTIVE' ? 'SUPERSEDED' : v.status) as 'ACTIVE' | 'SUPERSEDED' | 'RESTORED',
      })),
    ];

    setDocuments((prev) =>
      prev.map((d) =>
        d.id === documentId
          ? {
              ...d,
              title: targetVer.title,
              titleLao: targetVer.titleLao,
              currentVersion: nextVerTag,
              content: targetVer.content,
              fileSize: targetVer.fileSize,
              lastModifiedAt: nowIso,
              lastModifiedBy: currentUser.fullName,
              lastModifiedByRole: currentUser.role,
              versions: updatedVersions,
            }
          : d
      )
    );

    addAuditLog(
      'DOCUMENT_RESTORE',
      'UPDATE',
      'Documents & Assets',
      `Restored document '${doc.docNumber}' to snapshot of ${targetVer.version}. New active version: ${nextVerTag}`,
      {
        entityType: 'ENTERPRISE_DOCUMENT',
        entityName: `${doc.docNumber} - ${doc.title}`,
        recordId: documentId,
        changes: [
          { field: 'restoredFromVersion', oldValue: doc.currentVersion, newValue: targetVer.version },
          { field: 'currentVersion', oldValue: doc.currentVersion, newValue: nextVerTag },
        ],
      }
    );

    alerts.success(
      language === 'lo' ? 'ກູ້ຄືນເວີຊັນເອກະສານສຳເລັດ' : 'Version Restored Successfully',
      `${doc.docNumber} ${language === 'lo' ? `ໄດ້ຖືກກູ້ຄືນຈາກ ${targetVer.version} ເປັນເວີຊັນໃໝ່ ${nextVerTag}` : `reverted back to ${targetVer.version} as new version ${nextVerTag}`}`
    );
  };

  const deleteDocument = (documentId: string) => {
    const doc = documents.find((d) => d.id === documentId);
    setDocuments((prev) => prev.filter((d) => d.id !== documentId));

    if (doc) {
      addAuditLog(
        'DOCUMENT_DELETE',
        'DELETE',
        'Documents & Assets',
        `Archived/Deleted document '${doc.docNumber}' (${doc.title}) and all ${doc.versions.length} versions`,
        {
          entityType: 'ENTERPRISE_DOCUMENT',
          entityName: `${doc.docNumber} - ${doc.title}`,
          recordId: documentId,
        }
      );
      alerts.success(language === 'lo' ? 'ລຶບເອກະສານສຳເລັດ' : 'Document Removed');
    }
  };

  const updateDocumentTags = (documentId: string, tags: string[]) => {
    const doc = documents.find((d) => d.id === documentId);
    if (!doc) return;

    setDocuments((prev) =>
      prev.map((d) => (d.id === documentId ? { ...d, tags } : d))
    );

    addAuditLog(
      'DOCUMENT_TAGS_UPDATE',
      'UPDATE',
      'Documents & Assets',
      `Updated custom labels/tags for document '${doc.docNumber}' (${doc.title}): [${tags.join(', ')}]`,
      {
        entityType: 'ENTERPRISE_DOCUMENT',
        entityName: `${doc.docNumber} - ${doc.title}`,
        recordId: documentId,
        changes: [
          { field: 'tags', oldValue: doc.tags.join(', '), newValue: tags.join(', ') },
        ],
      }
    );

    alerts.success(
      language === 'lo' ? 'ອັບເດດປ້າຍກຳກັບສຳເລັດ' : 'Tags Updated',
      `${doc.docNumber}: ${tags.length} ${language === 'lo' ? 'ປ້າຍກຳກັບຖືກມອບໝາຍ' : 'tags assigned'}`
    );
  };

  const createDisciplinaryCase = (data: Omit<DisciplinaryCase, 'id' | 'createdAt'>) => {
    const newCase: DisciplinaryCase = {
      ...data,
      id: `disc-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setDisciplinaryCases((prev) => [newCase, ...prev]);

    const targetEmp = employees.find((e) => e.id === data.employeeId);

    addAuditLog(
      'DISCIPLINE_CREATE',
      'CREATE',
      'Discipline & Warnings',
      `Issued disciplinary action ${data.caseNumber} (${data.severity}) to ${targetEmp?.employeeCode || data.employeeId}`,
      {
        entityType: 'DISCIPLINARY_CASE',
        entityName: `${data.caseNumber} (${data.category})`,
        recordId: newCase.id,
        changes: [
          { field: 'severity', newValue: data.severity },
          { field: 'category', newValue: data.category },
          { field: 'actionTaken', newValue: data.actionTaken },
        ],
      }
    );

    alerts.success(language === 'lo' ? 'ສ້າງບັນທຶກລະບຽບວິໄນສຳເລັດ' : 'Disciplinary Record Created');
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    alerts.success(language === 'lo' ? 'ໝາຍວ່າອ່ານແລ້ວທັງໝົດ' : 'Marked all as read');
  };

  const updateUserRole = (userId: string, newRole: Role, departmentId?: string) => {
    setAvailableUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const updated: User = {
            ...u,
            role: newRole,
            departmentId: departmentId !== undefined ? departmentId : u.departmentId,
          };
          if (currentUser.id === userId) {
            setCurrentUser(updated);
          }
          return updated;
        }
        return u;
      })
    );
    addAuditLog('ROLE_PERMISSION_UPDATE', 'UPDATE', 'User Access Control', `Changed role for user ${userId} to ${newRole}`, {
      entityType: 'USER_ROLE',
      recordId: userId,
    });
  };

  const updateUser = (userId: string, updates: Partial<User>) => {
    setAvailableUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const updated: User = { ...u, ...updates };
          if (currentUser.id === userId) {
            setCurrentUser(updated);
          }
          return updated;
        }
        return u;
      })
    );
    addAuditLog('USER_UPDATE', 'UPDATE', 'User Access Control', `Updated user account ${userId}`, {
      entityType: 'USER_ACCOUNT',
      recordId: userId,
    });
  };

  const createUserAccount = (userData: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = {
      ...userData,
      id: `usr-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
    };
    setAvailableUsers((prev) => [...prev, newUser]);
    addAuditLog('USER_CREATE', 'CREATE', 'User Access Control', `Created user account for ${newUser.fullName} (${newUser.role})`, {
      entityType: 'USER_ACCOUNT',
      entityName: newUser.fullName,
      recordId: newUser.id,
    });
    alerts.success(language === 'lo' ? 'ສ້າງບັນຊີຜູ້ໃຊ້ສຳເລັດ' : 'User Account Created');
  };

  const deleteUserAccount = (userId: string) => {
    if (userId === currentUser.id) {
      alerts.error(language === 'lo' ? 'ບໍ່ສາມາດລຶບບັນຊີທີ່ກຳລັງເຂົ້າສູ່ລະບົບໄດ້' : 'Cannot delete currently active user');
      return;
    }
    setAvailableUsers((prev) => prev.filter((u) => u.id !== userId));
    addAuditLog('USER_DELETE', 'DELETE', 'User Access Control', `Deleted user account ${userId}`, {
      entityType: 'USER_ACCOUNT',
      recordId: userId,
    });
    alerts.success(language === 'lo' ? 'ລຶບບັນຊີຜູ້ໃຊ້ຮຽບຮ້ອຍ' : 'User Account Deleted');
  };

  const login = (usernameInput: string, passwordInput: string): { success: boolean; error?: string } => {
    const cleanUser = usernameInput.trim().toLowerCase();
    const cleanPass = passwordInput.trim();

    // Specific user requirement: Username: admin, Password: admin123456 (or updated reset password)
    if (cleanUser === 'admin' || cleanUser === 'superadmin') {
      const adminUser = availableUsers.find((u) => u.username === 'admin' || u.username === 'superadmin') || initialUsers[0];
      const isValidAdminPass = adminUser.password ? (cleanPass === adminUser.password || cleanPass === 'admin123456') : cleanPass === 'admin123456';
      if (!isValidAdminPass) {
        return {
          success: false,
          error: language === 'lo' ? 'ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ (ລະຫັດຜ່ານແມ່ນ: admin123456)' : 'Incorrect password (hint: admin123456)',
        };
      }
      setCurrentUser(adminUser);
      setIsAuthenticated(true);
      addAuditLog('USER_LOGIN', 'SYSTEM', 'Authentication', `Administrator ${adminUser.fullName} logged in successfully`, {
        entityType: 'SESSION',
        entityName: adminUser.fullName,
        recordId: adminUser.id,
      });
      return { success: true };
    }

    // Support any other registered system user with admin123456 or updated password
    const matchedUser = availableUsers.find(
      (u) => u.username.toLowerCase() === cleanUser || u.email.toLowerCase() === cleanUser
    );

    if (!matchedUser) {
      return {
        success: false,
        error: language === 'lo' ? 'ບໍ່ພົບຊື່ຜູ້ໃຊ້ນີ້ໃນລະບົບ' : 'Username not found in LHSE system',
      };
    }

    if (!matchedUser.isActive) {
      return {
        success: false,
        error: language === 'lo' ? 'ບັນຊີນີ້ຖືກປິດໃຊ້ງານຊົ່ວຄາວ' : 'This account has been deactivated',
      };
    }

    const isValidUserPass = matchedUser.password
      ? (cleanPass === matchedUser.password || cleanPass === 'admin123456')
      : (cleanPass === 'admin123456' || cleanPass.length >= 4);

    if (!isValidUserPass) {
      return {
        success: false,
        error: language === 'lo' ? 'ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ (ລະຫັດຜ່ານແມ່ນ: admin123456)' : 'Invalid password (hint: admin123456)',
      };
    }

    setCurrentUser(matchedUser);
    setIsAuthenticated(true);
    addAuditLog('USER_LOGIN', 'SYSTEM', 'Authentication', `User ${matchedUser.fullName} (${matchedUser.role}) logged in`, {
      entityType: 'SESSION',
      entityName: matchedUser.fullName,
      recordId: matchedUser.id,
    });
    return { success: true };
  };

  const logout = () => {
    addAuditLog('USER_LOGOUT', 'SYSTEM', 'Authentication', `User ${currentUser.fullName} logged out`, {
      entityType: 'SESSION',
      entityName: currentUser.username,
      recordId: currentUser.id,
    });
    setIsAuthenticated(false);
  };

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        theme,
        setTheme,
        currentUser,
        setCurrentUser,
        isAuthenticated,
        setIsAuthenticated,
        login,
        logout,
        availableUsers,
        setAvailableUsers,
        updateUserRole,
        updateUser,
        createUserAccount,
        deleteUserAccount,
        activeModule,
        setActiveModule,
        activeSubModule,
        setActiveSubModule,
        t,
        orgProfile,
        setOrgProfile,
        branches,
        setBranches,
        departments,
        setDepartments,
        positions,
        setPositions,
        employees,
        setEmployees,
        attendanceRecords,
        setAttendanceRecords,
        shifts,
        setShifts,
        holidays,
        setHolidays,
        leaveTypes,
        leaveRequests,
        leaveBalances,
        payrollPeriods,
        setPayrollPeriods,
        payslips,
        setPayslips,
        disciplinaryCases,
        expenseClaims,
        evaluations,
        setEvaluations,
        createEvaluation,
        updateEvaluation,
        deleteEvaluation,
        employeeKPIs,
        setEmployeeKPIs,
        createKPI,
        updateKPIProgress,
        updateKPISubGoal,
        deleteKPI,
        trainingCourses,
        requisitions,
        candidates,
        approvalRequests,
        assets,
        announcements,
        notifications,
        auditLogs,
        setAuditLogs,
        addAuditLog,
        punchInOut,
        submitLeaveRequest,
        processApproval,
        submitExpenseClaim,
        runMonthlyPayroll,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        importEmployeesBatch,
        hireCandidateAndOnboard,
        assignAssetToEmployee,
        returnAssetToInventory,
        documents,
        setDocuments,
        createDocument,
        updateDocument,
        restoreDocumentVersion,
        deleteDocument,
        updateDocumentTags,
        createDisciplinaryCase,
        markNotificationRead,
        markAllNotificationsRead,
        clearAuditLogs,
        shiftTemplates,
        setShiftTemplates,
        shiftAssignments,
        setShiftAssignments,
        assignShift,
        removeShiftAssignment,
        updateShiftAssignment,
        applyShiftTemplate,
        createShiftTemplate,
        updateShiftTemplate,
        deleteShiftTemplate,
        clearWeekAssignments,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
