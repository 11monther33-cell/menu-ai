import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../hooks/useAuth';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { 
  LayoutDashboard, Utensils, ClipboardList, BarChart3, 
  QrCode, Settings, LogOut, Smartphone, Bell, Search, 
  ChevronLeft, ChevronRight, Menu, X,
  Layers, Zap, MessageSquare, Camera,
  Palette, MapPin, CreditCard, Globe, RefreshCw, Shield,
  Calculator, FileText, Package, TrendingDown, Bot
} from 'lucide-react';
import { DashboardHome } from './pages/DashboardHome';
import { MenuBuilder } from './pages/MenuBuilder';
import { Categories } from './pages/Categories';
import { Orders } from './pages/Orders';
import { Branding } from './pages/Branding';
import { QrCodes } from './pages/QrCodes';
import { Subscription } from './pages/Subscription';
import { DishFormPage } from './pages/DishFormPage';
import { AppConnection } from './pages/AppConnection';
import { SecuritySettings } from './pages/SecuritySettings';
import { WhatsAppSalesAgent } from './pages/WhatsAppSalesAgent';
import { POSBranches } from './pages/POSBranches';

// POS & Accounting Pages
import { POSScreen } from './pages/POSScreen';
import { POSProducts } from './pages/POSProducts';
import { POSInventory } from './pages/POSInventory';
import { POSExpenses } from './pages/POSExpenses';
import { POSInvoices } from './pages/POSInvoices';
import { POSReports } from './pages/POSReports';
import { POSSettings } from './pages/POSSettings';
import { BranchSwitcher } from '../../components/dashboard/BranchSwitcher';

// Global POS Store & Service
import { getOrCreateBranch } from '../../services/posService';
import { usePOSStore } from '../../store/posStore';

