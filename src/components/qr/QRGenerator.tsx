import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { QRConfig } from '../../types';
import { Download, Copy, ExternalLink } from 'lucide-react';

interface QRGeneratorProps {
  config: QRConfig;
  onDownload: (tableNumber: number) => void;
  onCopy: (url: string) => void;
  onOpen: (url: string) => void;
  onDelete: (tableNumber: number) => void;
}

export const QRGenerator: React.FC<QRGeneratorProps> = ({ config, onDownload, onCopy, onOpen, onDelete }) => {
  return (
    <div className="bg-card border border-border-custom rounded-[2.5rem] p-8 flex flex-col items-center group hover:shadow-2xl hover:shadow-gold/5 transition-all duration-500">
      <div className="relative mb-8 p-4 bg-main rounded-3xl border border-border-custom shadow-sm group-hover:scale-105 transition-transform duration-500">
        <QRCodeCanvas
          id={`qr-canvas-${config.tableNumber}`}
          value={config.menuUrl}
          size={180}
          fgColor={config.primaryColor}
          level="H"
          includeMargin={false}
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-10 h-10 bg-main rounded-xl shadow-lg border border-border-custom flex items-center justify-center p-1.5">
            <div className="w-full h-full bg-gold rounded-lg flex items-center justify-center text-white font-bold text-[10px]">
              TX
            </div>
          </div>
        </div>
      </div>

      <div className="text-center mb-8">
        <h3 className="text-xl font-bold">Table {config.tableNumber}</h3>
        <p className="text-xs text-text-secondary mt-1">Main Dining Hall</p>
      </div>

      <div className="w-full space-y-3">
        <div className="flex gap-2">
          <button 
            onClick={() => onDownload(config.tableNumber!)}
            className="flex-1 py-3 bg-main border border-border-custom rounded-xl hover:bg-sidebar transition-all flex items-center justify-center gap-2 text-xs font-bold"
          >
            <Download size={14} />
            Download
          </button>
          <button 
            onClick={() => onCopy(config.menuUrl)}
            className="flex-1 py-3 bg-main border border-border-custom rounded-xl hover:bg-sidebar transition-all flex items-center justify-center gap-2 text-xs font-bold"
          >
            <Copy size={14} />
            Copy
          </button>
        </div>
        <button 
          onClick={() => onOpen(config.menuUrl)}
          className="w-full py-3 bg-dark-custom text-white rounded-xl hover:bg-black transition-all flex items-center justify-center gap-2 text-xs font-bold shadow-lg shadow-dark-custom/10"
        >
          <ExternalLink size={14} />
          Open Menu
        </button>
        <button 
          onClick={() => onDelete(config.tableNumber!)}
          className="w-full py-2 text-red-500 hover:bg-red-50 rounded-xl transition-all text-[10px] font-bold uppercase tracking-widest"
        >
          Delete QR
        </button>
      </div>
    </div>
  );
};
