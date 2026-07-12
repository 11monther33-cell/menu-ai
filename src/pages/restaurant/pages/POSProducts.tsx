import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuth } from '../../../hooks/useAuth';
import {
  fetchProducts,
  fetchCategories,
  fetchInventory,
  createProduct,
  updateProduct,
  deleteCategory,
  createCategory,
  POSProduct,
  POSMenuCategory,
  POSInventoryItem,
  fetchProductWithRecipe
} from '../../../services/posService';
import { usePOSStore } from '../../../store/posStore';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import {
  Plus, RefreshCw, X, Edit, Trash2, Layers, Save, Tag
} from 'lucide-react';

export const POSProducts = () => {
  const { isRtl } = useLanguage();
  const { user } = useAuth();
  const { currentBranch } = usePOSStore();

  const [products, setProducts] = useState<POSProduct[]>([]);
  const [categories, setCategories] = useState<POSMenuCategory[]>([]);
  const [inventory, setInventory] = useState<POSInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals / Panels
  const [showAddEditProduct, setShowAddEditProduct] = useState<Partial<POSProduct> | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Form States
  const [productForm, setProductForm] = useState({
    name: '',
    sku: '',
    selling_price: 0,
    category_id: '',
    recipe: [] as { inventory_item_id: string; quantity_used: number }[]
  });

  const [newCatName, setNewCatName] = useState('');

  const loadData = async () => {
    if (!currentBranch) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [prodData, catData, invData] = await Promise.all([
        fetchProducts(currentBranch.id),
        fetchCategories(currentBranch.id),
        fetchInventory(currentBranch.id)
      ]);
      setProducts(prodData);
      setCategories(catData);
      setInventory(invData);
    } catch (err) {
      console.error(err);
      toast.error(isRtl ? 'فشل تحميل البيانات' : 'Failed to load products/categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentBranch?.id]);

  const handleOpenAdd = () => {
    setProductForm({
      name: '',
      sku: '',
      selling_price: 0,
      category_id: categories[0]?.id || '',
      recipe: []
    });
    setShowAddEditProduct({});
  };

  const handleOpenEdit = async (prod: POSProduct) => {
    try {
      const fullProd = await fetchProductWithRecipe(prod.id);
      if (fullProd) {
        setProductForm({
          name: fullProd.name,
          sku: fullProd.sku || '',
          selling_price: Number(fullProd.selling_price),
          category_id: fullProd.category_id || '',
          recipe: (fullProd.recipe || []).map(r => ({
            inventory_item_id: r.inventory_item_id,
            quantity_used: Number(r.quantity_used)
          }))
        });
        setShowAddEditProduct(fullProd);
      }
    } catch (err) {
      toast.error(isRtl ? 'فشل تحميل تفاصيل الصنف' : 'Failed to load item details');
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBranch) return;

    try {
      if (showAddEditProduct?.id) {
        // Edit mode
        await updateProduct(
          showAddEditProduct.id,
          {
            name: productForm.name,
            sku: productForm.sku,
            selling_price: productForm.selling_price,
            category_id: productForm.category_id || undefined
          },
          productForm.recipe
        );
        toast.success(isRtl ? 'تم تعديل المنتج بنجاح' : 'Product updated successfully');
      } else {
        // Create mode
        await createProduct(
          currentBranch.id,
          {
            name: productForm.name,
            sku: productForm.sku,
            selling_price: productForm.selling_price,
            category_id: productForm.category_id || undefined
          },
          productForm.recipe
        );
        toast.success(isRtl ? 'تم إضافة منتج جديد بنجاح' : 'Product created successfully');
      }
      setShowAddEditProduct(null);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error(isRtl ? 'فشل حفظ المنتج' : 'Failed to save product');
    }
  };

  const handleAddRecipeRow = () => {
    const defaultInv = inventory[0]?.id || '';
    setProductForm({
      ...productForm,
      recipe: [...productForm.recipe, { inventory_item_id: defaultInv, quantity_used: 1 }]
    });
  };

  const handleRemoveRecipeRow = (idx: number) => {
    setProductForm({
      ...productForm,
      recipe: productForm.recipe.filter((_, i) => i !== idx)
    });
  };

  const handleRecipeChange = (idx: number, field: string, val: any) => {
    const updated = [...productForm.recipe];
    updated[idx] = { ...updated[idx], [field]: val };
    setProductForm({ ...productForm, recipe: updated });
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBranch || !newCatName) return;
    try {
      await createCategory(currentBranch.id, newCatName);
      toast.success(isRtl ? 'تم إضافة فئة جديدة' : 'Category added');
      setNewCatName('');
      loadData();
    } catch (err) {
      toast.error(isRtl ? 'فشل إضافة الفئة' : 'Failed to add category');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm(isRtl ? 'هل أنت متأكد من حذف هذه الفئة؟ سيتم فك ارتباط منتجاتها.' : 'Are you sure you want to delete this category?')) return;
    try {
      await deleteCategory(id);
      toast.success(isRtl ? 'تم حذف الفئة بنجاح' : 'Category deleted');
      loadData();
    } catch (err) {
      toast.error(isRtl ? 'فشل حذف الفئة' : 'Failed to delete category');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-text-primary">
            {isRtl ? 'إدارة المنتجات وقائمة الطعام' : 'Products & Menu Settings'}
          </h1>
          <p className="text-text-secondary text-sm">
            {isRtl ? 'أضف الأصناف والوجبات للبيع، اربطها بوصفة المكونات لحساب التكلفة وخصم المخزون تلقائياً.' : 'Manage menu items, connect them to recipes to auto-calculate costs and deduct inventory.'}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowCategoryModal(true)}
            className="px-4 py-2.5 bg-card text-text-primary border border-border-custom font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-sidebar transition-all"
          >
            <Layers size={18} />
            {isRtl ? 'إدارة التصنيفات' : 'Categories'}
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-6 py-2.5 bg-gold text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-gold/90 transition-all shadow-lg shadow-gold/20"
          >
            <Plus size={18} />
            {isRtl ? 'إضافة منتج' : 'Add Product'}
          </button>
        </div>
      </div>

      <div className="bg-sidebar border border-border-custom rounded-[2.5rem] overflow-hidden">
        <div className="p-6 border-b border-border-custom flex items-center justify-between bg-card/30">
          <h3 className="text-xl font-bold text-text-primary">
            {isRtl ? 'قائمة المنتجات المحاسبية' : 'POS Products List'}
          </h3>
          <button onClick={loadData} className="p-2 hover:bg-card rounded-lg transition-colors text-text-secondary">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right">
            <thead className="bg-card/50 text-xs text-text-secondary uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-bold">{isRtl ? 'الاسم' : 'Name'}</th>
                <th className="px-6 py-4 font-bold">{isRtl ? 'الفئة' : 'Category'}</th>
                <th className="px-6 py-4 font-bold">{isRtl ? 'سعر البيع' : 'Selling Price'}</th>
                <th className="px-6 py-4 font-bold">{isRtl ? 'تكلفة المكونات' : 'Recipe Cost'}</th>
                <th className="px-6 py-4 font-bold">{isRtl ? 'الهامش' : 'Margin'}</th>
                <th className="px-6 py-4 font-bold">{isRtl ? 'باركود/SKU' : 'SKU'}</th>
                <th className="px-6 py-4 font-bold text-center">{isRtl ? 'تعديل' : 'Edit'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-custom">
              {products.map((prod) => {
                const margin = prod.cost_price ? ((prod.selling_price - prod.cost_price) / prod.selling_price * 100).toFixed(0) : null;
                return (
                  <tr key={prod.id} className="hover:bg-card/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-sm text-text-primary">{prod.name}</td>
                    <td className="px-6 py-4 text-sm text-text-secondary">{prod.category_name || '-'}</td>
                    <td className="px-6 py-4 text-sm font-bold text-text-primary">
                      {Number(prod.selling_price).toFixed(3)} {currentBranch?.currency_code}
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">
                      {prod.cost_price ? `${Number(prod.cost_price).toFixed(3)} ${currentBranch?.currency_code}` : (
                        <span className="text-text-muted italic">{isRtl ? 'لا توجد وصفة' : 'No recipe'}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {margin ? (
                        <span className={`font-bold ${Number(margin) > 30 ? 'text-green-custom' : 'text-amber-500'}`}>
                          {margin}%
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-text-muted">{prod.sku || '-'}</td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleOpenEdit(prod)}
                        className="p-1.5 hover:bg-card text-gold rounded-lg transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {products.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-text-secondary">
                    {isRtl ? 'لا توجد منتجات مضافة للفرع حالياً.' : 'No products found for this branch.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Slide-over / Modal */}
      <AnimatePresence>
        {showAddEditProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-end">
            <div className="fixed inset-0 bg-[#0A0A0B]/80 backdrop-blur-sm" onClick={() => setShowAddEditProduct(null)} />
            <motion.div
              initial={{ x: isRtl ? -450 : 450, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: isRtl ? -450 : 450, opacity: 0 }}
              className="bg-sidebar border-l border-border-custom w-full max-w-xl h-full flex flex-col z-10"
            >
              <div className="p-6 border-b border-border-custom flex items-center justify-between bg-card/30">
                <h3 className="text-xl font-bold text-text-primary">
                  {showAddEditProduct.id ? (isRtl ? 'تعديل منتج' : 'Edit Product') : (isRtl ? 'إضافة منتج جديد' : 'New Product')}
                </h3>
                <button onClick={() => setShowAddEditProduct(null)} className="text-text-secondary hover:text-text-primary">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                <div className="space-y-4">
                  <h4 className="font-bold text-sm text-gold uppercase tracking-wider">{isRtl ? 'بيانات المنتج الأساسية' : 'Basic Info'}</h4>
                  <div className="space-y-1">
                    <label className="text-xs text-text-secondary">{isRtl ? 'اسم الوجبة/الطبق' : 'Dish Name'}</label>
                    <input
                      type="text"
                      required
                      className="w-full bg-main border border-border-custom rounded-lg px-4 py-2.5 text-text-primary outline-none focus:border-gold/50"
                      value={productForm.name}
                      onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs text-text-secondary">{isRtl ? 'سعر البيع' : 'Selling Price'}</label>
                      <input
                        type="number"
                        step="0.001"
                        required
                        className="w-full bg-main border border-border-custom rounded-lg px-4 py-2.5 text-text-primary outline-none focus:border-gold/50"
                        value={productForm.selling_price}
                        onChange={e => setProductForm({ ...productForm, selling_price: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-text-secondary">{isRtl ? 'رمز SKU / الباركود' : 'SKU / Barcode'}</label>
                      <input
                        type="text"
                        className="w-full bg-main border border-border-custom rounded-lg px-4 py-2.5 text-text-primary outline-none focus:border-gold/50"
                        value={productForm.sku}
                        onChange={e => setProductForm({ ...productForm, sku: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-text-secondary">{isRtl ? 'تصنيف المنيو' : 'Category'}</label>
                    <select
                      className="w-full bg-main border border-border-custom rounded-lg px-4 py-2.5 text-text-primary outline-none focus:border-gold/50"
                      value={productForm.category_id}
                      onChange={e => setProductForm({ ...productForm, category_id: e.target.value })}
                    >
                      <option value="">{isRtl ? 'اختر الفئة' : 'Select Category'}</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-border-custom">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-sm text-gold uppercase tracking-wider">{isRtl ? 'وصفة المكونات (المخزون)' : 'Recipe Details'}</h4>
                    <button
                      type="button"
                      onClick={handleAddRecipeRow}
                      className="text-xs font-bold text-gold hover:underline flex items-center gap-1"
                    >
                      <Plus size={14} />
                      {isRtl ? 'إضافة مكون' : 'Add Item'}
                    </button>
                  </div>

                  {productForm.recipe.map((row, idx) => (
                    <div key={idx} className="flex gap-3 items-end bg-card/20 p-3 rounded-xl border border-border-custom">
                      <div className="flex-1 space-y-1">
                        <label className="text-[10px] text-text-secondary">{isRtl ? 'المادة الخام' : 'Ingredient'}</label>
                        <select
                          className="w-full bg-main border border-border-custom rounded-lg px-2 py-1.5 text-xs text-text-primary outline-none"
                          value={row.inventory_item_id}
                          onChange={e => handleRecipeChange(idx, 'inventory_item_id', e.target.value)}
                        >
                          {inventory.map(item => (
                            <option key={item.id} value={item.id}>{item.name} ({item.unit})</option>
                          ))}
                        </select>
                      </div>
                      <div className="w-24 space-y-1">
                        <label className="text-[10px] text-text-secondary">{isRtl ? 'الكمية المستهلكة' : 'Qty Used'}</label>
                        <input
                          type="number"
                          step="0.001"
                          required
                          className="w-full bg-main border border-border-custom rounded-lg px-2 py-1.5 text-xs text-text-primary outline-none"
                          value={row.quantity_used}
                          onChange={e => handleRecipeChange(idx, 'quantity_used', Number(e.target.value))}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveRecipeRow(idx)}
                        className="p-2 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-lg transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  {productForm.recipe.length === 0 && (
                    <p className="text-xs text-text-muted italic">{isRtl ? 'هذا الطبق ليس له مكونات مربوطة بالمخزون بعد.' : 'This item has no recipe connected yet.'}</p>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-border-custom">
                  <button
                    type="button"
                    onClick={() => setShowAddEditProduct(null)}
                    className="px-4 py-2 border border-border-custom text-text-secondary rounded-lg hover:bg-card"
                  >
                    {isRtl ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button type="submit" className="px-6 py-2 bg-gold text-white font-bold rounded-lg hover:bg-gold/90 flex items-center gap-2">
                    <Save size={16} />
                    {isRtl ? 'حفظ الصنف' : 'Save Product'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Category Manager Modal */}
      <AnimatePresence>
        {showCategoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="fixed inset-0 bg-[#0A0A0B]/80 backdrop-blur-sm" onClick={() => setShowCategoryModal(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-sidebar border border-border-custom w-full max-w-lg rounded-[2rem] overflow-hidden z-10"
            >
              <div className="p-6 border-b border-border-custom flex items-center justify-between bg-card/30">
                <h3 className="text-xl font-bold text-text-primary">{isRtl ? 'إدارة تصنيفات القائمة' : 'Categories Manager'}</h3>
                <button onClick={() => setShowCategoryModal(false)} className="text-text-secondary hover:text-text-primary">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <form onSubmit={handleAddCategory} className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder={isRtl ? 'اسم الفئة الجديدة' : 'New Category Name'}
                    className="flex-1 bg-main border border-border-custom rounded-lg px-4 py-2 text-text-primary outline-none focus:border-gold/50"
                    value={newCatName}
                    onChange={e => setNewCatName(e.target.value)}
                  />
                  <button type="submit" className="px-4 py-2 bg-gold text-white rounded-lg hover:bg-gold/90 font-bold">
                    {isRtl ? 'إضافة' : 'Add'}
                  </button>
                </form>

                <div className="max-h-[250px] overflow-y-auto custom-scrollbar space-y-2">
                  {categories.map(c => (
                    <div key={c.id} className="flex justify-between items-center p-3 bg-card/25 rounded-xl border border-border-custom">
                      <span className="font-bold text-sm text-text-primary">{c.name}</span>
                      <button
                        onClick={() => handleDeleteCategory(c.id)}
                        className="p-1.5 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  {categories.length === 0 && (
                    <p className="text-center text-xs text-text-secondary py-8">{isRtl ? 'لا توجد تصنيفات مضافة حالياً.' : 'No categories yet.'}</p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
