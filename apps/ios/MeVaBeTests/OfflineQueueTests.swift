import XCTest
@testable import MeVaBe

final class OfflineQueueTests: XCTestCase {
    func testEnqueueAndRemoveRoundtrip() {
        let queue = OfflineQueue.shared
        let before = queue.count
        queue.enqueue(method: "POST", path: "/v1/meals", body: Data("{}".utf8))
        XCTAssertEqual(queue.count, before + 1)

        guard let last = queue.all().last else {
            return XCTFail("queue phải có 1 mục vừa thêm")
        }
        queue.remove(last.id)
        XCTAssertEqual(queue.count, before)
    }

    func testEncryptedFileIsNotPlaintext() throws {
        let queue = OfflineQueue.shared
        queue.enqueue(method: "POST", path: "/v1/symptoms", body: Data(#"{"symptom":"đau đầu"}"#.utf8))
        let dir = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        let raw = try Data(contentsOf: dir.appendingPathComponent("offline_queue.bin"))
        let plain = String(data: raw, encoding: .utf8) ?? ""
        XCTAssertFalse(plain.contains("đau đầu"), "file lưu phải được mã hóa, không lộ nội dung")

        // dọn mục vừa thêm
        if let last = queue.all().last { queue.remove(last.id) }
    }
}
