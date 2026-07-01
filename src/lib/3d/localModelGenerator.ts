/**
 * localModelGenerator.ts — VISIONO Local 3D Model Generator
 *
 * يولّد نماذج GLB ثلاثية الأبعاد محلياً في المتصفح بدون أي API خارجي.
 * 
 * الخوارزمية:
 *   1. يأخذ الصورة الرئيسية للطبق
 *   2. يولّد خريطة عمق (Height Map) من السطوع
 *   3. ينعّم الخريطة بـ Gaussian Blur
 *   4. يبني شبكة هندسية دائرية (Circular PlaneGeometry)
 *   5. يزيح الفقرات (Vertices) حسب خريطة العمق
 *   6. يطبّق الصورة كـ Texture
 *   7. يضيف قاعدة (صحن)
 *   8. يصدّر كملف GLB
 *
 * النتيجة: نموذج 2.5D واقعي يعمل في كل مكان (AR, 3D Viewer, model-viewer)
 */

import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

// ── Types ─────────────────────────────────────────────────────────
export interface GenerationResult {
  blobUrl : string;
  blob    : Blob;
}

// ── Main Generator ────────────────────────────────────────────────
export async function generateLocalModel(
  images      : string[],            // Array of base64 data URLs
  onProgress? : (pct: number) => void,
): Promise<GenerationResult> {

  onProgress?.(5);

  // Pick primary image (last captured = usually best angle)
  const primarySrc = images[images.length - 1] || images[0];
  if (!primarySrc) throw new Error('No images provided');

  // 1. Load image
  const img = await loadImage(primarySrc);
  onProgress?.(15);

  // 2. Generate height map
  const MAP_SIZE = 128;
  const heightMap = generateHeightMap(img, MAP_SIZE);
  onProgress?.(25);

  // 3. Smooth height map (3 passes)
  smoothHeightMap(heightMap, MAP_SIZE, 3);
  onProgress?.(35);

  // 4. Create 3D scene with dish model
  const scene = new THREE.Scene();

  // 5. Build the dish mesh
  const dishGroup = buildDishModel(img, heightMap, MAP_SIZE);
  scene.add(dishGroup);
  onProgress?.(60);

  // 6. Add studio lighting
  addLighting(scene);
  onProgress?.(70);

  // 7. Export to GLB binary
  const glbBuffer = await exportGLB(scene);
  onProgress?.(90);

  // 8. Create blob URL
  const blob = new Blob([glbBuffer], { type: 'model/gltf-binary' });
  const blobUrl = URL.createObjectURL(blob);
  onProgress?.(100);

  // Clean up textures
  scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      mats.forEach(m => {
        if (m instanceof THREE.MeshStandardMaterial) {
          m.map?.dispose();
          m.normalMap?.dispose();
          m.dispose();
        }
      });
      child.geometry.dispose();
    }
  });

  return { blobUrl, blob };
}

// ── Utilities ─────────────────────────────────────────────────────

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

/**
 * Creates a height map from image brightness.
 * Brighter pixels = higher elevation (good assumption for food items).
 */
function generateHeightMap(img: HTMLImageElement, size: number): Float32Array {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Draw image centered and cropped to square
  const srcSize = Math.min(img.width, img.height);
  const sx = (img.width - srcSize) / 2;
  const sy = (img.height - srcSize) / 2;
  ctx.drawImage(img, sx, sy, srcSize, srcSize, 0, 0, size, size);

  const imageData = ctx.getImageData(0, 0, size, size);
  const pixels = imageData.data;
  const heightMap = new Float32Array(size * size);

  for (let i = 0; i < size * size; i++) {
    const r = pixels[i * 4];
    const g = pixels[i * 4 + 1];
    const b = pixels[i * 4 + 2];
    // Perceptual luminance
    heightMap[i] = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
  }

  return heightMap;
}

/**
 * Simple box blur (approximates Gaussian) for smooth displacement.
 */
