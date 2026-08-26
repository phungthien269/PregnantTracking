import Combine
import Foundation

final class DashboardViewModel: ObservableObject {
    @Published private(set) var state: DashboardViewState = .loading

    /// Compose dashboard từ các route REST có sẵn (web không có route /dashboard).
    func load() async {
        let client = APIClient.shared
        let today = WeekCalculator.day()

        async let pregnancy = client.getOptional(Pregnancy.self, path: Path.pregnancies)
        async let meals = client.get(
            [MealEntry].self,
            path: Path.meals,
            query: [URLQueryItem(name: "date", value: today)]
        )
        async let symptoms = client.get([SymptomReport].self, path: Path.symptoms)
        async let measurements = client.get([MaternalMeasurement].self, path: Path.measurements)
        async let tasks = client.get([TaskItem].self, path: Path.tasks)
        async let appointments = client.get([Appointment].self, path: Path.appointments)
        async let children = client.get([Child].self, path: Path.children)

        do {
            let (preg, mealsToday, symp, meas, taskList, apptList, kids) = try await (
                pregnancy, meals, symptoms, measurements, tasks, appointments, children
            )

            var data = DashboardData()
            data.week = WeekCalculator.pregnancyWeek(lmp: preg?.lmp, edd: preg?.edd)
            data.trimester = WeekCalculator.trimester(week: data.week)
            data.dueDate = preg?.edd
            data.daysLeft = WeekCalculator.daysLeft(edd: preg?.edd)
            data.mealsToday = mealsToday
            data.symptoms = symp
            data.measurements = meas
            data.tasks = taskList
            data.appointments = apptList
            data.children = kids

            let snapshot = data
            await MainActor.run { state = .loaded(snapshot) }
        } catch {
            let message = (error as? APIError)?.errorDescription ?? error.localizedDescription
            await MainActor.run { state = .failed(message) }
        }
    }
}
