import Foundation

class CaptureFileManager {
    static let shared = CaptureFileManager()
    
    private let fileManager = FileManager.default
    
    func getDocumentsDirectory() -> URL {
        fileManager.urls(for: .documentDirectory, in: .userDomainMask)[0]
    }
    
    func getCaptureDirectory(for productId: String) -> URL {
        let dir = getDocumentsDirectory().appendingPathComponent("Captures").appendingPathComponent(productId)
        if !fileManager.fileExists(atPath: dir.path) {
            try? fileManager.createDirectory(at: dir, withIntermediateDirectories: true)
        }
        return dir
    }
    
    func getImagesDirectory(for productId: String) -> URL {
        let dir = getCaptureDirectory(for: productId).appendingPathComponent("Images")
        if !fileManager.fileExists(atPath: dir.path) {
            try? fileManager.createDirectory(at: dir, withIntermediateDirectories: true)
        }
        return dir
    }
    
    func getCheckpointDirectory(for productId: String) -> URL {
        let dir = getCaptureDirectory(for: productId).appendingPathComponent("Snapshots")
        if !fileManager.fileExists(atPath: dir.path) {
            try? fileManager.createDirectory(at: dir, withIntermediateDirectories: true)
        }
        return dir
    }
    
    func getModelURL(for productId: String) -> URL {
        getCaptureDirectory(for: productId).appendingPathComponent("model.usdz")
    }
    
    func checkAvailableStorage() -> Bool {
        do {
            let values = try getDocumentsDirectory().resourceValues(forKeys: [.volumeAvailableCapacityForImportantUsageKey])
            if let capacity = values.volumeAvailableCapacityForImportantUsage {
                return capacity > 500_000_000 // 500 MB minimum
            }
        } catch {
            print("Error checking storage: \(error)")
        }
        return true // Default to true if check fails
    }
    
    func clearCaptureData(for productId: String) {
        let dir = getCaptureDirectory(for: productId)
        try? fileManager.removeItem(at: dir)
    }
}
