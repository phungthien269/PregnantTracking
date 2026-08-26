import { Badge, Card } from '@mevabe/ui'

/**
 * Ghi chú ngắn hiển thị trong thẻ vi chất riêng (key = nutrient id trong nutrient-reference-data.ts).
 * Chỉ các vi chất có khuyến nghị VN khác chuẩn quốc tế.
 */
export const VIETNAM_NOTES: Record<string, string> = {
  vitamin_d: 'Khuyến nghị VN: 800 IU/ngày (RDA VN 2016) — cao hơn chuẩn quốc tế 600 IU.',
  calcium: 'Khuyến nghị VN: 1.200 mg/ngày (RDA VN 2016) — cao hơn chuẩn quốc tế 1.000 mg.',
}

interface VietnamNote {
  nutrient: string
  /** Giá trị khuyến nghị Việt Nam. */
  vn: string
  /** Giá trị chuẩn quốc tế app đang hiển thị. */
  intl: string
  detail: string
  sourceOrg: string
  sourceTitle: string
  sourceUrl: string
}

/**
 * Các điểm dinh dưỡng thai kỳ mà khuyến nghị VN khác chuẩn quốc tế.
 * Số liệu & nguồn từ orchestration/docs/vietnam-health-guidance.md (Phần A).
 */
const VIETNAM_DIFFERENCES: VietnamNote[] = [
  {
    nutrient: 'Vitamin D',
    vn: '800 IU (20 mcg)/ngày',
    intl: '600 IU/ngày (NIH/ACOG) · WHO 200 IU · NHS 400 IU',
    detail:
      'RDA VN 2016 tham khảo IOM 2011 nhưng điều chỉnh cao hơn theo thực trạng thiếu vitamin D phổ biến ở người Việt.',
    sourceOrg: 'Bộ Y tế — Viện Dinh dưỡng',
    sourceTitle: 'Nhu cầu dinh dưỡng khuyến nghị cho người Việt Nam (RDA VN 2016)',
    sourceUrl:
      'https://file.hstatic.net/200000713511/file/nhu-cau-dinh-duong-khuyen-nghi-cho-nguoi-viet-nam-bo-y-te-2016_1351b03467f74a40a14580ae822b6e1c.pdf',
  },
  {
    nutrient: 'Canxi',
    vn: '1.200 mg/ngày',
    intl: '1.000 mg/ngày (ACOG/NIH) · WHO vùng ít canxi 1.500–2.000 mg',
    detail: 'Giá trị VN nằm giữa chuẩn ACOG/NIH và khuyến nghị WHO cho vùng ăn ít canxi như Việt Nam.',
    sourceOrg: 'Bộ Y tế — Viện Dinh dưỡng',
    sourceTitle: 'Nhu cầu dinh dưỡng khuyến nghị cho người Việt Nam (RDA VN 2016)',
    sourceUrl:
      'https://file.hstatic.net/200000713511/file/nhu-cau-dinh-duong-khuyen-nghi-cho-nguoi-viet-nam-bo-y-te-2016_1351b03467f74a40a14580ae822b6e1c.pdf',
  },
  {
    nutrient: 'Sắt',
    vn: 'Bổ sung phổ cập: viên sắt 60 mg + acid folic 400 mcg/ngày cho mọi thai phụ suốt thai kỳ',
    intl: 'WHO vùng thiếu máu cao (VN thuộc nhóm): 30–60 mg/ngày · ACOG 27 mg · NHS chỉ khi thiếu',
    detail:
      'Phụ nữ VN thiếu máu phổ biến nên Bộ Y tế khuyến nghị bổ sung sắt cho TẤT CẢ thai phụ, không chờ xét nghiệm thiếu.',
    sourceOrg: 'Bộ Y tế — chương trình vi chất (Trạm y tế)',
    sourceTitle: 'Bổ sung viên sắt/acid folic 60 mg + 400 mcg cho phụ nữ có thai',
    sourceUrl:
      'https://tytphuongtamphu.medinet.gov.vn/cham-soc-suc-khoe-sinh-san/ngay-vi-chat-dinh-duong-1-26-phu-nu-co-thai-can-uong-vien-sat-acid-folic-hoac-v-c7528-241683.aspx',
  },
  {
    nutrient: 'Tăng cân theo BMI',
    vn: 'BMI bình thường: 10–12 kg cả thai kỳ · thiếu cân 25% · thừa cân/béo phì 15% cân nặng trước mang thai',
    intl: 'IOM/CDC bảng kg cố định: BMI bình thường 11,5–16 kg',
    detail:
      'Việt Nam tính tăng cân theo % cân nặng trước mang thai cho nhóm thiếu/thừa cân/béo phì, và khoảng 10–12 kg cho BMI bình thường — khác bảng kg cố định của IOM/CDC.',
    sourceOrg: 'Viện Dinh dưỡng TP.HCM / Bộ Y tế (QĐ 776/QĐ-BYT)',
    sourceTitle: 'Khuyến nghị tăng cân & năng lượng khẩu phần khi mang thai',
    sourceUrl:
      'https://viendinhduongtphcm.org/Media/Tai_lieu_chuyen_mon/Dinh_duong_san_phu_khoa/Khuyen_nghi_tang_can_va_muc_nang_luong_khau_phan_khi_mang_thai.pdf',
  },
  {
    nutrient: 'Năng lượng 3 tháng đầu (T1)',
    vn: '+50 kcal/ngày',
    intl: '0 kcal/ngày (WHO/ACOG — không cần tăng ở T1)',
    detail: 'Khác biệt nhỏ: Việt Nam vẫn cộng thêm nhẹ năng lượng ở 3 tháng đầu, trong khi chuẩn quốc tế chưa cần tăng.',
    sourceOrg: 'Bộ Y tế',
    sourceTitle: 'Quyết định 776/QĐ-BYT — Hướng dẫn quốc gia dinh dưỡng cho phụ nữ có thai',
    sourceUrl: 'https://bvnguyentriphuong.com.vn/san-phu-khoa/huong-dan-quoc-gia-ve-dinh-duong-cho-phu-nu-co-thai-va-ba-me-cho-con-bu-phan-1',
  },
]

