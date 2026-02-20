import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Upload, CheckCircle, FileUp, AlertCircle, Trash2, Database } from 'lucide-react';
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
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Data Ingestion</h2>
          <p className="text-slate-500 mt-1 text-sm font-medium">Upload royalty records manually or via bulk Excel files.</p>
        </div>
        
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          <button 
            onClick={() => setIsBulk(false)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${!isBulk ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Single Entry
          </button>
          <button 
            onClick={() => setIsBulk(true)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${isBulk ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20' : 'text-slate-400 hover:text-slate-600'}`}
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
            className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200"
          >
            <form onSubmit={handleSingleSubmit} className="space-y-6">
              {message && (
                <div className="bg-brand-50 text-brand-600 p-3 rounded-xl flex items-center gap-2 text-sm font-bold border border-brand-100">
                  <CheckCircle size={18} />
                  {message}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Target Client</label>
                  <select
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                    className="modern-input"
                    required
                  >
                    <option value="">Select Client Account</option>
                    {clients.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name} (@{c.username})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Transaction Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="modern-input"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Royalty Amount</label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="modern-input !pl-8"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Revenue Source</label>
                  <input
                    type="text"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="modern-input"
                    placeholder="e.g. Spotify, Apple Music"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Internal Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="modern-input h-24 resize-none py-3"
                  placeholder="Provide detailed context..."
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10 modern-button"
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
            <div className="bg-white p-10 rounded-2xl shadow-sm border border-slate-200 border-dashed border-2 flex flex-col items-center justify-center text-center group hover:border-brand-500/50 transition-colors">
              <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 mb-4 group-hover:scale-105 transition-transform">
                <FileUp size={32} />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">Upload Spreadsheet</h3>
              <p className="text-slate-500 mt-1 max-w-md text-sm font-medium">
                Columns: <span className="text-slate-900 font-bold">username, amount, date, source, description</span>.
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
                className="mt-6 bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 cursor-pointer transition-all shadow-lg shadow-slate-900/10 modern-button"
              >
                Select File
              </label>
            </div>

            {bulkData.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
              >
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900">Preview Data</h3>
                    <p className="text-xs text-slate-500 font-medium">{bulkData.length} records detected</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setBulkData([])}
                      className="p-2 text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                    <button 
                      onClick={handleBulkSubmit}
                      className="bg-brand-500 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-brand-600 transition-all shadow-md shadow-brand-500/20"
                    >
                      Process & Upload
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="px-6 py-3 font-bold uppercase tracking-wider">Client</th>
                        <th className="px-6 py-3 font-bold uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 font-bold uppercase tracking-wider">Source</th>
                        <th className="px-6 py-3 font-bold uppercase tracking-wider text-right">Amount</th>
                        <th className="px-6 py-3 font-bold uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {bulkData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-3">
                            <p className="font-bold text-slate-900">{row.client_name}</p>
                            <p className="text-[9px] font-bold text-slate-400">@{row.username}</p>
                          </td>
                          <td className="px-6 py-3 font-medium text-slate-600">{row.date}</td>
                          <td className="px-6 py-3 font-medium text-slate-900">{row.source}</td>
                          <td className="px-6 py-3 text-right font-extrabold text-brand-600">${row.amount}</td>
                          <td className="px-6 py-3">
                            {row.isValid ? (
                              <span className="text-emerald-500 flex items-center gap-1 font-bold">
                                <CheckCircle size={12} /> Valid
                              </span>
                            ) : (
                              <span className="text-red-500 flex items-center gap-1 font-bold">
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
