# FULL ENGINEERING SPEC / DEVELOPER PROMPT
## iOS Companion App — "AR Code Object Capture" for Restaurant Menu 3D Models

> Use this document as a direct prompt/spec for a developer or an AI coding agent (Claude Code, Cursor, etc.) to build the complete iOS app. Every screen, state, transition, edge case, and API contract is defined. Nothing should be left to guesswork — if something is ambiguous below, treat the explicit instruction as the source of truth.

---

## 0. CONTEXT (read first)

- This app is a **staff-only internal tool**, not a public consumer app. It will be installed on iPhones belonging to restaurant staff/photographers, sideloaded via TestFlight or an internal MDM — **not necessarily published to the public App Store**.
- Its single purpose: capture a physical object (a food dish) via 360° photo capture, reconstruct it into a 3D model **entirely on-device**, and upload the result to the restaurant's existing backend (`menu-ai`) so it can be linked to a menu item and displayed to customers via `<model-viewer>` on the web dashboard/menu page.
- **Zero dependency on any third-party 3D-generation API.** All reconstruction happens locally using Apple's native `RealityKit` / `ARKit` **Object Capture** pipeline (`ObjectCaptureSession` + `PhotogrammetrySession`), introduced in iOS 17 (guided capture UI) building on the underlying photogrammetry engine available since iOS 15/macOS 12.
- The reference screenshots this spec reproduces exactly show: (1) initial object detection with bounding dot, (2) adjustable 3D bounding box, (3) live capture with point cloud preview and "Move slowly around your object" guidance, (4) an optional "Flipping this object is not recommended" warning dialog, (5) live capture screen with running image counter (e.g. `30/0`) and shutter button, (6) a modal reconstruction progress screen ("Generating Point Cloud... 24%", ETA), (7) a completion screen ("3D Model Created", saved to `On My iPhone/AR Code/`, with "Generate an AR Code" and "View in AR" buttons), and (8) an AR preview placing the object on a real table.
- Build **your own SwiftUI wrapper around Apple's `ObjectCaptureSession` + `ObjectCapturePointCloudView` + `PhotogrammetrySession`** — do not try to reimplement point-cloud reconstruction manually. Apple's Sample App "Capturing photographs for RealityKit Object Capture" / "Building an object reconstruction app" (Apple Developer Documentation) is the canonical reference implementation; base architecture on it, then customize UI text, branding, product-linking, and auto-upload.

---

## 1. TARGET PLATFORM & MINIMUM REQUIREMENTS

| Requirement | Value |
|---|---|
| Minimum iOS version | iOS 17.0 (required for `ObjectCaptureSession` guided-capture UI API) |
| Minimum device | iPhone 12 or newer (A14 Bionic+) — required for on-device photogrammetry performance |
| Recommended device | iPhone 12 Pro / 13 Pro / 14 Pro / 15 Pro or newer **with LiDAR scanner** — LiDAR dramatically improves bounding-box detection accuracy and reconstruction quality; app must still function without LiDAR but should surface a non-blocking warning |
| Xcode version | Xcode 15.0+ |
| Swift version | Swift 5.9+ |
| Frameworks | `RealityKit`, `ARKit`, `SwiftUI`, `Combine`, `os.log`, `Network` (for connectivity checks), `BackgroundTasks` (for resumable upload) |
| Architecture support | arm64 only (Object Capture APIs are not available in Simulator — **this app cannot be tested in iOS Simulator, only on physical devices**) |
| Device orientation | Portrait only for capture screens (matches reference screenshots); allow rotation only on non-capture screens |
| Required capability flag | `arkit` under `UIRequiredDeviceCapabilities` in Info.plist |

**Hidden detail:** Object Capture APIs (`ObjectCaptureSession`, `PhotogrammetrySession`) do **not run in the iOS Simulator at all** — calling them there throws immediately. QA and CI must be done on physical hardware. Flag this clearly in the README so the developer doesn't waste time debugging a "broken" simulator build.

---

## 2. APP ARCHITECTURE

