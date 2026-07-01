/**
 * ARHud.tsx — DOM Overlay UI for WebXR AR Session
 *
 * This component renders OVER the camera feed during AR.
 * It shows:
 *   - Top: dish name + price + close button
 *   - Center: scanning instructions (before placement)
 *   - Bottom: gesture hints + walk-around prompt (after placement)
 */

import React from 'react';

interface ARHudProps {
  dishName      : string;
  price         : string;
  primaryColor  : string;
  lang          : 'ar' | 'en';
  isPlaced      : boolean;
  isScanning    : boolean;
  onClose       : () => void;
  onReset       : () => void;
  overlayRef    : React.RefObject<HTMLDivElement | null>;
}

export function ARHud({
  dishName, price, primaryColor, lang, isPlaced, isScanning, onClose, onReset, overlayRef,
}: ARHudProps) {
  const isAr = lang === 'ar';

  return (
    <div
      ref={overlayRef}
      id="xr-overlay"
      className="fixed inset-0 z-[9999] pointer-events-none"
      dir={isAr ? 'rtl' : 'ltr'}
      style={{ fontFamily: isAr ? 'IBM Plex Sans Arabic, Cairo, sans-serif' : 'DM Sans, sans-serif' }}
    >
      {/* ── Top Bar: Dish Info + Close ─────────────────────────────── */}
      <div
        className="absolute top-0 left-0 right-0 px-4 py-3 pointer-events-auto"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.65), transparent)' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <p className="text-white font-bold text-sm leading-tight">{dishName}</p>
            <p className="text-sm font-bold" style={{ color: primaryColor }}>{price}</p>
          </div>
          <div className="flex gap-2">
            {isPlaced && (
              <button
                onClick={onReset}
                className="px-3 py-1.5 rounded-full text-xs font-bold text-white/80"
                style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}
              >
                {isAr ? '↩ إعادة وضع' : '↩ Replace'}
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      {/* ── Center: Scanning Instructions (before placement) ──────── */}
      {!isPlaced && (
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-32 gap-3 pointer-events-none">
          {/* Scanning animation */}
          {isScanning && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full"
              style={{ background: `${primaryColor}30`, border: `1px solid ${primaryColor}50` }}>
              <div
                className="w-3 h-3 rounded-full animate-pulse"
                style={{ backgroundColor: primaryColor }}
              />
              <span className="text-white text-xs font-bold">
                {isAr ? 'جاري البحث عن سطح...' : 'Scanning for surface...'}
              </span>
            </div>
          )}

          <p
            className="text-white font-semibold text-sm text-center px-8 leading-relaxed"
            style={{ textShadow: '0 2px 12px rgba(0,0,0,0.9)' }}
          >
            {isAr
              ? 'وجّه الكاميرا على الطاولة حتى تظهر الدائرة\nثم اضغط لوضع الطبق'
              : 'Point at a flat surface until the ring appears\nThen tap to place the dish'}
          </p>
        </div>
      )}

      {/* ── Bottom: Gesture Hints + Walk Around (after placement) ── */}
      {isPlaced && (
        <div
          className="absolute bottom-0 left-0 right-0 px-4 py-5 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent)' }}
        >
          <div className="flex flex-col items-center gap-3">
            {/* Gesture hints */}
            <div className="flex gap-4 text-white/60 text-xs font-medium">
              <span>{isAr ? '🤏 اقرص للتكبير' : '🤏 Pinch to scale'}</span>
              <span>{isAr ? '↺ دوّر بإصبعين' : '↺ Two fingers rotate'}</span>
            </div>

            {/* Walk around — KEY FEATURE */}
            <div
              className="px-5 py-2.5 rounded-full text-xs font-bold"
              style={{
                background: `${primaryColor}20`,
                color: primaryColor,
                border: `1px solid ${primaryColor}40`,
                backdropFilter: 'blur(8px)',
              }}
            >
              {isAr
                ? '🚶 امشِ حول الطبق — شوفه من كل الجهات!'
                : '🚶 Walk around the dish — view from every angle!'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
