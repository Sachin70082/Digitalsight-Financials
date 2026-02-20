import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate } from '../lib/utils';
import { FileText, FileDown, Calendar, Search, Filter, ChevronLeft, ChevronRight, Download, TrendingUp, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatReportRow } from '../lib/calculations';

export default function ClientReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [statsRes, reportsRes] = await Promise.all([
        fetch(`/api/client/stats?t=${Date.now()}`),
        fetch('/api/client/reports')
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (reportsRes.ok) {
        const reportsData = await reportsRes.json();
        const sortedData = ((reportsData || []) as any[]).sort((a, b) => 
          new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
        );
        setReports(sortedData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const filteredReports = useMemo(() => {
    if (!searchTerm) return reports;
    return reports.filter(r => 
      r.filename?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formatDate(r.start_date).toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [reports, searchTerm]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentReports = filteredReports.slice(startIndex, startIndex + itemsPerPage);

  const SkeletonRow = () => (
    <tr className="animate-pulse border-b border-slate-100">
      <td className="px-6 py-5"><div className="h-4 bg-slate-100 rounded-none w-32"></div></td>
      <td className="px-6 py-5"><div className="h-4 bg-slate-100 rounded-none w-24 ml-auto"></div></td>
      <td className="px-6 py-5"><div className="h-4 bg-slate-100 rounded-none w-16 ml-auto"></div></td>
      <td className="px-6 py-5"><div className="h-4 bg-slate-100 rounded-none w-24 ml-auto"></div></td>
      <td className="px-6 py-5"><div className="h-5 bg-slate-200 rounded-none w-28 ml-auto"></div></td>
      <td className="px-6 py-5 text-right"><div className="h-8 bg-slate-100 rounded-none w-24 ml-auto"></div></td>
    </tr>
  );

  return (
    <main className="space-y-6 pb-12" aria-label="Financial Reports">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-brand-600 font-bold text-[10px] uppercase tracking-widest mb-1">
            <FileText size={14} aria-hidden="true" />
            <span>Statements</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Financial Reports</h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">Official monthly revenue statements and balance sheets.</p>
        </div>
        
        <div className="flex items-center bg-white border border-slate-200 rounded-none px-3 py-2 w-full md:w-80 shadow-sm focus-within:ring-2 focus-within:ring-brand-500/20 transition-all">
          <Search size={16} className="text-slate-400" aria-hidden="true" />
          <input 
            type="text" 
            placeholder="Search statements..." 
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-transparent border-none focus:ring-0 text-sm w-full ml-2 text-slate-600 placeholder:text-slate-400" 
            aria-label="Search statements"
          />
        </div>
      </header>

      <section className="bg-white rounded-none shadow-sm border border-slate-200 overflow-hidden" aria-label="Reports Ledger">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-slate-50/50">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Revenue Ledger</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Detailed breakdown of gross revenue, deductions, and net earnings.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-slate-500 bg-white px-3 py-1.5 rounded-none border border-slate-200 shadow-sm uppercase tracking-widest">
              {filteredReports.length} Statements
            </span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b-2 border-slate-200">
                <th className="px-6 py-4 text-xs font-extrabold text-slate-400 uppercase tracking-widest">Period</th>
                <th className="px-6 py-4 text-xs font-extrabold text-slate-400 uppercase tracking-widest text-right">Gross Revenue</th>
                <th className="px-6 py-4 text-xs font-extrabold text-slate-400 uppercase tracking-widest text-right">Share</th>
                <th className="px-6 py-4 text-xs font-extrabold text-slate-400 uppercase tracking-widest text-right">Deductions</th>
                <th className="px-6 py-4 text-xs font-extrabold text-slate-900 uppercase tracking-widest text-right bg-slate-50/50">Net Earnings</th>
                <th className="px-6 py-4 text-xs font-extrabold text-slate-400 uppercase tracking-widest text-right">Document</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              ) : currentReports.length > 0 ? (
                currentReports.map((report: any) => {
                  const share = user?.revenueShare ?? stats?.sharePercent ?? 0;
                  const formatted = formatReportRow(report, share);
                  
                  return (
                    <motion.tr 
                      key={report.id} 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-none bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors shrink-0">
                            <Calendar size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">
                              {new Date(report.start_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                              {formatDate(report.start_date)} - {formatDate(report.end_date)}
                            </p>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-5 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-sm font-bold text-slate-600 font-mono">
                            {formatCurrency(formatted.gross, user?.currency)}
                          </span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-5 text-right">
                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-none bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">
                          {share}%
                        </span>
                      </td>
                      
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-1.5 text-red-500">
                          <ArrowDownRight size={14} />
                          <span className="text-sm font-bold font-mono">
                            {formatCurrency(formatted.deductions, user?.currency)}
                          </span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-5 text-right bg-slate-50/30 group-hover:bg-brand-50/30 transition-colors">
                        <div className="flex items-center justify-end gap-1.5 text-emerald-600">
                          <ArrowUpRight size={16} />
                          <span className="text-base font-extrabold font-mono tracking-tight">
                            {formatCurrency(formatted.net, user?.currency)}
                          </span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-5 text-right">
                        <button 
                          onClick={() => downloadUploadedReport(report.id, report.filename)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-none hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm text-xs font-bold focus:ring-2 focus:ring-offset-2 focus:ring-slate-900"
                          aria-label={`Download statement for ${formatDate(report.start_date)}`}
                        >
                          <Download size={14} aria-hidden="true" />
                          <span>Download</span>
                        </button>
                      </td>
                    </motion.tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <FileText size={40} className="mb-4 opacity-20" />
                      <p className="text-base font-bold text-slate-600">No statements found</p>
                      <p className="text-sm mt-1">
                        {searchTerm ? "Try adjusting your search terms." : "Monthly reports will appear here once generated."}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {!isLoading && totalPages > 1 && (
          <footer className="p-4 border-t border-slate-100 flex items-center justify-between bg-white">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredReports.length)} of {filteredReports.length}
            </p>
            <nav className="flex gap-2" aria-label="Pagination">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 bg-white border border-slate-200 rounded-none text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all focus:ring-2 focus:ring-brand-500"
                aria-label="Previous page"
              >
                <ChevronLeft size={16} aria-hidden="true" />
              </button>
              <div className="flex items-center px-4 text-xs font-bold text-slate-900 bg-slate-50 rounded-none border border-slate-100">
                Page {currentPage} of {totalPages}
              </div>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 bg-white border border-slate-200 rounded-none text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all focus:ring-2 focus:ring-brand-500"
                aria-label="Next page"
              >
                <ChevronRight size={16} aria-hidden="true" />
              </button>
            </nav>
          </footer>
        )}
      </section>
    </main>
  );
}
