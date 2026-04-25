import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { auth, googleProvider } from './firebase';

interface AuthContextType {
  user: any | null;
  loading: boolean;
  needsVerification: boolean;
  verificationEmail: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  verifyCode: (code: string) => Promise<boolean>;
  resendCode: () => Promise<void>;
  loginAsGuest: () => void;
  logout: () => Promise<void>;
  isDemo: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null);
  const [tempUser, setTempUser] = useState<any | null>(null);
  const [correctCode, setCorrectCode] = useState<string>('123456'); // Default for demo

  useEffect(() => {
    // Check local storage for demo user
    const savedUser = localStorage.getItem('smart_calc_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setIsDemo(true);
      setLoading(false);
      return;
    }

    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsDemo(false);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const sendEmailOtp = async (email: string, code: string, name: string = 'User') => {
    try {
        const response = await fetch('http://localhost:5000/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, code, name })
        });
        const result = await response.json();
        if (result.success) {
            console.log("OTP sent via backend successfully");
        }
    } catch (error) {
        console.warn("Backend mail server not reachable. Using local fallback.");
        console.log(`[LOCAL FALLBACK] OTP for ${email}: ${code}`);
    }
  };

  const signInWithGoogle = async () => {
    if (!auth) {
      throw new Error("Firebase is not configured. Please add your API keys to lib/firebase.ts");
    }
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error signing in with Google", error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    if (!auth) {
      // MOCK AUTH logic
      const users = JSON.parse(localStorage.getItem('mock_users') || '[]');
      const userFound = users.find((u: any) => u.email === email && u.password === pass);
      if (userFound) {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setCorrectCode(code);
        setTempUser(userFound);
        setVerificationEmail(email);
        setNeedsVerification(true);
        await sendEmailOtp(email, code, userFound.displayName);
        return;
      } else {
        throw new Error("Invalid email or password in Offline Mode.");
      }
    }
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    if (!auth) {
      // MOCK SIGNUP logic
      const users = JSON.parse(localStorage.getItem('mock_users') || '[]');
      if (users.find((u: any) => u.email === email)) throw new Error("Email already exists.");
      
      const newUser = {
        uid: 'mock_' + Math.random().toString(36).substr(2, 9),
        displayName: name,
        email: email,
        password: pass, // In a real app we'd never store plain text passwords!
        photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
      };
      
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setCorrectCode(code);
      setTempUser(newUser);
      setVerificationEmail(email);
      setNeedsVerification(true);
      await sendEmailOtp(email, code, name);
      return;
    }
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    const { updateProfile, sendEmailVerification } = await import('firebase/auth');
    await updateProfile(res.user, { displayName: name });
    await sendEmailVerification(res.user);
    setVerificationEmail(email);
    setNeedsVerification(true);
  };

  const verifyCode = async (code: string): Promise<boolean> => {
    if (code === correctCode) {
        if (tempUser) {
            // Save mock user only after verification
            if (tempUser.uid.startsWith('mock_')) {
                const users = JSON.parse(localStorage.getItem('mock_users') || '[]');
                if (!users.find((u: any) => u.email === tempUser.email)) {
                    users.push(tempUser);
                    localStorage.setItem('mock_users', JSON.stringify(users));
                }
            }
            localStorage.setItem('smart_calc_user', JSON.stringify(tempUser));
            setUser(tempUser);
            setIsDemo(tempUser.uid.startsWith('mock_'));
        }
        setNeedsVerification(false);
        setTempUser(null);
        return true;
    }
    return false;
  };

  const resendCode = async () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setCorrectCode(code);
    if (verificationEmail) {
        await sendEmailOtp(verificationEmail, code, tempUser?.displayName || 'User');
    }
  };

  const loginAsGuest = () => {
    const guestUser = {
      uid: 'guest_' + Math.random().toString(36).substr(2, 9),
      displayName: 'Guest User',
      email: 'guest@smartcalc.local',
      photoURL: 'https://ui-avatars.com/api/?name=Guest+User&background=0D8ABC&color=fff'
    };
    localStorage.setItem('smart_calc_user', JSON.stringify(guestUser));
    setUser(guestUser);
    setIsDemo(true);
  };

  const logout = async () => {
    try {
      if (auth) await signOut(auth);
      localStorage.removeItem('smart_calc_user');
      setUser(null);
      setIsDemo(false);
      setNeedsVerification(false);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
        user, 
        loading, 
        needsVerification, 
        verificationEmail,
        signInWithGoogle, 
        signInWithEmail, 
        signUpWithEmail, 
        verifyCode,
        resendCode,
        loginAsGuest, 
        logout, 
        isDemo 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
