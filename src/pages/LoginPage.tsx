import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { alerts } from '../utils/alerts.ts';
import {
  ShieldCheck,
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  Building2,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Globe,
  Sun,
  Moon,
  Laptop,
  Mail,
  Send,
  Check,
  Copy,
  ExternalLink,
  X,
  RefreshCw,
  BadgeCheck,
  ArrowLeft,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const {
    language,
    setLanguage,
    theme,
    setTheme,
    login,
    availableUsers,
    employees,
    departments,
    addAuditLog,
    updateUser,
  } = useApp();

  // Login form state
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123456');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Forgot Password modal state
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStep, setResetStep] = useState<'INPUT_EMAIL' | 'LINK_SENT' | 'ENTER_NEW_PASSWORD'>('INPUT_EMAIL');
  const [isResetSubmitting, setIsResetSubmitting] = useState(false);
  const [resetError, setResetError] = useState('');
  const [generatedResetLink, setGeneratedResetLink] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // New password state for reset flow
  const [newResetPassword, setNewResetPassword] = useState('');
  const [confirmResetPassword, setConfirmResetPassword] = useState('');
  const [showNewResetPassword, setShowNewResetPassword] = useState(false);
  const [showConfirmResetPassword, setShowConfirmResetPassword] = useState(false);

  // Check matching user or employee for the entered email in real-time
  const matchedUser = useMemo(() => {
    const clean = resetEmail.trim().toLowerCase();
    if (!clean || !clean.includes('@')) return null;
    return availableUsers.find((u) => u.email.toLowerCase() === clean) || null;
  }, [resetEmail, availableUsers]);

  const matchedEmployee = useMemo(() => {
    const clean = resetEmail.trim().toLowerCase();
    if (!clean || !clean.includes('@')) return null;
    return employees.find((e) => e.email?.toLowerCase() === clean) || null;
  }, [resetEmail, employees]);

  const matchedDept = useMemo(() => {
    const deptId = matchedUser?.departmentId || matchedEmployee?.departmentId;
    return departments.find((d) => d.id === deptId) || null;
  }, [matchedUser, matchedEmployee, departments]);

  // Quick preset autofill for login
  const handleAutofill = (userVal: string, passVal: string) => {
    setUsername(userVal);
    setPassword(passVal);
    setErrorMessage('');
  };

  // Login submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!username.trim() || !password.trim()) {
      setErrorMessage(
        language === 'lo'
          ? 'ກະລຸນາປ້ອນຊື່ຜູ້ໃຊ້ ແລະ ລະຫັດຜ່ານ'
          : 'Please enter both username and password'
      );
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const result = login(username, password);
      setIsLoading(false);

      if (!result.success) {
        setErrorMessage(
          result.error ||
            (language === 'lo'
              ? 'ຊື່ຜູ້ໃຊ້ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ'
              : 'Invalid username or password')
        );
        alerts.error(
          language === 'lo' ? 'ເຂົ້າສູ່ລະບົບບໍ່ສຳເລັດ' : 'Login Failed',
          result.error
        );
      } else {
        alerts.success(
          language === 'lo' ? 'ເຂົ້າສູ່ລະບົບສຳເລັດ' : 'Login Successful',
          language === 'lo' ? 'ຍິນດີຕ້ອນຮັບສູ່ລະບົບ LHSE HRMS' : 'Welcome to LHSE HRMS'
        );
      }
    }, 350);
  };

  // Forgot password request link handler
  const handleRequestResetLink = (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');

    const clean = resetEmail.trim().toLowerCase();
    if (!clean) {
      setResetError(
        language === 'lo'
          ? 'ກະລຸນາປ້ອນອີເມວທີ່ລົງທະບຽນກັບ HR'
          : 'Please enter your registered HR email address'
      );
      return;
    }

    if (!matchedUser && !matchedEmployee) {
      setResetError(
        language === 'lo'
          ? 'ບໍ່ພົບອີເມວນີ້ໃນຖານຂໍ້ມູນພະນັກງານ LHSE. ກະລຸນາກວດສອບຄວາມຖືກຕ້ອງ ຫຼື ຕິດຕໍ່ພະແນກ HR.'
          : 'This email is not registered in the LHSE HR directory. Please verify or contact HR.'
      );
      return;
    }

    setIsResetSubmitting(true);

    setTimeout(() => {
      setIsResetSubmitting(false);

      const token = `lhse_rst_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
      const link = `https://hrms.laoholding.gov.la/reset-password?token=${token}&email=${encodeURIComponent(clean)}`;
      setGeneratedResetLink(link);

      // Log security event in audit trail
      addAuditLog(
        'PASSWORD_RESET_REQUEST',
        'SYSTEM',
        'Authentication',
        `Password reset link requested for registered email: ${clean} (${matchedUser?.fullName || matchedEmployee?.firstNameEn || 'Staff'})`,
        {
          entityType: 'USER_ACCOUNT',
          entityName: clean,
          recordId: matchedUser?.id || matchedEmployee?.id,
        }
      );

      alerts.success(
        language === 'lo' ? 'ສົ່ງລິ້ງຣີເຊັດສຳເລັດ' : 'Reset Link Dispatched',
        language === 'lo'
          ? `ລະບົບໄດ້ສົ່ງລິ້ງຣີເຊັດລະຫັດຜ່ານໄປຫາ ${clean} ແລ້ວ`
          : `Password reset link has been dispatched to ${clean}`
      );

      setResetStep('LINK_SENT');
    }, 500);
  };

  // Copy reset link to clipboard
  const handleCopyLink = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(generatedResetLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
      alerts.success(
        language === 'lo' ? 'ຄັດລອກລິ້ງແລ້ວ' : 'Link Copied',
        language === 'lo' ? 'ທ່ານສາມາດເປີດລິ້ງເພື່ອຕັ້ງລະຫັດຜ່ານໃໝ່' : 'Reset link copied to clipboard'
      );
    }
  };

  // Set new password submit handler
  const handleSaveNewPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResetPassword.trim() || newResetPassword.length < 8) {
      alerts.error(
        language === 'lo'
          ? 'ລະຫັດຜ່ານໃໝ່ຕ້ອງມີຢ່າງໜ້ອຍ 8 ຕົວອັກສອນ'
          : 'Password must be at least 8 characters long'
      );
      return;
    }

    if (newResetPassword !== confirmResetPassword) {
      alerts.error(
        language === 'lo'
          ? 'ລະຫັດຜ່ານ ແລະ ການຢືນຢັນລະຫັດຜ່ານບໍ່ກົງກັນ'
          : 'Passwords do not match'
      );
      return;
    }

    // Update user password in state
    if (matchedUser) {
      updateUser(matchedUser.id, {
        password: newResetPassword.trim(),
      });
    }

    // Audit log
    addAuditLog(
      'PASSWORD_CHANGE',
      'UPDATE',
      'Authentication',
      `Password successfully reset via email verification link for: ${resetEmail}`,
      {
        entityType: 'USER_ACCOUNT',
        entityName: resetEmail,
        recordId: matchedUser?.id,
      }
    );

    alerts.success(
      language === 'lo' ? 'ຕັ້ງລະຫັດຜ່ານໃໝ່ສຳເລັດ' : 'Password Reset Completed',
      language === 'lo'
        ? 'ລະຫັດຜ່ານຂອງທ່ານໄດ້ຮັບການປ່ຽນແປງຮຽບຮ້ອຍແລ້ວ ທ່ານສາມາດເຂົ້າສູ່ລະບົບໄດ້ທັນທີ'
        : 'Your password has been reset. You may now sign in with your new credentials.'
    );

    // Pre-fill login credentials and close modal
    if (matchedUser) {
      setUsername(matchedUser.username);
    }
    setPassword(newResetPassword);
    setIsForgotPasswordOpen(false);
    setResetStep('INPUT_EMAIL');
    setResetEmail('');
    setNewResetPassword('');
    setConfirmResetPassword('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden select-none">
      {/* Dynamic Background Blur Accents */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar with Language & Theme Switchers */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white p-0.5 border border-white/20 shadow-md shrink-0 flex items-center justify-center">
            <img
              src="/assets/aistudio/______________________95dd5853.png"
              alt="LHSE Official Logo"
              className="w-full h-full object-contain rounded-full"
            />
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="font-bold text-xs text-white tracking-tight">
              ລັດວິສາຫະກິດຖືຮຸ້ນລາວ (LHSE)
            </span>
            <span className="text-[10px] text-blue-200/80 font-medium">
              {language === 'lo' ? 'ກະຊວງອຸດສາກະກຳ ແລະ ການຄ້າ' : 'Ministry of Industry and Commerce'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <button
            onClick={() => setLanguage(language === 'lo' ? 'en' : 'lo')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold text-white transition-all cursor-pointer shadow-xs"
            title="Switch Language"
          >
            <Globe className="w-3.5 h-3.5 text-blue-300" />
            <span>{language === 'lo' ? 'EN 🇬🇧' : 'ລາວ 🇱🇦'}</span>
          </button>

          {/* Theme Switcher */}
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white transition-all cursor-pointer shadow-xs"
            title="Toggle Theme"
          >
            {theme === 'light' ? (
              <Moon className="w-3.5 h-3.5 text-blue-300" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            )}
          </button>
        </div>
      </header>

      {/* Main Login Card Container */}
      <main className="relative z-10 w-full max-w-md mx-auto px-4 py-8 flex flex-col items-center">
        <div className="w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 text-slate-800 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-200">
          {/* Logo & Headline */}
          <div className="text-center space-y-3 mb-6">
            <div className="w-20 h-20 rounded-full bg-white p-1 mx-auto shadow-lg border-2 border-blue-500/30 flex items-center justify-center">
              <img
                src="/assets/aistudio/______________________95dd5853.png"
                alt="LHSE Official Logo"
                className="w-full h-full object-contain rounded-full"
              />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 mb-1.5">
                <ShieldCheck className="w-3 h-3" />
                <span>OFFICIAL PORTAL</span>
              </div>
              <h2 className="font-black text-lg sm:text-xl text-slate-900 dark:text-slate-100 tracking-tight">
                {language === 'lo' ? 'ເຂົ້າສູ່ລະບົບ LHSE HRMS' : 'Sign in to LHSE HRMS'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'lo'
                  ? 'ລະບົບຄຸ້ມຄອງບຸກຄະລາກອນ ລັດວິສາຫະກິດຖືຮຸ້ນລາວ'
                  : 'Lao Holding State Enterprise Workforce Platform'}
              </p>
            </div>
          </div>

          {/* User Requested Credentials Hint Box */}
          <div className="mb-5 p-3.5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-xs">
            <div className="flex items-center justify-between font-bold text-blue-900 dark:text-blue-200 mb-1.5">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>{language === 'lo' ? 'ຂໍ້ມູນເຂົ້າລະບົບ (Default Login):' : 'System Credentials:'}</span>
              </span>
              <button
                type="button"
                onClick={() => handleAutofill('admin', 'admin123456')}
                className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800 shadow-2xs"
              >
                {language === 'lo' ? 'ໃສ່ຂໍ້ມູນອັດຕະໂນມັດ' : 'Autofill'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-700 dark:text-slate-300">
              <div className="bg-white/80 dark:bg-slate-800/80 p-1.5 rounded-xl border border-blue-100 dark:border-blue-900/40">
                <span className="text-slate-400 text-[10px] block font-sans">Username:</span>
                <strong className="text-blue-600 dark:text-blue-400">admin</strong>
              </div>
              <div className="bg-white/80 dark:bg-slate-800/80 p-1.5 rounded-xl border border-blue-100 dark:border-blue-900/40">
                <span className="text-slate-400 text-[10px] block font-sans">Password:</span>
                <strong className="text-blue-600 dark:text-blue-400">admin123456</strong>
              </div>
            </div>
          </div>

          {/* Error Message Box */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Input */}
            <div className="space-y-1.5">
              <label className="font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>{language === 'lo' ? 'ຊື່ຜູ້ໃຊ້ງານ (Username) *' : 'Username *'}</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setErrorMessage('');
                  }}
                  placeholder="admin"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-900 dark:text-slate-100 outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-blue-600" />
                  <span>{language === 'lo' ? 'ລະຫັດຜ່ານ (Password) *' : 'Password *'}</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">
                  admin123456
                </span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMessage('');
                  }}
                  placeholder="admin123456"
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-900 dark:text-slate-100 outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password Trigger */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600"
                />
                <span className="text-[11px]">{language === 'lo' ? 'ຈື່ຂ້ອຍໄວ້ໃນອຸປະກອນນີ້' : 'Remember me'}</span>
              </label>

              {/* Dedicated Forgot Password Trigger */}
              <button
                type="button"
                onClick={() => {
                  setIsForgotPasswordOpen(true);
                  setResetStep('INPUT_EMAIL');
                  setResetError('');
                  if (username === 'admin') {
                    setResetEmail('admin.hr@laoholding.gov.la');
                  }
                }}
                className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline cursor-pointer flex items-center gap-1 transition-colors"
              >
                <KeyRound className="w-3 h-3" />
                <span>{language === 'lo' ? 'ລືມລະຫັດຜ່ານ?' : 'Forgot password?'}</span>
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer group disabled:opacity-70"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{language === 'lo' ? 'ເຂົ້າສູ່ລະບົບ (Sign In)' : 'Sign In to LHSE'}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Quick Persona Logins for Evaluation */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center">
            <span className="text-[11px] font-bold text-slate-400 block mb-2.5">
              {language === 'lo' ? 'ຫຼື ທົດລອງເຂົ້າສູ່ລະບົບຕາມບົດບາດ:' : 'Or simulate role persona:'}
            </span>

            <div className="grid grid-cols-3 gap-1.5 text-[10px]">
              <button
                type="button"
                onClick={() => handleAutofill('admin', 'admin123456')}
                className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-blue-500 font-semibold cursor-pointer truncate"
                title="Super Administrator"
              >
                🛡️ Admin
              </button>
              <button
                type="button"
                onClick={() => handleAutofill('hradmin', 'admin123456')}
                className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-emerald-500 font-semibold cursor-pointer truncate"
                title="HR Administrator"
              >
                💼 HR Admin
              </button>
              <button
                type="button"
                onClick={() => handleAutofill('executive', 'admin123456')}
                className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-purple-500 font-semibold cursor-pointer truncate"
                title="CEO / Executive"
              >
                🏛️ Executive
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* FORGOT PASSWORD MODAL */}
      {isForgotPasswordOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 my-auto text-slate-800 dark:text-slate-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-blue-300 flex items-center justify-center shadow-inner">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base">
                    {language === 'lo' ? 'ຣີເຊັດລະຫັດຜ່ານ (Reset Password)' : 'Reset Your Password'}
                  </h3>
                  <p className="text-[11px] text-blue-200/80">
                    {language === 'lo'
                      ? 'ຮ້ອງຂໍລິ້ງຣີເຊັດຜ່ານອີເມວທາງການທີ່ລົງທະບຽນກັບ HR'
                      : 'Request a reset link via your registered official HR email'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsForgotPasswordOpen(false);
                  setResetStep('INPUT_EMAIL');
                }}
                className="p-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* STEP 1: INPUT REGISTERED HR EMAIL */}
            {resetStep === 'INPUT_EMAIL' && (
              <form onSubmit={handleRequestResetLink} className="p-5 sm:p-6 space-y-4 text-xs">
                <div className="space-y-1.5">
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-xs">
                    {language === 'lo'
                      ? 'ກະລຸນາປ້ອນທີ່ຢູ່ອີເມວທາງການທີ່ທ່ານໄດ້ລົງທະບຽນໄວ້ກັບພະແນກບຸກຄະລາກອນ (HR). ລະບົບຈະກວດສອບ ແລະ ສົ່ງລິ້ງຣີເຊັດລະຫັດຜ່ານທີ່ມີຄວາມປອດໄພໄປຫາອີເມວດັ່ງກ່າວ.'
                      : 'Enter the official email address registered with LHSE Human Resources. A secure single-use password reset link will be dispatched to your inbox.'}
                  </p>
                </div>

                {/* Email Input Field */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-blue-600" />
                      <span>{language === 'lo' ? 'ອີເມວທາງການ HR (Registered Email) *' : 'Registered HR Email *'}</span>
                    </span>
                    <span className="text-[10px] text-slate-400">@laoholding.gov.la</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => {
                        setResetEmail(e.target.value);
                        setResetError('');
                      }}
                      placeholder="admin.hr@laoholding.gov.la"
                      className="w-full pl-3.5 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono outline-hidden focus:ring-2 focus:ring-blue-500"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                {/* Real-time Employee Match Indicator */}
                {(matchedUser || matchedEmployee) && (
                  <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs flex items-start gap-2.5 animate-in fade-in">
                    <BadgeCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-bold">
                        {language === 'lo' ? 'ພົບບັນຊີບຸກຄະລາກອນໃນລະບົບ HR:' : 'Verified LHSE Staff Record Found:'}
                      </div>
                      <div className="text-[11px] mt-0.5">
                        {language === 'lo'
                          ? `${matchedUser?.fullNameLao || matchedEmployee?.firstNameLao} (${matchedUser?.role ? matchedUser.role.replace('_', ' ') : 'Employee'}) • ${matchedDept ? matchedDept.nameLao : 'LHSE HQ'}`
                          : `${matchedUser?.fullName || matchedEmployee?.firstNameEn} (${matchedUser?.role || 'Employee'}) • ${matchedDept ? matchedDept.nameEn : 'LHSE HQ'}`}
                      </div>
                    </div>
                  </div>
                )}

                {/* Error Banner */}
                {resetError && (
                  <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{resetError}</span>
                  </div>
                )}

                {/* Suggested registered staff emails for quick demo testing */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">
                    {language === 'lo' ? 'ຕົວຢ່າງອີເມວທີ່ລົງທະບຽນໃນລະບົບ:' : 'Quick Select Registered Staff Emails:'}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { email: 'admin.hr@laoholding.gov.la', label: 'Admin' },
                      { email: 'keomany.v@laoholding.gov.la', label: 'HR Manager' },
                      { email: 'bounleuth.l@laoholding.gov.la', label: 'CEO' },
                      { email: 'sengdao.s@laoholding.gov.la', label: 'Finance Head' },
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setResetEmail(item.email);
                          setResetError('');
                        }}
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-semibold border transition-all cursor-pointer ${
                          resetEmail === item.email
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                        }`}
                      >
                        {item.label}: {item.email}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold cursor-pointer transition-colors"
                  >
                    {language === 'lo' ? 'ຍົກເລີກ' : 'Cancel'}
                  </button>

                  <button
                    type="submit"
                    disabled={isResetSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-500/20 disabled:opacity-70 transition-all"
                  >
                    {isResetSubmitting ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>{language === 'lo' ? 'ສົ່ງລິ້ງຣີເຊັດລະຫັດຜ່ານ' : 'Send Reset Link'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: LINK DISPATCHED CONFIRMATION SCREEN */}
            {resetStep === 'LINK_SENT' && (
              <div className="p-5 sm:p-6 space-y-4 text-xs animate-in fade-in">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-xs">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    {language === 'lo' ? 'ສົ່ງລິ້ງຣີເຊັດລະຫັດຜ່ານສຳເລັດແລ້ວ!' : 'Password Reset Link Dispatched!'}
                  </h4>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-xs max-w-sm mx-auto">
                    {language === 'lo'
                      ? `ລະບົບໄດ້ສົ່ງລິ້ງຣີເຊັດລະຫັດຜ່ານໄປຫາອີເມວທາງການ ${resetEmail} ຮຽບຮ້ອຍແລ້ວ. ກະລຸນາກວດສອບກ່ອງຈົດໝາຍຂອງທ່ານ.`
                      : `A secure single-use password reset link has been dispatched to ${resetEmail}. Please check your HR mailbox.`}
                  </p>
                </div>

                {/* Simulated Link Card */}
                <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-blue-900 dark:text-blue-300">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span>{language === 'lo' ? 'ລິ້ງຣີເຊັດລະຫັດຜ່ານ (Valid for 15 mins):' : 'Generated Security Token Link:'}</span>
                    </span>
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-200">
                      Active
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px] text-slate-700 dark:text-slate-300 break-all select-all flex items-center justify-between gap-2">
                    <span className="truncate">{generatedResetLink}</span>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="p-1 rounded-md text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 shrink-0 cursor-pointer"
                      title="Copy Link"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="pt-1 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">
                      {language === 'lo' ? 'ທົດລອງຕັ້ງລະຫັດຜ່ານໃໝ່ທັນທີ:' : 'Directly test reset flow:'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setResetStep('ENTER_NEW_PASSWORD')}
                      className="px-3 py-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                    >
                      <span>{language === 'lo' ? 'ຕັ້ງລະຫັດໃໝ່ດຽວນີ້' : 'Set New Password Now'}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setResetStep('INPUT_EMAIL');
                      setResetError('');
                    }}
                    className="text-slate-500 hover:text-slate-700 text-xs font-semibold cursor-pointer flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    <span>{language === 'lo' ? 'ປ່ຽນອີເມວ' : 'Different Email'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPasswordOpen(false);
                      setResetStep('INPUT_EMAIL');
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold cursor-pointer transition-colors"
                  >
                    {language === 'lo' ? 'ກັບໄປໜ້າເຂົ້າສູ່ລະບົບ' : 'Back to Login'}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: SET NEW PASSWORD FORM */}
            {resetStep === 'ENTER_NEW_PASSWORD' && (
              <form onSubmit={handleSaveNewPassword} className="p-5 sm:p-6 space-y-4 text-xs animate-in fade-in">
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {language === 'lo' ? 'ກຳນົດລະຫັດຜ່ານໃໝ່ (Create New Password)' : 'Create New Password'}
                  </h4>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                    {language === 'lo'
                      ? `ສຳລັບບັນຊີ: ${resetEmail}`
                      : `For account: ${resetEmail}`}
                  </p>
                </div>

                {/* New Password Input */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    {language === 'lo' ? 'ລະຫັດຜ່ານໃໝ່ (New Password) *' : 'New Password *'}
                  </label>
                  <div className="relative">
                    <input
                      type={showNewResetPassword ? 'text' : 'password'}
                      value={newResetPassword}
                      onChange={(e) => setNewResetPassword(e.target.value)}
                      placeholder="Min 8 characters"
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono outline-hidden focus:ring-2 focus:ring-blue-500"
                      required
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewResetPassword(!showNewResetPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showNewResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password Input */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    {language === 'lo' ? 'ຢືນຢັນລະຫັດຜ່ານໃໝ່ (Confirm New Password) *' : 'Confirm New Password *'}
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmResetPassword ? 'text' : 'password'}
                      value={confirmResetPassword}
                      onChange={(e) => setConfirmResetPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono outline-hidden focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmResetPassword(!showConfirmResetPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showConfirmResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Match indicator */}
                {confirmResetPassword && (
                  <div className="flex items-center gap-1.5 text-[11px] font-medium">
                    {newResetPassword === confirmResetPassword && newResetPassword.length >= 8 ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="text-emerald-600 dark:text-emerald-400">
                          {language === 'lo' ? 'ລະຫັດຜ່ານກົງກັນ ແລະ ຖືກຕ້ອງ' : 'Passwords match successfully'}
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span className="text-rose-500">
                          {language === 'lo' ? 'ລະຫັດຜ່ານບໍ່ກົງກັນ ຫຼື ສັ້ນເກີນໄປ (ຢ່າງໜ້ອຍ 8 ຕົວອັກສອນ)' : 'Passwords do not match or are too short (min 8 chars)'}
                        </span>
                      </>
                    )}
                  </div>
                )}

                {/* Footer Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setResetStep('LINK_SENT')}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
                  >
                    {language === 'lo' ? 'ຍ້ອນກັບ' : 'Back'}
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/20 transition-all"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{language === 'lo' ? 'ບັນທຶກລະຫັດຜ່ານໃໝ່' : 'Save New Password'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 w-full py-4 text-center text-[11px] text-blue-200/60 border-t border-white/5 space-y-1">
        <p>
          © 2026 Lao Holding State Enterprise (LHSE) • Ministry of Industry and Commerce
        </p>
        <p className="text-[10px] text-blue-300/40">
          Protected by Enterprise Role-Based Access Control (RBAC) & Two-Factor Security Protocol
        </p>
      </footer>
    </div>
  );
};
