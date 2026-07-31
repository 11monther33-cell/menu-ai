import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Upload, FileSpreadsheet, FileText, Check, AlertTriangle, 
  XCircle, Loader2, Sparkles, ArrowRight, Edit3, Trash2,
  FileType2, History, Undo2, Copy, ArrowLeftRight, Globe
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';
import stringSimilarity from 'string-similarity';

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

interface ImportRow {
  name_ar: string;
  name_en: string;
  price: number;
  category_name_ar?: string;
  category_name_en?: string;
  description_ar?: string;
  description_en?: string;
  image_url?: string;
  flag?: string | null;
  status: 'ready' | 'warning' | 'error' | 'duplicate';
  statusMessage?: string;
  // Duplicate detection
  duplicateWarning?: string;
  duplicateMatchId?: string;
  duplicateAction?: 'skip' | 'update';
  // Category matching
  matchedCategoryId?: string;
  matchedCategoryName?: string;
  isNewCategory?: boolean;
}

interface MenuImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId: string;
  onImportComplete: () => void;
}

type ImportStep = 'upload' | 'processing' | 'preview' | 'importing';
type FileType = 'excel' | 'pdf' | 'word' | 'url';

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
  const [inputUrl, setInputUrl] = useState('');
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importHistory, setImportHistory] = useState<{batchId: string, count: number, date: string}[]>([]);

  // ── Reset state ─────────────────────────────────────────────
  const resetState = useCallback(() => {
    setStep('upload');
    setRows([]);
    setEditingRow(null);
    setImportProgress(0);
    loadImportHistory();
  }, []);

  const handleClose = () => {
    resetState();
    onClose();
  };

  // ── History Management ──────────────────────────────────────
  const loadImportHistory = async () => {
    if (!restaurantId) return;
    try {
      const { data, error } = await supabase
        .from('dishes')
        .select('import_batch_id, created_at')
        .eq('restaurant_id', restaurantId)
        .not('import_batch_id', 'is', null);

      if (error) throw error;

      if (data) {
        const groups = data.reduce((acc: any, curr: any) => {
          if (!acc[curr.import_batch_id]) {
            acc[curr.import_batch_id] = { count: 0, minDate: curr.created_at };
          }
          acc[curr.import_batch_id].count++;
          if (new Date(curr.created_at) < new Date(acc[curr.import_batch_id].minDate)) {
            acc[curr.import_batch_id].minDate = curr.created_at;
          }
          return acc;
        }, {});

        const historyArray = Object.entries(groups).map(([id, val]: any) => ({
          batchId: id,
          count: val.count,
          date: val.minDate
        })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setImportHistory(historyArray);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  useEffect(() => {
    if (isOpen && step === 'upload') {
      loadImportHistory();
    }
  }, [isOpen, step, restaurantId]);

  const handleUndo = async (batchId: string) => {
    try {
      const { error } = await supabase
        .from('dishes')
        .update({ is_available: false })
        .eq('import_batch_id', batchId)
        .eq('restaurant_id', restaurantId);

      if (error) throw error;

      toast.success(isRtl ? 'تم إلغاء تنشيط الأطباق المستوردة بنجاح' : 'Imported dishes deactivated successfully');
      loadImportHistory();
      onImportComplete();
    } catch (error) {
      console.error('Undo error:', error);
      toast.error(isRtl ? 'خطأ في التراجع' : 'Error undoing import');
    }
  };

  // ── Data Processing (Matching) ──────────────────────────────
  const processParsedData = async (parsed: ImportRow[]) => {
    try {
      const [{ data: existingCategories }, { data: existingDishes }] = await Promise.all([
        supabase.from('categories').select('id, name_ar, name_en').eq('restaurant_id', restaurantId),
        supabase.from('dishes').select('id, name_ar, name_en').eq('restaurant_id', restaurantId)
      ]);

      const dishes = existingDishes || [];
      const categories = existingCategories || [];

      const dishNamesAr = dishes.map(d => d.name_ar || '').filter(Boolean);
      const dishNamesEn = dishes.map(d => d.name_en || '').filter(Boolean);
      
      const categoryNamesAr = categories.map(c => c.name_ar || '').filter(Boolean);
      const categoryNamesEn = categories.map(c => c.name_en || '').filter(Boolean);

      const processedRows = parsed.map(row => {
        const newRow = { ...row };

        // 1. Category Matching
        const searchCategoryAr = newRow.category_name_ar;
        const searchCategoryEn = newRow.category_name_en || newRow.category_name_ar;
        
        if (searchCategoryAr || searchCategoryEn) {
          let bestCatMatch = { rating: 0, target: '' };
          
          if (searchCategoryAr && categoryNamesAr.length) {
            const match = stringSimilarity.findBestMatch(searchCategoryAr, categoryNamesAr).bestMatch;
            if (match.rating > bestCatMatch.rating) bestCatMatch = match;
          }
          if (searchCategoryEn && categoryNamesEn.length) {
            const match = stringSimilarity.findBestMatch(searchCategoryEn, categoryNamesEn).bestMatch;
            if (match.rating > bestCatMatch.rating) bestCatMatch = match;
          }

          if (bestCatMatch.rating > 0.75) {
            const matchedCat = categories.find(c => c.name_ar === bestCatMatch.target || c.name_en === bestCatMatch.target);
            if (matchedCat) {
              newRow.matchedCategoryId = matchedCat.id;
              newRow.matchedCategoryName = matchedCat.name_ar || matchedCat.name_en || '';
            }
          } else {
            newRow.isNewCategory = true;
          }
        }

        // 2. Duplicate Dish Matching
        const searchName = newRow.name_ar || newRow.name_en;
        if (searchName) {
          let bestDishMatch = { rating: 0, target: '' };
          
          if (dishNamesAr.length) {
            const match = stringSimilarity.findBestMatch(searchName, dishNamesAr).bestMatch;
            if (match.rating > bestDishMatch.rating) bestDishMatch = match;
          }
          if (dishNamesEn.length) {
            const match = stringSimilarity.findBestMatch(searchName, dishNamesEn).bestMatch;
            if (match.rating > bestDishMatch.rating) bestDishMatch = match;
          }

          if (bestDishMatch.rating > 0.75) {
            const matchedDish = dishes.find(d => d.name_ar === bestDishMatch.target || d.name_en === bestDishMatch.target);
            if (matchedDish) {
              newRow.status = 'duplicate';
              newRow.duplicateMatchId = matchedDish.id;
              newRow.duplicateWarning = isRtl 
                ? `يشبه "${matchedDish.name_ar || matchedDish.name_en}" الموجود مسبقاً` 
                : `Similar to existing "${matchedDish.name_en || matchedDish.name_ar}"`;
              newRow.duplicateAction = 'skip';
            }
          }
        }

        return newRow;
      });

      setRows(processedRows);
      setStep('preview');
    } catch (error) {
      console.error('Error processing data:', error);
      toast.error(isRtl ? 'خطأ في مطابقة البيانات' : 'Error matching data');
      setStep('upload');
    }
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
          category_name_ar: category,
          category_name_en: category,
          description_ar: desc,
          description_en: descEn,
          image_url: img,
          status,
          statusMessage
        });
      }

      await processParsedData(parsed);
    } catch (err) {
      console.error('CSV parse error:', err);
      toast.error(isRtl ? 'خطأ في قراءة الملف' : 'Error reading file');
      setStep('upload');
    }
  };

  // ── AI Extraction (PDF/Word/URL) ───────────────────────
  const handleAIImport = async (source: File | string) => {
    if (typeof source === 'string') {
      const blocklist = ['talabat.com', 'ubereats.com', 'zomato.com', 'deliveroo', 'hungerstation.com'];
      if (blocklist.some(domain => source.toLowerCase().includes(domain))) {
        toast.error(isRtl 
          ? 'لا يمكن الاستيراد من منصات التوصيل الخارجية (مثل طلبات أو أوبر إيتس) لأن بياناتها تخص المنصة نفسها، مو موقعكم. يرجى استخدام موقع مطعمكم الخاص، أو تصدير القائمة كملف PDF/Word ورفعه مباشرة.' 
          : 'Cannot import from delivery platforms. Please use your own website or upload a PDF.', { duration: 8000 });
        return;
      }
    }

    setStep('processing');

    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const formData = new FormData();
      if (typeof source === 'string') {
        formData.append('url', source);
      } else {
        formData.append('file', source);
      }

      // The backend handles PDF, Word, and URL at this endpoint
      const resp = await fetch('/api/import-menu', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        let errorMessage = errData.error || 'Extraction failed';
        if (errData.raw) {
          errorMessage += ` | المحتوى الخام: ${errData.raw}`;
        }
        if (errData.requiresManualFallback) {
          toast.error(errorMessage, { duration: 10000 });
          setStep('upload');
          return;
        }
        throw new Error(errorMessage);
      }

      const data = await resp.json();
      
      if (!data.dishes || !Array.isArray(data.dishes) || data.dishes.length === 0) {
        toast.error(isRtl ? 'لم يتم استخراج أي أطباق من الملف' : 'No dishes extracted from document');
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
          category_name_ar: dish.category_ar || dish.category || '',
          category_name_en: dish.category_en || dish.category || '',
          description_ar: dish.description_ar || dish.description || '',
          description_en: dish.description_en || dish.description || '',
          image_url: '',
          status,
          statusMessage
        };
      });

      await processParsedData(parsed);
    } catch (err: any) {
      console.error('Document extraction error:', err);
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
        toast.error(isRtl ? 'يرجى حفظ الملف بصيغة CSV أولاً' : 'Please save as CSV first');
        return;
      }
      await parseExcelCSV(file);
    } else if (ext === 'pdf' || ext === 'doc' || ext === 'docx') {
      await handleAIImport(file);
    } else {
      toast.error(isRtl ? 'صيغة غير مدعومة' : 'Unsupported format');
    }

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Confirm Import ──────────────────────────────────────────
  const handleConfirmImport = async () => {
    const validRows = rows.filter(r => r.status !== 'error' && r.duplicateAction !== 'skip');
    if (validRows.length === 0) {
      toast.error(isRtl ? 'لا توجد أطباق صالحة للاستيراد' : 'No valid dishes to import');
      return;
    }

    setStep('importing');
    let imported = 0;
    const batchId = crypto.randomUUID();

    try {
      const newCategoryMap = new Map<string, string>();
      const { count: catCount } = await supabase.from('categories').select('*', { count: 'exact', head: true }).eq('restaurant_id', restaurantId);
      let currentCatSortOrder = catCount || 0;

      for (const row of validRows) {
        let categoryId: string | null = row.matchedCategoryId || null;

        const searchCategoryForNew = row.category_name_ar || row.category_name_en;
        if (!categoryId && row.isNewCategory && searchCategoryForNew) {
          const catKey = searchCategoryForNew.toLowerCase();
          if (newCategoryMap.has(catKey)) {
            categoryId = newCategoryMap.get(catKey)!;
          } else {
            const { data: newCat } = await supabase
              .from('categories')
              .insert({
                restaurant_id: restaurantId,
                name_ar: row.category_name_ar || row.category_name_en,
                name_en: row.category_name_en || row.category_name_ar,
                sort_order: currentCatSortOrder
              })
              .select()
              .single();
            
            if (newCat) {
              categoryId = newCat.id;
              newCategoryMap.set(catKey, newCat.id);
              currentCatSortOrder++;
            }
          }
        }

        const dishPayload = {
          restaurant_id: restaurantId,
          category_id: categoryId,
          name_ar: row.name_ar || row.name_en,
          name_en: row.name_en || row.name_ar,
          description_ar: row.description_ar || null,
          description_en: row.description_en || null,
          price: row.price,
          currency: 'OMR',
          image_url: row.image_url || null,
          available: true,
          import_batch_id: batchId,
        };

        if (row.duplicateAction === 'update' && row.duplicateMatchId) {
          const { error } = await supabase.from('dishes').update(dishPayload).eq('id', row.duplicateMatchId);
          if (!error) {
            imported++;
          } else {
            console.error('Failed to update dish:', row.name_ar, error);
          }
        } else {
          const { error } = await supabase.from('dishes').insert({
            ...dishPayload,
            sort_order: imported
          });
          if (!error) {
            imported++;
          } else {
            console.error('Failed to import dish:', row.name_ar, error);
          }
        }

        setImportProgress(Math.round((imported / validRows.length) * 100));
      }

      toast.success(
        isRtl 
          ? `تم استيراد/تحديث ${imported} طبق بنجاح!` 
          : `Successfully imported/updated ${imported} dishes!`
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
      
      if (field === 'duplicateAction') return updated;

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
      } else if (updated.duplicateMatchId) {
        updated.status = 'duplicate';
        updated.statusMessage = '';
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

  const readyCount = rows.filter(r => (r.status === 'ready') || (r.status === 'duplicate' && r.duplicateAction === 'update')).length;
  const warningCount = rows.filter(r => r.status === 'warning').length;
  const errorCount = rows.filter(r => r.status === 'error').length;
  const skippedCount = rows.filter(r => r.status === 'duplicate' && r.duplicateAction === 'skip').length;

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
                  {isRtl ? 'استورد الأطباق من ملف CSV أو PDF أو Word' : 'Import dishes from CSV, PDF, or Word file'}
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
                <div className="flex gap-3 p-1 bg-card rounded-xl border border-border-custom flex-wrap">
                  <button
                    onClick={() => setFileType('excel')}
                    className={cn(
                      "flex-1 min-w-[120px] py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2",
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
                      "flex-1 min-w-[120px] py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2",
                      fileType === 'pdf'
                        ? "bg-gold text-black shadow-lg"
                        : "text-text-secondary hover:text-white"
                    )}
                  >
                    <FileText size={18} />
                    {isRtl ? 'ملف PDF' : 'PDF File'}
                  </button>
                  <button
                    onClick={() => setFileType('word')}
                    className={cn(
                      "flex-1 min-w-[120px] py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2",
                      fileType === 'word'
                        ? "bg-gold text-black shadow-lg"
                        : "text-text-secondary hover:text-white"
                    )}
                  >
                    <FileType2 size={18} />
                    {isRtl ? 'ملف Word' : 'Word File'}
                  </button>
                  <button
                    onClick={() => setFileType('url')}
                    className={cn(
                      "flex-1 min-w-[120px] py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2",
                      fileType === 'url'
                        ? "bg-gold text-black shadow-lg"
                        : "text-text-secondary hover:text-white"
                    )}
                  >
                    <Globe size={18} />
                    {isRtl ? 'رابط موقع' : 'Website URL'}
                  </button>
                </div>

                {/* Upload zone */}
                {fileType === 'url' ? (
                  <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 hover:border-gold/30 transition-all">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-3 text-gold mb-2">
                        <Globe size={24} />
                        <h4 className="font-bold text-lg">{isRtl ? 'استيراد من رابط الموقع' : 'Import from Website URL'}</h4>
                      </div>
                      <p className="text-sm text-text-muted">
                        {isRtl 
                          ? 'أدخل رابط صفحة المنيو في موقع مطعمك. سيقوم النظام بقراءة المحتوى واستخراج الأطباق تلقائياً.' 
                          : 'Enter your restaurant menu page URL. The system will read the content and extract dishes automatically.'}
                      </p>
                      <div className="flex gap-3">
                        <input
                          type="url"
                          value={inputUrl}
                          onChange={(e) => setInputUrl(e.target.value)}
                          placeholder="https://your-restaurant.com/menu"
                          className="flex-1 bg-background border border-border-custom rounded-xl px-4 py-3 text-text focus:outline-none focus:border-gold transition-colors"
                          dir="ltr"
                        />
                        <button
                          onClick={() => inputUrl && handleAIImport(inputUrl)}
                          disabled={!inputUrl}
                          className="bg-gold text-black px-6 py-3 rounded-xl font-bold hover:bg-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          {isRtl ? 'جلب المنيو' : 'Fetch Menu'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <label className="block cursor-pointer">
                    <div className="border-2 border-dashed border-white/10 rounded-2xl p-12 text-center hover:border-gold/30 transition-all group">
                      <Upload size={48} className="mx-auto text-text-muted group-hover:text-gold transition-colors mb-4" />
                      <p className="text-lg font-bold text-text mb-2">
                        {isRtl ? 'اسحب الملف هنا أو اضغط للاختيار' : 'Drop file here or click to browse'}
                      </p>
                      <p className="text-sm text-text-muted">
                        {fileType === 'excel'
                          ? (isRtl ? 'صيغ مدعومة: CSV, TSV' : 'Supported: CSV, TSV')
                          : fileType === 'word'
                          ? (isRtl ? 'صيغ مدعومة: DOC, DOCX' : 'Supported: DOC, DOCX')
                          : (isRtl ? 'صيغة مدعومة: PDF (منيو مطعم)' : 'Supported: PDF (restaurant menu)')
                        }
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept={
                        fileType === 'excel' ? '.csv,.tsv' : 
                        fileType === 'word' ? '.doc,.docx' : 
                        '.pdf'
                      }
                      onChange={handleFileSelect}
                    />
                  </label>
                )}

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

                {/* Document (PDF/Word) Info */}
                {(fileType === 'pdf' || fileType === 'word') && (
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

                {/* Import History */}
                {importHistory.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-white/5">
                    <h4 className="text-lg font-bold text-text mb-4 flex items-center gap-2">
                      <History size={20} className="text-gold" />
                      {isRtl ? 'سجل الاستيراد السابق' : 'Import History'}
                    </h4>
                    <div className="space-y-3">
                      {importHistory.map((history) => (
                        <div key={history.batchId} className="flex items-center justify-between bg-card border border-border-custom rounded-xl p-4">
                          <div>
                            <p className="text-sm font-bold text-text">
                              {isRtl ? `${history.count} طبق` : `${history.count} dishes`}
                            </p>
                            <p className="text-xs text-text-muted mt-1">
                              {new Date(history.date).toLocaleString(isRtl ? 'ar-SA' : 'en-US')}
                            </p>
                          </div>
                          <button
                            onClick={() => handleUndo(history.batchId)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors text-sm font-medium"
                          >
                            <Undo2 size={16} />
                            {isRtl ? 'تراجع' : 'Undo'}
                          </button>
                        </div>
                      ))}
                    </div>
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
                    {(fileType === 'pdf' || fileType === 'word')
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
                  {skippedCount > 0 && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-500/10 border border-gray-500/20 rounded-xl">
                      <ArrowLeftRight size={16} className="text-gray-400" />
                      <span className="text-sm font-bold text-gray-400">{skippedCount} {isRtl ? 'متخطى' : 'Skipped'}</span>
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
                            row.status === 'warning' ? "bg-amber-500/5" : 
                            row.status === 'duplicate' ? "bg-orange-500/5" : "hover:bg-white/2"
                          )}>
                            <td className="px-4 py-3 text-text-muted">{i + 1}</td>
                            <td className="px-4 py-3 align-top">
                              <div className="flex items-center gap-1.5" title={row.statusMessage}>
                                {row.status === 'ready' && <Check size={16} className="text-emerald-400" />}
                                {row.status === 'warning' && <AlertTriangle size={16} className="text-amber-400" />}
                                {row.status === 'error' && <XCircle size={16} className="text-red-400" />}
                                {row.status === 'duplicate' && <Copy size={16} className="text-orange-400" />}
                                {row.statusMessage && (
                                  <span className="text-xs text-text-muted truncate max-w-[120px]">
                                    {row.statusMessage}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 align-top">
                              {editingRow === i ? (
                                <input
                                  value={row.name_ar}
                                  onChange={e => updateRow(i, 'name_ar', e.target.value)}
                                  className="bg-card border border-border-custom rounded px-2 py-1 text-sm w-full text-text"
                                />
                              ) : (
                                <div className="flex flex-col gap-1">
                                  <span className="text-text font-medium">{row.name_ar || '—'}</span>
                                  {row.status === 'duplicate' && row.duplicateWarning && (
                                    <span className="text-xs text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded w-fit mt-1 flex items-center gap-1">
                                      <Copy size={12} />
                                      {row.duplicateWarning}
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 align-top">
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
                            <td className="px-4 py-3 align-top">
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
                            <td className="px-4 py-3 align-top">
                              {editingRow === i ? (
                                  <div className="flex flex-col gap-2">
                                    <input
                                      value={row.category_name_ar || ''}
                                      onChange={e => updateRow(i, 'category_name_ar', e.target.value)}
                                      className="bg-card border border-border-custom rounded px-2 py-1 text-sm w-full text-text"
                                      placeholder="Category (AR)"
                                    />
                                    <input
                                      value={row.category_name_en || ''}
                                      onChange={e => updateRow(i, 'category_name_en', e.target.value)}
                                      className="bg-card border border-border-custom rounded px-2 py-1 text-sm w-full text-text"
                                      placeholder="Category (EN)"
                                    />
                                  </div>
                                ) : (
                                  <div className="flex flex-col gap-1">
                                    <span className="text-text">{row.category_name_ar || '—'}</span>
                                    <span className="text-text-muted text-xs">{row.category_name_en || '—'}</span>
                                  {row.matchedCategoryName && (
                                     <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded w-fit">
                                       {isRtl ? `سيتم ربطه: ${row.matchedCategoryName}` : `Matches: ${row.matchedCategoryName}`}
                                     </span>
                                  )}
                                  {row.isNewCategory && (
                                     <span className="text-[10px] text-gold bg-gold/10 px-1.5 py-0.5 rounded w-fit">
                                       {isRtl ? 'تصنيف جديد' : 'New Category'}
                                     </span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 align-top">
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
                              {row.status === 'duplicate' && (
                                <div className="mt-2 flex flex-col gap-1">
                                  <button
                                    onClick={() => updateRow(i, 'duplicateAction', 'skip')}
                                    className={cn("px-2 py-1 text-[10px] font-medium rounded transition-colors text-start", 
                                      row.duplicateAction === 'skip' ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-card text-text-muted hover:bg-white/5 border border-transparent")}
                                  >
                                    {isRtl ? 'تخطي' : 'Skip'}
                                  </button>
                                  <button
                                    onClick={() => updateRow(i, 'duplicateAction', 'update')}
                                    className={cn("px-2 py-1 text-[10px] font-medium rounded transition-colors text-start", 
                                      row.duplicateAction === 'update' ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "bg-card text-text-muted hover:bg-white/5 border border-transparent")}
                                  >
                                    {isRtl ? 'تحديث الموجود' : 'Update Existing'}
                                  </button>
                                </div>
                              )}
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
