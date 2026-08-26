import Foundation

// Enum chuẩn — rawValue khớp enum string trong packages/domain/src/core.ts.
// Mọi enum có CaseIterable (cho Picker) + Identifiable qua rawValue.

extension Identifiable where Self: RawRepresentable, Self.RawValue == String {
    var id: String { rawValue }
}

enum Trimester: String, Codable, CaseIterable, Identifiable {
    case first, second, third
    var displayName: String {
        switch self {
        case .first: return "Quý 1"
        case .second: return "Quý 2"
        case .third: return "Quý 3"
        }
    }
}

enum PregnancyStatus: String, Codable {
    case ongoing, birthRecorded = "birth_recorded", ended
}

enum Gender: String, Codable, CaseIterable, Identifiable {
    case male, female, unknown
    var displayName: String { self == .male ? "Trai" : self == .female ? "Gái" : "Chưa rõ" }
}

enum DataSource: String, Codable {
    case manual, healthkit, document
}

enum MeasurementType: String, Codable {
    case weight, bloodPressure = "blood_pressure", bloodGlucose = "blood_glucose"
    case waistCircumference = "waist_circumference", bmi
    case fundalHeight = "fundal_height", heartRate = "heart_rate"
}

enum SymptomSeverity: String, Codable, CaseIterable, Identifiable {
    case mild, moderate, severe
    var displayName: String { self == .mild ? "Nhẹ" : self == .moderate ? "Vừa" : "Nặng" }
}

enum MealType: String, Codable, CaseIterable, Identifiable {
    case breakfast, lunch, dinner, snack, drink
    var displayName: String {
        switch self {
        case .breakfast: return "Sáng"
        case .lunch: return "Trưa"
        case .dinner: return "Tối"
        case .snack: return "Bữa phụ"
        case .drink: return "Đồ uống"
        }
    }
}

enum FeedingMethod: String, Codable, CaseIterable, Identifiable {
    case breast, pumpedMilk = "pumped_milk", formula, mixed
    var displayName: String {
        switch self {
        case .breast: return "Bú mẹ"
        case .pumpedMilk: return "Sữa vắt"
        case .formula: return "Sữa công thức"
        case .mixed: return "Hỗn hợp"
        }
    }
}

enum FeedingSide: String, Codable {
    case left, right, both
}

enum SleepPlace: String, Codable, CaseIterable, Identifiable {
    case cot, bassinet, coSleeping = "co_sleeping", carrier, stroller, other
    var displayName: String {
        switch self {
        case .cot: return "Cũi"
        case .bassinet: return "Nôi"
        case .coSleeping: return "Ngủ chung"
        case .carrier: return "Địu"
        case .stroller: return "Xe đẩy"
        case .other: return "Khác"
        }
    }
}

enum DiaperType: String, Codable, CaseIterable, Identifiable {
    case pee, poo, mixed
    var displayName: String { self == .pee ? "Tiểu" : self == .poo ? "Phân" : "Hỗn hợp" }
}

enum TaskStatus: String, Codable, CaseIterable, Identifiable {
    case todo, inProgress = "in_progress", done, cancelled
    var displayName: String {
        switch self {
        case .todo: return "Cần làm"
        case .inProgress: return "Đang làm"
        case .done: return "Xong"
        case .cancelled: return "Đã hủy"
        }
    }
}

enum AppointmentType: String, Codable {
    case firstVisit = "first_visit", prenatal, ultrasound, bloodTest = "blood_test"
    case screening, vaccination, postpartumCheck = "postpartum_check", babyCheck = "baby_check"
}
