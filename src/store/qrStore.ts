import { create } from 'zustand';
import { QRConfig } from '../types';

interface QRState {
  qrCodes: QRConfig[];
  addQR: (qr: QRConfig) => void;
  deleteQR: (tableNumber: number) => void;
}

export const useQRStore = create<QRState>((set) => ({
  qrCodes: [
    {
      restaurantId: 'rest123',
      tableNumber: 1,
      menuUrl: 'https://VISIONOmenu.com/rest123?table=1',
      primaryColor: '#C9A84C',
      size: 256,
    },
    {
      restaurantId: 'rest123',
      tableNumber: 2,
      menuUrl: 'https://VISIONOmenu.com/rest123?table=2',
      primaryColor: '#C9A84C',
      size: 256,
    }
  ],
  addQR: (qr) => set((state) => ({ qrCodes: [...state.qrCodes, qr] })),
  deleteQR: (tableNumber) => set((state) => ({
    qrCodes: state.qrCodes.filter((qr) => qr.tableNumber !== tableNumber)
  })),
}));
