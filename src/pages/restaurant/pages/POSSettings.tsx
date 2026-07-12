import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuth } from '../../../hooks/useAuth';
import { getOrCreateBranch, updateBranch, POSBranch } from '../../../services/posService';
import { usePOSStore } from '../../../store/posStore';
import { motion } from 'motion/react';
import { toast } from 'react-hot-toast';
import { Save, RefreshCw, MapPin, DollarSign, Percent } from 'lucide-react';

export const POSSettings = () => {
  const { isRtl } = useLanguage();
  const { user } = useAuth();
  const { currentBranch, setBranch } = usePOSStore();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    currency_code: 'OMR',
    vat_rate: 5.00,
    vat_registration_number: '',
    address: ''
  });

  useEffect(() => {
    const loadBranch = async () => {
      if (!user?.restaurantId) return;
      setLoading(true);
      try {
        const branch = await getOrCreateBranch(user.restaurantId);
        if (branch) {
          setBranch(branch);
          setFormData({
            name: branch.name,
            currency_code: branch.currency_code,
            vat_rate: branch.vat_rate,
            vat_registration_number: branch.vat_registration_number || '',
            address: branch.address || ''
          });
        }
      } catch (err) {
        console.error(err);
        toast.error(isRtl ? 'فشل تحميل إعدادات الفرع' : 'Failed to load branch settings');
      } finally {
        setLoading(false);
      }
    };
    loadBranch();
  }, [user?.restaurantId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBranch) return;
    setSaving(true);
    try {
      const updated = await updateBranch(currentBranch.id, {
        name: formData.name,
        currency_code: formData.currency_code,
        vat_rate: Number(formData.vat_rate),
        vat_registration_number: formData.vat_registration_number,
        address: formData.address
      });
      setBranch(updated);
      toast.success(isRtl ? 'تم حفظ الإعدادات بنجاح' : 'Settings saved successfully');
    } catch (err) {
      console.error(err);
      toast.error(isRtl ? 'فشل حفظ الإعدادات' : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <RefreshCw className="animate-spin text-gold" size={36} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      <div>
        <h1 className="text-3xl font-bold mb-2 text-text-primary">
          {isRtl ? 'إعدادات الفرع والضرائب' : 'Branch & Tax Settings'}
        </h1>
        <p className="text-text-secondary text-sm">
          {isRtl ? 'تكوين العملة المحلية، الرقم الضريبي ومعدل ضريبة القيمة المضافة للفرع الحالي.' : 'Configure local currency, VAT number, and VAT rate for the current branch.'}
        </p>
      </div>

      <div className="bg-sidebar border border-border-custom rounded-[2rem] overflow-hidden">
        <div className="p-6 border-b border-border-custom bg-card/30">
          <h3 className="text-xl font-bold text-text-primary">
            {isRtl ? 'تفاصيل الفرع' : 'Branch Details'}
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">
                {isRtl ? 'اسم الفرع' : 'Branch Name'}
              </label>
              <input
                type="text"
                required
                className="w-full bg-main border border-border-custom rounded-xl px-4 py-3 text-text-primary outline-none focus:border-gold/50 transition-colors"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">
                {isRtl ? 'العملة الافتراضية' : 'Default Currency'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  maxLength={3}
                  placeholder="OMR, AED, USD..."
                  className="w-full bg-main border border-border-custom rounded-xl px-4 py-3 text-text-primary outline-none focus:border-gold/50 transition-colors uppercase"
                  value={formData.currency_code}
                  onChange={e => setFormData({ ...formData, currency_code: e.target.value })}
                />
                <DollarSign size={18} className="absolute right-4 top-3.5 text-text-muted" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">
                {isRtl ? 'الرقم الضريبي (VATIN)' : 'VAT Registration Number (VATIN)'}
              </label>
              <input
                type="text"
                placeholder={isRtl ? 'اختياري' : 'Optional'}
                className="w-full bg-main border border-border-custom rounded-xl px-4 py-3 text-text-primary outline-none focus:border-gold/50 transition-colors"
                value={formData.vat_registration_number}
                onChange={e => setFormData({ ...formData, vat_registration_number: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">
                {isRtl ? 'نسبة الضريبة (%)' : 'VAT Rate (%)'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  required
                  className="w-full bg-main border border-border-custom rounded-xl px-4 py-3 text-text-primary outline-none focus:border-gold/50 transition-colors"
                  value={formData.vat_rate}
                  onChange={e => setFormData({ ...formData, vat_rate: Number(e.target.value) })}
                />
                <Percent size={18} className="absolute right-4 top-3.5 text-text-muted" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">
              {isRtl ? 'العنوان' : 'Address'}
            </label>
            <div className="relative">
              <textarea
                rows={3}
                className="w-full bg-main border border-border-custom rounded-xl px-4 py-3 text-text-primary outline-none focus:border-gold/50 transition-colors resize-none"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
              />
              <MapPin size={18} className="absolute right-4 top-3.5 text-text-muted" />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-gold text-white font-bold rounded-xl flex items-center gap-2 hover:bg-gold/90 transition-all shadow-lg shadow-gold/20 disabled:opacity-50"
            >
              {saving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
              {isRtl ? 'حفظ الإعدادات' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};
