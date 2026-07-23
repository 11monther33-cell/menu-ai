import Foundation
import Combine

enum CaptureFlowState: Equatable {
    case authenticating
    case selectingProduct
    case cameraPermissionRequired
    case activeCapture
    case reconstructing
    case completed(localModelURL: URL)  // Screen 7
    case uploading(localModelURL: URL)
    case uploadSucceeded(remoteModelId: String)
    case uploadFailed(error: String, retryAvailable: Bool)
    case captureFailed(reason: CaptureFailureReason)
}

enum CaptureFailureReason: Equatable {
    case insufficientLighting
    case objectTooReflective
    case objectTooSmall
    case movedTooFast
    case sessionInterrupted
    case insufficientImages
    case lowStorage
    case unknown(String)
}

@MainActor
class AppState: ObservableObject {
    @Published var isAuthenticated: Bool = false
    @Published var selectedProductId: String? = nil
    @Published var currentFlowState: CaptureFlowState = .authenticating
    
    func logOut() {
        isAuthenticated = false
        currentFlowState = .authenticating
        selectedProductId = nil
    }
}
