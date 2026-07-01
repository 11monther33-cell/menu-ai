import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

interface InteractiveScannerProps {
  onCapture: () => void;
  captureCount: number;
  totalCaptures: number;
  isCapturing: boolean;
}

/**
 * مكون الماسح الضوئي التفاعلي (Interactive 3D Scanner)
 * يعرض تأثيرات بصرية تحاكي عملية المسح الضوئي ثلاثي الأبعاد
 * 
 * المميزات:
 * - دائرة تقدم تكتمل مع كل صورة ملتقطة
 * - نقاط ميزة (Feature Points) تظهر عشوائياً على الطبق
 * - تأثيرات بصرية عند التقاط صورة (Flash، موجات)
 * - شبكة توجيهية لمساعدة المستخدم على التركيز
 */
const InteractiveScanner: React.FC<InteractiveScannerProps> = ({
  onCapture,
  captureCount,
  totalCaptures,
  isCapturing,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [featurePoints, setFeaturePoints] = useState<Array<{ x: number; y: number; opacity: number }>>([]);
  const [showFlash, setShowFlash] = useState(false);
  const [scanWaves, setScanWaves] = useState<Array<{ radius: number; opacity: number }>>([]);
  const animationFrameRef = useRef<number>();

  // حساب نسبة التقدم (0 إلى 1)
  const progress = totalCaptures > 0 ? captureCount / totalCaptures : 0;

  // توليد نقاط ميزة عشوائية عند التقاط صورة
  const generateFeaturePoints = useCallback(() => {
    const points = [];
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const radius = 150;

    // توليد 15-25 نقطة عشوائية حول الطبق
    const pointCount = Math.floor(Math.random() * 10) + 15;
    for (let i = 0; i < pointCount; i++) {
      const angle = (Math.random() * Math.PI * 2);
      const distance = Math.random() * radius;
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;
      points.push({
        x,
        y,
        opacity: Math.random() * 0.8 + 0.2,
      });
    }
    setFeaturePoints(points);

    // إضافة موجة مسح (Scan Wave)
    setScanWaves([{ radius: 0, opacity: 1 }]);
  }, []);

  // معالج التقاط الصورة
  const handleCapture = useCallback(() => {
    generateFeaturePoints();
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 200);
    onCapture();
  }, [generateFeaturePoints, onCapture]);

  // رسم العناصر على Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // تعيين حجم Canvas
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // تنظيف Canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // رسم النقاط الميزة (Feature Points)
    featurePoints.forEach((point) => {
      ctx.fillStyle = `rgba(0, 255, 150, ${point.opacity})`;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
      ctx.fill();

      // رسم دائرة حول كل نقطة
      ctx.strokeStyle = `rgba(0, 255, 150, ${point.opacity * 0.5})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 8, 0, Math.PI * 2);
      ctx.stroke();
    });

    // رسم موجات المسح (Scan Waves)
    scanWaves.forEach((wave) => {
      ctx.strokeStyle = `rgba(0, 255, 150, ${wave.opacity * 0.6})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, wave.radius, 0, Math.PI * 2);
      ctx.stroke();
    });
  }, [featurePoints, scanWaves]);

  // تحديث موجات المسح
  useEffect(() => {
    const interval = setInterval(() => {
      setScanWaves((prevWaves) =>
        prevWaves
          .map((wave) => ({
            ...wave,
            radius: wave.radius + 5,
            opacity: wave.opacity - 0.02,
          }))
          .filter((wave) => wave.opacity > 0)
      );
    }, 30);

    return () => clearInterval(interval);
  }, []);

  // تحديث نقاط الميزة (تلاشي تدريجي)
  useEffect(() => {
    const interval = setInterval(() => {
      setFeaturePoints((prevPoints) =>
        prevPoints
          .map((point) => ({
            ...point,
            opacity: point.opacity - 0.02,
          }))
          .filter((point) => point.opacity > 0)
      );
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden flex items-center justify-center">
      {/* Canvas لرسم التأثيرات */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
      />

      {/* الشبكة التوجيهية (Guidance Grid) */}
      <div className="absolute inset-0 pointer-events-none">
        {/* خطوط أفقية وعمودية */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-500 to-transparent" />
          <div className="absolute top-2/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-500 to-transparent" />
          <div className="absolute top-0 left-1/3 bottom-0 w-px bg-gradient-to-b from-transparent via-green-500 to-transparent" />
          <div className="absolute top-0 left-2/3 bottom-0 w-px bg-gradient-to-b from-transparent via-green-500 to-transparent" />
        </div>

        {/* دائرة توجيهية في المنتصف */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-64 h-64 border-2 border-dashed border-green-500 rounded-full opacity-50" />
          <div className="w-80 h-80 border-2 border-dashed border-green-500 rounded-full opacity-30 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* عداد التقدم (Progress Counter) */}
      <motion.div
        className="absolute top-8 left-8 text-white font-bold text-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <p className="text-green-400">{captureCount} / {totalCaptures}</p>
        <p className="text-sm text-gray-400">صور ملتقطة</p>
      </motion.div>

      {/* دائرة التقدم الدائرية (Circular Progress) */}
      <motion.div
        className="absolute top-8 right-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <svg width="120" height="120" className="transform -rotate-90">
          {/* خلفية الدائرة */}
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="4"
          />
          {/* دائرة التقدم */}
          <motion.circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke="rgb(34, 197, 94)"
            strokeWidth="4"
            strokeDasharray={`${2 * Math.PI * 50}`}
            strokeDashoffset={`${2 * Math.PI * 50 * (1 - progress)}`}
            strokeLinecap="round"
            transition={{ duration: 0.5 }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white font-bold text-lg">{Math.round(progress * 100)}%</span>
        </div>
      </motion.div>

      {/* تأثير الفلاش عند التقاط الصورة */}
      {showFlash && (
        <motion.div
          className="absolute inset-0 bg-white pointer-events-none"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        />
      )}

      {/* رسالة توجيهية */}
      <motion.div
        className="absolute bottom-24 left-1/2 -translate-x-1/2 text-center text-white"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <p className="text-lg font-semibold text-green-400">حرك الجهاز ببطء حول الطبق</p>
        <p className="text-sm text-gray-400 mt-2">التقط صورة كل 15-20 درجة</p>
      </motion.div>

      {/* زر التقاط الصورة */}
      <motion.button
        onClick={handleCapture}
        disabled={!isCapturing}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center shadow-lg transition-all"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="w-16 h-16 rounded-full border-4 border-white" />
      </motion.button>

      {/* معلومات إضافية */}
      <motion.div
        className="absolute bottom-48 left-1/2 -translate-x-1/2 text-center text-gray-300 text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
      >
        <p>النقاط الخضراء = نقاط الميزة المكتشفة</p>
        <p>الموجات = مسح ضوئي نشط</p>
      </motion.div>
    </div>
  );
};

export default InteractiveScanner;
