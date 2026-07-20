/**
 * ThreeDViewerFull.tsx — VISIONO Full-Screen 3D + AR Viewer
 * Web-only. No app. Works on iPhone & Android via browser.
 *
 * Modes:
 *  rotate → OrbitControls drag to spin, pinch to zoom
 *  xray   → wireframe skeleton view
 *  ar     → model-viewer WebXR: dish placed on real table
 *  snap   → captures Three.js frame → 9:16 Snap card
 */

import { useRef, useState, useCallback, lazy, Suspense } from 'react';
import { useThreeEngine, type ViewerMode } from '../../hooks/useThreeEngine';
import { buildSnapCard } from '../../lib/snapCard';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../../context/LanguageContext';

const ARLauncher = lazy(() => import('./ARLauncher'));

interface ThreeDViewerFullProps {
  modelUrl     : string;
  dishName     : string;
  dishNameAr  ?: string;
  price        : string;
  primaryColor?: string;
  onClose      : () => void;
  onOrderAdd  ?: () => void;
}

type UIMode = ViewerMode | 'snap';

const MODES: { id: UIMode; ar: string; en: string; icon: string }[] = [
  { id: 'rotate', ar: 'تدوير',       en: 'Rotate',    icon: '⟳' },
  { id: 'xray',   ar: 'X-Ray',       en: 'X-Ray',     icon: '◈' },
  { id: 'ar',     ar: 'AR طاولة',    en: 'AR Table',  icon: '◎' },
  { id: 'snap',   ar: 'صوّر وشارك',  en: 'Snap',      icon: '📸' },
];

