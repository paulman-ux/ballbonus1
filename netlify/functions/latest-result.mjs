/**
 * GET /api/latest-result
 * Returns the most recently stored Wednesday result from Netlify Blobs.
 */
import { getStore } from '@netlify/blobs'

export default async () => {
  try {
    const result = await getStore('ballbonus').get('latest-result', { type: 'json' })
    if (!result) {
      return new Response(JSON.stringify({ ok: false, error: 'No result stored yet' }), { status: 404 })
    }
    return new Response(JSON.stringify({ ok: true, result }), { status: 200 })
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 500 })
  }
}
export const config = { path: '/api/latest-result' }
