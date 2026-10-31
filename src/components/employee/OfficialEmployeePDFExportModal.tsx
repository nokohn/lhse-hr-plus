import React, { useState, useRef } from 'react';
import { Modal } from '../common/Modal.tsx';
import { QRCodeDisplay } from '../common/QRCodeDisplay.tsx';
import { Employee, Department, Position } from '../../types/index.ts';
import { alerts } from '../../utils/alerts.ts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  FileText,
  Printer,
  Download,
  Award,
  CheckCircle2,
  Building2,
  UserCheck,
  QrCode,
  Eye,
  ShieldCheck,
  Calendar,
  Briefcase,
  Layers,
  Settings2,
  FileCheck,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export type PDFTemplateType = 'DOSSIER_21_COLUMNS' | 'EMPLOYMENT_CERTIFICATE' | 'EXECUTIVE_ID_CARD';

interface OfficialEmployeePDFExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  departments: Department[];
  positions: Position[];
  defaultLanguage?: 'lo' | 'en';
}

export const OfficialEmployeePDFExportModal: React.FC<OfficialEmployeePDFExportModalProps> = ({
  isOpen,
  onClose,
  employee,
  departments,
  positions,
  defaultLanguage = 'lo',
}) => {
  const [templateType, setTemplateType] = useState<PDFTemplateType>('DOSSIER_21_COLUMNS');
  const [docLanguage, setDocLanguage] = useState<'lo' | 'en' | 'bilingual'>('bilingual');
  const [includeSignatures, setIncludeSignatures] = useState(true);
  const [includeOfficialSeal, setIncludeOfficialSeal] = useState(true);
  const [includeSalary, setIncludeSalary] = useState(false);
  const [certificatePurpose, setCertificatePurpose] = useState('Official Certification / ເພື່ອຢັ້ງຢືນການເຮັດວຽກ');
  const [docRefNumber, setDocRefNumber] = useState(`LHSE/HR-${new Date().getFullYear()}/${String(Math.floor(Math.random() * 900) + 100)}`);
  const [isExporting, setIsExporting] = useState(false);

  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!employee) return null;

  const department = departments.find((d) => d.id === employee.departmentId);
  const position = positions.find((p) => p.id === employee.positionId);
  const issueDateLao = new Date().toLocaleDateString('lo-LA', { year: 'numeric', month: 'long', day: 'numeric' });
  const issueDateEn = new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });

  // Verification URL or data payload for QR code
  const verificationPayload = JSON.stringify({
    org: 'Lao Holding State Enterprise (LHSE)',
    docType: templateType,
    ref: docRefNumber,
    code: employee.employeeCode,
    name: `${employee.firstNameLao} ${employee.lastNameLao}`,
    issued: new Date().toISOString().split('T')[0],
    securityCheck: 'VERIFIED_LHSE_AUTHENTIC',
  });

  // Handle Download PDF using html2canvas and jsPDF
  const handleDownloadPDF = async () => {
    if (!printAreaRef.current) return;
    setIsExporting(true);

    try {
      alerts.info(
        docLanguage === 'lo' ? 'ກຳລັງສ້າງເອກະສານ PDF' : 'Generating PDF',
        docLanguage === 'lo' ? 'ກະລຸນາລໍຖ້າສັກຄູ່ ລະບົບກຳລັງປະມວນຜົນຮູບແບບຄວາມລະອຽດສູງ...' : 'Rendering high-resolution official document...'
      );

      const canvas = await html2canvas(printAreaRef.current, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1024,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, Math.min(pdfHeight, 297));

      const templateNameSlug =
        templateType === 'DOSSIER_21_COLUMNS'
          ? 'LHSE_Dossier_21Cols'
          : templateType === 'EMPLOYMENT_CERTIFICATE'
          ? 'LHSE_Employment_Certificate'
          : 'LHSE_Executive_ID';

      const fileName = `${templateNameSlug}_${employee.employeeCode}_${employee.firstNameEn || 'Employee'}.pdf`;
      pdf.save(fileName);

      alerts.success(
        docLanguage === 'lo' ? 'ດາວໂຫຼດ PDF ສຳເລັດ' : 'PDF Exported Successfully',
        fileName
      );
    } catch (err: any) {
      console.error('PDF Export Error:', err);
      alerts.error(
        docLanguage === 'lo' ? 'ບໍ່ສາມາດສ້າງ PDF ໄດ້' : 'PDF Export Failed',
        err.message || 'Error capturing DOM element'
      );
    } finally {
      setIsExporting(false);
    }
  };

  // Handle Native High-Fidelity Browser Print
  const handleNativePrint = () => {
    if (!printAreaRef.current) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alerts.warning(
        'Pop-up Blocked',
        docLanguage === 'lo' ? 'ກະລຸນາເປີດອະນຸຍາດ Pop-up ເພື່ອພິມເອກະສານ' : 'Please allow pop-ups to open print dialog.'
      );
      return;
    }

    const contentHtml = printAreaRef.current.innerHTML;

    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${employee.employeeCode} - ${employee.firstNameLao} ${employee.lastNameLao} - Official LHSE PDF</title>
          <meta charset="utf-8" />
          <style>
            @media print {
              @page {
                size: A4 portrait;
                margin: 8mm 10mm;
              }
              body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                margin: 0;
                padding: 0;
                background: white;
                color: #0f172a;
              }
              .no-print {
                display: none !important;
              }
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Lao", "Phetsarath OT", sans-serif;
              color: #0f172a;
              margin: 0;
              padding: 20px;
              background: #f8fafc;
            }
            .print-container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
              padding: 24px;
              box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
            }
            .toolbar {
              max-width: 800px;
              margin: 0 auto 16px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              background: #1e3a8a;
              color: white;
              padding: 12px 20px;
              border-radius: 12px;
            }
            button {
              cursor: pointer;
              font-weight: bold;
              padding: 8px 16px;
              border-radius: 8px;
              border: none;
            }
            .btn-print {
              background: #10b981;
              color: white;
            }
            .btn-close {
              background: #475569;
              color: white;
            }
          </style>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body>
          <div class="toolbar no-print">
            <div>
              <strong>LHSE Official Document</strong> — Ready to Print or Save as PDF
            </div>
            <div style="display: flex; gap: 8px;">
              <button class="btn-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
              <button class="btn-close" onclick="window.close()">Close</button>
            </div>
          </div>
          <div class="print-container">
            ${contentHtml}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300 flex items-center justify-center">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <div className="text-base font-bold text-slate-900 dark:text-slate-100">
              {docLanguage === 'lo' ? 'ສົ່ງອອກເອກະສານພະນັກງານ LHSE ເປັນ PDF' : 'Official LHSE Employee PDF Export'}
            </div>
            <div className="text-xs text-slate-400 font-normal">
              {employee.employeeCode} • {employee.firstNameLao} {employee.lastNameLao} ({employee.firstNameEn} {employee.lastNameEn})
            </div>
          </div>
        </div>
      }
      maxWidth="4xl"
      footer={
        <div className="flex flex-wrap items-center justify-between w-full gap-3">
          <div className="text-xs text-slate-500 font-mono">
            REF: <strong className="text-blue-600 dark:text-blue-400">{docRefNumber}</strong>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400"
            >
              {docLanguage === 'lo' ? 'ຍົກເລີກ' : 'Close'}
            </button>
            <button
              type="button"
              onClick={handleNativePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-700 hover:bg-slate-600 text-white shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{docLanguage === 'lo' ? 'ພິມ / Save as PDF' : 'Print / Save PDF'}</span>
            </button>
            <button
              type="button"
              disabled={isExporting}
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 text-white shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? (docLanguage === 'lo' ? 'ກຳລັງສ້າງ...' : 'Exporting...') : (docLanguage === 'lo' ? 'ດາວໂຫຼດໄຟລ໌ PDF' : 'Download PDF')}</span>
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Template Selector & Options Ribbon */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
          {/* Template 1 */}
          <button
            type="button"
            onClick={() => setTemplateType('DOSSIER_21_COLUMNS')}
            className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
              templateType === 'DOSSIER_21_COLUMNS'
                ? 'bg-blue-50/80 border-blue-500 text-blue-900 dark:bg-blue-950/40 dark:border-blue-500 dark:text-blue-200 shadow-xs'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-xs flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>1. ຊີວະປະຫວັດ 21 ຄໍລຳ</span>
              </span>
              {templateType === 'DOSSIER_21_COLUMNS' && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
              ແບບຟອມຊີວະປະຫວັດພະນັກງານ-ລັດຖະກອນມາດຕະຖານ 21 ຄໍລຳ LHSE ຄົບຖ້ວນ
            </p>
          </button>

          {/* Template 2 */}
          <button
            type="button"
            onClick={() => setTemplateType('EMPLOYMENT_CERTIFICATE')}
            className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
              templateType === 'EMPLOYMENT_CERTIFICATE'
                ? 'bg-blue-50/80 border-blue-500 text-blue-900 dark:bg-blue-950/40 dark:border-blue-500 dark:text-blue-200 shadow-xs'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-xs flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>2. ໃບຢັ້ງຢືນການເປັນພະນັກງານ</span>
              </span>
              {templateType === 'EMPLOYMENT_CERTIFICATE' && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
              Certificate of Employment ສຳລັບຍື່ນສະຖານທູດ, ວີຊາ, ທະນາຄານ ຫຼື ອົງການຈັດຕັ້ງ
            </p>
          </button>

          {/* Template 3 */}
          <button
            type="button"
            onClick={() => setTemplateType('EXECUTIVE_ID_CARD')}
            className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
              templateType === 'EXECUTIVE_ID_CARD'
                ? 'bg-blue-50/80 border-blue-500 text-blue-900 dark:bg-blue-950/40 dark:border-blue-500 dark:text-blue-200 shadow-xs'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-xs flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>3. ບັດພະນັກງານ & QR Dossier</span>
              </span>
              {templateType === 'EXECUTIVE_ID_CARD' && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
              ບັດປະຈຳຕົວທາງການພ້ອມ QR Code ກວດສອບຄວາມຖືກຕ້ອງ ແລະ ລາຍລະອຽດສຸກເສີນ
            </p>
          </button>
        </div>

        {/* Customization Options */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-600 dark:text-slate-400">ພາສາ/Language:</span>
              <select
                value={docLanguage}
                onChange={(e) => setDocLanguage(e.target.value as any)}
                className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-bold"
              >
                <option value="bilingual">ລາວ & English (Bilingual)</option>
                <option value="lo">ພາສາລາວ (Lao Official)</option>
                <option value="en">English (International)</option>
              </select>
            </div>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeSignatures}
                onChange={(e) => setIncludeSignatures(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-slate-700 dark:text-slate-300 font-medium">ລາຍເຊັນ & ຕຳແໜ່ງ (Signatures)</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeOfficialSeal}
                onChange={(e) => setIncludeOfficialSeal(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-slate-700 dark:text-slate-300 font-medium">ກາປະທັບທາງການ (Official Seal Stamp)</span>
            </label>

            {templateType === 'EMPLOYMENT_CERTIFICATE' && (
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSalary}
                  onChange={(e) => setIncludeSalary(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-slate-700 dark:text-slate-300 font-medium">ສະແດງເງິນເດືອນ (Disclose Base Salary)</span>
              </label>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px]">ເລກທີເອກະສານ:</span>
            <input
              type="text"
              value={docRefNumber}
              onChange={(e) => setDocRefNumber(e.target.value)}
              className="px-2 py-0.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg font-mono text-xs w-36"
            />
          </div>
        </div>

        {/* Live Printable Preview Canvas */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 bg-slate-100 dark:bg-slate-900/60 overflow-x-auto max-h-[580px] overflow-y-auto">
          <div
            ref={printAreaRef}
            className="w-[794px] min-h-[1050px] mx-auto bg-white text-slate-900 p-10 shadow-2xl relative font-sans leading-normal selection:bg-blue-100"
            style={{ boxSizing: 'border-box' }}
          >
            {/* Watermark in Background */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
              <span className="text-9xl font-black tracking-widest text-blue-900 rotate-45">
                LHSE
              </span>
            </div>

            {/* TEMPLATE 1: 21-COLUMNS OFFICIAL PERSONNEL DOSSIER */}
            {templateType === 'DOSSIER_21_COLUMNS' && (
              <div className="space-y-6 relative z-10 text-[12px]">
                {/* Formal Lao Header */}
                <div className="text-center space-y-1 border-b pb-4 border-slate-200">
                  <div className="text-xs font-semibold text-slate-600 tracking-wider">
                    ສາທາລະນະລັດ ປະຊາທິປະໄຕ ປະຊາຊົນລາວ
                  </div>
                  <div className="text-xs font-bold text-slate-800">
                    ສັນຕິພາບ ເອກະລາດ ປະຊາທິປະໄຕ ເອກະພາບ ວັດທະນະຖາວອນ
                  </div>
                  <div className="text-slate-400 text-xs py-0.5">--- 000 ---</div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-3 text-left">
                      <div className="w-16 h-16 rounded-full bg-white p-0.5 border border-slate-200 shadow-sm shrink-0 flex items-center justify-center">
                        <img
                          src="/assets/aistudio/______________________95dd5853.png"
                          alt="LHSE Logo"
                          className="w-full h-full object-contain rounded-full"
                        />
                      </div>
                      <div>
                        <div className="font-bold text-blue-950 text-sm">
                          ລັດວິສາຫະກິດຖືຮຸ້ນລາວ
                        </div>
                        <div className="text-[11px] text-slate-500 font-semibold tracking-wide">
                          LAO HOLDING STATE ENTERPRISE (LHSE)
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">
                          ກະຊວງອຸດສາກະກຳ ແລະ ການຄ້າ • Ministry of Industry and Commerce
                        </div>
                      </div>
                    </div>

                    <div className="text-right text-[11px] text-slate-500">
                      <div>ເລກທີ: <span className="font-mono font-bold text-slate-800">{docRefNumber}</span></div>
                      <div>ນະຄອນຫຼວງວຽງຈັນ, ວັນທີ {issueDateLao}</div>
                      <div className="text-[10px] text-slate-400">Date: {issueDateEn}</div>
                    </div>
                  </div>
                </div>

                {/* Document Main Heading */}
                <div className="text-center py-2 bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-900 text-white rounded-xl shadow-xs">
                  <h1 className="font-black text-base uppercase tracking-wide">
                    ໃບຊີວະປະຫວັດຫຍໍ້ ພະນັກງານ-ລັດຖະກອນ
                  </h1>
                  <p className="text-[11px] text-blue-200 font-medium">
                    OFFICIAL LHSE PERSONNEL DOSSIER (21-COLUMN STANDARD RECORD)
                  </p>
                </div>

                {/* Profile Overview Card with Photo and Scannable QR Code */}
                <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  {/* Photo Placeholder */}
                  <div className="w-24 h-28 rounded-xl bg-slate-200 border-2 border-slate-300 flex flex-col items-center justify-center text-slate-400 text-[10px] shrink-0 font-semibold overflow-hidden">
                    {employee.avatarUrl ? (
                      <img src={employee.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-1">
                        <UserCheck className="w-8 h-8 mx-auto text-slate-400 mb-1" />
                        <span>ຮູບຖ່າຍ 3x4 cm</span>
                      </div>
                    )}
                  </div>

                  {/* Name and Designation */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-blue-700 bg-blue-100 px-2 py-0.5 rounded text-xs">
                        {employee.employeeCode}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        LHSE Official Personnel
                      </span>
                    </div>
                    <h2 className="font-black text-lg text-slate-900">
                      {employee.prefixLao ? `${employee.prefixLao} ` : ''}{employee.firstNameLao} {employee.lastNameLao}
                    </h2>
                    <p className="font-semibold text-slate-600 text-xs">
                      {employee.prefixEn ? `${employee.prefixEn} ` : ''}{employee.firstNameEn} {employee.lastNameEn}
                    </p>
                    <div className="pt-1 text-[11px] text-slate-700 font-medium space-y-0.5">
                      <div>
                        <strong>ຕຳແໜ່ງ (Position):</strong> {position?.titleLao || 'ພະນັກງານ'} ({position?.titleEn || 'Officer'})
                      </div>
                      <div>
                        <strong>ພະແນກ (Department):</strong> {department?.nameLao || 'LHSE'}
                        {employee.unitName ? ` — ໜ່ວຍງານ: ${employee.unitName}` : ''}
                      </div>
                    </div>
                  </div>

                  {/* Verification QR Code */}
                  <div className="flex flex-col items-center p-2 rounded-xl bg-white border border-slate-200 shadow-xs shrink-0">
                    <QRCodeDisplay value={verificationPayload} size={84} includeMargin={false} />
                    <span className="text-[9px] font-mono font-bold text-slate-600 mt-1">
                      {employee.employeeCode}
                    </span>
                    <span className="text-[8px] text-slate-400">LHSE E-VERIFY</span>
                  </div>
                </div>

                {/* 21 Columns Information Grid */}
                {/* Section I: ອັດຕະຊີວະປະຫວັດພື້ນຖານ (Civil & Identity) */}
                <div className="space-y-1.5">
                  <div className="font-bold text-blue-900 text-xs uppercase tracking-wide border-b border-blue-200 pb-1 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>I. ຂໍ້ມູນພື້ນຖານ ແລະ ອັດຕະຊີວະປະຫວັດ (Civil Identity)</span>
                  </div>
                  <table className="w-full border-collapse border border-slate-200 text-[11px]">
                    <tbody>
                      <tr className="border-b border-slate-200">
                        <td className="w-1/4 p-2 bg-slate-50 font-bold text-slate-700">ເພດ (Gender):</td>
                        <td className="w-1/4 p-2 text-slate-900">{employee.gender || '-'}</td>
                        <td className="w-1/4 p-2 bg-slate-50 font-bold text-slate-700">ວັນເດືອນປີເກີດ (DOB):</td>
                        <td className="w-1/4 p-2 text-slate-900 font-mono">{employee.dateOfBirth || '-'}</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="p-2 bg-slate-50 font-bold text-slate-700">ຊົນເຜົ່າ (Ethnicity):</td>
                        <td className="p-2 text-slate-900">{employee.ethnicity || 'ລາວ'}</td>
                        <td className="p-2 bg-slate-50 font-bold text-slate-700">ສາສະໜາ (Religion):</td>
                        <td className="p-2 text-slate-900">{employee.religion || 'ພຸດ'}</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="p-2 bg-slate-50 font-bold text-slate-700">ບັດປະຈຳຕົວ (National ID):</td>
                        <td className="p-2 text-slate-900 font-mono">{employee.nationalId || '-'}</td>
                        <td className="p-2 bg-slate-50 font-bold text-slate-700">ໜັງສືຜ່ານແດນ (Passport):</td>
                        <td className="p-2 text-slate-900 font-mono">{employee.passportNumber || '-'}</td>
                      </tr>
                      <tr>
                        <td className="p-2 bg-slate-50 font-bold text-slate-700">ບັດປະກັນສັງຄົມ (SSO Card):</td>
                        <td className="p-2 text-slate-900 font-mono">{employee.socialSecurityNumber || '-'}</td>
                        <td className="p-2 bg-slate-50 font-bold text-slate-700">ບັດສະມາຊິກພັກ (Party Card):</td>
                        <td className="p-2 text-slate-900 font-mono">{employee.partyCardNumber || '-'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Section II: ລະດັບການສຶກສາ & ວິຊາສະເພາະ (Education & Specialization) */}
                <div className="space-y-1.5">
                  <div className="font-bold text-blue-900 text-xs uppercase tracking-wide border-b border-blue-200 pb-1 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-blue-600" />
                    <span>II. ລະດັບການສຶກສາ ແລະ ທິດສະດີການເມືອງ (Education & Theory)</span>
                  </div>
                  <table className="w-full border-collapse border border-slate-200 text-[11px]">
                    <tbody>
                      <tr className="border-b border-slate-200">
                        <td className="w-1/4 p-2 bg-slate-50 font-bold text-slate-700">ການສຶກສາສາມັນ (General Ed):</td>
                        <td className="w-1/4 p-2 text-slate-900">{employee.educationLevel || employee.education || 'ມ.6'}</td>
                        <td className="w-1/4 p-2 bg-slate-50 font-bold text-slate-700">ວິຊາສະເພາະ (Specialization):</td>
                        <td className="w-1/4 p-2 text-slate-900 font-semibold">{employee.specialization || 'ປະລິນຍາຕີ'}</td>
                      </tr>
                      <tr>
                        <td className="p-2 bg-slate-50 font-bold text-slate-700">ທິດສະດີການເມືອງ (Political Theory):</td>
                        <td className="p-2 text-slate-900">{employee.politicalTheory || '-'}</td>
                        <td className="p-2 bg-slate-50 font-bold text-slate-700">ວັນເຂົ້າສັງກັດລັດ/LHSE:</td>
                        <td className="p-2 text-slate-900 font-mono">{employee.orgAffiliationDate || employee.joiningDate}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Section III: ເຂົ້າສັງກັດການຈັດຕັ້ງມະຫາຊົນ & ພັກ (Affiliations & Party Status) */}
                <div className="space-y-1.5">
                  <div className="font-bold text-blue-900 text-xs uppercase tracking-wide border-b border-blue-200 pb-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>III. ຂໍ້ມູນເຂົ້າສັງກັດການຈັດຕັ້ງມະຫາຊົນ & ພັກ ປປລ (Organizations & Party Membership)</span>
                  </div>
                  <table className="w-full border-collapse border border-slate-200 text-[11px]">
                    <tbody>
                      <tr className="border-b border-slate-200">
                        <td className="w-1/4 p-2 bg-slate-50 font-bold text-slate-700">ເຂົ້າກຳມະບານ (Trade Union):</td>
                        <td className="w-1/4 p-2 text-slate-900 font-mono">{employee.tradeUnionDate || (employee.tradeUnionMember ? 'ສະມາຊິກ' : '-')}</td>
                        <td className="w-1/4 p-2 bg-slate-50 font-bold text-slate-700">ເຂົ້າຊາວໜຸ່ມ ປປລ (Youth Union):</td>
                        <td className="w-1/4 p-2 text-slate-900 font-mono">{employee.youthUnionDate || (employee.youthUnionMember ? 'ສະມາຊິກ' : '-')}</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="p-2 bg-slate-50 font-bold text-slate-700">ເຂົ້າແມ່ຍິງ (Women Union):</td>
                        <td className="p-2 text-slate-900 font-mono">{employee.womenUnionDate || (employee.womenUnionMember ? 'ສະມາຊິກ' : '-')}</td>
                        <td className="p-2 bg-slate-50 font-bold text-slate-700">ສະຖານະພັກ ປປລ (Party Status):</td>
                        <td className="p-2 text-indigo-700 font-bold">
                          {employee.partyMemberStatus === 'FULL'
                            ? 'ສະມາຊິກສົມບູນ (Full Member)'
                            : employee.partyMemberStatus === 'CANDIDATE'
                            ? 'ສະມາຊິກສຳຮອງ (Candidate)'
                            : employee.partyMemberStatus === 'PROGRESSIVE'
                            ? 'ມະຫາຊົນກ້າວໜ້າ (Progressive Mass)'
                            : 'ມະຫາຊົນ'}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2 bg-slate-50 font-bold text-slate-700">ວັນເຂົ້າສຳຮອງ / ສົມບູນ:</td>
                        <td className="p-2 text-slate-900 font-mono">
                          {employee.partyCandidateDate ? `ສຳຮອງ: ${employee.partyCandidateDate}` : '-'}
                          {employee.partyFullDate ? ` • ສົມບູນ: ${employee.partyFullDate}` : ''}
                        </td>
                        <td className="p-2 bg-slate-50 font-bold text-slate-700">ໜ່ວຍພັກ / ຕຳແໜ່ງມະຫາຊົນ:</td>
                        <td className="p-2 text-slate-900">
                          {employee.partyUnitName || '-'}
                          {employee.massOrgPosition ? ` (${employee.massOrgPosition})` : ''}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Signatures & Official Stamp Block */}
                {includeSignatures && (
                  <div className="pt-8 grid grid-cols-3 gap-6 text-center text-[11px] relative">
                    {/* Official Stamp Watermark on Right */}
                    {includeOfficialSeal && (
                      <div className="absolute right-12 bottom-0 w-28 h-28 rounded-full border-4 border-rose-600/40 border-dashed flex flex-col items-center justify-center text-rose-700/60 font-bold text-[9px] pointer-events-none select-none rotate-[-12deg]">
                        <div className="font-extrabold text-[10px]">ລັດວິສາຫະກິດ ຖືຮຸ້ນລາວ</div>
                        <div className="text-[8px]">★ LHSE OFFICIAL SEAL ★</div>
                        <div className="text-[7px]">VIENTIANE LAO PDR</div>
                      </div>
                    )}

                    <div>
                      <div className="font-bold text-slate-800">ເຈົ້າຂອງຊີວະປະຫວັດ</div>
                      <div className="text-[10px] text-slate-400">Employee Signature</div>
                      <div className="h-16 flex items-end justify-center">
                        <div className="w-36 border-b border-dashed border-slate-400" />
                      </div>
                      <div className="mt-1 font-semibold text-slate-700">
                        {employee.firstNameLao} {employee.lastNameLao}
                      </div>
                    </div>

                    <div>
                      <div className="font-bold text-slate-800">ຫົວໜ້າພະແນກບຸກຄະລາກອນ</div>
                      <div className="text-[10px] text-slate-400">Head of HR & Admin</div>
                      <div className="h-16 flex items-end justify-center">
                        <div className="w-36 border-b border-dashed border-slate-400" />
                      </div>
                      <div className="mt-1 font-semibold text-slate-700">
                        ທ່ານ ນາງ ມະນີວອນ ແສງດາລາ
                      </div>
                    </div>

                    <div>
                      <div className="font-bold text-slate-800">ຜູ້ອຳນວຍການໃຫຍ່ (LHSE)</div>
                      <div className="text-[10px] text-slate-400">Managing Director / CEO</div>
                      <div className="h-16 flex items-end justify-center">
                        <div className="w-36 border-b border-dashed border-slate-400" />
                      </div>
                      <div className="mt-1 font-semibold text-slate-700">
                        ທ່ານ ມະໂນທອງ ວົງໄຊ
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TEMPLATE 2: OFFICIAL CERTIFICATE OF EMPLOYMENT (SERVICE LETTER) */}
            {templateType === 'EMPLOYMENT_CERTIFICATE' && (
              <div className="space-y-6 relative z-10 text-[12px] pt-4">
                {/* Official Letterhead */}
                <div className="flex items-center justify-between border-b-2 border-blue-900 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-white p-0.5 border border-blue-200 shadow-sm shrink-0 flex items-center justify-center">
                      <img
                        src="/assets/aistudio/______________________95dd5853.png"
                        alt="LHSE Logo"
                        className="w-full h-full object-contain rounded-full"
                      />
                    </div>
                    <div>
                      <div className="font-black text-base text-blue-950">
                        ລັດວິສາຫະກິດຖືຮຸ້ນລາວ
                      </div>
                      <div className="font-bold text-xs text-blue-800 tracking-wide">
                        LAO HOLDING STATE ENTERPRISE (LHSE)
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        ກະຊວງອຸດສາກະກຳ ແລະ ການຄ້າ • Ministry of Industry and Commerce
                      </div>
                    </div>
                  </div>

                  <div className="text-right text-[11px] text-slate-600">
                    <div>ເລກທີ: <span className="font-mono font-bold text-blue-900">{docRefNumber}</span></div>
                    <div>ວັນທີ / Date: {issueDateEn}</div>
                    <div className="text-[10px] text-slate-400 font-mono">CODE: {employee.employeeCode}</div>
                  </div>
                </div>

                {/* Formal Title */}
                <div className="text-center py-4 space-y-1">
                  <h1 className="font-black text-xl text-slate-900 uppercase tracking-wide">
                    ໃບຢັ້ງຢືນການເປັນພະນັກງານ
                  </h1>
                  <h2 className="font-bold text-sm text-blue-800 tracking-wider">
                    CERTIFICATE OF EMPLOYMENT & SERVICE
                  </h2>
                  <div className="w-24 h-0.5 bg-blue-900 mx-auto mt-2" />
                </div>

                {/* Body Content */}
                <div className="space-y-4 text-justify leading-relaxed text-slate-800 text-[12px]">
                  <p>
                    <strong>ເຖິງ (To Whom It May Concern):</strong> {certificatePurpose}
                  </p>

                  <p>
                    ລັດວິສາຫະກິດຖືຮຸ້ນລາວ (LHSE) ຂໍຢັ້ງຢືນຢ່າງເປັນທາງການວ່າ:
                    <strong> {employee.prefixLao ? `${employee.prefixLao} ` : ''}{employee.firstNameLao} {employee.lastNameLao}</strong>
                    (ຊື່ພາສາອັງກິດ: <strong>{employee.prefixEn ? `${employee.prefixEn} ` : ''}{employee.firstNameEn} {employee.lastNameEn}</strong>),
                    ຖືບັດປະຈຳຕົວເລກທີ: <span className="font-mono font-bold">{employee.nationalId || '-'}</span>,
                    ລະຫັດພະນັກງານ: <span className="font-mono font-bold text-blue-700">{employee.employeeCode}</span>,
                    ແມ່ນພະນັກງານສັງກັດປະຈຳການຕົວຈິງ ຢູ່ ລັດວິສາຫະກິດຖືຮຸ້ນລາວ (LHSE).
                  </p>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="grid grid-cols-2 gap-3 text-[11px]">
                      <div>
                        <span className="text-slate-500 block">ຕຳແໜ່ງປັດຈຸບັນ (Official Job Title):</span>
                        <strong className="text-slate-900 text-xs">{position?.titleLao} ({position?.titleEn})</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">ພະແນກສັງກັດ (Department):</span>
                        <strong className="text-slate-900 text-xs">{department?.nameLao} ({department?.nameEn})</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">ວັນທີເລີ່ມປະຕິບັດງານ (Commencement Date):</span>
                        <strong className="text-slate-900 text-xs font-mono">{employee.joiningDate}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">ສະຖານະການຈ້າງງານ (Employment Status):</span>
                        <strong className="text-emerald-700 text-xs">ປະຈຳການເຕັມເວລາ (Permanent Full-Time)</strong>
                      </div>
                      {includeSalary && (
                        <div className="col-span-2 pt-2 border-t border-slate-200">
                          <span className="text-slate-500 block">ເງິນເດືອນພື້ນຖານ (Base Salary):</span>
                          <strong className="text-blue-700 text-xs font-mono">
                            {employee.baseSalary?.toLocaleString() || '12,500,000'} LAK / ເດືອນ (Month)
                          </strong>
                        </div>
                      )}
                    </div>
                  </div>

                  <p>
                    ຕະຫຼອດໄລຍະເວລາການປະຕິບັດໜ້າທີ່ວຽກງານ, ພະນັກງານດັ່ງກ່າວໄດ້ປະຕິບັດໜ້າທີ່ດ້ວຍຄວາມຮັບຜິດຊອບສູງ,
                    ມີລະບຽບວິໄນ ແລະ ປະຕິບັດຖືກຕ້ອງຕາມກົດໝາຍແຮງງານແຫ່ງ ສປປ ລາວ ແລະ ລະບຽບການຂອງ ລັດວິສາຫະກິດ ຖືຮຸ້ນລາວ ທຸກປະການ.
                  </p>

                  <p className="text-slate-600 italic text-[11px]">
                    ໃບຢັ້ງຢືນສະບັບນີ້ ອອກໃຫ້ເພື່ອເປັນຫຼັກຖານຢັ້ງຢືນການເຮັດວຽກທີ່ຖືກຕ້ອງຕາມຄວາມເປັນຈິງ ແລະ ມີຜົນບັງຄັບໃຊ້ນັບແຕ່ວັນທີລົງລາຍເຊັນເປັນຕົ້ນໄປ.
                  </p>
                </div>

                {/* Signatures & Seal Block */}
                {includeSignatures && (
                  <div className="pt-12 grid grid-cols-2 gap-8 text-center text-[11px] relative">
                    {/* Official Stamp */}
                    {includeOfficialSeal && (
                      <div className="absolute right-16 bottom-2 w-32 h-32 rounded-full border-4 border-rose-600/50 border-dashed flex flex-col items-center justify-center text-rose-700/60 font-bold text-[9px] pointer-events-none select-none rotate-[-8deg]">
                        <div className="font-extrabold text-[11px]">ລັດວິສາຫະກິດ ຖືຮຸ້ນລາວ</div>
                        <div className="text-[8px]">★ LHSE OFFICIAL SEAL ★</div>
                        <div className="text-[8px]">OFFICE OF MANAGING DIRECTOR</div>
                      </div>
                    )}

                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20 bg-slate-50 p-1 rounded-xl border border-slate-200 mb-1">
                        <QRCodeDisplay value={verificationPayload} size={72} includeMargin={false} />
                      </div>
                      <span className="text-[9px] font-mono text-slate-500">DIGITAL VERIFIED: {employee.employeeCode}</span>
                    </div>

                    <div>
                      <div className="font-bold text-slate-800 text-xs">
                        ຕາງໜ້າ ລັດວິສາຫະກິດ ຖືຮຸ້ນລາວ (LHSE)
                      </div>
                      <div className="text-[10px] text-slate-500">For and on behalf of Managing Director</div>
                      <div className="h-16 flex items-end justify-center">
                        <div className="w-44 border-b border-dashed border-slate-400" />
                      </div>
                      <div className="mt-1 font-bold text-slate-800 text-xs">
                        ທ່ານ ນາງ ມະນີວອນ ແສງດາລາ
                      </div>
                      <div className="text-[10px] text-slate-500">
                        ຫົວໜ້າພະແນກບຸກຄະລາກອນ & ບໍລິຫານ (HR & Admin Manager)
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TEMPLATE 3: EXECUTIVE ID CARD & DOSSIER */}
            {templateType === 'EXECUTIVE_ID_CARD' && (
              <div className="space-y-6 relative z-10 text-[12px] pt-4">
                <div className="text-center space-y-1 border-b pb-4 border-slate-200">
                  <div className="text-sm font-black text-blue-900 tracking-wide">
                    ລັດວິສາຫະກິດຖືຮຸ້ນລາວ • LAO HOLDING STATE ENTERPRISE (LHSE)
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    ກະຊວງອຸດສາກະກຳ ແລະ ການຄ້າ • Ministry of Industry and Commerce
                  </div>
                  <div className="text-xs font-bold text-slate-700 pt-0.5">
                    ບັດປະຈຳຕົວພະນັກງານດິຈິຕອນມາດຕະຖານ (OFFICIAL LHSE CREDENTIAL DOSSIER)
                  </div>
                </div>

                {/* Front & Back Card Layout */}
                <div className="grid grid-cols-2 gap-6 p-4">
                  {/* Card Front */}
                  <div className="p-6 rounded-3xl bg-gradient-to-tr from-blue-900 via-indigo-900 to-slate-900 text-white shadow-xl relative overflow-hidden flex flex-col justify-between h-96 border border-blue-400/40">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-11 h-11 rounded-full bg-white p-0.5 shadow-md flex items-center justify-center shrink-0">
                          <img
                            src="/assets/aistudio/______________________95dd5853.png"
                            alt="LHSE Logo"
                            className="w-full h-full object-contain rounded-full"
                          />
                        </div>
                        <div>
                          <div className="text-[10px] font-bold tracking-wider uppercase text-blue-200">LHSE Official</div>
                          <div className="text-[8px] text-blue-300">ລັດວິສາຫະກິດຖືຮຸ້ນລາວ</div>
                        </div>
                      </div>
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/40">
                        {employee.employeeCode}
                      </span>
                    </div>

                    <div className="flex flex-col items-center text-center my-auto space-y-2">
                      <div className="w-24 h-24 rounded-2xl bg-white/10 backdrop-blur-md border-2 border-white/30 text-white flex items-center justify-center text-2xl font-black shadow-inner overflow-hidden">
                        {employee.avatarUrl ? (
                          <img src={employee.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <span>{employee.firstNameLao?.[0] || employee.firstNameEn?.[0]}</span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-black text-base text-white">
                          {employee.firstNameLao} {employee.lastNameLao}
                        </h3>
                        <p className="text-xs text-blue-200">
                          {employee.firstNameEn} {employee.lastNameEn}
                        </p>
                        <p className="text-[11px] font-semibold text-blue-300 pt-0.5">
                          {position?.titleLao}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[9px] text-blue-200 font-mono">
                      <span>NATIONAL ID: {employee.nationalId || '-'}</span>
                      <span>EXP: DEC 2028</span>
                    </div>
                  </div>

                  {/* Card Back */}
                  <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl relative overflow-hidden flex flex-col justify-between h-96 border border-slate-700">
                    <div className="space-y-1">
                      <div className="text-[11px] font-bold text-blue-400">LHSE PERSONNEL RECORD</div>
                      <div className="text-[9px] text-slate-400">If found, please return to Lao Holding State Enterprise.</div>
                    </div>

                    <div className="flex flex-col items-center justify-center bg-white p-3 rounded-2xl text-slate-900 shadow-md">
                      <QRCodeDisplay value={verificationPayload} size={110} includeMargin={false} />
                      <span className="text-[10px] font-mono font-bold mt-1 text-slate-800">
                        {employee.employeeCode}
                      </span>
                    </div>

                    <div className="space-y-1 text-[10px] text-slate-300">
                      <div><strong>Department:</strong> {department?.nameLao}</div>
                      <div><strong>Emergency Tel:</strong> {employee.emergencyContactPhone || '+856 21 453 888'}</div>
                      <div className="text-[8px] text-slate-500 pt-1 border-t border-slate-800">
                        Ministry of Finance Complex, 23 Singha Road, Vientiane Capital
                      </div>
                    </div>
                  </div>
                </div>

                {/* Emergency & Civil Dossier Summary Table */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-[11px]">
                  <div className="font-bold text-slate-800">ຂໍ້ມູນຕິດຕໍ່ສຸກເສີນ ແລະ ເລກທີປະກັນໄພ (Emergency & Assurance):</div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <span className="text-slate-400 block text-[10px]">ຜູ້ຕິດຕໍ່ສຸກເສີນ:</span>
                      <strong>{employee.emergencyContactName || 'ຄອບຄົວພະນັກງານ'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">ເບີໂທຕິດຕໍ່:</span>
                      <strong className="font-mono">{employee.emergencyContactPhone || employee.phone || '-'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">ເລກບັນຊີທະນາຄານ:</span>
                      <strong className="font-mono">{employee.bankAccountNumber ? `${employee.bankName || 'BCEL'}: ${employee.bankAccountNumber}` : '-'}</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Document Footer Bar */}
            <div className="pt-8 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
              <span>Lao Holding State Enterprise (LHSE) • Official Human Resources Management System</span>
              <span className="font-mono">Security Tier 1 • Ref: {docRefNumber}</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
