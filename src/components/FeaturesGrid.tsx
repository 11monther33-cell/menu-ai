import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { motion } from 'motion/react';
import { Smartphone, QrCode, Share2, Sparkles, Brain, Mic, Users, Clock, MessageSquare, LayoutGrid } from 'lucide-react';

export const FeaturesGrid = () => {
  const { t, isRtl } = useLanguage();

  const features = [
    {
      icon: <LayoutGrid className="text-gold" />,
      tag: isRtl ? 'الأول عالمياً' : 'World First',
      title: isRtl ? 'منيو ثلاثي الأبعاد' : '3D Menu',
      desc: isRtl ? 'زبائنك يرون طبقك من كل الزوايا، يدورونه، يقربونه، ويضعونه على الطاولة بالواقع المعزز.' : 'Guests see your dish from every angle, rotate it, zoom in, and place it on their table in AR.',
      size: 'large'
    },
    {
      icon: <Smartphone className="text-gold" />,
      tag: isRtl ? 'حصري' : 'Exclusive',
      title: '3D Snap',
      desc: isRtl ? 'الزبون يصور الطبق بالزاوية التي يريد وتخرج بطاقة 9:16 جاهزة للمشاركة على سناب شات.' : 'Guest captures the 3D dish at their perfect angle. A ready 9:16 card exports instantly for Snap.',
    },
    {
      icon: <Brain className="text-gold" />,
      tag: 'AI',
      title: 'Taste DNA',
      desc: isRtl ? 'المنصة تتعلم ذوق كل زبون وتعرض له الأطباق التي يحبها حتى في أول زيارة لمطعمك.' : 'The platform learns every guest\'s taste profile and shows them what they\'ll love.',
    },
    {
      icon: <Sparkles className="text-gold" />,
      tag: 'AI',
      title: 'Mood Menu',
      desc: isRtl ? 'كيف مزاجك اليوم؟ AI يختار لك أفضل الأطباق حسب مزاجك والوقت والطقس.' : 'How are you feeling today? AI picks the perfect dishes based on your mood and weather.',
    },
    {
      icon: <Mic className="text-gold" />,
      tag: 'Voice',
      title: isRtl ? 'طلب بالصوت' : 'Voice Order',
      desc: isRtl ? 'قل طلبك بالكلام العربي، AI يفهم ويضيف للسلة فوراً. يدعم اللهجة الخليجية.' : 'Say your order in Arabic. AI understands and adds to cart immediately.',
    },
    {
      icon: <Users className="text-gold" />,
      tag: 'Social',
      title: 'Table Social',
      desc: isRtl ? 'كل جلوس على الطاولة يشوفون اختيارات بعض في الوقت الفعلي ويضيفون للسلة مع بعض.' : 'Everyone at the table sees each other\'s choices in real-time — shared cart experience.',
      size: 'large'
    },
    {
      icon: <Clock className="text-gold" />,
      tag: 'Live',
      title: 'Kitchen Pulse',
      desc: isRtl ? '"بقي 3 حصص فقط" - كل شيء يتحدث مباشرة لبناء الحماس والسرعة.' : '"Only 3 portions left" - Live data builds urgency and helps guests choose faster.',
    },
    {
      icon: <MessageSquare className="text-gold" />,
      tag: 'Direct',
      title: isRtl ? 'ملاحظات الشيف' : 'Chef\'s Notes',
      desc: isRtl ? 'الشيف يكتب ملاحظة تظهر فوراً على المنيو للزبائن: "اللحم وصل الصبح طازج".' : 'Chef types a note that appears on the menu instantly: "The steak arrived fresh today".',
    }
  ];

  return (
    <section id="features" className="py-32 bg-main relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-24 max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-display leading-tight mb-6">{isRtl ? 'ميزات تفوق الخيال' : 'Features Beyond Imagination'}</h2>
          <p className="text-muted text-lg">{isRtl ? 'كل ما تحتاجه لتحويل مطعمك إلى تجربة رقمية فريدة' : 'Everything you need to transform your restaurant into a unique digital experience'}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div 
              key={`feature-${i}-${f.title}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`p-8 rounded-lg bg-surface-2 border border-white/5 hover:border-white/10 transition-colors group relative ${
                f.size === 'large' ? 'md:col-span-2' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-12">
                <div className="w-12 h-12 bg-main border border-white/5 rounded-lg flex items-center justify-center group-hover:-translate-y-1 transition-transform">
                  {f.icon}
                </div>
                <span className="text-[9px] font-medium uppercase tracking-widest text-text bg-surface border border-white/5 px-2 py-1 rounded">
                  {f.tag}
                </span>
              </div>
              <h3 className="text-2xl font-display mb-3">{f.title}</h3>
              <p className="text-muted/80 leading-relaxed text-sm">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
