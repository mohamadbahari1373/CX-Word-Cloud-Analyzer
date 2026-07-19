import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  UserPlus, Mail, Shield, Key, Trash2, Edit2, Check, X, AlertCircle, 
  UserCheck, User, RefreshCw
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  fullName?: string;
  password?: string;
  role: string;
}

interface UserManagementProps {
  currentUser: { id: string; email: string; role: string; totpVerified: number } | null;
  isDarkMode: boolean;
  language: 'fa' | 'en';
}

export default function UserManagement({ currentUser, isDarkMode, language }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Add User Form State
  const [newEmail, setNewEmail] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newPassword, setNewPassword] = useState('123456');
  const [newRole, setNewRole] = useState('user');
  const [isAdding, setIsAdding] = useState(false);

  // Edit User State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingEmail, setEditingEmail] = useState('');
  const [editingFullName, setEditingFullName] = useState('');

  const t = (fa: string, en: string) => (language === 'fa' ? fa : en);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      } else {
        setError(t('خطا در دریافت لیست کاربران', 'Failed to fetch users'));
      }
    } catch (err) {
      console.error(err);
      setError(t('خطا در اتصال به سرور', 'Server connection error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      fetchUsers();
    }
  }, [currentUser]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newFullName.trim()) return;

    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: newEmail.trim(),
          fullName: newFullName.trim(),
          password: newPassword || '123456',
          role: newRole
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(t(`کاربر جدید با موفقیت اضافه شد. رمز عبور پیش‌فرض: ${newPassword || '123456'}`, `User added successfully. Default password: ${newPassword || '123456'}`));
        setNewEmail('');
        setNewFullName('');
        setNewPassword('123456');
        setNewRole('user');
        setIsAdding(false);
        fetchUsers();
      } else {
        setError(data.error || t('خطا در ثبت کاربر', 'Failed to register user'));
      }
    } catch (err) {
      console.error(err);
      setError(t('خطا در اتصال به سرور', 'Server connection error'));
    }
  };

  const handleSaveEdit = async (id: string) => {
    if (!editingEmail.trim() || !editingFullName.trim()) return;

    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/admin/users/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id, 
          email: editingEmail.trim(),
          fullName: editingFullName.trim()
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(t('اطلاعات کاربر با موفقیت ویرایش شد', 'User details updated successfully'));
        setEditingId(null);
        fetchUsers();
      } else {
        setError(data.error || t('خطا در ویرایش اطلاعات', 'Failed to update user details'));
      }
    } catch (err) {
      console.error(err);
      setError(t('خطا در اتصال به سرور', 'Server connection error'));
    }
  };

  const handleResetPassword = async (id: string, userEmail: string) => {
    if (!window.confirm(t(`آیا از ریست کردن پسورد کاربر ${userEmail} به ۱۲۳۴۵۶ اطمینان دارید؟`, `Are you sure you want to reset password for ${userEmail} to 123456?`))) return;

    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/admin/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        setSuccess(t(`رمز عبور کاربر ${userEmail} با موفقیت به ۱۲۳۴۵۶ ریست شد`, `Password for ${userEmail} reset to 123456 successfully`));
        fetchUsers();
      } else {
        setError(t('خطا در ریست پسورد', 'Failed to reset password'));
      }
    } catch (err) {
      console.error(err);
      setError(t('خطا در اتصال به سرور', 'Server connection error'));
    }
  };

  const handleDeleteUser = async (id: string, userEmail: string) => {
    if (userEmail === currentUser?.email) {
      alert(t('شما نمی‌توانید حساب کاربری فعال خود را حذف کنید!', 'You cannot delete your own active account!'));
      return;
    }

    if (!window.confirm(t(`آیا از حذف کامل کاربر ${userEmail} اطمینان دارید؟`, `Are you sure you want to permanently delete user ${userEmail}?`))) return;

    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/admin/users/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(t('کاربر با موفقیت حذف شد', 'User deleted successfully'));
        fetchUsers();
      } else {
        setError(data.error || t('خطا در حذف کاربر', 'Failed to delete user'));
      }
    } catch (err) {
      console.error(err);
      setError(t('خطا در اتصال به سرور', 'Server connection error'));
    }
  };

  if (currentUser?.role !== 'admin') {
    return (
      <div className="p-4 text-center text-xs font-semibold text-rose-500">
        {t('خطا: دسترسی به این بخش فقط مخصوص مدیر سیستم می‌باشد.', 'Error: Access is restricted to System Administrators only.')}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 text-right" style={{ direction: language === 'fa' ? 'rtl' : 'ltr' }}>
      
      {/* Title & Action */}
      <div className="flex items-center justify-between pb-3 mb-1 border-b border-dashed dark:border-slate-800 border-slate-100">
        <h3 className={`text-xs font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
          {t('مدیریت کاربران و سطوح دسترسی', 'Users & Permissions Management')}
        </h3>
        
        <button
          onClick={() => setIsAdding(!isAdding)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            isAdding 
              ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20' 
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
          }`}
        >
          {isAdding ? <X className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
          <span>{isAdding ? t('انصراف', 'Cancel') : t('افزودن کاربر', 'Add User')}</span>
        </button>
      </div>

      {/* Alert System */}
      {error && (
        <div className="p-2.5 text-xs font-semibold rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-start gap-1.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-2.5 text-xs font-semibold rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-start gap-1.5">
          <Check className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {/* Slide-down Add User form */}
      <AnimatePresence>
        {isAdding && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAddUser}
            className={`p-4 rounded-xl border flex flex-col gap-3 transition-colors ${
              isDarkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-150'
            }`}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">
                  {t('نام و نام خانوادگی', 'Full Name')}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    placeholder={t('نام کاربر', 'User full name')}
                    className={`w-full text-xs pr-9 pl-3 py-2 rounded-lg focus:border-indigo-500 outline-none transition-all font-medium ${
                      isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">
                  {t('آدرس ایمیل کاربر', 'User Email Address')}
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="user@wallex.net"
                    className={`w-full text-xs pr-9 pl-3 py-2 rounded-lg focus:border-indigo-500 outline-none transition-all font-medium ${
                      isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
                    }`}
                    style={{ direction: 'ltr' }}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">
                  {t('رمز عبور', 'Password')}
                </label>
                <input
                  type="text"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`w-full text-xs px-3 py-2 rounded-lg focus:border-indigo-500 outline-none transition-all font-medium ${
                    isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
                  }`}
                  style={{ direction: 'ltr' }}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">
                  {t('سطح دسترسی', 'Permission Role')}
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className={`w-full text-xs px-3 py-2 rounded-lg focus:border-indigo-500 outline-none transition-all font-medium ${
                    isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
                  }`}
                >
                  <option value="user">{t('کاربر عادی (کارشناس بهبود تجربه)', 'Regular User (Analyst)')}</option>
                  <option value="admin">{t('مدیر سیستم (دسترسی کامل)', 'System Admin')}</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{t('ثبت و اضافه کردن کاربر', 'Create User Account')}</span>
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Users List Container */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-6 text-slate-400 text-xs gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-indigo-500" />
          <span>{t('در حال دریافت اطلاعات کاربران...', 'Fetching users database...')}</span>
        </div>
      ) : users.length === 0 ? (
        <div className="p-6 text-center text-xs text-slate-400">
          {t('هیچ کاربری در سیستم ثبت نشده است.', 'No registered users in system.')}
        </div>
      ) : (
        <div className="flex flex-col gap-3.5 max-h-[450px] overflow-y-auto pr-0.5">
          {users.map((user) => {
            const isEditing = editingId === user.id;
            const isUserAdmin = user.role === 'admin';

            return (
              <div
                key={user.id}
                className={`p-3.5 rounded-xl border flex flex-col gap-2.5 transition-all ${
                  isDarkMode 
                    ? 'bg-slate-950/20 border-slate-800/80 hover:bg-slate-950/40' 
                    : 'bg-slate-50/50 border-slate-150 hover:bg-slate-50'
                }`}
              >
                {/* User Row Header: Role, Email, Edit & Delete */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {/* Role Tag */}
                    <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold ${
                      isUserAdmin
                        ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20'
                        : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                    }`}>
                      {isUserAdmin ? t('مدیر', 'Admin') : t('کاربر', 'User')}
                    </span>

                    {/* Full Name & Email / Inputs when Editing */}
                    {isEditing ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editingFullName}
                          onChange={(e) => setEditingFullName(e.target.value)}
                          placeholder={t('نام کامل', 'Full Name')}
                          className={`text-xs font-bold px-2 py-1 rounded border outline-none focus:border-indigo-500 ${
                            isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
                          }`}
                        />
                        <input
                          type="email"
                          value={editingEmail}
                          onChange={(e) => setEditingEmail(e.target.value)}
                          placeholder={t('ایمیل', 'Email')}
                          className={`text-xs font-bold px-2 py-1 rounded border outline-none focus:border-indigo-500 font-mono ${
                            isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
                          }`}
                          style={{ direction: 'ltr' }}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                          {user.fullName || t('بدون نام', 'No Name')}
                        </span>
                        <span className={`text-xs text-slate-400 font-mono`} style={{ direction: 'ltr' }}>
                          ({user.email})
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions (Email edit, Delete User) */}
                  <div className="flex items-center gap-1 shrink-0">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => handleSaveEdit(user.id)}
                          className="p-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
                          title={t('ذخیره', 'Save')}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className={`p-1 rounded cursor-pointer ${
                            isDarkMode ? 'bg-slate-900 hover:bg-slate-800 text-slate-400' : 'bg-slate-200 hover:bg-slate-300 text-slate-600'
                          }`}
                          title={t('انصراف', 'Cancel')}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditingId(user.id);
                            setEditingEmail(user.email);
                            setEditingFullName(user.fullName || '');
                          }}
                          className={`p-1 rounded cursor-pointer transition-colors ${
                            isDarkMode ? 'hover:bg-slate-850 text-slate-400 hover:text-slate-200' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-800'
                          }`}
                          title={t('ویرایش اطلاعات', 'Edit Details')}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id, user.email)}
                          disabled={user.email === currentUser?.email}
                          className={`p-1 rounded cursor-pointer transition-colors ${
                            user.email === currentUser?.email
                              ? 'opacity-40 cursor-not-allowed'
                              : 'hover:bg-rose-500/10 text-rose-400 hover:text-rose-500'
                          }`}
                          title={t('حذف کاربر', 'Delete User')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* User Row Footer: Status & Password Reset */}
                <div className={`pt-2 border-t flex flex-row items-center justify-between gap-2 text-[10px] ${
                  isDarkMode ? 'border-slate-800/50' : 'border-slate-150'
                }`}>
                  <span className="flex items-center gap-1 text-emerald-500 font-semibold">
                    <UserCheck className="w-3.5 h-3.5" />
                    {t('حساب فعال', 'Active Account')}
                  </span>

                  <button
                    onClick={() => handleResetPassword(user.id, user.email)}
                    className={`px-2 py-1 rounded border font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                      isDarkMode 
                        ? 'border-slate-800 bg-slate-900/60 hover:bg-slate-900 text-slate-300' 
                        : 'border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                    title={t('ریست پسورد به ۱۲۳۴۵۶', 'Reset Password to 123456')}
                  >
                    <Key className="w-3 h-3 text-amber-500" />
                    <span>{t('ریست پسورد به ۱۲۳۴۵۶', 'Reset Password to 123456')}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
