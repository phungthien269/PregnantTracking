import type { KnowledgeTopic } from './types'

// Dinh dưỡng trẻ sơ sinh → 24 tháng (0–6, 6–12, 12–24).
// Nguồn: orchestration/docs/development-nutrition-infant-0-24mo.md (WHO · AAP · CDC · NHS · NIAID · Bộ Y tế VN…).
export const topics: KnowledgeTopic[] = [
  {
    slug: 'dinh-duong-be-0-6-thang',
    title: 'Dinh dưỡng bé 0–6 tháng',
    emoji: '🍼',
    phases: ['infant'],
    ageRange: 'Bé 0–6 tháng',
    summary:
      'Bú mẹ hoàn toàn trong 6 tháng đầu là nền tảng dinh dưỡng và miễn dịch tốt nhất cho bé; kèm bổ sung vitamin K, vitamin D và sắt theo khuyến nghị để phòng thiếu hụt.',
    sections: [
      {
        heading: 'Bú mẹ hoàn toàn 6 tháng đầu',
        blocks: [
          {
            kind: 'p',
            text: 'Bú mẹ hoàn toàn (chỉ sữa mẹ, không nước/thức ăn khác; thuốc, vitamin, dung dịch bù nước vẫn được phép) trong 6 tháng đầu (180 ngày), sau đó tiếp tục bú mẹ kèm ăn bổ sung đến 24 tháng/2 tuổi trở lên theo mong muốn của mẹ và bé. WHO, AAP, UNICEF, CDC, NHS và Bộ Y tế VN đồng thuận khuyến nghị này.',
          },
          {
            kind: 'list',
            items: [
              'Giảm nhiễm trùng: bú mẹ giảm ~64% nhiễm trùng tiêu hóa không đặc hiệu; bú mẹ hoàn toàn >4 tháng giảm ~72% nguy cơ nhập viện do nhiễm trùng hô hấp dưới.',
              'Giảm nguy cơ béo phì sau này: bú mẹ bất kỳ giảm ~15–30% béo phì ở trẻ vị thành niên/người lớn; mỗi tháng bú mẹ giảm thêm ~4% nguy cơ.',
              'Giảm nguy cơ đột tử ở trẻ (SIDS): bú sữa mẹ dù chỉ 2 tháng giảm ~50% nguy cơ SIDS.',
              'Giảm nguy cơ nhiễm trùng tai, hô hấp, tiêu chảy; giảm nguy cơ hen suyễn, chàm, tiểu đường type 1/2, bệnh bạch cầu trẻ em (~21%); hỗ trợ phát triển nhận thức.',
            ],
          },
          {
            kind: 'p',
            text: 'Ghi chú: các con số % là kết quả tổng hợp dịch tễ (quan sát), không phải quan hệ nhân quả tuyệt đối; dùng để truyền thông lợi ích, không phải lời hứa y khoa.',
          },
        ],
      },
      {
        heading: 'Tần suất bú & dấu hiệu bú đủ',
        blocks: [
          {
            kind: 'p',
            text: 'Trẻ sơ sinh thường bú 8–12 lần/24 giờ, kể cả ban đêm; cho bú theo nhu cầu (khi bé có dấu hiệu đói: há miệng, tìm vú, mút tay). Sữa mẹ tiêu hóa nhanh (~1 giờ) và dạ dày bé nhỏ nên bú dày là bình thường.',
          },
          {
            kind: 'p',
            text: 'Bú cụm (cluster feeding): bé bú liên tiếp từng cữ gần nhau (30 phút – 1 giờ, thường chiều/tối) trong vài tuần đầu và lúc nhảy tăng trưởng (2–3 tuần, 6 tuần, 3 tháng, 6 tháng) — không phải dấu hiệu thiếu sữa; đó là cách bé "đặt hàng" sữa về cho mẹ. Nếu bé ngủ quá 3–4 giờ không đòi bú trong những tuần đầu, nên đánh thức bé bú.',
          },
          {
            kind: 'p',
            text: 'Dấu hiệu bé bú ĐỦ:',
          },
          {
            kind: 'list',
            items: [
              'Tã ướt: từ ngày thứ 5–6 ≥6 tã ướt/ngày, nước tiểu vàng nhạt.',
              'Đi ngoài: ngày thứ 5–6 phân chuyển vàng, lỏng, ≥2 lần/ngày trong tuần đầu.',
              'Bé tỉnh táo, hài lòng sau bú, có tiếng nuốt khi sữa về; ngực mẹ mềm hơn sau cữ bú.',
              'Tăng cân đúng chuẩn — là dấu hiệu đáng tin cậy nhất.',
            ],
          },
          {
            kind: 'p',
            text: 'Tăng cân chuẩn (WHO growth velocity, trẻ đủ tháng): bé có thể sụt cân sinh lý trong vài ngày đầu (≤7–10% cân nặng sơ sinh), về lại cân sinh trong 10–14 ngày. 0–3 tháng: tăng ~25–35 g/ngày (~150–200 g/tuần, ~750–900 g/tháng). 3–6 tháng: tăng ~15–20 g/ngày (~100–150 g/tuần, ~500–600 g/tháng). Quy tắc chung: trẻ đủ tháng gấp đôi cân sinh lúc ~4 tháng, gấp ba lúc ~1 tuổi.',
          },
        ],
      },
      {
        heading: 'Bổ sung cho bé sơ sinh: vitamin K, vitamin D, sắt',
        blocks: [
          {
            kind: 'p',
            text: 'Vitamin K — tiêm dự phòng chảy máu (VKDB): trẻ sơ sinh sinh ra rất ít vitamin K (không qua nhau thai nhiều; sữa mẹ nghèo vitamin K; ruột chưa có vi khuẩn tổng hợp). Thiếu vitamin K → nguy cơ xuất huyết do thiếu vitamin K (VKDB), có thể chảy máu não/ruột/tuần hoàn, tử vong 20–50% ở thể muộn (1 tuần – 6 tháng).',
          },
          {
            kind: 'p',
            text: 'AAP khuyến nghị tiêm bắp 1 mg vitamin K cho mọi trẻ sơ sinh trong vòng 6 giờ sau sinh (trẻ <1500 g: 0,3–0,5 mg/kg). Trẻ không tiêm có nguy cơ VKDB cao hơn ~81 lần. Không khuyến nghị đường uống (hấp thu không ổn định, kém hiệu quả với thể muộn). Tại Việt Nam, tiêm vitamin K cho trẻ sơ sinh là thực hành thường quy tại các cơ sở y tế.',
          },
          {
            kind: 'p',
            text: 'Vitamin D — bổ sung cho trẻ bú mẹ: sữa mẹ nghèo vitamin D (kể cả khi mẹ bổ sung) → trẻ bú mẹ hoàn toàn có nguy cơ thiếu vitamin D, còi xương.',
          },
          {
            kind: 'p',
            text: 'AAP/CDC/Hội Nhi Canada/ESPGHAN: bổ sung 400 IU/ngày cho mọi trẻ bú mẹ hoàn toàn hoặc một phần, bắt đầu từ những ngày đầu sau sinh, duy trì đến khi bé uống đủ ≥1 lít/ngày sữa công thức tăng cường vitamin D hoặc sữa bò nguyên kem (sau 12 tháng). Trẻ bú sữa công thức ≥1 lít/ngày thường không cần bổ sung thêm.',
          },
          {
            kind: 'p',
            text: 'Ghi chú chênh lệch VN: "Nhu cầu dinh dưỡng khuyến nghị" của Viện Dinh dưỡng/Bộ Y tế (Thông tư 43/2014/TT-BYT) ghi 5 µg (~200 IU)/ngày cho trẻ em — mức này là nhu cầu tối thiểu (RDA), thấp hơn liều bổ sung 400 IU của khuyến nghị quốc tế cho trẻ bú mẹ hoàn toàn. Chuẩn app theo quốc tế 400 IU/ngày cho trẻ bú mẹ hoàn toàn (an toàn, thấp hơn nhiều giới hạn trên UL 25–38 µg/ngày của VN), ghi chú thêm mức RDA của VN.',
          },
          {
            kind: 'p',
            text: 'Sắt — thời điểm và ai cần: trẻ đủ tháng, cân nặng bình thường có dự trữ sắt từ khi sinh (tích lũy ở 3 tháng cuối thai kỳ, ~25% tổng sắt cơ thể) — trong 6 tháng đầu, trẻ bú mẹ hoàn toàn thường KHÔNG cần bổ sung sắt nếu mẹ đủ sắt, đủ tháng, kẹp dây rốn muộn (trì hoãn kẹp ~2 phút giúp tăng ~33% lượng sắt dự trữ).',
          },
          {
            kind: 'p',
            text: 'Từ sau 6 tháng, dự trữ cạn dần + nhu cầu tăng cao (6–24 tháng là giai đoạn nhu cầu sắt/kg cao nhất đời) → cần bổ sung qua thức ăn giàu sắt.',
          },
          {
            kind: 'p',
            text: 'Hướng dẫn AAP mới (2026): trẻ bú mẹ hoàn toàn đủ tháng nên bổ sung sắt 1 mg/kg/ngày bắt đầu lúc 4 tháng (hoặc chậm nhất 6 tháng khi ăn dặm với thức ăn giàu sắt); trẻ sinh non (<37 tuần): bắt đầu bổ sung/ăn sữa tăng sắt 2–3 mg/kg/ngày từ 2 tuần tuổi. Trẻ không bú mẹ: dùng sữa công thức tăng sắt trong 12 tháng đầu.',
          },
          {
            kind: 'p',
            text: 'Tầm soát thiếu máu (AAP 2026): tầm soát toàn dân bằng CBC + ferritin — trẻ bú mẹ chính: lúc 9–12 tháng; trẻ bú công thức chính: lúc 15–18 tháng (sau khi chuyển sữa bò).',
          },
        ],
      },
      {
        heading: 'Sữa công thức: khi nào cần, cách chọn, pha chế & an toàn',
        blocks: [
          {
            kind: 'p',
            text: 'Khi nào cần: khi mẹ không thể bú (lý do y khoa, mẹ dùng thuốc chống chỉ định, tách mẹ–con), sữa mẹ không đủ dù đã hỗ trợ, hoặc theo lựa chọn của gia đình. Sữa mẹ vẫn là lựa chọn tối ưu; cần hỗ trợ vắt sữa/tư vấn nuôi con bằng sữa mẹ trước khi quyết định.',
          },
          {
            kind: 'p',
            text: 'Chọn loại: sữa công thức first infant formula (tăng sắt) là đủ cho cả năm đầu (NHS: không cần follow-on/growing-up milk); luôn chọn sữa tăng sắt cho 12 tháng đầu (AAP). Sữa bò tươi/uống không thay thế được trong năm đầu.',
          },
          {
            kind: 'p',
            text: 'Cách pha ĐÚNG & an toàn (CDC/FDA/AAP):',
          },
          {
            kind: 'list',
            items: [
              'Đong nước trước, đổ bột sau, đúng tỉ lệ muỗng/nước ghi trên hộp, chỉ dùng muỗng gạt đi kèm hộp sữa.',
              'Với trẻ <3 tháng, sinh non, hoặc suy giảm miễn dịch: dùng nước đun sôi để nguội còn ≥70°C pha để diệt vi khuẩn (Cronobacter) có thể có trong bột, sau đó làm nguội tới nhiệt độ bú.',
              'Sữa pha xong dùng trong 2 giờ; đã bú dở bỏ sau 1 giờ; bảo quản lạnh dùng trong 24 giờ. Không hâm bằng lò vi sóng (dễ bỏng, sóng nhiệt không đều).',
              'Không tự chế sữa công thức tại nhà (FDA cảnh báo: thiếu chất, nguy cơ nhiễm khuẩn); vệ sinh tay + dụng cụ sạch.',
              'Có thể trộn sữa mẹ + công thức trong ngày, nhưng pha từng cữ theo hướng dẫn.',
            ],
          },
          {
            kind: 'warn',
            text: 'Tuyệt đối không pha loãng hay đặc hơn hướng dẫn trên hộp: pha loãng → bé không đủ dinh dưỡng, nguy cơ ngộ độc nước (water intoxication) gây co giật; pha đặc → quá tải thận, mất nước.',
          },
        ],
      },
      {
        heading: 'Dấu hiệu bé không đủ sữa / cần gặp bác sĩ',
        blocks: [
          {
            kind: 'list',
            items: [
              'Tăng cân kém: chưa về lại cân sinh sau 2 tuần; tăng <150–200 g/tuần trong 2–3 tháng đầu; tụt >1 kênh phần trăm trên biểu đồ tăng trưởng.',
              'Sụt cân quá mức: mất >7–10% cân nặng sơ sinh.',
              'Ít tã ướt: sau tuần đầu <6 tã ướt/ngày, nước tiểu vàng đậm, có vết "gạch đỏ" (tinh thể urate).',
              'Mất nước: miệng/lưỡi khô, thóp trũng, lừ đừ ngủ li bì, khóc không nước mắt (sau ~4 tháng), tay chân lạnh.',
              'Bú bất thường: cữ bú luôn quá ngắn (<10 phút) hoặc quá dài (>50 phút), không nghe tiếng nuốt khi sữa về, ngậm tụt vú liên tục, bú <8 lần/ngày hoặc ngủ xuyên >4 giờ không đòi bú trong những tuần đầu.',
              'Vàng da kéo dài >2 tuần, đi ngoài phân vẫn đen (phân su) sau ngày 5–6, hoặc <2 lần đi ngoài/ngày cuối tuần đầu.',
              'Đau vú/núm vú nứt chảy máu kéo dài (ảnh hưởng việc cho bú).',
            ],
          },
          {
            kind: 'warn',
            text: 'Trường hợp KHẨN cấp: bé lừ đừ, xanh tái, thở nhanh, co giật → đưa bé đi cấp cứu ngay.',
          },
        ],
      },
      {
        heading: 'Nguồn tham khảo',
        blocks: [
          {
            kind: 'sources',
            sources: [
              { org: 'WHO', title: 'Breastfeeding Q&A', url: 'https://www.who.int/news-room/questions-and-answers/item/breastfeeding' },
              { org: 'AAP', title: 'Vitamin K: AAP Recommends', url: 'https://www.aap.org/en/news-room/fact-checked/vitamin-k-helps-prevent-dangerous-bleeding-disorders-in-newborns/' },
              { org: 'UNICEF', title: 'Early childhood nutrition', url: 'https://www.unicef.org/nutrition/early-childhood-nutrition' },
              { org: 'BDA', title: 'Breastfeeding (số liệu % lợi ích)', url: 'https://www.bda.uk.com/resource/breastfeeding.html' },
              { org: 'WHO', title: 'Child Growth Standards', url: 'https://www.who.int/tools/child-growth-standards' },
              { org: 'AAP/HealthyChildren', title: 'Warning Signs of Breastfeeding Problems', url: 'https://www.healthychildren.org/English/ages-stages/baby/breastfeeding/Pages/Warning-Signs-of-Breastfeeding-Problems.aspx' },
              { org: 'USDA WIC', title: 'Cluster Feeding and Growth Spurts', url: 'https://wicbreastfeeding.fns.usda.gov/cluster-feeding-and-growth-spurts' },
              { org: 'AboutKidsHealth (SickKids)', title: 'Growth in the first year', url: 'https://www.aboutkidshealth.ca/vi/healthaz/na/growth-in-the-first-year/' },
              { org: 'CDC', title: 'Vitamin K Deficiency Bleeding FAQ', url: 'https://www.cdc.gov/vitamin-k-deficiency/faq/index.html' },
              { org: 'CDC', title: 'Vitamin D and Breastfeeding', url: 'https://www.cdc.gov/breastfeeding-special-circumstances/hcp/diet-micronutrients/vitamin-d.html' },
              { org: 'Mayo Clinic', title: 'Vitamin D for babies', url: 'https://www.mayoclinic.org/healthy-lifestyle/infant-and-toddler-health/expert-answers/vitamin-d-for-babies/faq-20058161' },
              { org: 'AAP', title: 'Updated guidance on iron deficiency (2026)', url: 'https://www.aap.org/en/news-room/news-releases/aap/2026/american-academy-of-pediatrics-updates-guidance-on-prevention-screening-and-treatment-for-iron-deficiency-in-infants-children-and-teens/' },
              { org: 'PubMed', title: 'Iron and the exclusively breast-fed infant from birth to six months', url: 'https://pubmed.ncbi.nlm.nih.gov/4020573/' },
              { org: 'Viện Dinh dưỡng/Bộ Y tế VN', title: 'Nhu cầu dinh dưỡng khuyến nghị (Thông tư 43/2014/TT-BYT)', url: 'https://viendinhduong.vn' },
              { org: 'FDA', title: 'Infant Formula: Safety Do\'s and Don\'ts', url: 'https://www.fda.gov/consumers/consumer-updates/infant-formula-safety-dos-and-donts' },
              { org: 'CDC', title: 'Prepare and Store Powdered Infant Formula', url: 'https://archive.cdc.gov/www_cdc_gov/infant-feeding-emergencies-toolkit/php/powdered-infant-formula.html' },
              { org: 'NHS', title: 'Start4Life / Weaning', url: 'https://www.nhs.uk/start4life/weaning' },
              { org: 'AAP/HealthyChildren', title: 'How to Safely Prepare Formula With Water', url: 'https://www.healthychildren.org/English/ages-stages/baby/feeding-nutrition/Pages/How-To-Safely-Prepare-Formula-With-Water.aspx' },
              { org: 'Cleveland Clinic', title: 'Signs baby isn\'t getting enough milk', url: 'https://health.clevelandclinic.org/signs-baby-isnt-getting-enough-milk' },
              { org: 'NHS (Aneurin Bevan UHB)', title: 'Is my baby getting enough breast milk?', url: 'https://www.abbhealthiertogether.cymru.nhs.uk/pregnant-women/worried-your-baby-unwell-under-3-months-2/my-baby-getting-enough-breast-milk' },
            ],
          },
        ],
      },
    ],
  },

  {
    slug: 'dinh-duong-be-6-12-thang',
    title: 'Ăn dặm & dinh dưỡng bé 6–12 tháng',
    emoji: '🥣',
    phases: ['infant'],
    ageRange: 'Bé 6–12 tháng',
    summary:
      'Bắt đầu ăn dặm đúng 6 tháng với nguyên tắc từ loãng đến đặc, đủ 4 nhóm; tránh thực phẩm nguy hiểm (mật ong, sữa bò làm thức uống, muối/đường, cá thủy ngân cao) và giới thiệu dị nguyên sớm theo NIAID.',
    sections: [
      {
        heading: 'Thời điểm bắt đầu & dấu hiệu sẵn sàng',
        blocks: [
          {
            kind: 'p',
            text: 'Bắt đầu ăn bổ sung đúng 6 tháng (180 ngày) — WHO/AAP/UNICEF/Bộ Y tế VN (QĐ 318/QĐ-BYT 2026). KHÔNG sớm hơn 4 tháng — đồng thuận của ESPGHAN/AAP/WHO: "không cho ăn dặm trước 4 tháng, không trì hoãn quá 6 tháng".',
          },
          {
            kind: 'p',
            text: 'Dấu hiệu bé SẴN SÀNG (AAP/CDC):',
          },
          {
            kind: 'list',
            items: [
              'Ngồi vững hoặc ngồi có đỡ, giữ đầu thẳng.',
              'Há miệng khi đưa thức ăn tới; nhìn/nựng theo khi người lớn ăn.',
              'Biết chuyển thức ăn từ thìa vào họng để nuốt (hết phản xạ đẩy lưỡi), không đùn thức ăn ra.',
              'Cân nặng đạt ~gấp đôi cân sinh (thường ~4 tháng) và ≥~6 kg (13 lbs).',
            ],
          },
          {
            kind: 'p',
            text: 'Chú ý: các dấu hiệu "đòi bú dày", "nhìn người lớn ăn" ở bé 3–4 tháng thường là tò mò, chưa phải sẵn sàng ăn dặm — đừng nhầm.',
          },
        ],
      },
      {
        heading: 'Nguyên tắc ăn dặm: độ loãng/đặc, đủ 4 nhóm, sắt & kẽm',
        blocks: [
          {
            kind: 'p',
            text: 'Nguyên tắc chung (WHO + Bộ Y tế VN khớp nhau):',
          },
          {
            kind: 'list',
            items: [
              'Bắt đầu 1 món, từ loãng → đặc dần, từ ít → nhiều; cho bé làm quen từng loại thực phẩm.',
              'Mỗi bữa cần đủ 4 nhóm: bột đường – đạm – béo – vitamin/khoáng (QĐ 318/BYT).',
              'Thức ăn có mật độ năng lượng ≥0,8 kcal/g; nếu loãng quá phải tăng số bữa.',
              'Đa dạng thực phẩm: WHO/UNICEF khuyến nghị tối thiểu 5/8 nhóm thực phẩm mỗi ngày (8 nhóm: sữa mẹ; thịt/cá/gia cầm/gan; sữa/yaourt/phô mai; trứng; đậu/hạt; rau quả giàu vitamin A; rau quả khác; ngũ cốc/củ).',
              'Thực phẩm nguồn gốc động vật mỗi ngày (thịt, cá, trứng) — giàu sắt kẽm hấp thu tốt; WHO khuyến nghị thịt/cá/trứng hằng ngày.',
            ],
          },
          {
            kind: 'p',
            text: 'Số bữa & năng lượng từ ăn dặm (trẻ còn bú mẹ):',
          },
          {
            kind: 'table',
            headers: ['Tuổi', 'Bữa ăn dặm/ngày', 'Năng lượng từ ăn dặm'],
            rows: [
              ['6–8 tháng', '2–3 bữa', '~200 kcal/ngày'],
              ['9–11 tháng', '3–4 bữa + 1–2 bữa phụ', '~300 kcal/ngày'],
              ['12–23 tháng', '3–4 bữa + 1–2 bữa phụ', '~550 kcal/ngày'],
            ],
          },
          {
            kind: 'p',
            text: 'Trẻ không bú mẹ: năng lượng từ ăn dặm 600/700/900 kcal; 4–5 bữa + 1–2 bữa phụ.',
          },
          {
            kind: 'p',
            text: 'Sắt & kẽm (ưu tiên đặc biệt 6–12 tháng): bắt đầu với ngũ cốc tăng sắt + thịt nạc xay/nghiền — nguồn sắt heme hấp thu tốt. Kết hợp thực phẩm giàu vitamin C (rau quả) tăng hấp thu sắt. Gan dùng vừa phải (1–2 lần/tuần, lượng nhỏ) — giàu sắt, kẽm, vitamin A nhưng dễ thừa vitamin A nếu dùng nhiều. Trẻ bú mẹ hoàn toàn 6–12 tháng vẫn cần chú ý sắt từ thức ăn (dự trữ đã cạn); nếu không đủ, cân nhắc bổ sung 1 mg/kg/ngày theo bác sĩ.',
          },
        ],
      },
      {
        heading: 'Phương pháp: Ăn dặm truyền thống (nghiền) vs BLW',
        blocks: [
          {
            kind: 'list',
            items: [
              'Truyền thống (spoon-feeding puree/nghiền): mẹ đút thìa thức ăn nghiền mịn → tăng độ thô dần. Dễ kiểm soát lượng ăn, dễ đảm bảo đủ sắt/năng lượng.',
              'BLW — Baby-Led Weaning (bé tự chỉ huy): bé tự cầm thức ăn mềm, cắt miếng vừa tay, tự đưa vào miệng từ ~6 tháng. Khuyến khích tự điều chỉnh cảm giác no, phát triển kỹ năng nhai/vận động tinh.',
            ],
          },
          {
            kind: 'p',
            text: 'Bằng chứng so sánh: không có khác biệt có ý nghĩa thống kê về nguy cơ hóc giữa BLW và ăn nghiền (Brown 2018, n=1.151; tổng quan hệ thống 2024 — 7 nghiên cứu; RCT BLISS). Một số nghiên cứu thậm chí ghi nhóm đút thìa hóc nhiều hơn trên thức ăn miếng/ngón tay. Nguy cơ hóc liên quan cách cắt/chọn thực phẩm và mức quen của bé với độ thô hơn là phương pháp.',
          },
          {
            kind: 'p',
            text: 'An toàn — bắt buộc với MỌI phương pháp:',
          },
          {
            kind: 'list',
            items: [
              'Bé ≥6 tháng, ngồi thẳng (ghế cao), KHÔNG bao giờ để bé ăn một mình.',
              'Cắt thức ăn an toàn, tránh danh sách nguy cơ hóc.',
              'BLW cần chú ý đảm bảo sắt & năng lượng (dễ thiếu vì bé ăn ít); kết hợp linh hoạt (đút thìa + tự cầm) thường thực tế nhất.',
              'Không có khuyến nghị chính thức riêng cho BLW từ WHO/AAP; WHO khuyến nghị tiến trình: nghiền → miếng/ngón tay (~8 tháng) → ăn cùng gia đình (~12 tháng).',
            ],
          },
        ],
      },
      {
        heading: 'Thực phẩm cần tránh <12 tháng',
        blocks: [
          {
            kind: 'warn',
            text: 'Trước 12 tháng, tuyệt đối tránh: mật ong (nguy cơ ngộ độc botulism ở trẻ), sữa bò nguyên kem làm thức uống chính (nguy cơ thiếu máu thiếu sắt), muối/đường thêm, cá thủy ngân cao, và thực phẩm dễ hóc (xúc xích, nho nguyên quả, các loại hạt, kẹo cứng, bỏng ngô, cà rốt sống…).',
          },
          {
            kind: 'list',
            items: [
              'Mật ong — nguy cơ ngộ độc botulism: mật ong có thể chứa bào tử Clostridium botulinum; ruột trẻ <12 tháng chưa đủ trưởng thành để chặn bào tử phát triển → ngộ độc botulism ở trẻ (táo bón, lừ đừ, bú kém, khóc yếu, mất trương lực, suy hô hấp — cấp cứu). Pasteur hóa KHÔNG diệt được bào tử. Tránh tuyệt đối dưới 12 tháng (kể cả trong thức ăn, nước, pha sữa).',
              'Sữa bò nguyên kem làm thức uống chính — cấm <12 tháng: sữa bò thiếu sắt, vitamin E, axit béo thiết yếu; đạm/khoáng cao dễ kích ứng ruột → chảy máu tiêu hóa vi thể; cản trở hấp thu sắt. Dùng thay sữa mẹ/công thức → nguy cơ thiếu máu thiếu sắt cao. (Có thể dùng lượng nhỏ sữa bò trong chế biến thức ăn dặm từ 6 tháng — vd pha cháo — nhưng không làm thức uống chính.)',
              'Muối & đường thêm — tránh: muối — thận trẻ chưa hoàn thiện, không cần nêm muối; sữa mẹ/công thức + natri tự nhiên trong thức ăn đã đủ. Tránh nước mắm, bột canh, đồ hộp, xúc xích, nước chấm. Đường — AAP khuyến nghị tránh đường thêm cho trẻ <24 tháng (sâu răng, nghiện vị ngọt, thừa cân). Tránh nước ngọt, bánh kẹo, sữa có đường.',
              'Cá thủy ngân cao — tránh (FDA/EPA, áp cho trẻ nhỏ): không cho trẻ <11 tuổi: cá mập, cá kiếm, cá thu vua, tilefish (vịnh Mexico), cá ngừ mắt to, orange roughy, marlin. Cá ngừ trắng (albacore): chỉ 1 phần/tuần, không ăn thêm cá khác trong tuần (thủy ngân gấp ~3 lần cá ngừ sáng). Cá ngừ sáng đóng hộp, cá hồi, tôm, cá hồi vân nằm nhóm "tốt nhất", 2–3 phần/tuần. Khẩu phần trẻ 1–3 tuổi ~1 oz (~28 g).',
              'Nguy cơ hóc (AAP — tránh cho <4 tuổi, cắt nhỏ nếu cho): xúc xích/hot dog, nho nguyên quả, các loại hạt (lạc, hạt bí…), miếng thịt/cá to, kẹo cứng, bỏng ngô, nho khô, cà rốt sống, miếng phô mai to, bơ đậu phộng vón cục.',
            ],
          },
        ],
      },
      {
        heading: 'Nước cho bé & dị ứng thức ăn',
        blocks: [
          {
            kind: 'p',
            text: 'Nước theo tuổi (AAP — Recommended Drinks):',
          },
          {
            kind: 'list',
            items: [
              'Trước 6 tháng: KHÔNG cho uống nước (dạ dày bé đầy → giảm bú; nguy cơ mất cân bằng điện giải/ngộ độc nước).',
              '6–12 tháng: bắt đầu cho 4–8 oz (~120–240 ml) nước/ngày, uống bằng cốc có quai/hút (không bình sữa), chủ yếu để tập kỹ năng uống cốc, không thay thế sữa mẹ/công thức (vẫn là nguồn chính đến 12 tháng).',
              'Sau 12 tháng: tăng lượng nước lên, giữa các bữa ăn.',
            ],
          },
          {
            kind: 'p',
            text: 'Dị ứng thức ăn — giới thiệu sớm (khác biệt so với khuyến nghị cũ): khuyến nghị hiện hành là giới thiệu chất gây dị ứng SỚM (từ 4–6 tháng), không trì hoãn — trì hoãn sau 6 tháng KHÔNG giảm dị ứng, có thể tăng nguy cơ.',
          },
          {
            kind: 'list',
            items: [
              'Đậu phộng (NIAID 2017, dựa LEAP study): nguy cơ cao (chàm nặng, dị ứng trứng, hoặc cả hai) → giới thiệu đậu phộng 4–6 tháng, SAU khi khám và cân nhắc test dị ứng. Chàm nhẹ–vừa → giới thiệu ~6 tháng, không cần test trước. Không chàm, không dị ứng → giới thiệu tự do theo thói quen gia đình.',
              'LEAP: ăn đậu phộng sớm giảm 81% nguy cơ dị ứng đậu phộng ở trẻ nguy cơ cao.',
              'Trứng: giới thiệu trứng chín ~6 tháng (không trước 4 tháng), nghiền kỹ/trộn vào cháo. Hội đồng chuyên môn Mỹ (AAAAI/ACAAI/CSACI 2020): cả đậu phộng và trứng giới thiệu ~6 tháng, không trước 4 tháng, không bắt buộc test trước.',
              'Cách làm: giới thiệu một chất dị ứng một lần, cách 2–3 ngày; bắt đầu lượng nhỏ (đầu thìa), quan sát; tiếp tục ăn nhiều lần/tuần vài tháng (đậu phộng ~6 g protein/tuần ~ 2 thìa cà phê bơ đậu phộng pha loãng, 2–3 lần/tuần); cho khi bé khỏe.',
            ],
          },
          {
            kind: 'warn',
            text: 'Sau khi ăn, nếu bé nổi mề đay, nôn, sưng, khò khè → dừng thức ăn đó và đưa bé đi cấp cứu ngay.',
          },
        ],
      },
      {
        heading: 'Nguồn tham khảo',
        blocks: [
          {
            kind: 'sources',
            sources: [
              { org: 'WHO', title: 'Complementary feeding (e-LENA)', url: 'https://www.who.int/tools/elena/interventions/complementary-feeding' },
              { org: 'WHO 2023', title: 'Guideline for complementary feeding 6–23 months', url: 'https://www.guidelinecentral.com/guideline/3304206/' },
              { org: 'WHO/UNICEF', title: 'Minimum Dietary Diversity (MDD-IYCF)', url: 'https://www.anh-academy.org/data4diets/indicator/minimum-dietary-diversity-mdd-iycf' },
              { org: 'AAP/HealthyChildren', title: 'Starting Solid Foods', url: 'https://www.healthychildren.org/English/ages-stages/baby/feeding-nutrition/Pages/Starting-Solid-Foods.aspx' },
              { org: 'CDC', title: 'When, What, and How to Introduce Solid Foods', url: 'https://www.cdc.gov/infant-toddler-nutrition/foods-and-drinks/when-what-and-how-to-introduce-solid-foods.html' },
              { org: 'ESPGHAN 2017', title: 'Complementary Feeding Position Paper', url: 'https://pubmed.ncbi.nlm.nih.gov/28027215/' },
              { org: 'Bộ Y tế VN', title: 'QĐ 318/QĐ-BYT (30/01/2026) Hướng dẫn ăn bổ sung 6–23 tháng', url: 'https://mch.moh.gov.vn' },
              { org: 'AAP 2026', title: 'Updated guidance on iron deficiency', url: 'https://www.aap.org/en/news-room/news-releases/aap/2026/american-academy-of-pediatrics-updates-guidance-on-prevention-screening-and-treatment-for-iron-deficiency-in-infants-children-and-teens/' },
              { org: 'Brown A 2018', title: 'No difference in choking between BLW and traditional spoon-feeding', url: 'https://pubmed.ncbi.nlm.nih.gov/29205569/' },
              { org: 'BMC Pediatrics', title: 'Practical tips for paediatricians: Baby-led weaning', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7069838/' },
              { org: 'CDC', title: 'Infant Botulism / honey', url: 'https://www.cdc.gov/botulism/index.html' },
              { org: 'AAP News', title: 'Remind families: honey can cause infant botulism', url: 'https://publications.aap.org/aapnews/news/13225/' },
              { org: 'MedlinePlus', title: 'Cow\'s milk — infants', url: 'https://www.medlineplus.gov/ency/article/002448.htm' },
              { org: 'AAP/HealthyChildren', title: 'Recommended Drinks for Children Age 5 & Younger', url: 'https://www.healthychildren.org/English/healthy-living/nutrition/Pages/Recommended-Drinks-for-Young-Children-Ages-0-5.aspx' },
              { org: 'FDA/EPA', title: 'Advice about eating fish', url: 'https://www.fda.gov/food/consumers/advice-about-eating-fish' },
              { org: 'AAP/HealthyChildren', title: 'Choking Prevention (thực phẩm nguy cơ hóc)', url: 'https://www.healthychildren.org/English/safety-prevention/all-around/Pages/Choking-Prevention.aspx' },
              { org: 'NIAID', title: 'Addendum Guidelines for the Prevention of Peanut Allergy (2017)', url: 'https://www.niaid.nih.gov/diseases-conditions/guidelines-clinicians-peanut-allergy-prevention' },
              { org: 'AAFP', title: 'Peanut Allergy Prevention: NIAID Guidelines', url: 'https://www.aafp.org/pubs/afp/issues/2017/0715/p130.html' },
            ],
          },
        ],
      },
    ],
  },

  {
    slug: 'dinh-duong-be-12-24-thang',
    title: 'Dinh dưỡng & phát triển bé 12–24 tháng',
    emoji: '🧒',
    phases: ['toddler'],
    ageRange: 'Bé 12–24 tháng',
    summary:
      'Bé chuyển sang ăn cùng gia đình với sữa bò nguyên kem ở lượng hợp lý; vi chất (sắt, kẽm, i-ốt, DHA, vitamin D) vẫn quan trọng cho phát triển não bộ, kèm theo dõi tăng trưởng theo chuẩn WHO.',
    sections: [
      {
        heading: 'Ăn cùng gia đình & sữa bò nguyên kem',
        blocks: [
          {
            kind: 'p',
            text: 'Từ ~12 tháng, hầu hết trẻ ăn được cùng thức ăn gia đình (cắt nhỏ, mềm). WHO: từ 12 tháng ăn thức ăn gia đình; bé ăn 3–4 bữa chính + 1–2 bữa phụ/ngày (9–23 tháng), đủ ~550 kcal từ thức ăn (trẻ còn bú mẹ).',
          },
          {
            kind: 'p',
            text: 'Khẩu phần: khẩu phần trẻ ~1/4–1/3 khẩu phần người lớn; 1 bữa trẻ 12–24 tháng ≈ 1 bát (250 ml) cháo đặc/cơm nát + thức ăn (theo QĐ 318/BYT: 12–24 tháng = 3 bữa + 2 bữa phụ + bú mẹ, 1 bát 250 ml/bữa).',
          },
          {
            kind: 'p',
            text: 'Tiếp tục bú mẹ đến 24 tháng trở lên (WHO/UNICEF/Bộ Y tế VN); nếu không bú mẹ, dùng sữa công thức tăng sắt cho đủ 12 tháng rồi chuyển sữa bò.',
          },
          {
            kind: 'p',
            text: 'Sữa bò nguyên kem (12 tháng+): từ 12 tháng có thể cho sữa bò NGUYÊN KEM (whole milk) — chất béo cần cho phát triển não trong 2 năm đầu. Lượng: 16–24 oz (~480–720 ml)/ngày (HealthyChildren: 2–3 cốc; AAP khuyến nghị tối đa ≤24 oz). Trẻ >24 tháng có thể chuyển sữa tách béo/1%; không cần "sữa bột tăng trưởng" (toddler formula) — không có lợi thế dinh dưỡng (NHS/AAP).',
          },
          {
            kind: 'warn',
            text: 'Không cho bé uống quá 24 oz (~720 ml) sữa bò/ngày: sữa quá nhiều sẽ chiếm chỗ thức ăn giàu sắt → nguy cơ thiếu máu thiếu sắt.',
          },
        ],
      },
      {
        heading: 'Vi chất tiếp tục quan trọng: sắt, kẽm, i-ốt, DHA, vitamin D — ăn gì cho não',
        blocks: [
          {
            kind: 'p',
            text: 'Nhu cầu tham chiếu 12–24 tháng (RDA/AI):',
          },
          {
            kind: 'table',
            headers: ['Vi chất', 'Nhu cầu/ngày', 'Nguồn chính'],
            rows: [
              ['Sắt', '7 mg (RDA 1–3 tuổi)', 'Thịt đỏ, gan (vừa phải), cá, trứng, ngũ cốc tăng sắt; hạn chế sữa bò >24 oz/ngày'],
              ['Kẽm', '3 mg (RDA 1–3 tuổi)', 'Thịt, hải sản, trứng, đậu đỗ, lạc'],
              ['I-ốt', '90 mcg (WHO; RDA Mỹ 1–3 tuổi 90 mcg)', 'Muối i-ốt, hải sản, trứng, sữa; rong biển dùng vừa phải'],
              ['Vitamin D', 'Bổ sung 400 IU/ngày tiếp tục nếu ít phơi nắng; RDA 600 IU', 'Sữa tăng cường, cá béo, lòng đỏ trứng; tiếp tục giọt D nếu cần'],
              ['DHA/omega-3', '~100 mg/ngày (EFSA AI 6–24 tháng)', 'Sữa mẹ (mẹ ăn cá béo), cá hồi/cá trích/cá mòi, sữa công thức/ăn dặm tăng DHA, trứng'],
            ],
          },
          {
            kind: 'p',
            text: 'Thực phẩm cho phát triển não bộ (12–24 tháng):',
          },
          {
            kind: 'list',
            items: [
              'Chất béo & DHA: cá béo ít thủy ngân (cá hồi, cá trích, cá mòi, cá cơm) 2–3 phần/tuần; trứng; thêm 1 thìa dầu ăn (dầu thực vật/dầu gấc) vào bát cháo — hòa tan vitamin A, D, E, K.',
              'Sắt & kẽm: thịt băm, cá đồng, gan vừa phải, đậu đỗ, lạc, vừng.',
              'I-ốt: dùng muối i-ốt cho cả nhà (vừa đủ), hải sản.',
              'Choline: trứng (1 lòng đỏ ~147 mg choline).',
              'Tránh thay thế bữa chính bằng sữa/nước ngọt; hạn chế đồ ngọt, snack.',
            ],
          },
        ],
      },
      {
        heading: 'Theo dõi tăng trưởng: WHO Child Growth Standards',
        blocks: [
          {
            kind: 'p',
            text: 'WHO Child Growth Standards (0–5 tuổi) là chuẩn để theo dõi 0–24 tháng (CDC/AAP khuyến nghị dùng WHO charts cho trẻ dưới 2 tuổi, sau 2 tuổi chuyển CDC). Chuẩn WHO xây trên trẻ bú mẹ khỏe mạnh điều kiện tối ưu — phù hợp đánh giá tăng trưởng toàn cầu. Theo dõi 4 chỉ số: cân nặng-theo-tuổi, chiều dài-theo-tuổi, vòng đầu-theo-tuổi, cân nặng-theo-chiều dài. Biểu đồ vẽ kênh từ bách phân vị 2 → 98 (≈ ±2 SD).',
          },
          {
            kind: 'p',
            text: 'Giá trị trung vị tham chiếu (WHO, percentile 50):',
          },
          {
            kind: 'table',
            headers: ['Tuổi', 'Trai (kg)', 'Gái (kg)'],
            rows: [
              ['6 tháng', '7,9', '7,3'],
              ['12 tháng', '9,6', '8,9'],
              ['24 tháng', '12,2', '11,5'],
            ],
          },
          {
            kind: 'p',
            text: 'Khi nào LO (cần khám):',
          },
          {
            kind: 'list',
            items: [
              'Cân nặng/chiều dài/vòng đầu ≤ bách phân vị 3 (underweight/stunted/wasted); vòng đầu ≤3 hoặc ≥97.',
              'Xu hướng quan trọng hơn một con số: trụt/vọt lên ≥2 kênh phần trăm trên biểu đồ (theo thời gian) → đánh giá; vòng đầu tăng quá nhanh hoặc chậm lại đột ngột.',
              'Cân nặng/vòng đầu ở dưới 0,4 bách phân vị dù tăng đều vẫn nên khám.',
              'Cân nặng ≥97 (overweight) / ≥99,9 (béo phì) theo chuẩn cân nặng-chiều dài.',
              'Nguyên tắc: một lần đo lệch chưa đáng lo — cần đo lại, xem xu hướng nhiều lần; cha mẹ không tự cân tại nhà quá thường xuyên (gây lo lắng không cần thiết).',
            ],
          },
        ],
      },
      {
        heading: 'Rối loạn thường gặp: biếng ăn, thiếu máu thiếu sắt, còi xương',
        blocks: [
          {
            kind: 'p',
            text: 'Biếng ăn: 2–7 tuổi là giai đoạn "biếng ăn sinh lý" — trẻ khám phá quyền quyết định, sợ món mới (neophobia). Có thể cần 10–20 lần tiếp xúc trước khi trẻ chấp nhận món mới.',
          },
          {
            kind: 'p',
            text: 'Cách xử lý (responsive feeding — "cha mẹ quyết định gì/ăn lúc nào/ở đâu; con quyết định có ăn và ăn bao nhiêu"): không ép, không mua chuộc/đổi đồ ăn, không khen chê lượng ăn; ăn cùng gia đình làm gương; cho món quen + món mới; cố định 3 bữa + 2–3 bữa phụ, không "gặm vặt" giữa bữa; tắt TV khi ăn; cho trẻ tham gia chuẩn bị.',
          },
          {
            kind: 'p',
            text: 'Đi khám khi: chậm tăng cân/không lên cân, danh sách món ăn chấp nhận <15–20 món, nôn/ói khi thấy thức ăn, mỗi bữa ăn là cực hình cho cả nhà — có thể là rối loạn ăn uống cần chuyên gia.',
          },
          {
            kind: 'p',
            text: 'Thiếu máu thiếu sắt (đỉnh 9–24 tháng): nguyên nhân — ít thức ăn giàu sắt, uống sữa bò quá nhiều (>20–24 oz/ngày) chiếm chỗ thức ăn, sinh non, mẹ thiếu sắt.',
          },
          {
            kind: 'list',
            items: [
              'Dấu hiệu: da/nướu/lòng bàn tay nhợt, mệt, hay cáu gắt, pica (ăn bẩn/đất/đá/giấy), chán ăn, thở nhanh, nhịp tim nhanh, tóc móng khô giòn. Thiếu máu nhẹ có thể không triệu chứng → phát hiện qua tầm soát.',
              'Khi nào khám: có bất kỳ dấu hiệu nào trên; AAP tầm soát CBC+ferritin 9–12 tháng (bú mẹ) / 15–18 tháng (công thức). Điều trị: sắt đường uống theo bác sĩ (ferrous sulfate 3 mg/kg/ngày) — tự ý bổ sung liều cao có hại.',
            ],
          },
          {
            kind: 'p',
            text: 'Còi xương (thiếu vitamin D — đỉnh 3–18 tháng): dấu hiệu sớm — quấy khóc, ra mồ hôi trộm, rụng tóc vùng gáy, thóp rộng/chậm liền, sọ mềm (bấm như quả bóng bàn), chậm vận động (chậm lẫy/ngồi/bò). Dấu hiệu muộn — chân vòng kiềng (chữ O/X), cổ tay/cổ chân to, chuỗi hạt sườn, gù/vẹo cột sống, chậm mọc răng, dễ gãy xương.',
          },
          {
            kind: 'p',
            text: 'Yếu tố nguy cơ còi xương: bú mẹ không bổ sung vitamin D, da sẫm màu, ít phơi nắng, mẹ thiếu vitamin D. Phòng ngừa: vitamin D 400 IU/ngày (trẻ bú mẹ) + ăn đủ canxi (sữa, sữa chua, đậu phụ, cá nhỏ ăn cả xương, rau xanh).',
          },
          {
            kind: 'warn',
            text: 'Nếu nghi ngờ thiếu máu thiếu sắt hoặc còi xương (da nhợt, pica, mệt, chán ăn; quấy khóc, ra mồ hôi trộm, chân vòng kiềng…) hoặc trẻ có yếu tố nguy cơ, hãy đưa bé đi khám — không tự ý bổ sung liều cao sắt/vitamin D.',
          },
        ],
      },
      {
        heading: 'Mẹo cho mẹ Việt: món ăn dặm phù hợp & thực hành chuẩn VN',
        blocks: [
          {
            kind: 'p',
            text: 'Công thức đồng thuận "1 + 6 + 24": bú sớm trong giờ đầu, bú mẹ hoàn toàn 6 tháng, tiếp tục bú mẹ đến 24 tháng (Quyết định 3594/QĐ-BYT 2024).',
          },
          {
            kind: 'p',
            text: 'Bữa ăn dặm của trẻ Việt cần đủ 4 nhóm theo QĐ 318/BYT:',
          },
          {
            kind: 'list',
            items: [
              'Bột đường: gạo nấu bột/cháo, yến mạch, khoai lang, ngô.',
              'Đạm: thịt (lợn, bò, gà), cá đồng (cá rô, cá lóc, cá trê), tôm, cua, lươn, trứng, đậu đỗ, lạc, vừng.',
              'Béo: thêm 1 thìa dầu ăn (dầu gấc, dầu đậu nành, dầu ô-liu) vào bát cháo/bột — dễ hấp thu hơn mỡ; giúp hấp thu vitamin A, D, E, K.',
              'Vitamin/khoáng: rau xanh (rau ngót, rau muống, rau dền), quả/củ màu vàng (đu đủ, xoài, bí đỏ, cà rốt, gấc) — phòng khô mắt & thiếu máu.',
            ],
          },
          {
            kind: 'p',
            text: 'Tiến trình theo tuổi (khớp QĐ 318/BYT):',
          },
          {
            kind: 'table',
            headers: ['Tuổi', 'Loại món', 'Số bữa + lượng'],
            rows: [
              ['6–8 tháng', 'Bột loãng→đặc, nghiền mịn', '2 bữa; bắt đầu 2–3 thìa → tăng dần 2/3 bát 250 ml + bú mẹ'],
              ['9–11 tháng', 'Bột đặc/cháo, thái nhỏ', '3 bữa + 1 bữa phụ; 3/4 bát 250 ml + bú mẹ'],
              ['12–24 tháng', 'Cháo đặc, cơm nát, ăn cùng gia đình', '3 bữa + 2 bữa phụ; 1 bát 250 ml + bú mẹ'],
            ],
          },
          {
            kind: 'p',
            text: 'Thực hành đúng — tránh sai lầm phổ biến (QĐ 318 + hướng dẫn Viện Dinh dưỡng):',
          },
          {
            kind: 'list',
            items: [
              'Không nêm muối/mắm/bột ngọt trước 1 tuổi; nấu cho bé trước rồi mới nêm cho gia đình.',
              'Không ép bé ăn, không đút "chạy theo" từng thìa; không vừa ăn vừa xem TV; có giờ ăn cố định.',
              'Nấu tươi từng bữa, rau cho vào cuối để giữ vitamin C, B1; đảm bảo vệ sinh dụng cụ (nhiễm khuẩn dụng cụ là nguyên nhân chính gây tiêu chảy ở trẻ ăn dặm).',
              'Cá đồng (rô, lóc, trê) — nguồn đạm, DHA giá rẻ phù hợp VN; lọc kỹ xương vì xương cá nhỏ nguy cơ hóc.',
              'Không dùng chân giò hầm/xương hầm thay cho rau thịt (nước hầm chủ yếu là chất béo, ít vi chất); vẫn phải cho đủ thịt/cá/rau vào cháo.',
              'Duy trì bú mẹ đến 24 tháng — sữa mẹ vẫn cung cấp kháng thể và năng lượng bổ sung.',
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
              { org: 'AAP/HealthyChildren', title: 'Recommended Drinks for Children Age 5 & Younger', url: 'https://www.healthychildren.org/English/healthy-living/nutrition/Pages/Recommended-Drinks-for-Young-Children-Ages-0-5.aspx' },
              { org: 'Cincinnati Children\'s', title: 'Tips for helping babies transition to cow\'s milk', url: 'https://blog.cincinnatichildrens.org/healthy-living/tips-helping-babies-transition-cows-milk/' },
              { org: 'WHO', title: 'Complementary feeding (e-LENA)', url: 'https://www.who.int/tools/elena/interventions/complementary-feeding' },
              { org: 'Bộ Y tế VN', title: 'QĐ 318/QĐ-BYT (30/01/2026) Hướng dẫn ăn bổ sung 6–23 tháng', url: 'https://mch.moh.gov.vn' },
              { org: 'NASEM/IOM DRI', title: 'RDA sắt 7 mg, kẽm 3 mg trẻ 1–3 tuổi', url: 'https://www.ncbi.nlm.nih.gov/books/NBK569694/table/ch8.t1/' },
              { org: 'WHO', title: 'Iodine deficiency (nhu cầu 90 mcg trẻ nhỏ)', url: 'https://www.who.int/news-room/fact-sheets/detail/iodine-deficiency' },
              { org: 'EFSA', title: 'DHA adequate intake 100 mg/ngày (6–24 tháng)', url: 'https://www.efsa.europa.eu/' },
              { org: 'AAP 2026', title: 'Updated guidance on iron deficiency (giới hạn sữa bò)', url: 'https://www.aap.org/en/news-room/news-releases/aap/2026/american-academy-of-pediatrics-updates-guidance-on-prevention-screening-and-treatment-for-iron-deficiency-in-infants-children-and-teens/' },
              { org: 'Viện Dinh dưỡng/Bộ Y tế VN', title: 'Nhu cầu dinh dưỡng khuyến nghị', url: 'https://viendinhduong.vn' },
              { org: 'WHO', title: 'Child Growth Standards', url: 'https://www.who.int/tools/child-growth-standards' },
              { org: 'CDC', title: 'Using WHO Growth Standard Charts', url: 'https://www.cdc.gov/growth-chart-training/hcp/using-growth-charts/who-using.html' },
              { org: 'CDC', title: 'WHO Child Growth Standards Training', url: 'https://www.cdc.gov/growth-chart-training/hcp/training/who-child-growth-standards-training.html' },
              { org: 'AAP/HealthyChildren', title: 'Responsive Feeding handout (toddler nutrition)', url: 'https://www.healthychildren.org/English/ages-stages/toddler/nutrition/Pages/default.aspx' },
              { org: 'AAP/HealthyChildren', title: 'Anemia and Your Child', url: 'https://www.healthychildren.org/english/health-issues/conditions/chronic/pages/anemia-and-your-child.aspx' },
              { org: 'Mayo Clinic', title: 'Rickets: symptoms & causes', url: 'https://www.mayoclinic.org/diseases-conditions/rickets/symptoms-causes/syc-20351943' },
              { org: 'Royal Children\'s Hospital Melbourne', title: 'Rickets & vitamin D deficiency', url: 'https://www.rch.org.au/kidsinfo/fact_sheets/rickets_vitamin_d_deficiency/' },
              { org: 'Bộ Y tế VN', title: 'QĐ 3594/QĐ-BYT (29/11/2024) 10 khuyến nghị dinh dưỡng', url: 'https://moh.gov.vn' },
              { org: 'Viện Dinh dưỡng Quốc gia', title: 'Hướng dẫn dinh dưỡng', url: 'https://viendinhduong.vn' },
              { org: 'Sức khỏe & Đời sống', title: 'Thực đơn ăn dặm cân bằng 4 nhóm', url: 'https://suckhoedoisong.vn/cach-xay-dung-thuc-don-an-dam-can-bang-4-nhom-chat-cho-tre-169260803145943412.htm' },
            ],
          },
        ],
      },
    ],
  },
]
