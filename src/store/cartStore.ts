import { create } from 'zustand';
import { MenuItem } from '../types';

export interface CartItem extends MenuItem {
  cartItemId: string;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  addItem: (item: MenuItem, quantity?: number) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  isOpen: false,
  setIsOpen: (isOpen) => set({ isOpen }),
  
  addItem: (item, quantity = 1) => {
    set((state) => {
      // Check if item already exists
      const existingItem = state.items.find(i => i.id === item.id);
      if (existingItem) {
        return {
          items: state.items.map(i => 
            i.id === item.id 
              ? { ...i, quantity: i.quantity + quantity }
              : i
          )
        };
      }
      
      return {
        items: [...state.items, { ...item, cartItemId: Math.random().toString(36).substring(7), quantity }]
      };
    });
  },
  
  removeItem: (cartItemId) => {
    set((state) => ({
      items: state.items.filter(i => i.cartItemId !== cartItemId)
    }));
  },
  
  updateQuantity: (cartItemId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(cartItemId);
      return;
    }
    
    set((state) => ({
      items: state.items.map(i => 
        i.cartItemId === cartItemId 
          ? { ...i, quantity }
          : i
      )
    }));
  },
  
  clearCart: () => set({ items: [], isOpen: false }),
  
  getTotalPrice: () => {
    return get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
  },
  
  getTotalItems: () => {
    return get().items.reduce((total, item) => total + item.quantity, 0);
  }
}));
