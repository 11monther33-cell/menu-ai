import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuth } from '../../../hooks/useAuth';
import { usePOSStore } from '../../../store/posStore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Eye, ClipboardList, Utensils, QrCode, 
  Plus, ExternalLink, Clock, TrendingUp, 
  TrendingDown, Camera, ChevronRight,
  MoreVertical, Box, Sparkles, Activity, DollarSign
} from 'lucide-react';

export const DashboardHome = () => {
  const { isRtl, t } = useLanguage();
  const { user } = useAuth();
  const { currentBranch } = usePOSStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [dishes, setDishes] = useState<any[]>([]);
  const [snaps, setSnaps] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  // Force re-render of relative times every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setTick(prev => prev + 1);
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user?.restaurantId || user.restaurantId === 'undefined') return;

    const fetchData = async () => {
      try {
        // 1. Fetch Orders (recent 100 to calculate weekly metrics)
        const { data: ordersData } = await supabase
          .from('orders')
          .select('*')
          .eq('restaurant_id', user.restaurantId)
          .order('created_at', { ascending: false })
          .limit(100);

        // 2. Fetch All Dishes for restaurant view counts and active dish counts
        const { data: dishesData } = await supabase
          .from('dishes')
          .select('*')
          .eq('restaurant_id', user.restaurantId);

        // 3. Fetch Snaps
        let snapsData: any[] = [];
        if (dishesData && dishesData.length > 0) {
          const { data: snapsRes } = await supabase
            .from('snap_captures')
            .select('*, dishes(name_ar, name_en)')
            .in('dish_id', dishesData.map(d => d.id))
            .order('shared_at', { ascending: false });
          if (snapsRes) snapsData = snapsRes;
        }

        // 4. Fetch POS Audit Logs
        let auditLogs: any[] = [];
        if (currentBranch?.id) {
          const { data: logs } = await supabase
            .from('pos_audit_log')
            .select('*')
            .eq('branch_id', currentBranch.id)
            .order('created_at', { ascending: false })
            .limit(10);
          if (logs) auditLogs = logs;
        }

        if (ordersData) setOrders(ordersData);
        if (dishesData) setDishes(dishesData);
        setSnaps(snapsData);

        // Merge activities
        const mergedActivities = [
          ...auditLogs.map(l => ({
            id: l.id,
            type: 'audit',
            action: l.action,
            timestamp: new Date(l.created_at),
            details: l.details
          })),
          ...snapsData.map(s => ({
            id: s.id,
            type: 'snap',
            action: s.mode,
            timestamp: new Date(s.shared_at),
            dishNameAr: s.dishes?.name_ar,
            dishNameEn: s.dishes?.name_en
          }))
        ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 5);

        setActivities(mergedActivities);
      } catch (err) {
        console.error('Error fetching dashboard home data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Realtime Orders Subscription
    const ordersSubscription = supabase
      .channel('dashboard_orders')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'orders',
        filter: `restaurant_id=eq.${user.restaurantId}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setOrders(prev => [payload.new, ...prev]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ordersSubscription);
    };
  }, [user?.restaurantId, currentBranch?.id]);

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    const name = user?.name || '';
    if (hour >= 5 && hour < 12) return t('restaurant.dashboard.welcome.morning').replace('{name}', name);
    if (hour >= 12 && hour < 18) return t('restaurant.dashboard.welcome.afternoon').replace('{name}', name);
    if (hour >= 18 && hour < 24) return t('restaurant.dashboard.welcome.evening').replace('{name}', name);
    return t('restaurant.dashboard.welcome.night').replace('{name}', name);
  };

  // Trend indicators based on last 7 days vs previous 7 days
  const getTrend = (recent: number, older: number) => {
    if (older === 0) return null;
    const pct = Math.round(((recent - older) / older) * 100);
    return {
      pct: pct > 0 ? `+${pct}%` : `${pct}%`,
      trend: pct >= 0 ? 'up' : 'down' as 'up' | 'down' | 'neutral'
    };
  };

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const recentOrders = orders.filter(o => new Date(o.created_at) >= sevenDaysAgo).length;
  const olderOrders = orders.filter(o => new Date(o.created_at) >= fourteenDaysAgo && new Date(o.created_at) < sevenDaysAgo).length;
  const ordersTrend = getTrend(recentOrders, olderOrders);

  const recentSnaps = snaps.filter(s => new Date(s.timestamp || s.shared_at) >= sevenDaysAgo).length;
  const olderSnaps = snaps.filter(s => new Date(s.timestamp || s.shared_at) >= fourteenDaysAgo && new Date(s.timestamp || s.shared_at) < sevenDaysAgo).length;
  const snapsTrend = getTrend(recentSnaps, olderSnaps);

  // Relative Time Formatter
  const getRelativeTime = (date: Date) => {
    const diffMs = new Date().getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return isRtl ? 'الآن' : 'Just now';
    if (diffMins < 60) return isRtl ? `منذ ${diffMins} د` : `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return isRtl ? `منذ ${diffHours} س` : `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  // Activity Feed Text Formatter
  const formatActivityText = (act: any) => {
    if (act.type === 'snap') {
      const modeStr = act.action === 'ar' ? 'AR' : act.action;
      return isRtl
        ? `زبون تفاعل مع طبق "${act.dishNameAr || ''}" بالـ 3D (${modeStr})`
        : `Customer interacted with "${act.dishNameEn || ''}" in 3D (${modeStr})`;
    }
    
    const details = act.details || {};
    const currency = details.currency_code || currentBranch?.currency_code || 'OMR';
    
    if (act.action === 'inventory_restock') {
      const qty = details.quantity || 0;
      const name = details.item_name || '';
      const cost = details.total_cost || 0;
      return isRtl
        ? `توريد مخزون: تم توريد ${qty} من "${name}" بتكلفة ${Number(cost).toFixed(3)} ${currency}`
        : `Stock restock: Replenished ${qty} of "${name}" for ${Number(cost).toFixed(3)} ${currency}`;
    }
    
    if (act.action === 'payment_process') {
      const amount = details.amount || 0;
      const method = details.method || '';
      const methodDisplay = method === 'cash' ? (isRtl ? 'نقدي' : 'Cash') : (isRtl ? 'بطاقة' : 'Card');
      return isRtl
        ? `عملية بيع: تم إكمال طلب بقيمة ${Number(amount).toFixed(3)} ${currency} (${methodDisplay})`
        : `New sale: Order of ${Number(amount).toFixed(3)} ${currency} completed (${methodDisplay})`;
    }

    return isRtl
      ? `نشاط فرعي: تم إجراء عملية ${act.action}`
      : `System action: Performed ${act.action}`;
  };

  const totalViews = dishes.reduce((sum, d) => sum + (d.view_count || 0), 0);
  const totalSalesCount = dishes.reduce((sum, d) => sum + (d.order_count || 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'PENDING').length;
  const outOfStockDishes = dishes.filter(d => !d.is_available).length;
  const modelsCount = dishes.filter(d => d.model_3d_url).length;
  const arSessionsCount = snaps.filter(s => s.action === 'ar' || s.mode === 'ar').length;

  const topDishes = [...dishes]
    .sort((a, b) => (b.order_count || 0) - (a.order_count || 0))
    .slice(0, 5);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse p-4 lg:p-0">
        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div className="h-10 bg-card border border-border-custom rounded-xl w-64"></div>
          <div className="h-10 bg-card border border-border-custom rounded-xl w-96"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-sidebar border border-border-custom p-6 rounded-[2rem] h-32"></div>
          ))}
        </div>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-3 bg-sidebar border border-border-custom rounded-[2.5rem] h-64"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Row 1: Welcome + Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-text-primary">{getWelcomeMessage()}</h1>
          <div className="flex items-center gap-3 text-sm text-text-secondary">
            <span>{t('restaurant.dashboard.welcome.lastLogin').replace('{time}', '2').replace('{device}', 'iPhone')}</span>
            <span className="w-1.5 h-1.5 bg-border-custom rounded-full" />
            <span className="px-2.5 py-0.5 bg-gold/10 text-gold rounded-full text-xs font-bold">
              {t('restaurant.dashboard.welcome.plan').replace('{plan}', 'Pro')}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="flex-1 md:flex-none px-4 py-2.5 bg-gold text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-gold/20 hover:bg-gold/90 transition-all">
            <Plus size={18} />
            {t('restaurant.dashboard.quickActions.addDish')}
          </button>
          <button className="flex-1 md:flex-none px-4 py-2.5 bg-card text-text-primary border border-border-custom font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-sidebar transition-all">
            <QrCode size={18} />
            {t('restaurant.dashboard.quickActions.printQr')}
          </button>
          <button className="flex-1 md:flex-none px-4 py-2.5 bg-card text-text-primary border border-border-custom font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-sidebar transition-all">
            <ClipboardList size={18} />
            {t('restaurant.dashboard.quickActions.liveOrders')}
          </button>
          <button className="flex-1 md:flex-none px-4 py-2.5 bg-card text-text-primary border border-border-custom font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-sidebar transition-all">
            <ExternalLink size={18} />
            {t('restaurant.dashboard.quickActions.previewMenu')}
          </button>
        </div>
      </div>

      {/* Row 2: KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
        {[
          { 
            title: t('restaurant.dashboard.stats.views'), 
            value: totalViews.toLocaleString(), 
            sub: '', 
            trend: 'neutral',
            icon: <Eye size={20} />,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10'
          },
          { 
            title: t('restaurant.dashboard.stats.orders'), 
            value: orders.length, 
            sub: t('restaurant.dashboard.stats.pending').replace('{count}', String(pendingOrders)),
            trend: ordersTrend?.trend || 'neutral',
            trendLabel: ordersTrend?.pct,
            icon: <ClipboardList size={20} />,
            color: 'text-amber-500',
            bg: 'bg-amber-500/10'
          },
          { 
            title: t('restaurant.dashboard.stats.activeDishes'), 
            value: dishes.length, 
            sub: t('restaurant.dashboard.stats.outOfStock').replace('{count}', String(outOfStockDishes)),
            trend: 'neutral',
            icon: <Utensils size={20} />,
            color: 'text-green-500',
            bg: 'bg-green-500/10'
          },
        ].map((card, i) => (
          <motion.div 
            key={`kpi-card-${i}-${card.title}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-sidebar border border-border-custom p-6 rounded-[2rem] hover:shadow-xl hover:shadow-gold/5 transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`w-12 h-12 ${card.bg} ${card.color} rounded-2xl flex items-center justify-center shadow-sm`}>
                {card.icon}
              </div>
              {card.trend === 'up' && <TrendingUp size={16} className="text-green-500" />}
              {card.trend === 'down' && <TrendingDown size={16} className="text-red-500" />}
            </div>
            <p className="text-text-secondary text-sm mb-1">{card.title}</p>
            <p className="text-3xl font-bold mb-1 text-text-primary">{card.value}</p>
            <p className={`text-xs ${card.trend === 'up' ? 'text-green-500' : card.trend === 'down' ? 'text-red-500' : 'text-text-secondary'}`}>
              {card.trendLabel ? `${card.trendLabel} ${isRtl ? 'عن الأسبوع الماضي' : 'vs last week'}` : card.sub}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Row 3: Live Orders */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-3 bg-sidebar border border-border-custom rounded-[2.5rem] overflow-hidden flex flex-col">
          <div className="p-6 border-b border-border-custom flex items-center justify-between bg-card/30">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold text-text-primary">{t('restaurant.dashboard.liveOrders.title')}</h3>
            </div>
            <div className="flex items-center gap-2 text-xs text-text-secondary">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              {t('restaurant.dashboard.liveOrders.connected')}
            </div>
          </div>
          
          <div className="flex-1 p-6 space-y-4">
            <AnimatePresence mode="popLayout">
              {orders.slice(0, 5).map((order) => (
                <motion.div 
                  key={order.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-main border border-border-custom p-4 rounded-2xl flex items-center justify-between group hover:border-gold/30 hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gold/10 text-gold rounded-xl flex items-center justify-center font-bold text-lg">
                      {order.table_number}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-bold text-text-primary">{isRtl ? `طاولة ${order.table_number}` : `Table ${order.table_number}`}</span>
                        <span className="text-text-secondary text-xs">#{order.id.slice(0, 4)}</span>
                      </div>
                      <p className="text-xs text-text-secondary truncate max-w-[200px]">
                        {order.items?.map((it: any) => `${it.quantity}x ${it.name}`).join(', ')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold text-text-primary">
                        {Number(order.total).toFixed(3)} {currentBranch?.currency_code || 'OMR'}
                      </p>
                      <p className="text-[10px] text-text-secondary flex items-center justify-end gap-1">
                        <Clock size={10} />
                        {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500 hover:text-white transition-all">
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {orders.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-20 h-20 bg-card rounded-full flex items-center justify-center mb-4 text-text-secondary">
                  <Utensils size={32} />
                </div>
                {dishes.length === 0 ? (
                  <>
                    <h4 className="font-bold text-lg mb-1 text-text-primary">
                      {isRtl ? 'لم تقم بإضافة منتجات بعد' : 'No menu products added yet'}
                    </h4>
                    <p className="text-text-secondary text-sm mb-4">
                      {isRtl ? 'أضف أول منتج لتبدأ في استقبال طلبات الطاولات.' : 'Add your first menu product to begin receiving customer orders.'}
                    </p>
                    <Link to="/dashboard/menu-builder" className="px-6 py-2 bg-gold text-white font-bold rounded-xl hover:bg-gold/90 transition-all">
                      {isRtl ? 'بناء المنيو' : 'Go to Menu Builder'}
                    </Link>
                  </>
                ) : (
                  <>
                    <h4 className="font-bold text-lg mb-1 text-text-primary">{t('restaurant.dashboard.liveOrders.empty')}</h4>
                    <p className="text-text-secondary text-sm">{t('restaurant.dashboard.liveOrders.emptySub')}</p>
                  </>
                )}
              </div>
            )}
          </div>
          
          <div className="p-4 bg-card/30 border-t border-border-custom text-center">
            <button className="text-gold text-sm font-bold hover:underline flex items-center justify-center gap-2 mx-auto">
              {t('restaurant.dashboard.liveOrders.viewAll')}
              <ChevronRight size={16} className={isRtl ? 'rotate-180' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Row 4: Top Dishes + Recent Activity */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Top Dishes */}
        <div className="lg:col-span-2 bg-sidebar border border-border-custom rounded-[2.5rem] overflow-hidden">
          <div className="p-6 border-b border-border-custom bg-card/30">
            <h3 className="text-xl font-bold text-text-primary">{t('restaurant.dashboard.topDishes.title')}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right">
              <thead className="bg-card/50 text-xs text-text-secondary uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-bold">{t('restaurant.dashboard.topDishes.dish')}</th>
                  <th className="px-6 py-4 font-bold">{t('restaurant.dashboard.topDishes.views')}</th>
                  <th className="px-6 py-4 font-bold">{t('restaurant.dashboard.topDishes.orders')}</th>
                  <th className="px-6 py-4 font-bold">{t('restaurant.dashboard.topDishes.snap')}</th>
                  <th className="px-6 py-4 font-bold">{t('restaurant.dashboard.topDishes.conversion')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-custom">
                {totalSalesCount > 0 && topDishes.map((dish) => {
                  const views = dish.view_count || 0;
                  const ordersCount = dish.order_count || 0;
                  const snapsCount = snaps.filter(s => s.dish_id === dish.id).length;
                  const conversionRate = views > 0 ? Math.round((ordersCount / views) * 100) : 0;

                  return (
                    <tr key={dish.id} className="hover:bg-card/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-card rounded-lg overflow-hidden border border-border-custom flex items-center justify-center">
                            {dish.image_url ? (
                              <img 
                                src={dish.image_url} 
                                alt="" 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <Utensils className={`fallback-icon text-text-muted ${dish.image_url ? 'hidden' : ''}`} size={16} />
                          </div>
                          <span className="font-bold text-sm text-text-primary">{isRtl ? dish.name_ar : dish.name_en}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-text-secondary">{views}</td>
                      <td className="px-6 py-4 text-sm text-text-secondary">{ordersCount}</td>
                      <td className="px-6 py-4 text-sm text-text-secondary">{snapsCount}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-card rounded-full overflow-hidden min-w-[60px] border border-border-custom">
                            <div className="h-full bg-gold rounded-full" style={{ width: `${Math.min(conversionRate, 100)}%` }} />
                          </div>
                          <span className="text-xs font-bold text-text-primary">{conversionRate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {(topDishes.length === 0 || totalSalesCount === 0) && (
              <div className="p-8 text-center text-text-secondary text-sm">
                {isRtl ? 'لا توجد مبيعات اليوم بعد' : 'No sales recorded today yet.'}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-sidebar border border-border-custom rounded-[2.5rem] flex flex-col">
          <div className="p-6 border-b border-border-custom bg-card/30">
            <h3 className="text-xl font-bold text-text-primary">{t('restaurant.dashboard.activity.title')}</h3>
          </div>
          <div className="flex-1 p-6 space-y-6">
            {activities.map((activity, i) => {
              // Select Icon based on type/action
              let icon = <Activity size={14} className="text-amber-500" />;
              if (activity.type === 'snap') {
                icon = <Camera size={14} className="text-purple-500" />;
              } else if (activity.action === 'inventory_restock') {
                icon = <Box size={14} className="text-blue-500" />;
              } else if (activity.action === 'payment_process') {
                icon = <DollarSign size={14} className="text-green-500" />;
              }

              return (
                <div key={activity.id || i} className="flex gap-4">
                  <div className="w-8 h-8 bg-card rounded-full border border-border-custom flex items-center justify-center shrink-0">
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-tight mb-1 text-text-primary break-words">
                      {formatActivityText(activity)}
                    </p>
                    <p className="text-[10px] text-text-secondary uppercase font-bold tracking-wider">
                      {getRelativeTime(activity.timestamp)}
                    </p>
                  </div>
                </div>
              );
            })}
            {activities.length === 0 && (
              <div className="py-12 text-center text-text-secondary text-sm">
                {isRtl ? 'لا توجد نشاطات مؤخراً.' : 'No recent activity recorded.'}
              </div>
            )}
          </div>
          <div className="p-4 bg-card/30 border-t border-border-custom text-center">
            <button className="text-gold text-sm font-bold hover:underline">
              {t('restaurant.dashboard.activity.viewAll')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
