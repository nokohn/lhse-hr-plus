import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { SUGGESTED_DOCUMENT_TAGS } from '../../services/documentData.ts';
import { DocumentTagBadge } from './DocumentTagBadge.tsx';
import { Tag, Plus, Sparkles, Check } from 'lucide-react';

interface DocumentTagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  label?: string;
  helperText?: string;
}

export const DocumentTagInput: React.FC<DocumentTagInputProps> = ({
  tags,
  onChange,
  label,
  helperText,
}) => {
  const { language } = useApp();
  const [inputValue, setInputValue] = useState('');

  const handleAddTag = (newTag: string) => {
    const trimmed = newTag.trim();
    if (!trimmed) return;
    // Prevent duplicate case-insensitive
    if (tags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      setInputValue('');
      return;
    }
    onChange([...tags, trimmed]);
    setInputValue('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onChange(tags.filter((t) => t !== tagToRemove));
  };

  const handleTogglePreset = (preset: string) => {
    if (tags.includes(preset)) {
      handleRemoveTag(preset);
    } else {
      handleAddTag(preset);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag(inputValue);
    }
  };

  return (
    <div className="space-y-3">
      {label && (
        <label className="block font-bold text-xs text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}

      {/* Current Active Tags Display */}
      <div className="min-h-[46px] p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl flex flex-wrap items-center gap-2">
        {tags.length === 0 ? (
          <span className="text-xs text-slate-400 italic px-1">
            {language === 'lo'
              ? 'ຍັງບໍ່ມີປ້າຍກຳກັບ. ຄລິກປ້າຍແນະນຳດ້ານລຸ່ມ ຫຼື ພິມປ້າຍກຳກັບກຳນົດເອງ...'
              : 'No tags assigned yet. Click suggestions below or type a custom label...'}
          </span>
        ) : (
          tags.map((tag) => (
            <DocumentTagBadge
              key={tag}
              tag={tag}
              onRemove={() => handleRemoveTag(tag)}
            />
          ))
        )}
      </div>

      {/* Custom Tag Input */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              language === 'lo'
                ? 'ພິມປ້າຍກຳກັບກຳນົດເອງ (ເຊັ່ນ: Confidential, Tax, Employee Contract) ແລ້ວກົດ Enter...'
                : 'Type custom label (e.g. Confidential, Tax, Employee Contract) & press Enter...'
            }
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="button"
          onClick={() => handleAddTag(inputValue)}
          disabled={!inputValue.trim()}
          className="flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{language === 'lo' ? 'ເພີ່ມປ້າຍ' : 'Add Tag'}</span>
        </button>
      </div>

      {/* Suggested Quick Preset Tags */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span>
            {language === 'lo' ? 'ປ້າຍກຳກັບຍອດນິຍົມ (ຄລິກເພື່ອເລືອກ/ຍົກເລີກ):' : 'Popular Labels (Click to toggle):'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {SUGGESTED_DOCUMENT_TAGS.map((preset) => {
            const isAssigned = tags.some((t) => t.toLowerCase() === preset.toLowerCase());
            return (
              <button
                key={preset}
                type="button"
                onClick={() => handleTogglePreset(preset)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border flex items-center gap-1 ${
                  isAssigned
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                {isAssigned && <Check className="w-3 h-3 text-white" />}
                <span>{preset}</span>
              </button>
            );
          })}
        </div>
      </div>

      {helperText && (
        <p className="text-[11px] text-slate-400">
          {helperText}
        </p>
      )}
    </div>
  );
};
