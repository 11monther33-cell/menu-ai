import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, 
  Menu as MenuIcon, 
  ShoppingBag, 
  Box, 
  Eye, 
  Link as LinkIcon, 
  BarChart2, 
  Zap, 
  QrCode, 
  PieChart 
} from 'lucide-react';
import { cn } from '../../lib/utils';

const Sidebar = () => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const sections = [
    {
      title: t('sidebar.main'),
      items: [
        { name: t('sidebar.overview'), path: '/dashboard', icon: LayoutDashboard },
        { name: t('sidebar.menuBuilder'), path: '/dashboard/menu', icon: MenuIcon },
        { name: t('sidebar.orders'), path: '/dashboard/orders', icon: ShoppingBag },
      ]
    },
    {
      title: t('sidebar.arSystem'),
      items: [
        { name: t('sidebar.modelManager'), path: '/dashboard/3d-models', icon: Box, pro: true },
        { name: t('sidebar.arPreview'), path: '/dashboard/ar-preview', icon: Eye, pro: true },
        { name: t('sidebar.qr3d'), path: '/dashboard/qr-3d', icon: LinkIcon },
        { name: t('sidebar.snapAnalytics'), path: '/dashboard/snap-analytics', icon: BarChart2 },
      ]
    },
    {
      title: t('sidebar.operations'),
      items: [
        { name: t('sidebar.kitchenPulse'), path: '/dashboard/kitchen', icon: Zap },
        { name: t('sidebar.qrCodes'), path: '/dashboard/qr-codes', icon: QrCode },
        { name: t('sidebar.analytics'), path: '/dashboard/analytics', icon: PieChart },
      ]
    }
  ];

  return (
    <aside className={cn(
      "w-72 h-screen bg-sidebar border-e border-border-custom flex flex-col fixed top-0 bottom-0",
      isRtl ? "right-0" : "left-0"
    )}>
      <div className="p-6">
        <img src="/logo.png" alt="VISIONO" className="h-10 object-contain" />
      </div>

      <nav className="flex-1 overflow-y-auto px-4 space-y-8">
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-2">
            <h2 className="px-4 text-xs font-bold text-text-muted tracking-widest uppercase">
              {section.title}
            </h2>
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/dashboard'}
                  className={({ isActive }) => cn(
                    "flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group",
                    isActive 
                      ? "bg-dark-custom text-white shadow-lg shadow-dark-custom/20" 
                      : "text-text-secondary hover:bg-card hover:text-dark-custom"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon size={20} className="flex-shrink-0" />
                    <span className="font-medium text-sm">{item.name}</span>
                  </div>
                  {item.pro && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-card text-gold border border-gold/20 rounded uppercase">
                      PRO
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-6 border-t border-border-custom bg-sidebar/50">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="VISIONO" className="h-8 object-contain" />
          <div>
            <p className="text-[10px] text-text-muted mt-1">Restaurant Dashboard</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
