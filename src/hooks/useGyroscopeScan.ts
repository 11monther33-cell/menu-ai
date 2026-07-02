import { useState, useEffect, useCallback } from 'react';

interface ScanProgress {
  progress: number; // 0 to 100
  currentAngle: number; // 0 to 360
  isScanning: boolean;
  hasPermission: boolean;
  error: string | null;
}

export function useGyroscopeScan(targetAnglesCount: number = 8) {
  const [state, setState] = useState<ScanProgress>({
    progress: 0,
    currentAngle: 0,
    isScanning: false,
    hasPermission: false,
    error: null,
  });

  const [startAngle, setStartAngle] = useState<number | null>(null);
  const [capturedAngles, setCapturedAngles] = useState<number[]>([]);

  // Request permission (needed for iOS 13+)
  const requestPermission = async () => {
    try {
      if (
        typeof (DeviceOrientationEvent as any) !== 'undefined' &&
        typeof (DeviceOrientationEvent as any).requestPermission === 'function'
      ) {
        const permissionState = await (DeviceOrientationEvent as any).requestPermission();
        if (permissionState === 'granted') {
          setState(prev => ({ ...prev, hasPermission: true, isScanning: true }));
        } else {
          setState(prev => ({ ...prev, error: 'Permission denied for device orientation' }));
        }
      } else {
        // Non-iOS 13+ devices
        setState(prev => ({ ...prev, hasPermission: true, isScanning: true }));
      }
    } catch (err: any) {
      setState(prev => ({ ...prev, error: err.message }));
    }
  };

  const handleOrientation = useCallback((event: DeviceOrientationEvent) => {
    if (!state.isScanning) return;

    let alpha = event.alpha; // 0 to 360 (compass direction)
    
    // Fallback if alpha is null (some devices)
    if (alpha === null) {
      // Use webkitCompassHeading if available
      alpha = (event as any).webkitCompassHeading;
    }

    if (alpha === null || alpha === undefined) return;

    setStartAngle(prevStart => {
      const start = prevStart === null ? alpha : prevStart;
      
      // Calculate how far we've rotated relative to the start angle
      let relativeAngle = alpha! - start!;
      if (relativeAngle < 0) relativeAngle += 360;

      // Update current angle
      setState(prev => ({ ...prev, currentAngle: relativeAngle }));

      // Check if we hit a new target angle interval
      const interval = 360 / targetAnglesCount;
      const targetIndex = Math.floor(relativeAngle / interval);
      
      setCapturedAngles(prevCaptured => {
        if (!prevCaptured.includes(targetIndex)) {
          const newCaptured = [...prevCaptured, targetIndex];
          const newProgress = Math.min(100, (newCaptured.length / targetAnglesCount) * 100);
          
          setState(prev => ({ ...prev, progress: newProgress }));
          
          return newCaptured;
        }
        return prevCaptured;
      });

      return start;
    });
  }, [state.isScanning, targetAnglesCount]);

  useEffect(() => {
    if (state.isScanning && state.hasPermission) {
      window.addEventListener('deviceorientation', handleOrientation, true);
    }
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, [state.isScanning, state.hasPermission, handleOrientation]);

  const resetScan = () => {
    setStartAngle(null);
    setCapturedAngles([]);
    setState(prev => ({ ...prev, progress: 0, currentAngle: 0 }));
  };

  const forceCapture = () => {
    // Manually force a capture step if gyroscope is not working/moving
    setCapturedAngles(prev => {
      if (prev.length < targetAnglesCount) {
        const next = [...prev, prev.length];
        setState(s => ({ ...s, progress: (next.length / targetAnglesCount) * 100 }));
        return next;
      }
      return prev;
    });
  };

  return {
    ...state,
    requestPermission,
    resetScan,
    forceCapture,
    capturedCount: capturedAngles.length
  };
}
