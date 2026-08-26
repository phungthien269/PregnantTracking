export type KnowledgePhase = 'preconception' | 'pregnancy' | 'infant' | 'toddler'

export interface KnowledgeSource {
  org: string
  title: string
  url: string
}

export type KnowledgeBlock =
  | { kind: 'p'; text: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'warn'; text: string }
  | { kind: 'table'; headers: string[]; rows: string[][] }
  | { kind: 'sources'; sources: KnowledgeSource[] }

export interface KnowledgeSection {
  heading: string
  blocks: KnowledgeBlock[]
}

export interface KnowledgeTopic {
  slug: string
  title: string
  emoji?: string
  phases: KnowledgePhase[] // giai đoạn áp dụng
  ageRange?: string // dòng nhỏ, VD "Thai kỳ · tuần 1–40", "Bé 6–12 tháng"
  summary: string // 1–2 câu giới thiệu
  sections: KnowledgeSection[]
  bookSources?: { book: string; authors?: string; note?: string }[]
}
