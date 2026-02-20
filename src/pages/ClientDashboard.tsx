import { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate } from '../lib/utils';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
  PieChart as RePieChart, Pie, Cell, LabelList
} from 'recharts';
import { 
  Wallet, DollarSign, Download, Calendar, 
  TrendingUp, PieChart, Activity, ArrowDown
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { motion } from 'motion/react';

export default function ClientDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [allRoyalties, setAllRoyalties] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [viewType, setViewType] = useState<'monthly' | 'yearly'>('monthly');
  
  // Hover State for Chart
  const [hoveredData, setHoveredData] = useState<any>(null);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`/api/client/stats?t=${Date.now()}`);
      if (!res.ok) throw new Error('Failed to fetch stats');
      const data = (await res.json()) as any;
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats({
        totalGross: 0,
        totalNet: 0,
        totalWithdrawn: 0,
        pendingAmount: 0,
        balance: 0,
        sharePercent: 0,
        totalDeductions: 0
      });
    }
  }, []);

  const fetchRoyalties = useCallback(async () => {
    try {
      const res = await fetch(`/api/client/chart-data?view=${viewType}`);
      if (!res.ok) throw new Error('Failed to fetch chart data');
      const data = (await res.json()) as any[];
      
      // Apply revenue share to the chart data
      const share = user?.revenueShare ?? stats?.sharePercent ?? 0;
      const processedData = (data || []).map((d: any) => ({
        ...d,
        revenue: d.revenue * (share / 100)
      }));

      setChartData(processedData);
    } catch (error) {
      console.error('Error fetching chart data:', error);
      setChartData([]);
    }
  }, [viewType, user?.revenueShare, stats?.sharePercent]);

  useEffect(() => {
    fetchStats();
    fetchRoyalties();
  }, [fetchStats, fetchRoyalties]);

  const filteredRoyalties = useMemo(() => {
    let filtered = [...allRoyalties];
    if (startDate) {
      filtered = filtered.filter(r => new Date(r.date) >= new Date(startDate));
    }
    if (endDate) {
      filtered = filtered.filter(r => new Date(r.date) <= new Date(endDate));
    }
    return filtered;
  }, [allRoyalties, startDate, endDate]);

  const exportData = useCallback(() => {
    const dataToExport = filteredRoyalties.map(r => ({
      Date: formatDate(r.date),
      Source: r.source,
      Description: r.description,
      Amount: r.amount,
      Currency: user?.currency
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Royalties");
    
    const fileName = `Royalty_Report_${startDate || 'All'}_to_${endDate || 'Now'}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }, [filteredRoyalties, startDate, endDate, user?.currency]);

  const pieData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: 'Your Share', value: stats.totalNet, color: '#6366f1' },
      { name: 'Deductions', value: stats.totalDeductions, color: '#f43f5e' }
    ];
  }, [stats]);

  const currentRevenueValue = useMemo(() => {
    if (hoveredData) return hoveredData.revenue;
    if (chartData.length === 0) return 0;
    
    for (let i = chartData.length - 1; i >= 0; i--) {
      if (chartData[i].revenue > 0) return chartData[i].revenue;
    }
    
    return 0;
  }, [hoveredData, chartData]);

  if (!stats) return (
    <div className="flex h-screen items-center justify-center bg-[#F8FAFC]" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" aria-hidden="true"></div>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest animate-pulse">Loading Analytics...</p>
      </div>
    </div>
  );

  return (
    <main className="space-y-8 pb-12 animate-fade-in" aria-label="Client Dashboard">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl font-medium text-[#202124] tracking-tight">Dashboard</h1>
          <p className="text-[#70757a] mt-1 text-sm">
            Welcome back, <span className="text-[#202124] font-medium">{user?.name}</span>. 
            {stats?.labelName && <span className="ml-3 text-[#1a73e8] bg-[#e8f0fe] px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider border border-[#d2e3fc]">{stats.labelName}</span>}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3" role="search" aria-label="Filter data">
          <div className="ga-search-bar">
            <div className="flex items-center px-1 gap-2">
              <Calendar size={14} className="text-[#5f6368]" aria-hidden="true" />
              <input 
                id="start-date"
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-[11px] font-medium text-[#3c4043] border-none focus:ring-0 p-0 bg-transparent" 
              />
            </div>
            <div className="w-[1px] h-4 bg-[#dadce0] mx-2"></div>
            <div className="flex items-center px-1 gap-2">
              <input 
                id="end-date"
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-[11px] font-medium text-[#3c4043] border-none focus:ring-0 p-0 bg-transparent" 
              />
            </div>
          </div>
          <button 
            onClick={exportData}
            className="modern-button flex items-center gap-2 py-2"
          >
            <Download size={16} />
            <span>Export</span>
          </button>
        </div>
      </header>

      {/* Stats Grid - Flat Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" aria-label="Key Statistics">
        {[
          { label: 'Available Balance', value: formatCurrency(stats.balance, user?.currency), icon: Wallet, color: 'text-[#1a73e8]', bg: 'bg-[#e8f0fe]' },
          { label: 'Gross Revenue', value: formatCurrency(stats.totalGross, user?.currency), icon: DollarSign, color: 'text-[#1a73e8]', bg: 'bg-[#e8f0fe]' },
          { label: `Your Share (${user?.revenueShare ?? stats.sharePercent}%)`, value: formatCurrency(stats.totalNet, user?.currency), icon: TrendingUp, color: 'text-[#1e8e3e]', bg: 'bg-[#e6f4ea]' },
          { label: 'Deductions', value: formatCurrency(stats.totalDeductions, user?.currency), icon: ArrowDown, color: 'text-[#d93025]', bg: 'bg-[#fce8e6]' }
        ].map((item, i) => (
          <div key={i} className="bg-white p-6 rounded-lg border border-[#dadce0] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-medium text-[#70757a] uppercase tracking-wider">{item.label}</span>
              <div className={`w-8 h-8 ${item.bg} ${item.color} rounded flex items-center justify-center`}>
                <item.icon size={16} />
              </div>
            </div>
            <p className="text-2xl font-medium text-[#202124] tracking-tight">{item.value}</p>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart Section - Flat */}
        <section className="lg:col-span-2 bg-white p-8 rounded-lg border border-[#dadce0]" aria-label="Revenue Chart">
          <header className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-xs text-[#70757a] font-medium uppercase tracking-wider mb-1">Revenue Overview</h2>
              <p className="text-3xl font-medium text-[#202124] tracking-tight">
                {formatCurrency(currentRevenueValue, user?.currency)}
              </p>
            </div>
            <div className="flex items-center gap-1 bg-[#f1f3f4] p-1 rounded" role="group">
              <button 
                onClick={() => setViewType('monthly')}
                className={`px-4 py-1.5 text-[10px] font-medium rounded transition-all ${viewType === 'monthly' ? 'bg-white shadow-sm text-[#1a73e8]' : 'text-[#5f6368] hover:text-[#202124]'}`}
              >
                Monthly
              </button>
              <button 
                onClick={() => setViewType('yearly')}
                className={`px-4 py-1.5 text-[10px] font-medium rounded transition-all ${viewType === 'yearly' ? 'bg-white shadow-sm text-[#1a73e8]' : 'text-[#5f6368] hover:text-[#202124]'}`}
              >
                Yearly
              </button>
            </div>
          </header>
          
          <div className="h-[320px] w-full">
            {chartData.length > 0 && chartData.some(d => d.revenue > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart 
                  data={chartData} 
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  onMouseMove={(e: any) => {
                    if (e && e.activePayload) {
                      setHoveredData(e.activePayload[0].payload);
                    }
                  }}
                  onMouseLeave={() => setHoveredData(null)}
                >
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1a73e8" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#1a73e8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f3f4" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#70757a', fontSize: 10}} 
                    dy={10} 
                    interval="preserveStartEnd"
                  />
                  <YAxis hide={true} />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '8px', 
                      border: '1px solid #dadce0', 
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                      padding: '12px',
                      backgroundColor: '#fff',
                      color: '#3c4043'
                    }}
                    itemStyle={{ fontWeight: 500, color: '#1a73e8', fontSize: '13px' }}
                    labelStyle={{ fontWeight: 500, color: '#70757a', marginBottom: '4px', fontSize: '10px', textTransform: 'uppercase' }}
                    formatter={(value: any) => [formatCurrency(value, user?.currency), 'Revenue']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#1a73e8" 
                    strokeWidth={2} 
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                    animationDuration={500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-[#dadce0] gap-4">
                <PieChart size={32} className="opacity-20" />
                <p className="text-xs font-medium uppercase tracking-widest">No revenue data available</p>
              </div>
            )}
          </div>
        </section>

        {/* Side Analytics - Flat */}
        <aside className="flex flex-col gap-8">
          <section className="bg-white p-8 rounded-lg border border-[#dadce0]" aria-label="Share Distribution">
            <header className="flex items-center gap-2 mb-8">
              <PieChart size={16} className="text-[#5f6368]" />
              <h2 className="text-xs font-medium text-[#202124] uppercase tracking-wider">Share Distribution</h2>
            </header>
            <div className="h-[200px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="#fff"
                    strokeWidth={2}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#1a73e8' : '#d93025'} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '4px', border: '1px solid #dadce0', boxShadow: 'none' }}
                    formatter={(value: any) => formatCurrency(value, user?.currency)} 
                  />
                </RePieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-medium text-[#202124]">{user?.revenueShare ?? stats.sharePercent}%</span>
                <span className="text-[9px] font-medium text-[#70757a] uppercase">Your Share</span>
              </div>
            </div>
            <div className="mt-8 space-y-3">
              <div className="flex items-center justify-between p-2 rounded bg-[#f8f9fa] border border-[#f1f3f4]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#1a73e8]"></span>
                  <span className="text-[10px] font-medium text-[#5f6368] uppercase">Net Earnings</span>
                </div>
                <span className="text-xs font-medium text-[#202124]">{formatCurrency(stats.totalNet, user?.currency)}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-[#f8f9fa] border border-[#f1f3f4]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#d93025]"></span>
                  <span className="text-[10px] font-medium text-[#5f6368] uppercase">Label Cut</span>
                </div>
                <span className="text-xs font-medium text-[#202124]">{formatCurrency(stats.totalDeductions, user?.currency)}</span>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg border border-[#dadce0] flex flex-col flex-1 overflow-hidden">
            <header className="p-6 border-b border-[#f1f3f4] bg-[#f8f9fa]">
              <h2 className="text-sm font-medium text-[#202124] uppercase tracking-wider">Recent Activity</h2>
            </header>
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5 max-h-[280px]">
              {filteredRoyalties.length > 0 ? filteredRoyalties.slice(0, 5).map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded hover:bg-[#f1f3f4] transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#f1f3f4] rounded flex items-center justify-center text-[#5f6368] group-hover:bg-white transition-colors">
                      <Activity size={16} />
                    </div>
                    <div>
                      <h3 className="text-xs font-medium text-[#202124]">{item.source}</h3>
                      <time className="text-[10px] text-[#70757a]">{formatDate(item.date)}</time>
                    </div>
                  </div>
                  <p className="text-xs font-medium text-[#1e8e3e]">
                    +{formatCurrency(item.amount, user?.currency)}
                  </p>
                </div>
              )) : (
                <div className="h-full flex flex-col items-center justify-center text-[#dadce0] gap-3 py-10">
                  <Activity size={24} className="opacity-20" />
                  <p className="text-[10px] font-medium uppercase tracking-widest">No activity</p>
                </div>
              )}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
