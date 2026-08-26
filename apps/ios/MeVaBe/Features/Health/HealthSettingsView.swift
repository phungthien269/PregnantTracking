import HealthKit
import SwiftUI

/// Xin quyền từng loại dữ liệu HealthKit, xem trạng thái, đồng bộ, và hướng dẫn
/// thu hồi quyền (thu hồi trong app Sức khỏe — Apple không cho app thu hồi hộ).
struct HealthSettingsView: View {
    @State private var syncMessage: String?
    @State private var isSyncing = false

    var body: some View {
        List {
            Section {
                if !HealthKitService.shared.isAvailable {
                    Text("Thiết bị không hỗ trợ HealthKit (cần iPhone thật).")
                        .foregroundColor(Theme.textMuted)
                } else {
                    Button(action: authorizeAll) {
                        Label("Xin quyền tất cả dữ liệu sức khỏe", systemImage: "heart.text.square")
                    }
                }
            } footer: {
                Text("Mẹ & Bé chỉ đọc/ghi các loại dữ liệu bạn cấp. Bạn có thể thu hồi bất cứ lúc nào trong ứng dụng Sức khỏe (Health).")
            }

            Section("Dữ liệu") {
                ForEach(HealthDataType.allCases) { type in
                    HStack {
                        Text(type.displayName)
                        Spacer()
                        statusBadge(type)
                    }
                }
            }

            Section {
                Button(action: sync) {
                    HStack {
                        Spacer()
                        if isSyncing {
                            ProgressView()
                        } else {
                            Text("Đồng bộ lên máy chủ")
                        }
                        Spacer()
                    }
                }
                .disabled(!HealthKitService.shared.isAvailable || isSyncing)

                if let syncMessage {
                    Text(syncMessage)
                        .font(.footnote)
                        .foregroundColor(Theme.textMuted)
                }
            } footer: {
                Text("Gửi mẫu HealthKit lên hồ sơ thai kỳ (cần backend /v1/health-sync). Không ghi đè dữ liệu nhập tay.")
            }

            Section {
                Button("Mở ứng dụng Sức khỏe để quản lý quyền") {
                    if let url = URL(string: "x-apple-health://") {
                        UIApplication.shared.open(url)
                    }
                }
            }
        }
        .navigationTitle("Sức khỏe (HealthKit)")
    }

    private func statusBadge(_ type: HealthDataType) -> some View {
        let text: String
        let color: Color
        switch HealthKitService.shared.authorizationStatus(for: type) {
        case .sharingAuthorized: text = "Đã cấp"; color = Theme.accent
        case .sharingDenied: text = "Từ chối"; color = Theme.danger
        default: text = "Chưa xin"; color = Theme.textMuted
        }
        return Text(text)
            .font(.caption)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(color.opacity(0.15))
            .foregroundColor(color)
            .clipShape(Capsule())
    }

    private func authorizeAll() {
        Task {
            do {
                try await HealthKitService.shared.requestAuthorization(for: Array(HealthDataType.allCases))
            } catch {
                syncMessage = "Không xin được quyền: \(error.localizedDescription)"
            }
        }
    }

    private func sync() {
        isSyncing = true
        syncMessage = nil
        Task {
            defer { isSyncing = false }
            let start = Calendar.current.date(byAdding: .day, value: -30, to: Date()) ?? Date()
            var samples: [HealthSample] = []
            for type in HealthDataType.allCases {
                samples += await HealthKitService.shared.readSamples(of: type, from: start, to: Date())
            }
            do {
                try await SyncService.shared.syncHealthToBackend(samples)
                syncMessage = "Đã đồng bộ \(samples.count) mẫu."
            } catch {
                syncMessage = "Đồng bộ chưa xong (backend /v1/health-sync đang chờ) — dữ liệu vẫn ở máy."
            }
        }
    }
}
