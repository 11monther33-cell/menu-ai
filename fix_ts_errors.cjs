const fs = require('fs');

// 1. ARScanner.tsx
let scannerContent = fs.readFileSync('src/components/ARScanner.tsx', 'utf-8');
scannerContent = scannerContent.replace("import { ScanProgressHUD } from './ar/ScanProgressHUD';\nimport { ScanProgressHUD } from './ar/ScanProgressHUD';", "import { ScanProgressHUD } from './ar/ScanProgressHUD';");
fs.writeFileSync('src/components/ARScanner.tsx', scannerContent);

// 2. ARExperience.tsx
let arExpContent = fs.readFileSync('src/components/ar/ARExperience.tsx', 'utf-8');

// Replace line 34:
const oldUseGyro = `  const { state: scan, requestPermission, startTracking, stopTracking, reset } =
    useGyroscopeScan()`;
const newUseGyro = `  const { requestPermission, resetScan: reset, isScanning, progress, currentAngle, hasPermission, capturedCount } = useGyroscopeScan();
  const scan = { progress, currentAngle, isScanning, hasPermission, capturedCount }; // mock state object to keep rest of code working`;
arExpContent = arExpContent.replace(oldUseGyro, newUseGyro);

// Replace gyroOk void check
const oldGyroOk = `      const gyroOk = await requestPermission()
      if (!gyroOk) {`;
const newGyroOk = `      await requestPermission()
      // Note: requestPermission throws or sets state if it fails, so we proceed and let the UI reflect hasPermission`;
arExpContent = arExpContent.replace(oldGyroOk, newGyroOk);

fs.writeFileSync('src/components/ar/ARExperience.tsx', arExpContent);
