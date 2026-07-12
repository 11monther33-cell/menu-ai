import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../hooks/useAuth';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { 
  LayoutDashboard, Utensils, ClipboardList, BarChart3, 
  QrCode, Settings, LogOut, Bell, Search, 
  ChevronLeft, ChevronRight, Menu, X,
  Layers, Zap, MessageSquare, Camera,
  Palette, MapPin, CreditCard, Globe, RefreshCw,
  Calculator, FileText, Package, TrendingDown
} from 'lucide-react';
import { DashboardHome } from './pages/DashboardHome';
import { MenuBuilder } from './pages/MenuBuilder';
import { Categories } from './pages/Categories';
import { Orders } from './pages/Orders';
import { Branding } from './pages/Branding';
import { QrCodes } from './pages/QrCodes';
import { Subscription } from './pages/Subscription';
import { DishFormPage } from './pages/DishFormPage'; // Import DishFormPage
import { Generate3DPage } from './pages/Generate3DPage';
import { ObjectCapturePage } from './pages/ObjectCapturePage';

// POS & Accounting Pages
import { POSScreen } from './pages/POSScreen';
import { POSProducts } from './pages/POSProducts';
import { POSInventory } from './pages/POSInventory';
import { POSExpenses } from './pages/POSExpenses';
import { POSInvoices } from './pages/POSInvoices';
import { POSReports } from './pages/POSReports';
import { POSSettings } from './pages/POSSettings';