/**
 * Mục "Khuyến nghị Việt Nam" — nêu các điểm Bộ Y tế / Viện Dinh dưỡng VN khác chuẩn quốc tế
 * đang hiển thị ở bảng nhu cầu hằng ngày, để mẹ Việt hiểu đúng theo hướng dẫn trong nước.
 */
export function VietnamNutritionNotes() {
  return (
    <Card
      title="Khuyến nghị Việt Nam (Bộ Y tế / Viện Dinh dưỡng)"
      description="Các điểm khuyến nghị Việt Nam khác chuẩn quốc tế đang hiển thị ở bảng trên — tham khảo thêm cho mẹ Việt."
    >
      <ul className="space-y-3">
        {VIETNAM_DIFFERENCES.map((n) => (
          <li key={n.nutrient} className="rounded-md bg-surface-muted p-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold text-fg">{n.nutrient}</p>
              <Badge tone="accent">VN: {n.vn}</Badge>
            </div>
            <p className="mt-1 text-xs text-muted">
              <span className="font-medium text-muted">Quốc tế:</span> {n.intl}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted">{n.detail}</p>
            <p className="mt-1.5 text-[11px] leading-snug text-muted">
              <span className="font-medium text-muted">[Nguồn: {n.sourceOrg} — {n.sourceTitle}]</span>{' '}
              <a
                href={n.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2 hover:text-primary-strong"
              >
                nguồn ↗
              </a>
            </p>
          </li>
        ))}
      </ul>
      <p className="mt-3 flex items-start gap-2 border-t border-border pt-2 text-[11px] text-muted">
        <Badge tone="neutral">Lưu ý</Badge>
        <span>Thông tin tham khảo theo hướng dẫn Bộ Y tế / Viện Dinh dưỡng — không thay thế tư vấn của bác sĩ.</span>
      </p>
    </Card>
  )
}
