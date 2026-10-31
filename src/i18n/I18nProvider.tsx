import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { Language } from '../types/index.ts';
import { translations } from '../locales/translations.ts';

export interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  formatDate: (date: string | Date | number, style?: 'short' | 'medium' | 'long') => string;
  formatCurrency: (amount: number) => string;
  formatNumber: (num: number) => string;
  isLao: boolean;
  isEnglish: boolean;
  availableLanguages: { code: Language; name: string; nativeName: string; flag: string }[];
}

export const I18nContext = createContext<I18nContextType | null>(null);

const STORAGE_KEY = 'lhse_language';

export const AVAILABLE_LANGUAGES: { code: Language; name: string; nativeName: string; flag: string }[] = [
  { code: 'lo', name: 'Lao', nativeName: 'ພາສາລາວ', flag: '🇱🇦' },
  { code: 'en', name: 'English', nativeName: 'English (US)', flag: '🇬🇧' },
];

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed === 'lo' || parsed === 'en') return parsed;
      }
    } catch {
      // fallback
    }
    return 'lo';
  });

  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newLang));
    } catch (e) {
      console.warn('Could not persist language to localStorage', e);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'lo' ? 'en' : 'lo');
  };

  // Synchronize HTML attributes for accessibility and screen readers
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.setAttribute('data-lang', language);
    if (language === 'lo') {
      document.body.classList.add('font-lao');
    } else {
      document.body.classList.remove('font-lao');
    }
  }, [language]);

  // Translation function with parameter interpolation support: {current}, {total}, etc.
  const t = (key: string, params?: Record<string, string | number>): string => {
    const dict = translations[language] || translations['lo'];
    let text = (dict as any)?.[key];

    // Fallback to Lao or English if key not in selected language
    if (!text && language !== 'lo') {
      text = (translations['lo'] as any)?.[key];
    }
    if (!text && language !== 'en') {
      text = (translations['en'] as any)?.[key];
    }

    if (!text) {
      return key;
    }

    // Interpolate params if provided
    if (params) {
      Object.keys(params).forEach((paramKey) => {
        const regex = new RegExp(`\\{${paramKey}\\}`, 'g');
        text = text.replace(regex, String(params[paramKey]));
      });
    }

    return text;
  };

  // Date formatting according to locale
  const formatDate = (dateInput: string | Date | number, style: 'short' | 'medium' | 'long' = 'medium'): string => {
    if (!dateInput) return '';
    try {
      const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
      if (isNaN(d.getTime())) return String(dateInput);

      if (language === 'lo') {
        const day = d.getDate();
        const monthNamesLao = [
          'ມັງກອນ', 'ກຸມພາ', 'ມີນາ', 'ເມສາ', 'ພຶດສະພາ', 'ມິຖຸນາ',
          'ກໍລະກົດ', 'ສິງຫາ', 'ກັນຍາ', 'ຕຸລາ', 'ພະຈິກ', 'ທັນວາ'
        ];
        const month = monthNamesLao[d.getMonth()];
        const year = d.getFullYear();

        if (style === 'short') {
          return `${String(day).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${year}`;
        }
        return `${day} ${month} ${year}`;
      } else {
        if (style === 'short') {
          return d.toISOString().split('T')[0];
        }
        return d.toLocaleDateString('en-US', {
          year: 'numeric',
          month: style === 'long' ? 'long' : 'short',
          day: 'numeric',
        });
      }
    } catch {
      return String(dateInput);
    }
  };

  // Currency formatting for Lao Kip (LAK)
  const formatCurrency = (amount: number): string => {
    if (amount === undefined || amount === null || isNaN(amount)) return '0 LAK';
    const formatted = Math.round(amount).toLocaleString('en-US');
    return language === 'lo' ? `${formatted} ກີບ` : `${formatted} LAK`;
  };

  // Number formatting
  const formatNumber = (num: number): string => {
    if (num === undefined || num === null || isNaN(num)) return '0';
    return Number(num).toLocaleString('en-US');
  };

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      toggleLanguage,
      t,
      formatDate,
      formatCurrency,
      formatNumber,
      isLao: language === 'lo',
      isEnglish: language === 'en',
      availableLanguages: AVAILABLE_LANGUAGES,
    }),
    [language]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};

// Aliased convenience hook
export const useTranslation = useI18n;
