/**
 * Scheduled — every Wednesday 21:30 UTC (9:30pm Irish winter time)
 * Fetches bonus ball, calculates winner/rollover, advances week — fully automatic.
 */
import { schedule } from '@netlify/functions'
import { getStore } from '@netlify/blobs'

const WEEKLY_FEE = 2.50
const MONTHS = { January:'01',February:'02',March:'03',April:'04',May:'05',June:'06',July:'07',August:'08',September:'09',October:'10',November:'11',December:'12' }

function normaliseDate(raw) {
  const m = raw.match(/(\d{1,2})(?:st|nd|rd|th)?\s+(\w+)\s+(\d{4})/)
  if (!m) return raw
  return `${m[1].padStart(2,'0')}/${MONTHS[m[2]] || '??'}/${m[3].slice(2)}`
}

const DEFAULT_STATE = { rollover: 0, weekIndex: 0, resolved: false, winNum: null, lastDrawDate: null }

export const handler = schedule('30 21 * * 3', async () => {
  try {
    const store = getStore('ballbonus')

    // 1. Fetch bonus ball from Google Sheet
    const csvUrl = process.env.LOTTO_RESULT_CSV_URL
    if (!csvUrl) throw new Error('LOTTO_RESULT_CSV_URL not set')
    const res   = await fetch(csvUrl)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const lines = (await res.text()).trim().split('\n').map(l => l.split(',').map(s => s.trim().replace(/^"|"$/g, '')))
    if (lines.length < 2) throw new Error('No data row in result sheet')
    const drawDate  = normaliseDate(lines[1][0])
    const bonusBall = parseInt(lines[1][1], 10)
    if (!drawDate || isNaN(bonusBall)) throw new Error(`Bad result data: ${lines[1]}`)

    // 2. Store result blob for frontend polling
    await store.setJSON('latest-result', { drawDate, bonusBall, fetchedAt: new Date().toISOString() })

    // 3. Load current state
    const state = await store.get('state', { type: 'json' }).catch(() => null) || DEFAULT_STATE

    // 4. Skip if already applied
    if (drawDate === state.lastDrawDate) {
      console.log('scheduled-fetch: already applied, skipping')
      return { statusCode: 200 }
    }

    // 5. Fetch roster to get player count and check for winner
    const rosterUrl = process.env.GOOGLE_SHEET_CSV_URL
    if (!rosterUrl) throw new Error('GOOGLE_SHEET_CSV_URL not set')
    const rRes    = await fetch(rosterUrl)
    const rLines  = (await rRes.text()).trim().split('\n')
    let playerCount = 0
    let winnerName  = null
    for (const line of rLines) {
      const cols   = line.split(',').map(s => s.trim().replace(/^"|"$/g, ''))
      const num    = parseInt(cols[1], 10)
      if (isNaN(num)) continue
      playerCount++
      if (num === bonusBall) winnerName = cols[0]
    }

    // 6. Calculate pot and new state
    const pot      = playerCount * WEEKLY_FEE + state.rollover
    const newState = {
      rollover:     winnerName ? 0 : pot,
      weekIndex:    state.weekIndex + 1,
      resolved:     false,
      winNum:       null,
      lastDrawDate: drawDate,
      lastResult:   { bonusBall, drawDate, winnerName, pot },
    }

    await store.setJSON('state', newState)
    console.log(`scheduled-fetch: ball #${bonusBall}, winner=${winnerName||'none'}, pot=€${pot.toFixed(2)}, rollover=€${newState.rollover.toFixed(2)}, now week ${newState.weekIndex + 1}`)

  } catch (e) {
    console.error('scheduled-fetch error:', e.message)
  }
  return { statusCode: 200 }
})
