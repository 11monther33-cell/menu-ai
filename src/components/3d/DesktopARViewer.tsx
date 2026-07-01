import React, { useEffect, useRef, useState } from 'react';
import '@google/model-viewer';
import { Camera, X } from 'lucide-react';

interface DesktopARViewerProps {
  modelUrl: string;
  dishName: string;
  primaryColor: string;
  lang: 'ar' | 'en';
  onClose: () => void;
}

export default function DesktopARViewer({
  modelUrl, dishName, primaryColor, lang, onClose
}: DesktopARViewerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isAr = lang === 'ar';

  useEffect(() => {
    console.log('[DesktopAR] Starting webcam');
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((mediaStream) => {
        console.log('[DesktopAR] Webcam started');
        streamRef.current = mediaStream;
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      })
      .catch((err) => {
        console.error('[DesktopAR] Webcam error:', err);
        setError(isAr ? 'تعذر الوصول إلى الكاميرا. يرجى التحقق من الأذونات.' : 'Could not access webcam. Please check permissions.');
      });

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      } else if (videoRef.current?.srcObject) {
        const s = videoRef.current.srcObject as MediaStream;
        s.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
      {/* ── Close Button ─────────────────────────────────────── */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 z-[110] p-3 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-md hover:bg-black/80 transition-colors"
      >
        <X size={24} />
      </button>

      {/* ── AR Interface overlay ─────────────────────────────── */}
      <div className="absolute top-6 left-6 z-[110] px-4 py-2 rounded-full bg-black/60 text-white flex items-center gap-2 backdrop-blur-md">
        <Camera size={16} style={{ color: primaryColor }} />
        <span className="text-sm font-bold">{isAr ? 'كاميرا سطح المكتب' : 'Desktop Camera'}</span>
      </div>

      {error ? (
        <div className="text-white bg-red-500/20 px-6 py-4 rounded-xl border border-red-500/30 text-center max-w-md">
          <p className="font-bold mb-2">{isAr ? 'خطأ في الكاميرا' : 'Camera Error'}</p>
          <p className="text-sm text-white/80">{error}</p>
        </div>
      ) : (
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
          {/* Webcam Video Background */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }} // Mirror the camera for natural feel
          />

          {/* model-viewer Overlay with Transparent Background */}
          {React.createElement('model-viewer', {
            src: modelUrl,
            alt: dishName,
            'camera-controls': true,
            'auto-rotate': true,
            'rotation-per-second': '20deg',
            'shadow-intensity': '1',
            exposure: '1',
            'environment-image': 'neutral',
            loading: 'eager',
            style: {
              width: '100%',
              height: '100%',
              backgroundColor: 'transparent',
              position: 'absolute',
              inset: 0,
              zIndex: 10
            },
          })}
        </div>
      )}

      {/* ── Desktop usage hint ───────────────────────────────── */}
      {!error && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[110] px-6 py-3 rounded-2xl bg-black/60 text-white/90 text-sm backdrop-blur-md text-center max-w-sm pointer-events-none border border-white/10">
          {isAr 
            ? 'استخدم الماوس لتدوير الطبق ورؤيته من جميع الزوايا.' 
            : 'Use your mouse to rotate and view the dish from all angles.'}
        </div>
      )}
    </div>
  );
}
