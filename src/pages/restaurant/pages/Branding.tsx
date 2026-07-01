import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuth } from '../../../hooks/useAuth';
import { motion } from 'motion/react';
import { 
  Palette, Image as ImageIcon, Type, 
  Smartphone, Globe, Save, RotateCcw,
  Instagram, MessageCircle, Twitter
} from 'lucide-react';
import { assetService } from '../../../services/assetService';
import toast from 'react-hot-toast';

export const Branding = () => {
  const { isRtl, t } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [branding, setBranding] = useState({
    slug: '',
    logo_url: '',
    cover_url: '',
    primary_color: '#C9A84C',
    secondary_color: '#0F0E0B',
    text_color: '#F5F0E8',
    bg_color: '#1A1917',
    font_family_ar: 'Cairo',
    font_family_en: 'Space Grotesk',
    welcome_message_ar: '',
    welcome_message_en: '',
    instagram: '',
    whatsapp: '',
    twitter: ''
  });

  useEffect(() => {
    if (!user?.restaurantId || user.restaurantId === 'undefined') return;
    const fetchBranding = async () => {
      if (!user?.restaurantId || user.restaurantId === 'undefined') return;
      const { data } = await supabase
        .from('restaurants')
        .select('branding, slug')
        .eq('id', user.restaurantId)
        .single();
      
      if (data) {
        setBranding({
          ...data.branding,
          slug: data.slug || ''
        });
      }
    };
    fetchBranding();
  }, [user?.restaurantId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'cover') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const url = await assetService.uploadFile(file, 'image');
      
      setBranding(prev => ({
        ...prev,
        [type === 'logo' ? 'logo_url' : 'cover_url']: url
      }));
      toast.success(isRtl ? 'تم الرفع بنجاح' : 'Uploaded successfully');
    } catch (err: any) {
      toast.error(isRtl ? 'فشل الرفع' : 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (!confirm(isRtl ? 'هل أنت متأكد من إعادة تعيين جميع الإعدادات؟' : 'Are you sure you want to reset all settings?')) return;
    setBranding(prev => ({
      ...prev,
      primary_color: '#C9A84C',
      secondary_color: '#0F0E0B',
      text_color: '#F5F0E8',
      bg_color: '#1A1917',
      font_family_ar: 'Cairo',
      font_family_en: 'Space Grotesk',
      welcome_message_ar: '',
      welcome_message_en: '',
      instagram: '',
      whatsapp: '',
      twitter: ''
    }));
  };

  const copyUrl = () => {
    const url = `${window.location.origin}/menu/${branding.slug}`;
    navigator.clipboard.writeText(url);
    toast.success(isRtl ? 'تم نسخ الرابط' : 'URL copied to clipboard');
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { slug, ...brandingData } = branding;
      
      const { error } = await supabase
        .from('restaurants')
        .update({ 
          branding: brandingData,
          slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, '-')
        })
        .eq('id', user?.restaurantId);

      if (error) throw error;
      toast.success(isRtl ? 'تم حفظ التغييرات' : 'Changes saved successfully');
    } catch (err) {
      toast.error(isRtl ? 'فشل الحفظ' : 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col xl:flex-row gap-8 h-[calc(100vh-12rem)]">
      {/* Editor Panel */}
      <div className="flex-1 bg-sidebar border border-border-custom rounded-[2.5rem] overflow-y-auto custom-scrollbar">
        <div className="p-8 space-y-10">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold mb-1 text-text-primary">{t('restaurant.nav.branding')}</h2>
              <p className="text-sm text-text-secondary">{isRtl ? 'خصص مظهر المنيو الخاص بك' : 'Customize your menu appearance'}</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={handleReset}
                className="p-2.5 bg-card text-text-secondary hover:text-red-500 rounded-xl border border-border-custom transition-all"
                title={isRtl ? 'إعادة تعيين' : 'Reset to Default'}
              >
                <RotateCcw size={20} />
              </button>
              <button 
                onClick={handleSave}
                disabled={loading}
                className="px-6 py-2.5 bg-gold text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-gold/20 hover:bg-gold/90 transition-all disabled:opacity-50"
              >
                <Save size={20} />
                {loading ? (isRtl ? 'جاري الحفظ...' : 'Saving...') : (isRtl ? 'حفظ التغييرات' : 'Save Changes')}
              </button>
            </div>
          </div>

          {/* URL & Slug */}
          <section className="space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2 text-text-primary">
              <Globe size={20} className="text-gold" />
              {isRtl ? 'رابط المنيو' : 'Menu URL'}
            </h3>
            <div className="space-y-3">
              <label className="text-sm font-bold text-text-secondary">{isRtl ? 'اسم الرابط (Slug)' : 'Custom Slug'}</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center bg-card border border-border-custom rounded-xl px-4 py-3 text-sm">
                  <span className="text-text-secondary">VISIONOapp.com/</span>
                  <input 
                    type="text" 
                    value={branding.slug}
                    onChange={(e) => setBranding(prev => ({ ...prev, slug: e.target.value }))}
                    className="bg-transparent outline-none text-gold font-bold flex-1"
                    placeholder="your-restaurant"
                  />
                </div>
                <button 
                  onClick={copyUrl}
                  className="p-3 bg-card border border-border-custom rounded-xl text-text-secondary hover:text-gold transition-all"
                  title={isRtl ? 'نسخ الرابط' : 'Copy URL'}
                >
                  <Globe size={18} />
                </button>
              </div>
              <p className="text-[10px] text-text-secondary italic">
                {isRtl ? 'هذا هو الرابط الذي سيتم توجيه الزبائن إليه عند مسح الكود' : 'This is the URL guests will visit when scanning your QR codes'}
              </p>
            </div>
          </section>

          {/* Logo & Cover */}
          <section className="space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2 text-text-primary">
              <ImageIcon size={20} className="text-gold" />
              {isRtl ? 'الشعار والصور' : 'Logo & Images'}
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-sm font-bold text-text-secondary">{isRtl ? 'الشعار (Logo)' : 'Logo'}</label>
                <div className="relative p-8 border-2 border-dashed border-border-custom rounded-2xl flex flex-col items-center justify-center gap-4 hover:border-gold/30 transition-all cursor-pointer bg-main/50 group">
                  {branding.logo_url ? (
                    <img src={branding.logo_url} alt="Logo" className="w-20 h-20 object-contain" />
                  ) : (
                    <div className="w-16 h-16 bg-card rounded-xl flex items-center justify-center text-text-secondary">
                      <ImageIcon size={32} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <label className="cursor-pointer p-3 bg-gold text-white rounded-full">
                      <Save size={20} />
                      <input type="file" accept="image/*" className="hidden" onChange={e => handleUpload(e, 'logo')} />
                    </label>
                  </div>
                  <p className="text-xs text-text-secondary text-center">PNG, SVG · 400×400px</p>
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-sm font-bold text-text-secondary">{isRtl ? 'صورة الغلاف' : 'Cover Image'}</label>
                <div className="h-[156px] border-2 border-dashed border-border-custom rounded-2xl flex flex-col items-center justify-center gap-4 hover:border-gold/30 transition-all cursor-pointer overflow-hidden relative bg-main/50 group">
                  {branding.cover_url ? (
                    <img src={branding.cover_url} alt="Cover" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-text-secondary flex flex-col items-center gap-2">
                      <ImageIcon size={32} />
                      <p className="text-xs">16:9 Aspect Ratio</p>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <label className="cursor-pointer p-3 bg-gold text-white rounded-full">
                      <Save size={20} />
                      <input type="file" accept="image/*" className="hidden" onChange={e => handleUpload(e, 'cover')} />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Colors */}
          <section className="space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2 text-text-primary">
              <Palette size={20} className="text-gold" />
              {isRtl ? 'الألوان' : 'Colors'}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: isRtl ? 'الرئيسي' : 'Primary', key: 'primary_color' },
                { label: isRtl ? 'الثانوي' : 'Secondary', key: 'secondary_color' },
                { label: isRtl ? 'النص' : 'Text', key: 'text_color' },
                { label: isRtl ? 'الخلفية' : 'Background', key: 'bg_color' },
              ].map((color) => (
                <div key={color.key} className="space-y-2">
                  <label className="text-xs font-bold text-text-secondary">{color.label}</label>
                  <div className="flex items-center gap-2 p-2 bg-card rounded-xl border border-border-custom">
                    <input 
                      type="color" 
                      value={(branding as any)[color.key]}
                      onChange={(e) => setBranding(prev => ({ ...prev, [color.key]: e.target.value }))}
                      className="w-8 h-8 bg-transparent border-none rounded cursor-pointer"
                    />
                    <span className="text-[10px] font-mono uppercase text-text-primary">{(branding as any)[color.key]}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Typography */}
          <section className="space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2 text-text-primary">
              <Type size={20} className="text-gold" />
              {isRtl ? 'الخطوط' : 'Typography'}
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-text-secondary">Arabic Font</label>
                <select 
                  value={branding.font_family_ar}
                  onChange={(e) => setBranding(prev => ({ ...prev, font_family_ar: e.target.value }))}
                  className="w-full bg-card border border-border-custom rounded-xl py-3 px-4 text-sm outline-none text-text-primary"
                >
                  <option>Cairo</option>
                  <option>Tajawal</option>
                  <option>Almarai</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-text-secondary">English Font</label>
                <select 
                  value={branding.font_family_en}
                  onChange={(e) => setBranding(prev => ({ ...prev, font_family_en: e.target.value }))}
                  className="w-full bg-card border border-border-custom rounded-xl py-3 px-4 text-sm outline-none text-text-primary"
                >
                  <option>Space Grotesk</option>
                  <option>Inter</option>
                  <option>Poppins</option>
                </select>
              </div>
            </div>
          </section>

          {/* Social Links */}
          <section className="space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2 text-text-primary">
              <Globe size={20} className="text-gold" />
              {isRtl ? 'روابط التواصل' : 'Social Links'}
            </h3>
            <div className="space-y-4">
              <div className="relative">
                <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                <input 
                  type="text" 
                  value={branding.instagram}
                  onChange={(e) => setBranding(prev => ({ ...prev, instagram: e.target.value }))}
                  placeholder="Instagram Username"
                  className="w-full bg-card border border-border-custom rounded-xl py-3 pl-12 pr-4 text-sm outline-none text-text-primary"
                />
              </div>
              <div className="relative">
                <MessageCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                <input 
                  type="text" 
                  value={branding.whatsapp}
                  onChange={(e) => setBranding(prev => ({ ...prev, whatsapp: e.target.value }))}
                  placeholder="WhatsApp Number"
                  className="w-full bg-card border border-border-custom rounded-xl py-3 pl-12 pr-4 text-sm outline-none text-text-primary"
                />
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Preview Panel */}
      <div className="w-full xl:w-[400px] bg-sidebar border border-border-custom rounded-[2.5rem] p-8 flex flex-col items-center justify-center">
        <div className="mb-6 text-center">
          <h3 className="font-bold flex items-center gap-2 justify-center text-text-primary">
            <Smartphone size={20} className="text-gold" />
            {isRtl ? 'معاينة مباشرة' : 'Live Preview'}
          </h3>
          <p className="text-xs text-text-secondary mt-1">{isRtl ? 'هكذا سيظهر المنيو لزبائنك' : 'How your menu looks to guests'}</p>
        </div>

        {/* Phone Mockup */}
        <div className="relative w-[280px] h-[560px] bg-black rounded-[3rem] border-[8px] border-text-primary shadow-2xl overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-6 bg-black flex justify-center items-end pb-1 z-10">
            <div className="w-16 h-3 bg-text-primary/20 rounded-full" />
          </div>
          
          <div 
            className="h-full overflow-y-auto custom-scrollbar"
            style={{ backgroundColor: branding.bg_color, color: branding.text_color, fontFamily: isRtl ? branding.font_family_ar : branding.font_family_en }}
          >
            {/* Mock Menu Content */}
            <div className="h-40 bg-card relative overflow-hidden">
              {branding.cover_url && <img src={branding.cover_url} className="w-full h-full object-cover opacity-50" />}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-4 left-4 flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center p-2">
                  {branding.logo_url ? <img src={branding.logo_url} className="w-full h-full object-contain" /> : <div className="w-full h-full bg-gold rounded" />}
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">{user?.restaurantName}</h4>
                  <p className="text-[10px] text-white/60">Open Now</p>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-6">
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {['All', 'Burgers', 'Drinks', 'Sides'].map((cat, i) => (
                  <span 
                    key={`preview-cat-${i}`} 
                    className="px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap border transition-all"
                    style={{ 
                      backgroundColor: i === 1 ? branding.primary_color : 'transparent',
                      color: i === 1 ? '#fff' : branding.text_color,
                      borderColor: i === 1 ? branding.primary_color : 'rgba(255,255,255,0.1)'
                    }}
                  >
                    {cat}
                  </span>
                ))}
              </div>

              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={`preview-dish-${i}`} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                    <div className="h-24 bg-white/10" />
                    <div className="p-3">
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-bold text-xs">Wagyu Burger</p>
                        <p className="text-xs font-bold" style={{ color: branding.primary_color }}>95 $</p>
                      </div>
                      <p className="text-[10px] opacity-60 line-clamp-1">Classic wagyu beef with special sauce...</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
