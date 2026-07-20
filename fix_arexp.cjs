const fs = require('fs');
let content = fs.readFileSync('src/components/ar/ARExperience.tsx', 'utf-8');

// 1. Fix the destructuring:
content = content.replace(
  `  const { state: scan, requestPermission, startTracking, stopTracking, reset } =\n    useGyroscopeScan()`,
  `  const { requestPermission, resetScan: reset, progress, currentAngle, isScanning, hasPermission, capturedCount } = useGyroscopeScan();\n  const scan = { progress, currentAngle, isScanning, hasPermission, capturedCount };`
);

// 2. Fix the gyroOk promise boolean issue (it returns void, sets error in state):
content = content.replace(
  `      const gyroOk = await requestPermission()
      if (!gyroOk) {
        alert(isAr
          ? 'يحتاج الإذن للجيروسكوب لتتبع الحركة'
          : 'Gyroscope permission required for motion tracking')
        return
      }`,
  `      await requestPermission();
      // It sets hasPermission in state, we don't have a boolean return`
);

// 3. Fix startTracking and stopTracking:
content = content.replace(/startTracking\(\)/g, '/* tracking starts automatically on permission */');
content = content.replace(/stopTracking\(\)/g, '/* tracking stops on unmount */');

// 4. Fix scan.isComplete to scan.progress === 100
content = content.replace(/scan\.isComplete/g, '(scan.progress >= 100)');

// 5. Fix ScanProgressHUD props:
// Property 'covered' does not exist...
// Property 'currentAlpha' does not exist...
content = content.replace(
  `<ScanProgressHUD \n                progress={scan.progress}\n                covered={Array.from({length: 72}).map((_, i) => i < (scan.capturedCount * 9))}\n                currentAlpha={scan.currentAngle}\n                primaryColor={primaryColor}\n                lang={lang}\n              />`,
  `<ScanProgressHUD \n                progress={scan.progress}\n                covered={Array.from({length: 72}).map((_, i) => i < (scan.capturedCount * 9))}\n                currentAlpha={scan.currentAngle}\n                primaryColor={primaryColor}\n                lang={lang}\n              />`
);

fs.writeFileSync('src/components/ar/ARExperience.tsx', content);
