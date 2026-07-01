import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  Share2, 
  Eye, 
  Zap, 
  ArrowUpRight, 
  ArrowDownRight,
  Search,
  Filter,
  Download,
  Calendar,
  MoreHorizontal,
  Activity
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { useAnalyticsStore } from '../store/analyticsStore';
import { cn } from '../lib/utils';

const SnapAnalyticsPage = () => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const { snapData } = useAnalyticsStore();

  const stats = [
    { value: "292", label: t('dashboard.snapThisWeek'), color: "#C9A84C", icon: Share2, trend: "+12%" },
    { value: "+180%", label: t('dashboard.growth'), color: "#4CAF50", icon: TrendingUp, trend: "+5.4%" },
    { value: "8,400", label: t('dashboard.estimatedReach'), color: "#9B59B6", icon: Eye, trend: "+22%" },
    { value: "7", label: t('dashboard.longestStreak'), color: "#1C1C1C", icon: Zap, trend: "Stable" },
  ];

  const chartData = [
    { date: '2026-04-01', shares: 45 },
    { date: '2026-04-02', shares: 52 },
    { date: '2026-04-03', shares: 48 },
    { date: '2026-04-04', shares: 70 },
    { date: '2026-04-05', shares: 65 },
    { date: '2026-04-06', shares: 85 },
    { date: '2026-04-07', shares: 92 },
  ];

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Snap Analytics</h1>
          <p className="text-text-secondary mt-1">Detailed insights into how your dishes are shared on Snapchat.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-6 py-3 bg-card border border-border-custom text-dark-custom font-bold rounded-xl hover:bg-sidebar transition-all flex items-center gap-2">
            <Calendar size={18} />
            April 2026
          </button>
          <button className="px-6 py-3 bg-dark-custom text-white font-bold rounded-xl hover:bg-black transition-all flex items-center gap-2 shadow-lg shadow-dark-custom/20">
            <Download size={18} />
            Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={`snap-stat-${idx}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="p-6 bg-card border border-border-custom rounded-[2rem] relative overflow-hidden group hover:shadow-xl hover:shadow-gold/5 transition-all duration-300"
          >
            <div className="flex items-center justify-between relative z-10">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg",
                stat.color === "#C9A84C" ? "bg-gold" : 
                stat.color === "#4CAF50" ? "bg-green-custom" : 
                stat.color === "#9B59B6" ? "bg-purple-custom" : "bg-dark-custom"
              )}>
                <stat.icon size={24} />
              </div>
              <div className={cn(
                "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg",
                stat.trend.startsWith('+') ? "text-green-custom bg-green-custom/10" : "text-text-muted bg-card"
              )}>
                {stat.trend.startsWith('+') ? <ArrowUpRight size={14} /> : <Activity size={14} />}
                {stat.trend}
              </div>
            </div>
            <div className="mt-6 relative z-10">
              <h3 className="text-3xl font-bold tracking-tight">{stat.value}</h3>
              <p className="text-sm font-medium text-text-secondary mt-1">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="p-8 bg-card border border-border-custom rounded-[2.5rem]">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-bold">Snap Share Trends</h3>
            <p className="text-sm text-text-secondary">Daily shares for the last 30 days</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gold"></div>
              <span className="text-xs font-bold">Total Shares</span>
            </div>
          </div>
        </div>
        <div className="h-[400px] w-full">
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
                dataKey="date" 
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

      <div className="bg-card border border-border-custom rounded-[2.5rem] overflow-hidden">
        <div className="p-8 border-b border-border-custom flex items-center justify-between">
          <h3 className="text-xl font-bold">Dish Performance</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-4 py-2 bg-main rounded-xl border border-border-custom">
              <Search size={18} className="text-text-muted" />
              <input type="text" placeholder="Search dishes..." className="bg-transparent outline-none text-sm w-full" />
            </div>
            <button className="p-2.5 bg-main border border-border-custom rounded-xl hover:bg-sidebar transition-all">
              <Filter size={18} />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-sidebar/50 text-text-muted text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="px-8 py-5">Dish Name</th>
                <th className="px-8 py-5">Total Shares</th>
                <th className="px-8 py-5">Growth</th>
                <th className="px-8 py-5">Est. Reach</th>
                <th className="px-8 py-5">Streak</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-custom">
              {snapData.map((dish, idx) => (
                <tr key={`snap-dish-${idx}-${dish.dishName}`} className="hover:bg-sidebar/30 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold font-bold">
                        {dish.dishName.charAt(0)}
                      </div>
                      <span className="font-bold text-sm">{dish.dishName}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 font-bold text-sm">{dish.totalShares}</td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-1 text-xs font-bold text-green-custom">
                      <ArrowUpRight size={14} />
                      {dish.growth}%
                    </div>
                  </td>
                  <td className="px-8 py-6 font-medium text-sm text-text-secondary">{dish.estimatedReach.toLocaleString()}</td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-gold/10 text-gold rounded-full text-[10px] font-bold w-fit">
                      <Zap size={12} className="fill-gold" />
                      {dish.streakDays} Days
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="p-2 hover:bg-main rounded-lg text-text-muted hover:text-dark-custom transition-all">
                      <MoreHorizontal size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SnapAnalyticsPage;
