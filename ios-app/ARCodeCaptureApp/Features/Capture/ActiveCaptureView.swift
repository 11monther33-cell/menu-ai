import SwiftUI
import RealityKit

struct ActiveCaptureView: View {
    @ObservedObject var appState: AppState
    @ObservedObject var viewModel: CaptureViewModel
    
    var body: some View {
        ZStack {
            if let session = viewModel.session {
                ObjectCaptureView(session: session)
                    .edgesIgnoringSafeArea(.all)
                
                // UI Overlay
                VStack {
                    HStack {
                        Button(action: {
                            viewModel.cancelCapture()
                        }) {
                            Text("إلغاء")
                                .font(.headline)
                                .padding(.horizontal, 16)
                                .padding(.vertical, 10)
                                .background(.ultraThinMaterial)
                                .foregroundColor(.white)
                                .cornerRadius(12)
                        }
                        
                        Spacer()
                        
                        Button(action: {
                            viewModel.resetSession()
                        }) {
                            Text("إعادة")
                                .font(.headline)
                                .padding(.horizontal, 16)
                                .padding(.vertical, 10)
                                .background(.ultraThinMaterial)
                                .foregroundColor(.white)
                                .cornerRadius(12)
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 60)
                    
                    Spacer()
                    
                    // Bottom Controls based on session state
                    VStack(spacing: 16) {
                        if session.state == .ready || session.state == .detecting {
                            Text("تأكد أن الصندوق يحيط بالعنصر بالكامل")
                                .font(.headline)
                                .foregroundColor(.white)
                                .padding(.horizontal, 20)
                                .padding(.vertical, 10)
                                .background(.ultraThinMaterial)
                                .cornerRadius(12)
                            
                            Button(action: {
                                viewModel.startCapturing()
                            }) {
                                Text("بدء التصوير (Start)")
                                    .font(.headline)
                                    .fontWeight(.bold)
                                    .padding(.horizontal, 40)
                                    .padding(.vertical, 14)
                                    .background(Color.green)
                                    .foregroundColor(.white)
                                    .cornerRadius(20)
                            }
                        } else if session.state == .capturing {
                            Text("عدد الصور: \(session.numberOfShotsTaken)")
                                .font(.headline)
                                .foregroundColor(.white)
                                .padding(.horizontal, 20)
                                .padding(.vertical, 10)
                                .background(.ultraThinMaterial)
                                .cornerRadius(12)
                            
                            Button(action: {
                                viewModel.finishCapturing()
                            }) {
                                Text("إنهاء التصوير (Finish)")
                                    .font(.headline)
                                    .fontWeight(.bold)
                                    .padding(.horizontal, 40)
                                    .padding(.vertical, 14)
                                    .background(Color.red)
                                    .foregroundColor(.white)
                                    .cornerRadius(20)
                            }
                        }
                    }
                    .padding(.bottom, 50)
                }
            } else {
                // Loading state
                ZStack {
                    Color.black.edgesIgnoringSafeArea(.all)
                    VStack(spacing: 20) {
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle(tint: .white))
                            .scaleEffect(1.5)
                        Text("جاري تهيئة الكاميرا...")
                            .foregroundColor(.white)
                            .font(.headline)
                    }
                }
            }
        }
        .onAppear {
            if viewModel.session == nil, let productId = appState.selectedProductId {
                viewModel.startNewCapture(for: productId)
            }
        }
    }
}
