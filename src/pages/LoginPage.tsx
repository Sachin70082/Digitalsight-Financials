import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { Lock, User, ArrowRight, ShieldCheck, DollarSign, Globe, PieChart, Activity, Shield, Loader2, AlertCircle } from 'lucide-react';

declare global {
  interface Window {
    turnstile: any;
  }
}

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const { login } = useAuth();

  useEffect(() => {
    let widgetId: string | undefined;

    const renderTurnstile = () => {
      if (window.turnstile && turnstileRef.current) {
        try {
          widgetId = window.turnstile.render(turnstileRef.current, {
            sitekey: '0x4AAAAAACfyDL5KmcGEPgJZ',
            callback: (token: string) => {
              setTurnstileToken(token);
              setError('');
            },
            'expired-callback': () => {
              setTurnstileToken(null);
              setError('Security check expired. Please verify again.');
            },
            'error-callback': () => {
              setTurnstileToken(null);
              setError('Security check failed. Please try again.');
            },
          });
        } catch (e) {
          console.error('Turnstile render error:', e);
        }
      }
    };

    if (window.turnstile) {
      renderTurnstile();
    } else {
      (window as any).onloadTurnstileCallback = renderTurnstile;
      
      if (!document.querySelector('script[src*="turnstile/v0/api.js"]')) {
        const script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
    }

    return () => {
      if (widgetId && window.turnstile) {
        window.turnstile.remove(widgetId);
      }
      delete (window as any).onloadTurnstileCallback;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(username.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }

    if (!turnstileToken) {
      setError('Please complete the security check.');
      return;
    }
    
    setError('');
    setIsLoading(true);
    
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: username.trim(), 
          password: password.trim(),
          turnstileToken 
        }),
      });
      
      const data = (await res.json()) as any;
      if (res.ok && data?.success) {
        await login(data.user as any);
      } else {
        setError(data?.message || 'Invalid credentials provided');
        setIsLoading(false);
        if (window.turnstile) {
          window.turnstile.reset();
          setTurnstileToken(null);
        }
      }
    } catch (err) {
      setError('Connection error. Please check your network.');
      setIsLoading(false);
      if (window.turnstile) {
        window.turnstile.reset();
        setTurnstileToken(null);
      }
    }
  };

  return (
    <div className="h-screen w-full flex overflow-hidden font-sans text-[#1E293B] bg-white">
      {/* Left Side: Login Form (30% Width) */}
      <div className="w-full lg:w-[30%] h-full flex flex-col p-8 md:p-12 lg:p-16 justify-center relative z-10 bg-white border-r border-slate-100">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-sm mx-auto"
        >
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-gradient-to-br from-[#1a73e8] to-[#0d47a1] rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
              <DollarSign className="text-white" size={24} />
            </div>
            <span className="text-xl font-bold text-[#0F172A] tracking-tight">Digitalsight Financials</span>
          </div>

          <div className="mb-10">
            <h2 className="text-3xl font-extrabold text-[#0F172A] mb-3 tracking-tight">Sign in</h2>
            <p className="text-sm text-[#64748B] font-medium tracking-wider">Transparent Revenue. Simplified Royalty Accounting.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-50 text-red-600 text-xs font-semibold p-4 rounded-xl border border-red-100 flex items-center gap-3"
              >
                <AlertCircle size={16} />
                <span>{error}</span>
              </motion.div>
            )}
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#475569] uppercase tracking-[0.2em] ml-1">Email Address</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8] group-focus-within:text-[#1a73e8] transition-colors" size={18} />
                <input
                  type="email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full bg-[#F8FAFC] border-2 border-[#F1F5F9] text-[#0F172A] text-sm rounded-xl pl-11 pr-4 py-3.5 focus:bg-white focus:ring-4 focus:ring-blue-600/5 focus:border-[#1a73e8] transition-all outline-none placeholder:text-[#94A3B8] font-medium"
                  placeholder="name@company.com"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#475569] uppercase tracking-[0.2em] ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8] group-focus-within:text-[#1a73e8] transition-colors" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full bg-[#F8FAFC] border-2 border-[#F1F5F9] text-[#0F172A] text-sm rounded-xl pl-11 pr-4 py-3.5 focus:bg-white focus:ring-4 focus:ring-blue-600/5 focus:border-[#1a73e8] transition-all outline-none placeholder:text-[#94A3B8] font-medium"
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            

            <div className="flex justify-center py-2">
              <div ref={turnstileRef} className="scale-90 origin-center"></div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !turnstileToken}
              className="w-full bg-[#0F172A] text-white font-bold text-sm py-4 rounded-xl hover:bg-[#1E293B] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-slate-900/10 flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <><Loader2 size={18} className="animate-spin" /> Verifying...</>
              ) : (
                <><Shield size={18} /> Sign In</>
              )}
            </button>
            
            <div className="pt-6 text-center">
              <p className="text-xs text-[#64748B] font-medium">
  New to Digitalsight?{" "}
  <a
    href="https://www.digitalsight.in/contact"
    target="_blank"
    rel="noopener noreferrer"
    className="text-[#1a73e8] font-bold hover:underline"
  >
    Request Access
  </a>
</p>
            </div>
          </form>
        </motion.div>
      </div>

      {/* Right Side: Impressive Visuals (70% Width) */}
      <div className="hidden lg:flex w-[70%] h-full bg-[#0F172A] relative items-center justify-center p-24 overflow-hidden">
        {/* Animated Background Gradients */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-[-10%] right-[-5%] w-[60%] h-[60%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] left-[-5%] w-[60%] h-[60%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
        
        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>

        <div className="relative z-10 w-full max-w-4xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="space-y-8"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-widest">
                <ShieldCheck size={14} />
                <span>Enterprise Security Enabled</span>
              </div>
              <h3 className="text-6xl font-extrabold text-white leading-[1.05] tracking-tight">
                Master your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">royalties</span> with precision.
              </h3>
              <p className="text-xl text-white leading-relaxed font-medium max-w-md opacity-90">
                The most advanced financial ecosystem for modern labels and digital creators.
              </p>
              
              <div className="pt-4 flex items-center gap-6">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="w-12 h-12 rounded-full border-4 border-[#0F172A] bg-slate-800 flex items-center justify-center overflow-hidden">
                      <img src={`https://i.pravatar.cc/100?img=${i+20}`} alt="User" />
                    </div>
                  ))}
                </div>
                <div className="text-sm">
                  <p className="text-white font-bold">500+ Global Labels</p>
                  <p className="text-white opacity-70 font-medium">Trust Digitalsight daily</p>
                </div>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 gap-6">
              {[
                { icon: Activity, title: 'Real-time Analytics', desc: 'Instant insights into your streaming performance.', color: 'text-blue-400', bg: 'bg-blue-500/10' },
                { icon: PieChart, title: 'Smart Distribution', desc: 'Automated revenue sharing and global payouts.', color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
                { icon: Globe, title: 'Global Reach', desc: 'Manage assets across 150+ territories seamlessly.', color: 'text-emerald-400', bg: 'bg-emerald-500/10' }
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + (i * 0.1), duration: 0.6 }}
                  whileHover={{ x: 10, backgroundColor: 'rgba(255,255,255,0.08)' }}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[32px] flex items-start gap-6 transition-all cursor-default"
                >
                  <div className={`w-14 h-14 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center shrink-0 shadow-lg`}>
                    <item.icon size={28} />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-xl mb-1">{item.title}</h4>
                    <p className="text-white opacity-80 text-sm font-medium leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
