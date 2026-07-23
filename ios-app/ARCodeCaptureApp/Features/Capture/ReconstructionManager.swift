import Foundation
import RealityKit
import SwiftUI

/// Handles the actual 3D reconstruction using Apple's PhotogrammetrySession
@MainActor
class ReconstructionManager: ObservableObject {
    @Published var progress: Double = 0.0
    @Published var isProcessing: Bool = false
    @Published var errorMessage: String? = nil
    
    private let fileManager = CaptureFileManager.shared
    
    /// Run PhotogrammetrySession to create a USDZ model from captured images
    func reconstruct(productId: String) async -> URL? {
        isProcessing = true
        progress = 0.0
        errorMessage = nil
        
        let imagesDirectory = fileManager.getImagesDirectory(for: productId)
        let outputURL = fileManager.getModelURL(for: productId)
        
        // Delete old model if exists
        try? FileManager.default.removeItem(at: outputURL)
        
        do {
            // Create PhotogrammetrySession from the captured images folder
            let session = try PhotogrammetrySession(
                input: imagesDirectory,
                configuration: PhotogrammetrySession.Configuration()
            )
            
            // Start processing with reduced detail for faster on-device processing
            try session.process(requests: [
                .modelFile(url: outputURL, detail: .reduced)
            ])
            
            // Monitor progress
            for try await output in session.outputs {
                switch output {
                case .processingComplete:
                    self.progress = 1.0
                    self.isProcessing = false
                    return outputURL
                    
                case .requestProgress(_, fractionComplete: let fraction):
                    self.progress = fraction
                    
                case .requestError(_, let error):
                    self.errorMessage = error.localizedDescription
                    self.isProcessing = false
                    return nil
                    
                case .requestComplete(_, let result):
                    switch result {
                    case .modelFile(let url):
                        self.progress = 1.0
                        self.isProcessing = false
                        return url
                    default:
                        break
                    }
                    
                case .inputComplete:
                    // Input processing done, waiting for output
                    break
                    
                case .invalidSample(let id, let reason):
                    print("Invalid sample \(id): \(reason)")
                    
                case .skippedSample(let id):
                    print("Skipped sample \(id)")
                    
                case .automaticDownsampling:
                    print("Automatic downsampling applied")
                    
                case .processingCancelled:
                    self.isProcessing = false
                    return nil
                    
                @unknown default:
                    break
                }
            }
        } catch {
            self.errorMessage = "فشل في بدء عملية بناء المجسم: \(error.localizedDescription)"
            self.isProcessing = false
        }
        
        return nil
    }
}
