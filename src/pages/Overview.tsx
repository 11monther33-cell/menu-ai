import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  Users, 
  Zap, 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight,
  Share2,
  Eye,
  Star
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { cn } from '../lib/utils';

import { StatCard } from '../components/dashboard/StatsCards';

const Overview = () => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const stats = [
    { value: "292", label: t('dashboard.snapThisWeek'), color: "#C9A84C", icon: Share2, trend: "+12%" },
    { value: "+180%", label: t('dashboard.growth'), color: "#4CAF50", icon: TrendingUp, trend: "+5.4%" },
    { value: "8,400", label: t('dashboard.estimatedReach'), color: "#9B59B6", icon: Eye, trend: "+22%" },
    { value: "7", label: t('dashboard.longestStreak'), color: "#1C1C1C", icon: Zap, trend: "Stable" },
  ];

  const dishes = [
    { nameAr: "برغر واغيو", nameEn: "Wagyu Burger", emoji: "🍔", shares: 203, maxShares: 203 },
    { nameAr: "ريش مشوي", nameEn: "Grilled Ribs", emoji: "🥩", shares: 89, maxShares: 203 },
    { nameAr: "بيتزا مارغريتا", nameEn: "Margherita Pizza", emoji: "🍕", shares: 45, maxShares: 203 },
    { nameAr: "شاورما دجاج", nameEn: "Chicken Shawarma", emoji: "🌯", shares: 32, maxShares: 203 },
  ];

  const chartData = [
    { name: 'Mon', shares: 40 },
    { name: 'Tue', shares: 30 },
    { name: 'Wed', shares: 60 },
    { name: 'Thu', shares: 45 },
    { name: 'Fri', shares: 90 },
    { name: 'Sat', shares: 120 },
    { name: 'Sun', shares: 85 },
  ];

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.title')}</h1>
          <p className="text-text-secondary mt-1">Welcome back, here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 text-sm font-bold bg-card border border-border-custom rounded-xl hover:bg-sidebar transition-all">
            Last 7 Days
          </button>
          <button className="px-4 py-2 text-sm font-bold bg-dark-custom text-white rounded-xl hover:bg-black transition-all">
            Export Data
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <StatCard
            key={`overview-stat-${idx}-${stat.label}`}
            value={stat.value}
            label={stat.label}
            color={stat.color}
            icon={stat.icon}
            trend={stat.trend}
            delay={idx * 0.1}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 p-8 bg-card border border-border-custom rounded-[2.5rem]">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold">Snap Share Activity</h3>
              <p className="text-sm text-text-secondary">Daily shares across all platforms</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-gold"></div>
                <span className="text-xs font-bold">Shares</span>
              </div>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorShares" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#C9A84C" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E0D5" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#6B6B6B', fontWeight: 600 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#6B6B6B', fontWeight: 600 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1C1C1C', 
                    border: 'none', 
                    borderRadius: '12px',
                    color: '#fff',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                  itemStyle={{ color: '#C9A84C', fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="shares" 
                  stroke="#C9A84C" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorShares)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-8 bg-card border border-border-custom rounded-[2.5rem]">
          <h3 className="text-xl font-bold mb-8">{t('dashboard.topDishes')}</h3>
          <div className="space-y-8">
            {dishes.map((dish, idx) => (
              <div key={`overview-dish-${idx}-${dish.nameEn}`} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{dish.emoji}</span>
                    <span className="font-bold text-sm">{isRtl ? dish.nameAr : dish.nameEn}</span>
                  </div>
                  <span className="text-xs font-bold text-gold">{dish.shares} {t('dashboard.shares')}</span>
                </div>
                <div className="h-2.5 w-full bg-sidebar rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(dish.shares / dish.maxShares) * 100}%` }}
                    transition={{ duration: 1, delay: idx * 0.1 }}
                    className="h-full bg-gold rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-10 py-4 bg-sidebar border border-border-custom text-dark-custom font-bold rounded-2xl hover:bg-border-custom transition-all flex items-center justify-center gap-2">
            View All Analytics
            <ArrowUpRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Overview;
