import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useLanguage } from '../../../context/LanguageContext';
import { motion } from 'motion/react';
import { Shield, ShieldAlert, ShieldCheck, Copy, Check } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';

export const SecuritySettings = () => {
  const { t, isRtl } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [factors, setFactors] = useState<any[]>([]);
  const [enrolling, setEnrolling] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<{ id: string; uri: string; secret: string } | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchFactors();
  }, []);

  const fetchFactors = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      setFactors(data.totp || []);
    } catch (err: any) {
      console.error('Error fetching MFA factors:', err);
      toast.error(isRtl ? 'فشل جلب إعدادات الأمان' : 'Failed to load security settings');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
      });
      if (error) throw error;
      
      setQrCodeData({
        id: data.id,
        uri: data.totp.uri,
        secret: data.totp.secret,
      });
    } catch (err: any) {
      console.error('Enrollment error:', err);
      toast.error(err.message || (isRtl ? 'فشل بدء التفعيل' : 'Failed to start enrollment'));
    } finally {
      setEnrolling(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrCodeData || verifyCode.length !== 6) return;
    
    setVerifying(true);
    try {
      const challenge = await supabase.auth.mfa.challenge({ factorId: qrCodeData.id });
      if (challenge.error) throw challenge.error;

      const verify = await supabase.auth.mfa.verify({
        factorId: qrCodeData.id,
        challengeId: challenge.data.id,
        code: verifyCode,
      });
      if (verify.error) throw verify.error;

      toast.success(isRtl ? 'تم تفعيل التحقق بخطوتين بنجاح!' : 'Two-Factor Authentication enabled successfully!');
      setQrCodeData(null);
      setVerifyCode('');
      fetchFactors();
    } catch (err: any) {
      console.error('Verification error:', err);
      toast.error(isRtl ? 'الرمز غير صحيح، حاول مرة أخرى' : 'Invalid code, please try again');
    } finally {
      setVerifying(false);
    }
  };

  const handleUnenroll = async (factorId: string) => {
    if (!confirm(isRtl ? 'هل أنت متأكد من إلغاء تفعيل التحقق بخطوتين؟ سيقلل هذا من أمان حسابك.' : 'Are you sure you want to disable 2FA? This will reduce your account security.')) return;
    
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) throw error;
      toast.success(isRtl ? 'تم إلغاء التفعيل بنجاح' : 'Disabled successfully');
      fetchFactors();
    } catch (err: any) {
      console.error('Unenroll error:', err);
      toast.error(isRtl ? 'فشل إلغاء التفعيل' : 'Failed to disable');
    }
  };

  const copySecret = () => {
    if (!qrCodeData?.secret) return;
    navigator.clipboard.writeText(qrCodeData.secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success(isRtl ? 'تم نسخ الرمز السري' : 'Secret copied');
  };

  const activeFactors = factors.filter(f => f.status === 'verified');
  const isEnabled = activeFactors.length > 0;

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="text-3xl font-bold text-text-primary flex items-center gap-3">
          <Shield className="text-gold" size={32} />
          {isRtl ? 'الأمان والتحقق بخطوتين' : 'Security & 2FA'}
        </h2>
        <p className="text-text-secondary mt-2">
          {isRtl 
            ? 'احمِ حسابك من الوصول غير المصرح به بتفعيل المصادقة الثنائية (MFA).' 
            : 'Protect your account from unauthorized access by enabling Two-Factor Authentication (MFA).'}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-sidebar border border-border-custom rounded-2xl p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl ${isEnabled ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                {isEnabled ? <ShieldCheck size={32} /> : <ShieldAlert size={32} />}
              </div>
              <div>
                <h3 className="text-xl font-bold text-text-primary mb-1">
                  {isRtl ? 'حالة التحقق بخطوتين' : '2FA Status'}
                </h3>
                <p className="text-text-secondary text-sm max-w-md">
                  {isEnabled 
                    ? (isRtl ? 'التحقق بخطوتين (2FA) مفعل على حسابك. حسابك الآن محمي.' : 'Two-Factor Authentication is enabled. Your account is protected.')
                    : (isRtl ? 'التحقق بخطوتين غير مفعل. ننصح بتفعيله لزيادة أمان المطعم.' : 'Two-Factor Authentication is disabled. We recommend enabling it.')}
                </p>
              </div>
            </div>

            {!qrCodeData && (
              <div>
                {isEnabled ? (
                  <button
                    onClick={() => handleUnenroll(activeFactors[0].id)}
                    className="px-6 py-2.5 bg-red-500/10 text-red-500 font-bold rounded-xl hover:bg-red-500 hover:text-white transition-colors"
                  >
                    {isRtl ? 'إلغاء التفعيل' : 'Disable 2FA'}
                  </button>
                ) : (
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="px-6 py-2.5 bg-gold text-main font-bold rounded-xl hover:bg-gold-light transition-colors shadow-lg shadow-gold/20 flex items-center gap-2"
                  >
                    {enrolling && <div className="w-4 h-4 border-2 border-main border-t-transparent rounded-full animate-spin" />}
                    {isRtl ? 'تفعيل الآن' : 'Enable Now'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Setup UI */}
          {qrCodeData && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-8 pt-8 border-t border-border-custom"
            >
              <h4 className="text-lg font-bold text-text-primary mb-4">
                {isRtl ? 'خطوات التفعيل:' : 'Setup Instructions:'}
              </h4>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 shrink-0 bg-gold/10 text-gold font-bold rounded-full flex items-center justify-center">1</div>
                    <div>
                      <p className="text-text-primary font-medium">{isRtl ? 'قم بتحميل تطبيق مصادقة' : 'Download an Authenticator app'}</p>
                      <p className="text-text-secondary text-sm mt-1">{isRtl ? 'مثل Google Authenticator أو Authy.' : 'Like Google Authenticator or Authy.'}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="w-8 h-8 shrink-0 bg-gold/10 text-gold font-bold rounded-full flex items-center justify-center">2</div>
                    <div className="w-full">
                      <p className="text-text-primary font-medium">{isRtl ? 'امسح رمز الـ QR بالكاميرا' : 'Scan the QR Code'}</p>
                      <p className="text-text-secondary text-sm mt-1 mb-3">{isRtl ? 'أو أدخل الرمز السري يدوياً:' : 'Or enter this secret key manually:'}</p>
                      
                      <div className="flex items-center gap-2 bg-card border border-border-custom p-2 rounded-lg">
                        <code className="flex-1 text-xs text-gold tracking-widest text-center">{qrCodeData.secret}</code>
                        <button onClick={copySecret} className="p-2 bg-white/5 hover:bg-white/10 rounded-md transition-colors text-text-secondary">
                          {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-8 h-8 shrink-0 bg-gold/10 text-gold font-bold rounded-full flex items-center justify-center">3</div>
                    <div className="w-full">
                      <p className="text-text-primary font-medium mb-3">{isRtl ? 'أدخل الرمز المكون من 6 أرقام' : 'Enter the 6-digit code'}</p>
                      <form onSubmit={handleVerify} className="flex gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          value={verifyCode}
                          onChange={e => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                          placeholder="123456"
                          className="flex-1 bg-card border border-border-custom rounded-xl px-4 py-3 text-center text-xl tracking-[0.5em] text-text-primary focus:border-gold outline-none transition-colors font-mono"
                          required
                        />
                        <button
                          type="submit"
                          disabled={verifyCode.length !== 6 || verifying}
                          className="px-6 bg-gold text-main font-bold rounded-xl disabled:opacity-50 transition-colors"
                        >
                          {verifying ? (isRtl ? 'جاري...' : 'Verifying...') : (isRtl ? 'تأكيد' : 'Verify')}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center bg-card rounded-2xl p-8 border border-border-custom">
                  <div className="bg-white p-4 rounded-xl shadow-lg">
                    <QRCodeSVG value={qrCodeData.uri} size={200} />
                  </div>
                </div>
              </div>
              
              <div className="mt-8 flex justify-end">
                 <button
                    onClick={() => setQrCodeData(null)}
                    className="px-6 py-2 text-text-secondary hover:text-text-primary transition-colors"
                  >
                    {isRtl ? 'إلغاء العملية' : 'Cancel setup'}
                  </button>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
};
