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
  MessageSquare
} from 'lucide-react';
import { useMenuStore } from '../store/menuStore';
import { assetService } from '../services/assetService';
import { AIChatDrawer } from '../components/qr/AIChatDrawer';
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
  
  const validCategories = categories.filter(c => c.items && c.items.length > 0);
  const [activeCategory, setActiveCategory] = useState(validCategories[0]?.id);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [show3DFull, setShow3DFull] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isOrdering, setIsOrdering] = useState('');
  
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (validCategories.length > 0 && (!activeCategory || !validCategories.find(c => c.id === activeCategory))) {
      setActiveCategory(validCategories[0].id);
    }
  }, [validCategories, activeCategory]);

  useEffect(() => {
    if (restaurantId && restaurantId !== 'undefined') {
      fetchMenu(restaurantId);
    }
  }, [restaurantId, fetchMenu]);

  useEffect(() => {
    const bgColor = isDarkMode ? (branding?.bg_color || '#1A1917') : '#FFFFFF';
    const textColor = isDarkMode ? (branding?.text_color || '#F5F0E8') : '#0F0E0B';
    document.body.style.backgroundColor = bgColor;
    document.body.style.color = textColor;
    return () => { 
      document.body.style.backgroundColor = '';
      document.body.style.color = '';
    };
  }, [isDarkMode, branding]);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
  };

  const filteredItems = validCategories
    .find(c => c.id === activeCategory)
    ?.items.filter(item => 
      isRtl 
        ? item.nameAr.includes(searchQuery) 
        : item.nameEn.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  const handleSnapShare = () => {
    toast.success(isRtl ? 'تم تجهيز بطاقة المشاركة!' : 'Snap card ready to share!');
  };

  return (
    <div 
      className={cn(
        "min-h-screen pb-24 transition-colors duration-500",
        isRtl ? "rtl" : "ltr"
      )}
      style={{ 
        backgroundColor: isDarkMode ? (branding?.bg_color || '#1A1917') : '#FFFFFF',
        color: isDarkMode ? (branding?.text_color || '#F5F0E8') : '#0F0E0B',
        fontFamily: isRtl ? branding?.font_family_ar : branding?.font_family_en
      }}
    >
      {/* Header */}
      <header 
        className={cn(
          "sticky top-0 z-30 px-6 py-4 flex items-center justify-between backdrop-blur-xl border-b transition-colors",
        )}
        style={{ 
          backgroundColor: isDarkMode ? `${branding?.bg_color || '#1A1917'}CC` : '#FFFFFFCC',
          borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
        }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
            style={{ backgroundColor: branding?.primary_color || '#C9A84C', boxShadow: `0 10px 15px -3px ${branding?.primary_color || '#C9A84C'}33` }}
          >
            {branding?.logo_url ? <img src={branding.logo_url} className="w-6 h-6 object-contain" /> : <img src="/logo.png" alt="VISIONO" className="w-8 h-8 object-contain" />}
          </div>
          <div>
            <img src="/logo.png" alt="VISIONO" className="h-5 object-contain" />
            <p className="text-[10px] text-text-muted mt-1">
              {tableNumber ? `${t('qr.table')} ${tableNumber}` : 'Interactive Menu'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleLanguage}
            className="p-2 rounded-xl bg-card border border-border-custom hover:bg-sidebar transition-all"
          >
            <Globe size={18} className="text-gold" />
          </button>
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-xl bg-card border border-border-custom hover:bg-sidebar transition-all"
          >
            {isDarkMode ? <Sun size={18} className="text-gold" /> : <Moon size={18} className="text-gold" />}
          </button>
        </div>
      </header>

      {/* Hero */}
      <div className="px-6 py-8">
        <div className="relative h-48 rounded-xl overflow-hidden shadow-lg border border-white/5">
          <img 
            src={branding?.cover_url || "https://picsum.photos/seed/restaurant/800/400"} 
            alt="Restaurant" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-6">
            <h2 className="text-2xl font-display text-white tracking-wide">{isRtl ? 'واغيو فاين داينينج' : 'Wagyu Fine Dining'}</h2>
            <div className="flex items-center gap-4 mt-2 text-white/80 text-xs font-medium uppercase tracking-wider">
              <div className="flex items-center gap-1">
                <Star size={12} className="fill-gold" style={{ color: branding?.primary_color || '#C9A84C' }} />
                <span>4.9</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={12} />
                <span>20-30 min</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin size={12} />
                <span>Riyadh, KSA</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-6 mb-6">
        <div className={cn(
          "flex items-center gap-3 px-5 py-4 rounded-lg border transition-all",
          isDarkMode ? "bg-white/5 border-white/10" : "bg-card border-border-custom"
        )}>
          <Search size={18} className="text-text-muted" />
          <input 
            type="text" 
            placeholder="Search for dishes..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent outline-none text-sm w-full font-medium"
          />
        </div>
      </div>

      {/* Categories Tabs */}
      <div className="sticky top-[73px] z-20 bg-inherit py-4 overflow-x-auto no-scrollbar px-6 flex gap-3 relative">
        {validCategories.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "relative px-6 py-3 rounded-lg text-xs uppercase tracking-wider font-semibold whitespace-nowrap transition-colors border",
                isActive 
                  ? "text-white border-transparent" 
                  : isDarkMode 
                    ? "bg-white/5 border-white/10 text-white/60 hover:text-white" 
                    : "bg-card border-border-custom text-text-secondary"
              )}
            >
              {isActive && !prefersReducedMotion && (
                <motion.div
                  layoutId="activeTabPill"
                  className="absolute inset-0 rounded-lg shadow-md"
                  style={{ backgroundColor: branding?.primary_color || '#C9A84C' }}
                  initial={false}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              {isActive && prefersReducedMotion && (
                <div
                  className="absolute inset-0 rounded-lg shadow-md"
                  style={{ backgroundColor: branding?.primary_color || '#C9A84C' }}
                />
              )}
              <span className="relative z-10">{isRtl ? cat.nameAr : cat.nameEn}</span>
            </button>
          );
        })}
      </div>

      {/* Items List */}
      <div className="px-6 mt-6 space-y-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={prefersReducedMotion ? { opacity: 0 } : "hidden"}
            animate={prefersReducedMotion ? { opacity: 1 } : "show"}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -20 }}
            variants={{
              hidden: { opacity: 0, x: 20 },
              show: {
                opacity: 1,
                x: 0,
                transition: { staggerChildren: 0.08 }
              }
            }}
            className="space-y-4"
          >
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                layoutId={prefersReducedMotion ? undefined : item.id}
                variants={prefersReducedMotion ? undefined : {
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0 }
                }}
                onClick={() => setSelectedItem(item)}
                className={cn(
                  "p-4 rounded-xl border flex gap-4 transition-all duration-300 shadow-sm cursor-pointer",
                  isDarkMode ? "bg-white/5 border-white/10 hover:border-white/20" : "bg-card border-border-custom hover:border-gold/50"
                )}
              >
                <div className="w-28 h-28 rounded-lg overflow-hidden flex-shrink-0 relative">
                  <motion.img 
                    layoutId={prefersReducedMotion ? undefined : `image-${item.id}`}
                    src={assetService.getOptimizedUrl(item.image, { width: 300, height: 300 })} 
                    alt={item.nameEn} 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-display font-medium text-base tracking-wide">{isRtl ? item.nameAr : item.nameEn}</h3>
                      {item.model3D && (
                        <div className="w-6 h-6 rounded flex items-center justify-center text-gold border border-gold/20" style={{ backgroundColor: `${branding?.primary_color || '#C9A84C'}1A` }}>
                          <Box size={12} />
                        </div>
                      )}
                    </div>
                    <p className={cn(
                      "text-xs mt-1 line-clamp-2 leading-relaxed",
                      isDarkMode ? "text-white/60" : "text-text-secondary"
                    )}>
                      {item.description}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-display text-lg tracking-wider" style={{ color: branding?.primary_color || '#C9A84C' }}>{item.price} $</span>
                    <button 
                      className="p-1.5 rounded bg-transparent border transition-colors shadow-sm"
                      style={{ borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', color: isDarkMode ? '#FFF' : '#000' }}
                    >
                      <ChevronRight size={16} className={isRtl ? "rotate-180" : ""} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

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
              className={cn(
                "relative w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl border border-white/10",
                isDarkMode ? "bg-[#111111]" : "bg-white"
              )}
            >
              <button 
                onClick={() => setSelectedItem(null)}
                className="absolute top-6 right-6 z-10 p-2 bg-black/20 backdrop-blur-md text-white rounded-full hover:bg-black/40 transition-all"
              >
                <X size={20} />
              </button>

              <div className="relative h-72 transition-all duration-500 overflow-hidden rounded-t-2xl">
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
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-display tracking-wide">{isRtl ? selectedItem.nameAr : selectedItem.nameEn}</h2>
                    <div className="flex items-center gap-4 mt-2">
                      {selectedItem.calories && (
                        <div className="flex items-center gap-1 text-xs text-text-muted font-medium uppercase tracking-wider">
                          <Flame size={12} className="text-orange-500" />
                          <span>{selectedItem.calories} kcal</span>
                        </div>
                      )}
                      {selectedItem.prepTimeMin && (
                        <div className="flex items-center gap-1 text-xs text-text-muted font-medium uppercase tracking-wider">
                          <Clock size={12} />
                          <span>{selectedItem.prepTimeMin} min</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-2xl font-display" style={{ color: branding?.primary_color || '#C9A84C' }}>{selectedItem.price} $</span>
                </div>

                <p className={cn(
                  "text-sm leading-relaxed",
                  isDarkMode ? "text-white/60" : "text-text-secondary"
                )}>
                  {isRtl ? selectedItem.descriptionAr || selectedItem.description : selectedItem.descriptionEn || selectedItem.description}
                </p>

                {/* Allergens & Nutrition */}
                {(selectedItem.allergens?.length || selectedItem.protein) && (
                  <div className="grid grid-cols-2 gap-4">
                    {selectedItem.allergens && selectedItem.allergens.length > 0 && (
                      <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                        <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wider" style={{ color: branding?.primary_color || '#C9A84C' }}>
                          <Info size={14} />
                          <span>Allergens</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {selectedItem.allergens.map((a, idx) => (
                            <span key={`${selectedItem.id}-allergen-${idx}-${a}`} className="text-[10px] px-2 py-0.5 bg-white/10 rounded-md capitalize">{a}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedItem.protein && (
                      <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                        <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wider" style={{ color: branding?.primary_color || '#C9A84C' }}>
                          <Scale size={14} />
                          <span>Nutrition</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div className="flex flex-col">
                            <span className="text-text-muted">Protein</span>
                            <span className="font-bold">{selectedItem.protein}g</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-text-muted">Carbs</span>
                            <span className="font-bold">{selectedItem.carbs}g</span>
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
                      className="flex-1 py-3.5 text-sm uppercase tracking-widest font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors text-white"
                      style={{ backgroundColor: branding?.primary_color || '#C9A84C' }}
                    >
                      <Box size={16} />
                      {isRtl ? 'مشاهدة 3D/AR' : 'View in 3D/AR'}
                    </button>
                  )}
                  <button 
                    onClick={handleSnapShare}
                    className="flex-1 py-3.5 bg-transparent border border-white/10 text-text text-sm uppercase tracking-widest font-semibold rounded-lg flex items-center justify-center gap-2 hover:bg-white/5 transition-colors"
                  >
                    <Camera size={16} />
                    {isRtl ? 'شارك' : 'Share'}
                  </button>
                </div>
                
                <motion.button 
                  whileTap={{ scale: prefersReducedMotion ? 1 : 0.95 }}
                  onClick={() => {
                    toast.success(isRtl ? 'تمت الإضافة' : 'Added');
                    setSelectedItem(null);
                  }}
                  className="w-full py-3.5 text-main font-semibold rounded-lg transition-colors text-sm uppercase tracking-widest mt-2 flex items-center justify-center gap-2"
                  style={{ backgroundColor: branding?.primary_color || '#C9A84C' }}
                >
                  <CheckCircle size={18} className="hidden" />
                  {isRtl ? 'إضافة إلى الطلب' : 'Add to Order'}
                </motion.button>
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
            price={`${selectedItem.price} $`}
            primaryColor={branding?.primary_color || '#C9A84C'}
            onClose={() => setShow3DFull(false)}
            onOrderAdd={() => {
              toast.success(isRtl ? 'تمت الإضافة للطلب' : 'Added to order')
              setShow3DFull(false)
            }}
          />
        </React.Suspense>
      )}

      {/* Floating Cart (Optional) */}
      <div className="fixed bottom-6 left-6 right-6 z-40 max-w-lg mx-auto">
        <button className="w-full py-4 bg-[#111] text-text rounded-xl font-medium shadow-2xl flex items-center justify-between px-6 border border-white/10 hover:bg-[#1a1a1a] transition-colors">
          <div className="flex items-center gap-3">
            <ShoppingBag size={18} className="text-gold" />
            <span className="text-sm uppercase tracking-wider">View Order</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/60 font-medium">3 Items</span>
            <div className="w-[1px] h-4 bg-white/20"></div>
            <span className="text-gold font-display text-lg px-2">154 $</span>
          </div>
        </button>
      </div>

      {/* Floating AI Chat Bubble */}
      <div className={`fixed bottom-28 ${isRtl ? 'left-6' : 'right-6'} z-40`}>
        <div className="relative group">
          {/* Pulse Glow Effect */}
          <div 
            className="absolute inset-0 rounded-full blur-md opacity-60 animate-pulse transition-opacity group-hover:opacity-100"
            style={{ backgroundColor: branding?.primary_color || '#C9A84C' }}
          />
          <button 
            onClick={() => setIsChatOpen(true)}
            className="relative w-14 h-14 flex items-center justify-center rounded-full shadow-2xl transition-transform hover:scale-105 active:scale-95"
            style={{ backgroundColor: branding?.primary_color || '#C9A84C' }}
          >
            <MessageSquare size={24} className="text-black" />
            
            {/* Notification Badge */}
            <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-black" />
          </button>
        </div>
      </div>

      <AIChatDrawer 
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        branding={branding}
        onViewDish3D={(dishId) => {
          setIsChatOpen(false);
          const dish = categories.flatMap(c => c.items).find(i => i.id === dishId);
          if (dish) {
            setSelectedItem(dish);
            setShow3DFull(true);
          } else {
            // Hardcoded fallback for mock dish
            setSelectedItem({
              id: 'mock-dish-1',
              nameAr: 'ستيك ريب آي مشوي',
              nameEn: 'Grilled Ribeye Steak',
              descriptionAr: 'ستيك ريب آي مع بطاطا مهروسة',
              descriptionEn: 'Ribeye steak with mashed potatoes',
              price: 12.5,
              calories: 800,
              image: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800',
              model3D: '/dish.glb?v=3', // Trigger 3D view
              isNew: false,
              isPopular: true
            } as unknown as MenuItem);
            setShow3DFull(true);
          }
        }}
      />
    </div>
  );
};

export default PublicMenu;
