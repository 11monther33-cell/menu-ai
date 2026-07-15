import React from 'react';
import { motion } from 'motion/react';
import { QrCode, Box, Sparkles, ArrowLeft } from 'lucide-react';

export const SmartMenuFlow = () => {
  const steps = [
    {
      icon: <QrCode size={24} />,
      title: 'امسح الباركود بلحظة',
      description: 'لا حاجة لتحميل أي تطبيق. يمسح الزبون الباركود الموجود على الطاولة لتفتح القائمة التفاعلية فوراً على متصفح الجوال.',
      color: 'text-cyan-400',
      bg: 'bg-cyan-400/10'
    },
    {
      icon: <Box size={24} />,
      title: 'تصفح الأطباق بـ 3D',
      description: 'يستطيع الزبون تدوير الطبق، تقريبه، ورؤية حجمه ومكوناته الحقيقية وكأنه أمامه على الطاولة عبر تقنية الواقع المعزز (AR).',
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10'
    },
    {
      icon: <Sparkles size={24} />,
      title: 'توصيات ذكية تزيد المبيعات',
      description: 'أثناء تصفح الزبون، يقوم الذكاء الاصطناعي بتحليل اختياراته واقتراح إضافات ومشروبات متوافقة لرفع متوسط قيمة الفاتورة.',
      color: 'text-purple-400',
      bg: 'bg-purple-500/10'
    }
  ];

  return (
    <section className="py-24 bg-main relative overflow-hidden border-t border-border-custom/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10" dir="rtl">
        
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl md:text-5xl font-display font-bold text-text-primary mb-6">
            رحلة طلب أذكى، في 3 خطوات فقط.
          </h2>
          <p className="text-lg text-text-secondary leading-relaxed">
            صممنا تجربة المستخدم لتقليل الاحتكاك للصفر. رحلة سلسة تبدأ من الطاولة وتنتهي بطلب جاهز، بدون الحاجة لمناداة النادل.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connector Line (Desktop) */}
          <div className="hidden md:block absolute top-12 right-[15%] left-[15%] h-px bg-gradient-to-l from-transparent via-border-custom to-transparent" />

          {steps.map((step, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.2 }}
              viewport={{ once: true }}
              className="relative bg-surface-2/50 backdrop-blur-sm border border-border-custom p-8 rounded-[2.5rem] hover:bg-surface-2 transition-colors"
            >
              <div className={`w-16 h-16 rounded-2xl ${step.bg} ${step.color} flex items-center justify-center mb-8 mx-auto relative z-10`}>
                {step.icon}
              </div>
              
              <h3 className="text-xl font-bold text-text-primary mb-4 text-center">
                <span className="text-text-muted text-sm font-normal block mb-2">الخطوة {i + 1}</span>
                {step.title}
              </h3>
              
              <p className="text-text-secondary text-center leading-relaxed text-sm">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};
