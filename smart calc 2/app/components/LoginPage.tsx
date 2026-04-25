import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { Calculator, LogIn, Sparkles, BrainCircuit, Globe, ArrowRight } from 'lucide-react';
import { cn } from './ui/utils';

export function LoginPage() {
  const { signInWithGoogle, loginAsGuest, signInWithEmail, signUpWithEmail, needsVerification, verificationEmail, verifyCode, resendCode } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  const [isMounting, setIsMounting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);

  useEffect(() => {
    setIsMounting(true);
  }, []);

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

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    const newOtp = [...otpCode];
    newOtp[index] = value;
    setOtpCode(newOtp);

    // Auto-focus next
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const code = otpCode.join('');
    if (code.length < 6) return;
    
    setIsLoading(true);
    const success = await verifyCode(code);
    if (!success) {
      setError("Invalid verification code. Please try again.");
      setOtpCode(['', '', '', '', '', '']);
    }
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-[#0A0A14] flex items-center justify-center overflow-hidden font-sans">
      {/* Background Tech Touches */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full animate-pulse delay-700"></div>
        
        {/* Animated Grid */}
        <div 
          className="absolute inset-0 opacity-[0.03]" 
          style={{ 
            backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
            backgroundSize: '40px 40px' 
          }}
        ></div>

        {/* Floating Particles/Shapes */}
        <div className="absolute inset-0 pointer-events-none">
           {[...Array(6)].map((_, i) => (
             <div 
               key={i}
               className="absolute w-24 h-24 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl blur-xl animate-float"
               style={{
                 left: `${Math.random() * 80 + 10}%`,
                 top: `${Math.random() * 80 + 10}%`,
                 animationDelay: `${i * 2}s`,
                 animationDuration: `${15 + i * 5}s`
               }}
             />
           ))}
        </div>
      </div>

      <div className={cn(
        "relative z-10 w-full max-w-[480px] p-6 transition-all duration-1000 transform",
        isMounting ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
      )}>
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-2xl shadow-blue-900/40 mb-4 group transition-transform hover:scale-110">
            <Calculator className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 tracking-tight mb-1">
            SMART<span className="text-blue-500">CALC</span>
          </h1>
          <p className="text-slate-400 font-medium tracking-widest uppercase text-[10px]">
            The Next Generation Mathematical Engine
          </p>
        </div>

        {/* Login/Verification Card */}
        <div className="bg-slate-900/40 backdrop-blur-2xl border border-white/10 rounded-[32px] p-8 shadow-2xl overflow-hidden relative group">
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
          
          <div className="relative z-10">
            {!needsVerification ? (
              <>
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      {isSignUp ? 'Create Account' : 'Welcome Back'}
                      <Sparkles className="w-5 h-5 text-amber-400" />
                    </h2>
                    <p className="text-slate-400 text-xs mt-1">
                      {isSignUp ? 'Join the community today' : 'Sign in to continue'}
                    </p>
                  </div>
                  <button 
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-wider"
                  >
                    {isSignUp ? 'Log In' : 'Sign Up'}
                  </button>
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 animate-in fade-in zoom-in duration-300">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                    <p className="text-xs font-medium text-red-400 leading-tight">{error}</p>
                  </div>
                )}

                <form onSubmit={handleManualAuth} className="space-y-4 mb-6">
                  {isSignUp && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                      <input 
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 transition-all"
                      />
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                    <input 
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Password</label>
                    <input 
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] shadow-lg shadow-blue-900/20"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4" />
                        <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                      </>
                    )}
                  </button>
                </form>

                <div className="flex items-center gap-4 mb-6">
                  <div className="h-px flex-1 bg-white/5"></div>
                  <span className="text-[10px] uppercase font-bold text-slate-600 tracking-widest">or continue with</span>
                  <div className="h-px flex-1 bg-white/5"></div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    className="h-12 bg-white hover:bg-slate-50 text-slate-950 rounded-xl font-bold flex items-center justify-center gap-2 transition-all transform active:scale-[0.98]"
                  >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-4 h-4" />
                    <span className="text-xs">Google</span>
                  </button>
                  <button
                    type="button"
                    onClick={loginAsGuest}
                    className="h-12 bg-slate-800/50 hover:bg-slate-800 text-slate-200 rounded-xl font-bold flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] border border-white/5"
                  >
                    <LogIn className="w-4 h-4 text-blue-400" />
                    <span className="text-xs">Demo</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
                    <BrainCircuit className="w-8 h-8 text-blue-400 animate-pulse" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Verify your email</h2>
                  <p className="text-slate-400 text-sm">
                    We've sent a 6-digit code to <br/>
                    <span className="text-blue-400 font-medium">{verificationEmail}</span>
                  </p>
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <p className="text-xs font-medium text-red-400">{error}</p>
                  </div>
                )}

                <div className="flex justify-between gap-2 mb-8">
                  {otpCode.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-${idx}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      className="w-12 h-14 bg-white/5 border border-white/10 rounded-xl text-center text-xl font-bold text-white focus:outline-none focus:border-blue-500 transition-all"
                    />
                  ))}
                </div>

                <button
                  onClick={handleVerifyOtp}
                  disabled={isLoading || otpCode.some(d => !d)}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-bold mb-6 transition-all transform active:scale-[0.98]"
                >
                  {isLoading ? "Verifying..." : "Verify Code"}
                </button>

                <div className="text-center">
                  <p className="text-slate-500 text-xs mb-2">Didn't receive the code?</p>
                  <button 
                    onClick={resendCode}
                    className="text-blue-400 hover:text-blue-300 text-xs font-bold uppercase tracking-widest"
                  >
                    Resend Code
                  </button>
                </div>
              </div>
            )}
            
            {/* Security & Features */}
            <div className="mt-8 pt-6 border-t border-white/5">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-px flex-1 bg-white/5"></div>
                <span className="text-[10px] uppercase font-bold text-slate-600 tracking-widest">Enterprise Security</span>
                <div className="h-px flex-1 bg-white/5"></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 bg-white/5 p-2.5 rounded-xl border border-white/5">
                  <BrainCircuit className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-[10px] font-bold text-slate-300">Advanced Logic</span>
                </div>
                <div className="flex items-center gap-2 bg-white/5 p-2.5 rounded-xl border border-white/5">
                  <Globe className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-[10px] font-bold text-slate-300">Cloud Sync</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center">
           <div className="flex justify-center gap-6 text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-4">
              <span className="hover:text-slate-300 cursor-pointer transition-colors">Documentation</span>
              <span className="hover:text-slate-300 cursor-pointer transition-colors">Security</span>
              <span className="hover:text-slate-300 cursor-pointer transition-colors">Support</span>
           </div>
           <p className="text-slate-600 text-[10px]">
             &copy; 2026 SMARTCALC OS. POWERED BY MATHENGINE.
           </p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        .animate-float {
          animation: float linear infinite;
        }
      `}} />
    </div>
  );
}
