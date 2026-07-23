import Foundation
import Combine

@MainActor
class AuthViewModel: ObservableObject {
    @Published var pairingCode: String = ""
    @Published var isLoading: Bool = false
    @Published var errorMessage: String? = nil
    
    private let apiClient = APIClient.shared
    private let keychain = KeychainService.shared
    private let appState: AppState
    
    init(appState: AppState) {
        self.appState = appState
        checkExistingSession()
    }
    
    func checkExistingSession() {
        if let _ = keychain.getToken() {
            // Assume token is valid for v1. In a real scenario, we'd validate it via API or decode JWT expiry.
            Task { @MainActor in
                appState.isAuthenticated = true
                appState.currentFlowState = .selectingProduct
            }
        }
    }
    
    func login() {
        guard !pairingCode.trimmingCharacters(in: .whitespaces).isEmpty else {
            errorMessage = "الرجاء إدخال كود الربط" // "Please enter pairing code"
            return
        }
        
        isLoading = true
        errorMessage = nil
        
        Task {
            do {
                let response = try await apiClient.pairDevice(code: pairingCode)
                
                // Save token securely
                if keychain.save(token: response.accessToken) {
                    appState.isAuthenticated = true
                    appState.currentFlowState = .selectingProduct
                } else {
                    errorMessage = "فشل في حفظ بيانات الدخول" // "Failed to save login data securely"
                }
            } catch {
                errorMessage = "رمز الربط غير صحيح أو حدث خطأ في الاتصال" // "Invalid pairing code or connection error"
            }
            isLoading = false
        }
    }
}
