import React, { useEffect, useRef } from 'react';
import '@google/model-viewer';
import { useLanguage } from '../context/LanguageContext';

interface ThreeViewerProps {
  modelUrl: string;
  posterUrl?: string;
  name?: string;
  height?: string;
  isSmall?: boolean;
}

export const ThreeViewer: React.FC<ThreeViewerProps> = ({ modelUrl, posterUrl, name, height = "h-[400px] md:h-[600px]", isSmall = false }) => {
  const { isRtl } = useLanguage();
  const modelRef = useRef<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [arSupported, setArSupported] = React.useState(false);

  useEffect(() => {
    const checkAR = async () => {
      const supported = await (window as any).modelViewer?.canActivateAR;
      setArSupported(!!supported);
    };
    checkAR();
  }, []);

  return (
    <div className={`relative w-full ${height} bg-dark-2 rounded-3xl overflow-hidden border border-surface group`}>
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-dark/50 backdrop-blur-sm z-10">
          <div className={`border-4 border-gold border-t-transparent rounded-full animate-spin mb-4 ${isSmall ? 'w-8 h-8' : 'w-12 h-12'}`}></div>
          <p className={`text-gold font-bold animate-pulse ${isSmall ? 'text-[10px]' : ''}`}>
            {isRtl ? 'جاري تحميل المجسم...' : 'Loading 3D Model...'}
          </p>
        </div>
      )}

      {React.createElement('model-viewer', {
        ref: modelRef,
        src: modelUrl,
        poster: posterUrl,
        alt: name || '3D Model',
        ar: true,
        'ar-modes': "webxr scene-viewer quick-look",
        'camera-controls': true,
        'auto-rotate': true,
        'shadow-intensity': "1",
        exposure: "1",
        'environment-image': "neutral",
        loading: "eager",
        onLoad: () => setIsLoading(false),
        style: { width: '100%', height: '100%', backgroundColor: 'transparent' },
        className: "w-full h-full"
      }, [
        <button
          key="ar-button"
          slot="ar-button"
          className={`absolute left-1/2 -translate-x-1/2 bg-gold text-dark rounded-full font-bold shadow-lg shadow-gold/20 flex items-center gap-2 hover:scale-105 transition-transform z-20 ${isSmall ? 'bottom-2 px-4 py-1.5 text-[10px]' : 'bottom-6 px-8 py-3'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width={isSmall ? 12 : 20} height={isSmall ? 12 : 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
          {isRtl ? 'عرض في الواقع المعزز' : 'View in AR'}
        </button>
      ])}

      {/* Custom Controls Overlay */}
      <div className={`absolute flex flex-col gap-2 ${isSmall ? 'top-2 right-2' : 'top-6 right-6'}`}>
        <div className={`bg-dark/80 backdrop-blur-md border border-surface rounded-xl flex flex-col gap-2 ${isSmall ? 'p-1' : 'p-2'}`}>
          <button 
            onClick={() => modelRef.current?.dismissPoster()}
            className="p-2 hover:text-gold transition-colors"
            title={isRtl ? 'إعادة ضبط العرض' : 'Reset View'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width={isSmall ? 14 : 20} height={isSmall ? 14 : 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
          </button>
        </div>
      </div>
    </div>
  );
};
