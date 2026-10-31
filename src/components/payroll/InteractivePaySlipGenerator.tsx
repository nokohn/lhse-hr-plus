import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { Employee, Payslip } from '../../types/index.ts';
import {
  calculateLaoTax,
  calculateLaoSocialSecurity,
} from '../../services/mockData.ts';
import { alerts } from '../../utils/alerts.ts';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  Calculator,
  FileText,
  PieChart as PieIcon,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Layers,
  Printer,
  Download,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  RotateCcw,
  Save,
  ShieldCheck,
  Building2,
  User,
  CreditCard,
  Percent,
  Calendar,
  AlertCircle,
  HelpCircle,
  Banknote,
  Coins,
  ArrowUpRight,
  Check,
} from 'lucide-react';

interface BonusItem {
  id: string;
  nameEn: string;
  nameLao: string;
  amount: number;
  category: 'PERFORMANCE' | 'PROJECT' | 'ALLOWANCE' | 'SPECIAL';
  isTaxable: boolean;
  notesEn: string;
  notesLao: string;
  isActive: boolean;
}

interface DeductionItem {
  id: string;
  nameEn: string;
  nameLao: string;
  amount: number;
  category: 'STATUTORY' | 'WELFARE' | 'LOAN' | 'PENALTY' | 'OTHER';
  notesEn: string;
  notesLao: string;
  isActive: boolean;
}

interface InteractivePaySlipGeneratorProps {
  initialEmployeeId?: string;
  initialPeriodId?: string;
}

