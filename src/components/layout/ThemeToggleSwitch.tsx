import React from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleSwitchProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggleSwitch: React.FC<ThemeToggleSwitchProps> = ({
  className = '',
  showLabel = false,
}) => {
  const { theme, setTheme, language } = useApp();
  const isDark = theme === 'dark';

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      toggleTheme();
    }
  };

  const tooltipText =
    language === 'lo'
      ? isDark
        ? 'ປ່ຽນເປັນຮູບແບບແຈ້ງ (Switch to Light Mode)'
        : 'ປ່ຽນເປັນຮູບແບບມືດ (Switch to Dark Mode)'
      : isDark
      ? 'Switch to Light Mode'
      : 'Switch to Dark Mode';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Optional descriptive label on desktop */}
      {showLabel && (
        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 hidden md:inline">
          {language === 'lo' ? (isDark ? 'ຮູບແບບມືດ' : 'ຮູບແບບແຈ້ງ') : (isDark ? 'Dark Mode' : 'Light Mode')}
        </span>
      )}

      {/* Modern Accessible Sliding Toggle Switch */}
      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-label={tooltipText}
        tabIndex={0}
        onClick={toggleTheme}
        onKeyDown={handleKeyDown}
        title={tooltipText}
        className={`relative inline-flex items-center h-8 w-15 sm:w-16 rounded-full p-1 transition-all duration-300 ease-in-out cursor-pointer select-none outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
          isDark
            ? 'bg-slate-800 border border-slate-700 shadow-inner'
            : 'bg-slate-200/90 hover:bg-slate-300/80 border border-slate-300/80 shadow-inner'
        }`}
      >
        <span className="sr-only">{tooltipText}</span>

        {/* Ambient Track Icons (Sun on Left, Moon on Right) */}
        <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
          <Sun
            className={`w-3.5 h-3.5 transition-opacity duration-200 ${
              isDark ? 'opacity-30 text-slate-500' : 'opacity-0'
            }`}
          />
          <Moon
            className={`w-3.5 h-3.5 transition-opacity duration-200 ${
              isDark ? 'opacity-0' : 'opacity-40 text-slate-600'
            }`}
          />
        </div>

        {/* Animated Sliding Circular Thumb */}
        <span
          className={`relative z-10 flex items-center justify-center w-6 h-6 rounded-full shadow-md transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1) transform ${
            isDark
              ? 'translate-x-7 sm:translate-x-8 bg-slate-900 text-indigo-400 border border-indigo-500/40 shadow-indigo-500/20'
              : 'translate-x-0 bg-white text-amber-500 border border-amber-200 shadow-amber-500/20'
          }`}
        >
          {isDark ? (
            <Moon className="w-3.5 h-3.5 fill-indigo-400/20 transition-transform duration-300 rotate-0 scale-100" />
          ) : (
            <Sun className="w-3.5 h-3.5 fill-amber-400/20 transition-transform duration-300 rotate-90 scale-100" />
          )}
        </span>
      </button>
    </div>
  );
};
