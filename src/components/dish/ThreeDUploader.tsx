import React, { useState, useRef, useCallback, lazy, Suspense } from 'react';
import { assetService } from '../../services/assetService';
import { useLanguage } from '../../context/LanguageContext';
import { Box, Sparkles, Upload, Trash2, Eye, Loader2, CheckCircle, AlertTriangle, Camera } from 'lucide-react';
import { generateLocalModel } from '../../lib/3d/localModelGenerator';
import { useNavigate } from 'react-router-dom';
import { ConnectIOSAppCard } from './ConnectIOSAppCard';

const ARLauncher = lazy(() => import('../3d/ARLauncher'));
const DishViewer3D = lazy(() => import('../3d/DishViewer3D'));

interface ThreeDUploaderProps {
  model3dUrl: string | undefined;
  isCustomizable: boolean;
  onChange: (url: string) => void;
  onCustomizable: (v: boolean) => void;
  restaurantPlan: 'STARTER' | 'PRO' | 'ENTERPRISE';
  dishId?: string | null;
  dishImageUrl?: string;
  lang: 'ar' | 'en';
  primaryColor: string;
}

export function ThreeDUploader({
  model3dUrl, isCustomizable, onChange, onCustomizable,
  restaurantPlan, dishId, dishImageUrl, lang, primaryColor
}: ThreeDUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [showARCamera, setShowARCamera] = useState(false);
  const [showManualUpload, setShowManualUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const isAr = lang === 'ar';
  
  const isPro = true; // restaurantPlan !== 'STARTER';

  const handleUpload = useCallback(async (file: File) => {
    setUploadError('');

    if (!file.name.match(/\.(glb|gltf)$/i)) {
      setUploadError(isAr ? 'الصيغة غير مدعومة. استخدم GLB أو GLTF' : 'Invalid format. Use GLB or GLTF');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setUploadError(isAr
        ? `حجم الملف ${(file.size/1024/1024).toFixed(1)}MB يتجاوز الحد (50MB)`
        : `File size ${(file.size/1024/1024).toFixed(1)}MB exceeds limit (50MB)`);
      return;
    }

    setUploading(true);
    setProgress(10);

    try {
      const formData = new FormData();
      formData.append('model', file);
      
      const base = import.meta.env.DEV ? '' : '';
      const res = await fetch(`${base}/api/upload-3d-model`, {
        method: 'POST',
        body: formData,
      });

      setProgress(80);

      if (!res.ok) throw new Error('Upload failed');

      const { url } = await res.json();
      setProgress(100);
      onChange(url);
    } catch (err: any) {
      setUploadError(isAr ? 'فشل رفع الملف، حاول مرة أخرى' : 'Upload failed, please try again');
    } finally {
      setUploading(false);
    }
  }, [isAr, onChange]);

  return (
    <div className="space-y-6">
      <h2 className="font-display tracking-wide text-xl text-text-primary font-bold">
        {isAr ? 'نموذج ثلاثي الأبعاد' : '3D Model'}
      </h2>

      {/* ════════════════════════════════════════════════════════════
          حالة 1: النموذج موجود — عرض المعاينة
          ════════════════════════════════════════════════════════════ */}
      {model3dUrl && !uploading && (
        <div className="rounded-2xl overflow-hidden border border-border-custom bg-card shadow-sm">
          {/* 3D Preview — يدور تلقائياً */}
          <div className="h-[400px] bg-[#0A0A0A] relative">
            <Suspense fallback={
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-white/20 border-t-gold rounded-full animate-spin" />
              </div>
            }>
              <DishViewer3D
                modelUrl={model3dUrl}
                primaryColor={primaryColor}
                height={400}
              />
            </Suspense>
            {/* Overlay buttons */}
            <div className="absolute top-4 end-4 flex gap-2">
              <button
                type="button"
                onClick={() => setShowARCamera(true)}
                className="w-10 h-10 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur border border-white/10 text-white flex items-center justify-center transition-colors shadow-lg"
              >
                <Eye size={18} />
              </button>
              <button
                type="button"
                onClick={() => onChange('')}
                className="w-10 h-10 rounded-xl bg-red-500/20 hover:bg-red-500/40 backdrop-blur border border-red-500/30 text-red-400 flex items-center justify-center transition-colors shadow-lg"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="px-6 py-4 flex items-center justify-between border-t border-border-custom bg-surface-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-green-600 font-bold uppercase tracking-wider bg-green-500/10 px-2 py-0.5 rounded">✓ 3D</span>
              <span className="text-text-secondary text-xs font-semibold">{isAr ? 'النموذج جاهز' : 'Model Ready'}</span>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          حالة 2: لا يوجد نموذج — عرض خيارات الرفع/التوليد
          ════════════════════════════════════════════════════════════ */}
      {!model3dUrl && (
        <>
          {/* ── الخيار الأساسي: تطبيق iOS المرافق ───────────────────── */}
          {isPro && dishId && (
            <ConnectIOSAppCard
              productId={dishId}
              productName={isAr ? 'الطبق' : 'Dish'} // In a real app, pass the actual dish name
              authToken={'dummy-token-for-now'} // The auth token should be fetched from context or session
              primaryColor={primaryColor}
            />
          )}

          {/* ── الخيار الثانوي: رفع GLB يدوي ──────────────────────── */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border-custom" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-text-muted">
              {isAr ? 'أو ارفع ملف 3D جاهز' : 'or upload existing 3D file'}
            </span>
            <div className="flex-1 h-px bg-border-custom" />
          </div>

          {showManualUpload ? (
            <div
              className="border-2 border-dashed border-border-custom hover:border-gold/50 bg-card rounded-2xl p-6 text-center cursor-pointer transition-all shadow-sm"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file) handleUpload(file);
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".glb,.gltf"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
              />

              {uploading ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="relative w-14 h-14">
                    <svg className="-rotate-90 absolute inset-0" viewBox="0 0 64 64">
                      <circle cx="32" cy="32" r="26" fill="none" stroke="#E7E1EA" strokeWidth="4"/>
                      <circle
                        cx="32" cy="32" r="26" fill="none"
                        stroke={primaryColor} strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 26}`}
                        strokeDashoffset={`${2 * Math.PI * 26 * (1 - progress/100)}`}
                        style={{ transition: 'stroke-dashoffset .3s ease' }}
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-text-primary text-xs font-bold font-mono">
                       {progress}%
                    </span>
                  </div>
                  <p className="text-text-secondary text-sm font-semibold uppercase tracking-widest">
                    {isAr ? 'جاري الرفع...' : 'Uploading...'}
                  </p>
                </div>
              ) : (
                <>
                  <Upload size={24} className="text-gold mx-auto mb-3" />
                  <p className="text-text-primary font-bold text-xs mb-1">
                    {isAr ? 'اسحب ملف GLB هنا أو اضغط للاختيار' : 'Drop GLB/GLTF file or click'}
                  </p>
                  <p className="text-text-muted text-[10px] uppercase tracking-wider font-medium">
                    {isAr ? 'يدعم: .glb · .gltf · حد: 50MB' : '.glb · .gltf · Max 50MB'}
                  </p>
                </>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowManualUpload(true)}
              className="w-full py-3 rounded-xl border border-dashed border-border-custom text-text-secondary hover:text-gold hover:border-gold/50 bg-card text-xs font-bold uppercase tracking-wider transition-all shadow-sm"
            >
              <Upload size={14} className="inline mr-2" />
              {isAr ? 'رفع ملف GLB/GLTF' : 'Upload GLB/GLTF file'}
            </button>
          )}

          {uploadError && (
            <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold uppercase tracking-wider text-center">
              {uploadError}
            </div>
          )}
        </>
      )}

      {/* ── Customizable Toggle ───────────────────────────────────── */}
      {model3dUrl && (
        <div className="flex items-center justify-between p-5 rounded-2xl bg-card border border-border-custom shadow-sm">
          <div>
            <p className="text-text-primary text-sm font-bold uppercase tracking-wide">
              {isAr ? '🏗️ قابل للتخصيص' : '🏗️ Customizable 3D'}
            </p>
            <p className="text-text-secondary text-xs mt-1 font-medium">
              {isAr
                ? 'يتيح للزبون تخصيص مكونات الطبق'
                : 'Lets customers customize ingredients'}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isCustomizable}
            onClick={() => onCustomizable(!isCustomizable)}
            className="relative w-12 h-6 rounded-full transition-colors flex-shrink-0"
            style={{ background: isCustomizable ? primaryColor : '#D5CEDC' }}
          >
            <span
              className="absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow-md"
              style={{ transform: isCustomizable ? 'translateX(24px)' : 'translateX(4px)' }}
            />
          </button>
        </div>
      )}

      {/* ── AR Camera Full-Screen Overlay ─────────────────────────── */}
      {showARCamera && model3dUrl && (
        <Suspense fallback={
          <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
            <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        }>
          <ARLauncher
            modelUrl={model3dUrl}
            dishName={isAr ? 'معاينة النموذج' : 'Model Preview'}
            price=""
            primaryColor={primaryColor}
            lang={lang}
            onClose={() => setShowARCamera(false)}
          />
        </Suspense>
      )}
    </div>
  );
}
