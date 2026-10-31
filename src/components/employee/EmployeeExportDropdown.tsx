import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { Employee } from '../../types/index.ts';
import {
  FileSpreadsheet,
  FileText,
  Printer,
  ChevronDown,
  Download,
  CheckCircle2,
  Users,
  Loader2,
  Sparkles,
} from 'lucide-react';
import {
  exportEmployeesToCSV,
  exportEmployeesToPDF,
  openPrintablePDFRoster,
} from '../../utils/mockExportHandlers.ts';
import { alerts } from '../../utils/alerts.ts';

interface EmployeeExportDropdownProps {
  employees: Employee[];
}

export const EmployeeExportDropdown: React.FC<EmployeeExportDropdownProps> = ({ employees }) => {
  const { language, departments, positions, branches } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [filterActiveOnly, setFilterActiveOnly] = useState(false);
  const [isExporting, setIsExporting] = useState<'csv' | 'pdf' | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
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

  const dataToExport = filterActiveOnly
    ? employees.filter((e) => e.status === 'ACTIVE')
    : employees;

  const handleExportCSV = async () => {
    try {
      setIsExporting('csv');
      // Simulated processing delay for realistic handler feel
      await new Promise((r) => setTimeout(r, 600));

      const result = await exportEmployeesToCSV(
        dataToExport,
        departments,
        positions,
        branches,
        language
      );

      alerts.success(
        language === 'lo' ? 'ສົ່ງອອກ CSV ສຳເລັດ' : 'CSV Export Completed',
        language === 'lo'
          ? `ດາວໂຫຼດຂໍ້ມູນພະນັກງານ ${result.count} ຄົນລົງໃນໄຟລ໌ ${result.filename} ແລ້ວ.`
          : `Successfully exported ${result.count} employee records to ${result.filename}.`
      );
      setIsOpen(false);
    } catch (err) {
      alerts.error(
        language === 'lo' ? 'ເກີດຂໍ້ຜິດພາດໃນການສົ່ງອອກ' : 'Export Failed',
        String(err)
      );
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportPDF = async () => {
    try {
      setIsExporting('pdf');
      // Simulated processing delay for realistic handler feel
      await new Promise((r) => setTimeout(r, 750));

      const result = await exportEmployeesToPDF(
        dataToExport,
        departments,
        positions,
        branches,
        language
      );

      alerts.success(
        language === 'lo' ? 'ສົ່ງອອກ PDF ສຳເລັດ' : 'PDF Export Completed',
        language === 'lo'
          ? `ດາວໂຫຼດເອກະສານທາງການ ${result.filename} (${result.count} ຄົນ) ແລ້ວ.`
          : `Downloaded official employee roster ${result.filename} (${result.count} records).`
      );
      setIsOpen(false);
    } catch (err) {
      alerts.error(
        language === 'lo' ? 'ເກີດຂໍ້ຜິດພາດໃນການສົ່ງອອກ' : 'Export Failed',
        String(err)
      );
    } finally {
      setIsExporting(null);
    }
  };

  const handlePrintPDF = () => {
    openPrintablePDFRoster(dataToExport, departments, positions, branches, language);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Primary Export Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting !== null}
        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
          isOpen
            ? 'bg-emerald-700 text-white ring-2 ring-emerald-500/30'
            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
        }`}
        title={language === 'lo' ? 'ສົ່ງອອກລາຍຊື່ພະນັກງານ (CSV ຫຼື PDF)' : 'Export employee roster in CSV or PDF'}
      >
        {isExporting ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Download className="w-3.5 h-3.5" />
        )}
        <span>{language === 'lo' ? 'ສົ່ງອອກຂໍ້ມູນ' : 'Export Data'}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Export Format Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-88 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3 z-50 animate-in fade-in zoom-in-95 backdrop-blur-xl">
          {/* Header */}
          <div className="px-2 pb-2.5 mb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 dark:text-slate-100">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{language === 'lo' ? 'ເລືອກຮູບແບບການສົ່ງອອກ' : 'Choose Export Format'}</span>
            </div>
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
              {dataToExport.length} {language === 'lo' ? 'ຄົນ' : 'staff'}
            </span>
          </div>

          {/* Scope Filter: All vs Active Only */}
          <div className="px-2 py-1.5 mb-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
              {language === 'lo' ? 'ສະເພາະພະນັກງານປະຕິບັດງານ:' : 'Active Staff Only:'}
            </span>
            <button
              type="button"
              onClick={() => setFilterActiveOnly(!filterActiveOnly)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                filterActiveOnly ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  filterActiveOnly ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Export Options List */}
          <div className="space-y-1.5">
            {/* 1. CSV Option */}
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={isExporting !== null}
              className="w-full flex items-start gap-3 p-2.5 rounded-xl text-left hover:bg-emerald-50/70 dark:hover:bg-emerald-950/40 border border-transparent hover:border-emerald-200 dark:hover:border-emerald-800/60 transition-all cursor-pointer group"
            >
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 group-hover:scale-105 transition-transform shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-xs text-slate-800 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
                    {language === 'lo' ? 'ດາວໂຫຼດໄຟລ໌ CSV (.csv)' : 'Download CSV File (.csv)'}
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded">
                    Excel
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                  {language === 'lo'
                    ? 'UTF-8 BOM ຮອງຮັບພາສາລາວ 100%, ເໝາະສຳລັບ Excel ແລະ Google Sheets'
                    : 'UTF-8 BOM with full Lao font support for Excel, Sheets & Numbers'}
                </p>
              </div>
            </button>

            {/* 2. PDF File Download Option */}
            <button
              type="button"
              onClick={handleExportPDF}
              disabled={isExporting !== null}
              className="w-full flex items-start gap-3 p-2.5 rounded-xl text-left hover:bg-rose-50/70 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-800/60 transition-all cursor-pointer group"
            >
              <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 group-hover:scale-105 transition-transform shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-xs text-slate-800 dark:text-slate-100 group-hover:text-rose-700 dark:group-hover:text-rose-300">
                    {language === 'lo' ? 'ດາວໂຫຼດໄຟລ໌ PDF (.pdf)' : 'Download PDF Document (.pdf)'}
                  </div>
                  <span className="text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/80 px-1.5 py-0.5 rounded">
                    PDF
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                  {language === 'lo'
                    ? 'ເອກະສານທາງການ LHSE Roster ສຳລັບການເກັບຮັກສາ ແລະ ແນບລາຍງານ'
                    : 'Official LHSE personnel roster formatted for executive filing'}
                </p>
              </div>
            </button>

            {/* 3. Printable PDF Preview Option */}
            <button
              type="button"
              onClick={handlePrintPDF}
              disabled={isExporting !== null}
              className="w-full flex items-start gap-3 p-2.5 rounded-xl text-left hover:bg-blue-50/70 dark:hover:bg-blue-950/40 border border-transparent hover:border-blue-200 dark:hover:border-blue-800/60 transition-all cursor-pointer group"
            >
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 group-hover:scale-105 transition-transform shrink-0">
                <Printer className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-xs text-slate-800 dark:text-slate-100 group-hover:text-blue-700 dark:group-hover:text-blue-300">
                    {language === 'lo' ? 'ພິມ / ບັນທຶກ PDF ທາງການ' : 'Print / Save Formal PDF'}
                  </div>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/80 px-1.5 py-0.5 rounded">
                    Print
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                  {language === 'lo'
                    ? 'ເບິ່ງຕົວຢ່າງເອກະສານຫົວຂໍ້ລັດວິສາຫະກິດ ພ້ອມຊ່ອງເຊັນອະນຸມັດ ແລະ ສັ່ງພິມ/Save PDF'
                    : 'Opens printable layout with LHSE letterhead & signature endorsement lines'}
                </p>
              </div>
            </button>
          </div>

          {/* Footer Info */}
          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 px-1 flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span>{language === 'lo' ? 'ຂໍ້ມູນລະບົບປັດຈຸບັນ' : 'Live System Data'}</span>
            </span>
            <span>LHSE HR Plus+</span>
          </div>
        </div>
      )}
    </div>
  );
};
