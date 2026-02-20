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
    <div className="max-w-6xl mx-auto space-y-10 animate-fade-in">
      <div>
        <h2 className="text-2xl font-medium text-[#202124] tracking-tight">Withdraw Funds</h2>
        <p className="text-[#70757a] mt-1 text-sm">Transfer your royalty earnings to your connected bank account.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-lg border border-[#dadce0]">
            <div className="flex items-center gap-5 mb-10">
              <div className="p-4 bg-[#e8f0fe] text-[#1a73e8] rounded">
                <CreditCard size={24} />
              </div>
              <div>
                <p className="text-[11px] text-[#70757a] font-medium uppercase tracking-wider mb-1">Available for Payout</p>
                <h3 className="text-3xl font-medium text-[#202124] tracking-tight">
                  {stats ? formatCurrency(stats.balance, user?.currency) : '...'}
                </h3>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-medium text-[#70757a] uppercase tracking-wider ml-1">Withdrawal Amount</label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#70757a] font-medium text-lg group-focus-within:text-[#1a73e8] transition-colors">
                    {user?.currency === 'USD' ? '$' : '₹'}
                  </span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-[#dadce0] rounded focus:ring-1 focus:ring-[#1a73e8] focus:border-[#1a73e8] transition-all outline-none text-xl font-medium tracking-tight"
                    placeholder="0.00"
                    min="1"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              {message && (
                <div className={`p-4 rounded text-xs font-medium flex items-center gap-3 ${message.includes('Insufficient') ? 'bg-[#fce8e6] text-[#d93025] border border-[#f9d2ce]' : 'bg-[#e6f4ea] text-[#1e8e3e] border border-[#ceead6]'}`}>
                  {message.includes('Insufficient') ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
                  {message}
                </div>
              )}

              <button
                type="submit"
                className="primary-button w-full py-3 flex items-center justify-center gap-2 group"
              >
                Initiate Transfer
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          </div>

          <div className="bg-[#f8f9fa] p-6 rounded-lg border border-[#dadce0]">
            <h4 className="text-[#202124] font-medium text-sm mb-2 flex items-center gap-2">
              <AlertCircle size={16} className="text-[#5f6368]" />
              Payout Policy
            </h4>
            <p className="text-[#5f6368] text-xs leading-relaxed">
              Withdrawal requests are typically processed within 2-3 business days. Minimum withdrawal amount is 100 INR.
            </p>
          </div>
        </div>

        <div className="lg:col-span-3 google-table-container flex flex-col">
          <div className="p-6 border-b border-[#f1f3f4] bg-[#f8f9fa] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white border border-[#dadce0] rounded flex items-center justify-center text-[#5f6368]">
                <History size={18} />
              </div>
              <h3 className="text-base font-medium text-[#202124]">Transfer History</h3>
            </div>
            <span className="text-[10px] font-medium text-[#70757a] uppercase tracking-wider">{withdrawals.length} Total</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <table className="google-table">
              <thead>
                <tr>
                  <th>Reference Date</th>
                  <th>Amount</th>
                  <th className="text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((item: any) => (
                  <tr key={item.id}>
                    <td className="text-[#5f6368]">{new Date(item.request_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</td>
                    <td className="font-medium text-[#202124] text-base">{formatCurrency(item.amount, user?.currency)}</td>
                    <td className="text-right">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider border ${
                        item.status === 'approved' ? 'bg-[#e6f4ea] text-[#1e8e3e] border-[#ceead6]' :
                        item.status === 'rejected' ? 'bg-[#fce8e6] text-[#d93025] border-[#f9d2ce]' :
                        'bg-[#fef7e0] text-[#ea8600] border-[#feefc3]'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {withdrawals.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <DollarSign size={32} className="text-[#dadce0]" />
                        <p className="text-[#70757a] text-xs font-medium uppercase tracking-widest">No history found</p>
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
