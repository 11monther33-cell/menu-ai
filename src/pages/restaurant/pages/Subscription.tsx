import React, { useState } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { motion } from 'motion/react';
import { Check, Star, CreditCard, ShieldCheck, Zap, Clock } from 'lucide-react';
import { PaddlePayment } from '../../../components/PaddlePayment';
import { useSystemSettings } from '../../../hooks/useSystemSettings';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';
import { toast } from 'react-hot-toast';

export const Subscription = () => {
  const { isRtl } = useLanguage();
  const { getSetting } = useSystemSettings();
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [isAnnual, setIsAnnual] = useState(false);
  const [restaurantData, setRestaurantData] = useState<any>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  React.useEffect(() => {
    const fetchRestaurantStatus = async () => {
      if (!user?.restaurantId) return;
      const { data } = await supabase
        .from('restaurants')
        .select('subscription_status, subscription_plan, subscription_expiry, name_ar, name_en')
        .eq('id', user.restaurantId)
        .single();
      
      if (data) setRestaurantData(data);
      setLoadingStatus(false);
    };
    fetchRestaurantStatus();
  }, [user?.restaurantId]);

  const plans = [
    {
      id: 'basic',
      name: isRtl ? 'الباقة الأساسية' : 'Basic Plan',
      price: '29',
      paddlePriceIdMonthly: getSetting('paddle_price_basic_monthly', import.meta.env.VITE_PADDLE_PRICE_BASIC_MONTHLY || ''),
      paddlePriceIdAnnual: getSetting('paddle_price_basic_annual', import.meta.env.VITE_PADDLE_PRICE_BASIC_ANNUAL || ''),
      features: isRtl 
        ? ['منيو QR تفاعلي', 'دعم لغتين', 'إحصائيات بسيطة', 'دعم فني إيميل'] 
        : ['Interactive QR Menu', 'Dual Language Support', 'Basic Analytics', 'Email Support'],
      popular: false
    },
    {
      id: 'pro',
      name: isRtl ? 'الباقة المحترفة' : 'Pro Plan',
      price: '79',
      paddlePriceIdMonthly: getSetting('paddle_price_pro_monthly', import.meta.env.VITE_PADDLE_PRICE_PRO_MONTHLY || ''),
      paddlePriceIdAnnual: getSetting('paddle_price_pro_annual', import.meta.env.VITE_PADDLE_PRICE_PRO_ANNUAL || ''),
      features: isRtl 
        ? ['كل ميزات الأساسية', 'منيو ثلاثي الأبعاد AR', 'نظام طلبات مباشر', 'تحليلات متقدمة', 'دعم فني 24/7'] 
        : ['All Basic features', '3D AR Menu', 'Live Order System', 'Advanced Analytics', '24/7 Support'],
      popular: true
    },
    {
      id: 'enterprise',
      name: isRtl ? 'باقة المؤسسات' : 'Enterprise Plan',
      price: '199',
      paddlePriceIdMonthly: getSetting('paddle_price_ent_monthly', import.meta.env.VITE_PADDLE_PRICE_ENT_MONTHLY || ''),
      paddlePriceIdAnnual: getSetting('paddle_price_ent_annual', import.meta.env.VITE_PADDLE_PRICE_ENT_ANNUAL || ''),
      features: isRtl 
        ? ['كل ميزات المحترفة', 'فروع غير محدودة', 'تخصيص كامل للهوية', 'مدير حساب خاص', 'API Integration'] 
        : ['All Pro features', 'Unlimited Branches', 'Full Branding Customization', 'Dedicated Account Manager', 'API Integration'],
      popular: false
    }
  ];

  const handlePaymentSuccess = async (details: any) => {
    try {
      const trialExpiry = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
      
      const { error } = await supabase
        .from('restaurants')
        .update({ 
          subscription_status: 'trial',
          subscription_plan: selectedPlan.id,
          subscription_expiry: trialExpiry,
          paypal_subscription_id: details.subscriptionID || details.id
        })
        .eq('id', user?.restaurantId);

      if (error) throw error;
      
      setRestaurantData((prev: any) => ({
        ...prev,
        subscription_status: 'trial',
        subscription_plan: selectedPlan.id,
        subscription_expiry: trialExpiry
      }));

      setSelectedPlan(null);
      toast.success(isRtl ? 'تم تفعيل الاشتراك بنجاح!' : 'Subscription activated!');
    } catch (err: any) {
      // 🔒 Don't log subscription details
      toast.error(isRtl ? 'حدث خطأ أثناء تفعيل الاشتراك.' : 'Error activating subscription.');
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm(isRtl 
      ? 'هل أنت متأكد أنك تريد إلغاء اشتراكك؟ لن يتم سحب أي مبالغ إضافية.' 
      : 'Are you sure you want to cancel your subscription?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('restaurants')
        .update({ 
          subscription_status: 'cancelled',
        })
        .eq('id', user?.restaurantId);

      if (error) throw error;
      
      setRestaurantData((prev: any) => ({
        ...prev,
        subscription_status: 'cancelled'
      }));

      toast.success(isRtl ? 'تم إلغاء التجديد التلقائي.' : 'Auto-renewal cancelled.');
    } catch (err: any) {
      toast.error(isRtl ? 'حدث خطأ أثناء الإلغاء.' : 'Error during cancellation.');
    }
  };

  if (loadingStatus) {
    return <div className="p-12 text-center text-muted">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Current Status */}
      {!selectedPlan && restaurantData && (restaurantData.subscription_status === 'active' || restaurantData.subscription_status === 'trial') && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gold/10 border border-gold/30 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gold rounded-2xl flex items-center justify-center text-dark shadow-lg shadow-gold/20">
              <Star size={32} fill="currentColor" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gold">
                {restaurantData.subscription_status === 'trial' 
                  ? (isRtl ? 'أنت حالياً في الفترة التجريبية' : 'You are in the free trial')
                  : (isRtl ? 'اشتراكك نشط حالياً' : 'Your subscription is active')}
              </h3>
              <p className="text-text-secondary text-sm">
                {isRtl ? 'الباقة الحالية:' : 'Current Plan:'} <span className="text-text-primary font-bold">{restaurantData.subscription_plan?.toUpperCase()}</span>
              </p>
            </div>
          </div>
          
          <div className="flex flex-col md:items-end gap-3">
            <div className="text-right">
              <div className="flex items-center gap-2 text-text-primary font-bold justify-end">
                <Clock size={18} className="text-gold" />
                <span>
                  {isRtl ? 'تنتهي في:' : 'Expires on:'} {new Date(restaurantData.subscription_expiry).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US')}
                </span>
              </div>
            </div>
            
            <button 
              onClick={handleCancelSubscription}
              className="text-xs font-bold text-red-500 hover:text-red-400 transition-colors flex items-center gap-1"
            >
              <ShieldCheck size={14} />
              {isRtl ? 'إلغاء الاشتراك وإيقاف الدفع' : 'Cancel Subscription & Stop Payments'}
            </button>
          </div>
        </motion.div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-text-primary">
            {isRtl ? 'خطط الاشتراك' : 'Subscription Plans'}
          </h2>
          <p className="text-text-secondary mt-1">
            {isRtl ? 'ابدأ تجربتك المجانية لمدة 3 أيام اليوم.' : 'Start your 3-day free trial today.'}
          </p>
        </div>
        
        <div className="flex items-center gap-4 bg-card p-1 rounded-xl border border-border-custom">
          <button 
            onClick={() => setIsAnnual(false)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${!isAnnual ? 'bg-gold text-white shadow-lg' : 'text-text-secondary hover:text-text-primary'}`}
          >
            {isRtl ? 'شهرياً' : 'Monthly'}
          </button>
          <button 
            onClick={() => setIsAnnual(true)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${isAnnual ? 'bg-gold text-white shadow-lg' : 'text-text-secondary hover:text-text-primary'}`}
          >
            {isRtl ? 'سنوياً (-20%)' : 'Annual (-20%)'}
          </button>
        </div>
      </div>

      {selectedPlan ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-sidebar border border-border-custom rounded-[2.5rem] p-8 md:p-12 max-w-2xl mx-auto"
        >
          <button 
            onClick={() => setSelectedPlan(null)}
            className="mb-8 text-gold hover:underline text-sm font-bold flex items-center gap-2"
          >
            ← {isRtl ? 'العودة للخطط' : 'Back to Plans'}
          </button>
          
          <div className="text-center mb-10">
            <h3 className="text-2xl font-bold mb-2">{isRtl ? 'إتمام الاشتراك' : 'Complete Subscription'}</h3>
            <p className="text-text-secondary">{isRtl ? 'ادفع بأمان عن طريق Paddle بالبطاقة أو المحفظة الإلكترونية' : 'Pay securely via Paddle with Card or Wallet'}</p>
          </div>

          <PaddlePayment 
            planName={selectedPlan.name}
            planId={isAnnual ? selectedPlan.paddlePriceIdAnnual : selectedPlan.paddlePriceIdMonthly}
            amount={isAnnual ? Math.floor(parseInt(selectedPlan.price) * 0.8 * 12).toString() : selectedPlan.price}
            onSuccess={handlePaymentSuccess}
          />

          <div className="mt-12 grid grid-cols-3 gap-4">
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center text-green-500">
                <ShieldCheck size={20} />
              </div>
              <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">{isRtl ? 'دفع آمن' : 'Secure Pay'}</span>
            </div>
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500">
                <Zap size={20} />
              </div>
              <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">{isRtl ? 'تفعيل فوري' : 'Instant'}</span>
            </div>
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-10 h-10 bg-gold/10 rounded-full flex items-center justify-center text-gold">
                <Clock size={20} />
              </div>
              <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">{isRtl ? 'دعم 24/7' : '24/7 Support'}</span>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, i) => (
            <motion.div 
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`relative p-8 rounded-[2.5rem] border transition-all duration-300 flex flex-col ${
                plan.popular 
                  ? 'bg-dark-2 border-gold shadow-2xl shadow-gold/10 scale-105 z-10' 
                  : 'bg-sidebar border-border-custom hover:border-gold/30'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gold text-dark text-[10px] font-bold px-4 py-1 rounded-full flex items-center gap-1">
                  <Star size={12} fill="currentColor" />
                  {isRtl ? 'الأكثر طلباً' : 'MOST POPULAR'}
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-xl font-bold mb-4">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-text-primary">
                    ${isAnnual ? Math.floor(parseInt(plan.price) * 0.8) : plan.price}
                  </span>
                  <span className="text-text-secondary text-sm">/{isRtl ? 'شهرياً' : 'month'}</span>
                </div>
              </div>

              <ul className="space-y-4 mb-10 flex-1">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-start gap-3 text-sm text-text-secondary">
                    <Check size={18} className="text-gold shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button 
                onClick={() => setSelectedPlan(plan)}
                className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${
                  plan.popular 
                    ? 'bg-gold text-white hover:bg-gold-light shadow-lg shadow-gold/20' 
                    : 'bg-card text-text-primary hover:bg-main border border-border-custom'
                }`}
              >
                <CreditCard size={18} />
                {isRtl ? 'اشترك الآن' : 'Subscribe Now'}
              </button>
            </motion.div>
          ))}
        </div>
      )}
      
      {/* Trust Badges */}
      <div className="pt-12 border-t border-border-custom flex flex-wrap justify-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all items-center">
        <img src="https://upload.wikimedia.org/wikipedia/commons/3/30/Apple_Pay_logo.svg" alt="Apple Pay" className="h-8" />
        <img src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg" alt="Google Pay" className="h-6" />
        <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-6" />
        <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-8" />
      </div>
    </div>
  );
};
