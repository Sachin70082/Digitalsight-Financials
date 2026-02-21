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
    <div className="space-y-8 pb-12 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-2xl font-medium text-[#202124] tracking-tight">Financial Reports</h2>
          <p className="text-[#70757a] mt-1 text-sm">Manage uploads, approvals, and analytics.</p>
        </div>
        <div className="flex gap-3">
          <button className="modern-button flex items-center gap-2 py-2">
            <Download size={16} />
            Export Data
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto pb-1 gap-6 no-scrollbar border-b border-[#dadce0]">
        {[
          { id: 'analytics', label: 'Analytics & Charts', icon: BarChart3 },
          { id: 'uploads', label: 'Report Entry', icon: FileSpreadsheet },
          { id: 'approvals', label: 'Withdrawal Approvals', icon: Wallet },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-1 py-4 text-sm font-medium transition-all whitespace-nowrap border-b-2 -mb-[2px] ${
              activeTab === tab.id 
                ? 'border-[#1a73e8] text-[#1a73e8]' 
                : 'border-transparent text-[#5f6368] hover:text-[#202124]'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'analytics' && (
          <motion.div 
            key="analytics"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-8 rounded-lg border border-[#dadce0]"
          >
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-lg font-medium text-[#202124]">Revenue vs Withdrawals</h3>
                <p className="text-[10px] text-[#70757a] font-medium uppercase tracking-wider mt-1">Monthly financial performance overview</p>
              </div>
              <div className="flex gap-6">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-[#202124]"></span>
                  <span className="text-[10px] font-medium text-[#5f6368] uppercase tracking-wider">Royalties</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-[#1a73e8]"></span>
                  <span className="text-[10px] font-medium text-[#5f6368] uppercase tracking-wider">Withdrawals</span>
                </div>
              </div>
            </div>
            <div className="h-[420px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f3f4" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#70757a', fontSize: 10, fontWeight: 500 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#70757a', fontSize: 10, fontWeight: 500 }}
                    tickFormatter={(value) => `$${value/1000}k`}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8f9fa' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #dadce0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', padding: '12px' }}
                  />
                  <Bar dataKey="Royalties" fill="#202124" radius={[4, 4, 0, 0]} barSize={32} />
                  <Bar dataKey="Withdrawals" fill="#1a73e8" radius={[4, 4, 0, 0]} barSize={32} />
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
            <div className="bg-white p-8 rounded-lg border border-[#dadce0]">
              <h3 className="text-lg font-medium text-[#202124] mb-6">New Royalty Report</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                <div className="space-y-2">
                  <label className="text-[11px] font-medium text-[#70757a] uppercase tracking-wider ml-1">Client Account</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[#70757a]" size={16} />
                    <select 
                      value={selectedClient}
                      onChange={(e) => setSelectedClient(e.target.value)}
                      className="modern-input pl-10 pr-10 appearance-none"
                    >
                      <option value="">Select Label</option>
                      {labels.map(label => (
                        <option key={label.id} value={label.owner_id}>{label.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2 sm:col-span-2 xl:col-span-1">
                  <label className="text-[11px] font-medium text-[#70757a] uppercase tracking-wider ml-1">Report Period</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-[#70757a]" size={14} />
                      <input 
                        type="date" 
                        value={dateRange.from}
                        onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
                        className="modern-input pl-9 text-xs"
                      />
                    </div>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-[#70757a]" size={14} />
                      <input 
                        type="date" 
                        value={dateRange.to}
                        onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
                        className="modern-input pl-9 text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-medium text-[#70757a] uppercase tracking-wider ml-1">Total Revenue</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-[#70757a]" size={16} />
                    <input 
                      type="number" 
                      step="0.01"
                      value={totalRevenue}
                      onChange={(e) => setTotalRevenue(e.target.value)}
                      placeholder="0.00"
                      className="modern-input pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-medium text-[#70757a] uppercase tracking-wider ml-1">Data File</label>
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
                      className={`w-full flex items-center justify-center gap-2 py-2.5 border border-dashed rounded-lg cursor-pointer transition-all text-sm font-medium ${
                        excelFile 
                          ? 'bg-[#e6f4ea] border-[#ceead6] text-[#1e8e3e]' 
                          : 'bg-[#f8f9fa] border-[#dadce0] text-[#5f6368] hover:bg-[#f1f3f4]'
                      }`}
                    >
                      {excelFile ? (
                        <><Check size={16} /> <span className="truncate max-w-[100px]">{excelFile.name}</span></>
                      ) : (
                        <><Upload size={16} /> Choose File</>
                      )}
                    </label>
                  </div>
                </div>
              </div>

              {excelData.length > 0 && (
                <div className="google-table-container mb-6">
                  <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#dadce0] flex justify-between items-center">
                    <span className="text-[10px] font-medium text-[#70757a] uppercase tracking-wider">Preview ({excelData.length} rows)</span>
                  </div>
                  <div className="overflow-x-auto max-h-[300px]">
                    <table className="google-table">
                      <thead>
                        <tr>
                          {Object.keys(excelData[0] || {}).map((key) => (
                            <th key={key}>{key}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {excelData.slice(0, 10).map((row, i) => (
                          <tr key={i}>
                            {Object.values(row).map((val: any, j) => (
                              <td key={j} className="text-xs">{String(val)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {excelData.length > 10 && (
                      <div className="p-2 text-center text-[10px] font-medium text-[#70757a] uppercase tracking-wider bg-[#f8f9fa] border-t border-[#dadce0]">
                        ...and {excelData.length - 10} more rows
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-6 border-t border-[#dadce0]">
                <button 
                  onClick={processReportUpload}
                  disabled={isUploading || !excelFile}
                  className="primary-button flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  Submit Report
                </button>
              </div>
            </div>

            {/* Report History Table */}
            <div className="google-table-container">
              <div className="p-6 border-b border-[#f1f3f4] bg-[#f8f9fa] flex justify-between items-center">
                <div>
                  <h3 className="text-base font-medium text-[#202124]">Report History</h3>
                  <p className="text-xs text-[#70757a] mt-0.5">Manage previously uploaded statements</p>
                </div>
                <span className="text-[10px] font-medium text-[#5f6368] bg-white px-3 py-1 rounded border border-[#dadce0] uppercase tracking-wider">{allReports.length} Total Reports</span>
              </div>
              <div className="overflow-x-auto">
                <table className="google-table">
                  <thead>
                    <tr>
                      <th>Client</th>
                      <th>Period</th>
                      <th>Revenue</th>
                      <th>File Name</th>
                      <th>Uploaded At</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allReports.map((report: any, idx: number) => {
                      const label = labels.find(l => String(l.owner_id) === String(report.user_id));
                      const share = label?.revenue_share ?? 0;
                      const formatted = formatReportRow(report, share);
                      
                      return (
                        <tr key={report.id}>
                          <td>
                            {editingReportId === report.id ? (
                              <select 
                                value={editFormData.user_id}
                                onChange={(e) => setEditFormData({...editFormData, user_id: e.target.value})}
                                className="modern-input py-1 text-xs"
                              >
                                {labels.map(label => (
                                  <option key={label.id} value={label.owner_id}>{label.name}</option>
                                ))}
                              </select>
                            ) : (
                              <>
                                <div className="font-medium text-[#202124] text-sm">{report.client_name}</div>
                                <div className="text-[10px] text-[#70757a]">{report.client_email}</div>
                              </>
                            )}
                          </td>
                          <td className="text-[#5f6368] font-medium text-xs">
                            {editingReportId === report.id ? (
                              <div className="flex gap-2">
                                <input 
                                  type="date" 
                                  value={editFormData.start_date}
                                  onChange={(e) => setEditFormData({...editFormData, start_date: e.target.value})}
                                  className="modern-input py-1 text-[10px]"
                                />
                                <input 
                                  type="date" 
                                  value={editFormData.end_date}
                                  onChange={(e) => setEditFormData({...editFormData, end_date: e.target.value})}
                                  className="modern-input py-1 text-[10px]"
                                />
                              </div>
                            ) : (
                              `${formatDate(report.start_date)} - ${formatDate(report.end_date)}`
                            )}
                          </td>
                          <td>
                            {editingReportId === report.id ? (
                              <input 
                                type="number" 
                                step="0.01"
                                value={editFormData.total_revenue}
                                onChange={(e) => setEditFormData({...editFormData, total_revenue: e.target.value})}
                                className="modern-input py-1 text-xs"
                              />
                            ) : (
                              <div className="flex flex-col">
                                <span className="font-medium text-[#202124] text-sm">{formatCurrency(formatted.gross)}</span>
                                <span className="text-[9px] text-[#70757a] font-medium uppercase">Net: {formatCurrency(formatted.net)} ({share}%)</span>
                              </div>
                            )}
                          </td>
                          <td>
                            <button 
                              onClick={() => handleDownloadReport(report.id, report.filename)}
                              className="flex items-center gap-2 text-[#1a73e8] font-medium text-xs hover:underline transition-all"
                            >
                              <FileSpreadsheet size={16} />
                              <span className="truncate max-w-[150px]">{report.filename}</span>
                            </button>
                          </td>
                          <td className="text-[#70757a] text-xs">{formatDate(report.created_at)}</td>
                          <td className="text-right">
                            <div className="flex justify-end gap-2">
                              {editingReportId === report.id ? (
                                <>
                                  <button 
                                    onClick={handleSaveEdit}
                                    className="p-1.5 text-[#1e8e3e] hover:bg-[#e6f4ea] rounded transition-all"
                                    title="Save Changes"
                                  >
                                    <Save size={16} />
                                  </button>
                                  <button 
                                    onClick={() => setEditingReportId(null)}
                                    className="p-1.5 text-[#70757a] hover:bg-[#f1f3f4] rounded transition-all"
                                    title="Cancel"
                                  >
                                    <X size={16} />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button 
                                    onClick={() => handleEditReport(report)}
                                    className="p-1.5 text-[#1a73e8] hover:bg-[#e8f0fe] rounded transition-all"
                                    title="Edit Report"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteReport(report.id)}
                                    className="p-1.5 text-[#d93025] hover:bg-[#fce8e6] rounded transition-all"
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
                        <td colSpan={6} className="px-6 py-16 text-center text-[#dadce0] italic">
                          <div className="flex flex-col items-center gap-3">
                            <FileSpreadsheet size={32} className="opacity-20" />
                            <p className="text-xs font-medium uppercase tracking-widest">No reports found</p>
                          </div>
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="google-table-container overflow-hidden"
          >
            <div className="p-6 border-b border-[#f1f3f4] bg-[#f8f9fa] flex justify-between items-center">
              <div>
                <h3 className="text-base font-medium text-[#202124]">Pending Approvals</h3>
                <p className="text-xs text-[#70757a] mt-0.5">Review and process withdrawal requests</p>
              </div>
              <div className="flex gap-3">
                <button className="modern-button p-2">
                  <Filter size={18} />
                </button>
                <button className="modern-button p-2">
                  <Search size={18} />
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="google-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map((item: any, idx: number) => (
                    <motion.tr 
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * idx }}
                      key={item.id} 
                    >
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded bg-[#f1f3f4] flex items-center justify-center text-[#5f6368] font-medium text-xs border border-[#dadce0]">
                            {item.user_name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="font-medium text-[#202124] text-sm">{item.user_name}</p>
                            <p className="text-[10px] text-[#70757a]">ID: #{item.user_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-[#5f6368] text-xs">{formatDate(item.request_date)}</td>
                      <td className="font-medium text-[#202124] text-base">{formatCurrency(item.amount)}</td>
                      <td>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider border ${
                          item.status === 'approved' ? 'bg-[#e6f4ea] text-[#1e8e3e] border-[#ceead6]' :
                          item.status === 'rejected' ? 'bg-[#fce8e6] text-[#d93025] border-[#f9d2ce]' :
                          'bg-[#fef7e0] text-[#ea8600] border-[#feefc3]'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="flex justify-end gap-2">
                          {item.status === 'pending' ? (
                            <>
                              <button 
                                onClick={() => handleStatusUpdate(item.id, 'approved')}
                                className="modern-button py-1 text-[10px] text-[#1e8e3e] hover:bg-[#e6f4ea] border-[#ceead6]"
                              >
                                Approve
                              </button>
                              <button 
                                onClick={() => handleStatusUpdate(item.id, 'rejected')}
                                className="modern-button py-1 text-[10px] text-[#d93025] hover:bg-[#fce8e6] border-[#f9d2ce]"
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <span className="text-[#bdc1c6] text-[10px] font-medium uppercase tracking-wider mr-2">Processed</span>
                          )}
                          <button 
                            onClick={() => handleDeleteWithdrawal(item.id)}
                            className="p-1.5 text-[#70757a] hover:text-[#d93025] hover:bg-[#fce8e6] rounded transition-all"
                            title="Delete Request"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                  {withdrawals.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-12 h-12 bg-[#f8f9fa] rounded-full flex items-center justify-center">
                            <Wallet size={24} className="opacity-20" />
                          </div>
                          <p className="text-xs font-medium text-[#70757a] uppercase tracking-widest">No pending requests</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
