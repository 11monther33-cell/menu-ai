import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuth } from '../../../hooks/useAuth';
import { supabase } from '../../../lib/supabase';
import { ImageUploader } from '../../../components/dish/ImageUploader';
import { ThreeDUploader } from '../../../components/dish/ThreeDUploader';
import toast from 'react-hot-toast';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { CurrencySelector } from '../../../components/CurrencySelector';

const dishSchema = z.object({
  nameAr: z.string().min(2, 'اسم الطبق مطلوب').max(80),
  nameEn: z.string().min(2, 'English name required').max(80),
  categoryId: z.string().min(1, 'اختر تصنيفاً'),
  price: z.number({ error: 'أدخل السعر' }).min(0, 'السعر يجب أن يكون 0 أو أكثر'),
  currency: z.string().default('USD'),
  prepTimeMin: z.number().min(1).max(120).default(15),

  descriptionAr: z.string().max(500).optional(),
  descriptionEn: z.string().max(500).optional(),
  calories: z.number().min(0).optional().nullable(),
  protein: z.number().min(0).optional().nullable(),
  carbs: z.number().min(0).optional().nullable(),
  fat: z.number().min(0).optional().nullable(),
  allergens: z.array(z.string()).default([]),
  tasteTags: z.array(z.string()).default([]),
  moodTags: z.array(z.string()).default([]),

  images: z.array(z.string()).min(1, 'أضف صورة واحدة على الأقل'),

  model3dUrl: z.string().optional(),
  isCustomizable: z.boolean().default(false),

  isAvailable: z.boolean().default(true),
  isChefSpecial: z.boolean().default(false),
  stockCount: z.number().nullable().default(null),
  sortOrder: z.number().default(0),
});

type DishFormData = z.input<typeof dishSchema>;

const STEPS = [
  { id: 1, labelAr: 'معلومات الكارت', labelEn: 'Basic Info', icon: '📝' },
  { id: 2, labelAr: 'الوصف والأرقام', labelEn: 'Description', icon: '📊' },
  { id: 3, labelAr: 'المعرض المرئي', labelEn: 'Gallery', icon: '📸' },
  { id: 4, labelAr: 'الذكاء والعرض', labelEn: '3D/AR', icon: '◉' },
  { id: 5, labelAr: 'التحكم والمخزون', labelEn: 'Settings', icon: '⚙️' },
  { id: 6, labelAr: 'تأكيد وإطلاق', labelEn: 'Publish', icon: '✓' },
];

