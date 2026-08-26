import SwiftUI

struct SettingsView: View {
    @EnvironmentObject private var appState: AppState
    @State private var reminders: [Reminder] = []

    var body: some View {
        NavigationStack {
            Form {
                Section("Tài khoản") {
                    LabeledContent("Trạng thái", value: APIConfig.isDemoMode ? "Demo" : "Đã đăng nhập")
                    if APIConfig.isDemoMode {
                        Text("Chế độ demo: dữ liệu mẫu từ web, không cần backend.")
                            .font(.footnote)
                            .foregroundColor(Theme.textMuted)
                    }
                    Button("Đăng xuất", role: .destructive) {
                        AuthService.shared.signOut()
                        appState.didSignOut()
                    }
                }

                Section("Bảo mật") {
                    Toggle("Khóa bằng sinh trắc học", isOn: Binding(
                        get: { BiometricService.shared.isBiometricEnabled },
                        set: { BiometricService.shared.isBiometricEnabled = $0; appState.didUpdateSecurity() }
                    ))
                    .disabled(!BiometricService.shared.isAvailable)
                }

                Section("Sức khỏe & Đồng bộ") {
                    NavigationLink("Sức khỏe (HealthKit)") { HealthSettingsView() }
                    if appState.offlineCount > 0 {
                        Label("\(appState.offlineCount) mục chờ đồng bộ", systemImage: "icloud.slash")
                            .foregroundColor(Theme.textMuted)
                    }
                }

                Section("Nhắc lịch") {
                    if reminders.isEmpty {
                        Text("Chưa có nhắc lịch từ máy chủ.")
                            .font(.footnote)
                            .foregroundColor(Theme.textMuted)
                    } else {
                        ForEach(reminders) { reminder in
                            Label(reminder.title, systemImage: "bell.fill")
                        }
                    }
                }

                Section("Thông tin") {
                    LabeledContent("Phiên bản", value: "0.1.0")
                    NavigationLink("Thẻ khẩn cấp") { EmergencyView() }
                }
            }
            .navigationTitle("Cài đặt")
            .task {
                if reminders.isEmpty,
                   let loaded = try? await APIClient.shared.get([Reminder].self, path: Path.notifications) {
                    reminders = loaded
                }
            }
        }
    }
}
