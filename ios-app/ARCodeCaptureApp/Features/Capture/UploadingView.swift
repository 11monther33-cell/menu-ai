import SwiftUI

struct UploadingView: View {
    @ObservedObject var appState: AppState
    let modelURL: URL
    @State private var progress: Double = 0.0
    @State private var uploadTask: Task<Void, Never>?
    
    var body: some View {
        VStack(spacing: 30) {
            Image(systemName: "cloud.arrow.up.fill")
                .font(.system(size: 80))
                .foregroundColor(.blue)
            
            Text("جاري رفع المجسم إلى لوحة التحكم...")
                .font(.title2)
                .fontWeight(.bold)
                .multilineTextAlignment(.center)
            
            VStack(spacing: 10) {
                ProgressView(value: progress, total: 1.0)
                    .progressViewStyle(LinearProgressViewStyle(tint: .blue))
                    .frame(width: 250)
                
                Text("\(Int(progress * 100))%")
                    .font(.headline)
            }
            
            Text("يرجى الانتظار، سيظهر المجسم في قائمة الطلبات فور اكتمال الرفع.")
                .font(.footnote)
                .foregroundColor(.secondary)
                .padding(.top, 20)
                .multilineTextAlignment(.center)
        }
        .padding()
        .onAppear {
            startUpload()
        }
        .onDisappear {
            uploadTask?.cancel()
        }
    }
    
    private func startUpload() {
        guard let productId = appState.selectedProductId else { return }
        
        // Simulating progress while the actual upload happens
        let timer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { _ in
            if self.progress < 0.9 {
                self.progress += 0.05
            }
        }
        
        uploadTask = Task {
            do {
                // Assuming we use a dummy token for now, or fetch from keychain
                let token = KeychainService.shared.getToken() ?? "dummy_token"
                try await APIClient.shared.upload3DModel(productId: productId, fileURL: modelURL, token: token)
                
                timer.invalidate()
                self.progress = 1.0
                
                // Small delay to show 100%
                try await Task.sleep(nanoseconds: 500_000_000)
                
                await MainActor.run {
                    appState.currentFlowState = .uploadSucceeded(remoteModelId: productId)
                }
            } catch {
                timer.invalidate()
                await MainActor.run {
                    appState.currentFlowState = .uploadFailed(error: error.localizedDescription, retryAvailable: true)
                }
            }
        }
    }
}
