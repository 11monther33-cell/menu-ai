import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Eye, 
  Box, 
  Image as ImageIcon,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Zap,
  Loader2,
  Upload
} from 'lucide-react';
import { useMenuStore } from '../store/menuStore';
import { useAuth } from '../hooks/useAuth';
import { assetService } from '../services/assetService';
import { cn } from '../lib/utils';
import { MenuItem, MenuCategory } from '../types';
import { toast } from 'react-hot-toast';

const MenuBuilderPage = () => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const { user } = useAuth();
  const { categories, loading, fetchMenu, addItem, updateItem, deleteItem, addCategory, deleteCategory } = useMenuStore();
  
  const [expandedCats, setExpandedCats] = useState<string[]>([]);
  const [isAddingItem, setIsAddingItem] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Form State
  const [newItem, setNewItem] = useState({
    nameAr: '',
    nameEn: '',
    descriptionAr: '',
    descriptionEn: '',
    price: 0,
    currency: 'USD' as const,
    image: '',
    model3D: '',
    available: true
  });

  useEffect(() => {
    if (user?.restaurantId && user.restaurantId !== 'undefined') {
      fetchMenu(user.restaurantId);
    }
  }, [user?.restaurantId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'raw') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await assetService.uploadFile(file, type);
      if (type === 'image') setNewItem(prev => ({ ...prev, image: url }));
      else setNewItem(prev => ({ ...prev, model3D: url }));
      toast.success(isRtl ? 'تم رفع الملف بنجاح' : 'File uploaded successfully');
    } catch (error: any) {
      const msg = error?.message || 'Unknown error';
      toast.error(`Upload Error: ${msg}`, { duration: 10000 });
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddItem = async (categoryId: string) => {
    if (!newItem.nameAr || !newItem.nameEn) return;
    
    try {
      await addItem(categoryId, {
        ...newItem,
        description: newItem.descriptionAr,
        category: categoryId,
        snapShares: 0
      });
      setIsAddingItem(null);
      setNewItem({
        nameAr: '',
        nameEn: '',
        descriptionAr: '',
        descriptionEn: '',
        price: 0,
        currency: 'USD',
        image: '',
        model3D: '',
        available: true
      });
      toast.success(isRtl ? 'تمت إضافة الطبق بنجاح' : 'Dish added successfully');
    } catch (error: any) {
      toast.error(isRtl ? 'فشل في إضافة الطبق' : 'Failed to add dish');
      // 🔒 Don't log to console
    }
  };

  const toggleCat = (id: string) => {
    setExpandedCats(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  if (loading && categories.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-gold" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('menu.builder')}</h1>
          <p className="text-text-secondary mt-1">Manage your restaurant menu, categories, and 3D models.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-6 py-3 bg-card border border-border-custom text-dark-custom font-bold rounded-xl hover:bg-sidebar transition-all flex items-center gap-2">
            <Eye size={18} />
            {t('menu.preview')}
          </button>
          <button 
            onClick={() => {
              const nameAr = prompt('Category Name (AR)');
              const nameEn = prompt('Category Name (EN)');
              if (nameAr && nameEn && user?.restaurantId) {
                addCategory(user.restaurantId, nameAr, nameEn);
              }
            }}
            className="px-6 py-3 bg-gold text-white font-bold rounded-xl hover:bg-gold/90 transition-all flex items-center gap-2 shadow-lg shadow-gold/20"
          >
            <Plus size={18} />
            Add Category
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-card p-4 rounded-2xl border border-border-custom">
        <div className="flex-1 flex items-center gap-3 px-4 py-2 bg-main rounded-xl border border-border-custom">
          <Search size={18} className="text-text-muted" />
          <input type="text" placeholder="Search menu items..." className="bg-transparent outline-none text-sm w-full" />
        </div>
        <button className="p-3 bg-main border border-border-custom rounded-xl hover:bg-sidebar transition-all">
          <Filter size={18} />
        </button>
      </div>

      <div className="space-y-6">
        {categories.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-20 bg-card border border-dashed border-border-custom rounded-[2rem] text-center px-6">
            <div className="w-20 h-20 rounded-full bg-sidebar flex items-center justify-center text-gold mb-6">
              <Filter size={40} />
            </div>
            <h2 className="text-2xl font-bold mb-2">{isRtl ? 'لا توجد أقسام بعد' : 'No Categories Yet'}</h2>
            <p className="text-text-secondary mb-8 max-w-md">
              {isRtl ? 'ابدأ بإنشاء قسم جديد (مثل: المقبلات، الأطباق الرئيسية) لتتمكن من إضافة الأطباق.' : 'Start by creating a new category (e.g., Appetizers, Main Courses) to add dishes.'}
            </p>
            <button 
              onClick={() => {
                const nameAr = prompt(isRtl ? 'اسم القسم (بالعربي)' : 'Category Name (AR)');
                const nameEn = prompt(isRtl ? 'اسم القسم (بالإنجليزي)' : 'Category Name (EN)');
                if (nameAr && nameEn && user?.restaurantId) {
                  addCategory(user.restaurantId, nameAr, nameEn);
                }
              }}
              className="px-8 py-4 bg-gold text-white font-bold rounded-2xl hover:bg-gold/90 transition-all flex items-center gap-2 shadow-xl shadow-gold/20"
            >
              <Plus size={20} />
              {isRtl ? 'إضافة قسم جديد' : 'Add First Category'}
            </button>
          </div>
        )}

        {categories.map((category) => (
          <div key={category.id} className="bg-card border border-border-custom rounded-[2rem] overflow-hidden">
            <div 
              className="p-6 flex items-center justify-between cursor-pointer hover:bg-sidebar/50 transition-colors"
              onClick={() => toggleCat(category.id)}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold">
                  <Filter size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold">{isRtl ? category.nameAr : category.nameEn}</h3>
                  <p className="text-xs text-text-secondary">{category.items.length} Items</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsAddingItem(category.id);
                  }}
                  className="p-2 hover:bg-main rounded-lg text-gold transition-colors"
                >
                  <Plus size={20} />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if(confirm('Delete category?')) deleteCategory(category.id);
                  }}
                  className="p-2 hover:bg-main rounded-lg text-red-500 transition-colors"
                >
                  <Trash2 size={20} />
                </button>
                {expandedCats.includes(category.id) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </div>

            <AnimatePresence>
              {(expandedCats.includes(category.id) || isAddingItem === category.id) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-border-custom"
                >
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {/* Add Item Form */}
                    {isAddingItem === category.id && (
                      <div className="bg-main p-6 rounded-2xl border-2 border-gold/30 space-y-4 shadow-2xl">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-gold">{isRtl ? 'طبق جديد' : 'New Dish'}</h4>
                          <button onClick={() => setIsAddingItem(null)} className="text-text-muted hover:text-red-500">
                            <X size={20} />
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-text-muted uppercase px-1">{isRtl ? 'الاسم (عربي)' : 'Name (AR)'}</label>
                            <input 
                              type="text" 
                              placeholder={isRtl ? 'مثال: حمص باللحمة' : 'e.g. Hummus with Meat'}
                              className="w-full bg-card border border-border-custom p-3 rounded-xl text-sm outline-none focus:border-gold transition-colors"
                              value={newItem.nameAr}
                              onChange={e => setNewItem({...newItem, nameAr: e.target.value})}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-text-muted uppercase px-1">{isRtl ? 'الاسم (إنجليزي)' : 'Name (EN)'}</label>
                            <input 
                              type="text" 
                              placeholder="e.g. Hummus with Meat"
                              className="w-full bg-card border border-border-custom p-3 rounded-xl text-sm outline-none focus:border-gold transition-colors"
                              value={newItem.nameEn}
                              onChange={e => setNewItem({...newItem, nameEn: e.target.value})}
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-text-muted uppercase px-1">{isRtl ? 'الوصف (عربي)' : 'Description (AR)'}</label>
                          <textarea 
                            placeholder={isRtl ? 'وصف الطبق ومكوناته...' : 'Dish description and ingredients...'}
                            className="w-full bg-card border border-border-custom p-3 rounded-xl text-sm h-24 outline-none focus:border-gold transition-colors resize-none"
                            value={newItem.descriptionAr}
                            onChange={e => setNewItem({...newItem, descriptionAr: e.target.value})}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-text-muted uppercase px-1">{isRtl ? 'السعر' : 'Price'}</label>
                            <div className="relative">
                              <input 
                                type="number" 
                                placeholder="0.00"
                                className="w-full bg-card border border-border-custom p-3 rounded-xl text-sm outline-none focus:border-gold transition-colors"
                                value={newItem.price || ''}
                                onChange={e => setNewItem({...newItem, price: parseFloat(e.target.value)})}
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-text-muted">$</span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-text-muted uppercase px-1">{isRtl ? 'الحالة' : 'Status'}</label>
                            <div className="flex items-center h-[46px] px-3 bg-card border border-border-custom rounded-xl">
                              <label className="flex items-center gap-2 cursor-pointer w-full">
                                <input 
                                  type="checkbox" 
                                  className="accent-gold"
                                  checked={newItem.available}
                                  onChange={e => setNewItem({...newItem, available: e.target.checked})}
                                />
                                <span className="text-xs font-bold">{isRtl ? 'متاح للطلب' : 'Available'}</span>
                              </label>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <label className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-border-custom rounded-2xl cursor-pointer hover:bg-gold/5 hover:border-gold/50 transition-all group relative overflow-hidden">
                            {newItem.image ? (
                              <>
                                <img src={newItem.image} className="absolute inset-0 w-full h-full object-cover opacity-20" />
                                <Check size={24} className="text-green-500 relative z-10" />
                                <span className="text-[10px] font-bold uppercase relative z-10 text-green-500">Image Uploaded</span>
                              </>
                            ) : (
                              <>
                                <ImageIcon size={24} className="text-text-muted group-hover:text-gold transition-colors" />
                                <span className="text-[10px] font-bold uppercase group-hover:text-gold transition-colors">{isRtl ? 'صورة الطبق' : 'Dish Image'}</span>
                              </>
                            )}
                            <input type="file" className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'image')} />
                          </label>
                          <label className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-border-custom rounded-2xl cursor-pointer hover:bg-gold/5 hover:border-gold/50 transition-all group relative overflow-hidden">
                            {newItem.model3D ? (
                              <>
                                <div className="absolute inset-0 bg-gold/10" />
                                <Check size={24} className="text-gold relative z-10" />
                                <span className="text-[10px] font-bold uppercase relative z-10 text-gold">3D Model Ready</span>
                              </>
                            ) : (
                              <>
                                <Box size={24} className="text-text-muted group-hover:text-gold transition-colors" />
                                <span className="text-[10px] font-bold uppercase group-hover:text-gold transition-colors">{isRtl ? 'نموذج ثلاثي الأبعاد' : '3D Model (GLB)'}</span>
                              </>
                            )}
                            <input type="file" className="hidden" accept=".glb,.gltf" onChange={e => handleFileUpload(e, 'raw')} />
                          </label>
                        </div>

                        <button 
                          onClick={() => handleAddItem(category.id)}
                          disabled={isUploading || !newItem.nameAr || !newItem.nameEn || !newItem.price}
                          className="w-full py-4 bg-gold text-white font-bold rounded-2xl hover:bg-gold/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-xl shadow-gold/20"
                        >
                          {isUploading ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
                          {isRtl ? 'حفظ الطبق' : 'Save Dish'}
                        </button>
                      </div>
                    )}

                    {category.items.map((item) => (
                      <div key={item.id} className="bg-main p-4 rounded-2xl border border-border-custom group hover:shadow-xl hover:shadow-gold/5 transition-all duration-300">
                        <div className="relative h-40 rounded-xl overflow-hidden mb-4">
                          <img 
                            src={assetService.getOptimizedUrl(item.image, { width: 400 })} 
                            alt={item.nameEn} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                          />
                          <div className="absolute top-2 right-2 flex gap-2">
                            {item.model3D && (
                              <div className="p-1.5 bg-gold text-white rounded-lg shadow-lg">
                                <Box size={14} />
                              </div>
                            )}
                            <button 
                              onClick={() => updateItem(category.id, item.id, { available: !item.available })}
                              className={cn(
                                "px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-lg",
                                item.available ? "bg-green-custom text-white" : "bg-red-500 text-white"
                              )}
                            >
                              {item.available ? t('menu.available') : t('menu.unavailable')}
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold">{isRtl ? item.nameAr : item.nameEn}</h4>
                            <span className="text-gold font-bold">{item.price} $</span>
                          </div>
                          <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                            {isRtl ? item.descriptionAr : item.descriptionEn}
                          </p>
                          <div className="pt-4 flex items-center justify-between border-t border-border-custom mt-4">
                            <div className="flex items-center gap-2">
                              <button className="p-2 hover:bg-sidebar rounded-lg text-text-secondary hover:text-dark-custom transition-all">
                                <Edit2 size={16} />
                              </button>
                              <button 
                                onClick={() => deleteItem(category.id, item.id)}
                                className="p-2 hover:bg-red-50 rounded-lg text-text-secondary hover:text-red-500 transition-all"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-text-muted">
                              <Zap size={12} className="text-gold" />
                              {item.snapShares} Shares
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {!isAddingItem && (
                      <button 
                        onClick={() => setIsAddingItem(category.id)}
                        className="h-full min-h-[250px] border-2 border-dashed border-border-custom rounded-2xl flex flex-col items-center justify-center gap-3 text-text-muted hover:text-gold hover:border-gold/50 hover:bg-gold/5 transition-all group"
                      >
                        <div className="w-12 h-12 rounded-full bg-sidebar flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Plus size={24} />
                        </div>
                        <span className="font-bold text-sm">Add New Item</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};

const MenuIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18M3 12h18M3 18h18" />
  </svg>
);

export default MenuBuilderPage;
