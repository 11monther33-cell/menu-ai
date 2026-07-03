import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Smartphone, RefreshCw, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface ConnectIOSAppCardProps {
  productId: string;
  productName: string;
  authToken: string;
  primaryColor?: string;
}

export function ConnectIOSAppCard({ productId, productName, authToken, primaryColor = '#10B981' }: ConnectIOSAppCardProps) {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const TESTFLIGHT_URL = "https://testflight.apple.com/join/XXXXXXXX";

  async function generatePairingCode() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/device-pairing/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ productId }),
      });
      if (!res.ok) throw new Error(isAr ? "فشل توليد كود الاقتران" : "Failed to generate pairing code");
      const data = await res.json();
      setPairingCode(data.pairingCode);
      setExpiresAt(new Date(data.expiresAt));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const deepLink = `arcodecapture://capture?productId=${productId}`;

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#151518] to-[#111] p-6 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <div 
          className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ background: `${primaryColor}15`, border: `1px solid ${primaryColor}30` }}
        >
          <Smartphone size={22} style={{ color: primaryColor }} />
        </div>
        <div>
          <h3 className="text-white font-semibold text-lg">
            {isAr ? `توليد نموذج ثلاثي الأبعاد لـ "${productName}"` : `Generate 3D Model for "${productName}"`}
          </h3>
          <p className="text-muted text-xs mt-0.5">
            {isAr ? 'امسح الطبق عبر تطبيق iOS المرافق' : 'Scan dish via iOS companion app'}
          </p>
        </div>
      </div>

      <ol className="text-sm space-y-3 mb-6 list-decimal list-inside text-white/70">
        <li>
          {isAr ? 'حمّل التطبيق (أول مرة فقط) عبر رابط دعوة ' : 'Download the app (first time only) via '}
          <a
            href={TESTFLIGHT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline transition-colors hover:text-white"
            style={{ color: primaryColor }}
          >
            TestFlight
          </a>
        </li>
        <li>{isAr ? 'افتح التطبيق وامسح رمز QR بالأسفل من كاميرا الآيفون العادية.' : 'Open the app and scan the QR code below from the normal iPhone camera.'}</li>
        <li>{isAr ? 'سيفتح التطبيق تلقائياً على شاشة تصوير هذا المنتج بالتحديد.' : 'The app will automatically open to the capture screen for this specific product.'}</li>
        <li>{isAr ? 'الموديل يُرفع تلقائياً هنا بمجرد اكتمال التوليد.' : 'The model is uploaded automatically here once generation is complete.'}</li>
      </ol>

      {!pairingCode ? (
        <button
          onClick={generatePairingCode}
          disabled={loading}
          className="w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-lg hover:opacity-90 disabled:opacity-50"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)`,
            color: '#0a0a0e',
            boxShadow: `0 4px 20px ${primaryColor}30`,
          }}
        >
          {loading ? <RefreshCw size={18} className="animate-spin" /> : <QrCode size={18} />}
          {loading ? (isAr ? "جاري التوليد..." : "Generating...") : (isAr ? "توليد رمز QR للربط" : "Generate Pairing QR")}
        </button>
      ) : (
        <div className="flex flex-col items-center gap-4 p-6 bg-black/40 border border-white/5 rounded-xl">
          <div className="p-3 bg-white rounded-xl shadow-lg">
            <QRCodeSVG value={`${deepLink}&code=${pairingCode}`} size={180} />
          </div>
          <div className="text-center">
            <p className="text-xs font-mono text-white/50 tracking-wider mb-2">
              {isAr ? 'صالح حتى' : 'Valid until'} {expiresAt?.toLocaleTimeString(isAr ? 'ar' : 'en-US')}
            </p>
            <button
              onClick={generatePairingCode}
              className="text-xs font-medium hover:underline transition-all"
              style={{ color: primaryColor }}
            >
              {isAr ? 'توليد رمز جديد' : 'Generate new code'}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold flex items-center gap-2">
          <AlertCircle size={14} />
          {error}
        </div>
      )}
    </div>
  );
}
