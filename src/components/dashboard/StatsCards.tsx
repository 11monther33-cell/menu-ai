import React from 'react';
import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface StatCardProps {
  value: string | number;
  label: string;
  color: string;
  icon: LucideIcon;
  trend?: string;
  delay?: number;
}

export const StatCard: React.FC<StatCardProps> = ({ value, label, color, icon: Icon, trend, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="p-6 bg-card border border-border-custom rounded-[2rem] relative overflow-hidden group hover:shadow-xl hover:shadow-gold/5 transition-all duration-300"
    >
      <div className="flex items-center justify-between relative z-10">
        <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg",
          color === "#C9A84C" ? "bg-gold" : 
          color === "#4CAF50" ? "bg-green-custom" : 
          color === "#9B59B6" ? "bg-purple-custom" : "bg-dark-custom"
        )}>
          <Icon size={24} />
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg",
            trend.startsWith('+') ? "text-green-custom bg-green-custom/10" : "text-text-muted bg-card"
          )}>
            {trend}
          </div>
        )}
      </div>
      <div className="mt-6 relative z-10">
        <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
        <p className="text-sm font-medium text-text-secondary mt-1">{label}</p>
      </div>
      <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
        <Icon size={120} />
      </div>
    </motion.div>
  );
};
