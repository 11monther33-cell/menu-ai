import SwiftUI

struct ReconstructionProgressView: View {
    @ObservedObject var appState: AppState
    @StateObject private var reconstructionManager = ReconstructionManager()
    
    var body: some View {
        VStack(spacing: 30) {
            // Animated cube icon
            Image(systemName: "cube.transparent")
                .font(.system(size: 80))
                .foregroundColor(.blue)
                .symbolEffect(.pulse, isActive: reconstructionManager.isProcessing)
            
            Text("جاري بناء المجسم ثلاثي الأبعاد...")
                .font(.title2)
                .fontWeight(.bold)
                .multilineTextAlignment(.center)
            
            VStack(spacing: 10) {
                ProgressView(value: reconstructionManager.progress, total: 1.0)
                    .progressViewStyle(LinearProgressViewStyle(tint: .blue))
                    .frame(width: 250)
                
                Text("\(Int(reconstructionManager.progress * 100))%")
                    .font(.headline)
                    .monospacedDigit()
            }
            
            if let error = reconstructionManager.errorMessage {
                Text(error)
                    .foregroundColor(.red)
                    .font(.footnote)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)
            }
            
            Text("الرجاء عدم إغلاق التطبيق أثناء عملية البناء.\nهذه العملية قد تستغرق من 1 إلى 5 دقائق.")
                .font(.footnote)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.top, 20)
            
            // Cancel button
            Button(action: {
                appState.currentFlowState = .selectingProduct
                appState.selectedProductId = nil
            }) {
                Text("إلغاء")
                    .foregroundColor(.red)
            }
            .padding(.top, 10)
        }
        .padding()
        .onAppear {
            startReconstruction()
        }
    }
    
    private func startReconstruction() {
        guard let productId = appState.selectedProductId else {
            appState.currentFlowState = .captureFailed(reason: .unknown("لم يتم تحديد منتج"))
            return
        }
        
        Task {
            if let modelURL = await reconstructionManager.reconstruct(productId: productId) {
                // Model created successfully! Start upload automatically
                appState.currentFlowState = .uploading(localModelURL: modelURL)
            } else if let error = reconstructionManager.errorMessage {
                appState.currentFlowState = .captureFailed(reason: .unknown(error))
            }
        }
    }
}