- **Pattern:** MVVM with Combine/async-await, single `NavigationStack`, no third-party dependencies required (Apple frameworks only — this keeps the app fully offline-capable except for the final upload step).
- **Folder structure:**

```
ARCodeCaptureApp/
├── App/
│   ├── ARCodeCaptureApp.swift          // @main entry point
│   └── AppState.swift                  // global app state (auth token, selected product)
├── Features/
│   ├── Auth/
│   │   ├── LoginView.swift
│   │   └── AuthViewModel.swift         // token storage via Keychain
│   ├── ProductSelection/
│   │   ├── ProductListView.swift       // fetched from backend, searchable
│   │   └── ProductListViewModel.swift
│   ├── Capture/
│   │   ├── CaptureRootView.swift       // container, drives state machine
│   │   ├── ObjectDetectionView.swift   // screen 1 (dot + Continue)
│   │   ├── BoundingBoxView.swift       // screen 2 (adjustable cube + Start Capture)
│   │   ├── CapturingView.swift         // screen 3/5 (point cloud + counter + shutter)
│   │   ├── FlipWarningView.swift       // screen 4 (modal)
│   │   ├── CaptureViewModel.swift      // wraps ObjectCaptureSession
│   │   └── CaptureGuidanceOverlay.swift// text hints, arrows, lighting warnings
│   ├── Reconstruction/
│   │   ├── ReconstructionProgressView.swift  // screen 6
│   │   ├── ReconstructionViewModel.swift     // wraps PhotogrammetrySession
│   ├── Completion/
│   │   ├── ModelCompletedView.swift    // screen 7
│   │   └── ARQuickLookPreview.swift    // screen 8 (View in AR via QLPreviewController)
│   └── Upload/
│       ├── UploadService.swift         // background URLSession upload
│       └── UploadViewModel.swift
├── Networking/
│   ├── APIClient.swift
│   ├── Endpoints.swift
│   └── DTOs/
│       ├── ProductDTO.swift
│       └── ModelUploadResponseDTO.swift
├── Persistence/
│   ├── KeychainService.swift
│   └── CaptureFileManager.swift        // handles temp dirs, cleanup, storage checks
├── Resources/
│   ├── Localizable.strings (en)
│   ├── Localizable.strings (ar)
│   └── Assets.xcassets
└── Info.plist
```

---

## 3. INFO.PLIST — REQUIRED KEYS (hidden detail most devs forget)

```xml
<key>NSCameraUsageDescription</key>
<string>This app needs camera access to capture 360° photos of menu items for 3D model generation.</string>

<key>UIRequiredDeviceCapabilities</key>
<array>
    <string>arm64</string>
    <string>arkit</string>
</array>

<key>UIBackgroundModes</key>
<array>
    <string>processing</string>   <!-- allows reconstruction/upload to continue briefly in background -->
</array>

<key>UISupportedInterfaceOrientations</key>
<array>
    <string>UIInterfaceOrientationPortrait</string>
</array>

<key>ITSAppUsesNonExemptEncryption</key>
<false/>
```

Also register a **custom URL scheme** for deep linking from the dashboard QR code:

```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>arcodecapture</string>
        </array>
    </dict>
</array>
```

Deep link format: `arcodecapture://capture?productId=<uuid>&token=<short-lived-jwt>` — dashboard generates this as a QR code so staff scan it with the Camera app, which opens the companion app pre-authenticated and pre-linked to the correct menu item (skips manual product search).

---

## 4. FULL SCREEN-BY-SCREEN STATE MACHINE

The entire capture flow is one finite state machine. Define it explicitly so no transition is ambiguous:

