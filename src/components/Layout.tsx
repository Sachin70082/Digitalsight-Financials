import { useAuth } from '../context/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, LayoutDashboard, FileText, DollarSign, Settings, Users, Upload, Bell, Search, Menu, X, CheckCircle2 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { formatDate } from '../lib/utils';

export default function Layout() {
  const { user, logout, isLoading } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/client/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications((data || []) as any[]);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async () => {
    try {
      await fetch('/api/client/notifications/read', { method: 'POST' });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const latestUnread = notifications.find(n => !n.is_read);

  if (isLoading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium animate-pulse">Initializing Digitalsight-Financials...</p>
      </div>
    </div>
  );
  
  if (!user) return <Navigate to="/login" />;

  const adminLinks = [
    { icon: LayoutDashboard, label: 'Overview', path: '/admin' },
    { icon: FileText, label: 'Financial Reports', path: '/admin/reports' },
    { icon: Users, label: 'Client Management', path: '/admin/clients' },
  ];

  const clientLinks = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: FileText, label: 'Financial Reports', path: '/reports' },
    { icon: DollarSign, label: 'Withdraw Funds', path: '/withdrawals' },
    { icon: Settings, label: 'Account Settings', path: '/settings' },
  ];

  const links = (user.role === 'Owner' || user.role === 'Employee') ? adminLinks : clientLinks;

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans text-slate-900 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col relative z-20">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/20">
              <DollarSign className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-slate-900">Digitalsight</h1>
              <span className="text-[9px] font-bold uppercase tracking-widest text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">Financials</span>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          <p className="px-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3">Main Menu</p>
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group text-sm ${
                  isActive 
                    ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20 font-semibold' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-brand-500 transition-colors'} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto">
          <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-brand-600 font-bold border border-slate-100 text-xs">
                {user.name.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{user.role}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-all modern-button"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-14 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4 lg:hidden">
            <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl">
              <Menu size={20} />
            </button>
            <h1 className="text-base font-bold">Digitalsight</h1>
          </div>

          <div className="hidden md:flex items-center bg-slate-100 rounded-xl px-3 py-1.5 w-80 border border-slate-200/50 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all">
            <Search size={16} className="text-slate-400" />
            <input type="text" placeholder="Search transactions..." className="bg-transparent border-none focus:ring-0 text-xs w-full ml-2 text-slate-600 placeholder:text-slate-400" />
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button 
                onClick={() => {
                  setIsNotificationOpen(!isNotificationOpen);
                  if (!isNotificationOpen && unreadCount > 0) markAsRead();
                }}
                className={`p-2 rounded-xl transition-colors relative ${isNotificationOpen ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>

              <AnimatePresence>
                {isNotificationOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setIsNotificationOpen(false)}></div>
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 z-40 overflow-hidden"
                    >
                      <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Notifications</h3>
                        {unreadCount > 0 && (
                          <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
                            {unreadCount} New
                          </span>
                        )}
                      </div>
                      <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length > 0 ? (
                          notifications.map((notif) => (
                            <div key={notif.id} className={`p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors flex gap-3 ${!notif.is_read ? 'bg-brand-50/30' : ''}`}>
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${notif.type === 'revenue' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                {notif.type === 'revenue' ? <DollarSign size={16} /> : <Bell size={16} />}
                              </div>
                              <div>
                                <p className="text-xs font-medium text-slate-900 leading-relaxed">{notif.message}</p>
                                <p className="text-[10px] text-slate-400 mt-1">{formatDate(notif.created_at)}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-8 text-center">
                            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
                              <CheckCircle2 size={24} />
                            </div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">All caught up!</p>
                          </div>
                        )}
                      </div>
                      {notifications.length > 0 && (
                        <div className="p-3 bg-slate-50/50 border-t border-slate-50 text-center">
                          <button className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest">View All Activity</button>
                        </div>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            <div className="h-6 w-[1px] bg-slate-200 mx-1 hidden sm:block"></div>
            <div className="hidden sm:flex items-center gap-2">
              <div className="text-right">
                <div className="flex items-center justify-end gap-2">
                  {user.role === 'Label Admin' && user.revenueShare !== undefined && (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100">
                      {user.revenueShare}% Share
                    </span>
                  )}
                  <p className="text-xs font-bold text-slate-900">{user.name}</p>
                </div>
                <p className="text-[9px] font-bold text-brand-600 uppercase">{user.currency} Account</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600 font-bold border border-brand-100 text-xs">
                {user.name.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-[#F8FAFC]">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="p-4 lg:p-6 max-w-[1600px] mx-auto"
          >
            <Outlet />
          </motion.div>
        </main>

        {/* Push Notification Toast */}
        <AnimatePresence>
          {latestUnread && !isNotificationOpen && (
            <motion.div
              initial={{ opacity: 0, x: 100, y: 20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className="fixed bottom-6 right-6 z-50 w-80 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-white/10 flex gap-4 items-start"
            >
              <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-brand-500/20">
                <Bell size={20} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-white mb-1">New Update</p>
                <p className="text-[11px] text-slate-300 leading-relaxed mb-3">{latestUnread.message}</p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsNotificationOpen(true)}
                    className="text-[10px] font-bold bg-white text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-all"
                  >
                    View Details
                  </button>
                  <button 
                    onClick={markAsRead}
                    className="text-[10px] font-bold text-slate-400 hover:text-white px-2 py-1.5 transition-all"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
              <button onClick={markAsRead} className="text-slate-500 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-80 bg-white z-50 lg:hidden flex flex-col shadow-2xl"
            >
              <div className="p-5 flex items-center justify-between border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-brand-500 rounded-lg flex items-center justify-center">
                    <DollarSign className="text-white" size={16} />
                  </div>
                  <h1 className="text-base font-bold">Digitalsight</h1>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg">
                  <X size={18} />
                </button>
              </div>
              <nav className="flex-1 p-3 space-y-1">
                {links.map((link) => {
                  const Icon = link.icon;
                  const isActive = location.pathname === link.path;
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                        isActive 
                          ? 'bg-brand-500 text-white font-semibold shadow-md shadow-brand-500/15' 
                          : 'text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <Icon size={18} />
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
