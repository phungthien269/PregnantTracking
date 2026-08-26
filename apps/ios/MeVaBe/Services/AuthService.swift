import Foundation

struct Session: Codable {
    var accessToken: String
    var refreshToken: String?
    var userId: String?
    var expiresAt: Date?
    var isDemo: Bool
}

/// Đăng nhập qua Supabase Auth (goTrue REST) nếu cấu hình; ngược lại chế độ demo.
/// Session lưu Keychain. API client gắn "Authorization: Bearer" tự động.
final class AuthService {
    static let shared = AuthService()
    private static let sessionKey = "vn.mevabe.session"

    private(set) var session: Session? {
        didSet {
            if let session, let data = try? JSONEncoder().encode(session) {
                KeychainStore.set(data, for: Self.sessionKey)
            } else {
                KeychainStore.delete(Self.sessionKey)
            }
        }
    }

    var isLoggedIn: Bool { session != nil }

    private init() {
        if let data = KeychainStore.get(Self.sessionKey),
           let s = try? JSONDecoder().decode(Session.self, from: data) {
            session = s
        }
    }

    func signIn(email: String, password: String) async throws {
        // Demo mode: không có Supabase → vào ngay với dữ liệu mock của web.
        guard let supabase = APIConfig.supabaseURL else {
            session = Session(accessToken: "demo-token", userId: nil, expiresAt: nil, isDemo: true)
            return
        }

        var comps = URLComponents(
            url: supabase.appendingPathComponent("auth/v1/token"),
            resolvingAgainstBaseURL: false
        )!
        comps.queryItems = [URLQueryItem(name: "grant_type", value: "password")]

        var req = URLRequest(url: comps.url!)
        req.httpMethod = "POST"
        req.setValue(APIConfig.supabaseAnonKey, forHTTPHeaderField: "apikey")
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try JSONSerialization.data(withJSONObject: ["email": email, "password": password])

        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await URLSession.shared.data(for: req)
        } catch {
            throw APIError.network(error)
        }
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw APIError.server(
                status: (response as? HTTPURLResponse)?.statusCode ?? 400,
                code: "auth_failed",
                message: "Email hoặc mật khẩu không đúng."
            )
        }

        struct Token: Decodable {
            let access_token: String
            let refresh_token: String?
            struct User: Decodable { let id: String }
            let user: User?
        }
        let token = try JSONDecoder().decode(Token.self, from: data)
        session = Session(
            accessToken: token.access_token,
            refreshToken: token.refresh_token,
            userId: token.user?.id,
            expiresAt: nil,
            isDemo: false
        )
    }

    func signOut() {
        session = nil
    }
}
