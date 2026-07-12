import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuth } from '../../../hooks/useAuth';
import {
  fetchExpenses,
  fetchExpenseCategories,
  createExpense,
  createExpenseCategory,
  POSExpense,
  POSExpenseCategory
} from '../../../services/posService';
import { usePOSStore } from '../../../store/posStore';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import {
  Plus, RefreshCw, X, Filter, Calendar, DollarSign, Tag
} from 'lucide-react';

export const POSExpenses = () => {
  const { isRtl } = useLanguage();
  const { user } = useAuth();
  const { currentBranch } = usePOSStore();

  const [expenses, setExpenses] = useState<POSExpense[]>([]);
  const [categories, setCategories] = useState<POSExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);

  // Form States
  const [expenseForm, setExpenseForm] = useState({
    expense_category_id: '',
    amount: 0,
    description: '',
    expense_date: new Date().toISOString().split('T')[0]
  });

  const [newCatName, setNewCatName] = useState('');

  const loadData = async () => {
    if (!currentBranch) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [expData, catData] = await Promise.all([
        fetchExpenses(currentBranch.id, fromDate, toDate),
        fetchExpenseCategories(currentBranch.id)
      ]);
      setExpenses(expData);
      setCategories(catData);
    } catch (err) {
      console.error(err);
      toast.error(isRtl ? 'فشل تحميل بيانات المصروفات' : 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentBranch?.id, fromDate, toDate]);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBranch) return;
    try {
      await createExpense(currentBranch.id, {
        expense_category_id: expenseForm.expense_category_id || undefined,
        amount: Number(expenseForm.amount),
        description: expenseForm.description,
        expense_date: expenseForm.expense_date,
        currency_code: currentBranch.currency_code
      });
      toast.success(isRtl ? 'تم إضافة المصروف بنجاح' : 'Expense recorded successfully');
      setShowAddModal(false);
      setExpenseForm({
        expense_category_id: categories[0]?.id || '',
        amount: 0,
        description: '',
        expense_date: new Date().toISOString().split('T')[0]
      });
      loadData();
    } catch (err) {
      console.error(err);
      toast.error(isRtl ? 'فشل إضافة المصروف' : 'Failed to add expense');
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBranch || !newCatName) return;
    try {
      await createExpenseCategory(currentBranch.id, newCatName);
      toast.success(isRtl ? 'تم إضافة تصنيف المصروف الجديد' : 'Expense category added');
      setNewCatName('');
      loadData();
    } catch (err) {
      toast.error(isRtl ? 'فشل إضافة التصنيف' : 'Failed to add category');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-text-primary">
            {isRtl ? 'تتبع وإدارة المصروفات' : 'Expenses Management'}
          </h1>
          <p className="text-text-secondary text-sm">
            {isRtl ? 'سجل المصروفات التشغيلية للمطعم، مشتريات المواد الخام وتتبع التدفقات النقدية الصادرة.' : 'Monitor raw material orders, rents, wages and custom operating outflows.'}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowCatModal(true)}
            className="px-4 py-2.5 bg-card text-text-primary border border-border-custom font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-sidebar transition-all"
          >
            <Tag size={18} />
            {isRtl ? 'فئات المصروفات' : 'Categories'}
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-2.5 bg-gold text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-gold/90 transition-all shadow-lg shadow-gold/20"
          >
            <Plus size={18} />
            {isRtl ? 'إضافة مصروف' : 'Add Expense'}
          </button>
        </div>
      </div>

      {/* Date Filter Panel */}
      <div className="bg-sidebar border border-border-custom p-6 rounded-[2rem] flex flex-col md:flex-row gap-4 items-center">
        <div className="flex items-center gap-2 text-text-secondary text-sm">
          <Calendar size={16} className="text-gold" />
          <span>{isRtl ? 'تصفية الفترة الزمنية:' : 'Date Range Filter:'}</span>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <input
            type="date"
            className="bg-main border border-border-custom rounded-lg px-4 py-2 text-xs text-text-primary outline-none focus:border-gold/50"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
          />
          <span className="text-text-secondary self-center">-</span>
          <input
            type="date"
            className="bg-main border border-border-custom rounded-lg px-4 py-2 text-xs text-text-primary outline-none focus:border-gold/50"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
          />
        </div>
      </div>

      {/* Expenses List */}
      <div className="bg-sidebar border border-border-custom rounded-[2.5rem] overflow-hidden">
        <div className="p-6 border-b border-border-custom flex items-center justify-between bg-card/30">
          <h3 className="text-xl font-bold text-text-primary">
            {isRtl ? 'سجل المصروفات التشغيلية' : 'Operating Expenses'}
          </h3>
          <button onClick={loadData} className="p-2 hover:bg-card rounded-lg transition-colors text-text-secondary">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right">
            <thead className="bg-card/50 text-xs text-text-secondary uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-bold">{isRtl ? 'التاريخ' : 'Date'}</th>
                <th className="px-6 py-4 font-bold">{isRtl ? 'الفئة' : 'Category'}</th>
                <th className="px-6 py-4 font-bold">{isRtl ? 'المبلغ' : 'Amount'}</th>
                <th className="px-6 py-4 font-bold">{isRtl ? 'الوصف' : 'Description'}</th>
                <th className="px-6 py-4 font-bold">{isRtl ? 'المصدر' : 'Source'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-custom">
              {expenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-card/30 transition-colors">
                  <td className="px-6 py-4 text-sm text-text-secondary">
                    {new Date(exp.expense_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-text-primary">{exp.category_name || '-'}</td>
                  <td className="px-6 py-4 text-sm font-bold text-red-400">
                    -{Number(exp.amount).toFixed(3)} {exp.currency_code}
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{exp.description || '-'}</td>
                  <td className="px-6 py-4">
                    {exp.is_system_generated ? (
                      <span className="px-2.5 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold rounded-full">
                        {isRtl ? 'توريد مخزون' : 'Stock replenishment'}
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold rounded-full">
                        {isRtl ? 'يدوي' : 'Manual Entry'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-text-secondary">
                    {isRtl ? 'لا توجد مصروفات مسجلة في هذه الفترة.' : 'No expenses recorded in this period.'}
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
                <h3 className="text-xl font-bold text-text-primary">{isRtl ? 'تسجيل مصروف يدوي' : 'Record Expense'}</h3>
                <button onClick={() => setShowAddModal(false)} className="text-text-secondary hover:text-text-primary">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleCreateExpense} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs text-text-secondary">{isRtl ? 'تصنيف المصروف' : 'Expense Category'}</label>
                  <select
                    className="w-full bg-main border border-border-custom rounded-lg px-4 py-2.5 text-text-primary outline-none focus:border-gold/50"
                    value={expenseForm.expense_category_id}
                    onChange={e => setExpenseForm({ ...expenseForm, expense_category_id: e.target.value })}
                  >
                    <option value="">{isRtl ? 'اختر الفئة' : 'Select Category'}</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-text-secondary">{isRtl ? 'المبلغ المالي' : 'Amount'}</label>
                    <input
                      type="number"
                      step="0.001"
                      required
                      className="w-full bg-main border border-border-custom rounded-lg px-4 py-2.5 text-text-primary outline-none focus:border-gold/50 font-bold"
                      value={expenseForm.amount}
                      onChange={e => setExpenseForm({ ...expenseForm, amount: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-text-secondary">{isRtl ? 'تاريخ الصرف' : 'Date'}</label>
                    <input
                      type="date"
                      required
                      className="w-full bg-main border border-border-custom rounded-lg px-4 py-2.5 text-text-primary outline-none focus:border-gold/50"
                      value={expenseForm.expense_date}
                      onChange={e => setExpenseForm({ ...expenseForm, expense_date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-text-secondary">{isRtl ? 'الوصف والتفاصيل' : 'Description'}</label>
                  <textarea
                    rows={3}
                    className="w-full bg-main border border-border-custom rounded-lg px-4 py-2.5 text-text-primary outline-none focus:border-gold/50 resize-none"
                    value={expenseForm.description}
                    onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border border-border-custom text-text-secondary rounded-lg hover:bg-card"
                  >
                    {isRtl ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button type="submit" className="px-4 py-2 bg-gold text-white rounded-lg hover:bg-gold/90 font-bold">
                    {isRtl ? 'تسجيل' : 'Record'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Category Manager Modal */}
      <AnimatePresence>
        {showCatModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="fixed inset-0 bg-[#0A0A0B]/80 backdrop-blur-sm" onClick={() => setShowCatModal(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-sidebar border border-border-custom w-full max-w-md rounded-[2rem] overflow-hidden z-10"
            >
              <div className="p-6 border-b border-border-custom flex items-center justify-between bg-card/30">
                <h3 className="text-xl font-bold text-text-primary">{isRtl ? 'فئات المصروفات' : 'Expense Categories'}</h3>
                <button onClick={() => setShowCatModal(false)} className="text-text-secondary hover:text-text-primary">
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
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
