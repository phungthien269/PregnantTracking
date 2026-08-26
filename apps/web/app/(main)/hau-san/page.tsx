import Link from 'next/link'
import { data } from '@/lib/data'
import { PageHeader } from '@/components/page-header'
import { buttonClasses, Card } from '@mevabe/ui'
import { SectionTabs, BE_TABS } from '@/components/section-tabs'

interface Source {
  org: string
  title: string
  url: string
}

type Block =
  | { kind: 'p'; text: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'warn'; title?: string; text: string }
  | { kind: 'danger'; title?: string; items: string[]; note?: string }
  | { kind: 'sources'; sources: Source[] }

function Block({ block }: { block: Block }) {
  switch (block.kind) {
    case 'p':
      return <p className="text-sm leading-relaxed text-fg">{block.text}</p>
    case 'list':
      return (
        <ul className="list-inside list-disc space-y-1 text-sm leading-relaxed text-fg">
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )
    case 'warn':
      return (
        <div className="rounded-md bg-warning/10 p-3">
          <p className="text-xs font-medium text-warning">{block.title ?? 'Lưu ý'}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted">{block.text}</p>
        </div>
      )
    case 'danger':
      return (
        <div className="rounded-md border border-danger/30 bg-danger/10 p-4">
          <p className="text-sm font-semibold text-danger">
            {block.title ?? 'Dấu hiệu nguy hiểm — cần cấp cứu ngay'}
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm leading-relaxed text-fg">
            {block.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          {block.note && <p className="mt-2 text-sm font-medium text-danger">{block.note}</p>}
        </div>
      )
    case 'sources':
      return (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Nguồn</p>
          <ul className="space-y-1.5 text-sm">
            {block.sources.map((s) => (
              <li key={s.url}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary-strong underline underline-offset-2 hover:text-success"
                >
                  {s.org} — {s.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )
  }
}

const RECOVERY_SOURCES: Source[] = [
  {
    org: 'ACOG',
    title: '3 Conditions to Watch for After Childbirth',
    url: 'https://www.acog.org/womens-health/experts-and-stories/the-latest/3-conditions-to-watch-for-after-childbirth',
  },
  {
    org: 'CDC',
    title: 'Hear Her — Urgent Maternal Warning Signs',
    url: 'https://www.cdc.gov/hearher/index.html',
  },
]

const MIND_SOURCES: Source[] = [
  {
    org: 'WHO',
    title: 'Perinatal mental health',
    url: 'https://www.who.int/teams/mental-health-and-substance-use/promotion-prevention/perinatal-mental-health',
  },
  {
    org: 'ACOG',
    title: 'Perinatal Mental Health: Patient Screening',
    url: 'https://www.acog.org/programs/perinatal-mental-health/patient-screening',
  },
  {
    org: 'NHS inform',
    title: 'Your mental health and wellbeing in pregnancy',
    url: 'https://www.nhsinform.scot/ready-steady-baby/pregnancy/relationships-and-wellbeing-in-pregnancy/your-mental-health-and-wellbeing-in-pregnancy/',
  },
  {
    org: 'IASP / Find A Helpline',
    title: 'Vietnam helplines and hotlines',
    url: 'https://iasp.findahelpline.com/countries/vn',
  },
]

const FEEDING_SOURCES: Source[] = [
  {
    org: 'WHO',
    title: 'Breastfeeding',
    url: 'https://www.who.int/news-room/questions-and-answers/item/breastfeeding',
  },
  {
    org: 'UNICEF',
    title: 'Early childhood nutrition',
    url: 'https://www.unicef.org/nutrition/early-childhood-nutrition',
  },
  {
    org: 'Bộ Y tế VN — Cục Bà mẹ và Trẻ em',
    title: 'Hướng dẫn nuôi dưỡng trẻ nhỏ (bú mẹ hoàn toàn 6 tháng, bú đến 24 tháng)',
    url: 'https://mch.moh.gov.vn',
  },
]

const CHECKUP_SOURCES: Source[] = [
  {
    org: 'ACOG',
    title: 'Optimizing Postpartum Care (CO 736)',
    url: 'https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2018/05/optimizing-postpartum-care',
  },
  ...RECOVERY_SOURCES,
]

const NUTRITION_SOURCES: Source[] = [
  {
    org: 'ACOG',
    title: 'Nutrition During Pregnancy',
    url: 'https://www.acog.org/womens-health/faqs/nutrition-during-pregnancy',
  },
  {
    org: 'WHO eLENA',
    title: 'Daily iron and folic acid supplementation during pregnancy',
    url: 'https://www.who.int/tools/elena/interventions/daily-iron-pregnancy',
  },
  {
    org: 'ATA',
    title: 'Iodine Supplementation for Pregnancy and Lactation',
    url: 'https://www.thyroid.org/iodine-supplementation-pregnancy-lactation/',
  },
  {
    org: 'Nestlé Nutrition Institute / Karger',
    title: 'Nutritional Factors in Fetal and Infant Brain Development (DHA)',
    url: 'https://www.nestlenutrition-institute.org/annales-77.2---young-brain-big-appetite/nutritional-factors-in-fetal-and-infant-brain-development',
  },
  {
    org: 'ACOG',
    title: 'Physical Activity and Exercise During Pregnancy and the Postpartum Period (CO 804)',
    url: 'https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2020/04/physical-activity-and-exercise-during-pregnancy-and-the-postpartum-period',
  },
  {
    org: 'NIH/ODS',
    title: 'Vitamin B12',
    url: 'https://ods.od.nih.gov/factsheets/VitaminB12-HealthProfessional/',
  },
]

export default async function HauSanPage() {
  const birth = await data.getBirthRecord().catch(() => null)

  return (
    <div className="space-y-6">
      <SectionTabs tabs={BE_TABS} />
      <PageHeader
        title="🤱 Chăm sóc sau sinh"
        description="Cẩm nang hồi phục cho mẹ sau sinh — sức khỏe thể chất, tâm trạng, cho con bú, tái khám và dinh dưỡng."
      />

      {!birth ? (
        <Card title="Chưa có ca sinh">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-xl text-sm text-muted">
              Khi bé chào đời, hãy nhập ca sinh để lưu hồ sơ và bắt đầu theo dõi các mốc sau sinh của bé.
            </p>
            <Link className={buttonClasses('primary', 'sm')} href="/be">
              Nhập ca sinh →
            </Link>
          </div>
        </Card>
      ) : (
        <Card title="Đã lưu ca sinh">
          <p className="text-sm text-muted">
            Hồ sơ ca sinh đã được lưu. Xem chi tiết tại{' '}
            <Link className="text-primary-strong underline underline-offset-2" href="/be">
              trang Bé
            </Link>
            .
          </p>
        </Card>
      )}

      <Card title="1. Hồi phục sau sinh">
        <div className="space-y-3">
          <Block
            block={{
              kind: 'p',
              text: 'Sau sinh, cơ thể mẹ cần thời gian để hồi phục: tử cung co lại dần, vết khâu tầng sinh môn hoặc vết mổ lành lại và sản dịch (dịch ra từ âm đạo sau sinh) diễn ra trong vài tuần. Thời gian và mức độ khác nhau ở từng người — hãy theo dõi theo chỉ dẫn của bác sĩ.',
            }}
          />
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Sản dịch — bình thường bao lâu?</p>
          <Block
            block={{
              kind: 'list',
              items: [
                'Những ngày đầu thường ra máu đỏ tươi, lượng nhiều (như ngày đèn đỏ nặng nhất).',
                'Sau đó chuyển dần sang hồng/nâu, loãng hơn, rồi trắng ngà; thường kéo dài khoảng 4–6 tuần.',
                'Nên dùng băng vệ sinh (không dùng tampon) trong thời gian này để giảm nguy cơ nhiễm trùng.',
                'Có thể thấy lượng máu tăng nhẹ trở lại quanh 1–2 tuần sau sinh — thường không đáng lo.',
              ],
            }}
          />
          <Block
            block={{
              kind: 'warn',
              title: 'Dấu hiệu bất thường',
              text: 'Báo bác sĩ/nhân viên y tế nếu: ra máu lại tăng nhiều (thấm ướt 1 miếng băng vệ sinh trong 1 giờ, kéo dài vài giờ liên tiếp), ra cục máu lớn, máu đỏ tươi trở lại sau tuần đầu, dịch có mùi hôi, hoặc sốt. Nếu ra máu rất nhiều kèm chóng mặt, khó thở — xem mục "Dấu hiệu nguy hiểm" bên dưới và gọi cấp cứu ngay.',
            }}
          />
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Chăm sóc vết mổ / vết khâu tầng sinh môn</p>
          <Block
            block={{
              kind: 'list',
              items: [
                'Giữ vùng vết khâu/vết mổ khô, sạch; thay băng theo hướng dẫn của nhân viên y tế.',
                'Đau giảm dần là bình thường. Nếu vết thương sưng, đỏ, nóng, chảy dịch hoặc đau tăng dần → gặp nhân viên y tế.',
              ],
            }}
          />
          <Block block={{ kind: 'sources', sources: RECOVERY_SOURCES }} />
        </div>
      </Card>

      <Card title="2. Sức khỏe tâm trạng">
        <div className="space-y-3">
          <Block
            block={{
              kind: 'p',
              text: 'Thay đổi nội tiết và việc chăm con khiến cảm xúc dao động sau sinh là điều thường gặp. Cần phân biệt hai trường hợp: "baby blues" (buồn, dễ khóc, cáu gắt trong vài ngày đầu — nhẹ và tự hết) và trầm cảm sau sinh (kéo dài hơn 2 tuần, nặng, cần được điều trị).',
            }}
          />
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Dấu hiệu cần lưu ý</p>
          <Block
            block={{
              kind: 'list',
              items: [
                'Buồn, khóc hầu hết thời gian; cảm giác tuyệt vọng, vô dụng, tội lỗi.',
                'Mất hứng thú với những việc trước đây thích; cảm thấy mất kết nối với con.',
                'Ngủ hoặc ăn thay đổi mạnh (mất ngủ hoặc ngủ quá nhiều; chán ăn hoặc ăn quá nhiều).',
                'Lo âu dai dẳng khó kiểm soát, dễ cáu gắt, khó tập trung.',
              ],
            }}
          />
          <Block
            block={{
              kind: 'warn',
              title: 'Không tự chẩn đoán',
              text: 'Sàng lọc (như thang EPDS) chỉ là bước phát hiện nguy cơ, không thay thế đánh giá của bác sĩ. Nếu có các dấu hiệu trên kéo dài hơn 2 tuần hoặc ảnh hưởng sinh hoạt hằng ngày, hãy trao đổi với bác sĩ sản khoa, nhà hội sinh hoặc chuyên gia tâm lý.',
            }}
          />
          <Block
            block={{
              kind: 'danger',
              title: 'Cần cấp cứu ngay',
              items: [
                'Bất kỳ ý nghĩ tự làm hại bản thân hoặc con — nói ngay với người tin cậy và gọi cấp cứu, không chờ hẹn.',
              ],
            }}
          />
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Khi nào nên gặp chuyên gia</p>
          <Block
            block={{
              kind: 'list',
              items: [
                'Buồn/chán nản chiếm hầu hết thời gian hoặc mất hứng thú kéo dài hơn 2 tuần.',
                'Lo âu dai dẳng không kiểm soát, ảnh hưởng đến ngủ/ăn/sinh hoạt.',
                'Có tiền sử bệnh tâm thần — báo bác sĩ từ sớm để được theo dõi.',
                'Bất kỳ ý nghĩ tự hại — cấp cứu ngay.',
              ],
            }}
          />
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Đường hỗ trợ</p>
          <Block
            block={{
              kind: 'list',
              items: [
                'Bắt đầu từ bác sĩ sản khoa / nhà hội sinh / bác sĩ gia đình tại cơ sở y tế.',
                'Quốc tế (dùng khi ở nước ngoài): National Maternal Mental Health Hotline (Mỹ) 1-833-852-6262 (24/7, miễn phí, bảo mật); Postpartum Support International 1-800-944-4773; 988 Suicide & Crisis Lifeline (Mỹ).',
                'Việt Nam (hotline sức khỏe tâm thần chung, không chuyên biệt sau sinh — số đã đối chiếu 08/2026): Tổng đài 111 (bảo vệ trẻ em, 24/7); Đường dây nóng Ngày Mai 096 306 1414 (13:00–20:30, Thứ 4–Chủ nhật); CSAGA 024 3333 5599 (8:00–21:00 hằng ngày); HOPE phòng chống tự tử 0865 044 400 (buổi tối hằng ngày); Ngôi nhà Bình yên 1900 96 96 80 (24/7).',
              ],
            }}
          />
          <Block block={{ kind: 'sources', sources: MIND_SOURCES }} />
        </div>
      </Card>

      <Card title="3. Cho con bú">
        <div className="space-y-3">
          <Block
            block={{
              kind: 'p',
              text: 'WHO, UNICEF và Bộ Y tế Việt Nam khuyến nghị cho bé bú sớm trong giờ đầu sau sinh, bú mẹ hoàn toàn trong 6 tháng đầu và tiếp tục bú mẹ đến 24 tháng (hướng dẫn của Bộ Y tế thường tóm tắt là "1 + 6 + 24").',
            }}
          />
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Tư thế & ngậm bắt</p>
          <Block
            block={{
              kind: 'list',
              items: [
                'Tìm tư thế thoải mái cho cả mẹ và bé: bế bé sát người, đầu và thân bé thẳng hàng.',
                'Bé ngậm đúng thường bú hiệu quả và ít gây đau; nếu chưa chắc chắn, hãy nhờ nhân viên y tế hoặc tư vấn viên sữa mẹ hướng dẫn trực tiếp.',
                'Cho bú theo nhu cầu của bé (bú nhiều lần trong ngày), nhất là những tuần đầu.',
              ],
            }}
          />
          <Block
            block={{
              kind: 'warn',
              title: 'Khi nào cần giúp đỡ',
              text: 'Đau/nứt đầu vú, căng tức hoặc tắc sữa là những khó khăn thường gặp và hầu hết có thể cải thiện với sự hỗ trợ đúng cách. Hãy gặp bác sĩ/nhân viên y tế sớm nếu: vú đỏ, nóng, đau nhiều, kèm sốt, hoặc đau kéo dài không giảm.',
            }}
          />
          <Block
            block={{
              kind: 'list',
              items: [
                'Mẹ cho con bú nên ăn đủ năng lượng, canxi, DHA và i-ốt, uống đủ nước — xem mục "5. Dinh dưỡng & vận động nhẹ" bên dưới.',
              ],
            }}
          />
          <Block block={{ kind: 'sources', sources: FEEDING_SOURCES }} />
        </div>
      </Card>

      <Card title="4. Tái khám hậu sản & dấu hiệu nguy hiểm">
        <div className="space-y-3">
          <Block
            block={{
              kind: 'p',
              text: 'Tái khám sau sinh (thường khoảng 6 tuần, theo chỉ định của bác sĩ) giúp kiểm tra hồi phục thể chất và tâm trạng của mẹ, đồng thời là mốc để sàng lọc sức khỏe tâm thần chu sinh. Nếu có lo ngại bất kỳ lúc nào, đừng chờ đến hẹn — hãy liên hệ cơ sở y tế.',
            }}
          />
          <Block
            block={{
              kind: 'danger',
              title: 'Dấu hiệu NGUY HIỂM — cần cấp cứu ngay',
              items: [
                'Ra máu rất nhiều: thấm ướt 1 miếng băng vệ sinh trong 1 giờ, kéo dài vài giờ liên tiếp, hoặc ra cục máu lớn.',
                'Sốt (thường từ 38°C trở lên) kèm ớn lạnh.',
                'Đau bụng dữ dội không giảm.',
                'Khó thở, đau ngực hoặc tim đập nhanh.',
                'Đau đầu dữ dội không giảm; nhìn mờ, thấy đốm sáng hoặc rối loạn thị giác.',
                'Sưng nề nhiều ở tay, mặt, chân.',
                'Đau, sưng, đỏ một bên chân.',
                'Ý nghĩ tự làm hại bản thân hoặc con.',
              ],
              note: 'Có bất kỳ dấu hiệu nào trong số trên — không chờ đợi. Liên hệ cơ sở y tế gần nhất hoặc gọi cấp cứu 115 ngay.',
            }}
          />
          <Block block={{ kind: 'sources', sources: CHECKUP_SOURCES }} />
        </div>
      </Card>

      <Card title="5. Dinh dưỡng & vận động nhẹ">
        <div className="space-y-3">
          <Block
            block={{
              kind: 'p',
              text: 'Dinh dưỡng và vận động sau sinh giúp mẹ hồi phục nhanh hơn, có đủ năng lượng cho con bú và cải thiện tâm trạng.',
            }}
          />
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Dinh dưỡng cho mẹ (đặc biệt khi cho con bú)</p>
          <Block
            block={{
              kind: 'list',
              items: [
                'Ăn đủ năng lượng: khi cho con bú, nhu cầu năng lượng của mẹ tăng lên (thường thêm khoảng 500 kcal/ngày) so với trước thai kỳ.',
                'Ăn đủ canxi (sữa, sữa chua, đậu phụ, cá kho ăn cả xương) — khoảng 1.000 mg/ngày.',
                'Duy trì DHA (cá béo như cá thu, cá hồi, cá mòi, hoặc viên DHA theo chỉ định) để sữa giàu DHA.',
                'Tiếp tục dùng muối i-ốt hằng ngày — i-ốt quan trọng suốt thai kỳ đến khi cho con bú.',
                'Mẹ cho con bú có thể tiếp tục bổ sung sắt theo hướng dẫn của bác sĩ; mẹ ăn chay/thuần chay cần bổ sung vitamin B12.',
                'Uống đủ nước mỗi ngày.',
              ],
            }}
          />
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Vận động nhẹ</p>
          <Block
            block={{
              kind: 'list',
              items: [
                'Khi được bác sĩ cho phép, vận động nhẹ sau sinh (đi bộ, các bài tập nhẹ nhàng) hỗ trợ hồi phục tốt hơn và giúp giảm triệu chứng trầm cảm sau sinh.',
                'Hỏi bác sĩ về thời điểm nên bắt đầu và cường độ phù hợp — đặc biệt nếu sinh mổ hoặc có biến chứng.',
              ],
            }}
          />
          <Block block={{ kind: 'sources', sources: NUTRITION_SOURCES }} />
        </div>
      </Card>

      <p className="flex items-center gap-2 text-sm text-muted">
        <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-muted">Lưu ý</span>
        Thông tin tham khảo từ nguồn y khoa — không thay thế tư vấn của bác sĩ.
      </p>
    </div>
  )
}

export const dynamic = 'force-dynamic'
