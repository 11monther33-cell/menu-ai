import Foundation
import Combine
import RealityKit
import SwiftUI

@MainActor
class CaptureViewModel: ObservableObject {
    @Published var session: ObjectCaptureSession?
    @Published var errorMessage: String? = nil
    
    private let appState: AppState
    private let fileManager = CaptureFileManager.shared
    
    init(appState: AppState) {
        self.appState = appState
    }
    
    func startNewCapture(for productId: String) {
        // Cancel any existing session first
        session?.cancel()
        session = nil
        
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
        Task { [weak self] in
            for await state in session.stateUpdates {
                guard let self = self else { return }
                self.handleStateChange(state)
            }
        }
    }
    
    private func handleStateChange(_ state: ObjectCaptureSession.CaptureState) {
        switch state {
        case .finishing, .completed:
            appState.currentFlowState = .reconstructing
        case .failed(let error):
            appState.currentFlowState = .captureFailed(reason: .unknown(error.localizedDescription))
        default:
            break
        }
    }
    
    func resetSession() {
        session?.cancel()
        session = nil
        if let productId = appState.selectedProductId {
            startNewCapture(for: productId)
        }
    }
    
    func startCapturing() {
        session?.startCapturing()
    }
    
    func finishCapturing() {
        session?.finish()
    }
    
    func cancelCapture() {
        session?.cancel()
        session = nil
        if let productId = appState.selectedProductId {
            fileManager.clearCaptureData(for: productId)
        }
        appState.currentFlowState = .selectingProduct
    }
}
