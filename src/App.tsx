import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './i18n/i18n';
import { LanguageProvider } from './context/LanguageContext';
const RestaurantDashboard = React.lazy(() => import('./pages/restaurant/Dashboard').then(m => ({ default: m.RestaurantDashboard })));
const AdminDashboard = React.lazy(() => import('./pages/admin/Dashboard').then(m => ({ default: m.AdminDashboard })));
const PublicMenu = React.lazy(() => import('./pages/PublicMenu'));
const LandingPage = React.lazy(() => import('./pages/LandingPage'));
const Login = React.lazy(() => import('./pages/auth/Login').then(m => ({ default: m.Login })));
const Register = React.lazy(() => import('./pages/auth/Register').then(m => ({ default: m.Register })));
const CompleteSignup = React.lazy(() => import('./pages/auth/CompleteSignup').then(m => ({ default: m.CompleteSignup })));
const TermsPage = React.lazy(() => import('./pages/LegalPages').then(m => ({ default: m.TermsPage })));
const PrivacyPage = React.lazy(() => import('./pages/LegalPages').then(m => ({ default: m.PrivacyPage })));
const RefundPage = React.lazy(() => import('./pages/LegalPages').then(m => ({ default: m.RefundPage })));

import ErrorBoundary from './components/ErrorBoundary';
import { Toaster, toast } from 'react-hot-toast';

// Simple global loading spinner for suspense fallback
const GlobalLoader = () => (
  <div className="min-h-screen bg-main flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin"></div>
  </div>
);

// Global OAuth Callback and Token Resolver: Catches OAuth redirects on ANY route (e.g. /, /login, /auth/callback)
const OAuthCallbackHandler = () => {
  const navigate = useNavigate();

  React.useEffect(() => {
    const handleAuthRedirect = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.startsWith('#') ? window.location.hash.substring(1) : '');
      const urlError = searchParams.get('error_description') || hashParams.get('error_description') || searchParams.get('error') || hashParams.get('error');
      const code = searchParams.get('code');

      if (urlError) {
        window.history.replaceState({}, document.title, window.location.pathname);
        toast.error(`خطأ في تسجيل الدخول: ${urlError}`);
        return;
      }

      if (code) {
        try {
          const { supabase } = await import('./lib/supabase');
          window.history.replaceState({}, document.title, window.location.pathname);

          // Check if session is already active (exchanged automatically)
          const { data: currentSession } = await supabase.auth.getSession();
          if (currentSession?.session?.user) {
            await finalizeOAuthUser(currentSession.session.user);
            return;
          }

          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            const { data: retrySession } = await supabase.auth.getSession();
            if (retrySession?.session?.user) {
              await finalizeOAuthUser(retrySession.session.user);
              return;
            }
            if (!error.message.includes('code verifier not found')) {
              toast.error(error.message || 'فشل التحقق من رمز الدخول');
            }
            return;
          }
          if (data?.session?.user) {
            await finalizeOAuthUser(data.session.user);
          }
        } catch (err: any) {
          console.error('OAuth exchange error:', err);
        }
      }
    };

    const finalizeOAuthUser = async (user: any) => {
      const { supabase } = await import('./lib/supabase');
      const userEmail = user?.email?.trim().toLowerCase();
      if (userEmail === '11monther33@gmail.com') {
        toast.success('تم تسجيل الدخول بنجاح كمدير عام', { id: 'admin-login-success' });
        navigate('/admin', { replace: true });
        return;
      }

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
        toast.error('حسابك معلق. يرجى التواصل مع الإدارة.');
        await supabase.auth.signOut();
        navigate('/login', { replace: true });
        return;
      }

      if (profile?.role === 'SUPER_ADMIN') {
        toast.success('مرحباً بك يا مدير النظام');
        navigate('/admin', { replace: true });
        return;
      }

      let restQuery = supabase.from('restaurants').select('id, plan, status, is_active');
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
        toast.error('مرحباً بك! للاستفادة من منصة VISIONO، يجب تفعيل باقة اشتراك أولاً.');
        navigate('/register?step=plans', { replace: true });
        return;
      }

      navigate('/dashboard', { replace: true });
    };

    handleAuthRedirect();
  }, [navigate]);

  return null;
};

function App() {
  const { i18n } = useTranslation();
  
  // Set initial direction
  React.useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  // Anti-Sleep Ping: Deferred to avoid blocking FCP with supabase initialization
  React.useEffect(() => {
    const startKeepAlive = () => {
      import('./lib/supabase').then(({ supabase, isSupabaseConfigured }) => {
        if (!isSupabaseConfigured) return;
        
        const keepAlive = async () => {
          try {
            await supabase.from('restaurants').select('id').limit(1);
          } catch (e) {
            // 🔒 Silent fail
          }
        };
        
        keepAlive();
        setInterval(keepAlive, 5 * 60 * 1000);
      });
    };

    if (window.requestIdleCallback) {
      window.requestIdleCallback(startKeepAlive);
    } else {
      setTimeout(startKeepAlive, 3000);
    }
  }, []);

  return (
    <LanguageProvider>
      <Toaster position="top-center" reverseOrder={false} />
      <Router>
        <OAuthCallbackHandler />
        <React.Suspense fallback={<GlobalLoader />}>
          <Routes>
            <Route path="/auth/callback" element={<Navigate to="/login" replace />} />
            {/* Marketing Site / Landing Page */}
            <Route path="/" element={<LandingPage />} />
            
            {/* Legal Routes */}
            <Route path="/terms-conditions" element={<TermsPage />} />
            <Route path="/privacy-policy" element={<PrivacyPage />} />
            <Route path="/refund-policy" element={<RefundPage />} />
            
            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/complete-signup" element={<CompleteSignup />} />
            
            {/* Public Menu Route */}
            <Route path="/menu/:restaurantId" element={<PublicMenu />} />
            
            {/* New Restaurant Dashboard Routes (Advanced Features) */}
            <Route path="/dashboard/*" element={
              <ErrorBoundary>
                <RestaurantDashboard />
              </ErrorBoundary>
            } />

            {/* Admin Dashboard */}
            <Route 
              path="/admin/*" 
              element={
                <ErrorBoundary>
                  <AdminDashboard />
                </ErrorBoundary>
              } 
            />

            {/* Redirects */}
            <Route path="/restaurant/*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </React.Suspense>
      </Router>
    </LanguageProvider>
  );
}

export default App;
