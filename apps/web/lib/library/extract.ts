// ===========================================================================
// extract.ts — trích xuất text từ PDF / EPUB / URL (không dependency mới).
// - PDF: parser tối giản (node:zlib inflate + operator Tj/TJ/Td) — xử lý PDF
//   có text-layer, Flate nén. PDF ảnh (không có text-layer) → báo cần OCR.
// - EPUB: mini unzip (EOCD + central dir + inflateRaw) + đọc XHTML theo spine.
// - URL: fetch + stripHtml (chỉ đúng trang đã dán, chặn URL nội bộ/SSRF).
//
// `ponytail:` PDF bỏ qua trang/cột khi làm citation (chỉ giữ heading + position);
// nâng cấp bằng lib đầy đủ (pdf-parse) khi orchestrator cho phép thêm dep.
// ===========================================================================

import { inflateRawSync, inflateSync } from 'node:zlib'
import { normalizeText, stripHtml, decodeEntitiesLoose, titleFromFilename } from './text'

export type ImportKind = 'pdf' | 'epub' | 'url' | 'text'

export interface ExtractedDoc {
  title: string
  text: string
}

export interface ExtractInput {
  kind: ImportKind
  /** File PDF/EPUB dưới dạng Buffer (không lưu tạm ra đĩa — tự "xóa" sau index). */
  data?: Buffer
  url?: string
  text?: string
  filename?: string
}

/** Dùng khi title từ file/HTML không có. */
const FALLBACK_TITLE = 'Tài liệu đã import'

// ---------------------------------------------------------------------------
// URL
// ---------------------------------------------------------------------------

/** Chặn SSRF: chỉ cho phép URL public. */
export function assertPublicUrl(raw: string): string {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new Error('URL không hợp lệ')
  }
  if (!/^https?:$/.test(url.protocol)) throw new Error('Chỉ hỗ trợ http/https')
  const host = url.hostname.replace(/^\[|\]$/g, '')
  if (host === 'localhost' || host === '127.0.0.1' || host === '::1' || host.endsWith('.local'))
    throw new Error('Không cho phép URL nội bộ')
  if (host === '169.254.169.254') throw new Error('Không cho phép truy cập metadata')
  const ipv4 = host.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/)
  if (ipv4) {
    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])]
    if (a === 10 || a === 127 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168))
      throw new Error('Không cho phép URL nội bộ')
  }
  return url.toString()
}

async function extractUrl(url: string): Promise<ExtractedDoc> {
  const safe = assertPublicUrl(url)
  const res = await fetch(safe, {
    headers: { 'user-agent': 'Mevabe-Library/0.1', accept: 'text/html,text/plain,application/pdf,*/*' },
    redirect: 'follow',
    signal: AbortSignal.timeout(15_000),
  })
  if (!res.ok) throw new Error(`Tải URL thất bại (HTTP ${res.status})`)
  const ctype = res.headers.get('content-type') ?? ''
  const raw = await res.text()
  const isHtml = /html|xml|xhtml/i.test(ctype) || /<html[\s>]/i.test(raw.slice(0, 2000))
  const title = raw.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || url
  return { title: decodeEntitiesLoose(title), text: isHtml ? stripHtml(raw) : raw }
}

// ---------------------------------------------------------------------------
// PDF (parser tối giản)
// ---------------------------------------------------------------------------

interface PdfObject {
  dict: string
  stream: Buffer | null
}

function pdfObjects(buf: Buffer): PdfObject[] {
  const s = buf.toString('latin1') // latin1 = 1 byte ↔ 1 char, giữ byte an toàn
  if (s.includes('/Encrypt')) throw new Error('PDF có mã hóa — chưa hỗ trợ')
  const objRe = /(\d+)\s+(\d+)\s+obj/g
  const matches: number[] = []
  while (objRe.exec(s)) matches.push(objRe.lastIndex)
  const out: PdfObject[] = []
  for (let k = 0; k < matches.length; k++) {
    const start = matches[k]!
    const end = k + 1 < matches.length ? matches[k + 1]! : s.length
    const body = s.slice(start, end)
    const streamIdx = body.indexOf('stream')
    const dict = streamIdx >= 0 ? body.slice(0, streamIdx) : body.split('endobj')[0]!
    let stream: Buffer | null = null
    if (streamIdx >= 0) {
      let p = start + streamIdx + 6
      while (p < buf.length && (buf[p] === 0x0a || buf[p] === 0x0d)) p++
      const es = buf.indexOf(Buffer.from('endstream'), p)
      if (es >= 0) {
        let e = es
        while (e > p && (buf[e - 1] === 0x0a || buf[e - 1] === 0x0d)) e--
        stream = buf.subarray(p, e)
      }
    }
    out.push({ dict, stream })
  }
  return out
}

