import SwiftUI

struct QuickLogView: View {
    @StateObject private var vm = QuickLogViewModel()
    @EnvironmentObject private var appState: AppState
    @State private var children: [Child] = []

    var body: some View {
        NavigationStack {
            Form {
                Section("Loại ghi nhanh") {
                    Picker("", selection: $vm.kind) {
                        ForEach(QuickLogViewModel.LogKind.allCases) { kind in
                            Text(kind.displayName).tag(kind)
                        }
                    }
                    .pickerStyle(.segmented)
                }

                Section("Chi tiết") {
                    kindFields
                }

                Section {
                    Button(action: submit) {
                        HStack {
                            Spacer()
                            Text("Ghi nhận").bold()
                            Spacer()
                        }
                    }
                    .disabled(vm.isSubmitting)
                }

                if let message = vm.lastMessage {
                    Section {
                        Text(message).font(.footnote).foregroundColor(Theme.accent)
                    }
                }
                if let error = vm.errorText {
                    Section {
                        Text(error).font(.footnote).foregroundColor(Theme.danger)
                    }
                }
                if appState.offlineCount > 0 {
                    Section {
                        Label("\(appState.offlineCount) mục chờ đồng bộ", systemImage: "icloud.slash")
                            .font(.footnote)
                            .foregroundColor(Theme.textMuted)
                    }
                }
            }
            .navigationTitle("Ghi nhanh")
            .task { await loadChildren() }
        }
    }

    @ViewBuilder
    private var kindFields: some View {
        switch vm.kind {
        case .meal:
            Picker("Bữa", selection: $vm.mealType) {
                ForEach(MealType.allCases) { Text($0.displayName).tag($0) }
            }
            TextField("Tên món ăn", text: $vm.text)
        case .symptom:
            TextField("Triệu chứng", text: $vm.text)
            Picker("Mức độ", selection: $vm.severity) {
                ForEach(SymptomSeverity.allCases) { Text($0.displayName).tag($0) }
            }
            .pickerStyle(.segmented)
        case .feeding:
            childPicker
            Picker("Cách bú", selection: $vm.method) {
                ForEach(FeedingMethod.allCases) { Text($0.displayName).tag($0) }
            }
            TextField("Lượng (ml, tùy chọn)", text: $vm.amountMl)
                .keyboardType(.numberPad)
        case .sleep:
            childPicker
            Picker("Nơi ngủ", selection: $vm.place) {
                ForEach(SleepPlace.allCases) { Text($0.displayName).tag($0) }
            }
        case .diaper:
            childPicker
            Picker("Loại", selection: $vm.diaperType) {
                ForEach(DiaperType.allCases) { Text($0.displayName).tag($0) }
            }
            .pickerStyle(.segmented)
        }
    }

    private var childPicker: some View {
        Picker("Bé", selection: $vm.childID) {
            ForEach(children) { child in
                Text(child.name).tag(Optional(child.id))
            }
        }
    }

    private func loadChildren() async {
        guard children.isEmpty else { return }
        if let loaded = try? await APIClient.shared.get([Child].self, path: Path.children) {
            children = loaded
            if vm.childID == nil { vm.childID = loaded.first?.id }
        }
    }

    private func submit() {
        vm.submit()
        appState.refreshOfflineCount()
    }
}
