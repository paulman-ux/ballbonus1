/**
 * GET /api/state
 * Returns the current syndicate state from Netlify Blobs.
 * If nothing is stored yet, returns the current real-world state.
 */
import { getStore } from '@netlify/blobs'

// Current real state — week 3, €80 rollover from weeks 1 & 2
const DEFAULT_STATE = {
  rollover: 80,
  weekIndex: 2,
  resolved: false,
  winNum: null,
  lastDrawDate: '26/03/26',
  lastResult: null,
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
