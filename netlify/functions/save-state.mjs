/**
 * POST /api/save-state
 * Saves the full syndicate state to Netlify Blobs.
 * Called from /admin when applying a result or starting a new week.
 */
import { getStore } from '@netlify/blobs'

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, error: 'POST only' }), { status: 405 })
  }
  try {
    const body  = await req.json()
    const store = getStore('ballbonus')
    await store.setJSON('state', body.state)
    console.log('save-state:', JSON.stringify(body.state))
    return new Response(JSON.stringify({ ok: true }), { status: 200 })
  } catch (err) {
    console.error('save-state error:', err.message)
    return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 500 })
  }
}
export const config = { path: '/api/save-state' }
