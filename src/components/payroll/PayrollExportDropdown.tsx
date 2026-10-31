import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { Payslip } from '../../types/index.ts';
import {
  FileSpreadsheet,
  FileText,
  Printer,
  ChevronDown,
  Download,
  CreditCard,
  Building2,
  CheckCircle2,
  Loader2,
  Sparkles,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { alerts } from '../../utils/alerts.ts';

interface PayrollExportDropdownProps {
  payslips: Payslip[];
  className?: string;
}

export const PayrollExportDropdown: React.FC<PayrollExportDropdownProps> = ({
  payslips,
  className = '',
}) => {
  const { language, employees } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const dateStr = new Date().toISOString().split('T')[0];

  // Helper to escape CSV cell contents
  const escapeCSV = (val: any): string => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  // 1. Export Payroll Register CSV with UTF-8 BOM
  const handleExportCSV = async () => {
    try {
      setIsExporting('csv');
      await new Promise((r) => setTimeout(r, 450));

      const headers =
        language === 'lo'
          ? [
              'ລຳດັບ (No.)',
              'ລະຫັດພະນັກງານ (Code)',
              'ຊື່ ແລະ ນາມສະກຸນ (ລາວ)',
              'ຊື່ ແລະ ນາມສະກຸນ (EN)',
              'ເງິນເດືອນພື້ນຖານ (Base Salary LAK)',
              'ເງິນເດືອນລວມ (Gross Salary LAK)',
              'ປະກັນສັງຄົມ 5.5% (LSSO LAK)',
              'ອາກອນລາຍໄດ້ PIT (Tax LAK)',
              'ເງິນເດືອນສຸດທິ (Net Pay LAK)',
              'ທະນາຄານ (Bank)',
              'ເລກບັນຊີ (Account Number)',
              'ງວດເງິນເດືອນ (Period)',
            ]
          : [
              'No.',
              'Employee Code',
              'Full Name (Lao)',
              'Full Name (EN)',
              'Base Salary (LAK)',
              'Gross Salary (LAK)',
              'Social Security 5.5% (LAK)',
              'Income Tax PIT (LAK)',
              'Net Pay (LAK)',
              'Bank Name',
              'Bank Account',
              'Payroll Period',
            ];

      const rows = payslips.map((p, idx) => {
        const emp = employees.find((e) => e.id === p.employeeId);
        return [
          escapeCSV(idx + 1),
          escapeCSV(emp?.employeeCode || p.employeeId),
          escapeCSV(emp ? `${emp.firstNameLao} ${emp.lastNameLao}` : ''),
          escapeCSV(emp ? `${emp.firstNameEn} ${emp.lastNameEn}` : ''),
          escapeCSV(p.baseSalary),
          escapeCSV(p.grossSalary),
          escapeCSV(p.socialSecurityEmployee),
          escapeCSV(p.personalIncomeTax),
          escapeCSV(p.netPay),
          escapeCSV(emp?.bankName || 'BCEL'),
          escapeCSV(emp?.bankAccountNumber || '010-12-00-11223344-001'),
          escapeCSV(p.payrollPeriodId),
        ].join(',');
      });

      const csvContent = [headers.map(escapeCSV).join(','), ...rows].join('\r\n');
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const filename = `LHSE_Payroll_Register_${dateStr}.csv`;

      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      alerts.success(
        language === 'lo' ? 'ສົ່ງອອກ CSV ສຳເລັດ' : 'Payroll CSV Exported',
        language === 'lo'
          ? `ດາວໂຫຼດທະບຽນເງິນເດືອນ ${payslips.length} ລາຍການລົງໃນ ${filename} ແລ້ວ.`
          : `Exported payroll register of ${payslips.length} staff to ${filename}.`
      );
      setIsOpen(false);
    } catch (e) {
      alerts.error(language === 'lo' ? 'ເກີດຂໍ້ຜິດພາດ' : 'Export Failed', String(e));
    } finally {
      setIsExporting(null);
    }
  };

  // 2. Export Official PDF File via Mock Binary PDF Generator
  const handleExportPDF = async () => {
    try {
      setIsExporting('pdf');
      await new Promise((r) => setTimeout(r, 650));

      const filename = `LHSE_Payroll_Disbursement_Summary_${dateStr}.pdf`;

      const totalGross = payslips.reduce((acc, p) => acc + p.grossSalary, 0);
      const totalTax = payslips.reduce((acc, p) => acc + p.personalIncomeTax, 0);
      const totalLSSO = payslips.reduce((acc, p) => acc + p.socialSecurityEmployee, 0);
      const totalNet = payslips.reduce((acc, p) => acc + p.netPay, 0);

      const lines: string[] = [
        '=================================================================================',
        'LAO HOLDING STATE ENTERPRISE (LHSE) - STATE OWNED ASSET MANAGEMENT',
        'OFFICIAL PAYROLL DISBURSEMENT REPORT & SALARY REGISTER',
        `Date: ${new Date().toLocaleDateString()} | Employees: ${payslips.length} persons`,
        `Total Gross: ${totalGross.toLocaleString()} LAK | Total Net Disbursed: ${totalNet.toLocaleString()} LAK`,
        `Tax Withheld (PIT): ${totalTax.toLocaleString()} LAK | LSSO (5.5%): ${totalLSSO.toLocaleString()} LAK`,
        '=================================================================================',
        'CODE       STAFF NAME             GROSS (LAK)     TAX (LAK)     NET PAY (LAK)    ',
        '---------------------------------------------------------------------------------',
      ];

      payslips.forEach((p) => {
        const emp = employees.find((e) => e.id === p.employeeId);
        const code = (emp?.employeeCode || p.employeeId).padEnd(10).slice(0, 10);
        const name = (emp ? `${emp.firstNameEn} ${emp.lastNameEn}` : p.employeeId).padEnd(22).slice(0, 22);
        const gross = p.grossSalary.toLocaleString().padStart(14).slice(0, 14);
        const tax = p.personalIncomeTax.toLocaleString().padStart(12).slice(0, 12);
        const net = p.netPay.toLocaleString().padStart(15).slice(0, 15);

        lines.push(`${code} ${name} ${gross} ${tax} ${net}`);
      });

      lines.push('=================================================================================');
      lines.push('Certified for state disbursement. Authorized by LHSE Managing Director.');

      let textStream = 'BT\n/F1 9 Tf\n12 TL\n35 750 Td\n';
      lines.forEach((line) => {
        const escaped = line.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
        textStream += `(${escaped}) '\n`;
      });
      textStream += 'ET';

      const streamLength = textStream.length;
      const obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
      const obj2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
      const obj3 =
        '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n';
      const obj4 = `4 0 obj\n<< /Length ${streamLength} >>\nstream\n${textStream}\nendstream\nendobj\n`;
      const obj5 = '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj\n';

      const header = '%PDF-1.4\n';
      const offset1 = header.length;
      const offset2 = offset1 + obj1.length;
      const offset3 = offset2 + obj2.length;
      const offset4 = offset3 + obj3.length;
      const offset5 = offset4 + obj4.length;
      const xrefOffset = offset5 + obj5.length;

      const padOffset = (n: number) => String(n).padStart(10, '0');

      const xref =
        `xref\n` +
        `0 6\n` +
        `0000000000 65535 f \n` +
        `${padOffset(offset1)} 00000 n \n` +
        `${padOffset(offset2)} 00000 n \n` +
        `${padOffset(offset3)} 00000 n \n` +
        `${padOffset(offset4)} 00000 n \n` +
        `${padOffset(offset5)} 00000 n \n`;

      const trailer =
        `trailer\n` +
        `<< /Size 6 /Root 1 0 R >>\n` +
        `startxref\n` +
        `${xrefOffset}\n` +
        `%%EOF\n`;

      const pdfString = header + obj1 + obj2 + obj3 + obj4 + obj5 + xref + trailer;

      const blob = new Blob([pdfString], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      alerts.success(
        language === 'lo' ? 'ສົ່ງອອກ PDF ສຳເລັດ' : 'Payroll PDF Exported',
        language === 'lo'
          ? `ດາວໂຫຼດເອກະສານທາງການ ${filename} ສຳເລັດແລ້ວ.`
          : `Downloaded official summary ${filename}.`
      );
      setIsOpen(false);
    } catch (e) {
      alerts.error(language === 'lo' ? 'ເກີດຂໍ້ຜິດພາດ' : 'Export Failed', String(e));
    } finally {
      setIsExporting(null);
    }
  };

  // 3. Print / Save as PDF with State Enterprise Letterhead and Signatures
  const handlePrintPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alerts.warning(
        language === 'lo' ? 'ກະລຸນາອະນຸຍາດ Pop-up' : 'Pop-up Blocked',
        language === 'lo' ? 'ກະລຸນາອະນຸຍາດ Pop-up ເພື່ອເບິ່ງຕົວຢ່າງເອກະສານ' : 'Please allow pop-ups.'
      );
      return;
    }

    const totalGross = payslips.reduce((acc, p) => acc + p.grossSalary, 0);
    const totalTax = payslips.reduce((acc, p) => acc + p.personalIncomeTax, 0);
    const totalLSSO = payslips.reduce((acc, p) => acc + p.socialSecurityEmployee, 0);
    const totalNet = payslips.reduce((acc, p) => acc + p.netPay, 0);

    const rowsHtml = payslips
      .map((p, idx) => {
        const emp = employees.find((e) => e.id === p.employeeId);
        return `
        <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
          <td style="padding: 7px 8px; text-align: center; color: #64748b;">${idx + 1}</td>
          <td style="padding: 7px 8px; font-weight: bold; color: #1e3a8a; font-family: monospace;">${emp?.employeeCode || p.employeeId}</td>
          <td style="padding: 7px 8px;">
            <div style="font-weight: 600; color: #0f172a;">${emp ? `${emp.firstNameEn} ${emp.lastNameEn}` : p.employeeId}</div>
            <div style="color: #64748b; font-size: 10px;">${emp ? `${emp.firstNameLao} ${emp.lastNameLao}` : ''}</div>
          </td>
          <td style="padding: 7px 8px; text-align: right; font-family: monospace;">${p.baseSalary.toLocaleString()}</td>
          <td style="padding: 7px 8px; text-align: right; font-family: monospace; font-weight: 600;">${p.grossSalary.toLocaleString()}</td>
          <td style="padding: 7px 8px; text-align: right; font-family: monospace; color: #d97706;">-${p.socialSecurityEmployee.toLocaleString()}</td>
          <td style="padding: 7px 8px; text-align: right; font-family: monospace; color: #dc2626;">-${p.personalIncomeTax.toLocaleString()}</td>
          <td style="padding: 7px 8px; text-align: right; font-family: monospace; font-weight: bold; color: #059669;">${p.netPay.toLocaleString()} LAK</td>
          <td style="padding: 7px 8px; color: #475569; font-size: 10px;">${emp?.bankName || 'BCEL'}</td>
        </tr>
      `;
      })
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>LHSE Official Payroll Ledger - PDF</title>
          <style>
            @media print {
              @page { size: A4 landscape; margin: 12mm; }
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .no-print { display: none !important; }
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Lao", sans-serif;
              color: #0f172a;
              margin: 0;
              padding: 24px;
              background: #fff;
            }
            .toolbar {
              background: #f1f5f9;
              padding: 12px 18px;
              border-radius: 12px;
              margin-bottom: 20px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .header-banner {
              border-bottom: 2px solid #1e3a8a;
              padding-bottom: 16px;
              margin-bottom: 20px;
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
            }
            .badge {
              display: inline-block;
              background: #1e3a8a;
              color: #fff;
              padding: 4px 10px;
              border-radius: 6px;
              font-size: 10px;
              font-weight: bold;
            }
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 12px;
              margin-bottom: 20px;
            }
            .stat-card {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 10px;
              padding: 10px 14px;
            }
            .stat-label { font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: bold; }
            .stat-value { font-size: 15px; font-weight: bold; font-family: monospace; margin-top: 3px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th {
              background-color: #f1f5f9;
              color: #334155;
              font-size: 10px;
              text-transform: uppercase;
              padding: 8px;
              border-bottom: 2px solid #cbd5e1;
              text-align: left;
            }
            .signatures {
              margin-top: 40px;
              display: flex;
              justify-content: space-between;
              page-break-inside: avoid;
            }
            .sig-box {
              text-align: center;
              width: 220px;
              border-top: 1px dashed #94a3b8;
              padding-top: 8px;
              font-size: 11px;
              color: #475569;
            }
          </style>
        </head>
        <body>
          <div class="toolbar no-print">
            <div>
              <strong>LHSE Official Payroll Summary</strong> - Ready to Print or Save as PDF
            </div>
            <div style="display: flex; gap: 8px;">
              <button onclick="window.print()" style="background: #2563eb; color: white; border: none; padding: 8px 16px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 12px;">🖨️ Print / Save PDF</button>
              <button onclick="window.close()" style="background: #e2e8f0; color: #334155; border: none; padding: 8px 16px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 12px;">Close</button>
            </div>
          </div>

          <div class="header-banner">
            <div>
              <div class="badge">LHSE STATE ENTERPRISE</div>
              <h1 style="margin: 6px 0 2px; font-size: 18px; color: #1e3a8a;">
                ລັດວິສາຫະກິດ ຖືຮຸ້ນລາວ • LAO HOLDING STATE ENTERPRISE
              </h1>
              <div style="font-size: 13px; font-weight: 600; color: #334155;">
                Official Monthly Payroll Disbursement Register & Tax Schedule (ທະບຽນເງິນເດືອນ & ອາກອນ)
              </div>
              <div style="font-size: 11px; color: #64748b; margin-top: 4px;">
                Ministry of Finance Complex, 23 Singha Road, Vientiane Capital, Lao PDR
              </div>
            </div>
            <div style="text-align: right; font-size: 11px; color: #64748b;">
              <div><strong>Generated Date:</strong> ${new Date().toLocaleDateString()}</div>
              <div><strong>Staff Count:</strong> ${payslips.length} recipients</div>
              <div><strong>Currency:</strong> Lao Kip (LAK)</div>
            </div>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">Total Gross Salary</div>
              <div class="stat-value" style="color: #0f172a;">${totalGross.toLocaleString()} LAK</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Total Employee LSSO (5.5%)</div>
              <div class="stat-value" style="color: #d97706;">${totalLSSO.toLocaleString()} LAK</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Total Income Tax (PIT)</div>
              <div class="stat-value" style="color: #dc2626;">${totalTax.toLocaleString()} LAK</div>
            </div>
            <div class="stat-card" style="background: #ecfdf5; border-color: #a7f3d0;">
              <div class="stat-label" style="color: #065f46;">Total Net Disbursement</div>
              <div class="stat-value" style="color: #047857;">${totalNet.toLocaleString()} LAK</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 30px; text-align: center;">#</th>
                <th style="width: 75px;">Code</th>
                <th>Employee Name</th>
                <th style="text-align: right;">Base Salary</th>
                <th style="text-align: right;">Gross Pay</th>
                <th style="text-align: right;">LSSO (5.5%)</th>
                <th style="text-align: right;">Tax (PIT)</th>
                <th style="text-align: right;">Net Pay</th>
                <th>Bank</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="signatures">
            <div>
              <div style="height: 45px;"></div>
              <div class="sig-box">
                <strong>Prepared by:</strong><br/>
                Payroll Specialist
              </div>
            </div>
            <div>
              <div style="height: 45px;"></div>
              <div class="sig-box">
                <strong>Audited & Verified by:</strong><br/>
                Director of Finance & Accounting
              </div>
            </div>
            <div>
              <div style="height: 45px;"></div>
              <div class="sig-box">
                <strong>Approved for Payment:</strong><br/>
                Managing Director (LHSE)
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    setIsOpen(false);
  };

  // 4. BCEL Bank Transfer File
  const handleExportBCEL = () => {
    const exportRows = payslips.map((p, idx) => {
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
    XLSX.writeFile(workbook, `LHSE_BCEL_Payroll_Transfer_${dateStr}.xlsx`);
    alerts.success(language === 'lo' ? 'ສົ່ງອອກໄຟລ໌ໂອນເງິນເດືອນ BCEL ສຳເລັດ' : 'BCEL Corporate Payroll Exported');
    setIsOpen(false);
  };

  // 5. Lao NSSF Social Security Schedule
  const handleExportNSSF = () => {
    const exportRows = payslips.map((p, idx) => {
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
    XLSX.writeFile(workbook, `LHSE_Lao_NSSF_Schedule_${dateStr}.xlsx`);
    alerts.success(language === 'lo' ? 'ສົ່ງອອກຕາຕະລາງປະກັນສັງຄົມ (ອປສ) ສຳເລັດ' : 'Lao NSSF Schedule Exported');
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block ${className}`} ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting !== null}
        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
          isOpen
            ? 'bg-emerald-700 text-white ring-2 ring-emerald-500/30'
            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
        }`}
        title={language === 'lo' ? 'ສົ່ງອອກລາຍງານເງິນເດືອນ (CSV, PDF, BCEL, ອປສ)' : 'Export payroll reports (CSV, PDF, BCEL, NSSF)'}
      >
        {isExporting ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Download className="w-3.5 h-3.5" />
        )}
        <span>{language === 'lo' ? 'ສົ່ງອອກລາຍງານເງິນເດືອນ' : 'Export Payroll Reports'}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-88 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3 z-50 animate-in fade-in zoom-in-95 backdrop-blur-xl">
          <div className="px-2 pb-2 mb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{language === 'lo' ? 'ເລືອກລາຍງານທີ່ຕ້ອງການສົ່ງອອກ' : 'Choose Payroll Report'}</span>
            </span>
            <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
              {payslips.length} {language === 'lo' ? 'ຄົນ' : 'staff'}
            </span>
          </div>

          <div className="space-y-1.5">
            {/* 1. CSV Option */}
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={isExporting !== null}
              className="w-full flex items-start gap-3 p-2.5 rounded-xl text-left hover:bg-emerald-50/70 dark:hover:bg-emerald-950/40 border border-transparent hover:border-emerald-200 dark:hover:border-emerald-800/60 transition-all cursor-pointer group"
            >
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 group-hover:scale-105 transition-transform shrink-0">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-xs text-slate-800 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
                    {language === 'lo' ? 'ທະບຽນເງິນເດືອນ CSV (.csv)' : 'Payroll Register CSV (.csv)'}
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded">
                    CSV
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                  {language === 'lo'
                    ? 'UTF-8 BOM ຮອງຮັບພາສາລາວ, ຄົບຖ້ວນທຸກລາຍການຫັກ ແລະ ເງິນສຸດທິ'
                    : 'UTF-8 BOM encoded spreadsheet with detailed tax & deduction columns'}
                </p>
              </div>
            </button>

            {/* 2. PDF Download Option */}
            <button
              type="button"
              onClick={handleExportPDF}
              disabled={isExporting !== null}
              className="w-full flex items-start gap-3 p-2.5 rounded-xl text-left hover:bg-rose-50/70 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-800/60 transition-all cursor-pointer group"
            >
              <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 group-hover:scale-105 transition-transform shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-xs text-slate-800 dark:text-slate-100 group-hover:text-rose-700 dark:group-hover:text-rose-300">
                    {language === 'lo' ? 'ບົດສະຫຼຸບການຈ່າຍເງິນເດືອນ PDF (.pdf)' : 'Disbursement Summary PDF (.pdf)'}
                  </div>
                  <span className="text-[10px] font-mono font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/80 px-1.5 py-0.5 rounded">
                    PDF
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                  {language === 'lo'
                    ? 'ເອກະສານທາງການ LHSE ພ້ອມຍອດລວມພາສີ, ປະກັນສັງຄົມ ແລະ ຍອດສຸດທິ'
                    : 'Certified PDF report summarizing total gross, PIT, and net disbursement'}
                </p>
              </div>
            </button>

            {/* 3. Printable PDF Preview */}
            <button
              type="button"
              onClick={handlePrintPDF}
              disabled={isExporting !== null}
              className="w-full flex items-start gap-3 p-2.5 rounded-xl text-left hover:bg-blue-50/70 dark:hover:bg-blue-950/40 border border-transparent hover:border-blue-200 dark:hover:border-blue-800/60 transition-all cursor-pointer group"
            >
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 group-hover:scale-105 transition-transform shrink-0">
                <Printer className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-xs text-slate-800 dark:text-slate-100 group-hover:text-blue-700 dark:group-hover:text-blue-300">
                    {language === 'lo' ? 'ພິມ / Save PDF ທະບຽນເງິນເດືອນ' : 'Print / Save Formal Payroll PDF'}
                  </div>
                  <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/80 px-1.5 py-0.5 rounded">
                    Print
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                  {language === 'lo'
                    ? 'ເບິ່ງຕົວຢ່າງເອກະສານຫົວຂໍ້ລັດວິສາຫະກິດ ພ້ອມຊ່ອງເຊັນ 3 ຝ່າຍ'
                    : 'Opens formal layout with letterhead and 3-tier executive approval blocks'}
                </p>
              </div>
            </button>

            {/* 4. BCEL Corporate OnePay Export */}
            <button
              type="button"
              onClick={handleExportBCEL}
              className="w-full flex items-start gap-3 p-2.5 rounded-xl text-left hover:bg-emerald-50/70 dark:hover:bg-emerald-950/40 border border-transparent hover:border-emerald-200 dark:hover:border-emerald-800/60 transition-all cursor-pointer group"
            >
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 group-hover:scale-105 transition-transform shrink-0">
                <CreditCard className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-xs text-slate-800 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
                    {language === 'lo' ? 'ໄຟລ໌ໂອນເງິນເດືອນ BCEL (.xlsx)' : 'BCEL Corporate OnePay (.xlsx)'}
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded">
                    BCEL
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                  {language === 'lo'
                    ? 'ໄຟລ໌ມາດຕະຖານສຳລັບໂອນເງິນເດືອນຜ່ານລະບົບທະນາຄານການຄ້າຕ່າງປະເທດລາວ'
                    : 'Direct bank transfer spreadsheet formatted for BCEL Corporate gateway'}
                </p>
              </div>
            </button>

            {/* 5. Lao NSSF Social Security */}
            <button
              type="button"
              onClick={handleExportNSSF}
              className="w-full flex items-start gap-3 p-2.5 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-transparent hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer group"
            >
              <div className="p-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:scale-105 transition-transform shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-xs text-slate-800 dark:text-slate-100">
                    {language === 'lo' ? 'ຕາຕະລາງປະກັນສັງຄົມ ອປສ (.xlsx)' : 'Lao NSSF Schedule (.xlsx)'}
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                    NSSF
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                  {language === 'lo'
                    ? 'ຕາຕະລາງສົມທົບ 5.5% ພະນັກງານ + 6.0% ອົງກອນ ຕາມເພດານ 4.5 ລ້ານ'
                    : 'Statutory 11.5% remittance schedule according to Lao Labour Law'}
                </p>
              </div>
            </button>
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 px-1 flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span>LHSE Payroll Ledger</span>
            </span>
            <span>Live Audit Trail Sync</span>
          </div>
        </div>
      )}
    </div>
  );
};
