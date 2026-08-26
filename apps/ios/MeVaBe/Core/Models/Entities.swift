import Foundation

// Model struct khớp JSON /api/v1 (xem packages/domain/src/* + api-reference.md).
// Decode bằng .convertFromSnakeCase nên property viết camelCase, key JSON snake_case.

struct BaseEntity: Codable {
    let id: String
    let familyId: String?
    let privateOwnerId: String?
    let createdAt: String
    let updatedAt: String
}

struct Pregnancy: Codable {
    let id: String
    let familyId: String?
    let privateOwnerId: String?
    let createdAt: String
    let updatedAt: String
    let lmp: String?        // ngày đầu kỳ kinh cuối, YYYY-MM-DD
    let edd: String?        // ngày dự sinh, YYYY-MM-DD
    let status: PregnancyStatus
    let notes: String?
    let source: DataSource
}

struct MealEntry: Codable {
    let id: String
    let mealType: MealType
    let name: String
    let loggedAt: String
    let calories: Double?
    let note: String?
    let source: DataSource
}

struct SymptomReport: Codable {
    let id: String
    let pregnancyId: String
    let symptom: String
    let severity: SymptomSeverity
    let startedAt: String
    let endedAt: String?
    let note: String?
    let source: DataSource
}

struct MaternalMeasurement: Codable {
    let id: String
    let pregnancyId: String
    let type: MeasurementType
    let value: Double
    let unit: String
    let diastolic: Double?
    let takenAt: String
    let note: String?
    let source: DataSource
}

struct TaskItem: Codable, Identifiable {
    let id: String
    let title: String
    let description: String?
    let status: TaskStatus
    let dueDate: String?
    let assigneeId: String?
    let completedAt: String?
    let reminderId: String?
}

struct Appointment: Codable, Identifiable {
    let id: String
    let pregnancyId: String
    let type: AppointmentType
    let scheduledAt: String
    let location: String?
    let doctor: String?
    let summaryBefore: String?
    let outcome: String?
    let notes: String?
    let followupAt: String?
}

struct Child: Codable, Identifiable {
    let id: String
    let name: String
    let sex: Gender
    let birthDate: String
    let birthWeightKg: Double?
    let birthLengthCm: Double?
    let headCircumferenceCm: Double?
    let bloodType: String?
    let allergies: [String]
}

struct FeedingLog: Codable, Identifiable {
    let id: String
    let childId: String
    let method: FeedingMethod
    let side: FeedingSide?
    let amountMl: Double?
    let startedAt: String
    let durationMin: Double?
    let note: String?
    let source: DataSource
}

struct SleepLog: Codable, Identifiable {
    let id: String
    let childId: String
    let startedAt: String
    let endedAt: String?
    let place: SleepPlace
    let note: String?
}

struct DiaperLog: Codable, Identifiable {
    let id: String
    let childId: String
    let changedAt: String
    let type: DiaperType
    let note: String?
}

struct Reminder: Codable, Identifiable {
    let id: String
    let title: String
    let scheduledAt: String
    let frequency: String
    let channels: [String]
    let active: Bool
    let lastSentAt: String?
    let payload: String?
}

/// Một mẫu sức khỏe đọc/ghi từ HealthKit (đồng bộ lên /v1/health-sync).
/// `source` cố định "healthkit" để backend không ghi đè dữ liệu nhập tay (manual)
/// — giữ cả hai khi trùng thời điểm.
struct HealthSample: Codable, Identifiable {
    var id: String
    var type: String       // HealthDataType.rawValue: weight | blood_pressure | activity | sleep | heart_rate
    var value: Double
    var unit: String
    var source: String = "healthkit"
    var startedAt: Date
    var endedAt: Date?
    var auxiliary: Double? // tâm trương khi type = blood_pressure

    func asJSON() -> [String: Any] {
        let iso = ISO8601DateFormatter()
        var d: [String: Any] = [
            "id": id, "type": type, "value": value, "unit": unit, "source": source,
            "startedAt": iso.string(from: startedAt),
        ]
        if let endedAt { d["endedAt"] = iso.string(from: endedAt) }
        if let auxiliary { d["auxiliary"] = auxiliary }
        return d
    }
}
