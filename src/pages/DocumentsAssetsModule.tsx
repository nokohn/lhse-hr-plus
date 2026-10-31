import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { DataTable, Column } from '../components/common/DataTable.tsx';
import { Modal } from '../components/common/Modal.tsx';
import { Asset, EnterpriseDocument, DocumentCategory } from '../types/index.ts';
import { DocumentVersionHistoryModal } from '../components/documents/DocumentVersionHistoryModal.tsx';
import { DocumentEditModal } from '../components/documents/DocumentEditModal.tsx';
import { DocumentCreateModal } from '../components/documents/DocumentCreateModal.tsx';
import { DocumentUploadModal } from '../components/documents/DocumentUploadModal.tsx';
import { DocumentTagEditModal } from '../components/documents/DocumentTagEditModal.tsx';
import { DocumentTagBadge } from '../components/documents/DocumentTagBadge.tsx';
import { DocumentScannerModal } from '../components/documents/DocumentScannerModal.tsx';
import { alerts } from '../utils/alerts.ts';
import {
  FolderArchive,
  Laptop,
  Plus,
  ArrowRightLeft,
  FileText,
  Download,
  History,
  RotateCcw,
  GitCompare,
  FileEdit,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  ShieldCheck,
  Tag,
  Building,
  Eye,
  FileCheck,
  UploadCloud,
  X,
  Bookmark,
  Camera,
} from 'lucide-react';

