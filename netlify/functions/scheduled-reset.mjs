/**
 * Scheduled — every Sunday at 00:01 UTC
 * Automatically advances to the next week.
 * Clears lastResult so the countdown shows instead of the banner.
 */
import { schedule } from '@netlify/functions'
import { getStore } from '@netlify/blobs'

const DEFAULT_STATE = {
  rollover: 0, weekIndex: 0, resolved: false,
  winNum: null, lastDrawDate: null, lastResult: null,
}

export const handler = schedule('1 0 * * 0', async () => {
  try {
    const store    = getStore('ballbonus')
    const state    = await store.get('state', { type: 'json' }).catch(() => null) || DEFAULT_STATE

    // Only advance if a result was applied this week
    if (!state.lastResult) {
      console.log('sunday-reset: no result this week, nothing to do')
      return { statusCode: 200 }
    }

    const newState = {
      ...state,
      lastResult: null,   // clears the banner, shows countdown
    }

    await store.setJSON('state', newState)
    console.log('sunday-reset: cleared lastResult, new week ready. rollover=€' + newState.rollover.toFixed(2))
  } catch (e) {
    console.error('sunday-reset error:', e.message)
  }
  return { statusCode: 200 }
})
