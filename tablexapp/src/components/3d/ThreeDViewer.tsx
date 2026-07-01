/**
 * ThreeDViewer.tsx — TableX Full-Screen 3D + AR Viewer
 * Web-only. No app. Works on iPhone & Android via browser.
 *
 * Modes:
 *  rotate → OrbitControls drag to spin, pinch to zoom
 *  xray   → wireframe skeleton view
 *  ar     → model-viewer WebXR: dish placed on real table
 *  snap   → captures Three.js frame → 9:16 Snap card
 */

'use client'
import { useRef, useState, useCallback, useEffect } from 'react'
import { useThreeEngine, type ViewerMode } from '@/hooks/useThreeEngine'
import { ARViewer } from './ARViewer'
import { buildSnapCard } from '@/lib/snapCard'

interface ThreeDViewerProps {
  modelUrl     : string
  dishName     : string
  dishNameAr   : string
  price        : string
  primaryColor : string
  lang         : 'ar' | 'en'
  onClose      : () => void
  onOrderAdd   : () => void
}

type UIMode = ViewerMode | 'snap'

const MODES: { id: UIMode; ar: string; en: string; icon: string }[] = [
  { id: 'rotate', ar: 'تدوير',       en: 'Rotate',    icon: '⟳' },
  { id: 'xray',   ar: 'X-Ray',       en: 'X-Ray',     icon: '◈' },
  { id: 'ar',     ar: 'AR طاولة',    en: 'AR Table',  icon: '◎' },
  { id: 'snap',   ar: 'صوّر وشارك',  en: 'Snap',      icon: '📸' },
]

export default function ThreeDViewer({
  modelUrl, dishName, dishNameAr, price, primaryColor, lang, onClose, onOrderAdd,
}: ThreeDViewerProps) {
  const canvasRef     = useRef<HTMLCanvasElement>(null)
  const [loading, setLoading]       = useState(true)
  const [progress, setProgress]     = useState(0)
  const [mode, setModeState]        = useState<UIMode>('rotate')
  const [showAR, setShowAR]         = useState(false)
  const [snapping, setSnapping]     = useState(false)
  const [snapDone, setSnapDone]     = useState(false)
  const [error, setError]           = useState('')

  const isAr = lang === 'ar'
  const name = isAr ? dishNameAr : dishName

  const engine = useThreeEngine({
    canvasRef,
    modelUrl,
    primaryColor,
    onLoad     : () => setLoading(false),
    onProgress : (p) => setProgress(p),
    onError    : (e) => setError(e),
  })

  // Track AR view in backend (non-blocking)
  const trackAR = useCallback(() => {
    const dishId = modelUrl.split('/').slice(-2, -1)[0]
    fetch(`/api/menu/dish/${dishId}/ar-view`, { method: 'POST' }).catch(() => {})
  }, [modelUrl])

  const handleModeChange = useCallback((m: UIMode) => {
    if (m === 'snap') {
      handleSnap()
      return
    }

    setModeState(m)

    if (m === 'ar') {
      setShowAR(true)
      trackAR()
    } else {
      setShowAR(false)
      engine.setMode(m as ViewerMode)
    }
  }, [engine, trackAR])

  const handleSnap = useCallback(async () => {
    if (snapping) return
    setSnapping(true)

    try {
      const dishFrame = engine.captureFrame()
      const cardBlob  = await buildSnapCard({
        dishFrame,
        dishName    : name,
        price,
        primaryColor,
      })

      const file = new File([cardBlob], `${name}.png`, { type: 'image/png' })

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: name, text: `${name} — ${price}` })
      } else {
        // Fallback: download
        const url = URL.createObjectURL(cardBlob)
        const a   = document.createElement('a')
        a.href    = url
        a.download = `tablexapp-${name}.png`
        a.click()
        URL.revokeObjectURL(url)
      }

      setSnapDone(true)
      setTimeout(() => setSnapDone(false), 2500)
    } catch (e) {
      console.error('Snap error:', e)
    } finally {
      setSnapping(false)
    }
  }, [snapping, engine, name, price, primaryColor])

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col select-none"
      style={{ backgroundColor: '#07070a', fontFamily: isAr ? 'Cairo, sans-serif' : 'Space Grotesk, sans-serif' }}
      dir={isAr ? 'rtl' : 'ltr'}
    >

      {/* ── TOP BAR ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 shrink-0">
        <div className="flex flex-col">
          <span className="text-white font-semibold text-sm leading-tight">{name}</span>
          <span className="text-sm font-bold" style={{ color: primaryColor }}>{price}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode badge */}
          <span
            className="text-xs px-2.5 py-1 rounded-full border font-mono"
            style={{ borderColor: primaryColor + '60', color: primaryColor }}
          >
            {mode.toUpperCase()}
          </span>

          {/* Close */}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white border border-white/10 hover:border-white/30 transition-colors"
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

        {/* AR viewer */}
        {showAR && (
          <ARViewer modelUrl={modelUrl} dishName={name} lang={lang} primaryColor={primaryColor} />
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
              {isAr ? 'جاري تحميل النموذج ثلاثي الأبعاد…' : 'Loading 3D model…'}
            </p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <span className="text-4xl">⚠️</span>
            <p className="text-white font-semibold">{isAr ? 'تعذّر تحميل النموذج' : 'Failed to load model'}</p>
            <p className="text-white/40 text-sm">{error}</p>
            <button
              onClick={() => { setError(''); setLoading(true); setProgress(0) }}
              className="mt-2 px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ backgroundColor: primaryColor, color: '#0a0a0e' }}
            >
              {isAr ? 'إعادة المحاولة' : 'Retry'}
            </button>
          </div>
        )}

        {/* Rotate hint */}
        {!loading && !showAR && mode === 'rotate' && (
          <div
            className="absolute bottom-5 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full text-xs backdrop-blur-sm pointer-events-none"
            style={{ background: 'rgba(0,0,0,0.55)', color: 'rgba(255,255,255,0.55)' }}
          >
            {isAr ? 'اسحب لتدوير الطبق • اضغط مرتين للتكبير' : 'Drag to rotate • Double-tap to zoom'}
          </div>
        )}

        {/* Snap success flash */}
        {snapDone && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="px-6 py-5 rounded-2xl text-center" style={{ background: primaryColor }}>
              <div className="text-3xl mb-1">📸</div>
              <p className="font-bold text-sm" style={{ color: '#0a0a0e' }}>
                {isAr ? 'تم الحفظ!' : 'Saved!'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── MODE CONTROLS ────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-white/8 px-4 pt-3 pb-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {MODES.map(m => {
            const active = m.id !== 'snap' && mode === m.id
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
                <span>{isAr ? m.ar : m.en}</span>
              </button>
            )
          })}
        </div>

        {/* Add to order */}
        <button
          onClick={onOrderAdd}
          className="mt-3 w-full py-3.5 rounded-2xl font-bold text-sm active:scale-98 transition-transform"
          style={{ backgroundColor: primaryColor, color: '#0a0a0e' }}
        >
          {isAr ? '+ أضف للطلب' : '+ Add to Order'}
        </button>
      </div>
    </div>
  )
}
