import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Upload, FileSpreadsheet, FileText, Check, AlertTriangle, 
  XCircle, Loader2, Sparkles, ArrowRight, Edit3, Trash2 
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

interface ImportRow {
  name_ar: string;
  name_en: string;
  price: number;
  category_name?: string;
  description_ar?: string;
  description_en?: string;
  image_url?: string;
  status: 'ready' | 'warning' | 'error';
  statusMessage?: string;
}

interface MenuImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId: string;
  onImportComplete: () => void;
}

type ImportStep = 'upload' | 'processing' | 'preview' | 'importing';
type FileType = 'excel' | 'pdf';

// ═══════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════

export const MenuImportModal: React.FC<MenuImportModalProps> = ({
  isOpen,
  onClose,
  restaurantId,
  onImportComplete
}) => {
  const { isRtl } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<ImportStep>('upload');
  const [fileType, setFileType] = useState<FileType>('excel');
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [importProgress, setImportProgress] = useState(0);

  // ── Reset state ─────────────────────────────────────────────
  const resetState = useCallback(() => {
    setStep('upload');
    setRows([]);
    setEditingRow(null);
    setImportProgress(0);
  }, []);

  const handleClose = () => {
    resetState();
    onClose();
  };

  // ── Excel/CSV Parsing ───────────────────────────────────────
  const parseExcelCSV = async (file: File) => {
    setStep('processing');
    
    try {
      const text = await file.text();
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      
      if (lines.length < 2) {
        toast.error(isRtl ? 'الملف فارغ أو لا يحتوي بيانات كافية' : 'File is empty or has insufficient data');
        setStep('upload');
        return;
      }

      // Detect separator
      const separator = lines[0].includes('\t') ? '\t' : ',';
      const headers = lines[0].split(separator).map(h => h.trim().replace(/"/g, '').toLowerCase());
      
      // Map header names (support Arabic and English)
      const headerMap: Record<string, string> = {};
      headers.forEach((h, i) => {
        const normalized = h.toLowerCase().trim();
        if (['اسم الطبق', 'name', 'dish name', 'الاسم', 'name_ar'].includes(normalized)) headerMap['name'] = String(i);
        if (['name_en', 'english name', 'الاسم بالانجليزي'].includes(normalized)) headerMap['name_en'] = String(i);
        if (['التصنيف', 'category', 'الفئة'].includes(normalized)) headerMap['category'] = String(i);
        if (['السعر', 'price', 'سعر'].includes(normalized)) headerMap['price'] = String(i);
        if (['الوصف', 'description', 'وصف'].includes(normalized)) headerMap['description'] = String(i);
        if (['description_en', 'الوصف بالانجليزي'].includes(normalized)) headerMap['description_en'] = String(i);
        if (['رابط الصورة', 'image', 'image_url', 'صورة'].includes(normalized)) headerMap['image'] = String(i);
      });

      // Validate required headers
      if (!headerMap['name'] && !headerMap['name_en']) {
        toast.error(isRtl ? 'لم يتم العثور على عمود اسم الطبق' : 'Name column not found');
        setStep('upload');
        return;
      }

      // Parse data rows
      const parsed: ImportRow[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(separator).map(c => c.trim().replace(/"/g, ''));
        
        const name = cols[Number(headerMap['name'])] || '';
        const nameEn = cols[Number(headerMap['name_en'])] || name;
        const price = parseFloat(cols[Number(headerMap['price'])] || '0');
        const category = cols[Number(headerMap['category'])] || '';
        const desc = cols[Number(headerMap['description'])] || '';
        const descEn = cols[Number(headerMap['description_en'])] || desc;
        const img = cols[Number(headerMap['image'])] || '';

        // Determine row status
        let status: ImportRow['status'] = 'ready';
        let statusMessage = '';

        if (!name && !nameEn) {
          status = 'error';
          statusMessage = isRtl ? 'اسم الطبق مطلوب' : 'Dish name is required';
        } else if (isNaN(price) || price <= 0) {
          status = 'error';
          statusMessage = isRtl ? 'السعر غير صالح' : 'Invalid price';
        } else if (!desc && !img) {
          status = 'warning';
          statusMessage = isRtl ? 'لا يوجد وصف أو صورة' : 'No description or image';
        }

        parsed.push({
          name_ar: name,
          name_en: nameEn,
          price,
          category_name: category,
          description_ar: desc,
          description_en: descEn,
          image_url: img,
          status,
          statusMessage
        });
      }

      setRows(parsed);
      setStep('preview');
    } catch (err) {
      console.error('CSV parse error:', err);
      toast.error(isRtl ? 'خطأ في قراءة الملف' : 'Error reading file');
      setStep('upload');
    }
  };

  // ── PDF AI Extraction ───────────────────────────────────────
  const parsePDF = async (file: File) => {
    setStep('processing');

    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const formData = new FormData();
      formData.append('file', file);

      const resp = await fetch('/api/import-menu-pdf', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || 'PDF extraction failed');
      }

      const data = await resp.json();
      
      if (!data.dishes || !Array.isArray(data.dishes) || data.dishes.length === 0) {
        toast.error(isRtl ? 'لم يتم استخراج أي أطباق من الملف' : 'No dishes extracted from PDF');
        setStep('upload');
        return;
      }

      // Map extracted data to ImportRow format
      const parsed: ImportRow[] = data.dishes.map((dish: any) => {
        const name = dish.name_ar || dish.name || '';
        const nameEn = dish.name_en || dish.name || '';
        const price = parseFloat(dish.price) || 0;

        let status: ImportRow['status'] = 'ready';
        let statusMessage = '';

        if (!name && !nameEn) {
          status = 'error';
          statusMessage = isRtl ? 'اسم الطبق مطلوب' : 'Name required';
        } else if (price <= 0) {
          status = 'error';
          statusMessage = isRtl ? 'السعر غير صالح' : 'Invalid price';
        } else if (!dish.description_ar && !dish.description_en) {
          status = 'warning';
          statusMessage = isRtl ? 'لا يوجد وصف' : 'No description';
        }

        return {
          name_ar: name,
          name_en: nameEn,
          price,
          category_name: dish.category || '',
          description_ar: dish.description_ar || dish.description || '',
          description_en: dish.description_en || dish.description || '',
          image_url: '',
          status,
          statusMessage
        };
      });

      setRows(parsed);
      setStep('preview');
    } catch (err: any) {
      console.error('PDF extraction error:', err);
      toast.error(err.message || (isRtl ? 'خطأ في استخراج البيانات' : 'Extraction error'));
      setStep('upload');
    }
  };

  // ── Handle File Selection ───────────────────────────────────
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    
    if (['csv', 'tsv', 'xlsx', 'xls'].includes(ext || '')) {
      if (ext === 'xlsx' || ext === 'xls') {
        // For Excel files, read as CSV fallback (simplified — in production use SheetJS)
        toast.error(isRtl ? 'يرجى حفظ الملف بصيغة CSV أولاً' : 'Please save as CSV first');
        return;
      }
      await parseExcelCSV(file);
    } else if (ext === 'pdf') {
      await parsePDF(file);
    } else {
      toast.error(isRtl ? 'صيغة غير مدعومة. استخدم CSV أو PDF' : 'Unsupported format. Use CSV or PDF');
    }

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Confirm Import ──────────────────────────────────────────
  const handleConfirmImport = async () => {
    const validRows = rows.filter(r => r.status !== 'error');
    if (validRows.length === 0) {
      toast.error(isRtl ? 'لا توجد أطباق صالحة للاستيراد' : 'No valid dishes to import');
      return;
    }

    setStep('importing');
    let imported = 0;

    try {
      // Fetch existing categories for matching
      const { data: existingCategories } = await supabase
        .from('categories')
        .select('id, name_ar, name_en')
        .eq('restaurant_id', restaurantId);

      const categoryMap = new Map<string, string>();
      (existingCategories || []).forEach((cat: any) => {
        categoryMap.set(cat.name_ar?.toLowerCase(), cat.id);
        categoryMap.set(cat.name_en?.toLowerCase(), cat.id);
      });

      for (const row of validRows) {
        // Try to match category by name
        let categoryId: string | null = null;
        if (row.category_name) {
          categoryId = categoryMap.get(row.category_name.toLowerCase()) || null;
          
          // Auto-create category if not found
          if (!categoryId) {
            const { data: newCat } = await supabase
              .from('categories')
              .insert({
                restaurant_id: restaurantId,
                name_ar: row.category_name,
                name_en: row.category_name,
                sort_order: categoryMap.size
              })
              .select()
              .single();
            
            if (newCat) {
              categoryId = newCat.id;
              categoryMap.set(row.category_name.toLowerCase(), newCat.id);
            }
          }
        }

        // Insert into dishes (the sync trigger will handle pos_products)
        const { error } = await supabase.from('dishes').insert({
          restaurant_id: restaurantId,
          category_id: categoryId,
          name_ar: row.name_ar || row.name_en,
          name_en: row.name_en || row.name_ar,
          description_ar: row.description_ar || null,
          description_en: row.description_en || null,
          price: row.price,
          currency: 'USD',
          image_url: row.image_url || null,
          is_available: true,
          sort_order: imported
        });

        if (!error) {
          imported++;
        } else {
          console.error('Failed to import dish:', row.name_ar, error);
        }

        setImportProgress(Math.round((imported / validRows.length) * 100));
      }

      toast.success(
        isRtl 
          ? `تم استيراد ${imported} طبق بنجاح!` 
          : `Successfully imported ${imported} dishes!`
      );
      
      onImportComplete();
      handleClose();
    } catch (err: any) {
      console.error('Import error:', err);
      toast.error(isRtl ? 'خطأ أثناء الاستيراد' : 'Import error');
      setStep('preview');
    }
  };

  // ── Row editing ─────────────────────────────────────────────
  const updateRow = (index: number, field: keyof ImportRow, value: any) => {
    setRows(prev => prev.map((r, i) => {
      if (i !== index) return r;
      const updated = { ...r, [field]: value };
      
      // Re-validate
      if (!updated.name_ar && !updated.name_en) {
        updated.status = 'error';
        updated.statusMessage = isRtl ? 'اسم الطبق مطلوب' : 'Name required';
      } else if (isNaN(updated.price) || updated.price <= 0) {
        updated.status = 'error';
        updated.statusMessage = isRtl ? 'السعر غير صالح' : 'Invalid price';
      } else if (!updated.description_ar && !updated.image_url) {
        updated.status = 'warning';
        updated.statusMessage = isRtl ? 'لا يوجد وصف أو صورة' : 'No description or image';
      } else {
        updated.status = 'ready';
        updated.statusMessage = '';
      }

      return updated;
    }));
  };

  const deleteRow = (index: number) => {
    setRows(prev => prev.filter((_, i) => i !== index));
  };

  // ── Render ──────────────────────────────────────────────────
  if (!isOpen) return null;

  const readyCount = rows.filter(r => r.status === 'ready').length;
  const warningCount = rows.filter(r => r.status === 'warning').length;
  const errorCount = rows.filter(r => r.status === 'error').length;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-5xl bg-sidebar border border-border-custom rounded-[2rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-border-custom flex items-center justify-between bg-card/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
                <Sparkles size={20} className="text-gold" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-text">
                  {isRtl ? 'استيراد المنيو' : 'Import Menu'}
                </h3>
                <p className="text-xs text-text-muted">
                  {isRtl ? 'استورد الأطباق من ملف CSV أو PDF' : 'Import dishes from CSV or PDF file'}
                </p>
              </div>
            </div>
            <button onClick={handleClose} className="p-2 hover:bg-white/5 rounded-xl transition-all">
              <X size={24} className="text-text-secondary" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* ── Step: Upload ── */}
            {step === 'upload' && (
              <div className="space-y-6">
                {/* File type tabs */}
                <div className="flex gap-3 p-1 bg-card rounded-xl border border-border-custom">
                  <button
                    onClick={() => setFileType('excel')}
                    className={cn(
                      "flex-1 py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2",
                      fileType === 'excel'
                        ? "bg-gold text-black shadow-lg"
                        : "text-text-secondary hover:text-white"
                    )}
                  >
                    <FileSpreadsheet size={18} />
                    {isRtl ? 'ملف CSV' : 'CSV File'}
                  </button>
                  <button
                    onClick={() => setFileType('pdf')}
                    className={cn(
                      "flex-1 py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2",
                      fileType === 'pdf'
                        ? "bg-gold text-black shadow-lg"
                        : "text-text-secondary hover:text-white"
                    )}
                  >
                    <FileText size={18} />
                    {isRtl ? 'ملف PDF' : 'PDF File'}
                  </button>
                </div>

                {/* Upload zone */}
                <label className="block cursor-pointer">
                  <div className="border-2 border-dashed border-white/10 rounded-2xl p-12 text-center hover:border-gold/30 transition-all group">
                    <Upload size={48} className="mx-auto text-text-muted group-hover:text-gold transition-colors mb-4" />
                    <p className="text-lg font-bold text-text mb-2">
                      {isRtl ? 'اسحب الملف هنا أو اضغط للاختيار' : 'Drop file here or click to browse'}
                    </p>
                    <p className="text-sm text-text-muted">
                      {fileType === 'excel'
                        ? (isRtl ? 'صيغ مدعومة: CSV, TSV' : 'Supported: CSV, TSV')
                        : (isRtl ? 'صيغة مدعومة: PDF (منيو مطعم)' : 'Supported: PDF (restaurant menu)')
                      }
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept={fileType === 'excel' ? '.csv,.tsv' : '.pdf'}
                    onChange={handleFileSelect}
                  />
                </label>

                {/* CSV Template Info */}
                {fileType === 'excel' && (
                  <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4">
                    <p className="text-xs font-bold text-blue-400 mb-2">
                      {isRtl ? 'تنسيق الأعمدة المطلوب:' : 'Required column format:'}
                    </p>
                    <code className="text-xs text-text-muted block bg-black/20 rounded-lg p-3 font-mono" dir="ltr">
                      اسم الطبق, name_en, التصنيف, السعر, الوصف, description_en, رابط الصورة
                    </code>
                  </div>
                )}

                {/* PDF Info */}
                {fileType === 'pdf' && (
                  <div className="bg-purple-500/5 border border-purple-500/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={14} className="text-purple-400" />
                      <p className="text-xs font-bold text-purple-400">
                        {isRtl ? 'استخراج ذكي بالذكاء الاصطناعي' : 'AI-Powered Extraction'}
                      </p>
                    </div>
                    <p className="text-xs text-text-muted">
                      {isRtl 
                        ? 'سيتم إرسال الملف لنموذج Gemini لاستخراج أسماء الأطباق والأسعار تلقائياً. يدعم المنيوهات بالعربي والإنجليزي.'
                        : 'The file will be sent to Gemini AI to automatically extract dish names and prices. Supports Arabic and English menus.'
                      }
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── Step: Processing ── */}
            {step === 'processing' && (
              <div className="flex flex-col items-center justify-center py-20 space-y-6">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-gold/20 border-t-gold rounded-full animate-spin" />
                  <Sparkles size={24} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gold" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-text">
                    {fileType === 'pdf'
                      ? (isRtl ? 'يتم استخراج الأطباق بالذكاء الاصطناعي...' : 'AI is extracting dishes...')
                      : (isRtl ? 'يتم تحليل الملف...' : 'Parsing file...')
                    }
                  </p>
                  <p className="text-sm text-text-muted mt-1">
                    {isRtl ? 'يرجى الانتظار' : 'Please wait'}
                  </p>
                </div>
              </div>
            )}

            {/* ── Step: Preview ── */}
            {step === 'preview' && (
              <div className="space-y-4">
                {/* Summary bar */}
                <div className="flex gap-4 flex-wrap">
                  <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <Check size={16} className="text-emerald-400" />
                    <span className="text-sm font-bold text-emerald-400">{readyCount} {isRtl ? 'جاهز' : 'Ready'}</span>
                  </div>
                  {warningCount > 0 && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                      <AlertTriangle size={16} className="text-amber-400" />
                      <span className="text-sm font-bold text-amber-400">{warningCount} {isRtl ? 'تحذير' : 'Warning'}</span>
                    </div>
                  )}
                  {errorCount > 0 && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl">
                      <XCircle size={16} className="text-red-400" />
                      <span className="text-sm font-bold text-red-400">{errorCount} {isRtl ? 'خطأ' : 'Error'}</span>
                    </div>
                  )}
                </div>

                {/* Preview table */}
                <div className="border border-white/5 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-card/80 border-b border-white/5">
                          <th className="px-4 py-3 text-start text-xs font-bold text-text-muted uppercase">#</th>
                          <th className="px-4 py-3 text-start text-xs font-bold text-text-muted uppercase">
                            {isRtl ? 'الحالة' : 'Status'}
                          </th>
                          <th className="px-4 py-3 text-start text-xs font-bold text-text-muted uppercase">
                            {isRtl ? 'اسم الطبق (عربي)' : 'Name (Arabic)'}
                          </th>
                          <th className="px-4 py-3 text-start text-xs font-bold text-text-muted uppercase">
                            {isRtl ? 'اسم الطبق (إنجليزي)' : 'Name (English)'}
                          </th>
                          <th className="px-4 py-3 text-start text-xs font-bold text-text-muted uppercase">
                            {isRtl ? 'السعر' : 'Price'}
                          </th>
                          <th className="px-4 py-3 text-start text-xs font-bold text-text-muted uppercase">
                            {isRtl ? 'التصنيف' : 'Category'}
                          </th>
                          <th className="px-4 py-3 text-start text-xs font-bold text-text-muted uppercase">
                            {isRtl ? 'إجراءات' : 'Actions'}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, i) => (
                          <tr key={i} className={cn(
                            "border-b border-white/5 transition-colors",
                            row.status === 'error' ? "bg-red-500/5" : 
                            row.status === 'warning' ? "bg-amber-500/5" : "hover:bg-white/2"
                          )}>
                            <td className="px-4 py-3 text-text-muted">{i + 1}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5" title={row.statusMessage}>
                                {row.status === 'ready' && <Check size={16} className="text-emerald-400" />}
                                {row.status === 'warning' && <AlertTriangle size={16} className="text-amber-400" />}
                                {row.status === 'error' && <XCircle size={16} className="text-red-400" />}
                                {row.statusMessage && (
                                  <span className="text-xs text-text-muted truncate max-w-[120px]">
                                    {row.statusMessage}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {editingRow === i ? (
                                <input
                                  value={row.name_ar}
                                  onChange={e => updateRow(i, 'name_ar', e.target.value)}
                                  className="bg-card border border-border-custom rounded px-2 py-1 text-sm w-full text-text"
                                />
                              ) : (
                                <span className="text-text font-medium">{row.name_ar || '—'}</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {editingRow === i ? (
                                <input
                                  value={row.name_en}
                                  onChange={e => updateRow(i, 'name_en', e.target.value)}
                                  className="bg-card border border-border-custom rounded px-2 py-1 text-sm w-full text-text"
                                />
                              ) : (
                                <span className="text-text">{row.name_en || '—'}</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {editingRow === i ? (
                                <input
                                  type="number"
                                  value={row.price}
                                  onChange={e => updateRow(i, 'price', parseFloat(e.target.value) || 0)}
                                  className="bg-card border border-border-custom rounded px-2 py-1 text-sm w-20 text-text"
                                />
                              ) : (
                                <span className="text-gold font-bold">{row.price.toFixed(2)}</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {editingRow === i ? (
                                <input
                                  value={row.category_name || ''}
                                  onChange={e => updateRow(i, 'category_name', e.target.value)}
                                  className="bg-card border border-border-custom rounded px-2 py-1 text-sm w-full text-text"
                                />
                              ) : (
                                <span className="text-text-muted">{row.category_name || '—'}</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => setEditingRow(editingRow === i ? null : i)}
                                  className="p-1.5 hover:bg-white/5 rounded-lg transition-colors"
                                >
                                  <Edit3 size={14} className={editingRow === i ? "text-gold" : "text-text-muted"} />
                                </button>
                                <button
                                  onClick={() => deleteRow(i)}
                                  className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors"
                                >
                                  <Trash2 size={14} className="text-text-muted hover:text-red-400" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── Step: Importing ── */}
            {step === 'importing' && (
              <div className="flex flex-col items-center justify-center py-20 space-y-6">
                <div className="w-full max-w-md">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-text-muted">{isRtl ? 'جاري الاستيراد...' : 'Importing...'}</span>
                    <span className="text-gold font-bold">{importProgress}%</span>
                  </div>
                  <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-gold to-gold-light rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${importProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
                <p className="text-sm text-text-muted">
                  {isRtl 
                    ? 'يتم إضافة الأطباق إلى المنيو ومزامنتها تلقائياً مع نقاط البيع...'
                    : 'Adding dishes to menu and auto-syncing to POS...'
                  }
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          {step === 'preview' && (
            <div className="p-6 border-t border-border-custom bg-card/50 flex items-center justify-between">
              <button
                onClick={resetState}
                className="px-6 py-3 bg-card border border-border-custom text-text font-bold rounded-xl hover:bg-white/5 transition-all"
              >
                {isRtl ? 'رجوع' : 'Back'}
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={readyCount + warningCount === 0}
                className="px-8 py-3 bg-gold text-black font-bold rounded-xl shadow-lg shadow-gold/20 hover:bg-gold-light transition-all disabled:opacity-50 flex items-center gap-2"
              >
                <Check size={18} />
                {isRtl 
                  ? `استيراد ${readyCount + warningCount} طبق` 
                  : `Import ${readyCount + warningCount} dishes`
                }
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
