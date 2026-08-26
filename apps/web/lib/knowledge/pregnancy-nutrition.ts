// ===========================================================================
// pregnancy-nutrition.ts — Kiến thức DINH DƯỠNG & BỔ SUNG THAI KỲ (Agent D2).
// Nguồn: orchestration/docs/nutrition-knowledge-base.md · nutrition-sources.md ·
// vietnam-health-guidance.md (đã soạn sẵn — chỉ chuyển, không bịa nội dung).
// Chuẩn y khoa: ACOG · WHO/FAO/UNU · NIH/ODS · NHS · IOM/NASEM · FDA/EPA · ATA ·
// Viện Dinh dưỡng VN (BYT). Thực đơn mẫu trỏ món có id trong lib/nutrition/meals-data.ts.
// Đây là dữ liệu giáo dục sức khỏe, KHÔNG thay thế tư vấn y khoa.
// Type theo hợp đồng chung: lib/knowledge/types.ts (agent Shell).
// ===========================================================================

import type { KnowledgeTopic } from './types'

export const topics: KnowledgeTopic[] = [
  // =========================================================================
  // CHỦ ĐỀ — DINH DƯỠNG & BỔ SUNG THAI KỲ
  // =========================================================================
  {
    slug: 'dinh-duong-thai-ky',
    title: 'Dinh dưỡng & bổ sung thai kỳ',
    emoji: '🥗',
    phases: ['preconception', 'pregnancy'],
    ageRange: 'Trước thai → thai kỳ',
    summary:
      'Ăn uống khi mang thai không phải "ăn cho hai người": T1 chưa cần tăng năng lượng, T2 +340 kcal, T3 +450 kcal (chuẩn ACOG), tăng cân theo BMI ~10–12 kg cho mẹ Việt. Trọng tâm là ăn đủ 5 nhóm + bổ sung đúng vi chất (folate, sắt, DHA, canxi, vitamin D, i-ốt) và xử lý mẹo theo từng tình trạng ốm nghén, táo bón, trào ngược, thiếu máu.',
    sections: [
      // =====================================================================
      // 1. NĂNG LƯỢNG & TĂNG CÂN
      // =====================================================================
      {
        heading: 'Năng lượng & tăng cân',
        blocks: [
          {
            kind: 'warn',
            text: 'Đây là tài liệu giáo dục sức khỏe, không thay thế tư vấn y khoa. Mốc tăng cân và mức năng lượng là tham chiếu theo dõi xu hướng — cần cá thể hóa theo tư vấn bác sĩ sản khoa.',
          },
          {
            kind: 'p',
            text: 'Năng lượng khi mang thai KHÔNG tăng nhiều như nhiều người nghĩ — không phải "ăn cho hai người". Chuẩn quốc tế (ACOG): T1 (tuần 1–13) chưa cần tăng thêm; T2 (tuần 14–26) +340 kcal/ngày; T3 (tuần 27–40) +450 kcal/ngày. NHS thậm chí chỉ cần thêm ~200 kcal/ngày trong 12 tuần cuối. Riêng Việt Nam, Bộ Y tế vẫn khuyến nghị cộng thêm nhẹ ngay từ T1 (+50 kcal) và +250 kcal ở T2 — chênh lệch nhỏ, không phải mâu thuẫn lớn.',
          },
          {
            kind: 'table',
            headers: ['Giai đoạn', 'Tăng thêm quốc tế (ACOG)', 'VN (Bộ Y tế)', 'Tổng ước tính (nền ~1.800–2.000 kcal)'],
            rows: [
              ['T1 (tuần 1–13)', 'Không cần tăng', '+50 kcal', '~1.800–2.000 kcal'],
              ['T2 (tuần 14–26)', '+340 kcal (WHO: +285)', '+250 kcal', '~2.200–2.400 kcal'],
              ['T3 (tuần 27–40)', '+450 kcal (WHO: +475; NHS: +200 ở 12 tuần cuối)', '+450 kcal', '~2.300–2.500 kcal'],
            ],
          },
          {
            kind: 'p',
            text: 'Tăng cân khuyến nghị dựa trên BMI trước khi mang thai — chuẩn IOM 2009 (được CDC/ACOG áp dụng). Thai phụ Việt BMI bình thường: Bộ Y tế khuyến nghị 10–12 kg cho cả thai kỳ (khoảng hẹp hơn IOM 11,5–16 kg). Ở T1 chỉ nên tăng 0,5–2 kg.',
          },
          {
            kind: 'table',
            headers: ['BMI trước thai kỳ', 'Tổng tăng cân IOM/CDC', 'Tăng cân VN (BYT)', 'Tốc độ tuần T2–T3 (IOM)'],
            rows: [
              ['Thiếu cân (<18,5)', '12,5–18 kg', '~25% cân nặng trước thai', '~0,51 kg/tuần'],
              ['Bình thường (18,5–24,9)', '11,5–16 kg', '10–12 kg', '~0,42 kg/tuần'],
              ['Thừa cân (25–29,9)', '7–11,5 kg', '~15% cân nặng trước thai', '~0,28 kg/tuần'],
              ['Béo phì (≥30)', '5–9 kg', '~15% cân nặng trước thai', '~0,22 kg/tuần'],
            ],
          },
          {
            kind: 'list',
            items: [
              'Nguyên tắc: ăn thêm ĐÚNG lượng theo giai đoạn, ưu tiên thực phẩm đậm đặc dưỡng chất hơn là ăn thêm đồ rỗng calo.',
              '~340 kcal ≈ 1 chén cơm đầy + 1 hộp sữa chua; hoặc 2 lát bánh mì + 1 quả trứng + 1 ly sữa.',
              'Tăng cân quá mức → tăng nguy cơ tiểu đường thai kỳ, thai to (macrosomia), mổ lấy thai. Tăng quá ít → nguy cơ nhẹ cân, sinh non.',
              'Thai đôi (BMI bình thường) tăng nhiều hơn: ~16,8–24,5 kg (tham khảo MSD/IOM).',
              'Mẹ thừa cân/béo phì: VN chưa có khuyến nghị riêng — Viện Dinh dưỡng TP.HCM đề nghị theo CDC (0 / +200–400 / +400 kcal).',
            ],
          },
          {
            kind: 'sources',
            sources: [
              { org: 'ACOG', title: 'Nutrition During Pregnancy', url: 'https://www.acog.org/womens-health/faqs/nutrition-during-pregnancy' },
              { org: 'WHO/FAO/UNU', title: 'Energy requirements', url: 'https://www.fao.org/4/y5686e/y5686e07.htm' },
              { org: 'NHS', title: 'Have a healthy diet in pregnancy', url: 'https://www.nhs.uk/pregnancy/keeping-well/have-a-healthy-diet/' },
              { org: 'IOM/NASEM', title: 'Weight Gain During Pregnancy (2009)', url: 'https://www.ncbi.nlm.nih.gov/books/NBK32801/table/ch7.t1/' },
              { org: 'Viện Dinh dưỡng TP.HCM', title: 'Khuyến nghị tăng cân & mức năng lượng khẩu phần khi mang thai', url: 'https://viendinhduongtphcm.org/Media/Tai_lieu_chuyen_mon/Dinh_duong_san_phu_khoa/Khuyen_nghi_tang_can_va_muc_nang_luong_khau_phan_khi_mang_thai.pdf' },
              { org: 'Bộ Y tế VN', title: 'QĐ 776/QĐ-BYT — Hướng dẫn quốc gia dinh dưỡng cho phụ nữ có thai', url: 'https://bvnguyentriphuong.com.vn/san-phu-khoa/huong-dan-quoc-gia-ve-dinh-duong-cho-phu-nu-co-thai-va-ba-me-cho-con-bu-phan-1' },
            ],
          },
        ],
      },

      // =====================================================================
      // 2. NHÓM THỰC PHẨM & KHẨU PHẦN
      // =====================================================================
      {
        heading: 'Nhóm thực phẩm & khẩu phần',
        blocks: [
          {
            kind: 'p',
            text: 'Nền tảng là ăn đủ 5 nhóm thực phẩm + nước mỗi ngày, ưu tiên thực phẩm nguyên chất, đậm đặc dưỡng chất, hạn chế đường tinh luyện và đồ chế biến sẵn. Món gợi ý dưới đây lấy từ kho món Việt của app.',
          },
          {
            kind: 'table',
            headers: ['Nhóm', 'Khẩu phần/ngày', 'Món Việt gợi ý'],
            rows: [
              ['Đạm (thịt/cá/trứng/đậu)', '3 phần — mỗi bữa 1 phần ~100 g', 'Phở bò, Cơm cá kho (cá thu), Đậu phụ sốt cà chua, trứng'],
              ['Rau xanh', '≥3 bát, ưu tiên rau xanh đậm', 'Canh rau ngót thịt băm, Thịt bò xào bông cải, rau muống luộc'],
              ['Trái cây', '2 phần (1 quả ổi/cam + 1 quả chuối/đu đủ chín)', 'Nước cam ép, Sinh tố đu đủ chín, ổi, chuối'],
              ['Tinh bột (cơm/bún/phở)', 'Theo năng lượng giai đoạn (~1,5–2 chén/bữa)', 'Phở gà, Xôi đậu xanh, cơm gạo lứt, bún'],
              ['Chất béo lành mạnh', 'Dầu thực vật khi nấu + 2 phần cá béo/tuần', 'Cá hồi nướng chanh, cá thu, lạc/vừng/hạt'],
              ['Sữa & thực phẩm từ sữa', '2–3 phần (1 phần = 1 ly sữa 250 ml / 1 hộp sữa chua / 30 g phô mai)', 'Sữa bò nóng, Sữa chua hoa quả, phô mai, đậu phụ'],
              ['Nước', '~2–2,3 L/ngày', 'Nước đun sôi để nguội, nước canh, sữa — hạn chế nước ngọt'],
            ],
          },
          {
            kind: 'list',
            items: [
              'Đạm: 3 bữa chính mỗi bữa 1 phần đạm (thịt/cá/trứng/đậu) + 2 ly sữa là dễ đạt 70–80 g/ngày.',
              'Vitamin C (ổi, cam, đu đủ chín, rau xanh) ăn kèm bữa có sắt thực vật để tăng hấp thu sắt.',
              'Canxi: 2 ly sữa + 1 hộp sữa chua + rau xanh + đậu phụ là dễ đạt ~800–1.000 mg/ngày.',
              'Chất xơ: chọn gạo lứt/nguyên cám, ăn rau mỗi bữa, trái cây + đậu đỗ mỗi ngày; tăng nước song song.',
              'Hạn chế đường tinh luyện, nước ngọt có ga, đồ ăn nhanh — phòng tiểu đường thai kỳ và tăng cân quá mức.',
            ],
          },
          {
            kind: 'sources',
            sources: [
              { org: 'USDA MyPlate', title: 'Protein Foods', url: 'https://www.myplate.gov/eat-healthy/protein-foods' },
              { org: 'USDA', title: 'Dietary Guidelines 2020–2025 (fiber AI)', url: 'https://www.dietaryguidelines.gov/' },
              { org: 'NHS', title: 'Have a healthy diet in pregnancy', url: 'https://www.nhs.uk/pregnancy/keeping-well/have-a-healthy-diet/' },
              { org: 'ACOG', title: 'Nutrition During Pregnancy', url: 'https://www.acog.org/womens-health/faqs/nutrition-during-pregnancy' },
              { org: 'Bộ Y tế — Viện Dinh dưỡng', title: 'Nhu cầu dinh dưỡng khuyến nghị cho người Việt Nam (2016)', url: 'https://viendinhduong.vn/' },
            ],
          },
        ],
      },

      // =====================================================================
      // 3. THỰC ĐƠN MẪU THEO TAM CÁ NGUYỆT
      // =====================================================================
      {
        heading: 'Thực đơn mẫu theo tam cá nguyệt',
        blocks: [
          {
            kind: 'p',
            text: 'Một ngày mẫu cho mỗi tam cá nguyệt — món đều có trong kho món của app (lib/nutrition/meals-data.ts). Đây là gợi ý, KHÔNG bắt buộc đúng món: xoay vòng theo mùa, khẩu vị và mức năng lượng giai đoạn; chia thành 3 bữa chính + 2–3 bữa phụ.',
          },
          {
            kind: 'p',
            text: 'THỰC ĐƠN T1 (tuần 1–13) — ưu tiên mềm, nhạt, dễ tiêu cho ốm nghén; chưa cần tăng năng lượng.',
          },
          {
            kind: 'table',
            headers: ['Bữa', 'Món', 'Mã món', 'Ghi chú'],
            rows: [
              ['Sáng', 'Cháo cá', 'chao-ca', 'Mềm, ít mùi, dễ tiêu — hợp ốm nghén buổi sáng'],
              ['Phụ sáng', 'Sinh tố đu đủ chín', 'sinh-to-du-du', 'Vitamin C + beta-caroten; đu đủ chín kỹ'],
              ['Trưa', 'Cơm gà kho gừng', 'com-ga-kho-gung', 'Gừng giúp giảm buồn nôn; gà nạc dễ ăn'],
              ['Phụ chiều', 'Sữa chua hoa quả', 'sua-chua-hoa-qua', 'Canxi + lợi khuẩn hỗ trợ tiêu hóa'],
              ['Tối', 'Canh rau ngót thịt băm', 'canh-rau-ngot-thit-bam', 'Sắt + folate, thanh đạm; nấu chín kỹ'],
              ['Trước ngủ (nếu đói)', 'Sữa bò nóng', 'sua-bo-nong', '1 ly 250 ml ~300 mg canxi'],
            ],
          },
          {
            kind: 'p',
            text: 'THỰC ĐƠN T2 (tuần 14–26) — tăng đạm + canxi + DHA; thường là giai đoạn ăn ngon miệng nhất.',
          },
          {
            kind: 'table',
            headers: ['Bữa', 'Món', 'Mã món', 'Ghi chú'],
            rows: [
              ['Sáng', 'Phở gà', 'pho-ga', 'Đạm + ít béo; ăn kèm rau thơm'],
              ['Phụ sáng', 'Sinh tố bơ', 'sinh-to-bo', 'Folate + chất béo lành mạnh'],
              ['Trưa', 'Cơm cá kho', 'com-ca-kho', 'Cá thu giàu DHA — não thai phát triển'],
              ['Phụ chiều', 'Ngũ cốc yến mạch trái cây', 'ngucoc-trai-cay', 'Chất xơ + canxi; bữa phụ no lâu'],
              ['Tối', 'Cá hồi nướng chanh', 'ca-hoi-nuong-chanh', 'DHA + vitamin D; nên có 2 phần cá béo/tuần'],
              ['Trước ngủ', 'Sữa bò nóng', 'sua-bo-nong', 'Canxi cho xương/răng thai hình thành'],
            ],
          },
          {
            kind: 'p',
            text: 'THỰC ĐƠN T3 (tuần 27–40) — DHA + sắt (dự trữ cho bé) + chất xơ chống táo bón; ăn ít một nhưng nhiều bữa vì tử cung chèn ép dạ dày.',
          },
          {
            kind: 'table',
            headers: ['Bữa', 'Món', 'Mã món', 'Ghi chú'],
            rows: [
              ['Sáng', 'Xôi đậu xanh', 'xoi-dau-xanh', 'Folate + năng lượng, no lâu'],
              ['Phụ sáng', 'Sữa chua hoa quả', 'sua-chua-hoa-qua', 'Canxi + hỗ trợ tiêu hóa'],
              ['Trưa', 'Cơm thịt kho trứng', 'com-thit-kho-trung', 'Choline + đạm — não thai tăng trưởng vượt bậc'],
              ['Phụ chiều', 'Khoai lang luộc', 'khoai-lang-luoc', 'Chất xơ chống táo bón T3'],
              ['Tối', 'Tôm kho thịt', 'tom-kho-thit', 'Canxi + kẽm; ăn kèm rau muống luộc'],
              ['Trước ngủ', 'Sữa bò nóng', 'sua-bo-nong', 'Canxi — bé hấp thu mạnh nhất giai đoạn này'],
            ],
          },
          {
            kind: 'list',
            items: [
              'Món nào trong thực đơn bị ốm nghén/trào ngược gây khó chịu thì thay bằng món thanh đạm tương đương (cháo, canh, món hấp/luộc).',
              'Mẹ ăn chay: thay đạm động vật bằng đậu phụ, đậu đỗ, trứng (nếu ăn trứng), và PHẢI bổ sung vitamin B12.',
              'Giá đỗ, rau sống nên chần chín; trứng, thịt, cá nấu chín kỹ.',
              'Giữa 2 bữa chính nếu đói, chọn bữa phụ lành mạnh: sữa chua, khoai lang luộc, ngô luộc, trái cây chín, 1 ly sữa.',
            ],
          },
          {
            kind: 'sources',
            sources: [
              { org: 'ACOG', title: 'Nutrition During Pregnancy', url: 'https://www.acog.org/womens-health/faqs/nutrition-during-pregnancy' },
              { org: 'NHS', title: 'Have a healthy diet in pregnancy', url: 'https://www.nhs.uk/pregnancy/keeping-well/have-a-healthy-diet/' },
              { org: 'FDA/EPA', title: 'Advice About Eating Fish', url: 'https://www.fda.gov/food/consumers/advice-about-eating-fish' },
            ],
          },
        ],
      },

      // =====================================================================
      // 4. BỔ SUNG THEO GIAI ĐOẠN
      // =====================================================================
      {
        heading: 'Bổ sung theo giai đoạn',
        blocks: [
          {
            kind: 'warn',
            text: 'Thực phẩm trước, viên bổ sung sau. KHÔNG tự ý liều cao; hỏi bác sĩ trước khi dùng bất kỳ viên bổ sung/thảo dược nào. Nếu viên tiền sản của bạn đã chứa sắt, i-ốt, DHA… thì KHÔNG cộng dồn thêm viên riêng cùng vi chất (dễ vượt giới hạn an toàn).',
          },
          {
            kind: 'table',
            headers: ['Chất', 'Liều khuyến nghị/ngày', 'Thời điểm & lưu ý', 'Khi nào cần hỏi bác sĩ'],
            rows: [
              ['Axit folic', '400 mcg (bổ sung) từ ≥1 tháng trước thụ thai → hết tuần 12; RDA 600 mcg DFE', 'Uống hằng ngày; quan trọng nhất tuần 1–12 (ống thần kinh đóng ~ngày 28)', 'Tiền sử dị tật ống thần kinh, BMI ≥30, động kinh → cần 4.000 mcg theo chỉ định; không tự vượt 1.000 mcg'],
              ['Sắt', '27 mg/ngày; WHO vùng thiếu máu cao (VN): 30–60 mg/ngày phổ cập', 'Uống cách xa sữa/trà/cà phê ≥2 giờ; kèm vitamin C (chanh, ổi, cam)', 'Thiếu máu → 60–120 mg chỉ theo bác sĩ; táo bón nặng → đổi dạng/liều theo tư vấn'],
              ['DHA / Omega-3', '≥200 mg DHA/ngày (hoặc 2–3 phần cá ít thủy ngân/tuần)', 'Uống hằng ngày; nhấn mạnh nhất T3 (não thai tăng ~3×)', 'Rối loạn chảy máu, sắp phẫu thuật → hỏi bác sĩ; chọn DHA tinh luyện/DHA tảo, tránh dầu gan cá'],
              ['Canxi', '1.000 mg/ngày (vị thành niên 1.300); WHO vùng ít canxi 1.500–2.000', 'Chia ≤500 mg/lần; KHÔNG uống chung giờ với sắt liều cao', 'Sỏi thận, tăng canxi máu → hỏi bác sĩ'],
              ['Vitamin D', '400–600 IU/ngày (VN RDA 800 IU)', 'Uống cùng bữa có chất béo; kết hợp phơi nắng sáng sớm 10–15 phút', 'Thiếu rõ → bác sĩ có thể cho 1.000–4.000 IU ngắn hạn'],
              ['I-ốt', '150–250 mcg/ngày (viên tiền sản thường 150 mcg)', 'Kết hợp muối i-ốt khi nấu ăn; KHÔNG tự uống thêm viên i-ốt riêng', 'Bệnh tuyến giáp → hỏi bác sĩ; tránh rong biển hằng ngày (i-ốt quá cao)'],
              ['Vitamin B12', '2,6 mcg/ngày; mẹ ăn chay/chay trường PHẢI bổ sung', 'Uống hằng ngày; thực vật không có B12 tự nhiên', 'Ăn chay trường → bổ sung đều + kiểm tra máu theo lịch'],
            ],
          },
          {
            kind: 'list',
            items: [
              'Nguyên tắc chung: đọc nhãn viên tiền sản — kiểm tra hàm lượng retinol, i-ốt, sắt, choline thực tế; nhiều sản phẩm thiếu choline/i-ốt đúng hàm lượng ghi.',
              'Không uống trùng 2 viên chứa cùng vi chất (vitamin tổng hợp + viên sắt riêng + viên canxi riêng → dễ vượt UL).',
              'Tương tác chính: sắt cách xa canxi/sữa/trà/cà phê ≥2 giờ; canxi KHÔNG uống cùng giờ với sắt/kẽm liều cao.',
              '⚠️ Vitamin A/retinol: thai phụ KHÔNG ăn gan/pate gan và không dùng viên retinol liều cao (thừa retinol, nhất là T1, gây dị tật bẩm sinh). Beta-caroten từ rau củ quả là an toàn.',
              '⚠️ Không tự ý uống thêm viên i-ốt, kẽm, hoặc canxi liều cao nếu viên tiền sản đã có — tránh vượt giới hạn trên (UL).',
            ],
          },
          {
            kind: 'sources',
            sources: [
              { org: 'NIH/ODS', title: 'Folate — Health Professional', url: 'https://ods.od.nih.gov/factsheets/Folate-HealthProfessional/' },
              { org: 'NIH/ODS', title: 'Iron — Health Professional', url: 'https://ods.od.nih.gov/factsheets/Iron-HealthProfessional/' },
              { org: 'NIH/ODS', title: 'Calcium — Health Professional', url: 'https://ods.od.nih.gov/factsheets/Calcium-HealthProfessional/' },
              { org: 'NIH/ODS', title: 'Vitamin D — Health Professional', url: 'https://ods.od.nih.gov/factsheets/VitaminD-HealthProfessional/' },
              { org: 'NIH/ODS', title: 'Iodine — Health Professional', url: 'https://ods.od.nih.gov/factsheets/Iodine-HealthProfessional/' },
              { org: 'NIH/ODS', title: 'Vitamin B12 — Health Professional', url: 'https://ods.od.nih.gov/factsheets/VitaminB12-HealthProfessional/' },
              { org: 'WHO eLENA', title: 'Daily iron supplementation in pregnancy', url: 'https://www.who.int/elena/titles/daily_iron_pregnancy/en/' },
              { org: 'WHO eLENA', title: 'Calcium supplementation during pregnancy', url: 'https://www.who.int/elena/titles/calcium_pregnancy/en/' },
              { org: 'ATA', title: 'Iodine Supplementation for Pregnancy and Lactation', url: 'https://www.thyroid.org/iodine-supplementation-pregnancy-lactation/' },
            ],
          },
        ],
      },

      // =====================================================================
      // 5. MẸO THEO TÌNH TRẠNG
      // =====================================================================
      {
        heading: 'Mẹo theo tình trạng',
        blocks: [
          {
            kind: 'p',
            text: '1) Ốm nghén (hay gặp nhất T1) — buồn nôn, nôn nhẹ là bình thường; đa số tự giảm sau tuần 12–14.',
          },
          {
            kind: 'list',
            items: [
              'Ăn LẠT, chia thành 6–7 bữa nhỏ trong ngày thay vì 3 bữa to; đừng để bụng quá đói.',
              'Ưu tiên carb phức hợp dễ tiêu: cháo, bánh mì, khoai luộc, cơm trắng; tránh món dầu mỡ, cay, nặng mùi.',
              'Gừng (trà gừng, món kho gừng) và vitamin B6 10–25 mg/lần ×3/ngày có thể giúp giảm buồn nôn — dùng B6 theo hướng dẫn bác sĩ.',
              'Thức dậy: ngồi dậy từ từ, ăn vài miếng bánh mì/bánh quy nhạt trước khi rời giường.',
              'Nếu nôn quá nhiều, không ăn uống được, sụt cân hoặc có dấu hiệu mất nước → đi khám sớm.',
            ],
          },
          {
            kind: 'p',
            text: '2) Táo bón (tăng dần về T3, viên sắt có thể làm nặng thêm) — progesterone giãn nhu động ruột + tử cung chèn ép.',
          },
          {
            kind: 'list',
            items: [
              'Chất xơ ~28 g/ngày: rau mỗi bữa, gạo lứt, khoai lang, đu đủ chín, ổi, đậu đỗ.',
              'Uống đủ nước ~2–2,3 L/ngày; tăng chất xơ TỪ TỪ kèm nước để tránh đầy hơi.',
              'Vận động nhẹ đều đặn (đi bộ) giúp nhu động ruột.',
              'Nếu do viên sắt: hỏi bác sĩ đổi dạng sắt fumarate hoặc giảm liều, chia nhỏ — không tự ý bỏ thuốc.',
            ],
          },
          {
            kind: 'p',
            text: '3) Ợ nóng / trào ngược (rất phổ biến T2–T3) — hormone giãn cơ thắt thực quản + tử cung chèn ép dạ dày.',
          },
          {
            kind: 'list',
            items: [
              'Ăn ít một, chia nhiều bữa; không nằm ngay sau khi ăn (chờ ~2–3 giờ).',
              'Tránh món cay, nhiều dầu mỡ, nước ngọt có ga, cà phê/trà đậm buổi tối.',
              'Kê cao đầu khi ngủ; ngủ nghiêng trái giúp giảm trào ngược.',
              'Thuốc kháng axit an toàn khi mang thai — hỏi dược sĩ/bác sĩ chọn loại phù hợp.',
            ],
          },
          {
            kind: 'p',
            text: '4) Thiếu máu thiếu sắt (phổ biến ở VN) — máu mẹ tăng ~50%, nhu cầu sắt tăng mạnh từ T2.',
          },
          {
            kind: 'list',
            items: [
              'Ăn thực phẩm giàu sắt heme (thịt bò nạc, cá, huyết lợn luộc vừa phải, sò/nghêu chín) + sắt thực vật (rau ngót, rau muống, đậu đen).',
              'Kết hợp vitamin C (chanh, ổi, cam) trong cùng bữa để tăng hấp thu sắt; TRÁNH uống trà/cà phê ngay sát bữa ăn.',
              'Viên sắt uống cách xa sữa/trà/cà phê ≥2 giờ.',
              'Xét nghiệm máu theo lịch khám thai; KHÔNG tự uống liều cao sắt (60–120 mg) khi chưa có chỉ định.',
            ],
          },
          {
            kind: 'sources',
            sources: [
              { org: 'ACOG', title: 'Nausea and Vomiting of Pregnancy (Practice Bulletin No. 189)', url: 'https://www.acog.org/clinical/clinical-guidance/practice-bulletin/articles/2018/01/nausea-and-vomiting-of-pregnancy' },
              { org: 'NHS', title: 'Indigestion and heartburn in pregnancy', url: 'https://www.nhs.uk/pregnancy/common-symptoms/indigestion-and-heartburn/' },
              { org: 'NHS', title: 'Have a healthy diet in pregnancy', url: 'https://www.nhs.uk/pregnancy/keeping-well/have-a-healthy-diet/' },
              { org: 'NIH/ODS', title: 'Iron — Health Professional', url: 'https://ods.od.nih.gov/factsheets/Iron-HealthProfessional/' },
              { org: 'WHO eLENA', title: 'Daily iron supplementation in pregnancy', url: 'https://www.who.int/elena/titles/daily_iron_pregnancy/en/' },
            ],
          },
        ],
      },

      // =====================================================================
      // 6. FAQ
      // =====================================================================
      {
        heading: 'Hỏi & đáp nhanh',
        blocks: [
          {
            kind: 'table',
            headers: ['Câu hỏi', 'Trả lời ngắn'],
            rows: [
              [
                'Bầu ăn được hải sản không?',
                'CÓ — ăn 2–3 phần cá ít thủy ngân/tuần (~100 g/phần): cá hồi, cá mòi, cá cơm, cá trích, tôm. TRÁNH cá thủy ngân cao: cá mập, cá kiếm, cá thu vua, cá ngừ mắt to. Hải sản phải nấu chín.',
              ],
              [
                'Uống cà phê được không?',
                'Được nhưng giới hạn ≤200 mg caffeine/ngày (≈2 ly cà phê hòa tan hoặc 2–3 ly trà). Tránh nước tăng lực; tốt nhất hạn chế caffeine từ chiều/tối để dễ ngủ.',
              ],
              [
                'Bầu cần uống viên sắt không? Bị táo bón vì sắt phải làm sao?',
                'VN thuộc vùng tỷ lệ thiếu máu cao → WHO khuyến nghị bổ sung sắt phổ cập 30–60 mg/ngày. Nếu táo bón: uống cách xa sữa/trà/cà phê, chia nhỏ liều, tăng chất xơ + nước, và hỏi bác sĩ đổi dạng sắt nếu kéo dài.',
              ],
              [
                'Ăn gan bổ máu được không?',
                'KHÔNG NÊN khi mang thai: gan giàu vitamin A (retinol) — thừa retinol, nhất là T1, gây dị tật bẩm sinh. Để bổ máu an toàn hãy ăn thịt bò nạc, huyết lợn luộc (vừa phải), sò/nghêu chín, rau ngót + vitamin C.',
              ],
              [
                'Bầu ăn trứng sống/trứng chần được không?',
                'KHÔNG — trứng phải nấu chín kỹ (lòng đỏ chín) để tránh nhiễm khuẩn salmonella. Nên ăn cả lòng đỏ vì choline (~147 mg/quả) rất cần cho não thai.',
              ],
            ],
          },
          {
            kind: 'sources',
            sources: [
              { org: 'FDA/EPA', title: 'Advice About Eating Fish', url: 'https://www.fda.gov/food/consumers/advice-about-eating-fish' },
              { org: 'ACOG', title: 'Moderate Caffeine Consumption During Pregnancy', url: 'https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2010/08/moderate-caffeine-consumption-during-pregnancy' },
              { org: 'NHS', title: 'Foods to avoid in pregnancy', url: 'https://www.nhs.uk/pregnancy/keeping-well/foods-to-avoid/' },
              { org: 'WHO eLENA', title: 'Daily iron supplementation in pregnancy', url: 'https://www.who.int/elena/titles/daily_iron_pregnancy/en/' },
              { org: 'NIH/ODS', title: 'Vitamin A and Carotenoids — Health Professional', url: 'https://ods.od.nih.gov/factsheets/VitaminA-HealthProfessional/' },
              { org: 'NIH/ODS', title: 'Choline — Health Professional', url: 'https://ods.od.nih.gov/factsheets/Choline-HealthProfessional/' },
            ],
          },
        ],
      },
    ],
  },
]
