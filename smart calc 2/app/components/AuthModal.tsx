import React from 'react';
import { X, Mail, LogIn } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { cn } from './ui/utils'; // Assuming cn is available here or I'll use a direct import

export function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { signInWithGoogle } = useAuth();

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      onClose();
    } catch (error) {
      alert("Failed to sign in with Google. Please check your Firebase configuration.");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#1e1e2f] border border-slate-700 rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <LogIn className="w-6 h-6 text-blue-400" />
              Sign In
            </h2>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <p className="text-slate-400 mb-8">
            Sign in to save your calculation history and access them from any device.
          </p>

          <div className="space-y-4">
            <button
              onClick={handleGoogleSignIn}
              className="w-full py-3 px-4 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-xl flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-lg"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
              Continue with Google
            </button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#1e1e2f] px-2 text-slate-500">Coming soon</span>
              </div>
            </div>

            <button
              disabled
              className="w-full py-3 px-4 bg-slate-800 text-slate-500 font-bold rounded-xl flex items-center justify-center gap-3 cursor-not-allowed opacity-50"
            >
              <Mail className="w-5 h-5" />
              Sign in with Email
            </button>
          </div>

          <p className="mt-8 text-center text-xs text-slate-500">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
