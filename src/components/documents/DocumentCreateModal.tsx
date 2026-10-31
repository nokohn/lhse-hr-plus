import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { DocumentCategory } from '../../types/index.ts';
import { DocumentTagInput } from './DocumentTagInput.tsx';
import { Modal } from '../common/Modal.tsx';
import { PlusCircle, FileText, Sparkles, Building, Layers, Check } from 'lucide-react';

interface DocumentCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentCreateModal: React.FC<DocumentCreateModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { language, departments, createDocument, documents } = useApp();

  const nextDocNumber = `LHSE-DOC-2026-00${documents.length + 1}`;

  const [docNumber, setDocNumber] = useState(nextDocNumber);
  const [title, setTitle] = useState('');
  const [titleLao, setTitleLao] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('CONTRACT');
  const [departmentId, setDepartmentId] = useState(departments[0]?.id || 'd-1');
  const [description, setDescription] = useState('');
  const [descriptionLao, setDescriptionLao] = useState('');
  const [initialContent, setInitialContent] = useState('');
  const [tags, setTags] = useState<string[]>(['Employee Contract', 'Confidential']);

  // Prepopulate standard starter text based on category
  const handleLoadTemplateContent = (cat: DocumentCategory) => {
    setCategory(cat);
    if (cat === 'CONTRACT') {
      setInitialContent(
`ບົດສັນຍາຈ້າງງານ (EMPLOYMENT AGREEMENT)
ມາດຕາ 1: ຈຸດປະສົງ ແລະ ຕຳແໜ່ງງານ
1.1 ຜູ້ວ່າຈ້າງຕົກລົງຮັບເອົາລູກຈ້າງເຂົ້າປະຕິບັດໜ້າທີ່ຕາມຕຳແໜ່ງທີ່ໄດ້ກຳນົດ.

ມາດຕາ 2: ເວລາເຮັດວຽກ
2.1 ເວລາເຮັດວຽກປົກກະຕິ 08:00 - 17:00 ໂມງ ວັນຈັນ ຫາ ວັນສຸກ.

ມາດຕາ 3: ເງິນເດືອນ ແລະ ສະຫວັດດີການ
3.1 ຈ່າຍເງິນເດືອນຜ່ານບັນຊີທະນາຄານ BCEL ບໍ່ເກີນວັນທີ 28 ຂອງທຸກໆເດືອນ.`
      );
    } else if (cat === 'POLICY') {
      setInitialContent(
`ນະໂຍບາຍ ແລະ ມາດຕະຖານການປະຕິບັດງານ (CORPORATE POLICY)
ໝວດທີ 1: ຫຼັກການທົ່ວໄປ
1.1 ພະນັກງານທຸກຄົນຕ້ອງຍຶດໝັ້ນຄວາມຊື່ສັດ ແລະ ໂປ່ງໃສ.

ໝວດທີ 2: ຂັ້ນຕອນການປະຕິບັດ
2.1 ປະຕິບັດຕາມມາດຕະຖານລັດວິສາຫະກິດ ຖືຮຸ້ນລາວ (LHSE).`
      );
    } else {
      setInitialContent(
`ຂັ້ນຕອນການປະຕິບັດງານມາດຕະຖານ (STANDARD OPERATING PROCEDURE)
1. ຂອບເຂດ ແລະ ຈຸດປະສົງ
2. ບົດບາດ ແລະ ຄວາມຮັບຜິດຊອບ
3. ຂັ້ນຕອນການດຳເນີນງານຂັ້ນລະອຽດ`
      );
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !titleLao.trim()) return;
    if (!initialContent.trim()) return;

    createDocument({
      docNumber: docNumber.trim() || nextDocNumber,
      title: title.trim() || titleLao.trim(),
      titleLao: titleLao.trim() || title.trim(),
      category,
      departmentId,
      description: description.trim() || 'Official enterprise document registered in LHSE Version Control System.',
      descriptionLao: descriptionLao.trim() || description.trim(),
      initialContent,
      tags: tags.length > 0 ? tags : [category, 'Version 1.0'],
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="3xl"
      title={
        <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold text-sm">
          <PlusCircle className="w-5 h-5 text-blue-600" />
          <span>{language === 'lo' ? 'ສ້າງເອກະສານໃໝ່ (ເລີ່ມຕົ້ນເວີຊັນ v1.0)' : 'Create Enterprise Document (v1.0 Baseline)'}</span>
        </div>
      }
      subtitle={
        language === 'lo'
          ? 'ສ້າງເອກະສານໃໝ່ພ້ອມເລີ່ມຕົ້ນລະບົບຄວບຄຸມເວີຊັນ ແລະ ບັນທຶກປະຫວັດ'
          : 'Register a new document into version control with automated v1.0 baseline and audit logging'
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
            onClick={handleCreate}
            disabled={!initialContent.trim() || (!title.trim() && !titleLao.trim())}
            className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{language === 'lo' ? 'ສ້າງເອກະສານ v1.0' : 'Create Document v1.0'}</span>
          </button>
        </div>
      }
    >
      <form onSubmit={handleCreate} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
              {language === 'lo' ? 'ລະຫັດເອກະສານ' : 'Document Number'} *
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
              onChange={(e) => handleLoadTemplateContent(e.target.value as DocumentCategory)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
            >
              <option value="CONTRACT">Contract (ສັນຍາ)</option>
              <option value="POLICY">Policy (ນະໂຍບາຍ/ກົດລະບຽບ)</option>
              <option value="PROCEDURE">Procedure / SOP (ຂັ້ນຕອນການປະຕິບັດງານ)</option>
              <option value="HR_TEMPLATE">HR Template (ແບບຟອມ)</option>
              <option value="LEGAL">Legal Directive (ນິຕິກຳ)</option>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
              {language === 'lo' ? 'ຊື່ເອກະສານ (ພາສາລາວ) *' : 'Title (Lao) *'}
            </label>
            <input
              type="text"
              value={titleLao}
              onChange={(e) => setTitleLao(e.target.value)}
              placeholder="ຕົວຢ່າງ: ລະບຽບການຄຸ້ມຄອງລົດປະຈຳຕຳແໜ່ງ LHSE"
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
              placeholder="e.g. Enterprise Vehicle Management & Fuel Subsidy Policy"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              required
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
            {language === 'lo' ? 'ຄຳອະທິບາຍຫຍໍ້' : 'Brief Description'}
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Key summary of purpose and legal scope..."
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
          />
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
          <DocumentTagInput
            tags={tags}
            onChange={setTags}
            label={language === 'lo' ? 'ປ້າຍກຳກັບເອກະສານ (Custom Labels):' : 'Custom Document Labels:'}
            helperText={language === 'lo' ? 'ເລືອກປ້າຍແນະນຳ ຫຼື ພິມປ້າຍກຳກັບກຳນົດເອງເຊັ່ນ: Confidential, Tax, Employee Contract' : 'Select suggested tags or type custom labels like Confidential, Tax, Employee Contract'}
          />
        </div>

        <div>
          <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
            {language === 'lo' ? 'ເນື້ອໃນເອກະສານເລີ່ມຕົ້ນ (Initial Clauses) *' : 'Initial Clauses & Text (v1.0 Baseline) *'}
          </label>
          <textarea
            value={initialContent}
            onChange={(e) => setInitialContent(e.target.value)}
            rows={8}
            className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-mono text-xs text-slate-900 dark:text-slate-100 leading-relaxed"
            placeholder="Type or paste the initial document articles..."
            required
          />
        </div>
      </form>
    </Modal>
  );
};
