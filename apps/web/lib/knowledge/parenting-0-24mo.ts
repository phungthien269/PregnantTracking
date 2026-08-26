import type { KnowledgeTopic } from './types'

// ===========================================================================
// Nuôi dạy con 0–24 tháng (Phase 6 — agent C3)
// Nguồn: orchestration/docs/parenting-book-nuoi-con-khong-phai-cuoc-chien.md
//        orchestration/docs/parenting-sources-0-24mo.md
// Ghi chú: phân biệt rõ "nguồn y khoa" (WHO/AAP/CDC/NHS/UNICEF/…)
//          và "sách kinh nghiệm" (bộ NCKPC…) — KHÔNG gộp 2 loại.
// ===========================================================================

export const topics: KnowledgeTopic[] = [
  {
    slug: 'nuoi-con-khong-phai-cuoc-chien',
    title: 'Tinh hoa bộ sách Nuôi con không phải cuộc chiến',
    emoji: '📖',
    phases: ['infant', 'toddler'],
    ageRange: 'Bé 0–24 tháng',
    summary:
      'Bộ sách nuôi con bán chạy nhất Việt Nam của Mẹ Ong Bông, Hachun Lyonnet, Bubu Hương — giới thiệu nếp sinh hoạt, E.A.S.Y, tập ngủ không bế ru và ăn dặm BLW. Đây là nguồn kinh nghiệm/cộng đồng, không thay thế nguồn y khoa.',
    bookSources: [
      {
        book: 'Bộ sách Nuôi con không phải cuộc chiến — ThaiHa Books (NXB Thái Hà, tủ sách V-Parents, liên kết NXB Lao động)',
        authors: 'Mẹ Ong Bông (Liên Hương) · Hachun Lyonnet (Thu Hà) · Bubu Hương (Thanh Hương)',
        note: 'Sách kinh nghiệm phổ biến, không thay nguồn y khoa',
      },
    ],
    sections: [
      {
        heading: 'Giới thiệu bộ sách',
        blocks: [
          {
            kind: 'p',
            text: 'Bộ sách do 3 tác giả nữ người Việt đồng sáng tác, thường biết qua bút danh Mẹ Ong Bông, Hachun Lyonnet, Bubu Hương. Đơn vị phát hành chính là ThaiHa Books (NXB Thái Hà), tủ sách V-Parents, liên kết in/kinh doanh với NXB Lao động. Đây là một trong những sách nuôi con hiện đại bán chạy nhất Việt Nam: chỉ riêng năm 2018 đã tái bản tới lần thứ 19, 20, 21 và 23 (mỗi lần 3.000–6.000 bản).',
          },
          {
            kind: 'p',
            text: 'Giá trị cốt lõi: gần gũi thực tế Việt Nam (ép ăn, thức đêm, ông bà hỗ trợ, mẹ đi làm lại), ngôn ngữ dễ hiểu, đề cao tôn trọng trẻ và quan sát–lắng nghe con — đối lập với kiểu "ép con". Giới hạn quan trọng: đây là sách nuôi dạy con phổ biến/kinh nghiệm, các tác giả không phải tổ chức y tế, không phải bác sĩ chuyên khoa nhi (theo giới thiệu: nghề chính là làm mẹ).',
          },
        ],
      },
      {
        heading: 'Cấu trúc thật của bộ sách',
        blocks: [
          {
            kind: 'list',
            items: [
              'Cuốn gốc "Nuôi con không phải cuộc chiến" (ấn bản in lần thứ 3 ghi năm 2014) — cho cha mẹ có con sơ sinh đến khoảng 2–3 tuổi; chạy qua các mốc: những ngày đầu, 4 tháng, 6 tháng, 9 tháng, mười mấy tháng, giai đoạn biết nói "không".',
              '"Ăn dặm không phải cuộc chiến" (xuất bản 2019) — giới thiệu ăn dặm bé chỉ huy (BLW) cho trẻ từ 6 tháng, kèm công thức, món ăn và thực đơn theo từng mốc tuổi của gia đình Việt.',
              'Bộ "Nuôi con không phải cuộc chiến 2" (3 cuốn, giới thiệu từ khoảng 2021): "Em bé sơ sinh chào đời – Khoa học về bữa ăn và giấc ngủ của bé thơ", "EASY – Chìa khóa của cha mẹ thông thái", "Bé thơ tự ngủ – Cha mẹ thư thái".',
              '"Phiên bản 15 năm" (bộ 3 cuốn kỷ niệm) — cùng 3 chủ đề với bộ 2.',
            ],
          },
          {
            kind: 'warn',
            text: 'Bộ sách KHÔNG có đúng 3 "tập" đánh số 1–2–3 như một số mô tả. Cấu trúc xuất bản thực tế gồm: cuốn gốc + cuốn chuyên đề ăn dặm + bộ 3 cuốn "…2" (sơ sinh / EASY / tự ngủ). Chưa tìm thấy cuốn riêng nào đúng chủ đề mẫu giáo lớn (3–6 tuổi).',
          },
        ],
      },
      {
        heading: 'Phương pháp đặc trưng',
        blocks: [
          {
            kind: 'p',
            text: 'Nếp sinh hoạt & "Nút chờ" (cuốn "Em bé sơ sinh chào đời"): rèn kỹ năng quan sát, lắng nghe, kết nối với con. "Nút chờ" là đợi và quan sát trước khi phản ứng với tiếng khóc/cử chỉ của bé (học "ngôn ngữ" của bé); kết hợp trình tự sinh hoạt (routine) để bé có phản xạ có điều kiện, biết điều gì xảy ra tiếp theo.',
          },
          {
            kind: 'p',
            text: 'E.A.S.Y — chu kỳ "Ăn – Hoạt động – Ngủ – Thời gian của mẹ" (Eat–Activity–Sleep–You): chủ điểm của cuốn "EASY – Chìa khóa của cha mẹ thông thái". Xử lý theo mốc tuổi các vấn đề khủng hoảng ngủ, sợ xa cách, bám mẹ, ngủ ngắn, ngủ qua đêm, ăn kém hiệu quả; kèm lịch sinh hoạt mẫu theo lứa tuổi và giải pháp khi mẹ đi làm lại. Sách nhấn mạnh tính duy nhất của từng em bé.',
          },
          {
            kind: 'p',
            text: 'Tập ngủ không bế ru (cuốn "Bé thơ tự ngủ"): tổng hợp các phương pháp khuyến khích bé tự đưa mình vào giấc ngủ — không phụ thuộc ti mẹ, bế, võng, ru hay đung đưa. Sách nhấn mạnh gia đình phải nhất quán giữa các thành viên thì mới hiệu quả.',
          },
          {
            kind: 'p',
            text: 'Ăn dặm bé chỉ huy BLW (cuốn "Ăn dặm không phải cuộc chiến"): giới thiệu phương pháp Baby-led Weaning của Gill Rapley & Tracey Murkett vào bối cảnh gia đình Việt. Giúp bé tự lập trong ăn uống, tự chọn món thích/không thích, kèm công thức và thực đơn theo từng mốc tuổi, xử lý các vấn đề điển hình ở từng giai đoạn ăn dặm.',
          },
          {
            kind: 'warn',
            text: 'Nguồn gốc phương pháp: E.A.S.Y và các kỹ thuật tự ngủ (quấn khăn, bế–đặt, xuýt–vỗ) bắt nguồn từ truyền thống "Baby Whisperer" của Tracy Hogg, được các tác giả Việt giới thiệu lại. Cuốn "Bé thơ tự ngủ" là sách tổng hợp/áp dụng, không phải bản dịch chính thức của sách Tracy Hogg. Chi tiết kỹ thuật từng trang sách chưa đối chiếu trực tiếp (chưa xác minh).',
          },
        ],
      },
      {
        heading: '8 điểm cần đối chiếu y khoa',
        blocks: [
          {
            kind: 'warn',
            text: 'Đây là sách kinh nghiệm, KHÔNG phải nguồn y khoa. Mọi khuyến nghị về y tế/an toàn trong sách (giấc ngủ, quấn, tập ngủ, tách bú–ngủ, BLW, sữa công thức, mốc phát triển) phải đối chiếu WHO / AAP / CDC / NHS / Bộ Y tế VN trước khi hiển thị cho người dùng.',
          },
          {
            kind: 'table',
            headers: ['Chủ đề trong sách', 'Cần đối chiếu', 'Khuyến nghị chính thống (tóm tắt)'],
            rows: [
              ['Tư thế ngủ an toàn / tránh SIDS', 'AAP/CDC safe sleep', 'Luôn đặt bé nằm ngửa khi ngủ; cùng phòng, không cùng giường; nệm cứng, không gối/chăn/thú nhồi; không quá nóng.'],
              ['Quấn khăn (swaddle) cho bé tự ngủ', 'AAP/CDC', 'Chỉ quấn khi bé còn nhỏ, ngừng khi bé có dấu hiệu lẫy; quấn không quá chặt, không chèn vật mềm.'],
              ['E.A.S.Y / tập ngủ, "ngủ qua đêm" sớm', 'AAP (sleep training)', 'Tập ngủ có nhiều quan điểm; phải đảm bảo an toàn giấc ngủ và dinh dưỡng của bé; tránh "cry-it-out" khắc nghiệt với bé quá nhỏ.'],
              ['Tách "bú – ngủ" (không bú để ngủ)', 'WHO', 'Trẻ sơ sinh bú theo nhu cầu, cả ngày lẫn đêm; những tuần đầu không nên ép lịch cứng nhắc. Bú đêm quan trọng cho nguồn sữa.'],
              ['Ăn dặm bé chỉ huy (BLW) từ 6 tháng', 'WHO / NHS', 'Bắt đầu ~6 tháng, bé ngồi vững/giữ đầu; tránh thức ăn dễ nghẹn (nho nguyên, xúc xích tròn…), luôn giám sát; đảm bảo đủ sắt.'],
              ['Không "ép" con ăn, cho ăn theo nhu cầu', 'WHO', 'Nuôi con bằng sữa mẹ hoàn toàn 6 tháng đầu; ăn dặm bổ sung an toàn từ 6 tháng, tiếp tục bú mẹ đến 2 tuổi+.'],
              ['Sữa công thức / bú mẹ', 'WHO', 'Khuyến nghị ưu tiên sữa mẹ; nếu dùng sữa công thức phải pha đúng liều lượng, không pha loãng.'],
              ['Mốc phát triển / "con chậm tăng cân"', 'Bác sĩ nhi / Bộ Y tế VN', 'Không tự chẩn đoán chậm phát triển từ sách; dùng bảng tăng trưởng chuẩn và khám nhi định kỳ.'],
            ],
          },
          {
            kind: 'p',
            text: 'Cách dùng đúng vai trò trong app: (1) gắn nhãn nội dung thuộc "sách phổ biến / kinh nghiệm cha mẹ VN" — không hiển thị như nguồn y khoa; (2) đặt cạnh nguồn y khoa để người dùng thấy mức độ khác biệt; (3) trước nội dung tập ngủ/ăn dặm, hiện mục "ĐIỂM CẦN ĐỐI CHIẾU Y KHOA"; (4) không dùng sách làm căn cứ cho khuyến nghị cứng như "cai bú đêm sớm", "ngủ xuyên đêm khi X tuần tuổi", "BLW thay thế ăn dặm truyền thống" — chỉ giới thiệu như phương pháp nhiều gia đình VN áp dụng, kèm tư vấn bác sĩ.',
          },
        ],
      },
      {
        heading: 'Chưa xác minh',
        blocks: [
          {
            kind: 'warn',
            text: 'Các điểm chưa xác minh được (cần kiểm lại): tên thật của "Mẹ Ong Bông" không thống nhất (ThaiHa ghi Liên Hương, một nguồn thư mục ghi Đỗ Thu Hương); tên thật "Bubu Hương" (ThaiHa ghi Thanh Hương, một biểu ghi OCR ghi Bùi Hương); "Hội nuôi con không phải cuộc chiến" trên Facebook chưa lấy được URL/số thành viên; năm xuất bản lần đầu của cuốn gốc và năm ra mắt "Phiên bản 15 năm"; mục lục chi tiết từng cuốn (mô tả ở đây lấy từ trang bán sách/thư mục thư viện); chi tiết kỹ thuật tập ngủ trong "Bé thơ tự ngủ".',
          },
        ],
      },
      {
        heading: 'Nguồn',
        blocks: [
          {
            kind: 'sources',
            sources: [
              { org: 'ThaiHa Books', title: 'Nuôi con không phải cuộc chiến', url: 'https://thaihabooks.com/products/nuoi-con-khong-phai-cuoc-chien' },
              { org: 'ThaiHa Books', title: 'Bộ Sách Nuôi Con Không Phải Là Cuộc Chiến 2', url: 'https://thaihabooks.com/products/bo-sach-nuoi-con-khong-phai-la-cuoc-chien-2' },
              { org: 'ThaiHa Books', title: '[Phiên bản 15 năm] Bộ sách Nuôi Con Không Phải Là Cuộc Chiến', url: 'https://thaihabooks.com/products/phien-ban-15-nam-nuoi-con-khong-phai-la-cuoc-chien-2' },
              { org: 'ThaiHa Books', title: 'Ăn dặm không phải cuộc chiến (Weaning is not a struggle)', url: 'https://thaihabooks.com/products/an-dam-khong-phai-la-cuoc-chien-weaning-is-not-a-struggle' },
              { org: 'ThaiHa Books', title: 'Kết quả tìm kiếm bộ sách', url: 'https://thaihabooks.com/search?q=nuoi+con+khong+phai+cuoc+chien' },
              { org: 'Oreka.vn', title: 'Nuôi con không phải cuộc chiến', url: 'https://www.oreka.vn/en/mua-ban-sach/nuoi-con-khong-phai-cuoc-chien-detail/644847' },
              { org: 'Oreka.vn', title: 'Phương pháp Ăn dặm bé chỉ huy (BLW) — Gill Rapley & Tracey Murkett', url: 'https://www.oreka.vn/en/mua-ban-tac-pham-kinh-dien/phuong-phap-an-dam-be-chi-huy--baby-led-weaning----gill-rapley---tracey-murkett-detail/689265' },
              { org: 'Thư viện Quốc gia VN', title: 'TMQG 2018 Q1 (tái bản 19–23)', url: 'https://nlv.gov.vn/dmdocuments/TMQG_2018_Q1.pdf' },
              { org: 'Thư viện ĐH Công nghiệp TP.HCM', title: 'tmqg 07-2023 (bộ 2: Chào con / E.A.S.Y / Bé thơ tự ngủ)', url: 'https://lib.iuh.edu.vn/wp-content/uploads/2023/08/tmqg-07-2023.pdf' },
              { org: 'Thư viện ĐH Văn Lang', title: 'Nuôi con không phải cuộc chiến (in lần 3, 2014)', url: 'https://lib.vlu.edu.vn/cgi-bin/koha/opac-ISBDdetail.pl?biblionumber=23791' },
              { org: 'Thư viện Đài Loan (NTL)', title: 'Ăn dặm không phải là cuộc chiến (2019)', url: 'https://cis2.ntl.edu.tw/webpac/detail/2468420/' },
              { org: 'Thư viện Đài Trung', title: 'Nuôi con không phải là cuộc chiến', url: 'https://webpac.taichung.gov.tw/bookDetail/651704' },
              { org: 'CDC', title: 'Providing Care for Babies to Sleep Safely', url: 'https://www.cdc.gov/sudden-infant-death/sleep-safely/index.html' },
              { org: 'AAP/HealthyChildren', title: "A Parent's Guide to Safe Sleep", url: 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/A-Parents-Guide-to-Safe-Sleep.aspx' },
              { org: 'NHS', title: 'Weaning / How to start weaning your baby', url: 'https://www.nhs.uk/best-start-in-life/baby/weaning/how-to-start-weaning-your-baby/' },
              { org: 'WHO', title: 'Exclusive breastfeeding (e-LENA)', url: 'https://www.who.int/tools/elena/interventions/exclusive-breastfeeding' },
              { org: 'WHO', title: 'Infant and young child feeding (NLIS)', url: 'https://www.who.int/data/nutrition/nlis/info/infant-and-young-child-feeding' },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: 'cham-soc-be-theo-y-khoa',
    title: 'Chăm sóc bé 0–24 tháng — nguồn y khoa',
    emoji: '👶',
    phases: ['infant', 'toddler'],
    ageRange: 'Bé 0–24 tháng',
    summary:
      'Hướng dẫn từ 8 tổ chức y tế chính thống (WHO, AAP, CDC, NHS, UNICEF, ZERO TO THREE, NAEYC, Bộ Y tế VN) về bú mẹ, ăn dặm, an toàn ngủ và mốc phát triển trong 2 năm đầu đời.',
    sections: [
      {
        heading: 'Lưu ý',
        blocks: [
          {
            kind: 'warn',
            text: 'Đây là tài liệu giáo dục sức khỏe, không thay thế tư vấn y khoa. Nội dung về sức khỏe/an toàn nên đối chiếu thêm với bác sĩ nhi và hướng dẫn Bộ Y tế Việt Nam.',
          },
        ],
      },
      {
        heading: 'WHO — Tổ chức Y tế Thế giới',
        blocks: [
          {
            kind: 'p',
            text: 'Cơ quan y tế của Liên Hợp Quốc; chuẩn hóa khuyến nghị toàn cầu về nuôi dưỡng trẻ nhỏ (IYCF — infant and young child feeding), tăng trưởng, tiêm chủng. Chủ đề 0–24 tháng: bú mẹ hoàn toàn 6 tháng đầu + tiếp tục bú đến 24 tháng/2 tuổi; bú sớm trong giờ đầu; ăn bổ sung 6–24 tháng (số bữa, lượng kcal bổ sung theo tháng, độ đặc, đa dạng ≥5/8 nhóm thực phẩm, responsive feeding); WHO Child Growth Standards (0–5 tuổi); thức ăn cần tránh (nguy cơ hóc: nho nguyên quả, cà rốt sống, hạt; tránh mật ong <12 tháng).',
          },
          {
            kind: 'warn',
            text: 'Lưu ý kỹ thuật: WHO bị chặn truy cập trực tiếp (Cloudflare 403) trong môi trường nghiên cứu → nội dung WHO lấy từ kết quả tìm kiếm tổng hợp khớp nhiều nguồn; nên kiểm tra lại URL khi tích hợp app.',
          },
          {
            kind: 'sources',
            sources: [
              { org: 'WHO', title: 'Breastfeeding Q&A', url: 'https://www.who.int/news-room/questions-and-answers/item/breastfeeding' },
              { org: 'WHO', title: 'Complementary feeding (e-LENA)', url: 'https://www.who.int/tools/elena/interventions/complementary-feeding' },
              { org: 'WHO', title: 'Exclusive breastfeeding (e-LENA)', url: 'https://www.who.int/tools/elena/interventions/exclusive-breastfeeding' },
              { org: 'WHO', title: 'Child growth', url: 'https://www.who.int/health-topics/child-growth' },
              { org: 'WHO', title: 'Child Growth Standards', url: 'https://www.who.int/tools/child-growth-standards' },
            ],
          },
        ],
      },
      {
        heading: 'AAP / HealthyChildren.org — Hội Nhi khoa Hoa Kỳ',
        blocks: [
          {
            kind: 'p',
            text: 'Hội nhi khoa lớn nhất Hoa Kỳ (~67.000 bác sĩ nhi); HealthyChildren.org là website chính thức dành cho cha mẹ, nội dung do bác sĩ nhi biên soạn. Chủ đề 0–24 tháng: mốc phát triển theo nhóm tuổi (0–3, 4–7, 8–12 tháng, năm thứ 2); chăm sóc bé sơ sinh; an toàn ngủ (nằm ngửa khi ngủ, bề mặt cứng, không đồ chơi/gối/chăn trong cũi, ngủ cùng phòng KHÔNG ngủ chung giường ≥6 tháng, ngừng quấn khi trẻ biết lật); cho bú (sữa mẹ/sữa công thức, lượng theo tháng); ăn dặm ~6 tháng (dấu hiệu sẵn sàng, tránh mật ong <12 tháng, giới thiệu thực phẩm dị ứng sớm); khám định kỳ (Bright Futures); tiêm chủng.',
          },
          {
            kind: 'sources',
            sources: [
              { org: 'AAP/HealthyChildren', title: 'Baby ages & stages (0–12 tháng)', url: 'https://www.healthychildren.org/english/ages-stages/baby/Pages/default.aspx' },
              { org: 'AAP/HealthyChildren', title: 'Toddler ages & stages (12–36 tháng)', url: 'https://www.healthychildren.org/english/ages-stages/toddler/Pages/default.aspx' },
              { org: 'AAP/HealthyChildren', title: 'Baby sleep & safe sleep', url: 'https://www.healthychildren.org/english/ages-stages/baby/sleep/Pages/default.aspx' },
            ],
          },
        ],
      },
      {
        heading: 'CDC — Trung tâm Kiểm soát và Phòng ngừa Dịch bệnh Hoa Kỳ',
        blocks: [
          {
            kind: 'p',
            text: 'Cơ quan y tế công cộng Hoa Kỳ; quản lý chương trình sàng lọc phát triển và an toàn trẻ em. Chủ đề 0–24 tháng: "Learn the Signs. Act Early." — bộ checklist mốc phát triển theo 4 lĩnh vực (xã hội–cảm xúc, ngôn ngữ, nhận thức, vận động) tại các mốc 2, 4, 6, 9, 12, 18 tháng + dấu hiệu đỏ cần đi khám; app Milestone Tracker; an toàn ngủ / phòng SIDS (nằm ngửa, bề mặt cứng, không chăn đệm mềm, ngủ cùng phòng — giảm tới 50% nguy cơ SIDS, không ngủ chung giường).',
          },
          {
            kind: 'sources',
            sources: [
              { org: 'CDC', title: 'Developmental Milestones (2 tháng → 5 tuổi)', url: 'https://www.cdc.gov/act-early/milestones/index.html' },
              { org: 'CDC', title: 'Giới thiệu Learn the Signs. Act Early.', url: 'https://www.cdc.gov/act-early/about/' },
              { org: 'CDC', title: 'Safe sleep / SIDS', url: 'https://www.cdc.gov/sudden-infant-death/sleep-safely/index.html' },
              { org: 'CDC', title: 'Milestones (app + checklist in được)', url: 'https://www.cdc.gov/Milestones' },
            ],
          },
        ],
      },
      {
        heading: 'NHS — Dịch vụ Y tế Quốc gia Anh (Start4Life)',
        blocks: [
          {
            kind: 'p',
            text: 'Hệ thống y tế công cộng Anh; Start4Life là trung tâm thông tin chính thức cho cha mẹ (từ thai kỳ đến tuổi mầm non). Chủ đề 0–24 tháng: cho bú (sữa mẹ lý tưởng ~6 tháng đầu; sữa công thức first infant formula là đủ năm đầu — không cần follow-on/growing-up milk); ăn dặm ~6 tháng (dấu hiệu sẵn sàng thật vs nhầm lẫn; thực phẩm nên cho, tránh muối/đường/mật ong <12 tháng/sữa bò uống <12 tháng; giới thiệu dị ứng một-một); dấu hiệu đủ sữa; an toàn khi ăn.',
          },
          {
            kind: 'sources',
            sources: [
              { org: 'NHS', title: 'Start4Life', url: 'https://www.nhs.uk/start4life/' },
              { org: 'NHS', title: 'Start4Life Weaning (ăn dặm)', url: 'https://www.nhs.uk/start4life/weaning' },
            ],
          },
        ],
      },
      {
        heading: 'UNICEF — Quỹ Nhi đồng Liên Hợp Quốc',
        blocks: [
          {
            kind: 'p',
            text: 'Cơ quan Liên Hợp Quốc về quyền và sự phát triển của trẻ em; điều phối toàn cầu về nuôi dưỡng trẻ nhỏ cùng WHO. Chủ đề 0–24 tháng: cửa sổ "1.000 ngày vàng" (từ thụ thai đến 2 tuổi); bú sớm trong giờ đầu (tăng 14 lần cơ hội sống sót); bú mẹ hoàn toàn 6 tháng + bú đến 24 tháng; ăn bổ sung 6–23 tháng; Bộ tài liệu IYCF Counselling Package (2024) cho nhân viên y tế cộng đồng; dữ liệu toàn cầu (bú mẹ, đa dạng bữa ăn tối thiểu).',
          },
          {
            kind: 'sources',
            sources: [
              { org: 'UNICEF', title: 'Early childhood nutrition', url: 'https://www.unicef.org/nutrition/early-childhood-nutrition' },
              { org: 'UNICEF', title: 'Dữ liệu bú mẹ & ăn bổ sung 0–23 tháng', url: 'https://data.unicef.org/indicator-profiles/NT_BF_BF_CF/' },
              { org: 'UNICEF', title: 'Bộ tài liệu IYCF Counselling Package', url: 'https://www.unicef.org/documents/community-iycf-package' },
            ],
          },
        ],
      },
      {
        heading: 'ZERO TO THREE',
        blocks: [
          {
            kind: 'p',
            text: 'Tổ chức phi lợi nhuận Hoa Kỳ chuyên về phát triển trẻ 0–3 tuổi; dịch khoa học phát triển não bộ thành mẹo thực tế cho cha mẹ. Chủ đề 0–24 tháng: phát triển não bộ giai đoạn đầu (tới 1 triệu kết nối thần kinh/giây trong 3 năm đầu); tương tác cha mẹ–con ("serve and return"); mốc phát triển theo khoảng tuổi (0–3, 3–6, 6–9, 9–12, 12–18, 18–24 tháng); nói chuyện–đọc sách–hát–chơi; "Baby Brain Map".',
          },
          {
            kind: 'sources',
            sources: [
              { org: 'ZERO TO THREE', title: 'Parenting', url: 'https://www.zerotothree.org/parenting/' },
              { org: 'ZERO TO THREE', title: 'Thư viện tài nguyên cho cha mẹ (lọc theo tuổi/chủ đề)', url: 'https://www.zerotothree.org/resources?type=parenting-resources' },
            ],
          },
        ],
      },
      {
        heading: 'NAEYC — Hiệp hội Giáo dục Mầm non Hoa Kỳ',
        blocks: [
          {
            kind: 'p',
            text: 'Hiệp hội lớn nhất Hoa Kỳ về giáo dục mầm non; chuẩn hóa DAP (Developmentally Appropriate Practice). Chủ đề 0–24 tháng: thực hành phù hợp phát triển với trẻ sơ sinh–chập chững; giai đoạn phát triển (young infant 0–9 tháng, mobile infant 8–18 tháng, toddler 16–36 tháng); chơi và học qua trải nghiệm; hành vi & giao tiếp tích cực; đọc viết sớm cho gia đình.',
          },
          {
            kind: 'sources',
            sources: [
              { org: 'NAEYC', title: 'For Families', url: 'https://www.naeyc.org/our-work/for-families' },
              { org: 'NAEYC', title: 'Behavior & development resources', url: 'https://www.naeyc.org/our-work/families/behavior-and-development' },
              { org: 'NAEYC', title: 'Infant & toddler content', url: 'https://www.naeyc.org/ages/19/list' },
            ],
          },
        ],
      },
      {
        heading: 'Việt Nam — Bộ Y tế / Cục Bà mẹ và Trẻ em',
        blocks: [
          {
            kind: 'p',
            text: 'Cục Bà mẹ và Trẻ em (mch.moh.gov.vn) là đơn vị chủ trì chăm sóc sức khỏe bà mẹ–trẻ em. Quyết định 318/QĐ-BYT (30/01/2026) — Hướng dẫn chế độ ăn bổ sung cho trẻ 6–23 tháng: bú mẹ hoàn toàn 6 tháng đầu, bắt đầu ăn bổ sung đúng 6 tháng (180 ngày), tiếp tục bú mẹ đến 24 tháng; nguyên tắc loãng→đặc, ít→nhiều, đủ 4 nhóm (bột đường–đạm–béo–vitamin/khoáng); tránh sai lầm (ép ăn, nêm gia vị sớm, ăn vặt nhiều, ăn khi xem TV). Quyết định 3594/QĐ-BYT (29/11/2024) — 10 khuyến nghị dinh dưỡng hợp lý đến năm 2030, công thức "1 + 6 + 24". Viện Dinh dưỡng Quốc gia (NIN): viendinhduong.vn.',
          },
          {
            kind: 'warn',
            text: 'Hướng dẫn Bộ Y tế VN hiện hành (318/QĐ-BYT) đồng hướng WHO/UNICEF (bú mẹ hoàn toàn 6 tháng, ăn dặm từ 6 tháng, bú đến 24 tháng) → chuẩn quốc tế và địa phương không mâu thuẫn, có thể dùng chéo. Lưu ý: chưa đối chiếu trực tiếp từng văn bản; vài URL nên kiểm tra lại khi tích hợp app.',
          },
          {
            kind: 'sources',
            sources: [
              { org: 'Bộ Y tế VN', title: 'Cục Bà mẹ và Trẻ em', url: 'https://mch.moh.gov.vn' },
              { org: 'Bộ Y tế VN', title: 'Cổng thông tin Bộ Y tế', url: 'https://moh.gov.vn' },
              { org: 'Viện Dinh dưỡng Quốc gia', title: 'Viện Dinh dưỡng Quốc gia (NIN)', url: 'https://viendinhduong.vn' },
            ],
          },
        ],
      },
      {
        heading: 'An toàn giấc ngủ (AAP/CDC)',
        blocks: [
          {
            kind: 'warn',
            text: 'Luôn đặt bé nằm ngửa khi ngủ; ngủ cùng phòng, không ngủ chung giường; dùng nệm cứng, không gối/chăn/thú nhồi bông trong cũi; không để bé quá nóng; ngừng quấn khi bé có dấu hiệu lẫy/lật. Ngủ cùng phòng có thể giảm tới 50% nguy cơ SIDS.',
          },
        ],
      },
      {
        heading: 'Mốc phát triển theo lứa tuổi',
        blocks: [
          {
            kind: 'p',
            text: 'CDC theo dõi mốc phát triển theo 4 lĩnh vực (xã hội–cảm xúc, ngôn ngữ, nhận thức, vận động) tại các mốc 2, 4, 6, 9, 12, 18 tháng, kèm dấu hiệu đỏ cần đi khám. ZERO TO THREE chia mốc não bộ theo các khoảng 0–3, 3–6, 6–9, 9–12, 12–18, 18–24 tháng. AAP chia theo nhóm 0–3, 4–7, 8–12 tháng và năm thứ 2. NAEYC phân giai đoạn young infant 0–9 tháng, mobile infant 8–18 tháng, toddler 16–36 tháng.',
          },
          {
            kind: 'table',
            headers: ['Mốc tuổi (CDC)', '4 lĩnh vực kiểm tra', 'Lưu ý'],
            rows: [
              ['2 tháng', 'Xã hội–cảm xúc · Ngôn ngữ · Nhận thức · Vận động', 'Không đạt mốc hoặc có dấu hiệu đỏ → đi khám sớm'],
              ['4 tháng', 'Xã hội–cảm xúc · Ngôn ngữ · Nhận thức · Vận động', 'Không đạt mốc hoặc có dấu hiệu đỏ → đi khám sớm'],
              ['6 tháng', 'Xã hội–cảm xúc · Ngôn ngữ · Nhận thức · Vận động', 'Không đạt mốc hoặc có dấu hiệu đỏ → đi khám sớm'],
              ['9 tháng', 'Xã hội–cảm xúc · Ngôn ngữ · Nhận thức · Vận động', 'Không đạt mốc hoặc có dấu hiệu đỏ → đi khám sớm'],
              ['12 tháng', 'Xã hội–cảm xúc · Ngôn ngữ · Nhận thức · Vận động', 'Không đạt mốc hoặc có dấu hiệu đỏ → đi khám sớm'],
              ['18 tháng', 'Xã hội–cảm xúc · Ngôn ngữ · Nhận thức · Vận động', 'Không đạt mốc hoặc có dấu hiệu đỏ → đi khám sớm'],
            ],
          },
          {
            kind: 'warn',
            text: 'Mốc phát triển chỉ để tham khảo — không tự chẩn đoán chậm phát triển. Nên dùng bảng tăng trưởng chuẩn (WHO Child Growth Standards) và khám nhi định kỳ.',
          },
        ],
      },
      {
        heading: 'Nguồn tổng hợp',
        blocks: [
          {
            kind: 'sources',
            sources: [
              { org: 'WHO', title: 'Breastfeeding Q&A', url: 'https://www.who.int/news-room/questions-and-answers/item/breastfeeding' },
              { org: 'WHO', title: 'Complementary feeding (e-LENA)', url: 'https://www.who.int/tools/elena/interventions/complementary-feeding' },
              { org: 'WHO', title: 'Exclusive breastfeeding (e-LENA)', url: 'https://www.who.int/tools/elena/interventions/exclusive-breastfeeding' },
              { org: 'WHO', title: 'Child growth', url: 'https://www.who.int/health-topics/child-growth' },
              { org: 'WHO', title: 'Child Growth Standards', url: 'https://www.who.int/tools/child-growth-standards' },
              { org: 'AAP/HealthyChildren', title: 'Baby ages & stages', url: 'https://www.healthychildren.org/english/ages-stages/baby/Pages/default.aspx' },
              { org: 'AAP/HealthyChildren', title: 'Toddler ages & stages', url: 'https://www.healthychildren.org/english/ages-stages/toddler/Pages/default.aspx' },
              { org: 'AAP/HealthyChildren', title: 'Baby sleep', url: 'https://www.healthychildren.org/english/ages-stages/baby/sleep/Pages/default.aspx' },
              { org: 'CDC', title: 'Developmental Milestones', url: 'https://www.cdc.gov/act-early/milestones/index.html' },
              { org: 'CDC', title: 'About Learn the Signs. Act Early.', url: 'https://www.cdc.gov/act-early/about/' },
              { org: 'CDC', title: 'Safe sleep / SIDS', url: 'https://www.cdc.gov/sudden-infant-death/sleep-safely/index.html' },
              { org: 'CDC', title: 'Milestones (app/checklist)', url: 'https://www.cdc.gov/Milestones' },
              { org: 'NHS', title: 'Start4Life', url: 'https://www.nhs.uk/start4life/' },
              { org: 'NHS', title: 'Start4Life Weaning', url: 'https://www.nhs.uk/start4life/weaning' },
              { org: 'UNICEF', title: 'Early childhood nutrition', url: 'https://www.unicef.org/nutrition/early-childhood-nutrition' },
              { org: 'UNICEF', title: 'Breastmilk & complementary feeding data', url: 'https://data.unicef.org/indicator-profiles/NT_BF_BF_CF/' },
              { org: 'UNICEF', title: 'Community IYCF Counselling Package', url: 'https://www.unicef.org/documents/community-iycf-package' },
              { org: 'ZERO TO THREE', title: 'Parenting', url: 'https://www.zerotothree.org/parenting/' },
              { org: 'ZERO TO THREE', title: 'Parenting resources (lọc theo tuổi)', url: 'https://www.zerotothree.org/resources?type=parenting-resources' },
              { org: 'NAEYC', title: 'For Families', url: 'https://www.naeyc.org/our-work/for-families' },
              { org: 'NAEYC', title: 'Behavior & development resources', url: 'https://www.naeyc.org/our-work/families/behavior-and-development' },
              { org: 'NAEYC', title: 'Infant/toddler content', url: 'https://www.naeyc.org/ages/19/list' },
              { org: 'Bộ Y tế VN', title: 'Cục Bà mẹ và Trẻ em', url: 'https://mch.moh.gov.vn' },
              { org: 'Bộ Y tế VN', title: 'Cổng thông tin Bộ Y tế', url: 'https://moh.gov.vn' },
              { org: 'Viện Dinh dưỡng Quốc gia', title: 'Viện Dinh dưỡng Quốc gia (NIN)', url: 'https://viendinhduong.vn' },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: 'sach-nuoi-day-con-tham-khao',
    title: 'Sách nuôi dạy con đáng tham khảo',
    emoji: '📚',
    phases: ['infant', 'toddler'],
    ageRange: 'Bé 0–24 tháng',
    summary:
      '10 cuốn sách đã xác minh qua web (7 quốc tế + 3 Việt) kèm độ tin cậy và điểm cần đối chiếu y khoa — phân biệt rõ sách y khoa, sách phổ biến và sách tâm lý.',
    bookSources: [
      { book: 'Caring for Your Baby and Young Child: Birth to Age 5', authors: 'AAP — chủ biên Steven P. Shelov, MD, FAAP (~70–80 chuyên gia nhi)', note: 'Độ tin cậy: y khoa — sách chính thức của AAP, an toàn để trích dẫn' },
      { book: 'Heading Home With Your Newborn: From Birth to Reality', authors: 'Laura A. Jana, MD, FAAP & Jennifer Shu, MD, FAAP', note: 'Độ tin cậy: y khoa — NXB AAP' },
      { book: 'What to Expect the First Year', authors: 'Heidi Murkoff (cùng Sharon Mazel)', note: 'Độ tin cậy: đại chúng phổ biến — nên dùng kèm AAP/WHO' },
      { book: 'The Baby Book', authors: 'William Sears, MD; Martha Sears, RN; Robert Sears & James Sears', note: 'Độ tin cậy: phổ biến — lưu ý ngủ chung giường trái AAP/CDC' },
      { book: 'The Whole-Brain Child', authors: 'Daniel J. Siegel, MD & Tina Payne Bryson, PhD', note: 'Độ tin cậy: tâm lý/phát triển phổ biến' },
      { book: 'How to Talk So Little Kids Will Listen', authors: 'Joanna Faber & Julie King', note: 'Độ tin cậy: tâm lý giao tiếp — áp dụng từ ~18–24 tháng' },
      { book: 'The Happiest Baby on the Block', authors: 'Harvey Karp, MD', note: 'Độ tin cậy: phổ biến — lưu ý tư thế 5S khi ngủ phải nằm ngửa' },
      { book: 'Dạy con kiểu Nhật: Giai đoạn 0 tuổi', authors: 'Kubota Kisou (dịch: Nguyễn Thị Mai) — NXB Lao động – Xã hội (2013)', note: 'Độ tin cậy: đại chúng/phổ biến' },
      { book: 'Chào con! Ba mẹ đã sẵn sàng', authors: 'ThS.BS Trần Thị Huyên Thảo — NXB Trẻ (2016)', note: 'Độ tin cậy: y khoa (bác sĩ Việt)' },
      { book: 'Hỏi bác sĩ nhi đồng', authors: 'BS Trương Hữu Khanh — NXB Trẻ (2018)', note: 'Độ tin cậy: y khoa thực hành' },
    ],
    sections: [
      {
        heading: '7 sách quốc tế (đã xác minh)',
        blocks: [
          {
            kind: 'table',
            headers: ['Sách', 'Tác giả', 'Độ tuổi', 'Độ tin cậy', 'Điểm cần đối chiếu'],
            rows: [
              ['Caring for Your Baby and Young Child: Birth to Age 5', 'AAP (chủ biên Steven P. Shelov, MD, FAAP)', '0–5 tuổi (trọng tâm sơ sinh & 2 năm đầu)', 'Y khoa', 'Là chính nguồn y khoa; chưa xác minh bản tiếng Việt → app tự tóm tắt/diễn giải'],
              ['Heading Home With Your Newborn', 'Laura A. Jana, MD, FAAP & Jennifer Shu, MD, FAAP (NXB AAP)', '0–2 tháng đầu', 'Y khoa', 'Khuyến nghị ngủ cùng phòng theo AAP; chưa có bản Việt'],
              ['What to Expect the First Year', 'Heidi Murkoff (cùng Sharon Mazel)', '0–12 tháng', 'Đại chúng phổ biến', 'Dùng kèm AAP/WHO cho quyết định sức khỏe'],
              ['The Baby Book', 'William Sears, MD; Martha Sears, RN; Robert Sears & James Sears', '0–2 tuổi', 'Phổ biến', 'Ngủ chung giường (bed-sharing) mâu thuẫn AAP/CDC → giữ chuẩn "ngủ cùng phòng, không cùng giường"'],
              ['The Whole-Brain Child', 'Daniel J. Siegel, MD & Tina Payne Bryson, PhD', 'Cuối giai đoạn 0–24 tháng trở lên (~18–24 tháng+)', 'Tâm lý/phát triển phổ biến', 'Siegel là bác sĩ tâm thần (không phải nhi khoa); chỉ dùng cho phần tương tác/cảm xúc'],
              ['How to Talk So Little Kids Will Listen', 'Joanna Faber & Julie King', '2–7 tuổi (áp dụng phần cuối 0–24 tháng)', 'Tâm lý giao tiếp', 'Không dùng cho quyết định sức khỏe/an toàn của bé nhỏ'],
              ['The Happiest Baby on the Block', 'Harvey Karp, MD', '0–3 tháng (dỗ trẻ sơ sinh khóc)', 'Phổ biến', 'Tư thế nghiêng/sấp trong 5S chỉ khi dỗ trẻ TỈNH, lúc ngủ luôn nằm ngửa; ngừng quấn khi bé biết lật'],
            ],
          },
        ],
      },
      {
        heading: '3 sách Việt (đã xác minh)',
        blocks: [
          {
            kind: 'table',
            headers: ['Sách', 'Tác giả', 'Độ tuổi', 'Độ tin cậy', 'Điểm cần đối chiếu'],
            rows: [
              ['Dạy con kiểu Nhật: Giai đoạn 0 tuổi', 'Kubota Kisou (dịch: Nguyễn Thị Mai) — NXB Lao động – Xã hội (2013), ISBN 9786049821592', '0 tuổi (sơ sinh – 12 tháng)', 'Đại chúng/phổ biến', 'Một số ý "kích thích sớm" nên đối chiếu chuẩn phát triển WHO/CDC'],
              ['Chào con! Ba mẹ đã sẵn sàng', 'ThS.BS Trần Thị Huyên Thảo — NXB Trẻ (2016)', 'Chuẩn bị mang thai → nuôi dưỡng trẻ sơ sinh', 'Y khoa', 'Rất hợp bối cảnh sinh – nuôi con ở Việt Nam'],
              ['Hỏi bác sĩ nhi đồng', 'BS Trương Hữu Khanh — NXB Trẻ (2018)', 'Trẻ nhỏ, gồm sơ sinh – 24 tháng', 'Y khoa thực hành', 'Trực tiếp cho mục "khi nào cần đi khám"'],
            ],
          },
        ],
      },
      {
        heading: 'Cách phân loại & dùng trong app',
        blocks: [
          {
            kind: 'list',
            items: [
              'Y khoa chính thống (chuẩn cho nội dung sức khỏe/an toàn): Caring for Your Baby (AAP), Heading Home With Your Newborn (AAP), Chào con (Trần Thị Huyên Thảo), Hỏi bác sĩ nhi đồng (Trương Hữu Khanh).',
              'Phổ biến (tham khảo tổng quan, dùng kèm nguồn y khoa): What to Expect the First Year, The Baby Book (Sears), Dạy con kiểu Nhật, The Happiest Baby on the Block.',
              'Tâm lý/phát triển (dùng cho mục tương tác, hành vi, cảm xúc): The Whole-Brain Child, How to Talk So Little Kids Will Listen.',
            ],
          },
          {
            kind: 'warn',
            text: 'Các điểm cần đối chiếu khi đưa vào app: ngủ chung giường (bed-sharing) trong The Baby Book mâu thuẫn AAP/CDC — giữ chuẩn "ngủ cùng phòng, không ngủ chung giường"; tư thế nằm sấp/nghiêng trong 5S của Karp chỉ khi dỗ trẻ TỈNH, lúc ngủ luôn nằm ngửa; quấn (swaddle) ngừng khi trẻ biết lật; tránh mật ong <12 tháng và sữa bò uống <12 tháng (thống nhất WHO/NHS/AAP/CDC).',
          },
        ],
      },
      {
        heading: 'Sách chưa xác minh (chưa đưa vào khuyến nghị)',
        blocks: [
          {
            kind: 'warn',
            text: 'Chưa xác minh được qua web trong phiên nghiên cứu — không bịa tác giả/năm/NXB, cần kiểm tra trên sàn sách (Tiki/Fahasa) hoặc thư viện trước khi đưa vào app: "Mẹ Nhật nuôi con nhàn tênh" (chưa rõ tác giả, năm, NXB, nhà dịch); "Bác sĩ riêng của bé yêu"; sách của BS Nguyễn Thị Việt Hà; "Bách khoa thai giáo" (sách dịch Trung Quốc, phạm vi thai giáo — không đưa vào khuyến nghị chính cho 0–24 tháng).',
          },
        ],
      },
      {
        heading: 'Nguồn',
        blocks: [
          {
            kind: 'sources',
            sources: [
              { org: 'AAP', title: 'Caring for Your Baby and Young Child', url: 'https://publications.aap.org/aapbooks/book/367/Caring-for-Your-Baby-and-Young-ChildBirth-to-Age-5' },
              { org: 'AAP', title: 'Heading Home With Your Newborn (Jana & Shu)', url: 'https://www.abebooks.com/products/isbn/9781581108934' },
              { org: 'Workman', title: 'What to Expect the First Year (Murkoff)', url: 'https://www.amazon.ca/What-Expect-First-Year-Third/dp/0761181504' },
              { org: 'Little, Brown', title: 'The Baby Book (Sears)', url: 'https://www.littledayout.com/best-parenting-books-for-newborns/' },
              { org: 'Delacorte', title: 'The Whole-Brain Child (Siegel & Bryson)', url: 'https://www.tinabryson.com/thewholebrainchild' },
              { org: 'Scribner', title: 'How to Talk So Little Kids Will Listen (Faber & King)', url: 'https://catalog.princeton.edu/catalog/99100933613506421' },
              { org: 'Bantam', title: 'The Happiest Baby on the Block (Karp)', url: 'https://harpercollins.co.in/author/harvey-karp/' },
              { org: 'Thư viện Quốc gia VN', title: 'Dạy con kiểu Nhật: Giai đoạn 0 tuổi — thư mục (ISBN 9786049821592)', url: 'https://nlv.gov.vn' },
              { org: 'Vietnam.vn', title: 'Danh sách sách của các bác sĩ nổi tiếng VN (Chào con / Hỏi bác sĩ nhi đồng)', url: 'https://www.vietnam.vn/nhung-cuon-sach-cua-cac-bac-si-noi-tieng-viet-nam' },
            ],
          },
        ],
      },
    ],
  },
]
