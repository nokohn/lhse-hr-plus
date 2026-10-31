import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { Column } from './DataTable.tsx';
import {
  FileSpreadsheet,
  FileText,
  Printer,
  ChevronDown,
  Download,
  Loader2,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import {
  exportTableToCSV,
  exportTableToPDF,
  openPrintableTablePDF,
  exportTableToExcel,
} from '../../utils/tableExportUtility.ts';
import { alerts } from '../../utils/alerts.ts';

interface TableExportMenuProps<T> {
  data: T[];
  columns: Column<T>[];
  filename?: string;
  title?: string;
  subtitle?: string;
  className?: string;
}

export function TableExportMenu<T extends Record<string, any>>({
  data,
  columns,
  filename = 'LHSE_Report',
  title,
  subtitle,
  className = '',
}: TableExportMenuProps<T>) {
  const { language } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState<'csv' | 'pdf' | 'excel' | null>(null);

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

  const reportTitle = title || filename.replace(/_/g, ' ');

  const handleCSV = async () => {
    try {
      setIsExporting('csv');
      await new Promise((r) => setTimeout(r, 450));
      const res = await exportTableToCSV({
        data,
        columns,
        filename,
        title: reportTitle,
        subtitle,
        language,
      });
      alerts.success(
        language === 'lo' ? 'ສົ່ງອອກ CSV ສຳເລັດ' : 'CSV Export Completed',
        language === 'lo'
          ? `ດາວໂຫຼດຂໍ້ມູນ ${res.count} ລາຍການລົງໃນໄຟລ໌ ${res.filename} ແລ້ວ.`
          : `Downloaded ${res.count} records to ${res.filename}.`
      );
      setIsOpen(false);
    } catch (e: any) {
      if (e?.message !== 'No data to export') {
        alerts.error(language === 'lo' ? 'ເກີດຂໍ້ຜິດພາດ' : 'Export Error', String(e));
      }
    } finally {
      setIsExporting(null);
    }
  };

  const handlePDF = async () => {
    try {
      setIsExporting('pdf');
      await new Promise((r) => setTimeout(r, 600));
      const res = await exportTableToPDF({
        data,
        columns,
        filename,
        title: reportTitle,
        subtitle,
        language,
      });
      alerts.success(
        language === 'lo' ? 'ສົ່ງອອກ PDF ສຳເລັດ' : 'PDF Export Completed',
        language === 'lo'
          ? `ດາວໂຫຼດເອກະສານທາງການ ${res.filename} (${res.count} ລາຍການ) ແລ້ວ.`
          : `Downloaded official report ${res.filename} (${res.count} records).`
      );
      setIsOpen(false);
    } catch (e: any) {
      if (e?.message !== 'No data to export') {
        alerts.error(language === 'lo' ? 'ເກີດຂໍ້ຜິດພາດ' : 'Export Error', String(e));
      }
    } finally {
      setIsExporting(null);
    }
  };

  const handleExcel = async () => {
    try {
      setIsExporting('excel');
      await new Promise((r) => setTimeout(r, 450));
      const res = await exportTableToExcel({
        data,
        columns,
        filename,
        language,
      });
      alerts.success(
        language === 'lo' ? 'ສົ່ງອອກ Excel ສຳເລັດ' : 'Excel Export Completed',
        language === 'lo'
          ? `ດາວໂຫຼດໄຟລ໌ Excel ${res.filename} (${res.count} ລາຍການ) ແລ້ວ.`
          : `Downloaded Excel spreadsheet ${res.filename} (${res.count} records).`
      );
      setIsOpen(false);
    } catch (e: any) {
      if (e?.message !== 'No data to export') {
        alerts.error(language === 'lo' ? 'ເກີດຂໍ້ຜິດພາດ' : 'Export Error', String(e));
      }
    } finally {
      setIsExporting(null);
    }
  };

  const handlePrint = () => {
    openPrintableTablePDF({
      data,
      columns,
      title: reportTitle,
      subtitle,
      language,
    });
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block ${className}`} ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting !== null}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer ${
          isOpen
            ? 'bg-emerald-700 text-white ring-2 ring-emerald-500/30'
            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800'
        }`}
        title={language === 'lo' ? 'ສົ່ງອອກລາຍງານ (CSV, PDF, Excel)' : 'Export report (CSV, PDF, Excel)'}
      >
        {isExporting ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Download className="w-3.5 h-3.5" />
        )}
        <span>{language === 'lo' ? 'ສົ່ງອອກລາຍງານ' : 'Export Report'}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-76 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2.5 z-50 animate-in fade-in zoom-in-95 backdrop-blur-xl">
          <div className="px-2.5 py-1.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{language === 'lo' ? 'ຮູບແບບການດາວໂຫຼດ' : 'Export File Formats'}</span>
            </span>
            <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
              {data.length} {language === 'lo' ? 'ແຖວ' : 'rows'}
            </span>
          </div>

          <div className="space-y-1">
            {/* CSV Option */}
            <button
              type="button"
              onClick={handleCSV}
              disabled={isExporting !== null}
              className="w-full flex items-center gap-2.5 p-2 rounded-xl text-left hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors cursor-pointer group"
            >
              <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-xs flex items-center justify-between">
                  <span>{language === 'lo' ? 'ດາວໂຫຼດ CSV (.csv)' : 'CSV Spreadsheet (.csv)'}</span>
                  <span className="text-[10px] font-mono text-emerald-600 font-semibold">UTF-8</span>
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {language === 'lo' ? 'ຮອງຮັບພາສາລາວສຳລັບ Excel' : 'Lao UTF-8 BOM encoding'}
                </div>
              </div>
            </button>

            {/* PDF Option */}
            <button
              type="button"
              onClick={handlePDF}
              disabled={isExporting !== null}
              className="w-full flex items-center gap-2.5 p-2 rounded-xl text-left hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-200 hover:text-rose-700 dark:hover:text-rose-300 transition-colors cursor-pointer group"
            >
              <div className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 group-hover:scale-105 transition-transform">
                <FileText className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-xs flex items-center justify-between">
                  <span>{language === 'lo' ? 'ດາວໂຫຼດ PDF (.pdf)' : 'PDF Official Report (.pdf)'}</span>
                  <span className="text-[10px] font-mono text-rose-600 font-semibold">PDF</span>
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {language === 'lo' ? 'ເອກະສານທາງການ LHSE' : 'Certified administrative report'}
                </div>
              </div>
            </button>

            {/* Printable PDF Preview */}
            <button
              type="button"
              onClick={handlePrint}
              disabled={isExporting !== null}
              className="w-full flex items-center gap-2.5 p-2 rounded-xl text-left hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-200 hover:text-blue-700 dark:hover:text-blue-300 transition-colors cursor-pointer group"
            >
              <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
                <Printer className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-xs flex items-center justify-between">
                  <span>{language === 'lo' ? 'ພິມ / Save PDF ທາງການ' : 'Print / Save Formal PDF'}</span>
                  <span className="text-[10px] font-mono text-blue-600 font-semibold">Print</span>
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {language === 'lo' ? 'ພ້ອມຫົວຈົດໝາຍ & ຊ່ອງເຊັນອະນຸມັດ' : 'With letterhead & signatures'}
                </div>
              </div>
            </button>

            {/* Excel Option */}
            <button
              type="button"
              onClick={handleExcel}
              disabled={isExporting !== null}
              className="w-full flex items-center gap-2.5 p-2 rounded-xl text-left hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors cursor-pointer group"
            >
              <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-xs flex items-center justify-between">
                  <span>{language === 'lo' ? 'ດາວໂຫຼດ Excel (.xlsx)' : 'Excel Spreadsheet (.xlsx)'}</span>
                  <span className="text-[10px] font-mono text-emerald-600 font-semibold">XLSX</span>
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {language === 'lo' ? 'ຮູບແບບ Microsoft Excel ມາດຕະຖານ' : 'Full multi-column workbook'}
                </div>
              </div>
            </button>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 px-1 flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span>LHSE System Report</span>
            </span>
            <span>Live Data</span>
          </div>
        </div>
      )}
    </div>
  );
}
