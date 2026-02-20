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
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Account Settings</h2>
        <p className="text-slate-500 mt-1 text-sm font-medium">Manage your personal preferences and security settings.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center">
            <div className="relative inline-block mb-4">
              <div className="w-20 h-20 bg-brand-50 rounded-2xl flex items-center justify-center text-2xl font-extrabold text-brand-600 border-2 border-white shadow-sm">
                {user?.name.charAt(0)}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                <Shield size={12} className="text-white" />
              </div>
            </div>
            <h3 className="text-lg font-extrabold text-slate-900">{user?.name}</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">@{user?.username}</p>
            <div className="mt-4 pt-4 border-t border-slate-50 flex justify-center gap-4">
              <div className="text-center">
                <p className="text-[9px] font-bold text-slate-400 uppercase">Role</p>
                <p className="text-[10px] font-bold text-slate-700 capitalize">{user?.role}</p>
              </div>
              <div className="w-[1px] h-6 bg-slate-100"></div>
              <div className="text-center">
                <p className="text-[9px] font-bold text-slate-400 uppercase">Status</p>
                <p className="text-[10px] font-bold text-emerald-500">Verified</p>
              </div>
            </div>
          </div>

          <nav className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 space-y-1">
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl bg-brand-50 text-brand-600 font-bold text-xs">
              <User size={16} /> Profile Details
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 font-bold text-xs transition-all">
              <Globe size={16} /> Regional Settings
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 font-bold text-xs transition-all">
              <Bell size={16} /> Notifications
            </button>
          </nav>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
                <Globe size={18} />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">Regional Preferences</h3>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Display Currency</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setCurrency('USD')}
                    className={`px-4 py-3 rounded-xl border-2 text-xs font-extrabold transition-all flex flex-col items-center gap-1 ${
                      currency === 'USD' 
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-900/10' 
                        : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <span className="text-xl">$</span>
                    US Dollar (USD)
                  </button>
                  <button
                    onClick={() => setCurrency('INR')}
                    className={`px-4 py-3 rounded-xl border-2 text-xs font-extrabold transition-all flex flex-col items-center gap-1 ${
                      currency === 'INR' 
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-900/10' 
                        : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <span className="text-xl">₹</span>
                    Indian Rupee (INR)
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 font-medium ml-1">
                  Changing your currency will update all financial displays across your dashboard.
                </p>
              </div>

              {message && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-emerald-600 text-xs font-bold bg-emerald-50 p-3 rounded-xl border border-emerald-100 flex items-center gap-2"
                >
                  <CheckCircle size={16} />
                  {message}
                </motion.div>
              )}

              <button
                onClick={handleSave}
                className="w-full bg-brand-500 text-white font-bold py-3 rounded-xl hover:bg-brand-600 transition-all shadow-lg shadow-brand-500/10 flex items-center justify-center gap-2 modern-button"
              >
                <Save size={18} />
                Apply Settings
              </button>
            </div>
          </motion.div>

          <div className="bg-slate-900 p-8 rounded-2xl shadow-xl shadow-slate-900/10 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <Shield size={80} />
            </div>
            <div className="relative z-10">
              <h3 className="text-lg font-extrabold mb-1">Security & Privacy</h3>
              <p className="text-slate-400 text-xs font-medium mb-6">Your account is protected with enterprise-grade encryption.</p>
              <button className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all backdrop-blur-md border border-white/10">
                Change Security Key
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
