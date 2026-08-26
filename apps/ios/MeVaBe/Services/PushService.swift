import Foundation
import UIKit
import UserNotifications

/// Đăng ký push (APNs) + upload token. Nhận reminder từ backend
/// (xem notification_preferences — nối trong Cài đặt).
final class PushService {
    static let shared = PushService()
    private static let tokenKey = "vn.mevabe.deviceToken"

    private(set) var deviceToken: String? {
        get { UserDefaults.standard.string(forKey: Self.tokenKey) }
        set { UserDefaults.standard.set(newValue, forKey: Self.tokenKey) }
    }

    func setup() async {
        let granted = await requestAuthorization()
        guard granted else { return }
        await MainActor.run { UIApplication.shared.registerForRemoteNotifications() }
    }

    func requestAuthorization() async -> Bool {
        do {
            return try await UNUserNotificationCenter.current()
                .requestAuthorization(options: [.alert, .badge, .sound])
        } catch {
            return false
        }
    }

    func setDeviceToken(_ data: Data) {
        let token = data.map { String(format: "%02x", $0) }.joined()
        deviceToken = token
        Task { await uploadToken(token) }
    }

    private func uploadToken(_ token: String) async {
        // Backend chưa có endpoint device-token (phase2-agent-7) — best-effort,
        // lỗi bỏ qua (token vẫn giữ local để retry khi backend xong).
        guard let body = try? JSONSerialization.data(withJSONObject: ["token": token, "platform": "ios"]) else { return }
        _ = try? await APIClient.shared.post(EmptyBody.self, path: "/v1/notifications/device-token", body: body)
    }
}
