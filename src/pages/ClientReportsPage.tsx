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
    <main className="space-y-8 pb-12 animate-fade-in" aria-label="Financial Reports">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-bold text-[10px] uppercase tracking-widest mb-2">
            <FileText size={14} aria-hidden="true" />
            <span>Statements</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Financial Reports</h1>
          <p className="text-slate-500 mt-1.5 text-sm font-medium">Official monthly revenue statements and balance sheets.</p>
        </div>
        
        <div className="ga-search-bar w-full md:w-96">
          <Search size={18} className="text-[#5f6368]" aria-hidden="true" />
          <input 
            type="text" 
            placeholder="Search statements..." 
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="ga-search-input" 
            aria-label="Search statements"
          />
        </div>
      </header>

      <section className="google-table-container" aria-label="Reports Ledger">
        <div className="p-6 border-b border-[#f1f3f4] flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-[#f8f9fa]">
          <div>
            <h2 className="text-base font-medium text-[#202124]">Revenue Ledger</h2>
            <p className="text-[11px] text-[#70757a] font-medium uppercase tracking-wider mt-0.5">Detailed breakdown of gross revenue and net earnings</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-medium text-[#5f6368] bg-white px-3 py-1 rounded border border-[#dadce0] uppercase tracking-wider">
              {filteredReports.length} Statements
            </span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="google-table">
            <thead>
              <tr>
                <th>Period</th>
                <th className="text-right">Gross Revenue</th>
                <th className="text-right">Share</th>
                <th className="text-right">Deductions</th>
                <th className="text-right bg-[#f1f3f4]/50">Net Earnings</th>
                <th className="text-right">Document</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              ) : currentReports.length > 0 ? (
                currentReports.map((report: any, idx: number) => {
                  const share = user?.revenueShare ?? stats?.sharePercent ?? 0;
                  const formatted = formatReportRow(report, share);
                  
                  return (
                    <motion.tr 
                      key={report.id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * idx }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded bg-[#f1f3f4] flex items-center justify-center text-[#5f6368] shrink-0">
                            <Calendar size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#202124]">
                              {new Date(report.start_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </p>
                            <p className="text-[10px] text-[#70757a]">
                              {formatDate(report.start_date)} - {formatDate(report.end_date)}
                            </p>
                          </div>
                        </div>
                      </td>
                      
                      <td className="text-right">
                        <span className="text-sm text-[#3c4043]">
                          {formatCurrency(formatted.gross, user?.currency)}
                        </span>
                      </td>
                      
                      <td className="text-right">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded bg-[#f1f3f4] text-[#5f6368] text-[10px] font-medium border border-[#dadce0]">
                          {share}%
                        </span>
                      </td>
                      
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1 text-[#d93025]">
                          <ArrowDownRight size={14} />
                          <span className="text-sm font-medium">
                            {formatCurrency(formatted.deductions, user?.currency)}
                          </span>
                        </div>
                      </td>
                      
                      <td className="text-right bg-[#f8f9fa]/50">
                        <div className="flex items-center justify-end gap-1 text-[#1e8e3e]">
                          <ArrowUpRight size={16} />
                          <span className="text-base font-medium tracking-tight">
                            {formatCurrency(formatted.net, user?.currency)}
                          </span>
                        </div>
                      </td>
                      
                      <td className="text-right">
                        <button 
                          onClick={() => downloadUploadedReport(report.id, report.filename)}
                          className="modern-button inline-flex items-center gap-2 py-1.5"
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
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-[#dadce0] gap-4">
                      <div className="w-12 h-12 bg-[#f8f9fa] rounded-full flex items-center justify-center">
                        <FileText size={24} className="opacity-20" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-[#70757a] uppercase tracking-widest">No statements found</p>
                        <p className="text-[11px] mt-1 text-[#5f6368]">
                          {searchTerm ? "Try adjusting your search terms." : "Monthly reports will appear here once generated."}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {!isLoading && totalPages > 1 && (
          <footer className="p-4 border-t border-[#f1f3f4] flex items-center justify-between bg-white">
            <p className="text-[10px] font-medium text-[#70757a] uppercase tracking-wider">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredReports.length)} of {filteredReports.length}
            </p>
            <nav className="flex gap-2" aria-label="Pagination">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="modern-button p-1.5"
                aria-label="Previous page"
              >
                <ChevronLeft size={16} aria-hidden="true" />
              </button>
              <div className="flex items-center px-4 text-[11px] font-medium text-[#3c4043] bg-[#f8f9fa] rounded border border-[#dadce0]">
                Page {currentPage} of {totalPages}
              </div>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="modern-button p-1.5"
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
