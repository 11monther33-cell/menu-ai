import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calculator, QrCode, CalendarClock, Smartphone, 
  MessageSquareHeart, Users, MonitorPlay, Truck, 
  Gift, LineChart, ChevronLeft
} from 'lucide-react';

export const RestaurantOS = () => {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    {
      id: 'pos',
      icon: <Calculator size={20} />,
      title: 'المحاسبة ونقاط البيع (POS)',
      desc: 'إصدار فواتير، تتبع المصروفات، وتنبيهات تلقائية بنفاد المخزون. كل شيء مرتبط مباشرة بطلبات الزبائن دون تدخل يدوي.',
      imageColor: 'from-blue-500/20 to-cyan-500/20'
    },
    {
      id: 'qr',
      icon: <QrCode size={20} />,
      title: 'QR متعدد الاستخدامات',
      desc: 'باركود واحد لكل طاولة: يستخدم لعرض القائمة، الطلب، دفع الفاتورة، وتقييم التجربة في النهاية.',
      imageColor: 'from-purple-500/20 to-pink-500/20'
    },
    {
      id: 'reservations',
      icon: <CalendarClock size={20} />,
      title: 'الحجوزات وإدارة الطاولات',
      desc: 'خريطة تفاعلية حية لحالة الطاولات (متاحة، مشغولة، محجوزة) مع قائمة انتظار مؤتمتة ترسل رسائل واتساب للزبائن.',
      imageColor: 'from-green-500/20 to-emerald-500/20'
    },
    {
      id: 'mobile',
      icon: <Smartphone size={20} />,
      title: 'تجربة الزبون من الجوال',
      desc: 'دفع ذاتي من الطاولة عبر Apple Pay، تقسيم الفاتورة مع الأصدقاء، واستدعاء نادل رقمي بضغطة زر.',
      imageColor: 'from-orange-500/20 to-amber-500/20'
    },
    {
      id: 'reviews',
      icon: <MessageSquareHeart size={20} />,
      title: 'التقييمات الذكية',
      desc: 'توجيه المراجعات السلبية للمدير مباشرة للتعامل معها سراً، ودفع المراجعات الإيجابية لجوجل ماب.',
      imageColor: 'from-red-500/20 to-rose-500/20'
    },
    {
      id: 'staff',
      icon: <Users size={20} />,
      title: 'إدارة الموظفين',
      desc: 'صلاحيات دقيقة لكل دور (كاشير، نادل، مدير)، وتسجيل حضور وانصراف، وتتبع أداء وسرعة الخدمة.',
      imageColor: 'from-indigo-500/20 to-blue-500/20'
    },
    {
      id: 'kds',
      icon: <MonitorPlay size={20} />,
      title: 'شاشة المطبخ (KDS)',
      desc: 'تصل الطلبات رقمياً للمطبخ لحظة دفع الزبون، وتتحدث حالة الطلب لدى الزبون في جواله تلقائياً.',
      imageColor: 'from-slate-500/20 to-gray-500/20'
    },
    {
      id: 'delivery',
      icon: <Truck size={20} />,
      title: 'إدارة التوصيل',
      desc: 'استقبال طلبات التوصيل وتتبع السائقين في لوحة واحدة، دون الحاجة لأجهزة لوحية متعددة مزعجة.',
      imageColor: 'from-teal-500/20 to-cyan-500/20'
    },
    {
      id: 'loyalty',
      icon: <Gift size={20} />,
      title: 'الولاء والتسويق',
      desc: 'نظام نقاط مدمج، وكوبونات خصم تُرسل تلقائياً عبر الواتساب في المناسبات لزيادة ولاء الزبائن.',
      imageColor: 'from-fuchsia-500/20 to-pink-500/20'
    },
    {
      id: 'analytics',
      icon: <LineChart size={20} />,
      title: 'تحليلات دقيقة',
      desc: 'تقارير حية عن الأطباق الأكثر مبيعاً، هوامش الربح، وأوقات الذروة لاتخاذ قرارات تعتمد على البيانات.',
      imageColor: 'from-violet-500/20 to-purple-500/20'
    }
  ];

  return (
    <section className="py-24 bg-main relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10" dir="rtl">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-display font-bold text-text-primary mb-6">
            النظام خلف الكواليس.
          </h2>
          <p className="text-lg text-text-secondary leading-relaxed">
            ليس مجرد قائمة طعام. VISIONO هو نظام تشغيل كامل للمطعم (Restaurant OS) يربط كل جزء من عملك في شاشة واحدة متكاملة.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:h-[600px]">
          
          {/* Vertical Tabs */}
          <div className="w-full lg:w-1/3 flex flex-col gap-2 overflow-y-auto pr-2 custom-scrollbar lg:h-full">
            {tabs.map((tab, idx) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(idx)}
                className={`flex items-center gap-4 w-full p-4 rounded-2xl transition-all text-right ${
                  activeTab === idx 
                    ? 'bg-surface border border-border-custom shadow-lg' 
                    : 'hover:bg-surface/50 border border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  activeTab === idx ? 'bg-indigo-500 text-white' : 'bg-surface-2 text-text-secondary'
                }`}>
                  {tab.icon}
                </div>
                <div className="flex-1">
                  <h4 className={`font-bold text-sm ${activeTab === idx ? 'text-text-primary' : 'text-text-secondary'}`}>
                    {tab.title}
                  </h4>
                </div>
                {activeTab === idx && <ChevronLeft size={16} className="text-indigo-400" />}
              </button>
            ))}
          </div>

          {/* Tab Content (Mockup View) */}
          <div className="w-full lg:w-2/3 h-[400px] lg:h-full relative rounded-[2.5rem] bg-surface border border-border-custom overflow-hidden flex flex-col">
            
            {/* Fake Browser Header */}
            <div className="h-12 bg-surface-2 border-b border-border-custom flex items-center px-4 gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                <div className="w-3 h-3 rounded-full bg-green-500/50" />
              </div>
              <div className="flex-1 ml-4 bg-main rounded-md h-6 mx-4 flex items-center px-3 text-[10px] text-text-muted font-mono justify-center">
                dashboard.visiono.app / {tabs[activeTab].id}
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 relative p-8 flex flex-col justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="w-full h-full"
                >
                  <div className="mb-8">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
                      {tabs[activeTab].icon}
                    </div>
                    <h3 className="text-2xl font-bold text-text-primary mb-3">{tabs[activeTab].title}</h3>
                    <p className="text-text-secondary leading-relaxed max-w-lg">{tabs[activeTab].desc}</p>
                  </div>

                  {/* Abstract Dashboard Visual */}
                  <div className={`w-full h-48 rounded-2xl bg-gradient-to-br ${tabs[activeTab].imageColor} border border-white/5 flex items-center justify-center relative overflow-hidden`}>
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.8)_0,transparent_1px)]" style={{ backgroundSize: '16px 16px' }} />
                    <div className="text-center z-10 bg-main/50 backdrop-blur-md px-6 py-3 rounded-xl border border-white/10 text-sm font-medium">
                      واجهة {tabs[activeTab].title}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
            
          </div>

        </div>
      </div>
    </section>
  );
};
