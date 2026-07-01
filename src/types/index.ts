import * as React from 'react';

export interface MenuItem {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  description: string; // Legacy
  price: number;
  currency: string;
  category: string;
  image: string;
  images?: string[];
  model3D?: string;
  model3dStatus?: 'NONE' | 'UPLOADING' | 'PROCESSING' | 'READY' | 'ERROR' | 'REQUESTED';
  available: boolean;
  snapShares: number;
  allergens?: string[];
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  prepTimeMin?: number;
  isChefSpecial?: boolean;
  aiGenerationTaskId?: string;
  isAIGenerated?: boolean;
}

export interface MenuCategory {
  id: string;
  nameAr: string;
  nameEn: string;
  items: MenuItem[];
}

export interface QRConfig {
  id?: string;
  restaurantId: string;
  tableNumber?: number;
  menuUrl: string;
  logoUrl?: string;
  primaryColor: string;
  size?: number;
  label?: string;
  qrData?: string;
  svgBase64?: string;
  pdfBase64?: string;
  scanCount?: number;
  lastScannedAt?: string;
  isActive?: boolean;
}

export interface SnapAnalytics {
  id?: string;
  dishId: string;
  dishName: string;
  totalShares: number;
  weeklyShares: number[];
  growth: number;
  estimatedReach: number;
  streakDays: number;
  deviceHash?: string;
  mode?: string;
  sharedAt?: string;
}

export interface Order {
  id: string;
  restaurant_id: string;
  tableNumber: number;
  table_number?: number;
  items: {
    itemId: string;
    name: string;
    quantity: number;
    price: number;
    notes?: string;
  }[];
  total: number;
  notes?: string;
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED';
  timestamp: string;
  created_at?: string;
}

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  branding: any;
  status: string;
}
