import Foundation
import Combine
import RealityKit
import SwiftUI

@MainActor
class CaptureViewModel: ObservableObject {
    @Published var session: ObjectCaptureSession?
    @Published var errorMessage: String? = nil
    
    private unowned let appState: AppState
    private let fileManager = CaptureFileManager.shared
    
    private var cancellables = Set<AnyCancellable>()
    
    init(appState: AppState) {
        self.appState = appState
    }
    
    func startNewCapture(for productId: String) {
        // Clear previous local data for this product to ensure a fresh capture
        fileManager.clearCaptureData(for: productId)
        
        // Ensure storage is available
        guard fileManager.checkAvailableStorage() else {
            appState.currentFlowState = .captureFailed(reason: .lowStorage)
            return
        }
        
        let imagesDirectory = fileManager.getImagesDirectory(for: productId)
        let checkpointDirectory = fileManager.getCheckpointDirectory(for: productId)
        
        var configuration = ObjectCaptureSession.Configuration()
        configuration.checkpointDirectory = checkpointDirectory
        
        let newSession = ObjectCaptureSession()
        self.session = newSession
        
        newSession.start(imagesDirectory: imagesDirectory, configuration: configuration)
        
        // Listen to session state changes
        observeSession(newSession)
    }
    
    private func observeSession(_ session: ObjectCaptureSession) {
        // Observe State
        Task {
            for await state in session.stateUpdates {
                handleStateChange(state)
            }
        }
    }
    
    private func handleStateChange(_ state: ObjectCaptureSession.CaptureState) {
        switch state {
        case .initializing, .ready, .detecting:
            appState.currentFlowState = .objectDetection
        case .capturing:
            let captured = session?.numberOfShotsTaken ?? 0
            // Assuming 30 is the recommended minimum for medium quality
            appState.currentFlowState = .capturing(imageCount: captured, totalRecommended: 30)
        case .finishing:
            // Prepare for reconstruction
            appState.currentFlowState = .reconstructing(progress: 0.0, etaSeconds: nil)
        case .completed:
            // ObjectCaptureSession finished taking photos, move to reconstruction phase
            appState.currentFlowState = .reconstructing(progress: 0.0, etaSeconds: nil)
        case .failed(let error):
            appState.currentFlowState = .captureFailed(reason: .unknown(error.localizedDescription))
        @unknown default:
            break
        }
    }
    
    func resetSession() {
        session?.cancel()
        session = nil
        appState.currentFlowState = .objectDetection
        if let productId = appState.selectedProductId {
            startNewCapture(for: productId)
        }
    }
    
    func startCapturing() {
        session?.startCapturing()
    }
    
    func finishCapturing() {
        guard let session = session else { return }
        
        let captured = session.numberOfShotsTaken
        if captured < 20 {
            // Need more images
            errorMessage = "Please capture more images (at least 20) for a usable model."
        } else {
            session.finish()
        }
    }
    
    func skipFlipAndContinue() {
        // In Object Capture, we can just finish the session to proceed without flipping
        finishCapturing()
    }
    
    func cancelCapture() {
        session?.cancel()
        if let productId = appState.selectedProductId {
            fileManager.clearCaptureData(for: productId)
        }
        appState.currentFlowState = .selectingProduct
    }
}