export const DocumentsAssetsModule: React.FC = () => {
  const {
    t,
    language,
    employees,
    departments,
    assets,
    documents,
    activeSubModule,
    setActiveSubModule,
    assignAssetToEmployee,
    returnAssetToInventory,
  } = useApp();

  // Document Versioning & Tag Filter states
  const [docSearchQuery, setDocSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ALL');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('ALL');

  // Modals state
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedDocForHistory, setSelectedDocForHistory] = useState<EnterpriseDocument | null>(null);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedDocForEdit, setSelectedDocForEdit] = useState<EnterpriseDocument | null>(null);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [scannerModalOpen, setScannerModalOpen] = useState(false);

  const [tagEditModalOpen, setTagEditModalOpen] = useState(false);
  const [selectedDocForTagEdit, setSelectedDocForTagEdit] = useState<EnterpriseDocument | null>(null);

  // Asset Assignment states
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [assignEmpId, setAssignEmpId] = useState(employees[0]?.id || 'emp-001');

  // Determine current active submodule (defaulting to 'documents' if 'overview' or 'documents')
  const currentSub = activeSubModule === 'assets' ? 'assets' : activeSubModule === 'templates' ? 'templates' : 'documents';

  // Compute all unique tags across documents with frequency counts
  const allUniqueTagsWithCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    documents.forEach((doc) => {
      doc.tags?.forEach((tag) => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [documents]);

  // Filtered documents by search query, category, department, and custom tag
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const q = docSearchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        doc.docNumber.toLowerCase().includes(q) ||
        doc.title.toLowerCase().includes(q) ||
        doc.titleLao.toLowerCase().includes(q) ||
        doc.description.toLowerCase().includes(q) ||
        doc.content.toLowerCase().includes(q) ||
        doc.tags?.some((t) => t.toLowerCase().includes(q));

      const matchesCategory = selectedCategory === 'ALL' || doc.category === selectedCategory;
      const matchesDept = selectedDeptFilter === 'ALL' || doc.departmentId === selectedDeptFilter;
      const matchesTag =
        selectedTagFilter === 'ALL' ||
        doc.tags?.some((t) => t.toLowerCase() === selectedTagFilter.toLowerCase());

      return matchesSearch && matchesCategory && matchesDept && matchesTag;
    });
  }, [documents, docSearchQuery, selectedCategory, selectedDeptFilter, selectedTagFilter]);

  // Document KPI stats
  const totalRevisionsCount = useMemo(() => {
    return documents.reduce((sum, d) => sum + d.versions.length, 0);
  }, [documents]);

  const totalConfidentialCount = useMemo(() => {
    return documents.filter((d) => d.tags?.some((t) => t.toLowerCase() === 'confidential')).length;
  }, [documents]);

  const totalTaxCount = useMemo(() => {
    return documents.filter((d) => d.tags?.some((t) => t.toLowerCase() === 'tax')).length;
  }, [documents]);

  const totalContractCount = useMemo(() => {
    return documents.filter((d) =>
      d.tags?.some((t) => t.toLowerCase() === 'employee contract' || t.toLowerCase() === 'contract')
    ).length;
  }, [documents]);

  const totalScannedCount = useMemo(() => {
    return documents.filter((d) => d.isScanned || d.tags?.some((t) => t.toLowerCase().includes('scanned'))).length;
  }, [documents]);

  // Asset handlers
  const handleOpenAssign = (ast: Asset) => {
    setSelectedAsset(ast);
    setAssignEmpId(employees[0]?.id || 'emp-001');
    setAssignModalOpen(true);
  };

  const handleConfirmAssign = () => {
    if (!selectedAsset) return;
    assignAssetToEmployee(selectedAsset.id, assignEmpId);
    setAssignModalOpen(false);
  };

  const handleReturn = async (ast: Asset) => {
    const confirmed = await alerts.confirm(
      language === 'lo' ? 'ຢືນຢັນການຮັບຄືນຊັບສິນ' : 'Confirm Return',
      `${language === 'lo' ? 'ຮັບຄືນ' : 'Return'} ${ast.assetTag} (${ast.name}) ${language === 'lo' ? 'ເຂົ້າສູ່ສາງ ຫຼື ບໍ່?' : 'to inventory?'}`
    );
    if (confirmed) {
      returnAssetToInventory(ast.id);
    }
  };

  const assetColumns: Column<Asset>[] = [
    {
      key: 'assetTag',
      header: 'Tag #',
      render: (a) => <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{a.assetTag}</span>,
    },
    { key: 'name', header: 'Asset Name' },
    { key: 'category', header: 'Category' },
    { key: 'serialNumber', header: 'Serial Number' },
    {
      key: 'assignedEmployeeId',
      header: 'Assigned To',
      render: (a) => {
        if (!a.assignedEmployeeId) return <span className="text-slate-400 italic">Unassigned</span>;
        const emp = employees.find((e) => e.id === a.assignedEmployeeId);
        return (
          <span className="font-bold text-slate-800 dark:text-slate-200">
            {emp ? (language === 'lo' ? `${emp.firstNameLao} ${emp.lastNameLao}` : `${emp.firstNameEn} ${emp.lastNameEn}`) : a.assignedEmployeeId}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: t('status'),
      render: (a) => (
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            a.status === 'ASSIGNED'
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
          }`}
        >
          {a.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('actions'),
      sortable: false,
      render: (a) => (
        <div>
          {a.status === 'AVAILABLE' ? (
            <button
              onClick={() => handleOpenAssign(a)}
              className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-bold text-[11px] shadow-xs hover:bg-blue-500 transition-colors"
            >
              Assign
            </button>
          ) : (
            <button
              onClick={() => handleReturn(a)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 dark:bg-slate-800 dark:text-slate-300 font-bold text-[11px] border border-slate-200 dark:border-slate-700 transition-colors"
            >
              Return
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Submodule Tabs Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveSubModule('documents')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              currentSub === 'documents'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>{language === 'lo' ? 'ຄັງເອກະສານ & ລະບົບຄວບຄຸມເວີຊັນ' : 'Document Version Control'} ({documents.length})</span>
          </button>

          <button
            onClick={() => setActiveSubModule('assets')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              currentSub === 'assets'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span>{t('assetRegister')} ({assets.length})</span>
          </button>

          <button
            onClick={() => setActiveSubModule('templates')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              currentSub === 'templates'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{t('templates')}</span>
          </button>
        </div>

        {currentSub === 'documents' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setScannerModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              title={language === 'lo' ? 'ສະແກນເອກະສານຕົວຈິງດ້ວຍກ້ອງຖ່າຍຮູບ' : 'Scan Physical Document with Camera'}
            >
              <Camera className="w-4 h-4 text-emerald-100" />
              <span>{language === 'lo' ? 'ສະແກນເອກະສານດ້ວຍກ້ອງ' : 'Scan Document'}</span>
            </button>

            <button
              onClick={() => setUploadModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              <UploadCloud className="w-4 h-4 text-blue-200" />
              <span>{language === 'lo' ? 'ອັບໂຫຼດ & ຕິດປ້າຍກຳກັບ' : 'Upload & Tag File'}</span>
            </button>

            <button
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors"
            >
              <Plus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>{language === 'lo' ? 'ສ້າງເອກະສານ' : 'New Document'}</span>
            </button>
          </div>
        )}
      </div>

      {/* SUBMODULE 1: DOCUMENT REPOSITORY & VERSION CONTROL */}
      {currentSub === 'documents' && (
        <div className="space-y-5">
          {/* Summary Tag & KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
            <div
              onClick={() => setSelectedTagFilter(selectedTagFilter === 'Confidential' ? 'ALL' : 'Confidential')}
              className={`border rounded-2xl p-4 shadow-xs cursor-pointer transition-all ${
                selectedTagFilter === 'Confidential'
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 ring-2 ring-rose-200 dark:ring-rose-900'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-rose-300'
              }`}
            >
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
                <span className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Confidential
                </span>
                <ShieldCheck className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-2">
                {totalConfidentialCount}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {language === 'lo' ? 'ເອກະສານລັບອົງກອນ' : 'Classified files'}
              </div>
            </div>

            <div
              onClick={() => setSelectedTagFilter(selectedTagFilter === 'Tax' ? 'ALL' : 'Tax')}
              className={`border rounded-2xl p-4 shadow-xs cursor-pointer transition-all ${
                selectedTagFilter === 'Tax'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 ring-2 ring-emerald-200 dark:ring-emerald-900'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-300'
              }`}
            >
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
                <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Tax & Statutory
                </span>
                <FileCheck className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-2">
                {totalTaxCount}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {language === 'lo' ? 'ອາກອນ & ປະກັນສັງຄົມ' : 'Fiscal & LSSO records'}
              </div>
            </div>

            <div
              onClick={() => setSelectedTagFilter(selectedTagFilter === 'Employee Contract' ? 'ALL' : 'Employee Contract')}
              className={`border rounded-2xl p-4 shadow-xs cursor-pointer transition-all ${
                selectedTagFilter === 'Employee Contract'
                  ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 ring-2 ring-blue-200 dark:ring-blue-900'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-300'
              }`}
            >
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
                <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  Employee Contract
                </span>
                <FileText className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-2">
                {totalContractCount}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {language === 'lo' ? 'ສັນຍາຈ້າງງານ & ບຸກຄະລາກອນ' : 'Staff agreements'}
              </div>
            </div>

            <div
              onClick={() => setSelectedTagFilter(selectedTagFilter === 'Scanned Document' ? 'ALL' : 'Scanned Document')}
              className={`border rounded-2xl p-4 shadow-xs cursor-pointer transition-all ${
                selectedTagFilter === 'Scanned Document'
                  ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-300 dark:border-teal-800 ring-2 ring-teal-200 dark:ring-teal-900'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-teal-300'
              }`}
            >
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
                <span className="font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-teal-500" />
                  Scanned Physical
                </span>
                <Camera className="w-4 h-4 text-teal-500" />
              </div>
              <div className="text-2xl font-extrabold text-teal-600 dark:text-teal-400 mt-2">
                {totalScannedCount}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {language === 'lo' ? 'ເອກະສານສະແກນດິຈິຕອນ' : 'Digitized via Camera'}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
                <span>{language === 'lo' ? 'ເວີຊັນທີ່ບັນທຶກ' : 'Tracked Revisions'}</span>
                <History className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 mt-2">
                {totalRevisionsCount}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {documents.length} {language === 'lo' ? 'ເອກະສານທັງໝົດ' : 'total files'}
              </div>
            </div>
          </div>

          {/* Camera Scanner Interactive Banner */}
          <div className="p-4 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-200/90 dark:border-emerald-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>{language === 'lo' ? 'ລະບົບສະແກນເອກະສານຕົວຈິງດ້ວຍກ້ອງຖ່າຍຮູບ' : 'Instant Device Camera Document Scanner'}</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-mono font-bold border border-emerald-200 dark:border-emerald-800">
                    AI OCR
                  </span>
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  {language === 'lo'
                    ? 'ຖ່າຍຮູບສັນຍາຈ້າງງານເຈ້ຍ, ບັດປະຈຳຕົວ ຫຼື ດຳລັດທາງການ ເພື່ອແປງເປັນເອກະສານດິຈິຕອນ ພ້ອມຖອດຂໍ້ຄວາມ ແລະ ຕາປະທັບອັດຕະໂນມັດ'
                    : 'Digitize physical employee contracts, ID cards, and official decrees using live camera access with document enhancement filters & OCR text recognition.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setScannerModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all flex items-center gap-2 shrink-0 shadow-md cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>{language === 'lo' ? 'ເປີດກ້ອງສະແກນດຽວນີ້' : 'Launch Camera Scanner'}</span>
            </button>
          </div>

          {/* Search & Metadata Filter Controls */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-[260px]">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={docSearchQuery}
                    onChange={(e) => setDocSearchQuery(e.target.value)}
                    placeholder={
                      language === 'lo'
                        ? 'ຄົ້ນຫາຕາມລະຫັດ, ຊື່, ປ້າຍກຳກັບ (Confidential, Tax, Contract)...'
                        : 'Search by document code, title, or label (Confidential, Tax, Contract)...'
                    }
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  <option value="ALL">{language === 'lo' ? 'ທຸກໝວດໝູ່' : 'All Categories'}</option>
                  <option value="CONTRACT">Contract (ສັນຍາ)</option>
                  <option value="POLICY">Policy (ນະໂຍບາຍ)</option>
                  <option value="PROCEDURE">Procedure / SOP</option>
                  <option value="HR_TEMPLATE">HR Template</option>
                  <option value="LEGAL">Legal Directive</option>
                  <option value="FINANCIAL">Financial (ການເງິນ/ອາກອນ)</option>
                </select>

                <select
                  value={selectedDeptFilter}
                  onChange={(e) => setSelectedDeptFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hidden sm:block"
                >
                  <option value="ALL">{language === 'lo' ? 'ທຸກພະແນກ' : 'All Departments'}</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.code} - {language === 'lo' ? d.nameLao : d.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">
                  {filteredDocuments.length} / {documents.length} {language === 'lo' ? 'ເອກະສານ' : 'files'}
                </span>

                {(selectedTagFilter !== 'ALL' || selectedCategory !== 'ALL' || selectedDeptFilter !== 'ALL' || docSearchQuery) && (
                  <button
                    onClick={() => {
                      setDocSearchQuery('');
                      setSelectedCategory('ALL');
                      setSelectedDeptFilter('ALL');
                      setSelectedTagFilter('ALL');
                    }}
                    className="flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:underline"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>{language === 'lo' ? 'ລ້າງຕົວກັ່ນຕອງ' : 'Clear Filters'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* HORIZONTAL CUSTOM TAG FILTER BAR */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2 overflow-x-auto pb-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0 mr-1">
                <Tag className="w-3.5 h-3.5 text-blue-500" />
                <span>{language === 'lo' ? 'ກັ່ນຕອງຕາມປ້າຍກຳກັບ:' : 'Filter by Tag:'}</span>
              </div>

              {/* All Labels Pill */}
              <button
                onClick={() => setSelectedTagFilter('ALL')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  selectedTagFilter === 'ALL'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                <span>{language === 'lo' ? 'ທຸກປ້າຍ' : 'All Labels'}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  selectedTagFilter === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                  {documents.length}
                </span>
              </button>

              {/* Dynamic Tag Pills with Counts */}
              {allUniqueTagsWithCounts.map(([tagName, count]) => {
                const isSelected = selectedTagFilter.toLowerCase() === tagName.toLowerCase();

                return (
                  <button
                    key={tagName}
                    onClick={() => setSelectedTagFilter(isSelected ? 'ALL' : tagName)}
                    className="shrink-0 transition-transform active:scale-95"
                  >
                    <DocumentTagBadge
                      tag={`${tagName} (${count})`}
                      isSelected={isSelected}
                      size="sm"
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Tag Notice Banner */}
          {selectedTagFilter !== 'ALL' && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-2xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200">
                <Bookmark className="w-4 h-4 text-blue-600" />
                <span>
                  {language === 'lo' ? 'ກຳລັງສະແດງສະເພາະເອກະສານທີ່ມີປ້າຍກຳກັບ:' : 'Showing documents tagged with:'}{' '}
                  <span className="font-bold underline">{selectedTagFilter}</span> ({filteredDocuments.length})
                </span>
              </div>

              <button
                onClick={() => setSelectedTagFilter('ALL')}
                className="flex items-center gap-1 text-[11px] font-bold text-blue-700 dark:text-blue-300 hover:underline"
              >
                <X className="w-3.5 h-3.5" />
                <span>{language === 'lo' ? 'ສະແດງທັງໝົດ' : 'Show all'}</span>
              </button>
            </div>
          )}

          {/* Documents Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDocuments.map((doc) => {
              const dept = departments.find((d) => d.id === doc.departmentId);
              const latestVer = doc.versions[0];
              const isRestored = doc.versions.some((v) => v.version === doc.currentVersion && (v.changeType === 'RESTORE' || v.restoredFromVersion));

              return (
                <div
                  key={doc.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs hover:border-blue-300 dark:hover:border-blue-900 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    {/* Top Row: Code, Version badge, Category */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50">
                          {doc.docNumber}
                        </span>

                        <span
                          className={`font-mono text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5 ${
                            isRestored
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                          {doc.currentVersion} {isRestored ? '(Restored)' : 'Active'}
                        </span>

                        {doc.isScanned && (
                          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-900/50 flex items-center gap-1">
                            <Camera className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                            <span>Scanned ({doc.scannedPages?.length || 1}p)</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {doc.category}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {doc.fileSize}
                        </span>
                      </div>
                    </div>

                    {/* Titles & Physical Thumbnail */}
                    <div className="flex items-start gap-3">
                      {doc.scannedImageUrl && (
                        <div
                          onClick={() => {
                            setSelectedDocForHistory(doc);
                            setHistoryModalOpen(true);
                          }}
                          className="shrink-0 w-11 h-14 rounded-xl overflow-hidden border border-teal-300 dark:border-teal-800 bg-slate-900 cursor-pointer shadow-xs hover:ring-2 hover:ring-teal-400 transition-all group relative"
                          title="Click to view scanned pages and OCR details"
                        >
                          <img
                            src={doc.scannedImageUrl}
                            alt="Scanned Document"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Eye className="w-3.5 h-3.5 text-white" />
                          </div>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 leading-snug">
                          {language === 'lo' ? doc.titleLao : doc.title}
                        </h4>
                        <div className="text-[11px] text-slate-400 font-normal mt-0.5">
                          {language === 'lo' ? doc.title : doc.titleLao}
                        </div>
                      </div>
                    </div>

                    {/* ASSIGNED CUSTOM TAGS PILLS */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {doc.tags?.map((t) => (
                        <DocumentTagBadge
                          key={t}
                          tag={t}
                          size="sm"
                          onClick={() => setSelectedTagFilter(t)}
                          isSelected={selectedTagFilter.toLowerCase() === t.toLowerCase()}
                        />
                      ))}

                      {/* Quick Edit Tags Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDocForTagEdit(doc);
                          setTagEditModalOpen(true);
                        }}
                        className="px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 transition-colors flex items-center gap-1"
                        title="Edit labels for this document"
                      >
                        <Tag className="w-3 h-3 text-blue-500" />
                        <span>+ Label</span>
                      </button>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {language === 'lo' ? doc.descriptionLao : doc.description}
                    </p>

                    {/* Version Audit Snippet */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800/80 text-xs space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-medium">
                          {language === 'lo' ? 'ການແກ້ໄຂລ່າສຸດ:' : 'Latest Revision:'}
                        </span>
                        <span className="font-mono text-slate-500 dark:text-slate-400">
                          {new Date(doc.lastModifiedAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="font-sans text-slate-700 dark:text-slate-300 text-[11px] line-clamp-1 italic">
                        "{latestVer?.changeSummary || 'Document updated'}"
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                        <span>By: {doc.lastModifiedBy}</span>
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          {dept ? (language === 'lo' ? dept.nameLao : dept.nameEn) : 'HQ'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        setSelectedDocForHistory(doc);
                        setHistoryModalOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all"
                      title={language === 'lo' ? 'ເປີດປະຫວັດເວີຊັນ ແລະ ປຽບທຽບ' : 'Inspect version timeline and restore snapshots'}
                    >
                      <History className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>{language === 'lo' ? 'ປະຫວັດເວີຊັນ' : 'Version History'}</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-blue-600 text-white text-[10px]">
                        {doc.versions.length}
                      </span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setSelectedDocForTagEdit(doc);
                          setTagEditModalOpen(true);
                        }}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title={language === 'lo' ? 'ແກ້ໄຂປ້າຍກຳກັບ' : 'Edit Labels'}
                      >
                        <Tag className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      </button>

                      <button
                        onClick={() => {
                          setSelectedDocForHistory(doc);
                          setHistoryModalOpen(true);
                        }}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title={language === 'lo' ? 'ກູ້ຄືນເວີຊັນເກົ່າ' : 'Restore Previous Version'}
                      >
                        <RotateCcw className="w-4 h-4 text-amber-500" />
                      </button>

                      <button
                        onClick={() => {
                          setSelectedDocForEdit(doc);
                          setEditModalOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                      >
                        <FileEdit className="w-3.5 h-3.5" />
                        <span>{language === 'lo' ? 'ແກ້ໄຂ / ເວີຊັນໃໝ່' : 'New Version'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredDocuments.length === 0 && (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
              <FileText className="w-8 h-8 text-slate-300 mx-auto" />
              <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">
                {language === 'lo' ? 'ບໍ່ພົບເອກະສານທີ່ກົງກັບເງື່ອນໄຂ' : 'No documents match your filter'}
              </h4>
              <p className="text-xs text-slate-400">
                {selectedTagFilter !== 'ALL'
                  ? `No records found with tag "${selectedTagFilter}".`
                  : 'Try adjusting your search query or department filter.'}
              </p>
              <button
                onClick={() => {
                  setDocSearchQuery('');
                  setSelectedCategory('ALL');
                  setSelectedDeptFilter('ALL');
                  setSelectedTagFilter('ALL');
                }}
                className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl text-xs"
              >
                {language === 'lo' ? 'ລ້າງການຄົ້ນຫາ ແລະ ປ້າຍກຳກັບ' : 'Reset Filters & Tags'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* SUBMODULE 2: ASSET REGISTER */}
      {currentSub === 'assets' && (
        <DataTable data={assets} columns={assetColumns} filename="LHSE_Asset_Register" />
      )}

      {/* SUBMODULE 3: STANDARD TEMPLATES */}
      {currentSub === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <FileText className="w-8 h-8 text-blue-600" />
            <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              LHSE Standard Employment Contract (ສັນຍາຈ້າງງານ)
            </h4>
            <p className="text-xs text-slate-500">Official Lao-English state enterprise employment contract template.</p>
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <DocumentTagBadge tag="Employee Contract" size="sm" />
              <DocumentTagBadge tag="Confidential" size="sm" />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => alerts.success(language === 'lo' ? 'ດາວໂຫຼດສຳເລັດ' : 'Template Downloaded')}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white rounded-xl text-xs font-bold transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download (.DOCX)</span>
              </button>
              <button
                onClick={() => {
                  const contractDoc = documents.find((d) => d.id === 'doc-001');
                  if (contractDoc) {
                    setSelectedDocForHistory(contractDoc);
                    setHistoryModalOpen(true);
                  }
                }}
                className="flex items-center gap-1 px-3 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-xl text-xs font-bold"
              >
                <History className="w-3.5 h-3.5" />
                <span>Version History</span>
              </button>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <FileText className="w-8 h-8 text-indigo-600" />
            <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Certificate of Employment (ໃບຢັ້ງຢືນການເຮັດວຽກ)
            </h4>
            <p className="text-xs text-slate-500">Official verified employment letter for banks and embassies.</p>
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <DocumentTagBadge tag="Employee Contract" size="sm" />
              <DocumentTagBadge tag="Statutory" size="sm" />
            </div>
            <button
              onClick={() => alerts.success(language === 'lo' ? 'ດາວໂຫຼດສຳເລັດ' : 'Template Downloaded')}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white rounded-xl text-xs font-bold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download (.PDF)</span>
            </button>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <FileText className="w-8 h-8 text-rose-600" />
            <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              LHSE Enterprise NDA (ສັນຍາຮັກສາຄວາມລັບ)
            </h4>
            <p className="text-xs text-slate-500">Non-disclosure agreement covering state energy concession equity data.</p>
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <DocumentTagBadge tag="Confidential" size="sm" />
              <DocumentTagBadge tag="Legal" size="sm" />
            </div>
            <button
              onClick={() => alerts.success(language === 'lo' ? 'ດາວໂຫຼດສຳເລັດ' : 'Template Downloaded')}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white rounded-xl text-xs font-bold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download (.DOCX)</span>
            </button>
          </div>
        </div>
      )}

      {/* VERSION HISTORY MODAL */}
      <DocumentVersionHistoryModal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        document={selectedDocForHistory}
        onOpenEditModal={(doc) => {
          setSelectedDocForEdit(doc);
          setEditModalOpen(true);
        }}
      />

      {/* DOCUMENT EDIT / NEW VERSION MODAL */}
      <DocumentEditModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        document={selectedDocForEdit}
      />

      {/* DOCUMENT CREATE MODAL */}
      <DocumentCreateModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />

      {/* FILE UPLOAD & TAG MODAL */}
      <DocumentUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
      />

      {/* QUICK TAG EDIT MODAL */}
      <DocumentTagEditModal
        isOpen={tagEditModalOpen}
        onClose={() => setTagEditModalOpen(false)}
        document={selectedDocForTagEdit}
      />

      {/* DOCUMENT CAMERA SCANNER MODAL */}
      <DocumentScannerModal
        isOpen={scannerModalOpen}
        onClose={() => setScannerModalOpen(false)}
      />

      {/* Assign Asset Modal */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title={selectedAsset ? `Assign: ${selectedAsset.assetTag}` : ''}
        subtitle="Assign enterprise equipment to employee"
        maxWidth="md"
        footer={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAssignModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleConfirmAssign}
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
              Select Assignee Employee
            </label>
            <select
              value={assignEmpId}
              onChange={(e) => setAssignEmpId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.employeeCode} - {e.firstNameLao} {e.lastNameLao} ({e.firstNameEn})
                </option>
              ))}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
};
