import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { motion } from 'motion/react';
import { QrCode, Printer, CheckCircle2 } from 'lucide-react';

export const QrSection = () => {
  const { t, isRtl } = useLanguage();

  const points = isRtl ? [
    'باركود مخصص بشعار مطعمك',
    'طباعة للطاولات بـ PDF جاهز',
    'باركود واحد — المنيو يتحدث دائماً',
    'طاولة 1 أو 100 طاولة — بدون فرق في السعر',
    'تغير المنيو؟ الباركود يبقى نفسه'
  ] : [
    'Custom QR with your restaurant logo',
    'Print-ready PDF for all tables',
    'One QR code — menu always up-to-date',
    '1 table or 100 tables — same price',
    'Changed the menu? QR code stays the same'
  ];

  return (
    <section className="py-24 bg-main relative overflow-hidden border-y border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: isRtl ? 50 : -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-display mb-6 leading-tight">
              {isRtl ? 'اطبع الباركود على طاولتك وابدأ فوراً' : 'Print Your QR Code Yourself And Start Immediately'}
            </h2>
            <p className="text-muted/80 text-lg mb-8 leading-relaxed max-w-lg">
              {isRtl 
                ? 'لا حاجة لشراء أجهزة أو أنظمة معقدة. أنشئ منيوك في VISIONO، حمّل الباركود واطبعه بنفسك.' 
                : 'No need to buy devices or complex systems. Build your menu in VISIONO, download the QR code and print it yourself.'}
            </p>

            <div className="space-y-4 mb-10">
              {points.map((point, i) => (
                <div key={`qr-point-${i}`} className="flex items-center gap-4">
                  <div className="w-5 h-5 bg-gold/10 border border-gold/20 rounded flex items-center justify-center text-gold">
                    <CheckCircle2 size={12} />
                  </div>
                  <span className="text-sm text-text font-medium">{point}</span>
                </div>
              ))}
            </div>

            <div className="p-6 bg-surface-2 border border-white/5 rounded-lg flex gap-4">
              <span className="text-2xl">💡</span>
              <p className="text-muted/90 text-sm leading-relaxed">
                 {isRtl 
                  ? 'الباركود لا يتغير حتى لو غيّرت المنيو كله. اطبعه مرة واحدة وانسَ الموضوع.' 
                  : 'The QR code never changes even if you update your entire menu. Print once and forget it.'}
              </p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="relative z-10 bg-surface-2 border border-white/5 p-10 md:p-14 rounded-2xl shadow-xl">
              <div className="aspect-square bg-white rounded-xl p-6 md:p-10 flex items-center justify-center relative group">
                <QrCode size={200} className="text-dark w-full h-full" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-dark/10 backdrop-blur-sm rounded-xl">
                  <button className="bg-gold text-main font-semibold px-6 py-3 rounded-lg flex items-center gap-2 shadow-lg text-sm transition-colors hover:bg-gold-light uppercase tracking-wider">
                    <Printer size={18} />
                    {isRtl ? 'تحميل للطباعة' : 'Download for Print'}
                  </button>
                </div>
                {/* Logo in center of QR */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-white border-4 border-white rounded-lg shadow-md flex items-center justify-center font-display font-medium text-main text-xl">
                  TX
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
