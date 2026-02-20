import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate } from '../lib/utils';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
  PieChart as RePieChart, Pie, Cell, LabelList
} from 'recharts';
import { 
  ArrowUpRight, Wallet, Clock, DollarSign, Download, Calendar, 
  TrendingUp, FileText, PieChart, Activity, FileDown, Info, LayoutDashboard, ArrowDown
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { motion } from 'motion/react';

export default function ClientDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [allRoyalties, setAllRoyalties] = useState<any[]>([]);
  const [filteredRoyalties, setFilteredRoyalties] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [viewType, setViewType] = useState<'monthly' | 'yearly'>('monthly');
  
  // Hover State for Chart
  const [hoveredData, setHoveredData] = useState<any>(null);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchStats();
    fetchRoyalties();
  }, [viewType]);

  useEffect(() => {
    filterData();
  }, [startDate, endDate, allRoyalties]);

  const fetchStats = async () => {
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
  };

  const fetchRoyalties = async () => {
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
  };

  const filterData = () => {
    let filtered = [...allRoyalties];
    if (startDate) {
      filtered = filtered.filter(r => new Date(r.date) >= new Date(startDate));
    }
    if (endDate) {
      filtered = filtered.filter(r => new Date(r.date) <= new Date(endDate));
    }
    setFilteredRoyalties(filtered);
  };

  const exportData = () => {
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
  };

  if (!stats) return (
    <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest animate-pulse">Loading Analytics...</p>
      </div>
    </div>
  );

  // Pie Chart Data
  const pieData = [
    { name: 'Your Share', value: stats.totalNet, color: '#6366f1' },
    { name: 'Deductions', value: stats.totalDeductions, color: '#f43f5e' }
  ];

  // Dynamic Header Value for Chart
  const currentRevenueValue = (() => {
    if (hoveredData) return hoveredData.revenue;
    if (chartData.length === 0) return 0;
    
    // Find the latest non-zero value
    for (let i = chartData.length - 1; i >= 0; i--) {
      if (chartData[i].revenue > 0) return chartData[i].revenue;
    }
    
    return 0;
  })();

  return (
    <div className="space-y-6 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-brand-600 font-bold text-[10px] uppercase tracking-widest mb-1"
          >
            <TrendingUp size={14} />
            Financial Performance
          </motion.div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Dashboard</h2>
          <p className="text-slate-500 mt-1 text-sm font-medium">
            Welcome back, <span className="text-slate-900 font-bold">{user?.name}</span>. 
            {stats?.labelName && <span className="ml-2 text-brand-600 bg-brand-50 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-tight">{stats.labelName}</span>}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            <div className="flex items-center px-2 gap-2">
              <Calendar size={14} className="text-slate-400" />
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-[11px] font-bold text-slate-600 border-none focus:ring-0 p-0 bg-transparent" 
              />
            </div>
            <div className="w-[1px] h-3 bg-slate-200 mx-1"></div>
            <div className="flex items-center px-2 gap-2">
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-[11px] font-bold text-slate-600 border-none focus:ring-0 p-0 bg-transparent" 
              />
            </div>
          </div>
          <button 
            onClick={exportData}
            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl hover:bg-slate-800 transition-all text-xs font-bold shadow-lg shadow-slate-900/10 modern-button"
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-slate-900 p-6 rounded-2xl shadow-lg shadow-slate-900/10 relative overflow-hidden group"
        >
          <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all duration-500"></div>
          <div className="relative z-10">
            <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center mb-4">
              <Wallet className="text-white" size={20} />
            </div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Available Balance</p>
            <h3 className="text-3xl font-extrabold text-white tracking-tight">{formatCurrency(stats.balance, user?.currency)}</h3>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group"
        >
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
            <DollarSign className="text-blue-600" size={20} />
          </div>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Gross Revenue</p>
          <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">{formatCurrency(stats.totalGross, user?.currency)}</h3>
        </motion.div>

        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group"
        >
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mb-4">
            <TrendingUp className="text-emerald-600" size={20} />
          </div>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Your Share ({user?.revenueShare ?? stats.sharePercent}%)</p>
          <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">{formatCurrency(stats.totalNet, user?.currency)}</h3>
        </motion.div>

        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group"
        >
          <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center mb-4">
            <ArrowDown className="text-red-600" size={20} />
          </div>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Deductions</p>
          <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">{formatCurrency(stats.totalDeductions, user?.currency)}</h3>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Section */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-sm text-slate-500 font-medium">Revenue of recent month</p>
              <h3 className="mt-1 text-3xl font-bold text-slate-900 tracking-tight">
                {formatCurrency(currentRevenueValue, user?.currency)}
              </h3>
            </div>
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-100">
              <button 
                onClick={() => setViewType('monthly')}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${viewType === 'monthly' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Monthly
              </button>
              <button 
                onClick={() => setViewType('yearly')}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${viewType === 'yearly' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Yearly
              </button>
            </div>
          </div>
          
          <div className="h-[300px] w-full">
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
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} 
                    dy={10} 
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    hide={true}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      padding: '8px 12px',
                      backgroundColor: '#0f172a',
                      color: '#fff'
                    }}
                    itemStyle={{ fontWeight: 800, color: '#fff', fontSize: '12px' }}
                    labelStyle={{ fontWeight: 700, color: '#94a3b8', marginBottom: '2px', fontSize: '10px' }}
                    formatter={(value: any) => [formatCurrency(value, user?.currency), 'Revenue']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#6366f1" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                    animationDuration={1000}
                  >
                    <LabelList 
                      dataKey="revenue" 
                      position="top" 
                      offset={15}
                      content={(props: any) => {
                        const { x, y, value } = props;
                        if (value === 0) return null;
                        return (
                          <text 
                            x={x} 
                            y={y} 
                            dy={-10} 
                            fill="#0f172a" 
                            fontSize={10} 
                            fontWeight={800} 
                            textAnchor="middle"
                          >
                            {formatCurrency(value, user?.currency)}
                          </text>
                        );
                      }}
                    />
                  </Area>
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-3">
                <PieChart size={48} className="opacity-20" />
                <p className="text-xs font-bold uppercase tracking-widest">No revenue data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Side Analytics */}
        <div className="flex flex-col gap-6">
          {/* Revenue Share Pie Chart */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-6">
              <PieChart size={16} className="text-slate-400" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Share Distribution</h3>
            </div>
            <div className="h-[200px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatCurrency(value, user?.currency)} />
                </RePieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-extrabold text-slate-900">{user?.revenueShare ?? stats.sharePercent}%</span>
                <span className="text-[8px] font-bold text-slate-400 uppercase">Your Share</span>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  <span className="text-slate-500">Net Earnings</span>
                </div>
                <span className="text-slate-900">{formatCurrency(stats.totalNet, user?.currency)}</span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-bold uppercase">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  <span className="text-slate-500">Label Cut</span>
                </div>
                <span className="text-slate-900">{formatCurrency(stats.totalDeductions, user?.currency)}</span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col flex-1">
            <div className="p-6 border-b border-slate-50">
              <h3 className="text-lg font-extrabold text-slate-900">Recent Activity</h3>
              <p className="text-xs text-slate-400 font-medium">Latest royalty deposits</p>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1 max-h-[250px]">
              {filteredRoyalties.length > 0 ? filteredRoyalties.slice(0, 5).map((item: any) => (
                <motion.div 
                  key={item.id} 
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
                      <Activity size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{item.source}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{formatDate(item.date)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-extrabold text-brand-600">+{formatCurrency(item.amount, user?.currency)}</p>
                  </div>
                </motion.div>
              )) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-2 py-8">
                  <Activity size={24} className="opacity-20" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
