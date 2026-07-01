/**
 * useThreeEngine.ts — VISIONO Core 3D Engine
 * Web-based. Zero app download. Works on any phone browser.
 * Uses Three.js + WebGL2 + PBR lighting + GLB models.
 *
 * Security fixes applied:
 *  - THREE.Color inside useEffect (not top-level render)
 *  - DRACOLoader disposed on cleanup
 *  - parent null-check
 *  - Resize observer cleanup
 */

import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls }  from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader }     from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader }    from 'three/examples/jsm/loaders/DRACOLoader.js';

export type ViewerMode = 'rotate' | 'zoom' | 'xray' | 'ar';

export interface UseThreeEngineOptions {
  canvasRef    : React.RefObject<HTMLCanvasElement | null>;
  modelUrl     : string;
  primaryColor : string;           // hex e.g. "#C9A84C"
  onLoad       : () => void;
  onProgress   : (pct: number) => void;
  onError      : (msg: string) => void;
}

export interface ThreeEngineAPI {
  setMode       : (mode: ViewerMode) => void;
  captureFrame  : () => string;              // returns data-URL PNG
  resetCamera   : () => void;
  setAutoRotate : (on: boolean) => void;
  getPolyCount  : () => number;
  requestGyro   : () => Promise<boolean>;
  stopGyro      : () => void;
}

