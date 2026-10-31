import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { EnterpriseDocument } from '../../types/index.ts';
import { DocumentTagInput } from './DocumentTagInput.tsx';
import { Modal } from '../common/Modal.tsx';
import { Tag, Save, Check } from 'lucide-react';

interface DocumentTagEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: EnterpriseDocument | null;
}

export const DocumentTagEditModal: React.FC<DocumentTagEditModalProps> = ({
  isOpen,
  onClose,
  document,
}) => {
  const { language, updateDocumentTags } = useApp();
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    if (document) {
      setTags([...document.tags]);
    }
  }, [document, isOpen]);

  if (!document) return null;

  const handleSave = () => {
    updateDocumentTags(document.id, tags);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      title={
        <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold text-sm">
          <Tag className="w-4 h-4 text-blue-600" />
          <span>{language === 'lo' ? 'ຈັດການປ້າຍກຳກັບເອກະສານ' : 'Manage Custom Labels'}</span>
          <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-blue-600">
            {document.docNumber}
          </span>
        </div>
      }
      subtitle={language === 'lo' ? document.titleLao : document.title}
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
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{language === 'lo' ? 'ບັນທຶກປ້າຍກຳກັບ' : 'Save Labels'}</span>
          </button>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        <DocumentTagInput
          tags={tags}
          onChange={setTags}
          label={
            language === 'lo'
              ? 'ປ້າຍກຳກັບທີ່ຖືກມອບໝາຍ (Custom Labels):'
              : 'Assigned Labels (e.g. Confidential, Tax, Employee Contract):'
          }
          helperText={
            language === 'lo'
              ? 'ປ້າຍກຳກັບຈະຊ່ວຍໃຫ້ການກັ່ນຕອງ ແລະ ຄົ້ນຫາເອກະສານສະດວກຍິ່ງຂຶ້ນ.'
              : 'Labels allow immediate one-click filtering in the document catalog.'
          }
        />
      </div>
    </Modal>
  );
};
