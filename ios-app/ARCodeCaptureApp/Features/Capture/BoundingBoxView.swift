import SwiftUI
import RealityKit

struct BoundingBoxView: View {
    @StateObject private var appState: AppState
    
    init(appState: AppState) {
        _appState = StateObject(wrappedValue: appState)
    }
    
    var body: some View {
        ZStack {
            // In a real implementation with ObjectCaptureSession,
            // the bounding box UI is often handled automatically or 
            // by a custom RealityView if we want precise adjustments.
            // For now, we simulate the adjustment screen.
            
            Color.black.edgesIgnoringSafeArea(.all)
            
            VStack {
                Text("تأكد أن الصندوق يحيط بالعنصر بالكامل")
                    .font(.headline)
                    .foregroundColor(.white)
                    .padding()
                    .background(Color.black.opacity(0.6))
                    .cornerRadius(10)
                    .padding(.top, 40)
                
                Spacer()
                
                // Simulated bounding box frame
                Rectangle()
                    .stroke(Color.yellow, lineWidth: 3)
                    .frame(width: 250, height: 250)
                    .background(Color.yellow.opacity(0.1))
                
                Spacer()
                
                HStack(spacing: 20) {
                    Button(action: {
                        appState.currentFlowState = .objectDetection
                    }) {
                        Text("إلغاء (Cancel)")
                            .fontWeight(.bold)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.red.opacity(0.8))
                            .foregroundColor(.white)
                            .cornerRadius(10)
                    }
                    
                    Button(action: {
                        appState.currentFlowState = .capturing(imageCount: 0, totalRecommended: 30)
                    }) {
                        Text("بدء التصوير (Start)")
                            .fontWeight(.bold)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.green)
                            .foregroundColor(.white)
                            .cornerRadius(10)
                    }
                }
                .padding(.horizontal, 30)
                .padding(.bottom, 40)
            }
        }
    }
}