export const InteractivePaySlipGenerator: React.FC<InteractivePaySlipGeneratorProps> = ({
  initialEmployeeId,
  initialPeriodId,
}) => {
  const {
    language,
    employees,
    departments,
    positions,
    payrollPeriods,
    payslips,
    setPayslips,
    currentUser,
    addAuditLog,
  } = useApp();

  const isHRorFinance =
    currentUser.role === 'SUPER_ADMIN' ||
    currentUser.role === 'HR_ADMIN' ||
    currentUser.role === 'DEPT_HEAD';

  // 1. Employee selection
  const defaultEmployeeId =
    initialEmployeeId ||
    (isHRorFinance ? employees[0]?.id || 'emp-001' : currentUser.employeeId || 'emp-001');

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(defaultEmployeeId);
  const selectedEmployee =
    employees.find((e) => e.id === selectedEmployeeId) || employees[0];

  // 2. Period selection
  const defaultPeriod =
    initialPeriodId || payrollPeriods[0]?.id || 'pp-2026-10';
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(defaultPeriod);
  const currentPeriodObj = payrollPeriods.find((p) => p.id === selectedPeriodId);

  // 3. Base salary (editable for what-if simulation)
  const [simulatedBaseSalary, setSimulatedBaseSalary] = useState<number>(
    selectedEmployee?.baseSalary || 25000000
  );

  // Update base salary when employee changes
  React.useEffect(() => {
    if (selectedEmployee) {
      setSimulatedBaseSalary(selectedEmployee.baseSalary);
    }
  }, [selectedEmployeeId]);

  // 4. Configurable Bonuses
  const [bonuses, setBonuses] = useState<BonusItem[]>([
    {
      id: 'b-transport',
      nameEn: 'Living & Transport Allowance',
      nameLao: 'ເງິນອຸດໜູນຄ່າຄອງຊີບ & ຄ່າພາຫະນະ',
      amount: 1500000,
      category: 'ALLOWANCE',
      isTaxable: true,
      notesEn: 'Standard LHSE corporate decree (Meal 750k + Transport 750k LAK)',
      notesLao: 'ອັດຕາມາດຕະຖານລັດວິສາຫະກິດ ຖືຮຸ້ນລາວ (ຄ່າອາຫານ 750,000 + ຄ່າເດີນທາງ 750,000 ກີບ)',
      isActive: true,
    },
    {
      id: 'b-kpi',
      nameEn: 'Quarterly KPI Performance Bonus',
      nameLao: 'ເງິນໂບນັດຜົນງານ KPI ປະຈຳໄຕມາດ',
      amount: 5000000,
      category: 'PERFORMANCE',
      isTaxable: true,
      notesEn: 'Grade A rating multiplier (Score 92/100, 1.2x monthly performance pool)',
      notesLao: 'ຜົນປະເມີນເກຣດ A (ຄະແນນ 92/100, ຕົວຄູນ 1.2x ຂອງກອງທຶນລາງວັນ)',
      isActive: true,
    },
    {
      id: 'b-project',
      nameEn: 'Energy Project Concession Incentive',
      nameLao: 'ເງິນອຸດໜູນພິເສດໂຄງການສຳປະທານພະລັງງານ',
      amount: 3000000,
      category: 'PROJECT',
      isTaxable: true,
      notesEn: 'Hydropower & Solar site technical supervision milestone bonus',
      notesLao: 'ຄ່າຕອບແທນວິຊາການຕິດຕາມໂຄງການເຂື່ອນໄຟຟ້າ ແລະ ພະລັງງານແສງຕາເວັນ',
      isActive: false,
    },
    {
      id: 'b-attendance',
      nameEn: 'Perfect Attendance Award',
      nameLao: 'ເງິນລາງວັນມາການຄົບ 100% ບໍ່ຂາດ/ບໍ່ຊ້າ',
      amount: 500000,
      category: 'SPECIAL',
      isTaxable: true,
      notesEn: 'Zero late check-ins and zero unexcused absences during the month',
      notesLao: 'ບໍ່ມີການມາຊ້າ ແລະ ບໍ່ມີການຂາດການຕະຫຼອດງວດເດືອນ',
      isActive: true,
    },
  ]);

  // 5. Configurable Deductions (in addition to statutory LSSO and PIT)
  const [deductions, setDeductions] = useState<DeductionItem[]>([
    {
      id: 'd-welfare',
      nameEn: 'Enterprise Welfare & Solidarity Fund',
      nameLao: 'ກອງທຶນຊ່ວຍເຫຼືອເຊິ່ງກັນ & ກັນ ຂອງລັດວິສາຫະກິດ',
      amount: 100000,
      category: 'WELFARE',
      notesEn: 'LHSE internal staff welfare & medical hardship mutual contribution',
      notesLao: 'ກອງທຶນສະຫວັດດີການ ແລະ ຊ່ວຍເຫຼືອສຸກເສີນພະນັກງານພາຍໃນ LHSE',
      isActive: true,
    },
    {
      id: 'd-loan',
      nameEn: 'Staff Emergency Loan Repayment',
      nameLao: 'ຫັກຊຳລະເງິນກູ້ຢືມສຸກເສີນພະນັກງານ (ງວດທີ 3/10)',
      amount: 1000000,
      category: 'LOAN',
      notesEn: 'Installment #3 of 10 for low-interest housing/medical advance',
      notesLao: 'ຫັກຊຳລະງວດ 3 ຈາກ 10 ງວດ ຕາມສັນຍາກູ້ຢືມສະຫວັດດີການດອກເບ້ຍຕໍ່າ',
      isActive: false,
    },
    {
      id: 'd-provident',
      nameEn: 'Voluntary Supplementary Retirement Fund',
      nameLao: 'ກອງທຶນສະສົມບຳນານພິເສດສະໝັກໃຈ',
      amount: 500000,
      category: 'OTHER',
      notesEn: 'Employee opt-in voluntary long-term pension savings',
      notesLao: 'ເງິນສະສົມບຳນານໄລຍະຍາວເພີ່ມເຕີມແບບສະໝັກໃຈ',
      isActive: false,
    },
  ]);

  // 6. Drill-down Accordion state (expanded sections)
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({
    baseSalary: false,
    bonuses: true,
    statutoryLSSO: true,
    statutoryPIT: true,
    otherDeductions: false,
  });

  const toggleRow = (key: string) => {
    setExpandedRows((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const expandAll = () => {
    setExpandedRows({
      baseSalary: true,
      bonuses: true,
      statutoryLSSO: true,
      statutoryPIT: true,
      otherDeductions: true,
    });
  };

  const collapseAll = () => {
    setExpandedRows({
      baseSalary: false,
      bonuses: false,
      statutoryLSSO: false,
      statutoryPIT: false,
      otherDeductions: false,
    });
  };

  // 7. Calculations
  const activeBonusesTotal = useMemo(() => {
    return bonuses
      .filter((b) => b.isActive)
      .reduce((sum, b) => sum + b.amount, 0);
  }, [bonuses]);

  const grossEarnings = simulatedBaseSalary + activeBonusesTotal;

  // Statutory Social Security
  const { employeeSS, employerSS } = useMemo(() => {
    return calculateLaoSocialSecurity(grossEarnings);
  }, [grossEarnings]);

  // Taxable Income = Gross Earnings - Employee Social Security
  const taxableIncome = Math.max(0, grossEarnings - employeeSS);

  // Progressive PIT breakdown by brackets
  const pitBreakdown = useMemo(() => {
    let remaining = taxableIncome;
    const tiers = [];

    // Tier 1: 0 - 1,300,000 @ 0%
    const t1Base = Math.min(remaining, 1300000);
    const t1Tax = 0;
    remaining = Math.max(0, remaining - 1300000);
    tiers.push({
      tier: 1,
      range: '0 - 1,300,000 LAK',
      rate: '0% (Exempt / ຍົກເວັ້ນ)',
      base: t1Base,
      tax: t1Tax,
    });

    // Tier 2: 1,300,001 - 5,000,000 @ 5% (span 3.7M)
    const t2Base = Math.min(remaining, 3700000);
    const t2Tax = Math.round(t2Base * 0.05);
    remaining = Math.max(0, remaining - t2Base);
    tiers.push({
      tier: 2,
      range: '1,300,001 - 5,000,000 LAK',
      rate: '5%',
      base: t2Base,
      tax: t2Tax,
    });

    // Tier 3: 5,000,001 - 15,000,000 @ 10% (span 10M)
    const t3Base = Math.min(remaining, 10000000);
    const t3Tax = Math.round(t3Base * 0.10);
    remaining = Math.max(0, remaining - t3Base);
    tiers.push({
      tier: 3,
      range: '5,000,001 - 15,000,000 LAK',
      rate: '10%',
      base: t3Base,
      tax: t3Tax,
    });

    // Tier 4: 15,000,001 - 25,000,000 @ 15% (span 10M)
    const t4Base = Math.min(remaining, 10000000);
    const t4Tax = Math.round(t4Base * 0.15);
    remaining = Math.max(0, remaining - t4Base);
    tiers.push({
      tier: 4,
      range: '15,000,001 - 25,000,000 LAK',
      rate: '15%',
      base: t4Base,
      tax: t4Tax,
    });

    // Tier 5: 25,000,001 - 65,000,000 @ 20% (span 40M)
    const t5Base = Math.min(remaining, 40000000);
    const t5Tax = Math.round(t5Base * 0.20);
    remaining = Math.max(0, remaining - t5Base);
    tiers.push({
      tier: 5,
      range: '25,000,001 - 65,000,000 LAK',
      rate: '20%',
      base: t5Base,
      tax: t5Tax,
    });

    // Tier 6: > 65,000,000 @ 25%
    const t6Base = remaining;
    const t6Tax = Math.round(t6Base * 0.25);
    tiers.push({
      tier: 6,
      range: '> 65,000,000 LAK',
      rate: '25%',
      base: t6Base,
      tax: t6Tax,
    });

    const totalTax = tiers.reduce((sum, t) => sum + t.tax, 0);
    const effectiveRate = taxableIncome > 0 ? ((totalTax / taxableIncome) * 100).toFixed(1) : '0';

    return {
      tiers,
      totalTax,
      effectiveRate,
    };
  }, [taxableIncome]);

  const personalIncomeTax = pitBreakdown.totalTax;

  // Other Voluntary Deductions
  const activeOtherDeductionsTotal = useMemo(() => {
    return deductions
      .filter((d) => d.isActive)
      .reduce((sum, d) => sum + d.amount, 0);
  }, [deductions]);

  // Grand Deductions Total
  const grandTotalDeductions = employeeSS + personalIncomeTax + activeOtherDeductionsTotal;

  // Net Take-Home Pay
  const netTakeHomePay = Math.max(0, grossEarnings - grandTotalDeductions);
  const netPayPercentage = grossEarnings > 0 ? Math.round((netTakeHomePay / grossEarnings) * 100) : 0;
  const deductionsPercentage = 100 - netPayPercentage;

  // 8. Recharts Data
  const waterfallChartData = useMemo(() => {
    return [
      {
        name: language === 'lo' ? 'ເງິນເດືອນຫຼັກ' : 'Base Salary',
        amount: simulatedBaseSalary,
        color: '#2563eb',
      },
      {
        name: language === 'lo' ? 'ໂບນັດ & ອຸດໜູນ' : 'Bonuses',
        amount: activeBonusesTotal,
        color: '#0d9488',
      },
      {
        name: language === 'lo' ? 'ລາຍຮັບລວມ' : 'Gross Pay',
        amount: grossEarnings,
        color: '#3b82f6',
      },
      {
        name: language === 'lo' ? 'ປະກັນສັງຄົມ' : 'LSSO (5.5%)',
        amount: employeeSS,
        color: '#f59e0b',
      },
      {
        name: language === 'lo' ? 'ອາກອນ (PIT)' : 'Tax (PIT)',
        amount: personalIncomeTax,
        color: '#e11d48',
      },
      {
        name: language === 'lo' ? 'ຫັກອື່ນໆ' : 'Other Deds',
        amount: activeOtherDeductionsTotal,
        color: '#8b5cf6',
      },
      {
        name: language === 'lo' ? 'ສຸດທິຕົວຈິງ' : 'Net Take-Home',
        amount: netTakeHomePay,
        color: '#10b981',
      },
    ];
  }, [
    simulatedBaseSalary,
    activeBonusesTotal,
    grossEarnings,
    employeeSS,
    personalIncomeTax,
    activeOtherDeductionsTotal,
    netTakeHomePay,
    language,
  ]);

  const pieChartData = useMemo(() => {
    return [
      {
        name: language === 'lo' ? 'ເງິນສຸດທິເຂົ້າບັນຊີ' : 'Net Take-Home Pay',
        value: netTakeHomePay,
        color: '#10b981',
      },
      {
        name: language === 'lo' ? 'ອາກອນລາຍໄດ້ບຸກຄົນ' : 'Personal Income Tax',
        value: personalIncomeTax,
        color: '#f43f5e',
      },
      {
        name: language === 'lo' ? 'ປະກັນສັງຄົມ (LSSO)' : 'Social Security',
        value: employeeSS,
        color: '#f59e0b',
      },
      {
        name: language === 'lo' ? 'ຫັກສະຫວັດດີການ & ອື່ນໆ' : 'Other Deductions',
        value: activeOtherDeductionsTotal,
        color: '#8b5cf6',
      },
    ].filter((item) => item.value > 0);
  }, [netTakeHomePay, personalIncomeTax, employeeSS, activeOtherDeductionsTotal, language]);

  // Modals for adding custom bonus / deduction
  const [newBonusModalOpen, setNewBonusModalOpen] = useState(false);
  const [newBonusNameEn, setNewBonusNameEn] = useState('');
  const [newBonusNameLao, setNewBonusNameLao] = useState('');
  const [newBonusAmount, setNewBonusAmount] = useState(1000000);

  const [newDedModalOpen, setNewDedModalOpen] = useState(false);
  const [newDedNameEn, setNewDedNameEn] = useState('');
  const [newDedNameLao, setNewDedNameLao] = useState('');
  const [newDedAmount, setNewDedAmount] = useState(250000);

  const handleAddCustomBonus = () => {
    if (!newBonusNameEn.trim() && !newBonusNameLao.trim()) return;
    const newBonus: BonusItem = {
      id: `custom-b-${Date.now()}`,
      nameEn: newBonusNameEn.trim() || 'Custom Incentive Bonus',
      nameLao: newBonusNameLao.trim() || 'ເງິນລາງວັນພິເສດກຳນົດເອງ',
      amount: Math.max(0, newBonusAmount),
      category: 'SPECIAL',
      isTaxable: true,
      notesEn: 'Custom added incentive bonus for simulation',
      notesLao: 'ເງິນລາງວັນພິເສດເພີ່ມເຕີມໃນລະບົບຈຳລອງເງິນເດືອນ',
      isActive: true,
    };
    setBonuses((prev) => [...prev, newBonus]);
    setNewBonusNameEn('');
    setNewBonusNameLao('');
    setNewBonusAmount(1000000);
    setNewBonusModalOpen(false);
    alerts.success(language === 'lo' ? 'ເພີ່ມລາຍການໂບນັດໃໝ່ແລ້ວ' : 'Bonus Item Added');
  };

  const handleAddCustomDeduction = () => {
    if (!newDedNameEn.trim() && !newDedNameLao.trim()) return;
    const newDed: DeductionItem = {
      id: `custom-d-${Date.now()}`,
      nameEn: newDedNameEn.trim() || 'Custom Deduction Item',
      nameLao: newDedNameLao.trim() || 'ລາຍການຫັກເພີ່ມເຕີມ',
      amount: Math.max(0, newDedAmount),
      category: 'OTHER',
      notesEn: 'Custom added deduction for simulation',
      notesLao: 'ລາຍການຫັກເພີ່ມເຕີມໃນລະບົບຈຳລອງເງິນເດືອນ',
      isActive: true,
    };
    setDeductions((prev) => [...prev, newDed]);
    setNewDedNameEn('');
    setNewDedNameLao('');
    setNewDedAmount(250000);
    setNewDedModalOpen(false);
    alerts.success(language === 'lo' ? 'ເພີ່ມລາຍການຫັກໃໝ່ແລ້ວ' : 'Deduction Item Added');
  };

  const handleResetToBaseline = () => {
    if (selectedEmployee) {
      setSimulatedBaseSalary(selectedEmployee.baseSalary);
    }
    setBonuses((prev) =>
      prev.map((b) => ({
        ...b,
        isActive: b.id === 'b-transport', // only standard transport
      }))
    );
    setDeductions((prev) =>
      prev.map((d) => ({
        ...d,
        isActive: d.id === 'd-welfare', // only standard welfare
      }))
    );
    alerts.info(
      language === 'lo' ? 'ຣີເຊັດເປັນມູນຄ່າມາດຕະຖານແລ້ວ' : 'Reset to Standard Baseline'
    );
  };

  const handleApplyPreset = (type: 'STANDARD' | 'BONUS_HEAVY' | 'EXECUTIVE') => {
    if (type === 'STANDARD') {
      handleResetToBaseline();
    } else if (type === 'BONUS_HEAVY') {
      setBonuses((prev) =>
        prev.map((b) => ({
          ...b,
          isActive: true,
        }))
      );
      setDeductions((prev) =>
        prev.map((d) => ({
          ...d,
          isActive: d.id === 'd-welfare',
        }))
      );
      alerts.success(
        language === 'lo'
          ? 'ນຳໃຊ້ຊຸດໂບນັດເຕັມຮູບແບບແລ້ວ'
          : 'Full Quarterly Bonus Package Applied'
      );
    } else if (type === 'EXECUTIVE') {
      setSimulatedBaseSalary(45000000);
      setBonuses((prev) =>
        prev.map((b) => ({
          ...b,
          isActive: b.id === 'b-transport' || b.id === 'b-kpi' || b.id === 'b-project',
        }))
      );
      alerts.success(
        language === 'lo'
          ? 'ນຳໃຊ້ຊຸດຜູ້ບໍລິຫານລະດັບສູງແລ້ວ'
          : 'Executive Tier Package Applied'
      );
    }
  };

  const handleSaveToPayroll = () => {
    if (!selectedEmployee) return;

    // Check if payslip already exists for this employee and period
    const existingIndex = payslips.findIndex(
      (p) => p.employeeId === selectedEmployee.id && p.payrollPeriodId === selectedPeriodId
    );

    const updatedPayslip: Payslip = {
      id:
        existingIndex >= 0
          ? payslips[existingIndex].id
          : `ps-${selectedPeriodId}-${selectedEmployee.id}-${Date.now()}`,
      payrollPeriodId: selectedPeriodId,
      employeeId: selectedEmployee.id,
      baseSalary: simulatedBaseSalary,
      allowances: activeBonusesTotal,
      grossSalary: grossEarnings,
      socialSecurityEmployee: employeeSS,
      socialSecurityEmployer: employerSS,
      taxableIncome,
      personalIncomeTax,
      otherDeductions: activeOtherDeductionsTotal,
      netPay: netTakeHomePay,
      paymentStatus: 'PAID',
      bankAccountMasked: selectedEmployee.bankAccountNumber
        ? `••••-••••-${selectedEmployee.bankAccountNumber.slice(-4)}`
        : '••••-••••-001',
      calculatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      setPayslips((prev) => {
        const copy = [...prev];
        copy[existingIndex] = updatedPayslip;
        return copy;
      });
    } else {
      setPayslips((prev) => [updatedPayslip, ...prev]);
    }

    addAuditLog(
      'PAYSLIP_GENERATE',
      'UPDATE',
      'Interactive Payroll Generator',
      `Generated interactive drill-down pay slip for ${selectedEmployee.employeeCode} (${selectedEmployee.firstNameEn}) - Net: ${netTakeHomePay.toLocaleString()} LAK`,
      {
        entityType: 'PAYSLIP',
        entityName: `${selectedEmployee.employeeCode} - ${selectedPeriodId}`,
        recordId: updatedPayslip.id,
        changes: [
          { field: 'grossSalary', newValue: `${grossEarnings.toLocaleString()} LAK` },
          { field: 'netPay', newValue: `${netTakeHomePay.toLocaleString()} LAK` },
          { field: 'bonuses', newValue: `${activeBonusesTotal.toLocaleString()} LAK` },
          { field: 'taxPIT', newValue: `${personalIncomeTax.toLocaleString()} LAK` },
        ],
      }
    );

    alerts.success(
      language === 'lo'
        ? `ບັນທຶກໃບແຈ້ງເງິນເດືອນງວດ ${currentPeriodObj?.code || selectedPeriodId} ສຳເລັດ`
        : `Saved Pay Slip to Period ${currentPeriodObj?.code || selectedPeriodId}`,
      language === 'lo'
        ? `ຍອດສຸດທິ: ${netTakeHomePay.toLocaleString()} LAK ຖືກບັນທຶກເຂົ້າບັນຊີລາຍການແລ້ວ`
        : `Net take-home amount: ${netTakeHomePay.toLocaleString()} LAK recorded.`
    );
  };

  const handlePrintOfficialPayslip = () => {
    window.print();
  };

  const dept = departments.find((d) => d.id === selectedEmployee?.departmentId);
  const pos = positions.find((p) => p.id === selectedEmployee?.positionId);

  return (
    <div className="space-y-6">
      {/* 1. Header & Configuration Control Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 lg:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
                  {language === 'lo'
                    ? 'ລະບົບສ້າງໃບເງິນເດືອນອັດສະລິຍະ (Interactive Pay Slip)'
                    : 'Interactive Pay Slip Generator'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Live Calculator
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'lo'
                  ? 'ຈຳລອງ, ວິເຄາະ ແລະ ເຈາະເລິກລາຍລະອຽດເງິນອຸດໜູນ, ໂບນັດ ແລະ ລາຍການຫັກພາສີ/ປະກັນສັງຄົມ'
                  : 'Simulate, analyze, and drill down into bonuses, allowances, and statutory tax deductions'}
              </p>
            </div>
          </div>

          {/* Quick Presets & Print Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
              <button
                onClick={() => handleApplyPreset('STANDARD')}
                className="px-2.5 py-1 rounded-lg font-medium text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-all"
              >
                {language === 'lo' ? 'ມາດຕະຖານ' : 'Standard'}
              </button>
              <button
                onClick={() => handleApplyPreset('BONUS_HEAVY')}
                className="px-2.5 py-1 rounded-lg font-medium text-blue-700 dark:text-blue-300 hover:bg-white dark:hover:bg-slate-700 transition-all flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>+ {language === 'lo' ? 'ໂບນັດເຕັມ' : 'Bonuses'}</span>
              </button>
              <button
                onClick={() => handleApplyPreset('EXECUTIVE')}
                className="px-2.5 py-1 rounded-lg font-medium text-indigo-700 dark:text-indigo-300 hover:bg-white dark:hover:bg-slate-700 transition-all"
              >
                {language === 'lo' ? 'ຜູ້ບໍລິຫານ' : 'Executive'}
              </button>
            </div>

            <button
              onClick={handlePrintOfficialPayslip}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-xs"
              title="Print official pay slip"
            >
              <Printer className="w-3.5 h-3.5 text-blue-600" />
              <span>{language === 'lo' ? 'ພິມໃບແຈ້ງ' : 'Print Slip'}</span>
            </button>

            {isHRorFinance && (
              <button
                onClick={handleSaveToPayroll}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{language === 'lo' ? 'ບັນທຶກເຂົ້າບັນຊີເງິນເດືອນ' : 'Save to Payroll'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters: Month / Period & Employee Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          {/* Employee Picker */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span>{language === 'lo' ? 'ເລືອກພະນັກງານ' : 'Select Employee'}</span>
            </label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.employeeCode} - {emp.firstNameLao} {emp.lastNameLao} ({emp.firstNameEn})
                </option>
              ))}
            </select>
          </div>

          {/* Month / Period Picker */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>{language === 'lo' ? 'ງວດເງິນເດືອນ (Month / Period)' : 'Payroll Period'}</span>
            </label>
            <select
              value={selectedPeriodId}
              onChange={(e) => setSelectedPeriodId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
            >
              {payrollPeriods.map((pp) => (
                <option key={pp.id} value={pp.id}>
                  {pp.code} [{pp.startDate} → {pp.endDate}]
                </option>
              ))}
            </select>
          </div>

          {/* Base Salary Simulation Input */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                <span>{language === 'lo' ? 'ເງິນເດືອນພື້ນຖານ (Base Salary)' : 'Base Salary (LAK)'}</span>
              </span>
              <button
                onClick={handleResetToBaseline}
                className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5"
                title="Reset to contract base"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>{language === 'lo' ? 'ຄ່າຕາມສັນຍາ' : 'Reset'}</span>
              </button>
            </label>
            <div className="relative">
              <input
                type="number"
                step="500000"
                value={simulatedBaseSalary}
                onChange={(e) => setSimulatedBaseSalary(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full px-3 py-2 font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 pr-12 focus:ring-2 focus:ring-blue-500"
              />
              <span className="absolute right-3 top-2.5 font-mono text-slate-400 text-[11px] pointer-events-none">
                LAK
              </span>
            </div>
          </div>
        </div>

        {/* Selected Employee Summary Card Banner */}
        {selectedEmployee && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50/50 dark:from-slate-800/60 dark:via-blue-950/20 dark:to-slate-800/40 border border-blue-100/80 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                {selectedEmployee.firstNameEn.substring(0, 1)}
                {selectedEmployee.lastNameEn.substring(0, 1)}
              </div>
              <div>
                <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>
                    {language === 'lo'
                      ? `${selectedEmployee.firstNameLao} ${selectedEmployee.lastNameLao}`
                      : `${selectedEmployee.firstNameEn} ${selectedEmployee.lastNameEn}`}
                  </span>
                  <span className="font-mono text-[11px] text-blue-600 dark:text-blue-400 font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950">
                    {selectedEmployee.employeeCode}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <span>
                    {dept ? (language === 'lo' ? dept.nameLao : dept.nameEn) : 'LHSE Corporate'}
                  </span>
                  <span>•</span>
                  <span>
                    {pos ? (language === 'lo' ? pos.titleLao : pos.titleEn) : 'Officer'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-[11px]">
              <div>
                <span className="text-slate-400 block text-[10px]">
                  {language === 'lo' ? 'ບັນຊີເງິນເດືອນ (BCEL):' : 'Bank Account:'}
                </span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                  {selectedEmployee.bankAccountNumber || '010-12-00-11223344-001'}
                </span>
              </div>
              <div className="border-l border-slate-200 dark:border-slate-700 pl-4">
                <span className="text-slate-400 block text-[10px]">
                  {language === 'lo' ? 'ປະເພດການຈ້າງ:' : 'Employment:'}
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {selectedEmployee.employmentType}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Key Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Card 1: Gross Earnings */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {language === 'lo' ? 'ລາຍຮັບລວມ (Gross)' : 'Gross Earnings'}
            </span>
            <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="font-mono text-xl lg:text-2xl font-black text-slate-900 dark:text-slate-100">
            {grossEarnings.toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-400">LAK</span>
          </div>
          <div className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span>
              +{activeBonusesTotal.toLocaleString()} LAK (
              {language === 'lo' ? 'ໂບນັດ/ອຸດໜູນ' : 'Bonuses'})
            </span>
          </div>
        </div>

        {/* Card 2: Total Deductions */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {language === 'lo' ? 'ລວມລາຍການຫັກ' : 'Total Deductions'}
            </span>
            <div className="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400 flex items-center justify-center">
              <TrendingDown className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="font-mono text-xl lg:text-2xl font-black text-rose-600 dark:text-rose-400">
            -{grandTotalDeductions.toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-400">LAK</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400 flex items-center justify-between">
            <span>PIT: {personalIncomeTax.toLocaleString()}</span>
            <span>LSSO: {employeeSS.toLocaleString()}</span>
          </div>
        </div>

        {/* Card 3: Net Take-Home Pay (Highlight) */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-900 border border-emerald-200 dark:border-emerald-800/60 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
              {language === 'lo' ? 'ຍອດຈ່າຍສຸດທິ (Net Pay)' : 'Net Take-Home Pay'}
            </span>
            <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <Check className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="font-mono text-xl lg:text-2xl font-black text-emerald-700 dark:text-emerald-400">
            {netTakeHomePay.toLocaleString()}{' '}
            <span className="text-xs font-normal text-emerald-600">LAK</span>
          </div>
          <div className="mt-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
            {netPayPercentage}% {language === 'lo' ? 'ຂອງຍອດລາຍຮັບລວມ' : 'of gross earnings'}
          </div>
        </div>

        {/* Card 4: Employer Extra Contribution (6.0% LSSO) */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {language === 'lo' ? 'ພັນທະອົງກອນ (6% ອປສ)' : 'Employer Contribution'}
            </span>
            <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="font-mono text-xl lg:text-2xl font-black text-indigo-600 dark:text-indigo-400">
            +{employerSS.toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-400">LAK</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {language === 'lo' ? 'ຈ່າຍສົມທົບເຂົ້າກອງທຶນ ອປສ' : 'Lao National Social Fund 6%'}
          </div>
        </div>
      </div>

      {/* 3. Visual Charts Grid (Recharts Flow & Donut Breakdown) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Waterfall / Comparison Bar Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                {language === 'lo' ? 'ຂັ້ນຕອນການໄຫຼຂອງເງິນເດືອນ (Gross to Net Flow)' : 'Gross-to-Net Progression'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {language === 'lo' ? 'ປຽບທຽບເງິນເດືອນຫຼັກ, ໂບນັດ, ລາຍການຫັກ ແລະ ຍອດສຸດທິ' : 'Comparison of base salary, incentives, deductions, and net pay'}
              </p>
            </div>
          </div>

          <div className="min-h-[220px] w-full pt-1">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={waterfallChartData}
                margin={{ top: 15, right: 10, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickFormatter={(val) => `${(val / 1000000).toFixed(0)}M`}
                  tickLine={false}
                  axisLine={false}
                />
                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white text-xs rounded-xl p-2.5 shadow-xl border border-slate-700">
                        <div className="font-bold">{data.name}</div>
                        <div className="font-mono text-emerald-400 font-bold mt-1">
                          {data.amount.toLocaleString()} LAK
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                  {waterfallChartData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Net Take-Home vs Deductions Donut (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mb-1">
              <PieIcon className="w-4 h-4 text-emerald-600" />
              {language === 'lo' ? 'ສັດສ່ວນລາຍຮັບ ສຸດທິ ທຽບໃສ່ ລາຍການຫັກ' : 'Earnings vs Deductions Ratio'}
            </h3>
            <p className="text-[11px] text-slate-400 mb-3">
              {language === 'lo' ? 'ການແບ່ງປັນສ່ວນຮ້ອຍຂອງລາຍຮັບທັງໝົດ' : 'Proportional breakdown of gross compensation'}
            </p>

            <div className="relative min-h-[170px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const item = payload[0].payload;
                      const pct = grossEarnings > 0 ? ((item.value / grossEarnings) * 100).toFixed(1) : 0;
                      return (
                        <div className="bg-slate-900 text-white text-xs rounded-xl p-2.5 shadow-xl border border-slate-700">
                          <div className="font-bold flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                            <span>{item.name}</span>
                          </div>
                          <div className="font-mono font-bold mt-1 text-slate-200">
                            {item.value.toLocaleString()} LAK ({pct}%)
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Pie
                    data={pieChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`pie-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-base font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                  {netPayPercentage}%
                </span>
                <span className="text-[9px] text-slate-400 font-medium">
                  {language === 'lo' ? 'ສຸດທິຕົວຈິງ' : 'Take-Home'}
                </span>
              </div>
            </div>
          </div>

          {/* Mini Legend */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-[11px]">
            {pieChartData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="truncate text-slate-600 dark:text-slate-400">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. THE DRILL-DOWN BREAKDOWN TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Table Header Bar */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60 dark:bg-slate-800/40">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>
                  {language === 'lo'
                    ? 'ຕາຕະລາງເຈາະເລິກລາຍການຫັກ ແລະ ເງິນໂບນັດ (Drill-Down Breakdown Table)'
                    : 'Interactive Deductions & Bonuses Drill-Down Table'}
                </span>
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {language === 'lo'
                ? 'ຄລິກໃສ່ແຕ່ລະແຖວເພື່ອເປີດເບິ່ງສູດຄິດໄລ່, ຂັ້ນອັດຕາພາສີກ້າວໜ້າ ແລະ ເງື່ອນໄຂລະບຽບການ'
                : 'Click any row to expand calculation rationale, progressive tax tiers, and statutory rules'}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={expandAll}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium text-slate-600 dark:text-slate-300"
            >
              {language === 'lo' ? 'ເປີດທັງໝົດ' : 'Expand All'}
            </button>
            <button
              onClick={collapseAll}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium text-slate-600 dark:text-slate-300"
            >
              {language === 'lo' ? 'ຫຍໍ້ທັງໝົດ' : 'Collapse All'}
            </button>
          </div>
        </div>

        {/* Drill-down Content */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-sans">
          {/* SECTION A: BASE EARNINGS */}
          <div className="bg-white dark:bg-slate-900">
            <div
              onClick={() => toggleRow('baseSalary')}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-1 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                  {expandedRows.baseSalary ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span>
                      1. {language === 'lo' ? 'ເງິນເດືອນພື້ນຖານ (Base Salary)' : 'Base Contracted Salary'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      Fixed Guaranteed
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {language === 'lo' ? 'ຕາມສັນຍາແຮງງານ ແລະ ໂຄງສ້າງຕຳແໜ່ງ LHSE' : 'Contracted baseline rate as registered with HR'}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                  {simulatedBaseSalary.toLocaleString()} LAK
                </span>
                <span className="block text-[10px] text-slate-400">100% Taxable Base</span>
              </div>
            </div>

            {/* Drill-down Detail: Base Salary */}
            {expandedRows.baseSalary && (
              <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Daily Wage Equivalent</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {Math.round(simulatedBaseSalary / 22).toLocaleString()} LAK / day
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Based on 22 statutory working days</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Hourly Wage Equivalent</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {Math.round(simulatedBaseSalary / (22 * 8)).toLocaleString()} LAK / hr
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Standard 8h working shift</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Salary Band Level</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {pos?.level || 'Senior Specialist'}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Band: {((pos?.baseSalaryMin || 20000000) / 1000000).toFixed(0)}M - {((pos?.baseSalaryMax || 35000000) / 1000000).toFixed(0)}M LAK
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION B: BONUSES & INCENTIVES */}
          <div className="bg-white dark:bg-slate-900">
            <div
              onClick={() => toggleRow('bonuses')}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-1 rounded-lg bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400">
                  {expandedRows.bonuses ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span>
                      2. {language === 'lo' ? 'ເງິນອຸດໜູນ & ໂບນັດຜົນງານ (Allowances & Bonuses)' : 'Allowances & Performance Bonuses'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                      {bonuses.filter((b) => b.isActive).length} {language === 'lo' ? 'ລາຍການເຄື່ອນໄຫວ' : 'Active Items'}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {language === 'lo' ? 'ຄ່າຄອງຊີບ, ຄ່າພາຫະນະ, ໂບນັດ KPI ແລະ ລາງວັນພິເສດ' : 'Living allowance, transport, quarterly KPI bonuses, site incentives'}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                  +{activeBonusesTotal.toLocaleString()} LAK
                </span>
                <span className="block text-[10px] text-slate-400">Total Additions</span>
              </div>
            </div>

            {/* Drill-down Detail: Itemized Bonuses */}
            {expandedRows.bonuses && (
              <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    {language === 'lo' ? 'ລາຍການໂບນັດ ແລະ ເງິນອຸດໜູນ' : 'Itemized Bonus Schedule'}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setNewBonusModalOpen(true);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 font-bold text-[11px] hover:bg-teal-100 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{language === 'lo' ? 'ເພີ່ມໂບນັດໃໝ່' : 'Add Bonus'}</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {bonuses.map((bonus) => (
                    <div
                      key={bonus.id}
                      className={`p-3 rounded-2xl border transition-all ${
                        bonus.isActive
                          ? 'bg-white dark:bg-slate-800 border-teal-200 dark:border-teal-900/60 shadow-xs'
                          : 'bg-slate-100/60 dark:bg-slate-800/20 border-slate-200 dark:border-slate-800 opacity-60'
                      } flex flex-col sm:flex-row sm:items-center justify-between gap-2`}
                    >
                      <div className="flex items-start gap-2.5">
                        <input
                          type="checkbox"
                          checked={bonus.isActive}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setBonuses((prev) =>
                              prev.map((b) =>
                                b.id === bonus.id ? { ...b, isActive: checked } : b
                              )
                            );
                          }}
                          className="mt-1 rounded text-teal-600 focus:ring-teal-500 h-4 w-4"
                        />
                        <div>
                          <div className="font-bold text-slate-800 dark:text-slate-200">
                            {language === 'lo' ? bonus.nameLao : bonus.nameEn}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {language === 'lo' ? bonus.notesLao : bonus.notesEn}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        <div className="text-right">
                          <input
                            type="number"
                            step="100000"
                            value={bonus.amount}
                            disabled={!bonus.isActive}
                            onChange={(e) => {
                              const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                              setBonuses((prev) =>
                                prev.map((b) => (b.id === bonus.id ? { ...b, amount: val } : b))
                              );
                            }}
                            className="w-32 px-2 py-1 text-right font-mono font-bold text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-emerald-600 dark:text-emerald-400 focus:ring-1 focus:ring-teal-500"
                          />
                          <span className="text-[10px] text-slate-400 block">LAK</span>
                        </div>
                        {bonus.id.startsWith('custom-') && (
                          <button
                            onClick={() =>
                              setBonuses((prev) => prev.filter((b) => b.id !== bonus.id))
                            }
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                            title="Remove custom bonus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SECTION C: STATUTORY SOCIAL SECURITY (LSSO) */}
          <div className="bg-white dark:bg-slate-900">
            <div
              onClick={() => toggleRow('statutoryLSSO')}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-1 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                  {expandedRows.statutoryLSSO ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span>
                      3. {language === 'lo' ? 'ປະກັນສັງຄົມແຫ່ງຊາດ (Lao Social Security - LSSO 5.5%)' : 'Lao National Social Security (LSSO 5.5%)'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      Capped at 4.5M Base
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {language === 'lo' ? 'ຄິດໄລ່ 5.5% ຂອງເງິນເດືອນລວມ (ສູງສຸດບໍ່ເກີນ 247,500 ກີບ/ເດືອນ)' : 'Employee mandatory 5.5% contribution capped at 247,500 LAK'}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-sm text-amber-600 dark:text-amber-400">
                  -{employeeSS.toLocaleString()} LAK
                </span>
                <span className="block text-[10px] text-slate-400">Statutory Pre-Tax Deduction</span>
              </div>
            </div>

            {/* Drill-down Detail: LSSO */}
            {expandedRows.statutoryLSSO && (
              <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 space-y-1">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Assessment Base</span>
                    <div className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm">
                      {Math.min(grossEarnings, 4500000).toLocaleString()} LAK
                    </div>
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 block font-medium">
                      Ceiling cap: 4,500,000 LAK
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 space-y-1">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Employee Deduction (5.5%)</span>
                    <div className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm">
                      -{employeeSS.toLocaleString()} LAK
                    </div>
                    <span className="text-[10px] text-slate-400 block">Deducted directly from monthly pay</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 space-y-1">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Employer Match (6.0%)</span>
                    <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                      +{employerSS.toLocaleString()} LAK
                    </div>
                    <span className="text-[10px] text-slate-400 block">Remitted by LHSE enterprise account</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 text-blue-900 dark:text-blue-300 text-[11px] flex items-center justify-between">
                  <span>
                    {language === 'lo'
                      ? 'ຍອດລວມນຳສົ່ງອົງການປະກັນສັງຄົມແຫ່ງຊາດທັງໝົດ (11.5%):'
                      : 'Total monthly remittance to National Social Security Fund (11.5%):'}
                  </span>
                  <strong className="font-mono text-sm">
                    {(employeeSS + employerSS).toLocaleString()} LAK
                  </strong>
                </div>
              </div>
            )}
          </div>

          {/* SECTION D: STATUTORY PERSONAL INCOME TAX (PIT) DRILL-DOWN */}
          <div className="bg-white dark:bg-slate-900">
            <div
              onClick={() => toggleRow('statutoryPIT')}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-1 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
                  {expandedRows.statutoryPIT ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span>
                      4. {language === 'lo' ? 'ອາກອນລາຍໄດ້ບຸກຄົນ (Personal Income Tax - PIT)' : 'Lao Progressive Personal Income Tax (PIT)'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                      Tiered Progressive 0% - 25%
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {language === 'lo' ? 'ຖານຄິດໄລ່ອາກອນ: ລາຍຮັບລວມ ລົບ ປະກັນສັງຄົມ 5.5% (ກົດໝາຍສ່ວຍສາອາກອນ)' : 'Taxable base: Gross minus employee LSSO (Lao Tax Law)'}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-sm text-rose-600 dark:text-rose-400">
                  -{personalIncomeTax.toLocaleString()} LAK
                </span>
                <span className="block text-[10px] text-slate-400">
                  Effective Rate: {pitBreakdown.effectiveRate}%
                </span>
              </div>
            </div>

            {/* Drill-down Detail: PIT Progressive Tier Table */}
            {expandedRows.statutoryPIT && (
              <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      {language === 'lo' ? 'ຕາຕະລາງແຍກຕາມຂັ້ນອັດຕາກ້າວໜ້າ' : 'Progressive Bracket Calculations'}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      ({language === 'lo' ? 'ຖານລາຍຮັບເສຍອາກອນ' : 'Taxable Base'}: {taxableIncome.toLocaleString()} LAK)
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                    {language === 'lo' ? 'ອັດຕາພາສີຕົວຈິງ' : 'Effective Tax Rate'}: {pitBreakdown.effectiveRate}%
                  </span>
                </div>

                {/* Progressive Tiers Table */}
                <div className="overflow-x-auto rounded-xl border border-slate-200/70 dark:border-slate-700 bg-white dark:bg-slate-800">
                  <table className="w-full text-[11px]">
                    <thead className="bg-slate-100/80 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200/70 dark:border-slate-700">
                      <tr>
                        <th className="py-2 px-3 text-left">Bracket Tier</th>
                        <th className="py-2 px-3 text-left">Monthly Income Range</th>
                        <th className="py-2 px-3 text-center">Tax Rate</th>
                        <th className="py-2 px-3 text-right">Applicable Base</th>
                        <th className="py-2 px-3 text-right">Bracket Tax (LAK)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700 font-mono">
                      {pitBreakdown.tiers.map((tier) => (
                        <tr
                          key={tier.tier}
                          className={tier.tax > 0 ? 'bg-rose-50/20 dark:bg-rose-950/10' : ''}
                        >
                          <td className="py-2 px-3 font-bold text-slate-700 dark:text-slate-300">
                            Tier {tier.tier}
                          </td>
                          <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{tier.range}</td>
                          <td className="py-2 px-3 text-center font-bold text-blue-600 dark:text-blue-400">
                            {tier.rate}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-800 dark:text-slate-200">
                            {tier.base.toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-rose-600 dark:text-rose-400">
                            {tier.tax > 0 ? `-${tier.tax.toLocaleString()}` : '0 (Exempt)'}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-slate-100/70 dark:bg-slate-700/50 font-bold">
                        <td colSpan={4} className="py-2 px-3 text-right text-slate-800 dark:text-slate-200">
                          {language === 'lo' ? 'ຍອດອາກອນລາຍໄດ້ລວມທີ່ຕ້ອງຫັກ (Total PIT):' : 'Total Withholding PIT Tax:'}
                        </td>
                        <td className="py-2 px-3 text-right text-rose-600 dark:text-rose-400 text-xs">
                          -{personalIncomeTax.toLocaleString()} LAK
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* SECTION E: VOLUNTARY & OTHER DEDUCTIONS */}
          <div className="bg-white dark:bg-slate-900">
            <div
              onClick={() => toggleRow('otherDeductions')}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-1 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
                  {expandedRows.otherDeductions ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span>
                      5. {language === 'lo' ? 'ລາຍການຫັກອື່ນໆ (Welfare & Voluntary Deductions)' : 'Other Voluntary & Loan Deductions'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                      {deductions.filter((d) => d.isActive).length} {language === 'lo' ? 'ລາຍການເຄື່ອນໄຫວ' : 'Active'}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {language === 'lo' ? 'ກອງທຶນຊ່ວຍເຫຼືອເຊິ່ງກັນ & ກັນ, ຊຳລະເງິນກູ້ຢືມສຸກເສີນ, ສະສົມບຳນານ' : 'Staff welfare fund, emergency loan installments, voluntary savings'}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-sm text-purple-600 dark:text-purple-400">
                  -{activeOtherDeductionsTotal.toLocaleString()} LAK
                </span>
                <span className="block text-[10px] text-slate-400">Post-Tax Deductions</span>
              </div>
            </div>

            {/* Drill-down Detail: Other Deductions */}
            {expandedRows.otherDeductions && (
              <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    {language === 'lo' ? 'ລາຍການຫັກເພີ່ມເຕີມ' : 'Voluntary Deductions Schedule'}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setNewDedModalOpen(true);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-bold text-[11px] hover:bg-purple-100 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{language === 'lo' ? 'ເພີ່ມລາຍການຫັກ' : 'Add Deduction'}</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {deductions.map((ded) => (
                    <div
                      key={ded.id}
                      className={`p-3 rounded-2xl border transition-all ${
                        ded.isActive
                          ? 'bg-white dark:bg-slate-800 border-purple-200 dark:border-purple-900/60 shadow-xs'
                          : 'bg-slate-100/60 dark:bg-slate-800/20 border-slate-200 dark:border-slate-800 opacity-60'
                      } flex flex-col sm:flex-row sm:items-center justify-between gap-2`}
                    >
                      <div className="flex items-start gap-2.5">
                        <input
                          type="checkbox"
                          checked={ded.isActive}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setDeductions((prev) =>
                              prev.map((d) =>
                                d.id === ded.id ? { ...d, isActive: checked } : d
                              )
                            );
                          }}
                          className="mt-1 rounded text-purple-600 focus:ring-purple-500 h-4 w-4"
                        />
                        <div>
                          <div className="font-bold text-slate-800 dark:text-slate-200">
                            {language === 'lo' ? ded.nameLao : ded.nameEn}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {language === 'lo' ? ded.notesLao : ded.notesEn}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        <div className="text-right">
                          <input
                            type="number"
                            step="50000"
                            value={ded.amount}
                            disabled={!ded.isActive}
                            onChange={(e) => {
                              const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                              setDeductions((prev) =>
                                prev.map((d) => (d.id === ded.id ? { ...d, amount: val } : d))
                              );
                            }}
                            className="w-32 px-2 py-1 text-right font-mono font-bold text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-purple-600 dark:text-purple-400 focus:ring-1 focus:ring-purple-500"
                          />
                          <span className="text-[10px] text-slate-400 block">LAK</span>
                        </div>
                        {ded.id.startsWith('custom-') && (
                          <button
                            onClick={() =>
                              setDeductions((prev) => prev.filter((d) => d.id !== ded.id))
                            }
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                            title="Remove custom deduction"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SECTION F: GRAND TOTAL NET TAKE-HOME FOOTER */}
          <div className="p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100 dark:from-emerald-950/40 dark:via-slate-900 dark:to-emerald-950/50 border-t border-emerald-200 dark:border-emerald-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  {language === 'lo' ? 'ຍອດເງິນເດືອນສຸດທິເຂົ້າບັນຊີ' : 'FINAL NET TAKE-HOME SALARY'}
                </span>
                <div className="text-xl lg:text-2xl font-black font-mono text-emerald-950 dark:text-emerald-100">
                  {netTakeHomePay.toLocaleString()} LAK
                </div>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-300">
                  {language === 'lo'
                    ? `ສູດຄິດໄລ່: ລາຍຮັບລວມ (${grossEarnings.toLocaleString()}) - ຍອດຫັກ (${grandTotalDeductions.toLocaleString()})`
                    : `Formula: Gross (${grossEarnings.toLocaleString()}) - Total Deductions (${grandTotalDeductions.toLocaleString()})`}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrintOfficialPayslip}
                className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50 transition-all shadow-xs"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-600" />
                <span>{language === 'lo' ? 'ພິມໃບເງິນເດືອນ' : 'Print Official Slip'}</span>
              </button>
              {isHRorFinance && (
                <button
                  onClick={handleSaveToPayroll}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{language === 'lo' ? 'ບັນທຶກງວດນີ້' : 'Save Slip'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Add Custom Bonus */}
      {newBonusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Plus className="w-4 h-4 text-teal-600" />
              <span>{language === 'lo' ? 'ເພີ່ມລາຍການໂບນັດໃໝ່' : 'Add Custom Incentive/Bonus'}</span>
            </h4>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  {language === 'lo' ? 'ຊື່ລາຍການໂບນັດ (ພາສາລາວ)' : 'Bonus Name (Lao)'}
                </label>
                <input
                  type="text"
                  placeholder="ເຊັ່ນ: ໂບນັດປິດໂຄງການພະລັງງານ..."
                  value={newBonusNameLao}
                  onChange={(e) => setNewBonusNameLao(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  {language === 'lo' ? 'ຊື່ລາຍການໂບນັດ (English)' : 'Bonus Name (English)'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Project Closing Bonus..."
                  value={newBonusNameEn}
                  onChange={(e) => setNewBonusNameEn(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  {language === 'lo' ? 'ຈຳນວນເງິນ (LAK)' : 'Amount (LAK)'}
                </label>
                <input
                  type="number"
                  step="500000"
                  value={newBonusAmount}
                  onChange={(e) => setNewBonusAmount(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setNewBonusModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400"
              >
                {language === 'lo' ? 'ຍົກເລີກ' : 'Cancel'}
              </button>
              <button
                onClick={handleAddCustomBonus}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 text-white hover:bg-teal-500 shadow-xs"
              >
                {language === 'lo' ? 'ຢືນຢັນເພີ່ມ' : 'Add Item'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Custom Deduction */}
      {newDedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Plus className="w-4 h-4 text-purple-600" />
              <span>{language === 'lo' ? 'ເພີ່ມລາຍການຫັກເພີ່ມເຕີມ' : 'Add Custom Deduction'}</span>
            </h4>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  {language === 'lo' ? 'ຊື່ລາຍການຫັກ (ພາສາລາວ)' : 'Deduction Name (Lao)'}
                </label>
                <input
                  type="text"
                  placeholder="ເຊັ່ນ: ຫັກເງິນຄ່າຊຸດຢູນິຟອມ..."
                  value={newDedNameLao}
                  onChange={(e) => setNewDedNameLao(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  {language === 'lo' ? 'ຊື່ລາຍການຫັກ (English)' : 'Deduction Name (English)'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Uniform Expense..."
                  value={newDedNameEn}
                  onChange={(e) => setNewDedNameEn(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  {language === 'lo' ? 'ຈຳນວນເງິນຫັກ (LAK)' : 'Deduction Amount (LAK)'}
                </label>
                <input
                  type="number"
                  step="50000"
                  value={newDedAmount}
                  onChange={(e) => setNewDedAmount(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setNewDedModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400"
              >
                {language === 'lo' ? 'ຍົກເລີກ' : 'Cancel'}
              </button>
              <button
                onClick={handleAddCustomDeduction}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 text-white hover:bg-purple-500 shadow-xs"
              >
                {language === 'lo' ? 'ຢືນຢັນເພີ່ມ' : 'Add Item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
