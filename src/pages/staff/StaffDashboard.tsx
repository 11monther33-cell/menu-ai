import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStaffSession } from '../../hooks/useStaffSession';
import { 
  Building2, LogOut, UserCheck, Shield, Calculator, 
  ClipboardList, Zap, Utensils, Package, TrendingDown, 
  FileText, BarChart3, Layers, QrCode, ArrowLeft, ArrowRight,
  Flame, MessageSquare, ArrowUpRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ActionItem {
  id: string;
  permKey: string;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  path: string;
  icon: React.ElementType;
  badge?: string;
  highlight?: boolean;
}

const ROLE_LABELS: Record<string, { ar: string; en: string; color: string }> = {
  cashier:        { ar: 'كاشير',        en: 'Cashier',        color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  chef:           { ar: 'طباخ',         en: 'Chef',           color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
  waiter:         { ar: 'نادل',         en: 'Waiter',         color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  branch_manager: { ar: 'مدير فرع',     en: 'Branch Manager', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
};

export const StaffDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const { session, clearSession, hasPermission } = useStaffSession();

  React.useEffect(() => {
    if (!session) {
      navigate('/login');
    }
  }, [session, navigate]);

  if (!session) {
    return null;
  }

  const handleLogout = () => {
    const restId = session.restaurantId;
    clearSession();
    toast.success(isRtl ? 'تم تسجيل الخروج بنجاح' : 'Logged out successfully');
    if (restId) {
      navigate(`/staff-login/${restId}`);
    } else {
      navigate('/login');
    }
  };

  const handleSwitchStaff = () => {
    const restId = session.restaurantId;
    clearSession();
    if (restId) {
      navigate(`/staff-login/${restId}`);
    } else {
      navigate('/login');
    }
  };

  const ALL_ACTIONS: ActionItem[] = [
    {
      id: 'pos',
      permKey: 'use_pos',
      titleAr: 'نقطة البيع (POS)',
      titleEn: 'Point of Sale (POS)',
      descAr: 'تسجيل الطلبات، الدفع السريع، وإصدار الفواتير',
      descEn: 'Register orders, accept payments & print receipts',
      path: '/dashboard/pos',
      icon: Calculator,
      highlight: true
    },
    {
      id: 'orders',
      permKey: 'view_orders',
      titleAr: 'إدارة الطلبات',
      titleEn: 'Orders Management',
      descAr: 'متابعة الطلبات المفتوحة والمغلقة والملغاة',
      descEn: 'Track active, completed and canceled orders',
      path: '/dashboard/orders',
      icon: ClipboardList
    },
    {
      id: 'live_orders',
      permKey: 'live_orders',
      titleAr: 'طلبات مباشرة (Live)',
      titleEn: 'Live Orders',
      descAr: 'عرض الطلبات الواردة لحظة بلحظة مع التنبيهات',
      descEn: 'Real-time order feed with audio notifications',
      path: '/dashboard/live-orders',
      icon: Zap
    },
    {
      id: 'kitchen_pulse',
      permKey: 'kitchen_pulse',
      titleAr: 'نبض المطبخ (KDS)',
      titleEn: 'Kitchen Display (KDS)',
      descAr: 'شاشة المطبخ لتجهيز الوجبات والأطباق',
      descEn: 'Kitchen line display to prepare active dishes',
      path: '/dashboard/kitchen-pulse',
      icon: Flame
    },
    {
      id: 'chef_notes',
      permKey: 'chef_notes',
      titleAr: 'ملاحظات الشيف',
      titleEn: 'Chef Notes',
      descAr: 'تعديل التفضيلات والملاحظات للمطبخ',
      descEn: 'Special cooking preferences and notes',
      path: '/dashboard/chef-notes',
      icon: MessageSquare
    },
    {
      id: 'pos_products',
      permKey: 'pos_products',
      titleAr: 'إدارة المنتجات',
      titleEn: 'Products Management',
      descAr: 'تعديل الأسعار وتوفر الأصناف',
      descEn: 'Manage item availability and prices',
      path: '/dashboard/pos-products',
      icon: Utensils
    },
    {
      id: 'pos_inventory',
      permKey: 'pos_inventory',
      titleAr: 'المخزون',
      titleEn: 'Inventory Management',
      descAr: 'متابعة كميات المواد الأولية والمخزون',
      descEn: 'Monitor stock levels and ingredients',
      path: '/dashboard/pos-inventory',
      icon: Package
    },
    {
      id: 'pos_expenses',
      permKey: 'pos_expenses',
      titleAr: 'المصروفات',
      titleEn: 'Expenses',
      descAr: 'تسجيل المصروفات اليومية والفواتير',
      descEn: 'Log operational expenses and invoices',
      path: '/dashboard/pos-expenses',
      icon: TrendingDown
    },
    {
      id: 'pos_invoices',
      permKey: 'pos_invoices',
      titleAr: 'الفواتير',
      titleEn: 'Invoices',
      descAr: 'أرشيف فواتير المبيعات الضريبية',
      descEn: 'Tax invoice archives and search',
      path: '/dashboard/pos-invoices',
      icon: FileText
    },
    {
      id: 'pos_reports',
      permKey: 'view_reports',
      titleAr: 'التقارير المالية',
      titleEn: 'Financial Reports',
      descAr: 'ملخص المبيعات، الضرائب، والأداء اليومي',
      descEn: 'Sales summary, taxes & shift reports',
      path: '/dashboard/pos-reports',
      icon: BarChart3
    },
    {
      id: 'menu_builder',
      permKey: 'manage_menu',
      titleAr: 'بناء المنيو',
      titleEn: 'Menu Builder',
      descAr: 'إدارة الأطباق، الصور، والتفاصيل',
      descEn: 'Manage dishes, imagery and details',
      path: '/dashboard/menu-builder',
      icon: Layers
    },
    {
      id: 'qr_codes',
      permKey: 'qr_codes',
      titleAr: 'رموز QR',
      titleEn: 'QR Codes',
      descAr: 'توليد وطباعة باركود الطاولات',
      descEn: 'Generate and print table QR codes',
      path: '/dashboard/qr-codes',
      icon: QrCode
    },
    {
      id: 'analytics',
      permKey: 'analytics',
      titleAr: 'التحليلات',
      titleEn: 'Analytics',
      descAr: 'إحصائيات الإقبال والأطباق الأكثر طلباً',
      descEn: 'Guest trends & top performing dishes',
      path: '/dashboard/analytics',
      icon: BarChart3
    },
    {
      id: 'branches',
      permKey: 'manage_branches',
      titleAr: 'الفروع والموظفون',
      titleEn: 'Branches & Staff',
      descAr: 'إدارة الفروع وصلاحيات طاقم العمل',
      descEn: 'Manage branches and team access',
      path: '/dashboard/branches',
      icon: Building2
    }
  ];

  const allowedActions = ALL_ACTIONS.filter(item => {
    if (session.role === 'branch_manager') return true;
    return hasPermission(item.permKey);
  });

  const roleInfo = ROLE_LABELS[session.role] || {
    ar: session.role,
    en: session.role,
    color: 'bg-gray-100 text-gray-700'
  };

  return (
    <div className="min-h-screen bg-main text-text-primary flex flex-col">
      {/* Top Header */}
      <header className="bg-card border-b border-border-custom sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          {/* Restaurant & Staff badge */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gold/15 text-gold flex items-center justify-center font-black text-xl shadow-sm">
              {session.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-base sm:text-lg text-text-primary">
                  {session.name}
                </h1>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${roleInfo.color}`}>
                  {isRtl ? roleInfo.ar : roleInfo.en}
                </span>
              </div>
              <p className="text-xs text-text-secondary flex items-center gap-1.5 font-medium">
                <Building2 size={13} className="text-gold" />
                <span>{session.restaurantName || 'VISIONO'}</span>
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSwitchStaff}
              className="flex items-center gap-1.5 px-3 py-2 bg-surface-2 hover:bg-gold/10 hover:text-gold border border-border-custom rounded-xl text-xs font-bold text-text-secondary transition-all"
            >
              <UserCheck size={15} />
              <span className="hidden sm:inline">{isRtl ? 'تبديل الموظف' : 'Switch Staff'}</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-bold transition-all"
            >
              <LogOut size={15} />
              <span>{isRtl ? 'خروج' : 'Logout'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto w-full flex-1 px-4 sm:px-6 py-8">
        {/* Welcome Banner */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-2 border border-border-custom rounded-3xl p-6 shadow-sm">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-text-primary mb-1">
              {isRtl ? `أهلاً بك، ${session.name} 👋` : `Welcome, ${session.name} 👋`}
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary">
              {isRtl 
                ? 'الأقسام المتاحة لك وفقاً لصلاحياتك في النظام:' 
                : 'Available sections authorized for your role:'}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <Shield size={16} className="text-gold" />
            <span>
              {isRtl 
                ? `${allowedActions.length} أقسام متاحة` 
                : `${allowedActions.length} sections enabled`}
            </span>
          </div>
        </div>

        {/* Empty State */}
        {allowedActions.length === 0 ? (
          <div className="bg-card border border-border-custom rounded-3xl p-12 text-center max-w-md mx-auto shadow-sm">
            <div className="w-16 h-16 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mx-auto mb-4">
              <Shield size={32} />
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-2">
              {isRtl ? 'لا توجد صلاحيات مخصصة لك' : 'No Permissions Assigned'}
            </h3>
            <p className="text-sm text-text-secondary mb-6 leading-relaxed">
              {isRtl
                ? 'لم يقم مدير المطعم بتفعيل أي صلاحية لحسابك بعد. يرجى مراجعة المسؤول لإسناد الصلاحيات المطلوبة.'
                : 'The restaurant owner has not assigned any permissions to your profile yet. Please contact your manager.'}
            </p>
            <button
              onClick={handleSwitchStaff}
              className="py-3 px-6 bg-gold text-white font-bold rounded-xl hover:bg-gold/90 transition-all shadow-md shadow-gold/20"
            >
              {isRtl ? 'تسجيل الدخول بموظف آخر' : 'Login as Another Staff'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {allowedActions.map(action => {
              const Icon = action.icon;
              return (
                <div
                  key={action.id}
                  onClick={() => navigate(action.path)}
                  className={`group relative bg-card border rounded-3xl p-6 transition-all duration-200 hover:shadow-xl hover:-translate-y-1 cursor-pointer flex flex-col justify-between ${
                    action.highlight
                      ? 'border-gold/40 shadow-sm shadow-gold/10'
                      : 'border-border-custom hover:border-gold'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-13 h-13 rounded-2xl flex items-center justify-center transition-colors shadow-sm ${
                        action.highlight
                          ? 'bg-gold text-white'
                          : 'bg-gold/15 text-gold group-hover:bg-gold group-hover:text-white'
                      }`}>
                        <Icon size={26} />
                      </div>
                      <div className="w-8 h-8 rounded-full bg-surface-2 group-hover:bg-gold/15 text-text-secondary group-hover:text-gold flex items-center justify-center transition-colors">
                        <ArrowUpRight size={18} />
                      </div>
                    </div>
                    <h3 className="font-bold text-base sm:text-lg text-text-primary group-hover:text-gold transition-colors mb-1.5">
                      {isRtl ? action.titleAr : action.titleEn}
                    </h3>
                    <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
                      {isRtl ? action.descAr : action.descEn}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-border-custom flex items-center justify-between text-xs font-bold text-gold">
                    <span>{isRtl ? 'فتح القسم' : 'Open Section'}</span>
                    {isRtl ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border-custom bg-card py-4 text-center text-xs text-text-secondary">
        <p>VISIONO Smart Restaurant System • Staff Terminal</p>
      </footer>
    </div>
  );
};
