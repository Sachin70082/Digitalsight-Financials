import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Settings as SettingsIcon, Save, User, Shield, Globe, Bell, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [currency, setCurrency] = useState(user?.currency || 'USD');
  const [message, setMessage] = useState('');

  const handleSave = async () => {
    await fetch('/api/client/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currency }),
    });
    await refreshUser();
    setMessage('Settings updated successfully');
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 py-6">
      <div className="mb-10">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Account Settings</h2>
        <p className="text-slate-500 mt-2 text-base font-medium">Manage your personal preferences and security settings.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white p-8 rounded-none shadow-sm border border-slate-200 text-center">
            <div className="relative inline-block mb-6">
              <div className="w-24 h-24 bg-brand-50 rounded-none flex items-center justify-center text-3xl font-extrabold text-brand-600 border-4 border-white shadow-sm">
                {user?.name.charAt(0)}
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-none border-4 border-white flex items-center justify-center">
                <Shield size={14} className="text-white" />
              </div>
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">{user?.name}</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">@{user?.username}</p>
            <div className="mt-6 pt-6 border-t border-slate-100 flex justify-center gap-6">
              <div className="text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Role</p>
                <p className="text-xs font-bold text-slate-700 capitalize">{user?.role}</p>
              </div>
              <div className="w-[1px] h-8 bg-slate-200"></div>
              <div className="text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p>
                <p className="text-xs font-bold text-emerald-500">Verified</p>
              </div>
            </div>
          </div>

          <nav className="bg-white p-3 rounded-none shadow-sm border border-slate-200 space-y-2">
            <button className="w-full flex items-center gap-4 px-4 py-3 rounded-none bg-brand-50 text-brand-600 font-bold text-sm transition-all">
              <User size={18} /> Profile Details
            </button>
            <button className="w-full flex items-center gap-4 px-4 py-3 rounded-none text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-bold text-sm transition-all">
              <Globe size={18} /> Regional Settings
            </button>
            <button className="w-full flex items-center gap-4 px-4 py-3 rounded-none text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-bold text-sm transition-all">
              <Bell size={18} /> Notifications
            </button>
          </nav>
        </div>

        <div className="lg:col-span-8 space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-10 rounded-none shadow-sm border border-slate-200"
          >
            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
              <div className="w-10 h-10 bg-slate-50 rounded-none flex items-center justify-center text-slate-500">
                <Globe size={20} />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">Regional Preferences</h3>
                <p className="text-sm text-slate-500 mt-1">Customize how financial data is displayed.</p>
              </div>
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Display Currency</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => setCurrency('USD')}
                    className={`px-6 py-5 rounded-none border-2 text-sm font-extrabold transition-all flex flex-col items-center gap-2 ${
                      currency === 'USD' 
                        ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/10' 
                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-2xl">$</span>
                    US Dollar (USD)
                  </button>
                  <button
                    onClick={() => setCurrency('INR')}
                    className={`px-6 py-5 rounded-none border-2 text-sm font-extrabold transition-all flex flex-col items-center gap-2 ${
                      currency === 'INR' 
                        ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/10' 
                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-2xl">₹</span>
                    Indian Rupee (INR)
                  </button>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-3">
                  Changing your currency will update all financial displays across your dashboard immediately.
                </p>
              </div>

              {message && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-emerald-700 text-sm font-bold bg-emerald-50 p-4 rounded-none border border-emerald-200 flex items-center gap-3"
                >
                  <CheckCircle size={18} className="text-emerald-600" />
                  {message}
                </motion.div>
              )}

              <div className="pt-6 border-t border-slate-100">
                <button
                  onClick={handleSave}
                  className="w-full sm:w-auto px-8 bg-brand-500 text-white font-bold py-3.5 rounded-none hover:bg-brand-600 transition-all shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 modern-button"
                >
                  <Save size={18} />
                  Apply Settings
                </button>
              </div>
            </div>
          </motion.div>

          <div className="bg-slate-900 p-10 rounded-none shadow-xl shadow-slate-900/20 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 transform translate-x-4 -translate-y-4">
              <Shield size={120} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <Shield size={24} className="text-brand-400" />
                <h3 className="text-xl font-extrabold">Security & Privacy</h3>
              </div>
              <p className="text-slate-400 text-sm font-medium mb-8 max-w-md leading-relaxed">
                Your account is protected with enterprise-grade encryption. We monitor for suspicious activity 24/7.
              </p>
              <button className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-none text-sm font-bold transition-all backdrop-blur-md border border-white/10 flex items-center gap-2">
                <SettingsIcon size={16} />
                Manage Security Keys
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

