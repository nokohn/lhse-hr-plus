import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { alerts } from '../../utils/alerts.ts';
import {
  Search,
  X,
  Users,
  FileText,
  LayoutDashboard,
  Clock,
  CalendarDays,
  FileCheck2,
  Banknote,
  Receipt,
  GraduationCap,
  UserPlus,
  GitPullRequest,
  FolderArchive,
  Megaphone,
  Settings,
  Network,
  ShieldAlert,
  ArrowRight,
  Download,
  Laptop,
  Car,
  Tv,
  ExternalLink,
  Sparkles,
  Command,
  Check,
} from 'lucide-react';

interface GlobalSearchProps {
  className?: string;
}

type FilterCategory = 'ALL' | 'EMPLOYEES' | 'DOCUMENTS' | 'MODULES';

interface DocumentItem {
  id: string;
  titleLao: string;
  titleEn: string;
  descriptionLao: string;
  descriptionEn: string;
  type: 'DOCUMENT' | 'ASSET';
  fileFormat?: 'PDF' | 'DOCX';
  assetTag?: string;
  category: string;
  targetModule: string;
  targetSubModule: string;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ className = '' }) => {
  const {
    language,
    employees,
    departments,
    positions,
    assets,
    setActiveModule,
    setActiveSubModule,
  } = useApp();

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('ALL');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global Keyboard Shortcut: Cmd+K or Ctrl+K or '/'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in another input/textarea
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === '/' && !isInput) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // System Modules Registry (All 15 Modules & Submodules with bilingual metadata)
  const systemModules = useMemo(() => {
    return [
      {
        id: 'module-1',
        titleLao: 'ແດດຊບອດ & ສະຫຼຸບພາບລວມ',
        titleEn: 'Dashboard & Overview',
        descriptionLao: 'ສະຫຼຸບການເຂົ້າວຽກ, ພະນັກງານ, KPI ອົງກອນ ແລະ ສະຖິຕິ',
        descriptionEn: 'Attendance summary, headcount, org KPI stats and trends',
        defaultSub: 'overview',
        icon: LayoutDashboard,
        keywords: 'dashboard kpi stats overview metrics ອົງກອນ ພາບລວມ ສະຫຼຸບ ຜົນງານ',
        submodules: ['overview', 'headcount', 'attendance-stats'],
      },
      {
        id: 'module-2',
        titleLao: 'ໂປຣໄຟລ໌ & ທະບຽນພະນັກງານ',
        titleEn: 'Employee Directory & Profiles',
        descriptionLao: 'ຂໍ້ມູນພະນັກງານທັງໝົດ, ສັນຍາຈ້າງງານ, ແລະ ການຮັບເຂົ້າໃໝ່',
        descriptionEn: 'Employee profiles, employment contracts, and onboarding',
        defaultSub: 'directory',
        icon: Users,
        keywords: 'employee directory profile staff users kpi performance appraisal reviews ພະນັກງານ ທະບຽນ ຊື່ ສັນຍາ ຜົນງານ ໄຕຣມາດ ຕົວຊີ້ວັດ',
        submodules: ['directory', 'onboarding', 'movements', 'import', 'performance'],
      },
      {
        id: 'module-3',
        titleLao: 'ໂຄງຮ່າງການຈັດຕັ້ງ & ພະແນກ',
        titleEn: 'Organization Structure & Departments',
        descriptionLao: 'ຜັງໂຄງຮ່າງອົງກອນ, ສາຂາ, ພະແນກ ແລະ ຕຳແໜ່ງງານ',
        descriptionEn: 'Org chart, branches, departments, and position catalog',
        defaultSub: 'org-chart',
        icon: Network,
        keywords: 'org chart organization departments branches positions ໂຄງຮ່າງ ພະແນກ ສາຂາ ຕຳແໜ່ງ',
        submodules: ['org-chart', 'branches', 'departments', 'positions', 'workforce-plan'],
      },
      {
        id: 'module-4',
        titleLao: 'ການລົງເວລາເຮັດວຽກ & ເຄື່ອງສະແກນ',
        titleEn: 'Time & Attendance (Biometrics & GPS)',
        descriptionLao: 'ບັນທຶກເຂົ້າ-ອອກວຽກປະຈຳວັນ, ມາຊ້າ, ແລະ ເຄື່ອງສະແກນ',
        descriptionEn: 'Daily check-in/out, lateness logs, biometric and GPS logs',
        defaultSub: 'daily-attendance',
        icon: Clock,
        keywords: 'attendance clock in punch late biometric time scan ເຂົ້າວຽກ ມາຊ້າ ສະແກນ',
        submodules: ['daily-attendance', 'attendance-dashboard', 'lateness-report', 'attendance-devices'],
      },
      {
        id: 'module-5',
        titleLao: 'ຕາຕະລາງການເຮັດວຽກ & ກະວຽກ',
        titleEn: 'Work Schedule & Shifts',
        descriptionLao: 'ຈັດກະການເຮັດວຽກ, ຕາຕະລາງເຂົ້າເວນ, ແລະ ວັນພັກລັດຖະການ',
        descriptionEn: 'Shift roster, work schedules, and holiday calendar',
        defaultSub: 'schedules',
        icon: CalendarDays,
        keywords: 'shifts schedule roster holidays calendar ກະວຽກ ຕາຕະລາງ ເວລາງານ ວັນພັກ',
        submodules: ['schedules', 'shifts', 'holidays'],
      },
      {
        id: 'module-6',
        titleLao: 'ການຄຸ້ມຄອງການລາພັກ & ໂຄຕ້າລາ',
        titleEn: 'Leave Management & Balances',
        descriptionLao: 'ຄຳຮ້ອງຂໍລາພັກ, ປະຕິທິນລາ, ໂຄຕ້າວັນພັກປະຈຳປີ ແລະ ລາປ່ວຍ',
        descriptionEn: 'Leave requests, leave calendar, annual leave quota and sick leave',
        defaultSub: 'requests',
        icon: FileCheck2,
        keywords: 'leave annual sick requests quota balance ລາພັກ ພັກປະຈຳປີ ລາປ່ວຍ ວັນລາ',
        submodules: ['requests', 'calendar', 'balances', 'types'],
      },
      {
        id: 'module-7',
        titleLao: 'ການຄິດໄລ່ເງິນເດືອນ & ປະກັນສັງຄົມ',
        titleEn: 'Payroll Management & Payslips',
        descriptionLao: 'ຄຳນວນເງິນເດືອນ, ໃບແຈ້ງເງິນເດືອນ, ອາກອນ, ແລະ ປະກັນສັງຄົມ NSSF',
        descriptionEn: 'Salary calculation, payslips, income tax, and Lao social security NSSF',
        defaultSub: 'payslips',
        icon: Banknote,
        keywords: 'payroll salary payslip tax ssf lsso ເງິນເດືອນ ສະລິບ ອາກອນ ປະກັນສັງຄົມ',
        submodules: ['payslips', 'periods', 'tax-rules', 'reports'],
      },
      {
        id: 'module-8',
        titleLao: 'ວິໄນ & ການຕັກເຕືອນ',
        titleEn: 'Disciplinary Cases & Warnings',
        descriptionLao: 'ບັນທຶກການຕັກເຕືອນ, ໃບເຕືອນ, ແລະ ຄະດີວິໄນພະນັກງານ',
        descriptionEn: 'Disciplinary cases, warning letters, and conduct records',
        defaultSub: 'cases',
        icon: ShieldAlert,
        keywords: 'discipline warning conduct violation ວິໄນ ໃບເຕືອນ ຕັກເຕືອນ ລະບຽບ',
        submodules: ['cases', 'create-warning'],
      },
      {
        id: 'module-9',
        titleLao: 'ການເບີກຈ່າຍລາຍຈ່າຍ & ຄ່າເດີນທາງ',
        titleEn: 'Expense Claims & Reimbursements',
        descriptionLao: 'ຍື່ນຂໍເບີກຈ່າຍຄ່າເດີນທາງ, ຄ່າອາຫານ, ອຸປະກອນ ແລະ ໃບຮັບເງິນ',
        descriptionEn: 'Expense claims, travel receipts, meals and reimbursement requests',
        defaultSub: 'claims',
        icon: Receipt,
        keywords: 'expense claims reimbursement receipts travel ເບີກຈ່າຍ ເງິນ ຄ່າເດີນທາງ ໃບຮັບເງິນ',
        submodules: ['claims', 'submit-claim'],
      },
      {
        id: 'module-10',
        titleLao: 'ການປະເມີນຜົນງານ & ການຝຶກອົບຮົມ',
        titleEn: 'Performance Evaluations & Training',
        descriptionLao: 'ການປະເມີນຜົນງານປະຈຳປີ/ໄຕຣມາດ, ຫຼັກສູດອົບຮົມ ແລະ ສະຫວັດດີການ',
        descriptionEn: 'Performance evaluations, training plans, courses and staff benefits',
        defaultSub: 'evaluations',
        icon: GraduationCap,
        keywords: 'performance appraisal evaluation training course ປະເມີນ ອົບຮົມ ຫຼັກສູດ ພັດທະນາ',
        submodules: ['evaluations', 'trainings', 'benefits'],
      },
      {
        id: 'module-11',
        titleLao: 'ການສັນຫາ & ຮັບພະນັກງານໃໝ່',
        titleEn: 'Recruitment & Candidate Onboarding',
        descriptionLao: 'ປະກາດຮັບສະໝັກງານ, ຜູ້ສະໝັກ, ການສຳພາດ ແລະ ບັນຊີລາຍຊື່',
        descriptionEn: 'Job requisitions, candidate pipeline, interviews, and offers',
        defaultSub: 'requisitions',
        icon: UserPlus,
        keywords: 'recruitment job candidate hiring interview ຮັບສະໝັກ ຜູ້ສະໝັກ ສຳພາດ ວຽກໃໝ່',
        submodules: ['requisitions', 'candidates'],
      },
      {
        id: 'module-12',
        titleLao: 'ສູນກາງການອະນຸມັດ (Workflow)',
        titleEn: 'Central Approval Workflow',
        descriptionLao: 'ລາຍການຄຳຮ້ອງລໍຖ້າອະນຸມັດ, ປະຫວັດການອະນຸມັດ, ແລະ ສາຍການບັງຄັບບັນຊາ',
        descriptionEn: 'Pending approval requests, workflow history, and multi-step chains',
        defaultSub: 'pending',
        icon: GitPullRequest,
        keywords: 'approvals workflow pending requests review sign ອະນຸມັດ ຄຳຮ້ອງ ລໍຖ້າ',
        submodules: ['pending', 'my-requests', 'workflows'],
      },
      {
        id: 'module-13',
        titleLao: 'ເອກະສານ & ຊັບສິນອົງກອນ',
        titleEn: 'Documents & Enterprise Assets',
        descriptionLao: 'ທະບຽນຊັບສິນ, ຄອມພິວເຕີ, ພາຫະນະ, ແລະ ແມ່ແບບເອກະສານທາງການ',
        descriptionEn: 'Asset inventory, laptops, vehicles, and standard document templates',
        defaultSub: 'templates',
        icon: FolderArchive,
        keywords: 'documents templates assets laptops cars contracts ເອກະສານ ຊັບສິນ ແມ່ແບບ ສັນຍາ',
        submodules: ['assets', 'templates', 'contracts'],
      },
      {
        id: 'module-14',
        titleLao: 'ການສື່ສານພາຍໃນ & ແຈ້ງການ',
        titleEn: 'Internal Communication & Announcements',
        descriptionLao: 'ແຈ້ງການທາງການຂອງ LHSE, ຂ່າວສານອົງກອນ, ແລະ ຖາມ-ຕອບ',
        descriptionEn: 'LHSE official notices, announcements, messaging and FAQ',
        defaultSub: 'announcements',
        icon: Megaphone,
        keywords: 'announcements news messaging notices bulletin ແຈ້ງການ ຂ່າວສານ ປະກາດ ຂໍ້ຄວາມ',
        submodules: ['announcements', 'messages', 'faq'],
      },
      {
        id: 'module-15',
        titleLao: 'ການບໍລິຫານລະບົບ & ບັນທຶກກວດສອບ',
        titleEn: 'System Administration & Audit Logs',
        descriptionLao: 'ຈັດການບັນຊີຜູ້ໃຊ້, ສິດການເຂົ້າເຖິງ RBAC, ແລະ ບັນທຶກ Audit Logs',
        descriptionEn: 'User accounts, RBAC permissions, security settings, and audit trail',
        defaultSub: 'lhse-profile',
        icon: Settings,
        keywords: 'admin settings audit logs users roles security ບໍລິຫານ ບັນຊີ ສິດ ກວດສອບ ລະບົບ',
        submodules: ['lhse-profile', 'users', 'roles', 'audit-logs'],
      },
    ];
  }, []);

  // Standard Company Documents Catalog
  const standardDocuments: DocumentItem[] = useMemo(() => {
    return [
      {
        id: 'doc-1',
        titleLao: 'ສັນຍາຈ້າງງານມາດຕະຖານ LHSE (Standard Employment Contract)',
        titleEn: 'LHSE Standard Employment Contract Template',
        descriptionLao: 'ແມ່ແບບສັນຍາຈ້າງງານລັດວິສາຫະກິດສອງພາສາ (ລາວ-ອັງກິດ) ຖືກຕ້ອງຕາມກົດໝາຍແຮງງານ.',
        descriptionEn: 'Official bilingual state enterprise employment contract template with statutory clauses.',
        type: 'DOCUMENT',
        fileFormat: 'DOCX',
        category: 'Legal & HR Templates',
        targetModule: 'module-13',
        targetSubModule: 'templates',
      },
      {
        id: 'doc-2',
        titleLao: 'ໃບຢັ້ງຢືນການເຮັດວຽກ ແລະ ເງິນເດືອນ (Certificate of Employment)',
        titleEn: 'Official Certificate of Employment & Salary Letter',
        descriptionLao: 'ໜັງສືຢັ້ງຢືນການເຮັດວຽກສຳລັບຍື່ນສະຖານທູດ (ຂໍວີຊາ) ຫຼື ຍື່ນຂໍສິນເຊື່ອທະນາຄານ.',
        descriptionEn: 'Verified employment proof document for bank loan applications and embassy visas.',
        type: 'DOCUMENT',
        fileFormat: 'PDF',
        category: 'Certifications',
        targetModule: 'module-13',
        targetSubModule: 'templates',
      },
      {
        id: 'doc-3',
        titleLao: 'ສັນຍາຮັກສາຄວາມລັບຂໍ້ມູນລັດວິສາຫະກິດ (Enterprise NDA)',
        titleEn: 'LHSE Energy Concession Non-Disclosure Agreement (NDA)',
        descriptionLao: 'ສັນຍາປົກປ້ອງຂໍ້ມູນຄວາມລັບທາງທຸລະກິດ, ຮຸ້ນສ່ວນພະລັງງານ ແລະ ຂໍ້ມູນສຳປະທານ.',
        descriptionEn: 'Confidentiality agreement protecting state energy equity models and project concessions.',
        type: 'DOCUMENT',
        fileFormat: 'DOCX',
        category: 'Legal & Compliance',
        targetModule: 'module-13',
        targetSubModule: 'templates',
      },
      {
        id: 'doc-4',
        titleLao: 'ກົດລະບຽບພາຍໃນລັດວິສາຫະກິດ ຖືຮຸ້ນລາວ (Internal Labor Regulations)',
        titleEn: 'LHSE Internal Labor Regulations & Governance Code 2026',
        descriptionLao: 'ກົດລະບຽບການເຮັດວຽກ, ວິໄນ, ການຄຸ້ມຄອງເວລາ ແລະ ຈັນຍາບັນພະນັກງານ LHSE.',
        descriptionEn: 'Statutory internal workplace policies, attendance discipline, and enterprise code of ethics.',
        type: 'DOCUMENT',
        fileFormat: 'PDF',
        category: 'Company Policies',
        targetModule: 'module-13',
        targetSubModule: 'templates',
      },
      {
        id: 'doc-5',
        titleLao: 'ຄູ່ມືກົດໝາຍແຮງງານ ແລະ ສິດທິປະກັນສັງຄົມ (Lao Labor & NSSF Guide)',
        titleEn: 'Lao Labor Law & NSSF Statutory Benefits Handbook',
        descriptionLao: 'ຄູ່ມືອະທິບາຍກົດໝາຍແຮງງານ ສປປ ລາວ, ສິດການລາພັກ, ການປິ່ນປົວ ແລະ ເງິນບຳນານ.',
        descriptionEn: 'Handbook detailing Lao Labor Law provisions, statutory leave entitlements, and pension benefits.',
        type: 'DOCUMENT',
        fileFormat: 'PDF',
        category: 'Statutory Guides',
        targetModule: 'module-13',
        targetSubModule: 'templates',
      },
      {
        id: 'doc-6',
        titleLao: 'ນະໂຍບາຍໂຄງສ້າງເງິນເດືອນ ແລະ ເງິນເລື່ອນຂັ້ນ (Salary Scale Policy)',
        titleEn: 'State Enterprise Salary Structure & Promotion Policy',
        descriptionLao: 'ນະໂຍບາຍຂັ້ນເງິນເດືອນ, ຄ່າຄອງຊີບ, ເບ້ຍລ້ຽງປະຈຳຕຳແໜ່ງ ແລະ ເງິນໂບນັດປະຈຳປີ.',
        descriptionEn: 'Salary grade brackets, state enterprise living allowances, and performance bonus structure.',
        type: 'DOCUMENT',
        fileFormat: 'PDF',
        category: 'Compensation & Benefits',
        targetModule: 'module-13',
        targetSubModule: 'templates',
      },
    ];
  }, []);

  // Filtered Assets from Context
  const formattedAssets: DocumentItem[] = useMemo(() => {
    return assets.map((a) => {
      const assignedEmp = employees.find((e) => e.id === a.assignedEmployeeId);
      const assignedName = assignedEmp
        ? `${assignedEmp.firstNameLao} ${assignedEmp.lastNameLao}`
        : 'Unassigned';

      return {
        id: a.id,
        titleLao: `${a.name} (${a.assetTag})`,
        titleEn: `${a.name} [${a.assetTag}]`,
        descriptionLao: `ໝວດ: ${a.category} • Serial: ${a.serialNumber} • ຜູ້ຖືຄອງ: ${assignedName} • ສະຖານະ: ${a.status}`,
        descriptionEn: `Category: ${a.category} • Serial: ${a.serialNumber} • Assigned to: ${assignedName} • Status: ${a.status}`,
        type: 'ASSET',
        assetTag: a.assetTag,
        category: a.category,
        targetModule: 'module-13',
        targetSubModule: 'assets',
      };
    });
  }, [assets, employees]);

  // Combined documents and assets
  const allDocumentsAndAssets = useMemo(() => {
    return [...standardDocuments, ...formattedAssets];
  }, [standardDocuments, formattedAssets]);

  // Multi-entity search calculation
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();

    // 1. Employee Matching
    const matchedEmployees = employees.filter((emp) => {
      if (!q) return false;
      const dept = departments.find((d) => d.id === emp.departmentId);
      const pos = positions.find((p) => p.id === emp.positionId);

      return (
        emp.employeeCode.toLowerCase().includes(q) ||
        emp.firstNameLao.toLowerCase().includes(q) ||
        emp.lastNameLao.toLowerCase().includes(q) ||
        `${emp.firstNameLao} ${emp.lastNameLao}`.toLowerCase().includes(q) ||
        emp.firstNameEn.toLowerCase().includes(q) ||
        emp.lastNameEn.toLowerCase().includes(q) ||
        `${emp.firstNameEn} ${emp.lastNameEn}`.toLowerCase().includes(q) ||
        emp.email.toLowerCase().includes(q) ||
        emp.phone.toLowerCase().includes(q) ||
        (dept && (dept.nameLao.toLowerCase().includes(q) || dept.nameEn.toLowerCase().includes(q))) ||
        (pos && (pos.titleLao.toLowerCase().includes(q) || pos.titleEn.toLowerCase().includes(q)))
      );
    });

    // 2. Documents & Assets Matching
    const matchedDocs = allDocumentsAndAssets.filter((doc) => {
      if (!q) return false;
      return (
        doc.titleLao.toLowerCase().includes(q) ||
        doc.titleEn.toLowerCase().includes(q) ||
        doc.descriptionLao.toLowerCase().includes(q) ||
        doc.descriptionEn.toLowerCase().includes(q) ||
        (doc.assetTag && doc.assetTag.toLowerCase().includes(q)) ||
        doc.category.toLowerCase().includes(q)
      );
    });

    // 3. Modules Matching
    const matchedModules = systemModules.filter((mod) => {
      if (!q) return false;
      return (
        mod.titleLao.toLowerCase().includes(q) ||
        mod.titleEn.toLowerCase().includes(q) ||
        mod.descriptionLao.toLowerCase().includes(q) ||
        mod.descriptionEn.toLowerCase().includes(q) ||
        mod.keywords.toLowerCase().includes(q)
      );
    });

    return {
      employees: matchedEmployees,
      documents: matchedDocs,
      modules: matchedModules,
      totalCount: matchedEmployees.length + matchedDocs.length + matchedModules.length,
    };
  }, [query, employees, departments, positions, allDocumentsAndAssets, systemModules]);

  // Handle Selection of Item
  const handleSelectEmployee = (emp: any) => {
    setIsOpen(false);
    setQuery('');
    setActiveModule('module-2');
    setActiveSubModule('directory');
    alerts.info(
      language === 'lo' ? 'ເລືອກພະນັກງານ' : 'Employee Selected',
      `${language === 'lo' ? emp.firstNameLao : emp.firstNameEn} (${emp.employeeCode})`
    );
  };

  const handleSelectDocument = (doc: DocumentItem) => {
    setIsOpen(false);
    setQuery('');
    setActiveModule(doc.targetModule);
    setActiveSubModule(doc.targetSubModule);

    if (doc.type === 'DOCUMENT') {
      alerts.success(
        language === 'lo' ? 'ເປີດແມ່ແບບເອກະສານ' : 'Document Opened',
        language === 'lo' ? `ກຳລັງເປີດ: ${doc.titleLao}` : `Opening: ${doc.titleEn}`
      );
    } else {
      alerts.info(
        language === 'lo' ? 'ເບິ່ງລາຍລະອຽດຊັບສິນ' : 'Asset Details',
        language === 'lo' ? `ຊັບສິນ: ${doc.titleLao}` : `Asset: ${doc.titleEn}`
      );
    }
  };

  const handleSelectModule = (mod: any) => {
    setIsOpen(false);
    setQuery('');
    setActiveModule(mod.id);
    setActiveSubModule(mod.defaultSub);
  };

  // Quick Recommendations when query is empty
  const quickSuggestions = useMemo(() => {
    return [
      {
        labelLao: 'ທະບຽນພະນັກງານ',
        labelEn: 'Employee Directory',
        moduleId: 'module-2',
        subId: 'directory',
        icon: Users,
      },
      {
        labelLao: 'ໃບສະເໜີຂໍລາພັກ',
        labelEn: 'Leave Requests',
        moduleId: 'module-6',
        subId: 'requests',
        icon: FileCheck2,
      },
      {
        labelLao: 'ເບີກຈ່າຍລາຍຈ່າຍ',
        labelEn: 'Expense Claims',
        moduleId: 'module-9',
        subId: 'claims',
        icon: Receipt,
      },
      {
        labelLao: 'ສັນຍາຈ້າງງານ (ແມ່ແບບ)',
        labelEn: 'Employment Contracts',
        moduleId: 'module-13',
        subId: 'templates',
        icon: FileText,
      },
      {
        labelLao: 'ສູນກາງການອະນຸມັດ',
        labelEn: 'Central Approvals',
        moduleId: 'module-12',
        subId: 'pending',
        icon: GitPullRequest,
      },
    ];
  }, []);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* 1. Global Search Input Bar in Header */}
      <div className="relative flex items-center">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center">
          <Search className="w-4 h-4 text-slate-400 transition-colors group-focus-within:text-blue-500" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={
            language === 'lo'
              ? 'ຄົ້ນຫາ ພະນັກງານ, ເອກະສານ, ໂມດູນ...'
              : 'Search employees, docs, modules...'
          }
          className="w-44 sm:w-60 md:w-72 lg:w-88 pl-9 pr-14 sm:pr-16 py-1.5 sm:py-2 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-800/60 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-hidden transition-all duration-200 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:w-56 sm:focus:w-72 md:focus:w-88 lg:focus:w-96 shadow-2xs"
        />

        {/* Right Badge: Clear Button or Cmd+K Hint */}
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query ? (
            <button
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[10px] font-mono font-medium text-slate-400 shadow-2xs">
              <span className="text-[11px]">⌘</span>K
            </kbd>
          )}
        </div>
      </div>

      {/* 2. Global Search Palette / Results Popover */}
      {isOpen && (
        <div className="absolute left-0 sm:left-auto right-0 sm:right-auto sm:left-0 mt-2.5 w-[calc(100vw-2rem)] sm:w-[520px] max-w-[95vw] bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 z-50 overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header Bar with Category Filters */}
          <div className="p-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-850/60 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar text-xs">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setActiveCategory('ALL')}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeCategory === 'ALL'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800'
                }`}
              >
                <span>{language === 'lo' ? 'ທັງໝົດ' : 'All'}</span>
                {query && (
                  <span className="ml-1 text-[10px] font-mono opacity-80">
                    ({searchResults.totalCount})
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveCategory('EMPLOYEES')}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
                  activeCategory === 'EMPLOYEES'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-950/40'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>{language === 'lo' ? 'ພະນັກງານ' : 'Employees'}</span>
                {query && (
                  <span className="text-[10px] font-mono opacity-80">
                    ({searchResults.employees.length})
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveCategory('DOCUMENTS')}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
                  activeCategory === 'DOCUMENTS'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{language === 'lo' ? 'ເອກະສານ & ຊັບສິນ' : 'Docs & Assets'}</span>
                {query && (
                  <span className="text-[10px] font-mono opacity-80">
                    ({searchResults.documents.length})
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveCategory('MODULES')}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
                  activeCategory === 'MODULES'
                    ? 'bg-purple-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-purple-50 dark:hover:bg-purple-950/40'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>{language === 'lo' ? 'ໂມດູນ' : 'Modules'}</span>
                {query && (
                  <span className="text-[10px] font-mono opacity-80">
                    ({searchResults.modules.length})
                  </span>
                )}
              </button>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Results Scroll Area */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4 divide-y divide-slate-100 dark:divide-slate-800/60">
            {/* Case A: Query is Empty - Show Quick Suggestions & Recently Used */}
            {!query.trim() && (
              <div className="space-y-3 pt-1">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block mb-1.5">
                    {language === 'lo' ? 'ທາງລັດ & ໂມດູນຍອດນິຍົມ' : 'Popular Modules & Shortcuts'}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {quickSuggestions.map((s, idx) => {
                      const IconComp = s.icon;
                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            setIsOpen(false);
                            setActiveModule(s.moduleId);
                            setActiveSubModule(s.subId);
                          }}
                          className="flex items-center gap-2.5 p-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors text-xs cursor-pointer group"
                        >
                          <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <IconComp className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-bold text-xs truncate">
                            {language === 'lo' ? s.labelLao : s.labelEn}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block mb-1.5">
                    {language === 'lo' ? 'ແມ່ແບບເອກະສານຫຼັກ' : 'Featured Official Templates'}
                  </span>
                  <div className="space-y-1">
                    {standardDocuments.slice(0, 3).map((doc) => (
                      <div
                        key={doc.id}
                        onClick={() => handleSelectDocument(doc)}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-xs cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                            {language === 'lo' ? doc.titleLao : doc.titleEn}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 shrink-0">
                          {doc.fileFormat}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Case B: Query Has No Matches */}
            {query.trim() && searchResults.totalCount === 0 && (
              <div className="py-10 text-center space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                  <Search className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  {language === 'lo' ? 'ບໍ່ພົບຜົນການຄົ້ນຫາ' : 'No Results Found'}
                </h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  {language === 'lo'
                    ? `ບໍ່ພົບຂໍ້ມູນທີ່ກົງກັບ "${query}". ລອງປ່ຽນຄຳຄົ້ນຫາ ເຊັ່ນ: ຊື່, ລະຫັດ ຫຼື ພະແນກ.`
                    : `No items matched "${query}". Try searching by code, name, department, or keyword.`}
                </p>
              </div>
            )}

            {/* Case C: Query Matches Found */}
            {query.trim() && (
              <div className="space-y-4 pt-1">
                {/* 1. EMPLOYEES MATCHED */}
                {(activeCategory === 'ALL' || activeCategory === 'EMPLOYEES') &&
                  searchResults.employees.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between px-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {language === 'lo' ? 'ພະນັກງານ' : 'Employees'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {searchResults.employees.length} {language === 'lo' ? 'ຄົນ' : 'found'}
                        </span>
                      </div>

                      <div className="space-y-1">
                        {searchResults.employees.map((emp) => {
                          const dept = departments.find((d) => d.id === emp.departmentId);
                          const pos = positions.find((p) => p.id === emp.positionId);

                          return (
                            <div
                              key={emp.id}
                              onClick={() => handleSelectEmployee(emp)}
                              className="p-2.5 rounded-2xl hover:bg-blue-50/70 dark:hover:bg-blue-950/40 border border-transparent hover:border-blue-200 dark:hover:border-blue-900/60 transition-all cursor-pointer flex items-center justify-between gap-3 text-xs group"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                                  {emp.firstNameEn.slice(0, 1)}
                                  {emp.lastNameEn.slice(0, 1)}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors truncate">
                                      {language === 'lo'
                                        ? `${emp.firstNameLao} ${emp.lastNameLao}`
                                        : `${emp.firstNameEn} ${emp.lastNameEn}`}
                                    </span>
                                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                                      {emp.employeeCode}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-slate-500 truncate mt-0.5">
                                    {pos ? (language === 'lo' ? pos.titleLao : pos.titleEn) : 'Staff'} •{' '}
                                    {dept ? (language === 'lo' ? dept.nameLao : dept.nameEn) : ''}
                                  </div>
                                </div>
                              </div>

                              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                {/* 2. DOCUMENTS & ASSETS MATCHED */}
                {(activeCategory === 'ALL' || activeCategory === 'DOCUMENTS') &&
                  searchResults.documents.length > 0 && (
                    <div className="space-y-1.5 pt-2">
                      <div className="flex items-center justify-between px-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {language === 'lo' ? 'ເອກະສານ & ຊັບສິນ' : 'Documents & Assets'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {searchResults.documents.length} {language === 'lo' ? 'ລາຍການ' : 'found'}
                        </span>
                      </div>

                      <div className="space-y-1">
                        {searchResults.documents.map((doc) => {
                          const isAsset = doc.type === 'ASSET';
                          return (
                            <div
                              key={doc.id}
                              onClick={() => handleSelectDocument(doc)}
                              className="p-2.5 rounded-2xl hover:bg-emerald-50/70 dark:hover:bg-emerald-950/40 border border-transparent hover:border-emerald-200 dark:hover:border-emerald-900/60 transition-all cursor-pointer flex items-center justify-between gap-3 text-xs group"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
                                    isAsset
                                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                  }`}
                                >
                                  {isAsset ? <Laptop className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 transition-colors truncate">
                                      {language === 'lo' ? doc.titleLao : doc.titleEn}
                                    </span>
                                    {doc.fileFormat && (
                                      <span className="font-mono text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 shrink-0">
                                        {doc.fileFormat}
                                      </span>
                                    )}
                                    {doc.assetTag && (
                                      <span className="font-mono text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 shrink-0">
                                        {doc.assetTag}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-500 truncate mt-0.5">
                                    {language === 'lo' ? doc.descriptionLao : doc.descriptionEn}
                                  </div>
                                </div>
                              </div>

                              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                {/* 3. SYSTEM MODULES MATCHED */}
                {(activeCategory === 'ALL' || activeCategory === 'MODULES') &&
                  searchResults.modules.length > 0 && (
                    <div className="space-y-1.5 pt-2">
                      <div className="flex items-center justify-between px-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1">
                          <LayoutDashboard className="w-3 h-3" />
                          {language === 'lo' ? 'ໂມດູນລະບົບ' : 'System Modules'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {searchResults.modules.length} {language === 'lo' ? 'ໂມດູນ' : 'found'}
                        </span>
                      </div>

                      <div className="space-y-1">
                        {searchResults.modules.map((mod) => {
                          const IconComp = mod.icon;
                          return (
                            <div
                              key={mod.id}
                              onClick={() => handleSelectModule(mod)}
                              className="p-2.5 rounded-2xl hover:bg-purple-50/70 dark:hover:bg-purple-950/40 border border-transparent hover:border-purple-200 dark:hover:border-purple-900/60 transition-all cursor-pointer flex items-center justify-between gap-3 text-xs group"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 flex items-center justify-center shrink-0 shadow-2xs">
                                  <IconComp className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-purple-600 transition-colors truncate">
                                      {language === 'lo' ? mod.titleLao : mod.titleEn}
                                    </span>
                                    <span className="font-mono text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 shrink-0">
                                      {mod.id}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-slate-500 truncate mt-0.5">
                                    {language === 'lo' ? mod.descriptionLao : mod.descriptionEn}
                                  </div>
                                </div>
                              </div>

                              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
              </div>
            )}
          </div>

          {/* Footer Shortcuts Navigation Guide */}
          <div className="p-3 bg-slate-50 dark:bg-slate-850 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-2 font-mono text-[10px]">
              <span><kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700">ESC</kbd> to close</span>
              <span>•</span>
              <span><kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700">↵</kbd> to select</span>
            </div>
            <span className="font-mono text-[10px]">LHSE Global Enterprise Search</span>
          </div>
        </div>
      )}
    </div>
  );
};
