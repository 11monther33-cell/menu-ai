import SwiftUI

struct ModelCompletedView: View {
    @StateObject private var appState: AppState
    let modelURL: URL
    
    init(appState: AppState, modelURL: URL) {
        _appState = StateObject(wrappedValue: appState)
        self.modelURL = modelURL
    }
    
    var body: some View {
        VStack(spacing: 30) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 80))
                .foregroundColor(.green)
            
            Text("تم الانتهاء بنجاح!")
                .font(.title)
                .fontWeight(.bold)
            
            Text("تم إنشاء النموذج ثلاثي الأبعاد بنجاح. يمكنك الآن مراجعته.")
                .font(.body)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
            
            // In a real app, this would be a Model3D view showing the USDZ file
            Rectangle()
                .fill(Color.gray.opacity(0.2))
                .frame(height: 250)
                .cornerRadius(15)
                .overlay(
                    Image(systemName: "cube")
                        .font(.system(size: 50))
                        .foregroundColor(.gray)
                )
                .padding(.horizontal)
            
            Button(action: {
                // Return to product list
                appState.currentFlowState = .selectingProduct
                appState.selectedProductId = nil
            }) {
                Text("العودة للقائمة")
                    .fontWeight(.bold)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(10)
            }
            .padding(.horizontal, 40)
            .padding(.bottom, 30)
        }
        .padding(.top, 40)
    }
}
