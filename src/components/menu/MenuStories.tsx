import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { MenuItem } from '../../types';
import { Flame, Star, X } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';

interface MenuStoriesProps {
  items: MenuItem[];
}

export const MenuStories: React.FC<MenuStoriesProps> = ({ items }) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const { addItem } = useCartStore();

  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);

  // Filter items that have images to use as stories (e.g. chef specials or best sellers)
  const storyItems = items.filter(i => i.image).slice(0, 5); // Take top 5 for stories

  if (storyItems.length === 0) return null;

  return (
    <>
      {/* Story Rings */}
      <div className="flex gap-4 overflow-x-auto pb-4 pt-2 px-4 hide-scrollbar snap-x">
        {storyItems.map((item, index) => (
          <div 
            key={item.id} 
            onClick={() => setActiveStoryIndex(index)}
            className="flex flex-col items-center gap-2 cursor-pointer snap-start shrink-0"
          >
            <div className="w-20 h-20 rounded-full p-[3px] bg-gradient-to-tr from-[#C9A84C] via-[#FFD700] to-[#FF8C00] shadow-lg">
              <div className="w-full h-full rounded-full border-2 border-white dark:border-[#1A1917] overflow-hidden bg-white">
                <img src={item.image} alt={isRtl ? item.nameAr : item.nameEn} className="w-full h-full object-cover" />
              </div>
            </div>
            <span className="text-xs font-semibold w-20 text-center truncate px-1">
              {isRtl ? item.nameAr : item.nameEn}
            </span>
          </div>
        ))}
      </div>

      {/* Fullscreen Story Viewer */}
      <AnimatePresence>
        {activeStoryIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black flex flex-col"
          >
            {/* Progress Bars */}
            <div className="absolute top-4 left-4 right-4 flex gap-2 z-10">
              {storyItems.map((_, idx) => (
                <div key={idx} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: idx < activeStoryIndex ? '100%' : '0%' }}
                    animate={{ width: idx === activeStoryIndex ? '100%' : idx < activeStoryIndex ? '100%' : '0%' }}
                    transition={{ duration: idx === activeStoryIndex ? 5 : 0, ease: "linear" }}
                    onAnimationComplete={() => {
                      if (idx === activeStoryIndex) {
                        if (activeStoryIndex < storyItems.length - 1) {
                          setActiveStoryIndex(activeStoryIndex + 1);
                        } else {
                          setActiveStoryIndex(null);
                        }
                      }
                    }}
                    className="h-full bg-white"
                  />
                </div>
              ))}
            </div>

            {/* Header */}
            <div className="absolute top-8 left-4 right-4 flex justify-between items-center z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-white/50">
                  <img src={storyItems[activeStoryIndex].image} className="w-full h-full object-cover" />
                </div>
                <div className="text-white drop-shadow-md">
                  <h4 className="font-bold text-sm">{isRtl ? 'طبق مميز' : 'Chef Special'}</h4>
                  <p className="text-xs text-white/80">
                    {isRtl ? storyItems[activeStoryIndex].nameAr : storyItems[activeStoryIndex].nameEn}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setActiveStoryIndex(null)}
                className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Navigation Areas */}
            <div className="absolute inset-0 z-0 flex">
              <div 
                className="w-1/3 h-full" 
                onClick={(e) => {
                  e.stopPropagation();
                  if (activeStoryIndex > 0) setActiveStoryIndex(activeStoryIndex - 1);
                }} 
              />
              <div 
                className="w-2/3 h-full" 
                onClick={(e) => {
                  e.stopPropagation();
                  if (activeStoryIndex < storyItems.length - 1) setActiveStoryIndex(activeStoryIndex + 1);
                  else setActiveStoryIndex(null);
                }} 
              />
            </div>

            {/* Main Image */}
            <div className="flex-1 w-full bg-black flex items-center justify-center">
              <img 
                src={storyItems[activeStoryIndex].image} 
                className="w-full h-auto max-h-[80vh] object-cover"
                alt="Story"
              />
            </div>

            {/* Bottom Add to Cart */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/80 to-transparent z-10 flex justify-between items-end">
              <div className="text-white">
                <h2 className="text-2xl font-bold mb-1">
                  {isRtl ? storyItems[activeStoryIndex].nameAr : storyItems[activeStoryIndex].nameEn}
                </h2>
                <p className="text-[#C9A84C] font-semibold text-lg">
                  {storyItems[activeStoryIndex].price.toFixed(3)} OMR
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addItem(storyItems[activeStoryIndex]);
                  setActiveStoryIndex(null); // Close story
                  // Open cart? The cart will just show the item added
                }}
                className="h-12 px-6 bg-white text-black rounded-full font-bold flex items-center gap-2 active:scale-95 transition-transform"
              >
                <span>{isRtl ? 'إضافة للطلب' : 'Add to Order'}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
