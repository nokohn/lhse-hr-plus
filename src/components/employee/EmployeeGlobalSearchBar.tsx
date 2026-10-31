import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { Employee, Department } from '../../types/index.ts';
import {
  Search,
  X,
  Building2,
  User,
  Hash,
  SlidersHorizontal,
  Filter,
  Check,
  ChevronDown,
  Eye,
  Briefcase,
  Sparkles,
} from 'lucide-react';

export type SearchScope = 'ALL' | 'NAME' | 'ID' | 'DEPARTMENT';

interface EmployeeGlobalSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedScope: SearchScope;
  onScopeChange: (scope: SearchScope) => void;
  selectedDepartment: string;
  onDepartmentChange: (deptId: string) => void;
  totalCount: number;
  filteredCount: number;
  onSelectEmployee?: (emp: Employee) => void;
  className?: string;
}

export const EmployeeGlobalSearchBar: React.FC<EmployeeGlobalSearchBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedScope,
  onScopeChange,
  selectedDepartment,
  onDepartmentChange,
  totalCount,
  filteredCount,
  onSelectEmployee,
  className = '',
}) => {
  const { language, employees, departments, positions } = useApp();
  const [isFocused, setIsFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Keyboard shortcut (CMD/CTRL + K or /) to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      } else if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Real-time matched suggestions (top 5 for instant dropdown preview)
  const matchedSuggestions = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    const term = searchQuery.toLowerCase().trim();

    return employees.filter((emp) => {
      const dept = departments.find((d) => d.id === emp.departmentId);
      const pos = positions.find((p) => p.id === emp.positionId);

      // Name matches
      const fullNameEn = `${emp.firstNameEn} ${emp.lastNameEn}`.toLowerCase();
      const fullNameLao = `${emp.firstNameLao} ${emp.lastNameLao}`.toLowerCase();
      const nameMatch = fullNameEn.includes(term) || fullNameLao.includes(term);

      // ID matches
      const codeMatch =
        emp.employeeCode.toLowerCase().includes(term) ||
        emp.id.toLowerCase().includes(term) ||
        (emp.nationalId && emp.nationalId.toLowerCase().includes(term));

      // Department matches
      const deptMatch = dept
        ? dept.nameEn.toLowerCase().includes(term) ||
          dept.nameLao.toLowerCase().includes(term) ||
          dept.code.toLowerCase().includes(term)
        : false;

      // Position matches
      const posMatch = pos
        ? pos.titleEn.toLowerCase().includes(term) || pos.titleLao.toLowerCase().includes(term)
        : false;

      if (selectedScope === 'NAME') return nameMatch;
      if (selectedScope === 'ID') return codeMatch;
      if (selectedScope === 'DEPARTMENT') return deptMatch;
      return nameMatch || codeMatch || deptMatch || posMatch;
    }).slice(0, 5);
  }, [searchQuery, employees, departments, positions, selectedScope]);

  const hasActiveFilters = searchQuery.trim().length > 0 || selectedDepartment !== 'ALL' || selectedScope !== 'ALL';

  const handleClearAll = () => {
    onSearchChange('');
    onScopeChange('ALL');
    onDepartmentChange('ALL');
    inputRef.current?.focus();
  };

  return (
    <div ref={searchContainerRef} className={`space-y-3 ${className}`}>
      {/* 1. Main Search Bar Input Row */}
      <div className="relative">
        <div
          className={`relative flex items-center bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-200 ${
            isFocused
              ? 'border-blue-500 ring-4 ring-blue-500/10 shadow-md'
              : 'border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          {/* Leading Icon */}
          <div className="pl-4 pr-2 text-slate-400 dark:text-slate-500 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>

          {/* Search Input */}
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onFocus={() => {
              setIsFocused(true);
              if (searchQuery.trim()) setShowDropdown(true);
            }}
            onBlur={() => setIsFocused(false)}
            onChange={(e) => {
              onSearchChange(e.target.value);
              setShowDropdown(true);
            }}
            placeholder={
              selectedScope === 'NAME'
                ? language === 'lo'
                  ? 'ຄົ້ນຫາຕາມຊື່ ຫຼື ນາມສະກຸນ...'
                  : 'Search by employee name (Lao / English)...'
                : selectedScope === 'ID'
                ? language === 'lo'
                  ? 'ຄົ້ນຫາຕາມລະຫັດພະນັກງານ (ເຊັ່ນ: LHSE-001, LHSE-025)...'
                  : 'Search by employee ID or code (e.g. LHSE-001, LHSE-025)...'
                : selectedScope === 'DEPARTMENT'
                ? language === 'lo'
                  ? 'ຄົ້ນຫາຕາມພະແນກ (ເຊັ່ນ: ການເງິນ, ໄອທີ, ພະລັງງານ)...'
                  : 'Search by department name or code...'
                : language === 'lo'
                ? 'ຄົ້ນຫາພະນັກງານທົ່ວລະບົບ ຕາມຊື່, ລະຫັດ ຫຼື ພະແນກ (ກົດ / ເພື່ອຄົ້ນຫາ)...'
                : 'Global search employees by name, ID, or department (Press / or ⌘K)...'
            }
            className="w-full py-3.5 px-2 bg-transparent text-sm font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none"
          />

          {/* Trailing Actions */}
          <div className="flex items-center gap-1.5 pr-3">
            {searchQuery && (
              <button
                onClick={() => {
                  onSearchChange('');
                  setShowDropdown(false);
                  inputRef.current?.focus();
                }}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Keyboard shortcut hint */}
            <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-400 border border-slate-200/60 dark:border-slate-700">
              <span>⌘K</span>
            </div>
          </div>
        </div>

        {/* Real-time Quick Suggestion Dropdown */}
        {showDropdown && searchQuery.trim() && (
          <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="p-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                <span>
                  {language === 'lo'
                    ? `ພົບເຫັນ ${matchedSuggestions.length} ຜົນການຄົ້ນຫາທັນທີ`
                    : `Instant matches (${matchedSuggestions.length})`}
                </span>
              </span>
              <span className="text-[11px] text-slate-400">
                {language === 'lo' ? 'ຄລິກເພື່ອເບິ່ງໂປຣໄຟລ໌' : 'Click to inspect profile'}
              </span>
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
              {matchedSuggestions.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  {language === 'lo'
                    ? `ບໍ່ພົບພະນັກງານທີ່ກົງກັບ "${searchQuery}"`
                    : `No employee records match "${searchQuery}"`}
                </div>
              ) : (
                matchedSuggestions.map((emp) => {
                  const dept = departments.find((d) => d.id === emp.departmentId);
                  const pos = positions.find((p) => p.id === emp.positionId);

                  return (
                    <div
                      key={emp.id}
                      onClick={() => {
                        setShowDropdown(false);
                        if (onSelectEmployee) onSelectEmployee(emp);
                      }}
                      className="p-3 hover:bg-blue-50/60 dark:hover:bg-slate-800/70 cursor-pointer flex items-center justify-between transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center shrink-0">
                          {emp.firstNameEn.slice(0, 1)}
                          {emp.lastNameEn.slice(0, 1)}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            <span>
                              {language === 'lo'
                                ? `${emp.firstNameLao} ${emp.lastNameLao}`
                                : `${emp.firstNameEn} ${emp.lastNameEn}`}
                            </span>
                            <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950 px-1 rounded">
                              {emp.employeeCode}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span>{dept ? (language === 'lo' ? dept.nameLao : dept.nameEn) : 'LHSE'}</span>
                            <span>•</span>
                            <span>{pos ? (language === 'lo' ? pos.titleLao : pos.titleEn) : 'Staff'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/60 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                          {emp.status}
                        </span>
                        <Eye className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. Search Scope Tabs & Results Counter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Scope Selector Badges (All, Name, ID, Department) */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 hidden sm:inline">
            {language === 'lo' ? 'ຄົ້ນຫາຕາມ:' : 'Scope:'}
          </span>
          <button
            onClick={() => onScopeChange('ALL')}
            className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all ${
              selectedScope === 'ALL'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {language === 'lo' ? 'ທຸກຊ່ອງ (All)' : 'All Fields'}
          </button>
          <button
            onClick={() => onScopeChange('NAME')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-xs transition-all ${
              selectedScope === 'NAME'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <User className="w-3 h-3" />
            <span>{language === 'lo' ? 'ຊື່' : 'Name'}</span>
          </button>
          <button
            onClick={() => onScopeChange('ID')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-xs transition-all ${
              selectedScope === 'ID'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Hash className="w-3 h-3" />
            <span>{language === 'lo' ? 'ລະຫັດ ID' : 'Employee ID'}</span>
          </button>
          <button
            onClick={() => onScopeChange('DEPARTMENT')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-xs transition-all ${
              selectedScope === 'DEPARTMENT'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3 h-3" />
            <span>{language === 'lo' ? 'ພະແນກ' : 'Department'}</span>
          </button>
        </div>

        {/* Real-time Results Counter & Reset Filter */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs">
            <span className="text-slate-400">
              {language === 'lo' ? 'ຜົນການຄົ້ນຫາ:' : 'Results:'}
            </span>
            <span className="font-mono font-black text-blue-600 dark:text-blue-400">
              {filteredCount}
            </span>
            <span className="text-slate-400">
              / {totalCount} {language === 'lo' ? 'ທ່ານ' : 'employees'}
            </span>
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleClearAll}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 transition-colors flex items-center gap-1"
              title="Reset search and filters"
            >
              <X className="w-3 h-3" />
              <span>{language === 'lo' ? 'ລ້າງການຄົ້ນຫາ' : 'Clear Search'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Department Quick-Filter Chips Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 scrollbar-thin">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0 mr-1 flex items-center gap-1">
          <Filter className="w-3 h-3" />
          <span>{language === 'lo' ? 'ສາຍງານພະແນກ:' : 'Divisions:'}</span>
        </span>

        {/* "All" Department Chip */}
        <button
          onClick={() => onDepartmentChange('ALL')}
          className={`shrink-0 px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            selectedDepartment === 'ALL'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-50'
          }`}
        >
          <span>{language === 'lo' ? 'ທຸກພະແນກ' : 'All Departments'}</span>
          <span
            className={`font-mono text-[10px] px-1 rounded ${
              selectedDepartment === 'ALL'
                ? 'bg-blue-700 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            {employees.length}
          </span>
        </button>

        {/* Individual Department Chips with Employee Counts */}
        {departments.map((dept) => {
          const deptEmployeeCount = employees.filter((e) => e.departmentId === dept.id).length;
          const isSelected = selectedDepartment === dept.id;

          return (
            <button
              key={dept.id}
              onClick={() => onDepartmentChange(isSelected ? 'ALL' : dept.id)}
              className={`shrink-0 px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <span className="truncate max-w-[160px]">
                {language === 'lo' ? dept.nameLao : dept.nameEn}
              </span>
              <span
                className={`font-mono text-[10px] px-1 rounded ${
                  isSelected
                    ? 'bg-blue-700 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {deptEmployeeCount}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