function decodeStream(dict: string, raw: Buffer): Buffer {
  const flate =
    /\/Filter\s*\/FlateDecode/.test(dict) || /\/Filter\s*\[\s*\/FlateDecode/.test(dict)
  if (!flate) return raw
  try {
    return inflateRawSync(raw)
  } catch {
    try {
      return inflateSync(raw)
    } catch {
      return Buffer.alloc(0)
    }
  }
}

/** Quét content-stream: gom chuỗi (...) Tj / TJ + hex, xuống dòng khi gặp Td, TD, T*, Tlm, BT. */
function scanContent(decoded: string): string {
  let out = ''
  let i = 0
  const n = decoded.length
  while (i < n) {
    const c = decoded[i]!
    if (c === '(') {
      let depth = 1
      let j = i + 1
      const parts: string[] = []
      while (j < n && depth > 0) {
        const ch = decoded[j]!
        if (ch === '\\') {
          parts.push(decoded[j + 1] ?? '')
          j += 2
          continue
        }
        if (ch === '(') depth++
        else if (ch === ')') {
          depth--
          if (depth === 0) break
        }
        parts.push(ch)
        j++
      }
      out += parts.join('') + ' '
      i = j + 1
      continue
    }
    if (c === '<') {
      if (decoded[i + 1] === '<') {
        const k = decoded.indexOf('>>', i)
        i = k >= 0 ? k + 2 : n
        continue
      }
      const hm = decoded.slice(i).match(/^<([0-9a-fA-F\s]*)>/)
      if (hm) {
        const hex = hm[1]!.replace(/\s+/g, '')
        const padded = hex.length % 2 ? hex + '0' : hex
        const txt =
          padded.match(/.{2}/g)?.map((b) => String.fromCharCode(parseInt(b, 16))).join('') ?? ''
        out += txt + ' '
        i += hm[0].length
        continue
      }
      i++
      continue
    }
    const op = decoded.slice(i).match(/^[A-Za-z*]+/)
    if (op) {
      const w = op[0]!
      if (w === 'Td' || w === 'TD' || w === 'T*' || w === 'Tlm' || w === 'Tm' || w === 'BT' || w === 'ET')
        out += '\n'
      i += w.length
      continue
    }
    i++
  }
  return out
}

function extractPdf(buf: Buffer, filename?: string): ExtractedDoc {
  const objs = pdfObjects(buf)
  const s = buf.toString('latin1')
  const titleMatch = s.match(/\/Title\s*\((?:[^()\\]|\\.)*\)/)
  const title = titleMatch
    ? titleMatch[0].replace(/^\/Title\s*\(|\)$/g, '')
    : titleFromFilename(filename)
  const texts: string[] = []
  for (const obj of objs) {
    if (!obj.stream) continue
    const dec = decodeStream(obj.dict, obj.stream)
    const decStr = dec.toString('latin1')
    if (!decStr.includes('BT')) continue // bỏ font/ảnh, chỉ giữ content-stream
    const t = scanContent(decStr)
    if (t.trim()) texts.push(t)
  }
  const text = normalizeText(texts.join('\n'))
  if (!text) throw new Error('PDF không có text-layer (bản scan) — cần OCR, chưa cài Tesseract')
  return { title, text }
}

// ---------------------------------------------------------------------------
// EPUB (mini unzip + XHTML theo spine)
// ---------------------------------------------------------------------------

interface ZipEntry {
  name: string
  data: Buffer
}

function unzip(buf: Buffer): Map<string, ZipEntry> {
  let eocd = -1
  for (let i = buf.length - 22; i >= 0; i--) {
    if (buf[i] === 0x50 && buf[i + 1] === 0x4b && buf[i + 2] === 0x05 && buf[i + 3] === 0x06) {
      eocd = i
      break
    }
  }
  if (eocd < 0) throw new Error('EPUB không hợp lệ (thiếu EOCD)')
  const total = buf.readUInt16LE(eocd + 10)
  const cdOffset = buf.readUInt32LE(eocd + 16)
  const entries = new Map<string, ZipEntry>()
  let p = cdOffset
  for (let k = 0; k < total; k++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) break
    const method = buf.readUInt16LE(p + 10)
    const csize = buf.readUInt32LE(p + 20)
    const nameLen = buf.readUInt16LE(p + 28)
    const extraLen = buf.readUInt16LE(p + 30)
    const commentLen = buf.readUInt16LE(p + 32)
    const localOff = buf.readUInt32LE(p + 42)
    const name = buf.toString('utf8', p + 46, p + 46 + nameLen)
    const lNameLen = buf.readUInt16LE(localOff + 26)
    const lExtraLen = buf.readUInt16LE(localOff + 28)
    const dataStart = localOff + 30 + lNameLen + lExtraLen
    const raw = buf.subarray(dataStart, dataStart + csize)
    const data = method === 8 ? inflateRawSync(raw) : method === 0 ? Buffer.from(raw) : Buffer.alloc(0)
    entries.set(name, { name, data })
    p += 46 + nameLen + extraLen + commentLen
  }
  if (!entries.size) throw new Error('EPUB không có mục nào')
  return entries
}

