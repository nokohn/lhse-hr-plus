import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import type { User as AppUser } from '../../types/index.ts';
import { alerts } from '../../utils/alerts.ts';
import {
  User,
  Settings,
  LogOut,
  ChevronDown,
  ShieldCheck,
  Mail,
  Building2,
  Phone,
  Lock,
  Bell,
  Globe,
  Sun,
  Moon,
  Check,
  X,
  Key,
  Shield,
  Smartphone,
  Sparkles,
  Camera,
  Upload,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Laptop,
  Calendar,
  BadgeCheck,
  Save,
} from 'lucide-react';

export const UserProfile: React.FC = () => {
  const {
    language,
    setLanguage,
    theme,
    setTheme,
    currentUser,
    setCurrentUser,
    employees,
    departments,
    positions,
    setActiveModule,
    setActiveSubModule,
    addAuditLog,
    logout,
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'PROFILE' | 'LANGUAGE_PREF' | 'SECURITY'>('PROFILE');

  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Find linked employee record if any
  const linkedEmployee = useMemo(() => {
    if (!currentUser.employeeId) return null;
    return employees.find((e) => e.id === currentUser.employeeId) || null;
  }, [currentUser, employees]);

  // Find department & position
  const department = useMemo(() => {
    const deptId = currentUser.departmentId || linkedEmployee?.departmentId;
    return departments.find((d) => d.id === deptId) || null;
  }, [currentUser, linkedEmployee, departments]);

  const position = useMemo(() => {
    const posId = linkedEmployee?.positionId;
    return positions.find((p) => p.id === posId) || null;
  }, [linkedEmployee, positions]);

  // Settings Form State
  const [formNameLao, setFormNameLao] = useState(currentUser.fullNameLao);
  const [formNameEn, setFormNameEn] = useState(currentUser.fullName);
  const [formEmail, setFormEmail] = useState(currentUser.email);
  const [formPhone, setFormPhone] = useState(linkedEmployee?.phone || '+856 20 5551 2345');
  const [formAvatarUrl, setFormAvatarUrl] = useState(currentUser.avatarUrl || '');
  const [formLanguage, setFormLanguage] = useState<'lo' | 'en'>(language);
  const [formTheme, setFormTheme] = useState<'light' | 'dark'>(theme);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Security & notification preferences
  const [is2FAEnabled, setIs2FAEnabled] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [approvalNotifs, setApprovalNotifs] = useState(true);

  // Sync state when currentUser or language opens modal
  useEffect(() => {
    if (isSettingsModalOpen) {
      setFormNameLao(currentUser.fullNameLao || currentUser.fullName);
      setFormNameEn(currentUser.fullName);
      setFormEmail(currentUser.email);
      setFormAvatarUrl(currentUser.avatarUrl || '');
      setFormLanguage(language);
      setFormTheme(theme);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  }, [isSettingsModalOpen, currentUser, language, theme]);

  // Role Badge Styling
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return {
          label: language === 'lo' ? 'ຜູ້ດູແລລະບົບສູງສຸດ' : 'Super Admin',
          color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
        };
      case 'HR_ADMIN':
        return {
          label: language === 'lo' ? 'ຜູ້ບໍລິຫານບຸກຄະລາກອນ' : 'HR Admin',
          color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        };
      case 'EXECUTIVE':
        return {
          label: language === 'lo' ? 'ຄະນະຜູ້ບໍລິຫານ' : 'Executive',
          color: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800',
        };
      case 'DEPT_HEAD':
        return {
          label: language === 'lo' ? 'ຫົວໜ້າພະແນກ' : 'Dept Head',
          color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        };
      default:
        return {
          label: language === 'lo' ? 'ພະນັກງານ' : 'Employee',
          color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
        };
    }
  };

  const roleBadge = getRoleBadge(currentUser.role);

  // Initials for avatar
  const initials = useMemo(() => {
    const parts = currentUser.fullName.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return currentUser.fullName.slice(0, 2).toUpperCase();
  }, [currentUser.fullName]);

  // Password validation & strength calculation
  const passwordStrength = useMemo(() => {
    if (!newPassword) return 0;
    let score = 0;
    if (newPassword.length >= 8) score += 1;
    if (/[A-Z]/.test(newPassword) || /[a-z]/.test(newPassword)) score += 1;
    if (/[0-9]/.test(newPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(newPassword)) score += 1;
    return score; // 0 to 4
  }, [newPassword]);

  // Handle image upload via FileReader
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alerts.error(
        language === 'lo' ? 'ກະລຸນາເລືອກໄຟລ໌ຮູບພາບເທົ່ານັ້ນ' : 'Please select an image file.'
      );
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      alerts.error(
        language === 'lo'
          ? 'ຂະໜາດຮູບພາບບໍ່ຄວນເກີນ 3MB'
          : 'Image size should not exceed 3MB.'
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setFormAvatarUrl(result);
      alerts.success(
        language === 'lo' ? 'ອັບໂຫຼດຮູບພາບສຳເລັດ' : 'Image Uploaded',
        language === 'lo' ? 'ທ່ານສາມາດກົດບັນທຶກເພື່ອຢືນຢັນ' : 'Click Save to confirm changes.'
      );
    };
    reader.readAsDataURL(file);
  };

  // Preset avatar choices
  const presetAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  ];

  // Save Settings Handler
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formNameEn.trim()) {
      alerts.error(
        language === 'lo' ? 'ກະລຸນາປ້ອນຊື່ສະແດງພາສາອັງກິດ' : 'Please provide English display name'
      );
      return;
    }

    // Password validation if user entered password fields
    const isChangingPassword = currentPassword || newPassword || confirmPassword;
    if (isChangingPassword) {
      if (!currentPassword) {
        alerts.error(
          language === 'lo'
            ? 'ກະລຸນາປ້ອນລະຫັດຜ່ານປັດຈຸບັນ'
            : 'Please enter your current password to change password.'
        );
        return;
      }
      if (newPassword.length < 8) {
        alerts.error(
          language === 'lo'
            ? 'ລະຫັດຜ່ານໃໝ່ຕ້ອງມີຢ່າງໜ້ອຍ 8 ຕົວອັກສອນ'
            : 'New password must be at least 8 characters long.'
        );
        return;
      }
      if (newPassword !== confirmPassword) {
        alerts.error(
          language === 'lo'
            ? 'ລະຫັດຜ່ານໃໝ່ ແລະ ການຢືນຢັນລະຫັດຜ່ານບໍ່ກົງກັນ'
            : 'New password and confirm password do not match.'
        );
        return;
      }
    }

    // Prepare updated user
    const updatedUser: AppUser = {
      ...currentUser,
      fullName: formNameEn.trim(),
      fullNameLao: formNameLao.trim() || formNameEn.trim(),
      email: formEmail.trim(),
      avatarUrl: formAvatarUrl.trim() || undefined,
    };

    // Apply User & Language update
    setCurrentUser(updatedUser);
    if (formLanguage !== language) {
      setLanguage(formLanguage);
    }
    if (formTheme !== theme) {
      setTheme(formTheme);
    }

    // Audit log
    const changes: string[] = [];
    if (currentUser.fullName !== updatedUser.fullName || currentUser.fullNameLao !== updatedUser.fullNameLao) {
      changes.push(`Display Name updated to "${updatedUser.fullName}" / "${updatedUser.fullNameLao}"`);
    }
    if (formLanguage !== language) {
      changes.push(`Language preference updated to ${formLanguage.toUpperCase()}`);
    }
    if (isChangingPassword) {
      changes.push('Password was updated successfully');
    }
    if (currentUser.avatarUrl !== updatedUser.avatarUrl) {
      changes.push('Profile picture updated');
    }

    addAuditLog(
      'USER_UPDATE',
      'UPDATE',
      'User Profile & Settings',
      `Profile updated for ${updatedUser.fullName}: ${changes.join(', ') || 'Preferences saved'}`,
      {
        entityType: 'USER_ACCOUNT',
        entityName: updatedUser.fullName,
        recordId: currentUser.id,
      }
    );

    setIsSettingsModalOpen(false);

    alerts.success(
      language === 'lo' ? 'ບັນທຶກການຕັ້ງຄ່າສຳເລັດ' : 'Settings Saved Successfully',
      language === 'lo'
        ? `ອັບເດດຊື່ສະແດງ, ພາສາ ແລະ ລະຫັດຜ່ານຮຽບຮ້ອຍແລ້ວ`
        : `Your display name, language preference, and security credentials have been updated.`
    );
  };

  // Logout Handler
  const handleConfirmLogout = () => {
    setIsLogoutModalOpen(false);
    setIsOpen(false);
    logout();
    alerts.success(
      language === 'lo' ? 'ອອກຈາກລະບົບສຳເລັດ' : 'Logged Out',
      language === 'lo'
        ? 'ທ່ານໄດ້ອອກຈາກລະບົບຮຽບຮ້ອຍແລ້ວ'
        : 'You have been successfully signed out.'
    );
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* 1. Header Interactive Profile Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/60 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-2xs group focus:ring-2 focus:ring-blue-500/40"
        title={language === 'lo' ? 'ໂປຣໄຟລ໌ຜູ້ໃຊ້ & ການຕັ້ງຄ່າ' : 'User Profile & Account Settings'}
        aria-expanded={isOpen}
      >
        {/* Avatar with live online indicator */}
        <div className="relative">
          {currentUser.avatarUrl ? (
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.fullName}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-xs group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white flex items-center justify-center font-bold text-xs shadow-xs group-hover:scale-105 transition-transform">
              {initials}
            </div>
          )}
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
        </div>

        {/* Name and Role text */}
        <div className="hidden xl:block text-left">
          <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate max-w-[130px] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {language === 'lo' ? currentUser.fullNameLao : currentUser.fullName}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[130px]">
            {roleBadge.label}
          </div>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 hidden sm:block ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* 2. User Profile Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 divide-y divide-slate-100 dark:divide-slate-800/80">
          {/* User Card Header */}
          <div className="p-4 bg-gradient-to-br from-blue-50/80 via-slate-50 to-white dark:from-slate-800/80 dark:via-slate-850 dark:to-slate-900 space-y-3">
            <div className="flex items-start gap-3">
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.fullName}
                  className="w-12 h-12 rounded-2xl object-cover border-2 border-white dark:border-slate-700 shadow-md shadow-blue-500/20 shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-blue-500/20 shrink-0">
                  {initials}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                  {language === 'lo' ? currentUser.fullNameLao : currentUser.fullName}
                </h4>
                <p className="text-[11px] text-slate-500 truncate mt-0.5 font-mono">
                  {currentUser.email}
                </p>

                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${roleBadge.color}`}
                  >
                    {roleBadge.label}
                  </span>
                  {linkedEmployee && (
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {linkedEmployee.employeeCode}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Department info snippet */}
            {department && (
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5 truncate">
                  <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="truncate">{language === 'lo' ? department.nameLao : department.nameEn}</span>
                </span>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-800/60 shrink-0">
                  {language === 'lo' ? 'ອອນລາຍ' : 'Online'}
                </span>
              </div>
            )}
          </div>

          {/* Primary Action Button: Open Profile & Settings Modal */}
          <div className="p-2.5 bg-blue-50/40 dark:bg-blue-950/20">
            <button
              onClick={() => {
                setIsOpen(false);
                setIsSettingsModalOpen(true);
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 group-hover:rotate-45 transition-transform" />
                <span>
                  {language === 'lo' ? 'ໂປຣໄຟລ໌ & ການຕັ້ງຄ່າ' : 'Profile & Settings'}
                </span>
              </div>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-medium">
                {language === 'lo' ? 'ແກ້ໄຂ' : 'Edit'}
              </span>
            </button>
          </div>

          {/* Core Menu Actions */}
          <div className="p-2 space-y-1 text-xs">
            {/* Action 1: My Staff Record */}
            <button
              onClick={() => {
                setIsOpen(false);
                setActiveModule('module-2');
                setActiveSubModule('directory');
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-xs group-hover:text-purple-600 transition-colors">
                    {language === 'lo' ? 'ໂປຣໄຟລ໌ພະນັກງານ' : 'My Staff Record'}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {language === 'lo' ? 'ເອກະສານ, ສັນຍາ & ປະຫວັດ' : 'Contracts & personnel file'}
                  </div>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 -rotate-90" />
            </button>

            {/* Action 2: Audit Trail (for Admins) */}
            {['SUPER_ADMIN', 'HR_ADMIN'].includes(currentUser.role) && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  setActiveModule('module-15');
                  setActiveSubModule('audit-logs');
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-xs group-hover:text-emerald-600 transition-colors">
                      {language === 'lo' ? 'ບັນທຶກກວດສອບ (Audit)' : 'System Audit Logs'}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {language === 'lo' ? 'ປະຫວັດການດຳເນີນງານທົ່ວລະບົບ' : 'Security trail & events'}
                    </div>
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 -rotate-90" />
              </button>
            )}
          </div>

          {/* Quick Preferences Row */}
          <div className="p-3 bg-slate-50/70 dark:bg-slate-850/60 flex items-center justify-between text-xs">
            <span className="text-[11px] font-medium text-slate-500">
              {language === 'lo' ? 'ຮູບແບບ & ພາສາ' : 'Preferences'}
            </span>

            <div className="flex items-center gap-1.5">
              {/* Language toggle */}
              <button
                onClick={() => setLanguage(language === 'lo' ? 'en' : 'lo')}
                className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Switch Language"
              >
                {language === 'lo' ? 'EN 🇬🇧' : 'ລາວ 🇱🇦'}
              </button>

              {/* Theme toggle */}
              <button
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Switch Theme"
              >
                {theme === 'light' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
              </button>
            </div>
          </div>

          {/* Logout Action */}
          <div className="p-2">
            <button
              onClick={() => {
                setIsOpen(false);
                setIsLogoutModalOpen(true);
              }}
              className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer group text-xs font-bold"
            >
              <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <LogOut className="w-4 h-4" />
              </div>
              <div className="text-left flex-1">
                <span>{language === 'lo' ? 'ອອກຈາກລະບົບ (Logout)' : 'Logout'}</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* 3. Comprehensive User Profile & Settings Modal */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[92vh] my-auto">
            {/* Modal Header with LHSE Brand Background */}
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-inner">
                    <Settings className="w-6 h-6 text-blue-300" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-base sm:text-lg tracking-tight">
                        {language === 'lo' ? 'ໂປຣໄຟລ໌ຜູ້ໃຊ້ & ການຕັ້ງຄ່າ' : 'User Profile & Settings'}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 border border-white/20">
                        LHSE
                      </span>
                    </div>
                    <p className="text-xs text-blue-200/80 mt-0.5">
                      {language === 'lo'
                        ? 'ປັບປຸງຊື່ສະແດງ, ພາສາທີ່ໃຊ້ງານ, ລະຫັດຜ່ານ ແລະ ຄວາມປອດໄພ'
                        : 'Update your display name, language preference, password & security'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsSettingsModalOpen(false)}
                  className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="flex gap-2 sm:gap-3 mt-5 border-t border-white/10 pt-3">
                <button
                  type="button"
                  onClick={() => setSettingsTab('PROFILE')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    settingsTab === 'PROFILE'
                      ? 'bg-white text-slate-900 shadow-md'
                      : 'text-white/80 hover:bg-white/10'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>{language === 'lo' ? '1. ຊື່ສະແດງ & ໂປຣໄຟລ໌' : '1. Profile & Name'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSettingsTab('LANGUAGE_PREF')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    settingsTab === 'LANGUAGE_PREF'
                      ? 'bg-white text-slate-900 shadow-md'
                      : 'text-white/80 hover:bg-white/10'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>{language === 'lo' ? '2. ພາສາ & ຮູບແບບ' : '2. Language & Display'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSettingsTab('SECURITY')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    settingsTab === 'SECURITY'
                      ? 'bg-white text-slate-900 shadow-md'
                      : 'text-white/80 hover:bg-white/10'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{language === 'lo' ? '3. ລະຫັດຜ່ານ & ຄວາມປອດໄພ' : '3. Password & Security'}</span>
                </button>
              </div>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSaveSettings} className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs flex-1">
              {/* TAB 1: PROFILE & DISPLAY NAME */}
              {settingsTab === 'PROFILE' && (
                <div className="space-y-5">
                  {/* Avatar Upload & Preview Banner */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative group shrink-0">
                      {formAvatarUrl ? (
                        <img
                          src={formAvatarUrl}
                          alt="Avatar preview"
                          className="w-20 h-20 rounded-2xl object-cover border-2 border-white dark:border-slate-700 shadow-md"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white flex items-center justify-center font-black text-2xl shadow-md">
                          {initials}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 rounded-2xl bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 cursor-pointer"
                        title="Change photo"
                      >
                        <Camera className="w-5 h-5" />
                        <span className="text-[9px] font-bold">Change</span>
                      </button>
                    </div>

                    <div className="flex-1 space-y-2 text-center sm:text-left">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {language === 'lo' ? 'ຮູບພາບໂປຣໄຟລ໌ປະຈຳຕົວ' : 'Profile Picture'}
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          {language === 'lo'
                            ? 'ອັບໂຫຼດຮູບພາບໃໝ່ ຫຼື ເລືອກຮູບພາບຕົວຢ່າງ (ຮອງຮັບ PNG, JPG, WebP ບໍ່ເກີນ 3MB)'
                            : 'Upload a custom photo or choose a preset avatar (PNG, JPG, max 3MB)'}
                        </p>
                      </div>

                      <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{language === 'lo' ? 'ອັບໂຫຼດຮູບພາບ' : 'Upload Image'}</span>
                        </button>

                        {formAvatarUrl && (
                          <button
                            type="button"
                            onClick={() => setFormAvatarUrl('')}
                            className="px-2.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold cursor-pointer transition-colors"
                          >
                            {language === 'lo' ? 'ລຶບຮູບ (ໃຊ້ຕົວອັກສອນ)' : 'Reset to Initials'}
                          </button>
                        )}
                      </div>

                      {/* Quick Presets */}
                      <div className="flex items-center gap-2 pt-1 justify-center sm:justify-start">
                        <span className="text-[10px] text-slate-400 font-medium">Presets:</span>
                        {presetAvatars.map((url, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setFormAvatarUrl(url)}
                            className={`w-7 h-7 rounded-lg overflow-hidden border-2 transition-transform hover:scale-110 cursor-pointer ${
                              formAvatarUrl === url ? 'border-blue-600 ring-2 ring-blue-500/30' : 'border-transparent'
                            }`}
                          >
                            <img src={url} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Display Name Inputs (English & Lao) */}
                  <div className="p-4 rounded-2xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/30 dark:bg-blue-950/20 space-y-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <h4 className="font-bold text-xs text-blue-950 dark:text-blue-200">
                        {language === 'lo' ? 'ຊື່ສະແດງໃນລະບົບ (Display Names)' : 'System Display Names'}
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                          <span>{language === 'lo' ? 'ຊື່ສະແດງ (ພາສາອັງກິດ) *' : 'Display Name (English) *'}</span>
                          <span className="text-[10px] text-slate-400">Header & Global</span>
                        </label>
                        <input
                          type="text"
                          value={formNameEn}
                          onChange={(e) => setFormNameEn(e.target.value)}
                          placeholder="e.g. Khamphone Sayasane"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 outline-hidden focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                          <span>{language === 'lo' ? 'ຊື່ສະແດງ (ພາສາລາວ)' : 'Display Name (Lao)'}</span>
                          <span className="text-[10px] text-slate-400">Lao Interface</span>
                        </label>
                        <input
                          type="text"
                          value={formNameLao}
                          onChange={(e) => setFormNameLao(e.target.value)}
                          placeholder="ຕົວຢ່າງ: ຄຳພອນ ໄຊຍະສານ"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 outline-hidden focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-500 bg-white/70 dark:bg-slate-800/70 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2">
                      <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        {language === 'lo'
                          ? `ຕົວຢ່າງຊື່ທີ່ຈະສະແດງຢູ່ເທິງມູມຂວາ: ${formNameLao || formNameEn} (${roleBadge.label})`
                          : `Live header preview: ${formNameEn} (${roleBadge.label})`}
                      </span>
                    </div>
                  </div>

                  {/* Email & Phone Contact Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-blue-600" />
                        <span>{language === 'lo' ? 'ອີເມວທາງການ (Official Email) *' : 'Official Email *'}</span>
                      </label>
                      <input
                        type="email"
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-slate-100 outline-hidden focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{language === 'lo' ? 'ເບີໂທລະສັບຕິດຕໍ່' : 'Phone Number'}</span>
                      </label>
                      <input
                        type="text"
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-slate-100 outline-hidden focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Organizational Placement Summary Card */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      {language === 'lo' ? 'ຂໍ້ມູນສັງກັດອົງກອນ (Organizational Record)' : 'Organizational Placement'}
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500 block text-[11px]">{language === 'lo' ? 'ລະຫັດພະນັກງານ' : 'Staff ID'}</span>
                        <strong className="text-slate-800 dark:text-slate-200 font-mono">
                          {linkedEmployee?.employeeCode || 'LHSE-EMP-001'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">{language === 'lo' ? 'ບົດບາດ' : 'Role'}</span>
                        <strong className="text-blue-600 font-bold">
                          {currentUser.role.replace('_', ' ')}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">{language === 'lo' ? 'ພະແນກ' : 'Department'}</span>
                        <strong className="text-slate-800 dark:text-slate-200 truncate block">
                          {department ? (language === 'lo' ? department.nameLao : department.nameEn) : 'LHSE HQ'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">{language === 'lo' ? 'ຕຳແໜ່ງ' : 'Position'}</span>
                        <strong className="text-slate-800 dark:text-slate-200 truncate block">
                          {position ? (language === 'lo' ? position.titleLao : position.titleEn) : 'Officer'}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: LANGUAGE & PREFERENCES */}
              {settingsTab === 'LANGUAGE_PREF' && (
                <div className="space-y-5">
                  {/* Language Preference Section */}
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-blue-600" />
                        <span>{language === 'lo' ? 'ເລືອກພາສາທີ່ຕ້ອງການນຳໃຊ້ (Language Preference)' : 'Language Preference'}</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {language === 'lo'
                          ? 'ເລືອກພາສາຫຼັກສຳລັບການສະແດງເມນູ, ປຸ່ມກົດ, ແລະ ລາຍງານທົ່ວລະບົບ'
                          : 'Select your preferred interface language across navigation, menus, and reports'}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {/* Option 1: Lao */}
                      <button
                        type="button"
                        onClick={() => setFormLanguage('lo')}
                        className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer relative ${
                          formLanguage === 'lo'
                            ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 shadow-sm'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className="text-2xl">🇱🇦</span>
                            <div>
                              <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                                ພາສາລາວ (Lao)
                              </div>
                              <div className="text-[11px] text-slate-500">
                                ພາສາທາງການ ສປປ ລາວ
                              </div>
                            </div>
                          </div>
                          {formLanguage === 'lo' && (
                            <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                          ເມນູ, ແບບຟອມຄຳຮ້ອງ, ໃບເງິນເດືອນ, ແລະ ຂໍ້ມູນພະນັກງານຈະສະແດງເປັນພາສາລາວ
                        </p>
                      </button>

                      {/* Option 2: English */}
                      <button
                        type="button"
                        onClick={() => setFormLanguage('en')}
                        className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer relative ${
                          formLanguage === 'en'
                            ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 shadow-sm'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className="text-2xl">🇬🇧</span>
                            <div>
                              <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                                English
                              </div>
                              <div className="text-[11px] text-slate-500">
                                International English
                              </div>
                            </div>
                          </div>
                          {formLanguage === 'en' && (
                            <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                          Standard English for global enterprise reporting, navigation, and analytics.
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Theme Preference Section */}
                  <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Sun className="w-4 h-4 text-amber-500" />
                        <span>{language === 'lo' ? 'ຮູບແບບການສະແດງຜົນ (Theme Mode)' : 'Appearance Theme'}</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {language === 'lo' ? 'ເລືອກໂໝດແຈ້ງ (Light) ຫຼື ໂໝດມືດ (Dark)' : 'Choose between Light or Dark theme'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                      <button
                        type="button"
                        onClick={() => setFormTheme('light')}
                        className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center gap-3 ${
                          formTheme === 'light'
                            ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                        }`}
                      >
                        <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                          <Sun className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
                            {language === 'lo' ? 'ໂໝດສະຫວ່າງ' : 'Light Mode'}
                          </div>
                          <div className="text-[10px] text-slate-400">Clean & Crisp</div>
                        </div>
                        {formTheme === 'light' && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormTheme('dark')}
                        className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center gap-3 ${
                          formTheme === 'dark'
                            ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                        }`}
                      >
                        <div className="w-9 h-9 rounded-xl bg-slate-800 text-blue-400 flex items-center justify-center shrink-0">
                          <Moon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
                            {language === 'lo' ? 'ໂໝດມືດ' : 'Dark Mode'}
                          </div>
                          <div className="text-[10px] text-slate-400">Eye Friendly</div>
                        </div>
                        {formTheme === 'dark' && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                      </button>
                    </div>
                  </div>

                  {/* Notification Alerts Toggles */}
                  <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Bell className="w-4 h-4 text-blue-600" />
                      <span>{language === 'lo' ? 'ການແຈ້ງເຕືອນ (Notifications)' : 'Notification Preferences'}</span>
                    </h4>

                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <h5 className="font-bold text-xs text-slate-800 dark:text-slate-200">
                          {language === 'lo' ? 'ແຈ້ງເຕືອນຄຳຮ້ອງອະນຸມັດ (Approval Alerts)' : 'Approval Request Notifications'}
                        </h5>
                        <p className="text-[11px] text-slate-500">
                          {language === 'lo' ? 'ຮັບການແຈ້ງເຕືອນເມື່ອມີຄຳຮ້ອງລາພັກ ຫຼື ເບີກຈ່າຍສົ່ງຫາທ່ານ' : 'Get instant alerts when pending requests need your approval'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setApprovalNotifs(!approvalNotifs)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                          approvalNotifs ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            approvalNotifs ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <h5 className="font-bold text-xs text-slate-800 dark:text-slate-200">
                          {language === 'lo' ? 'ແຈ້ງເຕືອນຂ່າວສານ & ປະກາດ (LHSE Announcements)' : 'Company Announcements & Bulletins'}
                        </h5>
                        <p className="text-[11px] text-slate-500">
                          {language === 'lo' ? 'ແຈ້ງເຕືອນເມື່ອມີປະກາດທາງການ ຫຼື ວັນພັກລັດຖະການ' : 'Receive executive bulletins and holiday schedule updates'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEmailNotifs(!emailNotifs)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                          emailNotifs ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            emailNotifs ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: PASSWORD & SECURITY */}
              {settingsTab === 'SECURITY' && (
                <div className="space-y-5">
                  {/* Two-Factor Authentication Toggle */}
                  <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 flex items-center justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                            {language === 'lo' ? 'ການຢືນຢັນຕົວຕົນ 2 ຊັ້ນ (2FA)' : 'Two-Factor Authentication (2FA)'}
                          </h4>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            {is2FAEnabled ? 'Active' : 'Disabled'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {language === 'lo'
                            ? 'ປ້ອງກັນບັນຊີດ້ວຍ OTP ຜ່ານ Authenticator App ທຸກຄັ້ງທີ່ເຂົ້າສູ່ລະບົບ'
                            : 'Enhanced account login security via Authenticator app verification codes'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIs2FAEnabled(!is2FAEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer shrink-0 ${
                        is2FAEnabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          is2FAEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Password Change Form */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
                      <Key className="w-4 h-4 text-blue-600" />
                      <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                        {language === 'lo' ? 'ປ່ຽນລະຫັດຜ່ານບັນຊີ (Update Account Password)' : 'Update Account Password'}
                      </h4>
                    </div>

                    {/* Current Password Field */}
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                        <span>{language === 'lo' ? 'ລະຫັດຜ່ານປັດຈຸບັນ (Current Password)' : 'Current Password'}</span>
                        <span className="text-[10px] text-slate-400">Required if changing</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* New Password & Confirm Password */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 dark:text-slate-300">
                          {language === 'lo' ? 'ລະຫັດຜ່ານໃໝ່ (New Password)' : 'New Password'}
                        </label>
                        <div className="relative">
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Min 8 characters"
                            className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 dark:text-slate-300">
                          {language === 'lo' ? 'ຢືນຢັນລະຫັດຜ່ານໃໝ່ (Confirm Password)' : 'Confirm New Password'}
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Re-enter password"
                            className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Password Strength Meter & Match Status */}
                    {newPassword && (
                      <div className="space-y-2 pt-1 bg-white/70 dark:bg-slate-850 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-medium text-slate-600 dark:text-slate-400">
                            {language === 'lo' ? 'ຄວາມປອດໄພລະຫັດຜ່ານ:' : 'Password Strength:'}
                          </span>
                          <span
                            className={`font-bold ${
                              passwordStrength <= 2
                                ? 'text-amber-500'
                                : passwordStrength === 3
                                ? 'text-blue-500'
                                : 'text-emerald-500'
                            }`}
                          >
                            {passwordStrength <= 1
                              ? (language === 'lo' ? 'ອ່ອນ (Weak)' : 'Weak')
                              : passwordStrength === 2
                              ? (language === 'lo' ? 'ປານກາງ (Fair)' : 'Fair')
                              : passwordStrength === 3
                              ? (language === 'lo' ? 'ດີ (Good)' : 'Good')
                              : (language === 'lo' ? 'ປອດໄພສູງ (Strong)' : 'Strong')}
                          </span>
                        </div>

                        {/* Progress bar */}
                        <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex gap-1">
                          {[1, 2, 3, 4].map((step) => (
                            <div
                              key={step}
                              className={`h-full flex-1 transition-colors ${
                                passwordStrength >= step
                                  ? passwordStrength <= 2
                                    ? 'bg-amber-500'
                                    : passwordStrength === 3
                                    ? 'bg-blue-500'
                                    : 'bg-emerald-500'
                                  : 'bg-transparent'
                              }`}
                            />
                          ))}
                        </div>

                        {/* Match Indicator */}
                        {confirmPassword && (
                          <div className="flex items-center gap-1.5 text-[11px] pt-1 font-medium">
                            {newPassword === confirmPassword ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                <span className="text-emerald-600 dark:text-emerald-400">
                                  {language === 'lo' ? 'ລະຫັດຜ່ານກົງກັນສົມບູນ' : 'Passwords match successfully'}
                                </span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                <span className="text-rose-500">
                                  {language === 'lo' ? 'ລະຫັດຜ່ານບໍ່ກົງກັນ' : 'Passwords do not match yet'}
                                </span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Active Security Session Info */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300">
                        <Laptop className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {language === 'lo' ? 'ເຊດຊັນປັດຈຸບັນ (Current Device)' : 'Current Active Device'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Chrome on Web • IP: 10.128.0.45 • Vientiane, Laos
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                      Active Now
                    </span>
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[11px] text-slate-400">
                  {language === 'lo' ? '* ກວດສອບຄວາມຖືກຕ້ອງກ່ອນບັນທຶກ' : '* Changes apply immediately to your session'}
                </span>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsSettingsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold cursor-pointer transition-colors"
                  >
                    {language === 'lo' ? 'ຍົກເລີກ' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{language === 'lo' ? 'ບັນທຶກການປ່ຽນແປງ' : 'Save Changes'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in-95 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center shadow-xs">
              <LogOut className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                {language === 'lo' ? 'ຢືນຢັນການອອກຈາກລະບົບ' : 'Confirm Logout'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {language === 'lo'
                  ? `ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການອອກຈາກລະບົບບັນຊີ '${currentUser.fullName}'?`
                  : `Are you sure you want to sign out of '${currentUser.fullName}'?`}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(false)}
                className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
              >
                {language === 'lo' ? 'ຍົກເລີກ' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer"
              >
                {language === 'lo' ? 'ອອກຈາກລະບົບ' : 'Logout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
