/**
 * ThreeDModal.tsx — VISIONO Full-Screen 3D Modal
 * Vite/React compatible (uses React.lazy instead of next/dynamic).
 * Wraps DishViewer3D in a full-screen overlay with mode controls.
 */

import { useState, lazy, Suspense } from 'react'

// React.lazy for code-splitting (Vite-compatible, no SSR concerns)
const DishViewer3D = lazy(() => import('./DishViewer3D'))

interface ThreeDModalProps {
  modelUrl     : string | null
  dishName     : string
  price        : string
  primaryColor : string
  lang         : 'ar' | 'en'
  onClose      : () => void
}

export default function ThreeDModal({
  modelUrl, dishName, price, primaryColor, lang, onClose
}: ThreeDModalProps) {
  const [mode, setMode] = useState<'rotate'|'xray'|'ar'>('rotate')
  const isAr = lang === 'ar'

  return (
    <div
      style={{
        position : 'fixed',
        inset    : 0,
        zIndex   : 9999,
        background: '#07070a',
        display  : 'flex',
        flexDirection: 'column',
        fontFamily: isAr ? 'Cairo, sans-serif' : 'Space Grotesk, sans-serif',
        direction: isAr ? 'rtl' : 'ltr',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '0.5px solid rgba(255,255,255,0.08)',
      }}>
        <div>
          <p style={{ color: 'white', fontWeight: 600, fontSize: 14, margin: 0 }}>{dishName}</p>
          <p style={{ color: primaryColor, fontWeight: 700, fontSize: 14, margin: 0 }}>{price}</p>
        </div>
        <button
          onClick={onClose}
          style={{
            width: 32, height: 32, borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.15)',
            background: 'transparent', color: 'rgba(255,255,255,0.6)',
            cursor: 'pointer', fontSize: 14,
          }}
        >✕</button>
      </div>

      {/* Viewer */}
      <div style={{ flex: 1, padding: '12px 12px 0' }}>
        <Suspense fallback={
          <div style={{
            width: '100%', height: 400, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            background: '#0a0a0e', borderRadius: 12,
          }}>
            <div style={{
              width: 32, height: 32,
              border: '3px solid rgba(255,255,255,0.1)',
              borderTopColor: primaryColor,
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        }>
          <DishViewer3D
            modelUrl={modelUrl || undefined}
            primaryColor={primaryColor}
            height={400}
          />
        </Suspense>
      </div>

      {/* Mode Controls */}
      <div style={{ padding: '12px 16px 24px' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {[
            { id: 'rotate', ar: '⟳ تدوير',     en: '⟳ Rotate' },
            { id: 'xray',   ar: '◈ X-Ray',      en: '◈ X-Ray'  },
            { id: 'ar',     ar: '◎ AR طاولة',   en: '◎ AR Table' },
          ].map(m => (
            <button
              key={m.id}
              onClick={() => setMode(m.id as any)}
              style={{
                flex: 1, padding: '10px 4px',
                borderRadius: 12, border: 'none',
                fontFamily: 'inherit', fontSize: 12, fontWeight: 600,
                cursor: 'pointer', transition: 'all .15s',
                background: mode === m.id ? primaryColor : 'rgba(255,255,255,0.07)',
                color     : mode === m.id ? '#0a0a0e'    : 'rgba(255,255,255,0.6)',
              }}
            >
              {isAr ? m.ar : m.en}
            </button>
          ))}
        </div>

        {/* AR notice */}
        {mode === 'ar' && (
          <div style={{
            padding: '10px 14px', borderRadius: 10,
            background: 'rgba(255,255,255,0.05)',
            color: 'rgba(255,255,255,0.5)', fontSize: 12, textAlign: 'center',
          }}>
            {isAr
              ? '◎ تجربة AR تحتاج هاتف حقيقي مع HTTPS — تعمل عند النشر'
              : '◎ AR requires real device + HTTPS — works when deployed'}
          </div>
        )}
      </div>
    </div>
  )
}
