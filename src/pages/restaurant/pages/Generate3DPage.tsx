// src/pages/restaurant/pages/Generate3DPage.tsx
import React, { useState } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { AIGenerate3D } from '../../../components/dish/AIGenerate3D';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export const Generate3DPage = () => {
  const { isRtl, lang } = useLanguage();
  const navigate = useNavigate();
  const [customFile, setCustomFile] = useState<File | undefined>(undefined);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCustomFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleModelGenerated = (modelUrl: string) => {
    toast.success(isRtl ? 'تم توليد النموذج ثلاثي الأبعاد بنجاح!' : '3D model generated successfully!');
    // يمكنك هنا إعادة توجيه المستخدم إلى صفحة تعديل الطبق مع النموذج الجديد
    // أو عرض النموذج مباشرة.
    // مثال: navigate(`/dashboard/dishes/new?model3dUrl=${modelUrl}`);
    console.log('Generated 3D Model URL:', modelUrl);
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-muted hover:text-white transition-colors mb-6"
      >
        <ChevronLeft size={20} className={isRtl ? 'rotate-180' : ''} />
        {isRtl ? 'العودة' : 'Back'}
      </button>

      <h1 className="font-display text-3xl tracking-wide text-[#F5F5F5] mb-6">
        {isRtl ? 'توليد نموذج 3D جديد' : 'Generate New 3D Model'}
      </h1>

      <div className="bg-surface-2 rounded-[1.5rem] lg:rounded-[2rem] border border-white/5 p-5 lg:p-8 mb-6 shadow-2xl">
        <h2 className="font-display text-xl tracking-wide text-[#F5F5F5] mb-4">
          {isRtl ? 'التقاط صورة للطبق' : 'Capture Dish Photo'}
        </h2>
        <p className="text-muted text-sm mb-6">
          {isRtl ? 'التقط صورة واضحة للطبق من الأعلى أو الجانب لتوليد نموذج ثلاثي الأبعاد عالي الجودة.' : 'Capture a clear photo of your dish from top or side to generate a high-quality 3D model.'}
        </p>

        <div className="flex flex-col items-center gap-4 mb-6">
          {previewUrl && (
            <img src={previewUrl} alt="Dish Preview" className="w-48 h-48 object-cover rounded-xl border border-white/10" />
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleImageCapture}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-3 rounded-xl bg-gold text-[#0F0E0B] font-bold text-sm shadow-lg shadow-gold/20 hover:bg-gold/90 transition-all"
          >
            {isRtl ? '📷 التقاط صورة' : '📷 Capture Photo'}
          </button>
        </div>

        {customFile && (
          <div className="mt-8">
            <AIGenerate3D
              dishId="new"
              imageUrl={null}
              customFile={customFile}
              hasModel={false}
              primaryColor="#C9A84C"
              lang={lang}
              onSuccess={handleModelGenerated}
            />
          </div>
        )}
      </div>
    </div>
  );
};