function smoothHeightMap(map: Float32Array, size: number, passes: number): void {
  const tmp = new Float32Array(size * size);

  for (let pass = 0; pass < passes; pass++) {
    // Horizontal pass
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        let sum = 0;
        let count = 0;
        for (let dx = -2; dx <= 2; dx++) {
          const nx = x + dx;
          if (nx >= 0 && nx < size) {
            sum += map[y * size + nx];
            count++;
          }
        }
        tmp[y * size + x] = sum / count;
      }
    }
    // Vertical pass
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        let sum = 0;
        let count = 0;
        for (let dy = -2; dy <= 2; dy++) {
          const ny = y + dy;
          if (ny >= 0 && ny < size) {
            sum += tmp[ny * size + x];
            count++;
          }
        }
        map[y * size + x] = sum / count;
      }
    }
  }
}

/**
 * Build the dish 3D model:
 *   - Top surface: displaced circular plane with food texture
 *   - Plate rim: torus around the edge
 *   - Plate base: flat cylinder underneath
 */
function buildDishModel(
  img: HTMLImageElement,
  heightMap: Float32Array,
  mapSize: number,
): THREE.Group {
  const group = new THREE.Group();

  const PLATE_RADIUS = 0.11;       // ~22cm diameter (real plate size)
  const MAX_FOOD_HEIGHT = 0.04;    // ~4cm max food height
  const SEGMENTS = 96;             // Geometry subdivision

  // ── 1. Top surface (displaced plane) ────────────────────────────
  const geo = new THREE.PlaneGeometry(
    PLATE_RADIUS * 2, PLATE_RADIUS * 2,
    SEGMENTS, SEGMENTS
  );
  const posAttr = geo.attributes.position;

  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);
    const dist = Math.sqrt(x * x + y * y);

    if (dist <= PLATE_RADIUS) {
      // UV mapping
      const u = Math.min(mapSize - 1, Math.max(0, Math.floor(((x / PLATE_RADIUS + 1) / 2) * (mapSize - 1))));
      const v = Math.min(mapSize - 1, Math.max(0, Math.floor(((y / PLATE_RADIUS + 1) / 2) * (mapSize - 1))));

      const height = heightMap[v * mapSize + u];

      // Smooth falloff near the edge (so food doesn't clip the rim)
      const edgeFalloff = Math.pow(1 - (dist / PLATE_RADIUS), 0.8);
      const displacement = height * MAX_FOOD_HEIGHT * edgeFalloff;

      posAttr.setZ(i, displacement);
    } else {
      // Outside plate — snap down
      posAttr.setZ(i, 0);
    }
  }

  geo.computeVertexNormals();

  // Create texture from image
  const texCanvas = document.createElement('canvas');
  texCanvas.width = 1024;
  texCanvas.height = 1024;
  const texCtx = texCanvas.getContext('2d')!;
  const srcSize = Math.min(img.width, img.height);
  const sx = (img.width - srcSize) / 2;
  const sy = (img.height - srcSize) / 2;
  texCtx.drawImage(img, sx, sy, srcSize, srcSize, 0, 0, 1024, 1024);

  const texture = new THREE.CanvasTexture(texCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = false;

  // Generate a rough normal map from the height map
  const normalMap = generateNormalMap(heightMap, mapSize);

  const topMaterial = new THREE.MeshStandardMaterial({
    map: texture,
    normalMap: normalMap,
    normalScale: new THREE.Vector2(0.5, 0.5),
    roughness: 0.6,
    metalness: 0.05,
    side: THREE.FrontSide,
  });

  const topMesh = new THREE.Mesh(geo, topMaterial);
  topMesh.rotation.x = -Math.PI / 2;  // Lay flat
  topMesh.position.y = 0.005;          // Slightly above plate
  topMesh.castShadow = true;
  topMesh.receiveShadow = true;
  group.add(topMesh);

  // ── 2. Plate rim ────────────────────────────────────────────────
  const rimGeo = new THREE.TorusGeometry(PLATE_RADIUS, 0.005, 16, 64);
  const plateMat = new THREE.MeshStandardMaterial({
    color: 0xF5F0E8,
    roughness: 0.3,
    metalness: 0.1,
  });
  const rim = new THREE.Mesh(rimGeo, plateMat);
  rim.rotation.x = -Math.PI / 2;
  rim.position.y = 0.003;
  rim.castShadow = true;
  group.add(rim);

  // ── 3. Plate base ──────────────────────────────────────────────
  const baseGeo = new THREE.CylinderGeometry(
    PLATE_RADIUS, PLATE_RADIUS * 0.95, 0.006, 64
  );
  const base = new THREE.Mesh(baseGeo, plateMat.clone());
  base.position.y = 0;
  base.receiveShadow = true;
  group.add(base);

  // ── 4. Under-plate shadow catcher ──────────────────────────────
  const shadowGeo = new THREE.CircleGeometry(PLATE_RADIUS * 1.3, 64);
  const shadowMat = new THREE.ShadowMaterial({ opacity: 0.15, transparent: true });
  const shadowCatcher = new THREE.Mesh(shadowGeo, shadowMat);
  shadowCatcher.rotation.x = -Math.PI / 2;
  shadowCatcher.position.y = -0.004;
  shadowCatcher.receiveShadow = true;
  group.add(shadowCatcher);

  return group;
}

