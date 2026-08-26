import SwiftUI

struct LoginView: View {
    @EnvironmentObject private var appState: AppState
    @State private var email = ""
    @State private var password = ""
    @State private var isLoading = false
    @State private var errorText: String?

    var body: some View {
        VStack(spacing: 20) {
            Spacer()

            Image(systemName: "heart.circle.fill")
                .font(.system(size: 64))
                .foregroundColor(Theme.primary)
            Text("Mẹ & Bé")
                .font(.largeTitle.bold())
                .foregroundColor(Theme.text)
            Text("Đồng hành thai kỳ và chăm bé của gia đình Việt")
                .font(.subheadline)
                .foregroundColor(Theme.textMuted)
                .multilineTextAlignment(.center)

            VStack(spacing: 12) {
                TextField("Email", text: $email)
                    .textContentType(.emailAddress)
                    .keyboardType(.emailAddress)
                    .autocapitalization(.none)
                    .textFieldStyle(.roundedBorder)
                SecureField("Mật khẩu", text: $password)
                    .textContentType(.password)
                    .textFieldStyle(.roundedBorder)
            }

            if let errorText {
                Text(errorText)
                    .font(.footnote)
                    .foregroundColor(Theme.danger)
            }

            Button(action: signIn) {
                Group {
                    if isLoading {
                        ProgressView().tint(.white)
                    } else {
                        Text("Đăng nhập").bold()
                    }
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Theme.primary)
                .foregroundColor(.white)
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }
            .disabled(isLoading)

            if APIConfig.isDemoMode {
                Text("Chế độ demo — nhập email/mật khẩu bất kỳ để vào (dữ liệu mẫu).")
                    .font(.footnote)
                    .foregroundColor(Theme.textMuted)
                    .multilineTextAlignment(.center)
            }

            Spacer()
        }
        .padding(24)
        .background(Theme.background)
    }

    private func signIn() {
        isLoading = true
        errorText = nil
        Task {
            defer { isLoading = false }
            do {
                try await AuthService.shared.signIn(email: email, password: password)
                appState.didLogIn()
            } catch let error as APIError {
                errorText = error.errorDescription
            } catch {
                errorText = error.localizedDescription
            }
        }
    }
}
