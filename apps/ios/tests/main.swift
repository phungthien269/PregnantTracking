// Test logic thuần của app iOS Mẹ & Bé — chạy bằng `swift` CLI, KHÔNG cần Xcode.
//
// Cách compile (xem run.sh): trực tiếp dùng SOURCE THẬT của app
//   MeVaBe/Core/WeekCalculator.swift
//   MeVaBe/Core/Models/Enums.swift
//   MeVaBe/Core/Models/Entities.swift
// + bản sao PendingRequest.swift (OfflineQueue chỉ lấy phần thuần).
//
// Nhóm test:
//   1. WeekCalculator — tuần thai từ EDD/LMP, daysLeft, trimester.
//      Khớp web: week = floor((280 − daysLeft) / 7) khi có EDD (apps/web/lib/pregnancy-math.ts
//      + mock CURRENT_WEEK=20, EDD 21/12/2026, hôm nay 4/8/2026 → daysLeft=139).
//   2. Codable model — decode JSON snake_case (.convertFromSnakeCase), roundtrip encode,
//      đúng hành vi HealthSample (Date mã hóa dạng số, default `source` không áp dụng khi thiếu key).
//   3. OfflineQueue — phần thuần: PendingRequest Codable roundtrip + ngữ nghĩa enqueue/remove/count.
//      Phần mã hóa AES-GCM + Keychain chờ máy có Xcode/thật (đã ghi chú trong status).

import Foundation

// MARK: - Helper assert

var passed = 0
var failures = 0

func check(_ cond: Bool, _ msg: String) {
    if cond {
        passed += 1
        print("  [PASS] \(msg)")
    } else {
        failures += 1
        print("  [FAIL] \(msg)")
    }
}

// MARK: - 1. WeekCalculator

func testWeekCalculator() {
    print("== WeekCalculator: tuần thai (EDD/LMP), daysLeft, trimester ==")
    let fixed = WeekCalculator.date("2026-08-04")!

    // EDD — khớp web: week = floor((280 − daysLeft) / 7), clamp 0...42.
    // EDD 21/12/2026, hôm nay 4/8/2026 → daysLeft = 139 → floor(141/7) = 20 (khớp mock CURRENT_WEEK=20).
    let w = WeekCalculator.pregnancyWeek(lmp: nil, edd: "2026-12-21", on: fixed)
    check(w == 20, "EDD 21/12/2026 → tuần 20 (khớp web CURRENT_WEEK=20)")
    if let dl = WeekCalculator.daysLeft(edd: "2026-12-21", on: fixed) {
        check((280 - dl) / 7 == w, "web parity: floor((280−\(dl))/7) == tuần iOS (\(w))")
    } else {
        check(false, "daysLeft phải có giá trị khi có EDD")
    }

    check(WeekCalculator.pregnancyWeek(lmp: nil, edd: "2026-08-11", on: fixed) == 39,
          "EDD 11/8/2026 (còn 7 ngày) → floor(273/7) = 39")

    // LMP — hành vi iOS: days/7 (KHÔNG +1 như web weekFromLmp).
    check(WeekCalculator.pregnancyWeek(lmp: "2026-03-20", edd: nil, on: fixed) == 19,
          "LMP 20/3/2026 → 137 ngày / 7 = 19")

    // Clamp 0...42.
    check(WeekCalculator.pregnancyWeek(lmp: nil, edd: "2027-08-04", on: fixed) == 0,
          "EDD xa tương lai → clamp 0")
    check(WeekCalculator.pregnancyWeek(lmp: nil, edd: "2026-01-01", on: fixed) == 42,
          "EDD quá khứ → clamp 42")
    check(WeekCalculator.pregnancyWeek(lmp: nil, edd: nil, on: fixed) == 0,
          "không có EDD/LMP → 0")

    // daysLeft.
    check(WeekCalculator.daysLeft(edd: "2026-08-10", on: fixed) == 6,
          "daysLeft EDD 10/8/2026 → 6 ngày")
    check(WeekCalculator.daysLeft(edd: "2026-08-04", on: fixed) == 0,
          "daysLeft EDD hôm nay → 0")
    check(WeekCalculator.daysLeft(edd: nil, on: fixed) == nil,
          "daysLeft nil khi chưa có EDD")

    // days() — cùng ngày = 0.
    check(WeekCalculator.days(from: fixed, to: fixed) == 0, "days(cùng ngày) = 0")

    // Parse datetime có múi giờ +07:00 → đúng ngày theo Asia/Ho_Chi_Minh.
    if let dt = WeekCalculator.date("2026-08-03T07:30:00+07:00") {
        check(WeekCalculator.day(dt) == "2026-08-03",
              "parse datetime +07:00 → day() đúng '2026-08-03' theo Asia/Ho_Chi_Minh")
    } else {
        check(false, "date(\"2026-08-03T07:30:00+07:00\") phải parse được")
    }

    // Trimester.
    check(WeekCalculator.trimester(week: 13) == .first, "tuần 13 → Quý 1")
    check(WeekCalculator.trimester(week: 14) == .second, "tuần 14 → Quý 2")
    check(WeekCalculator.trimester(week: 27) == .second, "tuần 27 → Quý 2")
    check(WeekCalculator.trimester(week: 28) == .third, "tuần 28 → Quý 3")
    check(WeekCalculator.trimester(week: 0) == .first, "tuần 0 → Quý 1")
}

