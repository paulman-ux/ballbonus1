/**
 * Catch-up scheduled function — Wed 22:30 UTC (10:30pm Irish winter)
 * Only runs if the 21:30 attempt didn't store a result yet today.
 */
import { schedule } from '@netlify/functions'
import { getStore } from '@netlify/blobs'
import { RESULTS_URL, HEADERS, parseLatestWednesday } from './parser.mjs'

export const handler = schedule('30 22 * * 3', async () => {
  try {
    const store = getStore('ballbonus')

    // Skip if already stored today
    const existing = await store.get('latest-result', { type: 'json' }).catch(() => null)
    if (existing?.fetchedAt) {
      const fetched = new Date(existing.fetchedAt)
      const now     = new Date()
      const sameDay = fetched.getUTCFullYear() === now.getUTCFullYear() &&
                      fetched.getUTCMonth()    === now.getUTCMonth() &&
                      fetched.getUTCDate()     === now.getUTCDate()
      if (sameDay) { console.log('catchup: already stored today, skipping'); return { statusCode: 200 } }
    }

    const res = await fetch(RESULTS_URL, { headers: HEADERS })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const result = parseLatestWednesday(await res.text())
    if (!result) { console.log('catchup: result not posted yet'); return { statusCode: 200 } }
    await store.setJSON('latest-result', result)
    console.log('catchup: stored', JSON.stringify(result))
  } catch (e) {
    console.error('catchup error:', e.message)
  }
  return { statusCode: 200 }
})
