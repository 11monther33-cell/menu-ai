import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../hooks/useAuth';
import { 
  LayoutDashboard, Store, Users, DollarSign, 
  Clock, CheckCircle, XCircle, LogOut, 
  Search, Filter, ExternalLink, ChevronRight,
  TrendingUp, TrendingDown, Activity, Shield,
  Settings, Bell, Mail, Dice5, BarChart3,
  CreditCard, Tag, Flag, Globe, Zap,
  Plus, Eye, Edit, Trash2, RefreshCw, Building2,
  Menu, X, Box, QrCode as QrIcon
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar 
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { logAdminAction } from '../../lib/adminLogger';
import { ActivityFeed } from '../../components/admin/ActivityFeed';

export const AdminDashboard = () => {
  // 🔒 SECURITY: No debug logging in production
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { lang, setLang, t, isRtl } = useLanguage();
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // 🔒 SECURITY: Paddle settings loaded from DB only — never hardcoded
  const [paddleSettings, setPaddleSettings] = useState({
    client_token: '',
    environment: 'sandbox',
    price_basic_monthly: '',
    price_basic_annual: '',
    price_pro_monthly: '',
    price_pro_annual: '',
    price_ent_monthly: '',
    price_ent_annual: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [viewingRestaurant, setViewingRestaurant] = useState<any>(null);
  const [editingRestaurant, setEditingRestaurant] = useState<any>(null);
  const [editForm, setEditForm] = useState({ plan: '', status: '' });
  const [restaurantUsage, setRestaurantUsage] = useState<any[]>([]);
  const [loadingUsage, setLoadingUsage] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    revenue: 0,
    mrr: 0,
    arr: 0,
    churn: 0,
    scans: 0,
    growth: 0
  });

  useEffect(() => {
    // 🔒 SECURITY: Client-side role check — defense in depth
    // The REAL protection is RLS policies on system_settings table
    if (!authLoading && (!user || user.role !== 'SUPER_ADMIN')) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    fetchRestaurants();

    // Add real-time subscription
    const subscription = supabase
      .channel('admin_restaurants_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'restaurants' 
      }, () => {
        fetchRestaurants();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  useEffect(() => {
    if (activeTab === 'payment_settings') {
      fetchPaddleSettings();
    }
  }, [activeTab]);

  
  const handleViewRestaurant = async (restaurant: any) => {
    setViewingRestaurant(restaurant);
    setLoadingUsage(true);
    try {
      const { data, error } = await supabase
        .from('restaurant_usage_metrics')
        .select('*')
        .eq('restaurant_id', restaurant.id);
      
      if (!error && data) {
        setRestaurantUsage(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsage(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRestaurant) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('restaurants')
        .update({ 
          plan: editForm.plan,
          status: editForm.status
        })
        .eq('id', editingRestaurant.id);

      if (error) throw error;

      await logAdminAction('plan_changed', 'restaurant', editingRestaurant.id, {
        old_plan: editingRestaurant.plan,
        new_plan: editForm.plan,
        old_status: editingRestaurant.status,
        new_status: editForm.status
      });

      toast.success(isRtl ? 'تم تحديث بيانات المطعم بنجاح' : 'Restaurant updated successfully');
      setEditingRestaurant(null);
      fetchRestaurants();
    } catch (err) {
      console.error(err);
      toast.error(isRtl ? 'فشل التحديث' : 'Update failed');
    } finally {
      setIsSaving(false);
    }
  };

  const fetchPaddleSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .in('key', [
          'paddle_client_token',
          'paddle_environment',
          'paddle_price_basic_monthly',
          'paddle_price_basic_annual',
          'paddle_price_pro_monthly',
          'paddle_price_pro_annual',
          'paddle_price_ent_monthly',
          'paddle_price_ent_annual'
        ]);

      if (error) throw error;

      if (data) {
        const settings: any = { ...paddleSettings };
        data.forEach(item => {
          if (item.key === 'paddle_client_token') settings.client_token = item.value;
          if (item.key === 'paddle_environment') settings.environment = item.value;
          if (item.key === 'paddle_price_basic_monthly') settings.price_basic_monthly = item.value;
          if (item.key === 'paddle_price_basic_annual') settings.price_basic_annual = item.value;
          if (item.key === 'paddle_price_pro_monthly') settings.price_pro_monthly = item.value;
          if (item.key === 'paddle_price_pro_annual') settings.price_pro_annual = item.value;
          if (item.key === 'paddle_price_ent_monthly') settings.price_ent_monthly = item.value;
          if (item.key === 'paddle_price_ent_annual') settings.price_ent_annual = item.value;
        });
        setPaddleSettings(settings);
      }
    } catch (error) {
      // 🔒 Don't log sensitive settings errors to console
    }
  };

  const savePaddleSetting = async (key: string, value: string) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });

      if (error) throw error;
      toast.success(isRtl ? 'تم الحفظ بنجاح' : 'Saved successfully');
    } catch (error: any) {
      toast.error(isRtl ? 'فشل الحفظ' : 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      // Improved query with explicit relation
      const { data, error } = await supabase
        .from('restaurants')
        .select(`
          *,
          profiles!owner_id (
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        // Fallback if the join fails due to schema/RLS issues
        // 🔒 Fallback silently if join query fails
        const { data: simpleData, error: simpleError } = await supabase
          .from('restaurants')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (simpleError) throw simpleError;
        
        const formattedData = simpleData?.map((r: any) => ({
          ...r,
          owner_email: 'N/A'
        })) || [];
        setRestaurants(formattedData);
        updateStats(formattedData);
      } else {
        const formattedData = data?.map((r: any) => ({
          ...r,
          owner_email: r.profiles?.email || 'N/A'
        })) || [];
        setRestaurants(formattedData);
        updateStats(formattedData);
      }
    } catch (error: any) {
      // 🔒 Don't log to console
      toast.error(isRtl ? 'فشل في تحميل البيانات' : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const updateStats = (data: any[]) => {
    setStats(prev => ({
      ...prev,
      total: data.length,
      pending: data.filter((r: any) => r.status === 'PENDING').length,
      approved: data.filter((r: any) => r.status === 'APPROVED').length,
    }));
  };

  const handleApprove = async (id: string) => {
    const loadingToast = toast.loading(isRtl ? 'جاري الموافقة...' : 'Approving...');
    try {
      const { error } = await supabase
        .from('restaurants')
        .update({ status: 'APPROVED' })
        .eq('id', id);

      if (error) throw error;
      
      toast.success(isRtl ? 'تمت الموافقة على المطعم بنجاح' : 'Restaurant approved successfully', { id: loadingToast });
      fetchRestaurants();
    } catch (error: any) {
      // 🔒 Don't expose raw errors
      toast.error(isRtl ? 'فشل في الموافقة' : 'Failed to approve', { id: loadingToast });
    }
  };

  const handleReject = async (id: string) => {
    const loadingToast = toast.loading(isRtl ? 'جاري الرفض...' : 'Rejecting...');
    try {
      const { error } = await supabase
        .from('restaurants')
        .update({ status: 'REJECTED' })
        .eq('id', id);

      if (error) throw error;
      
      toast.success(isRtl ? 'تم رفض المطعم' : 'Restaurant rejected', { id: loadingToast });
      fetchRestaurants();
    } catch (error: any) {
      // 🔒 Don't expose raw errors
      toast.error(isRtl ? 'فشل في الرفض' : 'Failed to reject', { id: loadingToast });
    }
  };

  const handleLogout = async () => {
    const loadingToast = toast.loading(isRtl ? 'جاري تسجيل الخروج...' : 'Logging out...');
    try {
      await supabase.auth.signOut();
      toast.success(isRtl ? 'تم تسجيل الخروج بنجاح' : 'Logged out successfully', { id: loadingToast });
      navigate('/login');
    } catch (error: any) {
      // 🔒 Don't log errors
      toast.error(isRtl ? 'فشل تسجيل الخروج' : 'Logout failed', { id: loadingToast });
      // Still navigate as fallback
      navigate('/login');
    }
  };

  if (authLoading) {
    return (
      <div className="h-screen bg-dark flex items-center justify-center">
        <RefreshCw className="animate-spin text-gold" size={48} />
      </div>
    );
  }

  const chartData = [
    { name: isRtl ? 'يناير' : 'Jan', value: 0, scans: 0 },
    { name: isRtl ? 'فبراير' : 'Feb', value: 0, scans: 0 },
    { name: isRtl ? 'مارس' : 'Mar', value: 0, scans: 0 },
    { name: isRtl ? 'أبريل' : 'Apr', value: 0, scans: 0 },
    { name: isRtl ? 'مايو' : 'May', value: 0, scans: 0 },
    { name: isRtl ? 'يونيو' : 'Jun', value: 0, scans: 0 },
  ];

  const sidebarItems = [
    { 
      label: t('admin.nav.core'), 
      items: [
        { id: 'dashboard', icon: <LayoutDashboard size={18} />, label: t('admin.dashboard') },
      ]
    },
    { 
      label: t('admin.nav.restaurants'), 
      items: [
        { id: 'restaurants', icon: <Store size={18} />, label: t('admin.pages.restaurants.title') },
        { id: 'approvals', icon: <Clock size={18} />, label: t('admin.pages.approvals.title'), badge: stats.pending },
      ]
    },
    { 
      label: t('admin.nav.pricing'), 
      items: [
        { id: 'pricing', icon: <DollarSign size={18} />, label: t('admin.pages.pricing.title') },
        { id: 'coupons', icon: <Tag size={18} />, label: t('admin.nav.items.coupons') },
      ]
    },
    { 
      label: t('admin.nav.features'), 
      items: [
        { id: 'features', icon: <Zap size={18} />, label: t('admin.pages.features.title') },
        { id: 'settings', icon: <Settings size={18} />, label: t('admin.nav.items.settings') },
      ]
    },
    { 
      label: t('admin.nav.revenue'), 
      items: [
        { id: 'revenue', icon: <TrendingUp size={18} />, label: t('admin.pages.revenue.title') },
        { id: 'payment_settings', icon: <CreditCard size={18} />, label: isRtl ? 'إعدادات الدفع (Paddle)' : 'Payment Settings (Paddle)' },
        { id: 'subscriptions', icon: <CreditCard size={18} />, label: t('admin.nav.items.subscriptions') },
      ]
    },
    { 
      label: t('admin.nav.users'), 
      items: [
        { id: 'users', icon: <Users size={18} />, label: t('admin.users') },
        { id: 'roles', icon: <Shield size={18} />, label: t('admin.nav.items.roles') },
      ]
    },
    { 
      label: t('admin.nav.analytics'), 
      items: [
        { id: 'analytics', icon: <BarChart3 size={18} />, label: t('admin.nav.analytics') },
      ]
    },
    { 
      label: t('admin.nav.content'), 
      items: [
        { id: '3d', icon: <Dice5 size={18} />, label: t('admin.nav.items.requests3d') },
        { id: 'emails', icon: <Mail size={18} />, label: t('admin.nav.items.emails') },
      ]
    },
    { 
      label: t('admin.nav.communication'), 
      items: [
        { id: 'notifications', icon: <Bell size={18} />, label: t('admin.nav.items.notifications') },
        { id: 'announcements', icon: <Flag size={18} />, label: t('admin.nav.items.announcements') },
      ]
    },
    { 
      label: t('admin.nav.security'), 
      items: [
        { id: 'logs', icon: <Activity size={18} />, label: t('admin.nav.items.logs') },
        { id: 'security', icon: <Shield size={18} />, label: t('admin.nav.items.security') },
      ]
    }
  ];

  const renderDashboard = () => (
    <>
      {/* Instructions Section */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gold/5 border border-gold/20 p-8 rounded-[2rem] mb-10 relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
          <Zap size={120} className="text-gold" />
        </div>
        <h3 className="text-xl font-bold text-gold mb-4 flex items-center gap-2">
          <CheckCircle size={24} />
          {t('admin.instructionsTitle')}
        </h3>
        <ul className="grid md:grid-cols-2 gap-4 relative z-10">
          {Array.isArray(t('admin.instructions')) && t('admin.instructions').map((instruction: string, i: number) => (
            <li key={`instruction-${i}`} className="flex items-start gap-3 text-muted">
              <div className="w-6 h-6 bg-gold/10 text-gold rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">
                {i + 1}
              </div>
              <span className="text-sm leading-relaxed">{instruction}</span>
            </li>
          ))}
        </ul>
      </motion.div>

      {/* VISIONO Setup Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-sidebar border border-border-custom p-8 rounded-[2.5rem] mb-10"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gold/10 text-gold rounded-2xl flex items-center justify-center">
              <Dice5 size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-text-primary">VISIONO System Setup</h3>
              <p className="text-sm text-text-secondary">Initialize database schema and core features</p>
            </div>
          </div>
          <button 
            onClick={() => {
              toast.success('Schema file created at /supabase_schema.sql. Please run it in Supabase SQL Editor.');
            }}
            className="px-6 py-3 bg-gold text-white font-bold rounded-xl shadow-lg shadow-gold/20 hover:bg-gold/90 transition-all flex items-center gap-2"
          >
            <RefreshCw size={20} />
            Run Setup
          </button>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { label: '3D Models', status: 'Ready', icon: <Box className="text-blue-500" /> },
            { label: 'QR Engine', status: 'Active', icon: <QrIcon className="text-gold" /> },
            { label: 'AR Viewer', status: 'Enabled', icon: <Globe className="text-green-500" /> },
          ].map((item, i) => (
            <div key={`setup-item-${i}-${item.label}`} className="bg-card border border-border-custom p-4 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                {item.icon}
                <span className="text-sm font-bold text-text-primary">{item.label}</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-1 bg-green-500/10 text-green-500 rounded-full">{item.status}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[
          { label: t('admin.totalRestaurants'), value: stats.total, icon: <Store />, color: 'text-blue-500', bg: 'bg-blue-500/10', trend: '+12%' },
          { label: t('admin.pendingApprovals'), value: stats.pending, icon: <Clock />, color: 'text-amber-500', bg: 'bg-amber-500/10', trend: t('admin.priority') },
          { label: t('admin.stats.mrr'), value: `$${stats.mrr.toLocaleString()}`, icon: <DollarSign />, color: 'text-green-500', bg: 'bg-green-500/10', trend: '+8.2%' },
          { label: t('admin.stats.scans'), value: stats.scans.toLocaleString(), icon: <Globe />, color: 'text-purple-500', bg: 'bg-purple-500/10', trend: '+24%' },
        ].map((card, i) => (
          <motion.div 
            key={`kpi-card-${i}-${card.label}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-dark-2 border border-surface p-6 rounded-3xl group hover:border-gold/30 transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`w-12 h-12 ${card.bg} ${card.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                {card.icon}
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${card.trend.includes('+') ? 'bg-green-500/10 text-green-500' : 'bg-gold/10 text-gold'}`}>
                {card.trend}
              </span>
            </div>
            <p className="text-muted text-xs mb-1 uppercase tracking-wider font-medium">{card.label}</p>
            <p className="text-3xl font-bold tracking-tight">{card.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[
          { label: t('admin.stats.arr'), value: `$${stats.arr.toLocaleString()}` },
          { label: t('admin.stats.churn'), value: `${stats.churn}%`, trend: 'down' },
          { label: t('admin.stats.growth'), value: `${stats.growth}%`, trend: 'up' },
          { label: t('admin.activeUsers'), value: '0' },
        ].map((stat, i) => (
          <div key={`secondary-stat-${i}-${stat.label}`} className="bg-surface/20 border border-surface p-4 rounded-2xl">
            <p className="text-muted text-[10px] uppercase tracking-widest mb-1">{stat.label}</p>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold">{stat.value}</span>
              {stat.trend === 'up' && <TrendingUp size={14} className="text-green-500" />}
              {stat.trend === 'down' && <TrendingDown size={14} className="text-green-500" />}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-3 gap-8 mb-10">
        <div className="lg:col-span-2 bg-dark-2 border border-surface p-8 rounded-[2rem]">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold">{t('admin.revenueGrowth')}</h3>
            <select className="bg-surface border border-surface rounded-lg px-3 py-1.5 text-xs outline-none focus:border-gold">
              <option>Last 6 Months</option>
              <option>Last Year</option>
            </select>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#C9A84C" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#242220" vertical={false} />
                <XAxis dataKey="name" stroke="#8B8578" fontSize={10} tickLine={false} axisLine={false} reversed={isRtl} />
                <YAxis stroke="#8B8578" fontSize={10} tickLine={false} axisLine={false} orientation={isRtl ? 'right' : 'left'} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A1917', border: '1px solid #242220', borderRadius: '12px' }}
                  itemStyle={{ color: '#C9A84C' }}
                />
                <Area type="monotone" dataKey="value" stroke="#C9A84C" fillOpacity={1} fill="url(#colorValue)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-dark-2 border border-surface p-8 rounded-[2rem]">
          <h3 className="text-xl font-bold mb-8">{t('admin.registrationsByCity')}</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#242220" vertical={false} />
                <XAxis dataKey="name" stroke="#8B8578" fontSize={10} tickLine={false} axisLine={false} reversed={isRtl} />
                <YAxis stroke="#8B8578" fontSize={10} tickLine={false} axisLine={false} orientation={isRtl ? 'right' : 'left'} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A1917', border: '1px solid #242220', borderRadius: '12px' }}
                />
                <Bar dataKey="scans" fill="#C9A84C" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Pending Approvals Table */}
        <div className="lg:col-span-2 bg-dark-2 border border-surface rounded-[2rem] overflow-hidden">
          <div className="p-8 border-b border-surface flex justify-between items-center bg-surface/10">
            <h3 className="text-xl font-bold">{t('admin.pendingApprovals')}</h3>
            <button 
              onClick={() => setActiveTab('approvals')}
              className="text-gold text-sm font-bold hover:underline flex items-center gap-1"
            >
              {t('admin.viewAll')}
              <ChevronRight size={16} className={isRtl ? 'rotate-180' : ''} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className={`w-full ${isRtl ? 'text-right' : 'text-left'}`}>
              <thead>
                <tr className="bg-surface/30 text-muted text-[10px] uppercase tracking-widest">
                  <th className="px-8 py-4 font-bold">{t('admin.restaurant')}</th>
                  <th className="px-8 py-4 font-bold">{t('admin.city')}</th>
                  <th className="px-8 py-4 font-bold">{t('admin.status')}</th>
                  <th className={`px-8 py-4 font-bold ${isRtl ? 'text-left' : 'text-right'}`}>{t('admin.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <RefreshCw className="animate-spin text-gold" size={24} />
                        <p className="text-muted text-sm">{t('admin.system.loading')}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <>
                    {restaurants.filter(r => r.status === 'PENDING').slice(0, 5).map((r, i) => (
                      <tr key={`pending-res-${r.id || i}`} className="hover:bg-surface/20 transition-colors group">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-surface rounded-xl flex items-center justify-center font-bold text-gold border border-surface group-hover:border-gold/30 transition-all">
                              {(r.name_en || r.name_ar || '?').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-sm">{isRtl ? (r.name_ar || r.name_en) : (r.name_en || r.name_ar)}</p>
                              <p className="text-[10px] text-muted">{r.owner_email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-sm text-muted">{r.city}</td>
                        <td className="px-8 py-5">
                          <span className="px-3 py-1 bg-amber-500/10 text-amber-500 text-[10px] font-bold rounded-full border border-amber-500/20">
                            {r.status}
                          </span>
                        </td>
                        <td className={`px-8 py-5 ${isRtl ? 'text-left' : 'text-right'}`}>
                          <div className={`flex ${isRtl ? 'justify-start' : 'justify-end'} gap-2`}>
                            <button 
                              onClick={() => handleApprove(r.id)}
                              className="p-2 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500/20 transition-all"
                              title={t('admin.approve')}
                            >
                              <CheckCircle size={16} />
                            </button>
                            <button 
                              onClick={() => handleReject(r.id)}
                              className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-all"
                              title={t('admin.reject')}
                            >
                              <XCircle size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {restaurants.filter(r => r.status === 'PENDING').length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-8 py-12 text-center text-muted text-sm">
                          <div className="flex flex-col items-center gap-2">
                            <Store className="text-surface" size={32} />
                            <p>{t('admin.noPending')}</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-dark-2 border border-surface rounded-[2rem] flex flex-col">
          <div className="p-8 border-b border-surface bg-surface/10">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Activity size={20} className="text-gold" />
              Activity Feed
            </h3>
          </div>
          <div className="flex-1 p-6 space-y-6">
            {[
              { user: 'Al Baraka', action: 'signed up', time: '2m ago', icon: <Zap size={14} />, color: 'text-gold', bg: 'bg-gold/10' },
              { user: 'Admin Sarah', action: 'approved Burger King', time: '15m ago', icon: <CheckCircle size={14} />, color: 'text-green-500', bg: 'bg-green-500/10' },
              { user: 'The Coffee Hub', action: 'upgraded to Pro', time: '1h ago', icon: <TrendingUp size={14} />, color: 'text-blue-500', bg: 'bg-blue-500/10' },
              { user: 'System', action: 'maintenance scheduled', time: '3h ago', icon: <Settings size={14} />, color: 'text-muted', bg: 'bg-surface' },
              { user: 'User 124', action: 'reported an issue', time: '5h ago', icon: <Activity size={14} />, color: 'text-red-500', bg: 'bg-red-500/10' },
            ].map((item, i) => (
              <div key={`activity-item-${i}-${item.user}`} className="flex gap-4 group">
                <div className={`w-8 h-8 ${item.bg} ${item.color} rounded-full flex items-center justify-center flex-shrink-0 mt-1 group-hover:scale-110 transition-transform`}>
                  {item.icon}
                </div>
                <div>
                  <p className="text-sm">
                    <span className="font-bold">{item.user}</span> {item.action}
                  </p>
                  <p className="text-[10px] text-muted mt-0.5">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="p-6 border-t border-surface">
            <button className="w-full py-3 bg-surface hover:bg-dark-2 text-muted hover:text-text text-sm font-bold rounded-xl transition-all border border-surface">
              {t('admin.system.viewAllActivity')}
            </button>
          </div>
        </div>
      </div>
    </>
  );

  const renderRestaurants = (onlyPending = false) => {
    const filteredRestaurants = onlyPending 
      ? restaurants.filter(r => r.status === 'PENDING')
      : restaurants;

    return (
      <div className="bg-dark-2 border border-surface rounded-[2rem] overflow-hidden">
        <div className="p-8 border-b border-surface flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface/10">
          <div>
            <h3 className="text-xl font-bold">
              {onlyPending ? t('admin.pages.approvals.title') : t('admin.pages.restaurants.title')}
            </h3>
            <p className="text-sm text-muted">
              {onlyPending ? t('admin.pages.approvals.desc') : t('admin.pages.restaurants.desc')}
            </p>
          </div>
          {!onlyPending && (
            <button 
              onClick={() => toast('Manual restaurant addition coming soon')}
              className="flex items-center gap-2 bg-gold text-dark px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-gold/90 transition-all"
            >
              <Plus size={18} />
              {t('admin.system.addManual')}
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className={`w-full ${isRtl ? 'text-right' : 'text-left'}`}>
            <thead>
              <tr className="bg-surface/30 text-muted text-[10px] uppercase tracking-widest">
                <th className="px-8 py-4 font-bold">{t('admin.restaurant')}</th>
                <th className="px-8 py-4 font-bold">{t('admin.city')}</th>
                <th className="px-8 py-4 font-bold">{t('admin.status')}</th>
                <th className="px-8 py-4 font-bold">{t('admin.plan')}</th>
                <th className={`px-8 py-4 font-bold ${isRtl ? 'text-left' : 'text-right'}`}>{t('admin.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <RefreshCw className="animate-spin text-gold" size={24} />
                      <p className="text-muted text-sm">{t('admin.system.loading')}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                <>
                  {filteredRestaurants.map((r, i) => (
                    <tr key={`res-row-${r.id || i}`} className="hover:bg-surface/20 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-surface rounded-xl flex items-center justify-center font-bold text-gold border border-surface group-hover:border-gold/30 transition-all">
                            {(r.name_en || r.name_ar || '?').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-sm">{isRtl ? (r.name_ar || r.name_en) : (r.name_en || r.name_ar)}</p>
                            <p className="text-[10px] text-muted">{r.owner_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-sm text-muted">{r.city}</td>
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1 text-[10px] font-bold rounded-full border ${
                          r.status === 'APPROVED' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                          r.status === 'PENDING' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                          'bg-red-500/10 text-red-500 border-red-500/20'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-xs font-medium text-text">{r.plan || t('admin.system.proPlan')}</span>
                      </td>
                      <td className={`px-8 py-5 ${isRtl ? 'text-left' : 'text-right'}`}>
                        <div className={`flex ${isRtl ? 'justify-start' : 'justify-end'} gap-2`}>
                          {onlyPending ? (
                            <>
                              <button 
                                onClick={() => handleApprove(r.id)}
                                className="p-2 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500/20 transition-all"
                                title={t('admin.system.tooltips.approve')}
                              >
                                <CheckCircle size={16} />
                              </button>
                              <button 
                                onClick={() => handleReject(r.id)}
                                className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-all"
                                title={t('admin.system.tooltips.reject')}
                              >
                                <XCircle size={16} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button 
                                onClick={() => handleViewRestaurant(r)}
                                className="p-2 bg-surface rounded-lg hover:text-gold transition-all" 
                                title={t('admin.system.tooltips.view')}
                              >
                                <Eye size={16} />
                              </button>
                              <button 
                                onClick={() => { setEditingRestaurant(r); setEditForm({ plan: r.plan || 'basic', status: r.status }); }}
                                className="p-2 bg-surface rounded-lg hover:text-gold transition-all" 
                                title={t('admin.system.tooltips.edit')}
                              >
                                <Edit size={16} />
                              </button>
                              <button 
                                onClick={() => {
                                  if (window.confirm('Are you sure you want to delete this restaurant?')) {
                                    toast.error('Delete functionality restricted for demo');
                                  }
                                }}
                                className="p-2 bg-surface rounded-lg hover:text-red-500 transition-all" 
                                title={t('admin.system.tooltips.delete')}
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredRestaurants.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-8 py-12 text-center text-muted text-sm">
                        <div className="flex flex-col items-center gap-2">
                          <Store className="text-surface" size={32} />
                          <p>{onlyPending ? t('admin.noPending') : t('admin.system.noRestaurants')}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderFeatures = () => (
    <div className="bg-dark-2 border border-surface rounded-[2rem] p-8">
      <div className="mb-8">
        <h3 className="text-xl font-bold">{t('admin.pages.features.title')}</h3>
        <p className="text-sm text-muted">{t('admin.pages.features.desc')}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { id: '3d_snap', name: t('admin.pages.features.items.snap.name'), desc: t('admin.pages.features.items.snap.desc'), active: true, icon: <Zap size={20} /> },
          { id: 'taste_dna', name: t('admin.pages.features.items.dna.name'), desc: t('admin.pages.features.items.dna.desc'), active: true, icon: <Activity size={20} /> },
          { id: 'mood_menu', name: t('admin.pages.features.items.mood.name'), desc: t('admin.pages.features.items.mood.desc'), active: false, icon: <Dice5 size={20} /> },
          { id: 'voice_order', name: t('admin.pages.features.items.voice.name'), desc: t('admin.pages.features.items.voice.desc'), active: true, icon: <Activity size={20} /> },
          { id: 'table_social', name: t('admin.pages.features.items.social.name'), desc: t('admin.pages.features.items.social.desc'), active: true, icon: <Users size={20} /> },
          { id: 'ar_view', name: t('admin.pages.features.items.ar.name'), desc: t('admin.pages.features.items.ar.desc'), active: false, icon: <Globe size={20} /> },
        ].map((feature) => (
          <div key={feature.id} className="flex items-center justify-between p-6 rounded-2xl border border-surface bg-surface/5 hover:border-gold/30 transition-all group">
            <div className="flex gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${feature.active ? 'bg-gold/10 text-gold' : 'bg-surface text-muted'}`}>
                {feature.icon}
              </div>
              <div>
                <h4 className="font-bold text-text group-hover:text-gold transition-colors">{feature.name}</h4>
                <p className="text-xs text-muted mt-1">{feature.desc}</p>
              </div>
            </div>
            <button className={`w-12 h-6 rounded-full transition-all relative ${feature.active ? 'bg-gold' : 'bg-surface'}`}>
              <div className={`absolute top-1 w-4 h-4 bg-dark rounded-full transition-all ${feature.active ? (isRtl ? 'left-1' : 'right-1') : (isRtl ? 'right-1' : 'left-1')}`} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPricing = () => (
    <div className="space-y-8">
      <div className="bg-dark-2 border border-surface rounded-[2rem] p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-xl font-bold">{t('admin.pages.pricing.title')}</h3>
            <p className="text-sm text-muted">{t('admin.pages.pricing.desc')}</p>
          </div>
          <button className="bg-gold text-dark px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-gold/90 transition-all">
            {t('admin.pages.pricing.addPlan')}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: 'Starter', price: '99', restaurants: 0, color: 'text-blue-500', bg: 'bg-blue-500/10' },
            { name: 'Pro', price: '199', restaurants: 0, color: 'text-gold', bg: 'bg-gold/10', popular: true },
            { name: 'Enterprise', price: '399', restaurants: 0, color: 'text-purple-500', bg: 'bg-purple-500/10' },
          ].map((plan, i) => (
            <div key={`pricing-plan-${i}-${plan.name}`} className={`p-6 rounded-3xl border ${plan.popular ? 'border-gold bg-gold/5' : 'border-surface bg-surface/5'} relative overflow-hidden group`}>
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-gold text-dark text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                  {t('admin.pages.pricing.mostPopular')}
                </div>
              )}
              <div className={`w-12 h-12 ${plan.bg} ${plan.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <CreditCard size={24} />
              </div>
              <h4 className="text-xl font-bold mb-1">{plan.name}</h4>
              <p className="text-3xl font-black text-gold mb-4">$ {plan.price}<span className="text-sm font-normal text-muted">/mo</span></p>
              <div className="flex items-center justify-between text-sm text-muted mb-6">
                <span>{t('admin.pages.pricing.activeSubs')}</span>
                <span className="font-bold text-text">{plan.restaurants}</span>
              </div>
              <button className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${plan.popular ? 'bg-gold text-dark' : 'bg-surface text-text hover:bg-surface/80'}`}>
                {t('admin.pages.pricing.editPlan')}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-dark-2 border border-surface rounded-[2rem] p-8">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xl font-bold">{t('admin.pages.pricing.couponsTitle')}</h3>
          <button className="text-gold text-sm font-bold hover:underline">{t('admin.pages.pricing.createCoupon')}</button>
        </div>
        <div className="space-y-4">
          {[
            { code: 'WELCOME50', discount: '50%', usage: '0/500', status: 'Active' },
            { code: 'RAMADAN2025', discount: '20%', usage: '0/1000', status: 'Active' },
            { code: 'EXPIRED10', discount: '10%', usage: '0/100', status: 'Expired' },
          ].map((coupon, i) => (
            <div key={`coupon-item-${i}-${coupon.code}`} className="flex items-center justify-between p-4 rounded-2xl border border-surface bg-surface/5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gold/10 text-gold rounded-xl flex items-center justify-center">
                  <Tag size={20} />
                </div>
                <div>
                  <p className="font-bold text-text">{coupon.code}</p>
                  <p className="text-xs text-muted">{t('admin.pages.pricing.discount')}: {coupon.discount}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">{coupon.usage}</p>
                <span className={`text-[10px] font-bold uppercase ${coupon.status === 'Active' ? 'text-green-500' : 'text-red-500'}`}>
                  {coupon.status === 'Active' ? t('admin.pages.pricing.status.active') : t('admin.pages.pricing.status.expired')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderRevenue = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: t('admin.pages.revenue.stats.net'), value: '$ 0', trend: '0%', icon: <DollarSign /> },
          { label: t('admin.pages.revenue.stats.active'), value: '0', trend: '0', icon: <Users /> },
          { label: t('admin.pages.revenue.stats.aov'), value: '$ 0', trend: '0%', icon: <TrendingUp /> },
        ].map((stat, i) => (
          <div key={`revenue-stat-${i}-${stat.label}`} className="bg-dark-2 border border-surface p-6 rounded-3xl">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-gold/10 text-gold rounded-2xl flex items-center justify-center">
                {stat.icon}
              </div>
              <span className="text-[10px] font-bold px-2 py-1 bg-green-500/10 text-green-500 rounded-full">
                {stat.trend}
              </span>
            </div>
            <p className="text-muted text-xs mb-1 uppercase tracking-wider">{stat.label}</p>
            <p className="text-3xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-dark-2 border border-surface p-8 rounded-[2rem]">
        <h3 className="text-xl font-bold mb-8">{t('admin.pages.revenue.title')}</h3>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#242220" vertical={false} />
              <XAxis dataKey="name" stroke="#8B8578" fontSize={10} tickLine={false} axisLine={false} reversed={isRtl} />
              <YAxis stroke="#8B8578" fontSize={10} tickLine={false} axisLine={false} orientation={isRtl ? 'right' : 'left'} />
              <Tooltip contentStyle={{ backgroundColor: '#1A1917', border: '1px solid #242220', borderRadius: '12px' }} />
              <Area type="monotone" dataKey="value" stroke="#C9A84C" fill="#C9A84C" fillOpacity={0.1} strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="bg-dark-2 border border-surface rounded-[2rem] overflow-hidden">
      <div className="p-8 border-b border-surface flex justify-between items-center bg-surface/10">
        <div>
          <h3 className="text-xl font-bold">{t('admin.users')}</h3>
          <p className="text-sm text-muted">Manage all system users and their roles</p>
        </div>
        <button className="bg-gold text-dark px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-gold/90 transition-all">
          <Plus size={18} />
          Add User
        </button>
      </div>
      <div className="p-12 text-center text-muted">
        <Users size={48} className="mx-auto mb-4 opacity-20" />
        <p>User management interface coming soon.</p>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-dark-2 border border-surface p-6 rounded-3xl">
          <h4 className="text-muted text-xs uppercase mb-2">Total Scans</h4>
          <p className="text-3xl font-bold">12,458</p>
        </div>
        <div className="bg-dark-2 border border-surface p-6 rounded-3xl">
          <h4 className="text-muted text-xs uppercase mb-2">Active Sessions</h4>
          <p className="text-3xl font-bold">452</p>
        </div>
        <div className="bg-dark-2 border border-surface p-6 rounded-3xl">
          <h4 className="text-muted text-xs uppercase mb-2">Conversion Rate</h4>
          <p className="text-3xl font-bold">3.2%</p>
        </div>
      </div>
      <div className="bg-dark-2 border border-surface p-8 rounded-[2rem]">
        <h3 className="text-xl font-bold mb-8">Usage Over Time</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#242220" vertical={false} />
              <XAxis dataKey="name" stroke="#8B8578" fontSize={10} />
              <YAxis stroke="#8B8578" fontSize={10} />
              <Tooltip contentStyle={{ backgroundColor: '#1A1917', border: '1px solid #242220', borderRadius: '12px' }} />
              <Area type="monotone" dataKey="scans" stroke="#C9A84C" fill="#C9A84C" fillOpacity={0.1} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-8">
      <div className="bg-dark-2 border border-surface rounded-[2rem] p-8">
        <h3 className="text-xl font-bold mb-8">Global System Settings</h3>
        <div className="space-y-6">
          {[
            { label: 'Maintenance Mode', desc: 'Disable public access to all menus', active: false },
            { label: 'New Registrations', desc: 'Allow new restaurants to sign up', active: true },
            { label: 'Email Notifications', desc: 'Send system alerts to admins', active: true },
            { label: 'Auto-Approval', desc: 'Automatically approve new restaurants (Not recommended)', active: false },
          ].map((setting, i) => (
            <div key={`setting-item-${i}-${setting.label}`} className="flex items-center justify-between p-6 rounded-2xl border border-surface bg-surface/5">
              <div>
                <h4 className="font-bold text-text">{setting.label}</h4>
                <p className="text-xs text-muted mt-1">{setting.desc}</p>
              </div>
              <button className={`w-12 h-6 rounded-full transition-all relative ${setting.active ? 'bg-gold' : 'bg-surface'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-dark rounded-full transition-all ${setting.active ? (isRtl ? 'left-1' : 'right-1') : (isRtl ? 'right-1' : 'left-1')}`} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPaymentSettings = () => (
    <div className="space-y-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-dark-2 border border-surface rounded-[2rem] p-8"
      >
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 bg-gold/10 text-gold rounded-2xl flex items-center justify-center">
            <CreditCard size={32} />
          </div>
          <div>
            <h3 className="text-xl font-bold">{isRtl ? 'إعدادات دفع Paddle الرئيسية' : 'Primary Paddle Settings'}</h3>
            <p className="text-sm text-muted">{isRtl ? 'قم بإدخال الـ Client Token و الـ Price IDs الخاصة بحسابك في Paddle' : 'Enter your Client Token and Price IDs from your Paddle developer account'}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-text-primary">Paddle Client Token</label>
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={paddleSettings.client_token}
                  onChange={(e) => setPaddleSettings({ ...paddleSettings, client_token: e.target.value })}
                  className="flex-1 bg-surface border border-surface rounded-xl px-4 py-3 text-sm outline-none focus:border-gold transition-all"
                  placeholder="Enter Paddle Client Token"
                />
                <button 
                  onClick={() => savePaddleSetting('paddle_client_token', paddleSettings.client_token)}
                  disabled={isSaving}
                  className="px-6 py-3 bg-gold text-dark font-bold rounded-xl hover:bg-gold/90 transition-all disabled:opacity-50"
                >
                  {isRtl ? 'حفظ' : 'Save'}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-text-primary">Paddle Environment</label>
              <div className="flex gap-2">
                <select 
                  value={paddleSettings.environment}
                  onChange={(e) => setPaddleSettings({ ...paddleSettings, environment: e.target.value })}
                  className="flex-1 bg-surface border border-surface rounded-xl px-4 py-3 text-sm outline-none focus:border-gold transition-all appearance-none"
                >
                  <option value="sandbox">Sandbox (Testing)</option>
                  <option value="production">Production (Live)</option>
                </select>
                <button 
                  onClick={() => savePaddleSetting('paddle_environment', paddleSettings.environment)}
                  disabled={isSaving}
                  className="px-6 py-3 bg-gold text-dark font-bold rounded-xl hover:bg-gold/90 transition-all disabled:opacity-50"
                >
                  {isRtl ? 'حفظ' : 'Save'}
                </button>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 pt-6 border-t border-surface">
            <div className="space-y-4">
              <h4 className="text-gold font-bold flex items-center gap-2">
                <Tag size={16} />
                {isRtl ? 'الباقة الأساسية (Starter)' : 'Basic Plan (Starter)'}
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted mb-1 block">Monthly Price ID</label>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={paddleSettings.price_basic_monthly}
                      onChange={(e) => setPaddleSettings({ ...paddleSettings, price_basic_monthly: e.target.value })}
                      className="flex-1 bg-surface border border-surface rounded-xl px-4 py-2 text-sm outline-none focus:border-gold"
                      placeholder="pri_XXXX..."
                    />
                    <button onClick={() => savePaddleSetting('paddle_price_basic_monthly', paddleSettings.price_basic_monthly)} className="px-4 py-2 bg-surface border border-surface rounded-xl text-gold text-xs font-bold hover:bg-surface/80">Save</button>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted mb-1 block">Annual Price ID</label>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={paddleSettings.price_basic_annual}
                      onChange={(e) => setPaddleSettings({ ...paddleSettings, price_basic_annual: e.target.value })}
                      className="flex-1 bg-surface border border-surface rounded-xl px-4 py-2 text-sm outline-none focus:border-gold"
                      placeholder="pri_XXXX..."
                    />
                    <button onClick={() => savePaddleSetting('paddle_price_basic_annual', paddleSettings.price_basic_annual)} className="px-4 py-2 bg-surface border border-surface rounded-xl text-gold text-xs font-bold hover:bg-surface/80">Save</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-gold font-bold flex items-center gap-2">
                <Tag size={16} />
                {isRtl ? 'الباقة الاحترافية (Pro)' : 'Pro Plan'}
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted mb-1 block">Monthly Price ID</label>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={paddleSettings.price_pro_monthly}
                      onChange={(e) => setPaddleSettings({ ...paddleSettings, price_pro_monthly: e.target.value })}
                      className="flex-1 bg-surface border border-surface rounded-xl px-4 py-2 text-sm outline-none focus:border-gold"
                      placeholder="pri_XXXX..."
                    />
                    <button onClick={() => savePaddleSetting('paddle_price_pro_monthly', paddleSettings.price_pro_monthly)} className="px-4 py-2 bg-surface border border-surface rounded-xl text-gold text-xs font-bold hover:bg-surface/80">Save</button>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted mb-1 block">Annual Price ID</label>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={paddleSettings.price_pro_annual}
                      onChange={(e) => setPaddleSettings({ ...paddleSettings, price_pro_annual: e.target.value })}
                      className="flex-1 bg-surface border border-surface rounded-xl px-4 py-2 text-sm outline-none focus:border-gold"
                      placeholder="pri_XXXX..."
                    />
                    <button onClick={() => savePaddleSetting('paddle_price_pro_annual', paddleSettings.price_pro_annual)} className="px-4 py-2 bg-surface border border-surface rounded-xl text-gold text-xs font-bold hover:bg-surface/80">Save</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-gold font-bold flex items-center gap-2">
                <Building2 size={16} />
                {isRtl ? 'باقة المؤسسات (Enterprise)' : 'Enterprise Plan'}
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted mb-1 block">Monthly Price ID</label>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={paddleSettings.price_ent_monthly}
                      onChange={(e) => setPaddleSettings({ ...paddleSettings, price_ent_monthly: e.target.value })}
                      className="flex-1 bg-surface border border-surface rounded-xl px-4 py-2 text-sm outline-none focus:border-gold"
                      placeholder="pri_XXXX..."
                    />
                    <button onClick={() => savePaddleSetting('paddle_price_ent_monthly', paddleSettings.price_ent_monthly)} className="px-4 py-2 bg-surface border border-surface rounded-xl text-gold text-xs font-bold hover:bg-surface/80">Save</button>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted mb-1 block">Annual Price ID</label>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={paddleSettings.price_ent_annual}
                      onChange={(e) => setPaddleSettings({ ...paddleSettings, price_ent_annual: e.target.value })}
                      className="flex-1 bg-surface border border-surface rounded-xl px-4 py-2 text-sm outline-none focus:border-gold"
                      placeholder="pri_XXXX..."
                    />
                    <button onClick={() => savePaddleSetting('paddle_price_ent_annual', paddleSettings.price_ent_annual)} className="px-4 py-2 bg-surface border border-surface rounded-xl text-gold text-xs font-bold hover:bg-surface/80">Save</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 p-6 bg-gold/5 border border-gold/20 rounded-2xl">
          <div className="flex gap-3">
            <Shield className="text-gold shrink-0" size={20} />
            <p className="text-xs text-muted leading-relaxed">
              {isRtl 
                ? 'تأكد من أن الـ Price IDs مطابقة تماماً لما هو موجود في حساب المطور الخاص بك في Paddle. سيتم استخدام هذه الإعدادات مباشرة في صفحة التسجيل والاشتراكات.'
                : 'Ensure that the Price IDs match exactly what is in your Paddle Developer account. These settings will be used directly on the registration and subscription pages.'}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderDashboard();
      case 'restaurants': return renderRestaurants();
      case 'approvals': return renderRestaurants(true);
      case 'features': return renderFeatures();
      case 'pricing': return renderPricing();
      case 'revenue': return renderRevenue();
      case 'users': return renderUsers();
      case 'analytics': return renderAnalytics();
      case 'settings': return renderSettings();
      case 'payment_settings': return renderPaymentSettings();
      case 'coupons': return renderPricing(); // Coupons are inside pricing for now
      default: return (
        <div className="flex flex-col items-center justify-center h-96 text-muted">
          <Activity size={48} className="mb-4 opacity-20" />
          <h3 className="text-xl font-bold">{t('admin.system.underDevelopment') || 'Under Development'}</h3>
          <p className="text-sm">{(t('admin.system.underDevelopmentDesc') || 'We are building the {tab} module.').toString().replace('{tab}', activeTab)}</p>
        </div>
      );
    }
  };

  return (
    <div className="flex h-screen bg-dark text-text overflow-hidden">
      {/* Sidebar */}
      <aside className={`w-64 bg-dark-2 border-surface hidden lg:flex flex-col flex-shrink-0 ${isRtl ? 'border-l' : 'border-r'}`}>
        <div className="p-6 border-b border-surface">
          <img src="/logo.png" alt="VISIONO" className="h-10 object-contain" />
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
          {sidebarItems.map((section, i) => (
            <div key={`sidebar-section-${i}`} className="space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-muted font-bold px-4">{section.label}</p>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <button 
                    key={item.id} 
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all ${activeTab === item.id ? 'bg-gold text-dark font-bold' : 'text-muted hover:bg-surface hover:text-text'}`}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <span className="text-sm">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${activeTab === item.id ? 'bg-dark/20 text-dark' : 'bg-gold/10 text-gold'}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-surface">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
          >
            <LogOut size={18} />
            <span className="text-sm">{t('admin.logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-dark custom-scrollbar">
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <button 
                className="lg:hidden p-2.5 bg-surface border border-surface rounded-xl text-gold hover:text-gold-light transition-all shadow-sm"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu size={24} />
              </button>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl md:text-3xl font-bold">{t('admin.dashboard')}</h1>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 text-green-500 rounded-full border border-green-500/20 text-[10px] font-bold uppercase tracking-wider">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    {t('admin.system.healthy')}
                  </div>
                </div>
                <p className="text-muted text-sm">{t('admin.welcome')} 11monther33@gmail.com</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 w-full md:w-auto">
              <button 
                onClick={() => fetchRestaurants()}
                className="p-2.5 bg-surface rounded-xl border border-surface text-muted hover:text-gold transition-all flex items-center gap-2 group"
                title={isRtl ? 'تحديث' : 'Refresh'}
              >
                <RefreshCw size={20} className={loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} />
              </button>
              <button 
                onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
                className="p-2.5 bg-surface rounded-xl border border-surface text-muted hover:text-gold transition-all flex items-center gap-2"
              >
                <Globe size={20} />
                <span className="text-xs font-bold uppercase">{lang === 'ar' ? 'EN' : 'AR'}</span>
              </button>
              <div className="relative flex-1 md:flex-none">
                <Search className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-muted`} size={18} />
                <input className={`w-full bg-surface border border-surface rounded-xl py-2.5 ${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'} text-sm outline-none focus:border-gold transition-all`} placeholder={t('admin.search')} />
              </div>
              <button className="p-2.5 bg-surface rounded-xl border border-surface text-muted hover:text-text transition-all">
                <Filter size={20} />
              </button>
              <div className="w-10 h-10 bg-gold/10 rounded-full border border-gold/20 flex items-center justify-center text-gold font-bold">
                AD
              </div>
            </div>
          </header>

          {renderContent()}
        </div>
      </main>
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-dark/60 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside 
              initial={{ x: isRtl ? 300 : -300 }}
              animate={{ x: 0 }}
              exit={{ x: isRtl ? 300 : -300 }}
              className={`fixed inset-y-0 ${isRtl ? 'right-0' : 'left-0'} w-[280px] bg-dark-2 z-50 lg:hidden flex flex-col shadow-2xl border-surface ${isRtl ? 'border-l' : 'border-r'}`}
            >
              <div className="p-6 border-b border-surface flex items-center justify-between">
                <img src="/logo.png" alt="VISIONO" className="h-10 object-contain" />
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-muted hover:text-gold transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <nav className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                {sidebarItems.map((section, i) => (
                  <div key={`mobile-sidebar-section-${i}`} className="space-y-2">
                    <p className="text-[10px] uppercase tracking-widest text-muted font-bold px-4">{section.label}</p>
                    <div className="space-y-1">
                      {section.items.map((item) => (
                        <button 
                          key={item.id} 
                          onClick={() => {
                            setActiveTab(item.id);
                            setIsMobileMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all ${activeTab === item.id ? 'bg-gold text-dark font-bold' : 'text-muted hover:bg-surface hover:text-text'}`}
                        >
                          <div className="flex items-center gap-3">
                            {item.icon}
                            <span className="text-sm">{item.label}</span>
                          </div>
                          {item.badge && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${activeTab === item.id ? 'bg-dark/20 text-dark' : 'bg-gold/10 text-gold'}`}>
                              {item.badge}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </nav>

              <div className="p-4 border-t border-surface">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                >
                  <LogOut size={18} />
                  <span className="text-sm">{t('admin.logout')}</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      
        {viewingRestaurant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-dark-2 border border-surface rounded-2xl p-6 w-full max-w-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setViewingRestaurant(null)}
                className="absolute top-4 right-4 p-2 text-muted hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Store className="text-gold" />
                تفاصيل المطعم: {isRtl ? viewingRestaurant.name_ar : viewingRestaurant.name_en}
              </h2>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-surface/20 rounded-xl border border-surface">
                  <p className="text-xs text-muted mb-1">البريد الإلكتروني (المالك)</p>
                  <p className="font-bold text-sm">{viewingRestaurant.owner_email || 'N/A'}</p>
                </div>
                <div className="p-4 bg-surface/20 rounded-xl border border-surface">
                  <p className="text-xs text-muted mb-1">الباقة الحالية</p>
                  <p className="font-bold uppercase text-gold text-sm">{viewingRestaurant.plan || 'basic'}</p>
                </div>
              </div>

              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Activity size={18} className="text-gold" />
                استهلاك الموارد (الشهر الحالي)
              </h3>
              
              {loadingUsage ? (
                <div className="flex justify-center p-8"><RefreshCw className="animate-spin text-gold" size={24} /></div>
              ) : (
                <div className="space-y-4">
                  {['ai_chat_messages', '3d_models_generated', 'whatsapp_messages'].map(metric => {
                    const usage = restaurantUsage.find(u => u.metric_type === metric)?.count || 0;
                    const isPro = viewingRestaurant.plan === 'pro';
                    const isStarter = viewingRestaurant.plan === 'starter';
                    const limit = metric === 'ai_chat_messages' ? (isPro ? 2500 : isStarter ? 500 : 100) : metric === '3d_models_generated' ? (isPro ? 100 : isStarter ? 20 : 5) : (isPro ? 1000 : isStarter ? 200 : 50);
                    const percentage = Math.min(100, Math.round((usage / limit) * 100));
                    const isWarning = percentage > 80;
                    const isDanger = percentage >= 100;
                    
                    const labels: Record<string, string> = {
                      'ai_chat_messages': 'رسائل الذكاء الاصطناعي',
                      '3d_models_generated': 'توليد نماذج 3D',
                      'whatsapp_messages': 'رسائل الواتساب'
                    };

                    return (
                      <div key={metric} className={`p-4 rounded-xl border ${isDanger ? 'bg-red-500/10 border-red-500/30' : isWarning ? 'bg-amber-500/10 border-amber-500/30' : 'bg-dark border-surface'}`}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold text-sm">{labels[metric]}</span>
                          <span className="text-xs font-mono">{usage} / {limit}</span>
                        </div>
                        <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-1000 ${isDanger ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-gold'}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>
        )}

        {editingRestaurant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-dark-2 border border-surface rounded-2xl p-6 w-full max-w-lg shadow-2xl relative"
            >
              <button 
                onClick={() => setEditingRestaurant(null)}
                className="absolute top-4 right-4 p-2 text-muted hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Edit className="text-gold" />
                {isRtl ? 'تعديل بيانات المطعم' : 'Edit Restaurant'}
              </h2>
              
              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-muted mb-2">{isRtl ? 'الباقة' : 'Plan'}</label>
                  <select
                    value={editForm.plan}
                    onChange={(e) => setEditForm({ ...editForm, plan: e.target.value })}
                    className="w-full bg-dark border border-surface rounded-xl px-4 py-3 text-white outline-none focus:border-gold/50"
                  >
                    <option value="starter">Starter</option>
                    <option value="basic">Basic</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-muted mb-2">{isRtl ? 'الحالة' : 'Status'}</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full bg-dark border border-surface rounded-xl px-4 py-3 text-white outline-none focus:border-gold/50"
                  >
                    <option value="PENDING">PENDING (قيد الانتظار)</option>
                    <option value="APPROVED">APPROVED (مقبول)</option>
                    <option value="ACTIVE">ACTIVE (نشط)</option>
                    <option value="SUSPENDED">SUSPENDED (موقوف)</option>
                    <option value="REJECTED">REJECTED (مرفوض)</option>
                  </select>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 bg-gold text-dark font-bold py-3 rounded-xl hover:bg-gold/90 transition-colors flex justify-center items-center gap-2"
                  >
                    {isSaving ? <RefreshCw className="animate-spin" size={20} /> : (isRtl ? 'حفظ التعديلات' : 'Save Changes')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
