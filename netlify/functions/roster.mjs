/**
 * GET /api/roster
 * Fetches participants from Google Sheets CSV.
 * Sheet columns: A = Name, B = Ball number
 */
export default async () => {
  const csvUrl = process.env.GOOGLE_SHEET_CSV_URL
  if (!csvUrl) {
    return new Response(JSON.stringify({ ok: false, error: 'GOOGLE_SHEET_CSV_URL not configured' }), { status: 500 })
  }
  try {
    const res  = await fetch(csvUrl)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const csv  = await res.text()
    const participants = []
    for (const line of csv.split('\n')) {
      const cols   = line.split(',').map(s => s.trim().replace(/^"|"$/g, ''))
      const number = parseInt(cols[1], 10)
      if (!cols[0] || isNaN(number)) continue
      participants.push({ name: cols[0], number })
    }
    return new Response(JSON.stringify({ ok: true, participants }), {
      status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'max-age=300' }
    })
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 500 })
  }
}
export const config = { path: '/api/roster' }
