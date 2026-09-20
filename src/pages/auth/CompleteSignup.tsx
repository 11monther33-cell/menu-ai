import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'react-hot-toast';

export const CompleteSignup = () => {
  const { isRtl } = useLanguage();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Simple validation
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  
  const isValid = hasMinLength && hasUpper && hasLower && hasNumber;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      toast.error(isRtl ? 'يرجى استيفاء جميع شروط كلمة المرور' : 'Please meet all password requirements');
      return;
    }
    
    if (!token) {
      toast.error(isRtl ? 'رابط الدعوة غير صالح أو مفقود' : 'Invalid or missing invite link');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/complete-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to complete signup');

      setIsSuccess(true);
      toast.success(isRtl ? 'تم إعداد الحساب بنجاح!' : 'Account setup successfully!');
      
      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-main flex flex-col items-center justify-center p-4">
        <XCircle size={48} className="text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-text-primary mb-2">{isRtl ? 'رابط غير صالح' : 'Invalid Link'}</h1>
        <p className="text-text-secondary text-center max-w-sm">
          {isRtl 
            ? 'هذا الرابط غير صالح أو انتهت صلاحيته. يرجى التواصل مع الإدارة.' 
            : 'This link is invalid or has expired. Please contact administration.'}
        </p>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-main flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0 }} 
          animate={{ scale: 1 }}
          className="w-20 h-20 bg-green-500/20 text-green-600 rounded-full flex items-center justify-center mb-6"
        >
          <CheckCircle size={40} />
        </motion.div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">{isRtl ? 'تم تفعيل حسابك!' : 'Account Activated!'}</h1>
        <p className="text-text-secondary text-center">
          {isRtl ? 'جاري تحويلك لصفحة تسجيل الدخول...' : 'Redirecting to login...'}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-main flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-card border border-border-custom rounded-[2rem] p-8 shadow-xl"
      >
        <div className="text-center mb-8">
          <img src="/logo.png" alt="VISIONO" className="h-10 mx-auto mb-6 object-contain" />
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            {isRtl ? 'إعداد كلمة المرور' : 'Set Your Password'}
          </h1>
          <p className="text-text-secondary text-sm">
            {isRtl ? 'مرحباً بك في VISIONO. قم بإعداد كلمة المرور لتفعيل حساب المطعم الخاص بك.' : 'Welcome to VISIONO. Set your password to activate your restaurant account.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-text-primary">{isRtl ? 'كلمة المرور الجديدة' : 'New Password'}</label>
            <div className="relative">
              <input 
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-surface-2 border border-border-custom rounded-xl px-4 py-3 text-text-primary outline-none focus:border-gold transition-colors"
                placeholder={isRtl ? 'أدخل كلمة المرور...' : 'Enter password...'}
                dir="ltr"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? 'left-4' : 'right-4'} text-text-secondary hover:text-text-primary transition-colors`}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="bg-surface-2/60 p-4 rounded-xl border border-border-custom space-y-2">
            <h4 className="text-xs font-bold text-text-primary mb-3">{isRtl ? 'شروط كلمة المرور:' : 'Password Requirements:'}</h4>
            <ul className="text-xs space-y-2">
              <li className={`flex items-center gap-2 ${hasMinLength ? 'text-green-600 font-semibold' : 'text-text-secondary'}`}>
                {hasMinLength ? <CheckCircle size={14} /> : <div className="w-3.5 h-3.5 rounded-full border border-current" />}
                {isRtl ? '8 أحرف على الأقل' : 'At least 8 characters'}
              </li>
              <li className={`flex items-center gap-2 ${hasUpper ? 'text-green-600 font-semibold' : 'text-text-secondary'}`}>
                {hasUpper ? <CheckCircle size={14} /> : <div className="w-3.5 h-3.5 rounded-full border border-current" />}
                {isRtl ? 'حرف كبير واحد على الأقل' : 'At least one uppercase letter'}
              </li>
              <li className={`flex items-center gap-2 ${hasLower ? 'text-green-600 font-semibold' : 'text-text-secondary'}`}>
                {hasLower ? <CheckCircle size={14} /> : <div className="w-3.5 h-3.5 rounded-full border border-current" />}
                {isRtl ? 'حرف صغير واحد على الأقل' : 'At least one lowercase letter'}
              </li>
              <li className={`flex items-center gap-2 ${hasNumber ? 'text-green-600 font-semibold' : 'text-text-secondary'}`}>
                {hasNumber ? <CheckCircle size={14} /> : <div className="w-3.5 h-3.5 rounded-full border border-current" />}
                {isRtl ? 'رقم واحد على الأقل' : 'At least one number'}
              </li>
            </ul>
          </div>

          <button 
            type="submit"
            disabled={isLoading || !isValid}
            className="w-full bg-gold text-white font-bold py-3.5 rounded-xl hover:bg-gold/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-lg shadow-gold/20"
          >
            {isLoading ? (isRtl ? 'جاري التفعيل...' : 'Activating...') : (isRtl ? 'تفعيل الحساب' : 'Activate Account')}
          </button>
        </form>
      </motion.div>
    </div>
  );
};
