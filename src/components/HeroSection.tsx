import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { motion } from 'motion/react';
import { Play, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const HeroSection = () => {
  const { t, isRtl } = useLanguage();
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } as any,
  };

  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-main">
      <div className="site-noise"></div>
      {/* Subtle Gradient Backing */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-surface via-transparent to-transparent pointer-events-none opacity-50" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center lg:text-start"
          >
            <motion.div 
              variants={itemVariants}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/20 text-gold font-semibold text-sm mb-6"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-gold"></span>
              </span>
              {t('hero.badge')}
            </motion.div>

            <motion.h1 
              variants={itemVariants}
              className="text-[clamp(3rem,8vw,5.5rem)] font-display leading-[1.05] mb-6 tracking-tight text-text"
            >
              {t('hero.h1')}
            </motion.h1>

            <motion.p 
              variants={itemVariants}
              className="text-xl text-muted mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed"
            >
              {t('hero.h2')}
            </motion.p>

            <motion.div 
              variants={itemVariants}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-12"
            >
              <button 
                onClick={() => {
                  const pricing = document.getElementById('pricing');
                  if (pricing) pricing.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full sm:w-auto bg-gold hover:bg-gold-light text-main font-semibold px-8 py-4 rounded-lg text-sm transition-colors uppercase tracking-wider"
              >
                {t('hero.ctaPrimary')}
              </button>
              <button className="w-full sm:w-auto bg-transparent hover:bg-surface-2 text-text border border-white/10 font-semibold px-8 py-4 rounded-lg text-sm flex items-center justify-center gap-3 transition-colors uppercase tracking-wider">
                <Play size={18} fill="currentColor" />
                {t('hero.ctaSecondary')}
              </button>
            </motion.div>

            <motion.div 
              variants={itemVariants}
              className="grid grid-cols-2 sm:grid-cols-3 gap-4"
            >
              {t('hero.trust').map((item: string, i: number) => (
                <div key={`hero-trust-${i}`} className="flex items-center gap-2 text-muted text-sm">
                  <CheckCircle2 size={16} className="text-gold" />
                  <span>{item}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Visual */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="relative hidden lg:block"
          >
            <div className="relative z-10 w-full aspect-square max-w-lg mx-auto">
              {/* Clean Image Mask */}
              <motion.div 
                animate={{ 
                  y: [0, -10, 0],
                }}
                transition={{ 
                  y: { duration: 6, repeat: Infinity, ease: "easeInOut" },
                }}
                className="relative overflow-hidden rounded-2xl aspect-square bg-surface-2 border border-white/5"
              >
                <img 
                  src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1000&auto=format&fit=crop" 
                  alt="3D Burger"
                  className="w-full h-full object-cover filter grayscale hover:grayscale-0 transition-all duration-700 opacity-80 mix-blend-luminosity hover:mix-blend-normal"
                  referrerPolicy="no-referrer"
                />
              </motion.div>
              
              {/* Floating UI Elements */}
              <motion.div 
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -top-4 -right-4 bg-surface-2/90 backdrop-blur-md border border-white/10 p-4 rounded-lg shadow-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center text-green-500">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-muted">Order Status</p>
                    <p className="font-bold text-sm">Preparing (12m)</p>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 5, repeat: Infinity, delay: 1 }}
                className="absolute bottom-10 -left-10 bg-surface-2/90 backdrop-blur-md border border-white/10 p-4 rounded-lg shadow-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gold/10 rounded-full flex items-center justify-center text-gold font-bold">
                    AI
                  </div>
                  <div>
                    <p className="text-xs text-muted">Taste DNA</p>
                    <p className="font-bold text-sm">98% Match for you</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Stats Bar */}
        <div className="mt-20 py-10 border-y border-surface grid grid-cols-2 md:grid-cols-4 gap-8">
          {t('hero.stats').map((stat: any, i: number) => (
            <div key={`hero-stat-${i}`} className="text-center">
              <p className="text-4xl font-bold text-gold mb-1">{stat.value}</p>
              <p className="text-muted text-sm uppercase tracking-widest">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
