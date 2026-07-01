/**
 * useWebXRSession.ts — WebXR Session Lifecycle Manager
 *
 * Manages the full lifecycle of a WebXR immersive-ar session:
 *   - Request session with required/optional features
 *   - Create WebGL2 renderer configured for XR
 *   - Handle session end gracefully
 */

import * as THREE from 'three';

export interface XRSessionConfig {
  overlayRoot?  : HTMLElement;
  primaryColor  : string;
  onSessionEnd  : () => void;
}

export interface XRSessionResult {
  session   : any;  // XRSession
  renderer  : THREE.WebGLRenderer;
  scene     : THREE.Scene;
  camera    : THREE.PerspectiveCamera;
  refSpace  : any;  // XRReferenceSpace
  canvas    : HTMLCanvasElement;
}

/**
 * Start a WebXR immersive-ar session.
 * Returns the renderer, scene, camera, and reference space.
 */
export async function startXRSession(config: XRSessionConfig): Promise<XRSessionResult> {
  const { overlayRoot, onSessionEnd } = config;

  if (!navigator.xr) {
    throw new Error('WebXR not available');
  }

  // ── Request session with all useful features ────────────────────
  const sessionInit: any = {
    requiredFeatures: ['hit-test'],
    optionalFeatures: [
      'anchors',
      'light-estimation',
      'dom-overlay',
      'depth-sensing',
    ],
  };

  if (overlayRoot) {
    sessionInit.domOverlay = { root: overlayRoot };
  }

  const session = await (navigator.xr as any).requestSession('immersive-ar', sessionInit);

  // ── Create canvas and WebGL2 renderer ───────────────────────────
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.zIndex = '9998';
  document.body.appendChild(canvas);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha            : true,    // Transparent → camera shows through
    antialias        : true,
    powerPreference  : 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  renderer.xr.setSession(session);
  renderer.outputColorSpace       = THREE.SRGBColorSpace;
  renderer.toneMapping            = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure    = 1.0;
  renderer.shadowMap.enabled      = true;
  renderer.shadowMap.type         = THREE.PCFSoftShadowMap;

  // ── Scene ───────────────────────────────────────────────────────
  const scene = new THREE.Scene();

  // ── Camera (XR overrides this every frame with real pose) ───────
  const camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.01,
    100,
  );

  // ── Reference space ─────────────────────────────────────────────
  const refSpace = await session.requestReferenceSpace('local');

  // ── Session end handler ─────────────────────────────────────────
  session.addEventListener('end', () => {
    renderer.setAnimationLoop(null);
    canvas.remove();
    renderer.dispose();
    onSessionEnd();
  });

  return { session, renderer, scene, camera, refSpace, canvas };
}

/**
 * Detect if the device supports WebXR immersive-ar.
 */
export async function isWebXRSupported(): Promise<boolean> {
  if (!navigator.xr) return false;
  try {
    return await (navigator.xr as any).isSessionSupported('immersive-ar');
  } catch {
    return false;
  }
}
