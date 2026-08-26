import XCTest
@testable import MeVaBe

final class WeekCalculatorTests: XCTestCase {
    private let fixed = WeekCalculator.date("2026-08-04")!

    func testWeekFromEDD() {
        // EDD 21/12/2026, ngày 4/8/2026 → còn 139 ngày → GA 141 → tuần 20 (khớp mock CURRENT_WEEK).
        XCTAssertEqual(WeekCalculator.pregnancyWeek(lmp: nil, edd: "2026-12-21", on: fixed), 20)
        XCTAssertEqual(WeekCalculator.pregnancyWeek(lmp: nil, edd: "2026-08-11", on: fixed), 39)
    }

    func testWeekFromLMP() {
        // LMP 20/3/2026 → 4/8/2026 = 137 ngày → 19 tuần.
        XCTAssertEqual(WeekCalculator.pregnancyWeek(lmp: "2026-03-20", edd: nil, on: fixed), 19)
    }

    func testTrimester() {
        XCTAssertEqual(WeekCalculator.trimester(week: 5), .first)
        XCTAssertEqual(WeekCalculator.trimester(week: 20), .second)
        XCTAssertEqual(WeekCalculator.trimester(week: 30), .third)
    }

    func testDaysLeft() {
        XCTAssertEqual(WeekCalculator.daysLeft(edd: "2026-08-10", on: fixed), 6)
        XCTAssertNil(WeekCalculator.daysLeft(edd: nil, on: fixed))
    }
}
