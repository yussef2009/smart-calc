import React, { useState } from 'react';
import { useAuth } from '../lib/AuthContext';

import { LogIn, Sparkles, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { Turnstile } from '@marsidev/react-turnstile';

import { motion, AnimatePresence } from 'motion/react';


export function LoginPage() {
  const { signInWithGoogle, loginAsGuest, signInWithEmail, signUpWithEmail } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);


  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      setError(error.message || "Failed to sign in. Please check your configuration.");
    }
  };

  const handleManualAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (import.meta.env.VITE_TURNSTILE_SITE_KEY && !turnstileToken) {
      setError("Please verify you are human.");
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password, name, turnstileToken || undefined);
      } else {
        await signInWithEmail(email, password, turnstileToken || undefined);
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-transparent flex items-center justify-center overflow-hidden font-sans selection:bg-blue-500/30 selection:text-white">


      <div className="relative z-10 w-full max-w-[440px] px-6 flex flex-col items-center">
        {/* Logo Section */}
        <motion.div 
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-8"
        >
          <div className="relative inline-block mb-4">
            <motion.div
              animate={{ 
                rotate: 360,
                scale: [1, 1.1, 1],
              }}
              transition={{ 
                rotate: { duration: 60, repeat: Infinity, ease: "linear" },
                scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
              }}
              className="absolute -inset-6 bg-gradient-to-r from-blue-600/30 via-indigo-500/20 to-purple-600/30 blur-2xl rounded-full"
            />
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              className="relative"
            >
              <img 
                src="/logo.png" 
                alt="SmartCalc Logo" 
                className="w-20 h-20 drop-shadow-[0_0_30px_rgba(59,130,246,0.6)] cursor-pointer" 
              />
            </motion.div>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-white mb-2">
            SMART<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">CALC</span>
          </h1>
          <p className="text-blue-400/60 text-[8px] font-black uppercase tracking-[0.4em]">
            Precision Mathematical Intelligence
          </p>
        </motion.div>

        {/* Auth Card */}
        <motion.div
          layout
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="w-full bg-[#0d0d16]/40 backdrop-blur-3xl border border-white/10 rounded-[40px] p-8 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] overflow-hidden relative group"
        >
          {/* Edge Highlight Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
          
          <div className="relative z-10">
            <div className="flex justify-between items-baseline mb-6">
              <h2 className="text-xl font-bold text-white">
                {isSignUp ? 'Create Account' : 'Welcome Back'}
              </h2>
              <button 
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-widest flex items-center gap-1 group/btn"
              >
                {isSignUp ? 'Log In' : 'Sign Up'}
                <ArrowRight className="w-3 h-3 transition-transform group-hover/btn:translate-x-1" />
              </button>
            </div>

            {error && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="mb-4 overflow-hidden"
              >
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                  <p className="text-[10px] font-medium text-red-400 leading-tight">{error}</p>
                </div>
              </motion.div>
            )}

            <form onSubmit={handleManualAuth} className="space-y-4">
              <AnimatePresence mode="popLayout">
                {isSignUp && (
                  <motion.div 
                    key="name-field"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 20, opacity: 0 }}
                    className="space-y-1.5"
                  >
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                    <div className="relative group/input">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within/input:text-blue-400 transition-colors" />
                      <input 
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full h-12 bg-white/[0.03] hover:bg-white/[0.06] focus:bg-white/[0.08] border border-white/10 focus:border-blue-500/50 rounded-xl pl-12 pr-4 text-sm text-white placeholder-slate-600 outline-none transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative group/input">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within/input:text-blue-400 transition-colors" />
                  <input 
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full h-12 bg-white/[0.03] hover:bg-white/[0.06] focus:bg-white/[0.08] border border-white/10 focus:border-blue-500/50 rounded-xl pl-12 pr-4 text-sm text-white placeholder-slate-600 outline-none transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">Password</label>
                <div className="relative group/input">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within/input:text-blue-400 transition-colors" />
                  <input 
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-12 bg-white/[0.03] hover:bg-white/[0.06] focus:bg-white/[0.08] border border-white/10 focus:border-blue-500/50 rounded-xl pl-12 pr-4 text-sm text-white placeholder-slate-600 outline-none transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
                  />
                </div>
              </div>

              {/* Cloudflare Turnstile */}
              {import.meta.env.VITE_TURNSTILE_SITE_KEY && (
                <div className="flex justify-center pt-2">
                  <Turnstile 
                    siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY} 
                    onSuccess={setTurnstileToken}
                    options={{ theme: 'dark' }}
                    scriptOptions={{ async: true, defer: true }}
                  />
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-[0_10px_20px_-5px_rgba(37,99,235,0.4)] mt-4"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span className="text-sm">{isSignUp ? 'Get Started' : 'Sign In'}</span>
                  </>
                )}
              </motion.button>
            </form>

            <div className="flex items-center gap-4 my-6">
              <div className="h-px flex-1 bg-white/5" />
              <span className="text-[9px] uppercase font-bold text-slate-600 tracking-[0.2em]">or</span>
              <div className="h-px flex-1 bg-white/5" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleGoogleSignIn}
                className="h-12 bg-white/[0.03] border border-white/10 rounded-xl font-bold flex items-center justify-center gap-3 transition-all text-white group/google"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-4 h-4" />
                <span className="text-[10px]">Google</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={loginAsGuest}
                className="h-12 bg-white/[0.03] border border-white/10 rounded-xl font-bold flex items-center justify-center gap-3 transition-all text-white group/guest"
              >
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span className="text-[10px]">Guest</span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 text-slate-600 text-[8px] font-bold uppercase tracking-[0.2em] text-center"
        >
          &copy; 2026 SMARTCALC OS &bull; Precision & Power
        </motion.p>
      </div>
    </div>
  );
}

