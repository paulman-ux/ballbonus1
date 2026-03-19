/**
 * GET /api/latest-result
 * Returns the most recently stored Wednesday result from Netlify Blobs.
 * The frontend polls this on Wednesday evenings to pick up the auto-fetched result.
 */
import { getStore } from '@netlify/blobs'

export default async () => {
  try {
    const store  = getStore('ballbonus')
    const result = await store.get('latest-result', { type: 'json' })
    if (!result) {
      return new Response(JSON.stringify({ ok: false, error: 'No result stored yet' }), {
        status: 404, headers: { 'Content-Type': 'application/json' }
      })
    }
    return new Response(JSON.stringify({ ok: true, result }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    })
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    })
  }
}

export const config = { path: '/api/latest-result' }
