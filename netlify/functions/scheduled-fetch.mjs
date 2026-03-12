/**
 * Scheduled function — Wed 21:30 UTC (9:30pm Irish winter / 10:30pm summer)
 * Automatically fetches and stores the Wednesday bonus ball.
 */
import { schedule } from '@netlify/functions'
import { getStore } from '@netlify/blobs'
import { RESULTS_URL, HEADERS, parseLatestWednesday } from './parser.mjs'

async function run(label) {
  const res = await fetch(RESULTS_URL, { headers: HEADERS })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const result = parseLatestWednesday(await res.text())
  if (!result) { console.log(`${label}: result not posted yet`); return }
  const store = getStore('ballbonus')
  await store.setJSON('latest-result', result)
  console.log(`${label}: stored`, JSON.stringify(result))
}

// Primary: 21:30 UTC Wednesday
export const handler = schedule('30 21 * * 3', async () => {
  try { await run('primary') } catch (e) { console.error('primary error:', e.message) }
  return { statusCode: 200 }
})
