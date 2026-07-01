/**
 * ScanProgressHUD.tsx
 * 
 * واجهة المسح:
 * - دائرة تتملأ بالتدريج مع حركة الهاتف
 * - 72 شريحة تضيء واحدة تلو الأخرى
 * - مؤشر الاتجاه الحالي (خط أحمر يدور)
 * - نسبة مئوية في المنتصف
 */

import React from 'react'

interface ScanProgressHUDProps {
  progress    : number        // 0-100
  covered     : boolean[]     // 72 عنصر
  currentAlpha: number        // 0-360
  primaryColor: string
  lang        : 'ar' | 'en'
}

export function ScanProgressHUD({
  progress, covered, currentAlpha, primaryColor, lang
}: ScanProgressHUDProps) {
  const SIZE     = 220
  const CENTER   = SIZE / 2
  const R_OUTER  = 95
  const R_INNER  = 68
  const SECTORS  = 72
  const isAr     = lang === 'ar'

  // حساب نقاط كل شريحة
  const getSlicePath = (index: number): string => {
    const angleStep  = (2 * Math.PI) / SECTORS
    const startAngle = index * angleStep - Math.PI / 2
    const endAngle   = startAngle + angleStep * 0.85   // فراغ صغير بين الشرائح

    const x1 = CENTER + R_OUTER * Math.cos(startAngle)
    const y1 = CENTER + R_OUTER * Math.sin(startAngle)
    const x2 = CENTER + R_OUTER * Math.cos(endAngle)
    const y2 = CENTER + R_OUTER * Math.sin(endAngle)
    const x3 = CENTER + R_INNER * Math.cos(endAngle)
    const y3 = CENTER + R_INNER * Math.sin(endAngle)
    const x4 = CENTER + R_INNER * Math.cos(startAngle)
    const y4 = CENTER + R_INNER * Math.sin(startAngle)

    return `M ${x1} ${y1} A ${R_OUTER} ${R_OUTER} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${R_INNER} ${R_INNER} 0 0 0 ${x4} ${y4} Z`
  }

  // مؤشر الاتجاه الحالي
  const indicatorAngle = (currentAlpha - 90) * (Math.PI / 180)
  const indX = CENTER + (R_OUTER + 8) * Math.cos(indicatorAngle)
  const indY = CENTER + (R_OUTER + 8) * Math.sin(indicatorAngle)

  const isComplete = progress >= 100

  return (
    <div style={{
      display        : 'flex',
      flexDirection  : 'column',
      alignItems     : 'center',
      justifyContent : 'center',
      gap            : 16,
    }}>

      {/* الدائرة الرئيسية */}
      <div style={{ position: 'relative', width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>

          {/* الشرائح */}
          {covered.map((isCovered, i) => (
            <path
              key={i}
              d={getSlicePath(i)}
              fill={isCovered
                ? isComplete ? '#22c55e' : primaryColor
                : 'rgba(255,255,255,0.06)'}
              style={{
                transition: 'fill 0.2s ease',
                filter    : isCovered ? `drop-shadow(0 0 4px ${primaryColor}60)` : 'none',
              }}
            />
          ))}

          {/* دائرة داخلية */}
          <circle
            cx={CENTER} cy={CENTER} r={R_INNER - 4}
            fill="rgba(0,0,0,0.7)"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="0.5"
          />

          {/* مؤشر الاتجاه الحالي */}
          {!isComplete && (
            <circle
              cx={indX} cy={indY} r={5}
              fill={primaryColor}
              style={{ filter: `drop-shadow(0 0 6px ${primaryColor})` }}
            />
          )}

          {/* علامة الاكتمال */}
          {isComplete && (
            <text
              x={CENTER} y={CENTER + 12}
              textAnchor="middle"
              fontSize="32"
              fill="#22c55e"
            >✓</text>
          )}
        </svg>

        {/* النسبة المئوية في المنتصف */}
        <div style={{
          position      : 'absolute',
          inset         : 0,
          display       : 'flex',
          flexDirection : 'column',
          alignItems    : 'center',
          justifyContent: 'center',
          pointerEvents : 'none',
        }}>
          {!isComplete && (
            <>
              <span style={{
                fontSize  : 28,
                fontWeight: 700,
                color     : 'white',
                lineHeight: 1,
                fontFamily: 'Space Grotesk, monospace',
              }}>
                {progress}%
              </span>
              <span style={{
                fontSize: 11,
                color   : 'rgba(255,255,255,0.5)',
                marginTop: 2,
              }}>
                {isAr ? 'الأمام' : 'front'}
              </span>
            </>
          )}
          {isComplete && (
            <span style={{
              fontSize  : 13,
              fontWeight: 600,
              color     : '#22c55e',
              marginTop : 36,
            }}>
              {isAr ? 'اكتمل!' : 'Done!'}
            </span>
          )}
        </div>
      </div>

      {/* تعليمات */}
      <div style={{
        background   : 'rgba(0,0,0,0.6)',
        borderRadius : 24,
        padding      : '10px 20px',
        display      : 'flex',
        alignItems   : 'center',
        gap          : 8,
      }}>
        <span style={{
          width: 8, height: 8, borderRadius: '50%',
          background: isComplete ? '#22c55e' : primaryColor,
          boxShadow : `0 0 8px ${isComplete ? '#22c55e' : primaryColor}`,
          flexShrink: 0,
        }} />
        <span style={{ color: 'white', fontSize: 13, fontWeight: 500 }}>
          {isComplete
            ? (isAr ? 'اضغط على الطاولة لوضع الطبق' : 'Tap the table to place the dish')
            : (isAr ? 'استمر في الدوران...' : 'Keep rotating...')}
        </span>
      </div>

      {/* تلميح الاتجاهات */}
      {!isComplete && (
        <div style={{
          display: 'flex', gap: 12,
          color  : 'rgba(255,255,255,0.35)',
          fontSize: 11,
        }}>
          <span>← {isAr ? 'يسار' : 'left'}</span>
          <span>↑ {isAr ? 'فوق' : 'up'}</span>
          <span>↓ {isAr ? 'تحت' : 'down'}</span>
          <span>{isAr ? 'يمين' : 'right'} →</span>
        </div>
      )}
    </div>
  )
}
