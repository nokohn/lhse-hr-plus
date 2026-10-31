import React, { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useApp } from '../../context/AppContext.tsx';
import { Employee, Department } from '../../types/index.ts';
import { Modal } from '../common/Modal.tsx';
import {
  User,
  Users,
  Coins,
  TrendingUp,
  Settings,
  Search,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Building2,
  Briefcase,
  ChevronRight,
  ShieldCheck,
  Printer,
  Sparkles,
  FileImage,
  FileText,
  ChevronDown,
  CheckCircle2,
  Loader2,
  Calendar,
  Award,
  Stamp,
} from 'lucide-react';

interface OrgChartVisualProps {
  className?: string;
}

interface OrgNodeDetail {
  titleLao: string;
  titleEn: string;
  subtitleLao: string;
  subtitleEn: string;
  type: 'DIRECTOR' | 'DEPUTY' | 'DEPARTMENT';
  color: string;
  deptId?: string;
  supervisorLao?: string;
  supervisorEn?: string;
  headNameLao?: string;
  headNameEn?: string;
  mandateLao?: string;
  mandateEn?: string;
}

export const OrgChartVisual: React.FC<OrgChartVisualProps> = ({ className = '' }) => {
  const { language, employees, departments } = useApp();
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [selectedNode, setSelectedNode] = useState<OrgNodeDetail | null>(null);
  const [exportingType, setExportingType] = useState<'png' | 'pdf' | null>(null);
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);

  const exportDropdownRef = useRef<HTMLDivElement>(null);
  const contentToExportRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        exportDropdownRef.current &&
        !exportDropdownRef.current.contains(event.target as Node)
      ) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNodeClick = (node: OrgNodeDetail) => {
    setSelectedNode(node);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPNG = async () => {
    if (!contentToExportRef.current) return;
    try {
      setShowExportMenu(false);
      setExportingType('png');

      const originalZoom = zoomLevel;
      setZoomLevel(100);

      // Wait a tick for DOM to stabilize at 100% scale
      await new Promise((resolve) => setTimeout(resolve, 250));

      const element = contentToExportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2, // 2x high resolution
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 1300,
      });

      setZoomLevel(originalZoom);

      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `LHSE_Org_Chart_${timestamp}.png`;

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportSuccessMsg(
        language === 'lo'
          ? 'ດາວໂຫຼດຮູບພາບ PNG ຄວາມລະອຽດສູງສໍາເລັດແລ້ວ!'
          : 'High-Resolution PNG downloaded successfully!'
      );
      setTimeout(() => setExportSuccessMsg(null), 4000);
    } catch (error) {
      console.error('PNG export failed:', error);
      alert(
        language === 'lo'
          ? 'ເກີດຂໍ້ຜິດພາດໃນການສ້າງ PNG'
          : 'Failed to export PNG. Please try again.'
      );
    } finally {
      setExportingType(null);
    }
  };

  const handleExportPDF = async () => {
    if (!contentToExportRef.current) return;
    try {
      setShowExportMenu(false);
      setExportingType('pdf');

      const originalZoom = zoomLevel;
      setZoomLevel(100);

      await new Promise((resolve) => setTimeout(resolve, 250));

      const element = contentToExportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 1300,
      });

      setZoomLevel(originalZoom);

      const imgData = canvas.toDataURL('image/png');

      // A4 Landscape format (297mm x 210mm)
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const margin = 10;
      const availWidth = pageWidth - margin * 2;
      const availHeight = pageHeight - margin * 2;

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(availWidth / imgWidth, availHeight / imgHeight);

      const finalWidth = imgWidth * ratio;
      const finalHeight = imgHeight * ratio;
      const posX = margin + (availWidth - finalWidth) / 2;
      const posY = margin + (availHeight - finalHeight) / 2;

      pdf.addImage(imgData, 'PNG', posX, posY, finalWidth, finalHeight, undefined, 'FAST');

      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `LHSE_Official_Org_Chart_${timestamp}.pdf`;
      pdf.save(filename);

      setExportSuccessMsg(
        language === 'lo'
          ? 'ດາວໂຫຼດເອກະສານ PDF ທາງການສໍາເລັດແລ້ວ!'
          : 'Official PDF Report downloaded successfully!'
      );
      setTimeout(() => setExportSuccessMsg(null), 4000);
    } catch (error) {
      console.error('PDF export failed:', error);
      alert(
        language === 'lo'
          ? 'ເກີດຂໍ້ຜິດພາດໃນການສ້າງ PDF'
          : 'Failed to export PDF. Please try again.'
      );
    } finally {
      setExportingType(null);
    }
  };

  const currentDateFormatted = new Date().toLocaleDateString(language === 'lo' ? 'lo-LA' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Toast Notification */}
      {exportSuccessMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-bottom-2 duration-300">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{exportSuccessMsg}</span>
        </div>
      )}

      {/* Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs print:hidden">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shadow-xs">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                {language === 'lo'
                  ? 'ແຜນຜັງໂຄງຮ່າງການຈັດຕັ້ງ (LHSE Official Organizational Chart)'
                  : 'LHSE Official Organizational Hierarchy Chart'}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                Official
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              {language === 'lo'
                ? 'ສາຍການຊີ້ນຳ-ນຳພາ ຈາກ ຜູ້ອຳນວຍການ ຫາ ຮອງຜູ້ອຳນວຍການ ແລະ 5 ພະແນກການ'
                : 'Executive reporting hierarchy from Director to Deputy Directors and 5 Operational Departments'}
            </p>
          </div>
        </div>

        {/* Toolbar: Zoom & Actions */}
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 text-xs">
            <button
              onClick={() => setZoomLevel((prev) => Math.max(60, prev - 10))}
              className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-600 dark:text-slate-300"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono font-bold text-xs text-slate-700 dark:text-slate-300 min-w-[42px] text-center">
              {zoomLevel}%
            </span>
            <button
              onClick={() => setZoomLevel((prev) => Math.min(130, prev + 10))}
              className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-600 dark:text-slate-300"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoomLevel(100)}
              className="px-2 py-1 text-[10px] font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white"
            >
              100%
            </button>
          </div>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Expand View'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Export Dropdown Menu */}
          <div className="relative" ref={exportDropdownRef}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={Boolean(exportingType)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              {exportingType ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>
                    {exportingType === 'png'
                      ? language === 'lo'
                        ? 'ກຳລັງສ້າງ PNG...'
                        : 'Generating PNG...'
                      : language === 'lo'
                      ? 'ກຳລັງສ້າງ PDF...'
                      : 'Generating PDF...'}
                  </span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>{language === 'lo' ? 'ສົ່ງອອກແຜນຜັງ (Export)' : 'Export Chart'}</span>
                  <ChevronDown className="w-3.5 h-3.5 ml-0.5 opacity-80" />
                </>
              )}
            </button>

            {/* Dropdown Options */}
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800/80 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    {language === 'lo' ? 'ເລືອກຮູບແບບການສົ່ງອອກ' : 'Select Export Format'}
                  </span>
                </div>

                {/* PDF Option */}
                <button
                  onClick={handleExportPDF}
                  className="w-full px-3.5 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors flex items-start gap-3 group"
                >
                  <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <span>{language === 'lo' ? 'ດາວໂຫຼດ PDF (A4 Landscape)' : 'Download PDF (A4 Landscape)'}</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 font-bold">
                        PDF
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {language === 'lo'
                        ? 'ຮູບແບບເອກະສານທາງການ ພ້ອມຫົວເຈ້ຍ ແລະ ບ່ອນເຊັນ'
                        : 'Official print-ready A4 report with executive sign-off'}
                    </p>
                  </div>
                </button>

                {/* PNG Option */}
                <button
                  onClick={handleExportPNG}
                  className="w-full px-3.5 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors flex items-start gap-3 group"
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                    <FileImage className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <span>{language === 'lo' ? 'ດາວໂຫຼດ PNG (High-Res 2x)' : 'Download PNG (High-Res 2x)'}</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                        PNG
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {language === 'lo'
                        ? 'ຮູບພາບຄົມຊັດສູງ ສຳລັບນຳສະເໜີ ຫຼື ໃສ່ເອກະສານ'
                        : 'Crisp 300-DPI graphic for presentations and slides'}
                    </p>
                  </div>
                </button>

                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                {/* Print Option */}
                <button
                  onClick={() => {
                    setShowExportMenu(false);
                    handlePrint();
                  }}
                  className="w-full px-3.5 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors flex items-center gap-3 text-slate-700 dark:text-slate-300"
                >
                  <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0">
                    <Printer className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {language === 'lo' ? 'ພິມຜ່ານ Browser (Print)' : 'Print Chart (Direct)'}
                    </div>
                    <p className="text-[10px] text-slate-400">
                      {language === 'lo' ? 'ພິມອອກເຈ້ຍໂດຍກົງ' : 'Send directly to physical printer'}
                    </p>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Visual Chart Canvas */}
      <div
        className={`bg-slate-100/80 dark:bg-slate-950/80 rounded-3xl p-4 lg:p-8 border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto transition-all ${
          isFullscreen ? 'fixed inset-4 z-50 overflow-auto bg-slate-900' : ''
        }`}
      >
        <div
          ref={contentToExportRef}
          style={{
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: 'top center',
            transition: 'transform 0.2s ease',
          }}
          className="min-w-[1080px] max-w-[1180px] mx-auto py-8 px-8 bg-white text-slate-900 rounded-3xl border border-slate-200/90 shadow-lg select-none"
        >
          {/* Official Document Letterhead Banner (included in export & print) */}
          <div className="border-b-2 border-slate-900/80 pb-5 mb-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#1a56db] flex items-center justify-center text-white shadow-md">
                <Building2 className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black text-slate-900 tracking-tight">
                    ລັດວິສາຫະກິດ ຖືຮຸ້ນລາວ (LHSE)
                  </h1>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 font-mono">
                    OFFICIAL
                  </span>
                </div>
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Lao Holding State Enterprise
                </h2>
                <p className="text-xs font-semibold text-blue-700 mt-0.5">
                  ແຜນຜັງໂຄງຮ່າງການຈັດຕັ້ງ (Official Organizational Hierarchy Structure)
                </p>
              </div>
            </div>

            <div className="text-right text-xs space-y-1 font-mono">
              <div className="text-slate-500 text-[11px]">
                Doc ID: <strong className="text-slate-800">LHSE-ORG-2026-V1</strong>
              </div>
              <div className="text-slate-500 text-[11px]">
                Status: <strong className="text-emerald-700">Approved by Board</strong>
              </div>
              <div className="text-slate-500 text-[11px]">
                Date: <strong className="text-slate-800">{currentDateFormatted}</strong>
              </div>
            </div>
          </div>

          {/* LEVEL 1: TOP NODE (Managing Director) */}
          <div className="flex flex-col items-center">
            <div
              onClick={() =>
                handleNodeClick({
                  titleLao: 'ຜູ້ອຳນວຍການ',
                  titleEn: 'Managing Director / CEO',
                  subtitleLao: 'ຜູ້ອຳນວຍການ',
                  subtitleEn: 'Director General',
                  type: 'DIRECTOR',
                  color: '#1a56db',
                  headNameLao: 'ທ່ານ ບຸນເລີດ ຫລວງລາດ',
                  headNameEn: 'Mr. Bounleuth Luangrath',
                  mandateLao: 'ຊີ້ນຳ-ນຳພາ ວຽກງານລວມທັງໝົດຂອງ ລັດວິສາຫະກິດ ຖືຮຸ້ນລາວ (LHSE)',
                  mandateEn: 'Overall executive leadership and governance of Lao Holding State Enterprise',
                })
              }
              className="cursor-pointer group relative transition-transform duration-200 hover:scale-105"
            >
              <div className="w-[360px] h-[105px] rounded-2xl bg-[#1a56db] text-white shadow-xl flex items-center px-6 border-2 border-blue-400/40 relative">
                {/* Person avatar on the left */}
                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shrink-0 shadow-md">
                  <div className="w-12 h-12 rounded-full bg-[#1a56db] flex items-center justify-center text-white">
                    <User className="w-8 h-8 fill-white stroke-white" />
                  </div>
                </div>

                {/* Vertical Divider */}
                <div className="w-0.5 h-14 bg-white/40 mx-5 shrink-0" />

                {/* Titles */}
                <div className="space-y-0.5">
                  <h2 className="text-2xl font-black tracking-wide text-white drop-shadow-xs">
                    ຜູ້ອຳນວຍການ
                  </h2>
                  <p className="text-sm font-bold text-white/90">(ຜູ້ອຳນວຍການ)</p>
                </div>
              </div>
            </div>

            {/* Vertical Connector Line from Level 1 */}
            <div className="w-1 h-8 bg-[#1a56db]" />

            {/* Horizontal Branch Bar for 3 Deputy Directors */}
            {/* Width spans exactly to the centers of Deputy 1, 2, 3 */}
            <div className="w-[780px] h-1 bg-[#1a56db] relative">
              {/* Arrow down to Deputy 1 (Left: 0%) */}
              <div className="absolute left-0 -top-0 flex flex-col items-center">
                <div className="w-1 h-6 bg-[#1a56db]" />
                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-[#1a56db]" />
              </div>

              {/* Arrow down to Deputy 2 (Center: 50%) */}
              <div className="absolute left-1/2 -translate-x-1/2 -top-0 flex flex-col items-center">
                <div className="w-1 h-6 bg-[#1a56db]" />
                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-[#1a56db]" />
              </div>

              {/* Arrow down to Deputy 3 (Right: 100%) */}
              <div className="absolute right-0 -top-0 flex flex-col items-center">
                <div className="w-1 h-6 bg-[#1a56db]" />
                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-[#1a56db]" />
              </div>
            </div>

            {/* Spacing for downward arrows to reach cards */}
            <div className="h-8" />

            {/* LEVEL 2: THREE DEPUTY DIRECTORS */}
            <div className="flex items-start justify-between w-[960px] gap-6">
              {/* DEPUTY DIRECTOR 1 (Left) */}
              <div className="flex flex-col items-center w-[300px]">
                <div
                  onClick={() =>
                    handleNodeClick({
                      titleLao: 'ຮອງຜູ້ອຳນວຍການ ທ່ານທີ 1',
                      titleEn: '1st Deputy Managing Director',
                      subtitleLao: 'ຜູ້ຊີ້ນຳ',
                      subtitleEn: 'Supervisor in Charge',
                      type: 'DEPUTY',
                      color: '#2563eb',
                      headNameLao: 'ທ່ານ ຄຳພັນ ໄຊຍະສິດ',
                      headNameEn: 'Mr. Khamphan Xayasith',
                      mandateLao:
                        'ຊີ້ນຳໂດຍກົງ: ພະແນກ ທຸລະກິດຂີ້ເທົ່າລອຍ ແລະ ພະແນກ ບໍລິຫານບັນຊີ ແລະ ການເງິນ',
                      mandateEn:
                        'Direct oversight of Fly Ash Business Department and Accounting & Finance Administration Department',
                    })
                  }
                  className="w-[280px] h-[95px] rounded-2xl bg-[#2563eb] text-white shadow-lg flex flex-col items-center justify-center p-3 text-center cursor-pointer transition-transform duration-200 hover:scale-105 border-2 border-blue-400/40 space-y-1"
                >
                  {/* Person Avatar in white */}
                  <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#2563eb] shadow-xs">
                    <User className="w-5 h-5 fill-[#2563eb] stroke-[#2563eb]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white tracking-wide leading-tight">
                      ຮອງຜູ້ອຳນວຍການ ທ່ານທີ 1
                    </h3>
                    <p className="text-xs font-semibold text-white/90">(ຜູ້ຊີ້ນຳ)</p>
                  </div>
                </div>

                {/* Vertical drop from Deputy 1 */}
                <div className="w-1 h-8 bg-[#1a56db]" />

                {/* Horizontal branch bar from Deputy 1 to 2 Departments */}
                <div className="w-[190px] h-1 bg-[#1a56db] relative">
                  {/* Arrow to Dept 1 (Left) */}
                  <div className="absolute left-0 -top-0 flex flex-col items-center">
                    <div className="w-1 h-6 bg-[#1a56db]" />
                    <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-[#1a56db]" />
                  </div>
                  {/* Arrow to Dept 2 (Right) */}
                  <div className="absolute right-0 -top-0 flex flex-col items-center">
                    <div className="w-1 h-6 bg-[#1a56db]" />
                    <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-[#1a56db]" />
                  </div>
                </div>
              </div>

              {/* DEPUTY DIRECTOR 2 (Middle) */}
              <div className="flex flex-col items-center w-[300px]">
                <div
                  onClick={() =>
                    handleNodeClick({
                      titleLao: 'ຮອງຜູ້ອຳນວຍການ ທ່ານທີ 2',
                      titleEn: '2nd Deputy Managing Director',
                      subtitleLao: 'ຜູ້ຊີ້ນຳ',
                      subtitleEn: 'Supervisor in Charge',
                      type: 'DEPUTY',
                      color: '#2563eb',
                      headNameLao: 'ທ່ານ ສົມຈິດ ວິໄລວົງ',
                      headNameEn: 'Mr. Somchit Vilayvong',
                      mandateLao: 'ຊີ້ນຳໂດຍກົງ: ພະແນກ ທຸລະກິດແຜນການ',
                      mandateEn: 'Direct oversight of Business Planning Department',
                    })
                  }
                  className="w-[280px] h-[95px] rounded-2xl bg-[#2563eb] text-white shadow-lg flex flex-col items-center justify-center p-3 text-center cursor-pointer transition-transform duration-200 hover:scale-105 border-2 border-blue-400/40 space-y-1"
                >
                  <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#2563eb] shadow-xs">
                    <User className="w-5 h-5 fill-[#2563eb] stroke-[#2563eb]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white tracking-wide leading-tight">
                      ຮອງຜູ້ອຳນວຍການ ທ່ານທີ 2
                    </h3>
                    <p className="text-xs font-semibold text-white/90">(ຜູ້ຊີ້ນຳ)</p>
                  </div>
                </div>

                {/* Direct vertical drop to Dept 3 */}
                <div className="w-1 h-14 bg-[#1a56db]" />
                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-[#1a56db]" />
              </div>

              {/* DEPUTY DIRECTOR 3 (Right) */}
              <div className="flex flex-col items-center w-[300px]">
                <div
                  onClick={() =>
                    handleNodeClick({
                      titleLao: 'ຮອງຜູ້ອຳນວຍການ ທ່ານທີ 3',
                      titleEn: '3rd Deputy Managing Director',
                      subtitleLao: 'ຜູ້ຊີ້ນຳ',
                      subtitleEn: 'Supervisor in Charge',
                      type: 'DEPUTY',
                      color: '#2563eb',
                      headNameLao: 'ທ່ານ ສຸວັນດີ ທຳມະວົງ',
                      headNameEn: 'Mr. Souvandy Thammavong',
                      mandateLao: 'ຊີ້ນຳໂດຍກົງ: ພະແນກ ພັດທະນາ ແລະ ພະແນກ ກວດສອບພາຍໃນ',
                      mandateEn:
                        'Direct oversight of Development Department and Internal Audit Department',
                    })
                  }
                  className="w-[280px] h-[95px] rounded-2xl bg-[#2563eb] text-white shadow-lg flex flex-col items-center justify-center p-3 text-center cursor-pointer transition-transform duration-200 hover:scale-105 border-2 border-blue-400/40 space-y-1"
                >
                  <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#2563eb] shadow-xs">
                    <User className="w-5 h-5 fill-[#2563eb] stroke-[#2563eb]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white tracking-wide leading-tight">
                      ຮອງຜູ້ອຳນວຍການ ທ່ານທີ 3
                    </h3>
                    <p className="text-xs font-semibold text-white/90">(ຜູ້ຊີ້ນຳ)</p>
                  </div>
                </div>

                {/* Vertical drop from Deputy 3 */}
                <div className="w-1 h-8 bg-[#1a56db]" />

                {/* Horizontal branch bar from Deputy 3 to 2 Departments */}
                <div className="w-[190px] h-1 bg-[#1a56db] relative">
                  {/* Arrow to Dept 4 (Left) */}
                  <div className="absolute left-0 -top-0 flex flex-col items-center">
                    <div className="w-1 h-6 bg-[#1a56db]" />
                    <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-[#1a56db]" />
                  </div>
                  {/* Arrow to Dept 5 (Right) */}
                  <div className="absolute right-0 -top-0 flex flex-col items-center">
                    <div className="w-1 h-6 bg-[#1a56db]" />
                    <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-[#1a56db]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Spacing for downward arrows into Level 3 */}
            <div className="h-4" />

            {/* LEVEL 3: 5 OPERATIONAL DEPARTMENTS */}
            <div className="grid grid-cols-5 gap-4 w-[1040px] pt-2">
              {/* DEPARTMENT 1: ທຸລະກິດຂີ້ເທົ່າລອຍ (Emerald / Green) */}
              <div
                onClick={() =>
                  handleNodeClick({
                    titleLao: 'ພະແນກ ທຸລະກິດຂີ້ເທົ່າລອຍ',
                    titleEn: 'Fly Ash Business Department',
                    subtitleLao: 'ຂຶ້ນກັບ: ຮອງຜູ້ອຳນວຍການ ທ່ານທີ 1',
                    subtitleEn: 'Supervised by: Deputy Director 1',
                    type: 'DEPARTMENT',
                    color: '#10b981',
                    deptId: 'd-1',
                    supervisorLao: 'ຮອງຜູ້ອຳນວຍການ ທ່ານທີ 1',
                    supervisorEn: '1st Deputy Managing Director',
                    headNameLao: 'ທ່ານ ບຸນມີ ໄຊຍະວົງ',
                    headNameEn: 'Mr. Bounmy Xayavong',
                    mandateLao:
                      'ຄຸ້ມຄອງການຈຳໜ່າຍ, ການຕະຫຼາດ, ການຂົນສົ່ງ ແລະ ພັດທະນາຜະລິດຕະພັນຈາກຂີ້ເທົ່າລອຍ (Fly Ash) ຂອງໂຄງການໄຟຟ້າ',
                    mandateEn:
                      'Management of fly ash commercialization, marketing, transport, and by-product utilization from thermal power plants.',
                  })
                }
                className="rounded-2xl border-2 border-[#10b981] bg-white dark:bg-slate-900 shadow-md p-4 text-center cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-xl group flex flex-col items-center justify-between min-h-[175px]"
              >
                {/* Top circular icon with dots triangle */}
                <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 mb-2 group-hover:border-[#10b981] transition-colors">
                  {/* Triangle cluster of dots representing fly ash mineral particles */}
                  <svg
                    viewBox="0 0 24 24"
                    className="w-9 h-9 fill-[#10b981]"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle cx="12" cy="4" r="2.2" />
                    <circle cx="9" cy="9" r="2.2" />
                    <circle cx="15" cy="9" r="2.2" />
                    <circle cx="6" cy="14" r="2.2" />
                    <circle cx="12" cy="14" r="2.2" />
                    <circle cx="18" cy="14" r="2.2" />
                    <circle cx="4" cy="19" r="2" />
                    <circle cx="9.3" cy="19" r="2" />
                    <circle cx="14.7" cy="19" r="2" />
                    <circle cx="20" cy="19" r="2" />
                  </svg>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    ພະແນກ
                  </span>
                  <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 leading-tight">
                    ທຸລະກິດຂີ້ເທົ່າລອຍ
                  </h4>
                </div>

                {/* Accent line */}
                <div className="w-8 h-1 bg-[#10b981] rounded-full mt-2" />
              </div>

              {/* DEPARTMENT 2: ບໍລິຫານບັນຊີ ແລະ ການເງິນ (Cyan / Teal) */}
              <div
                onClick={() =>
                  handleNodeClick({
                    titleLao: 'ພະແນກ ບໍລິຫານບັນຊີ ແລະ ການເງິນ',
                    titleEn: 'Accounting & Finance Administration Department',
                    subtitleLao: 'ຂຶ້ນກັບ: ຮອງຜູ້ອຳນວຍການ ທ່ານທີ 1',
                    subtitleEn: 'Supervised by: Deputy Director 1',
                    type: 'DEPARTMENT',
                    color: '#06b6d4',
                    deptId: 'd-2',
                    supervisorLao: 'ຮອງຜູ້ອຳນວຍການ ທ່ານທີ 1',
                    supervisorEn: '1st Deputy Managing Director',
                    headNameLao: 'ທ່ານ ນາງ ມະນີວອນ ແສງດາລາ',
                    headNameEn: 'Mrs. Maneevone Sengdala',
                    mandateLao:
                      'ຄຸ້ມຄອງວຽກງານບັນຊີ-ການເງິນ, ງົບປະມານດຳເນີນງານ, ເງິນເດືອນ ແລະ ວຽກງານບໍລິຫານທົ່ວໄປຂອງອົງກອນ',
                    mandateEn:
                      'Management of corporate accounting, financial operations, operating budgets, payroll, and general administration.',
                  })
                }
                className="rounded-2xl border-2 border-[#06b6d4] bg-white dark:bg-slate-900 shadow-md p-4 text-center cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-xl group flex flex-col items-center justify-between min-h-[175px]"
              >
                {/* Top circular icon with Coins stack */}
                <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 mb-2 group-hover:border-[#06b6d4] transition-colors">
                  <Coins className="w-9 h-9 text-[#06b6d4] stroke-[1.8]" />
                </div>

                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    ພະແນກ
                  </span>
                  <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 leading-tight">
                    ບໍລິຫານບັນຊີ <br /> ແລະ ການເງິນ
                  </h4>
                </div>

                {/* Accent line */}
                <div className="w-8 h-1 bg-[#06b6d4] rounded-full mt-2" />
              </div>

              {/* DEPARTMENT 3: ທຸລະກິດແຜນການ (Purple) */}
              <div
                onClick={() =>
                  handleNodeClick({
                    titleLao: 'ພະແນກ ທຸລະກິດແຜນການ',
                    titleEn: 'Business Planning Department',
                    subtitleLao: 'ຂຶ້ນກັບ: ຮອງຜູ້ອຳນວຍການ ທ່ານທີ 2',
                    subtitleEn: 'Supervised by: Deputy Director 2',
                    type: 'DEPARTMENT',
                    color: '#8b5cf6',
                    deptId: 'd-3',
                    supervisorLao: 'ຮອງຜູ້ອຳນວຍການ ທ່ານທີ 2',
                    supervisorEn: '2nd Deputy Managing Director',
                    headNameLao: 'ທ່ານ ສົມພອນ ອິນທະວົງ',
                    headNameEn: 'Mr. Somphone Inthavong',
                    mandateLao:
                      'ຄົ້ນຄວ້າ, ວາງແຜນທຸລະກິດຍຸດທະສາດ, ວິເຄາະໂຄງການລົງທຶນ ແລະ ຕິດຕາມແຜນດຳເນີນງານປະຈຳປີ',
                    mandateEn:
                      'Strategic business planning, investment portfolio analysis, performance metrics, and annual corporate operating plans.',
                  })
                }
                className="rounded-2xl border-2 border-[#8b5cf6] bg-white dark:bg-slate-900 shadow-md p-4 text-center cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-xl group flex flex-col items-center justify-between min-h-[175px]"
              >
                {/* Top circular icon with rising bar chart */}
                <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 mb-2 group-hover:border-[#8b5cf6] transition-colors">
                  <TrendingUp className="w-9 h-9 text-[#8b5cf6] stroke-[2]" />
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    ພະແນກ
                  </span>
                  <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 leading-tight">
                    ທຸລະກິດແຜນການ
                  </h4>
                </div>

                {/* Accent line */}
                <div className="w-8 h-1 bg-[#8b5cf6] rounded-full mt-2" />
              </div>

              {/* DEPARTMENT 4: ພັດທະນາ (Orange) */}
              <div
                onClick={() =>
                  handleNodeClick({
                    titleLao: 'ພະແນກ ພັດທະນາ',
                    titleEn: 'Development Department',
                    subtitleLao: 'ຂຶ້ນກັບ: ຮອງຜູ້ອຳນວຍການ ທ່ານທີ 3',
                    subtitleEn: 'Supervised by: Deputy Director 3',
                    type: 'DEPARTMENT',
                    color: '#f97316',
                    deptId: 'd-4',
                    supervisorLao: 'ຮອງຜູ້ອຳນວຍການ ທ່ານທີ 3',
                    supervisorEn: '3rd Deputy Managing Director',
                    headNameLao: 'ທ່ານ ວິໄຊ ຫຼວງລາດ',
                    headNameEn: 'Mr. Vixay Luangrath',
                    mandateLao:
                      'ພັດທະນາໂຄງການພະລັງງານໄຟຟ້າໃໝ່, ໂຄງລ່າງພື້ນຖານ, ນະວັດຕະກໍາ ແລະ ການຮ່ວມມືກັບຄູ່ຮ່ວມລົງທຶນ',
                    mandateEn:
                      'New energy project origination, infrastructure development, technical innovation, and joint venture project execution.',
                  })
                }
                className="rounded-2xl border-2 border-[#f97316] bg-white dark:bg-slate-900 shadow-md p-4 text-center cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-xl group flex flex-col items-center justify-between min-h-[175px]"
              >
                {/* Top circular icon with cog / gear */}
                <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 mb-2 group-hover:border-[#f97316] transition-colors">
                  <Settings className="w-9 h-9 text-[#f97316] stroke-[2]" />
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    ພະແນກ
                  </span>
                  <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 leading-tight">
                    ພັດທະນາ
                  </h4>
                </div>

                {/* Accent line */}
                <div className="w-8 h-1 bg-[#f97316] rounded-full mt-2" />
              </div>

              {/* DEPARTMENT 5: ກວດສອບພາຍໃນ (Red / Rose) */}
              <div
                onClick={() =>
                  handleNodeClick({
                    titleLao: 'ພະແນກ ກວດສອບພາຍໃນ',
                    titleEn: 'Internal Audit Department',
                    subtitleLao: 'ຂຶ້ນກັບ: ຮອງຜູ້ອຳນວຍການ ທ່ານທີ 3',
                    subtitleEn: 'Supervised by: Deputy Director 3',
                    type: 'DEPARTMENT',
                    color: '#f43f5e',
                    deptId: 'd-5',
                    supervisorLao: 'ຮອງຜູ້ອຳນວຍການ ທ່ານທີ 3',
                    supervisorEn: '3rd Deputy Managing Director',
                    headNameLao: 'ທ່ານ ຄຳຫຼ້າ ພົມມະວົງ',
                    headNameEn: 'Mr. Khamla Phommavong',
                    mandateLao:
                      'ກວດສອບຄວາມສອດຄ່ອງທາງດ້ານບັນຊີ-ການເງິນ, ການປະຕິບັດຕາມລະບຽບກົດໝາຍ ແລະ ການຄຸ້ມຄອງຄວາມສ່ຽງພາຍໃນ',
                    mandateEn:
                      'Internal financial audit, compliance verification, statutory adherence, governance oversight, and enterprise risk review.',
                  })
                }
                className="rounded-2xl border-2 border-[#f43f5e] bg-white dark:bg-slate-900 shadow-md p-4 text-center cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-xl group flex flex-col items-center justify-between min-h-[175px]"
              >
                {/* Top circular icon with magnifying glass */}
                <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 mb-2 group-hover:border-[#f43f5e] transition-colors">
                  <Search className="w-9 h-9 text-[#f43f5e] stroke-[2.2]" />
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    ພະແນກ
                  </span>
                  <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 leading-tight">
                    ກວດສອບພາຍໃນ
                  </h4>
                </div>

                {/* Accent line */}
                <div className="w-8 h-1 bg-[#f43f5e] rounded-full mt-2" />
              </div>
            </div>
          </div>

          {/* Official Sign-off & Verification Footer (included in export & print) */}
          <div className="mt-12 pt-6 border-t-2 border-slate-200">
            <div className="grid grid-cols-3 gap-6 text-center text-xs">
              {/* Signatory 1 */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col items-center justify-between h-32">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {language === 'lo' ? 'ຜູ້ອຳນວຍການໃຫຍ່' : 'Managing Director / CEO'}
                </div>
                <div className="text-slate-400 italic text-xs my-auto font-serif">
                  [ ໄດ້ຮັບການອະນຸມັດ / Approved & Signed ]
                </div>
                <div className="font-bold text-slate-800 border-t border-slate-300 w-4/5 pt-1 text-[11px]">
                  ທ່ານ ບຸນເລີດ ຫລວງລາດ
                </div>
              </div>

              {/* Signatory 2 */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col items-center justify-between h-32">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {language === 'lo' ? 'ຄະນະກວດກາພາຍໃນ' : 'Internal Audit Committee'}
                </div>
                <div className="text-slate-400 italic text-xs my-auto font-serif">
                  [ ກວດກາຖືກຕ້ອງ / Verified & Compliant ]
                </div>
                <div className="font-bold text-slate-800 border-t border-slate-300 w-4/5 pt-1 text-[11px]">
                  ທ່ານ ຄຳຫຼ້າ ພົມມະວົງ
                </div>
              </div>

              {/* Signatory 3 */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col items-center justify-between h-32">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {language === 'lo' ? 'ພະແນກບໍລິຫານ & ຊັບພະຍາກອນມະນຸດ' : 'HR & Administration Division'}
                </div>
                <div className="text-slate-400 italic text-xs my-auto font-serif">
                  [ ທະບຽນບຸກຄະລາກອນ / Certified ]
                </div>
                <div className="font-bold text-slate-800 border-t border-slate-300 w-4/5 pt-1 text-[11px]">
                  LHSE Human Resources
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>Lao Holding State Enterprise (LHSE) • Core HRIS Management</span>
              <span>CONFIDENTIAL & OFFICIAL • ສຳລັບໃຊ້ໃນວຽກງານລັດຖະການເທົ່ານັ້ນ</span>
              <span>Official Release 2026</span>
            </div>
          </div>
        </div>
      </div>

      {/* NODE DETAILS MODAL */}
      {selectedNode && (
        <Modal
          isOpen={Boolean(selectedNode)}
          onClose={() => setSelectedNode(null)}
          title={
            language === 'lo'
              ? `ລາຍລະອຽດ: ${selectedNode.titleLao}`
              : `Division Overview: ${selectedNode.titleEn}`
          }
          subtitle={language === 'lo' ? selectedNode.subtitleLao : selectedNode.subtitleEn}
          maxWidth="2xl"
        >
          <div className="space-y-5">
            {/* Header Banner */}
            <div
              className="p-4 rounded-2xl text-white flex items-center justify-between"
              style={{ backgroundColor: selectedNode.color }}
            >
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-white/80 block">
                  {selectedNode.type}
                </span>
                <h3 className="text-lg font-black text-white">{selectedNode.titleLao}</h3>
                <p className="text-xs text-white/90 font-medium">{selectedNode.titleEn}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white backdrop-blur-xs">
                {selectedNode.type === 'DIRECTOR' ? (
                  <User className="w-7 h-7" />
                ) : selectedNode.type === 'DEPUTY' ? (
                  <Users className="w-7 h-7" />
                ) : (
                  <Building2 className="w-7 h-7" />
                )}
              </div>
            </div>

            {/* Leadership & Mandate Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-slate-400 font-bold block">
                  {language === 'lo' ? 'ຫົວໜ້າ / ຜູ້ຮັບຜິດຊອບ:' : 'Leader / Department Head:'}
                </span>
                <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  {language === 'lo' ? selectedNode.headNameLao : selectedNode.headNameEn}
                </div>
              </div>

              {selectedNode.supervisorLao && (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                  <span className="text-slate-400 font-bold block">
                    {language === 'lo' ? 'ສາຍການລາຍງານ / ຜູ້ຊີ້ນຳ:' : 'Reporting Line / Supervisor:'}
                  </span>
                  <div className="font-bold text-sm text-blue-600 dark:text-blue-400">
                    {language === 'lo' ? selectedNode.supervisorLao : selectedNode.supervisorEn}
                  </div>
                </div>
              )}
            </div>

            {/* Scope / Mandate Description */}
            {selectedNode.mandateLao && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  {language === 'lo' ? 'ຂອບເຂດໜ້າທີ່ & ພາລະບົດບາດ' : 'Mandate & Key Responsibilities'}
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {language === 'lo' ? selectedNode.mandateLao : selectedNode.mandateEn}
                </p>
              </div>
            )}

            {/* Staff list if Department */}
            {selectedNode.deptId && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {language === 'lo' ? 'ພະນັກງານໃນສັງກັດ' : 'Assigned Personnel'}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500 font-bold">
                    {employees.filter((e) => e.departmentId === selectedNode.deptId).length}{' '}
                    {language === 'lo' ? 'ທ່ານ' : 'staff members'}
                  </span>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {employees
                    .filter((e) => e.departmentId === selectedNode.deptId)
                    .map((emp) => (
                      <div
                        key={emp.id}
                        className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-mono font-bold text-[10px] text-slate-600 dark:text-slate-300">
                            {emp.firstNameEn.substring(0, 1)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-slate-100 block">
                              {language === 'lo'
                                ? `${emp.firstNameLao} ${emp.lastNameLao}`
                                : `${emp.firstNameEn} ${emp.lastNameEn}`}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {emp.employeeCode}
                            </span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {emp.employmentType}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setSelectedNode(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 hover:opacity-90 transition-opacity"
              >
                {language === 'lo' ? 'ປິດ' : 'Close'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
