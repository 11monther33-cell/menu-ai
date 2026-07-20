import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { motion } from 'motion/react';
import { Lock, Mail, Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

// 🔒 SECURITY: Admin email is NOT hardcoded — role is determined server-side via RLS

export const Login = () => {
  const { t, isRtl } = useLanguage();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleResendConfirmation = async () => {
    if (!email) {
      setError(isRtl ? 'يرجى إدخال البريد الإلكتروني أولاً' : 'Please enter your email first');
      return;
    }
    setResendLoading(true);
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim().toLowerCase(),
      });
      if (resendError) throw resendError;
      setResendSuccess(true);
      toast.success(isRtl ? 'تم إعادة إرسال رابط التأكيد' : 'Confirmation link resent');
    } catch (err: any) {
      // 🔒 Generic error message
      setError(isRtl ? 'حدث خطأ. حاول مرة أخرى.' : 'An error occurred. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const trimmedEmail = email.trim().toLowerCase();
      const trimmedPassword = password.trim();

      if (!trimmedEmail || !trimmedPassword) {
        setError(isRtl ? 'يرجى إدخال البريد وكلمة المرور' : 'Please enter email and password');
        setLoading(false);
        return;
      }

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: trimmedPassword,
      });

      if (authError) {
        // 🔒 SECURITY: Generic error message — prevent account enumeration
        setError(isRtl
          ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
          : 'Invalid email or password'
        );
        return;
      }

      if (data.user) {
        // Check profile exists and get role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, is_active')
          .eq('id', data.user.id)
          .single();

        if (profileError || !profile) {
          setError(isRtl 
            ? 'التسجيل غير مكتمل. يرجى الذهاب لصفحة "سجل مطعمك الآن" وإكمال الخطوات بنفس الإيميل وكلمة المرور.' 
            : 'Registration incomplete. Please go to Register and complete the steps with the same email and password.');
          await supabase.auth.signOut();
          return;
        }

        // 🔒 Check if account is active
        if (!profile.is_active) {
          setError(isRtl ? 'حسابك معلق. تواصل مع الدعم.' : 'Your account is suspended. Contact support.');
          await supabase.auth.signOut();
          return;
        }

        // Redirect based on role (role comes from server-side DB, not client)
        if (profile.role === 'SUPER_ADMIN') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err: any) {
      setError(isRtl ? 'حدث خطأ غير متوقع' : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-main flex items-center justify-center p-6 relative overflow-hidden">
      <div className="site-noise"></div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted hover:text-gold transition-colors font-medium"
          >
            {isRtl ? <ArrowRight size={20} /> : <ArrowLeft size={20} />}
            <span>{isRtl ? 'العودة للرئيسية' : 'Back to Home'}</span>
          </Link>
        </div>

        <div className="bg-surface border border-white/5 p-8 md:p-12 rounded-2xl shadow-xl">
          <div className="text-center mb-10">
            <img src="/logo.png" alt="VISIONO" className="w-14 h-14 object-contain mb-6 mx-auto" />
            <h1 className="text-3xl font-display text-text mb-3 leading-tight tracking-tight">{isRtl ? 'مرحباً بعودتك' : 'Welcome Back'}</h1>
            <p className="text-muted/80">{isRtl ? 'سجّل الدخول إلى لوحة تحكم VISIONO' : 'Sign in to your VISIONO dashboard'}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-muted mb-2">{isRtl ? 'البريد الإلكتروني' : 'Email Address'}</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface-2 border border-white/5 rounded-lg py-3 pl-12 pr-4 text-text focus:border-gold outline-none transition-colors"
                  placeholder="owner@restaurant.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-2">{isRtl ? 'كلمة المرور' : 'Password'}</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface-2 border border-white/5 rounded-lg py-3 pl-12 pr-12 text-text focus:border-gold outline-none transition-colors"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-gold"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="space-y-4">
                <div className="p-4 border bg-red-500/10 border-red-500/20 text-red-500 text-sm rounded-xl">
                  {error}
                </div>

                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  disabled={resendLoading}
                  className="w-full text-xs text-gold hover:underline flex items-center justify-center gap-2"
                >
                  {resendLoading
                    ? (isRtl ? 'جاري الإرسال...' : 'Resending...')
                    : (isRtl ? 'لم تصلك رسالة التأكيد؟ أعد الإرسال' : "Didn't get the email? Resend link")}
                </button>

                {resendSuccess && (
                  <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-500 text-xs rounded-xl text-center">
                    {isRtl ? 'تم إرسال الرابط! تفقد بريدك الإلكتروني' : 'Link sent! Check your inbox'}
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gold hover:bg-gold-light text-main font-semibold py-3.5 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 mt-4"
            >
              {loading ? (isRtl ? 'جاري التحقق...' : 'Signing in...') : (isRtl ? 'تسجيل الدخول' : 'Sign In')}
              {!loading && <ArrowRight size={20} className={isRtl ? 'rotate-180' : ''} />}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-muted">
              {isRtl ? 'مطعم جديد؟' : 'New restaurant?'} {' '}
              <Link to="/register" className="text-gold font-bold hover:underline">
                {isRtl ? 'سجّل مطعمك الآن' : 'Register now'}
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
