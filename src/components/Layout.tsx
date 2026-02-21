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
    { icon: Bell, label: 'Notifications', path: '/admin/notifications' },
  ];

  const clientLinks = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: FileText, label: 'Financial Reports', path: '/reports' },
    { icon: DollarSign, label: 'Withdraw Funds', path: '/withdrawals' },
    { icon: Settings, label: 'Account Settings', path: '/settings' },
  ];

  const links = (user.role === 'Owner' || user.role === 'Employee') ? adminLinks : clientLinks;

  return (
    <div className="flex h-screen bg-white font-sans text-[#3c4043] overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-[#dadce0] flex-col relative z-20">
        <div className="p-6 mb-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#1a73e8] rounded flex items-center justify-center">
              <DollarSign className="text-white" size={18} />
            </div>
            <div>
              <h1 className="text-lg font-medium text-[#202124] leading-none">Digitalsight</h1>
              <span className="text-[10px] font-medium uppercase tracking-wider text-[#70757a] mt-1 block">Financials V1.0</span>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-r-full transition-all duration-200 group text-sm font-medium ${
                  isActive 
                    ? 'bg-[#e8f0fe] text-[#1a73e8]' 
                    : 'text-[#5f6368] hover:bg-[#f1f3f4] hover:text-[#202124]'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-[#1a73e8]' : 'text-[#5f6368] group-hover:text-[#202124]'} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto border-t border-[#f1f3f4]">
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-[#f1f3f4] flex items-center justify-center text-[#5f6368] font-medium text-sm border border-[#dadce0]">
              {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-[#202124] truncate">{user.name}</p>
              <p className="text-[11px] text-[#70757a]">{user.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-[#5f6368] bg-white border border-[#dadce0] rounded hover:bg-[#f8f9fa] transition-all"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-[#dadce0] px-8 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4 lg:hidden">
            <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-[#5f6368] hover:bg-[#f1f3f4] rounded-full">
              <Menu size={20} />
            </button>
            <h1 className="text-base font-medium text-[#202124]">Digitalsight</h1>
          </div>

          <div className="hidden md:flex items-center bg-[#f1f3f4] rounded-lg px-4 py-2 w-[500px] border border-transparent focus-within:bg-white focus-within:border-[#dadce0] transition-all">
            <Search size={18} className="text-[#5f6368]" />
            <input type="text" placeholder="Search reports, transactions..." className="bg-transparent border-none focus:ring-0 text-sm w-full ml-3 text-[#202124] placeholder:text-[#70757a]" />
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button 
                onClick={() => {
                  setIsNotificationOpen(!isNotificationOpen);
                  if (!isNotificationOpen && unreadCount > 0) markAsRead();
                }}
                className={`p-2 rounded-full transition-colors relative ${isNotificationOpen ? 'bg-[#f1f3f4] text-[#202124]' : 'text-[#5f6368] hover:bg-[#f1f3f4]'}`}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-[#d93025] rounded-full border border-white"></span>
                )}
              </button>

              <AnimatePresence>
                {isNotificationOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setIsNotificationOpen(false)}></div>
                    <motion.div 
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-[#dadce0] z-40 overflow-hidden"
                    >
                      <div className="p-4 border-b border-[#f1f3f4] flex justify-between items-center bg-[#f8f9fa]">
                        <h3 className="text-xs font-medium text-[#202124] uppercase tracking-wider">Notifications</h3>
                        {unreadCount > 0 && (
                          <span className="text-[10px] font-medium text-white bg-[#d93025] px-2 py-0.5 rounded-full">
                            {unreadCount} New
                          </span>
                        )}
                      </div>
                      <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length > 0 ? (
                          notifications.map((notif) => (
                            <div key={notif.id} className={`p-4 border-b border-[#f1f3f4] last:border-0 hover:bg-[#f8f9fa] transition-colors flex gap-3 ${!notif.is_read ? 'bg-[#e8f0fe]/30' : ''}`}>
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${notif.type === 'revenue' ? 'bg-[#e6f4ea] text-[#1e8e3e]' : 'bg-[#e8f0fe] text-[#1a73e8]'}`}>
                                {notif.type === 'revenue' ? <DollarSign size={16} /> : <Bell size={16} />}
                              </div>
                              <div>
                                <p className="text-xs font-normal text-[#3c4043] leading-relaxed">{notif.message}</p>
                                <p className="text-[10px] text-[#70757a] mt-1">{formatDate(notif.created_at)}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-10 text-center">
                            <CheckCircle2 size={24} className="mx-auto mb-3 text-[#dadce0]" />
                            <p className="text-xs font-medium text-[#70757a]">All caught up!</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            <div className="h-8 w-[1px] bg-[#dadce0] mx-2 hidden sm:block"></div>
            <div className="hidden sm:flex items-center gap-3 ml-2">
              <div className="text-right">
                <p className="text-sm font-medium text-[#202124]">{user.name}</p>
                <p className="text-[11px] text-[#1a73e8] font-medium">{user.currency} Account</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#1a73e8] flex items-center justify-center text-white font-medium text-sm">
                {user.name.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-white">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="p-8 lg:p-12 w-full mx-auto"
          >
            <Outlet />
          </motion.div>
        </main>

        {/* Push Notification Toast - Flat */}
        <AnimatePresence>
          {latestUnread && !isNotificationOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-8 right-8 z-50 w-80 bg-[#202124] text-white p-4 rounded-lg shadow-xl flex gap-4 items-start"
            >
              <div className="w-8 h-8 bg-[#1a73e8] rounded flex items-center justify-center shrink-0">
                <Bell size={16} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-white mb-1">New Update</p>
                <p className="text-[11px] text-[#bdc1c6] leading-relaxed mb-3">{latestUnread.message}</p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setIsNotificationOpen(true)}
                    className="text-[10px] font-medium text-[#8ab4f8] hover:underline"
                  >
                    View Details
                  </button>
                  <button 
                    onClick={markAsRead}
                    className="text-[10px] font-medium text-[#bdc1c6] hover:text-white"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
              <button onClick={markAsRead} className="text-[#70757a] hover:text-white">
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
              className="fixed inset-0 bg-[#202124]/40 z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.2 }}
              className="fixed inset-y-0 left-0 w-72 bg-white z-50 lg:hidden flex flex-col shadow-xl"
            >
              <div className="p-6 flex items-center justify-between border-b border-[#f1f3f4]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#1a73e8] rounded flex items-center justify-center">
                    <DollarSign className="text-white" size={18} />
                  </div>
                  <h1 className="text-lg font-medium text-[#202124]">Digitalsight</h1>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-[#5f6368] hover:bg-[#f1f3f4] rounded-full">
                  <X size={20} />
                </button>
              </div>
              <nav className="flex-1 p-2 space-y-0.5">
                {links.map((link) => {
                  const Icon = link.icon;
                  const isActive = location.pathname === link.path;
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-r-full transition-all ${
                        isActive 
                          ? 'bg-[#e8f0fe] text-[#1a73e8]' 
                          : 'text-[#5f6368] hover:bg-[#f1f3f4]'
                      }`}
                    >
                      <Icon size={20} />
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
