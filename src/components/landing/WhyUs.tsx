import React from 'react';
import { Globe2, MessageCircle, CreditCard, LayoutTemplate } from 'lucide-react';

export const WhyUs = () => {
  return (
    <section className="py-24 bg-surface-2 relative overflow-hidden border-t border-border-custom/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10" dir="rtl">
        
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          <div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-text-primary mb-6">
              مبني خصيصاً للمنطقة، وليس مترجماً لها.
            </h2>
            <p className="text-lg text-text-secondary leading-relaxed mb-8">
              معظم أنظمة المطاعم العالمية تم بناؤها للغرب، ثم تُرجمت للعربية كفكرة ثانوية. نحن في VISIONO بنينا النظام من الصفر ليلائم ثقافة وسلوك المستهلك في الخليج والشرق الأوسط.
            </p>
            
            <div className="grid sm:grid-cols-2 gap-6">
              {[
                { icon: <LayoutTemplate size={20} />, title: 'RTL أصلي (Native)', desc: 'واجهات مصممة من اليمين لليسار كأساس وليس كاستثناء.' },
                { icon: <MessageCircle size={20} />, title: 'واتساب أولاً', desc: 'تكامل عميق مع القناة المفضلة للزبون في المنطقة بدلاً من الإيميل.' },
                { icon: <CreditCard size={20} />, title: 'بوابات دفع محلية', desc: 'دعم كامل لـ Apple Pay، مدى، STC Pay، والمحافظ المحلية.' },
                { icon: <Globe2 size={20} />, title: 'استضافة إقليمية', desc: 'بياناتك مستضافة في خوادم محلية لضمان أعلى سرعة واستجابة.' }
              ].map((item, i) => (
                <div key={i} className="bg-main/50 p-6 rounded-2xl border border-border-custom">
                  <div className="text-indigo-400 mb-4">{item.icon}</div>
                  <h4 className="font-bold text-text-primary mb-2">{item.title}</h4>
                  <p className="text-sm text-text-secondary leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            {/* Visual element representing local focus */}
            <div className="aspect-square w-full max-w-md mx-auto relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500/20 to-cyan-500/20 blur-3xl" />
              <div className="relative z-10 h-full rounded-full border border-white/10 flex items-center justify-center p-12 bg-surface/50 backdrop-blur-sm">
                <div className="text-center">
                  <p className="text-6xl mb-4">🌍</p>
                  <h3 className="text-2xl font-bold text-text-primary mb-2">منطقة الشرق الأوسط</h3>
                  <p className="text-text-muted">التركيز على السوق المألوف لنا</p>
                </div>
              </div>
              
              {/* Floating badges */}
              <div className="absolute top-10 right-0 bg-surface border border-border-custom px-4 py-2 rounded-xl text-sm font-bold shadow-lg animate-bounce" style={{ animationDuration: '3s' }}>
                دعم مدى Mada
              </div>
              <div className="absolute bottom-20 left-0 bg-surface border border-border-custom px-4 py-2 rounded-xl text-sm font-bold shadow-lg animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>
                تكامل واتساب كامل
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
