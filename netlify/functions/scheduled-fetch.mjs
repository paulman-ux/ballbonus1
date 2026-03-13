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
  const drawDate  = lines[1][0]
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
