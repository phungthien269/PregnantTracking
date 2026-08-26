import Foundation

// Khế ước REST web (contracts.md + api-reference.md):
//   thành công: { "data": ... }
//   lỗi:        { "error": { "code", "message" } }
//   phân trang: { "data": [...], "next_cursor": ..., "has_more": bool }
// Auth: Supabase session → header "Authorization: Bearer <token>".

enum APIConfig {
    static var apiBaseURL: URL {
        if let s = Bundle.main.object(forInfoDictionaryKey: "MV_API_BASE_URL") as? String,
           !s.isEmpty, let u = URL(string: s) {
            return u
        }
        return URL(string: "http://localhost:3000")!
    }

    static var supabaseURL: URL? {
        guard let s = Bundle.main.object(forInfoDictionaryKey: "MV_SUPABASE_URL") as? String, !s.isEmpty else { return nil }
        return URL(string: s)
    }

    static var supabaseAnonKey: String {
        Bundle.main.object(forInfoDictionaryKey: "MV_SUPABASE_ANON_KEY") as? String ?? ""
    }

    /// Không cấu hình Supabase → chế độ demo (mock, đăng nhập tùy ý).
    static var isDemoMode: Bool { supabaseURL == nil }
}

/// Body rỗng khi client không cần đọc data phản hồi (mutation).
struct EmptyBody: Decodable {}

struct APIDetail: Decodable {
    let code: String
    let message: String
}

struct Envelope<T: Decodable>: Decodable {
    let data: T?
    let error: APIDetail?
}

struct Page<T: Decodable>: Decodable {
    let items: [T]
    let nextCursor: String?
    let hasMore: Bool?

    private enum CodingKeys: String, CodingKey {
        case items = "data"
        case nextCursor = "next_cursor"
        case hasMore = "has_more"
    }
}

enum APIError: Error, LocalizedError {
    case server(status: Int, code: String, message: String)
    case decoding(String)
    case network(Error)

    var errorDescription: String? {
        switch self {
        case .server(_, _, let message): return message
        case .decoding: return "Không thể đọc dữ liệu từ máy chủ."
        case .network: return "Không kết nối được máy chủ. Hãy thử lại."
        }
    }
}

enum Path {
    static let pregnancies = "/v1/pregnancies"
    static let meals = "/v1/meals"
    static let symptoms = "/v1/symptoms"
    static let measurements = "/v1/measurements"
    static let tasks = "/v1/tasks"
    static let appointments = "/v1/appointments"
    static let dailyLogs = "/v1/daily-logs"
    static let children = "/v1/children"
    static let healthSync = "/v1/health-sync"
    static let notifications = "/v1/notifications"

    static func child(_ id: String, _ sub: String) -> String { "/v1/children/\(id)/\(sub)" }
}

final class APIClient {
    static let shared = APIClient()

    private let baseURL: URL
    private let session: URLSession
    private let decoder: JSONDecoder

    init(baseURL: URL = APIConfig.apiBaseURL) {
        self.baseURL = baseURL
        session = URLSession(configuration: .ephemeral)
        let d = JSONDecoder()
        d.keyDecodingStrategy = .convertFromSnakeCase
        decoder = d
    }

    private var authToken: String? {
        guard let s = AuthService.shared.session, !s.isDemo else { return nil }
        return s.accessToken
    }

    func get<T: Decodable>(_ type: T.Type, path: String, query: [URLQueryItem]? = nil) async throws -> T {
        let env: Envelope<T> = try await request(path: path, method: "GET", query: query, body: nil)
        return try unwrap(env)
    }

    /// GET cho entity có thể null (v.d. chưa có thai kỳ).
    func getOptional<T: Decodable>(_ type: T.Type, path: String) async throws -> T? {
        let env: Envelope<T?> = try await request(path: path, method: "GET", query: nil, body: nil)
        return env.data ?? nil
    }

    func post<T: Decodable>(_ type: T.Type, path: String, body: Data?) async throws -> T {
        let env: Envelope<T> = try await request(path: path, method: "POST", query: nil, body: body)
        return try unwrap(env)
    }

    private func unwrap<T>(_ env: Envelope<T>) throws -> T {
        guard let value = env.data else { throw APIError.decoding("Thiếu trường data") }
        return value
    }

    private func request<T: Decodable>(
        _ type: T.Type = T.self,
        path: String,
        method: String,
        query: [URLQueryItem]?,
        body: Data?
    ) async throws -> T {
        var comps = URLComponents(url: baseURL.appendingPathComponent(path), resolvingAgainstBaseURL: false)
        comps?.queryItems = query
        guard let url = comps?.url else { throw APIError.decoding("URL không hợp lệ") }

        var req = URLRequest(url: url)
        req.httpMethod = method
        req.timeoutInterval = 20
        if let token = authToken {
            req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        if let body {
            req.setValue("application/json", forHTTPHeaderField: "Content-Type")
            req.httpBody = body
        }

        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await session.data(for: req)
        } catch {
            throw APIError.network(error)
        }
        guard let http = response as? HTTPURLResponse else {
            throw APIError.decoding("Phản hồi không hợp lệ")
        }
        guard (200..<300).contains(http.statusCode) else {
            let detail = try? decoder.decode(ErrorEnvelope.self, from: data)
            throw APIError.server(
                status: http.statusCode,
                code: detail?.error.code ?? "http_\(http.statusCode)",
                message: detail?.error.message ?? "Lỗi máy chủ (\(http.statusCode))"
            )
        }
        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            throw APIError.decoding(error.localizedDescription)
        }
    }

    private struct ErrorEnvelope: Decodable {
        let error: APIDetail
    }
}
