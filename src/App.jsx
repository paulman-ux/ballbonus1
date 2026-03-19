import { useState, useEffect } from 'react'

// ─────────────────────────────────────────────
// Constants & palette
// ─────────────────────────────────────────────
const C = {
  blue:       '#2279B5',
  pink:       '#D4257A',
  orange:     '#E08C00',
  teal:       '#1FA6A6',
  bg:         '#F0F4F8',
  surface:    '#FFFFFF',
  surfaceAlt: '#F7FAFC',
  text:       '#1A2B3C',
  muted:      '#607A90',
  border:     'rgba(34,121,181,0.15)',
}
const COLS        = [C.blue, C.pink, C.orange, C.teal]
const TOTAL       = 47
const BLOCK_WEEKS = 8
const BLOCK_FEE   = 20
const WEEKLY_FEE  = BLOCK_FEE / BLOCK_WEEKS   // €2.50
const SK          = 'ballbonus_v1'

// ─────────────────────────────────────────────
// localStorage helpers
// ─────────────────────────────────────────────
const BLANK = { history: [], rollover: 0, weekIndex: 0, resolved: false, winNum: null, lastDrawDate: null }
const load  = () => { try { const r = localStorage.getItem(SK); return r ? JSON.parse(r) : null } catch { return null } }
const save  = s  => { try { localStorage.setItem(SK, JSON.stringify(s)) } catch {} }

// ─────────────────────────────────────────────
// Time helpers
// ─────────────────────────────────────────────
function nextWed() {
  const now = new Date(), n = new Date(now)
  n.setHours(19, 55, 0, 0)
  let d = (3 - now.getDay() + 7) % 7
  if (d === 0 && now >= n) d = 7
  n.setDate(now.getDate() + d)
  return n
}

// Show result banner Wed 20:00 → end of Saturday
function inResultWindow() {
  const d = new Date().getDay(), h = new Date().getHours()
  return (d === 3 && h >= 20) || d === 4 || d === 5 || d === 6
}

const pad = v => String(v ?? 0).padStart(2, '0')

// ─────────────────────────────────────────────
// Tiny style helpers
// ─────────────────────────────────────────────
const card = (x = {}) => ({
  background: C.surface, border: `1px solid ${C.border}`,
  borderRadius: '14px', padding: '16px', marginBottom: '12px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)', ...x,
})
const label = (col, txt) => (
  <span style={{ background: `${col}14`, border: `1px solid ${col}40`, borderRadius: '20px', padding: '3px 12px', fontSize: '12px', color: col, fontWeight: 600 }}>
    {txt}
  </span>
)
const btn = (col, text, onClick, disabled = false) => (
  <button onClick={onClick} disabled={disabled} style={{ width: '100%', padding: '13px', borderRadius: '10px', background: disabled ? '#E8EEF4' : col, border: 'none', color: disabled ? C.muted : '#fff', fontSize: '15px', fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', boxShadow: disabled ? 'none' : `0 3px 10px ${col}40`, transition: 'all 0.2s', marginTop: '10px' }}>
    {text}
  </button>
)

// ─────────────────────────────────────────────
// Shared components
// ─────────────────────────────────────────────
function Crest() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="19" fill={C.surface} stroke={C.blue} strokeWidth="2"/>
      <rect x="15" y="9" width="10" height="13" rx="1.5" fill={C.blue}/>
      <rect x="12" y="11.5" width="3.5" height="6" rx="1" fill={C.blue} opacity="0.5"/>
      <rect x="24.5" y="11.5" width="3.5" height="6" rx="1" fill={C.blue} opacity="0.5"/>
      <circle cx="14.5" cy="29" r="3.5" fill={C.pink}/>
      <circle cx="25.5" cy="29" r="3.5" fill={C.orange}/>
      <circle cx="20" cy="30.5" r="3.5" fill={C.teal}/>
    </svg>
  )
}

