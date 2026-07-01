import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuth } from '../../../hooks/useAuth';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Filter, Clock, CheckCircle2, 
  XCircle, ChefHat, Package, MoreVertical,
  Calendar, Download, Table, ClipboardList
} from 'lucide-react';
import toast from 'react-hot-toast';

export const Orders = () => {
  const { isRtl, t } = useLanguage();
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('PENDING');
  const [loading, setLoading] = useState(true);

  const tabs = [
    { id: 'PENDING', label: isRtl ? 'معلقة' : 'Pending', color: 'text-amber-500' },
    { id: 'CONFIRMED', label: isRtl ? 'مؤكدة' : 'Confirmed', color: 'text-blue-500' },
    { id: 'PREPARING', label: isRtl ? 'تحضير' : 'Preparing', color: 'text-purple-500' },
    { id: 'READY', label: isRtl ? 'جاهزة' : 'Ready', color: 'text-green-500' },
    { id: 'DELIVERED', label: isRtl ? 'مسلمة' : 'Delivered', color: 'text-muted' },
    { id: 'CANCELLED', label: isRtl ? 'ملغية' : 'Cancelled', color: 'text-red-500' },
  ];

  useEffect(() => {
    if (!user?.restaurantId || user.restaurantId === 'undefined') return;

    const fetchOrders = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', user.restaurantId)
        .order('created_at', { ascending: false });

      if (data) setOrders(data);
      setLoading(false);
    };

    fetchOrders();

    const subscription = supabase
      .channel('orders_page')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'orders',
        filter: `restaurant_id=eq.${user.restaurantId}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setOrders(prev => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setOrders(prev => prev.map(o => o.id === payload.new.id ? payload.new : o));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user?.restaurantId]);

  const updateStatus = async (orderId: string, status: string) => {
    // 🔒 SECURITY: Whitelist allowed statuses
    const ALLOWED_STATUSES = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED'];
    if (!ALLOWED_STATUSES.includes(status)) return;

    try {
      // 🔒 SECURITY: Filter by restaurant_id to prevent IDOR
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)
        .eq('restaurant_id', user?.restaurantId);

      if (error) throw error;
      toast.success(isRtl ? 'تم تحديث حالة الطلب' : 'Order status updated');
    } catch (err) {
      toast.error(isRtl ? 'فشل التحديث' : 'Update failed');
    }
  };

  const filteredOrders = orders.filter(o => o.status === activeTab);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-text-primary">{t('restaurant.nav.orders')}</h1>
          <p className="text-text-secondary">{isRtl ? 'إدارة ومتابعة جميع طلبات الزبائن' : 'Manage and track all customer orders'}</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-card text-text-primary border border-border-custom font-bold rounded-xl flex items-center gap-2 hover:bg-sidebar transition-all">
            <Calendar size={18} />
            {isRtl ? 'اليوم' : 'Today'}
          </button>
          <button className="px-4 py-2 bg-card text-text-primary border border-border-custom font-bold rounded-xl flex items-center gap-2 hover:bg-sidebar transition-all">
            <Download size={18} />
            {isRtl ? 'تصدير' : 'Export'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto pb-2 gap-2 custom-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 rounded-2xl font-bold whitespace-nowrap transition-all flex items-center gap-3 border ${
              activeTab === tab.id 
                ? 'bg-gold/10 border-gold text-gold' 
                : 'bg-sidebar border-border-custom text-text-secondary hover:border-text-secondary'
            }`}
          >
            <span className={activeTab === tab.id ? 'text-gold' : tab.color}>●</span>
            {tab.label}
            <span className={`px-2 py-0.5 rounded-lg text-[10px] ${activeTab === tab.id ? 'bg-gold text-white' : 'bg-card text-text-secondary'}`}>
              {orders.filter(o => o.status === tab.id).length}
            </span>
          </button>
        ))}
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredOrders.map((order) => (
            <motion.div
              key={order.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-sidebar border border-border-custom rounded-[2.5rem] overflow-hidden flex flex-col hover:shadow-xl hover:shadow-gold/5 transition-all"
            >
              <div className="p-6 border-b border-border-custom flex items-center justify-between bg-card/30">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gold/10 text-gold rounded-2xl flex items-center justify-center font-bold text-xl">
                    {order.table_number}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-lg text-text-primary">{isRtl ? `طاولة ${order.table_number}` : `Table ${order.table_number}`}</span>
                      <span className="text-text-secondary text-xs">#{order.id.slice(0, 8)}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-text-secondary">
                      <span className="flex items-center gap-1"><Clock size={12} /> {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="w-1 h-1 bg-border-custom rounded-full" />
                      <span className="flex items-center gap-1"><Table size={12} /> {isRtl ? 'طلب محلي' : 'Dine-in'}</span>
                    </div>
                  </div>
                </div>
                <button className="p-2 text-text-secondary hover:text-text-primary">
                  <MoreVertical size={20} />
                </button>
              </div>

              <div className="flex-1 p-6 space-y-4 bg-main/30">
                <div className="space-y-3">
                  {order.items?.map((item: any, i: number) => (
                    <div key={`${order.id}-item-${i}-${item.name}`} className="flex justify-between items-start">
                      <div className="flex gap-3">
                        <span className="w-6 h-6 bg-card border border-border-custom rounded flex items-center justify-center text-xs font-bold text-text-primary">{item.quantity}x</span>
                        <div>
                          <p className="text-sm font-bold text-text-primary">{item.name}</p>
                          {item.notes && <p className="text-[10px] text-amber-500 mt-1">📝 {item.notes}</p>}
                        </div>
                      </div>
                      <span className="text-sm font-medium text-text-primary">{item.price * item.quantity} $</span>
                    </div>
                  ))}
                </div>

                {order.notes && (
                  <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl text-xs text-amber-500 italic">
                    "{order.notes}"
                  </div>
                )}
              </div>

              <div className="p-6 bg-card/30 border-t border-border-custom space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary text-sm">{isRtl ? 'الإجمالي' : 'Total'}</span>
                  <span className="text-2xl font-bold text-gold">{order.total} $</span>
                </div>

                <div className="flex gap-3">
                  {order.status === 'PENDING' && (
                    <>
                      <button 
                        onClick={() => updateStatus(order.id, 'CANCELLED')}
                        className="flex-1 py-3 bg-red-500/10 text-red-500 font-bold rounded-xl hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"
                      >
                        <XCircle size={18} />
                        {isRtl ? 'رفض' : 'Reject'}
                      </button>
                      <button 
                        onClick={() => updateStatus(order.id, 'CONFIRMED')}
                        className="flex-1 py-3 bg-gold text-white font-bold rounded-xl hover:bg-gold/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-gold/20"
                      >
                        <CheckCircle2 size={18} />
                        {isRtl ? 'تأكيد' : 'Confirm'}
                      </button>
                    </>
                  )}
                  {order.status === 'CONFIRMED' && (
                    <button 
                      onClick={() => updateStatus(order.id, 'PREPARING')}
                      className="w-full py-3 bg-purple-500 text-white font-bold rounded-xl hover:bg-purple-600 transition-all flex items-center justify-center gap-2"
                    >
                      <ChefHat size={18} />
                      {isRtl ? 'بدء التحضير' : 'Start Preparing'}
                    </button>
                  )}
                  {order.status === 'PREPARING' && (
                    <button 
                      onClick={() => updateStatus(order.id, 'READY')}
                      className="w-full py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 size={18} />
                      {isRtl ? 'جاهز للاستلام' : 'Ready for Pickup'}
                    </button>
                  )}
                  {order.status === 'READY' && (
                    <button 
                      onClick={() => updateStatus(order.id, 'DELIVERED')}
                      className="w-full py-3 bg-gold text-white font-bold rounded-xl hover:bg-gold/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-gold/20"
                    >
                      <Package size={18} />
                      {isRtl ? 'تم التسليم' : 'Delivered'}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredOrders.length === 0 && !loading && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center text-text-secondary">
            <div className="w-20 h-20 bg-card rounded-full flex items-center justify-center mb-4 border border-border-custom">
              <ClipboardList size={32} />
            </div>
            <h4 className="font-bold text-lg mb-1 text-text-primary">{isRtl ? 'لا توجد طلبات' : 'No orders found'}</h4>
            <p className="text-sm">{isRtl ? 'لا توجد طلبات في هذا القسم حالياً' : 'There are no orders in this section at the moment'}</p>
          </div>
        )}
      </div>
    </div>
  );
};