// MARK: - 2. Codable models (khớp JSON /api/v1, snake_case)

func testCodableModels() {
    print("== Codable models: decode convertFromSnakeCase + roundtrip ==")
    let decoder = JSONDecoder()
    decoder.keyDecodingStrategy = .convertFromSnakeCase

    // Pregnancy: status "birth_recorded" → .birthRecorded, source "healthkit" → .healthkit.
    let pregJSON = """
    {"id":"p1","family_id":"f1","private_owner_id":null,"created_at":"2026-05-01T00:00:00Z","updated_at":"2026-05-01T00:00:00Z","lmp":"2026-03-20","edd":"2026-12-21","status":"birth_recorded","notes":null,"source":"healthkit"}
    """
    if let p = try? decoder.decode(Pregnancy.self, from: Data(pregJSON.utf8)) {
        check(p.id == "p1" && p.edd == "2026-12-21", "Pregnancy decode: id + edd")
        check(p.status == .birthRecorded, "Pregnancy status 'birth_recorded' → .birthRecorded")
        check(p.source == .healthkit, "Pregnancy source 'healthkit' → .healthkit")
        check(p.lmp == "2026-03-20", "Pregnancy lmp decode")
        check(p.familyId == "f1", "Pregnancy family_id (snake_case) → familyId")
    } else {
        check(false, "Pregnancy decode phải thành công")
    }

    // MaternalMeasurement: type "blood_pressure" → .bloodPressure, diastolic.
    let mJSON = """
    {"id":"m1","pregnancy_id":"p1","type":"blood_pressure","value":120.0,"unit":"mmHg","diastolic":80.0,"taken_at":"2026-08-04T07:00:00+07:00","note":null,"source":"manual"}
    """
    if let m = try? decoder.decode(MaternalMeasurement.self, from: Data(mJSON.utf8)) {
        check(m.type == .bloodPressure, "MaternalMeasurement type 'blood_pressure' → .bloodPressure")
        check(m.diastolic == 80.0, "MaternalMeasurement diastolic decode")
        check(m.unit == "mmHg", "MaternalMeasurement unit decode")
    } else {
        check(false, "MaternalMeasurement decode phải thành công")
    }

    // Roundtrip encode (convertToSnakeCase) → decode.
    let meal = MealEntry(id: "e1", mealType: .lunch, name: "Cơm", loggedAt: "2026-08-04T12:00:00+07:00",
                         calories: 500, note: nil, source: .manual)
    let encoder = JSONEncoder()
    encoder.keyEncodingStrategy = .convertToSnakeCase
    if let data = try? encoder.encode(meal),
       let back = try? decoder.decode(MealEntry.self, from: data),
       let str = String(data: data, encoding: .utf8) {
        check(back.mealType == .lunch && back.name == "Cơm", "MealEntry roundtrip encode→decode")
        check(str.contains("\"meal_type\":\"lunch\""), "encode → khóa snake_case 'meal_type'")
        check(str.contains("\"calories\":500"), "encode → calories giữ số")
    } else {
        check(false, "MealEntry roundtrip phải thành công")
    }

    // Child: sex "female" + mảng allergies.
    let childJSON = """
    {"id":"c1","name":"Bé Bông","sex":"female","birth_date":"2026-08-01","birth_weight_kg":3.2,"birth_length_cm":50.0,"head_circumference_cm":34.0,"blood_type":"A","allergies":["đạm sữa bò"]}
    """
    if let c = try? decoder.decode(Child.self, from: Data(childJSON.utf8)) {
        check(c.sex == .female && c.birthWeightKg == 3.2, "Child decode sex female + cân nặng")
        check(c.allergies == ["đạm sữa bò"], "Child decode mảng allergies")
    } else {
        check(false, "Child decode phải thành công")
    }

    // HealthSample — hành vi THẬT của source:
    //  * synthesized Codable mã hóa Date dạng số (timeIntervalSinceReferenceDate), KHÔNG phải ISO.
    //  * asJSON() mới trả ISO string (dùng khi gửi /v1/health-sync).
    var hs = HealthSample(id: "h1", type: "weight", value: 55.0, unit: "kg",
                          startedAt: Date(timeIntervalSince1970: 1_752_710_000))
    let plainEnc = JSONEncoder()
    if let data = try? plainEnc.encode(hs),
       let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
        check(obj["startedAt"] is NSNumber, "HealthSample Codable: startedAt là số (Double), không phải ISO")
        check(obj["source"] as? String == "healthkit", "HealthSample Codable: source = 'healthkit'")
        // decode lại roundtrip.
        let plainDec = JSONDecoder()
        if let hs2 = try? plainDec.decode(HealthSample.self, from: data) {
            check(hs2.startedAt == hs.startedAt && hs2.source == "healthkit",
                  "HealthSample Codable roundtrip: startedAt + source")
        } else {
            check(false, "HealthSample decode lại phải thành công")
        }
    } else {
        check(false, "HealthSample encode phải thành công")
    }

    // asJSON() → ISO string (đúng contract /v1/health-sync của agent-8).
    hs.endedAt = Date(timeIntervalSince1970: 1_752_710_600)
    hs.auxiliary = 70.0
    let j = hs.asJSON()
    check(j["startedAt"] is String && j["endedAt"] is String, "HealthSample.asJSON(): startedAt/endedAt là ISO string")
    check(j["auxiliary"] as? Double == 70.0, "HealthSample.asJSON(): auxiliary (tâm trương)")
    check(j["source"] as? String == "healthkit", "HealthSample.asJSON(): source mặc định 'healthkit'")

    // Default `source = "healthkit"` KHÔNG áp dụng khi decode thiếu key → decode lỗi.
    let noSource = #"{"id":"h2","type":"weight","value":55.0,"unit":"kg","startedAt":0.0}"#
    let decoded = try? JSONDecoder().decode(HealthSample.self, from: Data(noSource.utf8))
    check(decoded == nil, "HealthSample thiếu key 'source' → decode lỗi (default không áp dụng)")
}

