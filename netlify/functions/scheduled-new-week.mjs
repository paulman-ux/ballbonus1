/**
 * Scheduled — every Sunday 08:00 UTC
 * Advances to the new week. The lastResult is kept so the
 * public app can still show it if needed, but the countdown
 * resets and the pot reflects the new rollover total.
 */
import { schedule } from '@netlify/functions'
import { getStore } from '@netlify/blobs'

const DEFAULT_STATE = {
  rollover: 0, weekIndex: 0, resolved: false,
  winNum: null, lastDrawDate: null, lastResult: null,
}

export const handler = schedule('0 8 * * 0', async () => {
  try {
    const store = getStore('ballbonus')
    const state = await store.get('state', { type: 'json' }).catch(() => null) || DEFAULT_STATE

    // Only advance if a result was applied this week
    if (!state.lastResult) {
      console.log('new-week: no result yet, skipping')
      return { statusCode: 200 }
    }

    const newState = {
      ...state,
      resolved:  false,
      winNum:    null,
      // Keep lastResult so /admin shows last draw info
      // weekIndex was already advanced when result was applied
    }

    await store.setJSON('state', newState)
    console.log('new-week: advanced to week', newState.weekIndex + 1, 'rollover €', newState.rollover)
  } catch (e) {
    console.error('new-week error:', e.message)
  }
  return { statusCode: 200 }
})