export default function ThreeDViewerFull({
  modelUrl, dishName, dishNameAr, price, primaryColor = '#C9A84C', onClose, onOrderAdd,
}: ThreeDViewerFullProps) {
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading]       = useState(true);
  const [progress, setProgress]     = useState(0);
  const [mode, setModeState]        = useState<UIMode>('rotate');
  const [showAR, setShowAR]         = useState(false);
  const [snapping, setSnapping]     = useState(false);
  const [snapDone, setSnapDone]     = useState(false);
  const [error, setError]           = useState('');

  // Gyro states
  const [gyroRequested, setGyroRequested] = useState(false);
  const [gyroActive, setGyroActive] = useState(false);
  const [showGyroHints, setShowGyroHints] = useState(false);

  const { isRtl } = useLanguage();
  const name = isRtl ? (dishNameAr || dishName) : dishName;

  const engine = useThreeEngine({
    canvasRef,
    modelUrl,
    primaryColor,
    onLoad     : () => {
      setLoading(false);
      // Auto-enable gyro on Android (since it doesn't require button press)
      if (typeof (DeviceOrientationEvent as any).requestPermission !== 'function') {
        handleEnableGyro();
      }
    },
    onProgress : (p) => setProgress(p),
    onError    : (e) => setError(e),
  });

  const handleSnap = useCallback(async () => {
    if (snapping) return;
    setSnapping(true);

    try {
      const dishFrame = engine.captureFrame();
      const cardBlob  = await buildSnapCard({
        dishFrame,
        dishName    : name,
        price,
        primaryColor,
      });

      const file = new File([cardBlob], `${name}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: name, text: `${name} — ${price}` });
      } else {
        const url = URL.createObjectURL(cardBlob);
        const a   = document.createElement('a');
        a.href    = url;
        a.download = `VISIONOapp-${name}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }

      setSnapDone(true);
      setTimeout(() => setSnapDone(false), 2500);
    } catch {
      // Silent — snap share cancelled or failed
    } finally {
      setSnapping(false);
    }
  }, [snapping, engine, name, price, primaryColor]);

  const handleEnableGyro = useCallback(async () => {
    setGyroRequested(true);
    const success = await engine.requestGyro();
    if (success) {
      setGyroActive(true);
      setShowGyroHints(true);
      // Hide hints after 4 seconds
      setTimeout(() => setShowGyroHints(false), 4000);
    }
  }, [engine]);

  const handleModeChange = useCallback((m: UIMode) => {
    if (m === 'snap') {
      handleSnap();
      return;
    }

    setModeState(m);

    if (m === 'ar') {
      setShowAR(true);
    } else {
      setShowAR(false);
      engine.setMode(m as ViewerMode);
    }
  }, [engine, handleSnap]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col select-none"
      style={{ backgroundColor: '#07070a', fontFamily: isRtl ? 'IBM Plex Sans Arabic, Cairo, sans-serif' : 'DM Sans, Space Grotesk, sans-serif' }}
      dir={isRtl ? 'rtl' : 'ltr'}
    >

      {/* ── TOP BAR ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
        <div className="flex flex-col">
          <span className="text-white font-semibold text-sm leading-tight">{name}</span>
          <span className="text-sm font-bold" style={{ color: primaryColor }}>{price}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode badge */}
          <span
            className="text-xs px-2.5 py-1 rounded-full font-mono"
            style={{ border: `1px solid ${primaryColor}60`, color: primaryColor }}
          >
            {mode.toUpperCase()}
          </span>

          {/* Close */}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-colors"
            style={{ border: '1px solid rgba(255,255,255,0.1)' }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* ── VIEWER AREA ──────────────────────────────────────────── */}
      <div className="relative flex-1 overflow-hidden">

        {/* Three.js canvas */}
        {!showAR && (
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{ touchAction: 'none', display: loading ? 'none' : 'block' }}
          />
        )}

        {/* AR viewer — uses smart tier detection */}
        {showAR && (
          <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" /></div>}>
            <ARLauncher
              modelUrl={modelUrl}
              dishName={name}
              price={price}
              primaryColor={primaryColor}
              lang={isRtl ? 'ar' : 'en'}
              onClose={() => { setShowAR(false); setModeState('rotate'); }}
            />
          </Suspense>
        )}

        {/* Loading screen */}
        {loading && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            {/* Animated ring */}
            <div className="relative w-20 h-20">
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5"/>
                <circle
                  cx="40" cy="40" r="34"
                  fill="none"
                  stroke={primaryColor}
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 34}`}
                  strokeDashoffset={`${2 * Math.PI * 34 * (1 - progress / 100)}`}
                  style={{ transition: 'stroke-dashoffset .3s ease' }}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-white font-mono text-sm">
                {progress}%
              </span>
            </div>
            <p className="text-white/50 text-sm">
              {isRtl ? 'جاري تحميل النموذج ثلاثي الأبعاد…' : 'Loading 3D model…'}
            </p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <span className="text-4xl">⚠️</span>
            <p className="text-white font-semibold">{isRtl ? 'تعذّر تحميل النموذج' : 'Failed to load model'}</p>
            <p className="text-white/40 text-sm">{error}</p>
            <button
              onClick={() => { setError(''); setLoading(true); setProgress(0); }}
              className="mt-2 px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ backgroundColor: primaryColor, color: '#0a0a0e' }}
            >
              {isRtl ? 'إعادة المحاولة' : 'Retry'}
            </button>
          </div>
        )}

        {/* Rotate hint & Gyro Controls */}
        {!loading && !showAR && mode === 'rotate' && (
          <div className="absolute bottom-5 left-0 right-0 flex flex-col items-center gap-3 pointer-events-none">
            {gyroActive ? (
              <AnimatePresence>
                {showGyroHints && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="px-4 py-2 rounded-full text-sm font-bold shadow-xl pointer-events-auto"
                    style={{ background: primaryColor, color: '#0a0a0e' }}
                  >
                    {isRtl ? '⬅️ حرّك هاتفك للرؤية 360° ➡️' : '⬅️ Move phone for 360° view ➡️'}
                  </motion.div>
                )}
              </AnimatePresence>
            ) : (
              !gyroRequested && (
                <button
                  onClick={handleEnableGyro}
                  className="px-6 py-3 rounded-full text-sm font-bold shadow-2xl pointer-events-auto animate-bounce hover:scale-105 transition-transform border border-black/10"
                  style={{ background: primaryColor, color: '#0a0a0e' }}
                >
                  {isRtl ? 'تفعيل تتبع 360° 📱' : 'Enable 360° Tracking 📱'}
                </button>
              )
            )}
          </div>
        )}

        {/* Snap success flash */}
        {snapDone && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="px-6 py-5 rounded-2xl text-center" style={{ background: primaryColor }}>
              <div className="text-3xl mb-1">📸</div>
              <p className="font-bold text-sm" style={{ color: '#0a0a0e' }}>
                {isRtl ? 'تم الحفظ!' : 'Saved!'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── MODE CONTROLS ────────────────────────────────────────── */}
      <div className="shrink-0 px-4 pt-3 pb-4" style={{ borderTop: '0.5px solid rgba(255,255,255,0.08)' }}>
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {MODES.map(m => {
            const active = m.id !== 'snap' && mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => handleModeChange(m.id)}
                disabled={snapping && m.id === 'snap'}
                className="flex-shrink-0 flex flex-col items-center gap-1 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-95"
                style={
                  active
                    ? { backgroundColor: primaryColor, color: '#0a0a0e' }
                    : { backgroundColor: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.65)' }
                }
              >
                <span className="text-base leading-none">{m.icon}</span>
                <span>{isRtl ? m.ar : m.en}</span>
              </button>
            );
          })}
        </div>

        {/* Add to order */}
        {onOrderAdd && (
          <button
            onClick={onOrderAdd}
            className="mt-3 w-full py-3.5 rounded-2xl font-bold text-sm active:scale-95 transition-transform"
            style={{ backgroundColor: primaryColor, color: '#0a0a0e' }}
          >
            {isRtl ? '+ أضف للطلب' : '+ Add to Order'}
          </button>
        )}
      </div>
    </div>
  );
}
