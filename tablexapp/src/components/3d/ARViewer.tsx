/**
 * ARViewer.tsx — TableX WebXR Augmented Reality
 * Uses @google/model-viewer web component.
 * Places a REAL photorealistic 3D dish on the customer's actual table.
 * Works on iPhone (Quick Look) and Android (Scene Viewer / WebXR).
 * NO APP DOWNLOAD NEEDED.
 */

'use client'
import { useEffect, useRef, useState } from 'react'

// Tell TypeScript about the <model-viewer> custom element
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src             ?: string
        alt             ?: string
        ar              ?: boolean | ''
        'ar-modes'      ?: string
        'ar-scale'      ?: string
        'ar-placement'  ?: string
        'camera-controls'   ?: boolean | ''
        'auto-rotate'       ?: boolean | ''
        'auto-rotate-delay' ?: number
        'rotation-per-second'?: string
        'shadow-intensity'  ?: string
        'shadow-softness'   ?: string
        'environment-image' ?: string
        exposure            ?: string
        reveal              ?: string
        loading             ?: string
        poster              ?: string
        style               ?: React.CSSProperties
      }
    }
  }
}

interface ARViewerProps {
  modelUrl     : string
  dishName     : string
  lang         : 'ar' | 'en'
  primaryColor : string
}

export function ARViewer({ modelUrl, dishName, lang, primaryColor }: ARViewerProps) {
  const viewerRef   = useRef<HTMLElement & { activateAR?: () => void }>(null)
  const [arStatus, setArStatus] = useState<'idle' | 'active' | 'ended'>('idle')
  const [mvLoaded, setMvLoaded] = useState(false)
  const isAr = lang === 'ar'

  // Load model-viewer script once
  useEffect(() => {
    if (document.querySelector('script[data-mv]')) { setMvLoaded(true); return }
    const s       = document.createElement('script')
    s.type        = 'module'
    s.dataset.mv  = '1'
    s.src         = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js'
    s.onload      = () => setMvLoaded(true)
    document.head.appendChild(s)
  }, [])

  // Listen for AR session events
  useEffect(() => {
    const el = viewerRef.current
    if (!el) return

    const onStatus = (e: Event) => {
      const status = (e as CustomEvent).detail?.status as string
      if (status === 'session-started') setArStatus('active')
      if (status === 'session-ended')   setArStatus('ended')
    }

    el.addEventListener('ar-status', onStatus)
    return () => el.removeEventListener('ar-status', onStatus)
  }, [mvLoaded])

  const launchAR = () => {
    viewerRef.current?.activateAR?.()
  }

  return (
    <div className="relative w-full h-full flex flex-col" dir={isAr ? 'rtl' : 'ltr'}>

      {/* model-viewer — handles ALL AR modes automatically:
          - iOS: opens AR Quick Look natively
          - Android: uses Scene Viewer or WebXR
          - Desktop: shows 3D + AR button
      */}
      {mvLoaded && (
        <model-viewer
          ref={viewerRef as any}
          src={modelUrl}
          alt={dishName}
          ar
          ar-modes="webxr scene-viewer quick-look"
          ar-scale="auto"
          ar-placement="floor"
          camera-controls
          auto-rotate
          auto-rotate-delay={800}
          rotation-per-second="25deg"
          shadow-intensity="1.2"
          shadow-softness="0.9"
          environment-image="neutral"
          exposure="1.3"
          reveal="auto"
          loading="eager"
          style={{
            width : '100%',
            height: '100%',
            minHeight: '400px',
            backgroundColor: '#07070a',
          }}
        />
      )}

      {/* Loading spinner before script ready */}
      {!mvLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* ── AR status badge ──────────────────────────────────────── */}
      {arStatus === 'active' && (
        <div
          className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-xs font-bold animate-pulse"
          style={{ background: '#00ff9640', color: '#00ff96', border: '1px solid #00ff9660' }}
        >
          {isAr ? '● AR مفعّل — وجّه الكاميرا للطاولة' : '● AR Active — Point at your table'}
        </div>
      )}

      {/* ── Big AR launch button ─────────────────────────────────── */}
      {mvLoaded && arStatus !== 'active' && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
          <button
            onClick={launchAR}
            className="flex items-center gap-2.5 px-7 py-3.5 rounded-2xl font-bold text-sm shadow-lg active:scale-95 transition-transform"
            style={{ background: '#00ff96', color: '#0a0a0e' }}
          >
            <span className="text-base">◎</span>
            <span>{isAr ? 'ضع الطبق على طاولتك!' : 'Place dish on your table!'}</span>
          </button>

          <p className="text-white/40 text-xs text-center px-4">
            {isAr
              ? 'اضغط الزر ثم وجّه كاميرا هاتفك نحو الطاولة'
              : 'Tap the button, then point your phone camera at the table'}
          </p>
        </div>
      )}

      {/* ── How it looks guide (first time) ─────────────────────── */}
      <div
        className="absolute top-3 right-3 flex flex-col gap-1 opacity-60"
        style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}
      >
        <span>WebXR • Quick Look</span>
        <span>iOS & Android ✓</span>
      </div>
    </div>
  )
}
