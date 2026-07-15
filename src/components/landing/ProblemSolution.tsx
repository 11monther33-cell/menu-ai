import React from 'react';
import { motion } from 'motion/react';
import { AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';

export const ProblemSolution = () => {
  return (
    <section className="py-24 bg-surface relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10" dir="rtl">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-text-primary mb-6">
            السوق الخليجي تغيّر، والأنظمة القديمة <span className="text-red-400">لم تعد تكفي.</span>
          </h2>
          <p className="text-lg text-text-secondary leading-relaxed">
            معظم المطاعم اليوم عالقة بين خيارين: إما الاعتماد على قوائم PDF ثابتة ومملة تقتل المبيعات، أو محاولة ربط أنظمة أجنبية مجزأة لا تدعم اللغة العربية بشكل صحيح ولا توفر تجربة سلسة للزبون.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Problem Card */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-surface-2 border border-border-custom p-8 rounded-3xl"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-400">
                <AlertCircle size={20} />
              </div>
              <h3 className="text-xl font-bold text-text-primary">الواقع المعقّد حالياً</h3>
            </div>
            
            <ul className="space-y-4">
              {[
                'قوائم PDF ثابتة تتطلب تكبير وتصغير للقراءة',
                'نظام منفصل لنقاط البيع (POS) ونظام للمنيو',
                'أنظمة لا تفهم اتجاه الشاشة العربي (RTL)',
                'تجاهل كامل لقناة التواصل الأهم: واتساب'
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-text-secondary">
                  <div className="mt-1 w-1.5 h-1.5 rounded-full bg-red-400/50 shrink-0" />
                  <span className="leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Solution Card */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 border border-indigo-500/20 p-8 rounded-3xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl" />
            
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                <CheckCircle2 size={20} />
              </div>
              <h3 className="text-xl font-bold text-text-primary">نظام تشغيل VISIONO</h3>
            </div>
            
            <ul className="space-y-4 relative z-10">
              {[
                'منصة واحدة تدير كل شيء من مسح الـ QR حتى الفاتورة',
                'قوائم تفاعلية 3D تزيد رغبة الزبون بالطلب 3 أضعاف',
                'مبني أساساً للغة العربية (RTL) بطريقة أصلية (Native)',
                'مساعد ذكي يبيع ويحجز للزبائن مباشرة عبر الواتساب'
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-text-primary">
                  <div className="mt-1 flex items-center justify-center text-indigo-400 shrink-0">
                    <CheckCircle2 size={16} />
                  </div>
                  <span className="leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

      </div>
    </section>
  );
};
