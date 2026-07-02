/**
 * InteractiveScanner.tsx — VISIONO 3D Object Capture Scanner
 *
 * واجهة مسح تفاعلية متقدمة مبنية بـ React + Canvas:
 *   - نقاط ميزة (Feature Points) تظهر عند كل لقطة
 *   - موجات مسح (Scan Waves) دائرية تنبض من المركز
 *   - تأثير فلاش أبيض عند كل التقاط
 *   - شبكة توجيهية (Guidance Grid) لضمان التركيز
 *   - دائرة تقدم SVG متحركة
 *   - مؤشر الزاوية الحالية
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// ── Types ─────────────────────────────────────────────────────────
interface FeaturePoint {
  x: number;
  y: number;
  life: number;       // 1.0 → 0.0
  size: number;
}

interface ScanWave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
}

interface InteractiveScannerProps {
  onCapture      : () => void;
  progress       : number;       // 0 → 100
  totalCaptures  : number;
  currentCapture : number;
  isProcessing   : boolean;
  isRtl          : boolean;
  currentAngle?  : number;       // For 360 radar
  isGyroMode?    : boolean;
}

// ── Constants ─────────────────────────────────────────────────────
const ACCENT = '#00ff96';
const ACCENT_RGB = '0, 255, 150';
const POINT_COUNT = 35;
const WAVE_MAX_RADIUS = 250;

// ── Component ─────────────────────────────────────────────────────
export const InteractiveScanner: React.FC<InteractiveScannerProps> = ({
  onCapture,
  progress,
  totalCaptures,
  currentCapture,
  isProcessing,
  isRtl,
  currentAngle = 0,
  isGyroMode = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<FeaturePoint[]>([]);
  const wavesRef = useRef<ScanWave[]>([]);
  const animRef = useRef<number>(0);
  const [flash, setFlash] = useState(false);
  const [lastAngle, setLastAngle] = useState('');

  // Angle labels for guidance
  const ANGLES = [
    { ar: 'الأمام', en: 'Front' },
    { ar: 'يمين-أمام', en: 'Front-Right' },
    { ar: 'اليمين', en: 'Right' },
    { ar: 'يمين-خلف', en: 'Back-Right' },
    { ar: 'الخلف', en: 'Back' },
    { ar: 'يسار-خلف', en: 'Back-Left' },
    { ar: 'اليسار', en: 'Left' },
    { ar: 'يسار-أمام', en: 'Front-Left' },
  ];

  // ── Canvas Animation Loop ───────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      // ── Draw Feature Points ──────────────────────────────────
      for (let i = pointsRef.current.length - 1; i >= 0; i--) {
        const p = pointsRef.current[i];
        p.life -= 0.015;

        if (p.life <= 0) {
          pointsRef.current.splice(i, 1);
          continue;
        }

        const alpha = p.life;
        const sz = p.size * (1 + (1 - p.life) * 0.5);

        // Glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, sz * 3, 0, Math.PI * 2);
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, sz * 3);
        glow.addColorStop(0, `rgba(${ACCENT_RGB}, ${alpha * 0.3})`);
        glow.addColorStop(1, `rgba(${ACCENT_RGB}, 0)`);
        ctx.fillStyle = glow;
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, sz, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${ACCENT_RGB}, ${alpha})`;
        ctx.fill();
      }

      // ── Draw Scan Waves ──────────────────────────────────────
      for (let i = wavesRef.current.length - 1; i >= 0; i--) {
        const w = wavesRef.current[i];
        w.radius += 3;
        w.opacity = Math.max(0, 1 - (w.radius / w.maxRadius));

        if (w.opacity <= 0) {
          wavesRef.current.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(w.x, w.y, w.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${ACCENT_RGB}, ${w.opacity * 0.5})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // ── Draw Scanning Grid Lines (subtle) ────────────────────
      const cx = W / 2;
      const cy = H / 2;
      ctx.setLineDash([5, 15]);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 1;

      // Horizontal
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(W, cy);
      ctx.stroke();

      // Vertical
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, H);
      ctx.stroke();

      // Corner brackets
      ctx.setLineDash([]);
      ctx.strokeStyle = `rgba(${ACCENT_RGB}, 0.4)`;
      ctx.lineWidth = 2;
      const bracketSize = 30;
      const margin = 60;

      // Top-left
      drawCornerBracket(ctx, margin, margin, bracketSize, 'tl');
      // Top-right
      drawCornerBracket(ctx, W - margin, margin, bracketSize, 'tr');
      // Bottom-left
      drawCornerBracket(ctx, margin, H - margin, bracketSize, 'bl');
      // Bottom-right
      drawCornerBracket(ctx, W - margin, H - margin, bracketSize, 'br');

      animRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  // ── Capture Handler ─────────────────────────────────────────────
  const handleCapture = useCallback(() => {
    if (currentCapture >= totalCaptures || isProcessing) return;

    // Flash
    setFlash(true);
    setTimeout(() => setFlash(false), 200);

    // Set angle label
    const angleIdx = currentCapture % ANGLES.length;
    setLastAngle(isRtl ? ANGLES[angleIdx].ar : ANGLES[angleIdx].en);

    // Spawn feature points
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    for (let i = 0; i < POINT_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 40 + Math.random() * 140;
      pointsRef.current.push({
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
        life: 0.8 + Math.random() * 0.6,
        size: 1.5 + Math.random() * 2,
      });
    }

    // Spawn scan waves (2 waves with slight delay)
    wavesRef.current.push({
      x: cx, y: cy,
      radius: 20, maxRadius: WAVE_MAX_RADIUS,
      opacity: 1,
    });
    setTimeout(() => {
      wavesRef.current.push({
        x: cx, y: cy,
        radius: 10, maxRadius: WAVE_MAX_RADIUS * 0.7,
        opacity: 0.7,
      });
    }, 100);

    onCapture();
  }, [onCapture, currentCapture, totalCaptures, isProcessing, isRtl]);

  // ── Progress Ring Calculations ──────────────────────────────────
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  // Progress is now 0-100
  const dashOffset = circumference - (progress / 100) * circumference;
  const isComplete = currentCapture >= totalCaptures;

  return (
    <div className="absolute inset-0 z-20 pointer-events-none">
      {/* Canvas for effects */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

      {/* Flash Overlay */}
      <AnimatePresence>
        {flash && (
          <motion.div
            initial={{ opacity: 0.9 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 bg-white z-40 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Center Target Circle */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative">
          {/* Outer ring */}
          <div
            className="w-56 h-56 rounded-full border border-white/10"
            style={{
              boxShadow: `inset 0 0 40px rgba(${ACCENT_RGB}, 0.03), 0 0 60px rgba(${ACCENT_RGB}, 0.05)`,
            }}
          />
          {/* Crosshair center dot */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full animate-pulse"
            style={{ backgroundColor: ACCENT, boxShadow: `0 0 12px ${ACCENT}` }}
          />
        </div>
      </div>

      {/* ── Top Status Bar ─────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 pt-12 px-6 flex justify-between items-start pointer-events-none z-30">
        {/* Progress Ring (top-left) */}
        <div className="relative w-[76px] h-[76px]">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 76 76">
            <circle
              cx="38" cy="38" r={radius}
              fill="rgba(0,0,0,0.4)"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="3"
            />
            <motion.circle
              cx="38" cy="38" r={radius}
              fill="transparent"
              stroke={ACCENT}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={circumference}
              animate={{ strokeDashoffset: dashOffset }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-white font-bold text-sm">{currentCapture}</span>
            <span className="text-white/40 text-[9px]">/ {totalCaptures}</span>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex flex-col items-end gap-2">
          <div
            className="px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md border"
            style={{
              backgroundColor: 'rgba(0,0,0,0.5)',
              borderColor: isComplete ? ACCENT : 'rgba(255,255,255,0.15)',
              color: isComplete ? ACCENT : 'rgba(255,255,255,0.8)',
            }}
          >
            {isProcessing
              ? (isRtl ? '⚡ جاري التوليد...' : '⚡ Generating...')
              : isComplete
                ? (isRtl ? '✓ اكتمل المسح' : '✓ Scan Complete')
                : (isRtl ? '◉ مسح نشط' : '◉ Scanning')
            }
          </div>
          {lastAngle && !isComplete && (
            <motion.div
              key={lastAngle}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-[11px] text-white/50 font-medium"
            >
              ↳ {lastAngle}
            </motion.div>
          )}
        </div>
      </div>

      {/* ── 360 Radar Overlay (Gyro Mode) ────────────────────── */}
      {isGyroMode && !isComplete && !isProcessing && (
        <div className="absolute top-[140px] left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-30">
          <div className="relative w-24 h-24 rounded-full border border-white/20 bg-black/20 backdrop-blur-sm flex items-center justify-center">
            {/* Center dot */}
            <div className="w-2 h-2 rounded-full bg-white/50" />
            
            {/* Radar Sweep */}
            <motion.div 
              className="absolute top-1/2 left-1/2 w-[40px] h-[40px] origin-top-left"
              style={{
                background: `conic-gradient(from 0deg, transparent 0deg, rgba(${ACCENT_RGB}, 0.6) 90deg, ${ACCENT} 90deg, transparent 91deg)`,
              }}
              animate={{ rotate: currentAngle - 90 }}
              transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            />
            
            {/* Target dots on radar */}
            {Array.from({ length: totalCaptures }).map((_, i) => {
              const angle = (i * (360 / totalCaptures)) * (Math.PI / 180);
              const px = Math.cos(angle) * 40;
              const py = Math.sin(angle) * 40;
              const isCaptured = i < currentCapture;
              
              return (
                <div
                  key={i}
                  className="absolute w-1.5 h-1.5 rounded-full"
                  style={{
                    left: 48 + px - 3,
                    top: 48 + py - 3,
                    backgroundColor: isCaptured ? ACCENT : 'rgba(255,255,255,0.2)',
                    boxShadow: isCaptured ? `0 0 6px ${ACCENT}` : 'none'
                  }}
                />
              );
            })}
          </div>
          <div className="mt-2 text-[10px] font-bold tracking-wider text-white/60 bg-black/40 px-3 py-1 rounded-full">
            {isRtl ? 'دور حول الطبق 360°' : 'ROTATE 360°'}
          </div>
        </div>
      )}

      {/* ── Bottom Controls ────────────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 pb-10 flex flex-col items-center gap-5 pointer-events-auto z-30">
        {/* Instruction Text */}
        <motion.div
          key={isComplete ? 'done' : 'scanning'}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-5 py-2.5 rounded-full backdrop-blur-md text-sm font-semibold border"
          style={{
            backgroundColor: 'rgba(0,0,0,0.5)',
            borderColor: 'rgba(255,255,255,0.1)',
            color: isComplete ? ACCENT : 'rgba(255,255,255,0.85)',
          }}
        >
          {isProcessing
            ? (isRtl ? 'الذكاء الاصطناعي يبني النموذج...' : 'AI is building the model...')
            : isComplete
              ? (isRtl ? '✨ جاهز! جاري توليد النموذج...' : '✨ Ready! Generating model...')
              : (isRtl
                  ? `📷 التقط الزاوية ${currentCapture + 1} من ${totalCaptures}`
                  : `📷 Capture angle ${currentCapture + 1} of ${totalCaptures}`)
          }
        </motion.div>

        {/* Capture Button (Only if not gyro mode, or fallback) */}
        {!isComplete && !isProcessing && !isGyroMode && (
          <button
            onClick={handleCapture}
            className="relative w-20 h-20 rounded-full focus:outline-none active:scale-90 transition-transform"
          >
            {/* Outer Ring */}
            <div
              className="absolute inset-0 rounded-full border-[3px]"
              style={{ borderColor: `rgba(${ACCENT_RGB}, 0.6)` }}
            />
            {/* Inner Button */}
            <div
              className="absolute inset-[6px] rounded-full transition-colors"
              style={{ backgroundColor: 'rgba(255,255,255,0.9)' }}
            />
            {/* Pulse Animation */}
            <div
              className="absolute inset-[-4px] rounded-full animate-ping"
              style={{ backgroundColor: `rgba(${ACCENT_RGB}, 0.15)` }}
            />
          </button>
        )}

        {/* Processing Spinner */}
        {(isComplete || isProcessing) && (
          <div className="relative w-16 h-16 flex items-center justify-center">
            <div
              className="absolute inset-0 rounded-full border-2 border-transparent animate-spin"
              style={{ borderTopColor: ACCENT, borderRightColor: `rgba(${ACCENT_RGB}, 0.3)` }}
            />
            <span className="text-2xl">🧠</span>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Helper: Draw corner bracket ───────────────────────────────────
function drawCornerBracket(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  size: number,
  corner: 'tl' | 'tr' | 'bl' | 'br'
) {
  ctx.beginPath();
  switch (corner) {
    case 'tl':
      ctx.moveTo(x, y + size);
      ctx.lineTo(x, y);
      ctx.lineTo(x + size, y);
      break;
    case 'tr':
      ctx.moveTo(x - size, y);
      ctx.lineTo(x, y);
      ctx.lineTo(x, y + size);
      break;
    case 'bl':
      ctx.moveTo(x, y - size);
      ctx.lineTo(x, y);
      ctx.lineTo(x + size, y);
      break;
    case 'br':
      ctx.moveTo(x - size, y);
      ctx.lineTo(x, y);
      ctx.lineTo(x, y - size);
      break;
  }
  ctx.stroke();
}
