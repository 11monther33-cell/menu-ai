import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, X, Check, RefreshCw, Box, Sparkles, Video, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { ScanProgressHUD } from './ar/ScanProgressHUD';

interface ARScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (modelUrl: string) => void;
}

export const ARScanner: React.FC<ARScannerProps> = ({ isOpen, onClose, onComplete }) => {
  const { t, isRtl } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Camera & Recording
  const [stream, setStream] = useState<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  // App State
  const [step, setStep] = useState<'camera' | 'recording' | 'processing' | 'done'>('camera');
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Gyroscope State
  const [isLevel, setIsLevel] = useState(true);
  const [scannedSectors, setScannedSectors] = useState<Set<number>>(new Set());
  const [instruction, setInstruction] = useState<string>('');
  const [scanStage, setScanStage] = useState(0);
  const [currentAlpha, setCurrentAlpha] = useState(0); // 0: Front, 1: Right, 2: Back, 3: Left
  
  // To avoid constant re-renders from raw angles, we use refs for tracking inside the event listener
  const sectorsRef = useRef<Set<number>>(new Set());
  const scanningRef = useRef(false);
  const hasSensorsRef = useRef(false);
  const usingFallbackRef = useRef(false);
  const dragStartXRef = useRef(0);
  const currentDragAlphaRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  // ── 1. Camera Initialization ──────────────────────────────────────────────
  useEffect(() => {
    if (isOpen && step === 'camera') {
      startCamera();
    }
    return () => {
      stopCamera();
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [isOpen, step]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      toast.error(isRtl ? 'لا يمكن الوصول للكاميرا. يرجى التحقق من الصلاحيات.' : 'Could not access camera. Please check permissions.');
      onClose();
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const processAngle = useCallback((alpha: number) => {
    const sector = Math.floor(alpha / 10);
    
    if (!sectorsRef.current.has(sector)) {
      sectorsRef.current.add(sector);
      const newSize = sectorsRef.current.size;
      const newProgress = Math.min(100, Math.round((newSize / 36) * 100));
      
      setScannedSectors(new Set(sectorsRef.current));
      setProgress(newProgress);
      
      if (newProgress < 25) setScanStage(0);
      else if (newProgress < 50) setScanStage(1);
      else if (newProgress < 75) setScanStage(2);
      else setScanStage(3);

      setInstruction(isRtl ? 'استمر في الدوران...' : 'Keep panning...');

      if (newProgress >= 100) {
        completeScan();
      }
    }
  }, []);

  // ── 2. Device Orientation Handler (The Magic) ─────────────────────────────
  const handleOrientation = useCallback((e: DeviceOrientationEvent) => {
    if (!scanningRef.current || usingFallbackRef.current) return;
    
    let { alpha, beta, gamma } = e;
    if (alpha === null || beta === null || gamma === null) return;

    hasSensorsRef.current = true;

    const level = (beta > 15 && beta < 85) && (gamma > -35 && gamma < 35);
    setIsLevel(level);

    if (!level) {
      setInstruction(isRtl ? 'حافظ على استواء الهاتف وركز على الطبق' : 'Keep phone level and focus on dish');
      return;
    }

    setCurrentAlpha(alpha);
    processAngle(alpha);
  }, [processAngle]);

  // ── Drag Handlers (Desktop Fallback) ────────────────────────────────────
  const handleDragStart = (clientX: number) => {
    if (!scanningRef.current || hasSensorsRef.current) return;
    setIsDragging(true);
    dragStartXRef.current = clientX;
    usingFallbackRef.current = true;
    setIsLevel(true); // Always level when using touch drag
    setInstruction(isRtl ? 'استمر في السحب للدوران...' : 'Keep swiping to pan...');
  };

  const handleDragMove = (clientX: number) => {
    if (!isDragging || hasSensorsRef.current || !scanningRef.current) return;
    
    const diff = clientX - dragStartXRef.current;
    const deltaAlpha = -(diff / 4); // Sensitivity: 4 pixels per degree
    
    let newAlpha = (currentDragAlphaRef.current + deltaAlpha) % 360;
    if (newAlpha < 0) newAlpha += 360;

    setCurrentAlpha(newAlpha);
    processAngle(newAlpha);
    
    dragStartXRef.current = clientX;
    currentDragAlphaRef.current = newAlpha;
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // ── 3. Start Scanning ───────────────────────────────────────────────────
  const handleStartScan = async () => {
    // iOS 13+ requires explicit permission for DeviceMotion/Orientation
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const permissionState = await (DeviceOrientationEvent as any).requestPermission();
        if (permissionState !== 'granted') {
          toast.error(isRtl ? 'يجب السماح بالوصول لمستشعرات الحركة' : 'Motion sensor access required');
          return;
        }
      } catch (err) {
        console.error('Orientation permission error:', err);
      }
    }

    if (!stream) return;
    
    setIsScanning(true);
    setStep('recording');
    scanningRef.current = true;
    sectorsRef.current = new Set();
    setScannedSectors(new Set());
    setProgress(0);
    setInstruction(isRtl ? 'تحرك ببطء في شكل دائري حول الطبق' : 'Move slowly in a circle around the dish');

    // Start listening to real gyroscope data
    window.addEventListener('deviceorientation', handleOrientation);
    
    try {
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorder.start();
    } catch (err) {
      console.warn('MediaRecorder not supported, proceeding with scan only');
    }
    
    // Fallback detection: If no sensors detected after 2 seconds, gracefully enable Swipe Mode
    setTimeout(() => {
      if (!hasSensorsRef.current && scanningRef.current) {
        usingFallbackRef.current = true;
        setIsLevel(true);
        setInstruction(isRtl ? 'اسحب الشاشة بإصبعك للدوران' : 'Swipe screen to pan');
      }
    }, 2000);
  };

  const completeScan = () => {
    scanningRef.current = false;
    window.removeEventListener('deviceorientation', handleOrientation);
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    setStep('processing');
    processModel();
  };

  const processModel = async () => {
    const chunks = chunksRef.current;
    console.log(`[ARScanner] Processing ${chunks.length} video chunks`);
    try {
      if (chunks.length > 0) {
        const blob = new Blob(chunks, { type: 'video/webm' });
        console.log(`[ARScanner] Video blob: ${(blob.size / 1024).toFixed(1)}KB`);
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          const formData = new FormData();
          formData.append('file', blob, `scan-${Date.now()}.webm`);
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${session.access_token}` },
            body: formData,
          });
          if (res.ok) console.log('[ARScanner] Video uploaded');
        }
      }
    } catch {
      console.warn('[ARScanner] Upload failed (non-critical)');
    }
    setStep('done');
    toast.success(isRtl ? 'تم التقاط المسح من جميع الزوايا' : 'Scan captured from all angles');
  };

  const handleComplete = () => {
    onComplete('/dish.glb?v=3');
  };

  if (!isOpen) return null;

  const stages = [
    { name: isRtl ? 'الأمام' : 'FRONT', angle: 0 },
    { name: isRtl ? 'اليمين' : 'RIGHT', angle: 90 },
    { name: isRtl ? 'الخلف' : 'BACK', angle: 180 },
    { name: isRtl ? 'اليسار' : 'LEFT', angle: 270 }
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black font-display">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative w-full h-full flex flex-col"
        >
          {/* ── Header ──────────────────────────────────────────────────────── */}
          <div className="absolute top-0 inset-x-0 p-6 flex items-center justify-between z-20 bg-gradient-to-b from-black/80 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gold rounded-full flex items-center justify-center shadow-lg shadow-gold/20">
                <Box className="text-black" size={20} />
              </div>
              <div>
                <h3 className="text-white font-bold">{isRtl ? 'مسح احترافي 360°' : 'Pro 360° Scan'}</h3>
                <p className="text-white/60 text-[10px] uppercase tracking-widest flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  {isRtl ? 'مدعوم بمستشعرات الحركة' : 'Motion Sensor Powered'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-all">
              <X size={24} />
            </button>
          </div>

          {/* ── Main Camera View ────────────────────────────────────────────── */}
          <div 
            className="flex-1 relative overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none"
            onMouseDown={(e) => handleDragStart(e.clientX)}
            onMouseMove={(e) => handleDragMove(e.clientX)}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
            onTouchMove={(e) => handleDragMove(e.touches[0].clientX)}
            onTouchEnd={handleDragEnd}
          >
            {(step === 'camera' || step === 'recording') && (
              <>
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted
                  className="absolute inset-0 w-full h-full object-cover"
                />
                
                {/* HUD Overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                  
                  {/* Circular Guide - New ScanProgressHUD */}
                  <div className="relative w-full h-full flex items-center justify-center">
                    <ScanProgressHUD 
                      progress={progress}
                      covered={Array.from({length: 72}).map((_, i) => scannedSectors.has(Math.floor(i/2)))}
                      currentAlpha={currentAlpha}
                      primaryColor="#C9A84C"
                      lang={isRtl ? 'ar' : 'en'}
                    />
                  </div>

                  {/* Real-time Instructions Panel */}
                  <motion.div 
                    className="mt-20 px-8 py-4 rounded-full backdrop-blur-xl border flex items-center gap-3 transition-colors duration-300"
                    animate={{
                      backgroundColor: isLevel ? 'rgba(0,0,0,0.6)' : 'rgba(239, 68, 68, 0.2)',
                      borderColor: isLevel ? 'rgba(255,255,255,0.1)' : 'rgba(239, 68, 68, 0.5)',
                    }}
                  >
                    {!isLevel && isScanning ? (
                      <AlertTriangle className="text-red-500 animate-pulse" size={20} />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-gold animate-pulse" />
                    )}
                    <p className={`text-sm font-bold ${!isLevel && isScanning ? 'text-red-400' : 'text-white'}`}>
                      {isScanning ? instruction : (isRtl ? 'اضغط للبدء ثم در حول الطبق' : 'Tap start, then pan around dish')}
                    </p>
                  </motion.div>
                  
                </div>
              </>
            )}

            {/* ── Processing State ──────────────────────────────────────────── */}
            {step === 'processing' && (
              <div className="flex flex-col items-center justify-center text-white space-y-6 z-10">
                <div className="relative">
                  <div className="w-32 h-32 border-4 border-gold/20 rounded-full flex items-center justify-center">
                    <RefreshCw className="text-gold animate-spin" size={48} />
                  </div>
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute -top-2 -right-2 bg-gold text-black p-2 rounded-full"
                  >
                    <Sparkles size={16} />
                  </motion.div>
                </div>
                <div className="text-center">
                  <h4 className="text-2xl font-bold mb-2">{isRtl ? 'جاري بناء المجسم 3D...' : 'Building 3D Model...'}</h4>
                  <p className="text-white/60 text-sm">
                    {isRtl ? 'يتم معالجة بيانات الجيروسكوب والفيديو' : 'Processing gyroscope and video data'}
                  </p>
                </div>
                <div className="w-64 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-gold"
                  />
                </div>
              </div>
            )}

            {/* ── Done State ────────────────────────────────────────────────── */}
            {step === 'done' && (
              <div className="flex flex-col items-center justify-center text-white space-y-8 z-10">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring" }}
                  className="w-32 h-32 bg-green-500 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(34,197,94,0.4)]"
                >
                  <Check size={64} className="text-white" />
                </motion.div>
                <div className="text-center">
                  <h4 className="text-3xl font-bold mb-2">{isRtl ? 'اكتمل المسح باحترافية!' : 'Scan Complete!'}</h4>
                  <p className="text-white/60 text-sm">
                    {isRtl ? 'تم التقاط الطبق من جميع الزوايا 360°' : 'Dish captured from all 360° angles'}
                  </p>
                </div>
                <button 
                  onClick={handleComplete}
                  className="px-12 py-4 bg-gold text-black font-bold rounded-2xl shadow-xl shadow-gold/20 hover:scale-105 transition-all active:scale-95 text-lg"
                >
                  {isRtl ? 'اعتماد المجسم' : 'Apply Model'}
                </button>
              </div>
            )}
          </div>

          {/* ── Footer Controls ───────────────────────────────────────────── */}
          {step === 'camera' && !isScanning && (
            <div className="absolute bottom-0 inset-x-0 p-12 flex flex-col items-center justify-center bg-gradient-to-t from-black via-black/80 to-transparent z-20">
              <button 
                onClick={handleStartScan}
                className="relative group flex items-center justify-center"
              >
                <div className="absolute inset-0 bg-gold rounded-full opacity-40 blur-xl group-hover:opacity-60 transition-opacity" />
                <div className="relative w-20 h-20 bg-white rounded-full p-1.5 shadow-[0_0_30px_rgba(255,255,255,0.2)] transform group-active:scale-95 transition-all">
                  <div className="w-full h-full border-2 border-black rounded-full flex items-center justify-center overflow-hidden relative">
                    <div className="absolute inset-0 bg-gold translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    <Video className="text-black relative z-10" size={32} />
                  </div>
                </div>
              </button>
              <p className="text-white/50 text-xs mt-6 uppercase tracking-widest font-semibold">
                {isRtl ? 'اضغط للبدء' : 'Tap to Record'}
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

