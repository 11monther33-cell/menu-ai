import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuth } from '../../../hooks/useAuth';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Search, Edit2, Trash2, 
  GripVertical, Check, X, Layers
} from 'lucide-react';
import toast from 'react-hot-toast';

export const Categories = () => {
  const { isRtl, t } = useLanguage();
  const { user } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [formData, setFormData] = useState({
    name_ar: '',
    name_en: '',
  });

  useEffect(() => {
    if (!user?.restaurantId || user.restaurantId === 'undefined') return;
    fetchCategories();
  }, [user?.restaurantId]);

  const fetchCategories = async () => {
    if (!user?.restaurantId || user.restaurantId === 'undefined') return;
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('restaurant_id', user.restaurantId)
        .order('sort_order');
      
      if (error) throw error;
      setCategories(data || []);
    } catch (err: any) {
      toast.error(isRtl ? 'فشل تحميل التصنيفات' : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        // 🔒 SECURITY: Filter by restaurant_id to prevent IDOR
        const { error } = await supabase
          .from('categories')
          .update({
            name_ar: formData.name_ar.substring(0, 100),
            name_en: formData.name_en.substring(0, 100),
          })
          .eq('id', editingCategory.id)
          .eq('restaurant_id', user?.restaurantId); // 🔒 Ownership check
        if (error) throw error;
        toast.success(isRtl ? 'تم التحديث بنجاح' : 'Updated successfully');
      } else {
        const { error } = await supabase
          .from('categories')
          .insert([{
            name_ar: formData.name_ar.substring(0, 100),
            name_en: formData.name_en.substring(0, 100),
            restaurant_id: user?.restaurantId,
            sort_order: categories.length
          }]);
        if (error) throw error;
        toast.success(isRtl ? 'تمت الإضافة بنجاح' : 'Added successfully');
      }
      setIsModalOpen(false);
      setEditingCategory(null);
      setFormData({ name_ar: '', name_en: '' });
      fetchCategories();
    } catch (err: any) {
      // 🔒 Don't expose raw DB errors
      toast.error(isRtl ? 'حدث خطأ. حاول مرة أخرى.' : 'An error occurred. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(isRtl ? 'هل أنت متأكد من الحذف؟' : 'Are you sure you want to delete?')) return;
    try {
      // 🔒 SECURITY: Filter by restaurant_id to prevent deleting other restaurants' categories
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
        .eq('restaurant_id', user?.restaurantId); // 🔒 Ownership check
      if (error) throw error;
      toast.success(isRtl ? 'تم الحذف' : 'Deleted');
      fetchCategories();
    } catch (err: any) {
      toast.error(isRtl ? 'فشل الحذف' : 'Delete failed');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-text-primary">{t('restaurant.nav.categories')}</h2>
          <p className="text-text-secondary mt-1">{isRtl ? 'إدارة تصنيفات المنيو' : 'Manage your menu categories'}</p>
        </div>
        <button 
          onClick={() => {
            setEditingCategory(null);
            setFormData({ name_ar: '', name_en: '' });
            setIsModalOpen(true);
          }}
          className="px-6 py-3 bg-gold text-white font-bold rounded-2xl flex items-center gap-2 shadow-lg shadow-gold/20 hover:bg-gold/90 transition-all"
        >
          <Plus size={20} />
          {isRtl ? 'إضافة تصنيف' : 'Add Category'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => (
          <motion.div 
            key={cat.id}
            layout
            className="bg-sidebar border border-border-custom p-6 rounded-[2rem] flex items-center gap-4 group hover:border-gold/30 transition-all"
          >
            <div className="w-14 h-14 bg-card rounded-2xl flex items-center justify-center text-2xl border border-border-custom">
              <Layers size={24} className="text-gold" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-text-primary truncate">{isRtl ? cat.name_ar : cat.name_en}</h4>
              <p className="text-xs text-text-secondary">{isRtl ? cat.name_en : cat.name_ar}</p>
            </div>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => {
                  setEditingCategory(cat);
                  setFormData({ name_ar: cat.name_ar, name_en: cat.name_en });
                  setIsModalOpen(true);
                }}
                className="p-2 text-text-secondary hover:text-gold transition-all"
              >
                <Edit2 size={18} />
              </button>
              <button 
                onClick={() => handleDelete(cat.id)}
                className="p-2 text-text-secondary hover:text-red-500 transition-all"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </motion.div>
        ))}

        {categories.length === 0 && !loading && (
          <div className="col-span-full py-20 text-center">
            <div className="w-20 h-20 bg-card rounded-full flex items-center justify-center mx-auto mb-4 text-text-secondary">
              <Layers size={32} />
            </div>
            <h4 className="font-bold text-lg text-text-primary">{isRtl ? 'لا توجد تصنيفات' : 'No categories yet'}</h4>
            <p className="text-text-secondary text-sm mt-1">{isRtl ? 'ابدأ بإضافة أول تصنيف للمنيو الخاص بك' : 'Start by adding your first menu category'}</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-sidebar border border-border-custom rounded-[2.5rem] p-8 shadow-2xl"
            >
              <h3 className="text-2xl font-bold text-text-primary mb-6">
                {editingCategory ? (isRtl ? 'تعديل تصنيف' : 'Edit Category') : (isRtl ? 'إضافة تصنيف جديد' : 'Add New Category')}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Name (AR)</label>
                  <input 
                    required
                    value={formData.name_ar}
                    onChange={e => setFormData(prev => ({ ...prev, name_ar: e.target.value }))}
                    className="w-full bg-card border border-border-custom rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-gold outline-none text-text-primary"
                    placeholder="اسم التصنيف..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Name (EN)</label>
                  <input 
                    required
                    value={formData.name_en}
                    onChange={e => setFormData(prev => ({ ...prev, name_en: e.target.value }))}
                    className="w-full bg-card border border-border-custom rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-gold outline-none text-text-primary"
                    placeholder="Category name..."
                  />
                </div>

                <div className="pt-4 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 bg-card border border-border-custom text-text-primary font-bold rounded-xl hover:bg-white/5 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-gold text-white font-bold rounded-xl shadow-lg shadow-gold/20 hover:bg-gold/90 transition-all"
                  >
                    {editingCategory ? (isRtl ? 'حفظ' : 'Save') : (isRtl ? 'إضافة' : 'Add')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
