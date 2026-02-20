import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../lib/utils';
import { Bell, Trash2, Search, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function AdminNotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications((data || []) as any[]);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const deleteNotification = async (id: number) => {
    if (!confirm('Are you sure you want to delete this notification?')) return;
    
    try {
      const res = await fetch(`/api/admin/notifications/${id}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        setNotifications(prev => prev.filter(n => n.id !== id));
      } else {
        alert('Failed to delete notification');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      alert('An error occurred while deleting the notification');
    }
  };

  const filteredNotifications = notifications.filter(n => 
    n.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.client_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="space-y-6 pb-12" aria-label="Admin Notifications">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-brand-600 font-bold text-[10px] uppercase tracking-widest mb-1">
            <Bell size={14} aria-hidden="true" />
            <span>System Notifications</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Notification Management</h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">View and manage all system notifications sent to clients.</p>
        </div>
        
        <div className="flex items-center bg-white border border-slate-200 rounded-none px-3 py-2 w-full md:w-80 shadow-sm focus-within:ring-2 focus-within:ring-brand-500/20 transition-all">
          <Search size={16} className="text-slate-400" aria-hidden="true" />
          <input 
            type="text" 
            placeholder="Search notifications..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none focus:ring-0 text-sm w-full ml-2 text-slate-600 placeholder:text-slate-400" 
            aria-label="Search notifications"
          />
        </div>
      </header>

      <section className="bg-white rounded-none shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Client</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Message</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    <div className="flex justify-center mb-2">
                      <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    Loading notifications...
                  </td>
                </tr>
              ) : filteredNotifications.length > 0 ? (
                filteredNotifications.map((notif) => (
                  <motion.tr 
                    key={notif.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-slate-50 transition-colors group"
                  >
                    <td className="p-4 text-sm text-slate-600 whitespace-nowrap">
                      {formatDate(notif.created_at)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-none bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs shrink-0">
                          {notif.client_name ? notif.client_name.charAt(0) : '?'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{notif.client_name || 'Unknown'}</p>
                          <p className="text-[10px] text-slate-500">{notif.client_email || `ID: ${notif.user_id}`}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-none text-[10px] font-bold uppercase tracking-wider ${
                        notif.type === 'revenue' ? 'bg-emerald-50 text-emerald-600' : 
                        notif.type === 'withdrawal' ? 'bg-amber-50 text-amber-600' : 
                        'bg-blue-50 text-blue-600'
                      }`}>
                        {notif.type || 'System'}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-700 max-w-md truncate" title={notif.message}>
                      {notif.message}
                    </td>
                    <td className="p-4">
                      {notif.is_read ? (
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-none uppercase">Read</span>
                      ) : (
                        <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-1 rounded-none uppercase">Unread</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => deleteNotification(notif.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-none transition-colors"
                        aria-label="Delete notification"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <AlertCircle size={32} className="mb-3 opacity-50" />
                      <p className="text-sm font-medium">No notifications found</p>
                      {searchTerm && <p className="text-xs mt-1">Try adjusting your search</p>}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}