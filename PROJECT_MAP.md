# PROJECT MAP — TableX AR

## [TECH_STACK]
- **Frontend:** React 19 + TypeScript + Vite 6
- **Styling:** Tailwind CSS v4
- **State:** Zustand 5
- **3D Engine:** Three.js 0.183 + @google/model-viewer 4.2
- **AR:** WebXR API (immersive-ar), model-viewer (Quick Look / Scene Viewer)
- **Backend:** Express + Supabase + Cloudflare R2
- **I18n:** i18next (ar/en)

## [SYSTEM_FLOW]
```
User clicks "View in 3D/AR"
  → ARLauncher detects device capability
    ├─ Tier 1 (WebXR): WebXRViewer — full 6DOF AR with hit-testing
    ├─ Tier 2 (Mobile): ARViewerPanel — model-viewer (Quick Look / Scene Viewer)
    └─ Tier 3 (Desktop): DesktopARViewer — webcam + model overlay

User clicks "360° Scan"
  → ARScanner opens camera
  → Records video + gyroscope data
  → Uploads video to server
  → Returns demo GLB model

3D Viewer (ThreeDViewerFull)
  → useThreeEngine loads GLB via Draco decompression
  → OrbitControls for rotate/zoom
  → X-Ray wireframe mode
  → Snap-to-share (canvas capture → PNG card)
```

## [ARCHITECTURE]
```
src/
├── components/
│   ├── 3d/                    # AR viewers
│   │   ├── ARHud.tsx          # WebXR DOM overlay UI
│   │   ├── ARLauncher.tsx     # Smart tier detection & dispatch
│   │   ├── ARViewerPanel.tsx  # model-viewer AR wrapper
│   │   ├── DesktopARViewer.tsx# Webcam + model overlay
│   │   ├── ThreeDViewerFull.tsx # Full 3D viewer with modes
│   │   └── WebXRViewer.tsx    # Full WebXR immersive AR
│   ├── ARScanner.tsx          # 360° dish scanner (video + gyro)
│   ├── ThreeDViewer.tsx       # Simple model-viewer wrapper
│   ├── ThreeViewer.tsx        # Another model-viewer wrapper (legacy)
│   └── dish/ThreeDUploader.tsx # 3D model upload + AR preview
├── hooks/
│   ├── 3d/
│   │   ├── useARGestures.ts    # Pinch/rotate for WebXR
│   │   ├── useHitTest.ts       # Surface detection
│   │   ├── useLightEstimation.ts # Real-world lighting
│   │   └── useWebXRSession.ts # XR session lifecycle
│   └── useThreeEngine.ts      # Core Three.js engine hook
└── lib/
    └── 3d/modelLoader.ts      # GLB/GLTF loader with Draco cache
```

## [ORPHANS & PENDING]
- [x] **Bug: WebXRViewer stale `isScanning` closure** — FIXED: removed stale check
- [x] **Bug: DesktopARViewer stream cleanup leak** — FIXED: using ref instead of state
- [x] **Bug: ARScanner fake model generation** — FIXED: uploads video, returns demo model
- [x] **Bug: useThreeEngine hardcoded Arabic error** — FIXED: passes actual error message
- [x] **Bug: ThreeDViewerFull stale `handleSnap` in `handleModeChange`** — FIXED: added dep
- [ ] **Duplicate `modelLoader.ts` and `useThreeEngine` have overlapping GLB loading logic**
- [ ] **No `ThreeDViewer.tsx` usage — candidate for removal if confirmed unused**
- [ ] **`ARScanner` only returns demo `/dish.glb` — true photogrammetry requires server-side service**
- [ ] **DesktopARViewer lacks ARKit/ARCore fallback markers (fiducial)**
