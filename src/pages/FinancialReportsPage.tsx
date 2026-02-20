import { useEffect, useState, useRef } from 'react';
import { formatCurrency, formatDate } from '../lib/utils';
import { 
  Check, X, Upload, FileSpreadsheet, BarChart3, Wallet, 
  Loader2, Search, Filter, Download, Calendar, User, Edit2, Save, DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx';
import { formatReportRow } from '../lib/calculations';

export default function FinancialReportsPage() {
  const [activeTab, setActiveTab] = useState('analytics');
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [stats, setStats] = useState<{ royalties: any[], withdrawals: any[] }>({ royalties: [], withdrawals: [] });
  const [clients, setClients] = useState<any[]>([]);
  const [labels, setLabels] = useState<any[]>([]);
  const [allReports, setAllReports] = useState<any[]>([]);
  
  // Edit State
  const [editingReportId, setEditingReportId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState({ user_id: '', start_date: '', end_date: '', total_revenue: '' });

  // Report Entry State
  const [selectedClient, setSelectedClient] = useState('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [totalRevenue, setTotalRevenue] = useState('');
  const [excelData, setExcelData] = useState<any[]>([]);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    await Promise.all([fetchWithdrawals(), fetchStats(), fetchClients(), fetchLabels(), fetchAllReports()]);
  };

  const fetchAllReports = async () => {
    try {
      const res = await fetch('/api/admin/reports');
      if (res.ok) {
        const data = await res.json();
        setAllReports((data || []) as any[]);
      }
    } catch (error) {
      console.error('Error fetching all reports:', error);
    }
  };

  const handleEditReport = (report: any) => {
    setEditingReportId(report.id);
    setEditFormData({
      user_id: String(report.user_id),
      start_date: report.start_date,
      end_date: report.end_date,
      total_revenue: String(report.total_revenue || '')
    });
  };

  const handleSaveEdit = async () => {
    if (!editingReportId) return;
    
    try {
      const res = await fetch(`/api/admin/reports/${editingReportId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editFormData,
          total_revenue: Number(editFormData.total_revenue) || 0
        }),
      });
      
      if (res.ok) {
        setEditingReportId(null);
        fetchAllReports();
      } else {
        const data = (await res.json()) as any;
        alert(`Failed to update report: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Update error:', error);
      alert('Network error while updating report');
    }
  };

  const handleDeleteReport = async (id: number) => {
    if (!confirm('Are you sure you want to delete this report? This will also remove the file from storage.')) return;
    
    try {
      const res = await fetch(`/api/admin/reports/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchAllReports();
      } else {
        alert('Failed to delete report');
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleDownloadReport = async (reportId: number, filename: string) => {
    try {
      const res = await fetch(`/api/client/reports/${reportId}/download`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to download report');
      }
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const fetchLabels = async () => {
    try {
      const res = await fetch('/api/admin/labels');
      const data = (await res.json()) as any;
      if (res.ok) {
        setLabels((data || []) as any[]);
        if (Array.isArray(data) && data.length === 0) {
          console.warn('No labels found in database.');
        }
      } else {
        const errorMsg = data.message || data.error || 'Unknown error';
        console.error('Failed to fetch labels:', errorMsg);
        alert(`Error fetching labels: ${errorMsg}`);
      }
    } catch (error) {
      console.error('Error fetching labels:', error);
    }
  };

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

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setStats((data || { royalties: [], withdrawals: [] }) as { royalties: any[], withdrawals: any[] });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleStatusUpdate = async (id: number, status: string) => {
    await fetch(`/api/admin/withdrawals/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    fetchWithdrawals();
    fetchStats();
  };

  const handleDeleteWithdrawal = async (id: number) => {
    if (!confirm('Are you sure you want to delete this withdrawal request?')) return;
    
    try {
      const res = await fetch(`/api/admin/withdrawals/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchWithdrawals();
        fetchStats();
      } else {
        alert('Failed to delete withdrawal');
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExcelFile(file);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      setExcelData(data);
    };
    reader.readAsBinaryString(file);
  };

  const processReportUpload = async () => {
    if (!selectedClient || !dateRange.from || !dateRange.to || !excelFile || !totalRevenue) {
      alert('Please fill in all fields and select a file.');
      return;
    }
    
    setIsUploading(true);

    // Prepare data for royalties table
    const royaltyData = excelData.map((row: any) => ({
      amount: row.Amount,
      date: row.Date,
      description: row.Description,
      source: row.Source
    }));

    const formData = new FormData();
    formData.append('file', excelFile);
    formData.append('metadata', JSON.stringify({
      client_id: selectedClient,
      start_date: dateRange.from,
      end_date: dateRange.to,
      total_revenue: Number(totalRevenue)
    }));
    formData.append('royalty_data', JSON.stringify(royaltyData));

    try {
      const res = await fetch('/api/admin/reports/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        alert('Report uploaded successfully!');
        setExcelData([]);
        setExcelFile(null);
        setSelectedClient('');
        setTotalRevenue('');
        setDateRange({ from: '', to: '' });
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchAllReports();
        fetchStats();
      } else {
        const err = (await res.json()) as any;
        alert(`Failed to upload: ${err.message}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Error uploading report.');
    } finally {
      setIsUploading(false);
    }
  };

  const chartData = stats.royalties.map((r: any) => {
    const w = stats.withdrawals.find((w: any) => w.month === r.month);
    return {
      name: r.month,
      Royalties: r.total,
      Withdrawals: w ? w.total : 0
    };
  }).reverse();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Financial Reports</h2>
          <p className="text-slate-500 mt-1 text-sm font-medium">Manage uploads, approvals, and analytics.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-none hover:bg-slate-50 transition-all text-xs font-bold shadow-sm">
            <Download size={16} />
            Export Data
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto pb-2 gap-2 no-scrollbar border-b border-slate-200">
        {[
          { id: 'analytics', label: 'Analytics & Charts', icon: BarChart3 },
          { id: 'uploads', label: 'Report Entry', icon: FileSpreadsheet },
          { id: 'approvals', label: 'Withdrawal Approvals', icon: Wallet },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold transition-all whitespace-nowrap border-b-2 ${
              activeTab === tab.id 
                ? 'border-slate-900 text-slate-900' 
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'analytics' && (
          <motion.div 
            key="analytics"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white p-6 rounded-none shadow-sm border border-slate-200"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Revenue vs Withdrawals</h3>
                <p className="text-xs text-slate-400 font-medium">Monthly financial performance overview</p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-none bg-slate-900"></span>
                  <span className="text-xs font-bold text-slate-600">Royalties</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-none bg-blue-500"></span>
                  <span className="text-xs font-bold text-slate-600">Withdrawals</span>
                </div>
              </div>
            </div>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                    tickFormatter={(value) => `$${value/1000}k`}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Bar dataKey="Royalties" fill="#0f172a" radius={[4, 4, 0, 0]} barSize={40} />
                  <Bar dataKey="Withdrawals" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {activeTab === 'uploads' && (
          <motion.div 
            key="uploads"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="bg-white p-8 rounded-none shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 mb-6">New Royalty Report</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Client Account</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <select 
                      value={selectedClient}
                      onChange={(e) => setSelectedClient(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-none text-sm font-medium focus:ring-2 focus:ring-slate-900 outline-none appearance-none"
                    >
                      <option value="">Select Label</option>
                      {labels.map(label => (
                        <option key={label.id} value={label.owner_id}>{label.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Report Period</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        type="date" 
                        value={dateRange.from}
                        onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
                        className="w-full pl-10 pr-2 py-3 bg-slate-50 border border-slate-200 rounded-none text-sm font-medium focus:ring-2 focus:ring-slate-900 outline-none"
                      />
                    </div>
                    <div className="relative flex-1">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        type="date" 
                        value={dateRange.to}
                        onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
                        className="w-full pl-10 pr-2 py-3 bg-slate-50 border border-slate-200 rounded-none text-sm font-medium focus:ring-2 focus:ring-slate-900 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Revenue</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="number" 
                      step="0.01"
                      value={totalRevenue}
                      onChange={(e) => setTotalRevenue(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-none text-sm font-medium focus:ring-2 focus:ring-slate-900 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Data File</label>
                  <div className="relative">
                    <input 
                      type="file" 
                      accept=".xlsx, .xls" 
                      onChange={handleFileUpload} 
                      ref={fileInputRef}
                      className="hidden" 
                      id="report-upload"
                    />
                    <label 
                      htmlFor="report-upload"
                      className={`w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed rounded-none cursor-pointer transition-all ${
                        excelFile 
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {excelFile ? (
                        <><Check size={16} /> {excelFile.name}</>
                      ) : (
                        <><Upload size={16} /> Choose Excel File</>
                      )}
                    </label>
                  </div>
                </div>
              </div>

              {excelData.length > 0 && (
                <div className="border border-slate-200 rounded-none overflow-hidden mb-6">
                  <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 uppercase">Preview ({excelData.length} rows)</span>
                  </div>
                  <div className="overflow-x-auto max-h-[300px]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-white text-slate-400 sticky top-0 shadow-sm">
                        <tr>
                          {Object.keys(excelData[0] || {}).map((key) => (
                            <th key={key} className="px-4 py-2 font-bold uppercase tracking-wider text-[9px]">{key}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {excelData.slice(0, 10).map((row, i) => (
                          <tr key={i} className="hover:bg-slate-50/50">
                            {Object.values(row).map((val: any, j) => (
                              <td key={j} className="px-4 py-2 text-slate-600 font-medium">{String(val)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {excelData.length > 10 && (
                      <div className="p-2 text-center text-xs text-slate-400 italic bg-slate-50 border-t border-slate-100">
                        ...and {excelData.length - 10} more rows
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button 
                  onClick={processReportUpload}
                  disabled={isUploading || !excelFile}
                  className="bg-slate-900 text-white px-6 py-3 rounded-none font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                  Submit Report
                </button>
              </div>
            </div>

            {/* Report History Table */}
            <div className="bg-white rounded-none shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900">Report History</h3>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{allReports.length} Total Reports</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-400">
                    <tr>
                      <th className="px-6 py-3 font-bold uppercase tracking-wider text-[9px]">Client</th>
                      <th className="px-6 py-3 font-bold uppercase tracking-wider text-[9px]">Period</th>
                      <th className="px-6 py-3 font-bold uppercase tracking-wider text-[9px]">Revenue</th>
                      <th className="px-6 py-3 font-bold uppercase tracking-wider text-[9px]">File Name</th>
                      <th className="px-6 py-3 font-bold uppercase tracking-wider text-[9px]">Uploaded At</th>
                      <th className="px-6 py-3 font-bold uppercase tracking-wider text-[9px] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {allReports.map((report: any) => {
                      // Find the label to get the share percentage for this report
                      const label = labels.find(l => String(l.owner_id) === String(report.user_id));
                      const share = label?.revenue_share ?? 0;
                      const formatted = formatReportRow(report, share);
                      
                      return (
                        <tr key={report.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            {editingReportId === report.id ? (
                              <select 
                                value={editFormData.user_id}
                                onChange={(e) => setEditFormData({...editFormData, user_id: e.target.value})}
                                className="w-full p-1 text-xs border rounded-none"
                              >
                                {labels.map(label => (
                                  <option key={label.id} value={label.owner_id}>{label.name}</option>
                                ))}
                              </select>
                            ) : (
                              <>
                                <div className="font-bold text-slate-900">{report.client_name}</div>
                                <div className="text-[10px] text-slate-400">{report.client_email}</div>
                              </>
                            )}
                          </td>
                          <td className="px-6 py-4 text-slate-600 font-medium">
                            {editingReportId === report.id ? (
                              <div className="flex gap-1">
                                <input 
                                  type="date" 
                                  value={editFormData.start_date}
                                  onChange={(e) => setEditFormData({...editFormData, start_date: e.target.value})}
                                  className="w-full p-1 text-[10px] border rounded-none"
                                />
                                <input 
                                  type="date" 
                                  value={editFormData.end_date}
                                  onChange={(e) => setEditFormData({...editFormData, end_date: e.target.value})}
                                  className="w-full p-1 text-[10px] border rounded-none"
                                />
                              </div>
                            ) : (
                              `${formatDate(report.start_date)} - ${formatDate(report.end_date)}`
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {editingReportId === report.id ? (
                              <input 
                                type="number" 
                                step="0.01"
                                value={editFormData.total_revenue}
                                onChange={(e) => setEditFormData({...editFormData, total_revenue: e.target.value})}
                                className="w-full p-1 text-xs border rounded-none"
                              />
                            ) : (
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-900">{formatCurrency(formatted.gross)}</span>
                                <span className="text-[9px] text-slate-400 uppercase">Net: {formatCurrency(formatted.net)} ({share}%)</span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <button 
                              onClick={() => handleDownloadReport(report.id, report.filename)}
                              className="flex items-center gap-2 text-blue-600 font-bold hover:text-blue-800 hover:underline transition-all"
                            >
                              <FileSpreadsheet size={14} />
                              {report.filename}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-slate-400">{formatDate(report.created_at)}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              {editingReportId === report.id ? (
                                <>
                                  <button 
                                    onClick={handleSaveEdit}
                                    className="p-2 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-none transition-all"
                                    title="Save Changes"
                                  >
                                    <Save size={16} />
                                  </button>
                                  <button 
                                    onClick={() => setEditingReportId(null)}
                                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-none transition-all"
                                    title="Cancel"
                                  >
                                    <X size={16} />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button 
                                    onClick={() => handleEditReport(report)}
                                    className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-none transition-all"
                                    title="Edit Report"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteReport(report.id)}
                                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-none transition-all"
                                    title="Delete Report"
                                  >
                                    <X size={16} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {allReports.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                          No reports have been added yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'approvals' && (
          <motion.div 
            key="approvals"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-none shadow-sm border border-slate-200 overflow-hidden"
          >
            <div className="p-6 border-b border-slate-50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">Pending Approvals</h3>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-slate-50 rounded-none text-slate-400 hover:text-slate-900 transition-colors">
                  <Filter size={18} />
                </button>
                <button className="p-2 hover:bg-slate-50 rounded-none text-slate-400 hover:text-slate-900 transition-colors">
                  <Search size={18} />
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400">
                  <tr>
                    <th className="px-6 py-3 font-bold uppercase tracking-wider text-[9px]">Client</th>
                    <th className="px-6 py-3 font-bold uppercase tracking-wider text-[9px]">Date</th>
                    <th className="px-6 py-3 font-bold uppercase tracking-wider text-[9px]">Amount</th>
                    <th className="px-6 py-3 font-bold uppercase tracking-wider text-[9px]">Status</th>
                    <th className="px-6 py-3 font-bold uppercase tracking-wider text-[9px] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {withdrawals.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-none bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-[10px]">
                            {item.user_name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{item.user_name}</p>
                            <p className="text-[9px] text-slate-400 uppercase">ID: #{item.user_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-medium">{formatDate(item.request_date)}</td>
                      <td className="px-6 py-4 font-extrabold text-slate-900">{formatCurrency(item.amount)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-none text-[10px] font-bold uppercase tracking-wide ${
                          item.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                          item.status === 'rejected' ? 'bg-red-50 text-red-600 border border-red-100' :
                          'bg-amber-50 text-amber-600 border border-amber-100'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-none ${
                            item.status === 'approved' ? 'bg-emerald-500' :
                            item.status === 'rejected' ? 'bg-red-500' :
                            'bg-amber-500'
                          }`}></span>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {item.status === 'pending' ? (
                            <>
                              <button 
                                onClick={() => handleStatusUpdate(item.id, 'approved')}
                                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-none hover:bg-emerald-500 hover:text-white transition-all text-[10px] font-bold uppercase tracking-wide"
                              >
                                <Check size={12} /> Approve
                              </button>
                              <button 
                                onClick={() => handleStatusUpdate(item.id, 'rejected')}
                                className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-none hover:bg-red-500 hover:text-white transition-all text-[10px] font-bold uppercase tracking-wide"
                              >
                                <X size={12} /> Reject
                              </button>
                            </>
                          ) : (
                            <span className="text-slate-300 text-[10px] font-bold uppercase tracking-widest self-center mr-2">Completed</span>
                          )}
                          <button 
                            onClick={() => handleDeleteWithdrawal(item.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-none transition-all"
                            title="Delete Request"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
