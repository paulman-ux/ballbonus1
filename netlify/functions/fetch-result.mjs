/**
 * POST /api/fetch-result
 * Reads latest Wednesday bonus ball from Google Sheet CSV and stores in Netlify Blobs.
 * Sheet format: header row (drawDate, bonusBall), then data row.
 * Date is normalised to dd/mm/yy format.
 */
import { getStore } from '@netlify/blobs'

const MONTHS = { January:'01',February:'02',March:'03',April:'04',May:'05',June:'06',July:'07',August:'08',September:'09',October:'10',November:'11',December:'12' }

function normaliseDate(raw) {
  const m = raw.match(/(\d{1,2})(?:st|nd|rd|th)?\s+(\w+)\s+(\d{4})/)
  if (!m) return raw
  return `${m[1].padStart(2,'0')}/${MONTHS[m[2]] || '??'}/${m[3].slice(2)}`
}

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, error: 'POST only' }), { status: 405 })
  }
  const csvUrl = process.env.LOTTO_RESULT_CSV_URL
  if (!csvUrl) {
    return new Response(JSON.stringify({ ok: false, error: 'LOTTO_RESULT_CSV_URL not configured' }), { status: 500 })
  }
  try {
    const res   = await fetch(csvUrl)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const lines = (await res.text()).trim().split('\n').map(l => l.split(',').map(s => s.trim().replace(/^"|"$/g, '')))
    if (lines.length < 2) throw new Error('Sheet has no data row')
    const drawDate  = normaliseDate(lines[1][0])
    const bonusBall = parseInt(lines[1][1], 10)
    if (!drawDate || isNaN(bonusBall) || bonusBall < 1 || bonusBall > 47) {
      return new Response(JSON.stringify({ ok: false, error: `Invalid data: date="${lines[1][0]}" ball="${lines[1][1]}"` }), { status: 422 })
    }
    const result = { drawDate, bonusBall, fetchedAt: new Date().toISOString() }
    await getStore('ballbonus').setJSON('latest-result', result)
    console.log('fetch-result stored:', JSON.stringify(result))
    return new Response(JSON.stringify({ ok: true, result }), { status: 200 })
  } catch (err) {
    console.error('fetch-result error:', err.message)
    return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 500 })
  }
}
export const config = { path: '/api/fetch-result' }
