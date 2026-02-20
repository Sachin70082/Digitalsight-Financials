import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Upload, CheckCircle, FileUp, AlertCircle, Trash2, Database, User, Calendar, DollarSign } from 'lucide-react';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'motion/react';

export default function UploadPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [source, setSource] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');
  const [isBulk, setIsBulk] = useState(false);
  const [bulkData, setBulkData] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/admin/clients')
      .then(res => res.json())
      .then(setClients);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      
      // Validate data structure
      // Expected: { username, amount, date, source, description }
      const processed = data.map((row: any) => {
        const client = clients.find(c => c.username === row.username);
        return {
          ...row,
          user_id: client?.id,
          client_name: client?.name || 'Unknown Client',
          isValid: !!client && row.amount && row.date
        };
      });
      
      setBulkData(processed);
    };
    reader.readAsBinaryString(file);
  };

  const handleBulkSubmit = async () => {
    const validData = bulkData.filter(d => d.isValid);
    if (validData.length === 0) return;

    const res = await fetch('/api/admin/royalties/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ royalties: validData }),
    });

    if (res.ok) {
      setMessage(`Successfully uploaded ${validData.length} records!`);
      setBulkData([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const res = await fetch('/api/admin/royalties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: selectedClient,
        amount: parseFloat(amount),
        date,
        source,
        description
      }),
    });

    if (res.ok) {
      setMessage('Royalty added successfully!');
      setAmount('');
      setDate('');
      setSource('');
      setDescription('');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-medium text-[#202124] tracking-tight">Data Ingestion</h2>
          <p className="text-[#70757a] mt-1 text-sm">Upload royalty records manually or via bulk Excel files.</p>
        </div>
        
        <div className="flex bg-[#f1f3f4] p-1 rounded border border-transparent">
          <button 
            onClick={() => setIsBulk(false)}
            className={`px-4 py-1.5 rounded text-xs font-medium transition-all ${!isBulk ? 'bg-white text-[#1a73e8] shadow-sm' : 'text-[#5f6368] hover:text-[#202124]'}`}
          >
            Single Entry
          </button>
          <button 
            onClick={() => setIsBulk(true)}
            className={`px-4 py-1.5 rounded text-xs font-medium transition-all ${isBulk ? 'bg-white text-[#1a73e8] shadow-sm' : 'text-[#5f6368] hover:text-[#202124]'}`}
          >
            Bulk Excel
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!isBulk ? (
          <motion.div
            key="single"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white p-8 rounded-lg border border-[#dadce0]"
          >
            <form onSubmit={handleSingleSubmit} className="space-y-6">
              {message && (
                <div className="bg-[#e6f4ea] text-[#1e8e3e] p-3 rounded flex items-center gap-2 text-sm font-medium border border-[#ceead6]">
                  <CheckCircle size={18} />
                  {message}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-[#70757a] uppercase tracking-wider ml-1">Target Client</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[#70757a]" size={16} />
                    <select
                      value={selectedClient}
                      onChange={(e) => setSelectedClient(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white border border-[#dadce0] rounded text-sm text-[#202124] focus:outline-none focus:ring-1 focus:ring-[#1a73e8] focus:border-[#1a73e8] transition-all appearance-none"
                      required
                    >
                      <option value="">Select Client Account</option>
                      {clients.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.name} (@{c.username})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-[#70757a] uppercase tracking-wider ml-1">Transaction Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-[#70757a]" size={16} />
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white border border-[#dadce0] rounded text-sm text-[#202124] focus:outline-none focus:ring-1 focus:ring-[#1a73e8] focus:border-[#1a73e8] transition-all"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-[#70757a] uppercase tracking-wider ml-1">Royalty Amount</label>
                  <div className="relative group">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-[#70757a]" size={16} />
                    <input
                      type="number"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white border border-[#dadce0] rounded text-sm text-[#202124] focus:outline-none focus:ring-1 focus:ring-[#1a73e8] focus:border-[#1a73e8] transition-all"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-[#70757a] uppercase tracking-wider ml-1">Revenue Source</label>
                  <div className="relative">
                    <Database className="absolute left-3 top-1/2 -translate-y-1/2 text-[#70757a]" size={16} />
                    <input
                      type="text"
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white border border-[#dadce0] rounded text-sm text-[#202124] focus:outline-none focus:ring-1 focus:ring-[#1a73e8] focus:border-[#1a73e8] transition-all"
                      placeholder="e.g. Spotify, Apple Music"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-[#70757a] uppercase tracking-wider ml-1">Internal Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-[#dadce0] rounded text-sm text-[#202124] focus:outline-none focus:ring-1 focus:ring-[#1a73e8] focus:border-[#1a73e8] transition-all h-24 resize-none"
                  placeholder="Provide detailed context..."
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#1a73e8] text-white font-medium py-2 rounded hover:bg-[#1967d2] active:bg-[#185abc] transition-all flex items-center justify-center gap-2"
              >
                <Database size={18} />
                Commit Record
              </button>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="bulk"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="bg-white p-10 rounded-lg border border-[#dadce0] border-dashed border-2 flex flex-col items-center justify-center text-center group hover:border-[#1a73e8] transition-colors">
              <div className="w-16 h-16 bg-[#e8f0fe] rounded flex items-center justify-center text-[#1a73e8] mb-4 group-hover:scale-105 transition-transform">
                <FileUp size={32} />
              </div>
              <h3 className="text-xl font-medium text-[#202124]">Upload Spreadsheet</h3>
              <p className="text-[#70757a] mt-1 max-w-md text-sm">
                Columns: <span className="text-[#202124] font-medium">username, amount, date, source, description</span>.
              </p>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".xlsx, .xls, .csv"
                className="hidden" 
                id="excel-upload"
              />
              <label 
                htmlFor="excel-upload"
                className="mt-6 bg-[#1a73e8] text-white px-8 py-3 rounded font-medium hover:bg-[#1967d2] cursor-pointer transition-all"
              >
                Select File
              </label>
            </div>

            {bulkData.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg border border-[#dadce0] overflow-hidden"
              >
                <div className="p-6 border-b border-[#f1f3f4] flex justify-between items-center bg-[#f8f9fa]">
                  <div>
                    <h3 className="text-lg font-medium text-[#202124]">Preview Data</h3>
                    <p className="text-xs text-[#70757a]">{bulkData.length} records detected</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setBulkData([])}
                      className="p-2 text-[#d93025] bg-[#fce8e6] rounded hover:bg-[#fad2cf] transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                    <button 
                      onClick={handleBulkSubmit}
                      className="bg-[#1a73e8] text-white px-6 py-2 rounded text-sm font-medium hover:bg-[#1967d2] transition-all"
                    >
                      Process & Upload
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#f8f9fa] text-[#70757a]">
                      <tr>
                        <th className="px-6 py-3 font-medium uppercase tracking-wider">Client</th>
                        <th className="px-6 py-3 font-medium uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 font-medium uppercase tracking-wider">Source</th>
                        <th className="px-6 py-3 font-medium uppercase tracking-wider text-right">Amount</th>
                        <th className="px-6 py-3 font-medium uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f1f3f4]">
                      {bulkData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-[#f8f9fa] transition-colors">
                          <td className="px-6 py-3">
                            <p className="font-medium text-[#202124]">{row.client_name}</p>
                            <p className="text-[9px] text-[#70757a]">@{row.username}</p>
                          </td>
                          <td className="px-6 py-3 text-[#5f6368]">{row.date}</td>
                          <td className="px-6 py-3 text-[#202124]">{row.source}</td>
                          <td className="px-6 py-3 text-right font-medium text-[#1a73e8]">${row.amount}</td>
                          <td className="px-6 py-3">
                            {row.isValid ? (
                              <span className="text-[#1e8e3e] flex items-center gap-1 font-medium">
                                <CheckCircle size={12} /> Valid
                              </span>
                            ) : (
                              <span className="text-[#d93025] flex items-center gap-1 font-medium">
                                <AlertCircle size={12} /> Invalid
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
