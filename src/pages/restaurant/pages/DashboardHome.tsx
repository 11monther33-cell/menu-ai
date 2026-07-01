import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuth } from '../../../hooks/useAuth';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Eye, ClipboardList, Utensils, QrCode, 
  Plus, ExternalLink, Clock, TrendingUp, 
  TrendingDown, Camera, ChevronRight,
  MoreVertical, Box
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

export const DashboardHome = () => {
  const { isRtl, t } = useLanguage();
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [dishes, setDishes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.restaurantId || user.restaurantId === 'undefined') return;

    const fetchData = async () => {
      // Fetch Orders
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', user.restaurantId)
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch Dishes
      const { data: dishesData } = await supabase
        .from('dishes')
        .select('*')
        .eq('restaurant_id', user.restaurantId)
        .limit(5);

      if (ordersData) setOrders(ordersData);
      if (dishesData) setDishes(dishesData);
      setLoading(false);
    };

    fetchData();

    const ordersSubscription = supabase
      .channel('dashboard_orders')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'orders',
        filter: `restaurant_id=eq.${user.restaurantId}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setOrders(prev => [payload.new, ...prev].slice(0, 5));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ordersSubscription);
    };
  }, [user?.restaurantId]);

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    const name = user?.name || '';
    if (hour >= 5 && hour < 12) return t('restaurant.dashboard.welcome.morning').replace('{name}', name);
    if (hour >= 12 && hour < 18) return t('restaurant.dashboard.welcome.afternoon').replace('{name}', name);
    if (hour >= 18 && hour < 24) return t('restaurant.dashboard.welcome.evening').replace('{name}', name);
    return t('restaurant.dashboard.welcome.night').replace('{name}', name);
  };

  const analyticsData = [
    { name: 'Mon', scans: 400, orders: 240 },
    { name: 'Tue', scans: 300, orders: 139 },
    { name: 'Wed', scans: 200, orders: 980 },
    { name: 'Thu', scans: 278, orders: 390 },
    { name: 'Fri', scans: 189, orders: 480 },
    { name: 'Sat', scans: 239, orders: 380 },
    { name: 'Sun', scans: 349, orders: 430 },
  ];

  return (
    <div className="space-y-8">
      {/* Row 1: Welcome + Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-text-primary">{getWelcomeMessage()}</h1>
          <div className="flex items-center gap-3 text-sm text-text-secondary">
            <span>{t('restaurant.dashboard.welcome.lastLogin').replace('{time}', '2').replace('{device}', 'iPhone')}</span>
            <span className="w-1 h-1 bg-border-custom rounded-full" />
            <span className="px-2 py-0.5 bg-gold/10 text-gold rounded-full text-xs font-bold">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {[
          { 
            title: t('restaurant.dashboard.stats.views'), 
            value: '1,284', 
            sub: t('restaurant.dashboard.stats.trend').replace('{value}', '+18%'),
            trend: 'up',
            icon: <Eye size={20} />,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10'
          },
          { 
            title: t('restaurant.dashboard.stats.orders'), 
            value: orders.length, 
            sub: t('restaurant.dashboard.stats.pending').replace('{count}', '3'),
            trend: 'neutral',
            icon: <ClipboardList size={20} />,
            color: 'text-amber-500',
            bg: 'bg-amber-500/10'
          },
          { 
            title: t('restaurant.dashboard.stats.activeDishes'), 
            value: dishes.length, 
            sub: t('restaurant.dashboard.stats.outOfStock').replace('{count}', '0'),
            trend: 'neutral',
            icon: <Utensils size={20} />,
            color: 'text-green-500',
            bg: 'bg-green-500/10'
          },
          { 
            title: t('restaurant.dashboard.stats.snapShares'), 
            value: '127', 
            sub: t('restaurant.dashboard.stats.trend').replace('{value}', '+5%'),
            trend: 'up',
            icon: <Camera size={20} />,
            color: 'text-purple-500',
            bg: 'bg-purple-500/10'
          },
          { 
            title: isRtl ? 'نماذج 3D' : '3D Models', 
            value: dishes.filter((d: any) => d.model_3d_url).length, 
            sub: isRtl ? `${dishes.length} طبق إجمالي` : `${dishes.length} total dishes`,
            trend: 'neutral',
            icon: <Box size={20} />,
            color: 'text-cyan-500',
            bg: 'bg-cyan-500/10'
          },
          { 
            title: isRtl ? 'جلسات AR' : 'AR Sessions', 
            value: '38', 
            sub: isRtl ? 'هذا الأسبوع' : 'This week',
            trend: 'up',
            icon: <Camera size={20} />,
            color: 'text-orange-500',
            bg: 'bg-orange-500/10'
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
              {card.sub}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Row 3: Live Orders + Analytics Mini */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Live Orders Widget */}
        <div className="lg:col-span-2 bg-sidebar border border-border-custom rounded-[2.5rem] overflow-hidden flex flex-col">
          <div className="p-6 border-b border-border-custom flex items-center justify-between bg-card/30">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold text-text-primary">{t('restaurant.dashboard.liveOrders.title')}</h3>
              <div className="flex items-center gap-1.5 px-2 py-1 bg-red-500/10 text-red-500 rounded-full text-[10px] font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                Live
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-text-secondary">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              {t('restaurant.dashboard.liveOrders.connected')}
            </div>
          </div>
          
          <div className="flex-1 p-6 space-y-4">
            <AnimatePresence mode="popLayout">
              {orders.map((order) => (
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
                      <p className="font-bold text-text-primary">{order.total} $</p>
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
                <h4 className="font-bold text-lg mb-1 text-text-primary">{t('restaurant.dashboard.liveOrders.empty')}</h4>
                <p className="text-text-secondary text-sm">{t('restaurant.dashboard.liveOrders.emptySub')}</p>
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

        {/* Analytics Mini */}
        <div className="bg-sidebar border border-border-custom rounded-[2.5rem] p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-text-primary">{t('restaurant.nav.analytics')}</h3>
            <select className="bg-card border border-border-custom text-xs rounded-lg px-2 py-1 outline-none text-text-primary">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analyticsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#666666', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid #1A1A1A', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                  itemStyle={{ fontSize: '12px', color: '#FFFFFF' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="scans" 
                  stroke="#C9A84C" 
                  strokeWidth={3} 
                  dot={false} 
                  activeDot={{ r: 6, fill: '#C9A84C' }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="orders" 
                  stroke="#4CAF50" 
                  strokeWidth={3} 
                  dot={false} 
                  activeDot={{ r: 6, fill: '#4CAF50' }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="p-4 bg-card/50 rounded-2xl border border-border-custom">
              <p className="text-xs text-text-secondary mb-1">Scans</p>
              <p className="text-xl font-bold text-gold">1,842</p>
            </div>
            <div className="p-4 bg-card/50 rounded-2xl border border-border-custom">
              <p className="text-xs text-text-secondary mb-1">Orders</p>
              <p className="text-xl font-bold text-green-custom">432</p>
            </div>
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
                {dishes.map((dish, i) => (
                  <tr key={`dish-row-${dish.id || `index-${i}`}`} className="hover:bg-card/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-card rounded-lg overflow-hidden border border-border-custom">
                          <img 
                            src={dish.image_url || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=100&auto=format&fit=crop'} 
                            alt="" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <span className="font-bold text-sm text-text-primary">{isRtl ? dish.name_ar : dish.name_en}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">234</td>
                    <td className="px-6 py-4 text-sm text-text-secondary">67</td>
                    <td className="px-6 py-4 text-sm text-text-secondary">12</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-card rounded-full overflow-hidden min-w-[60px] border border-border-custom">
                          <div className="h-full bg-gold rounded-full" style={{ width: '28%' }} />
                        </div>
                        <span className="text-xs font-bold text-text-primary">28%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-sidebar border border-border-custom rounded-[2.5rem] flex flex-col">
          <div className="p-6 border-b border-border-custom bg-card/30">
            <h3 className="text-xl font-bold text-text-primary">{t('restaurant.dashboard.activity.title')}</h3>
          </div>
          <div className="flex-1 p-6 space-y-6">
            {[
              { icon: <Plus size={14} className="text-green-custom" />, text: isRtl ? 'طلب جديد — طاولة 5 — 185 $' : 'New Order — Table 5 — 185 USD', time: '2m' },
              { icon: <Camera size={14} className="text-purple-custom" />, text: isRtl ? 'زبون صوّر برغر واغيو بالـ 3D' : 'Customer captured Wagyu Burger in 3D', time: '15m' },
              { icon: <Eye size={14} className="text-blue-500" />, text: isRtl ? 'برغر واغيو — 34 مشاهدة الآن' : 'Wagyu Burger — 34 views now', time: '22m' },
              { icon: <Utensils size={14} className="text-amber-500" />, text: isRtl ? 'تم تحديث حالة "ريش لحم" إلى نفد' : 'Wagyu Ribs status updated to Out of Stock', time: '1h' },
            ].map((activity, i) => (
              <div key={`activity-item-${i}-${activity.time}`} className="flex gap-4">
                <div className="w-8 h-8 bg-card rounded-full border border-border-custom flex items-center justify-center shrink-0">
                  {activity.icon}
                </div>
                <div className="flex-1">
                  <p className="text-sm leading-tight mb-1 text-text-primary">{activity.text}</p>
                  <p className="text-[10px] text-text-secondary uppercase font-bold tracking-wider">{activity.time} ago</p>
                </div>
              </div>
            ))}
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
