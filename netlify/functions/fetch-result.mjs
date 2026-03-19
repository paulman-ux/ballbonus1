/**
 * POST /api/fetch-result
 * Reads the latest Wednesday bonus ball from a published Google Sheet CSV.
 * Sheet has headers: drawDate, bonusBall
 * Set LOTTO_RESULT_CSV_URL in Netlify environment variables.
 */
import { getStore } from '@netlify/blobs'

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, error: 'POST only' }), { status: 405 })
  }

  const csvUrl = process.env.LOTTO_RESULT_CSV_URL
  if (!csvUrl) {
    return new Response(JSON.stringify({ ok: false, error: 'LOTTO_RESULT_CSV_URL not configured in Netlify environment variables' }), { status: 500 })
  }

  try {
    const res = await fetch(csvUrl)
    if (!res.ok) throw new Error(`HTTP ${res.status} fetching sheet`)
    const csv = await res.text()

    // Parse CSV — expect header row then data row
    const lines = csv.trim().split('\n').map(l => l.split(',').map(s => s.trim().replace(/^"|"$/g, '')))
    // lines[0] = ['drawDate','bonusBall'], lines[1] = ['11th March 2026','14']
    if (lines.length < 2) throw new Error('Sheet has no data row')

    const [, dataRow] = lines
    const rawDate   = dataRow[0]
    const bonusBall = parseInt(dataRow[1], 10)

    // Normalise date to dd/mm/yy to match app history format
    const MONTHS = { January:'01',February:'02',March:'03',April:'04',May:'05',June:'06',July:'07',August:'08',September:'09',October:'10',November:'11',December:'12' }
    const dm = rawDate.match(/(\d{1,2})(?:st|nd|rd|th)?\s+(\w+)\s+(\d{4})/)
    const drawDate = dm ? `${dm[1].padStart(2,'0')}/${MONTHS[dm[2]] || '??'}/${dm[3].slice(2)}` : rawDate

    if (!drawDate || isNaN(bonusBall) || bonusBall < 1 || bonusBall > 47) {
      return new Response(JSON.stringify({ ok: false, error: `Invalid data in sheet: date="${drawDate}" ball="${dataRow[1]}"` }), { status: 422 })
    }

    const result = { drawDate, bonusBall, fetchedAt: new Date().toISOString() }

    const store = getStore('ballbonus')
    await store.setJSON('latest-result', result)
    console.log('fetch-result: stored', JSON.stringify(result))

    return new Response(JSON.stringify({ ok: true, result }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    })
  } catch (err) {
    console.error('fetch-result error:', err.message)
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    })
  }
}

export const config = { path: '/api/fetch-result' }
