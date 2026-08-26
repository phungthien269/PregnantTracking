import Foundation

/// Tính tuần thai / tam cá nguyệt theo múi giờ Asia/Ho_Chi_Minh (ADR-006).
/// Khớp web (lib/data/mock.ts): tuần = floor((280 − daysLeft) / 7) khi có EDD.
enum WeekCalculator {
    static let timeZone = TimeZone(identifier: "Asia/Ho_Chi_Minh")!

    private static let calendar: Calendar = {
        var c = Calendar(identifier: .gregorian)
        c.timeZone = timeZone
        return c
    }()

    /// Parse YYYY-MM-DD hoặc datetime (v.d. "2026-08-03T07:30:00+07:00") theo Asia/Ho_Chi_Minh.
    static func date(_ iso: String) -> Date? {
        let formats = ["yyyy-MM-dd'T'HH:mm:ssXXXXX", "yyyy-MM-dd'T'HH:mm:ssZZZZZ", "yyyy-MM-dd"]
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_US_POSIX")
        f.timeZone = timeZone
        for format in formats {
            f.dateFormat = format
            if let d = f.date(from: iso) { return d }
        }
        return nil
    }

    /// Ngày hiện tại dạng YYYY-MM-DD theo Asia/Ho_Chi_Minh.
    static func day(_ date: Date = Date()) -> String {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.timeZone = timeZone
        return f.string(from: date)
    }

    static func days(from start: Date, to end: Date) -> Int {
        calendar.dateComponents(
            [.day],
            from: calendar.startOfDay(for: start),
            to: calendar.startOfDay(for: end)
        ).day ?? 0
    }

    /// Tuần thai hiện tại: ưu tiên EDD (GA = 280 − ngày còn lại), fallback LMP.
    static func pregnancyWeek(lmp: String?, edd: String?, on date: Date = Date()) -> Int {
        if let edd, let due = Self.date(edd) {
            let daysLeft = days(from: date, to: due)
            return min(42, max(0, (280 - daysLeft) / 7))
        }
        if let lmp, let start = Self.date(lmp) {
            return min(42, max(0, days(from: start, to: date) / 7))
        }
        return 0
    }

    /// Số ngày còn lại đến EDD (nil nếu chưa có EDD).
    static func daysLeft(edd: String?, on date: Date = Date()) -> Int? {
        guard let edd, let due = Self.date(edd) else { return nil }
        return days(from: date, to: due)
    }

    static func trimester(week: Int) -> Trimester {
        week <= 13 ? .first : week <= 27 ? .second : .third
    }
}
