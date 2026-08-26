import Foundation

/// Đồng bộ: đẩy queue ghi nhanh lên máy chủ + gửi mẫu HealthKit.
/// Không xóa mục queue khi lỗi (mất mạng / endpoint backend chưa có) — giữ lại,
/// flush lại ở lần sau; offline-first theo yêu cầu.
final class SyncService {
    static let shared = SyncService()
    private let client = APIClient.shared

    func flushQueue() async {
        for item in OfflineQueue.shared.all() where item.method == "POST" {
            do {
                _ = try await client.post(EmptyBody.self, path: item.path, body: item.body)
                OfflineQueue.shared.remove(item.id)
            } catch {
                // giữ nguyên — thử lại ở lần flush sau (network / backend chưa có endpoint)
            }
        }
    }

    /// Đồng bộ mẫu HealthKit lên hồ sơ thai kỳ. `/v1/health-sync` hiện trả 501
    /// (backend phase2-agent-7) → lỗi báo lên UI, dữ liệu vẫn còn ở máy.
    func syncHealthToBackend(_ samples: [HealthSample]) async throws {
        guard !samples.isEmpty else { return }
        let body = try JSONSerialization.data(
            withJSONObject: ["source": "healthkit", "samples": samples.map { $0.asJSON() }]
        )
        _ = try await client.post(EmptyBody.self, path: Path.healthSync, body: body)
    }
}
