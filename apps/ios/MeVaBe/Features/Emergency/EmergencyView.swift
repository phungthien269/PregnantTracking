import SwiftUI

/// Thẻ khẩn cấp — hoạt động khi mất mạng (dữ liệu tĩnh, không gọi API).
struct EmergencyView: View {
    private let hotlines: [(String, String)] = [
        ("115", "Cấp cứu y tế toàn quốc"),
        ("112", "Cứu nạn – cứu hộ"),
        ("1900 6066", "Tổng đài tư vấn sức khỏe"),
    ]

    private let dangerSigns: [String] = [
        "Chảy máu âm đạo nhiều",
        "Đau bụng dữ dội kéo dài",
        "Vỡ ối / ra nước ối",
        "Thai máy giảm rõ rệt (dưới 10 cử động trong 2 giờ)",
        "Đau đầu dữ dội, nhìn mờ",
        "Phù đột ngột mặt – tay – chân",
        "Sốt cao trên 38,5°C",
        "Khó thở, đau ngực",
        "Co giật / nghi sản giật",
    ]

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    Text("Thẻ khẩn cấp")
                        .font(.title2.bold())
                        .foregroundColor(Theme.text)
                    Text("Nếu có dấu hiệu nguy hiểm, gọi cấp cứu ngay và nói rõ bạn đang mang thai + tuần thai.")
                        .font(.subheadline)
                        .foregroundColor(Theme.textMuted)

                    ForEach(hotlines, id: \.0) { number, name in
                        Button(action: { call(number) }) {
                            HStack {
                                Text(number)
                                    .font(.title2.bold())
                                    .foregroundColor(Theme.primary)
                                Spacer()
                                Text(name)
                                    .foregroundColor(Theme.textMuted)
                                Image(systemName: "phone.fill")
                                    .foregroundColor(Theme.primary)
                            }
                            .padding()
                            .background(Theme.surface)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                            .overlay(RoundedRectangle(cornerRadius: 12).stroke(Theme.border))
                        }
                    }

                    Text("Dấu hiệu cần cấp cứu ngay")
                        .font(.headline)
                        .foregroundColor(Theme.text)
                    ForEach(dangerSigns, id: \.self) { sign in
                        HStack(alignment: .top) {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .foregroundColor(Theme.warning)
                            Text(sign)
                                .foregroundColor(Theme.text)
                        }
                        .font(.subheadline)
                    }

                    Text("Nếu ở nước ngoài, gọi số khẩn cấp địa phương (Mỹ 911, Nhật 119, Úc 000…).")
                        .font(.caption)
                        .foregroundColor(Theme.textMuted)
                }
                .padding()
            }
            .background(Theme.background)
            .navigationTitle("Khẩn cấp")
        }
    }

    private func call(_ number: String) {
        let digits = number.replacingOccurrences(of: " ", with: "")
        if let url = URL(string: "tel://\(digits)") {
            UIApplication.shared.open(url)
        }
    }
}
