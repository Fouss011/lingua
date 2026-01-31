import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const SUPABASE_URL = process.env.SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const BUCKET = process.env.SUPABASE_BUCKET || 'lingua-audio'
const PREFIX = (process.env.SUPABASE_PREFIX || '').trim() // ex: "mina/" si tu as des dossiers

if (!SUPABASE_URL || !KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env')
  process.exit(1)
}

const sb = createClient(SUPABASE_URL, KEY, { auth: { persistSession: false } })

async function listAllFiles(bucket, prefix = '') {
  const out = []

  async function walk(path) {
    const { data, error } = await sb.storage.from(bucket).list(path, {
      limit: 1000,
      sortBy: { column: 'name', order: 'asc' },
    })
    if (error) throw error
    if (!data) return

    for (const item of data) {
      const fullPath = path ? `${path}/${item.name}` : item.name
      if (item.id === null) {
        // folder
        await walk(fullPath)
      } else {
        // file
        out.push({
          path: fullPath,
          name: item.name,
          size: item.metadata?.size ?? null,
          mimetype: item.metadata?.mimetype ?? null,
          created_at: item.created_at ?? null,
          updated_at: item.updated_at ?? null,
        })
      }
    }
  }

  await walk(prefix)
  return out
}

async function fetchAllRows(table, pageSize = 1000) {
  // pagination simple (0..)
  const all = []
  for (let from = 0; ; from += pageSize) {
    const to = from + pageSize - 1
    const { data, error } = await sb.from(table).select('*').range(from, to)
    if (error) throw error
    if (!data || data.length === 0) break
    all.push(...data)
    if (data.length < pageSize) break
  }
  return all
}

function toCSV(rows) {
  if (!rows || rows.length === 0) return ''
  const cols = Object.keys(rows[0])
  const esc = (v) => {
    if (v === null || v === undefined) return ''
    const s = String(v)
    if (s.includes('"') || s.includes(',') || s.includes('\n')) return `"${s.replaceAll('"', '""')}"`
    return s
  }
  const header = cols.join(',')
  const lines = rows.map(r => cols.map(c => esc(r[c])).join(','))
  return [header, ...lines].join('\n')
}

async function main() {
  console.log(`➡️ Exporting from Supabase…`)
  console.log(`- bucket: ${BUCKET}`)
  console.log(`- prefix: "${PREFIX}"`)

  // 1) tables
  const audioItems = await fetchAllRows('audio_items')
  const entries = await fetchAllRows('entries')

  console.log(`✅ audio_items rows: ${audioItems.length}`)
  console.log(`✅ entries rows: ${entries.length}`)

  // 2) storage
  const files = await listAllFiles(BUCKET, PREFIX)
  console.log(`✅ storage files: ${files.length}`)

  // 3) URLs (public if possible, else signed)
  // - publicUrl marche si bucket public (comme sur ta capture)
  // - sinon on fallback en signedUrl
  const storageRows = []
  for (const f of files) {
    let url = null
    const { data: pub } = sb.storage.from(BUCKET).getPublicUrl(f.path)
    if (pub?.publicUrl) url = pub.publicUrl

    if (!url) {
      const { data, error } = await sb.storage.from(BUCKET).createSignedUrl(f.path, 60 * 60)
      url = error ? null : data.signedUrl
    }

    storageRows.push({ ...f, url })
  }

  // 4) output
  fs.mkdirSync('exports', { recursive: true })

  const payload = {
    project: 'lingua-dataset',
    exportedAt: new Date().toISOString(),
    bucket: BUCKET,
    prefix: PREFIX,
    tables: {
      audio_items: audioItems,
      entries: entries,
    },
    storage: storageRows,
  }

  fs.writeFileSync('exports/lingua_export.json', JSON.stringify(payload, null, 2), 'utf-8')
  fs.writeFileSync('exports/audio_items.csv', toCSV(audioItems), 'utf-8')
  fs.writeFileSync('exports/entries.csv', toCSV(entries), 'utf-8')
  fs.writeFileSync('exports/storage_files.csv', toCSV(storageRows), 'utf-8')

  console.log('✅ Done:')
  console.log('- exports/lingua_export.json')
  console.log('- exports/audio_items.csv')
  console.log('- exports/entries.csv')
  console.log('- exports/storage_files.csv')
}

main().catch((e) => {
  console.error('❌ Export failed:', e?.message || e)
  process.exit(1)
})
