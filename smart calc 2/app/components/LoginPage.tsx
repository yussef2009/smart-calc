import React, { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { LogIn, Sparkles, BrainCircuit, Globe, Mail, Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';

import { motion, AnimatePresence, useMotionValue, useSpring } from 'motion/react';
import { useEffect } from 'react';

export function LoginPage() {
  const { signInWithGoogle, loginAsGuest, signInWithEmail, signUpWithEmail } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Mouse tracking for interactive background
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for mouse movement
  const springConfig = { damping: 25, stiffness: 150 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  const mathSymbols = ['+', '−', '×', '÷', '√', 'π', '∫', 'Σ', '∞', '∆', 'θ', 'λ'];

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
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Animated Gradient Mesh Blobs */}
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-blue-600/15 blur-[120px] rounded-full"
        />
        <motion.div
          animate={{
            x: [0, -80, 0],
            y: [0, 120, 0],
            scale: [1.1, 0.9, 1.1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-600/15 blur-[120px] rounded-full"
        />
        <motion.div
          animate={{
            x: [0, 40, 0],
            y: [0, -60, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[100px] rounded-full"
        />

        {/* Mouse Following Glow */}
        <motion.div
          style={{
            x: smoothX,
            y: smoothY,
            translateX: '-50%',
            translateY: '-50%',
          }}
          className="absolute w-[600px] h-[600px] bg-blue-500/10 blur-[150px] rounded-full"
        />
        
        {/* Subtle Grid with Radial Mask */}
        <div 
          className="absolute inset-0 opacity-[0.07]" 
          style={{ 
            backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
            maskImage: 'radial-gradient(circle at center, black, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(circle at center, black, transparent 80%)'
          }}
        />

        {/* Floating Mathematical Symbols */}
        {[
          '+', '−', '×', '÷', '√', 'π', '∫', 'Σ', '∞', '∆', 'θ', 'λ',
          'lim', 'sin', 'cos', 'tan', 'log', 'ln', 'f(x)', 'dy/dx',
          '∂', '∇', '≡', '≈', '≠', '≤', '≥', '±', '∓'
        ].map((symbol, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * 100 + '%', 
              y: '110%',
              opacity: 0,
              rotate: Math.random() * 360,
              scale: 0.5
            }}
            animate={{
              y: '-10%',
              x: [null, `${(Math.random() * 20 - 10) + (i * 13) % 100}%`],
              opacity: [0, 0.25, 0.25, 0],
              rotate: [null, Math.random() * 720 - 360],
              scale: [0.5, 1.2, 0.5]
            }}
            transition={{
              duration: Math.random() * 15 + 15,
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * -30
            }}
            className="absolute text-2xl font-mono font-bold text-blue-300/40 pointer-events-none select-none"
            style={{ fontSize: `${14 + (i % 8) * 4}px` }}
          >
            {symbol}
          </motion.div>
        ))}

        {/* Animated Particles (Enhanced) */}
        {[...Array(40)].map((_, i) => (
          <motion.div
            key={`p-${i}`}
            initial={{ 
              x: Math.random() * 100 + '%', 
              y: '110%',
              opacity: Math.random() * 0.5
            }}
            animate={{
              y: '-10%',
              opacity: [0, 0.6, 0],
              x: [null, `+=${(Math.random() - 0.5) * 150}`]
            }}
            transition={{
              duration: Math.random() * 10 + 8,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * -10
            }}
            className="absolute w-0.5 h-0.5 bg-blue-400/50 rounded-full"
            style={{ boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)' }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-[440px] px-6 flex flex-col items-center">
        {/* Logo Section */}
        <motion.div 
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-12"
        >
          <div className="relative inline-block mb-6">
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
                className="w-24 h-24 drop-shadow-[0_0_30px_rgba(59,130,246,0.6)] cursor-pointer" 
              />
              <motion.div
                animate={{
                  left: ['-100%', '200%'],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatDelay: 1,
                  ease: "easeInOut",
                }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
              />
            </motion.div>
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-white mb-3">
            SMART<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">CALC</span>
          </h1>
          <p className="text-blue-400/60 text-[10px] font-black uppercase tracking-[0.4em]">
            Next-Gen Mathematical Intelligence
          </p>
        </motion.div>

        {/* Auth Card */}
        <motion.div
          layout
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="w-full bg-[#0d0d16]/40 backdrop-blur-3xl border border-white/10 rounded-[48px] p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] overflow-hidden relative group"
        >
          {/* Edge Highlight Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
          
          {/* Internal Glows */}
          <div className="absolute -top-32 -left-32 w-64 h-64 bg-blue-600/10 blur-[80px] rounded-full group-hover:bg-blue-600/20 transition-colors duration-1000" />
          <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-purple-600/10 blur-[80px] rounded-full group-hover:bg-purple-600/20 transition-colors duration-1000" />
          
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
                        className="w-full h-14 bg-white/[0.03] hover:bg-white/[0.06] focus:bg-white/[0.08] border border-white/10 focus:border-blue-500/50 rounded-2xl pl-12 pr-4 text-sm text-white placeholder-slate-600 outline-none transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
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
                    className="w-full h-14 bg-white/[0.03] hover:bg-white/[0.06] focus:bg-white/[0.08] border border-white/10 focus:border-blue-500/50 rounded-2xl pl-12 pr-4 text-sm text-white placeholder-slate-600 outline-none transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
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
                    className="w-full h-14 bg-white/[0.03] hover:bg-white/[0.06] focus:bg-white/[0.08] border border-white/10 focus:border-blue-500/50 rounded-2xl pl-12 pr-4 text-sm text-white placeholder-slate-600 outline-none transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ 
                  scale: 1.02,
                  boxShadow: "0 20px 40px -10px rgba(37,99,235,0.5)",
                  filter: "brightness(1.1)"
                }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-[0_10px_20px_-5px_rgba(37,99,235,0.4)] mt-6 relative overflow-hidden group/btn-main"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover/btn-main:translate-x-full transition-transform duration-1000"
                    />
                    <LogIn className="w-5 h-5 group-hover/btn-main:rotate-12 transition-transform" />
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
                whileHover={{ 
                  scale: 1.05, 
                  backgroundColor: "rgba(255,255,255,0.08)",
                  borderColor: "rgba(255,255,255,0.2)"
                }}
                whileTap={{ scale: 0.95 }}
                onClick={handleGoogleSignIn}
                className="h-14 bg-white/[0.03] border border-white/10 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all text-white group/google"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 group-hover/google:scale-110 transition-transform" />
                <span className="text-xs">Google</span>
              </motion.button>
              <motion.button
                whileHover={{ 
                  scale: 1.05, 
                  backgroundColor: "rgba(255,255,255,0.08)",
                  borderColor: "rgba(255,255,255,0.2)"
                }}
                whileTap={{ scale: 0.95 }}
                onClick={loginAsGuest}
                className="h-14 bg-white/[0.03] border border-white/10 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all text-white group/guest"
              >
                <Sparkles className="w-4 h-4 text-blue-400 group-hover/guest:rotate-12 group-hover/guest:scale-110 transition-transform" />
                <span className="text-xs">Guest</span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Features / Trust Badges */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="mt-12 flex flex-wrap justify-center gap-8"
        >
          <div className="flex items-center gap-3 text-slate-500 group/badge cursor-default">
            <div className="w-8 h-8 rounded-xl bg-blue-500/5 border border-white/5 flex items-center justify-center group-hover/badge:bg-blue-500/10 group-hover/badge:border-blue-500/20 transition-all">
              <ShieldCheck className="w-4 h-4 group-hover/badge:text-blue-400 transition-colors" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] group-hover/badge:text-slate-300 transition-colors">Secure Cloud</span>
          </div>
          <div className="flex items-center gap-3 text-slate-500 group/badge cursor-default">
            <div className="w-8 h-8 rounded-xl bg-purple-500/5 border border-white/5 flex items-center justify-center group-hover/badge:bg-purple-500/10 group-hover/badge:border-purple-500/20 transition-all">
              <BrainCircuit className="w-4 h-4 group-hover/badge:text-purple-400 transition-colors" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] group-hover/badge:text-slate-300 transition-colors">AI Reasoning</span>
          </div>
          <div className="flex items-center gap-3 text-slate-500 group/badge cursor-default">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/5 border border-white/5 flex items-center justify-center group-hover/badge:bg-cyan-500/10 group-hover/badge:border-cyan-500/20 transition-all">
              <Globe className="w-4 h-4 group-hover/badge:text-cyan-400 transition-colors" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] group-hover/badge:text-slate-300 transition-colors">Global Sync</span>
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

