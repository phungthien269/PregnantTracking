import SwiftUI

struct RootView: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        Group {
            if appState.session == nil {
                LoginView()
            } else if !appState.isUnlocked {
                LockView()
            } else {
                MainTabView()
            }
        }
        .onAppear { appState.activate() }
    }
}

struct MainTabView: View {
    var body: some View {
        TabView {
            DashboardView()
                .tabItem { Label("Trang chủ", systemImage: "heart.text.square.fill") }
            QuickLogView()
                .tabItem { Label("Ghi nhanh", systemImage: "plus.circle.fill") }
            EmergencyView()
                .tabItem { Label("Khẩn cấp", systemImage: "cross.circle.fill") }
            SettingsView()
                .tabItem { Label("Cài đặt", systemImage: "gearshape.fill") }
        }
    }
}
