/**
 * AIGenerate3D.tsx
 *
 * زر "توليد 3D بالذكاء الاصطناعي" في صفحة ThreeDUploader
 * يستخدم Stability AI — Stable Fast 3D
 * لا يحتاج polling — النموذج يرجع مباشرة (~5-15 ثانية)
 */

import { useState } from 'react';
import { generateAI3D } from '../../lib/meshy';
import { Sparkles, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

type GenStatus = 'idle' | 'generating' | 'done' | 'error';

interface AIGenerate3DProps {
  dishId       : string;
  imageUrl     : string | null;
  customFile?  : File;
  hasModel     : boolean;
  primaryColor : string;
  lang         : 'ar' | 'en';
  onSuccess    : (modelUrl: string) => void;
}

export function AIGenerate3D({
  dishId, imageUrl, customFile, hasModel, primaryColor, lang, onSuccess
}: AIGenerate3DProps) {
  const [status, setStatus] = useState<GenStatus>('idle');
  const [error,  setError]  = useState('');
  const isAr = lang === 'ar';
  const hasImage = !!imageUrl || !!customFile;

  // ── بدء التوليد ────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!hasImage) {
      setError(isAr
        ? 'أضف صورة للطبق أولاً'
        : 'Add a dish image first');
      return;
    }

    setStatus('generating');
    setError('');

    try {
      const result = await generateAI3D(dishId, imageUrl || undefined, customFile);

      if (result.status === 'SUCCEEDED' && result.model3dUrl) {
        setStatus('done');
        onSuccess(result.model3dUrl);
      } else {
        throw new Error(result.error || 'Generation failed');
      }
    } catch (e: any) {
      setError(e.message);
      setStatus('error');
    }
  };

  return (
    <div className="rounded-2xl overflow-hidden border border-white/5"
      style={{ background: `${primaryColor}06` }}
    >
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="px-4 py-3 flex items-center gap-2.5 border-b border-white/5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: `${primaryColor}15` }}>
          <Sparkles size={16} style={{ color: primaryColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white/90 tracking-wide">
            {isAr ? 'توليد 3D بالذكاء الاصطناعي' : 'AI 3D Generation'}
          </p>
          <p className="text-[10px] text-white/35 tracking-wide uppercase font-semibold">
            {isAr
              ? 'صورة واحدة → نموذج 3D خلال ثوانٍ'
              : 'One photo → 3D model in seconds'}
          </p>
        </div>
        <span className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md"
          style={{ background: `${primaryColor}18`, color: primaryColor }}>
          PRO
        </span>
      </div>

      {/* ── Body ───────────────────────────────────────────────── */}
      <div className="p-4">

        {/* ── IDLE / ERROR — زر التوليد ──────────────────────── */}
        {(status === 'idle' || status === 'error') && (
          <>
            {hasModel && (
              <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle size={13} className="text-amber-400 flex-shrink-0" />
                <p className="text-[11px] text-amber-400 font-medium">
                  {isAr
                    ? 'عندك نموذج محمّل — التوليد سيستبدله'
                    : 'You have an existing model — this will replace it'}
                </p>
              </div>
            )}

            {!hasImage && (
              <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-white/5 border border-white/5">
                <span className="text-xs">📸</span>
                <p className="text-[11px] text-white/40 font-medium">
                  {isAr
                    ? 'أضف صورة للطبق أولاً ثم وّلد'
                    : 'Add a dish photo first then generate'}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={handleGenerate}
              disabled={!hasImage}
              className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              style={{
                background: hasImage
                  ? `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)`
                  : 'rgba(255,255,255,0.06)',
                color     : hasImage ? '#0a0a0e' : 'rgba(255,255,255,0.25)',
                cursor    : hasImage ? 'pointer' : 'not-allowed',
                boxShadow : hasImage ? `0 4px 20px ${primaryColor}30` : 'none',
                fontFamily: 'inherit',
                border    : 'none',
              }}
            >
              <Sparkles size={15} />
              {isAr ? 'وّلد نموذج 3D من الصورة' : 'Generate 3D from Photo'}
            </button>

            {error && (
              <p className="mt-2 text-center text-[11px] text-red-400 font-semibold">
                {error}
              </p>
            )}
          </>
        )}

        {/* ── GENERATING — مؤشر التحميل ─────────────────────── */}
        {status === 'generating' && (
          <div className="flex flex-col items-center gap-4 py-6">
            {/* Animated spinner */}
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-2 border-white/5" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent animate-spin"
                style={{ borderTopColor: primaryColor, borderRightColor: `${primaryColor}60` }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles size={20} style={{ color: primaryColor }} className="animate-pulse" />
              </div>
            </div>

            <div className="text-center">
              <p className="text-white/70 text-sm font-semibold">
                {isAr ? 'الذكاء الاصطناعي يبني النموذج...' : 'AI is building the model...'}
              </p>
              <p className="text-white/30 text-[10px] mt-1 uppercase tracking-wider font-medium">
                {isAr ? 'عادةً يستغرق 5-15 ثانية' : 'Usually takes 5-15 seconds'}
              </p>
            </div>

            {/* Animated progress phases */}
            <div className="w-full flex gap-1.5 mt-1">
              {[
                { label: isAr ? 'تحليل' : 'Analyze',  delay: '0s' },
                { label: isAr ? 'الشكل' : 'Shape',    delay: '1s' },
                { label: isAr ? 'الملمس' : 'Texture',  delay: '2s' },
                { label: isAr ? 'تصدير' : 'Export',    delay: '3s' },
              ].map((phase, i) => (
                <div key={i}
                  className="flex-1 text-center text-[9px] font-bold uppercase tracking-wider py-1.5 rounded-md animate-pulse"
                  style={{
                    color: primaryColor,
                    background: `${primaryColor}12`,
                    animationDelay: phase.delay,
                  }}
                >
                  {phase.label}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── DONE ─────────────────────────────────────────────── */}
        {status === 'done' && (
          <div className="flex items-center gap-3 py-1">
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(34,197,94,0.12)' }}>
              <CheckCircle size={18} className="text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-green-400 text-sm font-bold">
                {isAr ? 'تم توليد النموذج ثلاثي الأبعاد!' : '3D model generated!'}
              </p>
              <p className="text-white/35 text-[10px] font-medium">
                {isAr ? 'يمكنك معاينته أعلاه' : 'Preview it above'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setStatus('idle'); setError(''); }}
              className="text-[10px] font-bold uppercase tracking-wider text-white/40 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 transition-colors"
              style={{ fontFamily: 'inherit' }}
            >
              {isAr ? 'إعادة' : 'Redo'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
