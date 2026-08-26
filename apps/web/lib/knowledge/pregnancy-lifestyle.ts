// ===========================================================================
// pregnancy-lifestyle.ts — Kiến thức VẬN ĐỘNG & GIẤC NGỦ THAI KỲ (Phase 6, Agent C1).
// Nguồn: orchestration/docs/lifestyle-exercise-sleep.md (đã soạn sẵn — chỉ chuyển,
// không thêm/bịa nội dung). Chuẩn y khoa: ACOG · WHO · CDC/ODPHP · NHS · Tommy's ·
// Cleveland Clinic · Mayo Clinic · ATS · NIH/PMC.
// Đây là dữ liệu giáo dục sức khỏe, KHÔNG thay thế tư vấn y khoa.
// Type theo hợp đồng chung: lib/knowledge/types.ts (agent Shell).
// ===========================================================================

import type { KnowledgeTopic } from './types'

export const topics: KnowledgeTopic[] = [
  // =========================================================================
  // CHỦ ĐỀ 1 — VẬN ĐỘNG & TẬP LUYỆN THAI KỲ
  // =========================================================================
  {
    slug: 'van-dong-thai-ky',
    title: 'Vận động & tập luyện thai kỳ',
    emoji: '🏃',
    phases: ['pregnancy'],
    ageRange: 'Thai kỳ · T1–T3',
    summary:
      'Thai phụ không có chống chỉ định nên vận động ≥150 phút/tuần cường độ vừa (talk test). Tập đúng môn giúp mẹ giảm tiểu đường thai kỳ, tiền sản giật, đau lưng và hỗ trợ sinh thường — nhưng có dấu hiệu nguy hiểm thì dừng ngay.',
    sections: [
      {
        heading: 'Lợi ích & an toàn chung',
        blocks: [
          {
            kind: 'warn',
            text: 'Đây là tài liệu giáo dục sức khỏe, không thay thế tư vấn y khoa. Trước khi bắt đầu hoặc tiếp tục bất kỳ chương trình tập luyện nào, hãy hỏi bác sĩ sản khoa.',
          },
          {
            kind: 'p',
            text: 'Khuyến nghị chuẩn: thai phụ KHÔNG có chống chỉ định nên vận động ≥150 phút/tuần, cường độ vừa (≈30 phút/ngày × 5 ngày, hoặc chia nhỏ nhiều lần 10 phút). Cả ACOG, WHO (2020) và CDC/ODPHP đều đồng thuận con số này.',
          },
          {
            kind: 'p',
            text: 'Cường độ vừa = nhịp tim tăng lên, bắt đầu toát mồ hôi nhẹ, nói chuyện được nhưng không hát được (talk test).',
          },
          {
            kind: 'p',
            text: 'Người mới bắt đầu: khởi động từ 5 phút/ngày, mỗi tuần tăng 5 phút đến khi đạt 30 phút/ngày. Người đã quen vận động trước thai kỳ: có thể duy trì bài cũ nếu bác sĩ đồng ý. Không có chống chỉ định thì vận động khi mang thai an toàn và có lợi.',
          },
          {
            kind: 'list',
            items: [
              'Lợi ích cho MẸ: giảm nguy cơ tiểu đường thai kỳ, tăng cân quá mức, rối loạn tăng huyết áp thai kỳ / tiền sản giật.',
              'Giảm đau lưng/khớp, tăng thể lực tim-phổi, giảm triệu chứng trầm cảm sau sinh.',
              'Hỗ trợ chuẩn bị sinh: giảm tỷ lệ mổ lấy thai và sinh có hỗ trợ dụng cụ, hồi phục sau sinh tốt hơn.',
              'Lợi ích cho BÉ: giảm nguy cơ thai to (macrosomia), nhẹ cân; giảm biến chứng thai kỳ nói chung.',
            ],
          },
          {
            kind: 'sources',
            sources: [
              { org: 'ACOG', title: 'Exercise During Pregnancy', url: 'https://www.acog.org/womens-health/faqs/exercise-during-pregnancy' },
              { org: 'WHO', title: 'WHO guidelines on physical activity and sedentary behaviour (2020)', url: 'https://www.who.int/publications/i/item/9789240015128' },
              { org: 'ODPHP/CDC', title: 'Stay Active During Pregnancy: Quick Tips', url: 'https://odphp.health.gov/myhealthfinder/pregnancy/nutrition-and-physical-activity/stay-active-during-pregnancy-quick-tips' },
              { org: 'ACOG', title: 'Physical Activity and Exercise During Pregnancy and the Postpartum Period (Committee Opinion 804)', url: 'https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2020/04/physical-activity-and-exercise-during-pregnancy-and-the-postpartum-period' },
            ],
          },
        ],
      },
      {
        heading: 'Môn phù hợp theo tam cá nguyệt + môn cần tránh',
        blocks: [
          {
            kind: 'table',
            headers: ['Loại', 'Ví dụ', 'Ghi chú theo giai đoạn'],
            rows: [
              ['Đi bộ nhanh', 'Đi bộ, đi bộ trên địa hình bằng phẳng', 'An toàn mọi tam cá nguyệt; dễ nhất, rẻ nhất'],
              ['Bơi / thể dục dưới nước', 'Bơi, aqua-natal, aerobics dưới nước', 'Nước nâng đỡ trọng lượng cơ thể; rất phù hợp T2–T3'],
              ['Đạp xe tại chỗ', 'Xe đạp cố định (stationary bike)', 'An toàn; tránh đạp xe ngoài đường khi bụng to (ngã/va)'],
              ['Yoga/Pilates thai kỳ', 'Yoga tiền sản, Pilates tiền sản', 'Tránh tư thế xoắn sâu, ngửa sâu, động tác nằm sấp, nhiệt độ cao'],
              ['Aerobics cường độ thấp', 'Lớp aerobics thấp, nhảy múa nhẹ', 'Chọn lớp dành riêng cho thai phụ'],
              ['Chạy bộ', 'Chạy chậm', 'Chỉ nếu đã chạy đều trước thai kỳ; không bắt đầu môn mới'],
              ['Tập kháng lực nhẹ', 'Squat, lunge, bài tay với tạ nhẹ/không tạ', 'Tập cơ sàn chậu (Kegel) hằng ngày'],
              ['Cơ sàn chậu', 'Kegel', 'Giảm nguy cơ tiểu không tự chủ'],
            ],
          },
          {
            kind: 'list',
            items: [
              'Môn cần TRÁNH (mọi tam cá nguyệt): môn chạm/đối kháng — nguy cơ va đập bụng: bóng đá, rugby, võ thuật (judô, kickboxing…), quyền Anh.',
              'Môn dễ té ngã / mất thăng bằng: cưỡi ngựa, trượt tuyết dốc, thể dục dụng cụ, trượt băng.',
              'Lặn biển (scuba diving) — thai nhi không có bảo vệ chống bệnh giảm áp (decompression sickness) và tắc mạch khí.',
              'Tập ở độ cao lớn — trên 2.500 m so với mực nước biển (nguy cơ say độ cao cho cả mẹ và thai).',
              'Hot yoga / hot Pilates và các lớp tập làm quá nóng cơ thể (hyperthermia nguy hiểm, nhất là T1).',
              'Nằm ngửa kéo dài khi tập sau T1 (sau ~tuần 16–20) — tử cung chèn tĩnh mạch chủ dưới gây chóng mặt, giảm máu về thai. Tránh gập bụng (sit-up) từ sau tuần 16.',
            ],
          },
          {
            kind: 'p',
            text: 'Điều chỉnh theo giai đoạn: T1 (tuần 1–13) — mệt mỏi/ốm nghén thường gặp, vận động nhẹ nhàng, chia nhỏ; tránh quá nóng, tránh môn chấn thương/ngã; người đã tập nặng có thể duy trì cường độ cũ. T2 (tuần 14–26) — thường là giai đoạn dồi dào năng lượng nhất, tăng dần, chú ý thăng bằng (bụng lớn lên), không nằm ngửa khi tập sau tuần 16–20. T3 (tuần 27–40) — giảm cường độ, ưu tiên thoải mái, hít thở, giãn cơ, chuẩn bị sinh; tránh nhảy và môn dễ ngã; có thể duy trì tập đến sát ngày sinh nếu không có dấu hiệu bất thường.',
          },
          {
            kind: 'sources',
            sources: [
              { org: 'NHS', title: 'Exercise in pregnancy', url: 'https://www.nhs.uk/pregnancy/keeping-well/exercise/' },
              { org: 'WHO', title: 'WHO guidelines on physical activity and sedentary behaviour (2020)', url: 'https://www.who.int/publications/i/item/9789240015128' },
              { org: 'ACOG', title: 'Exercise During Pregnancy', url: 'https://www.acog.org/womens-health/faqs/exercise-during-pregnancy' },
              { org: 'ODPHP/CDC', title: 'Stay Active During Pregnancy: Quick Tips', url: 'https://odphp.health.gov/myhealthfinder/pregnancy/nutrition-and-physical-activity/stay-active-during-pregnancy-quick-tips' },
              { org: 'NHS', title: 'Exercising in pregnancy (Best Start in Life)', url: 'https://www.nhs.uk/best-start-in-life/pregnancy/exercising-in-pregnancy/' },
              { org: 'ACOG', title: 'Physical Activity and Exercise During Pregnancy and the Postpartum Period (Committee Opinion 804)', url: 'https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2020/04/physical-activity-and-exercise-during-pregnancy-and-the-postpartum-period' },
            ],
          },
        ],
      },
      {
        heading: 'Cường độ, talk test, khởi động & hạ nhiệt',
        blocks: [
          {
            kind: 'p',
            text: 'Talk test: trong lúc tập phải nói chuyện trọn câu được nhưng không hát được. Nếu hụt hơi không nói được → đang gắng sức quá → giảm cường độ. Mức gắng sức chủ quan: khoảng 60–70% mức tối đa ("hơi mệt nhưng vẫn thoải mái"). ACOG không còn khuyến nghị theo một con số nhịp tim cố định; dùng talk test + cảm nhận cơ thể là chuẩn. Không tập đến kiệt sức.',
          },
          {
            kind: 'list',
            items: [
              'Khởi động (warm-up): 5–10 phút trước mỗi buổi — đi bộ chậm, duỗi cơ nhẹ, hít thở; giúp cơ/khớp sẵn sàng, giảm chấn thương.',
              'Hạ nhiệt (cool-down): 5–10 phút cuối buổi — đi lại nhẹ, duỗi cơ chậm, thư giãn (yoga tư thế nghỉ ở nghiêng/kê cao sau T1); tránh dừng đột ngột.',
              'Uống đủ nước trước/trong/sau khi tập; tránh tập lúc trời quá nóng ẩm.',
              'Mặc thoáng mát; ngừng ngay nếu thấy quá nóng, chóng mặt.',
              'Cơ khớp dễ giãn hơn khi mang thai (hormone relaxin) → tránh kéo giãn quá mức (tập "đủ, không tối đa").',
            ],
          },
          {
            kind: 'sources',
            sources: [
              { org: 'ACOG', title: 'Exercise During Pregnancy', url: 'https://www.acog.org/womens-health/faqs/exercise-during-pregnancy' },
              { org: 'NHS', title: 'Exercise in pregnancy', url: 'https://www.nhs.uk/pregnancy/keeping-well/exercise/' },
              { org: 'WHO', title: 'WHO guidelines on physical activity and sedentary behaviour (2020)', url: 'https://www.who.int/publications/i/item/9789240015128' },
            ],
          },
        ],
      },
      {
        heading: 'Dấu hiệu dừng tập ngay',
        blocks: [
          {
            kind: 'warn',
            text: 'DẤU HIỆU DỪNG TẬP NGAY — Ngừng tập NGAY LẬP TỨC và gọi/đi khám nếu gặp bất kỳ dấu hiệu nào sau (theo ACOG):',
          },
          {
            kind: 'table',
            headers: ['Nhóm', 'Dấu hiệu'],
            rows: [
              ['Tuần hoàn/hô hấp', 'Chóng mặt, choáng, khó thở tăng lên, đau ngực, nhịp tim nhanh/loạn nhịp'],
              ['Bụng/tử cung', 'Đau bụng hoặc đau vùng chậu, cơn co tử cung (kể cả gò Braxton Hicks dày), ra máu âm đạo, rỉ/gây nước ối'],
              ['Thai nhi', 'Giảm cử động thai'],
              ['Chân', 'Đau hoặc sưng bắp chân một bên (nguy cơ huyết khối tĩnh mạch sâu — DVT), yếu cơ, khó đi lại'],
              ['Thần kinh/toàn thân', 'Đau đầu dữ dội, nhìn mờ, đột ngột sưng phù, buồn nôn nặng, mệt lả'],
            ],
          },
          {
            kind: 'p',
            text: 'Nếu triệu chứng không hết sau khi nghỉ ngơi ngắn → liên hệ bác sĩ/nữ hộ sinh ngay. Mang thai có kèm dấu hiệu bất thường → dừng hẳn việc tập cho đến khi được khám.',
          },
          {
            kind: 'sources',
            sources: [
              { org: 'ACOG', title: 'Exercise During Pregnancy', url: 'https://www.acog.org/womens-health/faqs/exercise-during-pregnancy' },
              { org: 'NHS', title: 'Exercise in pregnancy', url: 'https://www.nhs.uk/pregnancy/keeping-well/exercise/' },
              { org: 'WHO', title: 'WHO guidelines on physical activity and sedentary behaviour (2020)', url: 'https://www.who.int/publications/i/item/9789240015128' },
            ],
          },
        ],
      },
      {
        heading: 'Chống chỉ định tuyệt đối & tương đối',
        blocks: [
          {
            kind: 'list',
            items: [
              'CHỐNG CHỈ ĐỊNH TUYỆT ĐỐI (không tập aerobic trong thai kỳ) — theo ACOG:',
              'Bệnh tim nặng ảnh hưởng huyết động (hemodynamically significant heart disease).',
              'Bệnh phổi hạn chế (restrictive lung disease).',
              'Cổ tử cung yếu / đã đặt vòng cerclage.',
              'Đa thai có nguy cơ sinh non.',
              'Ra máu âm đạo dai dẳng ở T2/T3.',
              'Nhau tiền đạo sau tuần 26.',
              'Dọa sinh non / chuyển dạ trong thai kỳ hiện tại.',
              'Vỡ ối (rách màng ối).',
              'Tiền sản giật / tăng huyết áp thai kỳ.',
            ],
          },
          {
            kind: 'list',
            items: [
              'CHỐNG CHỈ ĐỊNH TƯƠNG ĐỐI (cần bác sĩ khám, chỉ định riêng từng người trước khi tập) — theo ACOG:',
              'Thiếu máu nặng.',
              'Rối loạn nhịp tim chưa đánh giá.',
              'Viêm phế quản mạn.',
              'Tiểu đường type 1 kiểm soát kém.',
              'Béo phì bệnh lý cực độ hoặc thiếu cân cực độ (BMI < 12).',
              'Tiền sử lối sống ít vận động hoàn toàn.',
              'Thai chậm tăng trưởng trong tử cung (IUGR) ở thai kỳ hiện tại.',
              'Tăng huyết áp kiểm soát kém.',
              'Hạn chế cơ xương khớp.',
              'Động kinh kiểm soát kém.',
              'Cường giáp kiểm soát kém.',
              'Hút thuốc lá nhiều.',
            ],
          },
          {
            kind: 'warn',
            text: 'Thai phụ thuộc nhóm tương đối vẫn CÓ THỂ tập với chương trình cá thể hóa sau khi được bác sĩ thông qua; nhóm tuyệt đối thì KHÔNG nên tập aerobic.',
          },
          {
            kind: 'sources',
            sources: [
              { org: 'ACOG', title: 'Physical Activity and Exercise During Pregnancy and the Postpartum Period (Committee Opinion 804)', url: 'https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2020/04/physical-activity-and-exercise-during-pregnancy-and-the-postpartum-period' },
              { org: 'ACOG', title: 'Exercise During Pregnancy', url: 'https://www.acog.org/womens-health/faqs/exercise-during-pregnancy' },
            ],
          },
        ],
      },
      {
        heading: 'Ghi chú cho mẹ Việt',
        blocks: [
          {
            kind: 'list',
            items: [
              '1. Đi bộ là lựa chọn hàng đầu — rẻ, dễ, không cần dụng cụ, an toàn mọi tam cá nguyệt; nên đi buổi sáng sớm hoặc chiều mát để tránh nắng nóng (khí hậu nóng ẩm, tránh giờ cao điểm nhiệt 10–15h).',
              '2. Yoga tại nhà: có thể tập theo lớp yoga tiền sản online; chọn video do huấn luyện viên có chứng chỉ tiền sản; không tập hot yoga, không xoắn sâu/nằm sấp/gập bụng; dùng gối/ghế/chăn làm đạo cụ hỗ trợ.',
              '3. Bơi & đi bộ dưới nước rất hợp ở T2–T3 (nước giảm áp lực cột sống, đau lưng, phù).',
              '4. Luyện sàn chậu (Kegel) mỗi ngày — hỗ trợ sinh thường, giảm tiểu không tự chủ.',
              '5. Nếu gia đình/người thân lo lắng hoặc khuyên "không nên động": giải thích dựa bằng chứng — vận động đúng mức KHÔNG gây sảy thai/sinh non ở thai kỳ bình thường, ngược lại còn giảm biến chứng; nhưng luôn hỏi bác sĩ nếu có bệnh nền hoặc biến chứng.',
              '6. Nghe theo cơ thể: mệt thì nghỉ; bù nước thường xuyên; không cố gắng "bằng được".',
            ],
          },
          {
            kind: 'sources',
            sources: [
              { org: 'NHS', title: 'Exercising in pregnancy (Best Start in Life)', url: 'https://www.nhs.uk/best-start-in-life/pregnancy/exercising-in-pregnancy/' },
              { org: 'ACOG', title: 'Exercise During Pregnancy', url: 'https://www.acog.org/womens-health/faqs/exercise-during-pregnancy' },
            ],
          },
        ],
      },
    ],
  },

  // =========================================================================
  // CHỦ ĐỀ 2 — GIẤC NGỦ THAI KỲ
  // =========================================================================
  {
    slug: 'giac-ngu-thai-ky',
    title: 'Giấc ngủ thai kỳ',
    emoji: '😴',
    phases: ['pregnancy'],
    ageRange: 'Thai kỳ · T1–T3',
    summary:
      'Thai phụ thường cần 7–9 giờ (có thể 8–10) ngủ mỗi đêm, khó ngủ tăng dần về cuối T3. Nằm nghiêng là tư thế an toàn nhất; kết hợp vệ sinh giấc ngủ và xử lý đúng từng rối loạn — gặp dấu hiệu nghiêm trọng (ngưng thở, mất ngủ kèm tuyệt vọng, đau một bên chân) thì đi khám sớm.',
    sections: [
      {
        heading: 'Nhu cầu giấc ngủ & thay đổi theo giai đoạn',
        blocks: [
          {
            kind: 'warn',
            text: 'Đây là tài liệu giáo dục sức khỏe, không thay thế tư vấn y khoa. Trước khi dùng bất kỳ thuốc/thảo dược/bổ sung nào (kể cả thuốc ngủ, thuốc kháng axit, magie), hãy hỏi bác sĩ sản khoa.',
          },
          {
            kind: 'p',
            text: 'Người trưởng thành nói chung cần 7–9 giờ/đêm; khi mang thai thường cần nhiều hơn (Cleveland Clinic khuyến nghị 8–10 giờ). Hãy "nghe cơ thể", ngủ thêm giấc ngắn ban ngày nếu cần.',
          },
          {
            kind: 'p',
            text: 'Thiếu ngủ có hậu quả thực tế: nghiên cứu đoàn hệ 5.418 thai phụ (2025) cho thấy ngủ ≤7 giờ/đêm ở T2 làm tăng 43% nguy cơ sinh non so với ngủ nhiều hơn; ngủ <6 giờ liên quan tỷ lệ mổ lấy thai cao hơn. Thiếu ngủ kéo dài cũng liên quan tiểu đường thai kỳ, rối loạn tăng huyết áp, trầm cảm.',
          },
          {
            kind: 'table',
            headers: ['Giai đoạn', 'Nhu cầu & tình trạng'],
            rows: [
              ['T1 (tuần 1–13)', 'Rất buồn ngủ (tăng estrogen/progesterone); có thể cần 7–10 giờ; ~25% thai phụ bị mất ngủ ở giai đoạn này'],
              ['T2 (tuần 14–26)', 'Năng lượng tốt hơn, giấc ngủ trở lại gần bình thường (~7–8 giờ); thường là tam cá nguyệt ngủ ngon nhất'],
              ['T3 (tuần 27–40)', 'Rối loạn giấc ngủ tăng nhiều: tiểu đêm, đau lưng, chuột rút, ợ nóng, thai máy, lo lắng chuyển dạ; tới ~80% thai phụ báo mất ngủ vào cuối T3; khuyến nghị 7–10 giờ (kể cả ngủ ngắn)'],
            ],
          },
          {
            kind: 'sources',
            sources: [
              { org: 'Cleveland Clinic', title: 'Pregnancy Insomnia', url: 'https://my.clevelandclinic.org/health/diseases/pregnancy-insomnia' },
              { org: 'NIH/PMC', title: 'Association between sleep during pregnancy and birth outcomes: a prospective cohort study (2025)', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11792202/' },
            ],
          },
        ],
      },
      {
        heading: 'Tư thế ngủ an toàn',
        blocks: [
          {
            kind: 'list',
            items: [
              'Nằm nghiêng là tư thế tốt nhất, đặc biệt từ T2–T3. ACOG: trong T2–T3 ngủ nghiêng về bên nào cũng được (trái hoặc phải đều ổn).',
              'NHS/Tommy\'s khuyên từ tuần 28 nên BẮT ĐẦU giấc ngủ ở tư thế nằm nghiêng (cả ngủ đêm lẫn ngủ trưa) — vì nằm ngửa khi ngủ sau tuần 28 có liên quan tăng ~2,6 lần nguy cơ thai lưu so với nằm nghiêng (tổng hợp 6 nghiên cứu; đây là dữ liệu quan sát — "liên quan", không phải nguyên nhân trực tiếp).',
              'Tránh nằm ngửa kéo dài sau tuần ~20 (một số nguồn nói sau tuần 16 khi tập): tử cung lớn chèn tĩnh mạch chủ dưới và động mạch chủ → giảm máu về tử cung/thai, gây chóng mặt, khó thở.',
              'Nghiêng trái có lợi về lý thuyết (tăng tưới máu nhau thai/thận), nhưng bằng chứng hiện chưa chứng minh nghiêng trái tốt hơn nghiêng phải — bên nào cũng chấp nhận; quan trọng là nằm nghiêng, không nằm ngửa.',
              'Thức dậy thấy đang nằm ngửa: KHÔNG phải khẩn cấp — nhẹ nhàng trở lại nằm nghiêng và ngủ tiếp. Mục tiêu là bắt đầu mỗi giấc ngủ ở tư thế nghiêng.',
              'T1: nằm tư thế nào cũng được (kể cả nằm sấp/ngửa) vì tử cung còn nhỏ.',
            ],
          },
          {
            kind: 'p',
            text: 'Hỗ trợ bằng gối: gối kẹp giữa hai đầu gối + gối kê dưới bụng + gối chêm sau lưng (chống lật ngửa). Gối chêm / gối ôm bà bầu (pregnancy pillow) giúp giữ tư thế nghiêng thoải mái suốt đêm. Kê cao đầu khi bị trào ngược.',
          },
          {
            kind: 'warn',
            text: 'Ghi chú khác biệt tổ chức: ACOG nói chung "nằm nghiêng bên nào cũng tốt"; NHS/Tommy\'s cụ thể hơn — "bắt đầu ngủ nghiêng từ tuần 28" do dữ liệu nguy cơ thai lưu khi nằm ngửa. Nên dùng chuẩn NHS/Tommy\'s (cụ thể hơn, cùng chiều với ACOG) và thêm lời trấn an "dậy ở tư thế ngửa không sao".',
          },
          {
            kind: 'sources',
            sources: [
              { org: 'ACOG', title: 'Exercise During Pregnancy (tư thế ngủ trong mục lưu ý)', url: 'https://www.acog.org/womens-health/faqs/exercise-during-pregnancy' },
              { org: "Tommy's", title: 'Sleep position in pregnancy Q&A', url: 'https://www.tommys.org/pregnancy-information/im-pregnant/sleep-side/sleep-position-pregnancy-qa' },
              { org: 'NHS', title: 'Foods to avoid / keeping well (nền tảng khuyến nghị giấc ngủ thai kỳ)', url: 'https://www.nhs.uk/pregnancy/keeping-well/' },
            ],
          },
        ],
      },
      {
        heading: 'Rối loạn giấc ngủ thường gặp + cách xử lý',
        blocks: [
          {
            kind: 'p',
            text: '1) Mất ngủ (insomnia) — nguyên nhân: thay đổi hormone, tiểu đêm, đau lưng, ợ nóng, lo âu, tư thế khó chịu; ~25% ở T1, lên tới ~80% cuối T3.',
          },
          {
            kind: 'list',
            items: [
              'Cách xử: vệ sinh giấc ngủ (mục "Vệ sinh giấc ngủ"), tư thế nghiêng + gối kê, giảm uống nước buổi tối, thư giãn trước ngủ. Thuốc ngủ: không tự ý dùng; hỏi bác sĩ nếu mất ngủ kéo dài ảnh hưởng sức khỏe.',
              'Dấu hiệu cần hỗ trợ: mất ngủ kéo dài, kèm cảm giác tuyệt vọng/buồn bã dai dẳng → có thể liên quan trầm cảm → cần nói với bác sĩ (có điều trị an toàn).',
            ],
          },
          {
            kind: 'p',
            text: '2) Trào ngược / ợ nóng về đêm — rất phổ biến do hormone + tử cung chèn ép dạ dày; nằm thẳng làm axit trào lên thực quản.',
          },
          {
            kind: 'list',
            items: [
              'Kê cao đầu và vai khi ngủ (gối cao hoặc nâng đầu giường 10–15 cm) để axit không trào lên.',
              'Ngủ nghiêng trái giúp giảm trào ngược.',
              'Không ăn trong vòng ~3 giờ trước khi ngủ; ăn ít, chia nhiều bữa.',
              'Tránh thức ăn cay, nhiều dầu mỡ, cà phê/trà, nước ngọt có ga buổi tối.',
              'Ngồi thẳng khi ăn và sau ăn một lúc.',
              'Thuốc kháng axit/alginate an toàn khi mang thai (hỏi dược sĩ/bác sĩ chọn loại phù hợp).',
            ],
          },
          {
            kind: 'p',
            text: '3) Chuột rút chân ban đêm — ~½ thai phụ bị chuột rút bắp chân, thường T2–T3 về đêm; liên quan thay đổi tuần hoàn, thiếu hụt điện giải (magie/calci), mất nước, mỏi cơ.',
          },
          {
            kind: 'list',
            items: [
              'Phòng: kéo giãn bắp chân trước khi ngủ (đứng cách tường một cánh tay, hai tay chống tường, một chân ra sau gót chạm đất, gập gối trước; giữ ~30 giây, đổi chân).',
              'Uống đủ nước; đủ calci (~1.000 mg/ngày) theo khuyến nghị dinh dưỡng; đi giày hỗ trợ tốt; tránh đứng/ngồi lâu một chỗ.',
              'Khi bị chuột rút: duỗi thẳng chân, kéo các ngón chân về phía ống quyển (flex, KHÔNG bẻ mũi chân ra trước — sẽ nặng hơn); xoa bóp bắp chân, chườm ấm, đi lại nhẹ, kê cao chân.',
              'Magie: bằng chứng chưa thống nhất — Mayo Clinic: bổ sung magie có thể giúp nhưng kết quả nghiên cứu trái chiều → hỏi bác sĩ trước khi dùng; ưu tiên ăn thực phẩm giàu magie (hạt, đậu, ngũ cốc nguyên hạt, rau xanh).',
              'Khi nào cần khám: chuột rút nặng, kéo dài, kèm sưng/đỏ/nóng/đau một bên chân → có thể là huyết khối tĩnh mạch sâu → khám ngay.',
            ],
          },
          {
            kind: 'p',
            text: '4) Hội chứng chân không yên (Restless Legs Syndrome — RLS) — ~1/5 thai phụ, phổ biến nhất ở T3 (từ ~tuần 27). Cảm giác khó chịu, bồn chồn muốn cử động chân, nặng về chiều/tối, làm mất ngủ. Nguyên nhân có thể: thay đổi hormone, thiếu sắt/thiếu folate, thay đổi tuần hoàn, mệt mỏi.',
          },
          {
            kind: 'list',
            items: [
              'Cách xử (không dùng thuốc): ngủ đều giờ, vệ sinh giấc ngủ tốt.',
              'Tránh caffeine, rượu, thuốc lá (nhất là buổi tối).',
              'Vận động vừa phải ban ngày (đi bộ, bơi, yoga tiền sản) nhưng không tập gắng sức sát giờ ngủ.',
              'Duỗi chân, massage chân, chườm ấm / tắm nước ấm, thư giãn.',
              'Nếu nghi do thiếu sắt: bác sĩ có thể xét nghiệm ferritin và kê bổ sung sắt (mục tiêu ferritin > 50–75 µg/L).',
              'Thuốc điều trị RLS thường KHÔNG được khuyến cáo trong thai kỳ (NHS) — chỉ khi nặng, bác sĩ cân nhắc.',
              'Tiên lượng: RLS liên quan thai kỳ thường tự hết sau sinh trong ~4 tuần; nhưng người từng bị có nguy cơ tái phát về sau.',
            ],
          },
          {
            kind: 'p',
            text: '5) Ngáy / ngưng thở khi ngủ (OSA) — nguy cơ ngưng thở tăng khi mang thai (thay đổi hormone, tăng cân, phù nề đường thở); ~lên tới 15% thai phụ phát triển OSA ở T2–T3.',
          },
          {
            kind: 'list',
            items: [
              'Dấu hiệu CẦN gặp bác sĩ: ngáy to, mới xuất hiện hoặc tăng rõ (gần như mỗi đêm).',
              'Ngáy kèm nghẹt thở, hụt hơi, thở ngắt quãng (người thân nghe thấy), thức dậy giật mình vì nghẹt thở.',
              'Buồn ngủ ban ngày quá mức (ngủ gật khi đọc/xem TV/làm việc), đau đầu buổi sáng, khô miệng.',
              'Kèm huyết áp cao.',
              'Vì sao quan trọng: ngưng thở không điều trị liên quan tiền sản giật, tiểu đường thai kỳ, thai chậm tăng trưởng, sinh non, tăng tỷ lệ mổ lấy thai.',
              'Hướng xử lý: bác sĩ đánh giá, có thể chỉ định đo đa ký giấc ngủ; điều trị gồm CPAP, dụng cụ miệng, ngủ nghiêng, kê cao đầu, giảm nghẹt mũi (xịt muối), kiểm soát cân nặng.',
            ],
          },
          {
            kind: 'sources',
            sources: [
              { org: 'Cleveland Clinic', title: 'Pregnancy Insomnia', url: 'https://my.clevelandclinic.org/health/diseases/pregnancy-insomnia' },
              { org: 'NHS', title: 'Indigestion and heartburn in pregnancy', url: 'https://www.nhs.uk/pregnancy/common-symptoms/indigestion-and-heartburn/' },
              { org: 'Mayo Clinic', title: 'Leg cramps during pregnancy: Preventable?', url: 'https://www.mayoclinic.org/healthy-lifestyle/pregnancy-week-by-week/expert-answers/leg-cramps-during-pregnancy/faq-20057766' },
              { org: 'NHS', title: 'Exercise in pregnancy (kết hợp giãn cơ)', url: 'https://www.nhs.uk/pregnancy/keeping-well/exercise/' },
              { org: 'NHS', title: 'Restless legs syndrome', url: 'https://www.nhs.uk/conditions/restless-legs-syndrome/' },
              { org: "Tommy's", title: 'Restless legs syndrome during pregnancy', url: 'https://www.tommys.org/pregnancy-information/im-pregnant/restless-legs-syndrome' },
              { org: 'American Thoracic Society (ATS)', title: 'Sleep and Pregnancy (tài liệu bệnh nhân)', url: 'https://www.thoracic.org/patients/patient-resources/resources/sleep-and-pregnancy-pt2.pdf' },
              { org: "Tommy's", title: 'Sleep position in pregnancy Q&A', url: 'https://www.tommys.org/pregnancy-information/im-pregnant/sleep-side/sleep-position-pregnancy-qa' },
            ],
          },
        ],
      },
      {
        heading: 'Vệ sinh giấc ngủ + caffeine / ăn uống trước khi ngủ',
        blocks: [
          {
            kind: 'list',
            items: [
              'VỆ SINH GIẤC NGỦ — Giờ ngủ cố định: đi ngủ và thức dậy đều giờ mỗi ngày (sai lệch trong ~1 giờ).',
              'Tối giản màn hình: tránh điện thoại/máy tính bảng/TV ~1 giờ trước khi ngủ (ánh sáng xanh giảm melatonin, kích thích tỉnh táo).',
              'Thư giãn trước ngủ: đọc sách, tắm nước ấm, viết nhật ký, hít thở sâu/thiền, yoga tiền sản nhẹ — tránh căng thẳng, lên danh sách việc ngày mai để khỏi lo.',
              'Vận động đều đặn ban ngày nhưng tránh tập gắng sức sát giờ ngủ.',
              'Ngủ trưa ngắn (≤1 giờ) nếu cần; nếu nằm mãi >20 phút không ngủ được → dậy làm việc nhẹ nhàng rồi quay lại ngủ khi buồn ngủ.',
              'Nếu thiếu ngủ kéo dài ảnh hưởng tâm trạng: chia sẻ với gia đình/bạn và nói với bác sĩ.',
              'CAFFEINE & ĂN UỐNG TRƯỚC NGỦ — Caffeine ≤200 mg/ngày khi mang thai (NHS/ACOG); tốt nhất tránh hẳn caffeine buổi chiều/tối (cà phê, trà, cola, nước tăng lực, sô-cô-la) — cà phê hòa tan ~100 mg/ly, trà ~40–50 mg/ly.',
              'Không ăn no / không ăn cay, nhiều dầu mỡ trong ~3 giờ trước khi ngủ (tránh ợ nóng).',
              'Uống đủ nước ban ngày, giảm uống buổi tối để hạn chế tiểu đêm.',
              'Nếu buồn nôn: ăn vài miếng bánh mì/bánh quy nhạt trước ngủ có thể giúp.',
            ],
          },
          {
            kind: 'sources',
            sources: [
              { org: 'NHS', title: 'Foods to avoid in pregnancy (caffeine)', url: 'https://www.nhs.uk/pregnancy/keeping-well/foods-to-avoid/' },
              { org: 'ACOG', title: 'Moderate Caffeine Consumption During Pregnancy', url: 'https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2010/08/moderate-caffeine-consumption-during-pregnancy' },
              { org: 'NHS', title: 'Indigestion and heartburn in pregnancy', url: 'https://www.nhs.uk/pregnancy/common-symptoms/indigestion-and-heartburn/' },
            ],
          },
        ],
      },
      {
        heading: 'Dấu hiệu nghiêm trọng cần đi khám',
        blocks: [
          {
            kind: 'warn',
            text: 'Đến gặp bác sĩ/nữ hộ sinh SỚM nếu có bất kỳ dấu hiệu nào sau:',
          },
          {
            kind: 'list',
            items: [
              '1. Ngáy to + ngủ ngắt + buồn ngủ ban ngày quá mức (nghi ngưng thở khi ngủ) — đặc biệt nếu kèm huyết áp cao.',
              '2. Ngưng thở / nghẹt thở khi ngủ do người thân ghi nhận.',
              '3. Chuột rút/sưng/đỏ/nóng đau một bên bắp chân (nghi huyết khối tĩnh mạch sâu).',
              '4. Hội chứng chân không yên nặng ảnh hưởng sinh hoạt → cần xét nghiệm sắt/ferritin, folate.',
              '5. Mất ngủ kéo dài kèm buồn chán/tuyệt vọng (nghi trầm cảm thai kỳ).',
              '6. Trào ngược nặng không đỡ với thay đổi lối sống, khó nuốt, đau bụng, sụt cân.',
              '7. Kèm các dấu hiệu sản khoa cấp: ra máu, đau bụng, giảm thai máy, rỉ nước ối.',
            ],
          },
          {
            kind: 'sources',
            sources: [
              { org: 'American Thoracic Society (ATS)', title: 'Sleep and Pregnancy', url: 'https://www.thoracic.org/patients/patient-resources/resources/sleep-and-pregnancy-pt2.pdf' },
              { org: 'Cleveland Clinic', title: 'Pregnancy Insomnia', url: 'https://my.clevelandclinic.org/health/diseases/pregnancy-insomnia' },
              { org: 'NHS', title: 'Indigestion and heartburn in pregnancy', url: 'https://www.nhs.uk/pregnancy/common-symptoms/indigestion-and-heartburn/' },
              { org: 'Mayo Clinic', title: 'Leg cramps during pregnancy', url: 'https://www.mayoclinic.org/healthy-lifestyle/pregnancy-week-by-week/expert-answers/leg-cramps-during-pregnancy/faq-20057766' },
            ],
          },
        ],
      },
    ],
  },
]
