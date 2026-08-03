import React from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin } from 'lucide-react';

export const BranchRequirementOverlay = () => {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  return (
    <div className="flex flex-col items-center justify-center h-full p-12 text-center text-text-secondary bg-sidebar border border-border-custom rounded-[2rem] m-6">
      <MapPin size={48} className="text-gold opacity-50 mb-4" />
      <h2 className="text-xl font-bold mb-2 text-text-primary">
        {isRtl ? 'الرجاء اختيار فرع محدد' : 'Please select a specific branch'}
      </h2>
      <p className="max-w-md">
        {isRtl 
          ? 'هذه الميزة غير متوفرة في العرض المجمّع للفروع. يرجى اختيار فرع محدد من القائمة العلوية للاستمرار.' 
          : 'This feature is not available in the aggregate branches view. Please select a specific branch from the header to continue.'}
      </p>
    </div>
  );
};
