import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import { Toaster } from 'react-hot-toast';

// Simple global loading spinner for suspense fallback
const GlobalLoader = () => (
  <div className="min-h-screen bg-main flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin"></div>
  </div>
);

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
        <React.Suspense fallback={<GlobalLoader />}>
          <Routes>
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
