import React, { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { MathBackgroundCanvas } from './MathBackgroundCanvas';

import { LogIn, Sparkles, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { Turnstile } from '@marsidev/react-turnstile';

import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'motion/react';
import { useEffect } from 'react';

function FloatingSymbol({ sym, index, mouseX }: { sym: string, index: number, mouseX: any }) {
  const baseX = (index * 13) % 100;
  const x = useTransform(mouseX, [-0.5, 0.5], [`${baseX}%`, `${baseX + 10}%`]);

  return (
    <motion.div
      initial={{ 
        y: '110%',
        opacity: 0,
        rotate: 0,
        scale: 0.5
      }}
      animate={{
        y: '-10%',
        opacity: [0, 0.12, 0.12, 0],
        rotate: [0, (index % 2 === 0 ? 180 : -180)],
        scale: [0.5, 1, 0.5]
      }}
      transition={{
        duration: 25 + (index % 10) * 8,
        repeat: Infinity,
        ease: "linear",
        delay: (index * 1.5) % 20
      }}
      style={{ 
        x,
        fontSize: `${10 + (index % 4) * 4}px`,
        filter: 'blur(0.8px)'
      }}
      className="absolute font-mono font-bold text-blue-300/20 pointer-events-none select-none whitespace-nowrap"
    >
      {sym}
    </motion.div>
  );
}

export function LoginPage() {
  const { signInWithGoogle, loginAsGuest, signInWithEmail, signUpWithEmail } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  // Mouse tracking for interactive background
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  // Smooth springs for mouse movement
  const springConfig = { damping: 50, stiffness: 200 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set((e.clientX / window.innerWidth) - 0.5);
      mouseY.set((e.clientY / window.innerHeight) - 0.5);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

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
    if (!turnstileToken) {
      setError("Please verify you are human.");
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password, name, turnstileToken);
      } else {
        await signInWithEmail(email, password, turnstileToken);
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-transparent flex items-center justify-center overflow-hidden font-sans selection:bg-blue-500/30 selection:text-white">
      <MathBackgroundCanvas />

      {/* Dynamic Background Shapes (High Quality) */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Layer 1: Ambient Mesh Blobs */}
        <motion.div
          animate={{
            x: [0, 150, 0],
            y: [0, 80, 0],
            scale: [1, 1.3, 1],
            rotate: [0, 20, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-25%] left-[-15%] w-[80%] h-[80%] bg-blue-600/10 blur-[140px] rounded-full"
        />
        <motion.div
          animate={{
            x: [0, -120, 0],
            y: [0, 150, 0],
            scale: [1.2, 0.8, 1.2],
            rotate: [0, -15, 0],
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[-20%] right-[-15%] w-[75%] h-[75%] bg-purple-600/10 blur-[140px] rounded-full"
        />
        <motion.div
          animate={{
            opacity: [0.05, 0.15, 0.05],
            scale: [0.8, 1.1, 0.8],
          }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[10%] right-[5%] w-[50%] h-[50%] bg-cyan-400/10 blur-[160px] rounded-full"
        />

        {/* Layer 2: Mouse Reactive Glow */}
        <motion.div
          style={{
            x: smoothX,
            y: smoothY,
            translateX: '-50%',
            translateY: '-50%',
          }}
          className="absolute w-[800px] h-[800px] bg-blue-500/[0.08] blur-[180px] rounded-full"
        />
        
        {/* Layer 3: Cyber Grid */}
        <div 
          className="absolute inset-0 opacity-[0.04]" 
          style={{ 
            backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
            maskImage: 'radial-gradient(circle at center, black 10%, transparent 90%)',
            WebkitMaskImage: 'radial-gradient(circle at center, black 10%, transparent 90%)'
          }}
        />

        {/* Layer 4: Mathematical Symbols */}
        {[
          '+', '−', '×', '÷', '√', 'π', '∫', 'Σ', '∞', '∆', 'θ', 'λ',
          'lim', 'sin', 'cos', 'tan', 'log', 'ln', 'f(x)', 'dy/dx',
          '∂', '∇', '≡', '≈', '≠', '≤', '≥', '±', '∓', '⊕', '⊗', '∫', '∬'
        ].map((sym, i) => (
          <FloatingSymbol 
            key={i} 
            sym={sym} 
            index={i} 
            mouseX={smoothX} 
          />
        ))}

        {/* Layer 5: High Quality Particles */}
        {[...Array(40)].map((_, i) => (
          <motion.div
            key={`p-${i}`}
            initial={{ 
              x: Math.random() * 100 + '%', 
              y: '110%',
              opacity: 0
            }}
            animate={{
              y: '-10%',
              opacity: [0, 0.4, 0],
              x: [null, `+=${(Math.random() - 0.5) * 200}`]
            }}
            transition={{
              duration: Math.random() * 20 + 20,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * -20
            }}
            className="absolute w-0.5 h-0.5 bg-blue-400/40 rounded-full"
            style={{ 
              boxShadow: '0 0 8px 2px rgba(59, 130, 246, 0.3)',
              filter: 'blur(0.2px)'
            }}
          />
        ))}
      </div>

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
              <div className="flex justify-center pt-2">
                <Turnstile 
                  siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'} 
                  onSuccess={setTurnstileToken}
                  options={{ theme: 'dark' }}
                  scriptOptions={{ async: true, defer: true }}
                />
              </div>

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

