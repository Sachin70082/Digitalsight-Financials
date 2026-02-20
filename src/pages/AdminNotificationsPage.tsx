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
    <main className="space-y-8 pb-12 animate-fade-in" aria-label="Admin Notifications">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-bold text-[10px] uppercase tracking-widest mb-2">
            <Bell size={14} aria-hidden="true" />
            <span>System Notifications</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Notification Management</h1>
          <p className="text-slate-500 mt-1.5 text-sm font-medium">View and manage all system notifications sent to clients.</p>
        </div>
        
        <div className="ga-search-bar w-full md:w-96">
          <Search size={18} className="text-[#5f6368]" />
          <input 
            type="text" 
            placeholder="Search notifications..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="ga-search-input" 
            aria-label="Search notifications"
          />
        </div>
      </header>

      <section className="google-table-container">
        <div className="overflow-x-auto">
          <table className="google-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Client</th>
                <th className="px-8">Type</th>
                <th>Message</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-[#dadce0]">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-[#1a73e8] border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-xs font-medium uppercase tracking-widest">Loading...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredNotifications.length > 0 ? (
                filteredNotifications.map((notif) => (
                  <tr key={notif.id}>
                    <td className="text-xs text-[#5f6368] whitespace-nowrap">
                      {formatDate(notif.created_at)}
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#f1f3f4] flex items-center justify-center text-[#5f6368] font-medium text-xs border border-[#dadce0]">
                          {notif.client_name ? notif.client_name.charAt(0) : '?'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#202124]">{notif.client_name || 'Unknown'}</p>
                          <p className="text-[10px] text-[#70757a]">{notif.client_email || `ID: ${notif.user_id}`}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider border ${
                        notif.type === 'revenue' ? 'bg-[#e6f4ea] text-[#1e8e3e] border-[#ceead6]' : 
                        notif.type === 'withdrawal' ? 'bg-[#fef7e0] text-[#ea8600] border-[#feefc3]' : 
                        'bg-[#e8f0fe] text-[#1a73e8] border-[#d2e3fc]'
                      }`}>
                        {notif.type || 'System'}
                      </span>
                    </td>
                    <td className="text-sm text-[#3c4043] max-w-md truncate" title={notif.message}>
                      {notif.message}
                    </td>
                    <td>
                      {notif.is_read ? (
                        <span className="text-[10px] font-medium text-[#70757a] bg-[#f1f3f4] px-2 py-0.5 rounded uppercase">Read</span>
                      ) : (
                        <span className="text-[10px] font-medium text-[#1a73e8] bg-[#e8f0fe] px-2 py-0.5 rounded uppercase">Unread</span>
                      )}
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => deleteNotification(notif.id)}
                        className="p-2 text-[#70757a] hover:text-[#d93025] hover:bg-[#fce8e6] rounded transition-colors"
                        aria-label="Delete notification"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-[#dadce0] gap-4">
                      <Bell size={32} className="opacity-20" />
                      <p className="text-sm font-medium text-[#70757a] uppercase tracking-widest">No notifications</p>
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
