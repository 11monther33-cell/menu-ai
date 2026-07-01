/**
 * ARLauncher.tsx — Smart AR Entry Point
 *
 * Detects device AR capability and mounts the best available viewer.
 * Never shows "not supported" — always falls back gracefully.
 *
 * Tier 1 (Best)    : WebXR Immersive-AR   → WebXRViewer
 * Tier 2 (Fallback): model-viewer          → ARViewerPanel
 * Tier 3 (Desktop) : Three.js OrbitControls → ThreeDViewerFull (already open)
 */

import { useEffect, useState, lazy, Suspense } from 'react';
import { ARViewerPanel } from './ARViewerPanel';

const WebXRViewer = lazy(() => import('./WebXRViewer'));
const DesktopARViewer = lazy(() => import('./DesktopARViewer'));

type ARTier = 'detecting' | 'webxr' | 'model-viewer' | '3d-only' | 'desktop-webcam';

interface ARLauncherProps {
  modelUrl     : string;
  dishName     : string;
  price        : string;
  primaryColor : string;
  lang         : 'ar' | 'en';
  onClose      : () => void;
}

export default function ARLauncher({
  modelUrl, dishName, price, primaryColor, lang, onClose,
}: ARLauncherProps) {
  const [tier, setTier] = useState<ARTier>('detecting');

  useEffect(() => {
    detectARCapability().then(setTier);
  }, []);

  // ── Tier 3 Fallback ─────────────────────────────────────────────
  useEffect(() => {
    if (tier === '3d-only') {
      onClose();
    }
  }, [tier, onClose]);

  // ── 4. Desktop Webcam Fallback ──────────────────────────────────
  if (tier === 'desktop-webcam') {
    return (
      <Suspense fallback={<ARDetecting lang={lang} />}>
        <DesktopARViewer
          modelUrl={modelUrl}
          dishName={dishName}
          primaryColor={primaryColor}
          lang={lang}
          onClose={onClose}
        />
      </Suspense>
    );
  }

  // ── 1. Detecting... ─────────────────────────────────────────────
  if (tier === 'detecting') {
    return <ARDetecting lang={lang} />;
  }

  // ── 2. Full WebXR (Tier 1) ──────────────────────────────────────
  if (tier === 'webxr') {
    return (
      <Suspense fallback={<ARDetecting lang={lang} />}>
        <WebXRViewer
          modelUrl={modelUrl}
          dishName={dishName}
          price={price}
          primaryColor={primaryColor}
          lang={lang}
          onClose={onClose}
        />
      </Suspense>
    );
  }

  // ── 3. model-viewer (Tier 2) ────────────────────────────────────
  if (tier === 'model-viewer') {
    return (
      <div className="fixed inset-0 z-50 bg-black">
        <ARViewerPanel
          modelUrl={modelUrl}
          dishName={dishName}
          primaryColor={primaryColor}
        />
        <button
          onClick={onClose}
          className="fixed top-4 right-4 z-[60] w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center text-lg font-bold backdrop-blur-md"
        >
          ✕
        </button>
      </div>
    );
  }

  return null;
}

/**
 * Detect the best AR capability available on this device.
 */
async function detectARCapability(): Promise<ARTier> {
  // Step 1: Is WebXR available?
  if (navigator.xr) {
    try {
      const supported = await (navigator.xr as any).isSessionSupported('immersive-ar');
      if (supported) return 'webxr';
    } catch {
      // WebXR exists but immersive-ar not supported
    }
  }

  // Step 2: Check for iOS (supports model-viewer Quick Look)
  const isIOS    = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  if (isIOS || isSafari) return 'model-viewer';

  // Step 3: Check for Android (supports Scene Viewer)
  const isAndroid = /android/i.test(navigator.userAgent);
  if (isAndroid) return 'model-viewer';

  // Step 4: Desktop or unknown — use custom webcam fallback
  return 'desktop-webcam';
}

/**
 * Loading screen while detecting AR capability
 */
function ARDetecting({ lang }: { lang: 'ar' | 'en' }) {
  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-2 border-white/10 rounded-full" />
          <div className="absolute inset-0 border-2 border-transparent border-t-white rounded-full animate-spin" />
        </div>
        <p className="text-white/50 text-sm font-medium">
          {lang === 'ar' ? 'جاري تحضير تجربة AR...' : 'Preparing AR experience...'}
        </p>
      </div>
    </div>
  );
}
