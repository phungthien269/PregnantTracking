import Foundation

// Bản sao NGUYÊN VĂN struct PendingRequest từ MeVaBe/Services/OfflineQueue.swift (dòng 5-11).
// OfflineQueue.swift kéo theo CryptoKit + KeychainStore → không compile được trong test CLI
// (xem status: máy này KHÔNG có Xcode đầy đủ). Chỉ struct này là thuần Foundation nên copy ra
// để test Codable roundtrip (chính là payload dùng trong load()/persistLocked()).
// ⚠️ Nếu OfflineQueue.swift đổi struct này → cập nhật bản sao dưới đây.
// ⚠️ KHÔNG compile file này chung với MeVaBe/Services/OfflineQueue.swift (trùng symbol).

struct PendingRequest: Codable, Identifiable {
    let id: UUID
    let method: String
    let path: String
    let body: Data?   // JSON body; lưu trong file đã mã hóa.
    let createdAt: Date
}
