/**
 * ARViewerPanel.tsx — VISIONO WebXR Augmented Reality
 * Uses @google/model-viewer web component.
 * Places a REAL photorealistic 3D dish on the customer's actual table.
 * Works on iPhone (Quick Look) and Android (Scene Viewer / WebXR).
 * NO APP DOWNLOAD NEEDED.
 *
 * Security: modelUrl validated to HTTPS/relative paths only.
 */

import React, { useEffect, useRef, useState } from 'react';
import '@google/model-viewer';
import { useLanguage } from '../../context/LanguageContext';

interface ARViewerPanelProps {
  modelUrl     : string;
  dishName     : string;
  primaryColor?: string;
}

export function ARViewerPanel({ modelUrl, dishName, primaryColor = '#C9A84C' }: ARViewerPanelProps) {
  const viewerRef   = useRef<HTMLElement & { activateAR?: () => void }>(null);
  const [arStatus, setArStatus] = useState<'idle' | 'active' | 'ended'>('idle');
  const { isRtl } = useLanguage();

  // Validate modelUrl — only allow https or relative paths
  const safeModelUrl = (() => {
    if (modelUrl.startsWith('/')) return modelUrl;
    try {
      const url = new URL(modelUrl);
      if (url.protocol === 'https:') return modelUrl;
    } catch { /* invalid URL */ }
    return '';
  })();

  // Listen for AR session events
  useEffect(() => {
    const el = viewerRef.current;
    if (!el) return;

    const onStatus = (e: Event) => {
      const status = (e as CustomEvent).detail?.status as string;
      if (status === 'session-started') setArStatus('active');
      if (status === 'session-ended')   setArStatus('ended');
    };

    el.addEventListener('ar-status', onStatus);
    return () => el.removeEventListener('ar-status', onStatus);
  }, []);

  const launchAR = () => {
    viewerRef.current?.activateAR?.();
  };

  if (!safeModelUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center text-white/40 text-sm">
        {isRtl ? 'رابط النموذج غير صالح' : 'Invalid model URL'}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col" dir={isRtl ? 'rtl' : 'ltr'}>

      {/* model-viewer — handles ALL AR modes automatically */}
      {React.createElement('model-viewer', {
        ref: viewerRef,
        src: safeModelUrl,
        alt: dishName,
        ar: true,
        'ar-modes': 'webxr scene-viewer quick-look',
        'ar-scale': 'auto',
        'ar-placement': 'floor',
        'camera-controls': true,
        'auto-rotate': true,
        'auto-rotate-delay': 800,
        'rotation-per-second': '25deg',
        'shadow-intensity': '1.2',
        'shadow-softness': '0.9',
        'environment-image': 'neutral',
        exposure: '1.3',
        reveal: 'auto',
        loading: 'eager',
        style: {
          width: '100%',
          height: '100%',
          minHeight: '400px',
          backgroundColor: '#07070a',
        },
      })}

      {/* ── AR status badge ──────────────────────────────────────── */}
      {arStatus === 'active' && (
        <div
          className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-xs font-bold animate-pulse"
          style={{ background: '#00ff9640', color: '#00ff96', border: '1px solid #00ff9660' }}
        >
          {isRtl ? '● AR مفعّل — وجّه الكاميرا للطاولة' : '● AR Active — Point at your table'}
        </div>
      )}

      {/* ── Big AR launch button ─────────────────────────────────── */}
      {arStatus !== 'active' && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
          <button
            onClick={launchAR}
            className="flex items-center gap-2.5 px-7 py-3.5 rounded-2xl font-bold text-sm shadow-lg active:scale-95 transition-transform"
            style={{ background: primaryColor, color: '#0a0a0e' }}
          >
            <span className="text-base">◎</span>
            <span>{isRtl ? 'ضع الطبق على طاولتك!' : 'Place dish on your table!'}</span>
          </button>

          <p className="text-white/40 text-xs text-center px-4">
            {isRtl
              ? 'اضغط الزر ثم وجّه كاميرا هاتفك نحو الطاولة'
              : 'Tap the button, then point your phone camera at the table'}
          </p>
        </div>
      )}

      {/* ── How it looks guide ─────────────────────────────────── */}
      <div
        className="absolute top-3 right-3 flex flex-col gap-1 opacity-60"
        style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}
      >
        <span>WebXR • Quick Look</span>
        <span>iOS & Android ✓</span>
      </div>
    </div>
  );
}
