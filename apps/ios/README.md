# Mẹ & Bé — iOS companion (SwiftUI)

Ứng dụng iOS đi kèm web app **Mẹ & Bé**: theo dõi thai kỳ, ghi nhanh offline,
đồng bộ HealthKit, khóa sinh trắc học, thẻ khẩn cấp. UI tiếng Việt, dark mode,
màu khớp `packages/ui/src/tokens.css` (rose `#c96f5a`).

> Trạng thái scaffold Phase 2: **code đầy đủ + `project.yml` (XcodeGen)**. Máy phát
> triển hiện tại chỉ có Command Line Tools nên **chưa dựng được `.xcodeproj` ở đây** —
> làm theo mục [1. Tạo project](#1-tạo-project) khi có máy có Xcode.

## Mục lục
1. [Tạo project](#1-tạo-project)
2. [Cấu hình](#2-cấu-hình)
3. [Cấu trúc](#3-cấu-trúc)
4. [Các phần cần máy thật / backend](#4-các-phần-cần-máy-thật--backend)

## 1. Tạo project

```bash
brew install xcodegen        # nếu chưa có
cd code/apps/ios
xcodegen generate            # tạo MeVaBe.xcodeproj từ project.yml
open MeVaBe.xcodeproj
```

Trong Xcode: chọn team + Bundle ID của bạn (target **MeVaBe** → *Signing &
Capabilities*). Entitlements (`MeVaBe.entitlements`) đã bật HealthKit + Push
(aps-environment) — đổi `development`/`production` theo build. Chạy trên **iPhone
thật** (HealthKit + push không chạy trên simulator). Target **MeVaBeTests** chạy
bằng `Cmd+U`.

## 2. Cấu hình

| Việc | Ở đâu |
|---|---|
| API URL (web `/api/v1`) | target MeVaBe → **Info** → `MV_API_BASE_URL` (mặc định `http://localhost:3000`) |
| Supabase Auth thật | `MV_SUPABASE_URL` + `MV_SUPABASE_ANON_KEY` trong Info. Để trống → **chế độ demo** (login bằng email/mật khẩu bất kỳ, dữ liệu mock) |
| Bundle ID | Signing & Capabilities (vd `vn.mevabe.app`) |

`MV_API_BASE_URL` trỏ tới web app đang chạy (`cd code && pnpm dev`). Nếu máy iOS
không gọi được `localhost`, dùng LAN IP của máy chạy web (vd `http://192.168.1.10:3000`)
và chú ý ATS: HTTP local bị chặn — thêm exception trong Info.plist:

```xml
<key>NSAppTransportSecurity</key>
<dict>
  <key>NSAllowsLocalNetworking</key><true/>
</dict>
```

## 3. Cấu trúc

```
MeVaBe/
├── App/                 # MeVaBeApp (@main), AppDelegate (push token), AppState, RootView, Theme
├── Core/
│   ├── Models/          # Enums, Entities, ViewModels (Codable, snake_case → camelCase)
│   ├── WeekCalculator.swift   # tuần thai/tam cá nguyệt theo Asia/Ho_Chi_Minh (khớp web)
│   ├── Networking/APIClient.swift  # envelope {data}|{error}, pagination, Auth Bearer
│   └── Storage/KeychainStore.swift # session + khóa AES lưu Keychain
├── Services/
│   ├── AuthService.swift     # Supabase goTrue (password) + demo mode
│   ├── BiometricService.swift# Face ID / Touch ID
│   ├── HealthKitService.swift# đọc/ghi 2 chiều: cân nặng, huyết áp, vận động, ngủ, nhịp tim
│   ├── OfflineQueue.swift    # queue ghi nhanh, mã hóa AES-GCM (khóa trong Keychain)
│   ├── PushService.swift     # đăng ký APNs + upload token
│   └── SyncService.swift     # flush queue + đồng bộ HealthKit lên máy chủ
└── Features/
    ├── Auth/        # LoginView, LockView (sinh trắc học)
    ├── Dashboard/   # DashboardView + ViewModel (compose từ REST)
    ├── QuickLog/    # ghi nhanh: bữa ăn, triệu chứng, bé (bú/ngủ/tã) — offline-first
    ├── Health/      # HealthSettingsView (xin quyền, trạng thái, đồng bộ, thu hồi)
    ├── Emergency/   # Thẻ khẩn cấp (hoạt động khi mất mạng)
    └── Settings/    # tài khoản, bảo mật, nhắc lịch, thông tin
```

**Model** khai báo struct `Codable` khớp JSON `/api/v1` của web (xem
`../../orchestration/docs/api-reference.md` + `packages/domain/src/*`). Decode bằng
`convertFromSnakeCase` (vd `family_id` → `familyId`). Không import TS trực tiếp.

## 4. Các phần cần máy thật / backend

| Phần | Cần gì |
|---|---|
| **HealthKit** | iPhone thật + `com.apple.developer.healthkit` (đã trong entitlements). Huyết áp đọc/ghi qua `HKCorrelation` systolic/diastolic. **Không ghi đè**: mỗi mẫu mang `source = "healthkit"`, chỉ merge khử trùng (cùng thời điểm + giá trị + nguồn) — dữ liệu nhập tay (`manual`) luôn giữ. Thu hồi quyền trong app **Sức khỏe** (Health), màn hình Cài đặt có nút mở. |
| **Push (APNs)** | Cần push cert/key `.p8` trong Apple Developer; `aps-environment` theo môi trường. Upload token qua `POST /v1/notifications/device-token` — **backend chưa có** (phase2-agent-7), hiện best-effort (lỗi bỏ qua, token giữ local). |
| **Đồng bộ HealthKit lên máy chủ** | `POST /v1/health-sync` hiện trả **501** (web). Payload mẫu iOS gửi: `{ source: "healthkit", samples: [ { id, type, value, unit, source, startedAt, endedAt } ] }` (ISO8601). Khi backend xong, SyncService gửi được ngay. |
| **Ghi nhanh con (bú/ngủ/tã)** | Route REST hiện chỉ có **GET** (`/children/[id]/feedings|sleeps|diapers`); POST đang chờ backend. QuickLog vẫn ghi vào **queue mã hóa** và tự flush khi endpoint có. Bữa ăn / triệu chứng có POST sẵn → flush ngay khi online. |
| **Xin quyền camera (ảnh bữa ăn)** | Chưa có trong đợt này (web cũng chưa). Thêm `NSCameraUsageDescription` khi làm. |

## Giấy phép dữ liệu
Dữ liệu đồng bộ qua REST `/api/v1` tuân theo khế ước `contracts.md` (envelope,
RLS theo family). Không gửi định danh cá nhân vào prompt AI — theo `decisions.md`
ADR-005.
