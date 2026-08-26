import { z } from 'zod'
import { data } from '@/lib/data'
import { apiOk, parseBody, parsePathId } from '@/lib/api-utils'

const chunksSchema = z.object({
  chunks: z.array(
    z.object({
      content: z.string().min(1),
      citation: z.string().max(500),
      position: z.number().int().nonnegative(),
      embedding: z.array(z.number()).nullable().optional(),
    }),
  ),
})

// POST /api/v1/knowledge-sources/[id]/chunks — persist chunks của nguồn vào
// knowledge_chunks (Phase 6, thư viện import → SQLite).
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const id = await parsePathId(params)
  if (id.error) return id.error
  const body = await req.json().catch(() => null)
  const parsed = parseBody(chunksSchema, body)
  if (!parsed.ok) return parsed.error
  await data.saveKnowledgeChunks(id.id, parsed.data.chunks)
  return apiOk({ ok: true, created: parsed.data.chunks.length }, 201)
}
