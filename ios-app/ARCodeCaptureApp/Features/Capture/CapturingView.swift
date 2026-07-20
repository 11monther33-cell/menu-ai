import SwiftUI
import RealityKit

struct CapturingView: View {
    @StateObject private var appState: AppState
    @StateObject private var viewModel: CaptureViewModel
    let count: Int
    let recommended: Int
    
    init(appState: AppState, count: Int, recommended: Int) {
        _appState = StateObject(wrappedValue: appState)
        _viewModel = StateObject(wrappedValue: CaptureViewModel(appState: appState))
        self.count = count
        self.recommended = recommended
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
                        viewModel.cancelCapture()
                    }) {
                        Text("إلغاء")
                            .padding()
                            .background(Color.black.opacity(0.6))
                            .foregroundColor(.white)
                            .cornerRadius(10)
                    }
                    Spacer()
                    
                    VStack {
                        Text("\(count)")
                            .font(.system(size: 24, weight: .bold))
                            .foregroundColor(.white)
                        Text("الصور")
                            .font(.caption)
                            .foregroundColor(.white)
                    }
                    .padding()
                    .background(Color.black.opacity(0.6))
                    .cornerRadius(10)
                }
                .padding()
                
                Spacer()
                
                // Camera Shutter Button
                Button(action: {
                    viewModel.startCapturing()
                }) {
                    Circle()
                        .strokeBorder(Color.white, lineWidth: 3)
                        .frame(width: 70, height: 70)
                        .background(Circle().fill(Color.white.opacity(0.8)))
                }
                .padding(.bottom, 20)
                
                Button(action: {
                    viewModel.finishCapturing()
                }) {
                    Text("إنهاء التصوير")
                        .fontWeight(.bold)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(count >= recommended ? Color.blue : Color.gray)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                }
                .padding(.horizontal, 40)
                .padding(.bottom, 30)
                .disabled(count < 20)
                
                if let error = viewModel.errorMessage {
                    Text(error)
                        .foregroundColor(.red)
                        .padding(.bottom)
                }
            }
        }
    }
}
