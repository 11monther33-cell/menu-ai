import Foundation
import Combine

@MainActor
class ProductListViewModel: ObservableObject {
    @Published var products: [ProductDTO] = []
    @Published var filteredProducts: [ProductDTO] = []
    @Published var searchQuery: String = "" {
        didSet {
            filterProducts()
        }
    }
    @Published var isLoading: Bool = false
    @Published var errorMessage: String? = nil
    
    private let apiClient = APIClient.shared
    private let keychain = KeychainService.shared
    private let appState: AppState
    
    init(appState: AppState) {
        self.appState = appState
    }
    
    func fetchProducts() {
        guard let token = keychain.getToken() else {
            appState.logOut()
            return
        }
        
        isLoading = true
        errorMessage = nil
        
        Task {
            do {
                // Hardcoded restaurantId for now or fetch from a profile endpoint
                let restaurantId = "dummy_restaurant_id"
                self.products = try await apiClient.fetchProducts(restaurantId: restaurantId, token: token)
                self.filteredProducts = self.products
            } catch {
                self.errorMessage = "فشل في جلب قائمة المنتجات" // "Failed to fetch products list"
            }
            isLoading = false
        }
    }
    
    private func filterProducts() {
        if searchQuery.isEmpty {
            filteredProducts = products
        } else {
            filteredProducts = products.filter { $0.name.localizedCaseInsensitiveContains(searchQuery) }
        }
    }
    
    func selectProduct(_ product: ProductDTO) {
        appState.selectedProductId = product.id
        appState.currentFlowState = .activeCapture
    }
}
