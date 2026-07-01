import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { motion, AnimatePresence } from 'motion/react';
import { User, Store, MapPin, Palette, CheckCircle2, ArrowRight, ArrowLeft, Mail, Lock, Phone, Star, CreditCard, ShieldCheck } from 'lucide-react';
import { PaddlePayment } from '../../components/PaddlePayment';
import { useSystemSettings } from '../../hooks/useSystemSettings';

export const Register = () => {
  const { t, isRtl } = useLanguage();
  const { getSetting } = useSystemSettings();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [paypalDetails, setPaypalDetails] = useState<any>(null);
  const [isAnnual, setIsAnnual] = useState(searchParams.get('billing') === 'annual');

  // 🔒 SECURITY: Plan IDs come from environment variables or system settings — NEVER hardcode
  const plans = [
    {
      id: 'basic',
      name: isRtl ? 'الباقة الأساسية' : 'Basic Plan',
      price: '29',
      paddlePriceIdMonthly: getSetting('paddle_price_basic_monthly', import.meta.env.VITE_PADDLE_PRICE_BASIC_MONTHLY || ''),
      paddlePriceIdAnnual: getSetting('paddle_price_basic_annual', import.meta.env.VITE_PADDLE_PRICE_BASIC_ANNUAL || ''),
    },
    {
      id: 'pro',
      name: isRtl ? 'الباقة المحترفة' : 'Pro Plan',
      price: '79',
      paddlePriceIdMonthly: getSetting('paddle_price_pro_monthly', import.meta.env.VITE_PADDLE_PRICE_PRO_MONTHLY || ''),
      paddlePriceIdAnnual: getSetting('paddle_price_pro_annual', import.meta.env.VITE_PADDLE_PRICE_PRO_ANNUAL || ''),
    },
    {
      id: 'enterprise',
      name: isRtl ? 'باقة المؤسسات' : 'Enterprise Plan',
      price: '199',
      paddlePriceIdMonthly: getSetting('paddle_price_ent_monthly', import.meta.env.VITE_PADDLE_PRICE_ENT_MONTHLY || ''),
      paddlePriceIdAnnual: getSetting('paddle_price_ent_annual', import.meta.env.VITE_PADDLE_PRICE_ENT_ANNUAL || ''),
    }
  ];

  const planIdFromUrl = searchParams.get('plan');
  const selectedPlan = plans.find(p => p.id === planIdFromUrl) || plans[1]; // Default to Pro

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    restaurantNameAr: '',
    restaurantNameEn: '',
    slug: '',
    city: '',
    category: '',
    primaryColor: '#C9A84C',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'restaurantNameEn') {
      // Better slug generation: remove special chars, replace spaces with hyphens
      const generatedSlug = value
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // remove non-word chars
        .replace(/[\s_-]+/g, '-') // replace spaces/underscores with single hyphen
        .replace(/^-+|-+$/g, ''); // trim hyphens from ends
      setFormData(prev => ({ ...prev, slug: generatedSlug }));
    }
  };

  const handleRegister = async (details?: any) => {
    setLoading(true);
    setError('');
    try {
      const trimmedEmail = formData.email.trim().toLowerCase();
      const trimmedPassword = formData.password.trim();

      // 1. Create Auth User
      let uid: string | undefined;
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: trimmedPassword,
      });

      if (signUpError) {
        if (signUpError.message.includes('User already registered')) {
          // Smart Recovery: Try to sign in to see if they have a profile
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: trimmedEmail,
            password: trimmedPassword,
          });

          if (signInError) {
            // Password might be different or other error
            throw new Error(isRtl 
              ? 'هذا البريد مسجل مسبقاً بكلمة مرور مختلفة. يرجى تسجيل الدخول أو استخدام بريد آخر.' 
              : 'This email is already registered with a different password. Please login or use another email.');
          }

          uid = signInData.user?.id;

          // Check if profile exists
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', uid)
            .single();

          if (existingProfile) {
            throw new Error(isRtl 
              ? 'لديك حساب مفعل بالفعل. يرجى تسجيل الدخول مباشرة.' 
              : 'You already have an active account. Please login directly.');
          }
          // If no profile, we continue to step 2 using this uid
        } else {
          throw signUpError;
        }
      } else {
        uid = authData.user?.id;
      }

      if (!uid) throw new Error('Failed to identify user ID');

      // Calculate trial expiry (3 days)
      const trialExpiry = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

      // 2. Create Restaurant Doc
      // 🔒 SECURITY: Do NOT set status here — DB trigger forces 'PENDING' for non-admins
      // The restaurant will need admin approval before becoming active
      const { data: restData, error: restError } = await supabase
        .from('restaurants')
        .insert([
          {
            owner_id: uid,
            name_ar: formData.restaurantNameAr.substring(0, 100), // 🔒 Limit length
            name_en: formData.restaurantNameEn.substring(0, 100),
            slug: formData.slug.substring(0, 50),
            city: formData.city.substring(0, 50),
            category: formData.category,
            // status is NOT set here — DB trigger enforces 'PENDING'
            subscription_status: 'trial',
            subscription_plan: selectedPlan.id,
            subscription_expiry: trialExpiry,
            paypal_subscription_id: details?.subscriptionID || details?.id || null,
            branding: {
              primary_color: formData.primaryColor,
              secondary_color: '#0F0E0B',
              text_color: '#F5F0E8',
              bg_color: '#1A1917',
              font_family_ar: 'Cairo',
              font_family_en: 'Space Grotesk',
              logo_url: '',
              cover_url: '',
              welcome_message_ar: '',
              welcome_message_en: '',
              instagram: '',
              whatsapp: '',
              twitter: ''
            },
          }
        ])
        .select()
        .single();

      if (restError) {
        // Handle unique constraint error for slug
        if (restError.code === '23505' && restError.message.includes('slug')) {
          throw new Error(isRtl 
            ? 'عذراً، رابط المنيو هذا مستخدم بالفعل. يرجى تغيير اسم المطعم بالإنجليزية أو تعديل الرابط في الخطوة السابقة.' 
            : 'This Menu URL Slug is already taken. Please change the English restaurant name or modify the slug in the previous step.');
        }
        throw restError;
      }

      const restaurantId = restData.id;

      // 3. Create User Profile Doc
      // 🔒 SECURITY: Do NOT set role here — DB trigger forces 'RESTAURANT_OWNER'
      // Do NOT set is_active — defaults to true in DB
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: uid,
            email: formData.email.trim().toLowerCase(),
            name: formData.name.substring(0, 100), // 🔒 Limit length
            // role is NOT set here — DB trigger enforces 'RESTAURANT_OWNER'
            restaurant_id: restaurantId,
          }
        ]);

      if (profileError) throw profileError;

      setSuccess(true);
    } catch (err: any) {
      // 🔒 SECURITY: Don't expose raw error messages in production
      const safeMessage = err.message?.includes('duplicate') || err.message?.includes('unique')
        ? (isRtl ? 'هذا الرابط مستخدم بالفعل. جرب رابط آخر.' : 'This slug is already taken. Try a different one.')
        : err.message || (isRtl ? 'حدث خطأ غير متوقع' : 'An unexpected error occurred');
      setError(safeMessage);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-main flex items-center justify-center p-6 relative">
        <div className="site-noise"></div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-surface border border-white/5 p-12 rounded-2xl text-center shadow-2xl relative z-10"
        >
          <div className="w-20 h-20 bg-surface-2 rounded-full flex items-center justify-center mx-auto mb-8 text-gold border border-white/5">
            <CheckCircle2 size={32} strokeWidth={1.5} />
          </div>
          <h1 className="text-3xl font-display text-text mb-4 leading-tight tracking-tight">
            {isRtl ? 'تم إرسال طلبك بنجاح' : 'Application Submitted'}
          </h1>
          <p className="text-muted text-sm mb-10 leading-relaxed">
            {isRtl 
              ? 'سيقوم فريق VISIONO بمراجعة طلبك خلال 24 ساعة. ستصلك رسالة على بريدك عند الموافقة.' 
              : 'We\'ll review your application within 24 hours and notify you by email.'}
          </p>
          <button 
            onClick={() => navigate('/login')}
            className="w-full bg-gold hover:bg-gold-light text-main font-semibold py-3.5 rounded-lg transition-colors border border-transparent"
          >
            {isRtl ? 'العودة لتسجيل الدخول' : 'Back to Login'}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col lg:flex-row overflow-hidden">
      <div className="site-noise"></div>
      
      {/* Left Side: Product Info & Trust (Visible on Desktop) */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-dark-2 to-main p-16 flex-col justify-between border-r border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold/5 blur-[120px] rounded-full -mr-48 -mt-48"></div>
        
        <div className="relative z-10">
          <Link to="/" className="inline-block mb-12">
            <img src="/logo.png" alt="VISIONO" className="h-14 object-contain" />
          </Link>

          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 bg-gold/10 border border-gold/20 rounded-full text-gold text-[10px] font-bold uppercase tracking-wider"
            >
              <Star size={12} fill="currentColor" />
              {isRtl ? 'باقة مختارة بعناية' : 'Curated Premium Plan'}
            </motion.div>

            <h1 className="text-5xl font-display leading-[1.1] tracking-tight">
              {isRtl ? (
                <>ابدأ عصر <span className="text-gold">المنيو الذكي</span> في مطعمك اليوم.</>
              ) : (
                <>Start the <span className="text-gold">Smart Menu</span> era in your restaurant.</>
              )}
            </h1>

            <ul className="space-y-6 mt-12">
              {[
                { t: isRtl ? 'منيو QR تفاعلي ثنائي اللغة' : 'Interactive Bilingual QR Menu', d: isRtl ? 'تصميم عصري يتناسب مع هوية مطعمك.' : 'Modern design that matches your brand.' },
                { t: isRtl ? 'عرض أطباق ثلاثية الأبعاد (AR)' : '3D/AR Dish Visualization', d: isRtl ? 'أبهر زبائنك بتجربة الواقع المعزز.' : 'Wow customers with Augmented Reality.' },
                { t: isRtl ? 'نظام طلبات ذكي ومباشر' : 'Smart Live Order System', d: isRtl ? 'إدارة الطاولات والطلبات بذكاء.' : 'Manage tables and orders intelligently.' }
              ].map((item, i) => (
                <motion.li 
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 + 0.3 }}
                  className="flex gap-4"
                >
                  <div className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center shrink-0 mt-1">
                    <CheckCircle2 size={14} className="text-gold" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">{item.t}</h4>
                    <p className="text-muted text-sm leading-relaxed">{item.d}</p>
                  </div>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>

        <div className="relative z-10 mt-12 p-8 bg-white/[0.02] border border-white/5 rounded-[2rem] backdrop-blur-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-2 border border-white/10">
              <img src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop" alt="User" />
            </div>
            <div>
              <p className="font-bold">أحمد العتيبي</p>
              <p className="text-xs text-muted">صاحب مطعم "بركة"</p>
            </div>
          </div>
          <p className="text-text-secondary italic text-sm leading-relaxed">
            "{isRtl ? 'منذ استخدامنا لـ VISIONO، زادت مبيعاتنا بنسبة 25% بفضل الـ AR وسهولة الطلب. أفضل استثمار لمطعمنا.' : 'Since using VISIONO, our sales increased by 25% thanks to AR and order ease. Best investment for our restaurant.'}"
          </p>
        </div>
      </div>

      {/* Right Side: Checkout Form */}
      <div className="flex-1 overflow-y-auto custom-scrollbar relative">
        <div className="max-w-xl mx-auto w-full px-6 py-12 lg:py-24">
          
          <div className="lg:hidden mb-12 text-center">
            <img src="/logo.png" alt="VISIONO" className="h-14 object-contain mx-auto mb-4" />
            <h1 className="text-3xl font-display mb-2">{isRtl ? 'إتمام الطلب' : 'Checkout'}</h1>
            <p className="text-muted">{isRtl ? 'سجل بياناتك وفعل باقتك فوراً' : 'Sign up and activate your plan'}</p>
          </div>

          <div className="mb-12">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">{isRtl ? 'إنشاء الحساب' : 'Account Details'}</h2>
              <div className="text-[10px] uppercase font-bold text-muted tracking-widest bg-surface-2 px-3 py-1 rounded-full border border-white/5">
                {isRtl ? 'الخطوة' : 'STEP'} {step} {isRtl ? 'من' : 'OF'} 3
              </div>
            </div>

            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                   <div className="grid md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                       <label className="text-xs font-bold uppercase text-muted tracking-wider">{isRtl ? 'الاسم الكامل' : 'Full Name'}</label>
                       <input name="name" value={formData.name} onChange={handleChange} className="w-full bg-surface-2 border border-white/5 rounded-xl py-4 px-5 text-white outline-none focus:border-gold transition-colors" placeholder="John Doe" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-bold uppercase text-muted tracking-wider">{isRtl ? 'رقم الجوال' : 'Phone'}</label>
                       <input name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-surface-2 border border-white/5 rounded-xl py-4 px-5 text-white outline-none focus:border-gold transition-colors" placeholder="+966 50 000 0000" />
                    </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-muted tracking-wider">{isRtl ? 'البريد الإلكتروني' : 'Email Address'}</label>
                      <input name="email" type="email" value={formData.email} onChange={handleChange} className="w-full bg-surface-2 border border-white/5 rounded-xl py-4 px-5 text-white outline-none focus:border-gold transition-colors" placeholder="email@example.com" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-muted tracking-wider">{isRtl ? 'كلمة المرور' : 'Password'}</label>
                      <input name="password" type="password" value={formData.password} onChange={handleChange} className="w-full bg-surface-2 border border-white/5 rounded-xl py-4 px-5 text-white outline-none focus:border-gold transition-colors" placeholder="••••••••" />
                   </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                   <div className="grid md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                       <label className="text-xs font-bold uppercase text-muted tracking-wider">{isRtl ? 'اسم المطعم (AR)' : 'Restaurant (AR)'}</label>
                       <input name="restaurantNameAr" value={formData.restaurantNameAr} onChange={handleChange} className="w-full bg-surface-2 border border-white/5 rounded-xl py-4 px-5 text-white outline-none focus:border-gold transition-colors" placeholder="مطعم البركة" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-bold uppercase text-muted tracking-wider">{isRtl ? 'اسم المطعم (EN)' : 'Restaurant (EN)'}</label>
                       <input name="restaurantNameEn" value={formData.restaurantNameEn} onChange={handleChange} className="w-full bg-surface-2 border border-white/5 rounded-xl py-4 px-5 text-white outline-none focus:border-gold transition-colors" placeholder="Al Baraka Restaurant" />
                    </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-muted tracking-wider">{isRtl ? 'رابط المنيو (Slug)' : 'Menu URL Slug'}</label>
                      <div className="relative">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-muted text-sm opacity-50">VISIONO.com/</span>
                        <input name="slug" value={formData.slug} onChange={handleChange} className="w-full bg-surface-2 border border-white/5 rounded-xl py-4 pl-28 pr-5 text-white outline-none focus:border-gold transition-colors font-mono" />
                      </div>
                   </div>
                   <div className="grid md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-muted tracking-wider">{isRtl ? 'المدينة' : 'City'}</label>
                      <input name="city" value={formData.city} onChange={handleChange} className="w-full bg-surface-2 border border-white/5 rounded-xl py-4 px-5 text-white outline-none focus:border-gold transition-colors" placeholder="Riyadh" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-muted tracking-wider">{isRtl ? 'التصنيف' : 'Category'}</label>
                      <select name="category" value={formData.category} onChange={handleChange} className="w-full bg-surface-2 border border-white/5 rounded-xl py-4 px-5 text-white outline-none focus:border-gold transition-colors appearance-none">
                        <option value="">{isRtl ? 'اختر النوع' : 'Select Type'}</option>
                        <option value="restaurant">Restaurant</option>
                        <option value="cafe">Cafe</option>
                      </select>
                    </div>
                   </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                  <div className="bg-surface-2 border border-white/5 p-8 rounded-3xl">
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="font-bold text-lg text-white">{isRtl ? 'تفاصيل الطلب' : 'Order Summary'}</h4>
                      <div className="px-3 py-1 bg-gold/10 text-gold text-[10px] font-bold rounded-full">3 DAYS FREE</div>
                    </div>
                    
                    <div className="space-y-4 text-sm text-muted">
                      <div className="flex justify-between">
                        <span>{selectedPlan.name} ({isAnnual ? (isRtl ? 'سنوي' : 'Annual') : (isRtl ? 'شهري' : 'Monthly')})</span>
                        <span className="text-white">${selectedPlan.price}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{isRtl ? 'الفترة التجريبية' : 'Trial Discount'}</span>
                        <span className="text-green-500">-${selectedPlan.price}</span>
                      </div>
                      <div className="pt-4 border-t border-white/5 flex justify-between font-bold text-lg text-white">
                        <span>{isRtl ? 'المجموع اليوم' : 'Total Due Today'}</span>
                        <span className="text-gold">$0.00</span>
                      </div>
                    </div>
                  </div>

                  <PaddlePayment 
                    planName={selectedPlan.name}
                    planId={isAnnual ? selectedPlan.paddlePriceIdAnnual : selectedPlan.paddlePriceIdMonthly}
                    amount={isAnnual ? (parseInt(selectedPlan.price) * 10).toString() : selectedPlan.price}
                    onSuccess={(details) => handleRegister(details)}
                  />

                  <div className="flex items-center gap-4 p-5 bg-gold/5 border border-gold/20 rounded-2xl">
                    <ShieldCheck size={24} className="text-gold shrink-0" />
                    <p className="text-[10px] leading-relaxed text-muted">
                      {isRtl 
                        ? 'عملية الدفع مؤمنة ومشفرة. لن يتم خصم أي مبالغ من بطاقتك خلال أول 3 أيام، ويمكنك الإلغاء في أي لحظة.' 
                        : 'Securely encrypted payment. No charges during the first 3 days. Cancel anytime.'}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-xl flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                {error}
              </div>
            )}

            <div className="mt-12 flex gap-4">
              {step > 1 && (
                <button onClick={() => setStep(step - 1)} disabled={loading} className="flex-1 py-4 border border-white/10 hover:bg-white/5 transition-colors rounded-xl font-bold flex items-center justify-center gap-2">
                  <ArrowLeft size={18} className={isRtl ? 'rotate-180' : ''} />
                  {isRtl ? 'السابق' : 'Back'}
                </button>
              )}
              {step < 3 && (
                <button onClick={() => setStep(step + 1)} className="flex-[2] py-5 bg-gold hover:bg-gold-light text-main transition-all rounded-xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-gold/20">
                  {isRtl ? 'استمرار' : 'Continue to Payment'}
                  <ArrowRight size={18} className={isRtl ? 'rotate-180' : ''} />
                </button>
              )}
            </div>

            <p className="text-center mt-8 text-xs text-muted">
              {isRtl ? 'لديك حساب بالفعل؟' : 'Already have an account?'} {' '}
              <Link to="/login" className="text-gold font-bold hover:underline transition-all">
                {isRtl ? 'سجل دخول' : 'Sign In'}
              </Link>
            </p>
          </div>
          
          {/* Trust Footnote */}
          <div className="mt-12 pt-12 border-t border-white/5 flex flex-wrap justify-center gap-8 opacity-30 grayscale pointer-events-none items-center">
            <img src="https://upload.wikimedia.org/wikipedia/commons/3/30/Apple_Pay_logo.svg" alt="Apple Pay" className="h-6" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg" alt="Google Pay" className="h-4" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-4" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-5" />
          </div>
        </div>
      </div>
    </div>
  );
};
