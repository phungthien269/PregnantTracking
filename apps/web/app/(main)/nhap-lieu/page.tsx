import { PageHeader } from '@/components/page-header'
import { NhapLieuClient } from './nhap-lieu-client'

export default function NhapLieuPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Nhập liệu"
        description="Nhập hồ sơ sức khỏe cá nhân và dán danh sách triệu chứng để đồng bộ vào nhật ký — AI phân tích tự đọc được."
      />
      <NhapLieuClient />
    </div>
  )
}
