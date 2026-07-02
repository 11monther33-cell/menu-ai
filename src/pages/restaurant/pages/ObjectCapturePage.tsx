/**
 * ObjectCapturePage.tsx — VISIONO AR Object Capture
 *
 * صفحة التقاط ذكية تفتح كاميرا الجهاز وتوجّه المستخدم لمسح الطبق
 * ثم تولّد نموذج 3D محلياً بدون أي API خارجي.
 *
 * المراحل:
 *   intro      → شاشة ترحيب مع تعليمات
 *   scanning   → الكاميرا مفتوحة + InteractiveScanner
 *   processing → توليد النموذج محلياً
 *   preview    → معاينة النموذج + حفظ
 *   error      → معالجة الأخطاء
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../../context/LanguageContext';
import { InteractiveScanner } from '../../../components/3d/InteractiveScanner';
import { generateLocalModel } from '../../../lib/3d/localModelGenerator';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft, Camera, RotateCcw, Download,
  Check, AlertTriangle, Sparkles, X, Smartphone
} from 'lucide-react';
import { useGyroscopeScan } from '../../../hooks/useGyroscopeScan';

// ── Constants ─────────────────────────────────────────────────────
const TOTAL_CAPTURES = 8;

type Phase = 'intro' | 'scanning' | 'processing' | 'preview' | 'error';

// ── Component ─────────────────────────────────────────────────────
export const ObjectCapturePage = () => {
  const { isRtl, lang } = useLanguage();
  const navigate = useNavigate();

  // State
  const [phase, setPhase] = useState<Phase>('intro');
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [captureCount, setCaptureCount] = useState(0);
  const [genProgress, setGenProgress] = useState(0);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement>(null);

  // Gyroscope Hook
  const gyro = useGyroscopeScan(TOTAL_CAPTURES);

  // Auto-capture when gyro hits a new target
  useEffect(() => {
    if (phase === 'scanning' && gyro.capturedCount > captureCount && captureCount < TOTAL_CAPTURES) {
      capturePhoto();
    }
  }, [gyro.capturedCount, phase, captureCount]);

  // ── Camera Management ───────────────────────────────────────────
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setPhase('scanning');
      gyro.requestPermission();
    } catch (err: any) {
      console.error('Camera error:', err);
      setErrorMsg(
        isRtl
          ? 'تعذّر فتح الكاميرا. تأكد من منح الإذن.'
          : 'Could not open camera. Please grant permission.'
      );
      setPhase('error');
    }
  }, [isRtl]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (modelUrl) URL.revokeObjectURL(modelUrl);
    };
  }, [stopCamera, modelUrl]);

  // ── Capture Photo from Video ────────────────────────────────────
  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = captureCanvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    setCapturedImages(prev => [...prev, dataUrl]);
    const newCount = captureCount + 1;
    setCaptureCount(newCount);

    // Check if all captures done
    if (newCount >= TOTAL_CAPTURES) {
      // Small delay to let the last flash play
      setTimeout(() => {
        stopCamera();
        startGeneration([...capturedImages, dataUrl]);
      }, 500);
    }
  }, [captureCount, capturedImages, stopCamera]);

  // ── Local 3D Generation ─────────────────────────────────────────
  const startGeneration = useCallback(async (images: string[]) => {
    setPhase('processing');
    setGenProgress(0);

    try {
      const result = await generateLocalModel(images, (pct) => {
        setGenProgress(pct);
      });

      setModelUrl(result.blobUrl);
      setPhase('preview');
      toast.success(isRtl ? '✨ تم توليد النموذج بنجاح!' : '✨ Model generated successfully!');
    } catch (err: any) {
      console.error('Generation error:', err);
      setErrorMsg(
        isRtl
          ? 'فشل توليد النموذج. حاول مرة أخرى.'
          : 'Model generation failed. Please try again.'
      );
      setPhase('error');
    }
  }, [isRtl]);

  // ── Reset Everything ────────────────────────────────────────────
  const resetCapture = useCallback(() => {
    stopCamera();
    setCapturedImages([]);
    setCaptureCount(0);
    setGenProgress(0);
    setModelUrl(null);
    setErrorMsg('');
    setPhase('intro');
    gyro.resetScan();
  }, [stopCamera, gyro]);

  // ── Download Model ──────────────────────────────────────────────
  const downloadModel = useCallback(() => {
    if (!modelUrl) return;
    const a = document.createElement('a');
    a.href = modelUrl;
    a.download = `visiono-dish-${Date.now()}.glb`;
    a.click();
    toast.success(isRtl ? 'تم تحميل النموذج!' : 'Model downloaded!');
  }, [modelUrl, isRtl]);

  // ── Progress for InteractiveScanner ─────────────────────────────
  const scanProgress = captureCount / TOTAL_CAPTURES;

  return (
    <div className="fixed inset-0 z-50 bg-black text-white overflow-hidden" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Hidden capture canvas */}
      <canvas ref={captureCanvasRef} className="hidden" />

      <AnimatePresence mode="wait">

        {/* ═══════════════════════════════════════════════════════ */}
        {/* PHASE: INTRO                                           */}
        {/* ═══════════════════════════════════════════════════════ */}
        {phase === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center px-8 bg-gradient-to-b from-[#0a0a0e] via-[#0f0f14] to-[#0a0a0e]"
          >
            {/* Back button */}
            <button
              onClick={() => navigate(-1)}
              className="absolute top-6 left-6 flex items-center gap-2 text-white/50 hover:text-white transition-colors z-10"
            >
              <ChevronLeft size={20} className={isRtl ? 'rotate-180' : ''} />
              <span className="text-sm font-medium">{isRtl ? 'رجوع' : 'Back'}</span>
            </button>

            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="w-24 h-24 rounded-3xl flex items-center justify-center mb-8"
              style={{
                background: 'linear-gradient(135deg, rgba(0,255,150,0.15), rgba(0,255,150,0.05))',
                border: '1px solid rgba(0,255,150,0.2)',
              }}
            >
              <Camera size={40} style={{ color: '#00ff96' }} />
            </motion.div>

            {/* Title */}
            <h1 className="text-2xl font-bold mb-3 text-center">
              {isRtl ? 'مسح الطبق ثلاثي الأبعاد' : '3D Dish Scanner'}
            </h1>

            {/* Description */}
            <p className="text-white/50 text-center text-sm leading-relaxed max-w-xs mb-10">
              {isRtl
                ? `التقط ${TOTAL_CAPTURES} صور من زوايا مختلفة حول الطبق. سيقوم النظام ببناء نموذج 3D تلقائياً بدون إنترنت.`
                : `Capture ${TOTAL_CAPTURES} photos from different angles around the dish. The system will build a 3D model locally — no internet needed.`
              }
            </p>

            {/* Steps */}
            <div className="w-full max-w-xs space-y-3 mb-10">
              {[
                { icon: '📱', ar: 'اسمَح باستخدام حساس الحركة', en: 'Allow motion sensor access' },
                { icon: '🔄', ar: 'دور حول الطبق 360 درجة ببطء', en: 'Rotate slowly 360° around dish' },
                { icon: '🧠', ar: 'التوليد يتم محلياً في ثوانٍ', en: 'Generation happens locally in seconds' },
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-lg">{step.icon}</span>
                  <span className="text-sm text-white/70">{isRtl ? step.ar : step.en}</span>
                </div>
              ))}
            </div>

            {/* Start Button */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={startCamera}
              className="px-8 py-4 rounded-2xl font-bold text-base flex items-center gap-3 shadow-2xl"
              style={{
                background: 'linear-gradient(135deg, #00ff96, #00cc78)',
                color: '#0a0a0e',
                boxShadow: '0 0 40px rgba(0,255,150,0.2)',
              }}
            >
              <Camera size={20} />
              {isRtl ? 'ابدأ المسح' : 'Start Scanning'}
            </motion.button>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* PHASE: SCANNING                                        */}
        {/* ═══════════════════════════════════════════════════════ */}
        {phase === 'scanning' && (
          <motion.div
            key="scanning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
          >
            {/* Camera Video Feed */}
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Vignette overlay */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.5) 100%)',
              }}
            />

            {/* Interactive Scanner Overlay */}
            <InteractiveScanner
              onCapture={() => {
                gyro.forceCapture(); // Manually force capture if gyro not moving
                capturePhoto();
              }}
              progress={gyro.progress > 0 ? gyro.progress : scanProgress * 100}
              totalCaptures={TOTAL_CAPTURES}
              currentCapture={captureCount}
              isProcessing={false}
              isRtl={isRtl}
              isGyroMode={gyro.hasPermission}
              currentAngle={gyro.currentAngle}
            />

            {/* Close button */}
            <button
              onClick={resetCapture}
              className="absolute top-12 left-4 z-30 p-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/70 hover:text-white transition-colors"
              style={isRtl ? { right: 16, left: 'auto' } : {}}
            >
              <X size={20} />
            </button>

            {/* Thumbnails strip */}
            {capturedImages.length > 0 && (
              <div className="absolute bottom-28 left-0 right-0 z-30 px-4 pointer-events-none">
                <div className="flex gap-2 overflow-x-auto justify-center">
                  {capturedImages.slice(-5).map((img, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="w-10 h-10 rounded-lg overflow-hidden border border-white/20 flex-shrink-0"
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* PHASE: PROCESSING                                      */}
        {/* ═══════════════════════════════════════════════════════ */}
        {phase === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0e] px-8"
          >
            {/* Animated Progress Ring */}
            <div className="relative w-32 h-32 mb-8">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
                <circle cx="64" cy="64" r="56" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                <circle
                  cx="64" cy="64" r="56"
                  fill="none"
                  stroke="#00ff96"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 56}`}
                  strokeDashoffset={`${2 * Math.PI * 56 * (1 - genProgress / 100)}`}
                  style={{ transition: 'stroke-dashoffset 0.4s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-white font-bold text-2xl">{genProgress}%</span>
              </div>
            </div>

            {/* Status Text */}
            <h2 className="text-xl font-bold mb-3">
              {isRtl ? 'جاري بناء النموذج...' : 'Building 3D Model...'}
            </h2>
            <p className="text-white/40 text-sm text-center max-w-xs">
              {isRtl
                ? 'يتم معالجة الصور وبناء النموذج ثلاثي الأبعاد محلياً على جهازك'
                : 'Processing images and building the 3D model locally on your device'
              }
            </p>

            {/* Phase indicators */}
            <div className="flex gap-2 mt-8">
              {[
                { label: isRtl ? 'تحليل' : 'Analyze', threshold: 20 },
                { label: isRtl ? 'عمق' : 'Depth', threshold: 40 },
                { label: isRtl ? 'الشكل' : 'Mesh', threshold: 60 },
                { label: isRtl ? 'الملمس' : 'Texture', threshold: 80 },
                { label: isRtl ? 'تصدير' : 'Export', threshold: 95 },
              ].map((p, i) => (
                <div
                  key={i}
                  className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors"
                  style={{
                    backgroundColor: genProgress >= p.threshold ? 'rgba(0,255,150,0.15)' : 'rgba(255,255,255,0.04)',
                    color: genProgress >= p.threshold ? '#00ff96' : 'rgba(255,255,255,0.25)',
                  }}
                >
                  {p.label}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* PHASE: PREVIEW                                         */}
        {/* ═══════════════════════════════════════════════════════ */}
        {phase === 'preview' && modelUrl && (
          <motion.div
            key="preview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col bg-[#0a0a0e]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <h2 className="text-lg font-bold">{isRtl ? 'معاينة النموذج' : 'Model Preview'}</h2>
              <button
                onClick={resetCapture}
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* 3D Model Viewer */}
            <div className="flex-1 relative">
              {/* @ts-ignore — model-viewer is a web component */}
              <model-viewer
                src={modelUrl}
                auto-rotate
                camera-controls
                shadow-intensity="1"
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#0a0a0e',
                }}
              />

              {/* Success badge */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30 flex items-center gap-2">
                <Check size={14} className="text-green-400" />
                <span className="text-green-400 text-xs font-bold">
                  {isRtl ? 'تم التوليد محلياً — بدون API خارجي' : 'Generated locally — no external API'}
                </span>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-6 space-y-3 border-t border-white/5">
              <button
                onClick={downloadModel}
                className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                style={{
                  background: 'linear-gradient(135deg, #00ff96, #00cc78)',
                  color: '#0a0a0e',
                }}
              >
                <Download size={18} />
                {isRtl ? 'تحميل النموذج (.glb)' : 'Download Model (.glb)'}
              </button>

              <button
                onClick={resetCapture}
                className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition-colors"
              >
                <RotateCcw size={18} />
                {isRtl ? 'مسح طبق جديد' : 'Scan New Dish'}
              </button>
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* PHASE: ERROR                                           */}
        {/* ═══════════════════════════════════════════════════════ */}
        {phase === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center px-8 bg-[#0a0a0e]"
          >
            <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
              <AlertTriangle size={36} className="text-red-400" />
            </div>
            <h2 className="text-xl font-bold mb-3">{isRtl ? 'حدث خطأ' : 'Something went wrong'}</h2>
            <p className="text-white/40 text-sm text-center mb-8">{errorMsg}</p>
            <div className="flex gap-3">
              <button
                onClick={resetCapture}
                className="px-6 py-3 rounded-xl font-bold text-sm bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                {isRtl ? 'حاول مجدداً' : 'Try Again'}
              </button>
              <button
                onClick={() => navigate(-1)}
                className="px-6 py-3 rounded-xl font-bold text-sm text-white/50 hover:text-white transition-colors"
              >
                {isRtl ? 'رجوع' : 'Go Back'}
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};
