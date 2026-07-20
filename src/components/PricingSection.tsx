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

              <div className="mb-6 border-b border-border-custom pb-6">
                <h3 className="text-xl font-display font-bold mb-1 tracking-wide text-text-primary">{plan.name}</h3>
                {plan.target && <p className="text-[11px] text-text-muted mb-4 uppercase tracking-wider font-semibold">{plan.target}</p>}
                
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-5xl font-display font-bold text-text-primary">
                    {plan.currency}
                    {isAnnual ? Math.floor(parseInt(plan.price) * 0.8 * 12) : plan.price}
                  </span>
                  <span className="text-text-muted text-sm font-medium">/{isAnnual ? (isRtl ? 'سنوياً' : 'year') : (isRtl ? 'شهرياً' : 'month')}</span>
                </div>
                
                {plan.message && <p className="text-sm text-text-secondary leading-relaxed font-medium mb-4">{plan.message}</p>}
                
                {plan.highlight && (
                  <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs px-3 py-2.5 rounded-lg font-semibold leading-relaxed">
                    {plan.highlight}
                  </div>
                )}
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

        {/* Deep Feature Comparison Table */}
        <div className="mt-32 max-w-5xl mx-auto hidden md:block">
          <div className="text-center mb-10">
            <h3 className="text-3xl font-display font-bold text-text-primary">{isRtl ? 'مقارنة الميزات التفصيلية' : 'Detailed Feature Comparison'}</h3>
            <p className="text-text-secondary mt-2">{isRtl ? 'كل ما تحتاجه لاتخاذ القرار الصحيح لمطعمك' : 'Everything you need to make the right choice for your business'}</p>
          </div>
          
          <div className="bg-surface-2/30 border border-border-custom rounded-2xl overflow-hidden backdrop-blur-sm">
            <table className="w-full text-left border-collapse" dir={isRtl ? "rtl" : "ltr"}>
              <thead>
                <tr className="border-b border-border-custom bg-surface/50">
                  <th className="p-6 font-bold text-text-primary w-2/5">{isRtl ? 'الميزة' : 'Feature'}</th>
                  <th className="p-6 font-bold text-text-primary text-center">Starter</th>
                  <th className="p-6 font-bold text-indigo-400 text-center bg-indigo-500/5">Pro</th>
                  <th className="p-6 font-bold text-text-primary text-center">Enterprise</th>
                </tr>
              </thead>
              <tbody className="text-sm text-text-secondary divide-y divide-border-custom/50">
                <tr className="hover:bg-surface-2/50 transition-colors">
                  <td className="p-5 font-medium">{isRtl ? 'نقاط بيع ومحاسبة سحابية (POS)' : 'Cloud POS & Accounting'}</td>
                  <td className="p-5 text-center"><Check size={18} className="mx-auto text-text-muted" /></td>
                  <td className="p-5 text-center bg-indigo-500/5"><Check size={18} className="mx-auto text-indigo-400" /></td>
                  <td className="p-5 text-center"><Check size={18} className="mx-auto text-text-muted" /></td>
                </tr>
                <tr className="hover:bg-surface-2/50 transition-colors">
                  <td className="p-5 font-medium">{isRtl ? 'فروع مدعومة' : 'Supported Branches'}</td>
                  <td className="p-5 text-center">1</td>
                  <td className="p-5 text-center bg-indigo-500/5 font-bold text-indigo-400">Up to 3</td>
                  <td className="p-5 text-center">Unlimited</td>
                </tr>
                <tr className="hover:bg-surface-2/50 transition-colors">
                  <td className="p-5 font-medium">{isRtl ? 'موديلات أطباق ثلاثية الأبعاد (AR/3D)' : '3D/AR Dish Models'}</td>
                  <td className="p-5 text-center text-border-custom">-</td>
                  <td className="p-5 text-center bg-indigo-500/5"><Check size={18} className="mx-auto text-indigo-400" /></td>
                  <td className="p-5 text-center"><Check size={18} className="mx-auto text-text-muted" /></td>
                </tr>
                <tr className="hover:bg-surface-2/50 transition-colors">
                  <td className="p-5 font-medium">{isRtl ? 'مساعد مبيعات ذكي عبر واتساب' : 'WhatsApp AI Sales Assistant'}</td>
                  <td className="p-5 text-center text-border-custom">-</td>
                  <td className="p-5 text-center bg-indigo-500/5"><Check size={18} className="mx-auto text-indigo-400" /></td>
                  <td className="p-5 text-center"><Check size={18} className="mx-auto text-text-muted" /></td>
                </tr>
                <tr className="hover:bg-surface-2/50 transition-colors">
                  <td className="p-5 font-medium">{isRtl ? 'برنامج ولاء وحملات تسويقية' : 'Loyalty & Marketing Campaigns'}</td>
                  <td className="p-5 text-center text-border-custom">-</td>
                  <td className="p-5 text-center text-border-custom bg-indigo-500/5">-</td>
                  <td className="p-5 text-center"><Check size={18} className="mx-auto text-text-muted" /></td>
                </tr>
                <tr className="hover:bg-surface-2/50 transition-colors">
                  <td className="p-5 font-medium">{isRtl ? 'تكامل مع واجهة برمجة التطبيقات (API)' : 'Custom API Access'}</td>
                  <td className="p-5 text-center text-border-custom">-</td>
                  <td className="p-5 text-center text-border-custom bg-indigo-500/5">-</td>
                  <td className="p-5 text-center"><Check size={18} className="mx-auto text-text-muted" /></td>
                </tr>
                <tr className="hover:bg-surface-2/50 transition-colors">
                  <td className="p-5 font-medium">{isRtl ? 'مستوى الدعم الفني' : 'Support Level'}</td>
                  <td className="p-5 text-center">{isRtl ? 'أوقات العمل' : 'Standard'}</td>
                  <td className="p-5 text-center bg-indigo-500/5 font-medium text-indigo-300">{isRtl ? 'أولوية' : 'Priority'}</td>
                  <td className="p-5 text-center font-bold">{isRtl ? 'مدير حساب مخصص 24/7' : '24/7 Dedicated Manager'}</td>
                </tr>
              </tbody>
            </table>
          </div>
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
