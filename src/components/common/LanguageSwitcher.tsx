import React, { useState, useRef, useEffect } from 'react';
import { useI18n } from '../../i18n/I18nProvider.tsx';
import { Language } from '../../types/index.ts';
import { Globe, Check, ChevronDown, Languages } from 'lucide-react';

interface LanguageSwitcherProps {
  variant?: 'compact' | 'segmented' | 'dropdown';
  className?: string;
  showLabel?: boolean;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'compact',
  className = '',
  showLabel = true,
}) => {
  const { language, setLanguage, toggleLanguage, availableLanguages, t } = useI18n();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [dropdownOpen]);

  // Close on Escape key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setDropdownOpen(false);
    }
  };

  const currentLangObj = availableLanguages.find((l) => l.code === language) || availableLanguages[0];

  // Variant 1: Segmented Switcher (two-pill sliding bar)
  if (variant === 'segmented') {
    return (
      <div
        role="radiogroup"
        aria-label="Interface Language Selection"
        className={`inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 ${className}`}
      >
        {availableLanguages.map((lang) => {
          const isSelected = language === lang.code;
          return (
            <button
              key={lang.code}
              role="radio"
              aria-checked={isSelected}
              onClick={() => setLanguage(lang.code)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                isSelected
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span className="text-sm leading-none" aria-hidden="true">{lang.flag}</span>
              <span>{lang.nativeName}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Variant 2: Dropdown Selector
  if (variant === 'dropdown') {
    return (
      <div className={`relative inline-block ${className}`} ref={dropdownRef} onKeyDown={handleKeyDown}>
        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          aria-haspopup="menu"
          aria-expanded={dropdownOpen}
          aria-label={`Current language: ${currentLangObj.name}. Click to change language.`}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-2xs transition-colors"
        >
          <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm" aria-hidden="true">{currentLangObj.flag}</span>
          <span>{currentLangObj.nativeName}</span>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {dropdownOpen && (
          <div
            role="menu"
            aria-orientation="vertical"
            className="absolute right-0 mt-2 w-52 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
          >
            <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {language === 'lo' ? 'ເລືອກພາສາ / Select Language' : 'Select Interface Language'}
            </div>
            <div className="py-1">
              {availableLanguages.map((lang) => {
                const isSelected = language === lang.code;
                return (
                  <button
                    key={lang.code}
                    role="menuitem"
                    onClick={() => {
                      setLanguage(lang.code);
                      setDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-colors text-left ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base leading-none" aria-hidden="true">{lang.flag}</span>
                      <div>
                        <div className="text-xs leading-none">{lang.nativeName}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{lang.name}</div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
            <div className="px-3 py-1.5 text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-800">
              {language === 'lo' ? 'ການຕັ້ງຄ່າຈະບັນທຶກໄວ້ອັດຕະໂນມັດ' : 'Preference saved to your device'}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Variant 3: Default Compact Button (Header navbar quick toggle with visual feedback)
  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef} onKeyDown={handleKeyDown}>
      <button
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        onDoubleClick={toggleLanguage}
        aria-haspopup="menu"
        aria-expanded={dropdownOpen}
        title={language === 'lo' ? 'ປ່ຽນພາສາ (ຄລິກເພື່ອເລືອກ)' : 'Change interface language (click to select)'}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 bg-white/80 dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all shadow-2xs group"
      >
        <span className="text-base leading-none" aria-hidden="true">{currentLangObj.flag}</span>
        {showLabel && (
          <span className="tracking-wide">
            {language === 'lo' ? 'ລາວ' : 'EN'}
          </span>
        )}
        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform group-hover:text-slate-600 dark:group-hover:text-slate-300 ${dropdownOpen ? 'rotate-180' : ''}`} />
      </button>

      {dropdownOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 mt-2 w-48 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
        >
          <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {language === 'lo' ? 'ພາສາລະບົບ / Language' : 'Interface Language'}
          </div>
          <div className="space-y-0.5">
            {availableLanguages.map((lang) => {
              const isSelected = language === lang.code;
              return (
                <button
                  key={lang.code}
                  role="menuitem"
                  onClick={() => {
                    setLanguage(lang.code);
                    setDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm leading-none" aria-hidden="true">{lang.flag}</span>
                    <span>{lang.nativeName}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
