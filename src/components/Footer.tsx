import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { motion } from 'motion/react';
import { MessageCircle, Phone, ShieldCheck, Globe, Zap } from 'lucide-react';

export const Footer = () => {
  const { t, isRtl } = useLanguage();

  const columns = [
    {
      title: isRtl ? 'المنتج' : 'Product',
      links: [
        { label: isRtl ? 'الميزات' : 'Features', href: '#features' },
        { label: isRtl ? 'الأسعار' : 'Pricing', href: '#pricing' }
      ]
    },
    {
      title: isRtl ? 'الشركة' : 'Company',
      links: [
        { label: isRtl ? 'الشروط والأحكام' : 'Terms & Conditions', href: '/terms-conditions' },
        { label: isRtl ? 'سياسة الخصوصية' : 'Privacy Policy', href: '/privacy-policy' },
        { label: isRtl ? 'سياسة الاسترجاع' : 'Refund Policy', href: '/refund-policy' }
      ]
    },
    {
      title: isRtl ? 'للمطاعم' : 'For Restaurants',
      links: [
        { label: isRtl ? 'سجّل مطعمك' : 'Register', href: '/register' },
        { label: isRtl ? 'تسجيل الدخول' : 'Login', href: '/login' }
      ]
    }
  ];

  return (
    <footer className="bg-main pt-24 pb-12 relative overflow-hidden">
      <div className="site-noise"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Final CTA */}
        <div className="relative p-12 md:p-20 rounded-2xl bg-surface-2 border border-white/5 overflow-hidden mb-24 text-center">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5" />
          
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-display mb-6 leading-tight max-w-3xl mx-auto">
              {isRtl ? 'حوّل مطعمك لتجربة لا تُنسى' : 'Transform Your Restaurant Into An Unforgettable Experience'}
            </h2>
            <p className="text-muted/80 text-lg mb-12 max-w-2xl mx-auto">
              {isRtl 
                ? 'انضم لأكثر من 500 مطعم وكوفيه يستخدمون VISIONO لرفع مبيعاتهم' 
                : 'Join 500+ restaurants and cafés using VISIONO to grow their sales'}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="w-full sm:w-auto bg-gold hover:bg-gold-light text-main font-semibold px-8 py-4 rounded-lg text-sm transition-colors uppercase tracking-wider">
                {t('hero.ctaPrimary')}
              </button>
              <button className="w-full sm:w-auto bg-[#25D366] hover:bg-[#1DA851] text-white font-semibold px-8 py-4 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors uppercase tracking-wider">
                <MessageCircle size={18} />
                {isRtl ? 'واتساب مباشر' : 'Direct WhatsApp'}
              </button>
            </div>

            <div className="mt-12 flex flex-wrap justify-center gap-8 text-muted/70 text-xs uppercase tracking-widest font-medium">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-gold" />
                <span>{isRtl ? 'بياناتك محمية' : 'Data Protected'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe size={16} className="text-gold" />
                <span>{isRtl ? 'يعمل في كل مكان' : 'Works Everywhere'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-gold" />
                <span>{isRtl ? 'تفعيل فوري' : 'Instant Activation'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-12 mb-16">
          <div className="col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <img src="/logo.png" alt="VISIONO" className="h-12 object-contain" />
            </div>
            <p className="text-muted/80 text-sm max-w-xs leading-relaxed">
              {t('footer.tagline')}
            </p>
          </div>

          {columns.map((col, i) => (
            <div key={`footer-col-${i}-${col.title}`}>
              <h4 className="font-semibold mb-6 text-text text-sm uppercase tracking-widest">{col.title}</h4>
              <ul className="space-y-4">
                {col.links.map((link, j) => (
                  <li key={`footer-link-${i}-${j}-${link.label}`}>
                    <a href={link.href} className="text-muted hover:text-gold transition-colors text-sm">{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted/60 text-xs">{t('footer.rights')}</p>
          <div className="flex gap-6">
            <a href="#" className="text-muted hover:text-gold transition-colors text-sm">Instagram</a>
            <a href="#" className="text-muted hover:text-gold transition-colors text-sm">Twitter</a>
            <a href="#" className="text-muted hover:text-gold transition-colors text-sm">LinkedIn</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
