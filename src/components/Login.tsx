import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { WILAYAS, SPECIALTIES, LEVELS } from '../constants';
import { GraduationCap, Key, Feather, User, Mail, Lock, Briefcase, MapPin, GraduationCap as CapIcon, Chrome } from 'lucide-react';

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    wilaya: WILAYAS[0],
    specialty: SPECIALTIES[0],
    level: LEVELS[0],
    experience: 0,
    gender: 'male'
  });

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      // Force account selection
      provider.setCustomParameters({ prompt: 'select_account' });
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      
      // If document doesn't exist or is missing critical fields
      if (!userDoc.exists() || !userData?.email) {
        const names = user.displayName?.split(' ') || [];
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          name: user.displayName || 'أستاذ جديد',
          firstName: names[0] || '',
          lastName: names.slice(1).join(' ') || '',
          email: user.email,
          photoURL: user.photoURL,
          createdAt: new Date().toISOString(),
          incomplete: true,
          status: 'online'
        }, { merge: true });
      }
    } catch (err: any) {
      console.error("Login Error:", err);
      if (err.code === 'auth/unauthorized-domain') {
        setError('هذا النطاق غير مصرح به في Firebase. يرجى إضافة رابط التطبيق في إعدادات Firebase.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('تم حظر النافذة المنبثقة. يرجى السماح بالنوافذ المنبثقة أو فتح التطبيق في نافذة جديدة.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('تم إغلاق نافذة تسجيل الدخول قبل إتمام العملية.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('فشل الاتصال بالشبكة. يرجى التأكد من اتصالك بالإنترنت، أو حاول فتح التطبيق في نافذة جديدة (Open in new tab).');
      } else {
        setError('حدث خطأ أثناء تسجيل الدخول: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignup) {
        // 1. Create the user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const user = userCredential.user;

        // 2. Save the user data to Firestore "users" collection
        // This ensures the user appears in the users list immediately
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: formData.email,
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          subject: formData.specialty,
          wilaya: formData.wilaya,
          firstName: formData.firstName,
          lastName: formData.lastName,
          specialty: formData.specialty,
          level: formData.level,
          experience: formData.experience,
          gender: formData.gender,
          createdAt: new Date().toISOString(),
          incomplete: false,
          status: 'online'
        });
        
        console.log("User saved to Firestore successfully:", user.uid);
      } else {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      if (err.code === 'auth/email-already-in-use') {
        setError('هذا البريد الإلكتروني مستخدم بالفعل.');
      } else if (err.code === 'auth/weak-password') {
        setError('كلمة المرور ضعيفة جداً.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('فشل الاتصال بالشبكة. يرجى التأكد من اتصالك بالإنترنت.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dz-black flex flex-col items-center justify-center p-4 overflow-hidden relative">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-dz-purple/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-dz-magenta/20 rounded-full blur-3xl"></div>
      </div>

      {/* Header Section */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-8 z-10"
      >
        <h2 className="text-2xl gold-text mb-2">بسم الله الرحمان الرحيم</h2>
        <h3 className="text-xl gold-text mb-6">اللهم صلي و سلم على سيدنا محمد</h3>
        
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="relative">
            <GraduationCap className="w-20 h-20 text-dz-purple" />
            <motion.div 
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="absolute -top-2 -right-2"
            >
              <Feather className="w-8 h-8 text-dz-gold" />
            </motion.div>
            <Key className="absolute -bottom-2 -left-2 w-8 h-8 text-dz-gold" />
          </div>
          <div className="text-right">
            <h1 className="text-4xl font-bold text-dz-magenta tracking-wider">prof dz</h1>
            <div className="flex items-center gap-2 justify-end">
              <span className="text-dz-gold font-bold">DZ TEACH</span>
              <span className="text-2xl">🇩🇿</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Form Section */}
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-zinc-900/80 backdrop-blur-xl p-8 rounded-3xl border border-dz-purple/30 w-full max-w-md z-10 shadow-2xl"
      >
        <div className="flex gap-4 mb-6">
          <button 
            onClick={() => setIsSignup(false)}
            className={cn(
              "flex-1 py-2 rounded-xl transition-all",
              !isSignup ? "bg-dz-purple text-white shadow-lg" : "text-zinc-500 hover:text-dz-purple"
            )}
          >
            دخول
          </button>
          <button 
            onClick={() => setIsSignup(true)}
            className={cn(
              "flex-1 py-2 rounded-xl transition-all",
              isSignup ? "bg-dz-purple text-white shadow-lg" : "text-zinc-500 hover:text-dz-purple"
            )}
          >
            تسجيل
          </button>
        </div>

        <button 
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full mb-6 flex items-center justify-center gap-3 bg-white text-black py-3 rounded-xl font-bold hover:bg-zinc-200 transition-all disabled:opacity-50"
        >
          <Chrome className="w-5 h-5" />
          دخول عبر إيميل الجهاز
        </button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-800"></div></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-zinc-900 px-2 text-zinc-500">أو عبر البريد</span></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="wait">
            {isSignup ? (
              <motion.div 
                key="signup"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <User className="absolute right-3 top-3 w-5 h-5 text-zinc-500" />
                    <input 
                      type="text" 
                      placeholder="الاسم" 
                      required
                      className="w-full bg-black/50 border border-zinc-800 rounded-xl py-2.5 pr-10 pl-4 focus:border-dz-purple outline-none"
                      value={formData.firstName}
                      onChange={e => setFormData({...formData, firstName: e.target.value})}
                    />
                  </div>
                  <div className="relative">
                    <User className="absolute right-3 top-3 w-5 h-5 text-zinc-500" />
                    <input 
                      type="text" 
                      placeholder="اللقب" 
                      required
                      className="w-full bg-black/50 border border-zinc-800 rounded-xl py-2.5 pr-10 pl-4 focus:border-dz-purple outline-none"
                      value={formData.lastName}
                      onChange={e => setFormData({...formData, lastName: e.target.value})}
                    />
                  </div>
                </div>

                <div className="relative">
                  <MapPin className="absolute right-3 top-3 w-5 h-5 text-zinc-500" />
                  <select 
                    className="w-full bg-black/50 border border-zinc-800 rounded-xl py-2.5 pr-10 pl-4 focus:border-dz-purple outline-none appearance-none"
                    value={formData.wilaya}
                    onChange={e => setFormData({...formData, wilaya: e.target.value})}
                  >
                    {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <Briefcase className="absolute right-3 top-3 w-5 h-5 text-zinc-500" />
                    <select 
                      className="w-full bg-black/50 border border-zinc-800 rounded-xl py-2.5 pr-10 pl-4 focus:border-dz-purple outline-none appearance-none"
                      value={formData.specialty}
                      onChange={e => setFormData({...formData, specialty: e.target.value})}
                    >
                      {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="relative">
                    <CapIcon className="absolute right-3 top-3 w-5 h-5 text-zinc-500" />
                    <select 
                      className="w-full bg-black/50 border border-zinc-800 rounded-xl py-2.5 pr-10 pl-4 focus:border-dz-purple outline-none appearance-none"
                      value={formData.level}
                      onChange={e => setFormData({...formData, level: e.target.value})}
                    >
                      {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <input 
                      type="number" 
                      placeholder="سنوات الخبرة" 
                      className="w-full bg-black/50 border border-zinc-800 rounded-xl py-2.5 pr-4 pl-4 focus:border-dz-purple outline-none"
                      value={formData.experience || ''}
                      onChange={e => setFormData({...formData, experience: parseInt(e.target.value)})}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, gender: 'male'})}
                      className={cn("flex-1 rounded-xl border", formData.gender === 'male' ? "border-dz-purple bg-dz-purple/20" : "border-zinc-800")}
                    >
                      ذكر
                    </button>
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, gender: 'female'})}
                      className={cn("flex-1 rounded-xl border", formData.gender === 'female' ? "border-dz-magenta bg-dz-magenta/20" : "border-zinc-800")}
                    >
                      أنثى
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <div className="relative">
            <Mail className="absolute right-3 top-3 w-5 h-5 text-zinc-500" />
            <input 
              type="email" 
              placeholder="البريد الإلكتروني" 
              required
              className="w-full bg-black/50 border border-zinc-800 rounded-xl py-2.5 pr-10 pl-4 focus:border-dz-purple outline-none"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div className="relative">
            <Lock className="absolute right-3 top-3 w-5 h-5 text-zinc-500" />
            <input 
              type="password" 
              placeholder="كلمة المرور" 
              required
              className="w-full bg-black/50 border border-zinc-800 rounded-xl py-2.5 pr-10 pl-4 focus:border-dz-purple outline-none"
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
            />
          </div>

          {error && (
            <div className="text-dz-red text-sm text-center space-y-2">
              <p>{error}</p>
              {(error.includes('network-request-failed') || error.includes('popup-blocked')) && (
                <button 
                  type="button"
                  onClick={() => window.open(window.location.href, '_blank')}
                  className="text-dz-gold underline block mx-auto hover:text-white transition-colors"
                >
                  فتح التطبيق في نافذة مستقلة (اضغط هنا)
                </button>
              )}
            </div>
          )}

          <button 
            disabled={loading}
            className="w-full bg-gradient-to-r from-dz-purple to-dz-magenta text-white py-3 rounded-xl font-bold shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? 'جاري التحميل...' : (isSignup ? 'إنشاء حساب' : 'تسجيل الدخول')}
          </button>
        </form>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mt-12 text-center z-10"
      >
        <p className="text-zinc-500 text-sm">developer prof dali nadjib</p>
      </motion.div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
