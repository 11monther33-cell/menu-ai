import SwiftUI
import RealityKit

struct ObjectDetectionView: View {
    @StateObject private var appState: AppState
    @StateObject private var viewModel: CaptureViewModel
    
    init(appState: AppState) {
        _appState = StateObject(wrappedValue: appState)
        _viewModel = StateObject(wrappedValue: CaptureViewModel(appState: appState))
    }
    
    var body: some View {
        ZStack {
            if let session = viewModel.session {
                ObjectCaptureView(session: session)
                    .edgesIgnoringSafeArea(.all)
            } else {
                Color.black.edgesIgnoringSafeArea(.all)
            }
            
            VStack {
                HStack {
                    Button(action: {
                        viewModel.resetSession()
                    }) {
                        Text("إعادة ضبط (Reset)")
                            .padding()
                            .background(Color.black.opacity(0.6))
                            .foregroundColor(.white)
                            .cornerRadius(10)
                    }
                    Spacer()
                    // Help Button
                    Button(action: {
                        // TODO: Show help tutorial
                    }) {
                        Image(systemName: "questionmark.circle.fill")
                            .font(.system(size: 30))
                            .foregroundColor(.white)
                    }
                }
                .padding()
                
                Spacer()
                
                Text("اقترب من العنصر وضع النقطة في المنتصف، ثم اضغط متابعة.")
                    .font(.headline)
                    .foregroundColor(.white)
                    .multilineTextAlignment(.center)
                    .padding()
                    .background(Color.black.opacity(0.6))
                    .cornerRadius(10)
                    .padding(.bottom, 20)
                
                Button(action: {
                    // Start detecting bounding box
                    appState.currentFlowState = .boundingBoxAdjustment
                }) {
                    Text("متابعة (Continue)")
                        .fontWeight(.bold)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                }
                .padding(.horizontal, 40)
                .padding(.bottom, 30)
                // In a real app, this button is disabled until session.state == .detecting
            }
        }
        .onAppear {
            if viewModel.session == nil {
                if let productId = appState.selectedProductId {
                    viewModel.startNewCapture(for: productId)
                }
            }
        }
        .onDisappear {
            // Cancel session if leaving flow unexpectedly
            // viewModel.cancelCapture()
        }
    }
}