export const RestaurantDashboard = () => {
  const { isRtl, t, lang, setLang } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // 🔒 SECURITY: Client-side role check — defense in depth
    // The REAL protection is RLS on each table (users can only access their own data)
    if (!authLoading && (!user || !['RESTAURANT_OWNER', 'SUPER_ADMIN'].includes(user.role || ''))) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { group: t('restaurant.nav.core') || 'الرئيسية', items: [
      { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: t('restaurant.nav.dashboard'), path: '/dashboard' },
    ]},
    { group: t('restaurant.nav.menuBuilder') || 'إدارة المنيو', items: [
      { id: 'menu-builder', icon: <Utensils size={20} />, label: t('restaurant.nav.menuBuilder'), path: '/dashboard/menu-builder' },
      { id: 'categories', icon: <Layers size={20} />, label: t('restaurant.nav.categories'), path: '/dashboard/categories' },
    ]},
    { group: t('restaurant.nav.orders') || 'الطلبات', items: [
      { id: 'orders', icon: <ClipboardList size={20} />, label: t('restaurant.nav.orders'), path: '/dashboard/orders' },
      { id: 'live-orders', icon: <Zap size={20} />, label: t('restaurant.nav.liveOrders'), path: '/dashboard/live-orders', badge: 'LIVE' },
    ]},
    { group: t('restaurant.nav.tools') || 'الأدوات', items: [
      { id: 'object-capture', icon: <Camera size={20} />, label: (isRtl ? 'مسح 3D' : '3D Scan'), path: '/dashboard/object-capture' },
      { id: 'generate-3d', icon: <Camera size={20} />, label: (isRtl ? 'رفع 3D' : 'Upload 3D'), path: '/dashboard/generate-3d' },
      { id: 'qr-codes', icon: <QrCode size={20} />, label: t('restaurant.nav.qrCodes'), path: '/dashboard/qr-codes' },
      { id: 'kitchen-pulse', icon: <Zap size={20} />, label: t('restaurant.nav.kitchenPulse'), path: '/dashboard/kitchen-pulse' },
      { id: 'chef-notes', icon: <MessageSquare size={20} />, label: t('restaurant.nav.chefNotes'), path: '/dashboard/chef-notes' },
      { id: 'ugc-review', icon: <Camera size={20} />, label: t('restaurant.nav.ugcReview'), path: '/dashboard/ugc-review' },
    ]},
    { group: t('restaurant.nav.analytics') || 'التحليلات', items: [
      { id: 'analytics', icon: <BarChart3 size={20} />, label: t('restaurant.nav.analytics'), path: '/dashboard/analytics' },
    ]},
    { group: isRtl ? 'المحاسبة ونقاط البيع' : 'POS & Accounting', items: [
      { id: 'pos', icon: <Calculator size={20} />, label: isRtl ? 'نقطة البيع (POS)' : 'Point of Sale (POS)', path: '/dashboard/pos' },
      { id: 'pos-products', icon: <Utensils size={20} />, label: isRtl ? 'إدارة المنتجات' : 'Products Management', path: '/dashboard/pos-products' },
      { id: 'pos-inventory', icon: <Package size={20} />, label: isRtl ? 'المخزون' : 'Inventory', path: '/dashboard/pos-inventory' },
      { id: 'pos-expenses', icon: <TrendingDown size={20} />, label: isRtl ? 'المصروفات' : 'Expenses', path: '/dashboard/pos-expenses' },
      { id: 'pos-invoices', icon: <FileText size={20} />, label: isRtl ? 'الفواتير' : 'Invoices', path: '/dashboard/pos-invoices' },
      { id: 'pos-reports', icon: <BarChart3 size={20} />, label: isRtl ? 'التقارير المالية' : 'Financial Reports', path: '/dashboard/pos-reports' },
      { id: 'pos-settings', icon: <Settings size={20} />, label: isRtl ? 'إعدادات الفرع' : 'Branch Settings', path: '/dashboard/pos-settings' },
    ]},
    { group: t('restaurant.nav.settings') || 'الإعدادات', items: [
      { id: 'branding', icon: <Palette size={20} />, label: t('restaurant.nav.branding'), path: '/dashboard/branding' },
      { id: 'branches', icon: <MapPin size={20} />, label: t('restaurant.nav.branches'), path: '/dashboard/branches' },
      { id: 'settings', icon: <Settings size={20} />, label: t('restaurant.nav.settings'), path: '/dashboard/settings' },
      { id: 'subscription', icon: <CreditCard size={20} />, label: t('restaurant.nav.subscription'), path: '/dashboard/subscription' },
    ]},
  ];

  const handleLogout = async () => {
    const loadingToast = toast.loading(isRtl ? 'جاري تسجيل الخروج...' : 'Logging out...');
    try {
      await supabase.auth.signOut();
      toast.success(isRtl ? 'تم تسجيل الخروج بنجاح' : 'Logged out successfully', { id: loadingToast });
      navigate('/login');
    } catch (error: any) {
      // 🔒 Don't log error details
      toast.error(isRtl ? 'فشل تسجيل الخروج' : 'Logout failed', { id: loadingToast });
      // Still navigate as fallback
      navigate('/login');
    }
  };

  if (authLoading) {
    return (
      <div className="h-screen bg-main flex items-center justify-center">
        <RefreshCw className="animate-spin text-gold" size={48} />
      </div>
    );
  }

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard' || location.pathname === '/dashboard/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen lg:h-screen bg-main text-[#F5F5F5] overflow-hidden selection:bg-gold/30">
      <div className="fixed inset-0 bg-[#0A0A0B] -z-10" />
      
      {/* Sidebar - Desktop */}
      <aside 
        className={`hidden lg:flex flex-col bg-surface-2 border-white/5 transition-all duration-300 relative z-30 ${
          isSidebarCollapsed ? 'w-20' : 'w-[260px]'
        } ${isRtl ? 'border-l' : 'border-r'}`}
      >
        <div className="h-16 flex items-center px-6 border-b border-white/5">
          <img src="/logo.png" alt="VISIONO" className="h-8 object-contain" />
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 custom-scrollbar">
          {navItems.map((group, i) => (
            <div key={`nav-group-${i}-${group.group}`} className="space-y-2">
              {!isSidebarCollapsed && (
                <p className="px-5 text-[10px] font-semibold text-muted uppercase tracking-[0.2em] mb-4">
                  {group.group}
                </p>
              )}
              <div className="space-y-1">
                {group.items.map((item) => (
                  <Link
                    key={item.id}
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors relative group mx-2 ${
                      isActive(item.path) 
                        ? 'bg-white/5 text-text' 
                        : 'text-muted hover:bg-white/5 hover:text-text'
                    }`}
                  >
                    <div className={`${isActive(item.path) ? 'text-gold' : 'text-muted group-hover:text-gold'}`}>
                      {item.icon}
                    </div>
                    {!isSidebarCollapsed && (
                      <>
                        <span className="flex-1 truncate text-sm font-medium">{item.label}</span>
                        {item.badge && (
                          <span className="px-1.5 py-0.5 bg-red-500/20 border border-red-500/50 text-[8px] font-bold text-red-400 rounded-md animate-pulse">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                    {isActive(item.path) && (
                      <motion.div 
                        layoutId="active-nav"
                        className={`absolute inset-y-2 w-1 bg-gold rounded-full ${isRtl ? 'right-0' : 'left-0'}`}
                      />
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-white/5 space-y-2">
          {!isSidebarCollapsed && (
            <div className="px-4 py-3 bg-main border border-white/5 rounded-lg mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gold border border-gold/20 rounded flex items-center justify-center text-main font-bold text-xs uppercase shadow-sm">
                  {user?.name?.slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate text-[#F5F5F5]">{user?.name}</p>
                  <p className="text-[10px] text-muted truncate">{user?.email}</p>
                </div>
              </div>
            </div>
          )}
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-white/5 rounded-lg transition-colors text-sm font-medium"
          >
            <LogOut size={16} />
            {!isSidebarCollapsed && <span>{t('restaurant.nav.logout')}</span>}
          </button>
          
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="w-full flex items-center justify-center p-3 text-muted hover:text-gold hover:bg-white/5 rounded-lg transition-colors border border-transparent"
            title={isSidebarCollapsed ? (isRtl ? 'توسيع' : 'Expand') : (isRtl ? 'طي' : 'Collapse')}
          >
            {isSidebarCollapsed ? (isRtl ? <ChevronLeft size={16} /> : <ChevronRight size={16} />) : (isRtl ? <ChevronRight size={16} /> : <ChevronLeft size={16} />)}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        <div className="site-noise"></div>
        {/* Header */}
        <header className="h-16 bg-main/90 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-20">
          <div className="flex items-center gap-4 relative z-10">
            <button 
              className="lg:hidden p-2.5 bg-surface-2 border border-white/5 rounded-lg text-gold hover:text-gold-light transition-colors shadow-sm"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-surface-2 rounded-lg border border-white/5">
              <Utensils size={14} className="text-gold" />
              <span className="text-xs font-semibold text-text tracking-wider">{user?.restaurantName || 'Restaurant Name'}</span>
              <span className="w-1 h-1 bg-white/10 rounded-full" />
              <span className="text-[10px] text-muted uppercase tracking-widest font-medium">Main Branch</span>
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-4 relative z-10">
            {/* Language Toggle */}
            <button 
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              className="px-3 py-1.5 bg-surface-2 border border-white/5 rounded-lg text-[10px] font-semibold hover:bg-surface transition-colors flex items-center gap-2 text-text tracking-wider uppercase"
            >
              <Globe size={12} />
              {lang === 'ar' ? 'EN' : 'AR'}
            </button>

            <button className="p-2 text-muted hover:text-text relative transition-colors">
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-main" />
            </button>

            <div className="w-8 h-8 bg-surface-2 rounded border border-white/5 overflow-hidden cursor-pointer hover:border-white/20 transition-colors shadow-sm">
              <img 
                src={`https://ui-avatars.com/api/?name=${user?.name}&background=C9A84C&color=0A0A0A`} 
                alt="Avatar" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto px-0 lg:px-8 py-4 lg:py-8 custom-scrollbar relative z-10 overscroll-none">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Routes>
                <Route path="/" element={<DashboardHome />} />
                <Route path="/menu-builder" element={<MenuBuilder />} />
                <Route path="/dishes/new" element={<DishFormPage mode="create" />} />
                <Route path="/dishes/:id/edit" element={<DishFormPage mode="edit" />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/live-orders" element={<div className="p-12 text-center text-text-secondary">{t('admin.system.underDevelopmentDesc').replace('{tab}', t('restaurant.nav.liveOrders'))}</div>} />
                <Route path="/qr-codes" element={<QrCodes />} />
                <Route path="/kitchen-pulse" element={<div className="p-12 text-center text-text-secondary">{t('admin.system.underDevelopmentDesc').replace('{tab}', t('restaurant.nav.kitchenPulse'))}</div>} />
                <Route path="/chef-notes" element={<div className="p-12 text-center text-text-secondary">{t('admin.system.underDevelopmentDesc').replace('{tab}', t('restaurant.nav.chefNotes'))}</div>} />
                <Route path="/ugc-review" element={<div className="p-12 text-center text-text-secondary">{t('admin.system.underDevelopmentDesc').replace('{tab}', t('restaurant.nav.ugcReview'))}</div>} />
                <Route path="/analytics" element={<div className="p-12 text-center text-text-secondary">{t('admin.system.underDevelopmentDesc').replace('{tab}', t('restaurant.nav.analytics'))}</div>} />
                <Route path="/branding" element={<Branding />} />
                <Route path="/branches" element={<div className="p-12 text-center text-text-secondary">{t('admin.system.underDevelopmentDesc').replace('{tab}', t('restaurant.nav.branches'))}</div>} />
                <Route path="/settings" element={<div className="p-12 text-center text-text-secondary">{t('admin.system.underDevelopmentDesc').replace('{tab}', t('restaurant.nav.settings'))}</div>} />
                <Route path="/pos" element={<POSScreen />} />
                <Route path="/pos-products" element={<POSProducts />} />
                <Route path="/pos-inventory" element={<POSInventory />} />
                <Route path="/pos-expenses" element={<POSExpenses />} />
                <Route path="/pos-invoices" element={<POSInvoices />} />
                <Route path="/pos-reports" element={<POSReports />} />
                <Route path="/pos-settings" element={<POSSettings />} />
                <Route path="/subscription" element={<Subscription />} />
                <Route path="/generate-3d" element={<Generate3DPage />} />
                <Route path="/object-capture" element={<ObjectCapturePage />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-text-primary/40 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside 
              initial={{ x: isRtl ? 300 : -300 }}
              animate={{ x: 0 }}
              exit={{ x: isRtl ? 300 : -300 }}
              className={`fixed inset-y-0 ${isRtl ? 'right-0' : 'left-0'} w-[280px] bg-sidebar z-50 lg:hidden flex flex-col shadow-2xl`}
            >
              <div className="h-16 flex items-center justify-between px-6 border-b border-border-custom">
                <img src="/logo.png" alt="VISIONO" className="h-8 object-contain" />
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-text-secondary hover:text-text-primary">
                  <X size={24} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8">
                {navItems.map((group, i) => (
                  <div key={`mobile-nav-group-${i}-${group.group}`} className="space-y-2">
                    <p className="px-4 text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] mb-4">
                      {group.group}
                    </p>
                    <div className="space-y-1">
                      {group.items.map((item) => (
                        <Link
                          key={item.id}
                          to={item.path}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                            isActive(item.path) 
                              ? 'bg-gold/10 text-gold font-bold' 
                              : 'text-text-secondary hover:bg-card hover:text-text-primary'
                          }`}
                        >
                          {item.icon}
                          <span className="flex-1">{item.label}</span>
                          {item.badge && (
                            <span className="px-1.5 py-0.5 bg-red-500 text-[8px] font-bold text-white rounded-md">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-border-custom">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                >
                  <LogOut size={20} />
                  <span>{t('restaurant.nav.logout')}</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
