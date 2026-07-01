import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { motion } from 'motion/react';
import { TrendingUp, Clock, Globe2, ScanFace, CheckCircle2 } from 'lucide-react';

export const MarketingROI = () => {
  const { isRtl } = useLanguage();

  const metrics = [
    {
      value: '+30%',
      label: isRtl ? 'زيادة في المبيعات' : 'Increase in Sales',
      desc: isRtl ? 'الزبائن يطلبون أكثر عندما يرون الأطباق بشكل واقعي وشهي ثلاثي الأبعاد.' : 'Customers order more when they see realistic, mouth-watering 3D dishes.'
    },
    {
      value: '-15%',
      label: isRtl ? 'وقت دوران الطاولة' : 'Table Turnover Time',
      desc: isRtl ? 'الطلب بشكل أسرع دون انتظار النادل لطلب المنيو أو الاستفسار عن الأطباق.' : 'Faster ordering without waiting for waiters to bring menus or answer questions.'
    },
    {
      value: '100%',
      label: isRtl ? 'بدون تحميل تطبيقات' : 'No App Required',
      desc: isRtl ? 'يمسح الزبون الباركود ويستعرض كل شيء مباشرة عبر متصفح الهاتف.' : 'Guests scan the QR code and browse everything directly via their mobile browser.'
    }
  ];

  const highlights = [
    {
      icon: <TrendingUp className="w-5 h-5 text-gold" />,
      title: isRtl ? 'بيع بصري ذكي' : 'Visual Upselling',
      desc: isRtl ? 'العين تأكل قبل الفم. أبرز أطباقك المربحة بنماذج ثلاثية الأبعاد جذابة تقنع الزبائن فوراً.' : 'People eat with their eyes. Highlight your most profitable dishes with stunning 3D models.'
    },
    {
      icon: <Globe2 className="w-5 h-5 text-gold" />,
      title: isRtl ? 'تعدد اللغات التلقائي' : 'Auto Multi-language',
      desc: isRtl ? 'تخطى حواجز اللغة مع السياح واعرض منيوك باللغة التي تريح الضيف بكل سهولة.' : 'Break language barriers with tourists. Display your menu in the language that suits them.'
    },
    {
      icon: <ScanFace className="w-5 h-5 text-gold" />,
      title: isRtl ? 'واقع معزز (AR)' : 'Augmented Reality',
      desc: isRtl ? 'دع ضيوفك يسقطون الطبق على الطاولة قبل طلبه ليروا حجمه الحقيقي وجودته.' : 'Let guests place the dish on their physical table to see true size and quality before ordering.'
    },
    {
      icon: <Clock className="w-5 h-5 text-gold" />,
      title: isRtl ? 'تعديلات لحظية' : 'Real-time Updates',
      desc: isRtl ? 'انتهى الطبق؟ غير متوفر؟ حدث القائمة بضغطة زر دون طباعة أوراق جديدة.' : 'Item sold out? Update your menu instantly with one click without printing new paper.'
    }
  ];

  return (
    <section className="py-24 bg-surface relative overflow-hidden border-t border-white/5">
      <div className="absolute inset-0 bg-gradient-to-b from-main to-transparent opacity-50" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          <motion.div
            initial={{ opacity: 0, x: isRtl ? 30 : -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/20 text-gold text-xs font-bold uppercase tracking-widest mb-6">
              {isRtl ? 'النمو والأرباح' : 'Growth & ROI'}
            </div>
            <h2 className="text-4xl md:text-5xl font-display leading-[1.1] mb-6">
              {isRtl ? 'لماذا تنتقل إلى ' : 'Why upgrade to '}
              <span className="text-gold">3D Digital Menus</span>
              {isRtl ? '؟' : '?'}
            </h2>
            <p className="text-muted text-lg leading-relaxed mb-10">
              {isRtl 
                ? 'قدم تجربة طعام استثنائية مع أول قائمة طعام رقمية تفاعلية بالكامل. نحن لا نعرض الأطباق فقط، بل نخلق تجربة تسويقية تزيد من متوسط طلب العميل، تسرع دوران الطاولات، وتزيل أي حواجز تقنية بين العميل وطلبه.' 
                : 'Deliver an exceptional dining experience with the first fully interactive digital menu. We don’t just display dishes; we craft a marketing experience that increases average check size, speeds up table turns, and removes technical friction.'}
            </p>

            <div className="space-y-6">
              {highlights.map((h, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-main border border-white/10 flex items-center justify-center shadow-lg">
                    {h.icon}
                  </div>
                  <div>
                    <h4 className="text-white font-bold mb-1">{h.title}</h4>
                    <p className="text-muted text-sm leading-relaxed">{h.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: isRtl ? -30 : 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 gap-6"
          >
            {metrics.map((m, i) => (
              <div 
                key={i} 
                className={`p-8 rounded-2xl bg-[#0F0E0B] border border-white/5 relative overflow-hidden group hover:border-gold/30 transition-all ${i === 2 ? 'sm:col-span-2 text-center' : ''}`}
              >
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <TrendingUp className="w-24 h-24 text-gold transform rotate-12" />
                </div>
                <div className="relative z-10">
                  <h3 className="text-5xl font-display text-gold mb-4">{m.value}</h3>
                  <h4 className="text-white font-bold text-lg mb-2">{m.label}</h4>
                  <p className="text-sm text-text-muted">{m.desc}</p>
                </div>
              </div>
            ))}
          </motion.div>

        </div>
      </div>
    </section>
  );
};
