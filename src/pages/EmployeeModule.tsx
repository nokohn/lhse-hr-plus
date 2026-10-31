import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { DataTable, Column } from '../components/common/DataTable.tsx';
import { Modal } from '../components/common/Modal.tsx';
import { EmployeeExportDropdown } from '../components/employee/EmployeeExportDropdown.tsx';
import { PerformanceManagementTab } from '../components/employee/PerformanceManagementTab.tsx';
import { EmployeePerformanceKPIsDashboard } from '../components/employee/EmployeePerformanceKPIsDashboard.tsx';
import { EmployeeGlobalSearchBar, SearchScope } from '../components/employee/EmployeeGlobalSearchBar.tsx';
import { EmployeeImportModal } from '../components/employee/EmployeeImportModal.tsx';
import { getNextLHSEEmployeeCode, exportLHSEWorkbookTemplate } from '../services/employeeExcelService.ts';
import { Employee } from '../types/index.ts';
import { alerts } from '../utils/alerts.ts';
import { QRCodeScannerModal } from '../components/common/QRCodeScannerModal.tsx';
import { QRCodeDisplay } from '../components/common/QRCodeDisplay.tsx';
import { OfficialEmployeePDFExportModal } from '../components/employee/OfficialEmployeePDFExportModal.tsx';
import { useFormAutoSave } from '../hooks/useFormAutoSave.ts';
import { FormAutoSaveIndicator } from '../components/common/FormAutoSaveIndicator.tsx';
import {
  UserPlus,
  Eye,
  FileText,
  Printer,
  Edit2,
  Trash2,
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Building2,
  Phone,
  Mail,
  Shield,
  CreditCard,
  Briefcase,
  TrendingUp,
  Target,
  Award,
  Search,
  Filter,
  Sparkles,
  Download,
  Calendar,
  Lock,
  QrCode,
  ShieldCheck,
  UserCheck,
  ChevronRight,
} from 'lucide-react';

