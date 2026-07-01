import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ShieldCheck, FileText, Landmark } from 'lucide-react';

interface LegalLayoutProps {
  titleAr: string;
  titleEn: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const LegalLayout: React.FC<LegalLayoutProps> = ({ titleAr, titleEn, icon, children }) => {
  const { isRtl } = useLanguage();
  return (
    <div className="min-h-screen bg-main flex flex-col justify-between">
      <Navbar />
      <main className="flex-grow pt-32 pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-surface-2 border border-white/5 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 text-gold">
              {icon}
            </div>
            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/5">
              <div className="w-12 h-12 bg-gold/10 text-gold rounded-xl flex items-center justify-center">
                {icon}
              </div>
              <h1 className="text-3xl font-display font-bold text-white">
                {isRtl ? titleAr : titleEn}
              </h1>
            </div>
            <div className="prose prose-invert max-w-none text-muted/95 leading-relaxed space-y-6 text-sm md:text-base">
              {children}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export const TermsPage: React.FC = () => {
  const { isRtl } = useLanguage();
  return (
    <LegalLayout 
      titleAr="الشروط والأحكام" 
      titleEn="Terms & Conditions" 
      icon={<FileText size={32} />}
    >
      {isRtl ? (
        <div className="space-y-6 text-right" dir="rtl">
          <p className="text-gold font-bold">آخر تحديث: 18 مايو 2026</p>
          <p>مرحباً بك في منصة <strong>VISIONO</strong>. باستخدامك لخدماتنا وموقعنا الإلكتروني، فإنك توافق التزاماً كاملاً بهذه الشروط والأحكام.</p>
          
          <h3 className="text-xl font-bold text-white mt-8">1. الخدمات والاشتراك</h3>
          <p>توفر منصة VISIONO خدمات المنيو ثلاثي الأبعاد AR ونظام الطلبات للمطاعم والكافيهات. يتم احتساب رسوم الاشتراك شهرياً أو سنوياً حسب الباقة المختارة عبر بوابة الدفع الآمنة Paddle.</p>
          
          <h3 className="text-xl font-bold text-white mt-8">2. الحسابات والأمان</h3>
          <p>أنت مسؤول مسؤولية كاملة عن الحفاظ على سرية معلومات حسابك وكلمة المرور الخاصة بك وعن جميع الأنشطة التي تحدث تحت حسابك.</p>
          
          <h3 className="text-xl font-bold text-white mt-8">3. تعديل الخدمات والأسعار</h3>
          <p>نحتفظ بالحق في تعديل أو إيقاف الخدمة في أي وقت، كما نحتفظ بالحق في تعديل أسعار باقات الاشتراك مع إخطار المشتركين مسبقاً بفترة لا تقل عن 30 يوماً.</p>
        </div>
      ) : (
        <div className="space-y-6 text-left" dir="ltr">
          <p className="text-gold font-bold">Last Updated: May 18, 2026</p>
          <p>Welcome to the <strong>VISIONO</strong> platform. By using our website and services, you fully agree to comply with and be bound by the following Terms & Conditions.</p>
          
          <h3 className="text-xl font-bold text-white mt-8">1. Services & Subscriptions</h3>
          <p>VISIONO provides interactive 3D AR menus and ordering systems for restaurants and cafes. Subscriptions are billed monthly or annually depending on your chosen plan through our secure payment gateway Paddle.</p>
          
          <h3 className="text-xl font-bold text-white mt-8">2. Accounts & Security</h3>
          <p>You are fully responsible for maintaining the confidentiality of your account credentials and password, and for all activities that occur under your account.</p>
          
          <h3 className="text-xl font-bold text-white mt-8">3. Modifications to Services and Prices</h3>
          <p>We reserve the right to modify or discontinue the service at any time. Subscription prices are subject to change with at least 30 days prior notice to all active subscribers.</p>
        </div>
      )}
    </LegalLayout>
  );
};

export const PrivacyPage: React.FC = () => {
  const { isRtl } = useLanguage();
  return (
    <LegalLayout 
      titleAr="سياسة الخصوصية" 
      titleEn="Privacy Policy" 
      icon={<ShieldCheck size={32} />}
    >
      {isRtl ? (
        <div className="space-y-6 text-right" dir="rtl">
          <p className="text-gold font-bold">آخر تحديث: 18 مايو 2026</p>
          <p>نحن في <strong>VISIONO</strong> نلتزم بأقصى درجات حماية بياناتك الشخصية وبيانات مطعمك وزوارك.</p>
          
          <h3 className="text-xl font-bold text-white mt-8">1. البيانات التي نجمعها</h3>
          <p>نقوم بجمع البيانات الشخصية مثل الاسم، البريد الإلكتروني، رقم الهاتف، ومعلومات المطعم عند التسجيل. لا نقوم بتخزين معلومات بطاقاتك الائتمانية حيث تتم معالجتها بالكامل وتأمينها عبر شريكنا المرخص Paddle.</p>
          
          <h3 className="text-xl font-bold text-white mt-8">2. استخدام البيانات</h3>
          <p>نستخدم بياناتك لتشغيل وتطوير منصتك، وتخصيص المنيو الخاص بك، وإرسال تحديثات النظام والدعم الفني.</p>
          
          <h3 className="text-xl font-bold text-white mt-8">3. مشاركة البيانات</h3>
          <p>لا نقوم ببيع أو تأجير بياناتك لأي طرف ثالث نهائياً.</p>
        </div>
      ) : (
        <div className="space-y-6 text-left" dir="ltr">
          <p className="text-gold font-bold">Last Updated: May 18, 2026</p>
          <p>At <strong>VISIONO</strong>, we are committed to protecting the privacy of your personal information, restaurant data, and menu visitors.</p>
          
          <h3 className="text-xl font-bold text-white mt-8">1. Information We Collect</h3>
          <p>We collect personal information such as name, email, phone number, and restaurant details during registration. We do not store credit card details; all transactions are securely processed and vaulted by our licensed payment processor Paddle.</p>
          
          <h3 className="text-xl font-bold text-white mt-8">2. Use of Information</h3>
          <p>We use your data to operate, develop, and personalize your restaurant platform, send system updates, and provide direct technical support.</p>
          
          <h3 className="text-xl font-bold text-white mt-8">3. Data Sharing</h3>
          <p>We absolutely do not sell, rent, or trade your personal or business data to any third party.</p>
        </div>
      )}
    </LegalLayout>
  );
};

export const RefundPage: React.FC = () => {
  const { isRtl } = useLanguage();
  return (
    <LegalLayout 
      titleAr="سياسة الاسترجاع والضمان" 
      titleEn="Refund Policy" 
      icon={<Landmark size={32} />}
    >
      {isRtl ? (
        <div className="space-y-6 text-right" dir="rtl">
          <p className="text-gold font-bold">آخر تحديث: 18 مايو 2026</p>
          <p>ثقتك بنا هي الأهم. نود توضيح سياسة إيقاف الاشتراكات والطلبات واسترجاع الأموال لمنصة <strong>VISIONO</strong>.</p>
          
          <h3 className="text-xl font-bold text-white mt-8">1. الفترة التجريبية المجانية</h3>
          <p>نقدم فترة تجريبية مجانية مدتها 3 أيام لجميع الباقات لتتمكن من تجربة المنصة بالكامل قبل سحب أي مبالغ من بطاقتك الائتمانية.</p>
          
          <h3 className="text-xl font-bold text-white mt-8">2. طلبات استرجاع المبالغ</h3>
          <p>يمكنك طلب استرجاع المبلغ المدفوع خلال أول <strong>7 أيام</strong> من بداية الاشتراك إذا لم تكن راضياً عن الخدمة ولم يتم تفعيل واستخدام ميزات الـ 3D AR بشكل مكثف. بعد مرور 7 أيام، لا يمكن استرجاع المبالغ المدفوعة عن الفترة الجارية، ولكن يمكنك إلغاء الاشتراك في أي وقت لمنع التجديد للشهر التالي.</p>
          
          <h3 className="text-xl font-bold text-white mt-8">3. كيفية طلب الاسترجاع</h3>
          <p>لطلب الاسترجاع، يرجى مراسلتنا فوراً عبر البريد الإلكتروني المخصص للدعم والاسترداد: <a href="mailto:11monther33@gmail.com" className="text-gold hover:underline">11monther33@gmail.com</a>، وسيقوم فريقنا بمعالجة طلبك عبر بوابة Paddle خلال 3 إلى 5 أيام عمل.</p>
        </div>
      ) : (
        <div className="space-y-6 text-left" dir="ltr">
          <p className="text-gold font-bold">Last Updated: May 18, 2026</p>
          <p>Your trust is our top priority. Here is our policy regarding refunds, cancellation, and guarantees for the <strong>VISIONO</strong> platform.</p>
          
          <h3 className="text-xl font-bold text-white mt-8">1. Free Trial Period</h3>
          <p>We provide a 3-day free trial on all plans to allow you to experience the full platform before any charges are made to your credit card.</p>
          
          <h3 className="text-xl font-bold text-white mt-8">2. Refund Requests</h3>
          <p>You may request a full refund within the first <strong>7 days</strong> of your subscription if you are not satisfied with the service and have not heavily utilized 3D AR modeling features. After 7 days, payments are non-refundable, but you can cancel your subscription at any time to prevent renewal for the subsequent billing cycle.</p>
          
          <h3 className="text-xl font-bold text-white mt-8">3. How to Request a Refund</h3>
          <p>To request a refund, please email our dedicated support and refund address directly at: <a href="mailto:11monther33@gmail.com" className="text-gold hover:underline">11monther33@gmail.com</a>. We will process your eligible refund through the Paddle gateway within 3 to 5 business days.</p>
        </div>
      )}
    </LegalLayout>
  );
};
