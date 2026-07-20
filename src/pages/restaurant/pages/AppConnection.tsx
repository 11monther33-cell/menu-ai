import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Smartphone, RefreshCw, CheckCircle, Copy, AlertCircle, X, Loader2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';
import { cn } from '../../../lib/utils';

export const AppConnection = () => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const { user } = useAuth();
  
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    if (!expiresAt) return;
    
    const interval = setInterval(() => {
      const now = new Date();
      const diff = expiresAt.getTime() - now.getTime();
      
      if (diff <= 0) {
        setPairingCode(null);
        setExpiresAt(null);
        setTimeLeft('');
        clearInterval(interval);
      } else {
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [expiresAt]);

  const generateCode = async () => {
    if (!user?.restaurantId) return;
    
    setIsLoading(true);
    try {
      // Generate 6 random digits
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiry = new Date();
      expiry.setMinutes(expiry.getMinutes() + 30); // 30 minutes expiry
      
      const { error } = await supabase
        .from('device_pairing_codes')
        .insert({
          code,
          restaurant_id: user.restaurantId,
          expires_at: expiry.toISOString(),
          used: false
        });
        
      if (error) throw error;
      
      setPairingCode(code);
      setExpiresAt(expiry);
      toast.success(isRtl ? 'تم توليد كود الربط بنجاح' : 'Pairing code generated successfully');
    } catch (err) {
      console.error(err);
      toast.error(isRtl ? 'فشل توليد الكود' : 'Failed to generate code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (pairingCode) {
      navigator.clipboard.writeText(pairingCode);
      toast.success(isRtl ? 'تم النسخ!' : 'Copied!');
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-display text-text font-semibold tracking-wide">
          {isRtl ? 'ربط التطبيق' : 'App Connection'}
        </h1>
        <p className="text-text-muted mt-1 text-sm">
          {isRtl 
            ? 'اربط تطبيق الـ iOS (VISIONO Capture) لالتقاط النماذج ثلاثية الأبعاد للأطباق مباشرة من الكاميرا.' 
            : 'Link the iOS Companion App to capture 3D models of your dishes directly from your phone.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Connection Card */}
        <div className="bg-surface border border-white/5 rounded-2xl overflow-hidden shadow-sm relative">
          <div className="p-6 md:p-8 flex flex-col items-center justify-center min-h-[400px] text-center relative z-10">
            {!pairingCode ? (
              <div className="space-y-6 max-w-sm">
                <div className="w-20 h-20 bg-gold/10 text-gold rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-gold/5">
                  <Smartphone size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-text mb-2">
                    {isRtl ? 'جاهز للربط؟' : 'Ready to Connect?'}
                  </h3>
                  <p className="text-text-secondary text-sm leading-relaxed mb-8">
                    {isRtl 
                      ? 'قم بتوليد كود ربط مؤقت صالح لمدة 30 دقيقة لتسجيل الدخول بأمان في التطبيق دون الحاجة لمشاركة كلمة المرور.' 
                      : 'Generate a temporary 30-minute pairing code to securely log in to the app without sharing your password.'}
                  </p>
                </div>
                <button
                  onClick={generateCode}
                  disabled={isLoading}
                  className="w-full py-4 rounded-xl font-bold bg-gold text-main hover:bg-gold-light transition-all flex items-center justify-center gap-2 shadow-lg shadow-gold/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={20} /> : <RefreshCw size={20} />}
                  {isRtl ? 'توليد كود الربط' : 'Generate Pairing Code'}
                </button>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full space-y-8"
              >
                <div className="flex justify-between items-start w-full">
                  <div className="text-left rtl:text-right">
                    <div className="flex items-center gap-2 text-gold font-bold mb-1">
                      <CheckCircle size={18} />
                      <span>{isRtl ? 'الكود جاهز' : 'Code Ready'}</span>
                    </div>
                    <p className="text-xs text-text-muted">
                      {isRtl ? `ينتهي خلال ${timeLeft}` : `Expires in ${timeLeft}`}
                    </p>
                  </div>
                  <button 
                    onClick={() => { setPairingCode(null); setExpiresAt(null); }}
                    className="p-2 bg-white/5 rounded-full text-text-muted hover:text-white transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="bg-main/50 rounded-2xl p-8 border border-white/5 relative group">
                  <div className="tracking-[0.25em] text-4xl md:text-5xl font-display font-bold text-white text-center">
                    {pairingCode}
                  </div>
                  <button 
                    onClick={handleCopy}
                    className="absolute top-1/2 -translate-y-1/2 right-4 opacity-0 group-hover:opacity-100 p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all text-gold"
                  >
                    <Copy size={20} />
                  </button>
                </div>

                <div className="pt-4 border-t border-white/5 flex flex-col items-center gap-4">
                  <p className="text-sm font-medium text-text-secondary uppercase tracking-widest">
                    {isRtl ? 'أو امسح الرمز' : 'OR SCAN QR'}
                  </p>
                  <div className="p-4 bg-white rounded-2xl shadow-lg ring-1 ring-black/5">
                    <QRCodeSVG 
                      value={`arcodecapture://capture?token=${pairingCode}`}
                      size={180}
                      level="H"
                      includeMargin={false}
                    />
                  </div>
                  <p className="text-xs text-text-muted max-w-xs mx-auto">
                    {isRtl ? 'امسح الرمز باستخدام كاميرا الآيفون لفتح التطبيق تلقائياً' : 'Scan with your iPhone camera to automatically open the app'}
                  </p>
                </div>
              </motion.div>
            )}
          </div>
          
          {/* Decorative background */}
          <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Instructions Card */}
        <div className="bg-surface border border-white/5 rounded-2xl p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
              <InfoIcon size={20} />
            </div>
            <h3 className="text-lg font-bold text-text">
              {isRtl ? 'كيفية الاستخدام' : 'How it works'}
            </h3>
          </div>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-sm font-bold text-text-secondary shrink-0">1</div>
              <div>
                <h4 className="font-bold text-text mb-1">{isRtl ? 'حمّل التطبيق' : 'Download the App'}</h4>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {isRtl ? 'قم بتثبيت تطبيق VISIONO Capture على هاتف الآيفون الخاص بك من متجر أبل أو TestFlight.' : 'Install the VISIONO Capture app on your iPhone via App Store or TestFlight.'}
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-sm font-bold text-text-secondary shrink-0">2</div>
              <div>
                <h4 className="font-bold text-text mb-1">{isRtl ? 'أدخل الكود' : 'Enter the Code'}</h4>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {isRtl ? 'افتح التطبيق وأدخل الكود المكون من 6 أرقام أعلاه، أو ببساطة امسح رمز الـ QR بالكاميرا.' : 'Open the app and enter the 6-digit code above, or simply scan the QR code with your camera.'}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-sm font-bold text-text-secondary shrink-0">3</div>
              <div>
                <h4 className="font-bold text-text mb-1">{isRtl ? 'ابدأ التصوير' : 'Start Capturing'}</h4>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {isRtl ? 'يمكنك الآن تصوير أطباقك بزاوية 360 درجة لإنشاء نماذج ثلاثية الأبعاد سيتم ربطها وتحديثها تلقائياً هنا في النظام.' : 'You can now capture your dishes in 360° to create 3D models that will automatically sync back to this dashboard.'}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl flex gap-3">
            <AlertCircle size={20} className="text-orange-400 shrink-0" />
            <p className="text-xs text-orange-200/80 leading-relaxed">
              {isRtl 
                ? 'ملاحظة: هذا الكود مخصص لربط الأجهزة فقط. لا تشاركه مع أي شخص خارج نطاق موظفي المطعم الموثوقين. بمجرد انتهاء صلاحية الكود، لن يمكن استخدامه للدخول.' 
                : 'Note: This code is for device pairing only. Do not share it outside your trusted staff. Once expired, it cannot be used.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper icon component
function InfoIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}
