import type { KnowledgeTopic } from './types'

// Dinh dưỡng 1.000 ngày đầu đời & phát triển thai nhi.
// Nguồn: orchestration/docs/development-nutrition-first-1000-days.md
// (WHO · UNICEF · The Lancet · ACOG · NIH/ODS · HHS · Harvard T.H. Chan · IOM/NASEM)
export const topics: KnowledgeTopic[] = [
  {
    slug: '1000-ngay-dau-doi',
    title: '1.000 ngày đầu đời — cửa sổ vàng',
    emoji: '🌟',
    phases: ['preconception', 'pregnancy', 'infant', 'toddler'],
    ageRange: 'Thai kỳ → bé 2 tuổi',
    summary:
      '1.000 ngày từ lúc thụ thai đến khi bé tròn 2 tuổi là giai đoạn não bộ phát triển nhanh nhất và dễ tổn thương nhất đời — dinh dưỡng đúng trong cửa sổ này quyết định sức khỏe, trí tuệ và cả thế hệ sau.',
    sections: [
      {
        heading: 'Định nghĩa 1.000 ngày',
        blocks: [
          {
            kind: 'warn',
            text: 'Nội dung giáo dục sức khỏe, không thay thế tư vấn y khoa. Mọi bổ sung liều cao, chẩn đoán thiếu máu hay bất thường tăng trưởng thai đều cần bác sĩ sản khoa đánh giá.',
          },
          {
            kind: 'p',
            text: '"1.000 ngày đầu đời" là khoảng thời gian từ lúc thụ thai đến khi trẻ tròn 2 tuổi, tính bằng 270 ngày thai kỳ + 730 ngày (2 năm đầu đời) = 1.000 ngày. WHO/UNICEF chia thành 3 giai đoạn: (1) mang thai — dinh dưỡng mẹ quyết định sự hình thành và phát triển thai nhi; (2) 0–6 tháng — bú mẹ hoàn toàn; (3) 6–24 tháng — ăn bổ sung cùng bú mẹ, thiết lập chế độ ăn lành mạnh.',
          },
        ],
      },
      {
        heading: 'Vì sao là "cửa sổ vàng"',
        blocks: [
          {
            kind: 'p',
            text: 'Ba lý do sinh học khiến giai đoạn này được gọi là "cửa sổ vàng":',
          },
          {
            kind: 'list',
            items: [
              'Phát triển não bộ nhanh nhất đời: lúc chào đời não chỉ bằng ~25–30% kích thước người lớn, nhưng đến 2 tuổi đạt ~80%; có tới ~1 triệu kết nối thần kinh (synapse) hình thành mỗi giây — tốc độ không lặp lại; não trẻ nhỏ tiêu thụ tới ~2/3 năng lượng lúc nghỉ ngơi. Tổng số neuron (~100 tỷ) hình thành gần như trọn vẹn trước sinh (đến khoảng tuần 23–24), sau sinh não tiếp tục lớn nhờ myelin hóa, synapse và tế bào đệm — đến 2 tuổi có ~100 nghìn tỷ synapse trước khi trải qua "cắt tỉa synapse" (synaptic pruning) ở tuổi thiếu niên.',
              'Hệ miễn dịch và cơ thể "được lập trình": chất lượng dinh dưỡng giai đoạn này định hình hệ miễn dịch, chiều cao, cân nặng và khả năng trao đổi chất lâu dài — nền tảng của khái niệm DOHaD (Developmental Origins of Health and Disease), phát triển từ "giả thuyết Barker": môi trường trong tử cung "lập trình" chuyển hóa của thai nhi; suy dinh dưỡng trong bụng mẹ được thích nghi theo "kiểu hình hà tiện" (thrifty phenotype) để sống sót, nhưng làm tăng nguy cơ tăng huyết áp, tiểu đường type 2, bệnh tim mạch khi trẻ lớn lên trong môi trường dinh dưỡng dư thừa.',
              'Tổn thương giai đoạn này gần như không thể đảo ngược; ngược lại, can thiệp dinh dưỡng đúng trong "cửa sổ vàng" mang lại lợi ích suốt đời. WHO ước tính ít nhất 250 triệu trẻ dưới 5 tuổi (43%) có nguy cơ không đạt được tiềm năng phát triển; khung chăm sóc nuôi dưỡng (nurturing care) gồm 5 thành phần: sức khỏe tốt, dinh dưỡng đầy đủ, chăm sóc đáp ứng, cơ hội học sớm, an toàn và an ninh.',
            ],
          },
          {
            kind: 'warn',
            text: 'Các con số về não bộ (~1 triệu synapse/giây, ~100 nghìn tỷ synapse lúc 2 tuổi, não 80% người lớn lúc 2 tuổi) là ước tính phổ biến từ UNICEF/NIH (một số nguồn ghi 700 nghìn–2 triệu/giây) — dùng để minh họa tốc độ, không phải số đo chính xác tuyệt đối.',
          },
        ],
      },
      {
        heading: 'Hệ quả dài hạn của suy dinh dưỡng',
        blocks: [
          {
            kind: 'p',
            text: 'Bằng chứng Lancet (2 chuỗi nghiên cứu mang tính bước ngoặt 2008 & 2013):',
          },
          {
            kind: 'list',
            items: [
              'Lancet 2008 (Victora và cộng sự, 5 đoàn hệ dài hạn): thấp còi/suy dinh dưỡng trong 2 năm đầu → tổn thương gần như vĩnh viễn — người lớn thấp hơn, đi học ít hơn, thu nhập thấp hơn, và (với nữ) con sinh ra nhẹ cân hơn, nghĩa là ảnh hưởng kéo dài sang thế hệ sau. Chiều cao theo tuổi lúc 2 tuổi là yếu tố dự báo tốt nhất cho "vốn con người" (human capital) khi trưởng thành.',
              'Lancet 2013 (Black và cộng sự): năm 2011 toàn cầu có ≥165 triệu trẻ <5 tuổi bị thấp còi và ≥52 triệu trẻ bị gầy còm (wasting). Suy dinh dưỡng là nguyên nhân của 45% tổng số tử vong trẻ <5 tuổi — tương đương 3,1 triệu ca mỗi năm; riêng chậm tăng trưởng trong tử cung (FGR) gây 817.000 ca tử vong sơ sinh/năm; hơn 1/4 trẻ ở nước thu nhập thấp-trung bình sinh ra nhỏ so với tuổi thai (SGA).',
              'Khung "thế hệ sau" (intergenerational): chậm phát triển trong tử cung → bé gái lớn lên thấp còi → mang thai cho ra đời con nhẹ cân — tạo vòng luẩn quẩn suy dinh dưỡng qua các thế hệ. Đây là lý do các tổ chức y tế đặt dinh dưỡng 1.000 ngày thành ưu tiên chính sách toàn cầu (phong trào Scaling Up Nutrition — SUN, chiến dịch 1.000 Days).',
            ],
          },
          {
            kind: 'table',
            headers: ['Nhóm', 'Hệ quả dài hạn', 'Bằng chứng'],
            rows: [
              ['Nhận thức & học tập', 'Giảm IQ, kết quả học kém hơn, "kém 20% khả năng đọc" và thu nhập thấp hơn ~20% khi trưởng thành', 'Lancet 2008/2013; UNICEF'],
              ['Sinh trưởng', 'Người lớn thấp hơn, còi cọc; vòng luẩn quẩn thế hệ sau', 'Lancet 2008 (Victora)'],
              ['Bệnh chuyển hóa', 'Tăng nguy cơ béo phì, tăng huyết áp, tiểu đường type 2, bệnh tim mạch — nhất là khi tăng cân nhanh bù trừ sau 2 tuổi', 'DOHaD/Barker; Lancet 2008'],
              ['Miễn dịch & tử vong', 'Suy dinh dưỡng = 45% tử vong trẻ <5 tuổi (3,1 triệu/năm, 2011); dễ nhiễm trùng', 'Lancet 2013 (Black)'],
            ],
          },
          {
            kind: 'p',
            text: 'Cân bằng thông điệp cho app: thông tin về hậu quả dài hạn dùng để tạo động lực, không gây lo sợ — can thiệp dinh dưỡng sớm + kích thích tâm lý (chăm sóc đáp ứng) vẫn cải thiện được kết cục (bằng chứng Jamaica: trẻ thấp còi được kích thích có nhận thức tốt hơn về sau).',
          },
        ],
      },
      {
        heading: 'Ý nghĩa cho mẹ Việt — gánh nặng thiếu vi chất',
        blocks: [
          {
            kind: 'p',
            text: 'Việt Nam thuộc nhóm quốc gia còn gánh nặng thiếu vi chất đáng kể ở phụ nữ mang thai — trực tiếp đe dọa kết cục "1.000 ngày":',
          },
          {
            kind: 'table',
            headers: ['Vi chất', 'Tình trạng ở thai phụ Việt Nam', 'Nguồn'],
            rows: [
              ['Thiếu máu (chủ yếu do thiếu sắt)', '~37% thai phụ thiếu máu (2018); điều tra dinh dưỡng toàn quốc cho thấy thiếu máu thiếu sắt ~50,3% ở phụ nữ mang thai (một số điều tra ghi 25,4%)', 'WHO/UNICEF VN 2018; Tổng điều tra dinh dưỡng 2019–2020'],
              ['I-ốt', 'I-ốt niệu thai phụ 83,4 µg/L (2019) — dưới ngưỡng WHO 150 µg/L; chỉ ~30% hộ gia đình dùng muối i-ốt đầy đủ; VN nằm trong số ~19–26 quốc gia còn thiếu hụt i-ốt', 'WHO/UNICEF VN; Iodine Global Network'],
              ['Kẽm', '63–80% thai phụ thiếu kẽm (tùy điều tra); 81,9% ở vùng miền núi phía Bắc', 'WHO/UNICEF VN 2018; Tổng điều tra dinh dưỡng 2019'],
            ],
          },
          {
            kind: 'warn',
            text: 'Số liệu Việt Nam có khác biệt giữa các điều tra (thiếu máu thai phụ 25,4% / 37% / 50,3%; kẽm 63% / 80%) do khác năm và phương pháp — cần kiểm lại và ưu tiên đối chiếu hướng dẫn Bộ Y tế Việt Nam khi sử dụng.',
          },
          {
            kind: 'p',
            text: 'WHO và UNICEF liên tục kêu gọi Chính phủ Việt Nam thực thi Nghị định 09/2016/ND-CP về tăng cường vi chất vào muối, bột mì và dầu ăn — cảnh báo thiếu vi chất (i-ốt, sắt, kẽm) góp phần gây tử vong mẹ, thai kém phát triển, trẻ chậm phát triển nhận thức-vận động và tăng tử vong trẻ em.',
          },
          {
            kind: 'list',
            items: [
              'Hàm ý cho nội dung app: nhấn mạnh bổ sung sắt theo WHO (30–60 mg/ngày), muối i-ốt hằng ngày + viên tiền sản chứa i-ốt, và bữa ăn đủ kẽm (thịt, hải sản, đậu) — chi tiết xem KB dinh dưỡng.',
              'Nhắc xét nghiệm máu (công thức máu/hemoglobin) theo lịch khám thai để phát hiện và điều trị thiếu máu sớm.',
              'Ngôn ngữ tài liệu nên tránh đổ lỗi cho mẹ; đóng khung là "vấn đề sức khỏe cộng đồng phổ biến, có thể phòng tránh và điều trị được".',
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
              { org: 'WHO', title: 'Nurturing care for early childhood development: a framework for helping children survive and thrive (2018)', url: 'https://www.who.int/publications/i/item/9789241514064' },
              { org: 'UNICEF', title: 'Early childhood nutrition', url: 'https://www.unicef.org/nutrition/early-childhood-nutrition' },
              { org: 'UNICEF Zimbabwe', title: 'Why do Early Moments Matter?', url: 'https://www.unicef.org/zimbabwe/stories/why-do-early-moments-matter' },
              { org: 'PMC', title: 'Epigenetic Modifications at the Center of the Barker Hypothesis and Their Transgenerational Implications (2022)', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8656758/' },
              { org: 'The Lancet', title: 'Victora et al., Maternal and child undernutrition: consequences for adult health and human capital (2008)', url: 'https://www.thelancet.com/journals/lancet/article/PIIS0140-6736(07)61692-4/fulltext' },
              { org: 'Europe PMC (bản mở)', title: 'Victora et al. (2008), PMC2258311', url: 'https://europepmc.org/article/MED/18206223' },
              { org: 'PubMed', title: 'Black et al., Maternal and child undernutrition and overweight in low-income and middle-income countries (Lancet 2013)', url: 'https://pubmed.ncbi.nlm.nih.gov/23746772/' },
              { org: '1,000 Days', title: 'Maternal and child undernutrition: consequences for adult health and human capital (cập nhật Lancet)', url: 'https://thousanddays.org/updates/maternal-and-child-undernutrition-consequences-for-adult-health-and-human-capital/' },
              { org: 'UNICEF Việt Nam / WHO', title: 'Joint press statement: WHO and UNICEF call on Vietnamese authorities to enforce food fortification regulations', url: 'https://www.unicef.org/vietnam/press-releases/who-and-unicef-call-vietnamese-authorities-enforce-food-fortification-regulations' },
              { org: 'Liên Hợp Quốc tại Việt Nam', title: 'WHO và UNICEF kêu gọi tăng cường thực thi quy định tăng cường vi chất vào thực phẩm', url: 'https://vietnam.un.org/en/4108-joint-press-statement-who-and-unicef-call-vietnamese-authorities-enforce-food-fortification' },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: 'dinh-duong-phat-trien-thai-nhi',
    title: 'Dinh dưỡng mẹ → phát triển thai nhi',
    emoji: '🤰',
    phases: ['pregnancy'],
    ageRange: 'Thai kỳ',
    summary:
      'Dinh dưỡng của mẹ "xây dựng" thai nhi theo từng giai đoạn: hình thành cơ quan, phân chia neuron, tăng trưởng và dự trữ. Mỗi vi chất có "thời điểm vàng" riêng — hiểu theo góc phát triển để bổ sung đúng lúc.',
    sections: [
      {
        heading: 'Mốc phát triển thai nhi + dinh dưỡng tương ứng',
        blocks: [
          {
            kind: 'warn',
            text: 'Nội dung giáo dục sức khỏe, không thay thế tư vấn y khoa. Không tự chẩn đoán hay tự ý bổ sung liều cao khi chưa có chỉ định của bác sĩ sản khoa.',
          },
          {
            kind: 'p',
            text: "Theo Office on Women's Health (HHS, Mỹ), thai kỳ ~40 tuần chia 3 tam cá nguyệt với các mốc phát triển chính sau (số liệu nhu cầu hằng ngày xem trang Dinh dưỡng tuần):",
          },
          {
            kind: 'table',
            headers: ['Giai đoạn', 'Mốc phát triển thai nhi', 'Trọng tâm dinh dưỡng tương ứng'],
            rows: [
              ['T1 — tuần 1–12 (hình thành cơ quan)', 'Tuần 3–4: ống thần kinh (mầm não-tủy sống) bắt đầu hình thành, đóng kín ~ngày 28 sau thụ thai; tim bắt đầu đập ~tuần 4; tuần 8: gần như toàn bộ cơ quan chính đã hình thành; tuần 12: cơ-thần kinh phối hợp (nắm tay), dài ~7,5 cm, nặng ~28 g', 'Folate 400 mcg (phòng dị tật ống thần kinh — quan trọng nhất 4 tuần đầu), i-ốt (thai phụ thuộc hoàn toàn hormone giáp mẹ trước tuần 12–14), kẽm (phân chia tế bào), B12'],
              ['T2 — tuần 13–28 (phân chia neuron)', 'Tuần 16: hệ cơ-xương, bé mút tay; tuần 20: nghe được, nuốt, phủ lông tơ/vernix; tuần 23–24: gần như toàn bộ neuron đã hình thành (~100 tỷ); tuần 24: tủy xương tạo máu, vị giác, phổi hình thành (chưa hoạt động), dài ~30 cm, nặng ~0,7 kg', 'Sắt (khối lượng máu mẹ tăng, tạo hemoglobin), protein +25 g/ngày, canxi 1.000 mg (xương cốt hóa), DHA ≥200 mg (màng tế bào thần kinh), kẽm'],
              ['T3 — tuần 29–40 (tăng trưởng & dự trữ)', 'Tuần 32: xương đã hình thành đầy đủ (còn mềm), cơ thể bé bắt đầu tích trữ khoáng (sắt, canxi), phổi tập thở, mắt mở/nhạy cảm ánh sáng, tăng ~0,23 kg/tuần; tuần 36: mỡ dưới da tăng; tuần 39: đủ tháng, các cơ quan sẵn sàng hoạt động độc lập', 'DHA (não tích lũy nhanh nhất), sắt (dự trữ cho 6 tháng đầu đời), canxi (cốt hóa), chất xơ + nước (chống táo bón)'],
            ],
          },
          {
            kind: 'warn',
            text: 'Lưu ý mốc não: toàn bộ neuron hình thành trước ~tuần 24, nhưng kết nối (synapse) và myelin hóa diễn ra mạnh nhất từ giai đoạn bào thai muộn (24–42 tuần) kéo dài đến 2 tuổi — đây là lý do dinh dưỡng 3 tháng cuối và 2 năm đầu đặc biệt quan trọng với não bộ.',
          },
        ],
      },
      {
        heading: 'Vi chất trọng điểm cho não / thị giác / sinh trưởng',
        blocks: [
          {
            kind: 'p',
            text: 'Tám vi chất được nghiên cứu nhiều nhất về dinh dưỡng mẹ → não thai/trẻ. Dưới đây là vai trò cụ thể trong phát triển (không lặp bảng nhu cầu/liều/UL — xem trang Dinh dưỡng tuần):',
          },
          {
            kind: 'table',
            headers: ['Vi chất', 'Vai trò cụ thể trong phát triển', 'Giai đoạn nhạy cảm nhất', 'Ghi chú thực hành cho mẹ Việt'],
            rows: [
              ['DHA / omega-3', 'Thành phần chính của màng tế bào thần kinh và võng mạc; nhu cầu cao nhất ở T3 khi não tích lũy DHA nhanh nhất và tiếp tục đến 2 tuổi; nồng độ DHA của thai thường cao hơn mẹ (ưu tiên chuyển sang con)', 'T3 (tích lũy nhanh nhất) → cho con bú', '2 phần cá béo/tuần (cá thu, cá hồi, cá mòi, cá cơm) hoặc viên DHA 200–300 mg; người chay dùng DHA tảo'],
              ['Choline', 'Tiền chất acetylcholine (dẫn truyền thần kinh), cấu tạo màng tế bào và myelin, tham gia methyl hóa DNA; cùng folate giảm nguy cơ dị tật ống thần kinh; nguy cơ giảm rõ nhất khi trước thụ thai ăn đủ phối hợp choline + methionine + betaine', 'Toàn thai kỳ, đặc biệt T3 não phát triển vượt bậc', '2 quả trứng/ngày ≈ 65% nhu cầu 450 mg; đa số phụ nữ (cả thế giới) không đạt AI; viên tiền sản thường thiếu choline'],
              ['Sắt', 'Hỗ trợ chuyển hóa năng lượng của neuron, hình thành dendrite-synapse, tổng hợp chất dẫn truyền thần kinh, khởi đầu myelin hóa; thiếu sắt tiền sản → tổn thương thần kinh có thể không hồi phục; thai tích trữ sắt chủ yếu ở T3', 'T3 (tích lũy sắt cao nhất)', 'Bổ sung từ trước thụ thai đến khi cho con bú; nghiên cứu Thụy Điển (~500.000 trẻ) ghi nhận thiếu máu mẹ trong 30 tuần đầu liên quan tăng tỷ lệ tự kỷ (ASD), ADHD, khuyết tật trí tuệ'],
              ['I-ốt', 'Nguyên liệu hormone tuyến giáp (T3/T4) — điều khiển phát triển não bộ: sinh thần kinh, di chuyển neuron; tuyến giáp thai chỉ hoạt động từ ~tuần 12–14, trước đó thai phụ thuộc hoàn toàn hormone giáp mẹ', 'Trước thụ thai + T1 (quan trọng nhất)', 'Thiếu nặng đầu thai kỳ → đần độn bẩm sinh (cretinism); điều trị i-ốt trước mang thai/đầu T1 cải thiện ~11 điểm IQ; ở VN dùng muối i-ốt hằng ngày + viên tiền sản 150 mcg'],
              ['Kẽm', 'Phân chia tế bào, tổng hợp DNA/protein — nền tảng sinh trưởng mọi mô; thiếu → chậm tăng trưởng, nhẹ cân, sinh non', 'Cả thai kỳ', 'Thịt nạc, hàu, tôm, đậu đen, lạc; VN tỷ lệ thiếu kẽm thai phụ rất cao (63–80%)'],
              ['Folate', 'Tổng hợp DNA, phân chia tế bào; ống thần kinh đóng kín ~ngày 28 sau thụ thai; đủ folate trước + đầu thai kỳ giảm 50–70% dị tật ống thần kinh', 'Trước thụ thai → hết tuần 12', 'Bổ sung 400 mcg/ngày từ ≥1 tháng trước thụ thai (chi tiết xem trang Dinh dưỡng tuần)'],
              ['Vitamin B12', 'Tạo máu, tổng hợp myelin, phát triển ống thần kinh; thiếu B12 (kể cả khi folate đủ) liên quan dị tật ống thần kinh, chậm phát triển thần kinh', 'Cả thai kỳ; tích trữ ở gan T2–T3', 'Mẹ ăn chay/thuần chay bắt buộc bổ sung B12'],
              ['Vitamin D', 'Tăng hấp thu canxi → gián tiếp quyết định xương/răng; thiếu → giảm canxi máu sơ sinh, còi xương bẩm sinh; bằng chứng gợi ý liên quan hen/dị ứng, nhẹ cân', 'Cả thai kỳ, nhất là T3 (canxi hấp thu cao nhất)', 'Bổ sung 400–600 IU/ngày + phơi nắng sáng sớm (VN ít phơi nắng nên thiếu phổ biến)'],
            ],
          },
          {
            kind: 'p',
            text: 'Nguyên tắc "đúng thời điểm" (timing): tác hại của thiếu vi chất phụ thuộc thời điểm, mức độ và thời gian kéo dài. Não đặc biệt dễ tổn thương khi thiếu dinh dưỡng trong khoảng tuần 24–42 (giai đoạn synapse hóa + myelin hóa). Một số vi chất cần đủ trước khi biết mình có thai (folate, i-ốt) vì giai đoạn nhạy cảm diễn ra rất sớm — lý do chuẩn bị tiền thụ thai quan trọng.',
          },
          {
            kind: 'warn',
            text: 'Liên hệ thiếu máu mẹ ↔ tự kỷ/ADHD là kết quả nghiên cứu đoàn hệ quan sát (Thụy Điển, >500.000 trẻ) — bằng chứng "liên quan" (association), không phải nguyên nhân trực tiếp. Không tự chẩn đoán.',
          },
        ],
      },
      {
        heading: 'Tăng cân mẹ theo BMI → cân nặng sơ sinh',
        blocks: [
          {
            kind: 'p',
            text: 'Chuẩn tăng cân theo IOM 2009 / ACOG áp dụng (bảng chi tiết theo tuần xem trang Dinh dưỡng tuần):',
          },
          {
            kind: 'table',
            headers: ['BMI trước thai kỳ', 'Tổng tăng cân thai kỳ'],
            rows: [
              ['Thiếu cân <18,5', '12,5–18 kg'],
              ['Bình thường 18,5–24,9', '11,5–16 kg'],
              ['Thừa cân 25–29,9', '7–11,5 kg'],
              ['Béo phì ≥30', '5–9 kg'],
            ],
          },
          {
            kind: 'p',
            text: 'T1 chỉ tăng 0,5–2 kg (có thể không tăng, thậm chí giảm nhẹ do ốm nghén); từ T2 tăng đều theo tốc độ trên. ACOG không khuyến nghị giảm cân trong thai kỳ dù BMI cao.',
          },
          {
            kind: 'p',
            text: 'Ảnh hưởng đến cân nặng sơ sinh — quan hệ hình chữ U:',
          },
          {
            kind: 'list',
            items: [
              'Tăng cân quá ít (dưới khuyến nghị) → tăng nguy cơ sinh non, nhẹ cân (LBW), nhỏ so với tuổi thai (SGA)/chậm tăng trưởng trong tử cung (IUGR). Ví dụ đoàn hệ Malaysia: tăng cân không đủ liên quan SGA với aOR ~4,26 (ngưỡng BMI Tây) / aOR 3,55 (ngưỡng BMI châu Á).',
              'Tăng cân quá nhiều (trên khuyến nghị) → tăng nguy cơ thai to (macrosomia ≥4.000 g), lớn so với tuổi thai (LGA), mổ lấy thai, tiểu đường thai kỳ, tăng huyết áp thai kỳ. Ví dụ: tăng cân quá mức liên quan macrosomia với aOR ~8,65 (đoàn hệ Malaysia); nghiên cứu Vienna (11.755 ca) cho thấy tăng trên mức khuyến nghị làm tăng cân nặng, chiều dài và vòng đầu sơ sinh.',
            ],
          },
          {
            kind: 'warn',
            text: 'AOR macrosomia 8,65 / SGA 4,26 là từ một đoàn hệ nhỏ ở Malaysia (2022) — dùng làm ví dụ minh họa xu hướng chữ U, không phải chuẩn tuyệt đối.',
          },
          {
            kind: 'p',
            text: 'Khái niệm cho app: FGR = ước tính cân nặng thai < bách phân vị thứ 10 theo tuổi thai (ACOG Practice Bulletin 227). Nguyên nhân gồm dinh dưỡng mẹ kém, suy giảm tưới máu nhau thai, bệnh lý mẹ (tăng huyết áp, tiểu đường, bệnh thận), nhiễm trùng, thuốc lá/rượu, dị tật bẩm sinh. ACOG lưu ý không khuyến nghị chiến lược bổ sung dinh dưỡng đặc biệt để "phòng" FGR ở thai kỳ khỏe mạnh — ưu tiên là đảm bảo dinh dưỡng nền đầy đủ + xử lý yếu tố nguy cơ (bỏ thuốc lá, kiểm soát bệnh nền, theo dõi siêu âm).',
          },
          {
            kind: 'warn',
            text: 'Ghi chú cho mẹ Việt: ngưỡng BMI châu Á khác chuẩn Tây (nhiều phụ nữ châu Á thuộc nhóm "béo phì" ở BMI thấp hơn); các nghiên cứu gợi ý cần khuyến nghị riêng theo dân tộc — hiện VN chưa có bảng chuẩn riêng, nên theo dõi xu hướng và cá thể hóa theo tư vấn bác sĩ.',
          },
        ],
      },
      {
        heading: '3 tháng cuối — chuẩn bị "dự trữ" cho bé',
        blocks: [
          {
            kind: 'p',
            text: '3 tháng cuối là giai đoạn thai nhi tăng trọng nhanh nhất và tích lũy "kho dự trữ" cho những tháng đầu sau sinh (sữa mẹ vốn ít sắt, DHA, canxi):',
          },
          {
            kind: 'table',
            headers: ['Dự trữ của bé', 'Vai trò & thời điểm', 'Hành động cho mẹ (chi tiết liều xem trang Dinh dưỡng tuần)'],
            rows: [
              ['Sắt', 'Thai tích lũy sắt cao nhất T3 (đỉnh ~tuần 30–36), dự trữ trong gan để dùng ~6 tháng đầu đời khi sữa mẹ ít sắt; máu mẹ đạt đỉnh ~tuần 34', 'Duy trì sắt 27–45 mg/ngày (WHO vùng thiếu máu: 30–60 mg); ăn kèm vitamin C, cách xa canxi/trà/cà phê'],
              ['DHA / omega-3', 'Não và võng mạc tích lũy DHA nhanh nhất T3, tiếp tục đến 2 tuổi', '2 phần cá béo/tuần hoặc DHA 200–300 mg/ngày'],
              ['Canxi', 'Thai hấp thu canxi mạnh nhất T3 để cốt hóa xương; nếu mẹ ăn thiếu, cơ thể lấy canxi từ xương mẹ', '1.000 mg/ngày (sữa, sữa chua, đậu phụ, cá kho ăn cả xương); chia ≤500 mg/lần'],
              ['Vitamin D', 'Hỗ trợ hấp thu canxi; mẹ thiếu → con sinh ra thiếu', '400–600 IU/ngày + phơi nắng sáng sớm'],
              ['Vitamin B12', 'Tích trữ ở gan thai chủ yếu T2–T3 — nguồn dự trữ cho con', 'Mẹ chay/thuần chay bắt buộc bổ sung B12'],
            ],
          },
          {
            kind: 'p',
            text: 'Vì tử cung chèn ép dạ dày cuối thai kỳ, mẹ nên ăn ít hơn mỗi bữa nhưng tăng số bữa; đủ nước và chất xơ để giảm táo bón/trĩ (xem KB dinh dưỡng).',
          },
        ],
      },
      {
        heading: 'Chuẩn bị cho trẻ sơ sinh khỏe mạnh',
        blocks: [
          {
            kind: 'p',
            text: 'Trẻ sơ sinh ra đời "mang theo" lượng dự trữ vi chất nhận từ mẹ trong thai kỳ — đây chính là cầu nối giữa dinh dưỡng thai kỳ và 6 tháng đầu bú mẹ:',
          },
          {
            kind: 'list',
            items: [
              'Sắt: bé sinh đủ tháng, mẹ không thiếu sắt → có dự trữ sắt đủ dùng ~6 tháng đầu đời (sữa mẹ chỉ cung cấp một lượng nhỏ sắt). Trẻ sinh non hoặc nhẹ cân có dự trữ sắt ít hơn → nguy cơ thiếu sắt sớm; các bé này thường được theo dõi/bổ sung sắt theo chỉ định bác sĩ. Ngược lại, thiếu sắt mẹ khi mang thai làm giảm dự trữ của con ngay từ khi sinh.',
              'Vitamin B12: thai tích trữ B12 ở gan suốt thai kỳ; mẹ thiếu B12 (đặc biệt ăn chay không bổ sung) → con sinh ra dự trữ B12 thấp, nguy cơ thiếu máu/chậm phát triển thần kinh trong những tháng đầu.',
              'Vitamin D: thai nhận toàn bộ vitamin D từ mẹ; mẹ thiếu → con sinh ra thiếu vitamin D, nguy cơ giảm canxi máu sơ sinh. Sau sinh, sữa mẹ cũng ít vitamin D → hầu hết trẻ bú mẹ cần bổ sung vitamin D (theo khuyến nghị nơi mẹ sống).',
              'DHA: tích lũy ở não/võng mạc từ T3 tiếp tục qua 2 năm đầu; mẹ cho con bú nên duy trì ăn cá béo/bổ sung DHA để sữa giàu DHA.',
            ],
          },
          {
            kind: 'warn',
            text: 'Dinh dưỡng 3 tháng cuối không chỉ vì mẹ — nó quyết định "kho dự trữ" mà bé mang theo khi chào đời, nền tảng cho sức khỏe vài tháng đầu đời.',
          },
        ],
      },
      {
        heading: 'Tầm soát thiếu máu mẹ cuối thai kỳ',
        blocks: [
          {
            kind: 'p',
            text: 'Vì sao cần tầm soát: thiếu máu mẹ cuối thai kỳ làm giảm dự trữ sắt của con, tăng nguy cơ sinh non, nhẹ cân, băng huyết khi sinh; bằng chứng gần đây cho thấy thiếu máu mẹ trong thai kỳ liên quan tăng nguy cơ rối loạn phát triển thần kinh ở con (tự kỷ, ADHD, khuyết tật trí tuệ — nghiên cứu đoàn hệ Thụy Điển ~500.000 trẻ).',
          },
          {
            kind: 'list',
            items: [
              'Chẩn đoán thiếu máu: xét nghiệm công thức máu; khi không có, dùng máy đo hemoglobin tại chỗ. Ngưỡng: Hb < 110 g/L ở T1 và T3; < 105 g/L ở T2.',
              'Dự phòng phổ cập: bổ sung sắt 30–60 mg + axit folic 400 mcg mỗi ngày cho TẤT CẢ thai phụ để giảm thiếu máu mẹ, nhiễm trùng hậu sản, nhẹ cân và sinh non. Ở nơi tỷ lệ thiếu máu thai phụ ≥40%, ưu tiên liều 60 mg sắt/ngày. (Việt Nam: tỷ lệ thiếu máu thai phụ 37–50% → thuộc vùng cần liều cao hơn.)',
              'Điều trị khi đã thiếu máu: tăng sắt lên 120 mg/ngày cho đến khi Hb trở lại bình thường (≥110 g/L), sau đó quay về liều dự phòng 30–60 mg. Liều điều trị chỉ theo chỉ định của bác sĩ (vượt giới hạn an toàn UL).',
              'Khi không dung nạp sắt hằng ngày: có thể dùng chế độ sắt 120 mg + folate 2,8 mg mỗi tuần 1 lần — nhưng chỉ ở nơi tỷ lệ thiếu máu <20% và phải xác nhận không thiếu máu trước khi bắt đầu.',
            ],
          },
          {
            kind: 'warn',
            text: 'Bổ sung sắt 120 mg/ngày (điều trị) và 30–60 mg (dự phòng) là chuẩn WHO; nhưng 60–120 mg vượt UL 45 mg của NIH/IOM — chỉ dùng khi bác sĩ chỉ định. Không tự ý uống sắt liều cao khi chưa có chỉ định.',
          },
          {
            kind: 'p',
            text: 'Hàm ý cho app: nhắc mẹ xét nghiệm máu trong lần khám thai đầu và cuối thai kỳ; dùng sắt kèm vitamin C, cách xa sữa/trà/cà phê (tương tác xem KB dinh dưỡng).',
          },
        ],
      },
      {
        heading: 'Nguồn tham khảo',
        blocks: [
          {
            kind: 'sources',
            sources: [
              { org: "Office on Women's Health (HHS)", title: 'Stages of pregnancy', url: 'https://womenshealth.gov/pregnancy/youre-pregnant-now-what/stages-pregnancy' },
              { org: 'ACOG', title: 'Nutrition During Pregnancy', url: 'https://www.acog.org/womens-health/faqs/nutrition-during-pregnancy' },
              { org: 'Nestlé Nutrition Institute / Karger', title: 'Nutritional Factors in Fetal and Infant Brain Development', url: 'https://www.nestlenutrition-institute.org/annales-77.2---young-brain-big-appetite/nutritional-factors-in-fetal-and-infant-brain-development' },
              { org: 'BMC Pregnancy and Childbirth', title: 'International expert consensus on micronutrient supplement use during the early life course (2024)', url: 'https://link.springer.com/article/10.1186/s12884-024-07123-5' },
              { org: 'Harvard T.H. Chan School of Public Health', title: 'Choline', url: 'https://nutritionsource.hsph.harvard.edu/choline/' },
              { org: 'NIH/ODS', title: 'Iron', url: 'https://ods.od.nih.gov/factsheets/Iron-HealthProfessional/' },
              { org: 'NIH/ODS', title: 'Iodine', url: 'https://ods.od.nih.gov/factsheets/Iodine-HealthProfessional/' },
              { org: 'NIH/ODS', title: 'Vitamin B12', url: 'https://ods.od.nih.gov/factsheets/VitaminB12-HealthProfessional/' },
              { org: 'NIH/ODS', title: 'Folate', url: 'https://ods.od.nih.gov/factsheets/Folate-HealthProfessional/' },
              { org: 'ACOG', title: 'Ask ACOG: How much weight should I gain during pregnancy?', url: 'https://www.acog.org/en/womens-health/experts-and-stories/ask-acog/how-much-weight-should-i-gain-during-pregnancy' },
              { org: 'IOM/NASEM', title: 'Weight Gain During Pregnancy: Reexamining the Guidelines (2009)', url: 'https://www.ncbi.nlm.nih.gov/books/NBK32801/table/ch7.t1/' },
              { org: 'PMC', title: 'Gestational Weight Gain among Healthy Pregnant Women from Asia in Comparison with IOM Guidelines-2009 (2019)', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6421048/' },
              { org: 'PMC', title: 'Impact of Gestational Weight Gain according to 2009 IOM Recommendations on Neonatal Anthropometrics in Asians (Malaysia, 2022)', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9625168/' },
              { org: 'PMC', title: 'The Impact of Higher Than Recommended Gestational Weight Gain on Fetal Growth and Perinatal Risk Factors (2024)', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10887580/' },
              { org: 'ACOG', title: 'Practice Bulletin No. 227 — Fetal Growth Restriction (2021)', url: 'https://pubmed.ncbi.nlm.nih.gov/33481528/' },
              { org: 'WHO eLENA', title: 'Daily iron and folic acid supplementation during pregnancy', url: 'https://www.who.int/tools/elena/interventions/daily-iron-pregnancy' },
              { org: 'WHO', title: 'Antenatal care for a positive pregnancy experience (2016)', url: 'https://www.who.int/publications/i/item/9789241549912' },
            ],
          },
        ],
      },
    ],
  },
]
