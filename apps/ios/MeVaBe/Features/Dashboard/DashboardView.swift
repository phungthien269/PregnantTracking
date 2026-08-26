import SwiftUI

struct DashboardView: View {
    @StateObject private var vm = DashboardViewModel()

    var body: some View {
        NavigationStack {
            Group {
                switch vm.state {
                case .loading:
                    ProgressView("Đang tải…")
                case .failed(let message):
                    Text(message)
                        .foregroundColor(Theme.danger)
                        .multilineTextAlignment(.center)
                        .padding()
                case .loaded(let data):
                    content(data)
                }
            }
            .navigationTitle("Trang chủ")
            .task { await vm.load() }
        }
    }

    private func content(_ data: DashboardData) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                weekCard(data)
                section("Bữa ăn hôm nay", count: data.mealsToday.count, empty: "Chưa có bữa ăn nào hôm nay") {
                    ForEach(data.mealsToday) { meal in
                        Label("\(meal.name) (\(meal.mealType.displayName))", systemImage: "fork.knife")
                            .font(.subheadline)
                    }
                }
                section("Triệu chứng gần đây", count: data.symptoms.count, empty: "Chưa ghi triệu chứng") {
                    ForEach(data.symptoms) { symptom in
                        Label("\(symptom.symptom) (\(symptom.severity.displayName))", systemImage: "waveform.path.ecg")
                            .font(.subheadline)
                    }
                }
                section("Công việc", count: data.tasks.count, empty: "Chưa có việc") {
                    ForEach(data.tasks.prefix(5)) { task in
                        HStack {
                            Text(task.title)
                                .strikethrough(task.status == .done, color: Theme.textMuted)
                                .foregroundColor(task.status == .done ? Theme.textMuted : Theme.text)
                            Spacer()
                            Text(task.status.displayName)
                                .font(.caption)
                                .foregroundColor(Theme.textMuted)
                        }
                        .font(.subheadline)
                    }
                }
            }
            .padding()
        }
        .background(Theme.background)
    }

    private func weekCard(_ data: DashboardData) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Tuần \(data.week) · \(data.trimester.displayName)")
                .font(.title2.bold())
                .foregroundColor(Theme.text)
            if let dueDate = data.dueDate {
                Text("Dự sinh: \(dueDate)")
                    .font(.subheadline)
                    .foregroundColor(Theme.textMuted)
            }
            if let daysLeft = data.daysLeft, daysLeft >= 0 {
                Text("Còn \(daysLeft) ngày")
                    .font(.subheadline)
                    .foregroundColor(Theme.primary)
            }
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Theme.primarySoft)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func section<Content: View>(
        _ title: String,
        count: Int,
        empty: String,
        @ViewBuilder content: () -> Content
    ) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(title).font(.headline).foregroundColor(Theme.text)
                Spacer()
                Text("\(count)").font(.caption).foregroundColor(Theme.textMuted)
            }
            if count == 0 {
                Text(empty).font(.subheadline).foregroundColor(Theme.textMuted)
            } else {
                content()
            }
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Theme.surface)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(Theme.border))
    }
}
