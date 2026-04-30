import React, { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { LogIn, Sparkles, BrainCircuit, Globe, Mail, Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';

import { motion, AnimatePresence } from 'motion/react';

export function LoginPage() {
  const { signInWithGoogle, loginAsGuest, signInWithEmail, signUpWithEmail } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
    setError(null);
    setIsLoading(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password, name);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#020205] flex items-center justify-center overflow-hidden font-sans selection:bg-blue-500/30 selection:text-white">
      {/* Dynamic Background Shapes */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            x: [0, 50, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] bg-blue-600/20 blur-[120px] rounded-full"
        />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, -45, 0],
            x: [0, -30, 0],
            y: [0, 40, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-purple-600/20 blur-[120px] rounded-full"
        />
        
        {/* Subtle Grid */}
        <div 
          className="absolute inset-0 opacity-[0.05]" 
          style={{ 
            backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)`,
            backgroundSize: '50px 50px' 
          }}
        />

        {/* Animated Particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * window.innerWidth, 
              y: Math.random() * window.innerHeight,
              opacity: Math.random() * 0.5
            }}
            animate={{
              y: [null, Math.random() * -100 - 50],
              opacity: [null, 0]
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute w-1 h-1 bg-white rounded-full"
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-[440px] px-6 flex flex-col items-center">
        {/* Logo Section */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-10"
        >
          <div className="relative inline-block mb-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-xl rounded-full"
            />
            <img 
              src="/logo.png" 
              alt="SmartCalc Logo" 
              className="relative w-20 h-20 drop-shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-transform hover:scale-110" 
            />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white mb-2">
            SMART<span className="text-blue-500">CALC</span>
          </h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.3em]">
            Professional Math Engine
          </p>
        </motion.div>

        {/* Auth Card */}
        <motion.div
          layout
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full bg-[#0d0d16]/80 backdrop-blur-3xl border border-white/10 rounded-[40px] p-10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden relative group"
        >
          {/* Internal Glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/10 blur-[60px] rounded-full group-hover:bg-blue-500/20 transition-colors duration-700" />
          
          <div className="relative z-10">
            <div className="flex justify-between items-baseline mb-8">
              <h2 className="text-2xl font-bold text-white">
                {isSignUp ? 'Create Account' : 'Welcome Back'}
              </h2>
              <button 
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-widest flex items-center gap-1 group/btn"
              >
                {isSignUp ? 'Log In' : 'Sign Up'}
                <ArrowRight className="w-3 h-3 transition-transform group-hover/btn:translate-x-1" />
              </button>
            </div>

            {error && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="mb-6 overflow-hidden"
              >
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                  <p className="text-xs font-medium text-red-400 leading-tight">{error}</p>
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
                    className="space-y-2"
                  >
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                    <div className="relative group/input">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within/input:text-blue-400 transition-colors" />
                      <input 
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full h-13 bg-white/[0.03] hover:bg-white/[0.06] focus:bg-white/[0.08] border border-white/10 focus:border-blue-500/50 rounded-2xl pl-12 pr-4 text-sm text-white placeholder-slate-600 outline-none transition-all"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative group/input">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within/input:text-blue-400 transition-colors" />
                  <input 
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full h-13 bg-white/[0.03] hover:bg-white/[0.06] focus:bg-white/[0.08] border border-white/10 focus:border-blue-500/50 rounded-2xl pl-12 pr-4 text-sm text-white placeholder-slate-600 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Password</label>
                <div className="relative group/input">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within/input:text-blue-400 transition-colors" />
                  <input 
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-13 bg-white/[0.03] hover:bg-white/[0.06] focus:bg-white/[0.08] border border-white/10 focus:border-blue-500/50 rounded-2xl pl-12 pr-4 text-sm text-white placeholder-slate-600 outline-none transition-all"
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full h-14 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-[0_10px_20px_-5px_rgba(37,99,235,0.4)] mt-4"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    <span>{isSignUp ? 'Get Started' : 'Sign In'}</span>
                  </>
                )}
              </motion.button>
            </form>

            <div className="flex items-center gap-4 my-8">
              <div className="h-px flex-1 bg-white/5" />
              <span className="text-[10px] uppercase font-bold text-slate-600 tracking-[0.2em]">or</span>
              <div className="h-px flex-1 bg-white/5" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <motion.button
                whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.1)" }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGoogleSignIn}
                className="h-13 bg-white/[0.03] border border-white/10 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all text-white"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                <span className="text-xs">Google</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.1)" }}
                whileTap={{ scale: 0.98 }}
                onClick={loginAsGuest}
                className="h-13 bg-white/[0.03] border border-white/10 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all text-white"
              >
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span className="text-xs">Guest</span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Features / Trust Badges */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-10 flex flex-wrap justify-center gap-6"
        >
          <div className="flex items-center gap-2 text-slate-500">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Secure Cloud</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <BrainCircuit className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">AI Reasoning</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <Globe className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Global Sync</span>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-12 text-slate-600 text-[10px] font-bold uppercase tracking-[0.2em] text-center"
        >
          &copy; 2026 SMARTCALC OS &bull; Precision & Power
        </motion.p>
      </div>
    </div>
  );
}

