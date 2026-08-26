import SwiftUI
import UIKit

// Mã màu khớp packages/ui/src/tokens.css (rose #c96f5a…) — light/dark theo hệ thống.
private extension UIColor {
    convenience init(rgb: UInt32) {
        self.init(
            red: CGFloat((rgb >> 16) & 0xFF) / 255,
            green: CGFloat((rgb >> 8) & 0xFF) / 255,
            blue: CGFloat(rgb & 0xFF) / 255,
            alpha: 1
        )
    }
}

extension Color {
    init(light: UInt32, dark: UInt32) {
        self.init(uiColor: UIColor { trait in
            trait.userInterfaceStyle == .dark ? UIColor(rgb: dark) : UIColor(rgb: light)
        })
    }

    static let mvBackground = Color(light: 0xFAF7F4, dark: 0x1F1A17)
    static let mvSurface = Color(light: 0xFFFFFF, dark: 0x2A2320)
    static let mvSurfaceMuted = Color(light: 0xF3EEEA, dark: 0x332B27)
    static let mvText = Color(light: 0x3D2F2A, dark: 0xF2E8E2)
    static let mvTextMuted = Color(light: 0x7A6A64, dark: 0xB6A49B)
    static let mvBorder = Color(light: 0xE7DCD5, dark: 0x40352F)
    static let mvPrimary = Color(light: 0xC96F5A, dark: 0xD98B74)
    static let mvPrimaryStrong = Color(light: 0xB25A47, dark: 0xE6A08C)
    static let mvPrimarySoft = Color(light: 0xF6E4DF, dark: 0x4A342C)
    static let mvAccent = Color(light: 0x7BA47F, dark: 0x8FB893)
    static let mvDanger = Color(light: 0xC0392B, dark: 0xE06A5A)
    static let mvWarning = Color(light: 0xC8902F, dark: 0xD9A84F)
}

enum Theme {
    static let background = Color.mvBackground
    static let surface = Color.mvSurface
    static let surfaceMuted = Color.mvSurfaceMuted
    static let text = Color.mvText
    static let textMuted = Color.mvTextMuted
    static let border = Color.mvBorder
    static let primary = Color.mvPrimary
    static let primaryStrong = Color.mvPrimaryStrong
    static let primarySoft = Color.mvPrimarySoft
    static let accent = Color.mvAccent
    static let danger = Color.mvDanger
    static let warning = Color.mvWarning
}
