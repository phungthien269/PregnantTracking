import Combine
import Foundation

/// Trạng thái phiên của app: đã đăng nhập chưa, có đang khóa không, queue offline.
final class AppState: ObservableObject {
    static let shared = AppState()

    @Published var session: Session?
    @Published var isUnlocked: Bool
    @Published var offlineCount: Int

    private init() {
        session = AuthService.shared.session
        isUnlocked = !BiometricService.shared.isBiometricEnabled
        offlineCount = OfflineQueue.shared.count
    }

    /// Gọi 1 lần khi root hiện ra: đăng ký push + đếm lại queue.
    func activate() {
        Task { await PushService.shared.setup() }
        refreshOfflineCount()
    }

    func didLogIn() {
        session = AuthService.shared.session
        isUnlocked = !BiometricService.shared.isBiometricEnabled
    }

    func didSignOut() {
        session = nil
        isUnlocked = !BiometricService.shared.isBiometricEnabled
    }

    func didUpdateSecurity() {
        isUnlocked = !BiometricService.shared.isBiometricEnabled
    }

    func unlock() { isUnlocked = true }

    func refreshOfflineCount() {
        offlineCount = OfflineQueue.shared.count
    }
}
