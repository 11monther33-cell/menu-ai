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
    
    // Upload 3D Model
    func upload3DModel(productId: String, fileURL: URL, token: String) async throws {
        // 1. Get Presigned URL
        guard let presignURL = URL(string: "\(baseURL)/dishes/\(productId)/model3d/presign") else { throw APIError.invalidURL }
        var presignReq = URLRequest(url: presignURL)
        presignReq.httpMethod = "POST"
        presignReq.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        presignReq.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let presignBody = ["extension": "usdz"]
        presignReq.httpBody = try JSONSerialization.data(withJSONObject: presignBody)
        
        let (presignData, presignRes) = try await URLSession.shared.data(for: presignReq)
        guard let pRes = presignRes as? HTTPURLResponse, pRes.statusCode == 200 else { throw APIError.invalidResponse }
        
        struct PresignResponse: Codable {
            let signedUrl: String
            let publicUrl: String
        }
        let presignResult = try JSONDecoder().decode(PresignResponse.self, from: presignData)
        
        // 2. Upload File to S3/R2 directly
        guard let uploadURL = URL(string: presignResult.signedUrl) else { throw APIError.invalidURL }
        var uploadReq = URLRequest(url: uploadURL)
        uploadReq.httpMethod = "PUT"
        uploadReq.setValue("model/vnd.usdz+zip", forHTTPHeaderField: "Content-Type")
        
        let fileData = try Data(contentsOf: fileURL)
        let (_, uploadRes) = try await URLSession.shared.upload(for: uploadReq, from: fileData)
        guard let uRes = uploadRes as? HTTPURLResponse, uRes.statusCode == 200 else { throw APIError.requestFailed(NSError(domain: "", code: 0)) }
        
        // 3. Confirm Upload with backend
        guard let confirmURL = URL(string: "\(baseURL)/dishes/\(productId)/model3d/confirm") else { throw APIError.invalidURL }
        var confirmReq = URLRequest(url: confirmURL)
        confirmReq.httpMethod = "POST"
        confirmReq.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        confirmReq.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let confirmBody = ["publicUrl": presignResult.publicUrl]
        confirmReq.httpBody = try JSONSerialization.data(withJSONObject: confirmBody)
        
        let (_, confirmRes) = try await URLSession.shared.data(for: confirmReq)
        guard let cRes = confirmRes as? HTTPURLResponse, cRes.statusCode == 200 else { throw APIError.invalidResponse }
    }
}
