import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';

const Layout = () => {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  return (
    <div className={cn("min-h-screen bg-main", isRtl ? "rtl" : "ltr")}>
      <Sidebar />
      <main className={cn(
        "transition-all duration-300 min-h-screen flex flex-col",
        isRtl ? "mr-72" : "ml-72"
      )}>
        <Header />
        <div className="flex-1 p-8 bg-main/50">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
