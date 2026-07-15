import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import DishViewer3D from '../3d/DishViewer3D';

export const NewHeroSection = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center pt-24 overflow-hidden bg-main">
      {/* Background Glows */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[40rem] h-[40rem] bg-indigo-500/10 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-cyan-500/10 rounded-full blur-[100px] mix-blend-screen" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Content (RTL) */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-right"
            dir="rtl"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-medium text-sm mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              منصة الجيل القادم للمطاعم
            </div>

            <h1 className="text-[clamp(2.5rem,6vw,4.5rem)] font-display leading-[1.1] mb-6 text-text-primary tracking-tight">
              زبونك يشوف طبقه <span className="text-transparent bg-clip-text bg-gradient-to-l from-cyan-400 to-indigo-500">ثلاثي الأبعاد</span> قبل ما يطلبه.
            </h1>

            <p className="text-lg md:text-xl text-text-secondary mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed font-sans">
              تجاوز قوائم الـ PDF الجامدة. حوّل قائمة مطعمك إلى تجربة تفاعلية بالواقع المعزز (AR) واربطها بنظام تشغيل متكامل يغطي كل احتياجاتك من الطلب حتى المحاسبة.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button className="w-full sm:w-auto bg-text-primary text-main hover:bg-white font-bold px-8 py-4 rounded-xl text-base transition-colors flex items-center justify-center gap-2">
                احجز عرض تجريبي
                <ArrowLeft size={18} />
              </button>
              <button className="w-full sm:w-auto bg-transparent hover:bg-surface-2 text-text border border-border-custom font-semibold px-8 py-4 rounded-xl text-base transition-colors">
                استكشف النظام
              </button>
            </div>
          </motion.div>

          {/* Visual: 3D Model Viewer */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative lg:h-[600px] h-[400px] flex items-center justify-center"
          >
            {/* Ambient Tech Border for 3D Viewer */}
            <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-b from-border-custom/50 to-transparent p-[1px]">
              <div className="w-full h-full rounded-[2.5rem] overflow-hidden bg-surface-2/30 backdrop-blur-sm relative">
                {/* 3D Component */}
                <DishViewer3D primaryColor="#8B5CF6" height={600} />
                
                {/* Floating UI: Suggestion AI */}
                <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute bottom-8 right-8 bg-surface/90 backdrop-blur-md border border-border-custom p-4 rounded-2xl shadow-2xl"
                  dir="rtl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center font-bold text-white shadow-lg">
                      AI
                    </div>
                    <div>
                      <p className="text-[11px] text-text-muted font-medium mb-0.5">توصية ذكية للزبون</p>
                      <p className="font-bold text-sm text-text-primary">"نقترح إضافة بطاطس مقلية؟"</p>
                    </div>
                  </div>
                </motion.div>

              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};
