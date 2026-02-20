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
    <main className="space-y-8 pb-12 animate-fade-in" aria-label="Admin Dashboard">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl font-medium text-[#202124] tracking-tight">System Overview</h1>
          <p className="text-[#70757a] mt-1 text-sm">Welcome back, <span className="text-[#202124] font-medium">{user?.name}</span>. Here's what's happening today.</p>
        </div>
        
        <button 
          className="primary-button flex items-center gap-2 py-2"
          aria-label="Add New Client"
        >
          <UserPlus size={16} />
          <span>New Client</span>
        </button>
      </header>

      {/* Stats Grid - Flat */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6" aria-label="System Statistics">
        <div className="bg-white p-6 rounded-lg border border-[#dadce0]">
          <div className="flex justify-between items-start mb-4">
            <div className="w-8 h-8 bg-[#e8f0fe] rounded flex items-center justify-center text-[#1a73e8]">
              <Users size={18} />
            </div>
            <span className="text-[10px] font-medium text-[#1e8e3e] bg-[#e6f4ea] px-2 py-0.5 rounded uppercase tracking-wider border border-[#ceead6]">Active</span>
          </div>
          <h2 className="text-[#70757a] text-[11px] font-medium uppercase tracking-wider mb-1">Total Clients</h2>
          <p className="text-3xl font-medium text-[#202124] tracking-tight">{clients.length}</p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-[#dadce0]">
          <div className="flex justify-between items-start mb-4">
            <div className="w-8 h-8 bg-[#fef7e0] rounded flex items-center justify-center text-[#f9ab00]">
              <Clock size={18} />
            </div>
            <span className="text-[10px] font-medium text-[#ea8600] bg-[#fef7e0] px-2 py-0.5 rounded uppercase tracking-wider border border-[#feefc3]">Action Required</span>
          </div>
          <h2 className="text-[#70757a] text-[11px] font-medium uppercase tracking-wider mb-1">Pending Requests</h2>
          <p className="text-3xl font-medium text-[#202124] tracking-tight">{pendingRequests}</p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-[#dadce0]">
          <div className="flex justify-between items-start mb-4">
            <div className="w-8 h-8 bg-[#e6f4ea] rounded flex items-center justify-center text-[#1e8e3e]">
              <DollarSign size={18} />
            </div>
            <span className="text-[10px] font-medium text-[#70757a] bg-[#f1f3f4] px-2 py-0.5 rounded uppercase tracking-wider border border-[#dadce0]">YTD</span>
          </div>
          <h2 className="text-[#70757a] text-[11px] font-medium uppercase tracking-wider mb-1">Total Volume</h2>
          <p className="text-3xl font-medium text-[#202124] tracking-tight">{formatCurrency(totalVolume)}</p>
        </div>
      </section>

      {/* Client List - Flat */}
      <section className="google-table-container flex flex-col">
        <header className="p-6 border-b border-[#f1f3f4] bg-[#f8f9fa] flex justify-between items-center">
          <div>
            <h2 className="text-base font-medium text-[#202124]">Client Directory</h2>
            <p className="text-xs text-[#70757a] mt-0.5">Active royalty accounts</p>
          </div>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          {clients.map((client: any) => (
            <div 
              key={client.id} 
              className="bg-white p-5 rounded-lg border border-[#f1f3f4] hover:border-[#dadce0] hover:bg-[#f8f9fa] transition-all group cursor-pointer"
              tabIndex={0}
              role="button"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 bg-[#f1f3f4] rounded-full flex items-center justify-center text-[#5f6368] font-medium text-sm border border-[#dadce0] group-hover:bg-white transition-colors">
                  {client.name.charAt(0)}
                </div>
                <ArrowUpRight size={16} className="text-[#dadce0] group-hover:text-[#1a73e8] transition-colors" />
              </div>
              <h3 className="text-sm font-medium text-[#202124] mb-0.5">{client.name}</h3>
              <p className="text-[11px] text-[#70757a] mb-4">{client.email}</p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium text-[#5f6368] bg-white px-2 py-0.5 rounded border border-[#dadce0] uppercase tracking-wider">
                  {client.currency || 'USD'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
