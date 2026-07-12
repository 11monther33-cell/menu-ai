import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuth } from '../../../hooks/useAuth';
import {
  fetchSalesSummary,
  fetchProfitLoss,
  fetchLowStock,
  POSInventoryItem,
  SalesSummaryRow,
  ProfitLossData
} from '../../../services/posService';
import { usePOSStore } from '../../../store/posStore';
import { motion } from 'motion/react';
import { toast } from 'react-hot-toast';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  Calendar, RefreshCw, TrendingUp, TrendingDown, AlertTriangle, ArrowUpRight, ArrowDownRight, Award
} from 'lucide-react';

export const POSReports = () => {
  const { isRtl } = useLanguage();
  const { user } = useAuth();
  const { currentBranch } = usePOSStore();

  const [salesSummary, setSalesSummary] = useState<SalesSummaryRow[]>([]);
  const [profitLoss, setProfitLoss] = useState<ProfitLossData>({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0
  });
  const [lowStock, setLowStock] = useState<POSInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Time Period State
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'custom'>('month');
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);

  const loadData = async () => {
    if (!currentBranch) return;
    setLoading(true);

    // Calculate dates based on period selection
    let start = fromDate;
    let end = toDate;
    const now = new Date();

    if (period === 'today') {
      const todayStr = now.toISOString().split('T')[0];
      start = `${todayStr}T00:00:00Z`;
      end = `${todayStr}T23:59:59Z`;
    } else if (period === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      start = weekAgo.toISOString().split('T')[0];
      end = now.toISOString().split('T')[0];
    } else if (period === 'month') {
      const monthAgo = new Date();
      monthAgo.setDate(now.getDate() - 30);
      start = monthAgo.toISOString().split('T')[0];
      end = now.toISOString().split('T')[0];
    }

    try {
      const [sales, pl, stock] = await Promise.all([
        fetchSalesSummary(currentBranch.id, start, end),
        fetchProfitLoss(currentBranch.id, start, end),
        fetchLowStock(currentBranch.id)
      ]);
      setSalesSummary(sales);
      setProfitLoss(pl);
      setLowStock(stock);
    } catch (err) {
      console.error(err);
      toast.error(isRtl ? 'فشل تحميل التقارير' : 'Failed to generate financial reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentBranch?.id, period, fromDate, toDate]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-text-primary">
            {isRtl ? 'التقارير المالية والربحية' : 'Profitability Reports'}
          </h1>
          <p className="text-text-secondary text-sm">
            {isRtl ? 'تحليل المبيعات وتكلفة الأطباق، ومراجعة هوامش الربح وصافي الأرباح التشغيلية.' : 'Analyze dish costs, profit margins, and net operating revenue vs expenditures.'}
          </p>
        </div>

        {/* Timeframe selector */}
        <div className="flex flex-wrap gap-2 bg-sidebar border border-border-custom p-1.5 rounded-xl">
          {[
            { id: 'today', label: isRtl ? 'اليوم' : 'Today' },
            { id: 'week', label: isRtl ? 'آخر 7 أيام' : '7 Days' },
            { id: 'month', label: isRtl ? 'آخر 30 يوم' : '30 Days' },
            { id: 'custom', label: isRtl ? 'مخصص' : 'Custom' }
          ].map(p => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id as any)}
              className={`px-4 py-2 rounded-lg font-bold text-xs transition-all ${
                period === p.id
                  ? 'bg-gold text-white shadow'
                  : 'text-text-secondary hover:text-text-primary hover:bg-card'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {period === 'custom' && (
        <div className="bg-sidebar border border-border-custom p-6 rounded-[2rem] flex flex-col md:flex-row gap-4 items-center">
          <div className="flex items-center gap-2 text-text-secondary text-sm">
            <Calendar size={16} className="text-gold" />
            <span>{isRtl ? 'الفترة المخصصة:' : 'Custom Period:'}</span>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <input
              type="date"
              className="bg-main border border-border-custom rounded-lg px-4 py-2 text-xs text-text-primary outline-none focus:border-gold/50"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
            />
            <span className="text-text-secondary self-center">-</span>
            <input
              type="date"
              className="bg-main border border-border-custom rounded-lg px-4 py-2 text-xs text-text-primary outline-none focus:border-gold/50"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* KPI Cards row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-sidebar border border-border-custom p-6 rounded-[2rem] hover:shadow-xl hover:shadow-gold/5 transition-all"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-gold/10 text-gold rounded-2xl flex items-center justify-center">
              <TrendingUp size={22} />
            </div>
            <ArrowUpRight size={16} className="text-green-custom" />
          </div>
          <p className="text-text-secondary text-xs mb-1">{isRtl ? 'إجمالي المبيعات' : 'Total Revenue'}</p>
          <p className="text-2xl font-bold text-text-primary">
            {Number(profitLoss.totalRevenue).toFixed(3)} {currentBranch?.currency_code}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-sidebar border border-border-custom p-6 rounded-[2rem] hover:shadow-xl hover:shadow-gold/5 transition-all"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-red-500/10 text-red-400 rounded-2xl flex items-center justify-center">
              <TrendingDown size={22} />
            </div>
            <ArrowDownRight size={16} className="text-red-400" />
          </div>
          <p className="text-text-secondary text-xs mb-1">{isRtl ? 'إجمالي المصروفات' : 'Total Expenses'}</p>
          <p className="text-2xl font-bold text-text-primary">
            {Number(profitLoss.totalExpenses).toFixed(3)} {currentBranch?.currency_code}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-sidebar border border-border-custom p-6 rounded-[2rem] hover:shadow-xl hover:shadow-gold/5 transition-all"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-green-500/10 text-green-400 rounded-2xl flex items-center justify-center">
              <Award size={22} />
            </div>
            {profitLoss.netProfit >= 0 ? (
              <ArrowUpRight size={16} className="text-green-custom" />
            ) : (
              <ArrowDownRight size={16} className="text-red-400" />
            )}
          </div>
          <p className="text-text-secondary text-xs mb-1">{isRtl ? 'صافي الأرباح' : 'Net Operating Profit'}</p>
          <p className={`text-2xl font-bold ${profitLoss.netProfit >= 0 ? 'text-green-custom' : 'text-red-400'}`}>
            {Number(profitLoss.netProfit).toFixed(3)} {currentBranch?.currency_code}
          </p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-sidebar border border-border-custom rounded-[2.5rem] p-6 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-text-primary">{isRtl ? 'مبيعات الأصناف' : 'Product Sales'}</h3>
          </div>
          <div className="h-[300px] w-full">
            {loading ? (
              <div className="flex h-full items-center justify-center"><RefreshCw size={24} className="animate-spin text-gold" /></div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesSummary.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                  <XAxis dataKey="product_name" stroke="#666" fontSize={11} tickLine={false} />
                  <YAxis stroke="#666" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff', fontSize: 12 }}
                    labelStyle={{ color: '#CBA358', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="total_revenue" name={isRtl ? 'الإيراد' : 'Revenue'} fill="#CBA358" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="total_profit" name={isRtl ? 'الربح' : 'Profit'} fill="#4CAF50" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Low Stock Alerts Widget */}
        <div className="bg-sidebar border border-border-custom rounded-[2.5rem] overflow-hidden flex flex-col">
          <div className="p-6 border-b border-border-custom bg-card/30 flex items-center gap-2">
            <AlertTriangle size={18} className="text-red-400" />
            <h3 className="text-lg font-bold text-text-primary">{isRtl ? 'تنبيهات انخفاض المخزون' : 'Low Stock Alerts'}</h3>
          </div>
          <div className="flex-1 p-6 space-y-4 overflow-y-auto max-h-[320px] custom-scrollbar">
            {lowStock.map(item => (
              <div key={item.id} className="flex justify-between items-center p-3 bg-red-500/5 border border-red-500/10 rounded-xl">
                <div>
                  <p className="font-bold text-xs text-text-primary">{item.name}</p>
                  <p className="text-[10px] text-text-secondary">
                    {isRtl ? 'الكمية المتبقية:' : 'Remaining:'} {Number(item.current_quantity).toFixed(2)} {item.unit}
                  </p>
                </div>
                <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-[9px] font-bold text-red-400 rounded-md">
                  {isRtl ? 'شح المخزون' : 'Refill needed'}
                </span>
              </div>
            ))}
            {lowStock.length === 0 && (
              <p className="text-center text-xs text-text-secondary py-12">
                {isRtl ? 'لا توجد تنبيهات نقص مخزون حالياً.' : 'Inventory levels look healthy.'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Sales Summary Table */}
      <div className="bg-sidebar border border-border-custom rounded-[2.5rem] overflow-hidden">
        <div className="p-6 border-b border-border-custom bg-card/30">
          <h3 className="text-xl font-bold text-text-primary">{isRtl ? 'ربحية وكميات الأصناف المباعة' : 'Product Sales & Margins'}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right">
            <thead className="bg-card/50 text-xs text-text-secondary uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-bold">{isRtl ? 'المنتج' : 'Product'}</th>
                <th className="px-6 py-4 font-bold">{isRtl ? 'الكمية المباعة' : 'Qty Sold'}</th>
                <th className="px-6 py-4 font-bold">{isRtl ? 'إجمالي المبيعات' : 'Total Revenue'}</th>
                <th className="px-6 py-4 font-bold">{isRtl ? 'إجمالي الأرباح' : 'Total Profit'}</th>
                <th className="px-6 py-4 font-bold">{isRtl ? 'هامش الربح' : 'Profit Margin'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-custom">
              {salesSummary.map((row, idx) => {
                const margin = row.total_revenue ? ((row.total_profit / row.total_revenue) * 100).toFixed(0) : '0';
                return (
                  <tr key={idx} className="hover:bg-card/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-sm text-text-primary">{row.product_name}</td>
                    <td className="px-6 py-4 text-sm text-text-secondary">{row.total_quantity_sold}</td>
                    <td className="px-6 py-4 text-sm font-bold text-text-primary">
                      {Number(row.total_revenue).toFixed(3)} {currentBranch?.currency_code}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-green-custom">
                      {Number(row.total_profit).toFixed(3)} {currentBranch?.currency_code}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-text-primary">{margin}%</td>
                  </tr>
                );
              })}
              {salesSummary.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-text-secondary">
                    {isRtl ? 'لا يوجد مبيعات مسجلة في هذه الفترة.' : 'No sales registered in this period.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
