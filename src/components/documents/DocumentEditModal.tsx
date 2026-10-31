import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { EnterpriseDocument, DocumentCategory, VersionChangeType } from '../../types/index.ts';
import { calculateNextVersion } from '../../services/documentData.ts';
import { DocumentTagInput } from './DocumentTagInput.tsx';
import { Modal } from '../common/Modal.tsx';
import {
  FileEdit,
  Sparkles,
  Save,
  Tag,
  Building,
  Layers,
  ArrowRight,
  PlusCircle,
  FileText,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface DocumentEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: EnterpriseDocument | null;
}

export const DocumentEditModal: React.FC<DocumentEditModalProps> = ({
  isOpen,
  onClose,
  document,
}) => {
  const { language, departments, updateDocument, updateDocumentTags, currentUser } = useApp();

  const [title, setTitle] = useState('');
  const [titleLao, setTitleLao] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('CONTRACT');
  const [departmentId, setDepartmentId] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [changeType, setChangeType] = useState<VersionChangeType>('MINOR');
  const [changeSummary, setChangeSummary] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    if (document) {
      setTitle(document.title);
      setTitleLao(document.titleLao);
      setCategory(document.category);
      setDepartmentId(document.departmentId);
      setDescription(document.description);
      setContent(document.content);
      setChangeType('MINOR');
      setChangeSummary('');
      setTags([...document.tags]);
    }
  }, [document, isOpen]);

  if (!document) return null;

  const nextVersionTag = calculateNextVersion(document.currentVersion, changeType);

  const handleAppendClause = (clauseText: string) => {
    setContent((prev) => `${prev.trim()}\n\n${clauseText}`);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    if (!changeSummary.trim()) return;

    updateDocument(document.id, {
      title,
      titleLao,
      category,
      departmentId,
      description,
      content,
      changeSummary,
      changeType: changeType as 'MAJOR' | 'MINOR' | 'PATCH',
    });

    updateDocumentTags(document.id, tags);

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="4xl"
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <FileEdit className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                {language === 'lo' ? 'ແກ້ໄຂເອກະສານ & ສ້າງເວີຊັນໃໝ່' : 'Edit Document & Author New Version'}
              </span>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {document.docNumber}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-normal">
              {language === 'lo'
                ? `ເວີຊັນປັດຈຸບັນ: ${document.currentVersion} • ທຸກໆການແກ້ໄຂຈະຖືກບັນທຶກເປັນເວີຊັນໃໝ່ພ້ອມ Audit Trail`
                : `Current version: ${document.currentVersion} • All modifications generate a tracked revision in version history`}
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className="font-semibold text-slate-600 dark:text-slate-300">
              {language === 'lo' ? 'ເວີຊັນທີ່ຈະຖືກບັນທຶກ:' : 'Will be published as:'}
            </span>
            <span className="font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-md">
              {nextVersionTag}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              {language === 'lo' ? 'ຍົກເລີກ' : 'Cancel'}
            </button>
            <button
              onClick={handleSave}
              disabled={!changeSummary.trim() || !content.trim()}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white shadow-xs transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{language === 'lo' ? 'ບັນທຶກເວີຊັນໃໝ່' : 'Publish Version'}</span>
            </button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSave} className="space-y-4 text-xs">
        {/* Version Bump Controls */}
        <div className="p-4 bg-blue-50/60 dark:bg-blue-950/30 rounded-2xl border border-blue-200/80 dark:border-blue-900/60 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {language === 'lo' ? 'ເລືອກປະເພດການອັບເດດເວີຊັນ (Version Bump):' : 'Select Version Bump Type:'}
              </span>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-slate-400">{document.currentVersion}</span>
              <ArrowRight className="w-3.5 h-3.5 text-blue-500" />
              <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white font-bold">
                {nextVersionTag}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <label
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                changeType === 'PATCH'
                  ? 'bg-white dark:bg-slate-800 border-blue-500 ring-2 ring-blue-200 dark:ring-blue-900 shadow-xs'
                  : 'bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                name="changeType"
                value="PATCH"
                checked={changeType === 'PATCH'}
                onChange={() => setChangeType('PATCH')}
                className="sr-only"
              />
              <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                <span>Patch (+0.0.1)</span>
                <span className="text-[10px] text-purple-600 font-mono">
                  {calculateNextVersion(document.currentVersion, 'PATCH')}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                {language === 'lo' ? 'ແກ້ໄຂຄຳຜິດ, ຈັດຮູບແບບ ຫຼື ປັບປຸງຂໍ້ຄວາມເລັກນ້ອຍ' : 'Minor wording adjustments, formatting, typo corrections'}
              </p>
            </label>

            <label
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                changeType === 'MINOR'
                  ? 'bg-white dark:bg-slate-800 border-blue-500 ring-2 ring-blue-200 dark:ring-blue-900 shadow-xs'
                  : 'bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                name="changeType"
                value="MINOR"
                checked={changeType === 'MINOR'}
                onChange={() => setChangeType('MINOR')}
                className="sr-only"
              />
              <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                <span>Minor (+0.1)</span>
                <span className="text-[10px] text-blue-600 font-mono">
                  {calculateNextVersion(document.currentVersion, 'MINOR')}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                {language === 'lo' ? 'ເພີ່ມມາດຕາໃໝ່, ປັບປຸງເງື່ອນໄຂ ຫຼື ຕາຕະລາງປະຕິບັດວຽກ' : 'Added new clauses, amended specific policy terms, updated schedule'}
              </p>
            </label>

            <label
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                changeType === 'MAJOR'
                  ? 'bg-white dark:bg-slate-800 border-blue-500 ring-2 ring-blue-200 dark:ring-blue-900 shadow-xs'
                  : 'bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                name="changeType"
                value="MAJOR"
                checked={changeType === 'MAJOR'}
                onChange={() => setChangeType('MAJOR')}
                className="sr-only"
              />
              <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                <span>Major (+1.0)</span>
                <span className="text-[10px] text-amber-600 font-mono">
                  {calculateNextVersion(document.currentVersion, 'MAJOR')}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                {language === 'lo' ? 'ປັບປຸງໂຄງສ້າງໃຫຍ່, ມະຕິຄະນະບໍລິຫານ ຫຼື ປັບຕາມກົດໝາຍໃໝ່' : 'Major policy rewrite, statutory labor law compliance overhaul'}
              </p>
            </label>
          </div>

          {/* Mandatory Change Summary */}
          <div className="space-y-1">
            <label className="block font-bold text-slate-800 dark:text-slate-200">
              {language === 'lo' ? 'ບັນທຶກການປ່ຽນແປງ (Change Summary Note) *' : 'Change Summary Note (Required for Audit Trail) *'}
            </label>
            <input
              type="text"
              value={changeSummary}
              onChange={(e) => setChangeSummary(e.target.value)}
              required
              placeholder={
                language === 'lo'
                  ? 'ຕົວຢ່າງ: ປັບປຸງມາດຕາ 3.1 ກ່ຽວກັບການຈ່າຍເງິນເດືອນຜ່ານ BCEL OnePay...'
                  : 'e.g. Amended Article 3.1 specifying BCEL Corporate OnePay payroll distribution...'
              }
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Metadata Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
              {language === 'lo' ? 'ຊື່ເອກະສານ (ລາວ)' : 'Title (Lao)'}
            </label>
            <input
              type="text"
              value={titleLao}
              onChange={(e) => setTitleLao(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
              {language === 'lo' ? 'ຊື່ເອກະສານ (English)' : 'Title (English)'}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
              {language === 'lo' ? 'ໝວດໝູ່ເອກະສານ' : 'Document Category'}
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as DocumentCategory)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
            >
              <option value="CONTRACT">Contract (ສັນຍາ)</option>
              <option value="POLICY">Policy (ນະໂຍບາຍ/ກົດລະບຽບ)</option>
              <option value="PROCEDURE">Procedure / SOP (ຂັ້ນຕອນການປະຕິບັດງານ)</option>
              <option value="HR_TEMPLATE">HR Template (ແບບຟອມບຸກຄະລາກອນ)</option>
              <option value="LEGAL">Legal Directive (ນິຕິກຳ ແລະ ຄຳສັ່ງ)</option>
              <option value="FINANCIAL">Financial Procedure (ການເງິນ ແລະ ເງິນປັນຜົນ)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
              {language === 'lo' ? 'ພະແນກທີ່ຮັບຜິດຊອບ' : 'Responsible Department'}
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

        {/* Custom Classification Tags */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
          <DocumentTagInput
            tags={tags}
            onChange={setTags}
            label={language === 'lo' ? 'ປ້າຍກຳກັບເອກະສານ (Custom Labels):' : 'Custom Document Classification Labels:'}
            helperText={language === 'lo' ? 'ຈັດໝວດໝູ່ເອກະສານດ້ວຍປ້າຍກຳກັບເຊັ່ນ: Confidential, Tax, Employee Contract' : 'Labels allow instant filtering in the document catalog.'}
          />
        </div>

        {/* Content Clauses Editor */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block font-bold text-slate-700 dark:text-slate-300">
              {language === 'lo' ? 'ເນື້ອໃນ ແລະ ມາດຕາເອກະສານ (Document Body & Clauses) *' : 'Document Body & Clauses *'}
            </label>

            {/* Quick clause inserters */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400 font-medium">
                {language === 'lo' ? 'ແຊກຂໍ້ຄວາມດ່ວນ:' : 'Quick insert:'}
              </span>
              <button
                type="button"
                onClick={() =>
                  handleAppendClause(
                    `ມາດຕາໃໝ່: ການປົກປ້ອງຂໍ້ມູນສ່ວນບຸກຄົນ (Personal Data Protection)\n- LHSE ໃຫ້ຄຳໝັ້ນສັນຍາໃນການປົກປ້ອງຂໍ້ມູນສ່ວນຕົວຂອງພະນັກງານຕາມມາດຕະຖານສາກົນ.`
                  )
                }
                className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-400 hover:text-blue-600 hover:bg-blue-50 font-bold"
              >
                + Privacy Clause
              </button>
              <button
                type="button"
                onClick={() =>
                  handleAppendClause(
                    `ມາດຕາໃໝ່: ກໍລະນີເຫດສຸດວິໄສ (Force Majeure)\n- ທັງສອງຝ່າຍຈະຫຼຸດພົ້ນຈາກຄວາມຮັບຜິດຊອບ ຖ້າຫາກເກີດໄພພິບັດທຳມະຊາດ ຫຼື ເຫດສຸດວິໄສທີ່ບໍ່ສາມາດຄວບຄຸມໄດ້.`
                  )
                }
                className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-400 hover:text-blue-600 hover:bg-blue-50 font-bold"
              >
                + Force Majeure
              </button>
            </div>
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={12}
            className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs font-mono leading-relaxed text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type or paste document clauses..."
          />
        </div>
      </form>
    </Modal>
  );
};
