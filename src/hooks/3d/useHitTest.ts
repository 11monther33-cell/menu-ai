/**
 * useHitTest.ts — WebXR Surface Detection Engine
 *
 * Detects real-world surfaces (tables, floors) every frame.
 * Returns a pose matrix that can be applied to a reticle mesh
 * to show the user where the dish will be placed.
 */

import * as THREE from 'three';

/**
 * Create an animated targeting reticle ring.
 * Snaps to detected surfaces and uses the restaurant's brand color.
 */
export function createReticle(primaryColor: string): THREE.Group {
  const pc = new THREE.Color(primaryColor);
  const group = new THREE.Group();
  group.name = 'ar-reticle';

  // Outer ring
  const outerGeo = new THREE.RingGeometry(0.12, 0.14, 48);
  const outerMat = new THREE.MeshBasicMaterial({
    color      : pc,
    side       : THREE.DoubleSide,
    transparent: true,
    opacity    : 0.9,
  });
  group.add(new THREE.Mesh(outerGeo, outerMat));

  // Inner dot
  const innerGeo = new THREE.RingGeometry(0.02, 0.04, 48);
  const innerMat = new THREE.MeshBasicMaterial({
    color      : pc,
    side       : THREE.DoubleSide,
    transparent: true,
    opacity    : 0.6,
  });
  group.add(new THREE.Mesh(innerGeo, innerMat));

  // Cross-hair lines (4 directions)
  const angles = [0, 90, 180, 270];
  angles.forEach((deg) => {
    const geo = new THREE.PlaneGeometry(0.06, 0.005);
    const mat = new THREE.MeshBasicMaterial({
      color      : pc,
      transparent: true,
      opacity    : 0.5,
      side       : THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geo, mat);
    const rad = (deg * Math.PI) / 180;
    mesh.rotation.z = rad;
    mesh.position.set(Math.cos(rad) * 0.08, Math.sin(rad) * 0.08, 0);
    group.add(mesh);
  });

  // Reticle lies flat on detected surface
  group.rotation.x = -Math.PI / 2;

  return group;
}

/**
 * Process hit test results from an XR frame.
 * Returns the pose of the best surface hit, or null.
 */
export function processHitTest(
  frame: any,           // XRFrame
  hitTestSource: any,   // XRHitTestSource
  refSpace: any,        // XRReferenceSpace
  reticle: THREE.Group,
): boolean {
  if (!hitTestSource || !frame.getHitTestResults) return false;

  try {
    const results = frame.getHitTestResults(hitTestSource);
    if (results.length === 0) {
      reticle.visible = false;
      return false;
    }

    const hit  = results[0];
    const pose = hit.getPose(refSpace);
    if (!pose) {
      reticle.visible = false;
      return false;
    }

    // Apply the real-world surface position to the reticle
    reticle.visible = true;
    const m = new THREE.Matrix4();
    m.fromArray(pose.transform.matrix);

    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scl = new THREE.Vector3();
    m.decompose(pos, quat, scl);

    reticle.position.copy(pos);
    // Keep reticle flat regardless of surface orientation
    // but position it at the hit point

    return true;
  } catch {
    reticle.visible = false;
    return false;
  }
}
