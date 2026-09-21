import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { usePOSStore } from '../../store/posStore';
import { getBranches, POSBranch } from '../../services/posService';
import { useAuth } from '../../hooks/useAuth';
import { ChevronDown, MapPin } from 'lucide-react';

export const BranchSwitcher = () => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const { user } = useAuth();
  const { currentBranch, isAllBranches, setBranch } = usePOSStore();
  const [branches, setBranches] = useState<POSBranch[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.restaurantId) {
      getBranches(user.restaurantId)
        .then((data) => {
          // Filter out inactive branches from the switcher, unless they want to view old reports?
          // For now, let's show all active branches.
          setBranches(data.filter(b => b.is_active !== false));
          setLoading(false);
        })
        .catch((err) => {
          console.error('Failed to load branches', err);
          setLoading(false);
        });
    }
  }, [user?.restaurantId]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isOpen && !(e.target as Element).closest('.branch-switcher')) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  const handleSelect = (branch: POSBranch | 'all') => {
    setBranch(branch);
    setIsOpen(false);
  };

  if (loading) {
    return <div className="h-4 w-24 bg-border-custom animate-pulse rounded-md"></div>;
  }

  const currentLabel = isAllBranches
    ? (isRtl ? 'جميع الفروع (تقرير مجمّع)' : 'All Branches (Aggregate Report)') 
    : (currentBranch?.name || (isRtl ? 'الفرع الرئيسي' : 'Main Branch'));

  return (
    <div className="relative branch-switcher">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 py-1 bg-card hover:bg-surface-2 border border-border-custom rounded-md transition-colors"
      >
        <MapPin size={12} className="text-gold" />
        <span className="text-[10px] text-text-primary uppercase tracking-widest font-medium">
          {currentLabel}
        </span>
        <ChevronDown size={12} className={`text-text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className={`absolute top-full mt-2 w-48 bg-card border border-border-custom rounded-lg shadow-xl overflow-hidden z-50 ${isRtl ? 'right-0' : 'left-0'}`}>
          <div className="py-1">
            {branches.map((b) => (
              <button
                key={b.id}
                onClick={() => handleSelect(b)}
                className={`w-full text-start px-4 py-2 text-xs transition-colors ${
                  !isAllBranches && currentBranch?.id === b.id
                    ? 'bg-gold/10 text-gold font-bold'
                    : 'text-text-primary hover:bg-gold/10 hover:text-gold'
                }`}
              >
                {b.name}
              </button>
            ))}
            {branches.length > 1 && (
              <>
                <div className="h-[1px] bg-border-custom my-1"></div>
                <button
                  onClick={() => handleSelect('all')}
                  className={`w-full text-start px-4 py-2 text-xs transition-colors ${
                    isAllBranches
                      ? 'bg-gold/10 text-gold font-bold'
                      : 'text-text-primary hover:bg-gold/10 hover:text-gold'
                  }`}
                >
                  {isRtl ? 'جميع الفروع (تقرير مجمّع)' : 'All Branches (Aggregate)'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
