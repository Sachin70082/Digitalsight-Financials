import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../lib/utils';
import { Users, DollarSign, Clock, ShieldCheck, ArrowUpRight, UserPlus } from 'lucide-react';
import { motion } from 'motion/react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [clients, setClients] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);

  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/clients');
      if (res.ok) {
        const data = await res.json();
        setClients((data || []) as any[]);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  }, []);

  const fetchWithdrawals = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/withdrawals');
      if (res.ok) {
        const data = await res.json();
        setWithdrawals((data || []) as any[]);
      }
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
    }
  }, []);

  useEffect(() => {
    fetchClients();
    fetchWithdrawals();
  }, [fetchClients, fetchWithdrawals]);

  const pendingRequests = useMemo(() => {
    return withdrawals.filter(w => w.status === 'pending').length;
  }, [withdrawals]);

  const totalVolume = useMemo(() => {
    return withdrawals.reduce((acc, w) => acc + (w.status === 'approved' ? w.amount : 0), 0);
  }, [withdrawals]);

  return (
    <main className="space-y-6 pb-12" aria-label="Admin Dashboard">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-brand-600 font-bold text-[10px] uppercase tracking-widest mb-1">
            <ShieldCheck size={14} aria-hidden="true" />
            <span>Administrative Control</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">System Overview</h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">Welcome back, {user?.name}. Here's what's happening today.</p>
        </div>
        
        <button 
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-none hover:bg-slate-800 focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-all text-xs font-bold shadow-lg shadow-slate-900/10 modern-button"
          aria-label="Add New Client"
        >
          <UserPlus size={16} aria-hidden="true" />
          <span>New Client</span>
        </button>
      </header>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6" aria-label="System Statistics">
        <article className="bg-white p-6 rounded-none shadow-sm border border-slate-200">
          <header className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 bg-blue-50 rounded-none flex items-center justify-center text-blue-600" aria-hidden="true">
              <Users size={20} />
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-none">Active</span>
          </header>
          <h2 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Total Clients</h2>
          <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{clients.length}</p>
        </article>

        <article className="bg-white p-6 rounded-none shadow-sm border border-slate-200">
          <header className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 bg-amber-50 rounded-none flex items-center justify-center text-amber-600" aria-hidden="true">
              <Clock size={20} />
            </div>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-none">Action Required</span>
          </header>
          <h2 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Pending Requests</h2>
          <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {pendingRequests}
          </p>
        </article>

        <article className="bg-white p-6 rounded-none shadow-sm border border-slate-200">
          <header className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 bg-emerald-50 rounded-none flex items-center justify-center text-emerald-600" aria-hidden="true">
              <DollarSign size={20} />
            </div>
            <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-none">YTD</span>
          </header>
          <h2 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Total Volume</h2>
          <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {formatCurrency(totalVolume)}
          </p>
        </article>
      </section>

      {/* Client List */}
      <section className="bg-white rounded-none shadow-sm border border-slate-200 flex flex-col" aria-label="Client Directory">
        <header className="p-6 border-b border-slate-50 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Client Directory</h2>
            <p className="text-xs text-slate-400 font-medium">Active royalty accounts</p>
          </div>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
          {clients.map((client: any) => (
            <motion.article 
              key={client.id} 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-50 p-4 rounded-none border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all group cursor-pointer focus-within:ring-2 focus-within:ring-brand-500"
              tabIndex={0}
              role="button"
              aria-label={`View details for ${client.name}`}
            >
              <header className="flex justify-between items-start mb-3">
                <div className="w-10 h-10 bg-white rounded-none flex items-center justify-center text-slate-500 font-bold text-sm shadow-sm group-hover:bg-slate-900 group-hover:text-white transition-colors" aria-hidden="true">
                  {client.name.charAt(0)}
                </div>
                <ArrowUpRight size={16} className="text-slate-300 group-hover:text-slate-900 transition-colors" aria-hidden="true" />
              </header>
              <h3 className="text-sm font-bold text-slate-900 mb-0.5">{client.name}</h3>
              <p className="text-[10px] font-medium text-slate-400 mb-3">{client.email}</p>
              <footer className="flex items-center gap-2">
                <span className="text-[9px] font-bold text-slate-500 bg-white px-2 py-1 rounded-none border border-slate-100 uppercase tracking-wider">
                  {client.currency || 'USD'}
                </span>
              </footer>
            </motion.article>
          ))}
        </div>
      </section>
    </main>
  );
}
