import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { alerts } from '../../utils/alerts.ts';
import { Role, User } from '../../types/index.ts';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Users,
  UserCheck,
  UserPlus,
  UserX,
  Lock,
  Key,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  Eye,
  PlusCircle,
  Edit,
  Trash2,
  Check,
  X,
  Building2,
  Sparkles,
  ArrowRight,
  Save,
  RotateCcw,
  Sliders,
  FileSpreadsheet,
  Download,
  Info,
  Layers,
} from 'lucide-react';

// Default standard LHSE permissions configuration
interface ModulePermissionDefinition {
  id: string;
  nameLao: string;
  nameEn: string;
  category: 'CORE' | 'OPERATIONS' | 'FINANCE' | 'SYSTEM';
  descriptionLao: string;
  descriptionEn: string;
  actions: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    approve: boolean;
    export: boolean;
  };
}

const DEFAULT_MODULE_PERMISSIONS: Record<Role, ModulePermissionDefinition[]> = {
  SUPER_ADMIN: [
    {
      id: 'module-1',
      nameLao: 'ພາບລວມ & ລາຍງານຜູ້ບໍລິຫານ',
      nameEn: 'Executive Dashboard & Analytics',
      category: 'CORE',
      descriptionLao: 'ສະຖິຕິບຸກຄະລາກອນ, ອັດຕາການຂາດວຽກ, ແລະ KPI ລວມ',
      descriptionEn: 'Headcount metrics, turnover, and enterprise KPIs',
      actions: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
    },
    {
      id: 'module-2',
      nameLao: 'ຈັດການຂໍ້ມູນພະນັກງານ & ປະຫວັດ',
      nameEn: 'Employee Management & Records',
      category: 'CORE',
      descriptionLao: 'ຂໍ້ມູນຕົວຕົນ, ສັນຍາ, ປະຫວັດເງິນເດືອນ ແລະ ເອກະສານ',
      descriptionEn: 'Identity records, contracts, salary history, and dossier',
      actions: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
    },
    {
      id: 'module-3',
      nameLao: 'ໂຄງຮ່າງອົງກອນ & ຕຳແໜ່ງ',
      nameEn: 'Organization Structure & Headcount',
      category: 'CORE',
      descriptionLao: 'ແຜນຜັງສາຍງານ, ພະແນກ, ຕຳແໜ່ງ, ແລະ ງົບປະມານ',
      descriptionEn: 'Org chart, departments, positions, and workforce budget',
      actions: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
    },
    {
      id: 'module-4',
      nameLao: 'ບັນທຶກເວລາ & ສະແກນລາຍນິ້ວມື',
      nameEn: 'Attendance & Biometrics',
      category: 'OPERATIONS',
      descriptionLao: 'ສະແກນເຂົ້າ-ອອກວຽກ, ມານະໂມງ, ແລະ ລາຍງານການຂາດ',
      descriptionEn: 'Biometric punches, work hours, and lateness logs',
      actions: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
    },
    {
      id: 'module-5',
      nameLao: 'ຕາຕະລາງກະ & ວຽກຜຽນ',
      nameEn: 'Shift Management & Schedules',
      category: 'OPERATIONS',
      descriptionLao: 'ຈັດຕາຕະລາງກະວຽກ, ວັນພັກທາງການ, ແລະ ວຽກລ່ວງເວລາ',
      descriptionEn: 'Shift rosters, public holidays, and overtime rules',
      actions: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
    },
    {
      id: 'module-6',
      nameLao: 'ຄຸ້ມຄອງການລາພັກ & ໂຄຕ້າ',
      nameEn: 'Leave Management & Balances',
      category: 'OPERATIONS',
      descriptionLao: 'ຄຳຮ້ອງລາພັກປະຈຳປີ, ລາປ່ວຍ, ແລະ ການຫັກໂຄຕ້າ',
      descriptionEn: 'Annual leave requests, sick leave, and entitlement balances',
      actions: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
    },
    {
      id: 'module-7',
      nameLao: 'ເງິນເດືອນ, ອາກອນ & ປະກັນສັງຄົມ',
      nameEn: 'Payroll, Tax & Social Security',
      category: 'FINANCE',
      descriptionLao: 'ຄິດໄລ່ເງິນເດືອນ, ອາກອນລາຍໄດ້, ແລະ ເງິນສົມທົບ ວສສ',
      descriptionEn: 'Payroll calculations, PIT withholding, and SSO contributions',
      actions: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
    },
    {
      id: 'module-8',
      nameLao: 'ລະບຽບວິໄນ & ການຕັກເຕືອນ',
      nameEn: 'Discipline & Warnings',
      category: 'OPERATIONS',
      descriptionLao: 'ບັນທຶກການຕັກເຕືອນ, ລະເມີດວິໄນ, ແລະ ມາດຕະການ',
      descriptionEn: 'Official reprimands, disciplinary actions, and hearings',
      actions: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
    },
    {
      id: 'module-12',
      nameLao: 'ສູນກາງລະບົບອະນຸມັດເອກະສານ',
      nameEn: 'Central Approval Engine',
      category: 'OPERATIONS',
      descriptionLao: 'ອະນຸມັດຄຳຮ້ອງຫຼາຍລະດັບ ແລະ ການມອບໝາຍສິດ',
      descriptionEn: 'Multi-level approval workflows and delegations',
      actions: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
    },
    {
      id: 'module-15',
      nameLao: 'ຕັ້ງຄ່າລະບົບ & ຄວາມປອດໄພ',
      nameEn: 'System Administration & Security',
      category: 'SYSTEM',
      descriptionLao: 'ກຳນົດສິດຜູ້ໃຊ້, ບົດບາດ, ແລະ ບັນທຶກກວດສອບລະບົບ',
      descriptionEn: 'User permissions, role matrix, and security audit logs',
      actions: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
    },
  ],
  HR_ADMIN: [
    {
      id: 'module-1',
      nameLao: 'ພາບລວມ & ລາຍງານຜູ້ບໍລິຫານ',
      nameEn: 'Executive Dashboard & Analytics',
      category: 'CORE',
      descriptionLao: 'ສະຖິຕິບຸກຄະລາກອນ, ອັດຕາການຂາດວຽກ, ແລະ KPI ລວມ',
      descriptionEn: 'Headcount metrics, turnover, and enterprise KPIs',
      actions: { view: true, create: false, edit: false, delete: false, approve: false, export: true },
    },
    {
      id: 'module-2',
      nameLao: 'ຈັດການຂໍ້ມູນພະນັກງານ & ປະຫວັດ',
      nameEn: 'Employee Management & Records',
      category: 'CORE',
      descriptionLao: 'ຂໍ້ມູນຕົວຕົນ, ສັນຍາ, ປະຫວັດເງິນເດືອນ ແລະ ເອກະສານ',
      descriptionEn: 'Identity records, contracts, salary history, and dossier',
      actions: { view: true, create: true, edit: true, delete: false, approve: true, export: true },
    },
    {
      id: 'module-3',
      nameLao: 'ໂຄງຮ່າງອົງກອນ & ຕຳແໜ່ງ',
      nameEn: 'Organization Structure & Headcount',
      category: 'CORE',
      descriptionLao: 'ແຜນຜັງສາຍງານ, ພະແນກ, ຕຳແໜ່ງ, ແລະ ງົບປະມານ',
      descriptionEn: 'Org chart, departments, positions, and workforce budget',
      actions: { view: true, create: true, edit: true, delete: false, approve: true, export: true },
    },
    {
      id: 'module-4',
      nameLao: 'ບັນທຶກເວລາ & ສະແກນລາຍນິ້ວມື',
      nameEn: 'Attendance & Biometrics',
      category: 'OPERATIONS',
      descriptionLao: 'ສະແກນເຂົ້າ-ອອກວຽກ, ມານະໂມງ, ແລະ ລາຍງານການຂາດ',
      descriptionEn: 'Biometric punches, work hours, and lateness logs',
      actions: { view: true, create: true, edit: true, delete: false, approve: true, export: true },
    },
    {
      id: 'module-5',
      nameLao: 'ຕາຕະລາງກະ & ວຽກຜຽນ',
      nameEn: 'Shift Management & Schedules',
      category: 'OPERATIONS',
      descriptionLao: 'ຈັດຕາຕະລາງກະວຽກ, ວັນພັກທາງການ, ແລະ ວຽກລ່ວງເວລາ',
      descriptionEn: 'Shift rosters, public holidays, and overtime rules',
      actions: { view: true, create: true, edit: true, delete: false, approve: true, export: true },
    },
    {
      id: 'module-6',
      nameLao: 'ຄຸ້ມຄອງການລາພັກ & ໂຄຕ້າ',
      nameEn: 'Leave Management & Balances',
      category: 'OPERATIONS',
      descriptionLao: 'ຄຳຮ້ອງລາພັກປະຈຳປີ, ລາປ່ວຍ, ແລະ ການຫັກໂຄຕ້າ',
      descriptionEn: 'Annual leave requests, sick leave, and entitlement balances',
      actions: { view: true, create: true, edit: true, delete: false, approve: true, export: true },
    },
    {
      id: 'module-7',
      nameLao: 'ເງິນເດືອນ, ອາກອນ & ປະກັນສັງຄົມ',
      nameEn: 'Payroll, Tax & Social Security',
      category: 'FINANCE',
      descriptionLao: 'ຄິດໄລ່ເງິນເດືອນ, ອາກອນລາຍໄດ້, ແລະ ເງິນສົມທົບ ວສສ',
      descriptionEn: 'Payroll calculations, PIT withholding, and SSO contributions',
      actions: { view: true, create: true, edit: true, delete: false, approve: true, export: true },
    },
    {
      id: 'module-8',
      nameLao: 'ລະບຽບວິໄນ & ການຕັກເຕືອນ',
      nameEn: 'Discipline & Warnings',
      category: 'OPERATIONS',
      descriptionLao: 'ບັນທຶກການຕັກເຕືອນ, ລະເມີດວິໄນ, ແລະ ມາດຕະການ',
      descriptionEn: 'Official reprimands, disciplinary actions, and hearings',
      actions: { view: true, create: true, edit: true, delete: false, approve: true, export: true },
    },
    {
      id: 'module-12',
      nameLao: 'ສູນກາງລະບົບອະນຸມັດເອກະສານ',
      nameEn: 'Central Approval Engine',
      category: 'OPERATIONS',
      descriptionLao: 'ອະນຸມັດຄຳຮ້ອງຫຼາຍລະດັບ ແລະ ການມອບໝາຍສິດ',
      descriptionEn: 'Multi-level approval workflows and delegations',
      actions: { view: true, create: true, edit: true, delete: false, approve: true, export: true },
    },
    {
      id: 'module-15',
      nameLao: 'ຕັ້ງຄ່າລະບົບ & ຄວາມປອດໄພ',
      nameEn: 'System Administration & Security',
      category: 'SYSTEM',
      descriptionLao: 'ກຳນົດສິດຜູ້ໃຊ້, ບົດບາດ, ແລະ ບັນທຶກກວດສອບລະບົບ',
      descriptionEn: 'User permissions, role matrix, and security audit logs',
      actions: { view: true, create: false, edit: false, delete: false, approve: false, export: true },
    },
  ],
  EXECUTIVE: [
    {
      id: 'module-1',
      nameLao: 'ພາບລວມ & ລາຍງານຜູ້ບໍລິຫານ',
      nameEn: 'Executive Dashboard & Analytics',
      category: 'CORE',
      descriptionLao: 'ສະຖິຕິບຸກຄະລາກອນ, ອັດຕາການຂາດວຽກ, ແລະ KPI ລວມ',
      descriptionEn: 'Headcount metrics, turnover, and enterprise KPIs',
      actions: { view: true, create: false, edit: false, delete: false, approve: true, export: true },
    },
    {
      id: 'module-2',
      nameLao: 'ຈັດການຂໍ້ມູນພະນັກງານ & ປະຫວັດ',
      nameEn: 'Employee Management & Records',
      category: 'CORE',
      descriptionLao: 'ຂໍ້ມູນຕົວຕົນ, ສັນຍາ, ປະຫວັດເງິນເດືອນ ແລະ ເອກະສານ',
      descriptionEn: 'Identity records, contracts, salary history, and dossier',
      actions: { view: true, create: false, edit: false, delete: false, approve: true, export: true },
    },
    {
      id: 'module-3',
      nameLao: 'ໂຄງຮ່າງອົງກອນ & ຕຳແໜ່ງ',
      nameEn: 'Organization Structure & Headcount',
      category: 'CORE',
      descriptionLao: 'ແຜນຜັງສາຍງານ, ພະແນກ, ຕຳແໜ່ງ, ແລະ ງົບປະມານ',
      descriptionEn: 'Org chart, departments, positions, and workforce budget',
      actions: { view: true, create: false, edit: false, delete: false, approve: true, export: true },
    },
    {
      id: 'module-4',
      nameLao: 'ບັນທຶກເວລາ & ສະແກນລາຍນິ້ວມື',
      nameEn: 'Attendance & Biometrics',
      category: 'OPERATIONS',
      descriptionLao: 'ສະແກນເຂົ້າ-ອອກວຽກ, ມານະໂມງ, ແລະ ລາຍງານການຂາດ',
      descriptionEn: 'Biometric punches, work hours, and lateness logs',
      actions: { view: true, create: false, edit: false, delete: false, approve: true, export: true },
    },
    {
      id: 'module-5',
      nameLao: 'ຕາຕະລາງກະ & ວຽກຜຽນ',
      nameEn: 'Shift Management & Schedules',
      category: 'OPERATIONS',
      descriptionLao: 'ຈັດຕາຕະລາງກະວຽກ, ວັນພັກທາງການ, ແລະ ວຽກລ່ວງເວລາ',
      descriptionEn: 'Shift rosters, public holidays, and overtime rules',
      actions: { view: true, create: false, edit: false, delete: false, approve: true, export: true },
    },
    {
      id: 'module-6',
      nameLao: 'ຄຸ້ມຄອງການລາພັກ & ໂຄຕ້າ',
      nameEn: 'Leave Management & Balances',
      category: 'OPERATIONS',
      descriptionLao: 'ຄຳຮ້ອງລາພັກປະຈຳປີ, ລາປ່ວຍ, ແລະ ການຫັກໂຄຕ້າ',
      descriptionEn: 'Annual leave requests, sick leave, and entitlement balances',
      actions: { view: true, create: false, edit: false, delete: false, approve: true, export: true },
    },
    {
      id: 'module-7',
      nameLao: 'ເງິນເດືອນ, ອາກອນ & ປະກັນສັງຄົມ',
      nameEn: 'Payroll, Tax & Social Security',
      category: 'FINANCE',
      descriptionLao: 'ຄິດໄລ່ເງິນເດືອນ, ອາກອນລາຍໄດ້, ແລະ ເງິນສົມທົບ ວສສ',
      descriptionEn: 'Payroll calculations, PIT withholding, and SSO contributions',
      actions: { view: true, create: false, edit: false, delete: false, approve: true, export: true },
    },
    {
      id: 'module-8',
      nameLao: 'ລະບຽບວິໄນ & ການຕັກເຕືອນ',
      nameEn: 'Discipline & Warnings',
      category: 'OPERATIONS',
      descriptionLao: 'ບັນທຶກການຕັກເຕືອນ, ລະເມີດວິໄນ, ແລະ ມາດຕະການ',
      descriptionEn: 'Official reprimands, disciplinary actions, and hearings',
      actions: { view: true, create: false, edit: false, delete: false, approve: true, export: true },
    },
    {
      id: 'module-12',
      nameLao: 'ສູນກາງລະບົບອະນຸມັດເອກະສານ',
      nameEn: 'Central Approval Engine',
      category: 'OPERATIONS',
      descriptionLao: 'ອະນຸມັດຄຳຮ້ອງຫຼາຍລະດັບ ແລະ ການມອບໝາຍສິດ',
      descriptionEn: 'Multi-level approval workflows and delegations',
      actions: { view: true, create: false, edit: false, delete: false, approve: true, export: true },
    },
    {
      id: 'module-15',
      nameLao: 'ຕັ້ງຄ່າລະບົບ & ຄວາມປອດໄພ',
      nameEn: 'System Administration & Security',
      category: 'SYSTEM',
      descriptionLao: 'ກຳນົດສິດຜູ້ໃຊ້, ບົດບາດ, ແລະ ບັນທຶກກວດສອບລະບົບ',
      descriptionEn: 'User permissions, role matrix, and security audit logs',
      actions: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
    },
  ],
  DEPT_HEAD: [
    {
      id: 'module-1',
      nameLao: 'ພາບລວມ & ລາຍງານຜູ້ບໍລິຫານ',
      nameEn: 'Executive Dashboard & Analytics',
      category: 'CORE',
      descriptionLao: 'ສະຖິຕິບຸກຄະລາກອນ, ອັດຕາການຂາດວຽກ, ແລະ KPI ລວມ',
      descriptionEn: 'Headcount metrics, turnover, and enterprise KPIs',
      actions: { view: true, create: false, edit: false, delete: false, approve: false, export: true },
    },
    {
      id: 'module-2',
      nameLao: 'ຈັດການຂໍ້ມູນພະນັກງານ & ປະຫວັດ',
      nameEn: 'Employee Management & Records',
      category: 'CORE',
      descriptionLao: 'ຂໍ້ມູນຕົວຕົນ, ສັນຍາ, ປະຫວັດເງິນເດືອນ ແລະ ເອກະສານ',
      descriptionEn: 'Identity records, contracts, salary history, and dossier',
      actions: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
    },
    {
      id: 'module-3',
      nameLao: 'ໂຄງຮ່າງອົງກອນ & ຕຳແໜ່ງ',
      nameEn: 'Organization Structure & Headcount',
      category: 'CORE',
      descriptionLao: 'ແຜນຜັງສາຍງານ, ພະແນກ, ຕຳແໜ່ງ, ແລະ ງົບປະມານ',
      descriptionEn: 'Org chart, departments, positions, and workforce budget',
      actions: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
    },
    {
      id: 'module-4',
      nameLao: 'ບັນທຶກເວລາ & ສະແກນລາຍນິ້ວມື',
      nameEn: 'Attendance & Biometrics',
      category: 'OPERATIONS',
      descriptionLao: 'ສະແກນເຂົ້າ-ອອກວຽກ, ມານະໂມງ, ແລະ ລາຍງານການຂາດ',
      descriptionEn: 'Biometric punches, work hours, and lateness logs',
      actions: { view: true, create: false, edit: false, delete: false, approve: true, export: true },
    },
    {
      id: 'module-5',
      nameLao: 'ຕາຕະລາງກະ & ວຽກຜຽນ',
      nameEn: 'Shift Management & Schedules',
      category: 'OPERATIONS',
      descriptionLao: 'ຈັດຕາຕະລາງກະວຽກ, ວັນພັກທາງການ, ແລະ ວຽກລ່ວງເວລາ',
      descriptionEn: 'Shift rosters, public holidays, and overtime rules',
      actions: { view: true, create: true, edit: true, delete: false, approve: true, export: true },
    },
    {
      id: 'module-6',
      nameLao: 'ຄຸ້ມຄອງການລາພັກ & ໂຄຕ້າ',
      nameEn: 'Leave Management & Balances',
      category: 'OPERATIONS',
      descriptionLao: 'ຄຳຮ້ອງລາພັກປະຈຳປີ, ລາປ່ວຍ, ແລະ ການຫັກໂຄຕ້າ',
      descriptionEn: 'Annual leave requests, sick leave, and entitlement balances',
      actions: { view: true, create: true, edit: false, delete: false, approve: true, export: true },
    },
    {
      id: 'module-7',
      nameLao: 'ເງິນເດືອນ, ອາກອນ & ປະກັນສັງຄົມ',
      nameEn: 'Payroll, Tax & Social Security',
      category: 'FINANCE',
      descriptionLao: 'ຄິດໄລ່ເງິນເດືອນ, ອາກອນລາຍໄດ້, ແລະ ເງິນສົມທົບ ວສສ',
      descriptionEn: 'Payroll calculations, PIT withholding, and SSO contributions',
      actions: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
    },
    {
      id: 'module-8',
      nameLao: 'ລະບຽບວິໄນ & ການຕັກເຕືອນ',
      nameEn: 'Discipline & Warnings',
      category: 'OPERATIONS',
      descriptionLao: 'ບັນທຶກການຕັກເຕືອນ, ລະເມີດວິໄນ, ແລະ ມາດຕະການ',
      descriptionEn: 'Official reprimands, disciplinary actions, and hearings',
      actions: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
    },
    {
      id: 'module-12',
      nameLao: 'ສູນກາງລະບົບອະນຸມັດເອກະສານ',
      nameEn: 'Central Approval Engine',
      category: 'OPERATIONS',
      descriptionLao: 'ອະນຸມັດຄຳຮ້ອງຫຼາຍລະດັບ ແລະ ການມອບໝາຍສິດ',
      descriptionEn: 'Multi-level approval workflows and delegations',
      actions: { view: true, create: true, edit: false, delete: false, approve: true, export: false },
    },
    {
      id: 'module-15',
      nameLao: 'ຕັ້ງຄ່າລະບົບ & ຄວາມປອດໄພ',
      nameEn: 'System Administration & Security',
      category: 'SYSTEM',
      descriptionLao: 'ກຳນົດສິດຜູ້ໃຊ້, ບົດບາດ, ແລະ ບັນທຶກກວດສອບລະບົບ',
      descriptionEn: 'User permissions, role matrix, and security audit logs',
      actions: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
    },
  ],
  EMPLOYEE: [
    {
      id: 'module-1',
      nameLao: 'ພາບລວມ & ລາຍງານຜູ້ບໍລິຫານ',
      nameEn: 'Executive Dashboard & Analytics',
      category: 'CORE',
      descriptionLao: 'ສະຖິຕິບຸກຄະລາກອນ, ອັດຕາການຂາດວຽກ, ແລະ KPI ລວມ',
      descriptionEn: 'Headcount metrics, turnover, and enterprise KPIs',
      actions: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
    },
    {
      id: 'module-2',
      nameLao: 'ຈັດການຂໍ້ມູນພະນັກງານ & ປະຫວັດ',
      nameEn: 'Employee Management & Records',
      category: 'CORE',
      descriptionLao: 'ຂໍ້ມູນຕົວຕົນ, ສັນຍາ, ປະຫວັດເງິນເດືອນ ແລະ ເອກະສານ',
      descriptionEn: 'Identity records, contracts, salary history, and dossier',
      actions: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
    },
    {
      id: 'module-3',
      nameLao: 'ໂຄງຮ່າງອົງກອນ & ຕຳແໜ່ງ',
      nameEn: 'Organization Structure & Headcount',
      category: 'CORE',
      descriptionLao: 'ແຜນຜັງສາຍງານ, ພະແນກ, ຕຳແໜ່ງ, ແລະ ງົບປະມານ',
      descriptionEn: 'Org chart, departments, positions, and workforce budget',
      actions: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
    },
    {
      id: 'module-4',
      nameLao: 'ບັນທຶກເວລາ & ສະແກນລາຍນິ້ວມື',
      nameEn: 'Attendance & Biometrics',
      category: 'OPERATIONS',
      descriptionLao: 'ສະແກນເຂົ້າ-ອອກວຽກ, ມານະໂມງ, ແລະ ລາຍງານການຂາດ',
      descriptionEn: 'Biometric punches, work hours, and lateness logs',
      actions: { view: true, create: true, edit: false, delete: false, approve: false, export: false },
    },
    {
      id: 'module-5',
      nameLao: 'ຕາຕະລາງກະ & ວຽກຜຽນ',
      nameEn: 'Shift Management & Schedules',
      category: 'OPERATIONS',
      descriptionLao: 'ຈັດຕາຕະລາງກະວຽກ, ວັນພັກທາງການ, ແລະ ວຽກລ່ວງເວລາ',
      descriptionEn: 'Shift rosters, public holidays, and overtime rules',
      actions: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
    },
    {
      id: 'module-6',
      nameLao: 'ຄຸ້ມຄອງການລາພັກ & ໂຄຕ້າ',
      nameEn: 'Leave Management & Balances',
      category: 'OPERATIONS',
      descriptionLao: 'ຄຳຮ້ອງລາພັກປະຈຳປີ, ລາປ່ວຍ, ແລະ ການຫັກໂຄຕ້າ',
      descriptionEn: 'Annual leave requests, sick leave, and entitlement balances',
      actions: { view: true, create: true, edit: false, delete: false, approve: false, export: false },
    },
    {
      id: 'module-7',
      nameLao: 'ເງິນເດືອນ, ອາກອນ & ປະກັນສັງຄົມ',
      nameEn: 'Payroll, Tax & Social Security',
      category: 'FINANCE',
      descriptionLao: 'ຄິດໄລ່ເງິນເດືອນ, ອາກອນລາຍໄດ້, ແລະ ເງິນສົມທົບ ວສສ',
      descriptionEn: 'Payroll calculations, PIT withholding, and SSO contributions',
      actions: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
    },
    {
      id: 'module-8',
      nameLao: 'ລະບຽບວິໄນ & ການຕັກເຕືອນ',
      nameEn: 'Discipline & Warnings',
      category: 'OPERATIONS',
      descriptionLao: 'ບັນທຶກການຕັກເຕືອນ, ລະເມີດວິໄນ, ແລະ ມາດຕະການ',
      descriptionEn: 'Official reprimands, disciplinary actions, and hearings',
      actions: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
    },
    {
      id: 'module-12',
      nameLao: 'ສູນກາງລະບົບອະນຸມັດເອກະສານ',
      nameEn: 'Central Approval Engine',
      category: 'OPERATIONS',
      descriptionLao: 'ອະນຸມັດຄຳຮ້ອງຫຼາຍລະດັບ ແລະ ການມອບໝາຍສິດ',
      descriptionEn: 'Multi-level approval workflows and delegations',
      actions: { view: true, create: true, edit: false, delete: false, approve: false, export: false },
    },
    {
      id: 'module-15',
      nameLao: 'ຕັ້ງຄ່າລະບົບ & ຄວາມປອດໄພ',
      nameEn: 'System Administration & Security',
      category: 'SYSTEM',
      descriptionLao: 'ກຳນົດສິດຜູ້ໃຊ້, ບົດບາດ, ແລະ ບັນທຶກກວດສອບລະບົບ',
      descriptionEn: 'User permissions, role matrix, and security audit logs',
      actions: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
    },
  ],
};

