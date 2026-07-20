import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './i18n/i18n';
import { LanguageProvider } from './context/LanguageContext';
import { RestaurantDashboard } from './pages/restaurant/Dashboard';
import { AdminDashboard } from './pages/admin/Dashboard';
import PublicMenu from './pages/PublicMenu';
import LandingPage from './pages/LandingPage';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { CompleteSignup } from './pages/auth/CompleteSignup';
import { TermsPage, PrivacyPage, RefundPage } from './pages/LegalPages';
import ErrorBoundary from './components/ErrorBoundary';

import { Toaster } from 'react-hot-toast';
import { supabase, isSupabaseConfigured } from './lib/supabase';

function App() {
  const { i18n } = useTranslation();
  
  // Set initial direction and Anti-Sleep Ping
  React.useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;

    // Anti-Sleep Ping: Keeps Supabase active by making a small request every 5 minutes
    const keepAlive = async () => {
      if (!isSupabaseConfigured) return;
      
      try {
        await supabase.from('restaurants').select('id').limit(1);
      } catch (e) {
        // 🔒 Silent fail — don't log to console
      }
    };
    
    keepAlive();
    const interval = setInterval(keepAlive, 5 * 60 * 1000); // Every 5 minutes
    return () => clearInterval(interval);
  }, [i18n.language]);

  return (
    <LanguageProvider>
      <Toaster position="top-center" reverseOrder={false} />
      <Router>
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
      </Router>
    </LanguageProvider>
  );
}

export default App;
