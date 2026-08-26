import Foundation

// View model phía iOS — không phải là entity REST thuần, được compose từ nhiều route.

/// Dashboard iOS tự lắp từ REST (không có route /dashboard ở web).
struct DashboardData {
    var week: Int = 0
    var trimester: Trimester = .first
    var dueDate: String?
    var daysLeft: Int?
    var mealsToday: [MealEntry] = []
    var symptoms: [SymptomReport] = []
    var measurements: [MaternalMeasurement] = []
    var tasks: [TaskItem] = []
    var appointments: [Appointment] = []
    var children: [Child] = []
}

enum DashboardViewState {
    case loading
    case loaded(DashboardData)
    case failed(String)
}

/// Phản hồi GET /v1/daily-logs?date=YYYY-MM-DD.
struct DailyLogs: Codable {
    let date: String
    let meals: [MealEntry]
    let measurements: [MaternalMeasurement]
    let symptoms: [SymptomReport]
}
