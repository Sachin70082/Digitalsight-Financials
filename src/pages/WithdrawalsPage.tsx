import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../lib/utils';
import { DollarSign, AlertCircle, CheckCircle, ArrowRight, History, CreditCard } from 'lucide-react';
import { motion } from 'motion/react';

export default function WithdrawalsPage() {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [wRes, sRes] = await Promise.all([
        fetch('/api/client/withdrawals'),
        fetch('/api/client/stats')
      ]);
      
      if (wRes.ok) setWithdrawals(await wRes.json());
      if (sRes.ok) setStats(await sRes.json());
      else throw new Error('Failed to fetch stats');
    } catch (error) {
      console.error('Error fetching withdrawal data:', error);
      setStats({ balance: 0 });
      setWithdrawals([]);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (val > stats.balance) {
      setMessage('Insufficient balance');
      return;
    }

    await fetch('/api/client/withdrawals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: val }),
    });

    setAmount('');
    setMessage('Withdrawal request submitted successfully');
    fetchData();
    setTimeout(() => setMessage(''), 5000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Withdraw Funds</h2>
        <p className="text-slate-500 mt-1 text-sm font-medium">Transfer your royalty earnings to your connected bank account.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-none shadow-sm border border-slate-200"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="p-4 bg-brand-50 text-brand-600 rounded-none shadow-inner">
                <CreditCard size={24} />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Available for Payout</p>
                <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {stats ? formatCurrency(stats.balance, user?.currency) : '...'}
                </h3>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Withdrawal Amount</label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold text-lg group-focus-within:text-brand-500 transition-colors">
                    {user?.currency === 'USD' ? '$' : '₹'}
                  </span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="modern-input !pl-10 text-xl font-extrabold tracking-tight"
                    placeholder="0.00"
                    min="1"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              {message && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3 rounded-none text-xs font-bold flex items-center gap-2 ${message.includes('Insufficient') ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-brand-50 text-brand-600 border border-brand-100'}`}
                >
                  {message.includes('Insufficient') ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
                  {message}
                </motion.div>
              )}

              <button
                type="submit"
                className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-none hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2 group modern-button"
              >
                Initiate Transfer
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          </motion.div>

          <div className="bg-brand-50 p-6 rounded-none border border-brand-100">
            <h4 className="text-brand-800 font-bold text-sm mb-1 flex items-center gap-2">
              <AlertCircle size={16} />
              Payout Policy
            </h4>
            <p className="text-brand-700/80 text-xs font-medium leading-relaxed">
              Withdrawal requests are typically processed within 2-3 business days. Minimum withdrawal amount is 100 INR.
            </p>
          </div>
        </div>

        <div className="lg:col-span-3 bg-white rounded-none shadow-sm border border-slate-200 flex flex-col">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-50 rounded-none flex items-center justify-center text-slate-400">
                <History size={18} />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">Transfer History</h3>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{withdrawals.length} Total</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 font-bold uppercase tracking-wider text-[9px]">Reference Date</th>
                  <th className="px-6 py-3 font-bold uppercase tracking-wider text-[9px]">Amount</th>
                  <th className="px-6 py-3 font-bold uppercase tracking-wider text-[9px] text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {withdrawals.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-slate-600 font-bold">{new Date(item.request_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</td>
                    <td className="px-6 py-4 font-extrabold text-slate-900 text-base">{formatCurrency(item.amount, user?.currency)}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-none text-[9px] font-extrabold uppercase tracking-widest ${
                        item.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                        item.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {withdrawals.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <DollarSign size={32} className="text-slate-100" />
                        <p className="text-slate-400 font-bold">No history found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
