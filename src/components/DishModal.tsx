import React, { useState, useEffect } from 'react';
import { X, Upload, Box, Info, Flame, Scale, Clock, Check, AlertCircle, Star, Camera, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';
import { assetService } from '../services/assetService';
import ThreeDViewerFull from './3d/ThreeDViewerFull';
import { ThreeViewer } from './ThreeViewer';
import toast from 'react-hot-toast';

interface DishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dish: any) => void;
  dish?: any;
  restaurantId: string;
  categoryId: string;
}

export const DishModal: React.FC<DishModalProps> = ({ isOpen, onClose, onSave, dish, restaurantId, categoryId }) => {
  const { isRtl, t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [show3DFull, setShow3DFull] = useState(false);
  const [uploadingModel, setUploadingModel] = useState(false);
  const [formData, setFormData] = useState({
    name_ar: '',
    name_en: '',
    description_ar: '',
    description_en: '',
    price: '',
    currency: 'USD',
    image_url: '',
    model_3d_url: '',
    calories: '',
    prep_time_min: '15',
    protein: '',
    carbs: '',
    fat: '',
    allergens: [] as string[],
    is_chef_special: false,
    category_id: categoryId
  });

  useEffect(() => {
    if (dish) {
      setFormData({
        ...dish,
        price: dish.price.toString(),
        calories: dish.calories?.toString() || '',
        prep_time_min: dish.prep_time_min?.toString() || '15',
        protein: dish.protein?.toString() || '',
        carbs: dish.carbs?.toString() || '',
        fat: dish.fat?.toString() || '',
        allergens: dish.allergens || []
      });
    } else {
      setFormData(prev => ({ ...prev, category_id: categoryId }));
    }
  }, [dish, categoryId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'model') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'model') {
      // Validate GLB file
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext !== 'glb' && ext !== 'gltf') {
        toast.error(isRtl ? 'يجب رفع ملف GLB فقط' : 'Only .glb files accepted');
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        toast.error(isRtl ? 'حجم الملف كبير جداً (50MB max)' : 'File too large (50MB max)');
        return;
      }

      setUploadingModel(true);
      try {
        // If dish already saved, use the 3D API endpoint
        if (dish?.id) {
          const token = (await supabase.auth.getSession()).data.session?.access_token;
          const formData = new FormData();
          formData.append('file', file);

          const resp = await fetch(`/api/dishes/${dish.id}/model3d`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData,
          });

          if (!resp.ok) throw new Error('Upload failed');
          const data = await resp.json();
          setFormData(prev => ({ ...prev, model_3d_url: data.modelUrl }));
          toast.success(isRtl ? 'تم رفع النموذج 3D!' : '3D model uploaded!');
        } else {
          // Fallback: upload via asset service
          const url = await assetService.uploadFile(file, 'raw');
          setFormData(prev => ({ ...prev, model_3d_url: url }));
          toast.success(t('restaurant.dashboard.dishes.uploadSuccess'));
        }
      } catch (err: any) {
        toast.error(`Model Error: ${err?.message || 'Unknown'}`, { duration: 10000 });
      } finally {
        setUploadingModel(false);
      }
      return;
    }

    setLoading(true);
    try {
      const url = await assetService.uploadFile(file, 'image');
      setFormData(prev => ({
        ...prev,
        image_url: url
      }));
      toast.success(t('restaurant.dashboard.dishes.uploadSuccess'));
    } catch (err: any) {
      toast.error(`Upload Error: ${err?.message || 'Unknown'}`, { duration: 10000 });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 🔒 SECURITY: Whitelist fields — prevent mass assignment
      const payload = {
        restaurant_id: restaurantId,
        category_id: formData.category_id,
        name_ar: formData.name_ar.substring(0, 100),
        name_en: formData.name_en.substring(0, 100),
        description_ar: (formData.description_ar || '').substring(0, 500),
        description_en: (formData.description_en || '').substring(0, 500),
        price: Math.max(0, parseFloat(formData.price) || 0),
        currency: formData.currency,
        image_url: formData.image_url,
        model_3d_url: formData.model_3d_url,
        calories: formData.calories ? Math.max(0, parseInt(formData.calories)) : null,
        prep_time_min: Math.max(1, Math.min(120, parseInt(formData.prep_time_min) || 15)),
        protein: formData.protein ? Math.max(0, parseFloat(formData.protein)) : null,
        carbs: formData.carbs ? Math.max(0, parseFloat(formData.carbs)) : null,
        fat: formData.fat ? Math.max(0, parseFloat(formData.fat)) : null,
        allergens: formData.allergens,
        is_chef_special: !!formData.is_chef_special,
      };

      let result;
      if (dish?.id) {
        // 🔒 SECURITY: Filter by restaurant_id to prevent IDOR
        result = await supabase.from('dishes').update(payload).eq('id', dish.id).eq('restaurant_id', restaurantId).select().single();
      } else {
        result = await supabase.from('dishes').insert([payload]).select().single();
      }

      if (result.error) throw result.error;
      onSave(result.data);
      onClose();
      toast.success(t('restaurant.dashboard.dishes.success'));
    } catch (err: any) {
      // 🔒 Don't expose raw DB errors
      toast.error(isRtl ? 'حدث خطأ أثناء الحفظ' : 'Error saving dish');
    } finally {
      setLoading(false);
    }
  };

  const toggleAllergen = (allergen: string) => {
    setFormData(prev => ({
      ...prev,
      allergens: prev.allergens.includes(allergen)
        ? prev.allergens.filter(a => a !== allergen)
        : [...prev.allergens, allergen]
    }));
  };

  const allergensList = ['gluten', 'dairy', 'nuts', 'eggs', 'fish', 'shellfish', 'soy'];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-4xl bg-sidebar border border-border-custom rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        >
          <div className="p-6 border-b border-border-custom flex items-center justify-between bg-card/50">
            <h3 className="text-xl font-bold text-text-primary">
              {dish ? t('restaurant.dashboard.dishes.edit') : t('restaurant.dashboard.dishes.add')}
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-all">
              <X size={24} className="text-text-secondary" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Basic Info */}
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">{t('restaurant.dashboard.dishes.nameAr')}</label>
                    <input 
                      required
                      value={formData.name_ar}
                      onChange={e => setFormData(prev => ({ ...prev, name_ar: e.target.value }))}
                      className="w-full bg-card border border-border-custom rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-gold outline-none text-text-primary"
                      placeholder={isRtl ? 'اسم الطبق بالعربي' : 'Dish name in Arabic'}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">{t('restaurant.dashboard.dishes.nameEn')}</label>
                    <input 
                      required
                      value={formData.name_en}
                      onChange={e => setFormData(prev => ({ ...prev, name_en: e.target.value }))}
                      className="w-full bg-card border border-border-custom rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-gold outline-none text-text-primary"
                      placeholder={isRtl ? 'اسم الطبق بالإنجليزي' : 'Dish name in English'}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">{t('restaurant.dashboard.dishes.descAr')}</label>
                  <textarea 
                    value={formData.description_ar}
                    onChange={e => setFormData(prev => ({ ...prev, description_ar: e.target.value }))}
                    className="w-full bg-card border border-border-custom rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-gold outline-none text-text-primary h-24 resize-none"
                    placeholder={isRtl ? 'وصف الطبق بالعربي...' : 'Dish description in Arabic...'}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">{t('restaurant.dashboard.dishes.descEn')}</label>
                  <textarea 
                    value={formData.description_en}
                    onChange={e => setFormData(prev => ({ ...prev, description_en: e.target.value }))}
                    className="w-full bg-card border border-border-custom rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-gold outline-none text-text-primary h-24 resize-none"
                    placeholder={isRtl ? 'وصف الطبق بالإنجليزي...' : 'Dish description in English...'}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">{t('restaurant.dashboard.dishes.price')}</label>
                    <div className="relative">
                      <input 
                        required
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))}
                        className="w-full bg-card border border-border-custom rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-gold outline-none text-text-primary"
                        placeholder="0.00"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gold font-bold text-xs">$</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">{t('restaurant.dashboard.dishes.prepTime')}</label>
                    <div className="relative">
                      <input 
                        type="number"
                        value={formData.prep_time_min}
                        onChange={e => setFormData(prev => ({ ...prev, prep_time_min: e.target.value }))}
                        className="w-full bg-card border border-border-custom rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-gold outline-none text-text-primary"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary text-xs">{isRtl ? 'دقيقة' : 'min'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Media & Advanced */}
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">{t('restaurant.dashboard.dishes.image')}</label>
                    <div className="relative h-40 bg-card border-2 border-dashed border-border-custom rounded-2xl overflow-hidden group">
                      {formData.image_url ? (
                        <>
                          <img src={formData.image_url} className="w-full h-full object-cover" alt="" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <label className="cursor-pointer p-3 bg-gold text-white rounded-full">
                              <Upload size={20} />
                              <input type="file" accept="image/*" className="hidden" onChange={e => handleUpload(e, 'image')} />
                            </label>
                          </div>
                        </>
                      ) : (
                        <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-all">
                          <Upload size={24} className="text-text-secondary mb-2" />
                          <span className="text-[10px] text-text-secondary font-bold">{t('restaurant.dashboard.dishes.uploadPhoto')}</span>
                          <input type="file" accept="image/*" className="hidden" onChange={e => handleUpload(e, 'image')} />
                        </label>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">{t('restaurant.dashboard.dishes.model3d')}</label>
                      {formData.model_3d_url && (
                        <button 
                          type="button"
                          onClick={() => setShow3DFull(true)}
                          className="flex items-center gap-1 text-[10px] font-bold text-gold hover:text-gold-light transition-all"
                        >
                          <Box size={12} />
                          {isRtl ? 'عرض AR كامل' : 'Full AR View'}
                        </button>
                      )}
                    </div>
                    <div className="relative h-40 bg-card border-2 border-dashed border-border-custom rounded-2xl overflow-hidden group">
                      {formData.model_3d_url ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gold/5">
                          {showPreview ? (
                            <div className="absolute inset-0 z-20">
                              <ThreeViewer 
                                modelUrl={formData.model_3d_url} 
                                name={isRtl ? formData.name_ar : formData.name_en} 
                                height="h-full"
                                isSmall={true}
                              />
                              <button 
                                type="button"
                                onClick={() => setShowPreview(false)}
                                className="absolute top-2 right-2 z-30 p-1 bg-black/50 text-white rounded-full hover:bg-black/70 transition-all"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <>
                          <Box size={32} className="text-gold mb-2" />
                              <span className="text-[10px] text-gold font-bold">
                                {uploadingModel ? (isRtl ? 'جاري الرفع...' : 'Uploading...') : 'MODEL READY'}
                              </span>
                              <div className="flex gap-4 mt-2">
                                <button 
                                  type="button"
                                  onClick={() => setShowPreview(true)}
                                  className="text-[10px] text-gold hover:underline font-bold flex items-center gap-1"
                                >
                                  <Eye size={12} />
                                  {isRtl ? 'معاينة' : 'Preview'}
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => setShow3DFull(true)}
                                  className="text-[10px] text-gold hover:underline font-bold"
                                >
                                  {isRtl ? 'عرض AR' : 'AR View'}
                                </button>
                                <label className="cursor-pointer text-[10px] text-text-secondary hover:text-gold underline">
                                  {isRtl ? 'تغيير الملف' : 'Change File'}
                                  <input type="file" accept=".glb" className="hidden" onChange={e => handleUpload(e, 'model')} />
                                </label>
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        <div 
                          className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-all group"
                        >
                          <Box size={24} className="text-text-secondary mb-2 group-hover:text-gold transition-colors" />
                          <span className="text-[10px] text-text-secondary font-bold">{t('restaurant.dashboard.dishes.uploadGlb')}</span>
                          {uploadingModel && (
                            <div className="mt-2 w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
                          )}
                          <label 
                            className="mt-2 cursor-pointer text-[8px] text-text-secondary hover:text-gold underline"
                          >
                            {isRtl ? 'ارفع ملف GLB' : 'Upload GLB file'}
                            <input type="file" accept=".glb,.gltf" className="hidden" onChange={e => handleUpload(e, 'model')} />
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-card/50 border border-border-custom rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-gold uppercase tracking-wider">
                    <Flame size={14} />
                    <span>{t('restaurant.dashboard.dishes.nutrition')}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <input 
                        type="number"
                        placeholder="Calories"
                        value={formData.calories}
                        onChange={e => setFormData(prev => ({ ...prev, calories: e.target.value }))}
                        className="w-full bg-card border border-border-custom rounded-xl px-4 py-2 text-xs focus:ring-1 focus:ring-gold outline-none text-text-primary"
                      />
                    </div>
                    <div className="relative">
                      <input 
                        type="number"
                        placeholder="Protein (g)"
                        value={formData.protein}
                        onChange={e => setFormData(prev => ({ ...prev, protein: e.target.value }))}
                        className="w-full bg-card border border-border-custom rounded-xl px-4 py-2 text-xs focus:ring-1 focus:ring-gold outline-none text-text-primary"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {allergensList.map(allergen => (
                      <button
                        key={allergen}
                        type="button"
                        onClick={() => toggleAllergen(allergen)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                          formData.allergens.includes(allergen)
                            ? 'bg-gold border-gold text-white'
                            : 'bg-card border-border-custom text-text-secondary hover:border-gold/50'
                        }`}
                      >
                        {allergen.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gold/5 border border-gold/10 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, is_chef_special: !prev.is_chef_special }))}
                    className={`w-10 h-5 rounded-full transition-all relative ${formData.is_chef_special ? 'bg-gold' : 'bg-white/10'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${formData.is_chef_special ? 'right-1' : 'left-1'}`} />
                  </button>
                  <div className="flex items-center gap-2">
                    <Star size={14} className={formData.is_chef_special ? 'text-gold fill-gold' : 'text-text-secondary'} />
                    <span className="text-xs font-bold text-text-primary">{t('restaurant.dashboard.dishes.chefSpecial')}</span>
                  </div>
                </div>
              </div>
            </div>
          </form>

          <div className="p-6 border-t border-border-custom bg-card/50 flex justify-end gap-4">
            <button 
              onClick={onClose}
              className="px-8 py-3 bg-card border border-border-custom text-text-primary font-bold rounded-xl hover:bg-white/5 transition-all"
            >
              {t('restaurant.dashboard.dishes.cancel')}
            </button>
            <button 
              onClick={handleSubmit}
              disabled={loading}
              className="px-12 py-3 bg-gold text-white font-bold rounded-xl shadow-lg shadow-gold/20 hover:bg-gold/90 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {dish ? t('restaurant.dashboard.dishes.save') : t('restaurant.dashboard.dishes.add')}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Full-screen 3D+AR Viewer */}
      {show3DFull && formData.model_3d_url && (
        <ThreeDViewerFull
          modelUrl={formData.model_3d_url}
          dishName={isRtl ? formData.name_ar : formData.name_en}
          dishNameAr={formData.name_ar}
          price={formData.price ? `${formData.price} $` : ''}
          onClose={() => setShow3DFull(false)}
        />
      )}
    </AnimatePresence>
  );
};
