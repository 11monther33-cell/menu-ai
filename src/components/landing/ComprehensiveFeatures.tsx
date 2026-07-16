import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, Clock, Calculator, QrCode, Sparkles, 
  Box, Map, UploadCloud, ShieldCheck, Gift, Tablet, 
  UserCheck, LineChart, CalendarClock, MonitorPlay, 
  Truck, MessageSquareHeart, Users, MessageCircle, FileText, Database
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const ComprehensiveFeatures = () => {
  const { isRtl } = useLanguage();
  const [activeTab, setActiveTab] = useState<'live' | 'roadmap'>('live');

  // PART A: LIVE FEATURES
  const liveFeatures = [
    {
      id: 'pos',
      icon: <Calculator size={20} />,
      title: isRtl ? 'نظام محاسبة ونقطة بيع سحابية' : 'Cloud POS & Accounting',
      desc: isRtl 
        ? 'تسجيل طلبات، فواتير تلقائية، ربط المخزون بوصفة كل طبق، تقارير ربح/خسارة، جاهزية للفوترة الإلكترونية العُمانية (Fawtara)'
        : 'Log orders, automate invoices, link inventory to recipes, track P&L, and stay fully compliant with regional e-invoicing (Fawtara)'
    },
    {
      id: 'qr',
      icon: <QrCode size={20} />,
      title: isRtl ? 'طلب مباشر بدون عمولات عبر QR' : '0% Commission Direct QR Ordering',
      desc: isRtl 
        ? 'الزبون يمسح كود الطاولة ويطلب من جواله مباشرة، صفر عمولة توصيل أو منصات'
        : 'Guests scan a table QR code and order directly from their phones, with 0% commission on every order'
    },
    {
      id: 'ai-assistant',
      icon: <Sparkles size={20} />,
      title: isRtl ? 'مساعد ذكاء اصطناعي على القائمة الرقمية' : 'AI Assistant on Digital Menu',
      desc: isRtl 
        ? 'يجاوب أسئلة حقيقية عن الأطباق من بيانات القائمة الفعلية، يبني طلب من كلام طبيعي'
        : 'Answers real questions about your dishes using actual menu data, and builds orders from natural conversation'
    },
    {
      id: '3d-ar',
      icon: <Box size={20} />,
      title: isRtl ? 'موديلات ثلاثية الأبعاد للأطباق + واقع معزز (AR)' : '3D Models + AR',
      desc: isRtl 
        ? 'تُلتقط عبر تطبيق iOS مخصص (تقنية Apple الأصلية على الجهاز)، تُعرض للزبون تفاعلياً بدون أي تطبيق يحمّله'
        : 'Captured via a dedicated iOS app using native Apple technology, displayed interactively to guests without requiring any app downloads'
    },
    {
      id: 'multi-branch',
      icon: <Map size={20} />,
      title: isRtl ? 'دعم فروع متعددة' : 'Multi-branch Support',
      desc: isRtl 
        ? 'أدر قائمة طعامك، مبيعاتك، وموظفيك في كافة فروعك من داشبورد واحد مركزي'
        : 'Manage your menu, sales, and staff across all your locations from a single, centralized dashboard'
    },
    {
      id: 'auto-import',
      icon: <UploadCloud size={20} />,
      title: isRtl ? 'استيراد القائمة تلقائياً' : 'Auto Menu Import',
      desc: isRtl 
        ? 'رفع ملف Excel أو حتى PDF لقائمة موجودة، والذكاء الاصطناعي يستخرج الأطباق والأسعار تلقائياً في ثوانٍ'
        : 'Upload an Excel file or PDF of your existing menu, and our AI automatically extracts dishes and prices in seconds'
    },
    {
      id: 'security',
      icon: <ShieldCheck size={20} />,
      title: isRtl ? 'بنية أمان مالي على مستوى المؤسسات' : 'Enterprise-grade Financial Security',
      desc: isRtl 
        ? 'حماية من الدفع المزدوج، سجل تدقيق كامل، حماية الفواتير من التلاعب على مستوى قاعدة البيانات نفسها'
        : 'Double-payment prevention, full audit logs, and invoice tampering protection directly at the database level'
    }
  ];

  // PART B: ROADMAP
  const roadmapFeatures = [
    {
      id: 'loyalty',
      icon: <Gift size={20} />,
      title: isRtl ? 'برنامج ولاء العملاء' : 'Customer Loyalty Program',
      desc: isRtl ? 'نقاط لكل زيارة، مكافآت قابلة للاستبدال للحفاظ على عملائك' : 'Earn points per visit and redeemable rewards to keep your customers coming back'
    },
    {
      id: 'kiosk',
      icon: <Tablet size={20} />,
      title: isRtl ? 'وضع الكشك (Kiosk)' : 'Kiosk Mode',
      desc: isRtl ? 'تابلت ثابت بالمطعم للطلب الذاتي بدون انتظار كاشير' : 'A dedicated in-store tablet for self-ordering without waiting for a cashier'
    },
    {
      id: 'recognition',
      icon: <UserCheck size={20} />,
      title: isRtl ? 'التعرف الذكي على الضيف' : 'Smart Guest Recognition',
      desc: isRtl ? 'يتذكر تفضيلات الزبون وحساسيته الغذائية تلقائياً من ملاحظات الموظفين' : 'Automatically remembers guest preferences and food allergies based on staff notes'
    },
    {
      id: 'weekly-report',
      icon: <LineChart size={20} />,
      title: isRtl ? 'ملخص أداء أسبوعي بالذكاء الاصطناعي' : 'AI Weekly Performance Summary',
      desc: isRtl ? 'تقرير مقروء بلغة طبيعية بدل جداول أرقام معقدة' : 'A plain-language performance report delivered weekly instead of complex spreadsheets'
    },
    {
      id: 'reservations',
      icon: <CalendarClock size={20} />,
      title: isRtl ? 'إدارة الحجوزات والطاولات' : 'Reservations & Table Management',
      desc: isRtl ? 'حجز أونلاين، خريطة طاولات حية، قائمة انتظار ذكية' : 'Online booking, live table mapping, and a smart waitlist management system'
    },
    {
      id: 'kds',
      icon: <MonitorPlay size={20} />,
      title: isRtl ? 'شاشة مطبخ رقمية (KDS)' : 'Kitchen Display System (KDS)',
      desc: isRtl ? 'الطلبات تظهر رقمياً بالمطبخ بدل الورق لحظة دفعها' : 'Orders appear digitally in the kitchen the moment they are paid, replacing paper tickets'
    },
    {
      id: 'delivery',
      icon: <Truck size={20} />,
      title: isRtl ? 'إدارة طلبات التوصيل' : 'Delivery Orders Management',
      desc: isRtl ? 'استقبال وتتبع طلبات التوصيل الخاصة بالمطعم من شاشة واحدة' : 'Receive and track your restaurant delivery orders from a single unified screen'
    },
    {
      id: 'sentiment',
      icon: <MessageSquareHeart size={20} />,
      title: isRtl ? 'جمع التقييمات وتحليل المشاعر بالذكاء الاصطناعي' : 'AI Reviews & Sentiment Analysis',
      desc: isRtl ? 'قراءة آراء الزبائن تلقائياً لتحسين جودة الخدمة بشكل مستمر' : 'Automatically read and analyze customer feedback to continuously improve service quality'
    },
    {
      id: 'staff-qr',
      icon: <Users size={20} />,
      title: isRtl ? 'جدولة وحضور الموظفين بالباركود' : 'QR Staff Scheduling & Attendance',
      desc: isRtl ? 'تسجيل الدخول والانصراف وإدارة الورديات بمسحة باركود' : 'Manage shifts and log clock-ins/outs with a simple QR code scan'
    },
    {
      id: 'wa-marketing',
      icon: <MessageCircle size={20} />,
      title: isRtl ? 'حملات تسويقية عبر واتساب' : 'WhatsApp Marketing Campaigns',
      desc: isRtl ? '(عروض، تذكيرات) — بموافقة صريحة من الزبون' : '(Offers, reminders) — strictly with explicit customer opt-in'
    },
    {
      id: 'invoice-reader',
      icon: <FileText size={20} />,
      title: isRtl ? 'قارئ فواتير الموردين بالذكاء الاصطناعي' : 'AI Supplier Invoice Reader',
      desc: isRtl ? 'تصوير فاتورة ورقية وتعبئة بيانات المخزون تلقائياً' : 'Snap a photo of a paper invoice to automatically populate your inventory data'
    },
    {
      id: 'sheets',
      icon: <Database size={20} />,
      title: isRtl ? 'تكامل Google Sheets' : 'Google Sheets Integration',
      desc: isRtl ? 'نسخة تلقائية من كل طلب/حجز بجدول بيانات للرجوع إليها' : 'An automatic copy of every order or reservation saved directly to your spreadsheets'
    }
  ];

  return (
    <section className="py-24 bg-main relative overflow-hidden border-t border-border-custom/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10" dir={isRtl ? "rtl" : "ltr"}>
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-display font-bold text-text-primary mb-6">
            {isRtl ? 'نظام تشغيل متكامل لمطعمك' : 'Complete Operating System for Your Restaurant'}
          </h2>
          <p className="text-lg text-text-secondary leading-relaxed">
            {isRtl 
              ? 'صممنا VISIONO ليكون المنصة الوحيدة التي تحتاجها لإدارة كل تفاصيل المطعم، من قائمة الطعام إلى المطبخ والمحاسبة.'
              : 'VISIONO is designed to be the only platform you need to manage everything from the menu to the kitchen and accounting.'}
          </p>
        </div>

        {/* Custom Tabs Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-surface-2 p-1.5 rounded-2xl inline-flex border border-border-custom">
            <button
              onClick={() => setActiveTab('live')}
              className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all ${
                activeTab === 'live' 
                  ? 'bg-indigo-500 text-white shadow-lg' 
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <CheckCircle2 size={18} />
              {isRtl ? 'متاح الآن' : 'Live Features'}
            </button>
            <button
              onClick={() => setActiveTab('roadmap')}
              className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all ${
                activeTab === 'roadmap' 
                  ? 'bg-surface border border-border-custom text-white shadow-lg' 
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Clock size={18} />
              {isRtl ? 'قريباً (Roadmap)' : 'Coming Soon'}
            </button>
          </div>
        </div>

        <div className="min-h-[500px]">
          <AnimatePresence mode="wait">
            
            {activeTab === 'live' && (
              <motion.div
                key="live"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {liveFeatures.map((feature, idx) => (
                  <div key={idx} className="bg-gradient-to-br from-surface-2 to-surface border border-indigo-500/20 hover:border-indigo-500/50 transition-colors p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors" />
                    
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-6 relative z-10">
                      {feature.icon}
                    </div>
                    
                    <h3 className="text-lg font-bold text-text-primary mb-3 relative z-10">
                      {feature.title}
                    </h3>
                    
                    <p className="text-sm text-text-secondary leading-relaxed relative z-10">
                      {feature.desc}
                    </p>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === 'roadmap' && (
              <motion.div
                key="roadmap"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {roadmapFeatures.map((feature, idx) => (
                  <div key={idx} className="bg-surface-2/50 border border-border-custom p-6 rounded-2xl relative opacity-80 hover:opacity-100 transition-opacity">
                    <div className="w-12 h-12 rounded-xl bg-surface text-text-muted border border-border-custom flex items-center justify-center mb-6">
                      {feature.icon}
                    </div>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="text-lg font-bold text-text-primary">
                        {feature.title}
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-border-custom text-text-muted uppercase tracking-widest">
                        {isRtl ? 'قريباً' : 'SOON'}
                      </span>
                    </div>
                    
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {feature.desc}
                    </p>
                  </div>
                ))}
              </motion.div>
            )}
            
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
};
