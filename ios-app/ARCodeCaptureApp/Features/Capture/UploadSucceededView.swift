import SwiftUI

struct UploadSucceededView: View {
    @StateObject private var appState: AppState
    let remoteId: String
    
    init(appState: AppState, remoteId: String) {
        _appState = StateObject(wrappedValue: appState)
        self.remoteId = remoteId
    }
    
    var body: some View {
        VStack(spacing: 30) {
            Image(systemName: "checkmark.cloud.fill")
                .font(.system(size: 80))
                .foregroundColor(.green)
            
            Text("تم الرفع بنجاح!")
                .font(.title)
                .fontWeight(.bold)
            
            Text("تم استلام الصور من قبل الخادم الخاص بنا. سيتم إرسال إشعار لك في لوحة التحكم عند الانتهاء من معالجة النموذج.")
                .font(.body)
                .multilineTextAlignment(.center)
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
            .padding(.top, 20)
        }
        .padding()
    }
}
