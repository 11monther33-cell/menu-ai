import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { CreditCard, ShieldCheck, RefreshCw, AlertTriangle } from 'lucide-react';
import { useSystemSettings } from '../hooks/useSystemSettings';

interface PaddlePaymentProps {
  planId: string;
  planName: string;
  amount: string;
  onSuccess: (details: any) => void;
  onError?: (error: any) => void;
}

// ═══════════════════════════════════════════
// Global SDK loader — loads Paddle SDK ONCE
// ═══════════════════════════════════════════
let sdkPromise: Promise<any> | null = null;
let sdkLoaded = false;

function loadPaddleSDK(): Promise<any> {
  if (sdkLoaded && (window as any).Paddle) {
    return Promise.resolve((window as any).Paddle);
  }

  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise<any>((resolve, reject) => {
    let script = document.querySelector('script[src*="paddle.com/paddle/v2/paddle.js"]') as HTMLScriptElement;

    if (!script) {
      script = document.createElement('script');
      script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
      script.async = true;
      const target = document.head || document.body || document.documentElement;
      target.appendChild(script);
    }

    if ((window as any).Paddle) {
      sdkLoaded = true;
      resolve((window as any).Paddle);
      return;
    }

    const onLoad = () => {
      const Paddle = (window as any).Paddle;
      if (!Paddle) {
        sdkPromise = null;
        reject(new Error('PADDLE_SDK_LOAD_FAILED'));
      } else {
        sdkLoaded = true;
        resolve(Paddle);
      }
      script.removeEventListener('load', onLoad);
      script.removeEventListener('error', onError);
    };

    const onError = () => {
      sdkPromise = null;
      reject(new Error('NETWORK_ERROR'));
      script.removeEventListener('load', onLoad);
      script.removeEventListener('error', onError);
    };

    script.addEventListener('load', onLoad);
    script.addEventListener('error', onError);
  });

  return sdkPromise;
}

// Track initialization per-token to avoid re-initializing
let lastInitToken = '';

