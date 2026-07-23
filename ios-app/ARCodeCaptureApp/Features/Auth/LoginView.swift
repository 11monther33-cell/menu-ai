import SwiftUI

struct LoginView: View {
    @StateObject private var viewModel: AuthViewModel
    
    init(appState: AppState) {
        _viewModel = StateObject(wrappedValue: AuthViewModel(appState: appState))
    }
    
    var body: some View {
        VStack(spacing: 30) {
            Image(systemName: "camera.viewfinder")
                .font(.system(size: 80))
                .foregroundColor(.blue)
                .padding(.top, 40)
            
            Text("AR Code Object Capture")
                .font(.title)
                .fontWeight(.bold)
            
            Text("الرجاء إدخال كود الربط من لوحة التحكم للوصول للتطبيق.")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
            
            VStack(spacing: 15) {
                TextField("كود الربط (Pairing Code)", text: $viewModel.pairingCode)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .multilineTextAlignment(.center)
                    .font(.title3)
                    .keyboardType(.numberPad)
                    .disabled(viewModel.isLoading)
                
                if let error = viewModel.errorMessage {
                    Text(error)
                        .foregroundColor(.red)
                        .font(.footnote)
                }
                
                Button(action: {
                    viewModel.login()
                }) {
                    HStack {
                        if viewModel.isLoading {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                .padding(.trailing, 5)
                        }
                        Text("تسجيل الدخول")
                            .fontWeight(.semibold)
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(10)
                }
                .disabled(viewModel.isLoading || viewModel.pairingCode.trimmingCharacters(in: .whitespaces).isEmpty)
            }
            .padding(.horizontal, 40)
            
            Spacer()
            
            // Social Media Icons
            HStack(spacing: 30) {
                // X (Twitter) Icon
                Button(action: {
                    // Action for X
                }) {
                    ZStack {
                        Circle()
                            .fill(Color.black)
                            .frame(width: 50, height: 50)
                        Image(systemName: "xmark")
                            .font(.system(size: 24, weight: .bold))
                            .foregroundColor(.white)
                    }
                }
            }
            .padding(.bottom, 40)
        }
    }
}

#Preview {
    LoginView(appState: AppState())
}

