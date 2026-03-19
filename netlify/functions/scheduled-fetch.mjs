/**
 * Scheduled — Wed 21:30 UTC (9:30pm Irish winter time)
 * Reads bonus ball from Google Sheet and stores in Netlify Blobs.
 */
import { schedule } from '@netlify/functions'
import { getStore } from '@netlify/blobs'

async function fetchAndStore() {
  const csvUrl = process.env.LOTTO_RESULT_CSV_URL
  if (!csvUrl) throw new Error('LOTTO_RESULT_CSV_URL not set')
  const res   = await fetch(csvUrl)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const lines = (await res.text()).trim().split('\n').map(l => l.split(',').map(s => s.trim().replace(/^"|"$/g, '')))
  if (lines.length < 2) throw new Error('No data row in sheet')
  const rawDate   = lines[1][0]
    // Normalise date to dd/mm/yy
    const MONTHS = { January:'01',February:'02',March:'03',April:'04',May:'05',June:'06',July:'07',August:'08',September:'09',October:'10',November:'11',December:'12' }
    const dm = lines[1][0].match(/(\d{1,2})(?:st|nd|rd|th)?\s+(\w+)\s+(\d{4})/)
    const drawDate = dm ? `${dm[1].padStart(2,'0')}/${MONTHS[dm[2]] || '??'}/${dm[3].slice(2)}` : lines[1][0]
  
  const bonusBall = parseInt(lines[1][1], 10)
  if (!drawDate || isNaN(bonusBall)) throw new Error(`Bad data: ${lines[1]}`)
  const result = { drawDate, bonusBall, fetchedAt: new Date().toISOString() }
  await getStore('ballbonus').setJSON('latest-result', result)
  console.log('scheduled-fetch: stored', JSON.stringify(result))
}

export const handler = schedule('30 21 * * 3', async () => {
  try { await fetchAndStore() } catch (e) { console.error('scheduled-fetch error:', e.message) }
  return { statusCode: 200 }
})
