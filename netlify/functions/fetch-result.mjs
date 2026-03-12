/**
 * POST /api/fetch-result
 * Fetches the latest Wednesday bonus ball from irish.national-lottery.com
 * and stores it in Netlify Blobs. Called from /admin and by scheduled functions.
 */
import { getStore } from '@netlify/blobs'
import { RESULTS_URL, HEADERS, parseLatestWednesday } from './parser.mjs'

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, error: 'POST only' }), { status: 405 })
  }

  try {
    const res = await fetch(RESULTS_URL, { headers: HEADERS })
    if (!res.ok) throw new Error(`HTTP ${res.status} from lottery site`)

    const html   = await res.text()
    const result = parseLatestWednesday(html)

    if (!result) {
      return new Response(JSON.stringify({
        ok: false,
        error: "Wednesday result not found — the draw may not be posted yet. Try again after 9:30pm or enter the bonus ball manually below."
      }), { status: 422, headers: { 'Content-Type': 'application/json' } })
    }

    // Store in Netlify Blobs
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