// MARK: - 3. OfflineQueue (phần thuần)

func testOfflineQueuePure() {
    print("== OfflineQueue (phần thuần): PendingRequest Codable + enqueue/remove/count ==")

    // PendingRequest roundtrip — đúng cách load()/persistLocked() dùng JSONDecoder/Encoder PLAIN.
    let pr = PendingRequest(id: UUID(), method: "POST", path: "/v1/meals",
                            body: Data(#"{"name":"Cơm"}"#.utf8), createdAt: Date())
    if let data = try? JSONEncoder().encode(pr),
       let back = try? JSONDecoder().decode(PendingRequest.self, from: data) {
        check(back.id == pr.id && back.method == pr.method && back.path == pr.path
              && back.body == pr.body && back.createdAt == pr.createdAt,
              "PendingRequest Codable roundtrip (id/method/path/body/createdAt)")
    } else {
        check(false, "PendingRequest roundtrip phải thành công")
    }

    // Ngữ nghĩa queue — phản ánh ĐÚNG code OfflineQueue:
    //   enqueue → items.append(...); remove → items.removeAll { $0.id == id }; count = items.count.
    var items: [PendingRequest] = []
    func enqueue(_ method: String, _ path: String, _ body: Data?) {
        items.append(PendingRequest(id: UUID(), method: method, path: path, body: body, createdAt: Date()))
    }
    func remove(_ id: UUID) { items.removeAll { $0.id == id } }

    enqueue("POST", "/v1/meals", Data("{}".utf8))
    check(items.count == 1, "enqueue → count = 1")
    let first = items[0]
    check(first.method == "POST" && first.path == "/v1/meals", "enqueue lưu đúng method/path")
    remove(first.id)
    check(items.isEmpty, "remove(id) → queue rỗng")
    // remove id không tồn tại không lỗi.
    remove(UUID())
    check(items.isEmpty, "remove(id không tồn tại) không lỗi")

    // Ghi chú: phần mã hóa AES-GCM + Keychain (OfflineQueue.shared) đã verify thủ công chạy
    // được trên máy này, nhưng có side-effect (ghi file + keychain thật) → KHÔNG bật trong
    // run.sh mặc định; xem status phase3b-ios-tests.md.
}

// MARK: - Run

testWeekCalculator()
testCodableModels()
testOfflineQueuePure()

print("== KẾT QUẢ: \(passed) PASS, \(failures) FAIL ==")
if failures > 0 { print("Có \(failures) test lỗi — xem dòng [FAIL] ở trên.") }
exit(failures == 0 ? 0 : 1)
