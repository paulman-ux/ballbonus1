/**
 * GET /api/state
 * Returns the current syndicate state from Netlify Blobs.
 */
import { getStore } from '@netlify/blobs'

export const DEFAULT_STATE = {
  rollover: 0,
  weekIndex: 0,
  resolved: false,
  winNum: null,
  lastDrawDate: null,
}

export default async () => {
  try {
    const store = getStore('ballbonus')
    const state = await store.get('state', { type: 'json' }).catch(() => null)
    return new Response(JSON.stringify({ ok: true, state: state || DEFAULT_STATE }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    })
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 500 })
  }
}
export const config = { path: '/api/state' }
