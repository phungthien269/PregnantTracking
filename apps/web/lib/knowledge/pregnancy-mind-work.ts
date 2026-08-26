import type { KnowledgeTopic } from './types'

// ===========================================================================
// pregnancy-mind-work.ts — Tâm lý thai kỳ · Làm việc & an toàn lao động · Chuẩn bị trước mang thai
// Chuẩn hóa từ docs/lifestyle-mind-work-preconception.md (GĐ1 nghiên cứu).
// Nguồn chính: WHO · ACOG · CDC · NIH/NHS · NIOSH · HSE (UK) · Mayo Clinic · AAFP · FIGO.
// Lưu ý: nội dung giáo dục sức khỏe — KHÔNG thay thế tư vấn y khoa; mục tâm lý KHÔNG tự chẩn đoán.
// Thuần TS, không import ngoài ./types.
// ===========================================================================

export const topics: KnowledgeTopic[] = [
  {
    slug: 'tam-ly-thai-ky',
    title: 'Sức khỏe tâm lý thai kỳ',
    emoji: '💆',
    phases: ['pregnancy'],
    ageRange: 'Thai kỳ · tuần 1–40',
    summary:
      'Mang thai là giai đoạn thay đổi nội tiết lớn nên dao động cảm xúc là bình thường. Nhưng "buồn dai dẳng" kéo dài hơn 2 tuần cũng cần được lắng nghe — app chỉ giúp nhận biết dấu hiệu và hướng dẫn gặp chuyên gia, không tự chẩn đoán.',
    sections: [
      {
        heading: 'Cảm xúc thay đổi theo tam cá nguyệt',
        blocks: [
          {
            kind: 'p',
            text: 'Mang thai là giai đoạn thay đổi nội tiết lớn (estrogen, progesterone tăng mạnh) cùng nhiều điều chỉnh cuộc sống → dao động cảm xúc, "vui buồn lẫn lộn" là bình thường, không có nghĩa là mẹ "không tốt".',
          },
          {
            kind: 'table',
            headers: ['Giai đoạn', 'Cảm xúc thường gặp'],
            rows: [
              ['T1 (tuần 1–12)', 'Dao động mạnh nhất: mệt, buồn nôn, dễ khóc, vừa háo hức vừa lo lắng; cảm xúc thay đổi nhanh giữa vui – lo – mệt.'],
              ['T2 (tuần 13–27)', 'Thường "bình yên" nhất: mệt/ốm nghén giảm, năng lượng và tâm trạng ổn định hơn; vẫn có thể hay quên, cảm xúc lẫn lộn về thay đổi cơ thể hoặc khi cảm nhận thai máy.'],
              ['T3 (tuần 28–40)', 'Lo lắng trở lại gần ngày dự sinh: lo về cuộc sinh, về thay đổi cuộc sống, dễ cáu do mệt và khó ngủ; hành vi "làm tổ", lo lắng ám ảnh về sức khỏe con là không hiếm.'],
            ],
          },
          {
            kind: 'p',
            text: 'Khoảng 10–15% phụ nữ mang thai trải qua trầm cảm/lo âu lâm sàng; cứ 1 trong 5 có vấn đề sức khỏe tâm thần trong thai kỳ (ACOG). Vì vậy "buồn dai dẳng" cũng cần được lắng nghe, không gạt bỏ.',
          },
        ],
      },
      {
        heading: 'Tỷ lệ và yếu tố nguy cơ',
        blocks: [
          {
            kind: 'p',
            text: 'Tỷ lệ lo âu/trầm cảm thai kỳ có khác biệt giữa các tổ chức: WHO ~10% phụ nữ mang thai trên thế giới (trầm cảm phổ biến nhất; ở nước đang phát triển cao hơn — 15,6% khi mang thai), ACOG ~1/5 (20%), NHS ~10–15%. Nên hiểu theo khung "khoảng 10–20% tùy nghiên cứu/tổ chức", không khẳng định một con số tuyệt đối.',
          },
          {
            kind: 'list',
            items: [
              'Tiền sử trầm cảm/lo âu hoặc bệnh tâm thần (bản thân hoặc gia đình) — yếu tố dự báo mạnh nhất.',
              'Thiếu hỗ trợ xã hội/người thân, mối quan hệ vợ chồng căng thẳng.',
              'Bạo lực gia đình / tiền sử bị lạm dụng.',
              'Mang thai ngoài ý muốn.',
              'Áp lực kinh tế, thu nhập thấp, thất nghiệp.',
              'Tiền sử thai kỳ bất lợi: sảy thai, thai lưu, sinh non, biến chứng thai kỳ.',
              'Căng thẳng cuộc sống (mất người thân, chuyển nhà, mất việc...), tuổi mẹ trẻ, con so.',
            ],
          },
        ],
      },
      {
        heading: 'Dấu hiệu cần lưu ý',
        blocks: [
          {
            kind: 'p',
            text: 'Khi các dấu hiệu sau kéo dài — đặc biệt hơn 2 tuần — hoặc ảnh hưởng sinh hoạt hằng ngày, mẹ nên trao đổi với bác sĩ sản khoa / nhà hội sinh:',
          },
          {
            kind: 'list',
            items: [
              'Buồn/khóc hầu hết thời gian; cảm giác tuyệt vọng, vô dụng, tội lỗi.',
              'Mất hứng thú với những việc trước đây thích; cảm thấy mất kết nối với thai nhi.',
              'Ngủ thay đổi mạnh: mất ngủ (khó vào giấc, dậy sớm) hoặc ngủ quá nhiều — vượt xa khó ngủ thông thường của thai kỳ.',
              'Ăn thay đổi mạnh: chán ăn hoặc ăn quá nhiều.',
              'Lo âu dai dẳng khó kiểm soát, luôn căng thẳng/đứng ngồi không yên, hoảng sợ (panic).',
              'Dễ cáu gắt, khó tập trung, khó ra quyết định.',
            ],
          },
          {
            kind: 'warn',
            text: 'Có ý nghĩ tự làm hại bản thân / tự sát — cần cấp cứu ngay, không tự theo dõi. Hãy nói với người tin cậy và gọi cấp cứu ngay lập tức.',
          },
          {
            kind: 'p',
            text: 'Phân biệt: "baby blues" (sau sinh, vài ngày, nhẹ) khác với trầm cảm thai kỳ/sau sinh (kéo dài, nặng, cần điều trị). Trong thai kỳ, trầm cảm có thể xảy ra ở bất kỳ tam cá nguyệt nào, không chỉ sau sinh.',
          },
        ],
      },
      {
        heading: 'Công cụ sàng lọc — không tự chẩn đoán',
        blocks: [
          {
            kind: 'p',
            text: 'Sàng lọc là bước đầu phát hiện nguy cơ, không phải chẩn đoán. Chỉ bác sĩ/chuyên gia mới đánh giá, chẩn đoán và điều trị. App chỉ giới thiệu công cụ để mẹ chia sẻ kết quả với bác sĩ — không tự chẩn đoán.',
          },
          {
            kind: 'p',
            text: 'EPDS (Edinburgh Postnatal Depression Scale) — được ACOG gọi là "tiêu chuẩn vàng", phổ biến nhất: 10 câu hỏi, làm trong ~5 phút, miễn phí; đánh giá trầm cảm và có thang con về lo âu. Điểm ≥10 được xem là dương tính → cần được đánh giá tâm lý–xã hội đầy đủ và bàn về phương án điều trị. Hợp lệ dùng cho cả thai kỳ và sau sinh. Lưu ý: câu về tự hại — nếu trả lời "có", phải báo chuyên gia ngay.',
          },
          {
            kind: 'list',
            items: [
              'PHQ-9 — 9 câu sàng lọc trầm cảm, thường dùng chung cho nhiều bối cảnh.',
              'GAD-7 — 7 câu sàng lọc lo âu.',
              'MDQ — sàng lọc rối loạn lưỡng cực (ACOG khuyến nghị làm trước khi bắt đầu thuốc chống trầm cảm/lo âu, mỗi chu sinh 1 lần).',
              'PC-PTSD-5 — sàng lọc sang chấn tâm lý (PTSD).',
            ],
          },
          {
            kind: 'p',
            text: 'ACOG khuyến nghị sàng lọc tại 3 mốc: lần khám thai đầu tiên, cuối thai kỳ (T2/T3), và khám sau sinh — vì trầm cảm có thể xuất hiện bất kỳ lúc nào.',
          },
          {
            kind: 'warn',
            text: 'Nguyên tắc cho app: chỉ đưa thông tin giới thiệu (tên công cụ, mục đích, cách hiểu điểm ở mức "cần trao đổi với bác sĩ"), không tích hợp chấm điểm trực tiếp trừ khi có hướng dẫn y khoa đi kèm; luôn kèm khuyến cáo gặp chuyên gia.',
          },
        ],
      },
      {
        heading: 'Khi nào nên gặp chuyên gia và đường hỗ trợ',
        blocks: [
          {
            kind: 'list',
            items: [
              'Cảm giác buồn/chán nản chiếm hầu hết thời gian, hoặc mất hứng thú kéo dài hơn 2 tuần.',
              'Lo âu dai dẳng không kiểm soát được, ảnh hưởng giấc ngủ/ăn uống/làm việc.',
              'Có bất kỳ ý nghĩ tự hại/tự sát — khẩn cấp: nói ngay với người tin cậy + gọi cấp cứu, không chờ hẹn.',
              'Có tiền sử bệnh tâm thần (trầm cảm, lo âu, rối loạn ăn uống, rối loạn lưỡng cực, loạn thần sau sinh) → báo ngay từ đầu thai kỳ để có kế hoạch theo dõi sớm.',
            ],
          },
          {
            kind: 'p',
            text: 'Đường hỗ trợ chính: bác sĩ sản khoa, nhà hội sinh, bác sĩ gia đình — là nơi bắt đầu. Nhiều nơi có đội ngũ sức khỏe tâm thần chu sinh (perinatal mental health team) chuyên cho thai phụ/sau sinh. Trị liệu/tư vấn tâm lý (CBT, tham vấn) — càng sớm càng tốt.',
          },
          {
            kind: 'p',
            text: 'Đường dây nóng quốc tế (tham khảo, dùng khi ở nước ngoài):',
          },
          {
            kind: 'list',
            items: [
              'National Maternal Mental Health Hotline (Mỹ): 1-833-852-6262 — 24/7, miễn phí, bảo mật.',
              'Postpartum Support International (PSI): 1-800-944-4773.',
              '988 Suicide & Crisis Lifeline (Mỹ, gọi/nhắn): 988.',
            ],
          },
          {
            kind: 'p',
            text: 'Đường hỗ trợ tại Việt Nam (số đã đối chiếu lại với danh bạ IASP/Find A Helpline ngày 06/08/2026; hầu hết là hotline sức khỏe tâm thần chung, không chuyên biệt thai kỳ):',
          },
          {
            kind: 'list',
            items: [
              'Tổng đài 111 — Tổng đài Quốc gia Bảo vệ Trẻ em: miễn phí, 24/7, bảo mật; tư vấn tâm lý cho trẻ em <16 tuổi và người lớn lo về trẻ — hữu ích cho mẹ có con nhỏ, không phải hotline thai kỳ.',
              'Đường dây nóng Ngày Mai (phi lợi nhuận, "lắng nghe không phán xét"): 096 306 1414, hoạt động 13:00–20:30, Thứ 4–Chủ Nhật, sơ cứu cảm xúc miễn phí cho người trầm cảm và người thân.',
              'CSAGA — đường dây nóng hỗ trợ người bị bạo lực giới: 024 3333 5599, 8:00–21:00 hằng ngày, miễn phí, bảo mật (tư vấn tâm lý + pháp lý) — phù hợp nếu lo âu/trầm cảm liên quan bạo lực.',
              'Đường dây nóng HOPE (phòng chống tự tử): 0865 044 400, miễn phí, bảo mật, hoạt động buổi tối hằng ngày; hỗ trợ tiếng Việt và tiếng Anh.',
              'Ngôi nhà Bình yên (Peace House Shelter) — hỗ trợ khẩn cấp phụ nữ/trẻ em bị bạo lực gia đình, xâm hại tình dục: 1900 96 96 80, 24/7, miễn phí, bảo mật.',
            ],
          },
          {
            kind: 'warn',
            text: 'Khuyến nghị: mẹ nên bắt đầu từ bác sĩ sản khoa/nhà hội sinh tại cơ sở y tế; hotline chỉ là hỗ trợ thêm trong khủng hoảng.',
          },
        ],
      },
      {
        heading: 'Hỗ trợ từ gia đình/chồng và tự chăm sóc cảm xúc',
        blocks: [
          {
            kind: 'p',
            text: 'Vai trò của chồng/gia đình (ACOG): người bạn đời/người hỗ trợ là nguồn hỗ trợ chính cho mẹ và con; sự đồng hành chủ động giúp giảm căng thẳng, giảm lo âu thai kỳ và giảm nguy cơ sang chấn cảm xúc sau sinh.',
          },
          {
            kind: 'list',
            items: [
              'Đi khám thai cùng, chia sẻ việc nhà, lắng nghe không phán xét.',
              'Cùng tham gia giáo dục tiền sản, lên kế hoạch chăm sóc sau sinh có cả gia đình.',
            ],
          },
          {
            kind: 'p',
            text: 'Chồng cũng có thể bị trầm cảm (2–25% ông bố; tăng đến ~50% khi vợ bị trầm cảm sau sinh) → gia đình cũng nên quan tâm sức khỏe tâm thần của chồng. Giáo dục gia đình sớm về dấu hiệu rối loạn tâm trạng chu sinh giúp giảm kỳ thị, khuyến khích mẹ lên tiếng sớm.',
          },
          {
            kind: 'p',
            text: 'Tự chăm sóc cảm xúc (NHS):',
          },
          {
            kind: 'list',
            items: [
              'Nói chuyện với người tin cậy; viết nhật ký; đặt mục tiêu nhỏ, thực tế.',
              'Hít thở sâu/thiền định nhẹ khi quá tải; vận động nhẹ nếu được phép (cải thiện tâm trạng và giấc ngủ).',
              'Ăn uống điều độ, ngủ nghỉ đủ, dành thời gian cho sở thích; tham gia lớp tiền sản để gặp các mẹ cùng giai đoạn.',
              'Tránh rượu, thuốc lá, chất kích thích — làm tâm trạng tệ hơn và hại thai.',
            ],
          },
        ],
      },
      {
        heading: 'Nguồn tham khảo',
        blocks: [
          {
            kind: 'sources',
            sources: [
              { org: 'WHO', title: 'Perinatal mental health', url: 'https://www.who.int/teams/mental-health-and-substance-use/promotion-prevention/perinatal-mental-health' },
              { org: 'ACOG', title: 'Perinatal Mental Health: Patient Screening', url: 'https://www.acog.org/programs/perinatal-mental-health/patient-screening' },
              { org: 'ACOG', title: 'Assessment and Treatment of Perinatal Mental Health Conditions', url: 'https://www.acog.org/programs/perinatal-mental-health/assessment-and-treatment-of-perinatal-mental-health-conditions' },
              { org: 'ACOG', title: 'Perinatal Mental Health: Educational Resources for Providers, Patients, and Families', url: 'https://www.acog.org/programs/perinatal-mental-health/educational-resources-for-providers-patients-and-families' },
              { org: 'ACOG', title: 'Clinical Practice Guideline No. 4: Screening and Diagnosis of Mental Health Conditions During Pregnancy and Postpartum (2023)', url: 'https://www.acog.org/programs/perinatal-mental-health/patient-screening' },
              { org: 'NHS inform', title: 'Your mental health and wellbeing in pregnancy', url: 'https://www.nhsinform.scot/ready-steady-baby/pregnancy/relationships-and-wellbeing-in-pregnancy/your-mental-health-and-wellbeing-in-pregnancy/' },
              { org: 'NHS (Kingston)', title: 'Looking after your emotional wellbeing', url: 'https://www.kingstonmaternity.org.uk/pregnancy/looking-after-your-emotional-wellbeing' },
              { org: 'NHS (Oxford Health)', title: 'Emotional wellbeing', url: 'https://oxfordhealth.nhs.uk/buckinghamshire-perinatal-mental-health-service/resources/emotional-wellbeing/' },
              { org: 'NHS (King\'s College Hospital)', title: 'Mental health in pregnancy', url: 'https://www.kch.nhs.uk/maternity/specialist-maternity-support/mental-health-in-pregnancy/' },
              { org: 'IASP / Find A Helpline', title: 'Vietnam helplines and hotlines', url: 'https://iasp.findahelpline.com/countries/vn' },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: 'lam-viec-an-toan-thai-ky',
    title: 'Làm việc & an toàn lao động',
    emoji: '🧑‍💻',
    phases: ['pregnancy'],
    ageRange: 'Thai kỳ · tuần 1–40',
    summary:
      'Với thai kỳ khỏe mạnh không biến chứng, làm việc trong thai kỳ nhìn chung an toàn với một số điều chỉnh (ACOG). Mẹ có bệnh lý/biến chứng thai kỳ cần được tư vấn cá nhân với bác sĩ sản khoa.',
    sections: [
      {
        heading: 'Tư thế ngồi và đứng khi làm việc',
        blocks: [
          {
            kind: 'p',
            text: 'Nguyên tắc chung (ACOG CO 733): với thai kỳ khỏe mạnh không biến chứng, làm việc trong thai kỳ nhìn chung an toàn; hầu hết phụ nữ có thể tiếp tục làm việc với một số điều chỉnh.',
          },
          {
            kind: 'list',
            items: [
              'Ngồi sát bàn phím/màn hình, không vặn người; lưng tựa ghế có đỡ lưng dưới (lumbar support) ở đúng eo.',
              'Chân chạm sàn (kê chân nếu cần), đầu gối ~90°; giữ khoảng trống giữa bắp chân–mép ghế và đùi–mép bàn.',
              'Cánh tay ~90° ở khuỷu, cổ tay thẳng với cẳng tay; màn hình ngang hoặc hơi thấp hơn tầm mắt (tránh cúi/gập cổ).',
              'Nghỉ giải lao ngắn 1–2 phút mỗi giờ (đứng dậy, duỗi, đi lại); di chuyển mỗi vài giờ để giảm căng cơ và ứ dịch chân, uống đủ nước tại bàn làm việc.',
            ],
          },
          {
            kind: 'list',
            items: [
              'Đứng làm việc: không đứng yên bất động lâu; đan xen ngồi–đứng (bàn nâng hạ nếu có), đổi chân trụ, duỗi gối nhẹ.',
              'Mang giày thấp, êm, hỗ trợ tốt; có thể dùng thảm lót chống mỏi (floor mat) khi phải đứng nhiều.',
            ],
          },
        ],
      },
      {
        heading: 'Nâng và nhấc vật nặng',
        blocks: [
          {
            kind: 'warn',
            text: 'Không có một giới hạn kg duy nhất được mọi tổ chức thống nhất — các khuyến nghị khác nhau tùy tần suất, tư thế nâng và giai đoạn thai kỳ.',
          },
          {
            kind: 'p',
            text: 'NIOSH (CDC): giới hạn trọng lượng tạm thời cho thai phụ khỏe mạnh — ≤16 kg (~35 lb) trong nửa đầu thai kỳ (trước ~20 tuần) và ≤12 kg (~25 lb) trong nửa sau, với điều kiện nâng lý tưởng (ít lần, đúng tư thế). Tránh nâng từ sàn (dưới giữa cẳng chân) và nâng quá đầu.',
          },
          {
            kind: 'p',
            text: 'ACOG trích cùng khung NIOSH: nâng lý tưởng, ít lần — 16 kg (36 lb) đầu thai kỳ xuống còn ~6 kg (13 lb) cuối thai kỳ nếu nâng lặp lại kéo dài.',
          },
          {
            kind: 'p',
            text: 'UK (HSE/RCP): HSE không quy định một mức kg cố định — bắt buộc đánh giá rủi ro cá nhân và không yêu cầu thai phụ "nâng/vác vật nặng". RCP/NHS Plus: cân nhắc loại bỏ việc nâng từ đầu thai kỳ nếu tải >10–15 kg và phải nâng >10–15 lần/ngày; giảm nâng vật nặng đặc biệt sau ~28 tuần.',
          },
          {
            kind: 'p',
            text: 'Rủi ro (bằng chứng ACOG CO 733): nâng <100 kg tổng/ngày không thấy tăng nguy cơ sảy thai; nghiên cứu đoàn hệ Đan Mạch cho thấy tải 101–200 kg/ngày tăng nguy cơ sảy thai (HR 1,38) và >1.000 kg/ngày (HR 2,02); nâng/vác >5 kg liên quan tăng nhẹ nguy cơ sinh non (OR 1,3).',
          },
          {
            kind: 'list',
            items: [
              'Kỹ thuật nâng an toàn (khi bắt buộc): hít thở, đứng gần vật, gập gối (không cúi lưng), giữ lưng thẳng, vật sát người, nâng bằng chân; tránh xoay vặn người khi mang vật; nhờ người khác khi vật nặng/nhiều.',
            ],
          },
          {
            kind: 'p',
            text: 'Khuyến nghị thực dụng cho app VN: "nếu bắt buộc, không nâng quá ~10–12 kg sau 20 tuần và càng hạn chế càng tốt sau 28 tuần; luôn báo bác sĩ nếu công việc yêu cầu nâng thường xuyên để xin điều chỉnh công việc."',
          },
        ],
      },
      {
        heading: 'Đứng lâu, ngồi lâu và đi lại nhiều',
        blocks: [
          {
            kind: 'p',
            text: 'Bằng chứng ACOG CO 733: đứng >6 giờ/ngày chưa thấy tăng nguy cơ sảy thai; đứng/đi lại nơi làm việc >3 giờ/ngày liên quan tăng nhẹ nguy cơ sinh non (OR 1,3); đứng >4 giờ/ngày (OR 1,2).',
          },
          {
            kind: 'list',
            items: [
              'Điều chỉnh hữu ích khi đứng nhiều: thảm lót, bàn ngồi–đứng, vớ y khoa (hỗ trợ tĩnh mạch), giày êm, nghỉ ngồi thêm.',
              'Ngồi liên tục lâu → tăng ứ dịch chân, phù, giãn tĩnh mạch; đứng dậy đi lại mỗi 1–2 giờ, duỗi cổ chân, uống nước.',
              'Đi lại nhiều (bán hàng, y tế, nhà hàng): tương tự khuyến nghị "đứng lâu" — nghỉ ngồi định kỳ, giày phù hợp.',
              'Giày dép: gót thấp ≤2–3 cm, đế êm có hỗ trợ vòm, đủ rộng (chân dễ phù về cuối ngày); tránh giày bệt hoàn toàn hoặc gót cao.',
              'Vớ/y tất áp lực (15–20 mmHg) giúp giảm phù và phòng giãn tĩnh mạch khi đứng/ngồi lâu hoặc đi máy bay; tham khảo bác sĩ nếu có bệnh nền tim mạch.',
            ],
          },
        ],
      },
      {
        heading: 'Tiếp xúc nghề nghiệp cần lưu ý',
        blocks: [
          {
            kind: 'warn',
            text: 'Hóa chất/độc tố sinh sản: các nhóm được xem là nguy cơ sinh sản gồm kim loại nặng (chì, thủy ngân, asen), toàn bộ thuốc trừ sâu (pesticides) và một số thuốc diệt cỏ, dung môi cụ thể (toluene, benzene), bức xạ ion hóa, một số thuốc hóa trị (vd methotrexate). Nếu công việc tiếp xúc hóa chất: thông gió tốt + đồ bảo hộ (găng tay, khẩu trang); tham khảo phiếu an toàn hóa chất (SDS) và tài liệu CDC-NIOSH; trao đổi với bác sĩ + xin điều chỉnh công việc nếu lo ngại (kể cả khi chưa rõ mức nguy cơ).',
          },
          {
            kind: 'p',
            text: 'Tia X / bức xạ ion hóa: tia X chẩn đoán thông thường (răng, ngực, chi) được ACOG xem là an toàn khi có chỉ định y khoa — liều tích lũy cho phép cả thai kỳ là <5 rad (50 mGy), mọi chụp đơn lẻ đều dưới ngưỡng này. Giai đoạn nhạy cảm nhất của hệ thần kinh là tuần 10–17 → chụp không khẩn cấp có thể hoãn, nhưng không từ chối chụp cần thiết. Nếu làm việc trong môi trường phóng xạ (X-quang, xét nghiệm, hàng không/phi hành đoàn): báo ngay cho bác sĩ + người quản lý an toàn lao động.',
          },
          {
            kind: 'p',
            text: 'Ca đêm / mệt mỏi: phân tích gộp cho thấy làm ca đêm tăng nguy cơ sảy thai/thai lưu so với ca ngày (RR 1,51) và tăng nguy cơ sảy thai sớm <25 tuần (aOR 1,41) — nhưng ACOG nhấn mạnh bằng chứng khó kết luận chắc chắn (nhiều yếu tố gây nhiễu) và mức tăng chỉ "nhẹ đến vừa". Khuyến nghị: trao đổi với bác sĩ + nhà tuyển dụng về khả năng giảm ca đêm/ca kéo dài hoặc chuyển ca; nghỉ ngơi đủ, uống nước, không thức khuya triền miên.',
          },
          {
            kind: 'p',
            text: 'Quyền lợi lao động (tham khảo): ở nhiều quốc gia (UK, Mỹ theo Pregnant Workers Fairness Act...) thai phụ có quyền yêu cầu điều chỉnh công việc hợp lý (giảm đứng lâu, chuyển việc nặng, thêm nghỉ) khi có giấy bác sĩ; bác sĩ sản khoa có thể viết giấy đề nghị điều chỉnh cụ thể (vd "không đứng liên tục quá 2 giờ"). Với VN: cần đối chiếu Bộ luật Lao động về bảo vệ thai sản khi tích hợp.',
          },
        ],
      },
      {
        heading: 'Lái xe và đi máy bay',
        blocks: [
          {
            kind: 'p',
            text: 'Lái xe / ngồi ô tô (ACOG + AAFP): LUÔN thắt dây an toàn (cả dây đai + dây chéo) trong mọi chuyến đi, kể cả những tuần cuối — đeo đúng cách không có hại cho thai. Dây đai (lap belt) đặt DƯỚI bụng, vắt ngang qua xương hông/xương chậu (đùi trên) — tuyệt đối không đặt trên/ngang qua bụng. Dây chéo (shoulder belt) giữa hai ngực, sang bên bụng, không vòng dưới cánh tay hay ra sau lưng.',
          },
          {
            kind: 'list',
            items: [
              'Giữ khoảng cách ≥10 inch (~25 cm) giữa vô-lăng và ngực nếu lái xe; không tắt túi khí; tránh áo quá dày làm dây lỏng.',
              'Nếu tai nạn: đi khám ngay dù cảm thấy khỏe.',
            ],
          },
          {
            kind: 'p',
            text: 'Đi máy bay (ACOG CO 746): với thai kỳ khỏe mạnh không biến chứng, bay thỉnh thoảng là an toàn, không làm tăng nguy cơ bất lợi. Thời điểm tốt nhất là tam cá nguyệt 2 (tuần 14–28) — nguy cơ cấp cứu sản khoa thấp nhất.',
          },
          {
            kind: 'list',
            items: [
              'Hạn chế tuần của hãng hàng không: hầu hết hãng cho bay đến ~36 tuần (thai đơn); một số hãng siết sớm hơn với chuyến quốc tế và yêu cầu giấy xác nhận của bác sĩ (tuổi thai + ngày dự sinh). Thai đôi: thường giới hạn sớm hơn (~32 tuần theo EBCOG). Phải kiểm tra từng hãng.',
              'Chống huyết khối/phù khi bay: mặc vớ áp lực, đứng dậy đi lại định kỳ, duỗi cổ chân khi ngồi, uống đủ nước, tránh quần áo bó; ngồi ghế cạnh lối đi cho dễ đi lại.',
              'Tránh đồ uống có gas trước chuyến bay (giãn nở khí ở độ cao); có thể dùng thuốc chống nôn phòng ốm nghén (hỏi bác sĩ).',
              'Bức xạ vũ trụ: không đáng lo với hành khách thỉnh thoảng — chuyến bay dài nhất cũng chỉ ~15% giới hạn khuyến nghị 1 mSv cho cả thai kỳ; chỉ người làm nghề bay thường xuyên cần lưu ý.',
            ],
          },
          {
            kind: 'warn',
            text: 'Không bay khi có bệnh lý sản khoa/nội khoa có thể nặng lên trên máy bay hoặc cần cấp cứu — hỏi bác sĩ trước.',
          },
        ],
      },
      {
        heading: 'Nguồn tham khảo',
        blocks: [
          {
            kind: 'sources',
            sources: [
              { org: 'ACOG', title: 'Committee Opinion No. 733: Employment Considerations During Pregnancy and the Postpartum Period (2018)', url: 'https://pubmed.ncbi.nlm.nih.gov/29578986/' },
              { org: 'NIOSH/CDC', title: 'Provisional recommended weight limits for manual lifting during pregnancy', url: 'https://stacks.cdc.gov/view/cdc/195121' },
              { org: 'NIOSH/CDC', title: 'Reproductive health and the workplace', url: 'https://www.cdc.gov/niosh/topics/repro/' },
              { org: 'HSE (UK)', title: 'Protecting pregnant workers and new mothers: employers', url: 'https://www.hse.gov.uk/mothers/employer/common-risks.htm' },
              { org: 'Mayo Clinic', title: 'Work more comfortably while pregnant', url: 'https://sncs-prod-external.mayo.edu/hometown-health/speaking-of-health/work-more-comfortably-while-pregnant' },
              { org: 'ACOG', title: 'Committee Opinion No. 746: Air Travel During Pregnancy (2018)', url: 'https://pubmed.ncbi.nlm.nih.gov/30113411/' },
              { org: 'AAFP', title: 'Car Safety During Pregnancy', url: 'https://www.aafp.org/pubs/afp/issues/2014/1115/p717-s1.html' },
              { org: 'ACOG', title: 'FAQ: Car Safety for Pregnant Women (patient education)', url: 'https://www.acog.org/womens-health/faqs/car-safety-for-pregnant-women' },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: 'chuan-bi-truoc-mang-thai',
    title: 'Chuẩn bị trước mang thai',
    emoji: '🌱',
    phases: ['preconception'],
    ageRange: 'Trước khi mang thai · 3–6 tháng',
    summary:
      'Nhiều dị tật/ống thần kinh hình thành 3–4 tuần sau thụ thai, trước khi mẹ biết mình có thai — nên bắt đầu chuẩn bị từ 3 tháng trước. Nội dung giáo dục sức khỏe, không thay thế tư vấn y khoa.',
    sections: [
      {
        heading: 'Vì sao nên chuẩn bị 3–6 tháng trước',
        blocks: [
          {
            kind: 'p',
            text: 'WHO định nghĩa chăm sóc tiền thụ thai là các can thiệp y-sinh-hành vi-xã hội trước khi thụ thai nhằm cải thiện sức khỏe mẹ và con. Nhiều dị tật/ống thần kinh hình thành 3–4 tuần sau thụ thai, trước khi mẹ biết mình có thai → giảm rủi ro cần được thực hiện ≥3–6 tháng trước khi thụ thai (bỏ rượu/thuốc lá, điều trị bệnh nền, bổ sung vi chất).',
          },
          {
            kind: 'list',
            items: [
              'Mở rộng chăm sóc tiền thụ thai có thể tránh ~71% tử vong sơ sinh, 33% thai lưu, 54% tử vong mẹ (ước tính WHO/FIGO tại 75 quốc gia gánh nặng cao).',
              'Với phụ nữ tiểu đường, chăm sóc trước thụ thai giảm 54% tử vong chu sinh.',
              'Acid folic bổ sung đủ ngăn 50–70% dị tật ống thần kinh.',
              'Khoảng 50% thai kỳ trên thế giới là không có kế hoạch → mọi phụ nữ trong độ tuổi sinh sản nên được tiếp cận.',
            ],
          },
          {
            kind: 'p',
            text: 'Khuyến nghị cho app: bắt đầu chuẩn bị từ 3 tháng trước (tối thiểu 1 tháng trước khi thử thai), phù hợp cả CDC lẫn WHO.',
          },
        ],
      },
      {
        heading: 'Acid folic: liều và thời điểm',
        blocks: [
          {
            kind: 'p',
            text: 'Lý do: ống thần kinh đóng kín ~ngày 28 sau thụ thai → cần acid folic đủ trước khi mang thai; bổ sung đủ giảm 50–70% dị tật ống thần kinh (nứt đốt sống, vô sọ).',
          },
          {
            kind: 'table',
            headers: ['Đối tượng', 'Liều', 'Thời điểm bắt đầu'],
            rows: [
              ['Mọi phụ nữ trong độ tuổi sinh sản / đang kế hoạch', '400 mcg/ngày (CDC); WHO: 0,4 mg/ngày', 'Trước thụ thai — CDC: ít nhất 1 tháng (khuyến khích 3 tháng); WHO: 3 tháng trước'],
              ['Nguy cơ cao (tiền sử con dị tật ống thần kinh, BMI ≥30, tiểu đường, đang dùng thuốc chống động kinh...)', '4.000 mcg (4 mg)/ngày (CDC) hoặc 4–5 mg kê đơn (WHO/NHS)', '1 tháng trước thụ thai → hết 3 tháng đầu; theo chỉ định bác sĩ'],
              ['Tiếp tục trong thai kỳ', '400 mcg/ngày đến hết tuần 12 (T1); RDA cả thai kỳ 600 mcg DFE', '—'],
            ],
          },
          {
            kind: 'warn',
            text: 'Không tự vượt 1.000 mcg/ngày từ dạng bổ sung (UL theo NIH/ODS) trừ khi bác sĩ chỉ định liều cao.',
          },
          {
            kind: 'p',
            text: 'Khó đạt 400 mcg chỉ bằng ăn → dùng viên bổ sung/vitamin tổng hợp chứa ≥400 mcg folic acid + ăn thực phẩm giàu folate (rau xanh đậm, đậu, cam quýt) + thực phẩm tăng cường (bánh mì, gạo, ngũ cốc).',
          },
        ],
      },
      {
        heading: 'Kiểm tra sức khỏe trước khi mang thai',
        blocks: [
          {
            kind: 'list',
            items: [
              'Cân nặng/BMI (CDC + WHO): đo chiều cao–cân nặng tính BMI, mục tiêu BMI khỏe mạnh 18,5–24,9. Thiếu cân hoặc thừa cân/béo phì đều ảnh hưởng khả năng thụ thai và tăng biến chứng thai kỳ (tiểu đường thai kỳ, tiền sản giật, thai to...) → điều chỉnh cân nặng trước khi mang thai.',
              'Đái tháo đường: đo HbA1c, đưa đường huyết về gần bình thường trước thụ thai (giảm sảy thai, dị tật bẩm sinh, bệnh lý sơ sinh).',
              'Tăng huyết áp: kiểm soát huyết áp; tránh ACE inhibitors và ARBs khi có kế hoạch mang thai (đổi thuốc theo bác sĩ).',
              'Tuyến giáp: có tiền sử/bệnh tuyến giáp → xét nghiệm chức năng giáp (TSH), điều chỉnh trước.',
              'Bệnh khác cần rà soát: động kinh, hen, tim mạch, HIV/viêm gan B, bệnh thận, PKU, bệnh tâm thần.',
            ],
          },
          {
            kind: 'p',
            text: 'Răng miệng: khám răng trước khi mang thai là thành phần khuyến nghị của chăm sóc tiền thụ thai (CDC/ACOG): điều trị sâu răng, viêm lợi trước; sức khỏe răng miệng kém liên quan viêm nhiễm, biến chứng thai kỳ.',
          },
          {
            kind: 'p',
            text: 'Xét nghiệm/sàng lọc khác (CDC): sàng lọc nhiễm trùng lây qua đường tình dục (HIV, viêm gan B/C, giang mai, lậu, chlamydia), thiếu máu, tình trạng dinh dưỡng, tiếp xúc môi trường/nghề nghiệp.',
          },
        ],
      },
      {
        heading: 'Tiêm chủng cần cập nhật trước khi mang thai',
        blocks: [
          {
            kind: 'table',
            headers: ['Vắc-xin', 'Trước mang thai', 'Ghi chú'],
            rows: [
              ['Sởi–quai bị–rubella (MMR)', 'NÊN tiêm trước khi mang thai', 'CHỐNG CHỈ ĐỊNH trong thai kỳ (vắc-xin sống giảm độc lực) → tiêm trước hoặc sau sinh; kiểm tra miễn dịch rubella'],
              ['Viêm gan B', 'Cập nhật đủ mũi', 'Đặc biệt nếu có nguy cơ; cũng có thể tiêm trong thai kỳ khi có chỉ định'],
              ['Cúm (influenza)', 'Nhắc tiêm hằng năm', 'Khuyến nghị tiêm trong mọi thai kỳ, bất kỳ tuổi thai nào; lý tưởng đầu mùa thu; có thể tiêm ngay trước khi mang thai'],
              ['Thủy đậu (varicella)', 'Tiêm trước khi mang thai', 'Vắc-xin sống → không tiêm trong thai kỳ; nếu chưa có miễn dịch cần chủng ngừa trước ≥1 tháng'],
              ['HPV', 'Tiêm trước (nếu trong độ tuổi chỉ định)', 'Không khuyến nghị trong thai kỳ'],
              ['Uốn ván–bạch hầu–ho gà (Tdap)', 'Cập nhật; tiêm nhắc Tdap trong thai kỳ tuần 27–36', 'Với mỗi thai kỳ'],
              ['COVID-19 / RSV', 'Theo lịch', 'RSV: tuần 32–36 (mùa thu–đông)'],
            ],
          },
          {
            kind: 'warn',
            text: 'MMR và thủy đậu là vắc-xin sống giảm độc lực — chống chỉ định trong thai kỳ. Phải hoàn tất trước khi thụ thai và tránh có thai trong ~1 tháng sau tiêm (trao đổi bác sĩ). Vắc-xin bất hoạt (cúm, viêm gan B, Tdap) an toàn trong thai kỳ.',
          },
          {
            kind: 'p',
            text: 'Nguyên tắc: kiểm tra sổ tiêm chủng trước khi mang thai. Theo ACOG Maternal Immunization Schedule (2026), tiêm chủng là phần thiết yếu của chăm sóc trước, trong và sau thai kỳ.',
          },
        ],
      },
      {
        heading: 'Tránh rượu, thuốc lá và chất gây nghiện',
        blocks: [
          {
            kind: 'warn',
            text: 'Rượu: KHÔNG có mức rượu nào an toàn khi mang thai — CDC khuyến nghị không uống nếu đang có kế hoạch mang thai. Tất cả loại rượu (bia, rượu vang...) đều qua nhau thai, thai không chuyển hóa được → nguy cơ sảy thai, thai lưu, rối loạn phổ rượu bào thai (FASD): chậm phát triển, dị dạng, khiếm khuyết thần kinh.',
          },
          {
            kind: 'p',
            text: 'Thuốc lá / vaping: hút thuốc (kể cả thuốc lá điện tử/vape) trước/trong thai kỳ tăng nguy cơ sinh non, nhẹ cân, thai chậm tăng trưởng, mất thai, SIDS. Bỏ thuốc trước khi mang thai giảm nguy cơ (vd sứt môi/hở hàm ếch); bỏ càng sớm càng tốt — "chưa bao giờ là quá muộn để bỏ".',
          },
          {
            kind: 'p',
            text: 'Chất gây nghiện: tránh mọi chất cấm, kể cả cần sa (dù hợp pháp ở nơi khác): qua nhau thai, gây dị tật, nhẹ cân, sinh non, bong nhau thai, hội chứng cai ở trẻ sơ sinh. Nếu khó tự bỏ → tìm hỗ trợ y tế/chuyên gia cai nghiện.',
          },
          {
            kind: 'p',
            text: 'Rà lại thuốc đang dùng: một số thuốc gây quái thai cần được bác sĩ đổi/điều chỉnh trước khi thụ thai — isotretinoin (Accutane), một số thuốc chống động kinh, warfarin, một số thuốc huyết áp (ACE inhibitors/ARBs)... Không tự ngưng thuốc mạn tính — trao đổi bác sĩ để chuyển sang thuốc an toàn thai kỳ.',
          },
        ],
      },
      {
        heading: 'Sàng lọc di truyền và tiền sử gia đình',
        blocks: [
          {
            kind: 'p',
            text: 'Sàng lọc người mang gen (carrier screening): ACOG khuyến nghị đề nghị cho mọi người đang cân nhắc mang thai hoặc đã mang thai, lý tưởng trước khi thụ thai. Có 3 chiến lược tương đương: theo dân tộc (vd Tay-Sachs cho người gốc Do Thái Ashkenazi), liên dân tộc (panethnic), hoặc sàng lọc mở rộng (expanded carrier screening).',
          },
          {
            kind: 'list',
            items: [
              'Khuyến nghị cho mọi người (tối thiểu): xơ nang (CF), teo cơ tủy sống (SMA), bệnh huyết sắc tố/thalassemia (qua công thức máu).',
              'Fragile X: cho người có tiền sử gia đình liên quan Fragile X/khuyết tật trí tuệ hoặc tiền sử suy buồng trứng sớm.',
              'Tùy dân tộc, cân nhắc thêm: alpha/beta-thalassemia (người gốc Đông Nam Á — liên quan VN), bệnh hồng cầu hình liềm (gốc Phi), Tay-Sachs/Canavan (gốc Do Thái Ashkenazi)...',
            ],
          },
          {
            kind: 'p',
            text: 'Sàng lọc là tự nguyện, cần tư vấn trước–sau xét nghiệm; nếu mẹ mang gen, bố nên được xét nghiệm; xét nghiệm không phát hiện hết mọi người mang gen (residual risk).',
          },
          {
            kind: 'p',
            text: 'Tiền sử gia đình: nếu có người thân mắc bệnh di truyền, dị tật bẩm sinh, khuyết tật trí tuệ → trao đổi bác sĩ để xét tư vấn di truyền trước khi mang thai.',
          },
        ],
      },
      {
        heading: 'Nguồn tham khảo',
        blocks: [
          {
            kind: 'sources',
            sources: [
              { org: 'CDC', title: 'Folic Acid', url: 'https://www.cdc.gov/ncbddd/folicacid/about.html' },
              { org: 'CDC', title: 'Planning for Pregnancy', url: 'https://cdc.gov/pregnancy/about/index.html' },
              { org: 'WHO', title: 'Preconception care: Report of a WHO meeting (2013)', url: 'https://iris.who.int/bitstream/handle/10665/205637/B5124.pdf' },
              { org: 'CDC', title: 'Recommendations to improve preconception health (2006)', url: 'https://www.aafp.org/afp/2006/1201/p1967' },
              { org: 'ACOG', title: 'Maternal Immunization Schedule', url: 'https://www.acog.org/clinical-information/maternal-immunization-schedule' },
              { org: 'ACOG', title: 'Carrier Screening in the Age of Genomic Medicine (CO 690)', url: 'https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2017/03/carrier-screening-in-the-age-of-genomic-medicine' },
              { org: 'MedlinePlus/NIH', title: 'Preconception Care', url: 'https://medlineplus.gov/preconceptioncare.html' },
              { org: 'NIH/ODS', title: 'Folate', url: 'https://ods.od.nih.gov/factsheets/Folate-HealthProfessional/' },
              { org: 'FIGO', title: 'Preconception Counselling', url: 'https://www.figo.org/preconception-counselling' },
            ],
          },
        ],
      },
    ],
  },
]
