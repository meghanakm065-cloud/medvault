import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError } from '../lib/firebase';
import { UserRole, UserProfile, OperationType } from '../types';
import { Shield, User, Stethoscope, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<UserRole>('patient');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRoleSelect, setShowRoleSelect] = useState(false);
  const [pendingGoogleUser, setPendingGoogleUser] = useState<any>(null);
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    setError('');
    // We update loading state AFTER triggering the popup in some cases to avoid blocker,
    // but here we'll keep it for UI feedback and just handle the error better.
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data() as UserProfile;
        if (userData.role === 'doctor') navigate('/doctor/dashboard');
        else navigate('/patient/dashboard');
      } else {
        // New user from Google, need role
        setPendingGoogleUser(result.user);
        setShowRoleSelect(true);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-blocked') {
        setError('The sign-in popup was blocked by your browser. Please enable popups for this site and try again.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in window was closed. Please try again.');
      } else if (err.message && err.message.includes('Cross-Origin-Opener-Policy')) {
        setError('Security policy blocked the login. This often happens in preview mode. Click the "Open in new tab" icon at the top right to log in securely.');
      } else {
        setError(err.message || 'Google Sign-In failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelection = async (selectedRole: UserRole) => {
    if (!pendingGoogleUser) return;
    setLoading(true);
    try {
      const newUser: UserProfile = {
        uid: pendingGoogleUser.uid,
        name: pendingGoogleUser.displayName || 'Google User',
        email: pendingGoogleUser.email || '',
        role: selectedRole,
        sharingEnabled: true,
        onboarded: false
      };
      await setDoc(doc(db, 'users', pendingGoogleUser.uid), newUser);
      navigate('/onboarding');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${pendingGoogleUser.uid}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        let userDoc;
        try {
          userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `users/${userCredential.user.uid}`);
          return;
        }
        
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserProfile;
          if (userData.role === 'doctor') navigate('/doctor/dashboard');
          else navigate('/patient/dashboard');
        } else {
          navigate('/onboarding');
        }
      } else {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const newUser: UserProfile = {
            uid: userCredential.user.uid,
            name,
            email,
            role,
            sharingEnabled: true,
            onboarded: false
          };
          await setDoc(doc(db, 'users', userCredential.user.uid), newUser);
          navigate('/onboarding');
        } catch (err: any) {
          if (err.code === 'auth/operation-not-allowed') {
            throw new Error('Email/Password signup is not enabled in Firebase Console. Please use Google Sign-In or enable it in the console.');
          }
          throw err;
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (showRoleSelect) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-2xl p-8 text-center border border-slate-100"
        >
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Welcome to MedVault</h2>
          <p className="text-slate-500 text-sm mb-8 font-medium">Please select your primary role to continue</p>
          
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleRoleSelection('patient')}
              className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50 transition-all group"
            >
              <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                <User className="w-6 h-6" />
              </div>
              <span className="text-sm font-black text-slate-700 uppercase tracking-tight">Patient</span>
            </button>
            <button
              onClick={() => handleRoleSelection('doctor')}
              className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50 transition-all group"
            >
              <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                <Stethoscope className="w-6 h-6" />
              </div>
              <span className="text-sm font-black text-slate-700 uppercase tracking-tight">Doctor</span>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-10">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden"
      >
        <div className="bg-blue-600 p-10 text-white text-center relative overflow-hidden">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" 
          />
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter">MedVault</h1>
            <p className="text-blue-100 mt-2 font-medium opacity-80 uppercase text-[10px] tracking-[0.2em]">Secure Health Protocol</p>
          </div>
        </div>

        <div className="p-8">
          <div className="flex bg-slate-100 rounded-2xl p-1.5 mb-8">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isLogin ? 'bg-white shadow-xl text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${!isLogin ? 'bg-white shadow-xl text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Join
            </button>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-4 bg-white border-2 border-slate-100 rounded-2xl font-bold text-slate-700 hover:border-blue-100 hover:bg-slate-50 transition-all mb-8 shadow-sm group"
          >
            <div className="w-6 h-6 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </div>
            <span>Continue with Google</span>
          </button>

          <div className="relative mb-8 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <span className="relative px-4 bg-white text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Or use identity</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="grid grid-cols-2 gap-4 mb-4">
                <button
                  type="button"
                  onClick={() => setRole('patient')}
                  className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${role === 'patient' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-50 text-slate-400'}`}
                >
                  <User className="w-5 h-5" />
                  <span className="text-[10px] font-black uppercase tracking-tight">Patient</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('doctor')}
                  className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${role === 'doctor' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-50 text-slate-400'}`}
                >
                  <Stethoscope className="w-5 h-5" />
                  <span className="text-[10px] font-black uppercase tracking-tight">Doctor</span>
                </button>
              </div>
            )}

            {!isLogin && (
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Full Name"
                  required
                  className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-xs font-bold"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="email"
                placeholder="Email Address"
                required
                className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-xs font-bold"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="password"
                placeholder="Password"
                required
                className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-xs font-bold"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start gap-2 bg-red-50 p-3 rounded-xl border border-red-100"
              >
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-red-800 font-bold leading-normal">{error}</p>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-slate-200 disabled:opacity-50 mt-6 uppercase tracking-[0.2em] text-[10px]"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Initialize System' : 'Create Access'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
