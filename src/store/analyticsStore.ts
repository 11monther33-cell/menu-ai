import { create } from 'zustand';
import { SnapAnalytics } from '../types';

interface AnalyticsState {
  snapData: SnapAnalytics[];
  setSnapData: (data: SnapAnalytics[]) => void;
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  snapData: [
    {
      dishId: 'item2',
      dishName: 'برغر واغيو',
      totalShares: 203,
      weeklyShares: [20, 35, 25, 40, 30, 45, 203],
      growth: 180,
      estimatedReach: 8400,
      streakDays: 7,
    },
    {
      dishId: 'item1',
      dishName: 'ريش مشوي',
      totalShares: 89,
      weeklyShares: [10, 15, 12, 18, 14, 20, 89],
      growth: 45,
      estimatedReach: 3200,
      streakDays: 3,
    }
  ],
  setSnapData: (snapData) => set({ snapData }),
}));
