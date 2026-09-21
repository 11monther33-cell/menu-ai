import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../hooks/useAuth';
import { getBranches, createBranch, updateBranch, deleteBranch, POSBranch } from '../../../services/posService';
import {
  Plus, Edit2, Trash2, MapPin, Building2, Save, X, RefreshCw,
  Users, Key, Shield, ChevronDown, Eye, EyeOff, Copy, Check, ExternalLink, QrCode, Link2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { QRCodeSVG } from 'qrcode.react';

type StaffRole = 'cashier' | 'chef' | 'waiter' | 'branch_manager';

interface RestaurantStaff {
  id: string;
  restaurant_id: string;
  branch_id: string | null;
  name: string;
  role: StaffRole;
  pin_code: string;
  permissions: string[];
  is_active: boolean;
  created_at: string;
}

const ROLE_LABELS: Record<StaffRole, { ar: string; en: string; color: string }> = {
  cashier:        { ar: '\u0643\u0627\u0634\u064a\u0631',     en: 'Cashier',        color: 'bg-blue-100 text-blue-700' },
  chef:           { ar: '\u0637\u0628\u0627\u062e',      en: 'Chef',           color: 'bg-orange-100 text-orange-700' },
  waiter:         { ar: '\u0646\u0627\u062f\u0644',      en: 'Waiter',         color: 'bg-green-100 text-green-700' },
  branch_manager: { ar: '\u0645\u062f\u064a\u0631 \u0641\u0631\u0639', en: 'Branch Manager', color: 'bg-purple-100 text-purple-700' },
};

const PERM_GROUPS: { group: string; groupAr: string; perms: { key: string; ar: string; en: string }[] }[] = [
  {
    group: 'Orders',
    groupAr: 'الطلبات',
    perms: [
      { key: 'view_orders',    ar: 'عرض الطلبات',          en: 'View Orders' },
      { key: 'create_orders',  ar: 'إنشاء طلبات',          en: 'Create Orders' },
      { key: 'edit_orders',    ar: 'تعديل الطلبات',        en: 'Edit Orders' },
      { key: 'cancel_orders',  ar: 'إلغاء الطلبات',        en: 'Cancel Orders' },
      { key: 'live_orders',    ar: 'طلبات مباشرة',         en: 'Live Orders' },
      { key: 'mark_ready',     ar: 'تأكيد جاهزية الطلب',   en: 'Mark Order Ready' },
      { key: 'apply_discount', ar: 'تطبيق الخصومات',       en: 'Apply Discounts' },
    ]
  },
  {
    group: 'Menu',
    groupAr: 'القائمة',
    perms: [
      { key: 'view_menu',      ar: 'عرض القائمة',          en: 'View Menu' },
      { key: 'manage_menu',    ar: 'إدارة القائمة',        en: 'Manage Menu' },
      { key: 'manage_categories', ar: 'إدارة التصنيفات',  en: 'Manage Categories' },
      { key: 'manage_dishes',  ar: 'إضافة وتعديل الأطباق', en: 'Add/Edit Dishes' },
    ]
  },
  {
    group: 'POS & Accounting',
    groupAr: 'نقطة البيع والمحاسبة',
    perms: [
      { key: 'use_pos',        ar: 'استخدام نقطة البيع',   en: 'Use POS' },
      { key: 'pos_products',   ar: 'إدارة المنتجات',       en: 'Products Management' },
      { key: 'pos_inventory',  ar: 'المخزون',              en: 'Inventory' },
      { key: 'pos_expenses',   ar: 'المصروفات',            en: 'Expenses' },
      { key: 'pos_invoices',   ar: 'الفواتير',             en: 'Invoices' },
      { key: 'view_reports',   ar: 'التقارير المالية',     en: 'Financial Reports' },
    ]
  },
  {
    group: 'Kitchen',
    groupAr: 'المطبخ',
    perms: [
      { key: 'kitchen_pulse',  ar: 'نبض المطبخ',           en: 'Kitchen Pulse' },
      { key: 'chef_notes',     ar: 'ملاحظات الشيف',        en: 'Chef Notes' },
    ]
  },
  {
    group: 'Analytics & Content',
    groupAr: 'التحليلات والمحتوى',
    perms: [
      { key: 'analytics',      ar: 'التحليلات',            en: 'Analytics' },
      { key: 'ugc_review',     ar: 'مراجعة المحتوى',       en: 'UGC Review' },
      { key: 'qr_codes',       ar: 'رموز QR',              en: 'QR Codes' },
    ]
  },
  {
    group: 'Settings & System',
    groupAr: 'الإعدادات والنظام',
    perms: [
      { key: 'branding',       ar: 'الهوية البصرية',       en: 'Branding' },
      { key: 'manage_branches',ar: 'إدارة الفروع',         en: 'Manage Branches' },
      { key: 'manage_staff',   ar: 'إدارة الموظفين',       en: 'Manage Staff' },
      { key: 'app_connection', ar: 'ربط التطبيق',          en: 'App Connection' },
      { key: 'whatsapp_agent', ar: 'موظف مبيعات واتساب',   en: 'WhatsApp AI Agent' },
      { key: 'settings',       ar: 'الإعدادات',            en: 'Settings' },
    ]
  },
];

// Flat list for backward compatibility
const PERMISSIONS = PERM_GROUPS.flatMap(g => g.perms);

async function getStaff(restaurantId: string): Promise<RestaurantStaff[]> {
  const { data, error } = await supabase
    .from('restaurant_staff')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

async function createStaff(restaurantId: string, payload: Omit<RestaurantStaff, 'id' | 'restaurant_id' | 'created_at'>): Promise<RestaurantStaff> {
  const { data, error } = await supabase
    .from('restaurant_staff')
    .insert({ ...payload, restaurant_id: restaurantId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function updateStaff(id: string, payload: Partial<RestaurantStaff>): Promise<RestaurantStaff> {
  const { data, error } = await supabase
    .from('restaurant_staff')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deleteStaff(id: string): Promise<void> {
  const { error } = await supabase.from('restaurant_staff').delete().eq('id', id);
  if (error) throw error;
}

export const POSBranches = () => {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'branches' | 'staff'>('branches');

  const [branches, setBranches] = useState<POSBranch[]>([]);
  const [branchLoading, setBranchLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<POSBranch | null>(null);
  const [saving, setSaving] = useState(false);
  const [bName, setBName] = useState('');
  const [currencyCode, setCurrencyCode] = useState('OMR');
  const [vatRate, setVatRate] = useState(5);
  const [address, setAddress] = useState('');
  const [vatRegNumber, setVatRegNumber] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [staff, setStaff] = useState<RestaurantStaff[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [isStaffFormOpen, setIsStaffFormOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<RestaurantStaff | null>(null);
  const [staffSaving, setStaffSaving] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [sName, setSName] = useState('');
  const [sRole, setSRole] = useState<StaffRole>('cashier');
  const [sBranchId, setSBranchId] = useState('');
  const [sPin, setSPin] = useState('');
  const [sPerms, setSPerms] = useState<string[]>([]);
  const [sIsActive, setSIsActive] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const staffLoginUrl = typeof window !== 'undefined' && user?.restaurantId 
    ? `${window.location.origin}/staff-login/${user.restaurantId}`
    : '';

  const handleCopyLink = () => {
    if (!staffLoginUrl) return;
    navigator.clipboard.writeText(staffLoginUrl);
    setCopied(true);
    toast.success(isRtl ? 'تم نسخ الرابط بنجاح' : 'Link copied to clipboard');
    setTimeout(() => setCopied(false), 2500);
  };

  useEffect(() => { loadBranches(); }, [user?.restaurantId]);
  useEffect(() => { if (activeTab === 'staff') loadStaff(); }, [activeTab, user?.restaurantId]);

  const loadBranches = async () => {
    if (!user?.restaurantId) return;
    try { setBranchLoading(true); setBranches(await getBranches(user.restaurantId)); }
    catch { toast.error(isRtl ? '\u0641\u0634\u0644 \u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u0641\u0631\u0648\u0639' : 'Failed to load branches'); }
    finally { setBranchLoading(false); }
  };

  const loadStaff = async () => {
    if (!user?.restaurantId) return;
    try { setStaffLoading(true); setStaff(await getStaff(user.restaurantId)); }
    catch { toast.error(isRtl ? '\u0641\u0634\u0644 \u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u0645\u0648\u0638\u0641\u064a\u0646' : 'Failed to load staff'); }
    finally { setStaffLoading(false); }
  };

  const openNewBranchForm = () => {
    setEditingBranch(null); setBName(''); setCurrencyCode('OMR');
    setVatRate(5); setAddress(''); setVatRegNumber(''); setIsActive(true);
    setIsFormOpen(true);
  };

  const openEditBranchForm = (b: POSBranch) => {
    setEditingBranch(b); setBName(b.name); setCurrencyCode(b.currency_code);
    setVatRate(b.vat_rate); setAddress(b.address || '');
    setVatRegNumber(b.vat_registration_number || ''); setIsActive(b.is_active !== false);
    setIsFormOpen(true);
  };

  const handleSaveBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.restaurantId || !bName.trim()) return;
    try {
      setSaving(true);
      const bd = { name: bName.trim(), currency_code: currencyCode, vat_rate: Number(vatRate), address, vat_registration_number: vatRegNumber, is_active: isActive };
      if (editingBranch) { await updateBranch(editingBranch.id, bd); toast.success(isRtl ? '\u062a\u0645 \u062a\u062d\u062f\u064a\u062b \u0627\u0644\u0641\u0631\u0639' : 'Branch updated'); }
      else { await createBranch(user.restaurantId, bd); toast.success(isRtl ? '\u062a\u0645\u062a \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0641\u0631\u0639' : 'Branch added'); }
      setIsFormOpen(false); loadBranches();
    } catch { toast.error(isRtl ? '\u062d\u062f\u062b \u062e\u0637\u0623' : 'Error saving'); }
    finally { setSaving(false); }
  };

  const handleDeleteBranch = async (id: string) => {
    if (!confirm(isRtl ? '\u0625\u064a\u0642\u0627\u0641 \u0647\u0630\u0627 \u0627\u0644\u0641\u0631\u0639\u061f' : 'Deactivate branch?')) return;
    try { await deleteBranch(id); toast.success(isRtl ? '\u062a\u0645 \u0625\u064a\u0642\u0627\u0641 \u0627\u0644\u0641\u0631\u0639' : 'Branch deactivated'); loadBranches(); }
    catch { toast.error(isRtl ? '\u0641\u0634\u0644 \u0627\u0644\u0625\u064a\u0642\u0627\u0641' : 'Failed'); }
  };

  const openNewStaffForm = () => {
    setEditingStaff(null); setSName(''); setSRole('cashier'); setSBranchId('');
    setSPin(''); setSPerms([]); setSIsActive(true); setShowPin(false);
    setIsStaffFormOpen(true);
  };

  const openEditStaffForm = (s: RestaurantStaff) => {
    setEditingStaff(s); setSName(s.name); setSRole(s.role); setSBranchId(s.branch_id ?? '');
    setSPin(s.pin_code); setSPerms(s.permissions ?? []); setSIsActive(s.is_active); setShowPin(false);
    setIsStaffFormOpen(true);
  };

  const togglePerm = (key: string) => setSPerms(prev => prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]);

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.restaurantId || !sName.trim() || sPin.length < 4) {
      toast.error(isRtl ? '\u062a\u0623\u0643\u062f \u0645\u0646 \u062c\u0645\u064a\u0639 \u0627\u0644\u062d\u0642\u0648\u0644 \u0648\u0627\u0644\u0631\u0642\u0645 \u0627\u0644\u0633\u0631\u064a 4+ \u0623\u0631\u0642\u0627\u0645' : 'Fill all fields. PIN must be 4+ digits');
      return;
    }
    try {
      setStaffSaving(true);
      const payload = { name: sName.trim(), role: sRole, branch_id: sBranchId || null, pin_code: sPin, permissions: sPerms, is_active: sIsActive };
      if (editingStaff) { await updateStaff(editingStaff.id, payload); toast.success(isRtl ? '\u062a\u0645 \u062a\u062d\u062f\u064a\u062b \u0627\u0644\u0645\u0648\u0638\u0641' : 'Staff updated'); }
      else { await createStaff(user.restaurantId, payload); toast.success(isRtl ? '\u062a\u0645\u062a \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0645\u0648\u0638\u0641' : 'Staff added'); }
      setIsStaffFormOpen(false); loadStaff();
    } catch { toast.error(isRtl ? '\u062d\u062f\u062b \u062e\u0637\u0623' : 'Error saving'); }
    finally { setStaffSaving(false); }
  };

  const handleDeleteStaff = async (id: string) => {
    if (!confirm(isRtl ? '\u062d\u0630\u0641 \u0647\u0630\u0627 \u0627\u0644\u0645\u0648\u0638\u0641\u061f' : 'Delete staff member?')) return;
    try { await deleteStaff(id); toast.success(isRtl ? '\u062a\u0645 \u0627\u0644\u062d\u0630\u0641' : 'Deleted'); loadStaff(); }
    catch { toast.error(isRtl ? '\u0641\u0634\u0644 \u0627\u0644\u062d\u0630\u0641' : 'Delete failed'); }
  };

  const getBranchName = (bid: string | null) =>
    bid ? (branches.find(b => b.id === bid)?.name ?? (isRtl ? '\u063a\u064a\u0631 \u0645\u062d\u062f\u062f' : 'Unknown')) : (isRtl ? '\u062c\u0645\u064a\u0639 \u0627\u0644\u0641\u0631\u0648\u0639' : 'All Branches');

  const inputCls = 'w-full bg-surface-2 border border-border-custom rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-gold transition-colors';

  return (
    <div className="p-6 h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-1">{isRtl ? '\u0627\u0644\u0641\u0631\u0648\u0639 \u0648\u0627\u0644\u0645\u0648\u0638\u0641\u0648\u0646' : 'Branches & Staff'}</h1>
          <p className="text-sm text-text-secondary">{isRtl ? '\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0641\u0631\u0648\u0639 \u0648\u0635\u0644\u0627\u062d\u064a\u0627\u062a \u0627\u0644\u0645\u0648\u0638\u0641\u064a\u0646' : 'Manage branches and staff permissions'}</p>
        </div>
        <button onClick={activeTab === 'branches' ? openNewBranchForm : openNewStaffForm}
          className="flex items-center gap-2 px-4 py-2 bg-gold text-white font-bold rounded-xl hover:bg-gold/90 transition-all shadow-lg shadow-gold/20">
          <Plus size={18} />
          <span>{activeTab === 'branches' ? (isRtl ? '\u0625\u0636\u0627\u0641\u0629 \u0641\u0631\u0639' : 'Add Branch') : (isRtl ? '\u0625\u0636\u0627\u0641\u0629 \u0645\u0648\u0638\u0641' : 'Add Staff')}</span>
        </button>
      </div>

      <div className="flex gap-1 bg-surface-2 p-1 rounded-xl w-fit mb-6">
        <button onClick={() => setActiveTab('branches')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'branches' ? 'bg-card shadow text-gold' : 'text-text-secondary hover:text-text-primary'}`}>
          <Building2 size={16} />{isRtl ? '\u0627\u0644\u0641\u0631\u0648\u0639' : 'Branches'}
        </button>
        <button onClick={() => setActiveTab('staff')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'staff' ? 'bg-card shadow text-gold' : 'text-text-secondary hover:text-text-primary'}`}>
          <Users size={16} />{isRtl ? '\u0627\u0644\u0645\u0648\u0638\u0641\u0648\u0646' : 'Staff & Permissions'}
        </button>
      </div>

      {activeTab === 'branches' && (
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {branchLoading ? (
            <div className="flex items-center justify-center h-40"><RefreshCw className="animate-spin text-gold" size={32} /></div>
          ) : branches.length === 0 ? (
            <div className="text-center py-20">
              <Building2 size={48} className="mx-auto text-gold/40 mb-4" />
              <p className="text-text-secondary font-medium">{isRtl ? '\u0644\u0627 \u062a\u0648\u062c\u062f \u0641\u0631\u0648\u0639 \u0628\u0639\u062f' : 'No branches yet'}</p>
              <button onClick={openNewBranchForm} className="mt-4 text-gold font-bold hover:underline text-sm">+ {isRtl ? '\u0623\u0636\u0641 \u0641\u0631\u0639\u0643 \u0627\u0644\u0623\u0648\u0644' : 'Add your first branch'}</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {branches.map(branch => (
                <div key={branch.id} className={`bg-card p-5 rounded-2xl border ${branch.is_active === false ? 'border-red-300 opacity-75' : 'border-border-custom'} flex flex-col shadow-sm hover:shadow-md transition-shadow`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-xl ${branch.is_default ? 'bg-gold/20 text-gold' : 'bg-surface-2 text-text-secondary'}`}><Building2 size={24} /></div>
                      <div>
                        <h3 className="font-bold text-text-primary text-lg">{branch.name}</h3>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {branch.is_default && <span className="text-[10px] bg-gold text-white px-2 py-0.5 rounded-full font-bold uppercase">{isRtl ? '\u0627\u0644\u0631\u0626\u064a\u0633\u064a' : 'Main'}</span>}
                          {branch.is_active === false && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold uppercase">{isRtl ? '\u0645\u062a\u0648\u0642\u0641' : 'Inactive'}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => openEditBranchForm(branch)} className="p-2 text-text-secondary hover:text-gold hover:bg-gold/10 rounded-lg transition-colors"><Edit2 size={16} /></button>
                      {!branch.is_default && branch.is_active !== false && (
                        <button onClick={() => handleDeleteBranch(branch.id)} className="p-2 text-text-secondary hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-3 flex-1 text-sm">
                    {branch.address && <div className="flex items-start gap-2 text-text-secondary"><MapPin size={16} className="mt-0.5 flex-shrink-0 text-gold" /><p>{branch.address}</p></div>}
                    <div className="grid grid-cols-2 gap-4 bg-surface-2 border border-border-custom p-3 rounded-xl mt-4">
                      <div><p className="text-[10px] text-text-secondary uppercase font-semibold mb-1">{isRtl ? '\u0627\u0644\u0639\u0645\u0644\u0629' : 'Currency'}</p><p className="font-bold text-text-primary">{branch.currency_code}</p></div>
                      <div><p className="text-[10px] text-text-secondary uppercase font-semibold mb-1">{isRtl ? '\u0627\u0644\u0636\u0631\u064a\u0628\u0629' : 'VAT'}</p><p className="font-bold text-text-primary">{branch.vat_rate}%</p></div>
                      {branch.vat_registration_number && <div className="col-span-2"><p className="text-[10px] text-text-secondary uppercase font-semibold mb-1">{isRtl ? '\u0627\u0644\u0631\u0642\u0645 \u0627\u0644\u0636\u0631\u064a\u0628\u064a' : 'VAT Reg.'}</p><p className="font-bold text-text-primary">{branch.vat_registration_number}</p></div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'staff' && (
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="bg-gold/10 border border-gold/30 rounded-xl p-4 mb-4 flex items-start gap-3">
            <Key size={20} className="text-gold flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-text-primary">{isRtl ? 'نظام الرقم السري — لا يحتاج الموظف إلى إيميل' : 'PIN System - No email needed'}</p>
              <p className="text-xs text-text-secondary mt-1">{isRtl ? 'كل موظف يدخل عبر رقم سري 4-6 أرقام. أنت تتحكم في صلاحياته.' : 'Each staff member logs in with a 4-6 digit PIN. You control their permissions.'}</p>
            </div>
          </div>

          {/* Staff Login Link & QR Card */}
          {staffLoginUrl && (
            <div className="bg-card border border-border-custom rounded-2xl p-4 sm:p-5 mb-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gold/15 flex items-center justify-center text-gold">
                    <Link2 size={16} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-text-primary">
                      {isRtl ? 'رابط بوابة دخول الموظفين' : 'Staff PIN Login Link'}
                    </h4>
                    <p className="text-[11px] text-text-secondary">
                      {isRtl 
                        ? 'افتح هذا الرابط على شاشة الكاشير أو التابلت في المطعم' 
                        : 'Open this link on the cashier tablet or kitchen display'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      copied 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30' 
                        : 'bg-gold text-white hover:bg-gold/90 shadow-sm shadow-gold/20'
                    }`}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copied ? (isRtl ? 'تم النسخ' : 'Copied!') : (isRtl ? 'نسخ الرابط' : 'Copy Link')}</span>
                  </button>

                  <a
                    href={staffLoginUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-2 hover:bg-gold/10 hover:text-gold border border-border-custom rounded-xl text-xs font-bold text-text-primary transition-colors"
                  >
                    <ExternalLink size={14} />
                    <span>{isRtl ? 'فتح البوابة' : 'Open'}</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => setShowQr(!showQr)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-2 hover:bg-gold/10 hover:text-gold border border-border-custom rounded-xl text-xs font-bold text-text-primary transition-colors"
                  >
                    <QrCode size={14} />
                    <span>{showQr ? (isRtl ? 'إخفاء QR' : 'Hide QR') : 'QR Code'}</span>
                  </button>
                </div>
              </div>

              {/* URL Display */}
              <div className="bg-surface-2 border border-border-custom rounded-xl px-3 py-2 text-xs font-mono text-gold truncate select-all">
                {staffLoginUrl}
              </div>

              {/* Collapsible QR Code Display */}
              {showQr && (
                <div className="mt-4 pt-4 border-t border-border-custom flex flex-col items-center text-center">
                  <div className="p-3 bg-white rounded-2xl shadow-md inline-block border border-border-custom">
                    <QRCodeSVG
                      value={staffLoginUrl}
                      size={160}
                      level="M"
                      bgColor="#FFFFFF"
                      fgColor="#351344"
                    />
                  </div>
                  <p className="text-xs text-text-secondary mt-2 font-medium">
                    {isRtl ? 'امسح الرمز بكاميرا الجوال أو التابلت لفتح بوابة الموظفين' : 'Scan with camera to open staff portal on tablet or phone'}
                  </p>
                </div>
              )}
            </div>
          )}
          {staffLoading ? (
            <div className="flex items-center justify-center h-40"><RefreshCw className="animate-spin text-gold" size={32} /></div>
          ) : staff.length === 0 ? (
            <div className="text-center py-20">
              <Users size={48} className="mx-auto text-gold/40 mb-4" />
              <p className="text-text-secondary font-medium">{isRtl ? '\u0644\u0627 \u064a\u0648\u062c\u062f \u0645\u0648\u0638\u0641\u0648\u0646 \u0628\u0639\u062f' : 'No staff members yet'}</p>
              <button onClick={openNewStaffForm} className="mt-4 text-gold font-bold hover:underline text-sm">+ {isRtl ? '\u0623\u0636\u0641 \u0645\u0648\u0638\u0641\u0643 \u0627\u0644\u0623\u0648\u0644' : 'Add your first staff member'}</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {staff.map(s => (
                <div key={s.id} className={`bg-card border ${s.is_active ? 'border-border-custom' : 'border-red-200 opacity-75'} rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow`}>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gold/15 flex items-center justify-center font-bold text-gold text-lg">{s.name.charAt(0)}</div>
                      <div>
                        <p className="font-bold text-text-primary">{s.name}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${ROLE_LABELS[s.role]?.color ?? 'bg-gray-100 text-gray-700'}`}>{isRtl ? ROLE_LABELS[s.role]?.ar : ROLE_LABELS[s.role]?.en}</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openEditStaffForm(s)} className="p-2 text-text-secondary hover:text-gold hover:bg-gold/10 rounded-lg transition-colors"><Edit2 size={15} /></button>
                      <button onClick={() => handleDeleteStaff(s.id)} className="p-2 text-text-secondary hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={15} /></button>
                    </div>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-text-secondary"><MapPin size={13} className="text-gold" /><span>{getBranchName(s.branch_id)}</span></div>
                    <div className="flex items-center gap-2 text-text-secondary"><Shield size={13} className="text-gold" /><span>{s.permissions.length} {isRtl ? '\u0635\u0644\u0627\u062d\u064a\u0629' : 'permissions'}</span></div>
                    <div className="flex items-center gap-2 text-text-secondary"><Key size={13} className="text-gold" /><span className="font-mono tracking-widest">{'\u25CF'.repeat(s.pin_code.length)}</span></div>
                    {!s.is_active && <span className="inline-block text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">{isRtl ? '\u0645\u062a\u0648\u0642\u0641' : 'Inactive'}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border-custom rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-border-custom bg-surface-2">
              <h2 className="text-xl font-bold text-text-primary">{editingBranch ? (isRtl ? '\u062a\u0639\u062f\u064a\u0644 \u0627\u0644\u0641\u0631\u0639' : 'Edit Branch') : (isRtl ? '\u0625\u0636\u0627\u0641\u0629 \u0641\u0631\u0639 \u062c\u062f\u064a\u062f' : 'Add New Branch')}</h2>
              <button onClick={() => setIsFormOpen(false)} className="p-2 text-text-secondary hover:text-text-primary hover:bg-border-custom rounded-xl transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveBranch} className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5">
              <div><label className="block text-sm font-bold text-text-primary mb-2">{isRtl ? '\u0627\u0633\u0645 \u0627\u0644\u0641\u0631\u0639' : 'Branch Name'} *</label>
                <input type="text" required value={bName} onChange={e => setBName(e.target.value)} className={inputCls} placeholder={isRtl ? '\u0645\u062b\u0627\u0644: \u0641\u0631\u0639 \u0627\u0644\u0633\u064a\u0628' : 'e.g. Seeb Branch'} /></div>
              <div><label className="block text-sm font-bold text-text-primary mb-2">{isRtl ? '\u0627\u0644\u0639\u0646\u0648\u0627\u0646' : 'Address'}</label>
                <textarea value={address} onChange={e => setAddress(e.target.value)} className={`${inputCls} min-h-[80px]`} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-bold text-text-primary mb-2">{isRtl ? '\u0627\u0644\u0639\u0645\u0644\u0629' : 'Currency'} *</label>
                  <input type="text" required value={currencyCode} maxLength={3} onChange={e => setCurrencyCode(e.target.value.toUpperCase())} className={`${inputCls} uppercase`} /></div>
                <div><label className="block text-sm font-bold text-text-primary mb-2">{isRtl ? '\u0627\u0644\u0636\u0631\u064a\u0628\u0629 %' : 'VAT %'} *</label>
                  <input type="number" required min="0" step="0.01" value={vatRate} onChange={e => setVatRate(Number(e.target.value))} className={inputCls} /></div>
              </div>
              <div><label className="block text-sm font-bold text-text-primary mb-2">{isRtl ? '\u0627\u0644\u0631\u0642\u0645 \u0627\u0644\u0636\u0631\u064a\u0628\u064a (\u0627\u062e\u062a\u064a\u0627\u0631\u064a)' : 'VAT Reg. No. (Optional)'}</label>
                <input type="text" value={vatRegNumber} onChange={e => setVatRegNumber(e.target.value)} className={inputCls} /></div>
              {editingBranch && !editingBranch.is_default && (
                <div className="flex items-center gap-3 bg-surface-2 p-4 rounded-xl border border-border-custom">
                  <input type="checkbox" id="ba" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="w-5 h-5 rounded text-gold focus:ring-gold" />
                  <label htmlFor="ba" className="text-sm font-medium text-text-primary cursor-pointer select-none">{isRtl ? '\u0627\u0644\u0641\u0631\u0639 \u0646\u0634\u0637' : 'Branch is active'}</label>
                </div>
              )}
              <div className="pt-4 border-t border-border-custom">
                <button type="submit" disabled={saving} className="w-full flex items-center justify-center gap-2 bg-gold text-white font-bold py-3 px-4 rounded-xl hover:bg-gold/90 transition-all shadow-lg shadow-gold/20 disabled:opacity-50">
                  {saving ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} />}<span>{isRtl ? '\u062d\u0641\u0638' : 'Save'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isStaffFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border-custom rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-border-custom bg-surface-2">
              <h2 className="text-xl font-bold text-text-primary">{editingStaff ? (isRtl ? '\u062a\u0639\u062f\u064a\u0644 \u0627\u0644\u0645\u0648\u0638\u0641' : 'Edit Staff') : (isRtl ? '\u0625\u0636\u0627\u0641\u0629 \u0645\u0648\u0638\u0641' : 'Add Staff Member')}</h2>
              <button onClick={() => setIsStaffFormOpen(false)} className="p-2 text-text-secondary hover:text-text-primary hover:bg-border-custom rounded-xl transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveStaff} className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5">
              <div><label className="block text-sm font-bold text-text-primary mb-2">{isRtl ? '\u0627\u0633\u0645 \u0627\u0644\u0645\u0648\u0638\u0641' : 'Staff Name'} *</label>
                <input type="text" required value={sName} onChange={e => setSName(e.target.value)} className={inputCls} placeholder={isRtl ? '\u0623\u062d\u0645\u062f' : 'Ahmed'} /></div>
              <div><label className="block text-sm font-bold text-text-primary mb-2">{isRtl ? '\u0627\u0644\u062f\u0648\u0631' : 'Role'} *</label>
                <div className="relative">
                  <select value={sRole} onChange={e => setSRole(e.target.value as StaffRole)} className={`${inputCls} appearance-none cursor-pointer pe-9`}>
                    {(Object.keys(ROLE_LABELS) as StaffRole[]).map(r => <option key={r} value={r}>{isRtl ? ROLE_LABELS[r].ar : ROLE_LABELS[r].en}</option>)}
                  </select>
                  <ChevronDown size={16} className="absolute end-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
                </div>
              </div>
              <div><label className="block text-sm font-bold text-text-primary mb-2">{isRtl ? '\u0627\u0644\u0641\u0631\u0639 (\u0627\u062e\u062a\u064a\u0627\u0631\u064a)' : 'Branch (Optional)'}</label>
                <div className="relative">
                  <select value={sBranchId} onChange={e => setSBranchId(e.target.value)} className={`${inputCls} appearance-none cursor-pointer pe-9`}>
                    <option value="">{isRtl ? '\u062c\u0645\u064a\u0639 \u0627\u0644\u0641\u0631\u0648\u0639' : 'All Branches'}</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                  <ChevronDown size={16} className="absolute end-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
                </div>
              </div>
              <div><label className="block text-sm font-bold text-text-primary mb-2">{isRtl ? '\u0627\u0644\u0631\u0642\u0645 \u0627\u0644\u0633\u0631\u064a (4-6 \u0623\u0631\u0642\u0627\u0645)' : 'PIN Code (4-6 digits)'} *</label>
                <div className="relative">
                  <input type={showPin ? 'text' : 'password'} required minLength={4} maxLength={6} pattern="[0-9]{4,6}" value={sPin}
                    onChange={e => setSPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className={`${inputCls} font-mono tracking-widest pe-12`} placeholder="● ● ● ●" />
                  <button type="button" onClick={() => setShowPin(!showPin)} className="absolute end-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-gold transition-colors">
                    {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-xs text-text-secondary mt-1">{isRtl ? '\u0627\u0644\u0645\u0648\u0638\u0641 \u064a\u0633\u062c\u0644 \u062f\u062e\u0648\u0644\u0647 \u0628\u0647\u0630\u0627 \u0627\u0644\u0631\u0642\u0645' : 'Staff logs in with this PIN - no email needed'}</p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-bold text-text-primary"><Shield size={15} className="inline me-1 text-gold" />{isRtl ? 'الصلاحيات' : 'Permissions'}</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setSPerms(PERMISSIONS.map(p => p.key))}
                      className="text-[11px] text-gold hover:underline font-bold">{isRtl ? 'تحديد الكل' : 'Select All'}</button>
                    <span className="text-text-secondary text-[11px]">|</span>
                    <button type="button" onClick={() => setSPerms([])}
                      className="text-[11px] text-text-secondary hover:text-red-500 hover:underline font-bold">{isRtl ? 'إلغاء الكل' : 'Clear All'}</button>
                  </div>
                </div>
                <div className="space-y-4">
                  {PERM_GROUPS.map(group => (
                    <div key={group.group}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[11px] font-extrabold text-gold/80 uppercase tracking-wider">
                          {isRtl ? group.groupAr : group.group}
                        </p>
                        <button type="button"
                          onClick={() => {
                            const keys = group.perms.map(p => p.key);
                            const allSelected = keys.every(k => sPerms.includes(k));
                            if (allSelected) setSPerms(prev => prev.filter(k => !keys.includes(k)));
                            else setSPerms(prev => [...new Set([...prev, ...keys])]);
                          }}
                          className="text-[10px] text-text-secondary hover:text-gold transition-colors font-medium">
                          {group.perms.every(p => sPerms.includes(p.key)) ? (isRtl ? 'إلغاء المجموعة' : 'Deselect') : (isRtl ? 'تحديد المجموعة' : 'Select all')}
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {group.perms.map(p => (
                          <label key={p.key} className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition-all ${sPerms.includes(p.key) ? 'bg-gold/10 border-gold/40 text-gold' : 'bg-surface-2 border-border-custom text-text-secondary hover:border-gold/30'}`}>
                            <input type="checkbox" checked={sPerms.includes(p.key)} onChange={() => togglePerm(p.key)} className="hidden" />
                            <div className={`w-4 h-4 rounded flex-shrink-0 border-2 flex items-center justify-center transition-all ${sPerms.includes(p.key) ? 'bg-gold border-gold' : 'border-border-custom bg-card'}`}>
                              {sPerms.includes(p.key) && <span className="text-white text-[10px] font-bold">✓</span>}
                            </div>
                            <span className="text-xs font-medium">{isRtl ? p.ar : p.en}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {editingStaff && (
                <div className="flex items-center gap-3 bg-surface-2 p-4 rounded-xl border border-border-custom">
                  <input type="checkbox" id="sa" checked={sIsActive} onChange={e => setSIsActive(e.target.checked)} className="w-5 h-5 rounded text-gold focus:ring-gold" />
                  <label htmlFor="sa" className="text-sm font-medium text-text-primary cursor-pointer select-none">{isRtl ? '\u0627\u0644\u0645\u0648\u0638\u0641 \u0646\u0634\u0637' : 'Staff is active'}</label>
                </div>
              )}
              <div className="pt-4 border-t border-border-custom">
                <button type="submit" disabled={staffSaving} className="w-full flex items-center justify-center gap-2 bg-gold text-white font-bold py-3 px-4 rounded-xl hover:bg-gold/90 transition-all shadow-lg shadow-gold/20 disabled:opacity-50">
                  {staffSaving ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} />}<span>{isRtl ? '\u062d\u0641\u0638' : 'Save'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
