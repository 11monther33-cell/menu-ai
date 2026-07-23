import SwiftUI

struct CaptureRootView: View {
    @StateObject private var appState = AppState()
    @StateObject private var captureViewModel: CaptureViewModel
    
    init() {
        let state = AppState()
        _appState = StateObject(wrappedValue: state)
        _captureViewModel = StateObject(wrappedValue: CaptureViewModel(appState: state))
    }
    
    var body: some View {
        ZStack {
            switch appState.currentFlowState {
            case .authenticating:
                LoginView(appState: appState)
            case .selectingProduct:
                ProductListView(appState: appState)
            case .cameraPermissionRequired:
                Text("Camera Permission Required")
            case .activeCapture:
                ActiveCaptureView(appState: appState, viewModel: captureViewModel)
            case .reconstructing:
                ReconstructionProgressView(appState: appState)
            case .completed(let localUrl):
                ModelCompletedView(appState: appState, modelURL: localUrl)
            case .uploading(let progress):
                UploadingView(appState: appState, progress: progress)
            case .uploadSucceeded(let remoteId):
                UploadSucceededView(appState: appState, remoteId: remoteId)
            case .uploadFailed(let error, _):
                UploadFailedView(appState: appState, error: error)
            case .captureFailed(_):
                CaptureFailedView(appState: appState)
            }
        }
        .environmentObject(appState)
    }
}
