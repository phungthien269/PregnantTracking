import SwiftUI

/// Màn hình khóa: bật sinh trắc học → cần Face ID / Touch ID để vào app.
struct LockView: View {
    @EnvironmentObject private var appState: AppState
    @State private var isAuthenticating = false

    var body: some View {
        VStack(spacing: 24) {
            Spacer()

            Image(systemName: "lock.fill")
                .font(.system(size: 56))
                .foregroundColor(Theme.primary)
            Text("Mẹ & Bé bị khóa")
                .font(.title2.bold())
                .foregroundColor(Theme.text)
            Text("Mở khóa bằng \(BiometricService.shared.biometricName) để bảo vệ dữ liệu riêng tư.")
                .font(.subheadline)
                .foregroundColor(Theme.textMuted)
                .multilineTextAlignment(.center)

            Button(action: unlock) {
                Label("Mở khóa", systemImage: "faceid")
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Theme.primary)
                    .foregroundColor(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
            }
            .disabled(isAuthenticating)

            Button("Bỏ qua (không dùng sinh trắc học)") { appState.unlock() }
                .font(.footnote)
                .foregroundColor(Theme.textMuted)

            Spacer()
        }
        .padding(24)
        .background(Theme.background)
        .onAppear { Task { await unlock() } }
    }

    private func unlock() async {
        guard !isAuthenticating else { return }
        isAuthenticating = true
        let ok = await BiometricService.shared.authenticate(reason: "Mở khóa Mẹ & Bé")
        if ok { appState.unlock() }
        isAuthenticating = false
    }
}
