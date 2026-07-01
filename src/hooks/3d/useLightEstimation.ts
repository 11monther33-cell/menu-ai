/**
 * useLightEstimation.ts — Real-World Lighting for WebXR
 *
 * CRITICAL for photorealism.
 * Reads the real environment's lighting from the device sensor
 * and applies it to the Three.js scene.
 *
 * Without this: dish looks "pasted on" — wrong shadows, wrong colors.
 * With this   : dish blends naturally with the real table.
 */

import * as THREE from 'three';

/**
 * Setup default studio-quality lighting for AR scenes.
 * Used when light estimation is unavailable or before it starts.
 */
export function setupDefaultLighting(scene: THREE.Scene, brandColor: string = '#C9A84C'): void {
  const pc = new THREE.Color(brandColor);

  // Ambient — soft fill
  const ambient = new THREE.AmbientLight(0xffeedd, 0.4);
  ambient.name = 'ar-ambient';
  scene.add(ambient);

  // Key — warm top-right (main light source)
  const key = new THREE.DirectionalLight(0xfff8e0, 1.8);
  key.name = 'ar-key';
  key.position.set(3, 6, 4);
  key.castShadow = true;
  key.shadow.mapSize.setScalar(2048);
  key.shadow.camera.near   = 0.01;
  key.shadow.camera.far    = 20;
  key.shadow.camera.left   = -1.5;
  key.shadow.camera.bottom = -1.5;
  key.shadow.camera.right  = 1.5;
  key.shadow.camera.top    = 1.5;
  key.shadow.bias = -0.001;
  scene.add(key);

  // Fill — cool blue from left
  const fill = new THREE.DirectionalLight(0x9ab0ff, 0.5);
  fill.name = 'ar-fill';
  fill.position.set(-4, 2, -2);
  scene.add(fill);

  // Rim — brand color glow from behind/below
  const rim = new THREE.PointLight(pc, 0.8, 8);
  rim.name = 'ar-rim';
  rim.position.set(0, -0.5, -2.5);
  scene.add(rim);
}

/**
 * Remove all AR lights from scene
 */
export function removeARLights(scene: THREE.Scene): void {
  const names = ['ar-ambient', 'ar-key', 'ar-fill', 'ar-rim'];
  const toRemove: THREE.Object3D[] = [];
  scene.traverse((child) => {
    if (names.includes(child.name)) toRemove.push(child);
  });
  toRemove.forEach((obj) => scene.remove(obj));
}

/**
 * Apply XR light estimation when available.
 * This reads the real environment's lighting and creates
 * a directional light that matches the real-world sun/lamp direction.
 */
export function applyXRLightEstimation(
  scene: THREE.Scene,
  lightProbe: any, // XRLightProbe
  frame: any,      // XRFrame
): void {
  if (!frame || !lightProbe) return;

  try {
    const estimate = frame.getLightEstimate?.(lightProbe);
    if (!estimate) return;

    // Get primary light direction and intensity
    const { primaryLightDirection, primaryLightIntensity } = estimate;

    // Find or create the estimated directional light
    let estLight = scene.getObjectByName('xr-estimated-light') as THREE.DirectionalLight | undefined;
    if (!estLight) {
      // First time: remove defaults and create estimated light
      removeARLights(scene);

      estLight = new THREE.DirectionalLight(0xffffff, 1.0);
      estLight.name = 'xr-estimated-light';
      estLight.castShadow = true;
      estLight.shadow.mapSize.setScalar(1024);
      estLight.shadow.bias = -0.001;
      scene.add(estLight);

      // Keep a soft ambient for fill
      const ambient = new THREE.AmbientLight(0xffffff, 0.3);
      ambient.name = 'xr-estimated-ambient';
      scene.add(ambient);
    }

    // Update light direction from real world
    if (primaryLightDirection) {
      estLight.position.set(
        -primaryLightDirection.x,
        -primaryLightDirection.y,
        -primaryLightDirection.z,
      );
    }

    // Update light intensity and color from real world
    if (primaryLightIntensity) {
      const r = primaryLightIntensity.x;
      const g = primaryLightIntensity.y;
      const b = primaryLightIntensity.z;
      const maxIntensity = Math.max(r, g, b, 0.001);
      estLight.intensity = Math.min(maxIntensity * 2, 3.0);
      estLight.color.setRGB(r / maxIntensity, g / maxIntensity, b / maxIntensity);
    }
  } catch {
    // Light estimation not available — defaults are fine
  }
}
