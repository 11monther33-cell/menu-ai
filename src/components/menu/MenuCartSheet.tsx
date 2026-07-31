import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, X, Plus, Minus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCartStore } from '../../store/cartStore';
import { AmwalCheckout } from './AmwalCheckout';
import { cn } from '../../lib/utils';

export const MenuCartSheet = () => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const { isOpen, setIsOpen, items, updateQuantity, removeItem, getTotalPrice, clearCart } = useCartStore();
  const [isCheckout, setIsCheckout] = useState(false);

  const total = getTotalPrice();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={cn(
              "fixed bottom-0 left-0 right-0 z-[101] max-h-[90vh] flex flex-col bg-white dark:bg-[#1A1917] rounded-t-3xl shadow-2xl overflow-hidden",
              isRtl ? "rtl" : "ltr"
            )}
          >
            {/* Handle */}
            <div className="w-full flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing" onClick={() => setIsOpen(false)}>
              <div className="w-12 h-1.5 bg-gray-300 dark:bg-white/20 rounded-full" />
            </div>

            {isCheckout ? (
              <div className="p-6 overflow-y-auto">
                <AmwalCheckout 
                  onCancel={() => setIsCheckout(false)} 
                  onSuccess={() => setIsOpen(false)} 
                />
              </div>
            ) : (
              <>
                <div className="px-6 pb-4 border-b border-gray-100 dark:border-white/5 flex justify-between items-center">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <ShoppingBag className="w-6 h-6 text-[#C9A84C]" />
                    {isRtl ? 'سلة الطلبات' : 'Your Order'}
                  </h2>
                  <button onClick={() => setIsOpen(false)} className="p-2 bg-gray-100 dark:bg-white/10 rounded-full">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  {items.length === 0 ? (
                    <div className="text-center text-gray-500 py-10">
                      <ShoppingBag className="w-16 h-16 mx-auto mb-4 opacity-20" />
                      <p>{isRtl ? 'السلة فارغة' : 'Your cart is empty'}</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {items.map((item) => (
                        <div key={item.cartItemId} className="flex gap-4 items-center">
                          <img 
                            src={item.image} 
                            alt={isRtl ? item.nameAr : item.nameEn}
                            className="w-20 h-20 object-cover rounded-2xl shadow-sm"
                          />
                          <div className="flex-1">
                            <h4 className="font-bold text-lg leading-tight mb-1">
                              {isRtl ? item.nameAr : item.nameEn}
                            </h4>
                            <p className="text-[#C9A84C] font-semibold">
                              {item.price.toFixed(3)} OMR
                            </p>
                          </div>
                          <div className="flex flex-col items-center gap-2 bg-gray-50 dark:bg-white/5 p-1.5 rounded-full">
                            <button 
                              onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                              className="w-8 h-8 flex items-center justify-center bg-white dark:bg-white/10 rounded-full shadow-sm text-gray-900 dark:text-white"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                            <span className="font-bold text-sm w-8 text-center">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                              className="w-8 h-8 flex items-center justify-center bg-white dark:bg-white/10 rounded-full shadow-sm text-gray-900 dark:text-white"
                            >
                              {item.quantity <= 1 ? <Trash2 className="w-4 h-4 text-red-500" /> : <Minus className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {items.length > 0 && (
                  <div className="p-6 bg-gray-50 dark:bg-black/20 border-t border-gray-100 dark:border-white/5">
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-gray-500 font-medium">{isRtl ? 'المجموع الإجمالي' : 'Total'}</span>
                      <span className="text-3xl font-black">{total.toFixed(3)} <span className="text-lg text-gray-400">OMR</span></span>
                    </div>
                    <button
                      onClick={() => setIsCheckout(true)}
                      className="w-full h-14 bg-[#C9A84C] text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-[#C9A84C]/20"
                    >
                      {isRtl ? 'متابعة الدفع' : 'Proceed to Checkout'}
                    </button>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
