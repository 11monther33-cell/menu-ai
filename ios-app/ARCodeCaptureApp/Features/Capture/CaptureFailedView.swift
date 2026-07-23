import SwiftUI

struct CaptureFailedView: View {
    @ObservedObject var appState: AppState
    
    var body: some View {
        VStack(spacing: 30) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 80))
                .foregroundColor(.orange)
            
            Text("فشل التصوير!")
                .font(.title)
                .fontWeight(.bold)
            
            if case .captureFailed(let reason) = appState.currentFlowState {
                Text(errorMessage(for: reason))
                    .font(.body)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)
            } else {
                Text("حدث خطأ أثناء عملية التصوير. يرجى المحاولة مرة أخرى.")
                    .font(.body)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)
            }
            
            Button(action: {
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
        }
        .padding()
    }
    
    private func errorMessage(for reason: CaptureFailureReason) -> String {
        switch reason {
        case .insufficientLighting: return "الإضاءة غير كافية."
        case .objectTooReflective: return "العنصر يعكس الضوء بشكل كبير."
        case .objectTooSmall: return "العنصر صغير جداً."
        case .movedTooFast: return "حركة سريعة جداً أثناء التصوير."
        case .sessionInterrupted: return "تمت مقاطعة جلسة التصوير."
        case .insufficientImages: return "عدد الصور غير كافٍ لبناء المجسم."
        case .lowStorage: return "لا توجد مساحة كافية في الهاتف."
        case .unknown(let msg): return msg
        }
    }
}