/**
 * Generate a normal map from a height map using Sobel-like gradient.
 */
function generateNormalMap(heightMap: Float32Array, size: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.createImageData(size, size);
  const data = imageData.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const left   = x > 0         ? heightMap[y * size + (x - 1)] : heightMap[y * size + x];
      const right  = x < size - 1  ? heightMap[y * size + (x + 1)] : heightMap[y * size + x];
      const top    = y > 0         ? heightMap[(y - 1) * size + x] : heightMap[y * size + x];
      const bottom = y < size - 1  ? heightMap[(y + 1) * size + x] : heightMap[y * size + x];

      // Gradient
      const dx = (right - left) * 2;
      const dy = (bottom - top) * 2;

      // Normalize
      const len = Math.sqrt(dx * dx + dy * dy + 1);
      const nx = (-dx / len) * 0.5 + 0.5;
      const ny = (-dy / len) * 0.5 + 0.5;
      const nz = (1 / len) * 0.5 + 0.5;

      const idx = (y * size + x) * 4;
      data[idx]     = Math.round(nx * 255);
      data[idx + 1] = Math.round(ny * 255);
      data[idx + 2] = Math.round(nz * 255);
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.flipY = false;
  return tex;
}

/**
 * Add professional studio lighting to the scene.
 */
function addLighting(scene: THREE.Scene): void {
  // Warm ambient
  scene.add(new THREE.AmbientLight(0xffeedd, 0.5));

  // Key light (warm, top-right)
  const key = new THREE.DirectionalLight(0xfff5e0, 1.8);
  key.position.set(3, 6, 4);
  key.castShadow = true;
  key.shadow.mapSize.setScalar(1024);
  key.shadow.bias = -0.001;
  scene.add(key);

  // Fill light (cool, left)
  const fill = new THREE.DirectionalLight(0xe0eeff, 0.6);
  fill.position.set(-3, 4, -2);
  scene.add(fill);

  // Rim light (accent, back)
  const rim = new THREE.PointLight(0xC9A84C, 0.4, 8);
  rim.position.set(0, 2, -4);
  scene.add(rim);
}

/**
 * Export Three.js scene to GLB binary using GLTFExporter.
 */
function exportGLB(scene: THREE.Scene): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const exporter = new GLTFExporter();
    exporter.parse(
      scene,
      (result) => resolve(result as ArrayBuffer),
      (error) => reject(error),
      { binary: true }
    );
  });
}
