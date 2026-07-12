import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuth } from '../../../hooks/useAuth';
import {
  fetchInventory,
  createInventoryItem,
  restockInventory,
  fetchInventoryTransactions,
  POSInventoryItem,
  POSInventoryTransaction
} from '../../../services/posService';
import { usePOSStore } from '../../../store/posStore';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import {
  Plus, RefreshCw, AlertTriangle, ArrowUpDown, History, X, Save, TrendingUp
} from 'lucide-react';

export const POSInventory = () => {
  const { isRtl } = useLanguage();
  const { user } = useAuth();
  const { currentBranch, setLowStockAlerts } = usePOSStore();
  const [items, setItems] = useState<POSInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState<POSInventoryItem | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState<POSInventoryItem | null>(null);
  const [history, setHistory] = useState<POSInventoryTransaction[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Form States
  const [newItem, setNewItem] = useState({
    name: '',
    unit: 'kg',
    current_quantity: 0,
    reorder_threshold: 0,
    cost_per_unit: 0
  });

  const [restockData, setRestockData] = useState({
    quantity: 0,
    total_cost: 0
  });

  const loadData = async () => {
    if (!currentBranch) return;
    setLoading(true);
    try {
      const data = await fetchInventory(currentBranch.id);
      setItems(data);
      setLowStockAlerts(data.filter(i => i.current_quantity <= i.reorder_threshold));
    } catch (err) {
      console.error(err);
      toast.error(isRtl ? 'فشل تحميل بيانات المخزون' : 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentBranch?.id]);

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBranch) return;
    try {
      await createInventoryItem(currentBranch.id, {
        name: newItem.name,
        unit: newItem.unit,
        current_quantity: Number(newItem.current_quantity),
        reorder_threshold: Number(newItem.reorder_threshold),
        cost_per_unit: Number(newItem.cost_per_unit)
      });
      toast.success(isRtl ? 'تم إضافة صنف مخزون جديد' : 'Inventory item added');
      setShowAddModal(false);
      setNewItem({ name: '', unit: 'kg', current_quantity: 0, reorder_threshold: 0, cost_per_unit: 0 });
      loadData();
    } catch (err) {
      console.error(err);
      toast.error(isRtl ? 'فشل إضافة الصنف' : 'Failed to add item');
    }
  };

  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBranch || !showRestockModal) return;
    try {
      await restockInventory(
        showRestockModal.id,
        Number(restockData.quantity),
        Number(restockData.total_cost),
        currentBranch.id
      );
      toast.success(isRtl ? 'تم توريد المخزون وتسجيل المصروف تلقائياً' : 'Restock completed and expense recorded');
      setShowRestockModal(null);
      setRestockData({ quantity: 0, total_cost: 0 });
      loadData();
    } catch (err) {
      console.error(err);
      toast.error(isRtl ? 'فشل إتمام التوريد' : 'Restock failed');
    }
  };

  const openHistory = async (item: POSInventoryItem) => {
    setShowHistoryModal(item);
    setLoadingHistory(true);
    try {
      const logs = await fetchInventoryTransactions(item.id);
      setHistory(logs);
    } catch (err) {
      console.error(err);
      toast.error(isRtl ? 'فشل تحميل سجل المعاملات' : 'Failed to load transaction history');
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-text-primary">
            {isRtl ? 'إدارة المخزون والمكونات' : 'Inventory & Recipe items'}
          </h1>
          <p className="text-text-secondary text-sm">
            {isRtl ? 'تتبع الكميات الحالية للمواد الخام، تنبيهات نقص المخزون وتوريد شحنات جديدة.' : 'Track raw material quantities, low stock thresholds, and record stock replenishment.'}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-6 py-2.5 bg-gold text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-gold/90 transition-all shadow-lg shadow-gold/20"
        >
          <Plus size={18} />
          {isRtl ? 'إضافة مادة خام' : 'Add Ingredient'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-sidebar border border-border-custom p-6 rounded-[2rem] flex items-center gap-4">
          <div className="w-12 h-12 bg-gold/10 text-gold rounded-2xl flex items-center justify-center">
            <ArrowUpDown size={22} />
          </div>
          <div>
            <p className="text-text-secondary text-xs">{isRtl ? 'إجمالي الأصناف' : 'Total Items'}</p>
            <p className="text-2xl font-bold text-text-primary">{items.length}</p>
          </div>
        </div>
        <div className="bg-sidebar border border-border-custom p-6 rounded-[2rem] flex items-center gap-4">
          <div className="w-12 h-12 bg-red-500/10 text-red-400 rounded-2xl flex items-center justify-center">
            <AlertTriangle size={22} className="animate-pulse" />
          </div>
          <div>
            <p className="text-text-secondary text-xs">{isRtl ? 'أصناف منخفضة المخزون' : 'Low Stock Items'}</p>
            <p className="text-2xl font-bold text-red-400">
              {items.filter(i => i.current_quantity <= i.reorder_threshold).length}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-sidebar border border-border-custom rounded-[2.5rem] overflow-hidden">
        <div className="p-6 border-b border-border-custom flex items-center justify-between bg-card/30">
          <h3 className="text-xl font-bold text-text-primary">
            {isRtl ? 'قائمة المواد والمخزون' : 'Ingredients Inventory'}
          </h3>
          <button onClick={loadData} className="p-2 hover:bg-card rounded-lg transition-colors text-text-secondary">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right">
            <thead className="bg-card/50 text-xs text-text-secondary uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-bold">{isRtl ? 'اسم المادة' : 'Material Name'}</th>
                <th className="px-6 py-4 font-bold">{isRtl ? 'الكمية الحالية' : 'Current Quantity'}</th>
                <th className="px-6 py-4 font-bold">{isRtl ? 'وحدة القياس' : 'Unit'}</th>
                <th className="px-6 py-4 font-bold">{isRtl ? 'حد إعادة الطلب' : 'Reorder Threshold'}</th>
                <th className="px-6 py-4 font-bold">{isRtl ? 'التكلفة لكل وحدة' : 'Cost/Unit'}</th>
                <th className="px-6 py-4 font-bold">{isRtl ? 'حالة المخزون' : 'Status'}</th>
                <th className="px-6 py-4 font-bold text-center">{isRtl ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-custom">
              {items.map((item) => {
                const isLow = item.current_quantity <= item.reorder_threshold;
                return (
                  <tr key={item.id} className="hover:bg-card/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-sm text-text-primary">{item.name}</td>
                    <td className="px-6 py-4 text-sm text-text-primary">{Number(item.current_quantity).toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-text-secondary">{item.unit}</td>
                    <td className="px-6 py-4 text-sm text-text-secondary">{Number(item.reorder_threshold).toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-text-primary">
                      {Number(item.cost_per_unit).toFixed(3)} {currentBranch?.currency_code}
                    </td>
                    <td className="px-6 py-4">
                      {isLow ? (
                        <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold rounded-full animate-pulse">
                          {isRtl ? 'منخفض' : 'Low Stock'}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-green-500/10 text-green-400 text-xs font-bold rounded-full">
                          {isRtl ? 'كافٍ' : 'Good'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 flex items-center justify-center gap-2">
                      <button
                        onClick={() => setShowRestockModal(item)}
                        className="px-3 py-1.5 bg-gold/10 hover:bg-gold text-gold hover:text-main text-xs font-bold rounded-lg transition-all"
                      >
                        {isRtl ? 'توريد مخزون' : 'Restock'}
                      </button>
                      <button
                        onClick={() => openHistory(item)}
                        className="p-1.5 hover:bg-card text-text-secondary hover:text-text-primary rounded-lg transition-colors"
                        title={isRtl ? 'سجل العمليات' : 'Operation History'}
                      >
                        <History size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-text-secondary">
                    {isRtl ? 'لا يوجد مواد خام مضافة بالمخزون حالياً.' : 'No items added in the inventory yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="fixed inset-0 bg-[#0A0A0B]/80 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-sidebar border border-border-custom w-full max-w-lg rounded-[2rem] overflow-hidden z-10"
            >
              <div className="p-6 border-b border-border-custom flex items-center justify-between bg-card/30">
                <h3 className="text-xl font-bold text-text-primary">{isRtl ? 'إضافة مادة خام للمخزون' : 'Add Raw Material'}</h3>
                <button onClick={() => setShowAddModal(false)} className="text-text-secondary hover:text-text-primary">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleCreateItem} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs text-text-secondary">{isRtl ? 'اسم المادة' : 'Material Name'}</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-main border border-border-custom rounded-lg px-4 py-2.5 text-text-primary outline-none focus:border-gold/50"
                    value={newItem.name}
                    onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-text-secondary">{isRtl ? 'وحدة القياس' : 'Measurement Unit'}</label>
                    <input
                      type="text"
                      required
                      placeholder="kg, l, piece..."
                      className="w-full bg-main border border-border-custom rounded-lg px-4 py-2.5 text-text-primary outline-none focus:border-gold/50"
                      value={newItem.unit}
                      onChange={e => setNewItem({ ...newItem, unit: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-text-secondary">{isRtl ? 'التكلفة لكل وحدة' : 'Cost/Unit'}</label>
                    <input
                      type="number"
                      step="0.001"
                      required
                      className="w-full bg-main border border-border-custom rounded-lg px-4 py-2.5 text-text-primary outline-none focus:border-gold/50"
                      value={newItem.cost_per_unit}
                      onChange={e => setNewItem({ ...newItem, cost_per_unit: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-text-secondary">{isRtl ? 'الكمية الافتتاحية' : 'Initial Quantity'}</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      className="w-full bg-main border border-border-custom rounded-lg px-4 py-2.5 text-text-primary outline-none focus:border-gold/50"
                      value={newItem.current_quantity}
                      onChange={e => setNewItem({ ...newItem, current_quantity: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-text-secondary">{isRtl ? 'حد إعادة الطلب' : 'Reorder Threshold'}</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      className="w-full bg-main border border-border-custom rounded-lg px-4 py-2.5 text-text-primary outline-none focus:border-gold/50"
                      value={newItem.reorder_threshold}
                      onChange={e => setNewItem({ ...newItem, reorder_threshold: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border border-border-custom text-text-secondary rounded-lg hover:bg-card"
                  >
                    {isRtl ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button type="submit" className="px-4 py-2 bg-gold text-white rounded-lg hover:bg-gold/90">
                    {isRtl ? 'إضافة' : 'Add Item'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Restock Modal */}
      <AnimatePresence>
        {showRestockModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="fixed inset-0 bg-[#0A0A0B]/80 backdrop-blur-sm" onClick={() => setShowRestockModal(null)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-sidebar border border-border-custom w-full max-w-md rounded-[2rem] overflow-hidden z-10"
            >
              <div className="p-6 border-b border-border-custom flex items-center justify-between bg-card/30">
                <div>
                  <h3 className="text-lg font-bold text-text-primary">{isRtl ? 'توريد مخزون جديد' : 'New Stock Replenishment'}</h3>
                  <p className="text-xs text-text-secondary">{showRestockModal.name}</p>
                </div>
                <button onClick={() => setShowRestockModal(null)} className="text-text-secondary hover:text-text-primary">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleRestock} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs text-text-secondary">
                    {isRtl ? `الكمية الموردة (${showRestockModal.unit})` : `Restock Quantity (${showRestockModal.unit})`}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="w-full bg-main border border-border-custom rounded-lg px-4 py-2.5 text-text-primary outline-none focus:border-gold/50"
                    value={restockData.quantity}
                    onChange={e => setRestockData({ ...restockData, quantity: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-text-secondary">
                    {isRtl ? `إجمالي التكلفة الشراء (${currentBranch?.currency_code})` : `Total Purchase Cost (${currentBranch?.currency_code})`}
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    className="w-full bg-main border border-border-custom rounded-lg px-4 py-2.5 text-text-primary outline-none focus:border-gold/50"
                    value={restockData.total_cost}
                    onChange={e => setRestockData({ ...restockData, total_cost: Number(e.target.value) })}
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowRestockModal(null)}
                    className="px-4 py-2 border border-border-custom text-text-secondary rounded-lg hover:bg-card"
                  >
                    {isRtl ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button type="submit" className="px-4 py-2 bg-gold text-white rounded-lg hover:bg-gold/90">
                    {isRtl ? 'تأكيد التوريد' : 'Confirm'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* History Modal */}
      <AnimatePresence>
        {showHistoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="fixed inset-0 bg-[#0A0A0B]/80 backdrop-blur-sm" onClick={() => setShowHistoryModal(null)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-sidebar border border-border-custom w-full max-w-2xl rounded-[2rem] overflow-hidden z-10"
            >
              <div className="p-6 border-b border-border-custom flex items-center justify-between bg-card/30">
                <div>
                  <h3 className="text-lg font-bold text-text-primary">{isRtl ? 'سجل العمليات والتدقيق' : 'Inventory Audit Trail'}</h3>
                  <p className="text-xs text-text-secondary">{showHistoryModal.name}</p>
                </div>
                <button onClick={() => setShowHistoryModal(null)} className="text-text-secondary hover:text-text-primary">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 max-h-[400px] overflow-y-auto custom-scrollbar">
                {loadingHistory ? (
                  <div className="flex py-12 justify-center"><RefreshCw size={24} className="animate-spin text-gold" /></div>
                ) : (
                  <table className="w-full text-left rtl:text-right">
                    <thead className="bg-card/50 text-[10px] text-text-secondary uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-2 font-bold">{isRtl ? 'التاريخ' : 'Date'}</th>
                        <th className="px-4 py-2 font-bold">{isRtl ? 'حجم التغيير' : 'Amount Change'}</th>
                        <th className="px-4 py-2 font-bold">{isRtl ? 'السبب' : 'Reason'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-custom text-xs">
                      {history.map((h) => (
                        <tr key={h.id} className="hover:bg-card/30">
                          <td className="px-4 py-2.5 text-text-secondary">
                            {new Date(h.created_at).toLocaleString()}
                          </td>
                          <td className={`px-4 py-2.5 font-bold ${Number(h.change_amount) > 0 ? 'text-green-custom' : 'text-red-400'}`}>
                            {Number(h.change_amount) > 0 ? `+${h.change_amount}` : h.change_amount}
                          </td>
                          <td className="px-4 py-2.5 uppercase font-bold text-text-primary">{h.reason}</td>
                        </tr>
                      ))}
                      {history.length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-4 py-8 text-center text-text-secondary">
                            {isRtl ? 'لا يوجد سجل معاملات لهذه المادة.' : 'No audit history available.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