export function useThreeEngine(opts: UseThreeEngineOptions): ThreeEngineAPI {
  const { canvasRef, modelUrl, primaryColor, onLoad, onProgress, onError } = opts;

  const rendererRef  = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef     = useRef<THREE.Scene | null>(null);
  const cameraRef    = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef  = useRef<OrbitControls | null>(null);
  const modelRef     = useRef<THREE.Group | null>(null);
  const frameRef     = useRef<number>(0);
  const autoRotRef   = useRef(true);
  const resumeTimer  = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const polyCount    = useRef(0);

  // Gyro state
  const gyroActiveRef = useRef(false);
  const initialAlphaRef = useRef<number | null>(null);
  const targetGyroYRef = useRef(0);
  const gyroHandlerRef = useRef<((e: DeviceOrientationEvent) => void) | null>(null);

  // ── PUBLIC API ──────────────────────────────────────────────────
  const setMode = useCallback((mode: ViewerMode) => {
    if (!modelRef.current) return;
    modelRef.current.traverse(child => {
      if (!(child instanceof THREE.Mesh)) return;
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      mats.forEach(mat => {
        if (mat instanceof THREE.MeshStandardMaterial) {
          mat.wireframe = mode === 'xray';
          mat.needsUpdate = true;
        }
      });
    });
  }, []);

  const captureFrame = useCallback((): string => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return '';
    rendererRef.current.render(sceneRef.current, cameraRef.current);
    return rendererRef.current.domElement.toDataURL('image/png');
  }, []);

  const resetCamera = useCallback(() => {
    if (!cameraRef.current || !controlsRef.current || !modelRef.current) return;
    const box   = new THREE.Box3().setFromObject(modelRef.current);
    const ctr   = box.getCenter(new THREE.Vector3());
    const size  = box.getSize(new THREE.Vector3());
    const dist  = Math.max(size.x, size.y, size.z) * 2.0;
    cameraRef.current.position.set(ctr.x, ctr.y + size.y * 0.3, ctr.z + dist);
    controlsRef.current.target.copy(ctr);
    controlsRef.current.update();
  }, []);

  const setAutoRotate = useCallback((on: boolean) => {
    autoRotRef.current = on;
  }, []);

  const getPolyCount = useCallback(() => polyCount.current, []);

  const handleOrientation = useCallback((e: DeviceOrientationEvent) => {
    if (e.alpha === null || e.gamma === null) return;
    
    // alpha: 0-360 (compass direction)
    // gamma: -90 to 90 (left/right tilt)
    if (initialAlphaRef.current === null) {
      initialAlphaRef.current = e.alpha;
    }
    
    let deltaAlpha = e.alpha - initialAlphaRef.current;
    if (deltaAlpha > 180) deltaAlpha -= 360;
    if (deltaAlpha < -180) deltaAlpha += 360;

    // Combine alpha (turning body) and gamma (tilting hand) for natural interaction
    // We reverse gamma so tilting right shows the right side of the object
    const rotationRad = THREE.MathUtils.degToRad(deltaAlpha - (e.gamma * 1.5));
    targetGyroYRef.current = rotationRad;
  }, []);

  const requestGyro = useCallback(async (): Promise<boolean> => {
    try {
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        if (permission !== 'granted') return false;
      }
      
      initialAlphaRef.current = null;
      targetGyroYRef.current = 0;
      gyroActiveRef.current = true;
      autoRotRef.current = false; // Disable auto-rotate when gyro is on

      if (!gyroHandlerRef.current) {
        gyroHandlerRef.current = handleOrientation;
        window.addEventListener('deviceorientation', handleOrientation);
      }
      return true;
    } catch (e) {
      console.error('Gyro error:', e);
      return false;
    }
  }, [handleOrientation]);

  const stopGyro = useCallback(() => {
    gyroActiveRef.current = false;
    if (gyroHandlerRef.current) {
      window.removeEventListener('deviceorientation', gyroHandlerRef.current);
      gyroHandlerRef.current = null;
    }
  }, []);

  // ── MAIN EFFECT ─────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    // Parse primary color inside effect (not during render)
    const pc = new THREE.Color(primaryColor);

    // ─ Renderer ────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias    : true,
      alpha        : false,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(parent.clientWidth, parent.clientHeight);
    renderer.setClearColor(0x0a0a0e);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping      = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.shadowMap.enabled   = true;
    renderer.shadowMap.type      = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // ─ Scene ───────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // ─ Camera ──────────────────────────────────────────────────────
    const W = parent.clientWidth;
    const H = parent.clientHeight;
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.01, 200);
    camera.position.set(0, 1.5, 4);
    cameraRef.current = camera;

    // ─ Lighting: 4-point professional studio setup ──────────────────
    // 1. Ambient — soft global fill
    scene.add(new THREE.AmbientLight(0xffeedd, 0.45));

    // 2. Key light — warm main light from top-right
    const key = new THREE.DirectionalLight(0xfff5e0, 2.0);
    key.position.set(4, 8, 5);
    key.castShadow = true;
    key.shadow.mapSize.setScalar(2048);
    key.shadow.camera.near = 0.1;
    key.shadow.camera.far  = 50;
    key.shadow.camera.left = key.shadow.camera.bottom = -4;
    key.shadow.camera.right = key.shadow.camera.top   = 4;
    key.shadow.bias = -0.001;
    scene.add(key);

    // 3. Fill light — cool blue from left, no shadow
    const fill = new THREE.DirectionalLight(0x88aaff, 0.6);
    fill.position.set(-5, 3, -3);
    scene.add(fill);

    // 4. Rim / backlight — brand color glow from behind
    const rim = new THREE.PointLight(pc, 1.0, 12);
    rim.position.set(0, 0.5, -3.5);
    scene.add(rim);

    // 5. Ground bounce
    const hemi = new THREE.HemisphereLight(0x443322, 0x0a0a0e, 0.35);
    scene.add(hemi);

    // ─ Ground plane (receives shadows only) ────────────────────────
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(3, 64),
      new THREE.MeshStandardMaterial({
        color: 0x111111,
        roughness: 0.9,
        metalness: 0.0,
      })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // ─ OrbitControls ───────────────────────────────────────────────
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping    = true;
    controls.dampingFactor    = 0.06;
    controls.enablePan        = false;
    controls.enableRotate     = false;   // User requested to disable finger swiping
    controls.minDistance      = 0.8;
    controls.maxDistance      = 10;
    controls.minPolarAngle    = Math.PI * 0.05;
    controls.maxPolarAngle    = Math.PI * 0.88;
    controls.autoRotate       = false;   // We handle it manually
    controlsRef.current = controls;

    controls.addEventListener('start', () => {
      autoRotRef.current = false;
      stopGyro(); // Stop gyro if user manually interacts
      clearTimeout(resumeTimer.current);
    });
    controls.addEventListener('end', () => {
      resumeTimer.current = setTimeout(() => { autoRotRef.current = true; }, 3500);
    });

    // ─ Load GLB / GLTF model ───────────────────────────────────────
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');

    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);

    loader.load(
      modelUrl,
      (gltf) => {
        const model = gltf.scene;

        // Count polygons
        let tris = 0;
        model.traverse(child => {
          if (child instanceof THREE.Mesh) {
            const geo = child.geometry;
            tris += geo.index
              ? geo.index.count / 3
              : geo.attributes.position.count / 3;
            child.castShadow    = true;
            child.receiveShadow = true;

            // Boost PBR quality
            const mats = Array.isArray(child.material) ? child.material : [child.material];
            mats.forEach(mat => {
              if (mat instanceof THREE.MeshStandardMaterial) {
                mat.envMapIntensity = 1.3;
                if (mat.map) mat.map.anisotropy = renderer.capabilities.getMaxAnisotropy();
              }
            });
          }
        });
        polyCount.current = Math.round(tris);

        // ── Center and normalize model to unit bounding box ─────────
        const box    = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size   = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale  = 2.0 / maxDim;

        model.position.sub(center);
        model.position.y += size.y * scale * 0.5;
        model.scale.setScalar(scale);

        scene.add(model);
        modelRef.current = model as THREE.Group;

        // Fit camera
        const fov  = camera.fov * (Math.PI / 180);
        const fovH = 2 * Math.atan(Math.tan(fov / 2) * camera.aspect);
        const dV   = (size.y * scale) / (2 * Math.tan(fov / 2));
        const dH   = (size.x * scale) / (2 * Math.tan(fovH / 2));
        camera.position.z = Math.max(dV, dH) * 1.45;

        controls.target.set(0, 0, 0);
        controls.update();

        onLoad();
      },
      event => {
        const pct = event.total > 0 ? Math.round((event.loaded / event.total) * 100) : 0;
        onProgress(pct);
      },
      (err) => {
        const msg = err instanceof Error ? err.message : 'Model load failed';
        onError(msg);
      }
    );

    // ─ Animation loop ───────────────────────────────────────────────
    let t = 0;
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      t += 0.012;

      if (autoRotRef.current && modelRef.current && !gyroActiveRef.current) {
        modelRef.current.rotation.y += 0.007;
      }

      if (gyroActiveRef.current && modelRef.current) {
        // Smoothly interpolate to target gyro rotation (lerp)
        modelRef.current.rotation.y += (targetGyroYRef.current - modelRef.current.rotation.y) * 0.1;
      }

      // Subtle float
      if (modelRef.current) {
        modelRef.current.position.y += Math.sin(t) * 0.0004;
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // ─ Resize ───────────────────────────────────────────────────────
    const onResize = () => {
      const rW = parent.clientWidth;
      const rH = parent.clientHeight;
      camera.aspect = rW / rH;
      camera.updateProjectionMatrix();
      renderer.setSize(rW, rH);
    };
    window.addEventListener('resize', onResize);

    // ─ Cleanup ──────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(frameRef.current);
      clearTimeout(resumeTimer.current);
      window.removeEventListener('resize', onResize);
      controls.dispose();
      dracoLoader.dispose();
      renderer.dispose();

      // Dispose all geometries and materials
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose();
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach(m => m?.dispose());
        }
      });
      stopGyro();
      scene.clear();
    };
  }, [modelUrl, primaryColor, stopGyro]);

  return { setMode, captureFrame, resetCamera, setAutoRotate, getPolyCount, requestGyro, stopGyro };
}
