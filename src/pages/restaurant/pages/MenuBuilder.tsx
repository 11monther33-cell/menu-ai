import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuth } from '../../../hooks/useAuth';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Search, Filter, ArrowUpDown, 
  LayoutGrid, List, MoreVertical, Edit2, 
  Trash2, Eye, EyeOff, GripVertical,
  CheckCircle2, AlertCircle, Star, ClipboardList, Utensils, Box, X
} from 'lucide-react';
import { ThreeViewer } from '../../../components/ThreeViewer';
import toast from 'react-hot-toast';
import { DishModal } from '../../../components/DishModal';

export const MenuBuilder = () => {
  const { isRtl, t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<any[]>([]);
  const [dishes, setDishes] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<any>(null);
  const [previewDish, setPreviewDish] = useState<any>(null);

  useEffect(() => {
    if (!user?.restaurantId || user.restaurantId === 'undefined') return;

    const fetchData = async () => {
      if (!user?.restaurantId || user.restaurantId === 'undefined') return;
      
      const [catsRes, dishesRes] = await Promise.all([
        supabase.from('categories').select('*').eq('restaurant_id', user.restaurantId).order('sort_order'),
        supabase.from('dishes').select('*').eq('restaurant_id', user.restaurantId).order('created_at', { ascending: false })
      ]);

      if (catsRes.data) {
        setCategories(catsRes.data);
        if (catsRes.data.length > 0) setSelectedCategory(catsRes.data[0].id);
      }
      if (dishesRes.data) setDishes(dishesRes.data);
      setLoading(false);
    };

    fetchData();
  }, [user?.restaurantId]);

  const handleDeleteDish = async (id: string) => {
    if (!confirm(isRtl ? 'هل أنت متأكد من حذف هذا الطبق؟' : 'Are you sure you want to delete this dish?')) return;
    try {
      // 🔒 SECURITY: Filter by restaurant_id to prevent IDOR
      const { error } = await supabase
        .from('dishes')
        .delete()
        .eq('id', id)
        .eq('restaurant_id', user?.restaurantId);
      if (error) throw error;
      setDishes(prev => prev.filter(d => d.id !== id));
      toast.success(isRtl ? 'تم حذف الطبق' : 'Dish deleted');
    } catch (err: any) {
      toast.error(isRtl ? 'فشل الحذف' : 'Delete failed');
    }
  };

  const filteredDishes = dishes.filter(dish => {
    const matchesSearch = (isRtl ? dish.name_ar : dish.name_en).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory ? dish.category_id === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  const toggleAvailability = async (dishId: string, currentStatus: boolean) => {
    try {
      // 🔒 SECURITY: Filter by restaurant_id to prevent IDOR
      const { error } = await supabase
        .from('dishes')
        .update({ is_available: !currentStatus })
        .eq('id', dishId)
        .eq('restaurant_id', user?.restaurantId);

      if (error) throw error;
      setDishes(prev => prev.map(d => d.id === dishId ? { ...d, is_available: !currentStatus } : d));
      toast.success(isRtl ? 'تم تحديث الحالة' : 'Status updated');
    } catch (err) {
      toast.error(isRtl ? 'فشل التحديث' : 'Update failed');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-12rem)] gap-6 lg:gap-8">
      {/* Left Panel: Categories */}
      <aside className="w-full lg:w-80 flex flex-col bg-sidebar border border-border-custom rounded-[2rem] overflow-hidden shrink-0">
        <div className="p-6 border-b border-border-custom">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg text-text-primary">{t('restaurant.nav.categories')}</h3>
            <button 
              onClick={() => navigate('/dashboard/categories')}
              className="p-2 text-gold hover:bg-gold/10 rounded-lg transition-all"
            >
              <Plus size={20} />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
            <input 
              type="text" 
              placeholder={isRtl ? 'بحث...' : 'Search...'}
              className="w-full bg-card border border-border-custom rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-gold outline-none text-text-primary"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar max-h-[300px] lg:max-h-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                selectedCategory === cat.id 
                  ? 'bg-gold text-white font-bold shadow-lg shadow-gold/20' 
                  : 'text-text-secondary hover:bg-card hover:text-text-primary'
              }`}
            >
              <GripVertical size={16} className={`shrink-0 ${selectedCategory === cat.id ? 'text-white/50' : 'text-text-secondary/30 group-hover:text-text-secondary'}`} />
              <div className="w-8 h-8 bg-card rounded-lg flex items-center justify-center border border-border-custom shrink-0">
                <Filter size={14} className={selectedCategory === cat.id ? 'text-gold' : 'text-text-secondary'} />
              </div>
              <span className="flex-1 text-left rtl:text-right truncate">{isRtl ? cat.name_ar : cat.name_en}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${selectedCategory === cat.id ? 'bg-white/20 text-white' : 'bg-card text-text-secondary'}`}>
                {dishes.filter(d => d.category_id === cat.id).length}
              </span>
            </button>
          ))}
          
          {categories.length === 0 && !loading && (
            <div className="py-12 text-center text-text-secondary text-sm">
              {isRtl ? 'لا توجد تصنيفات' : 'No categories found'}
            </div>
          )}
        </div>
      </aside>

      {/* Right Panel: Dishes */}
      <main className="flex-1 flex flex-col bg-sidebar border border-border-custom rounded-[2rem] overflow-hidden">
        <div className="p-4 lg:p-6 border-b border-border-custom flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isRtl ? 'ابحث عن طبق...' : 'Search dishes...'}
                className="w-full bg-card border border-border-custom rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-1 focus:ring-gold outline-none text-text-primary"
              />
            </div>
            <button className="p-2.5 bg-card text-text-secondary hover:text-text-primary rounded-xl border border-border-custom transition-all">
              <Filter size={20} />
            </button>
            <button className="p-2.5 bg-card text-text-secondary hover:text-text-primary rounded-xl border border-border-custom transition-all">
              <ArrowUpDown size={20} />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-card p-1 rounded-xl border border-border-custom">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-main text-gold shadow-sm border border-border-custom' : 'text-text-secondary hover:text-text-primary'}`}
              >
                <LayoutGrid size={18} />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-main text-gold shadow-sm border border-border-custom' : 'text-text-secondary hover:text-text-primary'}`}
              >
                <List size={18} />
              </button>
            </div>
            <button 
              onClick={() => {
                if (categories.length === 0) {
                  toast.error(isRtl ? 'يرجى إضافة تصنيف أولاً' : 'Please add a category first');
                  return;
                }
                navigate('/dashboard/dishes/new');
              }}
              className="px-6 py-2.5 bg-gold text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-gold/20 hover:bg-gold/90 transition-all disabled:opacity-50"
            >
              <Plus size={20} />
              {isRtl ? 'إضافة طبق' : 'Add Dish'}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-main/30">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredDishes.map((dish) => (
                <motion.div 
                  key={dish.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-main border border-border-custom rounded-3xl overflow-hidden group hover:border-gold/30 hover:shadow-xl hover:shadow-gold/5 transition-all"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={dish.image_url || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=400&auto=format&fit=crop'} 
                      alt="" 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-3 left-3 flex gap-2">
                      {dish.is_available ? (
                        <span className="px-2 py-1 bg-green-500/90 text-white text-[10px] font-bold rounded-lg backdrop-blur-md">
                          {isRtl ? 'متاح' : 'AVAILABLE'}
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-red-500/90 text-white text-[10px] font-bold rounded-lg backdrop-blur-md">
                          {isRtl ? 'نفد' : 'OUT OF STOCK'}
                        </span>
                      )}
                      {dish.model_3d_url && (
                        <button 
                          onClick={() => setPreviewDish(dish)}
                          className="px-2 py-1 bg-gold/90 text-white text-[10px] font-bold rounded-lg backdrop-blur-md flex items-center gap-1 hover:scale-105 transition-transform"
                        >
                          <Box size={10} />
                          3D
                        </button>
                      )}
                      {dish.is_chef_special && (
                        <span className="px-2 py-1 bg-orange-500/90 text-white text-[10px] font-bold rounded-lg backdrop-blur-md flex items-center gap-1">
                          <Star size={10} className="fill-white" />
                          SPECIAL
                        </span>
                      )}
                    </div>
                    <div className="absolute top-3 right-3">
                      <button className="p-2 bg-text-primary/50 text-white rounded-xl backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-lg text-text-primary">{isRtl ? dish.name_ar : dish.name_en}</h4>
                      <span className="text-gold font-bold">{dish.price} $</span>
                    </div>
                    <p className="text-xs text-text-secondary line-clamp-2 mb-4 h-8">
                      {isRtl ? dish.description_ar : dish.description_en}
                    </p>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-border-custom">
                      <div className="flex items-center gap-3 text-text-secondary">
                        <div className="flex items-center gap-1">
                          <Eye size={14} />
                          <span className="text-[10px]">{dish.view_count || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ClipboardList size={14} />
                          <span className="text-[10px]">{dish.order_count || 0}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            navigate(`/dashboard/dishes/${dish.id}/edit`);
                          }}
                          className="p-2 text-text-secondary hover:text-gold transition-all"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteDish(dish.id)}
                          className="p-2 text-text-secondary hover:text-red-500 transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                        <button 
                          onClick={() => toggleAvailability(dish.id, dish.is_available)}
                          className={`p-2 transition-all ${dish.is_available ? 'text-green-500 hover:text-red-500' : 'text-red-500 hover:text-green-500'}`}
                        >
                          {dish.is_available ? <Eye size={18} /> : <EyeOff size={18} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-main border border-border-custom rounded-2xl overflow-hidden">
              <table className="w-full text-left rtl:text-right">
                <thead className="bg-card/50 text-xs text-text-secondary uppercase">
                  <tr>
                    <th className="px-6 py-4 font-bold">Dish</th>
                    <th className="px-6 py-4 font-bold">Price</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                    <th className="px-6 py-4 font-bold">Stats</th>
                    <th className="px-6 py-4 font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-custom">
                  {filteredDishes.map((dish) => (
                    <tr key={dish.id} className="hover:bg-card/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={dish.image_url} alt="" className="w-10 h-10 rounded-lg object-cover border border-border-custom" />
                          <span className="font-bold text-sm text-text-primary">{isRtl ? dish.name_ar : dish.name_en}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-gold">{dish.price} $</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${dish.is_available ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                          {dish.is_available ? 'AVAILABLE' : 'OUT OF STOCK'}
                        </span>
                        {dish.model_3d_url && (
                          <button 
                            onClick={() => setPreviewDish(dish)}
                            className="ml-2 px-2 py-1 bg-gold/10 text-gold text-[10px] font-bold rounded-md hover:bg-gold/20 transition-all"
                          >
                            3D
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-3 text-text-secondary text-[10px]">
                          <span>👁 {dish.view_count || 0}</span>
                          <span>📦 {dish.order_count || 0}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              navigate(`/dashboard/dishes/${dish.id}/edit`);
                            }}
                            className="p-1.5 text-text-secondary hover:text-gold transition-all"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteDish(dish.id)}
                            className="p-1.5 text-text-secondary hover:text-red-500 transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {filteredDishes.length === 0 && !loading && (
            <div className="h-full flex flex-col items-center justify-center text-center py-20">
              <div className="w-20 h-20 bg-card rounded-full flex items-center justify-center mb-4 text-text-secondary">
                <Utensils size={32} />
              </div>
              <h4 className="font-bold text-lg mb-1 text-text-primary">{isRtl ? 'لم يتم العثور على أطباق' : 'No dishes found'}</h4>
              <p className="text-text-secondary text-sm">{isRtl ? 'جرب البحث بكلمات أخرى أو اختر تصنيفاً مختلفاً' : 'Try searching for something else or select a different category'}</p>
            </div>
          )}
        </div>

        {/* Dish Modal Disabled (using new page) */}

        {/* 3D Preview Modal */}
        <AnimatePresence>
          {previewDish && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setPreviewDish(null)}
                className="absolute inset-0 bg-black/90 backdrop-blur-md"
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative w-full max-w-4xl bg-sidebar border border-border-custom rounded-[2.5rem] overflow-hidden shadow-2xl"
              >
                <div className="p-6 border-b border-border-custom flex items-center justify-between">
                  <h3 className="text-xl font-bold text-text-primary">
                    {isRtl ? previewDish.name_ar : previewDish.name_en} - 3D Preview
                  </h3>
                  <button onClick={() => setPreviewDish(null)} className="p-2 hover:bg-white/5 rounded-xl transition-all">
                    <X size={24} className="text-text-secondary" />
                  </button>
                </div>
                <div className="p-8">
                  <ThreeViewer 
                    modelUrl={previewDish.model_3d_url} 
                    name={isRtl ? previewDish.name_ar : previewDish.name_en}
                  />
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};
