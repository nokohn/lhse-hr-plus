import React, { useRef, useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { Payslip, Employee, Department } from '../../types/index.ts';
import { Modal } from '../common/Modal.tsx';
import { alerts } from '../../utils/alerts.ts';
import { jsPDF } from 'jspdf';
import {
  FileText,
  Printer,
  Download,
  Building2,
  Calendar,
  CheckCircle2,
  Users,
  ShieldCheck,
  Percent,
  Banknote,
  Loader2,
  Eye,
  Sparkles,
} from 'lucide-react';

interface PayrollPdfReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  filteredPayslips: Payslip[];
  selectedPeriodCode?: string;
  selectedDeptName?: string;
  searchTerm?: string;
}

export const PayrollPdfReportModal: React.FC<PayrollPdfReportModalProps> = ({
  isOpen,
  onClose,
  filteredPayslips,
  selectedPeriodCode = 'All Active Periods',
  selectedDeptName = 'All Departments',
  searchTerm = '',
}) => {
  const { language, employees, departments, currentUser } = useApp();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const printableAreaRef = useRef<HTMLDivElement>(null);

  const dateStr = new Date().toISOString().split('T')[0];
  const timeStr = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  // Financial aggregates of currently filtered view
  const totalGross = filteredPayslips.reduce((acc, p) => acc + p.grossSalary, 0);
  const totalBase = filteredPayslips.reduce((acc, p) => acc + p.baseSalary, 0);
  const totalTax = filteredPayslips.reduce((acc, p) => acc + p.personalIncomeTax, 0);
  const totalLSSOEmployee = filteredPayslips.reduce((acc, p) => acc + p.socialSecurityEmployee, 0);
  const totalLSSOEmployer = filteredPayslips.reduce((acc, p) => acc + p.socialSecurityEmployer, 0);
  const totalNet = filteredPayslips.reduce((acc, p) => acc + p.netPay, 0);

  // Trigger Native Print (in-page print friendly, avoiding window.open popup block)
  const handlePrint = () => {
    // Inject print-only style tag temporarily if needed, then call window.print()
    window.print();
  };

  // Direct PDF Download with jsPDF
  const handleDownloadPdfFile = async () => {
    try {
      setIsGeneratingPdf(true);
      await new Promise((r) => setTimeout(r, 400));

      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'pt',
        format: 'a4',
      });

      // PDF Dimensions
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 35;

      // Header Banner (Navy LHSE Brand)
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, pageWidth, 55, 'F');

      // Header Text
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('LAO HOLDING STATE ENTERPRISE (LHSE)', margin, 24);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(147, 197, 253); // blue-300
      doc.text(
        'OFFICIAL STATE ENTERPRISE PAYROLL DISBURSEMENT REPORT & SALARY REGISTER',
        margin,
        40
      );

      doc.setFontSize(8);
      doc.setTextColor(203, 213, 225);
      doc.text(
        `Generated: ${dateStr} ${timeStr} | Operator: ${currentUser.fullName} (${currentUser.role})`,
        pageWidth - margin,
        40,
        { align: 'right' }
      );

      // Metadata & Filter Badges Banner
      doc.setFillColor(241, 245, 249); // slate-100
      doc.rect(margin, 65, pageWidth - margin * 2, 38, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.rect(margin, 65, pageWidth - margin * 2, 38, 'S');

      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(`Period: ${selectedPeriodCode}`, margin + 12, 80);
      doc.text(`Department: ${selectedDeptName}`, margin + 180, 80);
      doc.text(`Headcount: ${filteredPayslips.length} Persons`, margin + 380, 80);
      doc.text(`Doc Ref: LHSE-PR-${dateStr.replace(/-/g, '')}`, pageWidth - margin - 12, 80, {
        align: 'right',
      });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Search Filter: ${searchTerm ? `"${searchTerm}"` : 'None (Full Ledger)'} | Currency: Lao Kip (LAK)`,
        margin + 12,
        94
      );

      // Financial Summary Boxes (KPI Cards)
      const cardWidth = (pageWidth - margin * 2 - 30) / 4;
      const cardY = 112;
      const cardHeight = 44;

      const summaryCards = [
        { label: 'TOTAL GROSS SALARY', val: `${totalGross.toLocaleString()} LAK`, col: [30, 58, 138] },
        { label: 'SOCIAL SECURITY (LSSO 5.5%)', val: `-${totalLSSOEmployee.toLocaleString()} LAK`, col: [180, 83, 9] },
        { label: 'PERSONAL INCOME TAX (PIT)', val: `-${totalTax.toLocaleString()} LAK`, col: [190, 18, 60] },
        { label: 'TOTAL NET SALARY DISBURSED', val: `${totalNet.toLocaleString()} LAK`, col: [4, 120, 87] },
      ];

      summaryCards.forEach((c, idx) => {
        const cx = margin + idx * (cardWidth + 10);
        doc.setFillColor(248, 250, 252);
        doc.rect(cx, cardY, cardWidth, cardHeight, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.rect(cx, cardY, cardWidth, cardHeight, 'S');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text(c.label, cx + 8, cardY + 14);

        doc.setFontSize(11);
        doc.setTextColor(c.col[0], c.col[1], c.col[2]);
        doc.text(c.val, cx + 8, cardY + 32);
      });

      // Employee Table Header
      const tableY = 168;
      const colDefs = [
        { header: 'No.', x: margin, w: 25, align: 'center' as const },
        { header: 'CODE', x: margin + 25, w: 60, align: 'left' as const },
        { header: 'STAFF NAME (ENGLISH / LAO)', x: margin + 85, w: 160, align: 'left' as const },
        { header: 'DEPARTMENT', x: margin + 245, w: 120, align: 'left' as const },
        { header: 'BASE PAY', x: margin + 365, w: 75, align: 'right' as const },
        { header: 'GROSS PAY', x: margin + 440, w: 80, align: 'right' as const },
        { header: 'LSSO 5.5%', x: margin + 520, w: 70, align: 'right' as const },
        { header: 'TAX (PIT)', x: margin + 590, w: 65, align: 'right' as const },
        { header: 'NET PAY (LAK)', x: margin + 655, w: 90, align: 'right' as const },
      ];

      // Table Header Row Background
      doc.setFillColor(30, 41, 59);
      doc.rect(margin, tableY, pageWidth - margin * 2, 20, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);

      colDefs.forEach((col) => {
        const tx = col.align === 'right' ? col.x + col.w : col.align === 'center' ? col.x + col.w / 2 : col.x + 4;
        doc.text(col.header, tx, tableY + 13, { align: col.align });
      });

      // Table Rows
      let rowY = tableY + 20;
      const rowHeight = 20;

      filteredPayslips.forEach((p, idx) => {
        // Page overflow check
        if (rowY + rowHeight > pageHeight - 80) {
          doc.addPage('a4', 'landscape');
          rowY = 40;
        }

        const emp = employees.find((e) => e.id === p.employeeId);
        const dept = departments.find((d) => d.id === emp?.departmentId);

        // Zebra striping
        if (idx % 2 === 0) {
          doc.setFillColor(255, 255, 255);
        } else {
          doc.setFillColor(248, 250, 252);
        }
        doc.rect(margin, rowY, pageWidth - margin * 2, rowHeight, 'F');

        // Bottom border
        doc.setDrawColor(241, 245, 249);
        doc.line(margin, rowY + rowHeight, pageWidth - margin, rowY + rowHeight);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(51, 65, 85);

        // No
        doc.text(String(idx + 1), margin + 12.5, rowY + 13, { align: 'center' });

        // Code
        doc.setFont('courier', 'bold');
        doc.setTextColor(37, 99, 235);
        doc.text(emp?.employeeCode || p.employeeId, margin + 29, rowY + 13);

        // Name
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        const nameStr = emp ? `${emp.firstNameEn} ${emp.lastNameEn}` : p.employeeId;
        doc.text(nameStr.slice(0, 28), margin + 89, rowY + 13);

        // Dept
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text((dept?.nameEn || 'Operations').slice(0, 22), margin + 249, rowY + 13);

        // Base Pay
        doc.setFont('courier', 'normal');
        doc.text(p.baseSalary.toLocaleString(), margin + 365 + 75, rowY + 13, { align: 'right' });

        // Gross Pay
        doc.setFont('courier', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(p.grossSalary.toLocaleString(), margin + 440 + 80, rowY + 13, { align: 'right' });

        // LSSO
        doc.setTextColor(217, 119, 6);
        doc.text(`-${p.socialSecurityEmployee.toLocaleString()}`, margin + 520 + 70, rowY + 13, {
          align: 'right',
        });

        // Tax
        doc.setTextColor(220, 38, 38);
        doc.text(`-${p.personalIncomeTax.toLocaleString()}`, margin + 590 + 65, rowY + 13, {
          align: 'right',
        });

        // Net Pay
        doc.setFont('courier', 'bold');
        doc.setTextColor(5, 150, 105);
        doc.text(`${p.netPay.toLocaleString()}`, margin + 655 + 90, rowY + 13, { align: 'right' });

        rowY += rowHeight;
      });

      // Totals Footer Row
      doc.setFillColor(241, 245, 249);
      doc.rect(margin, rowY, pageWidth - margin * 2, 22, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.rect(margin, rowY, pageWidth - margin * 2, 22, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`LEDGER TOTAL (${filteredPayslips.length} Persons):`, margin + 25, rowY + 14);

      doc.setFont('courier', 'bold');
      doc.text(totalGross.toLocaleString(), margin + 440 + 80, rowY + 14, { align: 'right' });
      doc.setTextColor(217, 119, 6);
      doc.text(`-${totalLSSOEmployee.toLocaleString()}`, margin + 520 + 70, rowY + 14, { align: 'right' });
      doc.setTextColor(220, 38, 38);
      doc.text(`-${totalTax.toLocaleString()}`, margin + 590 + 65, rowY + 14, { align: 'right' });
      doc.setTextColor(5, 150, 105);
      doc.text(`${totalNet.toLocaleString()} LAK`, margin + 655 + 90, rowY + 14, { align: 'right' });

      // Signatures Block at Bottom
      const sigY = Math.max(rowY + 35, pageHeight - 75);
      if (sigY + 50 <= pageHeight) {
        const sigWidth = (pageWidth - margin * 2) / 3;

        // Sig 1
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        doc.text('Prepared by: HR & Payroll Officer', margin + 15, sigY);
        doc.line(margin + 15, sigY + 28, margin + sigWidth - 25, sigY + 28);
        doc.setFontSize(6.5);
        doc.text('Date: ____ / ____ / 2026', margin + 15, sigY + 38);

        // Sig 2
        doc.setFontSize(7.5);
        doc.text('Verified by: Head of Finance & Accounting', margin + sigWidth + 15, sigY);
        doc.line(margin + sigWidth + 15, sigY + 28, margin + sigWidth * 2 - 25, sigY + 28);
        doc.setFontSize(6.5);
        doc.text('Date: ____ / ____ / 2026', margin + sigWidth + 15, sigY + 38);

        // Sig 3
        doc.setFontSize(7.5);
        doc.text('Approved by: Managing Director (LHSE)', margin + sigWidth * 2 + 15, sigY);
        doc.line(margin + sigWidth * 2 + 15, sigY + 28, margin + sigWidth * 3 - 25, sigY + 28);
        doc.setFontSize(6.5);
        doc.text('Date: ____ / ____ / 2026 [Official Seal]', margin + sigWidth * 2 + 15, sigY + 38);
      }

      // Save PDF file
      const filename = `LHSE_Payroll_Report_${dateStr}.pdf`;
      doc.save(filename);

      alerts.success(
        language === 'lo' ? 'ດາວໂຫຼດ PDF ສຳເລັດ' : 'PDF Report Downloaded',
        language === 'lo'
          ? `ໄຟລ໌ ${filename} ໄດ້ຖືກດາວໂຫຼດລົງໃນເຄື່ອງແລ້ວ.`
          : `Official PDF report ${filename} successfully exported.`
      );
    } catch (err) {
      alerts.error(language === 'lo' ? 'ເກີດຂໍ້ຜິດພາດ' : 'Export Failed', String(err));
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        language === 'lo'
          ? 'ລາຍງານເງິນເດືອນລັດວິສາຫະກິດ (Print-Friendly PDF Export)'
          : 'Official Payroll Disbursement PDF Report'
      }
      subtitle={
        language === 'lo'
          ? `ສະແດງຕົວຢ່າງເອກະສານຕາມມາດຕະຖານລັດວິສາຫະກິດຖືຮຸ້ນລາວ (LHSE) • ຂໍ້ມູນທີ່ກັ່ນຕອງ: ${filteredPayslips.length} ລາຍການ`
          : `State Enterprise Print-Ready Document • Filtered View: ${filteredPayslips.length} Employees`
      }
      maxWidth="2xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>
              {language === 'lo'
                ? 'ເອກະສານທາງລັດຖະການ ພ້ອມລາຍເຊັນ ແລະ ກາປະທັບ'
                : 'Official Enterprise Document with State Approval Blocks'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
            >
              {language === 'lo' ? 'ປິດ' : 'Close'}
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white flex items-center gap-1.5 shadow-xs transition-colors"
              title="Print document or save using browser print dialog"
            >
              <Printer className="w-3.5 h-3.5 text-slate-300" />
              <span>{language === 'lo' ? 'ສັ່ງພິມ / Save as PDF' : 'Print / Save as PDF'}</span>
            </button>

            <button
              onClick={handleDownloadPdfFile}
              disabled={isGeneratingPdf}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 shadow-sm transition-transform active:scale-95 disabled:opacity-50"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{language === 'lo' ? 'ກຳລັງສ້າງ PDF...' : 'Generating PDF...'}</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>{language === 'lo' ? 'ດາວໂຫຼດ PDF (.pdf)' : 'Download PDF (.pdf)'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Print-Friendly Preview Container */}
        <div
          ref={printableAreaRef}
          id="lhse-printable-payroll-report"
          className="bg-white text-slate-900 p-6 rounded-2xl border border-slate-300 shadow-inner space-y-5 print:p-0 print:border-none print:shadow-none"
        >
          {/* Official Letterhead */}
          <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1">
            <div className="text-[11px] font-bold tracking-widest text-slate-700">
              ສາທາລະນະລັດ ປະຊາທິປະໄຕ ປະຊາຊົນລາວ
            </div>
            <div className="text-[10px] text-slate-600 tracking-wider">
              ສັນຕິພາບ ເອກະລາດ ປະຊາທິປະໄຕ ເອກະພາບ ວັດທະນາຖາວອນ
            </div>
            <div className="text-xs font-black tracking-wider text-slate-400">---=== 000 ===---</div>

            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between text-left">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-white p-0.5 border border-slate-200 shadow-sm shrink-0 flex items-center justify-center">
                  <img
                    src="/assets/aistudio/______________________95dd5853.png"
                    alt="LHSE Logo"
                    className="w-full h-full object-contain rounded-full"
                  />
                </div>
                <div>
                  <div className="text-base font-black text-slate-900 tracking-tight">
                    ລັດວິສາຫະກິດຖືຮຸ້ນລາວ (LHSE)
                  </div>
                  <div className="text-xs font-bold text-blue-900">
                    LAO HOLDING STATE ENTERPRISE
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    ກະຊວງອຸດສາກະກຳ ແລະ ການຄ້າ • Ministry of Industry and Commerce
                  </div>
                </div>
              </div>

              <div className="text-right text-[10px] text-slate-500 mt-2 sm:mt-0 font-mono">
                <div>Doc Ref: LHSE-FIN/PR-{dateStr.slice(0, 7)}</div>
                <div>Date: {dateStr}</div>
                <div>Status: CERTIFIED FOR DISBURSEMENT</div>
              </div>
            </div>
          </div>

          {/* Report Title */}
          <div className="text-center space-y-1 pt-1">
            <h3 className="text-base font-black uppercase text-slate-900">
              {language === 'lo'
                ? 'ໃບລາຍງານການເບີກຈ່າຍເງິນເດືອນ ແລະ ພັນທະອາກອນລັດ'
                : 'OFFICIAL PAYROLL DISBURSEMENT REPORT & SALARY REGISTER'}
            </h3>
            <p className="text-xs text-slate-600 font-medium">
              {language === 'lo'
                ? `ຮອບຈ່າຍເງິນ: ${selectedPeriodCode} • ພະແນກ: ${selectedDeptName} • ຈຳນວນ: ${filteredPayslips.length} ທ່ານ`
                : `Period: ${selectedPeriodCode} • Department: ${selectedDeptName} • Headcount: ${filteredPayslips.length} Employees`}
            </p>
          </div>

          {/* Financial Executive Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">
                {language === 'lo' ? 'ເງິນເດືອນລວມ (Gross)' : 'Total Gross Pay'}
              </span>
              <span className="text-sm font-black text-slate-900 font-mono">
                {totalGross.toLocaleString()}
              </span>
              <span className="text-[9px] text-slate-400 block">LAK</span>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200">
              <span className="text-[10px] text-amber-700 uppercase font-bold block">
                {language === 'lo' ? 'ປະກັນສັງຄົມ (LSSO 5.5%)' : 'Total Social Security'}
              </span>
              <span className="text-sm font-black text-amber-700 font-mono">
                -{totalLSSOEmployee.toLocaleString()}
              </span>
              <span className="text-[9px] text-amber-600 block">LAK</span>
            </div>

            <div className="p-2.5 rounded-xl bg-rose-50/60 border border-rose-200">
              <span className="text-[10px] text-rose-700 uppercase font-bold block">
                {language === 'lo' ? 'ອາກອນລາຍໄດ້ (PIT)' : 'Total Income Tax'}
              </span>
              <span className="text-sm font-black text-rose-700 font-mono">
                -{totalTax.toLocaleString()}
              </span>
              <span className="text-[9px] text-rose-600 block">LAK</span>
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-300">
              <span className="text-[10px] text-emerald-800 uppercase font-bold block">
                {language === 'lo' ? 'ຍອດຈ່າຍສຸດທິ (Net Disbursed)' : 'Total Net Pay'}
              </span>
              <span className="text-sm font-black text-emerald-700 font-mono">
                {totalNet.toLocaleString()}
              </span>
              <span className="text-[9px] text-emerald-600 block">LAK</span>
            </div>
          </div>

          {/* Filtered Payslips Roster Table */}
          <div className="overflow-x-auto max-h-72 rounded-xl border border-slate-300">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase text-[9px] sticky top-0">
                <tr>
                  <th className="py-2 px-2 text-center w-8">#</th>
                  <th className="py-2 px-2.5">
                    {language === 'lo' ? 'ລະຫັດ & ຊື່ພະນັກງານ' : 'Staff Code & Name'}
                  </th>
                  <th className="py-2 px-2 text-right">
                    {language === 'lo' ? 'ເງິນເດືອນພື້ນຖານ' : 'Base Pay'}
                  </th>
                  <th className="py-2 px-2 text-right">
                    {language === 'lo' ? 'ເງິນລວມ' : 'Gross Pay'}
                  </th>
                  <th className="py-2 px-2 text-right">LSSO 5.5%</th>
                  <th className="py-2 px-2 text-right">Tax (PIT)</th>
                  <th className="py-2 px-2.5 text-right font-black">
                    {language === 'lo' ? 'ສຸດທິ (Net Pay)' : 'Net Pay (LAK)'}
                  </th>
                  <th className="py-2 px-2">
                    {language === 'lo' ? 'ທະນາຄານ / ບັນຊີ' : 'Bank Account'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredPayslips.map((p, idx) => {
                  const emp = employees.find((e) => e.id === p.employeeId);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-1.5 px-2 text-center text-slate-400 font-mono text-[10px]">
                        {idx + 1}
                      </td>
                      <td className="py-1.5 px-2.5">
                        <div className="font-bold text-slate-900">
                          {emp ? `${emp.firstNameEn} ${emp.lastNameEn}` : p.employeeId}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {emp?.employeeCode} • {emp ? `${emp.firstNameLao} ${emp.lastNameLao}` : ''}
                        </div>
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono text-slate-600">
                        {p.baseSalary.toLocaleString()}
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono font-bold text-slate-900">
                        {p.grossSalary.toLocaleString()}
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono text-amber-700">
                        -{p.socialSecurityEmployee.toLocaleString()}
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono text-rose-700">
                        -{p.personalIncomeTax.toLocaleString()}
                      </td>
                      <td className="py-1.5 px-2.5 text-right font-mono font-black text-emerald-700">
                        {p.netPay.toLocaleString()}
                      </td>
                      <td className="py-1.5 px-2 text-[10px] text-slate-500 font-mono">
                        {emp?.bankName || 'BCEL'} • {emp?.bankAccountNumber?.slice(-6) || '******'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-[10px]">
                <tr>
                  <td colSpan={2} className="py-2 px-2.5 text-slate-900 uppercase">
                    Total ({filteredPayslips.length} Persons):
                  </td>
                  <td className="py-2 px-2 text-right font-mono">{totalBase.toLocaleString()}</td>
                  <td className="py-2 px-2 text-right font-mono">{totalGross.toLocaleString()}</td>
                  <td className="py-2 px-2 text-right font-mono text-amber-700">
                    -{totalLSSOEmployee.toLocaleString()}
                  </td>
                  <td className="py-2 px-2 text-right font-mono text-rose-700">
                    -{totalTax.toLocaleString()}
                  </td>
                  <td className="py-2 px-2.5 text-right font-mono text-emerald-800 text-xs">
                    {totalNet.toLocaleString()} LAK
                  </td>
                  <td className="py-2 px-2 text-slate-400">---</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Legal Signatures Section */}
          <div className="pt-4 border-t border-slate-300 grid grid-cols-3 gap-6 text-center text-xs">
            <div className="space-y-10">
              <div className="font-bold text-slate-700">
                {language === 'lo' ? 'ຜູ້ສັງລວມເງິນເດືອນ' : 'Prepared By:'}
                <div className="text-[10px] font-normal text-slate-500">
                  {currentUser.fullName} (HR Officer)
                </div>
              </div>
              <div className="border-t border-slate-400 pt-1 text-[10px] text-slate-500">
                ລາຍເຊັນ / Signature & Date
              </div>
            </div>

            <div className="space-y-10">
              <div className="font-bold text-slate-700">
                {language === 'lo' ? 'ຫົວໜ້າພະແນກການເງິນ' : 'Verified By:'}
                <div className="text-[10px] font-normal text-slate-500">
                  Head of Finance & Accounting
                </div>
              </div>
              <div className="border-t border-slate-400 pt-1 text-[10px] text-slate-500">
                ລາຍເຊັນ / Signature & Date
              </div>
            </div>

            <div className="space-y-10">
              <div className="font-bold text-slate-700">
                {language === 'lo' ? 'ຜູ້ອຳນວຍການໃຫຍ່ (LHSE)' : 'Approved By:'}
                <div className="text-[10px] font-normal text-slate-500">
                  Managing Director (LHSE)
                </div>
              </div>
              <div className="border-t border-slate-400 pt-1 text-[10px] text-slate-500">
                ກາປະທັບ & ລາຍເຊັນ / Official Seal
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