export const PaddlePayment: React.FC<PaddlePaymentProps> = ({
  planId,
  planName,
  amount,
  onSuccess,
  onError
}) => {
  const { isRtl } = useLanguage();
  const { getSetting } = useSystemSettings();
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'invalid-plan'>('loading');
  const [errorDetail, setErrorDetail] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const successHandlerRef = useRef(onSuccess);
  const errorHandlerRef = useRef(onError);

  // Keep refs updated
  successHandlerRef.current = onSuccess;
  errorHandlerRef.current = onError;

  // Settings from DB / env
  const PADDLE_CLIENT_TOKEN = getSetting('paddle_client_token', import.meta.env.VITE_PADDLE_CLIENT_TOKEN || '').trim();

  // 🔒 Automatically deduce sandbox vs production based on client token prefix
  const PADDLE_ENV = PADDLE_CLIENT_TOKEN.startsWith('live_')
    ? 'production'
    : (PADDLE_CLIENT_TOKEN.startsWith('test_') ? 'sandbox' : getSetting('paddle_environment', import.meta.env.VITE_PADDLE_ENV || 'sandbox'));

  const isValidPlanId = useCallback((id: string): boolean => {
    return !!id && id !== 'pri_xxxx' && id.length >= 10 && id.startsWith('pri_');
  }, []);

  const isValidToken = useCallback((): boolean => {
    return !!PADDLE_CLIENT_TOKEN && PADDLE_CLIENT_TOKEN !== 'test_client_token_placeholder' && PADDLE_CLIENT_TOKEN.length >= 20;
  }, [PADDLE_CLIENT_TOKEN]);

  useEffect(() => {
    if (!isValidToken()) {
      setStatus('error');
      setErrorDetail(isRtl ? 'Paddle Client Token غير مُعد في النظام.' : 'Paddle Client Token is not configured.');
      return;
    }

    if (!isValidPlanId(planId)) {
      setStatus('invalid-plan');
      setErrorDetail(isRtl ? `رمز السعر "${planId}" غير صالح.` : `Price ID "${planId}" is invalid.`);
      return;
    }

    setStatus('loading');
    setErrorDetail('');

    let cancelled = false;

    const initPaddle = async () => {
      try {
        const Paddle = await loadPaddleSDK();
        if (cancelled) return;

        // ═══════════════════════════════════════════════════════════════
        // 🔒 CRITICAL FIX: Per Paddle official docs, inline checkout
        // settings (frameTarget, displayMode, frameInitialHeight, frameStyle)
        // MUST be passed inside Paddle.Initialize() under checkout.settings,
        // NOT inside Paddle.Checkout.open().
        // Ref: https://developer.paddle.com/build/checkout/build-branded-inline-checkout
        // ═══════════════════════════════════════════════════════════════

        // Re-initialize if token changed or first time
        if (lastInitToken !== PADDLE_CLIENT_TOKEN) {
          if (PADDLE_ENV === 'sandbox') {
            Paddle.Environment.set('sandbox');
          }

          Paddle.Initialize({
            token: PADDLE_CLIENT_TOKEN,
            checkout: {
              settings: {
                displayMode: 'inline',
                frameTarget: 'paddle-checkout-frame',
                frameInitialHeight: 450,
                frameStyle: 'width: 100%; min-width: 312px; background-color: transparent; border: none;',
                theme: 'dark',
                locale: 'en',
                allowLogout: false
              }
            },
            eventCallback: (event: any) => {
              if (event.name === 'checkout.completed') {
                successHandlerRef.current({
                  id: event.data?.checkout?.id,
                  subscriptionID: event.data?.subscription?.id || event.data?.checkout?.id,
                  customer: event.data?.customer
                });
              } else if (event.name === 'checkout.error') {
                if (errorHandlerRef.current) errorHandlerRef.current(event.data);
              }
            }
          });

          lastInitToken = PADDLE_CLIENT_TOKEN;
        }

        setStatus('ready');

        // Open checkout once container is in DOM
        const openCheckout = () => {
          if (cancelled) return;
          const container = containerRef.current;
          if (!container) {
            setTimeout(openCheckout, 50);
            return;
          }

          // Clear any old iframe
          container.innerHTML = '';

          // 🔒 Per docs: Paddle.Checkout.open() only needs items.
          // All display settings are already in Paddle.Initialize().
          Paddle.Checkout.open({
            items: [
              {
                priceId: planId,
                quantity: 1
              }
            ]
          });
        };

        openCheckout();
      } catch (err: any) {
        if (cancelled) return;
        setStatus('error');
        setErrorDetail(err?.message || (isRtl ? 'فشل اتصال بالنظام الدفع' : 'Failed to connect to payment system'));
      }
    };

    initPaddle();

    return () => {
      cancelled = true;
    };
  }, [planId, PADDLE_CLIENT_TOKEN, PADDLE_ENV, isRtl, isValidPlanId, isValidToken]);

  if (!isValidToken()) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-center">
        <AlertTriangle className="mx-auto mb-3 text-red-500" size={28} />
        <p className="text-red-500 font-bold mb-2">
          {isRtl ? 'نظام دفع Paddle غير مهيأ' : 'Paddle System Not Configured'}
        </p>
        <p className="text-muted text-xs">
          {isRtl ? 'يرجى إضافة رمز VITE_PADDLE_CLIENT_TOKEN في ملف .env أو إعدادات الأدمن' : 'Please configure VITE_PADDLE_CLIENT_TOKEN in .env or Admin Panel'}
        </p>
      </div>
    );
  }

  if (status === 'invalid-plan') {
    return (
      <div className="w-full space-y-6">
        <PlanHeader planName={planName} amount={amount} isRtl={isRtl} />
        <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-center">
          <AlertTriangle className="mx-auto mb-3 text-amber-500" size={28} />
          <p className="text-amber-500 font-bold mb-2">
            {isRtl ? 'رمز سعر الباقة غير مُعد' : 'Price ID Not Configured'}
          </p>
          <p className="text-muted text-xs mb-3">{errorDetail}</p>
        </div>
        <SecurityBadge isRtl={isRtl} />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <PlanHeader planName={planName} amount={amount} isRtl={isRtl} />

      <div className="relative w-full min-h-[480px]">
        {status === 'loading' && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-12 bg-surface-2 rounded-3xl border border-white/5 gap-3">
            <RefreshCw className="animate-spin text-gold" size={32} />
            <p className="text-muted text-xs animate-pulse">
              {isRtl ? 'جاري تحميل بوابة Paddle...' : 'Loading Paddle Gateway...'}
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="absolute inset-0 z-10 p-6 bg-red-500/10 border border-red-500/30 rounded-3xl text-center flex flex-col items-center justify-center">
            <AlertTriangle className="mx-auto mb-3 text-red-400" size={24} />
            <p className="text-red-400 text-sm font-bold mb-2">
              {isRtl ? 'فشل تحميل نظام الدفع' : 'Failed to load payment system'}
            </p>
            {errorDetail && (
              <p className="text-red-400/70 text-xs mb-4 whitespace-pre-line">{errorDetail}</p>
            )}
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-gold/20 border border-gold/30 text-gold rounded-xl text-sm font-bold hover:bg-gold/30 transition-all"
            >
              {isRtl ? 'إعادة المحاولة' : 'Retry'}
            </button>
          </div>
        )}

        {/* 🔒 CRITICAL: The class name here MUST match frameTarget in Paddle.Initialize() */}
        <div
          ref={containerRef}
          className="paddle-checkout-frame w-full bg-[#1A1917] rounded-3xl overflow-hidden border border-white/5 min-h-[480px] shadow-2xl transition-all duration-300"
        ></div>
      </div>

      <SecurityBadge isRtl={isRtl} />
    </div>
  );
};

// ═══════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════

function PlanHeader({ planName, amount, isRtl }: { planName: string; amount: string; isRtl: boolean }) {
  return (
    <div className="flex items-center justify-between p-6 bg-surface-2 rounded-3xl border border-white/5 overflow-hidden relative group">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <CreditCard size={80} className="text-gold" />
      </div>
      <div>
        <p className="text-[10px] text-muted uppercase tracking-widest font-bold mb-1">
          {isRtl ? 'الباقة المختارة' : 'Selected Plan'}
        </p>
        <p className="text-xl font-bold text-white">{planName}</p>
      </div>
      <div className="text-right">
        <p className="text-[10px] text-muted uppercase tracking-widest font-bold mb-1">
          {isRtl ? 'القيمة' : 'Price'}
        </p>
        <p className="text-2xl font-bold text-gold">${amount}</p>
      </div>
    </div>
  );
}

function SecurityBadge({ isRtl }: { isRtl: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 text-[10px] text-muted">
      <div className="flex items-center gap-1.5">
        <ShieldCheck size={14} className="text-green-500" />
        <span>{isRtl ? 'دفع آمن ومشفر بنسبة 100% عبر Paddle' : '100% secure encrypted payment via Paddle'}</span>
      </div>
      <span>{isRtl ? 'ندعم Visa, MasterCard, Apple Pay, Google Pay' : 'Supports Visa, MasterCard, Apple Pay, Google Pay'}</span>
    </div>
  );
}