function Countdown() {
  const [tl, setTl] = useState({})
  useEffect(() => {
    const tick = () => {
      const diff = nextWed() - new Date()
      setTl({ d: Math.floor(diff/86400000), h: Math.floor((diff%86400000)/3600000), m: Math.floor((diff%3600000)/60000), s: Math.floor((diff%60000)/1000) })
    }
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id)
  }, [])
  return (
    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
      {[['Days',tl.d],['Hrs',tl.h],['Min',tl.m],['Sec',tl.s]].map(([l,v],i) => (
        <div key={l} style={{ background: C.surface, border: `2px solid ${COLS[i]}`, borderRadius: '11px', padding: '9px 13px', minWidth: '62px', textAlign: 'center', boxShadow: `0 2px 8px ${COLS[i]}22` }}>
          <div style={{ fontSize: '25px', fontFamily: "'DM Serif Display',serif", color: COLS[i], lineHeight: 1 }}>{pad(v)}</div>
          <div style={{ fontSize: '10px', color: C.muted, letterSpacing: '2px', textTransform: 'uppercase', marginTop: '3px' }}>{l}</div>
        </div>
      ))}
    </div>
  )
}

function Ball({ n, owner, isWinner }) {
  const bc = COLS[n % 4]
  let bg = C.surfaceAlt, border = `1px solid ${C.border}`, tc = '#BCC8D4', sh = 'none'
  if (owner)    { bg = `${bc}14`; border = `2px solid ${bc}`;       tc = bc;     sh = `0 2px 8px ${bc}28` }
  if (isWinner) { bg = C.orange;  border = `2px solid ${C.orange}`; tc = '#fff'; sh = `0 4px 14px ${C.orange}50` }
  return (
    <div title={owner?.name ?? ''} style={{ position: 'relative', width: '42px', height: '42px', flexShrink: 0, marginBottom: '20px' }}>
      <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: bg, border, color: tc, fontSize: '13px', fontWeight: 700, fontFamily: "'DM Serif Display',serif", display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: sh, transition: 'all 0.2s' }}>
        {n}
      </div>
      {owner && (
        <div style={{ position: 'absolute', bottom: '-16px', left: '50%', transform: 'translateX(-50%)', fontSize: '9px', color: isWinner ? C.orange : bc, whiteSpace: 'nowrap', fontWeight: 700, maxWidth: '52px', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center' }}>
          {owner.name.split(' ')[0]}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// Admin page (/admin)
// ─────────────────────────────────────────────
function AdminPage({ state, setState, players }) {
  const [status, setStatus]   = useState('idle')  // idle|busy|ok|error|dupe
  const [msg, setMsg]         = useState('')
  const [fetched, setFetched] = useState(null)     // { bonusBall, drawDate }
  const [manual, setManual]   = useState('')
  const [manErr, setManErr]   = useState('')

  const pot     = players.length * WEEKLY_FEE + state.rollover
  const bNum    = Math.floor(state.weekIndex / BLOCK_WEEKS) + 1
  const wInBlk  = (state.weekIndex % BLOCK_WEEKS) + 1
  const winner  = state.winNum ? players.find(p => p.number === state.winNum) : null

  async function doFetch() {
    setStatus('busy'); setMsg('Fetching from lottery site…'); setFetched(null)
    try {
      const r    = await fetch('/api/fetch-result', { method: 'POST' })
      const data = await r.json()
      if (!data.ok) { setStatus('error'); setMsg(data.error); return }
      if (data.result.drawDate === state.lastDrawDate) {
        setStatus('dupe'); setMsg(`Draw ${data.result.drawDate} already applied.`); return
      }
      setFetched(data.result)
      setStatus('ok')
      setMsg(`Wednesday ${data.result.drawDate} — Bonus Ball #${data.result.bonusBall}`)
    } catch (e) {
      setStatus('error'); setMsg('Could not reach the server. Check your connection.')
    }
  }

  function apply(bonusBall, drawDate) {
    const w = players.find(p => p.number === bonusBall)
    setState(s => ({
      ...s,
      winNum: bonusBall, resolved: true,
      rollover: w ? 0 : pot,
      lastDrawDate: drawDate,
      history: [{ week: s.weekIndex + 1, date: new Date().toLocaleDateString('en-IE'), drawDate, bonusBall, winner: w?.name || null, pot, rollover: !w }, ...s.history],
    }))
    setStatus('idle'); setFetched(null); setMsg('')
  }

  function applyManual() {
    setManErr('')
    const n = parseInt(manual, 10)
    if (isNaN(n) || n < 1 || n > 47) return setManErr('Please enter a number between 1 and 47.')
    apply(n, new Date().toLocaleDateString('en-IE'))
    setManual('')
  }

  function nextWeek() {
    setState(s => ({ ...s, resolved: false, winNum: null, weekIndex: s.weekIndex + 1, rollover: winner ? 0 : pot }))
    setStatus('idle'); setFetched(null); setMsg('')
  }

  const dotCol = { idle: C.muted, busy: C.orange, ok: C.teal, error: C.pink, dupe: C.muted }[status]

  return (
    <div style={{ minHeight: '100vh', background: C.bg, paddingBottom: '60px' }}>
      <div style={{ height: '4px', background: `linear-gradient(90deg,${C.blue},${C.pink},${C.orange},${C.teal})` }}/>
      <div style={{ background: C.surface, padding: '16px', borderBottom: `1px solid ${C.border}`, boxShadow: '0 1px 6px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Crest/>
        <div>
          <div style={{ fontSize: '10px', color: C.muted, letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600 }}>CET Staff Syndicate</div>
          <div style={{ fontSize: '17px', fontFamily: "'DM Serif Display',serif", color: C.text }}>Admin — Draw Management</div>
        </div>
        <a href="/" style={{ marginLeft: 'auto', fontSize: '12px', color: C.blue, textDecoration: 'none', fontWeight: 600 }}>← Back</a>
      </div>

      <div style={{ padding: '14px' }}>

        {/* Status */}
        <div style={card()}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: C.muted, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '10px' }}>Current Week</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {label(C.blue,   `Block ${bNum}`)}
            {label(C.teal,   `Week ${wInBlk} of ${BLOCK_WEEKS}`)}
            {label(C.orange, `Pot €${pot.toFixed(2)}`)}
            {label(state.resolved ? C.teal : C.pink, state.resolved ? '✓ Resolved' : '● Awaiting result')}
          </div>
        </div>

        {!state.resolved ? (
          <>
            {/* Auto fetch */}
            <div style={card({ border: `1px solid ${C.blue}28` })}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: C.blue, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>Fetch from Lottery Site</div>
              <div style={{ fontSize: '12px', color: C.muted, marginBottom: '2px' }}>Pulls the latest Wednesday result automatically.</div>
              {btn(C.blue, status === 'busy' ? '⏳  Fetching…' : '↻  Fetch Latest Result', doFetch, status === 'busy')}

              {msg && (
                <div style={{ marginTop: '10px', padding: '10px 14px', borderRadius: '9px', background: `${dotCol}10`, border: `1px solid ${dotCol}30`, display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: dotCol, marginTop: '3px', flexShrink: 0 }}/>
                  <div style={{ fontSize: '13px', color: C.text, lineHeight: 1.5 }}>{msg}</div>
                </div>
              )}

              {status === 'ok' && fetched && btn(C.teal, `✓  Apply Bonus Ball #${fetched.bonusBall}`, () => apply(fetched.bonusBall, fetched.drawDate))}
            </div>

            {/* Manual entry */}
            <div style={card()}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: C.muted, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '6px' }}>Manual Entry</div>
              <div style={{ fontSize: '12px', color: C.muted, marginBottom: '10px' }}>Use this if the fetch didn't work.</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="number" min="1" max="47" placeholder="Bonus ball 1–47"
                  value={manual} onChange={e => setManual(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && applyManual()}
                  style={{ flex: 1, padding: '11px 14px', borderRadius: '9px', background: C.surfaceAlt, border: `1px solid ${C.border}`, color: C.text, fontSize: '14px', outline: 'none' }}
                />
                <button onClick={applyManual} style={{ padding: '11px 20px', borderRadius: '9px', background: C.surfaceAlt, border: `1.5px solid ${C.orange}`, color: C.orange, fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
                  Apply
                </button>
              </div>
              {manErr && <div style={{ color: C.pink, fontSize: '12px', marginTop: '6px' }}>{manErr}</div>}
            </div>
          </>
        ) : (
          /* Resolved */
          <div style={card({ border: `1px solid ${C.teal}40`, background: `${C.teal}06` })}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: C.teal, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '10px' }}>Week Resolved ✓</div>
            <div style={{ fontSize: '15px', color: C.text, lineHeight: 1.7, marginBottom: '14px' }}>
              Bonus Ball <strong style={{ color: C.orange }}>#{state.winNum}</strong>
              {winner
                ? <> — 🏆 <strong>{winner.name}</strong> wins <strong style={{ color: C.orange }}>€{pot.toFixed(2)}</strong>!</>
                : <> — No winner. <strong style={{ color: C.orange }}>€{pot.toFixed(2)}</strong> rolls over.</>
              }
            </div>
            {btn(C.blue, `▶  Start Week ${state.weekIndex + 2}`, nextWeek)}
          </div>
        )}

        {/* History */}
        {state.history.length > 0 && (
          <div style={card()}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: C.muted, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '10px' }}>Recent Results</div>
            {state.history.slice(0, 6).map((h, i) => {
              const ac = h.rollover ? C.teal : C.orange
              return (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: i < Math.min(state.history.length, 6) - 1 ? `1px solid ${C.border}` : 'none' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: C.text }}>{h.rollover ? 'Rollover' : '🏆 ' + h.winner}</div>
                    <div style={{ fontSize: '11px', color: C.muted }}>Week {h.week} · Ball #{h.bonusBall} · {h.date}</div>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: ac }}>€{h.pot.toFixed(2)}</div>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Public app
// ─────────────────────────────────────────────
export default function App() {
  const [state, setState]       = useState(() => load() || BLANK)
  const [tab, setTab]           = useState('numbers')
  const [players, setPlayers]   = useState([])
  const [roster, setRoster]     = useState('loading')  // loading|ok|error
  const [showResult, setShowResult] = useState(inResultWindow)

  useEffect(() => save(state), [state])

  // Update result window flag every minute
  useEffect(() => {
    const id = setInterval(() => setShowResult(inResultWindow()), 60000)
    return () => clearInterval(id)
  }, [])

  // Load roster from Google Sheets
  useEffect(() => {
    fetch('/api/roster')
      .then(r => r.json())
      .then(d => { if (d.ok) { setPlayers(d.participants); setRoster('ok') } else setRoster('error') })
      .catch(() => setRoster('error'))
  }, [])

  // Auto-apply result from Netlify Blobs (set by scheduled function)
  // Polls every 5 minutes on Wed evenings. Applies for ALL users automatically.
  useEffect(() => {
    async function checkForResult() {
      // Only bother checking Wed evening through Saturday
      if (!inResultWindow()) return
      // Don't overwrite an already-resolved week
      if (state.resolved) return
      // Wait until roster is loaded so pot calculation is correct
      if (players.length === 0) return
      try {
        const r    = await fetch('/api/latest-result')
        const data = await r.json()
        if (!data.ok) return
        const { bonusBall, drawDate } = data.result
        // Don't apply if we've already applied this draw
        if (drawDate === state.lastDrawDate) return
        // Calculate pot now that players are loaded
        const currentPot = players.length * WEEKLY_FEE + state.rollover
        const winner     = players.find(p => p.number === bonusBall)
        setState(s => ({
          ...s,
          winNum: bonusBall,
          resolved: true,
          rollover: winner ? 0 : currentPot,
          lastDrawDate: drawDate,
          history: [{
            week: s.weekIndex + 1,
            date: new Date().toLocaleDateString('en-IE'),
            drawDate, bonusBall,
            winner: winner?.name || null,
            pot: currentPot,
            rollover: !winner,
          }, ...s.history],
        }))
      } catch { /* silently ignore — try again next poll */ }
    }
    checkForResult()
    const id = setInterval(checkForResult, 5 * 60 * 1000) // every 5 mins
    return () => clearInterval(id)
  }, [state.resolved, state.lastDrawDate, players])

  const { history: hist, rollover, weekIndex: wi, resolved, winNum } = state
  const pot      = players.length * WEEKLY_FEE + rollover
  const bNum     = Math.floor(wi / BLOCK_WEEKS) + 1
  const wInBlk   = (wi % BLOCK_WEEKS) + 1
  const winner   = winNum ? players.find(p => p.number === winNum) : null
  const isAdmin  = window.location.pathname === '/admin'

  if (isAdmin) return <AdminPage state={state} setState={setState} players={players} />

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, paddingBottom: '60px' }}>

      {/* Top stripe */}
      <div style={{ height: '4px', background: `linear-gradient(90deg,${C.blue},${C.pink},${C.orange},${C.teal})` }}/>

      {/* Header */}
      <div style={{ background: C.surface, padding: '20px 16px 16px', borderBottom: `1px solid ${C.border}`, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
          <Crest/>
          <div>
            <div style={{ fontSize: '10px', color: C.muted, letterSpacing: '2.5px', textTransform: 'uppercase', fontWeight: 600 }}>Castlebar Educate Together NS</div>
            <div style={{ fontSize: '19px', fontFamily: "'DM Serif Display',serif", color: C.text, lineHeight: 1.2 }}>Staff Bonus Ball Syndicate</div>
          </div>
        </div>

        {/* Hero — result Wed–Sat, countdown otherwise */}
        {resolved && showResult ? (
          <div style={{ borderRadius: '14px', padding: '18px 16px', textAlign: 'center', background: winner ? `${C.orange}0a` : `${C.teal}0a`, border: `2px solid ${winner ? C.orange : C.teal}50` }}>
            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: winner ? C.orange : C.teal, marginBottom: '8px' }}>
              {winner ? "🎉 This Week's Winner" : '🔄 Rollover'}
            </div>
            {winner ? (
              <>
                <div style={{ fontSize: '26px', fontFamily: "'DM Serif Display',serif", color: C.text }}>{winner.name}</div>
                <div style={{ fontSize: '30px', fontFamily: "'DM Serif Display',serif", color: C.orange, marginTop: '2px' }}>€{pot.toFixed(2)}</div>
                <div style={{ fontSize: '13px', color: C.muted, marginTop: '6px' }}>Bonus Ball <strong style={{ color: C.orange }}>#{winNum}</strong></div>
              </>
            ) : (
              <>
                <div style={{ fontSize: '20px', fontFamily: "'DM Serif Display',serif", color: C.text }}>No winner this week</div>
                <div style={{ fontSize: '13px', color: C.muted, marginTop: '6px' }}>Ball <strong style={{ color: C.teal }}>#{winNum}</strong> wasn't picked — pot grows to <strong style={{ color: C.orange }}>€{rollover.toFixed(2)}</strong></div>
              </>
            )}
          </div>
        ) : (
          <Countdown/>
        )}

        {/* Pot info */}
        <div style={{ marginTop: '14px', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: C.surface, border: `2px solid ${C.orange}`, borderRadius: '14px', padding: '10px 24px', boxShadow: `0 4px 16px ${C.orange}18` }}>
            <div style={{ fontSize: '10px', color: C.muted, letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600 }}>
              {rollover > 0 && !resolved ? 'Rollover Jackpot' : resolved ? (winner ? 'Won This Week' : 'Rolled Over') : "This Week's Pot"}
            </div>
            <div style={{ fontSize: '28px', fontFamily: "'DM Serif Display',serif", color: C.orange }}>
              {rollover > 0 && !resolved ? '🔄 ' : ''}€{pot.toFixed(2)}
            </div>
            <div style={{ fontSize: '11px', color: C.muted }}>Block {bNum} · Week {wInBlk} of {BLOCK_WEEKS} · €{BLOCK_FEE}/block</div>
          </div>
        </div>

        {/* Player pills */}
        {roster === 'ok' && (
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '10px', flexWrap: 'wrap' }}>
            {label(C.blue, `${players.length} players`)}
            {label(C.teal, `${TOTAL - players.length} numbers free`)}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', margin: '14px 14px 0', background: C.surface, borderRadius: '12px', padding: '3px', border: `1px solid ${C.border}`, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        {[['numbers','Numbers',C.blue],['history','History',C.teal]].map(([t,l,col]) => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '10px 4px', borderRadius: '9px', background: tab===t ? `${col}14` : 'transparent', border: tab===t ? `1.5px solid ${col}` : '1.5px solid transparent', color: tab===t ? col : C.muted, fontWeight: tab===t ? 700 : 500, fontSize: '13px', cursor: 'pointer', transition: 'all 0.15s' }}>
            {l}
          </button>
        ))}
      </div>

      <div style={{ padding: '12px 14px' }}>

        {/* ── Numbers tab ── */}
        {tab === 'numbers' && (
          <>
            {roster === 'loading' && (
              <div style={card({ textAlign: 'center', padding: '30px', color: C.muted })}>Loading roster…</div>
            )}
            {roster === 'error' && (
              <div style={card({ border: `1px solid ${C.pink}40`, textAlign: 'center', padding: '24px' })}>
                <div style={{ color: C.pink, fontWeight: 700, marginBottom: '6px' }}>Couldn't load roster</div>
                <div style={{ fontSize: '13px', color: C.muted }}>Check the Google Sheet is published and GOOGLE_SHEET_CSV_URL is set in Netlify.</div>
              </div>
            )}
            {roster === 'ok' && (
              <>
                {/* Ball board */}
                <div style={card()}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: C.blue, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' }}>Number Board</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', paddingBottom: '10px' }}>
                    {Array.from({ length: TOTAL }, (_, i) => i + 1).map(n => (
                      <Ball key={n} n={n} owner={players.find(p => p.number === n)} isWinner={winNum === n}/>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', marginTop: '8px', flexWrap: 'wrap' }}>
                    {[[C.blue,'Taken'],['#D0DAE4','Available'],[C.orange,'Winner']].map(([col,lbl]) => (
                      <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: C.muted }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: col, border: `1px solid ${C.border}` }}/>{lbl}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Player list */}
                <div style={card()}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: C.blue, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' }}>Players</div>
                  {[...players].sort((a,b) => a.number - b.number).map((p, i) => {
                    const col = COLS[i % 4]
                    const isW = p.number === winNum
                    return (
                      <div key={p.number} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', marginBottom: '7px', background: isW ? `${C.orange}0d` : C.surfaceAlt, border: isW ? `1px solid ${C.orange}55` : `1px solid ${C.border}`, borderRadius: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: `${col}14`, border: `2px solid ${col}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: col, fontFamily: "'DM Serif Display',serif" }}>
                            {p.number}
                          </div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: isW ? C.orange : C.text }}>
                            {p.name} {isW ? '🏆' : ''}
                          </div>
                        </div>
                        <div style={{ fontSize: '11px', color: C.muted }}>Ball #{p.number}</div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </>
        )}

        {/* ── History tab ── */}
        {tab === 'history' && (
          hist.length === 0 ? (
            <div style={{ ...card(), textAlign: 'center', color: C.muted, padding: '40px 20px' }}>
              <div style={{ fontSize: '30px', marginBottom: '10px' }}>📋</div>
              Results will appear here after each draw.
            </div>
          ) : hist.map((h, i) => {
            const ac = h.rollover ? C.teal : C.orange
            return (
              <div key={i} style={{ ...card({ background: `${ac}07`, border: `1px solid ${ac}35` }), padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '10px', color: C.muted, letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600 }}>Week {h.week} · {h.date}</div>
                    <div style={{ fontSize: '17px', fontFamily: "'DM Serif Display',serif", color: h.rollover ? C.teal : C.text, marginTop: '3px' }}>
                      {h.rollover ? 'Rollover' : '🏆 ' + h.winner}
                    </div>
                    <div style={{ fontSize: '12px', color: C.muted, marginTop: '2px' }}>
                      Bonus Ball <span style={{ color: ac, fontWeight: 700 }}>#{h.bonusBall}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '20px', fontFamily: "'DM Serif Display',serif", color: ac }}>€{h.pot.toFixed(2)}</div>
                    <span style={{ display: 'inline-block', fontSize: '10px', padding: '2px 8px', borderRadius: '20px', marginTop: '3px', background: `${ac}14`, color: ac, border: `1px solid ${ac}45`, letterSpacing: '1px', fontWeight: 700 }}>
                      {h.rollover ? 'ROLLOVER' : 'WON'}
                    </span>
                  </div>
                </div>
              </div>
            )
          })
        )}

      </div>
    </div>
  )
}