function parseEpub(buf: Buffer): ExtractedDoc {
  const zip = unzip(buf)
  const container = zip.get('META-INF/container.xml')?.data.toString('utf8')
  if (!container) throw new Error('EPUB thiếu META-INF/container.xml')
  const opfPath = container.match(/full-path="([^"]+)"/)?.[1]
  if (!opfPath) throw new Error('EPUB thiếu đường dẫn OPF')
  const opf = zip.get(opfPath)?.data.toString('utf8') ?? ''
  const title = opf.match(/<dc:title[^>]*>([\s\S]*?)<\/dc:title>/)?.[1]?.trim() || FALLBACK_TITLE
  const manifest = new Map<string, string>()
  for (const item of opf.matchAll(/<item\b([^>]*)>/g)) {
    const attrs = item[1]!
    const id = attrs.match(/\bid="([^"]+)"/)?.[1]
    const href = attrs.match(/\bhref="([^"]+)"/)?.[1]
    if (id && href) manifest.set(id, href)
  }
  const spine: string[] = []
  for (const ref of opf.matchAll(/<itemref\b([^>]*)\/?>/g)) {
    const idref = ref[1]!.match(/\bidref="([^"]+)"/)?.[1]
    if (idref && manifest.has(idref)) spine.push(manifest.get(idref)!)
  }
  const base = opfPath.includes('/') ? opfPath.slice(0, opfPath.lastIndexOf('/') + 1) : ''
  const parts: string[] = []
  for (const href of spine) {
    const path = (base + href).replace(/\.\.\//g, '') // `ponytail:` bỏ ../ đơn giản — chỉ đọc từ zip map
    const content =
      zip.get(path)?.data.toString('utf8') ?? zip.get(href)?.data.toString('utf8') ?? ''
    parts.push(stripHtml(content))
  }
  if (!parts.length) throw new Error('EPUB không có nội dung XHTML trong spine')
  return { title, text: parts.join('\n\n') }
}

// ---------------------------------------------------------------------------
// Dispatch
// ---------------------------------------------------------------------------

export async function extractDocument(input: ExtractInput): Promise<ExtractedDoc> {
  switch (input.kind) {
    case 'url': {
      if (!input.url) throw new Error('Thiếu URL')
      return extractUrl(input.url)
    }
    case 'text': {
      const body = (input.text ?? '').trim()
      if (!body) throw new Error('Nội dung trống')
      return { title: titleFromFilename(input.filename), text: body }
    }
    case 'pdf': {
      if (!input.data?.length) throw new Error('Thiếu file PDF')
      return extractPdf(input.data, input.filename)
    }
    case 'epub': {
      if (!input.data?.length) throw new Error('Thiếu file EPUB')
      return parseEpub(input.data)
    }
  }
}
