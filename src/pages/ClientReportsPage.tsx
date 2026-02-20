import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate } from '../lib/utils';
import { FileText, FileDown, Calendar, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatReportRow } from '../lib/calculations';

export default function ClientReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    await Promise.all([fetchReports(), fetchStats()]);
    setIsLoading(false);
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/client/stats?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/client/reports');
      if (res.ok) {
        const data = await res.json();
        // Sort by start_date descending
        const sortedData = ((data || []) as any[]).sort((a, b) => 
          new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
        );
        setReports(sortedData);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const downloadUploadedReport = async (reportId: number, filename: string) => {
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

  // Pagination Logic
  const totalPages = Math.ceil(reports.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentReports = reports.slice(startIndex, startIndex + itemsPerPage);

  const SkeletonRow = () => (
    <tr className="animate-pulse">
      <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-32"></div></td>
      <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-20"></div></td>
      <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-12"></div></td>
      <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-20"></div></td>
      <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-20"></div></td>
      <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-40"></div></td>
      <td className="px-6 py-4 text-right"><div className="h-8 bg-slate-100 rounded w-8 ml-auto"></div></td>
    </tr>
  );

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Financial Reports</h2>
          <p className="text-slate-500 mt-1 text-sm font-medium">Access and download your monthly revenue statements.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-900">Monthly Revenue Reports</h3>
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {reports.length} Total Reports
            </span>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-900 transition-colors">
                <Filter size={18} />
              </button>
              <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-900 transition-colors">
                <Search size={18} />
              </button>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400">
              <tr>
                <th className="px-6 py-3 font-bold uppercase tracking-wider text-[9px]">Report Period</th>
                <th className="px-6 py-3 font-bold uppercase tracking-wider text-[9px]">Gross Revenue</th>
                <th className="px-6 py-3 font-bold uppercase tracking-wider text-[9px]">Your Share %</th>
                <th className="px-6 py-3 font-bold uppercase tracking-wider text-[9px]">Deductions</th>
                <th className="px-6 py-3 font-bold uppercase tracking-wider text-[9px]">Net Revenue</th>
                <th className="px-6 py-3 font-bold uppercase tracking-wider text-[9px]">File Name</th>
                <th className="px-6 py-3 font-bold uppercase tracking-wider text-[9px] text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              ) : (
                <>
                  {currentReports.map((report: any) => {
                    const share = user?.revenueShare ?? stats?.sharePercent ?? 0;
                    const formatted = formatReportRow(report, share);
                    return (
                      <tr key={report.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 font-bold text-slate-900">
                            <Calendar size={14} className="text-slate-400" />
                            {formatDate(report.start_date)} - {formatDate(report.end_date)}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-900">{formatCurrency(formatted.gross, user?.currency)}</td>
                        <td className="px-6 py-4 font-bold text-slate-600">{share}%</td>
                        <td className="px-6 py-4 font-bold text-red-500">-{formatCurrency(formatted.deductions, user?.currency)}</td>
                        <td className="px-6 py-4 font-bold text-emerald-600">{formatCurrency(formatted.net, user?.currency)}</td>
                        <td className="px-6 py-4 text-slate-500">{report.filename}</td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => downloadUploadedReport(report.id, report.filename)}
                            className="p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all shadow-sm"
                            title="Download Excel Report"
                          >
                            <FileDown size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {reports.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic">
                        No monthly reports have been generated for your account yet.
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {!isLoading && totalPages > 1 && (
          <div className="p-4 border-t border-slate-50 flex items-center justify-between bg-slate-50/30">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, reports.length)} of {reports.length}
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex items-center px-4 text-xs font-bold text-slate-900">
                Page {currentPage} of {totalPages}
              </div>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
