import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuth } from '../../../hooks/useAuth';
import { motion } from 'motion/react';
import { 
  Plus, QrCode as QrIcon, Download, Printer, 
  Trash2, ExternalLink, Settings, RefreshCw,
  Layout, Grid, List as ListIcon, Search,
  FileText, Image as ImageIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';

export const QrCodes = () => {
  const { isRtl, t } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [qrCodes, setQrCodes] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newQr, setNewQr] = useState({
    tableNumber: '',
    label: ''
  });

  useEffect(() => {
    if (!user?.restaurantId || user.restaurantId === 'undefined') return;
    fetchQrCodes();
  }, [user?.restaurantId]);

  const fetchQrCodes = async () => {
    if (!user?.restaurantId || user.restaurantId === 'undefined') return;
    try {
      const { data, error } = await supabase
        .from('qr_codes')
        .select('*')
        .eq('restaurant_id', user.restaurantId)
        .order('table_number');
      
      if (error) throw error;
      setQrCodes(data || []);
    } catch (err: any) {
      toast.error(isRtl ? 'فشل تحميل الأكواد' : 'Failed to load QR codes');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!newQr.tableNumber) return;
    setGenerating(true);
    try {
      // 🔒 SECURITY: Include auth token in API call
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error(isRtl ? 'يرجى تسجيل الدخول' : 'Please log in first');
        return;
      }

      const tableNum = parseInt(newQr.tableNumber);
      if (isNaN(tableNum) || tableNum < 1 || tableNum > 999) {
        toast.error(isRtl ? 'رقم الطاولة غير صالح (1-999)' : 'Invalid table number (1-999)');
        return;
      }

      const response = await fetch('/api/qr/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`, // 🔒
        },
        body: JSON.stringify({
          restaurantSlug: user?.restaurantId || 'demo',
          restaurantNameAr: user?.restaurantNameAr || 'المطعم',
          restaurantNameEn: user?.restaurantNameEn || 'Restaurant',
          primaryColor: '#C9A84C',
          tableNumber: tableNum,
          tableLabel: (newQr.label || '').substring(0, 30), // 🔒 Limit
          origin: window.location.origin
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      // Save to Supabase
      const { error: dbError } = await supabase
        .from('qr_codes')
        .insert([{
          restaurant_id: user?.restaurantId,
          table_number: parseInt(newQr.tableNumber),
          label: newQr.label,
          qr_data: data.qrData,
          svg_base64: data.svg,
          pdf_base64: data.pdf
        }]);

      if (dbError) throw dbError;

      toast.success(isRtl ? 'تم إنشاء الكود بنجاح' : 'QR Code generated successfully');
      setShowAddModal(false);
      setNewQr({ tableNumber: '', label: '' });
      fetchQrCodes();
    } catch (err: any) {
      // 🔒 Don't expose raw error details
      toast.error(isRtl ? 'فشل إنشاء الكود. حاول مرة أخرى.' : 'Failed to generate QR. Try again.');
    } finally {
      setGenerating(false);
    }
  };

  const downloadFile = (base64: string, filename: string, type: string) => {
    const link = document.createElement('a');
    link.href = `data:${type};base64,${base64}`;
    link.download = filename;
    link.click();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-text-primary">{t('restaurant.nav.qrCodes')}</h2>
          <p className="text-text-secondary mt-1">{isRtl ? 'إدارة وتحميل أكواد الطاولات' : 'Manage and download table QR codes'}</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="px-6 py-3 bg-gold text-white font-bold rounded-2xl flex items-center gap-2 shadow-lg shadow-gold/20 hover:bg-gold/90 transition-all"
        >
          <Plus size={20} />
          {isRtl ? 'إنشاء كود جديد' : 'Generate New QR'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: isRtl ? 'إجمالي الأكواد' : 'Total QRs', value: qrCodes.length, icon: <QrIcon className="text-gold" /> },
          { label: isRtl ? 'عمليات المسح اليوم' : 'Scans Today', value: '124', icon: <RefreshCw className="text-blue-500" /> },
          { label: isRtl ? 'أعلى طاولة نشاطاً' : 'Most Active Table', value: '#5', icon: <Layout className="text-green-500" /> },
        ].map((stat, i) => (
          <div key={`qr-stat-${i}-${stat.label}`} className="bg-sidebar border border-border-custom p-6 rounded-[2rem] flex items-center gap-4">
            <div className="w-12 h-12 bg-card rounded-2xl flex items-center justify-center border border-border-custom">
              {stat.icon}
            </div>
            <div>
              <p className="text-xs text-text-secondary font-bold uppercase tracking-wider">{stat.label}</p>
              <p className="text-2xl font-bold text-text-primary mt-1">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* QR List */}
      <div className="bg-sidebar border border-border-custom rounded-[2.5rem] overflow-hidden">
        <div className="p-6 border-b border-border-custom flex items-center justify-between bg-card/30">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
            <input 
              type="text" 
              placeholder={isRtl ? 'بحث...' : 'Search...'}
              className="w-full bg-card border border-border-custom rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-gold outline-none text-text-primary"
            />
          </div>
          <div className="flex gap-2">
            <button className="p-2 text-text-secondary hover:text-text-primary bg-card rounded-lg border border-border-custom"><Grid size={18} /></button>
            <button className="p-2 text-gold bg-gold/10 rounded-lg border border-gold/20"><ListIcon size={18} /></button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right">
            <thead className="bg-card/50 text-xs text-text-secondary uppercase">
              <tr>
                <th className="px-8 py-4 font-bold">Table</th>
                <th className="px-8 py-4 font-bold">Label</th>
                <th className="px-8 py-4 font-bold">Scans</th>
                <th className="px-8 py-4 font-bold">Downloads</th>
                <th className="px-8 py-4 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-custom">
              {qrCodes.map((qr) => (
                <tr key={qr.id} className="hover:bg-card/30 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white p-1 rounded-xl border border-border-custom shadow-sm group-hover:scale-110 transition-transform">
                        <img src={`data:image/svg+xml;base64,${qr.svg_base64}`} alt="" className="w-full h-full" />
                      </div>
                      <span className="font-bold text-lg text-text-primary">#{qr.table_number}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-sm text-text-secondary">{qr.label || '—'}</span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-sm font-bold text-text-primary">{qr.scan_count || 0}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => downloadFile(qr.svg_base64, `table-${qr.table_number}-qr.svg`, 'image/svg+xml')}
                        className="p-2 bg-card border border-border-custom rounded-xl text-text-secondary hover:text-gold hover:border-gold transition-all flex items-center gap-2"
                        title="Download SVG"
                      >
                        <ImageIcon size={16} />
                        <span className="text-[10px] font-bold">SVG</span>
                      </button>
                      <button 
                        onClick={() => downloadFile(qr.pdf_base64, `table-${qr.table_number}-print.pdf`, 'application/pdf')}
                        className="p-2 bg-card border border-border-custom rounded-xl text-text-secondary hover:text-gold hover:border-gold transition-all flex items-center gap-2"
                        title="Download PDF"
                      >
                        <FileText size={16} />
                        <span className="text-[10px] font-bold">PDF</span>
                      </button>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex gap-2">
                      <button className="p-2 text-text-secondary hover:text-gold transition-all"><Settings size={18} /></button>
                      <button className="p-2 text-text-secondary hover:text-red-500 transition-all"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {qrCodes.length === 0 && !loading && (
            <div className="py-20 text-center">
              <div className="w-20 h-20 bg-card rounded-full flex items-center justify-center mx-auto mb-4 text-text-secondary">
                <QrIcon size={32} />
              </div>
              <h4 className="font-bold text-lg text-text-primary">{isRtl ? 'لا توجد أكواد' : 'No QR codes yet'}</h4>
              <p className="text-text-secondary text-sm mt-1">{isRtl ? 'ابدأ بإنشاء أول كود لطاولاتك' : 'Start by generating your first table QR code'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="relative w-full max-w-md bg-sidebar border border-border-custom rounded-[2.5rem] p-8 shadow-2xl">
            <h3 className="text-2xl font-bold text-text-primary mb-6">{isRtl ? 'إنشاء كود جديد' : 'Generate New QR'}</h3>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Table Number</label>
                <input 
                  type="number"
                  value={newQr.tableNumber}
                  onChange={e => setNewQr(prev => ({ ...prev, tableNumber: e.target.value }))}
                  className="w-full bg-card border border-border-custom rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-gold outline-none text-text-primary"
                  placeholder="e.g. 5"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Label (Optional)</label>
                <input 
                  type="text"
                  value={newQr.label}
                  onChange={e => setNewQr(prev => ({ ...prev, label: e.target.value }))}
                  className="w-full bg-card border border-border-custom rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-gold outline-none text-text-primary"
                  placeholder="e.g. VIP Section"
                />
              </div>

              <div className="pt-4 flex gap-4">
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 bg-card border border-border-custom text-text-primary font-bold rounded-xl hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleGenerate}
                  disabled={generating || !newQr.tableNumber}
                  className="flex-1 py-3 bg-gold text-white font-bold rounded-xl shadow-lg shadow-gold/20 hover:bg-gold/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {generating && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {isRtl ? 'إنشاء' : 'Generate'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
