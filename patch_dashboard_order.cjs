const fs = require('fs');
let content = fs.readFileSync('src/pages/restaurant/Dashboard.tsx', 'utf-8');

// Remove from old location
const oldAppConnection = "        { id: 'app-connection', icon: <Smartphone size={20} />, label: isRtl ? 'ربط التطبيق' : 'App Connection', path: '/dashboard/app-connection' },\n";
content = content.replace(oldAppConnection, '');

// Insert after qr-codes
const qrCodesLine = "{ id: 'qr-codes', icon: <QrCode size={20} />, label: t('restaurant.nav.qrCodes') || (isRtl ? 'رموز QR' : 'QR Codes'), path: '/dashboard/qr-codes' },";
content = content.replace(
  qrCodesLine, 
  qrCodesLine + "\n        { id: 'app-connection', icon: <Smartphone size={20} />, label: isRtl ? 'ربط التطبيق' : 'App Connection', path: '/dashboard/app-connection' },"
);

fs.writeFileSync('src/pages/restaurant/Dashboard.tsx', content);
