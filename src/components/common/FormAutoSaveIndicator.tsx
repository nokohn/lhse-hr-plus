import React from 'react';
import { CloudCheck, Clock, RefreshCw, Trash2, CheckCircle2 } from 'lucide-react';

interface FormAutoSaveIndicatorProps {
  isSaving: boolean;
  lastSaved: Date | null;
  isRestored?: boolean;
  onDiscard?: () => void;
  className?: string;
  language?: 'lo' | 'en';
}

export const FormAutoSaveIndicator: React.FC<FormAutoSaveIndicatorProps> = ({
  isSaving,
  lastSaved,
  isRestored,
  onDiscard,
  className = '',
  language = 'lo',
}) => {
  if (!isSaving && !lastSaved && !isRestored) {
    return null;
  }

  const formatTime = (d: Date) => {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div
      className={`flex items-center justify-between gap-3 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-[11px] text-slate-600 dark:text-slate-300 ${className}`}
    >
      <div className="flex items-center gap-2">
        {isSaving ? (
          <RefreshCw className="w-3.5 h-3.5 text-blue-500 animate-spin shrink-0" />
        ) : isRestored ? (
          <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        ) : (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
        )}

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-medium">
            {isSaving
              ? language === 'lo'
                ? 'ກຳລັງບັນທຶກແບບຮ່າງ...'
                : 'Saving draft...'
              : isRestored
              ? language === 'lo'
                ? 'ກູ້ຄືນແບບຮ່າງທີ່ບັນທຶກໄວ້ແລ້ວ'
                : 'Restored draft in progress'
              : language === 'lo'
              ? 'ບັນທຶກແບບຮ່າງອັດຕະໂນມັດແລ້ວ'
              : 'Auto-saved locally'}
          </span>

          {lastSaved && !isSaving && (
            <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500">
              ({formatTime(lastSaved)})
            </span>
          )}
        </div>
      </div>

      {onDiscard && (
        <button
          type="button"
          onClick={onDiscard}
          className="inline-flex items-center gap-1 text-[10px] text-rose-500 hover:text-rose-600 dark:text-rose-400 font-semibold hover:underline shrink-0 cursor-pointer"
          title={language === 'lo' ? 'ລຶບແບບຮ່າງທີ່ບັນທຶກ ແລະ ເລີ່ມໃໝ່' : 'Discard draft & reset form'}
        >
          <Trash2 className="w-3 h-3" />
          <span>{language === 'lo' ? 'ລຶບແບບຮ່າງ' : 'Discard draft'}</span>
        </button>
      )}
    </div>
  );
};