const ROLE_METADATA: Record<Role, { nameLao: string; nameEn: string; descLao: string; descEn: string; color: string; badgeBg: string }> = {
  SUPER_ADMIN: {
    nameLao: 'ຜູ້ດູແລລະບົບສູງສຸດ',
    nameEn: 'Super Administrator',
    descLao: 'ມີສິດສູງສຸດໃນການຄຸ້ມຄອງລະບົບ, ຖານຂໍ້ມູນ, ການກຳນົດສິດ ແລະ ກວດສອບຄວາມປອດໄພທັງໝົດ',
    descEn: 'Full root access to system configs, user provisioning, security audit, and database',
    color: 'text-indigo-600 dark:text-indigo-400',
    badgeBg: 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300',
  },
  HR_ADMIN: {
    nameLao: 'ຜູ້ບໍລິຫານບຸກຄະລາກອນ',
    nameEn: 'HR Administrator / Manager',
    descLao: 'ຄຸ້ມຄອງຂໍ້ມູນພະນັກງານ, ເງິນເດືອນ, ອາກອນ, ການລາພັກ, ການປະເມີນ ແລະ ຂະບວນການ HR ຄົບວົງຈອນ',
    descEn: 'Manage employee dossier, full payroll run, benefits, onboarding, and compliance',
    color: 'text-emerald-600 dark:text-emerald-400',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300',
  },
  EXECUTIVE: {
    nameLao: 'ຄະນະຜູ້ບໍລິຫານ / ຜູ້ອຳນວຍການ',
    nameEn: 'Executive Board / Managing Director',
    descLao: 'ສິດອະນຸມັດຂັ້ນສູງສຸດ, ເຂົ້າເຖິງ dashboard ພາບລວມຍຸດທະສາດ, ງົບປະມານ ແລະ ລາຍງານການເງິນ',
    descEn: 'Executive oversight, final approval authority, corporate KPI dashboards, and financial reports',
    color: 'text-purple-600 dark:text-purple-400',
    badgeBg: 'bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300',
  },
  DEPT_HEAD: {
    nameLao: 'ຫົວໜ້າພະແນກ / ຜູ້ຈັດການສາຍງານ',
    nameEn: 'Department Head / Line Manager',
    descLao: 'ຄຸ້ມຄອງສະມາຊິກພາຍໃນພະແນກ, ຈັດຕາຕະລາງກະວຽກ, ອະນຸມັດການລາພັກ ແລະ ປະເມີນຜົນງານ',
    descEn: 'Supervise department team, approve shifts/leaves, track team attendance, and submit KPIs',
    color: 'text-amber-600 dark:text-amber-400',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300',
  },
  EMPLOYEE: {
    nameLao: 'ພະນັກງານທົ່ວໄປ',
    nameEn: 'Staff Member / Self-Service',
    descLao: 'ບໍລິການຕົນເອງ (Self-Service): ສະແກນເຂົ້າ-ອອກວຽກ, ຍື່ນຄຳຮ້ອງລາພັກ, ເບິ່ງໃບເງິນເດືອນ ແລະ ເອກະສານ',
    descEn: 'Self-service portal: Clock-in/out, submit leave requests, view monthly payslips, and profile',
    color: 'text-slate-600 dark:text-slate-400',
    badgeBg: 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300',
  },
};

