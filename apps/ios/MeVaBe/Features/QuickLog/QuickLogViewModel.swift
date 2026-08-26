import Combine
import Foundation

/// Ghi nhanh offline-first: luôn enqueue vào queue mã hóa rồi mới flush.
/// Mục gửi được (có POST backend) → xóa khỏi queue; chưa có → giữ chờ sau.
final class QuickLogViewModel: ObservableObject {
    enum LogKind: String, CaseIterable, Identifiable {
        case meal, symptom, feeding, sleep, diaper

        var id: String { rawValue }

        var displayName: String {
            switch self {
            case .meal: return "Bữa ăn"
            case .symptom: return "Triệu chứng"
            case .feeding: return "Bú"
            case .sleep: return "Ngủ"
            case .diaper: return "Tã"
            }
        }
    }

    @Published var kind: LogKind = .meal
    @Published var text = ""
    @Published var severity: SymptomSeverity = .mild
    @Published var mealType: MealType = .breakfast
    @Published var childID: String?
    @Published var method: FeedingMethod = .breast
    @Published var amountMl = ""
    @Published var place: SleepPlace = .cot
    @Published var diaperType: DiaperType = .pee
    @Published var isSubmitting = false
    @Published var lastMessage: String?
    @Published var errorText: String?

    func submit() {
        errorText = nil
        let now = ISO8601DateFormatter().string(from: Date())
        let path: String
        let body: [String: Any]

        switch kind {
        case .meal:
            let name = text.trimmingCharacters(in: .whitespacesAndNewlines)
            guard !name.isEmpty else { errorText = "Nhập tên món ăn."; return }
            body = ["meal_type": mealType.rawValue, "name": name, "logged_at": now]
            path = Path.meals
        case .symptom:
            let symptom = text.trimmingCharacters(in: .whitespacesAndNewlines)
            guard !symptom.isEmpty else { errorText = "Nhập triệu chứng."; return }
            body = ["symptom": symptom, "severity": severity.rawValue, "started_at": now]
            path = Path.symptoms
        case .feeding:
            guard let childID else { errorText = "Chọn bé."; return }
            var b: [String: Any] = ["method": method.rawValue, "started_at": now]
            if let amount = Int(amountMl), amount > 0 { b["amount_ml"] = amount }
            body = b
            path = Path.child(childID, "feedings")
        case .sleep:
            guard let childID else { errorText = "Chọn bé."; return }
            body = ["started_at": now, "place": place.rawValue]
            path = Path.child(childID, "sleeps")
        case .diaper:
            guard let childID else { errorText = "Chọn bé."; return }
            body = ["changed_at": now, "type": diaperType.rawValue]
            path = Path.child(childID, "diapers")
        }

        let data = try? JSONSerialization.data(withJSONObject: body)
        OfflineQueue.shared.enqueue(method: "POST", path: path, body: data)
        lastMessage = "Đã ghi nhận. Đồng bộ khi có mạng."
        text = ""
        amountMl = ""

        Task { await SyncService.shared.flushQueue() }
    }
}
