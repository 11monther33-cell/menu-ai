import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { motion } from 'motion/react';
import { Lock, Mail, Eye, EyeOff, ArrowRight, ArrowLeft, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

// 🔒 SECURITY: Admin email is NOT hardcoded — role is determined server-side via RLS

export const Login = () => {
  const { t, isRtl } = useLanguage();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [mfaChallenge, setMfaChallenge] = useState<{ factorId: string } | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [verifyingMfa, setVerifyingMfa] = useState(false);

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

  // 🔒 Finalize Login & Enforce Active Subscription
  const finalizeLogin = async (user: any) => {
    try {
      const userEmail = user?.email?.trim().toLowerCase();

      // 1. Root Super Admin check by email directly
      if (userEmail === '11monther33@gmail.com') {
        toast.success(isRtl ? 'تم تسجيل الدخول بنجاح كمدير عام' : 'Logged in as Super Admin', { id: 'admin-login-success' });
        navigate('/admin', { replace: true });
        return;
      }

      // 2. Lookup profile by user id OR email
      let { data: profile } = await supabase
        .from('profiles')
        .select('id, role, is_active, restaurant_id')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile && userEmail) {
        const { data: byEmail } = await supabase
          .from('profiles')
          .select('id, role, is_active, restaurant_id')
          .ilike('email', userEmail)
          .maybeSingle();
        if (byEmail) profile = byEmail;
      }

      if (profile && !profile.is_active) {
        setError(isRtl ? 'حسابك معلق. تواصل مع الدعم.' : 'Your account is suspended. Contact support.');
        await supabase.auth.signOut();
        return;
      }

      // Super Admins bypass restaurant subscription requirement
      if (profile?.role === 'SUPER_ADMIN') {
        toast.success(isRtl ? 'تم تسجيل الدخول بنجاح كمدير عام' : 'Logged in as Super Admin');
        navigate('/admin', { replace: true });
        return;
      }

      // 🔒 3. Check restaurant subscription for restaurant owner
      let restQuery = supabase
        .from('restaurants')
        .select('id, plan, status, is_active');

      if (profile?.restaurant_id) {
        restQuery = restQuery.eq('id', profile.restaurant_id);
      } else {
        restQuery = restQuery.eq('owner_id', user.id);
      }

      const { data: restaurant } = await restQuery.maybeSingle();

      const isSubscribed = restaurant && restaurant.status !== 'SUSPENDED' && (
        restaurant.plan || restaurant.status === 'APPROVED' || restaurant.status === 'ACTIVE'
      );

      if (!isSubscribed) {
        toast.error(
          isRtl
            ? 'مرحباً بك! للاستفادة من منصة VISIONO، يجب تفعيل اشتراكك في إحدى الباقات أولاً.'
            : 'Welcome! An active subscription is required to access the platform.'
        );
        navigate('/register?step=plans', { replace: true });
        return;
      }

      // 🔒 Check if restaurant has registered staff members
      try {
        const { count } = await supabase
          .from('restaurant_staff')
          .select('id', { count: 'exact', head: true })
          .eq('restaurant_id', restaurant.id)
          .eq('is_active', true);

        if (count && count > 0) {
          navigate(`/staff-login/${restaurant.id}`, { replace: true });
          return;
        }
      } catch (err) {
        console.warn('Could not check staff count', err);
      }

      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Authentication error');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Check if returning from Google OAuth redirect
  useEffect(() => {
    // 0. Parse URL parameters for error or code
    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.startsWith('#') ? window.location.hash.substring(1) : '');
    const urlError = searchParams.get('error_description') || hashParams.get('error_description') || searchParams.get('error') || hashParams.get('error');
    const code = searchParams.get('code');

    if (urlError) {
      setError(urlError);
      toast.error(`خطأ في تسجيل الدخول: ${urlError}`);
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (code) {
      setGoogleLoading(true);
    }

    // 1. Listen for auth state changes (essential for OAuth token redirect)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        await finalizeLogin(session.user);
      }
    });

    // 2. Also check if session is already active
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        finalizeLogin(session.user);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Google OAuth Login
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/login`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (oauthError) throw oauthError;
    } catch (err: any) {
      setError(err.message || (isRtl ? 'فشل تسجيل الدخول عبر Google' : 'Google sign-in failed'));
      setGoogleLoading(false);
    }
  };

  const handleVerifyMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaChallenge || mfaCode.length !== 6) return;
    
    setVerifyingMfa(true);
    setError('');
    
    try {
      const challenge = await supabase.auth.mfa.challenge({ factorId: mfaChallenge.factorId });
      if (challenge.error) throw challenge.error;

      const verify = await supabase.auth.mfa.verify({
        factorId: mfaChallenge.factorId,
        challengeId: challenge.data.id,
        code: mfaCode,
      });

      if (verify.error) throw verify.error;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await finalizeLogin(user);
      }
    } catch (err: any) {
      setError(isRtl ? 'رمز التحقق غير صحيح' : 'Invalid verification code');
    } finally {
      setVerifyingMfa(false);
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
        const { data: authLevel } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (authLevel?.nextLevel === 'aal2' && authLevel?.currentLevel === 'aal1') {
          const { data: factors } = await supabase.auth.mfa.listFactors();
          const totpFactor = factors?.totp[0];
          if (totpFactor) {
            setMfaChallenge({ factorId: totpFactor.id });
            setLoading(false);
            return;
          }
        }
        
        await finalizeLogin(data.user);
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
            <img src="/logo.png" alt="VISIONO" className="h-12 w-auto object-contain mb-6 mx-auto" />
            <h1 className="text-3xl font-display text-text mb-3 leading-tight tracking-tight">{isRtl ? 'مرحباً بعودتك' : 'Welcome Back'}</h1>
            <p className="text-muted/80">{isRtl ? 'سجّل الدخول إلى لوحة تحكم VISIONO' : 'Sign in to your VISIONO dashboard'}</p>
          </div>

          {mfaChallenge ? (
            <form onSubmit={handleVerifyMfa} className="space-y-6">
              <div className="text-center mb-6">
                <ShieldCheck size={48} className="mx-auto text-gold mb-4" />
                <h3 className="text-xl font-bold text-text-primary mb-2">
                  {isRtl ? 'التحقق بخطوتين' : 'Two-Factor Authentication'}
                </h3>
                <p className="text-text-secondary text-sm">
                  {isRtl ? 'أدخل الرمز المكون من 6 أرقام من تطبيق المصادقة الخاص بك.' : 'Enter the 6-digit code from your authenticator app.'}
                </p>
              </div>

              <div>
                <input
                  type="text"
                  maxLength={6}
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-surface-2 border border-white/5 rounded-lg py-4 text-center text-2xl tracking-[0.5em] text-text focus:border-gold outline-none transition-colors font-mono"
                  placeholder="123456"
                  required
                />
              </div>

              {error && (
                <div className="p-4 border bg-red-500/10 border-red-500/20 text-red-500 text-sm rounded-xl text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={verifyingMfa || mfaCode.length !== 6}
                className="w-full bg-gold hover:bg-gold-light text-main font-semibold py-3.5 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {verifyingMfa ? (isRtl ? 'جاري التحقق...' : 'Verifying...') : (isRtl ? 'تأكيد الرمز' : 'Verify Code')}
              </button>

              <button
                type="button"
                onClick={() => { setMfaChallenge(null); setMfaCode(''); setError(''); }}
                className="w-full text-sm text-text-secondary hover:text-white mt-4"
              >
                {isRtl ? 'العودة لتسجيل الدخول' : 'Back to Login'}
              </button>
            </form>
          ) : (
            <>
            {/* Google OAuth Login Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading || googleLoading}
              className="w-full mb-6 bg-white hover:bg-gray-100 text-gray-800 font-semibold py-3.5 px-4 rounded-xl border border-white/10 shadow-lg flex items-center justify-center gap-3 transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              <span>
                {googleLoading 
                  ? (isRtl ? 'جاري التحقق والدخول بواسطة Google...' : 'Verifying Google sign-in...') 
                  : (isRtl ? 'تسجيل الدخول بواسطة Google' : 'Continue with Google')}
              </span>
            </button>

            {/* Divider */}
            <div className="relative flex py-2 items-center mb-6">
              <div className="flex-grow border-t border-white/10"></div>
              <span className="flex-shrink mx-4 text-xs uppercase tracking-wider text-muted/70 font-medium">
                {isRtl ? 'أو عبر البريد الإلكتروني' : 'Or continue with email'}
              </span>
              <div className="flex-grow border-t border-white/10"></div>
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
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};
