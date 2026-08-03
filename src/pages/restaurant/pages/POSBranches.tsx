import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../hooks/useAuth';
import { getBranches, createBranch, updateBranch, deleteBranch, POSBranch } from '../../../services/posService';
import { Plus, Edit2, Trash2, MapPin, Building2, Save, X, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const POSBranches = () => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const { user } = useAuth();
  
  const [branches, setBranches] = useState<POSBranch[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<POSBranch | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [currencyCode, setCurrencyCode] = useState('OMR');
  const [vatRate, setVatRate] = useState(5);
  const [address, setAddress] = useState('');
  const [vatRegNumber, setVatRegNumber] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    loadBranches();
  }, [user?.restaurantId]);

  const loadBranches = async () => {
    if (!user?.restaurantId) return;
    try {
      setLoading(true);
      const data = await getBranches(user.restaurantId);
      setBranches(data);
    } catch (err) {
      console.error(err);
      toast.error(isRtl ? 'فشل تحميل الفروع' : 'Failed to load branches');
    } finally {
      setLoading(false);
    }
  };

  const openNewForm = () => {
    setEditingBranch(null);
    setName('');
    setCurrencyCode('OMR');
    setVatRate(5);
    setAddress('');
    setVatRegNumber('');
    setIsActive(true);
    setIsFormOpen(true);
  };

  const openEditForm = (branch: POSBranch) => {
    setEditingBranch(branch);
    setName(branch.name);
    setCurrencyCode(branch.currency_code);
    setVatRate(branch.vat_rate);
    setAddress(branch.address || '');
    setVatRegNumber(branch.vat_registration_number || '');
    setIsActive(branch.is_active !== false); // Default to true if undefined
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.restaurantId || !name.trim()) return;

    try {
      setSaving(true);
      const branchData = {
        name: name.trim(),
        currency_code: currencyCode,
        vat_rate: Number(vatRate),
        address,
        vat_registration_number: vatRegNumber,
        is_active: isActive
      };

      if (editingBranch) {
        await updateBranch(editingBranch.id, branchData);
        toast.success(isRtl ? 'تم تحديث الفرع' : 'Branch updated');
      } else {
        await createBranch(user.restaurantId, branchData);
        toast.success(isRtl ? 'تمت إضافة الفرع' : 'Branch added');
      }
      
      setIsFormOpen(false);
      loadBranches();
    } catch (err) {
      console.error(err);
      toast.error(isRtl ? 'حدث خطأ أثناء الحفظ' : 'Error saving branch');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(isRtl ? 'هل أنت متأكد من إيقاف هذا الفرع؟' : 'Are you sure you want to deactivate this branch?')) return;
    
    try {
      await deleteBranch(id);
      toast.success(isRtl ? 'تم إيقاف الفرع' : 'Branch deactivated');
      loadBranches();
    } catch (err) {
      console.error(err);
      toast.error(isRtl ? 'فشل الإيقاف' : 'Deactivation failed');
    }
  };

  return (
    <div className="p-6 h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text mb-1">
            {isRtl ? 'إدارة الفروع' : 'Branch Management'}
          </h1>
          <p className="text-sm text-muted">
            {isRtl ? 'أضف وعدل فروع مطعمك' : 'Add and manage your restaurant branches'}
          </p>
        </div>
        <button
          onClick={openNewForm}
          className="flex items-center gap-2 px-4 py-2 bg-gold text-main font-bold rounded-xl hover:bg-gold-light transition-all shadow-lg shadow-gold/20"
        >
          <Plus size={18} />
          <span>{isRtl ? 'إضافة فرع' : 'Add Branch'}</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <RefreshCw className="animate-spin text-gold" size={32} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {branches.map(branch => (
              <div 
                key={branch.id}
                className={`bg-surface-2 p-5 rounded-2xl border ${branch.is_active === false ? 'border-red-500/20 opacity-75' : 'border-white/5'} flex flex-col`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${branch.is_default ? 'bg-gold/20 text-gold' : 'bg-white/5 text-text'}`}>
                      <Building2 size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-text text-lg">{branch.name}</h3>
                      {branch.is_default && (
                        <span className="text-[10px] bg-gold text-main px-2 py-0.5 rounded-full font-bold uppercase">
                          {isRtl ? 'الفرع الرئيسي' : 'Main'}
                        </span>
                      )}
                      {branch.is_active === false && (
                        <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-bold uppercase ml-2">
                          {isRtl ? 'متوقف' : 'Inactive'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditForm(branch)}
                      className="p-2 text-muted hover:text-gold hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    {!branch.is_default && branch.is_active !== false && (
                      <button
                        onClick={() => handleDelete(branch.id)}
                        className="p-2 text-muted hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-3 flex-1 text-sm">
                  {branch.address && (
                    <div className="flex items-start gap-2 text-muted">
                      <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                      <p>{branch.address}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4 bg-white/5 p-3 rounded-xl mt-4">
                    <div>
                      <p className="text-[10px] text-muted uppercase">{isRtl ? 'العملة' : 'Currency'}</p>
                      <p className="font-semibold text-text">{branch.currency_code}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted uppercase">{isRtl ? 'الضريبة' : 'VAT Rate'}</p>
                      <p className="font-semibold text-text">{branch.vat_rate}%</p>
                    </div>
                    {branch.vat_registration_number && (
                      <div className="col-span-2">
                        <p className="text-[10px] text-muted uppercase">{isRtl ? 'الرقم الضريبي' : 'VAT Reg. No'}</p>
                        <p className="font-semibold text-text">{branch.vat_registration_number}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-surface-2">
              <h2 className="text-xl font-bold text-text">
                {editingBranch 
                  ? (isRtl ? 'تعديل الفرع' : 'Edit Branch')
                  : (isRtl ? 'إضافة فرع جديد' : 'Add New Branch')}
              </h2>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="p-2 text-muted hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  {isRtl ? 'اسم الفرع' : 'Branch Name'} *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text focus:outline-none focus:border-gold transition-colors"
                  placeholder={isRtl ? 'مثال: فرع السيب' : 'e.g. Seeb Branch'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  {isRtl ? 'العنوان' : 'Address'}
                </label>
                <textarea
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text focus:outline-none focus:border-gold transition-colors min-h-[80px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    {isRtl ? 'العملة' : 'Currency'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={currencyCode}
                    onChange={e => setCurrencyCode(e.target.value.toUpperCase())}
                    maxLength={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text focus:outline-none focus:border-gold transition-colors uppercase"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    {isRtl ? 'نسبة الضريبة %' : 'VAT Rate %'} *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={vatRate}
                    onChange={e => setVatRate(Number(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text focus:outline-none focus:border-gold transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  {isRtl ? 'الرقم الضريبي (إن وجد)' : 'VAT Reg. Number (Optional)'}
                </label>
                <input
                  type="text"
                  value={vatRegNumber}
                  onChange={e => setVatRegNumber(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text focus:outline-none focus:border-gold transition-colors"
                />
              </div>

              {editingBranch && !editingBranch.is_default && (
                <div className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/10">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={isActive}
                    onChange={e => setIsActive(e.target.checked)}
                    className="w-5 h-5 rounded border-white/20 bg-dark-custom text-gold focus:ring-gold focus:ring-offset-dark-custom"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-text cursor-pointer select-none">
                    {isRtl ? 'الفرع نشط (يعمل حالياً)' : 'Branch is active'}
                  </label>
                </div>
              )}

              <div className="pt-4 border-t border-white/5">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 bg-gold text-main font-bold py-3 px-4 rounded-xl hover:bg-gold-light transition-all disabled:opacity-50"
                >
                  {saving ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} />}
                  <span>{isRtl ? 'حفظ' : 'Save'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
