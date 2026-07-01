import React, { useEffect, useRef } from 'react';
import '@google/model-viewer';

interface ThreeDViewerProps {
  modelUrl: string;
  posterUrl?: string;
  alt?: string;
  autoRotate?: boolean;
  cameraControls?: boolean;
  ar?: boolean;
  className?: string;
}

export const ThreeDViewer: React.FC<ThreeDViewerProps> = ({
  modelUrl,
  posterUrl,
  alt = "3D Model",
  autoRotate = true,
  cameraControls = true,
  ar = true,
  className = "w-full h-full"
}) => {
  const viewerRef = useRef<any>(null);

  useEffect(() => {
    if (viewerRef.current) {
      // Custom initialization if needed
    }
  }, []);

  return (
    <div className={`relative ${className}`}>
      {React.createElement('model-viewer', {
        ref: viewerRef,
        src: modelUrl,
        poster: posterUrl,
        alt: alt,
        'auto-rotate': autoRotate ? "" : undefined,
        'camera-controls': cameraControls ? "" : undefined,
        ar: ar ? "" : undefined,
        'ar-modes': "webxr scene-viewer quick-look",
        'interaction-prompt': "auto",
        'shadow-intensity': "1",
        exposure: "1",
        'environment-image': "neutral",
        loading: "lazy",
        style: { width: '100%', height: '100%', backgroundColor: 'transparent' }
      }, [
        <div key="progress" slot="progress-bar" className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
        </div>,
        ar && (
          <button
            key="ar-button"
            slot="ar-button"
            className="absolute bottom-4 right-4 bg-gold text-dark px-4 py-2 rounded-full font-bold shadow-lg flex items-center gap-2 hover:scale-105 transition-transform"
          >
            <span className="text-sm">View in AR</span>
          </button>
        )
      ])}
    </div>
  );
};
