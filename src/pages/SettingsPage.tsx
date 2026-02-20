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
    <div className="max-w-5xl mx-auto space-y-8 py-4 animate-fade-in">
      <div>
        <h2 className="text-2xl font-medium text-[#202124] tracking-tight">Account Settings</h2>
        <p className="text-[#70757a] mt-1 text-sm">Manage your personal preferences and security settings.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-lg border border-[#dadce0] text-center">
            <div className="relative inline-block mb-6">
              <div className="w-20 h-20 bg-[#e8f0fe] rounded-full flex items-center justify-center text-2xl font-medium text-[#1a73e8] border border-[#dadce0]">
                {user?.name.charAt(0)}
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#1e8e3e] rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                <Shield size={14} className="text-white" />
              </div>
            </div>
            <h3 className="text-lg font-medium text-[#202124]">{user?.name}</h3>
            <p className="text-[11px] font-medium text-[#70757a] uppercase tracking-wider mt-1">@{user?.username}</p>
            <div className="mt-6 pt-6 border-t border-[#f1f3f4] flex justify-center gap-6">
              <div className="text-center">
                <p className="text-[10px] font-medium text-[#70757a] uppercase tracking-wider mb-1">Role</p>
                <p className="text-xs font-medium text-[#3c4043] capitalize">{user?.role}</p>
              </div>
              <div className="w-[1px] h-8 bg-[#f1f3f4]"></div>
              <div className="text-center">
                <p className="text-[10px] font-medium text-[#70757a] uppercase tracking-wider mb-1">Status</p>
                <p className="text-xs font-medium text-[#1e8e3e]">Verified</p>
              </div>
            </div>
          </div>

          <nav className="bg-white p-2 rounded-lg border border-[#dadce0] space-y-1">
            <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded text-[#1a73e8] bg-[#e8f0fe] font-medium text-sm transition-all">
              <User size={18} /> Profile Details
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded text-[#5f6368] hover:bg-[#f8f9fa] hover:text-[#202124] font-medium text-sm transition-all">
              <Globe size={18} /> Regional Settings
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded text-[#5f6368] hover:bg-[#f8f9fa] hover:text-[#202124] font-medium text-sm transition-all">
              <Bell size={18} /> Notifications
            </button>
          </nav>
        </div>

        <div className="lg:col-span-8 space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-lg border border-[#dadce0]"
          >
            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-[#f1f3f4]">
              <div className="w-10 h-10 bg-[#f8f9fa] rounded flex items-center justify-center text-[#5f6368] border border-[#dadce0]">
                <Globe size={20} />
              </div>
              <div>
                <h3 className="text-lg font-medium text-[#202124]">Regional Preferences</h3>
                <p className="text-sm text-[#70757a] mt-0.5">Customize how financial data is displayed.</p>
              </div>
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <label className="text-[11px] font-medium text-[#70757a] uppercase tracking-wider ml-1">Display Currency</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => setCurrency('USD')}
                    className={`px-6 py-6 rounded-lg border text-sm font-medium transition-all flex flex-col items-center gap-3 ${
                      currency === 'USD' 
                        ? 'bg-[#f8f9fa] text-[#1a73e8] border-[#1a73e8] shadow-sm' 
                        : 'bg-white text-[#5f6368] border-[#dadce0] hover:border-[#bdc1c6] hover:bg-[#f8f9fa]'
                    }`}
                  >
                    <span className="text-3xl">$</span>
                    US Dollar (USD)
                  </button>
                  <button
                    onClick={() => setCurrency('INR')}
                    className={`px-6 py-6 rounded-lg border text-sm font-medium transition-all flex flex-col items-center gap-3 ${
                      currency === 'INR' 
                        ? 'bg-[#f8f9fa] text-[#1a73e8] border-[#1a73e8] shadow-sm' 
                        : 'bg-white text-[#5f6368] border-[#dadce0] hover:border-[#bdc1c6] hover:bg-[#f8f9fa]'
                    }`}
                  >
                    <span className="text-3xl">₹</span>
                    Indian Rupee (INR)
                  </button>
                </div>
                <p className="text-xs text-[#70757a] mt-4 leading-relaxed">
                  Changing your currency will update all financial displays across your dashboard immediately.
                </p>
              </div>

              {message && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-[#1e8e3e] text-xs font-medium bg-[#e6f4ea] p-3 rounded border border-[#ceead6] flex items-center gap-2"
                >
                  <CheckCircle size={16} />
                  {message}
                </motion.div>
              )}

              <div className="pt-6 border-t border-[#f1f3f4]">
                <button
                  onClick={handleSave}
                  className="primary-button px-8 py-2.5"
                >
                  Apply Settings
                </button>
              </div>
            </div>
          </motion.div>

          <div className="bg-[#202124] p-8 rounded-lg text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-700">
              <Shield size={120} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 bg-white/10 rounded flex items-center justify-center">
                  <Shield size={20} className="text-[#8ab4f8]" />
                </div>
                <h3 className="text-lg font-medium">Security & Privacy</h3>
              </div>
              <p className="text-[#bdc1c6] text-sm mb-8 max-w-md leading-relaxed">
                Your account is protected with enterprise-grade encryption. We monitor for suspicious activity 24/7 to ensure your data remains secure.
              </p>
              <button className="bg-white/10 hover:bg-white/20 text-white px-6 py-2.5 rounded text-sm font-medium transition-all border border-white/10 flex items-center gap-2">
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

