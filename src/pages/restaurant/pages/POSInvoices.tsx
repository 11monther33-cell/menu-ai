import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuth } from '../../../hooks/useAuth';
import {
  fetchInvoices,
  fetchInvoiceWithDetails,
  cancelOrder,
  POSInvoice
} from '../../../services/posService';
import { usePOSStore } from '../../../store/posStore';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import {
  Search, RefreshCw, ChevronDown, ChevronUp, Printer, RefreshCcw, FileText, AlertCircle, X
} from 'lucide-react';

export const POSInvoices = () => {
  const { isRtl } = useLanguage();
  const { user } = useAuth();
  const { currentBranch } = usePOSStore();

  const [invoices, setInvoices] = useState<POSInvoice[]>([]);
  const [expandedInvoice, setExpandedInvoice] = useState<POSInvoice | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Refund / Cancellation dialog
  const [cancellingInvoice, setCancellingInvoice] = useState<POSInvoice | null>(null);
  const [processingCancel, setProcessingCancel] = useState(false);

  const loadData = async () => {
    if (!currentBranch) return;
    setLoading(true);
    try {
      const data = await fetchInvoices(currentBranch.id, search || undefined);
      setInvoices(data);
    } catch (err) {
      console.error(err);
      toast.error(isRtl ? 'فشل تحميل الفواتير' : 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentBranch?.id, search]);

  const handleExpandRow = async (invoice: POSInvoice) => {
    if (expandedInvoice?.id === invoice.id) {
      setExpandedInvoice(null);
      return;
    }
    try {
      const details = await fetchInvoiceWithDetails(invoice.id);
      if (details) {
        setExpandedInvoice(details);
      }
    } catch (err) {
      toast.error(isRtl ? 'فشل تحميل تفاصيل الفاتورة' : 'Failed to load invoice details');
    }
  };

  const handleCancelClick = (invoice: POSInvoice) => {
    setCancellingInvoice(invoice);
  };

  const handleConfirmCancel = async () => {
    if (!cancellingInvoice) return;
    setProcessingCancel(true);
    try {
      await cancelOrder(cancellingInvoice.order_id);
      toast.success(
        isRtl
          ? 'تم إلغاء الطلب بنجاح، استرجاع المواد للمخزون وإصدار إشعار دائن (Credit Note)'
          : 'Order cancelled, inventory restored, and Credit Note issued'
      );
      setCancellingInvoice(null);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error(isRtl ? 'فشل إلغاء الطلب' : 'Failed to cancel order');
    } finally {
      setProcessingCancel(false);
    }
  };

  const handlePrint = (invoice: POSInvoice) => {
    const printContent = document.getElementById(`invoice-print-panel-${invoice.id}`);
    if (!printContent) return;
    const originalContent = document.body.innerHTML;
    document.body.innerHTML = printContent.innerHTML;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload(); // Reload to restore React state cleanly
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2 text-text-primary">
          {isRtl ? 'سجل الفواتير الصادرة' : 'Invoices Register'}
        </h1>
        <p className="text-text-secondary text-sm">
          {isRtl ? 'عرض سجل الفواتير والمستندات الضريبية المبسطة الصادرة، إلغاء الطلبات وإصدار إشعارات الخصم/الائتمان.' : 'Track simplified tax invoices, process order refunds, and issue Credit Notes.'}
        </p>
      </div>

      {/* Search Filter */}
      <div className="bg-sidebar border border-border-custom p-6 rounded-[2rem] flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder={isRtl ? 'البحث برقم الفاتورة...' : 'Search by invoice number...'}
            className="w-full bg-main border border-border-custom rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-primary outline-none focus:border-gold/50"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <Search size={16} className="absolute left-3 top-3.5 text-text-secondary" />
        </div>
        <button onClick={loadData} className="p-2.5 hover:bg-card rounded-lg transition-colors text-text-secondary">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Invoices List */}
      <div className="bg-sidebar border border-border-custom rounded-[2.5rem] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right">
            <thead className="bg-card/50 text-xs text-text-secondary uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-bold">{isRtl ? 'رقم الفاتورة' : 'Invoice #'}</th>
                <th className="px-6 py-4 font-bold">{isRtl ? 'التاريخ' : 'Date'}</th>
                <th className="px-6 py-4 font-bold">{isRtl ? 'طاولة' : 'Table'}</th>
                <th className="px-6 py-4 font-bold">{isRtl ? 'المبلغ الإجمالي' : 'Total Amount'}</th>
                <th className="px-6 py-4 font-bold">{isRtl ? 'الحالة' : 'Status'}</th>
                <th className="px-6 py-4 font-bold">{isRtl ? 'جاهزية الفوترة' : 'Fawtara Ready'}</th>
                <th className="px-6 py-4 font-bold text-center">{isRtl ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-custom">
              {invoices.map((inv) => {
                const isExpanded = expandedInvoice?.id === inv.id;
                const isCancelled = inv.status === 'credited';
                return (
                  <React.Fragment key={inv.id}>
                    <tr className="hover:bg-card/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-sm text-text-primary flex items-center gap-2">
                        <FileText size={16} className="text-gold" />
                        {inv.invoice_number}
                      </td>
                      <td className="px-6 py-4 text-sm text-text-secondary">
                        {new Date(inv.issue_date).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-text-secondary">
                        {inv.order?.table_number ? `${isRtl ? 'طاولة' : 'Table'} ${inv.order.table_number}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-text-primary">
                        {Number(inv.order?.total || 0).toFixed(3)} {currentBranch?.currency_code}
                      </td>
                      <td className="px-6 py-4">
                        {isCancelled ? (
                          <span className="px-2.5 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-full">
                            {isRtl ? 'ملغاة/دائن' : 'Credited / Refunded'}
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold rounded-full">
                            {isRtl ? 'صادرة' : 'Issued'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="px-2 py-0.5 bg-white/5 border border-white/10 text-text-muted text-[10px] font-bold rounded-full cursor-help"
                          title={isRtl ? 'التكامل التلقائي مع نظام الفوترة العماني قريباً' : 'Automatic Peppol integration coming soon'}
                        >
                          {isRtl ? 'قريباً — الفوترة' : 'Coming Soon'}
                        </span>
                      </td>
                      <td className="px-6 py-4 flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleExpandRow(inv)}
                          className="p-1.5 hover:bg-card text-text-secondary hover:text-text-primary rounded-lg transition-colors"
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                        <button
                          onClick={() => handlePrint(inv)}
                          className="p-1.5 hover:bg-card text-gold rounded-lg transition-colors"
                          title={isRtl ? 'إعادة طباعة' : 'Reprint'}
                        >
                          <Printer size={16} />
                        </button>
                        {!isCancelled && (
                          <button
                            onClick={() => handleCancelClick(inv)}
                            className="p-1.5 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors"
                            title={isRtl ? 'إرجاع / إلغاء' : 'Refund / Cancel'}
                          >
                            <RefreshCcw size={16} />
                          </button>
                        )}
                      </td>
                    </tr>

                    {/* Expandable Invoice Details Panel */}
                    <AnimatePresence>
                      {isExpanded && expandedInvoice && (
                        <tr>
                          <td colSpan={7} className="p-0 bg-card/10">
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="px-8 py-6 border-t border-b border-border-custom space-y-4"
                            >
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs text-text-secondary">
                                <div>
                                  <p className="font-bold text-text-muted mb-1">{isRtl ? 'رقم الفاتورة المرجع' : 'Invoice Number'}</p>
                                  <p className="text-text-primary font-mono">{expandedInvoice.invoice_number}</p>
                                </div>
                                <div>
                                  <p className="font-bold text-text-muted mb-1">{isRtl ? 'الرقم الضريبي للبائع' : 'Seller VATIN'}</p>
                                  <p className="text-text-primary">{expandedInvoice.seller_vatin || '-'}</p>
                                </div>
                                <div>
                                  <p className="font-bold text-text-muted mb-1">{isRtl ? 'اسم المنشأة' : 'Seller Name'}</p>
                                  <p className="text-text-primary">{expandedInvoice.seller_name || '-'}</p>
                                </div>
                                <div>
                                  <p className="font-bold text-text-muted mb-1">{isRtl ? 'التصنيف القانوني' : 'Invoice Status'}</p>
                                  <p className="text-text-primary uppercase font-bold">{expandedInvoice.status}</p>
                                </div>
                              </div>

                              <div className="border border-border-custom rounded-xl overflow-hidden mt-4">
                                <table className="w-full text-xs text-left rtl:text-right">
                                  <thead className="bg-card/50 text-[10px] uppercase font-bold text-text-secondary">
                                    <tr>
                                      <th className="px-4 py-2">{isRtl ? 'الوصف' : 'Description'}</th>
                                      <th className="px-4 py-2">{isRtl ? 'الكمية' : 'Qty'}</th>
                                      <th className="px-4 py-2">{isRtl ? 'سعر الوحدة' : 'Unit Price'}</th>
                                      <th className="px-4 py-2">{isRtl ? 'المجموع الصافي' : 'Net Amount'}</th>
                                      <th className="px-4 py-2">{isRtl ? 'الضريبة (%)' : 'VAT (%)'}</th>
                                      <th className="px-4 py-2">{isRtl ? 'مبلغ الضريبة' : 'VAT Amount'}</th>
                                      <th className="px-4 py-2">{isRtl ? 'الإجمالي الشامل' : 'Total Amount'}</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-border-custom">
                                    {expandedInvoice.line_items?.map((item) => (
                                      <tr key={item.id} className="hover:bg-card/10">
                                        <td className="px-4 py-2.5 font-bold text-text-primary">{item.description}</td>
                                        <td className="px-4 py-2.5 text-text-secondary">{item.quantity}</td>
                                        <td className="px-4 py-2.5 text-text-secondary">{Number(item.unit_price).toFixed(3)}</td>
                                        <td className="px-4 py-2.5 text-text-secondary">{Number(item.net_amount).toFixed(3)}</td>
                                        <td className="px-4 py-2.5 text-text-secondary">{Number(item.vat_rate).toFixed(1)}%</td>
                                        <td className="px-4 py-2.5 text-text-secondary">{Number(item.vat_amount).toFixed(3)}</td>
                                        <td className="px-4 py-2.5 font-bold text-text-primary">
                                          {Number(item.total_amount).toFixed(3)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>

                              {/* Hidden Print Receipt Panel */}
                              <div id={`invoice-print-panel-${inv.id}`} className="hidden">
                                <div className="p-8 text-center space-y-4" style={{ fontFamily: 'monospace', color: '#000', backgroundColor: '#fff', width: '300px', margin: '0 auto' }}>
                                  <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>{expandedInvoice.seller_name}</h2>
                                  <p>{isRtl ? 'الرقم الضريبي للبائع:' : 'VATIN:'} {expandedInvoice.seller_vatin}</p>
                                  <p>{isRtl ? 'رقم الفاتورة:' : 'Invoice #:'} {expandedInvoice.invoice_number}</p>
                                  <p>{isRtl ? 'التاريخ:' : 'Date:'} {new Date(expandedInvoice.issue_date).toLocaleString()}</p>
                                  <hr style={{ borderTop: '1px dashed #000' }} />
                                  <table style={{ width: '100%', fontSize: '12px', textAlign: 'left' }}>
                                    <thead>
                                      <tr>
                                        <th>{isRtl ? 'البند' : 'Item'}</th>
                                        <th>{isRtl ? 'الكمية' : 'Qty'}</th>
                                        <th>{isRtl ? 'الإجمالي' : 'Total'}</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {expandedInvoice.line_items?.map((item) => (
                                        <tr key={item.id}>
                                          <td>{item.description}</td>
                                          <td>{item.quantity}</td>
                                          <td>{Number(item.total_amount).toFixed(3)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                  <hr style={{ borderTop: '1px dashed #000' }} />
                                  <div style={{ textAlign: 'right', fontSize: '12px' }}>
                                    <p>{isRtl ? 'المجموع الصافي:' : 'Subtotal:'} {Number(expandedInvoice.order?.subtotal || 0).toFixed(3)}</p>
                                    <p>{isRtl ? 'الضريبة:' : 'VAT:'} {Number(expandedInvoice.order?.vat_amount || 0).toFixed(3)}</p>
                                    <p style={{ fontWeight: 'bold' }}>{isRtl ? 'الإجمالي الشامل:' : 'Total:'} {Number(expandedInvoice.order?.total || 0).toFixed(3)} {currentBranch?.currency_code}</p>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                );
              })}
              {invoices.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-text-secondary">
                    {isRtl ? 'لم يتم العثور على فواتير مطابقة.' : 'No invoices matching search criteria.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirm Refund / Cancellation Dialog */}
      <AnimatePresence>
        {cancellingInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="fixed inset-0 bg-[#0A0A0B]/85 backdrop-blur-sm" onClick={() => setCancellingInvoice(null)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-sidebar border border-border-custom w-full max-w-md rounded-[2rem] overflow-hidden z-10"
            >
              <div className="p-6 border-b border-border-custom flex items-center justify-between bg-card/30">
                <div className="flex items-center gap-2 text-red-400">
                  <AlertCircle size={20} />
                  <h3 className="text-lg font-bold">{isRtl ? 'تأكيد إلغاء الفاتورة / استرجاع الطلب' : 'Refund & Cancel Order'}</h3>
                </div>
                <button onClick={() => setCancellingInvoice(null)} className="text-text-secondary hover:text-text-primary">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4 text-sm text-text-secondary">
                <p>
                  {isRtl
                    ? `هل أنت متأكد من إلغاء الفاتورة رقم ${cancellingInvoice.invoice_number}؟`
                    : `Are you sure you want to refund/cancel invoice ${cancellingInvoice.invoice_number}?`}
                </p>
                <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl space-y-2 text-xs">
                  <p>• {isRtl ? 'سيتم إصدار إشعار دائن (Credit Note) رسمي للفاتورة.' : 'A formal Credit Note will be created for tracking.'}</p>
                  <p>• {isRtl ? 'سيتم إرجاع كافة الكميات والمواد المستهلكة في الطلب إلى المخزون تلقائياً.' : 'Consumed recipe materials will automatically revert back to stock quantities.'}</p>
                </div>
              </div>
              <div className="p-6 bg-card/30 border-t border-border-custom flex justify-end gap-3">
                <button
                  onClick={() => setCancellingInvoice(null)}
                  className="px-4 py-2 border border-border-custom text-text-secondary rounded-lg hover:bg-card text-xs font-bold"
                >
                  {isRtl ? 'إلغاء وتراجع' : 'No, Keep Invoice'}
                </button>
                <button
                  onClick={handleConfirmCancel}
                  disabled={processingCancel}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-xs font-bold flex items-center gap-1.5"
                >
                  {processingCancel && <RefreshCw className="animate-spin" size={14} />}
                  {isRtl ? 'تأكيد وإصدار إشعار دائن' : 'Confirm Refund'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