export const RestaurantDashboard = () => {
  const { isRtl, t, lang, setLang } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { setBranch } = usePOSStore();

  useEffect(() => {
    const initBranch = async () => {
      if (user?.restaurantId) {
        try {
          const branch = await getOrCreateBranch(user.restaurantId);
          if (branch) {
            setBranch(branch);
          }
        } catch (err) {
          console.error("Failed to initialize branch context:", err);
        }
      }
    };
    initBranch();
  }, [user?.restaurantId, setBranch]);

  useEffect(() => {
    // 🔒 SECURITY: Client-side role check — defense in depth
    // The REAL protection is RLS on each table (users can only access their own data)
    if (!authLoading && (!user || !['RESTAURANT_OWNER', 'SUPER_ADMIN'].includes(user.role || ''))) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems: {
    group: string;
    items: { id: string; icon: React.ReactNode; label: string; path: string; badge?: string }[];
  }[] = [
    { 
      group: isRtl ? 'إدارة المطعم' : 'Restaurant Management', 
      items: [
        { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: t('restaurant.nav.dashboard') || (isRtl ? 'لوحة التحكم' : 'Dashboard'), path: '/dashboard' },
        { id: 'menu-builder', icon: <Utensils size={20} />, label: t('restaurant.nav.menuBuilder') || (isRtl ? 'بناء المنيو' : 'Menu Builder'), path: '/dashboard/menu-builder' },
        { id: 'categories', icon: <Layers size={20} />, label: t('restaurant.nav.categories') || (isRtl ? 'التصنيفات' : 'Categories'), path: '/dashboard/categories' },
        { id: 'orders', icon: <ClipboardList size={20} />, label: t('restaurant.nav.orders') || (isRtl ? 'إدارة الطلبات' : 'Orders'), path: '/dashboard/orders' },
        { id: 'live-orders', icon: <Zap size={20} />, label: t('restaurant.nav.liveOrders') || (isRtl ? 'طلبات مباشرة' : 'Live Orders'), path: '/dashboard/live-orders' },
        { id: 'qr-codes', icon: <QrCode size={20} />, label: t('restaurant.nav.qrCodes') || (isRtl ? 'رموز QR' : 'QR Codes'), path: '/dashboard/qr-codes' },
        { id: 'app-connection', icon: <Smartphone size={20} />, label: isRtl ? 'ربط التطبيق' : 'App Connection', path: '/dashboard/app-connection' },
        { id: 'kitchen-pulse', icon: <Zap size={20} />, label: t('restaurant.nav.kitchenPulse') || (isRtl ? 'نبض المطبخ' : 'Kitchen Pulse'), path: '/dashboard/kitchen-pulse' },
        { id: 'chef-notes', icon: <MessageSquare size={20} />, label: t('restaurant.nav.chefNotes') || (isRtl ? 'ملاحظات الشيف' : 'Chef Notes'), path: '/dashboard/chef-notes' },
        { id: 'ugc-review', icon: <Camera size={20} />, label: t('restaurant.nav.ugcReview') || (isRtl ? 'مراجعة المحتوى' : 'UGC Review'), path: '/dashboard/ugc-review' },
        { id: 'analytics', icon: <BarChart3 size={20} />, label: t('restaurant.nav.analytics') || (isRtl ? 'التحليلات' : 'Analytics'), path: '/dashboard/analytics' },
        { id: 'branding', icon: <Palette size={20} />, label: t('restaurant.nav.branding') || (isRtl ? 'الهوية البصرية' : 'Branding'), path: '/dashboard/branding' },
        { id: 'branches', icon: <MapPin size={20} />, label: t('restaurant.nav.branches') || (isRtl ? 'الفروع' : 'Branches'), path: '/dashboard/branches' },
        { id: 'whatsapp-sales-agent', icon: <Bot size={20} />, label: isRtl ? 'موظف مبيعات (واتساب)' : 'WhatsApp AI Sales Agent', path: '/dashboard/whatsapp-sales-agent', badge: 'AI' },
        { id: 'security', icon: <Shield size={20} />, label: isRtl ? 'الأمان و 2FA' : 'Security & 2FA', path: '/dashboard/security' },
        { id: 'settings', icon: <Settings size={20} />, label: t('restaurant.nav.settings') || (isRtl ? 'الإعدادات' : 'Settings'), path: '/dashboard/settings' },
        { id: 'subscription', icon: <CreditCard size={20} />, label: t('restaurant.nav.subscription') || (isRtl ? 'الاشتراك' : 'Subscription'), path: '/dashboard/subscription' },
      ]
    },
    { 
      group: isRtl ? 'المحاسبة ونقاط البيع' : 'POS & Accounting', 
      items: [
        { id: 'pos', icon: <Calculator size={20} />, label: isRtl ? 'نقطة البيع (POS)' : 'Point of Sale (POS)', path: '/dashboard/pos' },
        { id: 'pos-products', icon: <Utensils size={20} />, label: isRtl ? 'إدارة المنتجات' : 'Products Management', path: '/dashboard/pos-products' },
        { id: 'pos-inventory', icon: <Package size={20} />, label: isRtl ? 'المخزون' : 'Inventory', path: '/dashboard/pos-inventory' },
        { id: 'pos-expenses', icon: <TrendingDown size={20} />, label: isRtl ? 'المصروفات' : 'Expenses', path: '/dashboard/pos-expenses' },
        { id: 'pos-invoices', icon: <FileText size={20} />, label: isRtl ? 'الفواتير' : 'Invoices', path: '/dashboard/pos-invoices' },
        { id: 'pos-reports', icon: <BarChart3 size={20} />, label: isRtl ? 'التقارير المالية' : 'Financial Reports', path: '/dashboard/pos-reports' },
        { id: 'pos-settings', icon: <Settings size={20} />, label: isRtl ? 'إعدادات الفرع' : 'Branch Settings', path: '/dashboard/pos-settings' },
      ]
    }
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
    <div className="flex h-screen lg:h-screen bg-main text-text overflow-hidden selection:bg-gold/30">
      {/* Sidebar - Desktop */}
      <aside 
        className={`hidden lg:flex flex-col bg-card border-border-custom transition-all duration-300 relative z-30 ${
          isSidebarCollapsed ? 'w-20' : 'w-[260px]'
        } ${isRtl ? 'border-l' : 'border-r'}`}
      >
        <div className="h-16 flex items-center px-6 border-b border-border-custom">
          <img src="/logo.png" alt="VISIONO" className="h-8 object-contain" />
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-6 custom-scrollbar">
          {navItems.map((group, i) => (
            <div key={`nav-group-${i}-${group.group}`} className="space-y-2">
              {!isSidebarCollapsed && (
                <p className="px-5 text-[11px] font-extrabold text-gold/80 uppercase tracking-wider mb-2">
                  {group.group}
                </p>
              )}
              <div className="space-y-1">
                {group.items.map((item) => (
                  <Link
                    key={item.id}
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative group mx-2 ${
                      isActive(item.path) 
                        ? 'bg-gold text-white font-bold shadow-md shadow-gold/20' 
                        : 'text-text-primary hover:bg-gold/10 hover:text-gold font-bold'
                    }`}
                  >
                    <div className={`${isActive(item.path) ? 'text-white' : 'text-gold group-hover:scale-110 transition-transform'}`}>
                      {item.icon}
                    </div>
                    {!isSidebarCollapsed && (
                      <>
                        <span className="flex-1 truncate text-sm font-bold">{item.label}</span>
                        {item.badge && (
                          <span className={`px-1.5 py-0.5 text-[8px] font-bold rounded-md animate-pulse ${
                            isActive(item.path)
                              ? 'bg-white/20 text-white'
                              : 'bg-red-500/10 border border-red-500/20 text-red-600'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                    {isActive(item.path) && (
                      <motion.div 
                        layoutId="active-nav"
                        className={`absolute inset-y-2 w-1 bg-white rounded-full ${isRtl ? 'right-0' : 'left-0'}`}
                      />
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-border-custom space-y-2">
          {!isSidebarCollapsed && (
            <div className="px-4 py-3 bg-surface-2 border border-border-custom rounded-xl mb-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gold rounded-xl flex items-center justify-center text-white font-bold text-sm uppercase shadow-sm shrink-0">
                  {user?.name?.slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate text-text-primary">{user?.name}</p>
                  <p className="text-[11px] font-medium text-text-secondary truncate">{user?.email}</p>
                </div>
              </div>
            </div>
          )}
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors text-sm font-bold"
          >
            <LogOut size={18} />
            {!isSidebarCollapsed && <span>{t('restaurant.nav.logout')}</span>}
          </button>
          
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="w-full flex items-center justify-center p-2.5 text-text-primary hover:text-gold hover:bg-gold/10 rounded-xl transition-colors font-bold"
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
        <header className="h-16 bg-main/90 backdrop-blur-md border-b border-border-custom flex items-center justify-between px-4 lg:px-8 sticky top-0 z-20">
          <div className="flex items-center gap-4 relative z-10">
            <button 
              className="lg:hidden p-2.5 bg-card border border-border-custom rounded-lg text-gold hover:text-gold-dark transition-colors shadow-sm"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-card rounded-lg border border-border-custom shadow-sm">
              <Utensils size={14} className="text-gold" />
              <span className="text-xs font-bold text-text-primary tracking-wider">{user?.restaurantName || 'Restaurant Name'}</span>
              <span className="w-1 h-1 bg-border-custom rounded-full" />
              <BranchSwitcher />
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-4 relative z-10">
            {/* Language Toggle */}
            <button 
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              className="px-3 py-1.5 bg-card border border-border-custom rounded-lg text-[10px] font-bold hover:bg-surface-2 transition-colors flex items-center gap-2 text-text-primary tracking-wider uppercase shadow-sm"
            >
              <Globe size={12} />
              {lang === 'ar' ? 'EN' : 'AR'}
            </button>

            <button className="p-2 text-text-secondary hover:text-text-primary relative transition-colors">
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-main" />
            </button>

            <div className="w-8 h-8 bg-card rounded-lg border border-border-custom overflow-hidden cursor-pointer hover:border-gold/40 transition-colors shadow-sm">
              <img 
                src={`https://ui-avatars.com/api/?name=${user?.name}&background=351344&color=FFFFFF`} 
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
                <Route path="/app-connection" element={<AppConnection />} />
                <Route path="/settings" element={<div className="p-12 text-center text-text-secondary">{t('admin.system.underDevelopmentDesc').replace('{tab}', t('restaurant.nav.settings'))}</div>} />
                <Route path="/pos" element={<POSScreen />} />
                <Route path="/pos-products" element={<POSProducts />} />
                <Route path="/pos-inventory" element={<POSInventory />} />
                <Route path="/pos-expenses" element={<POSExpenses />} />
                <Route path="/pos-invoices" element={<POSInvoices />} />
                <Route path="/pos-reports" element={<POSReports />} />
                <Route path="/pos-settings" element={<POSSettings />} />
                <Route path="/subscription" element={<Subscription />} />
                <Route path="/security" element={<SecuritySettings />} />
                <Route path="/whatsapp-sales-agent" element={<WhatsAppSalesAgent />} />
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
              className={`fixed inset-y-0 ${isRtl ? 'right-0' : 'left-0'} w-[280px] bg-card z-50 lg:hidden flex flex-col shadow-2xl`}
            >
              <div className="h-16 flex items-center justify-between px-6 border-b border-border-custom">
                <img src="/logo.png" alt="VISIONO" className="h-8 object-contain" />
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-text-primary hover:text-gold">
                  <X size={24} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-6 px-4 space-y-6">
                {navItems.map((group, i) => (
                  <div key={`mobile-nav-group-${i}-${group.group}`} className="space-y-2">
                    <p className="px-4 text-[11px] font-extrabold text-gold/80 uppercase tracking-wider mb-2">
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
                              ? 'bg-gold text-white font-bold shadow-md shadow-gold/20' 
                              : 'text-text-primary hover:bg-gold/10 hover:text-gold font-bold'
                          }`}
                        >
                          <div className={isActive(item.path) ? 'text-white' : 'text-gold'}>
                            {item.icon}
                          </div>
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
              <div className="p-4 border-t border-border-custom space-y-2">
                <div className="px-4 py-3 bg-surface-2 border border-border-custom rounded-xl mb-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gold rounded-xl flex items-center justify-center text-white font-bold text-sm uppercase shadow-sm shrink-0">
                      {user?.name?.slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate text-text-primary">{user?.name}</p>
                      <p className="text-[11px] font-medium text-text-secondary truncate">{user?.email}</p>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all font-bold"
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
