/**
 * useARGestures.ts — Touch Gesture Handler for WebXR AR
 *
 * Handles touch gestures on the DOM overlay element:
 *   - Pinch (2 fingers): scale the dish up or down (0.15x – 4x)
 *   - Two-finger twist: rotate dish on Y axis
 *   - Double-tap: re-place dish on new surface
 *
 * In WebXR, you cannot listen to touch events on the WebGL canvas.
 * You must use the DOM overlay element that floats over the camera feed.
 */

export interface GestureState {
  scale    : number;
  rotation : number;
}

export function createARGestures(overlayElement: HTMLElement) {
  const state: GestureState = { scale: 1, rotation: 0 };
  let lastPinchDist = 0;
  let lastAngle     = 0;
  let isTwoFinger   = false;

  const getTouchDistance = (t1: Touch, t2: Touch) =>
    Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);

  const getTouchAngle = (t1: Touch, t2: Touch) =>
    Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX);

  const onTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 2) {
      isTwoFinger   = true;
      lastPinchDist = getTouchDistance(e.touches[0], e.touches[1]);
      lastAngle     = getTouchAngle(e.touches[0], e.touches[1]);
    }
  };

  const onTouchMove = (e: TouchEvent) => {
    if (e.touches.length !== 2 || !isTwoFinger) return;

    const t1 = e.touches[0];
    const t2 = e.touches[1];

    // ── Pinch to Scale ──────────────────────────────────────────
    const dist  = getTouchDistance(t1, t2);
    const ratio = dist / lastPinchDist;
    state.scale = Math.max(0.15, Math.min(4.0, state.scale * ratio));
    lastPinchDist = dist;

    // ── Twist to Rotate ─────────────────────────────────────────
    const angle = getTouchAngle(t1, t2);
    const delta = angle - lastAngle;
    state.rotation += delta;
    lastAngle = angle;
  };

  const onTouchEnd = () => {
    isTwoFinger = false;
  };

  // Attach listeners
  overlayElement.addEventListener('touchstart', onTouchStart, { passive: true });
  overlayElement.addEventListener('touchmove',  onTouchMove,  { passive: true });
  overlayElement.addEventListener('touchend',   onTouchEnd,   { passive: true });

  return {
    getState: () => state,
    reset: () => {
      state.scale    = 1;
      state.rotation = 0;
    },
    destroy: () => {
      overlayElement.removeEventListener('touchstart', onTouchStart);
      overlayElement.removeEventListener('touchmove',  onTouchMove);
      overlayElement.removeEventListener('touchend',   onTouchEnd);
    },
  };
}
