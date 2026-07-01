import React, { useState, useCallback } from 'react';
import { assetService } from '../../services/assetService';
import toast from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';
import { Camera, X, ArrowLeft, ArrowRight } from 'lucide-react';

interface ImageUploaderProps {
  images: string[];
  onChange: (imgs: string[]) => void;
  lang: 'ar' | 'en';
  primaryColor: string;
  maxImages?: number; // default 8
}

export function ImageUploader({ images, onChange, lang, primaryColor, maxImages = 8 }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const isAr = lang === 'ar';

  const uploadFiles = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files);
    if (images.length + arr.length > maxImages) {
      toast.error(isAr ? `الحد الأقصى ${maxImages} صور` : `Maximum ${maxImages} images`);
      return;
    }

    setUploading(true);

    const uploaded: string[] = [];
    for (const file of arr) {
      if (!file.type.startsWith('image/')) continue;

      try {
        const url = await assetService.uploadFile(file, 'image');
        uploaded.push(url);
      } catch (e: any) {
        const msg = e?.message || 'Unknown error';
        toast.error(`${isAr ? 'فشل رفع الصورة' : 'Upload failed'}: ${msg}`, { duration: 8000 });
        console.error('Upload error:', e);
      }
    }

    onChange([...images, ...uploaded]);
    setUploading(false);
  }, [images, maxImages, onChange, isAr]);

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const moveImage = (from: number, to: number) => {
    const arr = [...images];
    const [item] = arr.splice(from, 1);
    arr.splice(to, 0, item);
    onChange(arr);
  };

  return (
    <div className="space-y-4 text-[#F5F5F5]">
      <h2 className="font-display text-xl tracking-wide">
        {isAr ? 'الصور *' : 'Images *'}
      </h2>

      {images.length > 0 && (
        <p className="text-muted text-xs uppercase tracking-wider font-semibold">
          💡 {isAr
            ? 'الصورة الأولى هي الصورة الرئيسية في المنيو — استخدم الأسهم للترتيب'
            : 'First image is the main menu image — use arrows to reorder'}
        </p>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {images.map((url, i) => (
            <div key={`${url}-${i}`} className="relative aspect-square bg-[#111] rounded-xl overflow-hidden group border border-white/5">
              <img src={assetService.getOptimizedUrl(url, { width: 400 })} alt="" className="w-full h-full object-cover" />

              {i === 0 && (
                <div 
                  className="absolute top-2 start-2 px-2 py-1 bg-gold text-main text-[10px] font-bold rounded shadow-md uppercase tracking-widest"
                >
                  {isAr ? 'رئيسية' : 'Main'}
                </div>
              )}

              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-2 end-2 w-7 h-7 rounded bg-red-500/90 hover:bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg"
              >
                <X size={14} />
              </button>

              <div className="absolute bottom-2 start-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                {i > 0 && (
                  <button type="button" onClick={() => moveImage(i, i - 1)}
                    className="w-7 h-7 rounded bg-black/80 hover:bg-black text-white flex items-center justify-center backdrop-blur-md">
                    <ArrowRight size={14} className={isAr ? '' : 'rotate-180'} />
                  </button>
                )}
                {i < images.length - 1 && (
                  <button type="button" onClick={() => moveImage(i, i + 1)}
                    className="w-7 h-7 rounded bg-black/80 hover:bg-black text-white flex items-center justify-center backdrop-blur-md">
                    <ArrowLeft size={14} className={isAr ? '' : 'rotate-180'} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {images.length < maxImages && (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); uploadFiles(e.dataTransfer.files); }}
          onClick={() => document.getElementById('img-input')?.click()}
          className="border border-dashed rounded-2xl p-8 lg:p-12 text-center cursor-pointer transition-colors"
          style={{
            borderColor: dragOver ? primaryColor : 'rgba(255,255,255,0.1)',
            background: dragOver ? `${primaryColor}10` : 'rgba(255,255,255,0.02)',
          }}
        >
          <input
            id="img-input"
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={e => e.target.files && uploadFiles(e.target.files)}
          />

          {uploading ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-2 border-white/20 border-t-gold rounded-full animate-spin" />
              <p className="text-muted text-sm font-medium tracking-wide uppercase">{isAr ? 'جاري الرفع...' : 'Uploading...'}</p>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/10 group-hover:border-gold/30 transition-colors">
                <Camera size={28} className="text-gold" />
              </div>
              <p className="text-text font-medium text-sm mb-2 uppercase tracking-wide">
                {isAr ? 'اسحب الصور هنا أو اضغط للاختيار' : 'Drag images here or click to browse'}
              </p>

              {/* ── NEW: Dedicated Camera Button ──────────────────────── */}
              <div className="flex justify-center gap-3 mb-4">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); document.getElementById('img-input')?.click(); }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold text-main text-xs font-bold hover:opacity-90 transition-all uppercase tracking-wider shadow-lg shadow-gold/20"
                >
                  <Camera size={16} />
                  {isAr ? 'التقاط صورة الآن' : 'Take Photo Now'}
                </button>
              </div>

              <p className="text-muted text-xs font-medium tracking-wider">
                {isAr
                  ? `JPG, PNG, WebP · الحد الأقصى ${maxImages} صور · 10MB لكل صورة`
                  : `JPG, PNG, WebP · Max ${maxImages} images · 10MB each`}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
