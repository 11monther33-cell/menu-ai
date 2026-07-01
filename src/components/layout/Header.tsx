import React from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Globe, Search, User } from 'lucide-react';

const Header = () => {
  const { i18n } = useTranslation();
  
  const toggleLanguage = () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
  };

  return (
    <header className="h-20 bg-main border-b border-border-custom px-8 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-4 bg-card px-4 py-2 rounded-xl w-96 border border-border-custom">
        <Search size={18} className="text-text-muted" />
        <input 
          type="text" 
          placeholder="Search anything..." 
          className="bg-transparent border-none outline-none text-sm w-full"
        />
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={toggleLanguage}
          className="p-2.5 rounded-xl hover:bg-card transition-colors flex items-center gap-2 text-sm font-medium"
        >
          <Globe size={20} />
          <span>{i18n.language === 'ar' ? 'English' : 'العربية'}</span>
        </button>

        <button className="p-2.5 rounded-xl hover:bg-card transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-gold rounded-full border-2 border-main"></span>
        </button>

        <div className="h-8 w-[1px] bg-border-custom mx-2"></div>

        <button className="flex items-center gap-3 p-1.5 pr-4 rounded-xl hover:bg-card transition-colors">
          <div className="w-9 h-9 rounded-lg bg-dark-custom flex items-center justify-center text-white">
            <User size={20} />
          </div>
          <div className="text-start hidden sm:block">
            <p className="text-xs font-bold leading-none">Wagyu Admin</p>
            <p className="text-[10px] text-text-muted mt-1">Super Admin</p>
          </div>
        </button>
      </div>
    </header>
  );
};

export default Header;