export const EmployeeModule: React.FC = () => {
  const {
    t,
    language,
    employees,
    branches,
    departments,
    positions,
    activeSubModule,
    setActiveSubModule,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    currentUser,
    employeeKPIs,
    evaluations,
  } = useApp();

  // Modals state
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [pdfExportModalOpen, setPdfExportModalOpen] = useState(false);
  const [pdfTargetEmployee, setPdfTargetEmployee] = useState<Employee | null>(null);

  // Form Section Tab state
  const [formSection, setFormSection] = useState<'IDENTITY' | 'ORGANIZATION' | 'CONTACT' | 'FINANCE'>('IDENTITY');

  // Baseline initial state for new employee registration
  const initialEmployeeFormData: Partial<Employee> = useMemo(() => ({
    employeeCode: '',
    prefixLao: 'ທ້າວ',
    firstNameLao: '',
    lastNameLao: '',
    prefixEn: 'Mr.',
    firstNameEn: '',
    lastNameEn: '',
    gender: 'MALE',
    dateOfBirth: '1995-01-01',
    nationalId: '',
    phone: '+856 20 ',
    email: '',
    branchId: branches[0]?.id || 'b-1',
    departmentId: departments[0]?.id || 'd-1',
    positionId: positions[0]?.id || 'pos-1',
    unitName: '',
    joiningDate: new Date().toISOString().split('T')[0],
    contractEndDate: '',
    employmentType: 'PERMANENT',
    status: 'ACTIVE',
    baseSalary: 18000000,
    bankName: 'BCEL',
    bankAccountNumber: '',
    ethnicity: 'ລາວ',
    religion: 'ພຸດ',
    educationLevel: 'ມ.6',
    specialization: 'ປະລິນຍາຕີ',
    politicalTheory: '45 ວັນ',
    passportNumber: '',
    socialSecurityNumber: '',
    partyCardNumber: '',
    education: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    avatarUrl: '',
    address: '',
    orgAffiliationDate: '',
    tradeUnionMember: false,
    tradeUnionDate: '',
    youthUnionMember: false,
    youthUnionDate: '',
    womenUnionMember: false,
    womenUnionDate: '',
    partyMemberStatus: 'NONE',
    partyCandidateDate: '',
    partyFullDate: '',
    partyUnitName: '',
    massOrgPosition: '',
  }), [branches, departments, positions]);

  // Form state with all 21 columns
  const [formData, setFormData] = useState<Partial<Employee>>(initialEmployeeFormData);

  // Auto-Save integration for Employee registration
  const employeeAutoSave = useFormAutoSave<Partial<Employee>>({
    formId: 'employee_create_dossier',
    formData,
    setFormData,
    initialData: initialEmployeeFormData,
    isOpen: createModalOpen,
  });

  const isHRorAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'HR_ADMIN';

  // Real-time duplicate check against existing database (ຫ້າມບໍ່ໃຫ້ຂໍ້ມູນຊ້ຳກັນເດັດຂາດ)
  const duplicateMatch = useMemo(() => {
    const trimmedFirst = (formData.firstNameLao || '').trim().toLowerCase();
    const trimmedLast = (formData.lastNameLao || '').trim().toLowerCase();
    if (!trimmedFirst || !trimmedLast) return null;
    return employees.find(
      (e) =>
        e.id !== selectedEmp?.id &&
        e.firstNameLao.trim().toLowerCase() === trimmedFirst &&
        e.lastNameLao.trim().toLowerCase() === trimmedLast
    );
  }, [formData.firstNameLao, formData.lastNameLao, employees, selectedEmp]);

  // Global Search & Filtering state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState<SearchScope>('ALL');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');

  // Real-time filtered employees list based on global search query, scope, and department
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      // 1. Department filter
      if (selectedDeptFilter !== 'ALL' && emp.departmentId !== selectedDeptFilter) {
        return false;
      }

      // 2. Global search query filter
      if (!searchQuery.trim()) return true;
      const term = searchQuery.toLowerCase().trim();

      const dept = departments.find((d) => d.id === emp.departmentId);
      const pos = positions.find((p) => p.id === emp.positionId);

      const fullNameEn = `${emp.firstNameEn} ${emp.lastNameEn}`.toLowerCase();
      const fullNameLao = `${emp.firstNameLao} ${emp.lastNameLao}`.toLowerCase();
      const nameMatch =
        fullNameEn.includes(term) ||
        fullNameLao.includes(term) ||
        emp.firstNameEn.toLowerCase().includes(term) ||
        emp.lastNameEn.toLowerCase().includes(term) ||
        emp.firstNameLao.toLowerCase().includes(term) ||
        emp.lastNameLao.toLowerCase().includes(term);

      const codeMatch =
        emp.employeeCode.toLowerCase().includes(term) ||
        emp.id.toLowerCase().includes(term) ||
        (emp.nationalId && emp.nationalId.toLowerCase().includes(term));

      const deptMatch = dept
        ? dept.nameEn.toLowerCase().includes(term) ||
          dept.nameLao.toLowerCase().includes(term) ||
          dept.code.toLowerCase().includes(term)
        : false;

      const posMatch = pos
        ? pos.titleEn.toLowerCase().includes(term) || pos.titleLao.toLowerCase().includes(term)
        : false;

      if (searchScope === 'NAME') return nameMatch;
      if (searchScope === 'ID') return codeMatch;
      if (searchScope === 'DEPARTMENT') return deptMatch;
      return nameMatch || codeMatch || deptMatch || posMatch;
    });
  }, [employees, searchQuery, searchScope, selectedDeptFilter, departments, positions]);

  const handleOpenCreate = () => {
    const nextCode = getNextLHSEEmployeeCode(employees);
    if (!employeeAutoSave.hasDraft) {
      setFormData({
        ...initialEmployeeFormData,
        employeeCode: nextCode,
        orgAffiliationDate: new Date().toISOString().split('T')[0],
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        employeeCode: prev.employeeCode || nextCode,
      }));
    }
    setFormSection('IDENTITY');
    setCreateModalOpen(true);
  };

  const handleSaveCreate = () => {
    if (!formData.firstNameEn || !formData.lastNameEn || !formData.firstNameLao || !formData.lastNameLao || !formData.email) {
      alerts.error(
        language === 'lo' ? 'ກະລຸນາປ້ອນຂໍ້ມູນໃຫ້ຄົບຖ້ວນ' : 'Missing Required Fields',
        language === 'lo' ? 'ກະລຸນາໃສ່ຊື່ ແລະ ນາມສະກຸນທັງພາສາລາວ ແລະ ອັງກິດ, ພ້ອມທັງອີເມວ' : 'Please provide Lao name, English name, and email address.'
      );
      return;
    }

    // STRICT DUPLICATE PREVENTION (ສິ່ງສຳຄັນຫ້າມບໍ່ໃຫ້ຂໍ້ມູນຊ້ຳກັນເດັດຂາດ)
    if (duplicateMatch) {
      alerts.error(
        language === 'lo' ? 'ຂໍ້ມູນຊ້ຳກັນ! ຫ້າມລົງທະບຽນຊ້ຳກັນເດັດຂາດ' : 'Duplicate Record Prohibited',
        language === 'lo'
          ? `ພົບເຫັນພະນັກງານຊື່ "${duplicateMatch.firstNameLao} ${duplicateMatch.lastNameLao}" ລະຫັດ [${duplicateMatch.employeeCode}] ມີໃນລະບົບແລ້ວ! ລະບົບຫ້າມບໍ່ໃຫ້ຂໍ້ມູນຊ້ຳກັນເດັດຂາດ.`
          : `An employee named "${duplicateMatch.firstNameLao} ${duplicateMatch.lastNameLao}" (${duplicateMatch.employeeCode}) already exists.`
      );
      return;
    }

    // National ID duplicate check if entered
    if (formData.nationalId && formData.nationalId.trim()) {
      const dupId = employees.find((e) => e.nationalId && e.nationalId.trim() === formData.nationalId?.trim());
      if (dupId) {
        alerts.error(
          language === 'lo' ? 'ເລກບັດປະຈຳຕົວຊ້ຳກັນ' : 'Duplicate National ID',
          language === 'lo'
            ? `ເລກບັດ ${formData.nationalId} ກົງກັບພະນັກງານ ${dupId.employeeCode} (${dupId.firstNameLao} ${dupId.lastNameLao})`
            : `National ID is already in use.`
        );
        return;
      }
    }

    // Ensure safe sequential code
    if (employees.some((e) => e.employeeCode.toUpperCase() === formData.employeeCode?.toUpperCase())) {
      formData.employeeCode = getNextLHSEEmployeeCode(employees);
    }

    addEmployee(formData as any);
    employeeAutoSave.clearDraft();
    setCreateModalOpen(false);
  };

  const handleOpenEdit = (emp: Employee) => {
    setSelectedEmp(emp);
    setFormData({ ...emp });
    setFormSection('IDENTITY');
    setEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (!selectedEmp) return;
    updateEmployee({ ...selectedEmp, ...formData } as Employee);
    setEditModalOpen(false);
  };

  const handleDelete = async (emp: Employee) => {
    const confirmed = await alerts.confirm(
      language === 'lo' ? 'ຢືນຢັນການລຶບພະນັກງານ' : 'Confirm Employee Deletion',
      `${language === 'lo' ? 'ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບ' : 'Are you sure you want to remove'} ${emp.employeeCode} (${emp.firstNameLao} ${emp.lastNameLao})?`
    );
    if (confirmed) {
      deleteEmployee(emp.id);
    }
  };

  const columns: Column<Employee>[] = [
    {
      key: 'employeeCode',
      header: language === 'lo' ? 'ລະຫັດ' : 'Code',
      render: (emp) => (
        <span className="font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">
          {emp.employeeCode}
        </span>
      ),
    },
    {
      key: 'fullName',
      header: language === 'lo' ? 'ຊື່ ແລະ ນາມສະກຸນ' : 'Full Name',
      render: (emp) => (
        <div>
          <div className="font-bold text-slate-900 dark:text-slate-100">
            {language === 'lo' ? `${emp.firstNameLao} ${emp.lastNameLao}` : `${emp.firstNameEn} ${emp.lastNameEn}`}
          </div>
          <div className="text-[11px] text-slate-400 font-sans">
            {language === 'lo' ? `${emp.firstNameEn} ${emp.lastNameEn}` : `${emp.firstNameLao} ${emp.lastNameLao}`}
          </div>
        </div>
      ),
    },
    {
      key: 'departmentId',
      header: t('department'),
      render: (emp) => {
        const dept = departments.find((d) => d.id === emp.departmentId);
        return <span>{dept ? (language === 'lo' ? dept.nameLao : dept.nameEn) : '-'}</span>;
      },
    },
    {
      key: 'positionId',
      header: t('position'),
      render: (emp) => {
        const pos = positions.find((p) => p.id === emp.positionId);
        return <span className="font-medium">{pos ? (language === 'lo' ? pos.titleLao : pos.titleEn) : '-'}</span>;
      },
    },
    {
      key: 'branchId',
      header: t('branch'),
      render: (emp) => {
        const br = branches.find((b) => b.id === emp.branchId);
        return <span>{br ? (language === 'lo' ? br.nameLao : br.nameEn) : '-'}</span>;
      },
    },
    {
      key: 'status',
      header: t('status'),
      render: (emp) => (
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            emp.status === 'ACTIVE'
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
          }`}
        >
          {t(emp.status as any)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('actions'),
      sortable: false,
      render: (emp) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setSelectedEmp(emp);
              setProfileModalOpen(true);
            }}
            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setPdfTargetEmployee(emp);
              setPdfExportModalOpen(true);
            }}
            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors"
            title={language === 'lo' ? 'ສົ່ງອອກ PDF ທາງການ' : 'Export Official PDF'}
          >
            <FileText className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setActiveSubModule('performance');
            }}
            className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-slate-800 transition-colors"
            title={language === 'lo' ? 'ຕິດຕາມ KPI & ປະເມີນຜົນງານຂອງພະນັກງານ' : 'Manage KPIs & Performance Reviews'}
          >
            <Award className="w-4 h-4 text-purple-600" />
          </button>
          {isHRorAdmin && (
            <>
              <button
                onClick={() => handleOpenEdit(emp)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800 transition-colors"
                title="Edit Employee"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(emp)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                title="Remove Employee"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Submodule Tabs & Quick Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveSubModule('directory')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubModule === 'directory'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            {t('employeeDirectory')} ({employees.length})
          </button>
          <button
            onClick={() => setActiveSubModule('import')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubModule === 'import'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{t('importEmployeeData')}</span>
          </button>
          <button
            onClick={() => setActiveSubModule('performance')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubModule === 'performance' || activeSubModule === 'kpi-reviews'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            <Award className="w-4 h-4 text-amber-400" />
            <span>{language === 'lo' ? 'ຕິດຕາມ KPI & ປະເມີນຜົນງານ' : 'KPI & Performance Reviews'}</span>
            <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold ${
              activeSubModule === 'performance' || activeSubModule === 'kpi-reviews'
                ? 'bg-white/20 text-white'
                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
            }`}>
              {employeeKPIs.length} KPIs
            </span>
          </button>
          <button
            onClick={() => setActiveSubModule('performance-kpis')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubModule === 'performance-kpis'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            <Target className="w-4 h-4 text-emerald-400" />
            <span>{language === 'lo' ? 'ແດຊບອດຜົນງານ KPI' : 'KPI Leaderboard'}</span>
          </button>
        </div>

        {activeSubModule === 'directory' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubModule('performance-kpis')}
              className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
              title={language === 'lo' ? 'ເປີດແດຊບອດຜົນງານ KPI' : 'View Performance KPIs Dashboard'}
            >
              <Target className="w-3.5 h-3.5 text-emerald-200" />
              <span>{language === 'lo' ? 'ແດຊບອດ KPI' : 'Performance KPIs'}</span>
            </button>
            <button
              onClick={() => setQrScannerOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
              title={language === 'lo' ? 'ສະແກນ QR Code ບັດພະນັກງານ' : 'Scan Employee ID QR Code'}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>{language === 'lo' ? 'ສະແກນບັດ QR' : 'Scan ID QR'}</span>
            </button>
            <EmployeeExportDropdown employees={filteredEmployees} />
            {isHRorAdmin && (
              <>
                <button
                  onClick={() => setImportModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                  title="Import 21-Column Employee Spreadsheet"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>{language === 'lo' ? 'ນຳເຂົ້າ Excel (21 ຄໍລຳ)' : 'Import Excel'}</span>
                </button>
                <button
                  onClick={handleOpenCreate}
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{t('create')}</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {activeSubModule === 'directory' && (
        <div className="space-y-4">
          {/* Global Search Bar */}
          <EmployeeGlobalSearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedScope={searchScope}
            onScopeChange={setSearchScope}
            selectedDepartment={selectedDeptFilter}
            onDepartmentChange={setSelectedDeptFilter}
            totalCount={employees.length}
            filteredCount={filteredEmployees.length}
            onSelectEmployee={(emp) => {
              setSelectedEmp(emp);
              setProfileModalOpen(true);
            }}
          />

          {filteredEmployees.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 border border-slate-200 dark:border-slate-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                {language === 'lo' ? 'ບໍ່ພົບພະນັກງານທີ່ກົງກັບເງື່ອນໄຂ' : 'No Employees Found'}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {language === 'lo'
                  ? `ບໍ່ພົບຂໍ້ມູນທີ່ກົງກັບຄຳຄົ້ນຫາ "${searchQuery}". ກະລຸນາກວດສອບຕົວສະກົດ ຫຼື ລ້າງການຄົ້ນຫາ.`
                  : `No employee records match "${searchQuery}". Try searching by another name, ID, or department.`}
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchScope('ALL');
                  setSelectedDeptFilter('ALL');
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-xs"
              >
                {language === 'lo' ? 'ລ້າງການຄົ້ນຫາທັງໝົດ' : 'Clear Search & Filters'}
              </button>
            </div>
          ) : (
            <DataTable
              data={filteredEmployees}
              columns={columns}
              filename="LHSE_Employees_Directory"
              actions={
                <div className="flex items-center gap-2">
                  <EmployeeExportDropdown employees={filteredEmployees} />
                  {isHRorAdmin && (
                    <>
                      <button
                        onClick={() => setImportModalOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span>{language === 'lo' ? 'ນຳເຂົ້າ Excel' : 'Import Excel'}</span>
                      </button>
                      <button
                        onClick={handleOpenCreate}
                        className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>{t('create')}</span>
                      </button>
                    </>
                  )}
                </div>
              }
            />
          )}
        </div>
      )}

      {activeSubModule === 'import' && (
        /* Dedicated 21-Column Excel Import Dashboard */
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 lg:p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 text-xs font-bold">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>LHSE Authoritative 21-Column Data Import Engine</span>
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
                {language === 'lo' ? 'ນຳເຂົ້າຂໍ້ມູນພະນັກງານຈາກ Employee_Data (1).xlsx' : 'Import Employee_Data (1).xlsx'}
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                {language === 'lo'
                  ? 'ກວດສອບໂຄງສ້າງ 21 ຄໍລຳ, ປ້ອງກັນຂໍ້ມູນຊ້ຳຊ້ອນ (ລະຫັດ, ຊື່ ແລະ ພະແນກ, ບັດປະຈຳຕົວ), ຮັກສາຄ່າວ່າງ (Blank cells) ໂດຍບໍ່ສ້າງຂໍ້ມູນປອມ, ແລະ ຈັດສັນລະຫັດ LHSE ຕາມລຳດັບປອດໄພ.'
                  : 'Full 21-column schema validation, duplicate collision prevention, Excel date normalization, preservation of blank id_employ & photo without fabricating fake data, and sequential LHSE ID reservation.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => exportLHSEWorkbookTemplate(true)}
                className="px-3.5 py-2 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold text-xs hover:bg-emerald-100 flex items-center gap-2 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>{language === 'lo' ? 'ດາວໂຫຼດ Employee_Data (1).xlsx (93 ຄົນ)' : 'Download Authoritative Workbook'}</span>
              </button>

              <button
                onClick={() => setImportModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-transform active:scale-95"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>{language === 'lo' ? 'ເປີດໜ້າຕ່າງນຳເຂົ້າຂໍ້ມູນ (Import Wizard)' : 'Launch 21-Column Import Modal'}</span>
              </button>
            </div>
          </div>

          {/* Quick Specifications Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs text-slate-800 dark:text-slate-200">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>21-Column Strict Schema</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Matches id_employ, prefix_lao, firstname_lao, lastname_lao, prefix_en, firstname_en, lastname_en, gender, dob, national_id, phone, email, branch, department, position, joining_date, employment_type, base_salary, bank_name, bank_account, and photo.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs text-slate-800 dark:text-slate-200">
                <Shield className="w-4 h-4 text-blue-600" />
                <span>Safe Duplicate Detection</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Evaluates existing database records before writing. Detects conflicts by employee code, full name within department, or national ID, presenting detailed diagnostics before administrator sign-off.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs text-slate-800 dark:text-slate-200">
                <Lock className="w-4 h-4 text-amber-600" />
                <span>Strict Zero-Overtime (OT)</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                HR Plus+ LHSE operates in full compliance with Lao Labor Law: standard 8 hours/day (40 hours/week) schedule. Overtime (OT) is strictly excluded across all modules.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeSubModule === 'performance-kpis' && (
        <EmployeePerformanceKPIsDashboard />
      )}

      {(activeSubModule === 'performance' || activeSubModule === 'kpi-reviews') && (
        <PerformanceManagementTab />
      )}

      {/* View Profile Modal - Comprehensive 21-Column Profile */}
      <Modal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        title={selectedEmp ? `${selectedEmp.employeeCode} - ${selectedEmp.prefixLao ? selectedEmp.prefixLao + ' ' : ''}${selectedEmp.firstNameLao} ${selectedEmp.lastNameLao}` : ''}
        subtitle="LHSE Employee Information Profile (21-Column Standard Record)"
        maxWidth="3xl"
        footer={
          selectedEmp && (
            <div className="flex items-center justify-between w-full">
              <button
                type="button"
                onClick={() => {
                  setPdfTargetEmployee(selectedEmp);
                  setPdfExportModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xs transition-transform active:scale-95"
              >
                <FileText className="w-4 h-4" />
                <span>{language === 'lo' ? 'ສົ່ງອອກເອກະສານ PDF (Official PDF Templates)' : 'Export Official PDF'}</span>
              </button>
              <div className="flex items-center gap-2">
                {isHRorAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setProfileModalOpen(false);
                      handleOpenEdit(selectedEmp);
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    {language === 'lo' ? 'ແກ້ໄຂຂໍ້ມູນ' : 'Edit Profile'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setProfileModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400"
                >
                  {language === 'lo' ? 'ປິດ' : 'Close'}
                </button>
              </div>
            </div>
          )
        }
      >
        {selectedEmp && (
          <div className="space-y-6">
            {/* Quick Export PDF Banner */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-teal-50 dark:from-slate-800/80 dark:via-slate-800/60 dark:to-blue-950/30 border border-blue-200/80 dark:border-blue-900/40">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-blue-950 dark:text-blue-100">
                    {language === 'lo' ? 'ເອກະສານທາງການ LHSE (Official Documentation PDF)' : 'LHSE Official Documentation PDF'}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {language === 'lo' ? 'ຊີວະປະຫວັດ 21 ຄໍລຳ • ໃບຢັ້ງຢືນການເຮັດວຽກ • ບັດພະນັກງານພ້ອມ QR Code' : '21-Column Dossier • Service Letter • Executive Credential ID'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPdfTargetEmployee(selectedEmp);
                  setPdfExportModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{language === 'lo' ? 'ສົ່ງອອກ PDF (Official Templates)' : 'Export Official PDF'}</span>
              </button>
            </div>
            {/* LHSE Official Digital Employee ID Card with Live QR Code */}
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-5 shadow-xl border border-blue-500/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="flex flex-col sm:flex-row items-center justify-between gap-5 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center font-black text-2xl shadow-inner shrink-0 overflow-hidden">
                    {selectedEmp.avatarUrl ? (
                      <img src={selectedEmp.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span>{selectedEmp.firstNameLao?.[0] || selectedEmp.firstNameEn?.[0]}</span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-blue-500/30 text-blue-200 border border-blue-400/40">
                        {selectedEmp.employeeCode}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        <span>LHSE Official ID</span>
                      </span>
                    </div>
                    <h3 className="font-black text-lg text-white">
                      {selectedEmp.prefixLao ? `${selectedEmp.prefixLao} ` : ''}{selectedEmp.firstNameLao} {selectedEmp.lastNameLao}
                    </h3>
                    <p className="text-xs text-blue-200 font-sans">
                      {selectedEmp.prefixEn ? `${selectedEmp.prefixEn} ` : ''}{selectedEmp.firstNameEn} {selectedEmp.lastNameEn}
                    </p>
                    <p className="text-xs text-blue-300 font-medium pt-0.5">
                      {positions.find((p) => p.id === selectedEmp.positionId)?.titleLao || 'ຕຳແໜ່ງ'} • {departments.find((d) => d.id === selectedEmp.departmentId)?.nameLao || 'ພະແນກ'}
                      {selectedEmp.unitName ? ` (${selectedEmp.unitName})` : ''}
                    </p>
                  </div>
                </div>

                {/* Real-time QR Code for Employee ID Verification */}
                <div className="flex flex-col items-center bg-white p-2.5 rounded-2xl shadow-lg shrink-0">
                  <QRCodeDisplay
                    value={JSON.stringify({
                      code: selectedEmp.employeeCode,
                      name: `${selectedEmp.firstNameLao} ${selectedEmp.lastNameLao}`,
                      dept: departments.find((d) => d.id === selectedEmp.departmentId)?.nameLao || 'LHSE',
                      lhse_id: selectedEmp.id,
                    })}
                    size={100}
                    includeMargin={false}
                  />
                  <span className="text-[10px] font-mono font-bold text-slate-800 mt-1">
                    {selectedEmp.employeeCode}
                  </span>
                </div>
              </div>
            </div>

            {/* 21-Column Personnel Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-0.5">
                <span className="text-slate-400">{language === 'lo' ? 'ລະຫັດພະນັກງານ' : 'Employee Code'}</span>
                <p className="font-bold font-mono text-blue-600 dark:text-blue-400">{selectedEmp.employeeCode}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-0.5">
                <span className="text-slate-400">{language === 'lo' ? 'ເພດ' : 'Gender'}</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">{selectedEmp.gender}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-0.5">
                <span className="text-slate-400">{language === 'lo' ? 'ວັນເດືອນປີເກີດ' : 'Date of Birth'}</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">{selectedEmp.dateOfBirth || '-'}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-0.5">
                <span className="text-slate-400">{language === 'lo' ? 'ຊົນເຜົ່າ' : 'Ethnicity'}</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">{selectedEmp.ethnicity || 'ລາວ'}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-0.5">
                <span className="text-slate-400">{language === 'lo' ? 'ສາສະໜາ' : 'Religion'}</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">{selectedEmp.religion || 'ພຸດ'}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-0.5">
                <span className="text-slate-400">{language === 'lo' ? 'ລະດັບການສຶກສາສາມັນ' : 'General Education'}</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">{selectedEmp.educationLevel || selectedEmp.education || 'ມ.6'}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-0.5">
                <span className="text-slate-400">{language === 'lo' ? 'ວິຊາສະເພາະ' : 'Specialization'}</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">{selectedEmp.specialization || 'ປະລິນຍາຕີ'}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-0.5">
                <span className="text-slate-400">{language === 'lo' ? 'ທິດສະດີການເມືອງ' : 'Political Theory'}</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">{selectedEmp.politicalTheory || '-'}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-0.5">
                <span className="text-slate-400">{language === 'lo' ? 'ບັດປະຈຳຕົວ' : 'National ID'}</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 font-mono">{selectedEmp.nationalId || '-'}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-0.5">
                <span className="text-slate-400">Passport</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 font-mono">{selectedEmp.passportNumber || '-'}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-0.5">
                <span className="text-slate-400">{language === 'lo' ? 'ບັດປະກັນສັງຄົມ' : 'Social Security'}</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 font-mono">{selectedEmp.socialSecurityNumber || '-'}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-0.5">
                <span className="text-slate-400">{language === 'lo' ? 'ບັດສະມາຊິກພັກ' : 'Party Member Card'}</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 font-mono">{selectedEmp.partyCardNumber || '-'}</p>
              </div>
            </div>

            {/* Organizational & Political-Mass Affiliations (ເຂົ້າສັງກັດການຈັດຕັ້ງ) */}
            <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 space-y-3">
              <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300 font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>{language === 'lo' ? 'ຂໍ້ມູນເຂົ້າສັງກັດການຈັດຕັ້ງ & ອົງການຈັດຕັ້ງມະຫາຊົນ' : 'Organizational & Political-Mass Affiliations'}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 text-xs">
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 text-[11px] block">{language === 'lo' ? 'ເຂົ້າສັງກັດລັດ/ອົງການ' : 'Joined Org'}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedEmp.orgAffiliationDate || selectedEmp.joiningDate || '-'}</span>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 text-[11px] block">{language === 'lo' ? 'ເຂົ້າກຳມະບານ' : 'Trade Union'}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedEmp.tradeUnionDate || (selectedEmp.tradeUnionMember ? 'ສະມາຊິກ' : '-')}</span>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 text-[11px] block">{language === 'lo' ? 'ເຂົ້າຊາວໜຸ່ມ ປປລ' : 'Youth Union'}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedEmp.youthUnionDate || (selectedEmp.youthUnionMember ? 'ສະມາຊິກ' : '-')}</span>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 text-[11px] block">{language === 'lo' ? 'ເຂົ້າແມ່ຍິງ' : 'Women Union'}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedEmp.womenUnionDate || (selectedEmp.womenUnionMember ? 'ສະມາຊິກ' : '-')}</span>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 text-[11px] block">{language === 'lo' ? 'ສະຖານະພັກ ປປລ' : 'Party Status'}</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    {selectedEmp.partyMemberStatus === 'FULL'
                      ? 'ສະມາຊິກສົມບູນ'
                      : selectedEmp.partyMemberStatus === 'CANDIDATE'
                      ? 'ສະມາຊິກສຳຮອງ'
                      : selectedEmp.partyMemberStatus === 'PROGRESSIVE'
                      ? 'ມະຫາຊົນກ້າວໜ້າ'
                      : 'ມະຫາຊົນ'}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 text-[11px] block">{language === 'lo' ? 'ເຂົ້າສຳຮອງ' : 'Candidate Date'}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedEmp.partyCandidateDate || '-'}</span>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 text-[11px] block">{language === 'lo' ? 'ເຂົ້າສົມບູນ' : 'Full Member Date'}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedEmp.partyFullDate || '-'}</span>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 text-[11px] block">{language === 'lo' ? 'ໜ່ວຍພັກ' : 'Party Unit'}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedEmp.partyUnitName || '-'}</span>
                </div>
              </div>
            </div>

            {/* Individual Performance & KPI Review Summary */}
            {(() => {
              const empKPIs = employeeKPIs.filter((k) => k.employeeId === selectedEmp.id);
              const empReviews = evaluations.filter((e) => e.employeeId === selectedEmp.id);
              const latestReview = empReviews[0];
              const avgProgress = empKPIs.length > 0
                ? Math.round(empKPIs.reduce((sum, k) => sum + (k.targetValue > 0 ? (k.currentValue / k.targetValue) * 100 : 0), 0) / empKPIs.length)
                : 0;

              return (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50/70 to-blue-50/70 dark:from-purple-950/20 dark:to-blue-950/20 border border-purple-200 dark:border-purple-900/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xs text-purple-950 dark:text-purple-200">
                      <Award className="w-4 h-4 text-purple-600" />
                      <span>{language === 'lo' ? 'ຜົນງານ & ຕົວຊີ້ວັດ KPI (Individual KPIs & Reviews)' : 'Individual KPIs & Performance Reviews'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileModalOpen(false);
                        setActiveSubModule('performance');
                      }}
                      className="text-xs font-bold text-purple-700 hover:text-purple-800 dark:text-purple-300 flex items-center gap-1 cursor-pointer"
                    >
                      <span>{language === 'lo' ? 'ຈັດການໃນລະບົບ KPI' : 'Open in KPI Tracker'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">{language === 'lo' ? 'ຕົວຊີ້ວັດ KPI ທັງໝົດ' : 'Assigned KPIs'}</span>
                      <div className="text-lg font-black font-mono text-blue-600 dark:text-blue-400">{empKPIs.length} KPIs</div>
                      <span className="text-[10px] text-slate-400">{empKPIs.filter(k => k.status === 'COMPLETED' || k.status === 'ON_TRACK').length} on track / completed</span>
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">{language === 'lo' ? 'ຄວາມຄືບໜ້າສະເລ່ຍ' : 'Average KPI Progress'}</span>
                      <div className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">{avgProgress}%</div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, avgProgress)}%` }} />
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">{language === 'lo' ? 'ການປະເມີນຫຼ້າສຸດ' : 'Latest Review'}</span>
                      {latestReview ? (
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-lg font-black font-mono text-purple-600 dark:text-purple-400">{latestReview.score}/100</span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">Grade {latestReview.grade}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No reviews yet</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {selectedEmp.migrationBatchId && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-200 flex items-center justify-between">
                <span>Imported via Batch: <code className="font-bold font-mono">{selectedEmp.migrationBatchId}</code></span>
                <span>Source Row: {selectedEmp.sourceRowNumber || 'Official Record'}</span>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Create / Edit Employee Modal - Comprehensive 21-Column Schema */}
      <Modal
        isOpen={createModalOpen || editModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setEditModalOpen(false);
        }}
        title={
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <div className="text-base font-bold text-slate-900 dark:text-slate-100">
                {createModalOpen ? (language === 'lo' ? 'ລົງທະບຽນພະນັກງານໃໝ່' : 'Register New Employee') : (language === 'lo' ? 'ແກ້ໄຂຂໍ້ມູນພະນັກງານ' : 'Edit Employee Profile')}
              </div>
              <div className="text-xs text-slate-400 font-normal">
                {language === 'lo' ? 'ມາດຕະຖານ 21 ຄໍລຳ LHSE ພ້ອມອອກລະຫັດສະເພາະ' : 'Standard 21-Column LHSE Enterprise Registration'}
              </div>
            </div>
          </div>
        }
        maxWidth="3xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="text-xs text-slate-500 font-mono">
              Code: <span className="font-bold text-blue-600 dark:text-blue-400">{formData.employeeCode}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setCreateModalOpen(false);
                  setEditModalOpen(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={createModalOpen ? handleSaveCreate : handleSaveEdit}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition-transform active:scale-95"
              >
                {t('save')}
              </button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Real-time Draft Auto-Save Feedback */}
          {createModalOpen && (
            <FormAutoSaveIndicator
              isSaving={employeeAutoSave.isSaving}
              lastSaved={employeeAutoSave.lastSaved}
              isRestored={employeeAutoSave.isRestored}
              onDiscard={() => {
                employeeAutoSave.discardDraft();
                setFormData({
                  ...initialEmployeeFormData,
                  employeeCode: getNextLHSEEmployeeCode(employees),
                });
              }}
              language={language}
            />
          )}

          {/* Section Tabs inside Form */}
          <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 pb-2">
            <button
              type="button"
              onClick={() => setFormSection('IDENTITY')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                formSection === 'IDENTITY'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              <span>{language === 'lo' ? '1. ຂໍ້ມູນຕົວຕົນ' : '1. Personal Identity'}</span>
            </button>
            <button
              type="button"
              onClick={() => setFormSection('ORGANIZATION')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                formSection === 'ORGANIZATION'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              <span>{language === 'lo' ? '2. ສັງກັດ & ຕຳແໜ່ງ' : '2. Organization & Job'}</span>
            </button>
            <button
              type="button"
              onClick={() => setFormSection('CONTACT')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                formSection === 'CONTACT'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              <span>{language === 'lo' ? '3. ການຕິດຕໍ່' : '3. Contact & Address'}</span>
            </button>
            <button
              type="button"
              onClick={() => setFormSection('FINANCE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                formSection === 'FINANCE'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              <span>{language === 'lo' ? '4. ການເງິນ & ການສຶກສາ' : '4. Finance & Education'}</span>
            </button>
          </div>

          {/* TAB 1: IDENTITY */}
          {formSection === 'IDENTITY' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  {language === 'lo' ? 'ຄຳນຳໜ້າ (ລາວ)' : 'Lao Prefix (prefix_lao)'}
                </label>
                <select
                  value={formData.prefixLao || 'ທ້າວ'}
                  onChange={(e) => setFormData({ ...formData, prefixLao: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  <option value="ທ້າວ">ທ້າວ (Mr.)</option>
                  <option value="ນາງ">ນາງ (Ms. / Mrs.)</option>
                  <option value="ທ່ານ">ທ່ານ (Sir / Executive)</option>
                  <option value="ທ່ານ ນາງ">ທ່ານ ນາງ (Madam)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  {language === 'lo' ? 'ຊື່ (ພາສາລາວ) *' : 'First Name Lao (firstname_lao) *'}
                </label>
                <input
                  type="text"
                  value={formData.firstNameLao || ''}
                  onChange={(e) => setFormData({ ...formData, firstNameLao: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  placeholder="ບຸນມີ"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  {language === 'lo' ? 'ນາມສະກຸນ (ພາສາລາວ) *' : 'Last Name Lao (lastname_lao) *'}
                </label>
                <input
                  type="text"
                  value={formData.lastNameLao || ''}
                  onChange={(e) => setFormData({ ...formData, lastNameLao: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  placeholder="ໄຊຍະວົງ"
                />
              </div>

              {/* Live Duplicate Warning (ຫ້າມບໍ່ໃຫ້ຂໍ້ມູນຊ້ຳກັນເດັດຂາດ) */}
              {duplicateMatch && (
                <div className="sm:col-span-2 md:col-span-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-start gap-2.5 text-xs font-bold animate-pulse">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-black text-rose-800 dark:text-rose-200">
                      {language === 'lo' ? '⚠️ ພົບຂໍ້ມູນຊ້ຳກັນ! (Duplicate Employee Detected)' : '⚠️ Duplicate Employee Detected'}
                    </div>
                    <div className="font-normal text-xs text-rose-700 dark:text-rose-300 mt-0.5">
                      {language === 'lo'
                        ? `ພະນັກງານ "${duplicateMatch.firstNameLao} ${duplicateMatch.lastNameLao}" ລະຫັດ [${duplicateMatch.employeeCode}] ມີໃນລະບົບແລ້ວ! ລະບົບຫ້າມບໍ່ໃຫ້ຂໍ້ມູນຊ້ຳກັນເດັດຂາດ.`
                        : `Employee "${duplicateMatch.firstNameLao} ${duplicateMatch.lastNameLao}" (${duplicateMatch.employeeCode}) already exists. Duplicates are strictly prohibited.`}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  {language === 'lo' ? 'ຄຳນຳໜ້າ (English)' : 'Title En (prefix_en)'}
                </label>
                <select
                  value={formData.prefixEn || 'Mr.'}
                  onChange={(e) => setFormData({ ...formData, prefixEn: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  <option value="Mr.">Mr.</option>
                  <option value="Ms.">Ms.</option>
                  <option value="Mrs.">Mrs.</option>
                  <option value="Dr.">Dr.</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  {language === 'lo' ? 'ຊື່ (English) *' : 'First Name English (firstname_en) *'}
                </label>
                <input
                  type="text"
                  value={formData.firstNameEn || ''}
                  onChange={(e) => setFormData({ ...formData, firstNameEn: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  placeholder="Bounmy"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  {language === 'lo' ? 'ນາມສະກຸນ (English) *' : 'Last Name English (lastname_en) *'}
                </label>
                <input
                  type="text"
                  value={formData.lastNameEn || ''}
                  onChange={(e) => setFormData({ ...formData, lastNameEn: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  placeholder="Xayyavong"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  {language === 'lo' ? 'ເພດ' : 'Gender (gender)'}
                </label>
                <select
                  value={formData.gender || 'MALE'}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  <option value="MALE">{language === 'lo' ? 'ຊາຍ (MALE)' : 'Male'}</option>
                  <option value="FEMALE">{language === 'lo' ? 'ຍິງ (FEMALE)' : 'Female'}</option>
                  <option value="OTHER">{language === 'lo' ? 'ອື່ນໆ (OTHER)' : 'Other'}</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  {language === 'lo' ? 'ວັນເດືອນປີເກີດ' : 'Date of Birth (dob)'}
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth || '1995-01-01'}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  {language === 'lo' ? 'ຊົນເຜົ່າ' : 'Ethnicity (ຊົນເຜົ່າ)'}
                </label>
                <input
                  type="text"
                  value={formData.ethnicity || ''}
                  onChange={(e) => setFormData({ ...formData, ethnicity: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  placeholder="ລາວ, ໄຕ, ລະເມດ, ມົ້ງ..."
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  {language === 'lo' ? 'ສາສະໜາ' : 'Religion (ສາສະໜາ)'}
                </label>
                <input
                  type="text"
                  value={formData.religion || ''}
                  onChange={(e) => setFormData({ ...formData, religion: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  placeholder="ພຸດ, ..."
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  {language === 'lo' ? 'ເລກບັດປະຈຳຕົວ' : 'National ID (ບັດປະຈຳຕົວ)'}
                </label>
                <input
                  type="text"
                  value={formData.nationalId || ''}
                  onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                  placeholder="LAO-01-123456"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Passport
                </label>
                <input
                  type="text"
                  value={formData.passportNumber || ''}
                  onChange={(e) => setFormData({ ...formData, passportNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                  placeholder="P1234567"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  {language === 'lo' ? 'ບັດປະກັນສັງຄົມ' : 'Social Security Card'}
                </label>
                <input
                  type="text"
                  value={formData.socialSecurityNumber || ''}
                  onChange={(e) => setFormData({ ...formData, socialSecurityNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                  placeholder="SS-XXXXXX"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  {language === 'lo' ? 'ບັດສະມາຊິກພັກ' : 'Party Member Card No.'}
                </label>
                <input
                  type="text"
                  value={formData.partyCardNumber || ''}
                  onChange={(e) => setFormData({ ...formData, partyCardNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                  placeholder="LPRP-XXXXXX"
                />
              </div>
            </div>
          )}

          {/* TAB 2: ORGANIZATION */}
          {formSection === 'ORGANIZATION' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  {language === 'lo' ? 'ລະຫັດພະນັກງານ (ສະຫງວນຕາມລຳດັບ)' : 'Assigned Employee Code (Reserved)'}
                </label>
                <input
                  type="text"
                  value={formData.employeeCode || ''}
                  onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-blue-600 dark:text-blue-400"
                />
                <span className="text-[10px] text-slate-400">
                  Auto-allocated with concurrency lock to prevent collisions.
                </span>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">{t('branch')}</label>
                <select
                  value={formData.branchId || ''}
                  onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {language === 'lo' ? b.nameLao : b.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">{t('department')}</label>
                <select
                  value={formData.departmentId || ''}
                  onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {language === 'lo' ? d.nameLao : d.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  {language === 'lo' ? 'ໜ່ວຍງານ (Unit)' : 'Sub-Unit / Unit Name'}
                </label>
                <input
                  type="text"
                  value={formData.unitName || ''}
                  onChange={(e) => setFormData({ ...formData, unitName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  placeholder="ໜ່ວຍງານພັດທະນາ, ໜ່ວຍງານບໍລິຫານບັນຊີ-ການເງິນ, ..."
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">{t('position')}</label>
                <select
                  value={formData.positionId || ''}
                  onChange={(e) => setFormData({ ...formData, positionId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  {positions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {language === 'lo' ? p.titleLao : p.titleEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  {language === 'lo' ? 'ປະເພດການຈ້າງງານ' : 'Employment Type'}
                </label>
                <select
                  value={formData.employmentType || 'PERMANENT'}
                  onChange={(e) => setFormData({ ...formData, employmentType: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  <option value="PERMANENT">{language === 'lo' ? 'ພະນັກງານປະຈຳ (PERMANENT)' : 'Permanent'}</option>
                  <option value="PROBATION">{language === 'lo' ? 'ທົດລອງງານ (PROBATION)' : 'Probation'}</option>
                  <option value="CONTRACT">{language === 'lo' ? 'ສັນຍາຈ້າງ (CONTRACT)' : 'Contract'}</option>
                  <option value="INTERN">{language === 'lo' ? 'ຝຶກງານ (INTERN)' : 'Intern'}</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  {language === 'lo' ? 'ສະຖານະ' : 'Status'}
                </label>
                <select
                  value={formData.status || 'ACTIVE'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  <option value="ACTIVE">{language === 'lo' ? 'ກຳລັງເຮັດວຽກ (ACTIVE)' : 'Active'}</option>
                  <option value="ON_LEAVE">{language === 'lo' ? 'ລາພັກ (ON_LEAVE)' : 'On Leave'}</option>
                  <option value="SUSPENDED">{language === 'lo' ? 'ໂຈະຊົ່ວຄາວ (SUSPENDED)' : 'Suspended'}</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  {language === 'lo' ? 'ວັນທີເຂົ້າເຮັດວຽກ' : 'Joining Date'}
                </label>
                <input
                  type="date"
                  value={formData.joiningDate || ''}
                  onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  {language === 'lo' ? 'ວັນສິ້ນສຸດສັນຍາ (ຖ້າມີ)' : 'Contract End Date (Optional)'}
                </label>
                <input
                  type="date"
                  value={formData.contractEndDate || ''}
                  onChange={(e) => setFormData({ ...formData, contractEndDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
            </div>
          )}

          {/* TAB 3: CONTACT */}
          {formSection === 'CONTACT' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  {language === 'lo' ? 'ອີເມວ *' : 'Email Address *'}
                </label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  placeholder="name@laoholding.gov.la"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  {language === 'lo' ? 'ເບີໂທລະສັບ' : 'Phone Number'}
                </label>
                <input
                  type="text"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  placeholder="+856 20 5555 1234"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  {language === 'lo' ? 'ທີ່ຢູ່ປະຈຸບັນ' : 'Residential Address'}
                </label>
                <input
                  type="text"
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  placeholder="ບ້ານ ໂພນໄຊ, ເມືອງ ໄຊເສດຖາ, ນະຄອນຫຼວງວຽງຈັນ"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  {language === 'lo' ? 'ຊື່ຜູ້ຕິດຕໍ່ສຸກເສີນ' : 'Emergency Contact Name'}
                </label>
                <input
                  type="text"
                  value={formData.emergencyContactName || ''}
                  onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  placeholder="ນາງ ດາວອນ ໄຊຍະວົງ"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  {language === 'lo' ? 'ເບີໂທຕິດຕໍ່ສຸກເສີນ' : 'Emergency Contact Phone'}
                </label>
                <input
                  type="text"
                  value={formData.emergencyContactPhone || ''}
                  onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  placeholder="+856 20 5555 9999"
                />
              </div>
            </div>
          )}

          {/* TAB 4: FINANCE & EDUCATION */}
          {formSection === 'FINANCE' && (
            <div className="space-y-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    {t('baseSalary')} (LAK)
                  </label>
                  <input
                    type="number"
                    value={formData.baseSalary || 18000000}
                    onChange={(e) => setFormData({ ...formData, baseSalary: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-emerald-600 dark:text-emerald-400"
                  />
                  <span className="text-[10px] text-slate-400">
                    LHSE operates strictly without overtime (OT) in adherence to Lao Labor Law.
                  </span>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    {language === 'lo' ? 'ທະນາຄານ' : 'Bank Name'}
                  </label>
                  <select
                    value={formData.bankName || 'BCEL'}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="BCEL">BCEL (Banque Pour Le Commerce Exterieur Lao)</option>
                    <option value="LDB">LDB (Lao Development Bank)</option>
                    <option value="JDB">JDB (Joint Development Bank)</option>
                    <option value="APB">APB (Agricultural Promotion Bank)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    {language === 'lo' ? 'ເລກບັນຊີທະນາຄານ' : 'Bank Account Number'}
                  </label>
                  <input
                    type="text"
                    value={formData.bankAccountNumber || ''}
                    onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                    placeholder="010-12-00-11223344-001"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    {language === 'lo' ? 'ລະດັບການສຶກສາສາມັນ (ມ.6, ມ.3, ປ.5)' : 'General Education Level'}
                  </label>
                  <select
                    value={formData.educationLevel || 'ມ.6'}
                    onChange={(e) => setFormData({ ...formData, educationLevel: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="ມ.6">ມ.6 (High School)</option>
                    <option value="ມໍ 6">ມໍ 6 (Upper Secondary)</option>
                    <option value="ມ.3">ມ.3 (Lower Secondary)</option>
                    <option value="ປ.5">ປ.5 (Primary School)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    {language === 'lo' ? 'ວິຊາສະເພາະ' : 'Specialization / Degree'}
                  </label>
                  <select
                    value={formData.specialization || 'ປະລິນຍາຕີ'}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="ປະລິນຍາເອກ">ປະລິນຍາເອກ (Ph.D.)</option>
                    <option value="ປະລິນຍາໂທ">ປະລິນຍາໂທ (Master)</option>
                    <option value="ປະລິນຍາຕີ">ປະລິນຍາຕີ (Bachelor)</option>
                    <option value="ຊັ້ນສູງ">ຊັ້ນສູງ (Higher Diploma)</option>
                    <option value="ຊັ້ນກາງ">ຊັ້ນກາງ (Diploma)</option>
                    <option value="ຊັ້ນຕົ້ນ">ຊັ້ນຕົ້ນ (Certificate)</option>
                    <option value="ວິຊາສະເພາະ">ວິຊາສະເພາະ (Vocational)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    {language === 'lo' ? 'ທິດສະດີການເມືອງ' : 'Political Theory (ທິດສະດີ)'}
                  </label>
                  <input
                    type="text"
                    value={formData.politicalTheory || ''}
                    onChange={(e) => setFormData({ ...formData, politicalTheory: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    placeholder="45 ວັນ, ຊັ້ນຕົ້ນ, ຊັ້ນກາງ, ຊັ້ນສູງ..."
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    {language === 'lo' ? 'ຮູບພາບພະນັກງານ (URL/Path - ທາງເລືອກ)' : 'Employee Photo Path (Optional - Preserved Blank by Default)'}
                  </label>
                  <input
                    type="text"
                    value={formData.avatarUrl || ''}
                    onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    placeholder="Leave empty or specify photo URL"
                  />
                </div>
              </div>

              {/* ຕໍ່ທ້າຍແຖບ 4: ຂໍ້ມູນເຂົ້າສັງກັດການຈັດຕັ້ງ (Organizational & Mass Affiliations) */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border-2 border-dashed border-blue-200 dark:border-blue-900/60 space-y-4">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-bold text-xs border-b border-blue-100 dark:border-blue-900/40 pb-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>{language === 'lo' ? 'ຂໍ້ມູນເຂົ້າສັງກັດການຈັດຕັ້ງ (ຕໍ່ທ້າຍແຖບ 4. ການເງິນ & ການສຶກສາ)' : 'Organizational & Political-Mass Affiliations (End of Tab 4)'}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {/* ເຂົ້າສັງກັດລັດ */}
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      {language === 'lo' ? 'ວັນທີເຂົ້າສັງກັດການຈັດຕັ້ງ / ລັດ' : 'Date of Joining Organization'}
                    </label>
                    <input
                      type="date"
                      value={formData.orgAffiliationDate || ''}
                      onChange={(e) => setFormData({ ...formData, orgAffiliationDate: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>

                  {/* 3 ອົງການຈັດຕັ້ງມະຫາຊົນ */}
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1.5">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 dark:text-slate-200">
                      <input
                        type="checkbox"
                        checked={!!formData.tradeUnionMember}
                        onChange={(e) => setFormData({ ...formData, tradeUnionMember: e.target.checked })}
                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      <span>{language === 'lo' ? 'ເຂົ້າກຳມະບານ' : 'Trade Union Member'}</span>
                    </label>
                    <input
                      type="date"
                      value={formData.tradeUnionDate || ''}
                      onChange={(e) => setFormData({ ...formData, tradeUnionDate: e.target.value })}
                      placeholder="ວັນທີເຂົ້າກຳມະບານ"
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    />
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1.5">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 dark:text-slate-200">
                      <input
                        type="checkbox"
                        checked={!!formData.youthUnionMember}
                        onChange={(e) => setFormData({ ...formData, youthUnionMember: e.target.checked })}
                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      <span>{language === 'lo' ? 'ເຂົ້າຊາວໜຸ່ມ ປປລ' : 'Youth Union Member'}</span>
                    </label>
                    <input
                      type="date"
                      value={formData.youthUnionDate || ''}
                      onChange={(e) => setFormData({ ...formData, youthUnionDate: e.target.value })}
                      placeholder="ວັນທີເຂົ້າຊາວໜຸ່ມ"
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    />
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1.5">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 dark:text-slate-200">
                      <input
                        type="checkbox"
                        checked={!!formData.womenUnionMember}
                        onChange={(e) => setFormData({ ...formData, womenUnionMember: e.target.checked })}
                        className="rounded text-pink-600 focus:ring-pink-500 w-4 h-4"
                      />
                      <span>{language === 'lo' ? 'ເຂົ້າແມ່ຍິງ' : 'Women Union Member'}</span>
                    </label>
                    <input
                      type="date"
                      value={formData.womenUnionDate || ''}
                      onChange={(e) => setFormData({ ...formData, womenUnionDate: e.target.value })}
                      placeholder="ວັນທີເຂົ້າແມ່ຍິງ"
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    />
                  </div>

                  {/* ພັກ ປປລ */}
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      {language === 'lo' ? 'ສະຖານະພັກ (Party Status)' : 'Party Membership Status'}
                    </label>
                    <select
                      value={formData.partyMemberStatus || 'NONE'}
                      onChange={(e) => setFormData({ ...formData, partyMemberStatus: e.target.value as any })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                    >
                      <option value="NONE">{language === 'lo' ? 'ມະຫາຊົນ (General Staff)' : 'None (Staff)'}</option>
                      <option value="PROGRESSIVE">{language === 'lo' ? 'ມະຫາຊົນກ້າວໜ້າ (Progressive)' : 'Progressive Staff'}</option>
                      <option value="CANDIDATE">{language === 'lo' ? 'ສະມາຊິກພັກສຳຮອງ (Candidate)' : 'Party Candidate'}</option>
                      <option value="FULL">{language === 'lo' ? 'ສະມາຊິກພັກສົມບູນ (Full Member)' : 'Full Party Member'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      {language === 'lo' ? 'ວັນທີເຂົ້າສຳຮອງ' : 'Candidate Joining Date'}
                    </label>
                    <input
                      type="date"
                      value={formData.partyCandidateDate || ''}
                      onChange={(e) => setFormData({ ...formData, partyCandidateDate: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      {language === 'lo' ? 'ວັນທີເຂົ້າສົມບູນ' : 'Full Member Joining Date'}
                    </label>
                    <input
                      type="date"
                      value={formData.partyFullDate || ''}
                      onChange={(e) => setFormData({ ...formData, partyFullDate: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      {language === 'lo' ? 'ໜ່ວຍພັກ / ໜ່ວຍງານສັງກັດ' : 'Party Unit / Organization Unit'}
                    </label>
                    <input
                      type="text"
                      value={formData.partyUnitName || ''}
                      onChange={(e) => setFormData({ ...formData, partyUnitName: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                      placeholder="ໜ່ວຍພັກ ພັດທະນາ / ບໍລິຫານ..."
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      {language === 'lo' ? 'ຕຳແໜ່ງໃນການຈັດຕັ້ງມະຫາຊົນ' : 'Mass Org Role'}
                    </label>
                    <input
                      type="text"
                      value={formData.massOrgPosition || ''}
                      onChange={(e) => setFormData({ ...formData, massOrgPosition: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                      placeholder="ກຳມະການຊາວໜຸ່ມ, ຫົວໜ້າໜ່ວຍກຳມະບານ..."
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Mount EmployeeImportModal with 21-Column Engine */}
      <EmployeeImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
      />

      {/* QR Code Scanner Component */}
      <QRCodeScannerModal
        isOpen={qrScannerOpen}
        onClose={() => setQrScannerOpen(false)}
        onSelectEmployee={(emp) => {
          setSelectedEmp(emp);
          setProfileModalOpen(true);
        }}
      />

      {/* Official LHSE Employee PDF Export Modal */}
      <OfficialEmployeePDFExportModal
        isOpen={pdfExportModalOpen}
        onClose={() => {
          setPdfExportModalOpen(false);
          setPdfTargetEmployee(null);
        }}
        employee={pdfTargetEmployee}
        departments={departments}
        positions={positions}
        defaultLanguage={language}
      />
    </div>
  );
};
