/**
 * WebXRViewer.tsx — Full WebXR Immersive-AR Viewer (Tier 1)
 *
 * The most advanced AR viewer for VISIONO.
 * Features:
 *   - TRUE 6DOF tracking — dish stays locked to real-world surface
 *   - XR Hit Test — detects real table/floor surfaces
 *   - Light Estimation — matches real environment lighting
 *   - 360° viewing — walk around, crouch below, look from above
 *   - Pinch-to-scale + Two-finger-rotate gestures
 *   - Double-tap to re-place dish
 *   - DOM Overlay HUD with dish info
 *   - Shadow plane for realistic grounding
 *   - 60fps on mid-range devices
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { startXRSession } from '../../hooks/3d/useWebXRSession';
import { loadGLBModel, clearModelCache } from '../../lib/3d/modelLoader';
import { setupDefaultLighting, applyXRLightEstimation } from '../../hooks/3d/useLightEstimation';
import { createReticle, processHitTest } from '../../hooks/3d/useHitTest';
import { createARGestures } from '../../hooks/3d/useARGestures';
import { ARHud } from './ARHud';

interface WebXRViewerProps {
  modelUrl     : string;
  dishName     : string;
  price        : string;
  primaryColor : string;
  lang         : 'ar' | 'en';
  onClose      : () => void;
}

export default function WebXRViewer({
  modelUrl, dishName, price, primaryColor, lang, onClose,
}: WebXRViewerProps) {
  const overlayRef   = useRef<HTMLDivElement>(null);
  const [isPlaced, setIsPlaced]     = useState(false);
  const [isScanning, setIsScanning] = useState(true);
  const sessionRef   = useRef<any>(null);
  const gesturesRef  = useRef<ReturnType<typeof createARGestures> | null>(null);
  const sceneRef     = useRef<{model: THREE.Group; shadow: THREE.Mesh; reticle: THREE.Group} | null>(null);

  const launchAR = useCallback(async () => {
    try {
      // Wait for overlay ref to be ready
      await new Promise((r) => setTimeout(r, 100));

      // ── 1. Start WebXR Session ──────────────────────────────────
      console.log('[WebXR] Launching immersive-ar session');
      const { session, renderer, scene, camera, refSpace, canvas } =
        await startXRSession({
          overlayRoot  : overlayRef.current || undefined,
          primaryColor,
          onSessionEnd : onClose,
        });
      sessionRef.current = session;

      // ── 2. Setup Lighting ───────────────────────────────────────
      setupDefaultLighting(scene, primaryColor);

      // Try to get light probe for real-world lighting
      let lightProbe: any = null;
      if (session.requestLightProbe) {
        try {
          lightProbe = await session.requestLightProbe();
        } catch {
          // Light estimation not available
        }
      }

      // ── 3. Create Reticle ───────────────────────────────────────
      const reticle = createReticle(primaryColor);
      reticle.visible = false;
      scene.add(reticle);

      // ── 4. Shadow Plane (invisible, receives shadows only) ──────
      const shadowPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(4, 4),
        new THREE.ShadowMaterial({ opacity: 0.35, transparent: true }),
      );
      shadowPlane.rotation.x = -Math.PI / 2;
      shadowPlane.receiveShadow = true;
      shadowPlane.visible = false;
      scene.add(shadowPlane);

      // ── 5. Load 3D Model ────────────────────────────────────────
      const model = await loadGLBModel(modelUrl);
      model.visible = false;
      scene.add(model);

      // Store in ref so handleReset can access them
      sceneRef.current = { model, shadow: shadowPlane, reticle };

      // ── 6. Request Hit Test Source ──────────────────────────────
      let hitTestSource: any = null;
      try {
        const viewerSpace = await session.requestReferenceSpace('viewer');
        hitTestSource = await session.requestHitTestSource({ space: viewerSpace });
      } catch {
        console.warn('[VISIONO AR] Hit test not available');
      }

      // ── 7. Setup Gestures ───────────────────────────────────────
      if (overlayRef.current) {
        gesturesRef.current = createARGestures(overlayRef.current);
      }

      // ── 8. Placement State ──────────────────────────────────────
      let placed = false;
      let lastTap = 0;

      // Select event (tap on screen)
      session.addEventListener('select', () => {
        const now = Date.now();

        if (now - lastTap < 350) {
          console.log('[WebXR] Double-tap → re-placing dish');
          placed = false;
          setIsPlaced(false);
          setIsScanning(true);
          model.visible = false;
          shadowPlane.visible = false;
          reticle.visible = true;
          gesturesRef.current?.reset();
        } else if (!placed && reticle.visible) {
          console.log('[WebXR] Placing dish on detected surface');
          model.position.copy(reticle.position);
          model.visible = true;

          shadowPlane.position.copy(reticle.position);
          shadowPlane.visible = true;

          reticle.visible = false;
          placed = true;
          setIsPlaced(true);
          setIsScanning(false);
        }

        lastTap = now;
      });

      // ── 9. Main Render Loop ─────────────────────────────────────
      renderer.setAnimationLoop((_timestamp: number, xrFrame: any) => {
        if (!xrFrame) return;

        // Hit testing (when dish not placed)
        if (!placed && hitTestSource) {
          processHitTest(xrFrame, hitTestSource, refSpace, reticle);
        }

        // Light estimation update (every frame)
        if (lightProbe) {
          applyXRLightEstimation(scene, lightProbe, xrFrame);
        }

        // Apply gesture transforms to placed model
        if (placed && gesturesRef.current) {
          const g = gesturesRef.current.getState();
          model.scale.setScalar(0.22 * g.scale); // Maintain real-world base scale
          model.rotation.y = g.rotation;
        }

        renderer.render(scene, camera);
      });

    } catch (err) {
      console.error('[WebXR] Launch failed:', err);
      onClose();
    }
  }, [modelUrl, primaryColor, onClose]);

  // ── Launch on mount ─────────────────────────────────────────────
  useEffect(() => {
    launchAR();
    return () => {
      sessionRef.current?.end().catch(() => {});
      gesturesRef.current?.destroy();
      clearModelCache();
    };
  }, [launchAR]);

  // ── Reset handler for HUD ───────────────────────────────────────
  const handleReset = useCallback(() => {
    const objs = sceneRef.current;
    if (objs) {
      objs.model.visible = false;
      objs.shadow.visible = false;
      objs.reticle.visible = true;
    }
    setIsPlaced(false);
    setIsScanning(true);
  }, []);

  return (
    <ARHud
      overlayRef={overlayRef}
      dishName={dishName}
      price={price}
      primaryColor={primaryColor}
      lang={lang}
      isPlaced={isPlaced}
      isScanning={isScanning}
      onClose={() => {
        sessionRef.current?.end().catch(() => {});
        onClose();
      }}
      onReset={handleReset}
    />
  );
}
