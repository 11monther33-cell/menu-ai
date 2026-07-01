/**
 * modelLoader.ts — VISIONO Optimized GLB/GLTF Loader
 *
 * Features:
 *   - DRACO decompression for smaller files
 *   - In-memory cache (second open = instant)
 *   - Automatic normalization to real-world scale (~22cm plate)
 *   - Shadow casting enabled on all meshes
 *   - PBR material quality boost (anisotropy, envMap)
 */

import * as THREE from 'three';
import { GLTFLoader }  from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

// ── Cache ────────────────────────────────────────────────────────
const modelCache = new Map<string, THREE.Group>();

// ── Shared Loaders (reused across all loads) ─────────────────────
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

/**
 * Load a GLB model, normalize it to real-world size, enable shadows,
 * and boost PBR material quality. Results are cached.
 *
 * @param url        - URL to the .glb or .gltf file
 * @param targetSize - desired max dimension in meters (default 0.22m ≈ dinner plate)
 * @param onProgress - optional progress callback (0-100)
 */
export async function loadGLBModel(
  url         : string,
  targetSize  : number = 0.22,
  onProgress? : (pct: number) => void,
): Promise<THREE.Group> {

  // Return cached clone instantly
  if (modelCache.has(url)) {
    return modelCache.get(url)!.clone();
  }

  return new Promise((resolve, reject) => {
    gltfLoader.load(
      url,
      (gltf) => {
        const model = gltf.scene;

        // ── 1. Normalize scale to real-world size ─────────────────
        const box    = new THREE.Box3().setFromObject(model);
        const size   = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale  = targetSize / maxDim;

        // Center horizontally, sit on ground (Y=0)
        model.position.sub(center);
        model.position.y += (size.y * scale) / 2;
        model.scale.setScalar(scale);

        // ── 2. Enable shadows + boost PBR quality ─────────────────
        model.traverse((child) => {
          if (!(child instanceof THREE.Mesh)) return;
          child.castShadow    = true;
          child.receiveShadow = true;

          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach((mat) => {
            if (mat instanceof THREE.MeshStandardMaterial) {
              mat.envMapIntensity = 1.5;
              if (mat.map) {
                mat.map.anisotropy = 16;
              }
              mat.needsUpdate = true;
            }
          });
        });

        // ── 3. Cache for reuse ────────────────────────────────────
        modelCache.set(url, model);
        resolve(model.clone());
      },
      (event) => {
        if (onProgress && event.total > 0) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      },
      (error) => reject(error),
    );
  });
}

/**
 * Clear the model cache (useful when memory is tight)
 */
export function clearModelCache(): void {
  modelCache.forEach((model) => {
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry?.dispose();
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((m) => m?.dispose());
      }
    });
  });
  modelCache.clear();
}
