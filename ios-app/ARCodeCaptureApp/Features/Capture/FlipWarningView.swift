import SwiftUI

struct FlipWarningView: View {
    @StateObject private var appState: AppState
    @StateObject private var viewModel: CaptureViewModel
    
    init(appState: AppState) {
        _appState = StateObject(wrappedValue: appState)
        _viewModel = StateObject(wrappedValue: CaptureViewModel(appState: appState))
    }
    
    var body: some View {
        VStack(spacing: 30) {
            Image(systemName: "arrow.triangle.2.circlepath")
                .font(.system(size: 80))
                .foregroundColor(.orange)
            
            Text("اقلب العنصر!")
                .font(.title)
                .fontWeight(.bold)
            
            Text("لتصوير الجزء السفلي من العنصر، الرجاء قلبه بعناية.")
                .font(.body)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
            
            HStack(spacing: 20) {
                Button(action: {
                    viewModel.skipFlipAndContinue()
                }) {
                    Text("تخطي")
                        .fontWeight(.semibold)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.gray.opacity(0.2))
                        .foregroundColor(.primary)
                        .cornerRadius(10)
                }
                
                Button(action: {
                    // Continue capturing
                    appState.currentFlowState = .capturing(imageCount: 0, totalRecommended: 30)
                }) {
                    Text("متابعة التصوير")
                        .fontWeight(.bold)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                }
            }
            .padding(.horizontal, 30)
        }
        .padding()
    }
}
