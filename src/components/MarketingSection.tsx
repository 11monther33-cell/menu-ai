import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { motion } from 'motion/react';
import { TrendingUp, Smartphone, ShieldCheck, Sparkles } from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
  TrendingUp: <TrendingUp className="w-6 h-6" />,
  Smartphone: <Smartphone className="w-6 h-6" />,
  ShieldCheck: <ShieldCheck className="w-6 h-6" />,
  Sparkles: <Sparkles className="w-6 h-6" />,
};

export const MarketingSection = () => {
  const { t, isRtl } = useLanguage();

  const features = t('marketingFeatures.items');

  if (!features || typeof features === 'string') return null; // Safe check

  return (
    <section className="py-32 bg-main relative overflow-hidden">
      {/* Background subtleties */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gold/5 via-main to-main pointer-events-none opacity-60" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-display mb-6 tracking-tight"
          >
            {t('marketingFeatures.title')}
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-text-secondary leading-relaxed"
          >
            {t('marketingFeatures.subtitle')}
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {features.map((feature: any, index: number) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group p-8 rounded-2xl bg-surface border border-white/5 hover:border-gold/30 transition-all duration-500 hover:-translate-y-1 relative overflow-hidden"
            >
              {/* Hover effect background */}
              <div className="absolute inset-0 bg-gradient-to-br from-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10 flex flex-col items-start text-start gap-6">
                <div className="w-14 h-14 rounded-xl bg-dark border border-white/10 flex items-center justify-center text-gold group-hover:scale-110 transition-transform duration-500 shadow-lg">
                  {iconMap[feature.icon]}
                </div>
                <div>
                  <h3 className="text-2xl font-display tracking-wide mb-3">{feature.title}</h3>
                  <p className="text-text-secondary leading-relaxed text-[15px]">
                    {feature.desc}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
