import { create } from 'zustand';
import type { POSBranch, POSProduct, POSInventoryItem, POSMenuCategory } from '../services/posService';

export interface CartItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  costPrice?: number;
  hasRecipe: boolean;
}

interface POSState {
  // Branch context
  currentBranch: POSBranch | null;
  setBranch: (branch: POSBranch) => void;

  // Cart (client-side state before order creation)
  cart: CartItem[];
  currentOrderId: string | null;
  tableNumber: string;

  addToCart: (product: POSProduct, hasRecipe: boolean) => void;
  removeFromCart: (productId: string) => void;
  updateCartItemQty: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setCurrentOrderId: (orderId: string | null) => void;
  setTableNumber: (tableNumber: string) => void;

  // Addition A: Idempotency key for payment deduplication
  idempotencyKey: string | null;
  generateIdempotencyKey: () => string;

  // Cart computed
  getCartSubtotal: () => number;
  getCartItemCount: () => number;

  // Low stock alerts
  lowStockAlerts: POSInventoryItem[];
  setLowStockAlerts: (items: POSInventoryItem[]) => void;

  // Active categories (for POS grid)
  categories: POSMenuCategory[];
  setCategories: (cats: POSMenuCategory[]) => void;

  // Products cache (for POS grid)
  products: POSProduct[];
  setProducts: (products: POSProduct[]) => void;
}

export const usePOSStore = create<POSState>((set, get) => ({
  // Branch
  currentBranch: null,
  setBranch: (branch) => set({ currentBranch: branch }),

  // Cart
  cart: [],
  currentOrderId: null,
  tableNumber: '',
  idempotencyKey: null,

  addToCart: (product, hasRecipe) => {
    set((state) => {
      const existing = state.cart.find(item => item.productId === product.id);
      if (existing) {
        return {
          cart: state.cart.map(item =>
            item.productId === product.id
              ? { ...item, quantity: item.quantity + 1, lineTotal: (item.quantity + 1) * item.unitPrice }
              : item
          )
        };
      }
      return {
        cart: [...state.cart, {
          productId: product.id,
          name: product.name,
          quantity: 1,
          unitPrice: product.selling_price,
          lineTotal: product.selling_price,
          costPrice: product.cost_price || undefined,
          hasRecipe
        }]
      };
    });
  },

  removeFromCart: (productId) => {
    set((state) => ({
      cart: state.cart.filter(item => item.productId !== productId)
    }));
  },

  updateCartItemQty: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(productId);
      return;
    }
    set((state) => ({
      cart: state.cart.map(item =>
        item.productId === productId
          ? { ...item, quantity, lineTotal: quantity * item.unitPrice }
          : item
      )
    }));
  },

  clearCart: () => set({ cart: [], currentOrderId: null, tableNumber: '', idempotencyKey: null }),

  setCurrentOrderId: (orderId) => set({ currentOrderId: orderId }),
  setTableNumber: (tableNumber) => set({ tableNumber }),

  // Addition A: Generate a fresh UUID for each checkout attempt
  generateIdempotencyKey: () => {
    const key = crypto.randomUUID();
    set({ idempotencyKey: key });
    return key;
  },

  getCartSubtotal: () => {
    return get().cart.reduce((sum, item) => sum + item.lineTotal, 0);
  },

  getCartItemCount: () => {
    return get().cart.reduce((sum, item) => sum + item.quantity, 0);
  },

  // Low stock
  lowStockAlerts: [],
  setLowStockAlerts: (items) => set({ lowStockAlerts: items }),

  // Categories
  categories: [],
  setCategories: (cats) => set({ categories: cats }),

  // Products
  products: [],
  setProducts: (products) => set({ products }),
}));
