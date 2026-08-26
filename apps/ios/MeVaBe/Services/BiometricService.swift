import Foundation
import LocalAuthentication

/// Face ID / Touch ID dùng cho màn hình khóa app.
final class BiometricService {
    static let shared = BiometricService()
    private static let enabledKey = "vn.mevabe.biometricEnabled"

    var isBiometricEnabled: Bool {
        get { UserDefaults.standard.bool(forKey: Self.enabledKey) }
        set { UserDefaults.standard.set(newValue, forKey: Self.enabledKey) }
    }

    var isAvailable: Bool {
        var error: NSError?
        return LAContext().canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error)
    }

    var biometricName: String {
        let ctx = LAContext()
        _ = ctx.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: nil)
        return ctx.biometryType == .faceID ? "Face ID" : "Touch ID"
    }

    func authenticate(reason: String) async -> Bool {
        guard isAvailable else { return false }
        let ctx = LAContext()
        do {
            return try await ctx.evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, localizedReason: reason)
        } catch {
            return false
        }
    }
}