export const DishFormPage = ({ mode }: { mode: 'create' | 'edit' }) => {
  const { isRtl, lang } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();

  const [categories, setCategories] = useState<any[]>([]);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(mode === 'edit');
  const [savedDishId, setSavedId] = useState<string | null>(id || null);

  const form = useForm<DishFormData>({
    resolver: zodResolver(dishSchema),
    defaultValues: {
      nameAr: '',
      nameEn: '',
      categoryId: '',
      price: 0,
      currency: 'USD',
      prepTimeMin: 15,
      images: [],
      allergens: [],
      tasteTags: [],
      moodTags: [],
      isAvailable: true,
      isChefSpecial: false,
      isCustomizable: false,
      stockCount: null,
      sortOrder: 0,
    },
  });

  const { watch, setValue, trigger, handleSubmit, formState: { errors } } = form;
  const values = watch();
  const primaryColor = '#C9A84C'; // Use standard Gold as requested via style guide

  useEffect(() => {
    if (!user?.restaurantId) return;

    const fetchCategories = async () => {
      const { data } = await supabase.from('categories').select('*').eq('restaurant_id', user.restaurantId).order('sort_order');
      if (data) setCategories(data);
    };

    fetchCategories();

    if (mode === 'edit' && id) {
      const fetchDish = async () => {
        const { data, error } = await supabase.from('dishes').select('*').eq('id', id).single();
        if (data) {
          form.reset({
            nameAr: data.name_ar || '',
            nameEn: data.name_en || '',
            categoryId: data.category_id || '',
            price: Number(data.price) || 0,
            currency: data.currency || 'USD',
            prepTimeMin: Number(data.prep_time_min) || 15,
            images: data.images || [],
            allergens: data.allergens || [],
            tasteTags: data.taste_tags || [],
            moodTags: data.mood_tags || [],
            isAvailable: data.is_available ?? true,
            isChefSpecial: data.is_chef_special ?? false,
            isCustomizable: data.is_customizable ?? false,
            stockCount: data.stock_count || null,
            sortOrder: data.sort_order || 0,
            descriptionAr: data.description_ar || '',
            descriptionEn: data.description_en || '',
            calories: data.calories || null,
            protein: data.protein || null,
            carbs: data.carbs || null,
            fat: data.fat || null,
            model3dUrl: data.model_3d_url || undefined,
          });
        }
        setLoading(false);
      };
      fetchDish();
    }
  }, [user?.restaurantId, mode, id, form]);

  const STEP_FIELDS: Record<number, (keyof DishFormData)[]> = {
    1: ['nameAr', 'nameEn', 'categoryId', 'price'],
    2: [],
    3: ['images'],
    4: [],
    5: [],
  };

  const goNext = async () => {
    const fields = STEP_FIELDS[step];
    if (fields?.length) {
      const ok = await trigger(fields);
      if (!ok) {
        toast.error(isRtl ? 'يرجى إكمال الحقول المطلوبة بشكل صحيح' : 'Please fix the required fields');
        return;
      }
    }
    setStep(s => Math.min(s + 1, 6));
  };

  const goPrev = () => setStep(s => Math.max(s - 1, 1));

  const onSubmit = async (data: DishFormData) => {
    setSaving(true);
    try {
      const payload = {
        restaurant_id: user?.restaurantId,
        category_id: data.categoryId,
        name_ar: data.nameAr,
        name_en: data.nameEn,
        description_ar: data.descriptionAr,
        description_en: data.descriptionEn,
        price: data.price,
        currency: data.currency,
        image_url: data.images[0] || null, // maintaining compat
        available: data.isAvailable, // mapped to available
        model_3d_url: data.model3dUrl,

        allergens: data.allergens,
        calories: data.calories,
        protein: data.protein,
        carbs: data.carbs,
        fat: data.fat,
        taste_tags: data.tasteTags,
        mood_tags: data.moodTags,
        prep_time_min: data.prepTimeMin,
        is_chef_special: data.isChefSpecial,
        is_customizable: data.isCustomizable,
        stock_count: data.stockCount,
        sort_order: data.sortOrder,
      };

      if (mode === 'create') {
        const { data: resData, error } = await supabase.from('dishes').insert([payload]).select().single();
        if (error) throw error;
        toast.success(isRtl ? 'تم إضافة الطبق بنجاح' : 'Dish created successfully');
        navigate('/dashboard/menu-builder');
      } else {
        // 🔒 SECURITY: Filter by restaurant_id to prevent IDOR
        const { error } = await supabase.from('dishes').update(payload).eq('id', id).eq('restaurant_id', user?.restaurantId);
        if (error) throw error;
        toast.success(isRtl ? 'تم تحديث الطبق بنجاح' : 'Dish updated successfully');
        navigate('/dashboard/menu-builder');
      }
    } catch (e: any) {
      console.error('Supabase save error:', e);
      // 🔒 Temporarily expose error to debug
      toast.error(isRtl ? `فشل الحفظ: ${e.message || 'Unknown'}` : `Saving failed: ${e.message || 'Unknown'}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-main">
        <div className="w-8 h-8 border-2 border-white/20 border-t-gold rounded-full animate-spin"></div>
      </div>
    );
  }

  const renderStepIcon = (index: number) => {
    if (step > index + 1) return <Check size={14} className="text-[#0F0E0B]" />;
    return <span className={`text-[10px] font-bold ${step === index + 1 ? 'text-[#0F0E0B]' : 'text-white/60'}`}>{index + 1}</span>;
  };

  return (
    <div className="max-w-4xl mx-auto py-4 lg:py-8 px-4 lg:px-0">
      {/* Stepper Header */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto no-scrollbar pb-2 px-1 -mx-4 lg:mx-0 lg:px-0 lg:justify-between">
        {STEPS.map((s, i) => {
          const isComplete = step > s.id;
          const isActive = step === s.id;
          
          return (
            <div key={s.id} className="flex items-center shrink-0">
              <div 
                className={`flex items-center gap-2 px-3 lg:px-4 py-2 rounded-xl transition-all duration-300 ${isActive ? 'bg-gold shadow-lg shadow-gold/20 scale-105' : isComplete ? 'bg-white/10' : 'bg-[#111] border border-white/5 opacity-40'}`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${isActive ? 'bg-white/20' : isComplete ? 'bg-gold' : 'bg-white/10'}`}>
                  {renderStepIcon(i)}
                </div>
                <span className={`text-[10px] lg:text-xs font-bold uppercase tracking-wider ${isActive || isComplete ? (isActive ? 'text-[#0F0E0B]' : 'text-white') : 'text-white/40'}`}>
                  {isRtl ? s.labelAr : s.labelEn}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-4 lg:w-8 h-[1px] mx-1 lg:mx-2 rounded-full ${isComplete ? 'bg-gold/30' : 'bg-white/5'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Main Form Content */}
      <form onSubmit={handleSubmit(onSubmit, (errors) => {
        console.error('Form validation errors:', errors);
        const firstErrorPath = Object.keys(errors)[0];
        toast.error(isRtl 
          ? `يوجد حقول غير صحيحة أو ناقصة (${firstErrorPath})` 
          : `There are invalid or missing fields (${firstErrorPath})`
        );
      })}>
        <div className="bg-surface-2 rounded-[1.5rem] lg:rounded-[2rem] border border-white/5 p-5 lg:p-12 mb-6 min-h-auto lg:min-h-[500px] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="font-display text-2xl tracking-wide text-[#F5F5F5] mb-8">
                {isRtl ? 'المعلومات الأساسية' : 'Basic Information'}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-muted text-xs font-bold uppercase tracking-widest mb-2">
                    {isRtl ? 'اسم الطبق (عربي) *' : 'Dish Name (Arabic) *'}
                  </label>
                  <input
                    {...form.register('nameAr')}
                    dir="rtl"
                    placeholder="برغر واغيو مميز"
                    className={`w-full px-5 py-3.5 rounded-xl text-white text-sm bg-main border outline-none transition-colors ${errors.nameAr ? 'border-red-500/60' : 'border-white/10 focus:border-gold/50'}`}
                  />
                  {errors.nameAr && <p className="text-red-400 text-xs mt-2">{errors.nameAr.message}</p>}
                </div>
                
                <div>
                  <label className="block text-muted text-xs font-bold uppercase tracking-widest mb-2">
                    Dish Name (English) *
                  </label>
                  <input
                    {...form.register('nameEn')}
                    dir="ltr"
                    placeholder="Signature Wagyu Burger"
                    className={`w-full px-5 py-3.5 rounded-xl text-white text-sm bg-main border outline-none transition-colors ${errors.nameEn ? 'border-red-500/60' : 'border-white/10 focus:border-gold/50'}`}
                  />
                  {errors.nameEn && <p className="text-red-400 text-xs mt-2">{errors.nameEn.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-muted text-xs font-bold uppercase tracking-widest mb-2">
                  {isRtl ? 'التصنيف *' : 'Category *'}
                </label>
                <select
                  {...form.register('categoryId')}
                  className={`w-full px-5 py-3.5 rounded-xl text-white text-sm bg-main border outline-none ${errors.categoryId ? 'border-red-500/60' : 'border-white/10 focus:border-gold/50'}`}
                >
                  <option value="">{isRtl ? '-- اختر تصنيفاً --' : '-- Select category --'}</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {isRtl ? cat.name_ar : cat.name_en}
                    </option>
                  ))}
                </select>
                {errors.categoryId && <p className="text-red-400 text-xs mt-2">{errors.categoryId.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-muted text-xs font-bold uppercase tracking-widest mb-2">
                    {isRtl ? 'السعر *' : 'Price *'}
                  </label>
                  <input
                    type="number" step="0.01" min="0"
                    {...form.register('price', { 
                      setValueAs: v => (v === '' || Number.isNaN(Number(v))) ? 0 : Number(v) 
                    })}
                    className={`w-full px-5 py-3.5 rounded-xl text-white text-sm bg-main border outline-none ${errors.price ? 'border-red-500/60' : 'border-white/10 focus:border-gold/50'}`}
                  />
                  {errors.price && <p className="text-red-400 text-xs mt-2">{errors.price.message}</p>}
                </div>

                <div>
                  <label className="block text-muted text-xs font-bold uppercase tracking-widest mb-2">
                    {isRtl ? 'العملة' : 'Currency'}
                  </label>
                  <CurrencySelector
                    value={values.currency}
                    onChange={(v) => setValue('currency', v)}
                    isRtl={isRtl}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="font-display text-2xl tracking-wide text-[#F5F5F5] mb-8">
                {isRtl ? 'الوصف والتغذية' : 'Description & Content'}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-muted text-xs font-bold uppercase tracking-widest mb-2">
                    {isRtl ? 'الوصف (عربي)' : 'Description (Arabic)'}
                  </label>
                  <textarea
                    {...form.register('descriptionAr')}
                    dir="rtl" rows={4}
                    className="w-full px-5 py-3.5 rounded-xl text-white text-sm bg-main border border-white/10 outline-none resize-none focus:border-gold/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-muted text-xs font-bold uppercase tracking-widest mb-2">
                    {isRtl ? 'الوصف (انجليزي)' : 'Description (English)'}
                  </label>
                  <textarea
                    {...form.register('descriptionEn')}
                    dir="ltr" rows={4}
                    className="w-full px-5 py-3.5 rounded-xl text-white text-sm bg-main border border-white/10 outline-none resize-none focus:border-gold/50 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-muted text-xs font-bold uppercase tracking-widest mb-4 mt-4">
                  {isRtl ? 'القيم الغذائية (اختياري)' : 'Nutritional Info'}
                </label>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {['calories', 'protein', 'carbs', 'fat'].map(f => (
                    <div key={f}>
                      <input
                        type="number" placeholder={f.toUpperCase()}
                        {...form.register(f as any, { 
                          setValueAs: v => (v === '' || Number.isNaN(Number(v))) ? null : Number(v) 
                        })}
                        className="w-full px-4 py-3 rounded-lg text-white text-xs bg-main border border-white/10 outline-none uppercase tracking-wide focus:border-gold/50"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <ImageUploader 
              images={values.images}
              onChange={imgs => form.setValue('images', imgs)}
              lang={lang}
              primaryColor={primaryColor}
            />
          )}

          {step === 4 && (
            <ThreeDUploader
              model3dUrl={values.model3dUrl}
              isCustomizable={values.isCustomizable}
              onChange={url => form.setValue('model3dUrl', url)}
              onCustomizable={v => form.setValue('isCustomizable', v)}
              restaurantPlan="PRO" 
              dishId={savedDishId || id}
              dishImageUrl={values.images?.[0]}
              lang={lang}
              primaryColor={primaryColor}
            />
          )}

          {step === 5 && (
            <div className="space-y-6 text-[#F5F5F5]">
              <h2 className="font-display text-2xl tracking-wide mb-8">
                {isRtl ? 'التحكم بالظهور' : 'Settings'}
              </h2>

              {[
                { field: 'isAvailable', ar: 'الطبق متاح حالياً', en: 'Dish is available', sub_ar: 'يظهر للزبائن', sub_en: 'Visible to customers' },
                { field: 'isChefSpecial', ar: 'طبق الشيف', en: 'Chef Special', sub_ar: 'يظهر بشارة مميزة', sub_en: 'Shown with special badge' },
              ].map(item => (
                <div key={item.field} className="flex items-center justify-between px-6 py-5 rounded-2xl bg-[#111] border border-white/5">
                  <div>
                    <p className="text-white text-sm font-semibold uppercase tracking-wider">{isRtl ? item.ar : item.en}</p>
                    <p className="text-muted text-xs mt-1">{isRtl ? item.sub_ar : item.sub_en}</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={!!form.watch(item.field as any)}
                    onClick={() => form.setValue(item.field as any, !form.watch(item.field as any))}
                    className="relative w-12 h-6 rounded-full transition-colors shrink-0"
                    style={{ background: form.watch(item.field as any) ? primaryColor : 'rgba(255,255,255,0.1)' }}
                  >
                    <span
                      className="absolute top-1 w-4 h-4 rounded-full bg-white transition-transform"
                      style={{ transform: form.watch(item.field as any) ? 'translateX(24px)' : 'translateX(4px)' }}
                    />
                  </button>
                </div>
              ))}
            </div>
          )}

          {step === 6 && (
            <div className="space-y-6">
              <h2 className="font-display text-2xl tracking-wide text-[#F5F5F5] mb-8">
                {isRtl ? 'مراجعة الإصدار النهائي' : 'Review & Finalize'}
              </h2>
              
              <div className="rounded-2xl border border-white/10 overflow-hidden bg-[#111]">
                {values.images?.[0] && (
                  <div className="relative h-64 overflow-hidden border-b border-white/10">
                    <img src={values.images[0]} alt="" className="w-full h-full object-cover" />
                    {values.model3dUrl && (
                      <div className="absolute top-4 start-4 px-3 py-1.5 rounded bg-gold text-[#0F0E0B] text-xs font-bold tracking-widest uppercase">
                        ◉ 3D Model Attached
                      </div>
                    )}
                  </div>
                )}
                <div className="p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <p className="text-white font-display text-2xl tracking-wide">{isRtl ? values.nameAr : values.nameEn}</p>
                      <p className="text-muted text-xs font-semibold uppercase tracking-wider mt-1">{categories.find(c => c.id === values.categoryId)?.name_en}</p>
                    </div>
                    <span className="text-2xl font-display text-gold">
                      {values.price} {values.currency}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {[
                      { check: !!values.nameAr && !!values.nameEn, ar: 'تمت الترجمة', en: 'Names Set' },
                      { check: !!values.categoryId, ar: 'تم تصنيف الطبق', en: 'Category Attached' },
                      { check: values.price > 0, ar: 'تم تسعير الطبق', en: 'Price Set' },
                      { check: values.images?.length > 0, ar: 'صور الطبق موجودة', en: 'Images Present' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className={`text-sm ${item.check ? 'text-green-400' : 'text-white/20'}`}>
                          {item.check ? '✓' : '○'}
                        </span>
                        <span className={`text-xs uppercase tracking-wider font-semibold ${item.check ? 'text-white/60' : 'text-white/25'}`}>
                          {isRtl ? item.ar : item.en}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Floating Action Bar */}
        <div className="flex justify-between items-center bg-surface-2/80 p-4 lg:p-6 rounded-2xl lg:rounded-[2rem] border border-white/10 sticky bottom-4 lg:bottom-6 z-20 backdrop-blur-xl shadow-2xl">
          <button
            type="button"
            onClick={goPrev}
            disabled={step === 1}
            className="flex items-center gap-2 px-4 lg:px-6 py-3 rounded-xl text-[10px] lg:text-sm font-bold uppercase tracking-wider text-muted hover:text-white hover:bg-white/5 transition-all disabled:opacity-20"
          >
            <ChevronLeft size={16} className={isRtl ? 'rotate-180' : ''} />
            {isRtl ? 'السابق' : 'Back'}
          </button>

          <div className="flex-1 flex justify-center lg:hidden">
            <span className="text-[10px] font-bold text-white/20 tracking-widest">{step}/6</span>
          </div>

          {step < 6 ? (
            <button
              type="button"
              onClick={goNext}
              className="flex items-center gap-2 px-6 lg:px-8 py-3 rounded-xl text-[10px] lg:text-sm font-bold uppercase tracking-wider text-main transition-all shadow-lg hover:shadow-gold/30 active:scale-95"
              style={{ background: primaryColor }}
            >
              {isRtl ? 'التالي' : 'Next'}
              <ChevronRight size={16} className={isRtl ? 'rotate-180' : ''} />
            </button>
          ) : (
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-8 lg:px-10 py-3 rounded-xl text-[10px] lg:text-sm font-bold uppercase tracking-wider text-main transition-all shadow-lg hover:shadow-gold/30 disabled:opacity-60 active:scale-95"
              style={{ background: primaryColor }}
            >
              {saving ? (
                <div className="flex gap-2 items-center">
                  <div className="w-4 h-4 border-2 border-main border-t-transparent rounded-full animate-spin"></div>
                  {isRtl ? 'جاري...' : 'Saving...'}
                </div>
              ) : (
                <>{isRtl ? '✓ إطلاق' : '✓ Publish'}</>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
