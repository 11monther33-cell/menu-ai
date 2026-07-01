import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { 
  Plus, 
  Download, 
  Copy, 
  ExternalLink, 
  Trash2, 
  Printer, 
  FileArchive,
  QrCode as QrIcon,
  Search,
  Filter
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import JSZip from 'jszip';
import { useQRStore } from '../store/qrStore';
import { cn } from '../lib/utils';
import { QRConfig } from '../types';

import { QRGenerator } from '../components/qr/QRGenerator';

const QRCodesPage = () => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const { qrCodes, addQR, deleteQR } = useQRStore();

  const downloadQR = (tableNumber: number) => {
    const canvas = document.getElementById(`qr-canvas-${tableNumber}`) as HTMLCanvasElement;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `QR-Table-${tableNumber}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const bulkExport = async () => {
    const zip = new JSZip();
    const folder = zip.folder("VISIONO-QRCodes");
    
    qrCodes.forEach(qr => {
      const canvas = document.getElementById(`qr-canvas-${qr.tableNumber}`) as HTMLCanvasElement;
      if (canvas) {
        const data = canvas.toDataURL('image/png').split(',')[1];
        folder?.file(`Table-${qr.tableNumber}.png`, data, { base64: true });
      }
    });

    const content = await zip.generateAsync({ type: "blob" });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = "VISIONO-QRCodes.zip";
    link.click();
  };

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('qr.title')}</h1>
          <p className="text-text-secondary mt-1">Generate and manage QR codes for your restaurant tables.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={bulkExport}
            className="px-6 py-3 bg-card border border-border-custom text-dark-custom font-bold rounded-xl hover:bg-sidebar transition-all flex items-center gap-2"
          >
            <FileArchive size={18} />
            {t('qr.downloadAll')}
          </button>
          <button 
            onClick={() => {
              const table = prompt('Table Number?');
              if (table) addQR({
                restaurantId: 'rest123',
                tableNumber: parseInt(table),
                menuUrl: `${window.location.origin}/menu/rest123?table=${table}`,
                primaryColor: '#C9A84C',
                size: 256,
              });
            }}
            className="px-6 py-3 bg-gold text-white font-bold rounded-xl hover:bg-gold/90 transition-all flex items-center gap-2 shadow-lg shadow-gold/20"
          >
            <Plus size={18} />
            New QR
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-card p-4 rounded-2xl border border-border-custom">
        <div className="flex-1 flex items-center gap-3 px-4 py-2 bg-main rounded-xl border border-border-custom">
          <Search size={18} className="text-text-muted" />
          <input type="text" placeholder="Search tables..." className="bg-transparent outline-none text-sm w-full" />
        </div>
        <button className="p-3 bg-main border border-border-custom rounded-xl hover:bg-sidebar transition-all">
          <Filter size={18} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {qrCodes.map((qr, idx) => (
          <motion.div
            key={`qr-table-${qr.tableNumber}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
          >
            <QRGenerator 
              config={qr} 
              onDownload={downloadQR} 
              onCopy={copyLink} 
              onOpen={(url) => window.open(url, '_blank')} 
              onDelete={deleteQR}
            />
          </motion.div>
        ))}

        <button 
          onClick={() => {
            const table = prompt('Table Number?');
            if (table) addQR({
              restaurantId: 'rest123',
              tableNumber: parseInt(table),
              menuUrl: `https://VISIONOmenu.com/rest123?table=${table}`,
              primaryColor: '#C9A84C',
              size: 256,
            });
          }}
          className="h-full min-h-[400px] border-2 border-dashed border-border-custom rounded-[2.5rem] flex flex-col items-center justify-center gap-4 text-text-muted hover:text-gold hover:border-gold/50 hover:bg-gold/5 transition-all group"
        >
          <div className="w-16 h-16 rounded-full bg-sidebar flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus size={32} />
          </div>
          <div className="text-center">
            <span className="font-bold text-lg block">Add New Table</span>
            <span className="text-xs">Generate unique QR for a new table</span>
          </div>
        </button>
      </div>

      <div className="bg-gold/5 border border-gold/20 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-gold flex items-center justify-center text-white shadow-xl shadow-gold/20">
            <LinkIcon size={32} />
          </div>
          <div>
            <h3 className="text-xl font-bold">Menu Public Link</h3>
            <p className="text-sm text-text-secondary mt-1">VISIONOmenu.com/rest123</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => copyLink('https://VISIONOmenu.com/rest123')}
            className="px-8 py-4 bg-main border border-border-custom rounded-2xl font-bold hover:bg-sidebar transition-all flex items-center gap-2"
          >
            <Copy size={18} />
            {t('qr.copyLink')}
          </button>
          <button 
            onClick={() => window.open('https://VISIONOmenu.com/rest123', '_blank')}
            className="px-8 py-4 bg-gold text-white rounded-2xl font-bold hover:bg-gold/90 transition-all flex items-center gap-2 shadow-xl shadow-gold/20"
          >
            <ExternalLink size={18} />
            {t('qr.openMenu')}
          </button>
        </div>
      </div>
    </div>
  );
};

const LinkIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

export default QRCodesPage;
