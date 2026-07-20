import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Box } from 'lucide-react';

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

          {/* Visual: Tablet Mockup */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative lg:h-[600px] h-[400px] flex items-center justify-center"
            style={{ perspective: '1000px' }}
          >
            {/* Parallax Container */}
            <motion.div 
              animate={{ rotateY: [-2, 2, -2], rotateX: [1, -1, 1] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="relative w-full max-w-[340px] aspect-[3/4] bg-[#222] p-2.5 rounded-[2.5rem] shadow-[0_0_50px_rgba(139,92,246,0.15)] border border-[#333] ring-1 ring-black/50 mx-auto"
            >
              {/* Tablet Camera */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-black rounded-full" />
              
              {/* Tablet Screen */}
              <div className="w-full h-full bg-surface rounded-[2rem] overflow-hidden relative border border-white/5 flex flex-col">
                 
                 {/* App Header */}
                 <div className="p-4 flex items-center justify-between border-b border-white/5 bg-surface-2/50 backdrop-blur-md z-10" dir="rtl">
                   <div className="font-bold text-xs text-text-primary">القائمة الذكية</div>
                   <div className="flex gap-1.5">
                     <div className="w-2 h-2 rounded-full bg-border-custom" />
                     <div className="w-2 h-2 rounded-full bg-border-custom" />
                     <div className="w-2 h-2 rounded-full bg-border-custom" />
                   </div>
                 </div>

                 {/* App Content - Interactive Placeholder */}
                 <div className="flex-1 relative bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 flex items-center justify-center group cursor-pointer overflow-hidden">
                    {/* Placeholder Plate */}
                    <motion.div 
                       animate={{ rotate: 360 }}
                       transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                       className="w-56 h-56 rounded-full border border-dashed border-indigo-500/20 flex items-center justify-center relative"
                    >
                      <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-indigo-500/20 to-cyan-500/20 backdrop-blur-3xl" />
                      <div className="absolute inset-12 rounded-full bg-gradient-to-tr from-indigo-500/30 to-cyan-500/30 backdrop-blur-xl shadow-inner" />
                    </motion.div>
                    
                    {/* Interactive Play Button */}
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                       <div className="bg-surface/90 backdrop-blur-xl text-white font-bold text-sm px-5 py-2.5 rounded-full border border-white/10 flex items-center gap-2 group-hover:scale-105 transition-transform shadow-xl">
                         <Box size={16} className="text-indigo-400" />
                         عرض 3D
                       </div>
                    </div>
                 </div>
                 
                 {/* Floating UI: Suggestion AI */}
                 <motion.div 
                   animate={{ y: [0, -6, 0] }}
                   transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                   className="absolute bottom-6 right-4 left-4 bg-surface/95 backdrop-blur-xl border border-white/10 p-3.5 rounded-2xl shadow-xl z-20"
                   dir="rtl"
                 >
                   <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center font-bold text-[10px] text-white shadow-lg shrink-0">
                       AI
                     </div>
                     <div>
                       <p className="text-[9px] text-text-muted font-medium mb-0.5">توصية ذكية للزبون</p>
                       <p className="font-bold text-xs text-text-primary">"نقترح إضافة بطاطس مقلية؟"</p>
                     </div>
                   </div>
                 </motion.div>
              </div>
            </motion.div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};
