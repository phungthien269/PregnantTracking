// ===========================================================================
// persist.check.ts — self-check Phase 6 (agent 6G): saveKnowledgeChunks → SQLite
// → searchKnowledgeChunks trả đúng chunk. Đây là khế ước DataApi mà pipeline
// import (lib/library/pipeline.ts) gọi sau khi chunk; xác minh đúng luồng
// "persist → tìm được".
// Chạy:
//   cd apps/web && node --experimental-strip-types --import ./lib/library/node-loader.mjs lib/library/persist.check.ts
// ===========================================================================
import assert from 'node:assert/strict'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rmSync } from 'node:fs'

// DB riêng cho check — tránh đụng DB demo đang chạy.
process.env.MEVABE_DB_PATH = join(tmpdir(), `mevabe-persist-check-${process.pid}.db`)
rmSync(process.env.MEVABE_DB_PATH, { force: true })

async function main(): Promise<void> {
  const { localApi } = await import('../data/local')
  const { chunkText } = await import('./chunk')
  const { libraryStore } = await import('./store')

  // 1. saveKnowledgeChunks 1 source với vài chunk có từ khoá riêng.
  await localApi.saveKnowledgeChunks('src-persist', [
    { content: 'Acid folic phòng dị tật ống thần kinh cho mẹ bầu.', citation: 'Cẩm nang — Bổ sung', position: 0 },
    { content: 'Mẹ bầu cần khoảng 1000 mg canxi mỗi ngày.', citation: 'Cẩm nang — Dinh dưỡng', position: 1 },
    { content: 'Giới hạn caffeine an toàn dưới 200 mg cho mẹ mỗi ngày.', citation: 'Cẩm nang — Caffeine', position: 2 },
  ])

  // 2. searchKnowledgeChunks tìm đúng chunk theo từ khoá.
  const found = await localApi.searchKnowledgeChunks('canxi')
  assert.equal(found.length, 1, `tìm "canxi" ra 1 chunk (được ${found.length})`)
  assert.ok(found[0]!.content.includes('canxi'), 'chunk đúng nội dung')
  assert.ok(found[0]!.knowledge_source_id === 'src-persist', 'chunk thuộc đúng source')
  assert.equal(found[0]!.position, 1, 'position đúng (1)')

  const folic = await localApi.searchKnowledgeChunks('folic')
  assert.equal(folic.length, 1, `tìm "folic" ra 1 chunk (được ${folic.length})`)
  assert.equal(folic[0]!.position, 0, 'position đúng (0)')

  // 3. Trích dẫn nguồn + order theo position (từ khoá chung "mẹ").
  const all = await localApi.searchKnowledgeChunks('mẹ')
  assert.equal(all.length, 3, `tìm "mẹ" ra 3 chunk (được ${all.length})`)
  assert.deepEqual(
    all.map((c) => c.position),
    [0, 1, 2],
    'kết quả order theo position',
  )
  assert.ok(all.every((c) => c.citation.startsWith('Cẩm nang')), 'mỗi chunk có citation nguồn')

  // 3b. Chỉ chunk 1,2 chứa "mg" → tìm ra 2 chunk.
  const mg = await localApi.searchKnowledgeChunks('mg')
  assert.equal(mg.length, 2, `tìm "mg" ra 2 chunk (được ${mg.length})`)

  // 4. Không khớp / query trống → rỗng.
  assert.equal((await localApi.searchKnowledgeChunks('không-có-từ-xyz')).length, 0, 'không khớp → rỗng')
  assert.equal((await localApi.searchKnowledgeChunks('   ')).length, 0, 'query trống → rỗng')

  // 5. Mirror đúng bước persist của pipeline import (lib/library/pipeline.ts):
  //    chunkText → libraryStore.addChunks (mock, hiển thị chi tiết) →
  //    localApi.saveKnowledgeChunks (SQLite, phục vụ tìm kiếm) → search ra chunk.
  const doc = { title: 'Cẩm nang thai kỳ', text: 'Dinh dưỡng cho mẹ\n\nMẹ bầu cần bổ sung 1000 mg canxi mỗi ngày.' }
  const chunks = chunkText(doc)
  assert.ok(chunks.length >= 1, 'chunkText tạo chunk cho nguồn vừa import')
  const source = await libraryStore.createSource(doc.title, {})
  await libraryStore.addChunks(source.id, chunks)
  await localApi.saveKnowledgeChunks(source.id, chunks)
  const fromImport = await localApi.searchKnowledgeChunks('canxi')
  assert.ok(
    fromImport.some((c) => c.knowledge_source_id === source.id && c.content.includes('canxi')),
    'search thấy chunk của nguồn vừa import (citation + position giữ nguyên)',
  )
  const detail = await libraryStore.getChunks(source.id)
  assert.equal(detail.length, chunks.length, 'detail view vẫn đọc được chunks qua libraryStore')

  console.log('✅ persist.check PASS — saveKnowledgeChunks → searchKnowledgeChunks (kể cả bước persist pipeline)')
}

main().catch((e) => {
  console.error('❌ persist.check FAIL:', e)
  process.exit(1)
})
