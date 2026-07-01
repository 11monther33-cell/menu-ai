/**
 * ARExperience.tsx
 * 
 * يدير 3 مراحل:
 * PERMISSION → SCANNING → PLACEMENT → VIEWING
 */

import React, { useState, useRef, useEffect, useCallback, lazy, Suspense } from 'react'
import { useGyroscopeScan } from '../../hooks/useGyroscopeScan'
import { ScanProgressHUD }  from './ScanProgressHUD'

// Three.js AR viewer — lazy loaded for Vite (client only)
const WebXRViewer = lazy(() => import('./WebXRViewer'))

type Phase = 'PERMISSION' | 'SCANNING' | 'PLACEMENT' | 'VIEWING'

interface ARExperienceProps {
  modelUrl     : string
  dishName     : string
  price        : string
  primaryColor : string
  lang         : 'ar' | 'en'
  onClose      : () => void
}

export default function ARExperience({
  modelUrl, dishName, price, primaryColor, lang, onClose
}: ARExperienceProps) {
  const [phase, setPhase]               = useState<Phase>('PERMISSION')
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const isAr     = lang === 'ar'

  const { state: scan, requestPermission, startTracking, stopTracking, reset } =
    useGyroscopeScan()

  // ── مرحلة 1: طلب الأذونات ────────────────────────────────────────
  const handleStart = useCallback(async () => {
    try {
      // 1. إذن الكاميرا
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode  : 'environment',    // كاميرا الخلف
          width       : { ideal: 1920 },
          height      : { ideal: 1080 },
        },
        audio: false,
      })
      setCameraStream(stream)

      // 2. إذن الجيروسكوب (iOS يحتاجه)
      const gyroOk = await requestPermission()
      if (!gyroOk) {
        alert(isAr
          ? 'يحتاج الإذن للجيروسكوب لتتبع الحركة'
          : 'Gyroscope permission required for motion tracking')
        return
      }

      setPhase('SCANNING')
    } catch (e) {
      console.error('[AR] Permission error:', e)
    }
  }, [requestPermission, isAr])

  // ── مرحلة 2: بدء المسح بعد فتح الكاميرا ─────────────────────────
  useEffect(() => {
    if (phase !== 'SCANNING' || !cameraStream) return

    // أظهر الكاميرا كخلفية
    if (videoRef.current) {
      videoRef.current.srcObject = cameraStream
      videoRef.current.play().catch(() => {})
    }

    startTracking()
    return () => stopTracking()
  }, [phase, cameraStream, startTracking, stopTracking])

  // ── انتهاء المسح ──────────────────────────────────────────────────
  useEffect(() => {
    if (scan.isComplete && phase === 'SCANNING') {
      stopTracking()
      // انتظر ثانية ثم انتقل للوضع
      setTimeout(() => setPhase('PLACEMENT'), 1200)
    }
  }, [scan.isComplete, phase, stopTracking])

  // ── تنظيف ─────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      cameraStream?.getTracks().forEach(t => t.stop())
      stopTracking()
    }
  }, [cameraStream, stopTracking])

  // ──────────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────────

  return (
    <div style={{
      position  : 'fixed',
      inset     : 0,
      zIndex    : 9999,
      background: '#000',
      overflow  : 'hidden',
      direction : isAr ? 'rtl' : 'ltr',
      fontFamily: isAr ? 'Cairo, sans-serif' : 'Space Grotesk, sans-serif',
    }}>

      {/* ── شاشة الإذن ─────────────────────────────────────────── */}
      {phase === 'PERMISSION' && (
        <PermissionScreen
          isAr={isAr}
          primaryColor={primaryColor}
          onStart={handleStart}
          onClose={onClose}
        />
      )}

      {/* ── شاشة المسح ─────────────────────────────────────────── */}
      {(phase === 'SCANNING' || (phase === 'PLACEMENT' && scan.isComplete)) && (
        <>
          {/* خلفية الكاميرا */}
          <video
            ref={videoRef}
            style={{
              position : 'absolute',
              inset    : 0,
              width    : '100%',
              height   : '100%',
              objectFit: 'cover',
            }}
            muted playsInline autoPlay
          />

          {/* طبقة تعتيم */}
          <div style={{
            position  : 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.45)',
          }} />

          {/* زر الإغلاق */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 16, right: 16,
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(0,0,0,0.5)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'white', cursor: 'pointer', fontSize: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >✕</button>

          {/* عنوان الطبق */}
          <div style={{
            position: 'absolute', top: 16, left: 16,
            background: 'rgba(0,0,0,0.5)',
            borderRadius: 12, padding: '8px 14px',
          }}>
            <p style={{ color: 'white', fontWeight: 600, fontSize: 13, margin: 0 }}>
              {dishName}
            </p>
            <p style={{ color: primaryColor, fontWeight: 700, fontSize: 13, margin: 0 }}>
              {price}
            </p>
          </div>

          {/* واجهة المسح — وسط الشاشة */}
          <div style={{
            position       : 'absolute', inset: 0,
            display        : 'flex',
            alignItems     : 'center',
            justifyContent : 'center',
            flexDirection  : 'column',
          }}>
            <ScanProgressHUD
              progress     ={scan.progress}
              covered      ={scan.covered}
              currentAlpha ={scan.currentAlpha}
              primaryColor ={primaryColor}
              lang         ={lang}
            />
          </div>

          {/* تأثير اكتمال المسح */}
          {scan.isComplete && (
            <div style={{
              position: 'absolute', inset: 0,
              background: `${primaryColor}15`,
              animation : 'pulse 0.5s ease-out',
              pointerEvents: 'none',
            }} />
          )}
        </>
      )}

      {/* ── مرحلة الوضع والمشاهدة — WebXR ─────────────────────── */}
      {phase === 'PLACEMENT' && !scan.isComplete && null}
      {phase === 'PLACEMENT' && scan.isComplete && (
        <Suspense fallback={
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.8)'
          }}>
            <div style={{
              width: 40, height: 40,
              border: '3px solid rgba(255,255,255,0.2)',
              borderTopColor: primaryColor,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <style>{`
              @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>
          </div>
        }>
          <WebXRViewer
            modelUrl     ={modelUrl}
            dishName     ={dishName}
            price        ={price}
            primaryColor ={primaryColor}
            lang         ={lang}
            onClose      ={onClose}
          />
        </Suspense>
      )}

      <style>{`
        @keyframes pulse {
          0%   { opacity: 0 }
          50%  { opacity: 1 }
          100% { opacity: 0 }
        }
      `}</style>
    </div>
  )
}

// ── شاشة طلب الأذونات ─────────────────────────────────────────────
function PermissionScreen({ isAr, primaryColor, onStart, onClose }: {
  isAr: boolean; primaryColor: string
  onStart: () => void; onClose: () => void
}) {
  return (
    <div style={{
      display       : 'flex',
      flexDirection : 'column',
      alignItems    : 'center',
      justifyContent: 'center',
      height        : '100%',
      padding       : '0 32px',
      gap           : 20,
      textAlign     : 'center',
    }}>

      {/* أيقونة */}
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background : `${primaryColor}20`,
        border     : `2px solid ${primaryColor}40`,
        display    : 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize   : 36,
      }}>
        📷
      </div>

      <div>
        <h2 style={{ color: 'white', fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>
          {isAr ? 'تجربة AR ثلاثية الأبعاد' : '3D AR Experience'}
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, lineHeight: 1.7, margin: 0 }}>
          {isAr
            ? 'سيطلب التطبيق إذن الكاميرا والجيروسكوب لبناء خريطة الغرفة ووضع الطبق على طاولتك'
            : 'The app needs camera and gyroscope permission to map the room and place the dish on your table'}
        </p>
      </div>

      {/* خطوات */}
      {[
        { n: 1, ar: 'أعطِ إذن الكاميرا والجيروسكوب', en: 'Grant camera & gyroscope permission' },
        { n: 2, ar: 'دوّر هاتفك 360° لمسح الغرفة',   en: 'Rotate phone 360° to scan the room'  },
        { n: 3, ar: 'اضغط على الطاولة لوضع الطبق',   en: 'Tap the table to place the dish'     },
        { n: 4, ar: 'امشِ حول الطبق وشوفه من كل الجهات', en: 'Walk around and view from all sides'},
      ].map(step => (
        <div key={step.n} style={{
          display: 'flex', alignItems: 'flex-start', gap: 10,
          textAlign: isAr ? 'right' : 'left', width: '100%',
        }}>
          <div style={{
            width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
            background: primaryColor, color: '#0a0a0e',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700,
          }}>{step.n}</div>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
            {isAr ? step.ar : step.en}
          </span>
        </div>
      ))}

      {/* أزرار */}
      <button
        onClick={onStart}
        style={{
          width: '100%', padding: '14px 0',
          borderRadius: 16, border: 'none',
          background: primaryColor, color: '#0a0a0e',
          fontSize: 15, fontWeight: 700, cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        {isAr ? 'ابدأ المسح AR ◎' : 'Start AR Scan ◎'}
      </button>

      <button
        onClick={onClose}
        style={{
          background: 'transparent', border: 'none',
          color: 'rgba(255,255,255,0.4)', fontSize: 13,
          cursor: 'pointer', fontFamily: 'inherit',
        }}
      >
        {isAr ? 'إلغاء' : 'Cancel'}
      </button>
    </div>
  )
}
