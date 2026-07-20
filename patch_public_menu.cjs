const fs = require('fs');

let content = fs.readFileSync('src/pages/PublicMenu.tsx', 'utf-8');

// 1. Imports
content = content.replace(
  "import { motion, AnimatePresence } from 'motion/react';",
  "import { motion, AnimatePresence, useReducedMotion } from 'motion/react';"
);
content = content.replace(
  "Camera",
  "Camera,\n  CheckCircle"
);

// 2. Filter empty categories and state
content = content.replace(
  "  const [activeCategory, setActiveCategory] = useState(categories[0]?.id);\n  const [isDarkMode, setIsDarkMode] = useState(true);",
  `  const validCategories = categories.filter(c => c.items && c.items.length > 0);
  const [activeCategory, setActiveCategory] = useState(validCategories[0]?.id);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (validCategories.length > 0 && (!activeCategory || !validCategories.find(c => c.id === activeCategory))) {
      setActiveCategory(validCategories[0].id);
    }
  }, [validCategories, activeCategory]);`
);

content = content.replace(
  "  const filteredItems = categories\n    .find(c => c.id === activeCategory)",
  "  const filteredItems = validCategories\n    .find(c => c.id === activeCategory)"
);

// 3. Categories Tabs
const oldTabs = `      {/* Categories Tabs */}
      <div className="sticky top-[73px] z-20 bg-inherit py-4 overflow-x-auto no-scrollbar px-6 flex gap-3">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              "px-6 py-3 rounded-lg text-xs uppercase tracking-wider font-semibold whitespace-nowrap transition-colors border",
              activeCategory === cat.id 
                ? "text-white" 
                : isDarkMode 
                  ? "bg-white/5 border-white/10 text-white/60 hover:text-white" 
                  : "bg-card border-border-custom text-text-secondary"
            )}
            style={{ 
              backgroundColor: activeCategory === cat.id ? (branding?.primary_color || '#C9A84C') : undefined,
              borderColor: activeCategory === cat.id ? (branding?.primary_color || '#C9A84C') : undefined
            }}
          >
            {isRtl ? cat.nameAr : cat.nameEn}
          </button>
        ))}
      </div>`;

const newTabs = `      {/* Categories Tabs */}
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
      </div>`;

content = content.replace(oldTabs, newTabs);

// 4. Items List Stagger & LayoutId
const oldItems = `      {/* Items List */}
      <div className="px-6 mt-6 space-y-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                layoutId={item.id}
                onClick={() => setSelectedItem(item)}
                className={cn(
                  "p-4 rounded-xl border flex gap-4 active:scale-95 transition-all duration-300 shadow-sm",
                  isDarkMode ? "bg-white/5 border-white/10 hover:border-white/20" : "bg-card border-border-custom"
                )}
              >
                <div className="w-28 h-28 rounded-lg overflow-hidden flex-shrink-0">
                  <img 
                    src={assetService.getOptimizedUrl(item.image, { width: 300, height: 300 })} 
                    alt={item.nameEn} 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                </div>`;

const newItems = `      {/* Items List */}
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
                    layoutId={prefersReducedMotion ? undefined : \`image-\${item.id}\`}
                    src={assetService.getOptimizedUrl(item.image, { width: 300, height: 300 })} 
                    alt={item.nameEn} 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                </div>`;

content = content.replace(oldItems, newItems);

// 5. Modal Hero Image
const oldModalImage = `              <div className="relative h-72 transition-all duration-500">
                <img 
                  src={assetService.getOptimizedUrl(selectedItem.image, { width: 800 })} 
                  alt={selectedItem.nameEn} 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />`;

const newModalImage = `              <div className="relative h-72 transition-all duration-500 overflow-hidden rounded-t-2xl">
                <motion.img 
                  layoutId={prefersReducedMotion ? undefined : \`image-\${selectedItem.id}\`}
                  src={assetService.getOptimizedUrl(selectedItem.image, { width: 800 })} 
                  alt={selectedItem.nameEn} 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />`;

content = content.replace(oldModalImage, newModalImage);

// 6. Modal Add to Cart Button
const oldAddBtn = `                <button 
                  onClick={() => {
                    toast.success(isRtl ? 'تمت الإضافة' : 'Added');
                    setSelectedItem(null);
                  }}
                  className="w-full py-3.5 text-main font-semibold rounded-lg transition-colors text-sm uppercase tracking-widest mt-2"
                  style={{ backgroundColor: branding?.primary_color || '#C9A84C' }}
                >
                  {isRtl ? 'إضافة إلى الطلب' : 'Add to Order'}
                </button>`;

const newAddBtn = `                <motion.button 
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
                </motion.button>`;

content = content.replace(oldAddBtn, newAddBtn);

// Also remove `active:scale-95` from the list item wrapper since motion variants will conflict or look weird, replaced above with cursor-pointer hover:border-gold/50

fs.writeFileSync('src/pages/PublicMenu.tsx', content);
