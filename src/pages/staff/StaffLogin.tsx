import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { useStaffSession, StaffSession } from '../../hooks/useStaffSession';
import { 
  Building2, Key, Shield, ArrowRight, ArrowLeft, 
  RefreshCw, Delete, Check, Lock, Users, MapPin, X
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface StaffItem {
  id: string;
  name: string;
  role: string;
  branch_id: string | null;
  branch_name?: string;
  pin_code?: string;
  permissions?: string[];
}

const ROLE_CONFIG: Record<string, { ar: string; en: string; bg: string; text: string }> = {
  cashier:        { ar: 'كاشير',        en: 'Cashier',        bg: 'bg-blue-100 dark:bg-blue-900/30',   text: 'text-blue-700 dark:text-blue-300' },
  chef:           { ar: 'طباخ',         en: 'Chef',           bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300' },
  waiter:         { ar: 'نادل',         en: 'Waiter',         bg: 'bg-green-100 dark:bg-green-900/30',  text: 'text-green-700 dark:text-green-300' },
  branch_manager: { ar: 'مدير فرع',     en: 'Branch Manager', bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300' },
};

export const StaffLogin: React.FC = () => {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const { setSession, session: currentSession } = useStaffSession();

  const [restaurantName, setRestaurantName] = useState<string>('');
  const [staffList, setStaffList] = useState<StaffItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStaff, setSelectedStaff] = useState<StaffItem | null>(null);
  const [pin, setPin] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [shake, setShake] = useState(false);

  const loadData = useCallback(async () => {
    if (!restaurantId) return;
    try {
      setLoading(true);

      let restName = isRtl ? 'المطعم' : 'Restaurant';
      try {
        const { data: rest } = await supabase
          .from('restaurants')
          .select('name_ar, name_en')
          .eq('id', restaurantId)
          .maybeSingle();
        if (rest) {
          restName = (isRtl ? rest.name_ar : rest.name_en) || rest.name_ar || rest.name_en || restName;
        }
      } catch (e) {
        console.warn('Could not fetch restaurant name', e);
      }
      setRestaurantName(restName);

      const branchMap = new Map<string, string>();
      try {
        const { data: branches } = await supabase
          .from('pos_branches')
          .select('id, name')
          .eq('restaurant_id', restaurantId);
        branches?.forEach(b => branchMap.set(b.id, b.name));
      } catch (e) {
        // non-blocking
      }

      let fetchedStaff: StaffItem[] = [];
      try {
        const apiRes = await fetch(`/api/staff/list?restaurantId=${restaurantId}`);
        if (apiRes.ok) {
          const apiData = await apiRes.json();
          if (apiData.success && Array.isArray(apiData.staff)) {
            fetchedStaff = apiData.staff.map((s: any) => ({
              ...s,
              branch_name: s.branch_id ? branchMap.get(s.branch_id) : undefined
            }));
          }
        }
      } catch {
        // ignore
      }

      if (fetchedStaff.length === 0) {
        const { data, error } = await supabase
          .from('restaurant_staff')
          .select('id, name, role, branch_id, pin_code, permissions, is_active')
          .eq('restaurant_id', restaurantId)
          .eq('is_active', true);

        if (!error && data) {
          fetchedStaff = data.map(s => ({
            id: s.id,
            name: s.name,
            role: s.role,
            branch_id: s.branch_id,
            branch_name: s.branch_id ? branchMap.get(s.branch_id) : undefined,
            pin_code: s.pin_code,
            permissions: s.permissions || []
          }));
        }
      }

      setStaffList(fetchedStaff);
    } catch (err) {
      console.error('Failed to load staff list', err);
      toast.error(isRtl ? 'تعذر تحميل قائمة الموظفين' : 'Failed to load staff list');
    } finally {
      setLoading(false);
    }
  }, [restaurantId, isRtl]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleKeypadPress = (val: string) => {
    if (pin.length < 6) {
      setPin(prev => prev + val);
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPin('');
  };

  const handleSubmitPin = async () => {
    if (!selectedStaff || pin.length < 4 || !restaurantId) return;

    try {
      setSubmitting(true);

      let success = false;
      let verifiedStaff: StaffSession | null = null;

      try {
        const res = await fetch('/api/staff/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            restaurantId,
            staffId: selectedStaff.id,
            pin
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.staff) {
            success = true;
            verifiedStaff = {
              ...data.staff,
              loginTime: new Date().toISOString()
            };
          }
        }
      } catch {
        // ignore
      }

      if (!success && selectedStaff.pin_code) {
        if (selectedStaff.pin_code === pin) {
          success = true;
          verifiedStaff = {
            staffId: selectedStaff.id,
            name: selectedStaff.name,
            role: selectedStaff.role,
            permissions: selectedStaff.permissions || [],
            branchId: selectedStaff.branch_id,
            restaurantId,
            restaurantName: restaurantName || 'VISIONO',
            loginTime: new Date().toISOString()
          };
        }
      }

      if (success && verifiedStaff) {
        setSession(verifiedStaff);
        toast.success(
          isRtl 
            ? `مرحباً بك يا ${verifiedStaff.name}!` 
            : `Welcome, ${verifiedStaff.name}!`
        );
        navigate('/staff-dashboard');
      } else {
        setShake(true);
        setTimeout(() => setShake(false), 600);
        toast.error(isRtl ? 'الرقم السري غير صحيح' : 'Incorrect PIN');
        setPin('');
      }
    } catch (err) {
      console.error('Login error', err);
      toast.error(isRtl ? 'حدث خطأ أثناء التحقق' : 'Verification error');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!selectedStaff) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleKeypadPress(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (pin.length >= 4) {
          handleSubmitPin();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setSelectedStaff(null);
        setPin('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedStaff, pin]);

  return (
    <div className="min-h-screen bg-main text-text-primary flex flex-col justify-between p-4 sm:p-6 md:p-10">
      {/* Top Header */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gold/15 flex items-center justify-center text-gold shadow-sm">
            <Building2 size={26} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-text-primary">
              {restaurantName || (isRtl ? 'مطعم فيزيونو' : 'VISIONO Restaurant')}
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary flex items-center gap-1.5 font-medium">
              <Shield size={14} className="text-gold" />
              {isRtl ? 'بوابة دخول الموظفين بنظام PIN' : 'Staff PIN Login Portal'}
            </p>
          </div>
        </div>

        {currentSession && (
          <button
            onClick={() => navigate('/staff-dashboard')}
            className="flex items-center gap-2 px-4 py-2 bg-card hover:bg-surface-2 border border-border-custom rounded-xl text-xs sm:text-sm font-bold text-gold transition-all shadow-sm"
          >
            <span>{isRtl ? `متابعة كـ ${currentSession.name}` : `Continue as ${currentSession.name}`}</span>
            {isRtl ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
          </button>
        )}
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl w-full mx-auto flex-1 flex flex-col justify-center my-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <RefreshCw className="animate-spin text-gold" size={36} />
            <p className="text-sm text-text-secondary font-medium">
              {isRtl ? 'جاري تحميل قائمة الموظفين...' : 'Loading staff list...'}
            </p>
          </div>
        ) : staffList.length === 0 ? (
          <div className="bg-card border border-border-custom rounded-3xl p-8 sm:p-12 text-center max-w-md mx-auto shadow-sm">
            <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto text-gold mb-4">
              <Users size={32} />
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-2">
              {isRtl ? 'لا يوجد موظفون مسجلون بعد' : 'No staff members registered yet'}
            </h3>
            <p className="text-sm text-text-secondary mb-6 leading-relaxed">
              {isRtl
                ? 'يمكن لمدير المطعم إضافة الموظفين وتحديد صلاحياتهم من خلال لوحة التحكم (صفحة الفروع والموظفون).'
                : 'The restaurant manager can add staff and set permissions from the dashboard (Branches & Staff page).'}
            </p>
            <button
              onClick={() => navigate('/dashboard/branches')}
              className="w-full py-3 px-4 bg-gold text-white font-bold rounded-xl hover:bg-gold/90 transition-all shadow-md shadow-gold/20"
            >
              {isRtl ? 'الذهاب إلى لوحة التحكم' : 'Go to Dashboard'}
            </button>
          </div>
        ) : (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-black text-text-primary mb-2">
                {isRtl ? 'اختر اسمك لتسجيل الدخول' : 'Select your name to sign in'}
              </h2>
              <p className="text-sm text-text-secondary">
                {isRtl ? 'اضغط على اسمك ثم أدخل رقمك السري للمتابعة' : 'Tap your name, then enter your PIN code'}
              </p>
            </div>

            {/* Staff Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {staffList.map(member => {
                const roleConf = ROLE_CONFIG[member.role] || {
                  ar: member.role,
                  en: member.role,
                  bg: 'bg-gray-100',
                  text: 'text-gray-700'
                };
                return (
                  <button
                    key={member.id}
                    onClick={() => {
                      setSelectedStaff(member);
                      setPin('');
                    }}
                    className="group bg-card hover:bg-surface-2 border border-border-custom hover:border-gold rounded-2xl p-5 flex flex-col items-center text-center transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-gold/15 group-hover:bg-gold group-hover:text-white flex items-center justify-center font-black text-gold text-2xl mb-3 transition-colors shadow-sm">
                      {member.name.charAt(0)}
                    </div>
                    <h3 className="font-bold text-base text-text-primary group-hover:text-gold transition-colors mb-1 truncate w-full">
                      {member.name}
                    </h3>
                    <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold mb-2 ${roleConf.bg} ${roleConf.text}`}>
                      {isRtl ? roleConf.ar : roleConf.en}
                    </span>
                    {member.branch_name && (
                      <span className="text-[10px] text-text-secondary flex items-center gap-1 truncate max-w-full">
                        <MapPin size={11} className="text-gold flex-shrink-0" />
                        <span className="truncate">{member.branch_name}</span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-4xl w-full mx-auto text-center py-4 border-t border-border-custom text-xs text-text-secondary">
        <span>VISIONO Smart Restaurant System • PIN-Based Secure Terminal</span>
      </footer>

      {/* PIN Entry Modal Overlay */}
      {selectedStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-card border border-border-custom rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col p-6 sm:p-8 relative">
            <button
              onClick={() => {
                setSelectedStaff(null);
                setPin('');
              }}
              className="absolute top-4 end-4 p-2 text-text-secondary hover:text-text-primary rounded-full hover:bg-surface-2 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gold/15 text-gold flex items-center justify-center font-black text-2xl mx-auto mb-3 shadow-sm">
                {selectedStaff.name.charAt(0)}
              </div>
              <h3 className="text-xl font-black text-text-primary">
                {isRtl ? `مرحباً، ${selectedStaff.name}` : `Welcome, ${selectedStaff.name}`}
              </h3>
              <p className="text-xs text-text-secondary mt-1">
                {isRtl ? 'أدخل الرقم السري المكون من 4 إلى 6 أرقام' : 'Enter your 4 to 6 digit PIN code'}
              </p>
            </div>

            <div className={`flex justify-center items-center gap-3 my-4 py-3 ${shake ? 'animate-shake' : ''}`}>
              {[0, 1, 2, 3, 4, 5].map(idx => (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                    idx < pin.length
                      ? 'bg-gold border-gold scale-110 shadow-sm shadow-gold/50'
                      : 'border-border-custom bg-surface-2'
                  }`}
                />
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2.5 my-4">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(digit => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleKeypadPress(digit)}
                  className="h-14 rounded-2xl bg-surface-2 hover:bg-gold/10 hover:border-gold border border-border-custom font-bold text-xl text-text-primary active:scale-95 transition-all flex items-center justify-center"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={handleClear}
                className="h-14 rounded-2xl bg-surface-2 hover:bg-red-50 hover:text-red-600 border border-border-custom font-bold text-sm text-text-secondary active:scale-95 transition-all flex items-center justify-center"
              >
                C
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress('0')}
                className="h-14 rounded-2xl bg-surface-2 hover:bg-gold/10 hover:border-gold border border-border-custom font-bold text-xl text-text-primary active:scale-95 transition-all flex items-center justify-center"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                className="h-14 rounded-2xl bg-surface-2 hover:bg-gold/10 border border-border-custom font-bold text-text-secondary active:scale-95 transition-all flex items-center justify-center"
              >
                <Delete size={20} />
              </button>
            </div>

            <div className="mt-4 space-y-2">
              <button
                type="button"
                disabled={pin.length < 4 || submitting}
                onClick={handleSubmitPin}
                className="w-full py-3.5 px-4 bg-gold text-white font-bold rounded-2xl hover:bg-gold/90 transition-all shadow-lg shadow-gold/25 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <RefreshCw className="animate-spin" size={20} />
                ) : (
                  <>
                    <Lock size={18} />
                    <span>{isRtl ? 'تأكيد الدخول' : 'Confirm & Login'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
