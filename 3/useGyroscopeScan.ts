/**
 * useGyroscopeScan.ts
 * 
 * يتتبع دوران الهاتف 360° عبر DeviceOrientationEvent
 * يقسم الدائرة إلى 72 قطاع (كل قطاع 5 درجات)
 * عندما تكتمل كل القطاعات = 100% مسح
 */

import { useRef, useState, useCallback } from 'react'

const SECTORS        = 72                    // 72 × 5° = 360°
const MIN_COVERAGE   = 60                    // 60 قطاع = 300 درجة = كافي
const SMOOTHING      = 3                     // يملأ 3 قطاعات مجاورة في كل قراءة

export interface ScanState {
  progress    : number                       // 0-100
  covered     : boolean[]                   // 72 عنصر
  isComplete  : boolean
  currentAlpha: number                       // الاتجاه الحالي 0-360
  hasPermission: boolean | null             // null = لم يسأل بعد
}

export function useGyroscopeScan() {
  const sectorsRef  = useRef<boolean[]>(new Array(SECTORS).fill(false))
  const lastAlpha   = useRef<number | null>(null)
  const [state, setState] = useState<ScanState>({
    progress    : 0,
    covered     : new Array(SECTORS).fill(false),
    isComplete  : false,
    currentAlpha: 0,
    hasPermission: null,
  })

  // ── طلب إذن iOS 13+ ─────────────────────────────────────────────
  const requestPermission = useCallback(async (): Promise<boolean> => {
    // iOS يحتاج طلب صريح
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const result = await (DeviceOrientationEvent as any).requestPermission()
        const granted = result === 'granted'
        setState(s => ({ ...s, hasPermission: granted }))
        return granted
      } catch {
        setState(s => ({ ...s, hasPermission: false }))
        return false
      }
    }

    // Android — لا يحتاج إذن
    setState(s => ({ ...s, hasPermission: true }))
    return true
  }, [])

  // ── معالجة قراءة الجيروسكوب ─────────────────────────────────────
  const handleOrientation = useCallback((event: DeviceOrientationEvent) => {
    const alpha = event.alpha   // 0-360 — الاتجاه البوصلي
    if (alpha === null) return

    // حساب القطاع الحالي
    const sectorIndex = Math.floor(alpha / (360 / SECTORS)) % SECTORS
    
    // ملء القطاع الحالي + المجاورين للتخفيف من الخطأ
    for (let i = -SMOOTHING; i <= SMOOTHING; i++) {
      const idx = ((sectorIndex + i) % SECTORS + SECTORS) % SECTORS
      sectorsRef.current[idx] = true
    }

    // حساب نسبة التغطية
    const coveredCount = sectorsRef.current.filter(Boolean).length
    const progress     = Math.min(100, Math.round((coveredCount / MIN_COVERAGE) * 100))
    const isComplete   = coveredCount >= MIN_COVERAGE

    setState({
      progress,
      covered     : [...sectorsRef.current],
      isComplete,
      currentAlpha: alpha,
      hasPermission: true,
    })

    lastAlpha.current = alpha
  }, [])

  // ── بدء وإيقاف التتبع ────────────────────────────────────────────
  const startTracking = useCallback(() => {
    window.addEventListener('deviceorientation', handleOrientation, true)
  }, [handleOrientation])

  const stopTracking = useCallback(() => {
    window.removeEventListener('deviceorientation', handleOrientation, true)
  }, [handleOrientation])

  const reset = useCallback(() => {
    sectorsRef.current = new Array(SECTORS).fill(false)
    setState({
      progress: 0, covered: new Array(SECTORS).fill(false),
      isComplete: false, currentAlpha: 0, hasPermission: true,
    })
  }, [])

  return { state, requestPermission, startTracking, stopTracking, reset }
}
