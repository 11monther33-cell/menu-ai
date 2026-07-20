import Foundation

enum APIError: Error {
    case invalidURL
    case requestFailed(Error)
    case invalidResponse
    case decodingFailed(Error)
    case serverError(Int)
}

struct ProductDTO: Codable, Identifiable {
    let id: String
    let name: String
    let thumbnailUrl: String?
    let has3DModel: Bool
}

class APIClient {
    static let shared = APIClient()
    private let baseURL = "https://menu-ai-api.yourrestaurant.com/api" // Adjust to match backend
    
    // Auth - Device Pair
    func pairDevice(code: String) async throws -> (accessToken: String, refreshToken: String) {
        // Placeholder for API call
        // POST /api/auth/device-pair
        // Body: { "pairingCode": code }
        try await Task.sleep(nanoseconds: 1_000_000_000)
        return ("dummy_access_token", "dummy_refresh_token")
    }
    
    // Auth - Refresh
    func refreshToken(refreshToken: String) async throws -> String {
        // Placeholder for API call
        // POST /api/auth/refresh
        try await Task.sleep(nanoseconds: 500_000_000)
        return "new_dummy_access_token"
    }
    
    // Fetch Products
    func fetchProducts(restaurantId: String, token: String) async throws -> [ProductDTO] {
        // Placeholder for API call
        // GET /api/products?restaurantId=\(restaurantId)
        try await Task.sleep(nanoseconds: 1_000_000_000)
        return [
            ProductDTO(id: "1", name: "Classic Burger", thumbnailUrl: nil, has3DModel: false),
            ProductDTO(id: "2", name: "Margherita Pizza", thumbnailUrl: nil, has3DModel: true)
        ]
    }
}
