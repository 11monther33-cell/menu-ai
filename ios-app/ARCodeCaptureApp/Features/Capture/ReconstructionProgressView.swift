import SwiftUI

struct ReconstructionProgressView: View {
    @StateObject private var appState: AppState
    let progress: Double
    let eta: Int?
    
    init(appState: AppState, progress: Double, eta: Int?) {
        _appState = StateObject(wrappedValue: appState)
        self.progress = progress
        self.eta = eta
    }
    
    var body: some View {
        VStack(spacing: 30) {
            Image(systemName: "cube.transparent")
                .font(.system(size: 80))
                .foregroundColor(.blue)
            
            Text("جاري بناء المجسم ثلاثي الأبعاد...")
                .font(.title2)
                .fontWeight(.bold)
                .multilineTextAlignment(.center)
            
            VStack(spacing: 10) {
                ProgressView(value: progress, total: 1.0)
                    .progressViewStyle(LinearProgressViewStyle(tint: .blue))
                    .frame(width: 250)
                
                Text("\(Int(progress * 100))%")
                    .font(.headline)
                
                if let eta = eta {
                    Text("الوقت المتبقي: \(Int(eta)) ثانية")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            Text("الرجاء عدم إغلاق التطبيق أثناء عملية البناء.")
                .font(.footnote)
                .foregroundColor(.secondary)
                .padding(.top, 20)
        }
        .padding()
        .onAppear {
            // Simulated reconstruction for this version until full PhotogrammetrySession is integrated
            simulateReconstruction()
        }
    }
    
    private func simulateReconstruction() {
        // Since we are running on device, actual PhotogrammetrySession requires macOS or high-end iPad.
        // For standard iPhones, reconstruction is usually done via cloud API.
        // This is a placeholder for uploading images to the cloud API.
        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
            appState.currentFlowState = .uploading(progress: 0.1)
        }
    }
}