```swift
enum CaptureFlowState: Equatable {
    case authenticating
    case selectingProduct
    case cameraPermissionRequired
    case objectDetection          // Screen 1
    case boundingBoxAdjustment    // Screen 2
    case capturing(imageCount: Int, totalRecommended: Int)  // Screen 3/5
    case flipWarning              // Screen 4 (modal overlay, not a full transition)
    case reconstructing(progress: Double, etaSeconds: Int?) // Screen 6
    case completed(localModelURL: URL)  // Screen 7
    case uploading(progress: Double)
    case uploadSucceeded(remoteModelId: String)
    case uploadFailed(error: UploadError, retryAvailable: Bool)
    case captureFailed(reason: CaptureFailureReason)
}

enum CaptureFailureReason {
    case insufficientLighting
    case objectTooReflective
    case objectTooSmall           // below Apple's minimum object size heuristic
    case movedTooFast
    case sessionInterrupted       // e.g., phone call, app backgrounded mid-capture
    case insufficientImages       // user tapped finish too early
    case lowStorage
    case unknown(Error)
}
```

### 4.1 Screen 1 — Object Detection
- Live `ARView` camera feed via `ObjectCaptureCameraView` (Apple-provided view wrapping `ObjectCaptureSession`).
- Header: `"AR Code Object Capture"` (bold, white, centered).
- Subtitle: `"Move close and center the dot on your object, then tap Continue."`
- White pulsing dot centered on screen, snaps to detected surface once `session.state == .ready` or `.detecting`.
- Top-left `"Reset"` button — calls `session.reset()`, returns to fresh detection state, clears any partial bounding box.
- Bottom `"Continue"` button — **disabled/greyed until `session.state` confirms a stable detected object** (do not let the user proceed on a false-positive dot placement — this is a common Object Capture bug source).
- Bottom-left speaker/mute icon — toggles voice-over guidance narration (`AVSpeechSynthesizer` reading the on-screen hint aloud); persists user preference in `UserDefaults`.
- Bottom-right `"?"` help button — opens a short in-app tutorial sheet (3 illustrated steps) for first-time users; auto-shown once on first app launch, and manually accessible afterward.

### 4.2 Screen 2 — Bounding Box Adjustment
- Subtitle changes to: `"Move around to ensure that the whole object is inside the box. Drag handles to manually resize."`
- 3D wireframe cube rendered via `ObjectCaptureSession.startDetecting()` output, overlaid on the live camera feed.
- **Corner and edge handles must be draggable** (`DragGesture` mapped to `session.setBoundingBoxManually(_:)` or the equivalent RealityKit anchor resize API) — this is shown explicitly in the reference screenshots (two white circular handles visible mid-edge).
- Small heart-shaped/target indicator below the box shows the detected "center of mass" ground projection — purely visual polish matching the reference UI, not functionally required, but include for parity.
- `"Start Capture"` button transitions to `session.startCapturing()`.
- Undo/history icon (circular arrow, bottom-left next to mute) — reverts the last manual box adjustment.

