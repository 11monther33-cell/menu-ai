import SwiftUI

struct UploadFailedView: View {
    @StateObject private var appState: AppState
    let error: String
    
    init(appState: AppState, error: String) {
        _appState = StateObject(wrappedValue: appState)
        self.error = error
    }
    
    var body: some View {
        VStack(spacing: 30) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 80))
                .foregroundColor(.red)
            
            Text("فشل الرفع!")
                .font(.title)
                .fontWeight(.bold)
            
            Text("حدث خطأ أثناء رفع الصور إلى الخادم: \(error)")
                .font(.body)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
            
            Button(action: {
                // Retry or return to start
                appState.currentFlowState = .selectingProduct
                appState.selectedProductId = nil
            }) {
                Text("حسناً، العودة للقائمة")
                    .fontWeight(.bold)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(10)
            }
            .padding(.horizontal, 40)
            .padding(.top, 20)
        }
        .padding()
    }
}
