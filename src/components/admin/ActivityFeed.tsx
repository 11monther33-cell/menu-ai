import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../context/LanguageContext';
import { motion } from 'motion/react';
import { 
  Activity, RotateCcw, Store, DollarSign, 
  Settings, CheckCircle, XCircle, Shield, User,
  Clock
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { logAdminAction } from '../../lib/adminLogger';

export const ActivityFeed = ({ compact = false }: { compact?: boolean }) => {
  const { isRtl } = useLanguage();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();

    const subscription = supabase
      .channel('admin_activity_log_changes')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'admin_activity_log' 
      }, (payload) => {
        setLogs(prev => [payload.new, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const [rollingBack, setRollingBack] = useState<string | null>(null);

  const handleRollback = async (log: any) => {
    if (!log.details || !log.details.setting_key || log.details.old_value === undefined) {
      toast.error(isRtl ? 'لا توجد بيانات كافية للتراجع' : 'Not enough data to rollback');
      return;
    }
    
    setRollingBack(log.id);
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({ 
          key: log.details.setting_key, 
          value: log.details.old_value, 
          updated_at: new Date().toISOString() 
        }, { onConflict: 'key' });

      if (error) throw error;

      await logAdminAction('rollback', 'system_setting', log.details.setting_key, {
        rolled_back_from: log.id,
        restored_value: log.details.old_value,
        setting_key: log.details.setting_key
      });

      toast.success(isRtl ? 'تم التراجع بنجاح' : 'Rollback successful');
    } catch (err) {
      console.error(err);
      toast.error(isRtl ? 'فشل التراجع' : 'Rollback failed');
    } finally {
      setRollingBack(null);
    }
  };

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(compact ? 5 : 50);

      if (error) throw error;
      setLogs(data || []);
    } catch (error: any) {
      console.error('Failed to fetch activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes('restaurant')) return <Store size={16} className="text-blue-500" />;
    if (action.includes('price') || action.includes('plan')) return <DollarSign size={16} className="text-gold" />;
    if (action.includes('approve')) return <CheckCircle size={16} className="text-green-500" />;
    if (action.includes('reject')) return <XCircle size={16} className="text-red-500" />;
    if (action.includes('rollback')) return <RotateCcw size={16} className="text-orange-500" />;
    return <Activity size={16} className="text-muted" />;
  };

  const formatAction = (action: string, details: any) => {
    // English mapping fallback
    const arMap: Record<string, string> = {
      'restaurant_created': 'تم إضافة مطعم جديد',
      'restaurant_approved': 'تم الموافقة على مطعم',
      'restaurant_rejected': 'تم رفض مطعم',
      'plan_changed': 'تغيير خطة المطعم',
      'pricing_changed': 'تحديث الأسعار',
      'rollback': 'تراجع عن إجراء'
    };
    
    return arMap[action] || action;
  };

  const renderDetails = (details: any) => {
    if (!details) return null;
    return (
      <div className="mt-2 text-xs bg-dark p-3 rounded-lg border border-surface font-mono overflow-x-auto text-left" dir="ltr">
        {JSON.stringify(details, null, 2)}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin text-gold"><Activity /></div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-12 text-muted">
        <Activity size={48} className="mx-auto mb-4 opacity-20" />
        <p>لا توجد سجلات عمليات حتى الآن</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!compact && (
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <Activity className="text-gold" />
            سجل العمليات الموحد (Audit Log)
          </h2>
        </div>
      )}

      <div className="relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-surface before:to-transparent">
        {logs.map((log, index) => (
          <motion.div 
            key={log.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="relative flex items-start justify-between md:justify-normal md:odd:flex-row-reverse group is-active mb-6"
          >
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-dark-2 bg-surface text-muted shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 shadow-lg ${isRtl ? 'ml-4 md:ml-0' : 'mr-4 md:mr-0'}`}>
              {getActionIcon(log.action)}
            </div>
            
            <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-dark-2 border border-surface p-4 rounded-xl shadow-lg transition-all hover:border-gold/30 hover:shadow-gold/5`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm flex items-center gap-2">
                  {formatAction(log.action, log.details)}
                </span>
                <span className="text-[10px] text-muted flex items-center gap-1">
                  <Clock size={12} />
                  {new Date(log.created_at).toLocaleString('ar-SA')}
                </span>
              </div>
              
              <div className="text-xs text-muted mb-2 flex items-center gap-2">
                <Shield size={12} />
                <span className="opacity-70">بواسطة:</span> {log.actor_type === 'super_admin' ? 'المدير العام' : log.actor_type}
                {log.target_type && (
                  <>
                    <span className="mx-2 opacity-30">|</span>
                    <span className="opacity-70">الهدف:</span> {log.target_type} ({log.target_id?.substring(0, 8)})
                  </>
                )}
              </div>

              {!compact && log.details && renderDetails(log.details)}
              
              {!compact && log.action === 'pricing_changed' && log.details?.old_value !== undefined && (
                <div className="mt-3 flex justify-end">
                  <button 
                    onClick={() => handleRollback(log)}
                    disabled={rollingBack === log.id}
                    className="px-4 py-1.5 bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 text-xs font-bold rounded-lg transition-all flex items-center gap-2"
                  >
                    <RotateCcw size={12} className={rollingBack === log.id ? "animate-spin" : ""} />
                    {isRtl ? 'تراجع عن التغيير (Rollback)' : 'Rollback'}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
