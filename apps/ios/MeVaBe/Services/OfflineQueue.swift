import CryptoKit
import Foundation

/// Một thao tác ghi nhanh chờ đồng bộ (POST) lên REST /api/v1.
struct PendingRequest: Codable, Identifiable {
    let id: UUID
    let method: String
    let path: String
    let body: Data?   // JSON body; lưu trong file đã mã hóa.
    let createdAt: Date
}

/// Queue "ghi nhanh offline": file mã hóa AES-GCM, khóa nằm trong Keychain.
/// Chống đọc trộm khi jailbreak/sao chép file; thread-safe bằng NSLock.
final class OfflineQueue {
    static let shared = OfflineQueue()

    private static let dataKey = "vn.mevabe.offlinequeue.data"
    private static let cryptoKeyKey = "vn.mevabe.offlinequeue.key"

    private let fileURL: URL
    private let cryptoKey: SymmetricKey
    private let lock = NSLock()
    private var items: [PendingRequest] = []

    init() {
        let dir = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        fileURL = dir.appendingPathComponent("offline_queue.bin")

        if let keyData = KeychainStore.get(Self.cryptoKeyKey) {
            cryptoKey = SymmetricKey(data: keyData)
        } else {
            let key = SymmetricKey(size: .bits256)
            KeychainStore.set(key.withUnsafeBytes { Data($0) }, for: Self.cryptoKeyKey)
            cryptoKey = key
        }
        load()
    }

    var count: Int {
        lock.lock(); defer { lock.unlock() }
        return items.count
    }

    func enqueue(method: String, path: String, body: Data?) {
        lock.lock(); defer { lock.unlock() }
        items.append(PendingRequest(id: UUID(), method: method, path: path, body: body, createdAt: Date()))
        persistLocked()
    }

    func all() -> [PendingRequest] {
        lock.lock(); defer { lock.unlock() }
        return items
    }

    func remove(_ id: UUID) {
        lock.lock(); defer { lock.unlock() }
        items.removeAll { $0.id == id }
        persistLocked()
    }

    // MARK: - Persistence (mã hóa)

    private func load() {
        guard let data = try? Data(contentsOf: fileURL) else { return }
        guard let box = try? AES.GCM.SealedBox(combined: data),
              let plain = try? AES.GCM.open(box, using: cryptoKey) else {
            // File hỏng (khóa mất…) → khởi động lại queue trống.
            try? FileManager.default.removeItem(at: fileURL)
            return
        }
        items = (try? JSONDecoder().decode([PendingRequest].self, from: plain)) ?? []
    }

    private func persistLocked() {
        guard let plain = try? JSONEncoder().encode(items),
              let box = try? AES.GCM.seal(plain, using: cryptoKey),
              let combined = box.combined else { return }
        try? combined.write(to: fileURL, options: .atomic)
    }
}