### 4.3 Screen 3/5 — Live Capturing
- Subtitle: `"Move slowly around your object."`
- Real-time point cloud rendered beneath the object (colored dots accumulating as coverage increases) — use `ObjectCaptureSession.PointCloud` API to drive a `RealityKit` particle/point renderer, semi-transparent, colored by captured surface albedo when available.
- **Image counter bottom-left, format `X/Y`**: X = images captured so far, Y = images **flagged as low-quality/rejected** (blur, motion, poor exposure) by Apple's built-in per-frame quality heuristic (`session.feedback` — surfaces `.objectNotDetected`, `.objectTooClose`, `.objectTooFar`, `.movingTooFast`, `.environmentLowLight`, `.environmentTooDark`). **Surface every one of these feedback signals as a brief on-screen toast/hint** (e.g., "Move a bit farther away", "Hold steady", "Add more light") — this is critical UX from the reference app and directly affects reconstruction quality.
- Auto-triggered still capture happens on a timer/angle-delta basis (Apple's guided capture auto-shoots as you orbit; there is also a manual white shutter button bottom-right for users who prefer manual control per reference screenshot 5).
- Small circular thumbnail (bottom, gallery icon) shows the most recently captured frame — tapping opens a lightbox grid of all captured images, with ability to delete individual bad shots before finalizing (nice-to-have; if time-constrained, defer to v1.1 but leave the UI stub in place).
- Mute icon persists in same bottom-left position across all capture screens for consistency.
- **Recommended minimum images: 30–40** for `.medium` detail, up to 60–70 for `.full`. Do not let the user tap "finish" with fewer than **20 accepted images** — show a blocking alert: `"Please capture more images (at least 20) for a usable model."`

### 4.4 Flip Warning Modal (conditional)
- Triggered automatically when `session` reports the object needs a second capture orbit from a flipped angle to fill in the base/bottom, AND heuristically detects the object may be unsuitable for flipping (single-color surface, high reflectivity) — Apple surfaces this via `ObjectCaptureSession.Feedback` / boundary detection during the transition to a second capture pass.
- Numbered step indicator `① ② ③` at top shows this is part of a multi-orbit capture (bottom orbit is step 2 or 3 depending on configuration).
- Title: `"Flipping this object is not recommended."`
- Body: `"Your object may have single color surfaces or be too reflective to add more segments. Tap Continue to capture more detail without flipping, or Flip Object Anyway."`
- Two actions: primary `"Continue"` (skip flip, proceed to reconstruction with current coverage), secondary text-link `"Flip object anyway"` (re-enters capture mode for the flipped orbit).
- Top-left `"Cancel"` — aborts the entire capture session, discards all captured images, returns to Screen 1. **Must show a confirmation alert** ("Discard this capture? All photos will be deleted.") before actually discarding — do not silently delete user work.

**Hidden/practical detail specific to food items:** Most restaurant dishes (burgers, plates) sit flat on a table and genuinely **cannot** be flipped without destroying the presentation. Default guidance in your app copy should nudge staff toward tapping **"Continue"** (skip flip) rather than flipping food — add a short custom tooltip the reference Apple app doesn't have: `"Tip: For plated food, we recommend skipping the flip."`

### 4.5 Screen 6 — Reconstruction Progress (modal, non-dismissable except Cancel)
- Presented as a dark full-screen modal once capture ends (either via manual "finish" or auto-completion of the guided orbit).
- Title: `"AR Code Object Capture"`, subtitle: `"3D Modeling..."`.
- Progress row: `"Generating Point Cloud..."` label + right-aligned percentage, backed by a determinate `ProgressView` bound to `PhotogrammetrySession.Output.requestProgress(fraction:)`.
- **Reconstruction has multiple sequential phases** — do not hardcode the label to "Generating Point Cloud" the whole time. Apple's `PhotogrammetrySession` reports progress per internal stage; map at minimum these three UI labels in order as processing advances:
  1. `"Generating Point Cloud..."`
  2. `"Refining Mesh..."`
  3. `"Generating Texture..."`
  (If the underlying API only exposes a single overall fraction with no stage granularity in the SDK version used, simulate stage transitions at fraction thresholds 0–40% / 40–75% / 75–100% purely for UI purposes — but never fabricate a fraction number itself, only the stage *label*.)
- Small image icon + counter (e.g., `74`) bottom-left shows total accepted images being processed.
- `"Estimated time remaining: 03:47"` — bind to whatever ETA the API reports; if unavailable, compute a rough local estimate from elapsed time × (1 - fraction) / fraction and clearly label it as approximate.
- Footnote: `"Keep app running while processing."` — **this is a hard technical constraint**: reconstruction runs on-device and does NOT reliably continue if the app is force-quit; however, brief backgrounding (switching apps for a few seconds) is tolerated via `BGProcessingTask`. Register a `BGProcessingTaskRequest` at the start of reconstruction so iOS grants extra background execution time; still, warn the user clearly since Apple provides no hard guarantee for long processing jobs.
- `"Cancel"` top-left aborts the `PhotogrammetrySession` (`session.cancel()`), discards partial output, returns to Screen 1. Confirm before discarding, same as above.
- On `PhotogrammetrySession.Output.processingComplete`, transition to Screen 7. On `.requestError`, transition to `captureFailed` state with the mapped `CaptureFailureReason` and a **"Retry"** button that re-attempts reconstruction from the same captured image set (no need to re-shoot) before falling back to "start over."

### 4.6 Screen 7 — Completion
- Title: `"3D Model Created"`.
- Body: `"Your 3D model has been saved in the .USDZ format in the following directory: On My iPhone/AR Code/"` — mirror this exactly, but since this is a companion app (not the general Files-app demo), **also programmatically save a copy into the app's own sandboxed `Documents/` directory** (not just system Files) so the upload step has a guaranteed reliable file reference regardless of what the user does in the Files app afterward.
- Two primary actions:
  - `"Generate an AR Code"` (greyed out / secondary in the reference — this refers to Apple's separate "AR Quick Look Code" generation feature for physical signage; **out of scope for v1**, keep the button visually present but disabled with a `"Coming soon"` tooltip, OR simply omit it entirely from your build since it adds no value to the restaurant-dashboard use case).
  - `"View in AR"` (primary, blue, pill-shaped) — presents `QLPreviewController` configured for AR Quick Look so staff can immediately verify quality by placing the object on a real surface (matches reference screenshot 8, showing the reconstructed burger placed next to the original).
- **Add a new button not present in Apple's reference app** — this is the actual product requirement: `"Upload to Menu"` (or auto-trigger upload immediately on reaching this screen, with a small inline progress indicator instead of requiring a tap — **recommended default: auto-upload immediately**, since staff have already confirmed product linkage before starting capture, and a manual button adds friction with no benefit).
- Show file size of the generated USDZ (helps staff/managers monitor device storage over many captures).

### 4.7 Upload Flow (new — not in Apple's reference, this is your product's requirement)

- Runs automatically after Screen 7 renders (or on manual tap, per decision above — **default to automatic**).
- Uses `URLSession` with a **background configuration** (`URLSessionConfiguration.background(withIdentifier:)`) so the upload survives the user backgrounding the app or the OS suspending it — critical because USDZ files at `.medium`/`.full` detail can be tens to hundreds of MB and take a while on restaurant WiFi.
- Show a slim progress bar overlay on Screen 7 (`"Uploading... 42%"`), non-blocking — staff can navigate back to Screen 1 to start capturing the next dish while a previous upload finishes in the background.
- **Retry logic:** exponential backoff, max 5 attempts, on network-reachability-restored events (`NWPathMonitor`) as well as timer-based retries. Persist unfinished uploads (file path + productId + auth token reference) to a lightweight local queue (e.g., a JSON file or Core Data / SwiftData entity) so an app relaunch after a crash or forced quit can resume/re-attempt pending uploads on next launch.
- On success: show a transient toast `"Uploaded ✓"`, then auto-navigate back to the Product Selection screen (staff workflow: capture next dish).
- On terminal failure (all retries exhausted): keep the model in a local "Pending Uploads" list accessible from a new tab/section so staff (or the app on next launch) can manually retry; **never silently lose a captured model** — local files persist until upload is confirmed successful by the server (HTTP 200/201).
- **Delete the local USDZ + raw image folder only after server confirms successful storage**, to avoid data loss from a premature cleanup — this is a common corner-case bug (deleting on request-sent rather than response-received).

---

## 5. PRODUCT SELECTION SCREEN (before capture starts)

- Fetches `GET /api/products?restaurantId=<id>` from backend.
- Search bar (filters by name, live, debounced 300ms).
- Each row: product thumbnail, name, and a small badge `"Has 3D model"` / `"No 3D model"` so staff can prioritize items without one.
- Tapping a product with an existing model shows a confirmation: `"This item already has a 3D model. Recapture and replace it?"` before proceeding (prevents accidental overwrites).
- If launched via deep link (`arcodecapture://capture?productId=...`), skip this screen entirely and jump straight to Screen 1 with the product pre-selected.

---

## 6. AUTHENTICATION

- Simple login screen: restaurant staff email/username + password, or better, a **short-lived pairing code** generated from the dashboard (`Settings → Generate Device Pairing Code`, a 6-digit code valid 10 minutes) — avoids storing long-term staff passwords on a shared device.
- On successful auth, store the returned JWT in **Keychain** (never `UserDefaults` — hidden security detail many implementations get wrong), with `kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly`.
- Token refresh: if API returns `401`, attempt silent refresh via refresh token; if refresh fails, force back to login screen and preserve any in-progress local capture (don't lose captured photos due to an auth hiccup mid-flow).

---

## 7. BACKEND API CONTRACT (exact, for the iOS app to consume)

### 7.1 Auth
```
POST /api/auth/device-pair
Body: { "pairingCode": "123456" }
Response 200: { "accessToken": "...", "refreshToken": "...", "restaurantId": "uuid", "expiresIn": 3600 }

POST /api/auth/refresh
Body: { "refreshToken": "..." }
Response 200: { "accessToken": "...", "expiresIn": 3600 }
```

### 7.2 Products
```
GET /api/products?restaurantId=<uuid>
Headers: Authorization: Bearer <token>
Response 200: [
  { "id": "uuid", "name": "Classic Burger", "thumbnailUrl": "...", "has3DModel": true }
]
```

### 7.3 Model Upload
```
POST /api/products/:productId/3d-model
Headers: Authorization: Bearer <token>
Content-Type: multipart/form-data
Body fields:
  - model: <binary .usdz file>
  - detailLevel: "medium" | "reduced" | "full"
  - capturedImageCount: 47
  - deviceModel: "iPhone15,2"
  - appVersion: "1.0.0"

Response 202 Accepted: {
  "modelId": "uuid",
  "status": "processing",   // backend is converting USDZ -> GLB async
  "usdzUrl": "https://cdn.../model.usdz"
}

Error responses:
  400 - invalid/corrupt USDZ file
  401 - expired/invalid token
  409 - a model for this product is already being processed
  413 - file exceeds max allowed size (define: 250MB hard cap)
  500 - server error, safe to retry
```

### 7.4 Upload status polling (for the app's pending-uploads screen)
```
GET /api/products/:productId/3d-model/status
Response 200: { "status": "processing" | "ready" | "failed", "glbUrl": "...", "error": null }
```

### 7.5 Networking implementation notes for the app
- Every request must attach `Accept-Language` header (`ar` or `en`) matching device locale, since backend may localize error messages.
- All requests must have a **30-second timeout** for metadata calls; the multipart upload request itself must use the **background URLSession** (no fixed timeout — background sessions manage this differently) and must set `httpMaximumConnectionsPerHost` conservatively (1) to avoid saturating restaurant WiFi if multiple uploads queue up.
- Certificate pinning: **not required for v1** given this is an internal staff tool over HTTPS, but leave `URLSessionDelegate` structured so pinning can be added later without refactoring.

---

## 8. ERROR HANDLING & EDGE CASES (do not skip these)

| Scenario | Required behavior |
|---|---|
| Device has no LiDAR | Allow capture, show one-time dismissible banner: `"For best results, use a device with LiDAR (iPhone 12 Pro or newer)."` |
| Low light detected mid-capture | Real-time toast: `"More light needed — move to a brighter area."`; do not auto-pause capture, just warn |
| Object is highly reflective/transparent (e.g., a glass drink) | Object Capture's own quality heuristics will already degrade; surface Apple's feedback signal as: `"This object's surface may be too reflective for a clean 3D scan."` after capture completes, as a non-blocking warning on Screen 7, not a hard failure |
| Phone call / interruption mid-capture | On `session` interruption (`.sessionWasInterrupted` / `AVAudioSession` interruption notification), auto-pause capture, preserve all images taken so far, resume seamlessly when interruption ends — never discard progress on an interruption |
| App force-quit mid-reconstruction | On next launch, detect an orphaned `Checkpoint` directory from `PhotogrammetrySession.Configuration.checkpointDirectory` and offer: `"Resume previous 3D model?"` — `PhotogrammetrySession` supports checkpoint-based resume; wire this up, don't just discard and force a reshoot |
| Device storage low (<500MB free) | Block starting a new capture, show: `"Not enough storage. Free up space before capturing a new 3D model."`; check via `URLResourceValues(forKeys: [.volumeAvailableCapacityForImportantUsageKey])` before Screen 1 is reachable |
| Battery below 15% and not charging | Non-blocking warning banner (reconstruction is CPU/GPU-intensive and can drain battery fast): `"Low battery — consider plugging in before generating the 3D model."` |
| No network at upload time | Model stays queued locally (see §4.7); show a persistent badge on app icon or in-app banner: `"1 model waiting to upload"` |
| User backgrounds app during capture (not reconstruction) | `ObjectCaptureSession` capture itself should pause automatically (camera access lost when backgrounded); on foreground return, resume from the same bounding box/orbit state rather than restarting |
| Duplicate capture for same product | Handled server-side via the `409` + client confirmation dialog described in §5 |
| Non-food objects staff might accidentally scan (testing) | No restriction needed — app remains general-purpose; no object-recognition/content-filtering required for v1 |

---

## 9. ACCESSIBILITY & LOCALIZATION

- Full VoiceOver labels on every interactive element (`Reset`, `Continue`, `Start Capture`, mute toggle, help button, shutter button, `Cancel`, `Flip object anyway`).
- Dynamic Type support on all text labels except the live camera overlay hints (which should remain a fixed comfortable size for glanceability during physical movement).
- Ship with **English and Arabic** localization at minimum (`Localizable.strings` for both), with full RTL layout verification for Arabic (mirror the "Reset" top-left / help "?" bottom-right placements appropriately under RTL — SwiftUI handles most of this automatically via layout direction, but explicitly test it, don't assume).

---

## 10. TESTING CHECKLIST (hand this to QA / include in CI notes)

- [ ] Full capture flow completes successfully on a LiDAR device (iPhone 13 Pro+)
- [ ] Full capture flow completes successfully on a non-LiDAR device (iPhone 12/13 base)
- [ ] Reset button at every stage correctly discards state and returns to Screen 1
- [ ] Bounding box manual resize handles are draggable and persist correctly into `startCapturing()`
- [ ] Flip warning modal appears when expected and both paths (Continue / Flip anyway) work
- [ ] Cancel-with-confirmation works at every stage (capture, reconstruction)
- [ ] Interrupting the app (phone call, notification swipe, app switch) mid-capture does not lose progress
- [ ] Force-quitting mid-reconstruction and relaunching offers a checkpoint resume
- [ ] Upload survives app backgrounding (verify via background URLSession, not just foreground)
- [ ] Upload retries correctly after WiFi is toggled off/on mid-upload
- [ ] Low-storage guard correctly blocks new captures below the defined threshold
- [ ] Deep link `arcodecapture://capture?productId=...` correctly pre-selects product and skips product-list screen
- [ ] Arabic localization renders correctly in RTL with no clipped text
- [ ] VoiceOver can complete the entire flow end-to-end
- [ ] Generated `.glb` (after server-side conversion) renders correctly in `<model-viewer>` on the dashboard in Safari, Chrome, and Firefox
- [ ] Generated `.usdz` opens correctly via AR Quick Look when tapped from an iPhone browser

---

## 11. OUT OF SCOPE FOR v1 (explicitly, to prevent scope creep)

- Public App Store release / App Review compliance polish (internal distribution only — TestFlight or Apple Business Manager / MDM).
- Android capture app (not requested; web dashboard already handles cross-platform *viewing* via `<model-viewer>`).
- "Generate an AR Code" physical signage feature from Apple's reference screen — omit or disable.
- In-app photo retouching/relighting of the captured model.
- Multi-user real-time collaboration on a single capture session.

---

## 12. DELIVERABLE SUMMARY FOR THE DEVELOPER

Build exactly the state machine, screens, and API contract above. The result is a **staff-only iOS app that reproduces the attached reference screenshots pixel-for-pixel in flow and copy**, adds automatic authenticated upload to the existing `menu-ai` backend, and requires **zero third-party 3D-generation service and zero per-generation cost**, since all reconstruction happens on-device via Apple's native RealityKit Object Capture pipeline.
