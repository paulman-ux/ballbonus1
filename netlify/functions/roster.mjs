/**
 * GET /api/roster
 * Fetches the participant list from a public Google Sheet published as CSV.
 * Set GOOGLE_SHEET_CSV_URL in Netlify environment variables.
 * Sheet format: Column A = Name, Column B = Ball number
 */
export default async () => {
  const csvUrl = process.env.GOOGLE_SHEET_CSV_URL

  if (!csvUrl) {
    return new Response(JSON.stringify({ ok: false, error: 'GOOGLE_SHEET_CSV_URL not configured' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const res = await fetch(csvUrl)
    if (!res.ok) throw new Error(`HTTP ${res.status} fetching sheet`)
    const csv = await res.text()

    const participants = []
    for (const line of csv.split('\n')) {
      const cols = line.split(',').map(s => s.trim().replace(/^"|"$/g, ''))
      const [rawName, rawNum] = cols
      if (!rawName || !rawNum) continue
      const number = parseInt(rawNum, 10)
      if (isNaN(number)) continue  // skip header row
      participants.push({ name: rawName, number })
    }

    return new Response(JSON.stringify({ ok: true, participants }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'max-age=300' }
    })
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    })
  }
}

export const config = { path: '/api/roster' }
