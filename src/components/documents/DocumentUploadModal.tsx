import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { DocumentCategory } from '../../types/index.ts';
import { DocumentTagInput } from './DocumentTagInput.tsx';
import { Modal } from '../common/Modal.tsx';
import {
  UploadCloud,
  FileCheck2,
  FileText,
  Tag,
  Building,
  Check,
  X,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTags?: string[];
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  defaultTags = ['Employee Contract'],
}) => {
  const { language, departments, createDocument, documents } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [docNumber, setDocNumber] = useState(`LHSE-DOC-2026-00${documents.length + 1}`);
  const [title, setTitle] = useState('');
  const [titleLao, setTitleLao] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('CONTRACT');
  const [departmentId, setDepartmentId] = useState(departments[0]?.id || 'd-2');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>(['Employee Contract', 'Confidential']);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelected = (file: File) => {
    setUploadedFile(file);
    const rawName = file.name.replace(/\.[^/.]+$/, '');
    const cleanTitle = rawName
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

    if (!title) setTitle(cleanTitle);
    if (!titleLao) setTitleLao(cleanTitle);

    // Auto-detect recommended tags based on filename
    const lower = file.name.toLowerCase();
    const detectedTags = new Set(tags);

    if (lower.includes('tax') || lower.includes('vat') || lower.includes('pit')) {
      detectedTags.add('Tax');
      setCategory('FINANCIAL');
    }
    if (lower.includes('contract') || lower.includes('employment') || lower.includes('agreement')) {
      detectedTags.add('Employee Contract');
      setCategory('CONTRACT');
    }
    if (lower.includes('confidential') || lower.includes('nda') || lower.includes('secret')) {
      detectedTags.add('Confidential');
    }
    if (lower.includes('hydro') || lower.includes('dam') || lower.includes('energy')) {
      detectedTags.add('Hydropower');
    }
    if (lower.includes('audit')) {
      detectedTags.add('Audit');
    }

    setTags(Array.from(detectedTags));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !titleLao.trim()) return;

    const fileType = uploadedFile?.name.endsWith('.pdf')
      ? 'PDF'
      : uploadedFile?.name.endsWith('.docx')
      ? 'DOCX'
      : 'DOCX';

    const fileSizeFormatted = uploadedFile
      ? `${(uploadedFile.size / 1024).toFixed(1)} KB`
      : '32.5 KB';

    createDocument({
      docNumber: docNumber.trim() || `LHSE-DOC-2026-00${documents.length + 1}`,
      title: title.trim() || titleLao.trim(),
      titleLao: titleLao.trim() || title.trim(),
      category,
      departmentId,
      description:
        description.trim() ||
        `Uploaded file: ${uploadedFile?.name || 'Enterprise document'} tagged with [${tags.join(', ')}]`,
      descriptionLao: description.trim() || `ເອກະສານອັບໂຫຼດ: ${uploadedFile?.name || 'ເອກະສານອົງກອນ'}`,
      initialContent: `ເອກະສານທີ່ອັບໂຫຼດ: ${uploadedFile?.name || title}\nວັນທີບັນທຶກ: ${new Date().toLocaleDateString()}\nຂະໜາດຟາຍ: ${fileSizeFormatted}\nປ້າຍກຳກັບ: ${tags.join(', ')}\n\nເນື້ອໃນເອກະສານໄດ້ຖືກກວດສອບ ແລະ ບັນທຶກເຂົ້າສູ່ລະບົບຄວບຄຸມເວີຊັນ ແລະ ຈັດໝວດໝູ່ດ້ວຍປ້າຍກຳກັບຢ່າງຖືກຕ້ອງ.`,
      tags: tags.length > 0 ? tags : ['General Document'],
      fileType,
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="3xl"
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <UploadCloud className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
              {language === 'lo'
                ? 'ອັບໂຫຼດເອກະສານ & ຕິດປ້າຍກຳກັບ (Upload & Tag File)'
                : 'Upload & Categorize Document with Custom Labels'}
            </div>
            <p className="text-[11px] text-slate-500 font-normal">
              {language === 'lo'
                ? 'ອັບໂຫຼດຟາຍ ແລະ ຕິດປ້າຍກຳກັບເຊັ່ນ: Confidential, Tax, Employee Contract ເພື່ອຈັດໝວດໝູ່'
                : 'Upload documents and tag with labels like Confidential, Tax, or Employee Contract for seamless filtering'}
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            {language === 'lo' ? 'ຍົກເລີກ' : 'Cancel'}
          </button>
          <button
            onClick={handleUploadSubmit}
            disabled={!title.trim() && !titleLao.trim()}
            className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>{language === 'lo' ? 'ອັບໂຫຼດ & ບັນທຶກປ້າຍກຳກັບ' : 'Upload & Save Tags'}</span>
          </button>
        </div>
      }
    >
      <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
        {/* File Dropzone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 ring-4 ring-blue-100 dark:ring-blue-900'
              : uploadedFile
              ? 'border-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20'
              : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 hover:border-blue-400'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelected(e.target.files[0]);
              }
            }}
            accept=".pdf,.docx,.doc,.xlsx,.xls,.png,.jpg,.jpeg,.txt"
            className="sr-only"
          />

          {uploadedFile ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 flex items-center justify-center">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  {uploadedFile.name}
                </div>
                <div className="text-slate-400 text-[11px] font-mono mt-0.5">
                  {(uploadedFile.size / 1024).toFixed(1)} KB • {uploadedFile.type || 'Document File'}
                </div>
              </div>
              <span className="text-[11px] text-blue-600 hover:underline font-bold mt-1">
                {language === 'lo' ? 'ຄລິກເພື່ອປ່ຽນຟາຍ' : 'Click to choose another file'}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {language === 'lo' ? 'ລາກຟາຍມາໃສ່ນີ້ ຫຼື ຄລິກເພື່ອເລືອກຟາຍ' : 'Drag & drop file here, or click to browse'}
                </span>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Supports PDF, DOCX, XLSX, Images, or TXT
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Document Number & Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
              {language === 'lo' ? 'ລະຫັດເອກະສານ' : 'Document Code'}
            </label>
            <input
              type="text"
              value={docNumber}
              onChange={(e) => setDocNumber(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-blue-600"
              required
            />
          </div>

          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
              {language === 'lo' ? 'ໝວດໝູ່' : 'Category'}
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as DocumentCategory)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
            >
              <option value="CONTRACT">Contract (ສັນຍາ)</option>
              <option value="POLICY">Policy (ນະໂຍບາຍ/ກົດລະບຽບ)</option>
              <option value="PROCEDURE">Procedure / SOP</option>
              <option value="HR_TEMPLATE">HR Template</option>
              <option value="LEGAL">Legal Directive</option>
              <option value="FINANCIAL">Financial (ການເງິນ/ອາກອນ)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
              {language === 'lo' ? 'ພະແນກ' : 'Department'}
            </label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.code} - {language === 'lo' ? d.nameLao : d.nameEn}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Titles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
              {language === 'lo' ? 'ຊື່ເອກະສານ (ລາວ) *' : 'Title (Lao) *'}
            </label>
            <input
              type="text"
              value={titleLao}
              onChange={(e) => setTitleLao(e.target.value)}
              placeholder="e.g. ສັນຍາຈ້າງງານພະນັກງານປະຈຳປີ 2026"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              required
            />
          </div>

          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
              {language === 'lo' ? 'ຊື່ເອກະສານ (English) *' : 'Title (English) *'}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Standard Executive Employment Contract 2026"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              required
            />
          </div>
        </div>

        {/* CUSTOM TAGGING SYSTEM */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
          <DocumentTagInput
            tags={tags}
            onChange={setTags}
            label={
              language === 'lo'
                ? 'ປ້າຍກຳກັບການຈັດໝວດໝູ່ (Custom Classification Labels) *'
                : 'Custom Classification Labels (e.g. Confidential, Tax, Employee Contract) *'
            }
            helperText={
              language === 'lo'
                ? 'ເລືອກປ້າຍແນະນຳດ້ານເທິງ ຫຼື ພິມປ້າຍກຳກັບໃໝ່ແລ້ວກົດ Enter ເພື່ອເພີ່ມເຂົ້າໃນເອກະສານ'
                : 'Select preset labels or type custom tags and press Enter to organize your documents.'
            }
          />
        </div>

        {/* Description / Notes */}
        <div>
          <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
            {language === 'lo' ? 'ລາຍລະອຽດ ຫຼື ໝາຍເຫດ' : 'Description / Notes'}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Key summary or reference notes for this uploaded file..."
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
          />
        </div>
      </form>
    </Modal>
  );
};
