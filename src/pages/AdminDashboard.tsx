import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../lib/utils';
import { Users, DollarSign, Clock, ShieldCheck, ArrowUpRight, UserPlus } from 'lucide-react';
import { motion } from 'motion/react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [clients, setClients] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);

  useEffect(() => {
    fetchClients();
    fetchWithdrawals();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/admin/clients');
      if (res.ok) {
        const data = await res.json();
        setClients((data || []) as any[]);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      const res = await fetch('/api/admin/withdrawals');
      if (res.ok) {
        const data = await res.json();
        setWithdrawals((data || []) as any[]);
      }
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-brand-600 font-bold text-[10px] uppercase tracking-widest mb-1">
            <ShieldCheck size={14} />
            Administrative Control
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">System Overview</h2>
          <p className="text-slate-500 mt-1 text-sm font-medium">Welcome back, {user?.name}. Here's what's happening today.</p>
        </div>
        
        <button className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl hover:bg-slate-800 transition-all text-xs font-bold shadow-lg shadow-slate-900/10 modern-button">
          <UserPlus size={16} />
          New Client
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
              <Users size={20} />
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">Active</span>
          </div>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Total Clients</p>
          <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{clients.length}</h3>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
              <Clock size={20} />
            </div>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">Action Required</span>
          </div>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Pending Requests</p>
          <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {withdrawals.filter(w => w.status === 'pending').length}
          </h3>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
              <DollarSign size={20} />
            </div>
            <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">YTD</span>
          </div>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Total Volume</p>
          <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {formatCurrency(withdrawals.reduce((acc, w) => acc + (w.status === 'approved' ? w.amount : 0), 0))}
          </h3>
        </div>
      </div>

      {/* Client List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-50 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">Client Directory</h3>
            <p className="text-xs text-slate-400 font-medium">Active royalty accounts</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
          {clients.map((client: any) => (
            <motion.div 
              key={client.id} 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all group cursor-pointer"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-slate-500 font-bold text-sm shadow-sm group-hover:bg-slate-900 group-hover:text-white transition-colors">
                  {client.name.charAt(0)}
                </div>
                <ArrowUpRight size={16} className="text-slate-300 group-hover:text-slate-900 transition-colors" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-0.5">{client.name}</h4>
              <p className="text-[10px] font-medium text-slate-400 mb-3">{client.email}</p>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold text-slate-500 bg-white px-2 py-1 rounded border border-slate-100 uppercase tracking-wider">
                  {client.currency || 'USD'}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
