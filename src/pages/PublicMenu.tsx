import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { 
  Search, 
  ShoppingBag, 
  Box, 
  Share2, 
  ChevronRight, 
  Star, 
  Clock, 
  MapPin,
  Globe,
  Moon,
  Sun,
  X,
  Info,
  Flame,
  Scale,
  Camera,
  CheckCircle,
  MessageSquare,
  Instagram,
  Phone,
  Link2,
  Plus,
  Sparkles
} from 'lucide-react';
import { useMenuStore } from '../store/menuStore';
import { useCartStore } from '../store/cartStore';
import { assetService } from '../services/assetService';
const AIChatDrawer = React.lazy(() => import('../components/qr/AIChatDrawer').then(m => ({ default: m.AIChatDrawer })));
const MenuStories = React.lazy(() => import('../components/menu/MenuStories').then(m => ({ default: m.MenuStories })));
const MenuCartSheet = React.lazy(() => import('../components/menu/MenuCartSheet').then(m => ({ default: m.MenuCartSheet })));
import { cn } from '../lib/utils';
import { MenuItem } from '../types';
import { toast } from 'react-hot-toast';

const ThreeDViewerFull = React.lazy(() => import('../components/3d/ThreeDViewerFull'));

const PublicMenu = () => {
  const { restaurantId } = useParams();
  const [searchParams] = useSearchParams();
  const tableNumber = searchParams.get('table');
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  
  const { categories, branding, fetchMenu } = useMenuStore();
  const { items: cartItems, getTotalPrice, setIsOpen: setIsCartOpen, addItem } = useCartStore();
  
  const validCategories = categories.filter(c => c.items && c.items.length > 0);
  const [activeCategory, setActiveCategory] = useState(validCategories[0]?.id);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [show3DFull, setShow3DFull] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [googleRating, setGoogleRating] = useState<{rating: number | null, reviewCount: number | null, placeId: string | null}>({ rating: null, reviewCount: null, placeId: null });
  
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    // Preload AIChatDrawer when idle so it's ready on tap without blocking FCP
    const idleCallback = window.requestIdleCallback
      ? window.requestIdleCallback(() => import('../components/qr/AIChatDrawer'))
      : setTimeout(() => import('../components/qr/AIChatDrawer'), 2000);
      
    return () => window.cancelIdleCallback ? window.cancelIdleCallback(idleCallback as number) : clearTimeout(idleCallback as any);
  }, []);

  useEffect(() => {
    if (validCategories.length > 0 && (!activeCategory || !validCategories.find(c => c.id === activeCategory))) {
      setActiveCategory(validCategories[0].id);
    }
  }, [validCategories, activeCategory]);

  useEffect(() => {
    if (restaurantId && restaurantId !== 'undefined') {
      fetchMenu(restaurantId);
      
      // Fetch Google Rating
      fetch(`/api/google/rating?branchId=${restaurantId}`)
        .then(res => res.json())
        .then(data => {
          if (data.rating) setGoogleRating(data);
        })
        .catch(err => console.error('Error fetching google rating:', err));
    }
  }, [restaurantId, fetchMenu]);

  useEffect(() => {
    const bgColor = isDarkMode ? (branding?.bg_color || '#0a0a0a') : '#FFFFFF';
    const textColor = isDarkMode ? (branding?.text_color || '#ffffff') : '#0F0E0B';
    document.body.style.backgroundColor = bgColor;
    document.body.style.color = textColor;
    return () => { 
      document.body.style.backgroundColor = '';
      document.body.style.color = '';
    };
  }, [isDarkMode, branding]);

  const filteredItems = validCategories
    .find(c => c.id === activeCategory)
    ?.items.filter(item => 
      isRtl 
        ? item.nameAr.includes(searchQuery) 
        : item.nameEn.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  const allItems = categories.flatMap(c => c.items || []);

  const handleSnapShare = () => {
    toast.success(isRtl ? 'تم تجهيز بطاقة المشاركة!' : 'Snap card ready to share!');
  };

  const primaryColor = branding?.primary_color || '#C9A84C';

  return (
    <div 
      className={cn(
        "min-h-screen pb-32 transition-colors duration-500 font-sans",
        isRtl ? "rtl" : "ltr",
        isDarkMode ? "bg-[#0a0a0a] text-white" : "bg-white text-black"
      )}
    >
      {/* 🌟 Google Maps Rating Header Widget */}
      {googleRating.rating && (
        <div className="w-full bg-white/5 dark:bg-black/20 backdrop-blur-md border-b border-white/5 py-2 px-6 flex justify-between items-center z-30 sticky top-0">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span>{Number(googleRating.rating).toFixed(1)}</span>
            <span className="text-xs text-gray-400 font-normal underline decoration-dashed underline-offset-2 ml-1 cursor-pointer hover:text-white">
              ({googleRating.reviewCount} {isRtl ? 'تقييم' : 'reviews'})
            </span>
          </div>
          <a 
            href={googleRating.placeId ? `https://search.google.com/local/writereview?placeid=${googleRating.placeId}` : "https://maps.google.com"} 
            target="_blank" 
            rel="noreferrer"
            className="text-xs font-semibold bg-white/10 px-3 py-1 rounded-full flex items-center gap-1 active:scale-95 transition-transform"
            style={{ color: primaryColor }}
          >
            <MapPin className="w-3 h-3" />
            {isRtl ? 'خرائط جوجل' : 'Google Maps'}
          </a>
        </div>
      )}

      {/* Hero Section & Cover */}
      <div className="relative mb-6">
        <div className="h-64 w-full relative">
          <img 
            src={branding?.cover_url || "https://picsum.photos/seed/restaurant/800/400"} 
            alt="Restaurant" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-black/40 to-transparent flex flex-col justify-end p-6 pb-8">
            <h1 className="text-4xl font-black text-white tracking-tight drop-shadow-md">
              {isRtl ? 'واغيو فاين داينينج' : 'Wagyu Fine Dining'}
            </h1>
            <div className="flex items-center gap-4 mt-3 text-white/90 text-xs font-semibold uppercase tracking-wider bg-black/30 w-fit px-4 py-2 rounded-full backdrop-blur-md border border-white/10">
              <div className="flex items-center gap-1.5">
                <Clock size={14} className="text-white/70" />
                <span>20-30 min</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-white/30" />
              <div className="flex items-center gap-1.5">
                <MapPin size={14} className="text-white/70" />
                <span>Riyadh, KSA</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🌟 Menu Stories Section */}
      <div className="mb-6 -mt-4 relative z-10">
        <React.Suspense fallback={<div className="h-24 w-full flex items-center justify-center animate-pulse bg-white/5 rounded-2xl mb-6"></div>}>
          <MenuStories items={allItems} />
        </React.Suspense>
      </div>

      {/* Search Bar (Glassmorphism) */}
      <div className="px-6 mb-8">
        <div className={cn(
          "flex items-center gap-3 px-5 py-3.5 rounded-2xl border transition-all shadow-sm backdrop-blur-xl",
          isDarkMode ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200"
        )}>
          <Search size={20} className="text-gray-400" />
          <input 
            type="text" 
            placeholder={isRtl ? 'ابحث عن الأطباق...' : 'Search for dishes...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent outline-none text-base w-full font-medium placeholder:text-gray-500"
          />
        </div>
      </div>

      {/* Categories Tabs (Sticky, Smooth) */}
      <div className="sticky top-[45px] z-20 py-3 overflow-x-auto no-scrollbar px-6 flex gap-3 bg-gradient-to-b from-[#0a0a0a] via-[#0a0a0a]/95 to-transparent backdrop-blur-xl">
        {validCategories.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "relative px-6 py-3 rounded-2xl text-sm font-bold whitespace-nowrap transition-all duration-300 border shadow-sm",
                isActive 
                  ? "text-white border-transparent" 
                  : isDarkMode 
                    ? "bg-white/5 border-white/5 text-white/50 hover:text-white" 
                    : "bg-white border-gray-200 text-gray-500 hover:text-black"
              )}
            >
              {isActive && !prefersReducedMotion && (
                <motion.div
                  layoutId="activeTabPill"
                  className="absolute inset-0 rounded-2xl shadow-lg"
                  style={{ backgroundColor: primaryColor }}
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              {isActive && prefersReducedMotion && (
                <div
                  className="absolute inset-0 rounded-2xl shadow-lg"
                  style={{ backgroundColor: primaryColor }}
                />
              )}
              <span className="relative z-10">{isRtl ? cat.nameAr : cat.nameEn}</span>
            </button>
          );
        })}
      </div>

      {/* Items List (Staggered Animation) */}
      <div className="px-6 mt-4 space-y-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={prefersReducedMotion ? { opacity: 0 } : "hidden"}
            animate={prefersReducedMotion ? { opacity: 1 } : "show"}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -20 }}
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.08 }
              }
            }}
            className="space-y-5"
          >
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                layoutId={prefersReducedMotion ? undefined : item.id}
                variants={prefersReducedMotion ? undefined : {
                  hidden: { opacity: 0, y: 30, scale: 0.95 },
                  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', damping: 25 } }
                }}
                onClick={() => setSelectedItem(item)}
                className={cn(
                  "p-3 rounded-3xl border flex gap-4 transition-all duration-300 shadow-sm cursor-pointer",
                  isDarkMode ? "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20" : "bg-white border-gray-100 shadow-md hover:shadow-lg hover:border-gray-200"
                )}
              >
                <div className="w-[120px] h-[120px] rounded-2xl overflow-hidden flex-shrink-0 relative shadow-inner bg-black/10 group-hover:scale-[1.02] transition-transform">
                  {item.video ? (
                    <video 
                      src={assetService.getOptimizedUrl(item.video)}
                      poster={item.image ? assetService.getOptimizedUrl(item.image, { width: 300, height: 300 }) : undefined}
                      preload="none"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      muted
                      loop
                      playsInline
                      onPointerEnter={(e) => e.currentTarget.play().catch(()=>{})}
                      onPointerLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                    />
                  ) : (
                    <motion.img 
                      layoutId={prefersReducedMotion ? undefined : `image-${item.id}`}
                      src={assetService.getOptimizedUrl(item.image, { width: 300, height: 300 })} 
                      alt={item.nameEn} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      referrerPolicy="no-referrer"
                    />
                  )}
                  {item.allergens?.includes('spicy') && (
                    <div className="absolute top-2 right-2 bg-red-500/90 backdrop-blur-md p-1 rounded-full shadow-lg">
                      <Flame className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 flex flex-col justify-between py-1 pr-1">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-lg leading-tight">{isRtl ? item.nameAr : item.nameEn}</h3>
                      {item.model3D && (
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white shrink-0 shadow-md" style={{ backgroundColor: primaryColor }}>
                          <Box size={14} />
                        </div>
                      )}
                    </div>
                    <p className={cn(
                      "text-sm mt-1.5 line-clamp-2 leading-snug",
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    )}>
                      {isRtl ? (item.descriptionAr || item.description) : (item.descriptionEn || item.description)}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3">
                    <span className="font-black text-xl tracking-tight" style={{ color: primaryColor }}>
                      {item.price.toFixed(3)} <span className="text-sm font-semibold opacity-70">OMR</span>
                    </span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        addItem(item);
                        toast.success(isRtl ? 'تمت الإضافة للسلة' : 'Added to cart');
                      }}
                      className="w-8 h-8 rounded-full flex items-center justify-center shadow-md active:scale-90 transition-transform"
                      style={{ backgroundColor: isDarkMode ? '#222' : '#f3f4f6', color: isDarkMode ? '#fff' : '#000' }}
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 🌟 Social Media Footer */}
      {(branding?.instagram || branding?.whatsapp) && (
        <div className="mt-16 mb-24 px-6 flex flex-col items-center opacity-70 hover:opacity-100 transition-opacity">
          <h4 className="text-sm font-bold uppercase tracking-widest mb-4 opacity-50">
            {isRtl ? 'تواصل معنا' : 'Connect with us'}
          </h4>
          <div className="flex gap-4">
            {branding?.instagram && (
              <a href={`https://instagram.com/${branding.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:-translate-y-1 transition-all">
                <Instagram className="w-5 h-5" />
              </a>
            )}
            {branding?.whatsapp && (
              <a href={`https://wa.me/${branding.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:-translate-y-1 transition-all">
                <Phone className="w-5 h-5" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Item Detail Modal */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedItem(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              layoutId={selectedItem.id}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={cn(
                "relative w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-white/10",
                isDarkMode ? "bg-[#111111]" : "bg-white"
              )}
            >
              <button 
                onClick={() => setSelectedItem(null)}
                className="absolute top-6 right-6 z-10 p-2.5 bg-black/40 backdrop-blur-xl text-white rounded-full hover:bg-black/60 transition-all shadow-lg"
              >
                <X size={20} />
              </button>

              <div className="relative h-80 transition-all duration-500 overflow-hidden rounded-t-3xl bg-black/10">
                <motion.img 
                  layoutId={prefersReducedMotion ? undefined : `image-${selectedItem.id}`}
                  src={assetService.getOptimizedUrl(selectedItem.image, { width: 800 })} 
                  alt={selectedItem.nameEn} 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-inherit via-transparent to-transparent pointer-events-none" />
              </div>

              <div className="p-8 space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-3xl font-black leading-tight mb-2">
                      {isRtl ? selectedItem.nameAr : selectedItem.nameEn}
                    </h2>
                    <div className="flex items-center gap-3">
                      {selectedItem.calories && (
                        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider bg-orange-500/10 text-orange-500 px-3 py-1.5 rounded-full">
                          <Flame size={14} />
                          <span>{selectedItem.calories} kcal</span>
                        </div>
                      )}
                      {selectedItem.prepTimeMin && (
                        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider bg-white/5 px-3 py-1.5 rounded-full">
                          <Clock size={14} />
                          <span>{selectedItem.prepTimeMin} min</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-3xl font-black block" style={{ color: primaryColor }}>
                      {selectedItem.price.toFixed(3)}
                    </span>
                    <span className="text-sm font-semibold text-gray-500">OMR</span>
                  </div>
                </div>

                <p className={cn(
                  "text-base leading-relaxed",
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                )}>
                  {isRtl ? selectedItem.descriptionAr || selectedItem.description : selectedItem.descriptionEn || selectedItem.description}
                </p>

                {/* Allergens & Nutrition */}
                {(selectedItem.allergens?.length || selectedItem.protein) && (
                  <div className="grid grid-cols-2 gap-4">
                    {selectedItem.allergens && selectedItem.allergens.length > 0 && (
                      <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                        <div className="flex items-center gap-2 mb-3 text-sm font-bold uppercase tracking-wider" style={{ color: primaryColor }}>
                          <Info size={16} />
                          <span>{isRtl ? 'مسببات الحساسية' : 'Allergens'}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {selectedItem.allergens.map((a, idx) => (
                            <span key={`${selectedItem.id}-allergen-${idx}-${a}`} className="text-xs font-semibold px-2.5 py-1 bg-white/10 rounded-lg capitalize">{a}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedItem.protein && (
                      <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                        <div className="flex items-center gap-2 mb-3 text-sm font-bold uppercase tracking-wider" style={{ color: primaryColor }}>
                          <Scale size={16} />
                          <span>{isRtl ? 'القيمة الغذائية' : 'Nutrition'}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="flex flex-col">
                            <span className="text-gray-500 mb-0.5">Protein</span>
                            <span className="font-bold text-sm">{selectedItem.protein}g</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-gray-500 mb-0.5">Carbs</span>
                            <span className="font-bold text-sm">{selectedItem.carbs}g</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  {selectedItem.model3D && (
                    <button 
                      onClick={() => setShow3DFull(true)}
                      className="flex-1 py-4 text-sm uppercase tracking-widest font-bold rounded-2xl flex items-center justify-center gap-2 transition-transform active:scale-95 text-white shadow-lg shadow-black/20"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <Box size={18} />
                      {isRtl ? 'مشاهدة 3D/AR' : 'View in 3D'}
                    </button>
                  )}
                  <button 
                    onClick={handleSnapShare}
                    className="flex-1 py-4 bg-white/5 border border-white/10 text-sm uppercase tracking-widest font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-white/10 transition-transform active:scale-95"
                  >
                    <Camera size={18} />
                    {isRtl ? 'شارك' : 'Share'}
                  </button>
                </div>
                
                <button 
                  onClick={() => {
                    addItem(selectedItem);
                    toast.success(isRtl ? 'تمت الإضافة للسلة' : 'Added to cart');
                    setSelectedItem(null);
                  }}
                  className="w-full h-14 bg-white text-black font-black rounded-2xl transition-transform active:scale-95 text-base uppercase tracking-widest mt-2 flex items-center justify-center gap-2 shadow-xl"
                >
                  <ShoppingBag size={20} />
                  {isRtl ? 'إضافة إلى الطلب' : 'Add to Order'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Full-screen 3D+AR Experience */}
      {show3DFull && selectedItem?.model3D && (
        <React.Suspense fallback={<div className="fixed inset-0 z-50 bg-black flex items-center justify-center text-white">Loading 3D Viewer...</div>}>
          <ThreeDViewerFull
            modelUrl={selectedItem.model3D}
            dishName={selectedItem.nameEn}
            dishNameAr={selectedItem.nameAr}
            price={`${selectedItem.price.toFixed(3)} ${isRtl ? 'ر.ع.' : 'OMR'}`}
            primaryColor={primaryColor}
            onClose={() => setShow3DFull(false)}
            onOrderAdd={() => {
              addItem(selectedItem);
              toast.success(isRtl ? 'تمت الإضافة للسلة' : 'Added to order');
              setShow3DFull(false);
            }}
          />
        </React.Suspense>
      )}

      {/* 🌟 Floating Bottom Glassmorphism Cart Bar */}
      <AnimatePresence>
        {cartItems.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-6 right-6 z-40 max-w-lg mx-auto"
          >
            <button 
              onClick={() => setIsCartOpen(true)}
              className="w-full h-16 bg-black/60 dark:bg-white/10 backdrop-blur-2xl border border-white/20 text-white rounded-3xl font-bold shadow-2xl flex items-center justify-between px-6 transition-transform hover:scale-[1.02] active:scale-95"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center relative">
                  <ShoppingBag size={18} />
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-black/60">
                    {cartItems.reduce((acc, item) => acc + item.quantity, 0)}
                  </div>
                </div>
                <span className="text-sm uppercase tracking-widest">{isRtl ? 'عرض السلة' : 'View Cart'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black">{getTotalPrice().toFixed(3)}</span>
                <span className="text-xs opacity-70">OMR</span>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Sheet Component */}
      <React.Suspense fallback={null}>
        <MenuCartSheet />
      </React.Suspense>

      {/* Floating AI Chat Bubble */}
      <div className={`fixed bottom-28 ${isRtl ? 'left-6' : 'right-6'} z-30`}>
        <div className="relative group">
          <div 
            className="absolute inset-0 rounded-full blur-lg opacity-60 animate-pulse transition-opacity group-hover:opacity-100"
            style={{ backgroundColor: primaryColor }}
          />
          <button 
            onClick={() => setIsChatOpen(true)}
            className="relative w-14 h-14 flex items-center justify-center rounded-full shadow-2xl transition-transform hover:scale-110 active:scale-95 border-2 border-white/20"
            style={{ backgroundColor: primaryColor }}
          >
            <MessageSquare size={24} className="text-black" />
          </button>
        </div>
      </div>

      <React.Suspense fallback={null}>
        <AIChatDrawer 
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          branding={branding}
          onViewDish3D={(dishId) => {
            setIsChatOpen(false);
            const dish = allItems.find(i => i.id === dishId);
            if (dish) {
              setSelectedItem(dish);
              setShow3DFull(true);
            }
          }}
        />
      </React.Suspense>
    </div>
  );
};

export default PublicMenu;