export const UserAccessControlManager: React.FC = () => {
  const {
    language,
    currentUser,
    setCurrentUser,
    availableUsers,
    updateUserRole,
    updateUser,
    createUserAccount,
    deleteUserAccount,
    departments,
    employees,
    addAuditLog,
  } = useApp();

  // Active Tab: 'ROLES_MATRIX' (ກຳນົດສິດບົດບາດ) | 'USER_ACCOUNTS' (ກຳນົດສິດບັນຊີຜູ້ໃຊ້)
  const [activeTab, setActiveTab] = useState<'ROLES_MATRIX' | 'USER_ACCOUNTS'>('ROLES_MATRIX');

  // Selected Role for detailed matrix inspection
  const [selectedRole, setSelectedRole] = useState<Role>('HR_ADMIN');

  // Matrix state per role
  const [rolePermissions, setRolePermissions] = useState<Record<Role, ModulePermissionDefinition[]>>(() => {
    try {
      const saved = localStorage.getItem('lhse_role_permissions_config');
      return saved ? JSON.parse(saved) : DEFAULT_MODULE_PERMISSIONS;
    } catch {
      return DEFAULT_MODULE_PERMISSIONS;
    }
  });

  // User list search & filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // User Edit Modal State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editRole, setEditRole] = useState<Role>('EMPLOYEE');
  const [editDepartmentId, setEditDepartmentId] = useState<string>('');
  const [editIsActive, setEditIsActive] = useState<boolean>(true);
  const [editCustomPerms, setEditCustomPerms] = useState<string[]>([]);

  // Create User Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [newUsername, setNewUsername] = useState('');
  const [newRole, setNewRole] = useState<Role>('EMPLOYEE');
  const [newDepartmentId, setNewDepartmentId] = useState('');

  // Save Role Permissions Matrix to localStorage & log audit
  const handleSaveRoleMatrix = () => {
    localStorage.setItem('lhse_role_permissions_config', JSON.stringify(rolePermissions));
    addAuditLog(
      'ROLE_PERMISSION_UPDATE',
      'UPDATE',
      'User Access Control',
      `Updated permission matrix for role: ${selectedRole}`,
      {
        entityType: 'ROLE_POLICY',
        entityName: selectedRole,
      }
    );
    alerts.success(
      language === 'lo' ? 'ບັນທຶກສິດບົດບາດສຳເລັດ' : 'Role Permissions Saved',
      language === 'lo'
        ? `ການກຳນົດສິດຂອງບົດບາດ ${ROLE_METADATA[selectedRole].nameLao} ໄດ້ຮັບການບັນທຶກແລ້ວ`
        : `Updated permissions matrix for ${ROLE_METADATA[selectedRole].nameEn}`
    );
  };

  // Reset Role Permissions Matrix to defaults
  const handleResetRoleMatrix = () => {
    setRolePermissions((prev) => ({
      ...prev,
      [selectedRole]: DEFAULT_MODULE_PERMISSIONS[selectedRole],
    }));
    alerts.info(
      language === 'lo' ? 'ຣີເຊັດເປັນຄ່າເລີ່ມຕົ້ນ' : 'Reset to Standard Policy',
      language === 'lo'
        ? 'ສິດຂອງບົດບາດນີ້ຖືກປັບເປັນມາດຕະຖານ LHSE ແລ້ວ'
        : 'Permissions restored to default LHSE compliance baseline'
    );
  };

  // Toggle action permission in matrix
  const handleTogglePermission = (
    moduleId: string,
    actionKey: 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'export'
  ) => {
    setRolePermissions((prev) => {
      const currentList = prev[selectedRole] || [];
      const updatedList = currentList.map((mod) => {
        if (mod.id === moduleId) {
          return {
            ...mod,
            actions: {
              ...mod.actions,
              [actionKey]: !mod.actions[actionKey],
            },
          };
        }
        return mod;
      });
      return {
        ...prev,
        [selectedRole]: updatedList,
      };
    });
  };

  // Filtered users
  const filteredUsers = useMemo(() => {
    return availableUsers.filter((u) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        u.username.toLowerCase().includes(q) ||
        u.fullName.toLowerCase().includes(q) ||
        u.fullNameLao.includes(q) ||
        u.email.toLowerCase().includes(q);

      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && u.isActive) ||
        (statusFilter === 'INACTIVE' && !u.isActive);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [availableUsers, searchQuery, roleFilter, statusFilter]);

  // Open Edit User modal
  const handleOpenEditUser = (user: User) => {
    setEditingUser(user);
    setEditRole(user.role);
    setEditDepartmentId(user.departmentId || '');
    setEditIsActive(user.isActive);
    setEditCustomPerms(user.customPermissions || []);
  };

  // Save User Edit
  const handleSaveUserEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    updateUser(editingUser.id, {
      role: editRole,
      departmentId: editDepartmentId || undefined,
      isActive: editIsActive,
      customPermissions: editCustomPerms,
    });

    setEditingUser(null);
    alerts.success(
      language === 'lo' ? 'ອັບເດດສິດຜູ້ໃຊ້ສຳເລັດ' : 'User Access Updated',
      language === 'lo'
        ? `ບັນຊີ ${editingUser.fullName} ໄດ້ຮັບການກຳນົດສິດໃໝ່ຮຽບຮ້ອຍແລ້ວ`
        : `Access permissions updated for ${editingUser.fullName}`
    );
  };

  // Create User submit
  const handleCreateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((e) => e.id === selectedEmployeeId);
    if (!emp) {
      alerts.error(language === 'lo' ? 'ກະລຸນາເລືອກພະນັກງານ' : 'Please select an employee');
      return;
    }

    if (!newUsername.trim()) {
      alerts.error(language === 'lo' ? 'ກະລຸນາປ້ອນຊື່ຜູ້ໃຊ້' : 'Please provide username');
      return;
    }

    // Check duplicate username
    if (availableUsers.some((u) => u.username.toLowerCase() === newUsername.trim().toLowerCase())) {
      alerts.error(language === 'lo' ? 'ຊື່ຜູ້ໃຊ້ນີ້ມີໃນລະບົບແລ້ວ' : 'Username already exists');
      return;
    }

    createUserAccount({
      username: newUsername.trim().toLowerCase(),
      email: emp.email || `${newUsername.trim().toLowerCase()}@laoholding.gov.la`,
      fullName: `${emp.firstNameEn} ${emp.lastNameEn}`,
      fullNameLao: `${emp.firstNameLao} ${emp.lastNameLao}`,
      role: newRole,
      employeeId: emp.id,
      departmentId: newDepartmentId || emp.departmentId,
      branchId: emp.branchId,
      isActive: true,
      customPermissions: [],
    });

    setIsCreateModalOpen(false);
    setSelectedEmployeeId('');
    setNewUsername('');
    setNewDepartmentId('');
  };

  // Quick Switch Persona to test permissions
  const handleSimulateUser = (user: User) => {
    const prevRole = currentUser.role;
    setCurrentUser(user);
    addAuditLog(
      'ROLE_SWITCH',
      'SYSTEM',
      'User Access Control',
      `Simulated perspective switched from ${prevRole} to ${user.role} (${user.fullName})`,
      {
        entityType: 'USER_ACCOUNT',
        entityName: user.fullName,
        recordId: user.id,
      }
    );
    alerts.info(
      language === 'lo' ? 'ປ່ຽນບົດບາດທົດສອບສຳເລັດ' : 'Switched Simulation Persona',
      language === 'lo'
        ? `ຕອນນີ້ທ່ານກຳລັງເບິ່ງລະບົບໃນຖານະ: ${user.fullNameLao} (${ROLE_METADATA[user.role].nameLao})`
        : `Now viewing system as ${user.fullName} (${user.role})`
    );
  };

  // Custom permission toggle helper
  const handleToggleCustomPerm = (permKey: string) => {
    setEditCustomPerms((prev) =>
      prev.includes(permKey) ? prev.filter((p) => p !== permKey) : [...prev, permKey]
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Sub-Tabs */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 rounded-3xl p-6 lg:p-8 text-white shadow-lg border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h2 className="font-black text-xl lg:text-2xl tracking-tight">
                {language === 'lo' ? 'ກຳນົດສິດຜູ້ເຂົ້າໃຊ້ລະບົບ (Access Control & RBAC)' : 'User Permissions & Access Control'}
              </h2>
            </div>
            <p className="text-xs text-blue-200/80 max-w-2xl leading-relaxed">
              {language === 'lo'
                ? 'ຄຸ້ມຄອງສິດການເຂົ້າເຖິງລະບົບຂອງພະນັກງານ LHSE, ຈັດການບົດບາດ (Roles), ແລະ ກຳນົດສິດລະອຽດລະດັບເມນູ ແລະ ການດຳເນີນງານ'
                : 'Configure enterprise Role-Based Access Control (RBAC), provision user accounts, and manage granular module action grants'}
            </p>
          </div>

          {/* Quick Stats Badges */}
          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/15 text-center">
              <span className="text-[10px] uppercase font-bold text-blue-200 block">
                {language === 'lo' ? 'ຜູ້ໃຊ້ທັງໝົດ' : 'Total Users'}
              </span>
              <span className="font-mono font-black text-lg">{availableUsers.length}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/15 text-center">
              <span className="text-[10px] uppercase font-bold text-emerald-300 block">
                {language === 'lo' ? 'ເປີດໃຊ້ງານ' : 'Active'}
              </span>
              <span className="font-mono font-black text-lg text-emerald-400">
                {availableUsers.filter((u) => u.isActive).length}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 mt-6 pt-4 border-t border-white/10">
          <button
            onClick={() => setActiveTab('ROLES_MATRIX')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'ROLES_MATRIX'
                ? 'bg-white text-slate-900 shadow-md scale-102'
                : 'text-white/80 hover:bg-white/10'
            }`}
          >
            <Sliders className="w-4 h-4 text-blue-600" />
            <span>{language === 'lo' ? '1. ຕາຕະລາງກຳນົດສິດບົດບາດ (Role Matrix)' : '1. Role Permissions Matrix'}</span>
          </button>

          <button
            onClick={() => setActiveTab('USER_ACCOUNTS')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'USER_ACCOUNTS'
                ? 'bg-white text-slate-900 shadow-md scale-102'
                : 'text-white/80 hover:bg-white/10'
            }`}
          >
            <Users className="w-4 h-4 text-indigo-600" />
            <span>{language === 'lo' ? '2. ຄຸ້ມຄອງບັນຊີຜູ້ໃຊ້ (User Accounts)' : '2. User Accounts & Direct Grants'}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-blue-500/30 text-[10px]">
              {availableUsers.length}
            </span>
          </button>
        </div>
      </div>

      {/* 2. TAB CONTENT: ROLES MATRIX */}
      {activeTab === 'ROLES_MATRIX' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Role Selection Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {(['SUPER_ADMIN', 'HR_ADMIN', 'EXECUTIVE', 'DEPT_HEAD', 'EMPLOYEE'] as Role[]).map((r) => {
              const meta = ROLE_METADATA[r];
              const isSelected = selectedRole === r;
              const count = availableUsers.filter((u) => u.role === r).length;

              return (
                <button
                  key={r}
                  onClick={() => setSelectedRole(r)}
                  className={`p-4 rounded-3xl border-2 text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 shadow-sm scale-102 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${meta.badgeBg}`}>
                        {r.replace('_', ' ')}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 font-bold">
                        {count} {language === 'lo' ? 'ຄົນ' : 'users'}
                      </span>
                    </div>

                    <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                      {language === 'lo' ? meta.nameLao : meta.nameEn}
                    </h4>
                    <p className="text-[11px] text-slate-500 line-clamp-2">
                      {language === 'lo' ? meta.descLao : meta.descEn}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-medium">
                      {isSelected ? (language === 'lo' ? 'ກຳລັງຕັ້ງຄ່າ' : 'Editing') : (language === 'lo' ? 'ຄລິກເພື່ອຕັ້ງຄ່າ' : 'Select')}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Granular Permission Matrix for Selected Role */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 lg:p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-base text-slate-900 dark:text-slate-100">
                    {language === 'lo'
                      ? `ສິດທິການດຳເນີນງານຂອງ: ${ROLE_METADATA[selectedRole].nameLao}`
                      : `Permission Action Grants: ${ROLE_METADATA[selectedRole].nameEn}`}
                  </h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${ROLE_METADATA[selectedRole].badgeBg}`}>
                    {selectedRole}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {language === 'lo'
                    ? 'ກົດສະວິດສີຟ້າເພື່ອເປີດ ຫຼື ປິດສິດທິໃນການ ເບິ່ງ, ສ້າງ, ແກ້ໄຂ, ລຶບ, ອະນຸມັດ ແລະ ສົ່ງອອກລາຍງານ'
                    : 'Toggle action flags to fine-tune access for View, Create, Edit, Delete, Approve, and Export'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleResetRoleMatrix}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{language === 'lo' ? 'ຣີເຊັດເປັນມາດຕະຖານ' : 'Reset Baseline'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveRoleMatrix}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-500/20 transition-all"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{language === 'lo' ? 'ບັນທຶກສິດບົດບາດ' : 'Save Grants'}</span>
                </button>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 uppercase font-black text-[10px] tracking-wider">
                    <th className="p-3.5 rounded-l-2xl">{language === 'lo' ? 'ໂມດູນລະບົບ (System Module)' : 'System Module'}</th>
                    <th className="p-3.5 text-center">{language === 'lo' ? 'ເບິ່ງ (View)' : 'View'}</th>
                    <th className="p-3.5 text-center">{language === 'lo' ? 'ສ້າງ (Create)' : 'Create'}</th>
                    <th className="p-3.5 text-center">{language === 'lo' ? 'ແກ້ໄຂ (Edit)' : 'Edit'}</th>
                    <th className="p-3.5 text-center">{language === 'lo' ? 'ລຶບ (Delete)' : 'Delete'}</th>
                    <th className="p-3.5 text-center">{language === 'lo' ? 'ອະນຸມັດ (Approve)' : 'Approve'}</th>
                    <th className="p-3.5 text-center rounded-r-2xl">{language === 'lo' ? 'ສົ່ງອອກ (Export)' : 'Export'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(rolePermissions[selectedRole] || []).map((mod) => (
                    <tr key={mod.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 min-w-[240px]">
                        <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
                          {language === 'lo' ? mod.nameLao : mod.nameEn}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {language === 'lo' ? mod.descriptionLao : mod.descriptionEn}
                        </div>
                      </td>

                      {/* View Action Toggle */}
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleTogglePermission(mod.id, 'view')}
                          className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-colors cursor-pointer ${
                            mod.actions.view
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600'
                          }`}
                          title="Toggle View"
                        >
                          {mod.actions.view ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                        </button>
                      </td>

                      {/* Create Action Toggle */}
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleTogglePermission(mod.id, 'create')}
                          className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-colors cursor-pointer ${
                            mod.actions.create
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600'
                          }`}
                          title="Toggle Create"
                        >
                          {mod.actions.create ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                        </button>
                      </td>

                      {/* Edit Action Toggle */}
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleTogglePermission(mod.id, 'edit')}
                          className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-colors cursor-pointer ${
                            mod.actions.edit
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600'
                          }`}
                          title="Toggle Edit"
                        >
                          {mod.actions.edit ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                        </button>
                      </td>

                      {/* Delete Action Toggle */}
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleTogglePermission(mod.id, 'delete')}
                          className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-colors cursor-pointer ${
                            mod.actions.delete
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600'
                          }`}
                          title="Toggle Delete"
                        >
                          {mod.actions.delete ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                        </button>
                      </td>

                      {/* Approve Action Toggle */}
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleTogglePermission(mod.id, 'approve')}
                          className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-colors cursor-pointer ${
                            mod.actions.approve
                              ? 'bg-purple-600 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600'
                          }`}
                          title="Toggle Approve"
                        >
                          {mod.actions.approve ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                        </button>
                      </td>

                      {/* Export Action Toggle */}
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleTogglePermission(mod.id, 'export')}
                          className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-colors cursor-pointer ${
                            mod.actions.export
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600'
                          }`}
                          title="Toggle Export"
                        >
                          {mod.actions.export ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. TAB CONTENT: USER ACCOUNTS & DIRECT GRANTS */}
      {activeTab === 'USER_ACCOUNTS' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Controls Bar: Search, Filters, and Add User Button */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 flex-wrap">
              {/* Search */}
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    language === 'lo'
                      ? 'ຄົ້ນຫາຊື່ຜູ້ໃຊ້, ຊື່ພະນັກງານ, ອີເມວ...'
                      : 'Search username, full name, email...'
                  }
                  className="w-full pl-10 pr-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Role Filter */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-hidden font-bold"
              >
                <option value="ALL">{language === 'lo' ? 'ທຸກບົດບາດ (All Roles)' : 'All Roles'}</option>
                <option value="SUPER_ADMIN">SUPER ADMIN</option>
                <option value="HR_ADMIN">HR ADMIN</option>
                <option value="EXECUTIVE">EXECUTIVE</option>
                <option value="DEPT_HEAD">DEPT HEAD</option>
                <option value="EMPLOYEE">EMPLOYEE</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-hidden font-bold"
              >
                <option value="ALL">{language === 'lo' ? 'ທຸກສະຖານະ (All Status)' : 'All Status'}</option>
                <option value="ACTIVE">{language === 'lo' ? 'ເປີດໃຊ້ງານ (Active)' : 'Active'}</option>
                <option value="INACTIVE">{language === 'lo' ? 'ປິດໃຊ້ງານ (Inactive)' : 'Inactive'}</option>
              </select>
            </div>

            {/* Create User Button */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md shadow-blue-500/20 shrink-0 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>{language === 'lo' ? 'ເພີ່ມບັນຊີຜູ້ໃຊ້ໃໝ່' : 'Grant New User Access'}</span>
            </button>
          </div>

          {/* User Accounts Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 uppercase font-black text-[10px] tracking-wider">
                    <th className="p-4">{language === 'lo' ? 'ຜູ້ໃຊ້ງານ & ພະນັກງານ' : 'User Account & Staff'}</th>
                    <th className="p-4">{language === 'lo' ? 'ບົດບາດລະບົບ' : 'Assigned Role'}</th>
                    <th className="p-4">{language === 'lo' ? 'ຂອບເຂດຂໍ້ມູນ (Scope)' : 'Department Scope'}</th>
                    <th className="p-4 text-center">{language === 'lo' ? 'ສະຖານະ' : 'Status'}</th>
                    <th className="p-4 text-right">{language === 'lo' ? 'ການດຳເນີນງານ' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredUsers.map((u) => {
                    const roleMeta = ROLE_METADATA[u.role] || ROLE_METADATA.EMPLOYEE;
                    const dept = departments.find((d) => d.id === u.departmentId);
                    const isSelf = u.id === currentUser.id;

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        {/* User Identity */}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {u.avatarUrl ? (
                              <img
                                src={u.avatarUrl}
                                alt={u.fullName}
                                className="w-10 h-10 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-2xs shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                                {u.fullName.slice(0, 2).toUpperCase()}
                              </div>
                            )}

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                                  {language === 'lo' ? u.fullNameLao : u.fullName}
                                </span>
                                {isSelf && (
                                  <span className="px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[9px] font-bold">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                                @{u.username} • {u.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Role Badge */}
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${roleMeta.badgeBg}`}>
                            <Shield className="w-3 h-3 shrink-0" />
                            <span>{language === 'lo' ? roleMeta.nameLao : roleMeta.nameEn}</span>
                          </span>
                        </td>

                        {/* Department Scope */}
                        <td className="p-4">
                          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                            <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span className="font-medium">
                              {dept
                                ? language === 'lo'
                                  ? dept.nameLao
                                  : dept.nameEn
                                : language === 'lo'
                                ? 'ທຸກພະແນກ (All Departments)'
                                : 'All Departments'}
                            </span>
                          </div>
                          {u.customPermissions && u.customPermissions.length > 0 && (
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {u.customPermissions.map((cp, idx) => (
                                <span key={idx} className="px-1.5 py-0.2 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded text-[9px] font-mono">
                                  +{cp}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="p-4 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              u.isActive
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {u.isActive ? (language === 'lo' ? 'ເປີດໃຊ້' : 'Active') : (language === 'lo' ? 'ປິດໃຊ້' : 'Suspended')}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Test / Simulate User */}
                            <button
                              type="button"
                              onClick={() => handleSimulateUser(u)}
                              className="px-2.5 py-1.5 rounded-xl border border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                              title={language === 'lo' ? 'ທົດສອບສິດໃນມຸມມອງຂອງຜູ້ໃຊ້ນີ້' : 'Simulate / Login as this user'}
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">{language === 'lo' ? 'ທົດສອບ' : 'Simulate'}</span>
                            </button>

                            {/* Configure User Permissions */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditUser(u)}
                              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer transition-colors"
                              title={language === 'lo' ? 'ກຳນົດສິດຜູ້ໃຊ້' : 'Configure Permissions'}
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            {/* Delete User (disabled for self) */}
                            {!isSelf && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(language === 'lo' ? `ທ່ານຕ້ອງການລຶບບັນຊີ '${u.fullName}' ແທ້ບໍ່?` : `Delete account '${u.fullName}'?`)) {
                                    deleteUserAccount(u.id);
                                  }
                                }}
                                className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500 cursor-pointer transition-colors"
                                title="Delete User Account"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. MODAL: EDIT / CONFIGURE USER PERMISSIONS */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 my-auto">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {language === 'lo' ? 'ກຳນົດສິດຜູ້ໃຊ້ງານ (User Permissions)' : 'Configure User Permissions'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {editingUser.fullName} (@{editingUser.username})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUserEdit} className="p-5 space-y-4 text-xs">
              {/* Role Picker */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  {language === 'lo' ? 'ມອບໝາຍບົດບາດຫຼັກ (Assigned Role) *' : 'Assigned Role *'}
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as Role)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="SUPER_ADMIN">SUPER ADMIN - ຜູ້ດູແລລະບົບສູງສຸດ</option>
                  <option value="HR_ADMIN">HR ADMIN - ຜູ້ບໍລິຫານບຸກຄະລາກອນ</option>
                  <option value="EXECUTIVE">EXECUTIVE - ຄະນະຜູ້ບໍລິຫານ</option>
                  <option value="DEPT_HEAD">DEPT HEAD - ຫົວໜ້າພະແນກ</option>
                  <option value="EMPLOYEE">EMPLOYEE - ພະນັກງານທົ່ວໄປ</option>
                </select>
                <p className="text-[11px] text-slate-400">
                  {language === 'lo' ? ROLE_METADATA[editRole].descLao : ROLE_METADATA[editRole].descEn}
                </p>
              </div>

              {/* Department Data Scope */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  {language === 'lo' ? 'ຂອບເຂດຂໍ້ມູນພະແນກ (Department Scope)' : 'Department Scope'}
                </label>
                <select
                  value={editDepartmentId}
                  onChange={(e) => setEditDepartmentId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-hidden"
                >
                  <option value="">{language === 'lo' ? 'ທຸກພະແນກ (All Departments / Global Access)' : 'All Departments / Global Access'}</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {language === 'lo' ? d.nameLao : d.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Permission Overrides */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                  {language === 'lo' ? 'ສິດທິພິເສດເພີ່ມເຕີມ (Special Privilege Overrides)' : 'Special Privilege Overrides'}
                </label>

                <div className="space-y-2">
                  {[
                    { key: 'CAN_APPROVE_EXPENSES', labelLao: 'ອະນຸມັດການເບີກຈ່າຍເງິນ & ຄ່າໃຊ້ຈ່າຍ', labelEn: 'Can Approve Expense & Budget Claims' },
                    { key: 'CAN_VIEW_PAYROLL', labelLao: 'ສິດເບິ່ງຂໍ້ມູນເງິນເດືອນລັບຂອງອົງກອນ', labelEn: 'Can View Confidential Payroll Records' },
                    { key: 'CAN_EXPORT_REPORTS', labelLao: 'ສົ່ງອອກລາຍງານລະດັບບໍລິຫານເປັນ Excel/PDF', labelEn: 'Can Export Master Reports to Excel/PDF' },
                    { key: 'CAN_VIEW_AUDIT_LOGS', labelLao: 'ກວດສອບບັນທຶກຄວາມປອດໄພລະບົບ (Audit Trail)', labelEn: 'Can Inspect Security Audit Trails' },
                  ].map((perm) => {
                    const checked = editCustomPerms.includes(perm.key);
                    return (
                      <label
                        key={perm.key}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 cursor-pointer hover:bg-slate-100"
                      >
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {language === 'lo' ? perm.labelLao : perm.labelEn}
                        </span>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggleCustomPerm(perm.key)}
                          className="w-4 h-4 rounded text-blue-600"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Status Toggle */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200">
                    {language === 'lo' ? 'ສະຖານະບັນຊີ (Account Active Status)' : 'Account Active Status'}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {language === 'lo' ? 'ຖ້າປິດ, ຜູ້ໃຊ້ນີ້ຈະບໍ່ສາມາດເຂົ້າສູ່ລະບົບໄດ້' : 'If disabled, user cannot log in'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditIsActive(!editIsActive)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    editIsActive ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      editIsActive ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
                >
                  {language === 'lo' ? 'ຍົກເລີກ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer shadow-md shadow-blue-500/20"
                >
                  {language === 'lo' ? 'ບັນທຶກການກຳນົດສິດ' : 'Save Permissions'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL: CREATE NEW USER ACCOUNT */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 my-auto">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {language === 'lo' ? 'ເພີ່ມບັນຊີຜູ້ໃຊ້ & ກຳນົດສິດ' : 'Provision User & Grant Permissions'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {language === 'lo' ? 'ເຊື່ອມຕໍ່ກັບບຸກຄະລາກອນ LHSE ແລະ ມອບໝາຍສິດທິ' : 'Link employee to system login account and set role'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUserSubmit} className="p-5 space-y-4 text-xs">
              {/* Select Employee */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  {language === 'lo' ? 'ເລືອກພະນັກງານ (Select Employee) *' : 'Select Employee *'}
                </label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => {
                    const empId = e.target.value;
                    setSelectedEmployeeId(empId);
                    const emp = employees.find((emp) => emp.id === empId);
                    if (emp) {
                      setNewUsername(emp.email?.split('@')[0] || `${emp.firstNameEn.toLowerCase()}.${emp.lastNameEn.toLowerCase()}`);
                      setNewDepartmentId(emp.departmentId || '');
                    }
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium outline-hidden focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">{language === 'lo' ? '-- ເລືອກພະນັກງານ LHSE --' : '-- Choose Staff Member --'}</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.employeeCode} - {language === 'lo' ? `${emp.firstNameLao} ${emp.lastNameLao}` : `${emp.firstNameEn} ${emp.lastNameEn}`} ({emp.departmentId})
                    </option>
                  ))}
                </select>
              </div>

              {/* Username */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  {language === 'lo' ? 'ຊື່ຜູ້ໃຊ້ງານລະບົບ (Username) *' : 'Username *'}
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g. somphone.k"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xs outline-hidden focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Role */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  {language === 'lo' ? 'ບົດບາດລະບົບ (System Role) *' : 'System Role *'}
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as Role)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="EMPLOYEE">EMPLOYEE - ພະນັກງານທົ່ວໄປ</option>
                  <option value="DEPT_HEAD">DEPT HEAD - ຫົວໜ້າພະແນກ</option>
                  <option value="HR_ADMIN">HR ADMIN - ຜູ້ບໍລິຫານບຸກຄະລາກອນ</option>
                  <option value="EXECUTIVE">EXECUTIVE - ຄະນະຜູ້ບໍລິຫານ</option>
                  <option value="SUPER_ADMIN">SUPER ADMIN - ຜູ້ດູແລລະບົບສູງສຸດ</option>
                </select>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
                >
                  {language === 'lo' ? 'ຍົກເລີກ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer shadow-md shadow-indigo-500/20"
                >
                  {language === 'lo' ? 'ສ້າງບັນຊີ & ມອບໝາຍສິດ' : 'Provision User Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
