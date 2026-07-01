import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { motion } from 'motion/react';

export const HowItWorks = () => {
  const { t } = useLanguage();

  return (
    <section id="benefits" className="py-24 bg-main relative">
      <div className="site-noise"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-display mb-4"
          >
            {t('howItWorks.title')}
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-muted text-xl max-w-2xl mx-auto"
          >
            {t('howItWorks.subtitle')}
          </motion.p>
        </div>
        <div className="grid md:grid-cols-3 gap-12 mt-12">
          {(t('howItWorks.steps') as any[]).map((item, i) => (
            <motion.div 
              key={`how-it-works-step-${i}`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative p-8 rounded-xl bg-surface-2 border border-white/5 text-center mt-6"
            >
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-main border border-white/10 rounded-full flex items-center justify-center font-display text-gold text-xl shadow-lg">
                {i + 1}
              </div>
              <h3 className="text-xl font-display mt-4 mb-4">{item.title}</h3>
              <p className="text-muted/80 leading-relaxed text-sm">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
