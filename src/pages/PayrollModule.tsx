import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { DataTable, Column } from '../components/common/DataTable.tsx';
import { Modal } from '../components/common/Modal.tsx';
import { PayrollPeriod, Payslip } from '../types/index.ts';
import { alerts } from '../utils/alerts.ts';
import { PayrollExportDropdown } from '../components/payroll/PayrollExportDropdown.tsx';
import { PayrollPdfReportModal } from '../components/payroll/PayrollPdfReportModal.tsx';
import * as XLSX from 'xlsx';
import {
  Banknote,
  Calendar,
  FileText,
  Calculator,
  Lock,
  CheckCircle,
  Eye,
  Printer,
  ShieldAlert,
  Percent,
  TrendingDown,
  Download,
  CreditCard,
  FileSpreadsheet,
  Sparkles,
  Building2,
  Filter,
  Search,
  RotateCcw,
} from 'lucide-react';
import { InteractivePaySlipGenerator } from '../components/payroll/InteractivePaySlipGenerator.tsx';
import { BiometricSecurityGate } from '../components/common/BiometricSecurityGate.tsx';

export const PayrollModule: React.FC = () => {
  const {
    t,
    language,
    employees,
    departments,
    payrollPeriods,
    payslips,
    activeSubModule,
    setActiveSubModule,
    runMonthlyPayroll,
    currentUser,
  } = useApp();

  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
  const [payslipModalOpen, setPayslipModalOpen] = useState(false);
  const [runModalOpen, setRunModalOpen] = useState(false);
  const [periodCode, setPeriodCode] = useState('2026-11 (ພະຈິກ 2026)');
  const [periodStart, setPeriodStart] = useState('2026-11-01');
  const [periodEnd, setPeriodEnd] = useState('2026-11-30');
  const [selectedInteractiveEmpId, setSelectedInteractiveEmpId] = useState<string | undefined>(undefined);
  const [selectedInteractivePeriodId, setSelectedInteractivePeriodId] = useState<string | undefined>(undefined);

  // Filter States for Currently Filtered View & Print-Ready Export
  const [selectedPeriodFilter, setSelectedPeriodFilter] = useState<string>('ALL');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ALL');
  const [payrollSearch, setPayrollSearch] = useState<string>('');
  const [pdfReportModalOpen, setPdfReportModalOpen] = useState<boolean>(false);

  const isHRorFinance = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'HR_ADMIN' || currentUser.role === 'DEPT_HEAD';

  // Filter payslips if regular employee
  const visiblePayslips = isHRorFinance
    ? payslips
    : payslips.filter((p) => p.employeeId === (currentUser.employeeId || 'emp-005'));

  // Distinct Periods available in payslips or payrollPeriods
  const distinctPeriodCodes = useMemo(() => {
    const set = new Set<string>();
    visiblePayslips.forEach((p) => {
      if (p.payrollPeriodId) set.add(p.payrollPeriodId);
    });
    payrollPeriods.forEach((pp) => {
      if (pp.code) set.add(pp.code);
    });
    return Array.from(set);
  }, [visiblePayslips, payrollPeriods]);

  // Currently Filtered Payslips View
  const filteredPayslips = useMemo(() => {
    return visiblePayslips.filter((p) => {
      // Period Filter
      if (selectedPeriodFilter !== 'ALL' && p.payrollPeriodId !== selectedPeriodFilter) {
        return false;
      }

      const emp = employees.find((e) => e.id === p.employeeId);

      // Department Filter
      if (selectedDeptFilter !== 'ALL' && emp?.departmentId !== selectedDeptFilter) {
        return false;
      }

      // Search Filter
      if (payrollSearch.trim()) {
        const term = payrollSearch.toLowerCase();
        const code = (emp?.employeeCode || p.employeeId).toLowerCase();
        const nameEn = emp ? `${emp.firstNameEn} ${emp.lastNameEn}`.toLowerCase() : '';
        const nameLao = emp ? `${emp.firstNameLao} ${emp.lastNameLao}` : '';
        if (!code.includes(term) && !nameEn.includes(term) && !nameLao.includes(term)) {
          return false;
        }
      }

      return true;
    });
  }, [visiblePayslips, selectedPeriodFilter, selectedDeptFilter, payrollSearch, employees]);

  const activeDeptObj = departments.find((d) => d.id === selectedDeptFilter);
  const activeDeptDisplayName = activeDeptObj
    ? language === 'lo' && activeDeptObj.nameLao
      ? activeDeptObj.nameLao
      : activeDeptObj.nameEn
    : language === 'lo'
    ? 'ທຸກພະແນກ (All Departments)'
    : 'All Departments';

  const handleRunPayroll = () => {
    runMonthlyPayroll(periodCode, periodStart, periodEnd);
    setRunModalOpen(false);
  };

  const handleExportBCEL = () => {
    const exportRows = visiblePayslips.map((p, idx) => {
      const emp = employees.find((e) => e.id === p.employeeId);
      return {
        'No.': idx + 1,
        'Employee Code': emp?.employeeCode || p.employeeId,
        'Beneficiary Name (Lao)': emp ? `${emp.firstNameLao} ${emp.lastNameLao}` : '',
        'Beneficiary Name (En)': emp ? `${emp.firstNameEn} ${emp.lastNameEn}` : '',
        'Bank Name': emp?.bankName || 'BCEL',
        'Account Number': emp?.bankAccountNumber || '010-12-00-11223344-001',
        'Net Salary (LAK)': p.netPay,
        'Payroll Period': p.payrollPeriodId,
        'Corporate Remarks': `LHSE Salary Transfer - ${p.payrollPeriodId}`,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'BCEL Payroll Transfer');
    XLSX.writeFile(workbook, `LHSE_BCEL_Payroll_Transfer_${new Date().toISOString().split('T')[0]}.xlsx`);
    alerts.success(language === 'lo' ? 'ສົ່ງອອກໄຟລ໌ໂອນເງິນເດືອນ BCEL ສຳເລັດ' : 'BCEL Corporate Payroll Exported');
  };

  const handleExportNSSF = () => {
    const exportRows = visiblePayslips.map((p, idx) => {
      const emp = employees.find((e) => e.id === p.employeeId);
      const nssfBase = Math.min(p.grossSalary, 4500000);
      return {
        'No.': idx + 1,
        'Social Security ID': emp?.nationalId || '',
        'Employee Code': emp?.employeeCode || p.employeeId,
        'Full Name (Lao)': emp ? `${emp.firstNameLao} ${emp.lastNameLao}` : '',
        'Gross Salary (LAK)': p.grossSalary,
        'NSSF Assessment Base (Cap 4.5M)': nssfBase,
        'Employee Contribution 5.5%': p.socialSecurityEmployee,
        'Employer Contribution 6.0%': p.socialSecurityEmployer,
        'Total Remittance 11.5%': p.socialSecurityEmployee + p.socialSecurityEmployer,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Lao NSSF Schedule');
    XLSX.writeFile(workbook, `LHSE_Lao_NSSF_Schedule_${new Date().toISOString().split('T')[0]}.xlsx`);
    alerts.success(language === 'lo' ? 'ສົ່ງອອກຕາຕະລາງປະກັນສັງຄົມ (ອປສ) ສຳເລັດ' : 'Lao NSSF Schedule Exported');
  };

  const payslipColumns: Column<Payslip>[] = [
    {
      key: 'employeeId',
      header: t('employee'),
      render: (p) => {
        const emp = employees.find((e) => e.id === p.employeeId);
        return (
          <div>
            <div className="font-bold text-slate-900 dark:text-slate-100">
              {emp ? (language === 'lo' ? `${emp.firstNameLao} ${emp.lastNameLao}` : `${emp.firstNameEn} ${emp.lastNameEn}`) : p.employeeId}
            </div>
            <div className="text-[11px] text-slate-400 font-mono">{emp?.employeeCode}</div>
          </div>
        );
      },
    },
    {
      key: 'baseSalary',
      header: t('baseSalary'),
      render: (p) => <span className="font-mono text-slate-700 dark:text-slate-300">{p.baseSalary.toLocaleString()} LAK</span>,
    },
    {
      key: 'grossSalary',
      header: t('grossSalary'),
      render: (p) => <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">{p.grossSalary.toLocaleString()} LAK</span>,
    },
    {
      key: 'socialSecurityEmployee',
      header: 'LSSO (5.5%)',
      render: (p) => <span className="font-mono text-amber-600 dark:text-amber-400">-{p.socialSecurityEmployee.toLocaleString()} LAK</span>,
    },
    {
      key: 'personalIncomeTax',
      header: 'Tax (PIT)',
      render: (p) => <span className="font-mono text-rose-600 dark:text-rose-400">-{p.personalIncomeTax.toLocaleString()} LAK</span>,
    },
    {
      key: 'netPay',
      header: t('netPay'),
      render: (p) => (
        <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
          {p.netPay.toLocaleString()} LAK
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('actions'),
      sortable: false,
      render: (p) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              setSelectedPayslip(p);
              setPayslipModalOpen(true);
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 text-xs font-bold transition-colors"
            title={language === 'lo' ? 'ເບິ່ງໃບແຈ້ງເງິນເດືອນ' : 'View Official Payslip'}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{t('view')}</span>
          </button>
          <button
            onClick={() => {
              setSelectedInteractiveEmpId(p.employeeId);
              setSelectedInteractivePeriodId(p.payrollPeriodId);
              setActiveSubModule('interactive-payslip');
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs font-bold transition-colors"
            title={language === 'lo' ? 'ເຈາະເລິກລາຍການຫັກ & ໂບນັດ' : 'Interactive Drill-down'}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{language === 'lo' ? 'ເຈາະເລິກ' : 'Drill-Down'}</span>
          </button>
        </div>
      ),
    },
  ];

  const periodColumns: Column<PayrollPeriod>[] = [
    { key: 'code', header: language === 'lo' ? 'ຮອບຈ່າຍເງິນເດືອນ' : 'Period Code' },
    {
      key: 'dates',
      header: language === 'lo' ? 'ໄລຍະເວລາ' : 'Date Range',
      render: (pp) => <span className="font-mono text-xs">{pp.startDate} → {pp.endDate}</span>,
    },
    {
      key: 'employeeCount',
      header: language === 'lo' ? 'ພະນັກງານ' : 'Employees',
      render: (pp) => <span className="font-bold">{pp.employeeCount} persons</span>,
    },
    {
      key: 'totalNetPay',
      header: language === 'lo' ? 'ຍອດຈ່າຍສຸດທິ (LAK)' : 'Total Net Pay',
      render: (pp) => (
        <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
          {pp.totalNetPay.toLocaleString()} LAK
        </span>
      ),
    },
    {
      key: 'status',
      header: t('status'),
      render: (pp) => (
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            pp.status === 'LOCKED'
              ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
          }`}
        >
          {pp.status}
        </span>
      ),
    },
  ];

  return (
    <BiometricSecurityGate
      moduleName="Payroll & Salary Administration"
      moduleNameLo="ການຄຸ້ມຄອງເງິນເດືອນ & ລາຍຮັບບໍລິຫານ"
      subTitle="FIDO2 WebAuthn biometric security verification guarding sensitive employee salaries, tax deductions, and bank payouts"
      subTitleLo="ລະບົບຮັກສາຄວາມປອດໄພຊີວະມິຕິຂັ້ນສູງ (WebAuthn / Passkey) ສຳລັບປົກປ້ອງຂໍ້ມູນເງິນເດືອນ, ອາກອນ ແລະ ການໂອນເງິນ"
    >
      <div className="space-y-6">
      {/* Submodule Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveSubModule('payslips')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubModule === 'payslips'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{t('payslips')}</span>
          </button>

          <button
            onClick={() => setActiveSubModule('interactive-payslip')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubModule === 'interactive-payslip'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{language === 'lo' ? 'ສ້າງໃບເງິນເດືອນອັດສະລິຍະ (Interactive)' : 'Interactive Pay Slip'}</span>
          </button>

          {isHRorFinance && (
            <>
              <button
                onClick={() => setActiveSubModule('periods')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeSubModule === 'periods'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span>{t('payrollPeriods')}</span>
              </button>
              <button
                onClick={() => setActiveSubModule('tax-rules')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeSubModule === 'tax-rules'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                <Percent className="w-4 h-4" />
                <span>{t('taxRules')} & LSSO</span>
              </button>
            </>
          )}
        </div>

        {activeSubModule === 'payslips' && (
          <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
            {/* Download PDF Report Button (Header) */}
            <button
              onClick={() => setPdfReportModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs hover:scale-105 active:scale-95"
              title={language === 'lo' ? 'ດາວໂຫຼດລາຍງານເງິນເດືອນ PDF ພ້ອມພິມ' : 'Download Stylized Print-Friendly PDF Report'}
            >
              <FileText className="w-3.5 h-3.5 text-rose-200" />
              <span>{language === 'lo' ? 'ດາວໂຫຼດລາຍງານ PDF' : 'Download PDF Report'}</span>
              <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[9px] font-mono uppercase tracking-wider font-bold">
                PDF
              </span>
            </button>

            <button
              onClick={() => setActiveSubModule('interactive-payslip')}
              className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              title={language === 'lo' ? 'ເປີດລະບົບສ້າງໃບເງິນເດືອນອັດສະລິຍະ' : 'Open Interactive Pay Slip Generator'}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{language === 'lo' ? 'ສ້າງໃບເງິນເດືອນອັດສະລິຍະ' : 'Interactive Generator'}</span>
            </button>
            <PayrollExportDropdown payslips={filteredPayslips} />
            {isHRorFinance && (
              <button
                onClick={() => setRunModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>{t('generatePayroll')}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {activeSubModule === 'payslips' && (
        <div className="space-y-4">
          {/* Currently Filtered View Toolbar */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Period Filter */}
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <select
                  aria-label={language === 'lo' ? 'ເລືອກງວດເງິນເດືອນ' : 'Filter by period'}
                  value={selectedPeriodFilter}
                  onChange={(e) => setSelectedPeriodFilter(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-hidden cursor-pointer"
                >
                  <option value="ALL">
                    {language === 'lo' ? '📅 ທຸກງວດເງິນເດືອນ (All Periods)' : '📅 All Periods'}
                  </option>
                  {distinctPeriodCodes.map((code) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                </select>
              </div>

              {/* Department Filter */}
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <select
                  aria-label={language === 'lo' ? 'ເລືອກພະແນກ' : 'Filter by department'}
                  value={selectedDeptFilter}
                  onChange={(e) => setSelectedDeptFilter(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-hidden cursor-pointer"
                >
                  <option value="ALL">
                    {language === 'lo' ? '🏢 ທຸກພະແນກ (All Departments)' : '🏢 All Departments'}
                  </option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {language === 'lo' && dept.nameLao ? dept.nameLao : dept.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              {/* Real-time Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder={language === 'lo' ? 'ຄົ້ນຫາຊື່ ຫຼື ລະຫັດ...' : 'Filter employee name or code...'}
                  value={payrollSearch}
                  onChange={(e) => setPayrollSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500 w-48 sm:w-56"
                />
              </div>

              {/* Reset Filters button if any active */}
              {(selectedPeriodFilter !== 'ALL' || selectedDeptFilter !== 'ALL' || payrollSearch) && (
                <button
                  onClick={() => {
                    setSelectedPeriodFilter('ALL');
                    setSelectedDeptFilter('ALL');
                    setPayrollSearch('');
                  }}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Clear filters"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{language === 'lo' ? 'ລ້າງຕົວກັ່ນຕອງ' : 'Reset'}</span>
                </button>
              )}
            </div>

            {/* Quick Active Filter Pill Summary & Direct PDF trigger */}
            <div className="flex items-center gap-2 text-xs">
              <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800">
                {filteredPayslips.length} {language === 'lo' ? 'ລາຍການທີ່ເລືອກ' : 'Filtered Records'}
              </span>
              <button
                onClick={() => setPdfReportModalOpen(true)}
                className="px-3 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 font-bold border border-rose-200 dark:border-rose-800 flex items-center gap-1.5 transition-colors"
              >
                <Printer className="w-3.5 h-3.5 text-rose-500" />
                <span>{language === 'lo' ? 'ພິມ / ສົ່ງອອກ PDF' : 'Print / Export PDF'}</span>
              </button>
            </div>
          </div>

          <DataTable
            data={filteredPayslips}
            columns={payslipColumns}
            filename="LHSE_Payslips_Report"
            actions={
              isHRorFinance && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setPdfReportModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                    title="Open Print-Friendly PDF Report"
                  >
                    <FileText className="w-3.5 h-3.5 text-rose-200" />
                    <span>{language === 'lo' ? 'ລາຍງານ PDF' : 'PDF Report'}</span>
                  </button>
                  <PayrollExportDropdown payslips={filteredPayslips} />
                  <button
                    onClick={handleExportBCEL}
                    className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                    title="Export BCEL Corporate OnePay File"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>{language === 'lo' ? 'ສົ່ງອອກ BCEL' : 'Export BCEL'}</span>
                  </button>
                  <button
                    onClick={handleExportNSSF}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                    title="Export Lao Social Security Schedule"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>{language === 'lo' ? 'ຕາຕະລາງ ອປສ' : 'LSSO Schedule'}</span>
                  </button>
                  <button
                    onClick={() => setRunModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    <span>{t('generatePayroll')}</span>
                  </button>
                </div>
              )
            }
          />
        </div>
      )}

      {activeSubModule === 'interactive-payslip' && (
        <InteractivePaySlipGenerator
          initialEmployeeId={selectedInteractiveEmpId}
          initialPeriodId={selectedInteractivePeriodId}
        />
      )}

      {activeSubModule === 'periods' && (
        <DataTable
          data={payrollPeriods}
          columns={periodColumns}
          filename="LHSE_Payroll_Periods"
          actions={
            <button
              onClick={() => setRunModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>{t('generatePayroll')}</span>
            </button>
          }
        />
      )}

      {activeSubModule === 'tax-rules' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Lao Progressive Income Tax Brackets */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Percent className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                {language === 'lo' ? 'ຂັ້ນອັດຕາພາສີລາຍໄດ້ບຸກຄົນ (Lao Personal Income Tax Law)' : 'Lao PIT Progressive Brackets'}
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              {language === 'lo' ? 'ກົດໝາຍວ່າດ້ວຍສ່ວຍສາອາກອນ ແຫ່ງ ສປປ ລາວ' : 'Statutory progressive tax brackets on monthly taxable base'}
            </p>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-mono">
              <div className="py-2 flex justify-between"><span>0 - 1,300,000 LAK</span><span className="font-bold text-emerald-600">0% (ຍົກເວັ້ນ)</span></div>
              <div className="py-2 flex justify-between"><span>1,300,001 - 5,000,000 LAK</span><span className="font-bold text-blue-600">5%</span></div>
              <div className="py-2 flex justify-between"><span>5,000,001 - 15,000,000 LAK</span><span className="font-bold text-blue-600">10%</span></div>
              <div className="py-2 flex justify-between"><span>15,000,001 - 25,000,000 LAK</span><span className="font-bold text-amber-600">15%</span></div>
              <div className="py-2 flex justify-between"><span>25,000,001 - 65,000,000 LAK</span><span className="font-bold text-orange-600">20%</span></div>
              <div className="py-2 flex justify-between"><span>&gt; 65,000,000 LAK</span><span className="font-bold text-rose-600">25%</span></div>
            </div>
          </div>

          {/* Lao Social Security (LSSO) */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                {language === 'lo' ? 'ກອງທຶນປະກັນສັງຄົມ ແຫ່ງຊາດ (LSSO)' : 'National Social Security Rules (LSSO)'}
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              {language === 'lo' ? 'ເພດານເງິນເດືອນຄິດໄລ່ສູງສຸດ: 4,500,000 LAK' : 'Statutory salary ceiling base: 4,500,000 LAK'}
            </p>
            <div className="space-y-3 pt-2 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">{t('ssEmployee')}</span>
                  <span className="text-[11px] text-slate-400">Max 247,500 LAK/month</span>
                </div>
                <span className="font-black text-blue-600 text-sm">5.5%</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">{t('ssEmployer')}</span>
                  <span className="text-[11px] text-slate-400">Max 270,000 LAK/month</span>
                </div>
                <span className="font-black text-emerald-600 text-sm">6.0%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Official LHSE Payslip Modal (Print-Ready) */}
      <Modal
        isOpen={payslipModalOpen}
        onClose={() => setPayslipModalOpen(false)}
        title={language === 'lo' ? 'ໃບແຈ້ງເງິນເດືອນພະນັກງານ (Official Payslip)' : 'Employee Monthly Payslip'}
        subtitle="Lao Holding State Enterprise (LHSE)"
        maxWidth="2xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] text-slate-400 font-mono">CONFIDENTIAL • LHSE HR DEPT</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPayslipModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400"
              >
                {t('close')}
              </button>
              <button
                onClick={() => alerts.success(language === 'lo' ? 'ພິມໃບແຈ້ງເງິນເດືອນສຳເລັດ' : 'Payslip Sent to Printer')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{t('print')}</span>
              </button>
            </div>
          </div>
        }
      >
        {selectedPayslip && (
          <div className="space-y-4 text-xs font-sans">
            {/* Header Stamp */}
            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex items-center justify-between">
              <div>
                <h4 className="font-black text-sm text-blue-900 dark:text-blue-100">
                  {language === 'lo' ? 'ລັດວິສາຫະກິດ ຖືຮຸ້ນລາວ (LHSE)' : 'Lao Holding State Enterprise (LHSE)'}
                </h4>
                <p className="text-[11px] text-blue-700 dark:text-blue-300">
                  {language === 'lo' ? 'ງວດຈ່າຍເງິນເດືອນ:' : 'Payroll Period:'} {selectedPayslip.payrollPeriodId}
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10px]">
                {selectedPayslip.paymentStatus}
              </span>
            </div>

            {/* Employee info */}
            {(() => {
              const emp = employees.find((e) => e.id === selectedPayslip.employeeId);
              return (
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <div>
                    <span className="text-slate-400 block text-[10px]">{t('employee')}:</span>
                    <strong className="text-slate-900 dark:text-slate-100">
                      {emp ? `${emp.firstNameLao} ${emp.lastNameLao}` : selectedPayslip.employeeId} ({emp?.employeeCode})
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">{language === 'lo' ? 'ບັນຊີຮັບເງິນ (BCEL):' : 'Bank Account:'}</span>
                    <strong className="font-mono text-slate-800 dark:text-slate-200">
                      {selectedPayslip.bankAccountMasked || '••••-••••-001'}
                    </strong>
                  </div>
                </div>
              );
            })()}

            {/* Earnings Breakdown */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800 font-bold text-[11px] text-slate-700 dark:text-slate-300">
                {language === 'lo' ? '1. ລາຍຮັບ (Earnings) - ບໍ່ມີໂອທີ (No Overtime)' : '1. Earnings (Strictly No Overtime)'}
              </div>
              <div className="p-4 space-y-2">
                <div className="flex justify-between">
                  <span>{t('baseSalary')}</span>
                  <span className="font-mono font-semibold">{selectedPayslip.baseSalary.toLocaleString()} LAK</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('allowances')} (ຄ່າຄອງຊີບ & ຄ່າພາຫະນະ)</span>
                  <span className="font-mono font-semibold">{selectedPayslip.allowances.toLocaleString()} LAK</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 dark:border-slate-800 pt-2 font-bold">
                  <span>{t('grossSalary')}</span>
                  <span className="font-mono text-blue-600">{selectedPayslip.grossSalary.toLocaleString()} LAK</span>
                </div>
              </div>
            </div>

            {/* Deductions Breakdown */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800 font-bold text-[11px] text-slate-700 dark:text-slate-300">
                {language === 'lo' ? '2. ລາຍການຫັກຕາມກົດໝາຍ (Statutory Deductions)' : '2. Statutory Deductions'}
              </div>
              <div className="p-4 space-y-2">
                <div className="flex justify-between text-amber-700 dark:text-amber-400">
                  <span>{t('ssEmployee')}</span>
                  <span className="font-mono">-{selectedPayslip.socialSecurityEmployee.toLocaleString()} LAK</span>
                </div>
                <div className="flex justify-between text-rose-600 dark:text-rose-400">
                  <span>{t('taxAmount')}</span>
                  <span className="font-mono">-{selectedPayslip.personalIncomeTax.toLocaleString()} LAK</span>
                </div>
              </div>
            </div>

            {/* Net Pay Grand Total */}
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300 tracking-wider">
                  {t('netPay')}
                </span>
                <p className="text-xl font-black text-emerald-700 dark:text-emerald-400 font-mono">
                  {selectedPayslip.netPay.toLocaleString()} LAK
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
          </div>
        )}
      </Modal>

      {/* Generate Payroll Run Modal */}
      <Modal
        isOpen={runModalOpen}
        onClose={() => setRunModalOpen(false)}
        title={t('generatePayroll')}
        subtitle="Execute monthly automated tax & social security calculation"
        maxWidth="md"
        footer={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setRunModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleRunPayroll}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-xs"
            >
              {t('confirm')}
            </button>
          </div>
        }
      >
        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
              {language === 'lo' ? 'ຊື່ງວດເງິນເດືອນ' : 'Period Code / Name'}
            </label>
            <input
              type="text"
              value={periodCode}
              onChange={(e) => setPeriodCode(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Start Date</label>
              <input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">End Date</label>
              <input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-xs">
            {language === 'lo'
              ? 'ລະບົບຈະຄິດໄລ່ເງິນເດືອນໃຫ້ແກ່ພະນັກງານທັງໝົດ 7 ທ່ານ ອັດຕະໂນມັດ ໂດຍບໍ່ມີໂອທີ.'
              : 'Will automatically compute net pay, LSSO (5.5%), and Lao PIT for all active employees without overtime.'}
          </div>
        </div>
      </Modal>

      {/* Official Payroll PDF Export & Print-Friendly Modal */}
      <PayrollPdfReportModal
        isOpen={pdfReportModalOpen}
        onClose={() => setPdfReportModalOpen(false)}
        filteredPayslips={filteredPayslips}
        selectedPeriodCode={selectedPeriodFilter !== 'ALL' ? selectedPeriodFilter : 'All Active Periods'}
        selectedDeptName={activeDeptDisplayName}
        searchTerm={payrollSearch}
      />
      </div>
    </BiometricSecurityGate>
  );
};
