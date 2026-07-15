import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { motion } from 'motion/react';
import { Check, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PricingSection = () => {
  const { t, isRtl } = useLanguage();
  const navigate = useNavigate();
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = t('pricing.plans');

  return (
    <section id="pricing" className="py-24 bg-main relative overflow-hidden">
      <div className="site-noise"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-display mb-4"
          >
            {t('pricing.title')}
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-muted text-xl"
          >
            {t('pricing.subtitle')}
          </motion.p>

          {/* Toggle */}
          <div className="mt-10 flex items-center justify-center gap-4">
            <span className={`text-sm font-medium ${!isAnnual ? 'text-text' : 'text-muted'}`}>{t('pricing.monthly')}</span>
            <button 
              onClick={() => setIsAnnual(!isAnnual)}
              className="relative w-14 h-7 bg-surface rounded-full p-1 transition-colors"
            >
              <motion.div 
                animate={{ x: isAnnual ? (isRtl ? -28 : 28) : 0 }}
                className="w-5 h-5 bg-indigo-500 rounded-full"
              />
            </button>
            <span className={`text-sm font-medium ${isAnnual ? 'text-indigo-400' : 'text-text-muted'}`}>{t('pricing.annual')}</span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 items-start">
          {plans.map((plan: any, i: number) => (
            <motion.div 
              key={`pricing-plan-${i}-${plan.name}`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative p-8 rounded-[2rem] border transition-all duration-300 ${
                plan.popular 
                  ? 'bg-gradient-to-b from-surface-2 to-surface border-indigo-500/50 shadow-2xl shadow-indigo-500/10 scale-105 z-10' 
                  : 'bg-surface-2/50 backdrop-blur-sm border-border-custom hover:border-indigo-500/30'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white text-[10px] font-bold px-4 py-1 rounded-full flex items-center gap-1 uppercase tracking-widest shadow-lg">
                  <Star size={10} fill="currentColor" />
                  {isRtl ? 'الأكثر طلباً' : 'MOST POPULAR'}
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-lg font-display mb-4 tracking-wide">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-display">
                    {plan.currency}
                    {isAnnual ? Math.floor(parseInt(plan.price) * 0.8 * 12) : plan.price}
                  </span>
                  <span className="text-muted text-sm">/{isAnnual ? (isRtl ? 'سنوياً' : 'year') : (isRtl ? 'شهرياً' : 'month')}</span>
                </div>
                <p className="text-indigo-400 text-xs mt-2 uppercase tracking-widest font-medium">3 {isRtl ? 'أيام مجاناً' : 'days free'}</p>
              </div>

              <ul className="space-y-4 mb-10">
                {plan.features.map((feature: string, j: number) => (
                  <li key={`plan-feature-${i}-${j}`} className="flex items-start gap-3 text-sm text-muted">
                    <Check size={16} className="text-indigo-400 shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button 
                onClick={() => navigate(`/register?plan=${plan.id}&billing=${isAnnual ? 'annual' : 'monthly'}`)}
                className={`w-full py-3.5 rounded-lg font-semibold transition-colors uppercase tracking-widest text-[11px] ${
                  plan.popular 
                    ? 'bg-text-primary text-main hover:bg-white' 
                    : 'bg-transparent text-text-primary hover:bg-surface-2 border border-border-custom'
                }`}
              >
                {t('pricing.cta')}
              </button>
            </motion.div>
          ))}
        </div>

        {/* FAQ Preview */}
        <div className="mt-24 max-w-3xl mx-auto">
          <h4 className="text-2xl font-display text-center mb-10">{isRtl ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}</h4>
          <div className="space-y-4">
            {[
              { q: isRtl ? 'لماذا أحتاج لربط البطاقة للتجربة؟' : 'Why do I need to link a card for the trial?', a: isRtl ? 'لضمان استمرارية الخدمة بعد انتهاء الـ 3 أيام. لن يتم سحب أي مبلغ اليوم.' : 'To ensure service continuity after 3 days. No charges will be made today.' },
              { q: isRtl ? 'هل يمكنني الإلغاء في أي وقت؟' : 'Can I cancel anytime?', a: isRtl ? 'نعم، يمكنك الإلغاء من لوحة التحكم في أي وقت قبل انتهاء التجربة.' : 'Yes, you can cancel from your dashboard anytime before the trial ends.' }
            ].map((faq, i) => (
              <div key={`faq-item-${i}`} className="p-6 bg-surface-2 rounded-xl border border-white/5">
                <p className="font-semibold mb-2">{faq.q}</p>
                <p className="text-muted text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
