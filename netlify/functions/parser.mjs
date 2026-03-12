/**
 * Shared result parser for irish.national-lottery.com
 * Returns { drawDate, bonusBall, mainNumbers, fetchedAt } or null
 */
export const RESULTS_URL = 'https://irish.national-lottery.com/irish-lotto/past-results'

export const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
}

const MONTHS = {
  January:'01', February:'02', March:'03',     April:'04',
  May:'05',     June:'06',     July:'07',       August:'08',
  September:'09',October:'10', November:'11',   December:'12',
}

export function parseLatestWednesday(html) {
  // The table rows contain the draw date as text and numbers in <li> tags
  // We scan for the first Wednesday row in the table
  const tableMatch = html.match(/<table[\s\S]*?<\/table>/i)
  if (!tableMatch) return null

  const table = tableMatch[0]
  const rowRegex = /<tr[\s\S]*?<\/tr>/gi
  let row

  while ((row = rowRegex.exec(table)) !== null) {
    const rowHtml = row[0]

    // Must contain "Wednesday"
    if (!/Wednesday/i.test(rowHtml)) continue

    // Extract date
    const dateMatch = rowHtml.match(/(\d{1,2})(?:st|nd|rd|th)\s+(\w+)\s+(\d{4})/)
    if (!dateMatch) continue

    const day   = dateMatch[1].padStart(2, '0')
    const month = MONTHS[dateMatch[2]]
    if (!month) continue
    const year  = dateMatch[3].slice(2)
    const drawDate = `${day}/${month}/${year}`

    // Extract all numbers from <li> tags in this row
    const liMatches = [...rowHtml.matchAll(/<li[^>]*>\s*(\d{1,2})\s*<\/li>/gi)]
    const numbers = liMatches.map(m => parseInt(m[1], 10)).filter(n => n >= 1 && n <= 47)

    // Need exactly 7 (6 main + 1 bonus)
    if (numbers.length < 7) continue

    return {
      drawDate,
      bonusBall:   numbers[6],
      mainNumbers: numbers.slice(0, 6),
      fetchedAt:   new Date().toISOString(),
    }
  }

  return null
}
