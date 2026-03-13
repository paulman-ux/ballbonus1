/**
 * Catch-up — Wed 22:30 UTC. Skips if already stored today.
 */
import { schedule } from '@netlify/functions'
import { getStore } from '@netlify/blobs'

export const handler = schedule('30 22 * * 3', async () => {
  try {
    const store    = getStore('ballbonus')
    const existing = await store.get('latest-result', { type: 'json' }).catch(() => null)
    if (existing?.fetchedAt) {
      const f = new Date(existing.fetchedAt), n = new Date()
      if (f.getUTCFullYear()===n.getUTCFullYear() && f.getUTCMonth()===n.getUTCMonth() && f.getUTCDate()===n.getUTCDate()) {
        console.log('catchup: already stored today'); return { statusCode: 200 }
      }
    }
    const csvUrl = process.env.LOTTO_RESULT_CSV_URL
    if (!csvUrl) throw new Error('LOTTO_RESULT_CSV_URL not set')
    const res    = await fetch(csvUrl)
    const lines  = (await res.text()).trim().split('\n').map(l => l.split(',').map(s => s.trim().replace(/^"|"$/g, '')))
    const result = { drawDate: lines[1][0], bonusBall: parseInt(lines[1][1],10), fetchedAt: new Date().toISOString() }
    await store.setJSON('latest-result', result)
    console.log('catchup: stored', JSON.stringify(result))
  } catch (e) { console.error('catchup error:', e.message) }
  return { statusCode: 200 }
})
