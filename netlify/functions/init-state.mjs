/**
 * GET /api/init-state
 * One-time use: sets the correct state for week 3 with €80 rollover.
 * Safe to call again — it only sets state if rollover is currently wrong.
 */
import { getStore } from '@netlify/blobs'

export default async () => {
  try {
    const store    = getStore('ballbonus')
    const existing = await store.get('state', { type: 'json' }).catch(() => null)

    const correctState = {
      rollover:     80,
      weekIndex:    2,      // week 3 is index 2 (zero-based)
      resolved:     false,
      winNum:       null,
      lastDrawDate: '19/03/26',
      lastResult: {
        bonusBall:  43,
        drawDate:   '19/03/26',
        winnerName: null,
        pot:        40.00,
      },
    }

    await store.setJSON('state', correctState)
    return new Response(JSON.stringify({ ok: true, state: correctState, previous: existing }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    })
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 500 })
  }
}

export const config = { path: '/api/init-state' }
