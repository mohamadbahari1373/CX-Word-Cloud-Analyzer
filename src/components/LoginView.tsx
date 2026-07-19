import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Lock, Mail, Shield, User, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';

interface LoginViewProps {
  initialMode?: 'login' | 'register';
  onLoginSuccess: (user: { id: string; email: string; fullName: string; role: string; totpVerified: number }) => void;
  isDarkMode: boolean;
  language: 'fa' | 'en';
}

export default function LoginView({ initialMode = 'login', onLoginSuccess, isDarkMode, language }: LoginViewProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialMode);
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Status states
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setActiveTab(initialMode);
    setError('');
    setSuccess('');
  }, [initialMode]);

  const t = (fa: string, en: string) => (language === 'fa' ? fa : en);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError(t('لطفاً ایمیل و رمز عبور را وارد کنید', 'Please enter email and password'));
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t('خطایی در ورود رخ داد', 'An error occurred during login'));
        setLoading(false);
        return;
      }

      if (data.status === 'success') {
        localStorage.setItem('cx_user', JSON.stringify(data.user));
        onLoginSuccess(data.user);
      }
    } catch (err) {
      console.error(err);
      setError(t('خطا در اتصال به سرور', 'Server connection error'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      setError(t('لطفاً تمامی فیلدها را وارد کنید', 'Please fill in all fields'));
      return;
    }

    if (password.length < 4) {
      setError(t('رمز عبور باید حداقل ۴ کاراکتر باشد', 'Password must be at least 4 characters'));
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t('خطایی در ثبت نام رخ داد', 'An error occurred during registration'));
        setLoading(false);
        return;
      }

      if (data.success) {
        setSuccess(t('ثبت نام با موفقیت انجام شد! اکنون می‌توانید وارد سیستم شوید.', 'Registration completed successfully! You can now log in.'));
        // Clean fields
        setFullName('');
        setEmail('');
        setPassword('');
        // Switch to login tab
        setActiveTab('login');
      }
    } catch (err) {
      console.error(err);
      setError(t('خطا در اتصال به سرور', 'Server connection error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`w-full max-w-md rounded-2xl border p-8 shadow-xl transition-colors duration-300 ${
          isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Tab switcher */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 mb-6" style={{ direction: language === 'fa' ? 'rtl' : 'ltr' }}>
          <button
            onClick={() => {
              setActiveTab('login');
              setError('');
              setSuccess('');
            }}
            className={`flex-1 pb-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'login'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            {t('ورود به سیستم', 'Sign In')}
          </button>
          <button
            onClick={() => {
              setActiveTab('register');
              setError('');
              setSuccess('');
            }}
            className={`flex-1 pb-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'register'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            {t('ثبت نام کاربر جدید', 'New Registration')}
          </button>
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <div className="mx-auto w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-500 mb-3">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black tracking-tight">
            {activeTab === 'login'
              ? t('ورود به سیستم تحلیل‌گر', 'Sign In to Analyzer')
              : t('ایجاد حساب کاربری جدید', 'Create New Account')}
          </h2>
          <p className={`text-xs mt-1.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {activeTab === 'login'
              ? t('لطفاً اطلاعات ورود خود را وارد کنید', 'Please enter your login details')
              : t('برای دسترسی به سیستم، فرم زیر را تکمیل کنید', 'Fill out the form below to register your account')}
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-lg flex items-start gap-2 text-xs font-semibold"
            style={{ direction: language === 'fa' ? 'rtl' : 'ltr' }}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{success}</span>
          </motion.div>
        )}

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-lg flex items-start gap-2 text-xs font-semibold"
            style={{ direction: language === 'fa' ? 'rtl' : 'ltr' }}
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Form: Login */}
        {activeTab === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4" style={{ direction: language === 'fa' ? 'rtl' : 'ltr' }}>
            <div>
              <label className="block text-xs font-bold mb-1.5 text-slate-400">
                {t('آدرس ایمیل', 'Email Address')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder=""
                  className={`w-full text-xs pr-10 pl-3 py-2.5 rounded-lg focus:border-indigo-500 outline-none transition-all font-medium ${
                    isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                  style={{ direction: 'ltr' }}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1.5 text-slate-400">
                {t('رمز عبور', 'Password')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder=""
                  className={`w-full text-xs pr-10 pl-10 py-2.5 rounded-lg focus:border-indigo-500 outline-none transition-all font-medium ${
                    isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                  style={{ direction: 'ltr' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-lg text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-600/10"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span>{t('ورود به حساب کاربری', 'Sign In')}</span>
              )}
            </button>
          </form>
        ) : (
          /* Form: Register */
          <form onSubmit={handleRegister} className="space-y-4" style={{ direction: language === 'fa' ? 'rtl' : 'ltr' }}>
            <div>
              <label className="block text-xs font-bold mb-1.5 text-slate-400">
                {t('نام و نام خانوادگی', 'Full Name')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder=""
                  className={`w-full text-xs pr-10 pl-3 py-2.5 rounded-lg focus:border-indigo-500 outline-none transition-all font-medium ${
                    isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1.5 text-slate-400">
                {t('آدرس ایمیل', 'Email Address')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder=""
                  className={`w-full text-xs pr-10 pl-3 py-2.5 rounded-lg focus:border-indigo-500 outline-none transition-all font-medium ${
                    isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                  style={{ direction: 'ltr' }}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1.5 text-slate-400">
                {t('رمز عبور (حداقل ۴ کاراکتر)', 'Password (min 4 characters)')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder=""
                  className={`w-full text-xs pr-10 pl-10 py-2.5 rounded-lg focus:border-indigo-500 outline-none transition-all font-medium ${
                    isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                  style={{ direction: 'ltr' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-lg text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-600/10"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span>{t('تکمیل ثبت نام', 'Complete Registration')}</span>
              )}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
