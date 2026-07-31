import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, CreditCard, Smartphone, ArrowRight, Loader2, X, MapPin, User, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';
import { useCartStore } from '../../store/cartStore';
import { useMenuStore } from '../../store/menuStore';
import { toast } from 'react-hot-toast';
import { useParams } from 'react-router-dom';

interface AmwalCheckoutProps {
  onSuccess: () => void;
  onCancel: () => void;
}

type FulfillmentType = 'pickup' | 'delivery';

export const AmwalCheckout: React.FC<AmwalCheckoutProps> = ({ onSuccess, onCancel }) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const { getTotalPrice, clearCart, items } = useCartStore();
  const { branding } = useMenuStore();
  const { restaurantId } = useParams();
  const total = getTotalPrice();
  
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>('pickup');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const primaryColor = branding?.primary_color || '#C9A84C';

  const handlePay = async () => {
    if (!customerName || !customerPhone || (fulfillmentType === 'delivery' && !deliveryAddress)) {
      toast.error(isRtl ? 'يرجى إكمال جميع البيانات المطلوبة' : 'Please fill all required fields');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/paymob/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId: restaurantId, // We use restaurantId as branchId for now in the demo
          orderItems: items,
          fulfillmentType,
          customerName,
          customerPhone,
          deliveryAddress: fulfillmentType === 'delivery' ? deliveryAddress : undefined
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize payment');
      }

      // Simulate redirect to Paymob
      toast.loading(isRtl ? 'جاري التحويل لبوابة الدفع...' : 'Redirecting to payment gateway...', { duration: 2000 });
      
      setTimeout(() => {
        setIsProcessing(false);
        clearCart();
        toast.success(isRtl ? 'تم تحويل الطلب للدفع!' : 'Order ready for payment!');
        // In real life: window.location.href = data.paymobUrl;
        onSuccess();
      }, 2000);

    } catch (err: any) {
      toast.error(err.message || 'Payment failed');
      setIsProcessing(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-white dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl"
    >
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {isRtl ? 'الدفع الآمن' : 'Secure Checkout'}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {isRtl ? 'مدعوم من Paymob' : 'Powered by Paymob'}
          </p>
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-gray-100 dark:bg-white/5 rounded-xl mb-6">
        <button
          onClick={() => setFulfillmentType('pickup')}
          className={cn(
            "flex-1 py-2.5 rounded-lg text-sm font-bold transition-all",
            fulfillmentType === 'pickup' ? "bg-white dark:bg-black shadow-sm text-black dark:text-white" : "text-gray-500"
          )}
        >
          {isRtl ? 'استلام من المطعم' : 'Pickup'}
        </button>
        <button
          onClick={() => setFulfillmentType('delivery')}
          className={cn(
            "flex-1 py-2.5 rounded-lg text-sm font-bold transition-all",
            fulfillmentType === 'delivery' ? "bg-white dark:bg-black shadow-sm text-black dark:text-white" : "text-gray-500"
          )}
        >
          {isRtl ? 'توصيل' : 'Delivery'}
        </button>
      </div>

      <div className="space-y-4 mb-8">
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
            {isRtl ? 'الاسم' : 'Name'}
          </label>
          <div className="relative">
            <User className="absolute top-1/2 -translate-y-1/2 left-3 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:border-black dark:focus:border-white transition-colors"
              placeholder={isRtl ? 'الاسم الكريم' : 'Your name'}
            />
          </div>
        </div>
        
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
            {isRtl ? 'رقم الهاتف' : 'Phone Number'}
          </label>
          <div className="relative">
            <Phone className="absolute top-1/2 -translate-y-1/2 left-3 w-5 h-5 text-gray-400" />
            <input 
              type="tel" 
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:border-black dark:focus:border-white transition-colors"
              placeholder="05xxxxxxx"
            />
          </div>
        </div>

        <AnimatePresence>
          {fulfillmentType === 'delivery' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block pt-2">
                {isRtl ? 'عنوان التوصيل' : 'Delivery Address'}
              </label>
              <div className="relative">
                <MapPin className="absolute top-3 left-3 w-5 h-5 text-gray-400" />
                <textarea 
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:border-black dark:focus:border-white transition-colors min-h-[80px]"
                  placeholder={isRtl ? 'المدينة، الحي، الشارع...' : 'City, Area, Street...'}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between py-4 border-t border-gray-100 dark:border-white/5 mb-6">
        <span className="font-bold text-gray-500">{isRtl ? 'الإجمالي للدفع' : 'Total to Pay'}</span>
        <span className="text-2xl font-black" style={{ color: primaryColor }}>
          {total.toFixed(3)} <span className="text-sm font-semibold opacity-70">OMR</span>
        </span>
      </div>

      <button
        onClick={handlePay}
        disabled={isProcessing}
        className="w-full h-14 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-70 disabled:active:scale-100"
        style={{ backgroundColor: primaryColor }}
      >
        {isProcessing ? (
          <Loader2 className="w-6 h-6 animate-spin" />
        ) : (
          <>
            {isRtl ? 'تأكيد ودفع' : 'Confirm & Pay'}
            <ArrowRight className={cn("w-5 h-5", isRtl && "rotate-180")} />
          </>
        )}
      </button>
    </motion.div>
  );
};
