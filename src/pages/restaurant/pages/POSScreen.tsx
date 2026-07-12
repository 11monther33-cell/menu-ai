import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuth } from '../../../hooks/useAuth';
import {
  fetchProducts,
  fetchCategories,
  createOrder,
  addOrderItem,
  closeOrder,
  getOpenOrderForTable,
  fetchOrderWithItems,
  POSProduct,
  POSMenuCategory
} from '../../../services/posService';
import { usePOSStore, CartItem } from '../../../store/posStore';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import {
  ShoppingCart, RefreshCw, AlertTriangle, Printer, Trash2, Plus, Minus, CreditCard, DollarSign, Wallet, X
} from 'lucide-react';

export const POSScreen = () => {
  const { isRtl } = useLanguage();
  const { user } = useAuth();
  const {
    currentBranch,
    cart,
    addToCart,
    updateCartItemQty,
    removeFromCart,
    clearCart,
    getCartSubtotal,
    getCartItemCount,
    tableNumber,
    setTableNumber,
    generateIdempotencyKey
  } = usePOSStore();

  const [categories, setCategories] = useState<POSMenuCategory[]>([]);
  const [products, setProducts] = useState<POSProduct[]>([]);
  const [activeCat, setActiveCat] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Order & Payment Flow
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'other'>('cash');
  const [amountTendered, setAmountTendered] = useState<string>('');
  const [paying, setPaying] = useState(false);

  // Success Receipt
  const [receiptData, setReceiptData] = useState<any | null>(null);

  const loadData = async () => {
    if (!currentBranch) return;
    setLoading(true);
    try {
      const [cats, prods] = await Promise.all([
        fetchCategories(currentBranch.id),
        fetchProducts(currentBranch.id)
      ]);
      setCategories(cats);
      setProducts(prods);
    } catch (err) {
      console.error(err);
      toast.error(isRtl ? 'فشل تحميل بيانات نقطة البيع' : 'Failed to load POS data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentBranch?.id]);

  const handleAddToCart = async (prod: POSProduct) => {
    if (!currentBranch) return;
    const hasRecipe = prod.cost_price !== null && prod.cost_price !== undefined;
    addToCart(prod, hasRecipe);
  };

  const handlePayClick = () => {
    if (cart.length === 0) return;
    const subtotal = getCartSubtotal();
    const vat = subtotal * (currentBranch!.vat_rate / 100);
    const total = subtotal + vat;
    setAmountTendered(total.toFixed(3));
    setShowPaymentModal(true);
  };

  const handleProcessPayment = async () => {
    if (!currentBranch) return;
    setPaying(true);
    try {
      // Addition A: Generate idempotency key BEFORE the request
      const idempotencyKey = generateIdempotencyKey();

      // 1. Create order on the fly
      const order = await createOrder(currentBranch.id, tableNumber || undefined, currentBranch.currency_code);

      // 2. Add all items to order
      for (const item of cart) {
        await addOrderItem(order.id, item.productId, item.quantity);
      }

      // 3. Process payment with idempotency key and get invoice
      const invoice = await closeOrder(
        order.id,
        paymentMethod,
        Number(amountTendered),
        currentBranch.vat_rate,
        idempotencyKey
      );

      setReceiptData({
        invoiceNumber: invoice.invoiceNumber,
        subtotal: invoice.subtotal,
        vatAmount: invoice.vatAmount,
        total: invoice.total,
        items: [...cart],
        date: new Date().toLocaleString(),
        paymentMethod
      });

      toast.success(isRtl ? 'تم إغلاق الطلب وإصدار الفاتورة' : 'Order closed and invoice issued');
      setShowPaymentModal(false);
      clearCart();
    } catch (err) {
      console.error(err);
      toast.error(isRtl ? 'فشل إتمام عملية الدفع' : 'Payment process failed');
    } finally {
      setPaying(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredProducts = activeCat === 'all'
    ? products
    : products.filter(p => p.category_id === activeCat);

  const subtotal = getCartSubtotal();
  const vat = subtotal * (currentBranch ? currentBranch.vat_rate / 100 : 0.05);
  const total = subtotal + vat;

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-6 relative">
      {/* Products Side */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Categories Scroller */}
        <div className="flex gap-2 overflow-x-auto pb-4 custom-scrollbar">
          <button
            onClick={() => setActiveCat('all')}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
              activeCat === 'all'
                ? 'bg-gold text-white shadow-lg shadow-gold/20'
                : 'bg-sidebar border border-border-custom text-text-secondary hover:bg-card'
            }`}
          >
            {isRtl ? 'الكل' : 'All'}
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCat(cat.id)}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
                activeCat === cat.id
                  ? 'bg-gold text-white shadow-lg shadow-gold/20'
                  : 'bg-sidebar border border-border-custom text-text-secondary hover:bg-card'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar pb-6">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <RefreshCw className="animate-spin text-gold" size={32} />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map(prod => (
                <motion.div
                  key={prod.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAddToCart(prod)}
                  className="bg-sidebar border border-border-custom p-4 rounded-2xl flex flex-col justify-between cursor-pointer hover:border-gold/30 hover:shadow-lg transition-all h-36"
                >
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-bold text-sm text-text-primary line-clamp-2">{prod.name}</span>
                      {!prod.cost_price && (
                        <span
                          className="px-1.5 py-0.5 bg-red-500/10 border border-red-500/20 text-[9px] font-bold text-red-400 rounded"
                          title={isRtl ? 'لن يخصم من المخزون تلقائياً' : 'Will not auto deduct stock'}
                        >
                          {isRtl ? 'بدون وصفة' : 'No Recipe'}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-text-secondary">{prod.category_name}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="font-bold text-gold text-sm">
                      {Number(prod.selling_price).toFixed(3)} {currentBranch?.currency_code}
                    </span>
                  </div>
                </motion.div>
              ))}
              {filteredProducts.length === 0 && (
                <div className="col-span-full py-12 text-center text-text-secondary">
                  {isRtl ? 'لا يوجد منتجات متاحة في هذا القسم.' : 'No products available in this category.'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Cart Panel */}
      <div className="w-full lg:w-96 bg-sidebar border border-border-custom rounded-[2rem] flex flex-col overflow-hidden shrink-0">
        <div className="p-6 border-b border-border-custom bg-card/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} className="text-gold" />
            <span className="font-bold text-lg text-text-primary">{isRtl ? 'سلة الطلبات' : 'Cart'}</span>
          </div>
          <span className="px-2.5 py-0.5 bg-gold/10 text-gold rounded-full text-xs font-bold">
            {getCartItemCount()} {isRtl ? 'أصناف' : 'items'}
          </span>
        </div>

        <div className="p-4 border-b border-border-custom bg-card/10">
          <input
            type="text"
            placeholder={isRtl ? 'رقم الطاولة (اختياري)' : 'Table Number (Optional)'}
            className="w-full bg-main border border-border-custom rounded-xl px-4 py-2.5 text-sm text-text-primary outline-none focus:border-gold/50"
            value={tableNumber}
            onChange={e => setTableNumber(e.target.value)}
          />
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {cart.map(item => (
            <div key={item.productId} className="bg-main border border-border-custom p-3 rounded-xl flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-text-primary truncate">{item.name}</p>
                <p className="text-xs text-gold font-bold">
                  {Number(item.lineTotal).toFixed(3)} {currentBranch?.currency_code}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateCartItemQty(item.productId, item.quantity - 1)}
                  className="p-1 hover:bg-card text-text-secondary rounded transition-colors"
                >
                  <Minus size={14} />
                </button>
                <span className="text-sm font-bold text-text-primary w-6 text-center">{item.quantity}</span>
                <button
                  onClick={() => updateCartItemQty(item.productId, item.quantity + 1)}
                  className="p-1 hover:bg-card text-text-secondary rounded transition-colors"
                >
                  <Plus size={14} />
                </button>
                <button
                  onClick={() => removeFromCart(item.productId)}
                  className="p-1 hover:bg-red-500/10 text-red-400 rounded transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <p className="text-text-muted text-sm">{isRtl ? 'السلة فارغة حالياً' : 'Cart is empty'}</p>
            </div>
          )}
        </div>

        {/* Totals & Pay */}
        <div className="p-6 bg-card/30 border-t border-border-custom space-y-4">
          <div className="space-y-2 text-sm text-text-secondary">
            <div className="flex justify-between">
              <span>{isRtl ? 'المجموع الفرعي' : 'Subtotal'}</span>
              <span>{subtotal.toFixed(3)} {currentBranch?.currency_code}</span>
            </div>
            <div className="flex justify-between">
              <span>{isRtl ? `الضريبة (${currentBranch?.vat_rate}%)` : `VAT (${currentBranch?.vat_rate}%)`}</span>
              <span>{vat.toFixed(3)} {currentBranch?.currency_code}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-text-primary pt-2 border-t border-border-custom/50">
              <span>{isRtl ? 'الإجمالي' : 'Total'}</span>
              <span className="text-gold">{total.toFixed(3)} {currentBranch?.currency_code}</span>
            </div>
          </div>

          <button
            onClick={handlePayClick}
            disabled={cart.length === 0}
            className="w-full py-3 bg-gold text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-gold/90 transition-all shadow-lg shadow-gold/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRtl ? 'دفع وإغلاق الطلب' : 'Pay & Issue Invoice'}
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="fixed inset-0 bg-[#0A0A0B]/80 backdrop-blur-sm" onClick={() => setShowPaymentModal(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-sidebar border border-border-custom w-full max-w-md rounded-[2rem] overflow-hidden z-10"
            >
              <div className="p-6 border-b border-border-custom flex items-center justify-between bg-card/30">
                <h3 className="text-xl font-bold text-text-primary">{isRtl ? 'إتمام عملية الدفع' : 'Complete Payment'}</h3>
                <button onClick={() => setShowPaymentModal(false)} className="text-text-secondary hover:text-text-primary">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'cash', label: isRtl ? 'نقدي' : 'Cash', icon: <Wallet size={18} /> },
                    { id: 'card', label: isRtl ? 'بطاقة' : 'Card', icon: <CreditCard size={18} /> },
                    { id: 'other', label: isRtl ? 'أخرى' : 'Other', icon: <DollarSign size={18} /> }
                  ].map(m => (
                    <button
                      key={m.id}
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-2 font-bold text-xs transition-all ${
                        paymentMethod === m.id
                          ? 'border-gold bg-gold/10 text-gold'
                          : 'border-border-custom hover:bg-card text-text-secondary'
                      }`}
                    >
                      {m.icon}
                      {m.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-text-secondary">{isRtl ? 'المبلغ المستلم' : 'Amount Tendered'}</label>
                  <input
                    type="number"
                    step="0.001"
                    className="w-full bg-main border border-border-custom rounded-lg px-4 py-2.5 text-text-primary font-bold text-lg outline-none focus:border-gold/50"
                    value={amountTendered}
                    onChange={e => setAmountTendered(e.target.value)}
                  />
                </div>

                {Number(amountTendered) > total && (
                  <div className="flex justify-between items-center text-xs bg-gold/5 border border-gold/10 p-3 rounded-xl">
                    <span className="text-text-secondary">{isRtl ? 'المتبقي للعميل (الفكة)' : 'Change Due'}</span>
                    <span className="font-bold text-gold">
                      {(Number(amountTendered) - total).toFixed(3)} {currentBranch?.currency_code}
                    </span>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="px-4 py-2 border border-border-custom text-text-secondary rounded-lg hover:bg-card"
                  >
                    {isRtl ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    onClick={handleProcessPayment}
                    disabled={paying || Number(amountTendered) < total}
                    className="px-6 py-2 bg-gold text-white font-bold rounded-lg hover:bg-gold/90 flex items-center gap-2"
                  >
                    {paying && <RefreshCw className="animate-spin" size={16} />}
                    {isRtl ? 'تأكيد ودفع' : 'Confirm & Pay'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Receipt Modal */}
      <AnimatePresence>
        {receiptData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="fixed inset-0 bg-[#0A0A0B]/80 backdrop-blur-sm" onClick={() => setReceiptData(null)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-sidebar border border-border-custom w-full max-w-sm rounded-[2rem] overflow-hidden z-10"
            >
              <div className="p-6 border-b border-border-custom flex items-center justify-between bg-card/30">
                <h3 className="text-lg font-bold text-text-primary">{isRtl ? 'إيصال الفاتورة المبسطة' : 'Simplified Tax Invoice'}</h3>
                <button onClick={() => setReceiptData(null)} className="text-text-secondary hover:text-text-primary">
                  <X size={20} />
                </button>
              </div>

              {/* Printable Receipt Layout */}
              <div id="printable-receipt" className="p-6 space-y-4 text-xs font-mono text-text-primary">
                <div className="text-center space-y-1">
                  <p className="text-base font-bold uppercase">{currentBranch?.name}</p>
                  <p>{currentBranch?.address}</p>
                  {currentBranch?.vat_registration_number && (
                    <p>{isRtl ? 'الرقم الضريبي:' : 'VATIN:'} {currentBranch.vat_registration_number}</p>
                  )}
                  <p className="border-b border-dashed border-border-custom pb-2" />
                </div>

                <div className="space-y-1">
                  <p><strong>{isRtl ? 'رقم الفاتورة:' : 'Invoice:'}</strong> {receiptData.invoiceNumber}</p>
                  <p><strong>{isRtl ? 'التاريخ:' : 'Date:'}</strong> {receiptData.date}</p>
                  <p><strong>{isRtl ? 'طريقة الدفع:' : 'Payment:'}</strong> {receiptData.paymentMethod.toUpperCase()}</p>
                  {tableNumber && <p><strong>{isRtl ? 'طاولة:' : 'Table:'}</strong> {tableNumber}</p>}
                  <p className="border-b border-dashed border-border-custom pb-2" />
                </div>

                <div className="space-y-2">
                  {receiptData.items.map((item: any) => (
                    <div key={item.productId} className="flex justify-between">
                      <div>
                        <p className="font-bold">{item.name}</p>
                        <p className="text-text-secondary">{item.quantity} x {Number(item.unitPrice).toFixed(3)}</p>
                      </div>
                      <span className="font-bold">{Number(item.lineTotal).toFixed(3)}</span>
                    </div>
                  ))}
                  <p className="border-b border-dashed border-border-custom pb-2" />
                </div>

                <div className="space-y-1 text-right">
                  <div className="flex justify-between">
                    <span>{isRtl ? 'المجموع الخاضع للضريبة:' : 'Taxable Subtotal:'}</span>
                    <span>{Number(receiptData.subtotal).toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{isRtl ? `الضريبة (${currentBranch?.vat_rate}%):` : `VAT (${currentBranch?.vat_rate}%):`}</span>
                    <span>{Number(receiptData.vatAmount).toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold pt-1">
                    <span>{isRtl ? 'الإجمالي الشامل:' : 'Grand Total:'}</span>
                    <span>{Number(receiptData.total).toFixed(3)} {currentBranch?.currency_code}</span>
                  </div>
                </div>

                <div className="text-center pt-4 border-t border-dashed border-border-custom">
                  <p className="font-bold">{isRtl ? 'شكرًا لزيارتكم!' : 'Thank you for your visit!'}</p>
                </div>
              </div>

              <div className="p-4 bg-card/30 border-t border-border-custom flex gap-3">
                <button
                  onClick={handlePrint}
                  className="flex-1 py-2.5 bg-gold text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-gold/90 transition-all shadow-md shadow-gold/20"
                >
                  <Printer size={16} />
                  {isRtl ? 'طباعة' : 'Print'}
                </button>
                <button
                  onClick={() => setReceiptData(null)}
                  className="flex-1 py-2.5 bg-card border border-border-custom text-text-primary rounded-xl font-bold hover:bg-sidebar transition-all"
                >
                  {isRtl ? 'إغلاق' : 'Close'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
