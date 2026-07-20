import SwiftUI

struct CaptureRootView: View {
    @StateObject private var appState = AppState()
    
    var body: some View {
        ZStack {
            switch appState.currentFlowState {
            case .authenticating:
                LoginView(appState: appState)
            case .selectingProduct:
                ProductListView(appState: appState)
            case .cameraPermissionRequired:
                Text("Camera Permission Required")
            case .objectDetection:
                ObjectDetectionView(appState: appState)
            case .boundingBoxAdjustment:
                BoundingBoxView(appState: appState)
            case .capturing(let count, let recommended):
                CapturingView(appState: appState, count: count, recommended: recommended)
            case .flipWarning:
                FlipWarningView(appState: appState)
            case .reconstructing(let progress, let eta):
                ReconstructionProgressView(appState: appState, progress: progress, eta: eta)
            case .completed(let localUrl):
                ModelCompletedView(appState: appState, modelURL: localUrl)
            case .uploading(let progress):
                Text("Uploading... \(Int(progress * 100))%")
            case .uploadSucceeded(let remoteId):
                Text("Upload Succeeded! ID: \(remoteId)")
            case .uploadFailed(let error, _):
                Text("Upload Failed: \(error)")
            case .captureFailed(let reason):
                Text("Capture Failed")
            }
        }
        .environmentObject(appState)
    }
}
