import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { Lock, User, ArrowRight, ShieldCheck, DollarSign, Globe, PieChart, Activity, Shield, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    
    setError('');
    setIsLoading(true);
    
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password: password.trim() }),
      });
      
      const data = (await res.json()) as any;
      if (res.ok && data?.success) {
        // Small delay to show success state if needed, or just redirect
        await login(data.user as any);
      } else {
        setError(data?.message || 'Invalid credentials provided');
        setIsLoading(false);
      }
    } catch (err) {
      setError('Connection error. Please check your network.');
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen bg-white flex overflow-hidden font-sans">
      {/* Left Side: Form */}
      <div className="w-full lg:w-[45%] flex flex-col p-8 md:p-12 lg:p-16 justify-center relative z-10 bg-white overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-md w-full mx-auto lg:mx-0"
        >
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-xl shadow-slate-900/10">
              <DollarSign className="text-white" size={28} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Digitalsight Financials</h1>
          </div>

          <div className="mb-10">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-3">Welcome Back</h2>
            <p className="text-slate-500 text-base leading-relaxed">
              Securely access your financial dashboard and manage your royalties with precision.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 text-red-600 text-sm font-medium p-4 rounded-xl border border-red-100 flex items-center gap-3"
              >
                <ShieldCheck size={18} className="shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-10">
                  <User className="text-slate-400 group-focus-within:text-slate-900 transition-colors" size={20} />
                </div>
                <input
                  type="email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent block w-full pl-12 p-4 transition-all outline-none placeholder:text-slate-400"
                  placeholder="Enter your email address"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Password</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-10">
                  <Lock className="text-slate-400 group-focus-within:text-slate-900 transition-colors" size={20} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent block w-full pl-12 p-4 transition-all outline-none placeholder:text-slate-400"
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900" />
                <span className="text-sm font-medium text-slate-500 group-hover:text-slate-700 transition-colors">Remember me</span>
              </label>
              <button type="button" className="text-sm font-bold text-slate-900 hover:underline">Forgot Password?</button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-900 text-white font-bold text-base py-4 rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed mt-4"
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>

      {/* Right Side: Visuals */}
      <div className="hidden lg:flex flex-1 bg-slate-950 relative items-center justify-center overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] bg-indigo-500/20 rounded-full blur-[120px]"></div>
          <div className="absolute -bottom-[20%] -left-[10%] w-[70%] h-[70%] bg-blue-500/20 rounded-full blur-[120px]"></div>
        </div>

        <div className="relative z-10 w-full max-w-2xl px-12">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="space-y-10"
          >
            <div className="space-y-6">
              <h3 className="text-5xl font-bold text-white leading-tight tracking-tight">
                Financial Clarity <br /> 
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">For Modern Labels.</span>
              </h3>
              <p className="text-xl text-slate-400 font-medium leading-relaxed max-w-lg">
                Experience the next generation of royalty tracking, automated reporting, and financial intelligence.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {[
                { icon: Globe, label: 'Global Reach', desc: 'Multi-currency support' },
                { icon: PieChart, label: 'Smart Analytics', desc: 'Real-time visualization' },
                { icon: Activity, label: 'Live Tracking', desc: 'Instant transaction updates' },
                { icon: Shield, label: 'Bank-Grade Security', desc: 'Enterprise data protection' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 + (i * 0.1) }}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 p-4 rounded-2xl hover:bg-white/10 transition-colors"
                >
                  <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 mb-3">
                    <item.icon size={20} />
                  </div>
                  <h4 className="text-white font-bold text-sm mb-1">{item.label}</h4>
                  <p className="text-xs text-slate-400 font-medium">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
