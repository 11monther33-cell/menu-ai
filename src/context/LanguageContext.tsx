import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'ar' | 'en';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => any;
  isRtl: boolean;
}

const translations = {
  ar: {
    nav: {
      features: 'الميزات',
      benefits: 'المزايا',
      pricing: 'الأسعار',
      demo: 'Demo',
      cta: 'تسجيل مطعمك — مجانا 3 أيام',
    },
    hero: {
      badge: '🚀 منصة المطاعم الذكية #1 في المنطقة العربية',
      h1: 'اجعل زبائنك يرون طعامك قبل أن يطلبوه',
      h2: 'أول منصة في العالم العربي تجمع منيو رقمي ثلاثي الأبعاد، ذكاء اصطناعي يفهم ذوق كل زبون، ومشاركة فيروسية على سناب شات وإنستغرام — بدون تطبيق، فقط باركود.',
      ctaPrimary: '🚀 اختر باقتك — 3 أيام تجربة مجانية',
      ctaSecondary: '▶ شوف كيف يشتغل',
      trust: ['ربط آمن للبطاقة', 'إلغاء في أي وقت', 'يعمل خلال 10 دقائق', 'عربي وإنجليزي', 'بدون تطبيق للزبون'],
      stats: [
        { label: 'مطعم وكوفيه', value: '500+' },
        { label: 'مسح شهري', value: '2M+' },
        { label: 'زيادة في الطلبات', value: '+28%' },
        { label: 'تطبيق مطلوب', value: '0' },
      ]
    },
    howItWorks: {
      title: 'كيف يعمل VISIONO؟',
      subtitle: 'ثلاث خطوات وطعامك يتحدث عن نفسه',
      steps: [
        {
          title: '🖨️ اطبع الباركود',
          desc: 'أنشئ منيوك واطبع باركود الطاولة بنفسك. ضعه على كل طاولة — بدون أجهزة إضافية'
        },
        {
          title: '📱 الزبون يمسح ويشوف',
          desc: 'يفتح الزبون المنيو فوراً بدون تطبيق. يشوف الطبق ثلاثي الأبعاد ويدوره بأصابعه'
        },
        {
          title: '🎯 يطلب ويشارك',
          desc: 'يضغط "اطلب الآن" أو يصور الطبق ويشاركه على سناب شات كبطاقة احترافية جاهزة'
        }
      ]
    },
    marketingFeatures: {
      title: 'أكثر من مجرد قائمة، إنها تجربة تسويقية تبيع لك',
      subtitle: 'ارتقِ بتجربة مطعمك إلى مستوى المطاعم العالمية، ودع طعامك يتحدث عن نفسه بتجربة ثلاثية الأبعاد لا تُنسى.',
      items: [
        {
          title: 'زيادة المبيعات بنسبة تصل لـ 30%',
          desc: 'الرؤية الواقعية للأطباق في صور ومجسمات ثلاثية الأبعاد تثير الشهية وتجعل الزبائن يطلبون أكثر بكل ثقة.',
          icon: 'TrendingUp'
        },
        {
          title: 'لا تطبيقات، لا تعقيد',
          desc: 'تجربة سلسة وفورية. العميل يمسح الكود (QR) وتفتح المنيو بجميع تقنيات الـ AR والـ 3D مباشرة من متصفح جهازه.',
          icon: 'Smartphone'
        },
        {
          title: 'تقليل إرجاع الأطباق للطهاة',
          desc: '"ما توقعته كذا!" - انساها. الزبون سيرى الطبق، حجمه، ومكوناته قبل طلبه، مما يقلل الشكاوى وهدر الطعام.',
          icon: 'ShieldCheck'
        },
        {
          title: 'تجربة حصرية لا تُنسى (WOW Factor)',
          desc: 'اصنع انطباعاً أولاً مبهراً. رؤية الطبق على الطاولة بالواقع المعزز (AR) سيجعل عملائك يصورون التجربة ويشاركونها فوراً.',
          icon: 'Sparkles'
        }
      ]
    },
    pricing: {
      title: 'الأسعار',
      subtitle: 'جرّب 3 أيام مجاناً — ربط آمن للبطاقة. ألغِ في أي وقت',
      monthly: 'شهري',
      annual: 'سنوي — وفّر 20%',
      cta: 'ابدأ مجاناً 3 أيام',
      plans: [
        {
          id: 'basic',
          name: 'Starter — البداية',
          price: '29',
          currency: '$',
          features: [
            'منيو رقمي تفاعلي',
            'مسح باركود (QR) غير محدود',
            'استقبال الطلبات والدفع (Apple Pay)',
            'نظام محاسبة أساسي (POS)',
            'استضافة سحابية 24/7',
            'فرع واحد',
            'دعم فني أوقات العمل'
          ]
        },
        {
          id: 'pro',
          name: 'Pro — الاحترافي',
          price: '79',
          currency: '$',
          popular: true,
          features: [
            'كل شيء في البداية، بالإضافة لـ:',
            'قوائم ثلاثية الأبعاد (AR/3D)',
            'الرد الآلي بالواتساب (حجوزات واستفسارات)',
            'شاشة المطبخ الرقمية (KDS)',
            'نظام التقييمات الذكية',
            'توصيات الذكاء الاصطناعي',
            'تتبع أداء الموظفين',
            'حتى 3 فروع',
            'دعم فني أولوية'
          ]
        },
        {
          id: 'enterprise',
          name: 'Enterprise — المؤسسي',
          price: '199',
          currency: '$',
          features: [
            'كل شيء في الاحترافي، وأيضاً:',
            'نظام نقاط الولاء والتسويق الآلي',
            'تكامل مع تطبيقات التوصيل',
            'فروع متعددة غير محدودة',
            'API Access للربط المخصص',
            'تحليلات بيانات وتقارير متقدمة',
            'مدير حساب مخصص',
            'خدمة تصميم الموديلات 3D',
            'دعم فني خاص 24/7'
          ]
        }
      ]
    },
    footer: {
      tagline: 'اجعل طعامك يتكلم',
      rights: 'جميع الحقوق محفوظة © 2025 VISIONO'
    },
    admin: {
      dashboard: 'لوحة التحكم',
      restaurants: 'المطاعم',
      users: 'المستخدمين',
      revenue: 'الأرباح',
      logout: 'تسجيل الخروج',
      welcome: 'مرحباً بك،',
      search: 'بحث...',
      totalRestaurants: 'إجمالي المطاعم',
      pendingApprovals: 'طلبات بانتظار الموافقة',
      monthlyRevenue: 'الأرباح الشهرية',
      activeUsers: 'المستخدمين النشطين',
      revenueGrowth: 'نمو الأرباح',
      registrationsByCity: 'التسجيل حسب المدينة',
      restaurant: 'المطعم',
      owner: 'المالك',
      city: 'المدينة',
      status: 'الحالة',
      plan: 'الباقة',
      actions: 'الإجراءات',
      viewAll: 'عرض الكل',
      approve: 'موافقة',
      reject: 'رفض',
      noPending: 'لا توجد طلبات بانتظار الموافقة.',
      priority: 'أولوية',
      instructionsTitle: 'تعليمات لوحة التحكم',
      instructions: [
        'مراجعة طلبات المطاعم الجديدة والموافقة عليها أو رفضها.',
        'متابعة نمو الأرباح وعدد التسجيلات في المدن المختلفة.',
        'إدارة حسابات المستخدمين وصلاحياتهم.',
        'تأكد من مراجعة هوية المطعم قبل الموافقة النهائية.'
      ],
      nav: {
        core: 'الرئيسية',
        restaurants: 'إدارة المطاعم',
        pricing: 'الأسعار والباقات',
        features: 'المزايا والمنصة',
        revenue: 'الإيرادات',
        users: 'المستخدمين',
        analytics: 'التحليلات',
        content: 'المحتوى و 3D',
        communication: 'التواصل',
        security: 'الأمان والسجلات',
        items: {
          coupons: 'الكوبونات',
          settings: 'الإعدادات العامة',
          subscriptions: 'الاشتراكات',
          roles: 'الأدوار والصلاحيات',
          requests3d: 'طلبات 3D',
          emails: 'قوالب الإيميل',
          notifications: 'التنبيهات',
          announcements: 'الإعلانات',
          logs: 'سجل العمليات',
          security: 'الأمان'
        }
      },
      pages: {
        dashboard: {
          title: 'نظرة عامة',
          desc: 'إحصائيات المنصة الشاملة'
        },
        restaurants: {
          title: 'قائمة المطاعم',
          desc: 'إدارة جميع المطاعم المسجلة'
        },
        approvals: {
          title: 'طابور الموافقات',
          desc: 'مراجعة طلبات الانضمام الجديدة'
        },
        pricing: {
          title: 'مدير الأسعار',
          desc: 'التحكم في الباقات والأسعار',
          addPlan: 'إضافة باقة جديدة',
          mostPopular: 'الأكثر شيوعاً',
          activeSubs: 'الاشتراكات النشطة',
          editPlan: 'تعديل تفاصيل الباقة',
          couponsTitle: 'إدارة الكوبونات',
          createCoupon: 'إنشاء كوبون',
          discount: 'الخصم',
          status: {
            active: 'نشط',
            expired: 'منتهي'
          }
        },
        features: {
          title: 'تحكم المزايا',
          desc: 'تشغيل وإيقاف ميزات المنصة',
          items: {
            snap: { name: '3D Snap والمشاركة', desc: 'السماح للمستخدمين بمشاركة نماذج 3D على سناب شات' },
            dna: { name: 'Taste DNA AI', desc: 'توصيات شخصية بناءً على تاريخ المستخدم' },
            mood: { name: 'AI Mood Menu', desc: 'اقتراحات منيو ديناميكية بناءً على مزاج المستخدم' },
            voice: { name: 'الطلب الصوتي', desc: 'تعرف صوتي مدعوم بالذكاء الاصطناعي للطلبات' },
            social: { name: 'Table Social', desc: 'طلب تعاوني للمجموعات' },
            ar: { name: 'AR View', desc: 'تصور الأطباق بالواقع المعزز' }
          }
        },
        revenue: {
          title: 'تقارير الإيرادات',
          desc: 'تحليل الأرباح والاشتراكات',
          stats: {
            net: 'صافي الإيرادات',
            active: 'الاشتراكات النشطة',
            aov: 'متوسط قيمة الطلب'
          }
        }
      },
      stats: {
        mrr: 'الإيراد الشهري المتكرر',
        arr: 'الإيراد السنوي المتكرر',
        churn: 'معدل الإلغاء',
        scans: 'إجمالي المسح',
        growth: 'النمو الشهري'
      },
      system: {
        healthy: 'النظام يعمل بكفاءة',
        underDevelopment: 'الوحدة قيد التطوير',
        underDevelopmentDesc: 'نحن نعمل على بناء وحدة {tab} لتتناسب مع خريطة المنصة.',
        addManual: 'إضافة مطعم يدوياً',
        viewAllActivity: 'عرض كل النشاطات',
        proPlan: 'باقة برو',
        loading: 'جاري التحميل...',
        noRestaurants: 'لم يتم العثور على مطاعم.',
        tooltips: {
          view: 'عرض التفاصيل',
          edit: 'تعديل',
          delete: 'حذف',
          approve: 'موافقة',
          reject: 'رفض'
        }
      }
    },
    restaurant: {
      nav: {
        dashboard: 'لوحة التحكم',
        menuBuilder: 'بناء المنيو',
        categories: 'التصنيفات',
        orders: 'إدارة الطلبات',
        liveOrders: 'طلبات مباشرة',
        qrCodes: 'رموز QR',
        kitchenPulse: 'Kitchen Pulse',
        chefNotes: 'ملاحظات الشيف',
        ugcReview: 'صور الزبائن',
        analytics: 'التحليلات',
        branding: 'الهوية البصرية',
        branches: 'الفروع',
        settings: 'الإعدادات',
        subscription: 'الاشتراك',
        logout: 'تسجيل الخروج'
      },
      dashboard: {
        welcome: {
          morning: 'صباح الخير، {name} ☕',
          afternoon: 'مرحباً، {name} 🍽️',
          evening: 'مساء الخير، {name} 🌙',
          night: 'ليلة طيبة، {name} 🌟',
          lastLogin: 'آخر تسجيل دخول: منذ {time} من {device}',
          plan: 'باقة {plan}'
        },
        quickActions: {
          addDish: 'إضافة طبق جديد',
          printQr: 'طباعة QR',
          liveOrders: 'الطلبات المباشرة',
          previewMenu: 'معاينة المنيو'
        },
        stats: {
          views: 'مشاهدات اليوم',
          orders: 'طلبات اليوم',
          activeDishes: 'أطباق نشطة',
          snapShares: 'مشاركات Snap',
          pending: '{count} معلق',
          outOfStock: '{count} نفد مخزونها',
          trend: '{value} عن أمس'
        },
        liveOrders: {
          title: 'الطلبات المباشرة',
          connected: 'متصل',
          disconnected: 'غير متصل — إعادة الاتصال...',
          empty: 'لا توجد طلبات حالياً',
          emptySub: 'ستظهر الطلبات هنا فور وصولها',
          viewAll: 'عرض كل الطلبات ←'
        },
        topDishes: {
          title: 'أشهر الأطباق اليوم',
          dish: 'الطبق',
          views: 'المشاهدات',
          orders: 'الطلبات',
          snap: 'Snap',
          conversion: 'معدل التحويل'
        },
        activity: {
          title: 'النشاط الأخير',
          viewAll: 'عرض كل النشاطات'
        },
        dishes: {
          add: 'إضافة طبق جديد',
          edit: 'تعديل طبق',
          nameAr: 'الاسم (بالعربية)',
          nameEn: 'الاسم (بالإنجليزية)',
          descAr: 'الوصف (بالعربية)',
          descEn: 'الوصف (بالإنجليزية)',
          price: 'السعر',
          prepTime: 'وقت التحضير',
          image: 'صورة الطبق',
          model3d: 'مجسم ثلاثي الأبعاد (GLB)',
          uploadPhoto: 'رفع صورة',
          uploadGlb: 'رفع مجسم',
          scanAr: 'تصوير بـ AR',
          nutrition: 'القيم الغذائية والحساسية',
          chefSpecial: 'توصية الشيف الخاصة',
          save: 'حفظ التغييرات',
          cancel: 'إلغاء',
          success: 'تم الحفظ بنجاح',
          uploadSuccess: 'تم الرفع بنجاح'
        },
        arScanner: {
          title: 'ماسح AR ثلاثي الأبعاد',
          subtitle: 'إعادة بناء مدعومة بالذكاء الاصطناعي',
          centerDish: 'ضع الطبق في المنتصف',
          moveSlowly: 'تحرك ببطء حول الطعام لالتقاط جميع الزوايا للحصول على أفضل نتيجة.',
          scanning: 'جاري المسح...',
          generating: 'جاري إنشاء المجسم',
          processing: 'الذكاء الاصطناعي يعيد بناء هندسة الطعام...',
          complete: 'اكتمل المسح!',
          ready: 'المجسم ثلاثي الأبعاد جاهز للإضافة للمنيو.',
          apply: 'تطبيق المجسم'
        }
      }
    }
  },
  en: {
    nav: {
      features: 'Features',
      benefits: 'Benefits',
      pricing: 'Pricing',
      demo: 'Demo',
      cta: 'Start Free Trial — 3 Days Free',
    },
    hero: {
      badge: '🚀 The #1 Smart Restaurant Platform in the Arab World',
      h1: 'Let Your Guests See It Before They Order It',
      h2: 'The first platform in the Arab world combining immersive 3D menus, AI that understands every guest\'s taste, and viral Snapchat sharing — no app needed, just a QR code.',
      ctaPrimary: '🚀 Choose Plan — 3 Days Free Trial',
      ctaSecondary: '▶ See How It Works',
      trust: ['Secure card linking', 'Cancel anytime', 'Live in 10 minutes', 'Arabic & English', 'No app for guests'],
      stats: [
        { label: 'Restaurants & Cafés', value: '500+' },
        { label: 'Monthly scans', value: '2M+' },
        { label: 'Order increase', value: '+28%' },
        { label: 'Apps required', value: '0' },
      ]
    },
    howItWorks: {
      title: 'How Does VISIONO Work?',
      subtitle: 'Three steps and your food speaks for itself',
      steps: [
        {
          title: '🖨️ Print Your QR Code',
          desc: 'Build your menu and print QR codes yourself. Place on every table — no extra hardware needed'
        },
        {
          title: '📱 Guest Scans & Sees',
          desc: 'Guest opens the menu instantly, no app required. Views dishes in 3D — rotates them with fingers'
        },
        {
          title: '🎯 Orders & Shares',
          desc: 'Taps "Order Now" or captures the 3D dish. Shares to Snapchat as a ready-made professional card'
        }
      ]
    },
    marketingFeatures: {
      title: 'More Than A Menu, A Selling Experience',
      subtitle: 'Elevate your restaurant to world-class standards. Let your food speak for itself with an unforgettable 3D experience.',
      items: [
        {
          title: 'Increase Sales by Up to 30%',
          desc: 'Realistic 3D models and high-quality imagery trigger appetite, making guests confidently order more.',
          icon: 'TrendingUp'
        },
        {
          title: 'Zero App Downloads',
          desc: 'Frictionless experience. Guests scan out the QR and the full AR/3D menu opens right in their browser.',
          icon: 'Smartphone'
        },
        {
          title: 'Reduce Food Waste & Complaints',
          desc: '"This isn\'t what I expected!" is history. Guests see the realistic size and ingredients before they order.',
          icon: 'ShieldCheck'
        },
        {
          title: 'The Ultimate WOW Factor',
          desc: 'Make a stunning first impression. Viewing dishes directly on their table via AR encourages instant sharing.',
          icon: 'Sparkles'
        }
      ]
    },
    pricing: {
      title: 'Pricing',
      subtitle: 'Try free for 3 days — secure card linking. Cancel anytime.',
      monthly: 'Monthly',
      annual: 'Annual — Save 20%',
      cta: 'Start 3-Day Free Trial',
      plans: [
        {
          id: 'basic',
          name: 'Starter',
          price: '29',
          currency: '$',
          features: [
            'Interactive Digital Menu',
            'Unlimited QR scans',
            'Order receiving & payments (Apple Pay)',
            'Basic Point of Sale (POS)',
            '24/7 Cloud hosting',
            '1 branch',
            'Standard business hours support'
          ]
        },
        {
          id: 'pro',
          name: 'Pro',
          price: '79',
          currency: '$',
          popular: true,
          features: [
            'Everything in Starter, plus:',
            'Interactive 3D / AR menus',
            'WhatsApp AI (Automated reservations & support)',
            'Kitchen Display System (KDS)',
            'Smart reviews management',
            'AI-powered dish recommendations',
            'Staff performance tracking',
            'Up to 3 branches',
            'Priority support'
          ]
        },
        {
          id: 'enterprise',
          name: 'Enterprise',
          price: '199',
          currency: '$',
          features: [
            'Everything in Pro, plus:',
            'Automated loyalty & marketing system',
            'Integration with food delivery apps',
            'Unlimited branches',
            'Full API access for custom integrations',
            'Advanced data analytics & reports',
            'Dedicated account manager',
            '3D modeling service by our team',
            '24/7 VIP support'
          ]
        }
      ]
    },
    footer: {
      tagline: 'Let Your Food Speak',
      rights: '© 2025 VISIONO. All rights reserved.'
    },
    admin: {
      dashboard: 'Dashboard',
      restaurants: 'Restaurants',
      users: 'Users',
      revenue: 'Revenue',
      logout: 'Logout',
      welcome: 'Welcome back,',
      search: 'Search...',
      totalRestaurants: 'Total Restaurants',
      pendingApprovals: 'Pending Approvals',
      monthlyRevenue: 'Monthly Revenue',
      activeUsers: 'Active Users',
      revenueGrowth: 'Revenue Growth',
      registrationsByCity: 'Registrations by City',
      restaurant: 'Restaurant',
      owner: 'Owner',
      city: 'City',
      status: 'Status',
      plan: 'Plan',
      actions: 'Actions',
      viewAll: 'View All',
      approve: 'Approve',
      reject: 'Reject',
      noPending: 'No pending approvals found.',
      priority: 'Priority',
      instructionsTitle: 'Dashboard Instructions',
      instructions: [
        'Review and approve or reject new restaurant applications.',
        'Monitor revenue growth and registration trends across cities.',
        'Manage user accounts and their permissions.',
        'Verify restaurant identity before final approval.'
      ],
      nav: {
        core: 'Core',
        restaurants: 'Restaurants',
        pricing: 'Pricing & Plans',
        features: 'Features & Platform',
        revenue: 'Revenue & Subs',
        users: 'Users & Access',
        analytics: 'Analytics',
        content: 'Content & 3D',
        communication: 'Communication',
        security: 'Security & Logs',
        items: {
          coupons: 'Coupons',
          settings: 'General Settings',
          subscriptions: 'Subscriptions',
          roles: 'Roles & Permissions',
          requests3d: '3D Requests',
          emails: 'Email Templates',
          notifications: 'Notifications',
          announcements: 'Announcements',
          logs: 'Activity Logs',
          security: 'Security'
        }
      },
      pages: {
        dashboard: {
          title: 'Overview',
          desc: 'Comprehensive platform statistics'
        },
        restaurants: {
          title: 'All Restaurants',
          desc: 'Manage all registered restaurants'
        },
        approvals: {
          title: 'Approval Queue',
          desc: 'Review new registration requests'
        },
        pricing: {
          title: 'Pricing Manager',
          desc: 'Control plans and pricing',
          addPlan: 'Add New Plan',
          mostPopular: 'Most Popular',
          activeSubs: 'Active Subscriptions',
          editPlan: 'Edit Plan Details',
          couponsTitle: 'Coupons Management',
          createCoupon: 'Create Coupon',
          discount: 'Discount',
          status: {
            active: 'Active',
            expired: 'Expired'
          }
        },
        features: {
          title: 'Feature Control',
          desc: 'Toggle platform features',
          items: {
            snap: { name: '3D Snap & Sharing', desc: 'Allow users to share 3D models to Snapchat' },
            dna: { name: 'Taste DNA AI', desc: 'Personalized recommendations based on user history' },
            mood: { name: 'AI Mood Menu', desc: 'Dynamic menu suggestions based on user mood' },
            voice: { name: 'Voice Ordering', desc: 'AI-powered voice recognition for orders' },
            social: { name: 'Table Social', desc: 'Collaborative ordering for groups' },
            ar: { name: 'AR View', desc: 'Augmented Reality dish visualization' }
          }
        },
        revenue: {
          title: 'Revenue Reports',
          desc: 'Analyze profits and subscriptions',
          stats: {
            net: 'Net Revenue',
            active: 'Active Subs',
            aov: 'Avg. Order Value'
          }
        }
      },
      stats: {
        mrr: 'MRR',
        arr: 'ARR',
        churn: 'Churn Rate',
        scans: 'Total Scans',
        growth: 'Monthly Growth'
      },
      system: {
        healthy: 'System Healthy',
        underDevelopment: 'Module Under Development',
        underDevelopmentDesc: 'We are building the {tab} module to match the platform map.',
        addManual: 'Add Restaurant Manually',
        viewAllActivity: 'View All Activity',
        proPlan: 'Pro Plan',
        loading: 'Loading...',
        noRestaurants: 'No restaurants found.',
        tooltips: {
          view: 'View Details',
          edit: 'Edit',
          delete: 'Delete',
          approve: 'Approve',
          reject: 'Reject'
        }
      }
    },
    restaurant: {
      nav: {
        dashboard: 'Dashboard',
        menuBuilder: 'Menu Builder',
        categories: 'Categories',
        orders: 'Orders',
        liveOrders: 'Live Orders',
        qrCodes: 'QR Codes',
        kitchenPulse: 'Kitchen Pulse',
        chefNotes: 'Chef Notes',
        ugcReview: 'UGC Review',
        analytics: 'Analytics',
        branding: 'Branding',
        branches: 'Branches',
        settings: 'Settings',
        subscription: 'Subscription',
        logout: 'Logout'
      },
      dashboard: {
        welcome: {
          morning: 'Good Morning, {name} ☕',
          afternoon: 'Hello, {name} 🍽️',
          evening: 'Good Evening, {name} 🌙',
          night: 'Good Night, {name} 🌟',
          lastLogin: 'Last login: {time} ago from {device}',
          plan: '{plan} Plan'
        },
        quickActions: {
          addDish: 'Add New Dish',
          printQr: 'Print QR',
          liveOrders: 'Live Orders',
          previewMenu: 'Preview Menu'
        },
        stats: {
          views: 'Today\'s Views',
          orders: 'Today\'s Orders',
          activeDishes: 'Active Dishes',
          snapShares: 'Snap Shares',
          pending: '{count} pending',
          outOfStock: '{count} out of stock',
          trend: '{value} vs yesterday'
        },
        liveOrders: {
          title: 'Live Orders',
          connected: 'Connected',
          disconnected: 'Disconnected — Reconnecting...',
          empty: 'No live orders at the moment',
          emptySub: 'Orders will appear here as they arrive',
          viewAll: 'View all orders ←'
        },
        topDishes: {
          title: 'Top Dishes Today',
          dish: 'Dish',
          views: 'Views',
          orders: 'Orders',
          snap: 'Snap',
          conversion: 'Conversion'
        },
        activity: {
          title: 'Recent Activity',
          viewAll: 'View all activity'
        },
        dishes: {
          add: 'Add New Dish',
          edit: 'Edit Dish',
          nameAr: 'Name (Arabic)',
          nameEn: 'Name (English)',
          descAr: 'Description (Arabic)',
          descEn: 'Description (English)',
          price: 'Price',
          prepTime: 'Prep Time',
          image: 'Dish Image',
          model3d: '3D Model (GLB)',
          uploadPhoto: 'UPLOAD PHOTO',
          uploadGlb: 'UPLOAD GLB',
          scanAr: 'Scan with AR',
          nutrition: 'Nutrition & Allergens',
          chefSpecial: 'Chef\'s Special Recommendation',
          save: 'Save Changes',
          cancel: 'Cancel',
          success: 'Saved successfully',
          uploadSuccess: 'Uploaded successfully'
        },
        arScanner: {
          title: 'AR 3D Scanner',
          subtitle: 'AI-Powered Reconstruction',
          centerDish: 'Center the dish',
          moveSlowly: 'Move slowly around the food to capture all angles for the best 3D result.',
          scanning: 'Scanning...',
          generating: 'Generating 3D Mesh',
          processing: 'AI is reconstructing the food geometry...',
          complete: 'Scan Complete!',
          ready: 'Your 3D model is ready to be added to the menu.',
          apply: 'Apply 3D Model'
        }
      }
    }
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Language>('ar');

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  const t = (path: string) => {
    const keys = path.split('.');
    let result: any = translations[lang];
    for (const key of keys) {
      if (result[key] === undefined) return path;
      result = result[key];
    }
    return result;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, isRtl: lang === 'ar' }}>
      <div className={lang === 'ar' ? 'rtl' : 'ltr'}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
